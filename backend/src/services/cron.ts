import cron from "node-cron";
import { db } from "../db/index.ts";
import type { RaceRow, PickRow, LeagueRow, ScoringConfig, PickSelections } from "../types/index.ts";
import { calculatePoints } from "./scoring.ts";
import { createNotificationsForAllPicksInRace } from "./notifications.ts";
import { sendPushNotification } from "./pushService.ts";

const JOLPI_API_BASE = "https://api.jolpi.ca/ergast/f1/2026";

/**
 * Start all recurring cron jobs.
 * This should be called from index.ts when the server boots.
 */
export function startCronJobs() {
  console.log("⏰ Initializing CRON jobs...");

  // Run every Saturday at 14:00 (2:00 PM) UTC for Qualifying / Sprint
  cron.schedule("0 14 * * 6", async () => {
    console.log("⏰ Running Saturday Cron: Fetching Qualifying / Sprint Results");
    await fetchQualifyingResults();
  });

  // Run every Sunday at 11:00 PM CDT (04:00 Monday UTC)
  // This ensure results are final (fia classification locks) before scoring.
  cron.schedule("0 4 * * 1", async () => {
    console.log("⏰ Running Sunday Cron: Scoring Race Results");
    await fetchRaceResults();
  });

  // Run every Monday at midnight UTC to fetch the races in the current season and update the schedule
  cron.schedule("0 0 * * 1", async () => {
    console.log("⏰ Running Monday Cron: Fetching and Updating Season Schedule");
    await fetchAndUpdateSchedule();
  });

  // Run every minute to check for upcoming sessions and trigger PWA notifications
  cron.schedule("* * * * *", async () => {
    await checkUpcomingSessionsForNotifications();
  });
}

/**
 * Checks upcoming sessions and users' notification cadences to send push notifications.
 */
