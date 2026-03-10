import cron from "node-cron";
import { db } from "../db/index.ts";
import type { RaceRow, PickRow, LeagueRow, ScoringConfig, PickSelections } from "../types/index.ts";
import { calculatePoints } from "./scoring.ts";
import { createNotificationsForAllPicksInRace } from "./notifications.ts";

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
