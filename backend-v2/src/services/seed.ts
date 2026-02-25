import { db } from "../db/index.ts";

// RapidAPI / Jolpi Ergast
const JOLPI_API_BASE = "https://api.jolpi.ca/ergast/f1/2026";

interface ErgastRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: any;
  date: string; // e.g., "2026-03-01"
  time: string; // e.g., "13:00:00Z"
  FirstPractice?: object;
  SecondPractice?: object;
  ThirdPractice?: object;
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
}

interface ErgastDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

/**
 * Seeds the database with 2025 race schedule and driver list from static JSON.
 * Only runs if the respective tables are empty — safe to call on every startup.
 */
export async function seedDatabase(): Promise<void> {
  try {
    await seedRaces();
    await seedDrivers();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Connection closed")) {
      console.warn("⚠️ Database connection closed during seeding. This is likely a temporary glitch. Resuming...");
      console.error(error); // Log the full trace to see what failed
    } else {
      console.warn("⚠️ Seeding skipped (non-fatal):", error);
    }
  }
}

async function seedRaces(): Promise<void> {
  const [{ count }] = await db<[{ count: string }]>`
    SELECT COUNT(*) as count FROM races
  `;

  if (parseInt(count) > 0) {
    console.log("Race data already exists. Skipping seed.");
    return;
  }

  console.log("Fetching race schedule from Jolpi Ergast API...");

  try {
    const res = await fetch(`${JOLPI_API_BASE}.json`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = (await res.json()) as {
      MRData: { RaceTable: { Races: ErgastRace[] } };
    };
    const races: ErgastRace[] = data.MRData.RaceTable.Races;

    for (const race of races) {
      const raceDateStr = `${race.date}T${race.time || "15:00:00Z"}`;
      const raceDate = new Date(raceDateStr);

      const hasSprint = !!race.Sprint;

      // Lock picks effectively slightly before Qualifying starts generally. 
      // If Jolpi has `Qualifying` data, use it. Otherwise guess based on race day.
      let raceDeadline = new Date(raceDate);
      if (race.Qualifying) {
        raceDeadline = new Date(`${race.Qualifying.date}T${race.Qualifying.time || "12:00:00Z"}`);
      } else {
        raceDeadline.setHours(raceDeadline.getHours() - 24); // Day before 
      }

      let sprintDeadline = null;
      if (hasSprint && race.Sprint) {
        sprintDeadline = new Date(`${race.Sprint.date}T${race.Sprint.time || "12:00:00Z"}`);
      }

      await db`
        INSERT INTO races (name, date, has_sprint, status, race_deadline, sprint_deadline)
        VALUES (
          ${race.raceName},
          ${raceDate.toISOString()},
          ${hasSprint},
          'UPCOMING',
          ${raceDeadline.toISOString()},
          ${sprintDeadline?.toISOString() ?? null}
        )
      `;
      await Bun.sleep(20);
    }
    console.log(`Seeded ${races.length} races.`);
  } catch (err) {
    console.error("Failed to seed races from Ergast API:", err);
  }
}

async function seedDrivers(): Promise<void> {
  const [{ count }] = await db<[{ count: string }]>`
    SELECT COUNT(*) as count FROM drivers
  `;

  if (parseInt(count) > 0) {
    console.log("Driver data already exists. Skipping seed.");
    return;
  }

  console.log("Fetching driver data from Jolpi Ergast API...");

  try {
    const res = await fetch(`${JOLPI_API_BASE}/drivers.json`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = (await res.json()) as {
      MRData: { DriverTable: { Drivers: ErgastDriver[] } };
    };
    const drivers: ErgastDriver[] = data.MRData.DriverTable.Drivers;

    for (const driver of drivers) {
      const fullName = `${driver.givenName} ${driver.familyName}`;
      const tla = driver.code || driver.familyName.substring(0, 3).toUpperCase();
      const racingNumber = driver.permanentNumber || "0";
      // Ergast driver lists don't easily have 'team_name' in the basic drivers.json 
      // We will fallback to "Unknown" for now or fetch constructors.
      const teamName = "Unknown constructor";

      await db`
        INSERT INTO drivers (full_name, racing_number, team_name, tla)
        VALUES (
          ${fullName},
          ${racingNumber},
          ${teamName},
          ${tla}
        )
      `;
      await Bun.sleep(20);
    }
    console.log(`Seeded ${drivers.length} drivers.`);
  } catch (err) {
    console.error("Failed to seed drivers from Ergast API:", err);
  }
}