async function checkUpcomingSessionsForNotifications() {
  try {
    const upcomingRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND date <= (NOW() + interval '7 days')
      ORDER BY date ASC LIMIT 1
    `;

    if (upcomingRaces.length === 0) return;
    const race = upcomingRaces[0];

    // Array of sessions we track
    const sessions = [
      { name: "Sprint Quali", time: race.sprint_quali_date, column: "notify_sprint_quali_cadence" },
      { name: "Sprint", time: race.sprint_date, column: "notify_sprint_cadence" },
      { name: "Race Quali", time: race.race_quali_date, column: "notify_race_quali_cadence" },
      { name: "Race", time: race.race_deadline, column: "notify_race_cadence" }
    ];

    const nowMs = Date.now();

    for (const session of sessions) {
      if (!session.time) continue;

      const sessionTimeMs = new Date(session.time).getTime();
      const diffMinutes = Math.floor((sessionTimeMs - nowMs) / 60000);

      // We only care if it's within a timeframe users might have set
      if (diffMinutes < 0 || diffMinutes > 24 * 60) continue;

      // Find users whose notification cadence matches this exact minute (with a small buffer in case of cron delay)
      // Since this runs every minute, we check if diffMinutes matches their cadence.
      
      const subscriptions = await db`
        SELECT ups.endpoint, ups.p256dh, ups.auth, ups.id, uns.${db(session.column)} as cadence
        FROM user_notification_settings uns
        JOIN user_push_subscriptions ups ON uns.user_id = ups.user_id
        WHERE uns.${db(session.column)} IS NOT NULL
          AND uns.${db(session.column)} = ${diffMinutes}
      `;

      if (subscriptions.length > 0) {
        console.log(`Sending ${subscriptions.length} notifications for ${session.name} starting in ${diffMinutes}m`);
        const payload = {
          title: "Session Starting Soon!",
          body: `${race.name} ${session.name} begins in ${diffMinutes} minutes. Lock in your picks now!`,
          url: "/"
        };

        const promises = subscriptions.map((sub: any) => 
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          ).catch(async (err) => {
            if (err?.statusCode === 410) {
              await db`DELETE FROM user_push_subscriptions WHERE id = ${sub.id}`;
            }
          })
        );
        await Promise.all(promises);
      }
    }
  } catch (err) {
    console.error("Failed notification cron:", err);
  }
}

/**
 * Fetches Qualifying (and Sprint) results.
 */
export async function fetchQualifyingResults() {
  try {
    const nearbyRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND date <= (NOW() + interval '2 days')
      ORDER BY date ASC LIMIT 1
    `;

    if (nearbyRaces.length === 0) return;
    const race = nearbyRaces[0];
    const round = race.id.toString();

    // 1. Qualifying
    const qualRes = await fetch(`${JOLPI_API_BASE}/qualifying.json`);
    if (qualRes.ok) {
      const data: any = await qualRes.json();
      const targetRace = data?.MRData?.RaceTable?.Races?.find((r: any) => r.round === round);
      const results = targetRace?.QualifyingResults;
      if (results?.length > 0) {
        console.log(`✅ Automated: Found Quali results for ${race.name}`);
        await db`
          INSERT INTO race_results (race_id, race_qualifying_p1)
          VALUES (${race.id}, ${results[0].Driver.driverId})
          ON CONFLICT (race_id) DO UPDATE SET
            race_qualifying_p1 = EXCLUDED.race_qualifying_p1
        `;
      }
    }

    // 2. Sprint
    if (race.has_sprint) {
      const sprintRes = await fetch(`${JOLPI_API_BASE}/sprint.json`);
      if (sprintRes.ok) {
        const data: any = await sprintRes.json();
        const targetRace = data?.MRData?.RaceTable?.Races?.find((r: any) => r.round === round);
        const results = targetRace?.SprintResults;
        if (results?.length > 0) {
          console.log(`✅ Automated: Found Sprint results for ${race.name}`);

          // Find fastest lap in sprint if available
          let fastestLap = null;
          // Note: Ergast sprint data format for fastest lap can vary, checking rank 1
          const flResult = results.find((r: any) => r.FastestLap?.rank === "1");
          if (flResult) fastestLap = flResult.Driver.driverId;

          await db`
            INSERT INTO race_results (race_id, sprint_qualifying_p1, sprint_p1, sprint_p2, sprint_p3, sprint_fastest_lap)
            VALUES (
              ${race.id}, 
              ${results[0].Driver.driverId}, -- Placeholder for sprint pole if not distinct
              ${results[0].Driver.driverId},
              ${results[1]?.Driver.driverId || null},
              ${results[2]?.Driver.driverId || null},
              ${fastestLap}
            )
            ON CONFLICT (race_id) DO UPDATE SET
              sprint_p1 = EXCLUDED.sprint_p1,
              sprint_p2 = EXCLUDED.sprint_p2,
              sprint_p3 = EXCLUDED.sprint_p3,
              sprint_fastest_lap = EXCLUDED.sprint_fastest_lap,
              sprint_qualifying_p1 = EXCLUDED.sprint_qualifying_p1
          `;
        }
      }
    }
  } catch (err) {
    console.error("Failed Saturday cron:", err);
  }
}

/**
 * Fetches Sunday Race Results and triggers scoring
 */
