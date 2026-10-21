import type { Sql } from "../db/index.ts";
import { logger } from "./logger.ts";
import type { RaceRow, PickSelections } from "../types/index.ts";
import { scoreRacePicks, completeRace, rowToSelections } from "./results.ts";
import { sendPushNotification } from "./pushService.ts";

const JOLPI_API_BASE = "https://api.jolpi.ca/ergast/f1/2026";

/**
 * Driver who retired on the fewest laps, or null if everyone was classified.
 * Jolpica statuses: "Finished", "+1 Lap", "+2 Laps" (classified); anything else is a retirement.
 */
export function findFirstDnf(results: { status: string; laps: string; Driver: { driverId: string } }[]): string | null {
  const retired = results.filter(
    (r) => !/^(finished|\+\d+ laps?|disqualified|did not start)$/i.test(r.status.trim())
  );
  retired.sort((a, b) => parseInt(a.laps) - parseInt(b.laps));
  return retired[0]?.Driver.driverId ?? null;
}



/**
 * Checks upcoming sessions and users' notification cadences to send push notifications.
 * Invoked via webhook (POST /api/v1/internal/cron/notifications) every 5 minutes; GitHub may run it late, so reminders fire once the time left drops to the chosen cadence.
 */
export async function checkUpcomingSessionsForNotifications(db: Sql) {
  try {
    const upcomingRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND date >= (NOW() - interval '2 days')
      AND date <= (NOW() + interval '7 days')
      ORDER BY date ASC
    `;

    if (upcomingRaces.length === 0) return;

    const nowMs = Date.now();

    for (const race of upcomingRaces) {
      // Array of sessions we track
      const sessions = [
        { name: "Sprint Quali", time: race.sprint_quali_date, column: "notify_sprint_quali_cadence" },
        { name: "Sprint", time: (race as any).sprint_date, column: "notify_sprint_cadence" },
        { name: "Race Quali", time: race.race_quali_date, column: "notify_race_quali_cadence" },
        { name: "Race", time: race.race_deadline, column: "notify_race_cadence" }
      ];

      for (const session of sessions) {
        if (!session.time) continue;

        const sessionTimeMs = new Date(session.time).getTime();
        const diffMinutes = Math.floor((sessionTimeMs - nowMs) / 60000);

        // Only within the window users can set. The 10 minutes after the start are a grace period
        // for "Start" (cadence 0) reminders, since the cron runs late.
        if (diffMinutes < -10 || diffMinutes > 24 * 60) continue;

        // NOTE: We validate the column name against an allowlist and use a raw
        // query string for the identifier, as tagged templates don't support
        // dynamic identifiers (columns/tables).
        const ALLOWED_CADENCE_COLUMNS = new Set([
          "notify_sprint_quali_cadence",
          "notify_sprint_cadence",
          "notify_race_quali_cadence",
          "notify_race_cadence",
        ]);
        if (!ALLOWED_CADENCE_COLUMNS.has(session.column)) {
          logger.warn({ job: "notifications", column: session.column }, "Invalid cadence column name, skipping.");
          continue;
        }

        // Claim every user whose reminder is due (cadence >= minutes left) and not yet notified for
        // this session. The primary key makes the claim safe if two cron runs overlap. The column
        // name is checked against the allowlist above; values stay parameters.
        const due = await db.unsafe(`
          INSERT INTO notification_sent (user_id, race_id, session)
          SELECT user_id, $2::int, $3::text
          FROM user_notification_settings
          WHERE ${session.column} IS NOT NULL AND ${session.column} >= $1
            AND ($1 >= 0 OR ${session.column} = 0)
          ON CONFLICT DO NOTHING
          RETURNING user_id
        `, [diffMinutes, race.id, session.name]);
        if (due.length === 0) continue;

        const subscriptions = await db`
          SELECT id, endpoint, p256dh, auth FROM user_push_subscriptions
          WHERE user_id IN ${db(due.map((d: any) => d.user_id))}
        `;

        logger.info({
          job: "notifications",
          session: session.name,
          count: subscriptions.length,
          minutes: diffMinutes
        }, `Sending ${subscriptions.length} notifications for ${session.name} starting in ${diffMinutes}m`);
        const payload = {
          title: "Session Starting Soon!",
          body: diffMinutes <= 0
            ? `${race.name} ${session.name} is starting now. Lock in your picks!`
            : `${race.name} ${session.name} begins in ${diffMinutes} minutes. Lock in your picks now!`,
          url: "/"
        };

        await Promise.all(subscriptions.map(async (sub: any) => {
          try {
            const ok = await sendPushNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
            if (!ok) await db`DELETE FROM user_push_subscriptions WHERE id = ${sub.id}`;
          } catch (err) {
            logger.warn({ err, job: "notifications", subId: sub.id }, "Push send failed");
          }
        }));
      }
    }
  } catch (err) {
    logger.error({ err, job: "notifications" }, "Failed notification cron");
    throw err;
  }
}

/**
 * Fetches Qualifying (and Sprint) results.
 */
export async function fetchQualifyingResults(db: Sql) {
  try {
    const nearbyRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND (
        (sprint_quali_date IS NOT NULL AND sprint_quali_date <= NOW()) OR
        (race_quali_date IS NOT NULL AND race_quali_date <= NOW())
      )
      ORDER BY date ASC
    `;

    if (nearbyRaces.length === 0) {
      logger.info({ job: "fetchQualifyingResults" }, "🔍 No upcoming races with completed qualifying sessions found.");
      return;
    }

    for (const race of nearbyRaces) {
      const round = race.id.toString();

      // 1. Qualifying — use round-specific endpoint to avoid pagination issues
      const qualRes = await fetch(`${JOLPI_API_BASE}/${round}/qualifying.json`);
      if (qualRes.ok) {
        const data: any = await qualRes.json();
        const targetRace = data?.MRData?.RaceTable?.Races?.[0];
        const results = targetRace?.QualifyingResults;
        if (results?.length > 0) {
          logger.info({ job: "fetchQualifyingResults", race: race.name }, `✅ Automated: Found Quali results for ${race.name}`);
          await db`
            INSERT INTO race_results (race_id, race_qualifying_p1)
            VALUES (${race.id}, ${results[0].Driver.driverId})
            ON CONFLICT (race_id) DO UPDATE SET
              race_qualifying_p1 = EXCLUDED.race_qualifying_p1
          `;
        }
      }

      // 2. Sprint Race — round-specific endpoint for same pagination reason.
      if (race.has_sprint) {
        const sprintRes = await fetch(`${JOLPI_API_BASE}/${round}/sprint.json`);
        if (sprintRes.ok) {
          const data: any = await sprintRes.json();
          const targetRace = data?.MRData?.RaceTable?.Races?.[0];
          const results = targetRace?.SprintResults;
          if (results?.length > 0) {
            logger.info({ job: "fetchQualifyingResults", race: race.name, sprint: true }, `✅ Automated: Found Sprint results for ${race.name}`);

            // Find fastest lap in sprint if available
            let fastestLap = null;
            const flResult = results.find((r: any) => r.FastestLap?.rank === "1");
            if (flResult) fastestLap = flResult.Driver.driverId;

            await db`
              INSERT INTO race_results (race_id, sprint_p1, sprint_p2, sprint_p3, sprint_fastest_lap)
              VALUES (
                ${race.id},
                ${results[0].Driver.driverId},
                ${results[1]?.Driver.driverId || null},
                ${results[2]?.Driver.driverId || null},
                ${fastestLap}
              )
              ON CONFLICT (race_id) DO UPDATE SET
                sprint_p1 = EXCLUDED.sprint_p1,
                sprint_p2 = EXCLUDED.sprint_p2,
                sprint_p3 = EXCLUDED.sprint_p3,
                sprint_fastest_lap = EXCLUDED.sprint_fastest_lap
            `;
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err, job: "fetchQualifyingResults" }, "Failed Saturday cron (Qualifying/Sprint Fetching)");
    throw err;
  }
}

/**
 * Fetches Sunday Race Results and triggers scoring
 */
export async function fetchRaceResults(db: Sql) {
  try {
    const nearbyRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND date <= NOW()
      ORDER BY date ASC
    `;

    if (nearbyRaces.length === 0) {
      logger.info({ job: "fetchRaceResults" }, "🔍 No recently finished races found for scoring.");
      return;
    }

    let failedRaces = 0;
    for (const race of nearbyRaces) {
      try {
        const round = race.id.toString();

        logger.info({ job: "fetchRaceResults", round }, `Fetching Race results for Round ${round}...`);
        const res = await fetch(`${JOLPI_API_BASE}/${round}/results.json`);
        if (!res.ok) continue;

        const data: any = await res.json();
        const targetRaceData = data?.MRData?.RaceTable?.Races?.[0];
        const resultsData = targetRaceData?.Results;

        if (!resultsData || resultsData.length === 0) {
          logger.info({ job: "fetchRaceResults", race: race.name }, `⚠️ No official results for ${race.name} yet.`);
          continue;
        }

        // Determine First DNF
        const firstDnf = findFirstDnf(resultsData);
        if (firstDnf) {
          logger.info({ job: "fetchRaceResults", driver: firstDnf }, `🏁 First DNF identified: ${firstDnf}`);
        }

        // Find Fastest Lap
        const flResult = resultsData.find((r: any) => r.FastestLap?.rank === "1");
        const fastestLap = flResult?.Driver?.driverId || null;

        const officialResults: PickSelections = {
          sprintQualifyingP1: null,
          sprintP1: null,
          sprintP2: null,
          sprintP3: null,
          sprintFastestLap: null,
          raceQualifyingP1: null,
          raceP1: resultsData[0].Driver.driverId,
          raceP2: resultsData[1]?.Driver.driverId || null,
          raceP3: resultsData[2]?.Driver.driverId || null,
          fastestLap,
          firstDnf,
        };

        // 1. Update race_results table
        await db`
          INSERT INTO race_results (
            race_id, race_p1, race_p2, race_p3, fastest_lap, first_dnf
          ) VALUES (
            ${race.id},
            ${officialResults.raceP1 ?? null},
            ${officialResults.raceP2 ?? null},
            ${officialResults.raceP3 ?? null},
            ${fastestLap ?? null},
            ${firstDnf ?? null}
          )
          ON CONFLICT (race_id) DO UPDATE SET
            race_p1 = EXCLUDED.race_p1,
            race_p2 = EXCLUDED.race_p2,
            race_p3 = EXCLUDED.race_p3,
            fastest_lap = EXCLUDED.fastest_lap,
            first_dnf = EXCLUDED.first_dnf
        `;

        // 2. Score all picks against the full saved row (includes quali/sprint saved earlier)
        const [saved] = await db`SELECT * FROM race_results WHERE race_id = ${race.id}`;
        await scoreRacePicks(db, race.id, rowToSelections(saved));

        // 3. Mark COMPLETED and notify once, even if two cron runs overlap
        await completeRace(
          db,
          race.id,
          `${race.name} — Results In! 🏁`,
          "Automated scoring complete. Check your league leaderboards now!"
        );

        logger.info({ job: "fetchRaceResults", race: race.name }, `✅ Automated: Successfully processed results and scoring for ${race.name}`);

        // 5. Update Driver Standings
        // Race is already scored; the daily standings cron retries if this fails.
        await fetchAndUpdateDriverStandings(db).catch(() => {});
      } catch (raceErr) {
        logger.error({ raceErr, raceId: race.id, raceName: race.name }, `Failed processing race results for ${race.name}`);
        failedRaces++;
      }
    }
    if (failedRaces > 0) throw new Error(`${failedRaces} race(s) failed processing`);
  } catch (err) {
    logger.error({ err, job: "fetchRaceResults" }, "Failed Sunday cron (Race Scoring)");
    throw err;
  }
}

/**
 * Fetches the current season's race schedule and updates the database.
 */
export async function fetchAndUpdateSchedule(db: Sql) {
  try {
    logger.info({ job: "fetchAndUpdateSchedule" }, "Fetching latest season schedule from Ergast API...");
    const res = await fetch(`${JOLPI_API_BASE}/races.json`);
    if (!res.ok) {
      throw new Error(`Ergast API failed with status ${res.status}`);
    }

    const data: any = await res.json();
    const races = data?.MRData?.RaceTable?.Races;

    if (!races || races.length === 0) {
      logger.warn({ job: "fetchAndUpdateSchedule" }, "⚠️ No races found in schedule payload.");
      return;
    }

    for (const r of races) {
      const raceId = parseInt(r.round);
      const name = r.raceName;
      const date = r.date + (r.time ? `T${r.time}` : "T00:00:00Z");
      const has_sprint = !!r.Sprint;

      const race_quali_date = r.Qualifying
        ? r.Qualifying.date + (r.Qualifying.time ? `T${r.Qualifying.time}` : "T00:00:00Z")
        : null;

      const sprint_date = r.Sprint
        ? r.Sprint.date + (r.Sprint.time ? `T${r.Sprint.time}` : "T00:00:00Z")
        : null;

      const sprint_quali_date = r.SprintQualifying
        ? r.SprintQualifying.date + (r.SprintQualifying.time ? `T${r.SprintQualifying.time}` : "T00:00:00Z")
        : null;

      const fp1_date = r.FirstPractice
        ? r.FirstPractice.date + (r.FirstPractice.time ? `T${r.FirstPractice.time}` : "T00:00:00Z")
        : null;

      const fp2_date = r.SecondPractice
        ? r.SecondPractice.date + (r.SecondPractice.time ? `T${r.SecondPractice.time}` : "T00:00:00Z")
        : null;

      const fp3_date = r.ThirdPractice
        ? r.ThirdPractice.date + (r.ThirdPractice.time ? `T${r.ThirdPractice.time}` : "T00:00:00Z")
        : null;

      // sprint_deadline = when the sprint RACE starts (locks sprint podium picks).
      // sprint_quali_date separately locks sprint pole position picks.
      const sprint_deadline = sprint_date;
      const race_deadline = date;

      await db`
        INSERT INTO races (
          id, name, date, has_sprint, status,
          sprint_deadline, race_deadline,
          sprint_date, sprint_quali_date, race_quali_date,
          fp1_date, fp2_date, fp3_date
        ) VALUES (
          ${raceId}, ${name}, ${date}, ${has_sprint}, 'UPCOMING',
          ${sprint_deadline}, ${race_deadline},
          ${sprint_date}, ${sprint_quali_date}, ${race_quali_date},
          ${fp1_date}, ${fp2_date}, ${fp3_date}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          date = EXCLUDED.date,
          has_sprint = EXCLUDED.has_sprint,
          -- preserve existing status if completed, otherwise update
          status = CASE WHEN races.status = 'COMPLETED' THEN 'COMPLETED' ELSE 'UPCOMING' END,
          sprint_deadline = EXCLUDED.sprint_deadline,
          race_deadline = EXCLUDED.race_deadline,
          sprint_date = EXCLUDED.sprint_date,
          sprint_quali_date = EXCLUDED.sprint_quali_date,
          race_quali_date = EXCLUDED.race_quali_date,
          fp1_date = EXCLUDED.fp1_date,
          fp2_date = EXCLUDED.fp2_date,
          fp3_date = EXCLUDED.fp3_date
      `;
    }

    // Clean up any extraneous races in case the payload shrunk (e.g., from 24 to 22 rounds)
    const maxRound = Math.max(...races.map((r: any) => parseInt(r.round)));
    await db`DELETE FROM races WHERE id > ${maxRound}`;

    logger.info({ job: "fetchAndUpdateSchedule", count: races.length }, `✅ Successfully updated season schedule.`);
  } catch (err) {
    logger.error({ err, job: "fetchAndUpdateSchedule" }, "Failed to update season schedule");
    throw err;
  }
}

/**
 * Fetches the current season's driver standings and updates the database.
 */
export async function fetchAndUpdateDriverStandings(db: Sql) {
  try {
    logger.info({ job: "fetchAndUpdateDriverStandings" }, "Fetching latest driver standings from Ergast API...");
    const res = await fetch(`${JOLPI_API_BASE}/driverstandings.json`);
    if (!res.ok) {
      throw new Error(`Ergast API failed with status ${res.status}`);
    }

    const data: any = await res.json();
    const standingsList = data?.MRData?.StandingsTable?.StandingsLists?.[0];
    if (!standingsList) {
      logger.warn({ job: "fetchAndUpdateDriverStandings" }, "⚠️ No standings lists found in payload.");
      return;
    }

    const driverStandings = standingsList.DriverStandings;
    if (!driverStandings || driverStandings.length === 0) {
      logger.warn({ job: "fetchAndUpdateDriverStandings" }, "⚠️ No driver standings found in payload.");
      return;
    }

    for (const standing of driverStandings) {
      const driverId = standing.Driver.driverId;
      const points = parseFloat(standing.points) || 0;
      const wins = parseInt(standing.wins) || 0;
      const rank = parseInt(standing.position) || 999;

      await db`
        UPDATE drivers 
        SET points = ${points}, wins = ${wins}, rank = ${rank}
        WHERE driver_id = ${driverId}
      `;
    }

    logger.info({ job: "fetchAndUpdateDriverStandings", count: driverStandings.length }, `✅ Successfully updated driver standings.`);
  } catch (err) {
    logger.error({ err, job: "fetchAndUpdateDriverStandings" }, "Failed to update driver standings");
    throw err;
  }
}
