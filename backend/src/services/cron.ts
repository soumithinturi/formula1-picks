import cron from "node-cron";
import { db } from "../db/index.ts";
import type { RaceRow } from "../types/index.ts";

const JOLPI_API_BASE = "https://api.jolpi.ca/ergast/f1/2026";

/**
 * Start all recurring cron jobs.
 * This should be called from index.ts when the server boots.
 */
export function startCronJobs() {
  console.log("⏰ Initializing CRON jobs...");

  // Run every Saturday at 14:00 (2:00 PM) UTC as a solid baseline for Post-Qualifying
  // Adjust based on your preferred polling timezone.
  cron.schedule("0 14 * * 6", async () => {
    console.log("⏰ Running Saturday Cron: Fetching Qualifying / Sprint Results");
    await fetchQualifyingResults();
  });

  // Run every Sunday at 18:00 (6:00 PM) UTC as a solid baseline for Post-Race
  // Adjust based on your preferred polling timezone.
  cron.schedule("0 18 * * 0", async () => {
    console.log("⏰ Running Sunday Cron: Fetching Race Results");
    await fetchRaceResults();
  });
}

/**
 * Fetches Qualifying (and Sprint, if applicable) results for the *most recent* past deadline.
 */
async function fetchQualifyingResults() {
  try {
    // Find a race where the sprint/quali deadline just passed (recently) but status is still UPCOMING
    const nearbyRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND date <= (NOW() + interval '3 days')
      ORDER BY date ASC LIMIT 1
    `;

    if (nearbyRaces.length === 0) {
      console.log("No upcoming races this weekend to fetch results for.");
      return;
    }

    const nextRace = nearbyRaces[0];
    const round = nextRace.id; // ergast round matches our race ID generally based on seed

    // Let's test the endpoint format
    console.log(`Fetching Qualifying results for Round ${round}...`);
    const res = await fetch(`${JOLPI_API_BASE}/${round}/qualifying.json`);

    if (res.ok) {
      const data: any = await res.json();
      const qualis = data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults;
      if (qualis && qualis.length > 0) {
        console.log(`✅ Fetched Qualifying Pole: ${qualis[0].Driver.familyName}`);
        // TODO: Save to results table and trigger score recals
      } else {
        console.log("⚠️ No qualifying data available yet on Ergast.");
      }
    }

    if (nextRace.has_sprint) {
      console.log(`Fetching Sprint results for Round ${round}...`);
      const sprintRes = await fetch(`${JOLPI_API_BASE}/${round}/sprint.json`);

      if (sprintRes.ok) {
        const data: any = await sprintRes.json();
        const sprints = data?.MRData?.RaceTable?.Races?.[0]?.SprintResults;
        if (sprints && sprints.length > 0) {
          console.log(`✅ Fetched Sprint Winner: ${sprints[0].Driver.familyName}`);
          // TODO: Save to results table and trigger score recals
        } else {
          console.log("⚠️ No sprint data available yet on Ergast.");
        }
      }
    }

  } catch (err) {
    console.error("Failed executing Saturday cron:", err);
  }
}

/**
 * Fetches Sunday Race Results
 */
async function fetchRaceResults() {
  try {
    const nearbyRaces = await db<RaceRow[]>`
      SELECT * FROM races 
      WHERE status = 'UPCOMING'
      AND date <= (NOW() + interval '3 days')
      ORDER BY date ASC LIMIT 1
    `;

    if (nearbyRaces.length === 0) {
      console.log("No upcoming races this weekend to fetch results for.");
      return;
    }

    const nextRace = nearbyRaces[0];
    const round = nextRace.id;

    console.log(`Fetching Race results for Round ${round}...`);
    const res = await fetch(`${JOLPI_API_BASE}/${round}/results.json`);

    if (res.ok) {
      const data: any = await res.json();
      const results = data?.MRData?.RaceTable?.Races?.[0]?.Results;

      if (results && results.length > 0) {
        console.log(`✅ Fetched Race Winner: ${results[0].Driver.familyName}`);

        // TODO: Update race status to 'COMPLETED'
        // TODO: Update results mapping (P1, P2, P3, DNF, Fastest Lap)
        // TODO: Calculate user scores

      } else {
        console.log("⚠️ No race data available yet on Ergast.");
      }
    }
  } catch (err) {
    console.error("Failed executing Sunday cron:", err);
  }
}