export async function fetchRaceResults() {
  try {
    const nearbyRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND date <= (NOW() + interval '2 days')
      ORDER BY date ASC LIMIT 1
    `;

    if (nearbyRaces.length === 0) return;
    const race = nearbyRaces[0];
    const round = race.id.toString();

    console.log(`Fetching Race results for Round ${round}...`);
    const res = await fetch(`${JOLPI_API_BASE}/results.json`);
    if (!res.ok) return;

    const data: any = await res.json();
    const targetRaceData = data?.MRData?.RaceTable?.Races?.find((r: any) => r.round === round);
    const resultsData = targetRaceData?.Results;

    if (!resultsData || resultsData.length === 0) {
      console.log(`⚠️ No official results for ${race.name} yet.`);
      return;
    }

    // Determine First DNF
    // Drivers who retired (status not Finished, +N Laps, Disqualified, DNS)
    const retired = resultsData.filter((r: any) => {
      const status = r.status.toLowerCase();
      return !status.includes("finished") &&
        !status.includes("laps") &&
        !status.includes("disqualified") &&
        !status.includes("not start");
    });

    let firstDnf = null;
    if (retired.length > 0) {
      // Find driver who finished the fewest laps
      const sortedByLaps = retired.sort((a: any, b: any) => parseInt(a.laps) - parseInt(b.laps));
      firstDnf = sortedByLaps[0].Driver.driverId;
      console.log(`🏁 First DNF identified: ${firstDnf} (${sortedByLaps[0].laps} laps)`);
    }

    // Find Fastest Lap
    const flResult = resultsData.find((r: any) => r.FastestLap?.rank === "1");
    const fastestLap = flResult?.Driver?.driverId || null;

    const officialResults: PickSelections = {
      sprintQualifyingP1: null, // Fetched in Quali cron or mapped if needed
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
        ${race.id}, ${officialResults.raceP1}, ${officialResults.raceP2}, ${officialResults.raceP3}, ${fastestLap}, ${firstDnf}
      )
      ON CONFLICT (race_id) DO UPDATE SET
        race_p1 = EXCLUDED.race_p1,
        race_p2 = EXCLUDED.race_p2,
        race_p3 = EXCLUDED.race_p3,
        fastest_lap = EXCLUDED.fastest_lap,
        first_dnf = EXCLUDED.first_dnf
    `;

    // 2. Score All Picks
    const picks = await db<PickRow[]>`SELECT * FROM picks WHERE race_id = ${race.id}`;
    const leagues = await db<LeagueRow[]>`SELECT id, scoring_config FROM leagues`;
    const leagueMap = new Map<string, ScoringConfig>(
      leagues.map(l => [l.id, typeof l.scoring_config === 'string' ? JSON.parse(l.scoring_config) : l.scoring_config])
    );

    // Fetch full existing results for complete scoring (merging Quali/Sprint data we saved earlier)
    const [savedResults] = await db<any[]>`SELECT * FROM race_results WHERE race_id = ${race.id}`;
    const fullOfficial: PickSelections = {
      ...officialResults,
      sprintQualifyingP1: savedResults?.sprint_qualifying_p1,
      sprintP1: savedResults?.sprint_p1,
      sprintP2: savedResults?.sprint_p2,
      sprintP3: savedResults?.sprint_p3,
      sprintFastestLap: savedResults?.sprint_fastest_lap,
      raceQualifyingP1: savedResults?.race_qualifying_p1,
    };

    await Promise.all(picks.map(pick => {
      const config = leagueMap.get(pick.league_id);
      const userPick: PickSelections = {
        sprintQualifyingP1: pick.sprint_qualifying_p1,
        sprintP1: pick.sprint_p1,
        sprintP2: pick.sprint_p2,
        sprintP3: pick.sprint_p3,
        sprintFastestLap: pick.sprint_fastest_lap,
        raceQualifyingP1: pick.race_qualifying_p1,
        raceP1: pick.race_p1,
        raceP2: pick.race_p2,
        raceP3: pick.race_p3,
        fastestLap: pick.fastest_lap,
        firstDnf: pick.first_dnf,
      };
      const points = calculatePoints(userPick, fullOfficial, config);
      return db`
        UPDATE picks SET 
          total_points = ${points.score},
          correct_predictions = ${points.correct},
          total_predictions = ${points.total}
        WHERE id = ${pick.id}
      `;
    }));

    // 3. Mark Race COMPLETED (App focus moves to next UPCOMING race)
    await db`UPDATE races SET status = 'COMPLETED' WHERE id = ${race.id}`;

    // 4. Notifications
    await createNotificationsForAllPicksInRace(
      race.id,
      "RESULTS_IN",
      `${race.name} — Results In! 🏁`,
      "Automated scoring complete. Check your league leaderboards now!",
      { raceId: race.id }
    );

    console.log(`✅ Automated: Successfully processed results and scoring for ${race.name}`);

  } catch (err) {
    console.error("Failed Sunday cron:", err);
  }
}

/**
 * Fetches the current season's race schedule and updates the database.
 */
export async function fetchAndUpdateSchedule() {
  try {
    console.log("Fetching latest season schedule from Ergast API...");
    const res = await fetch(`${JOLPI_API_BASE}/races.json`);
    if (!res.ok) {
      console.error(`Ergast API failed with status ${res.status}`);
      return;
    }

    const data: any = await res.json();
    const races = data?.MRData?.RaceTable?.Races;

    if (!races || races.length === 0) {
      console.log("⚠️ No races found in schedule payload.");
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

      const sprint_deadline = sprint_quali_date;
      const race_deadline = race_quali_date;

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

    console.log("✅ Successfully updated season schedule.");
  } catch (err) {
    console.error("Failed to update season schedule:", err);
  }
}
