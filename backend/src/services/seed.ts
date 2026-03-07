import { db } from "../db/index.ts";

// Manual 2026 driver to constructor mapping since Jolpi API doesn't provide it pre-season
const DRIVER_CONSTRUCTOR_MAP: Record<string, { id: string; name: string }> = {
  max_verstappen: { id: "red_bull", name: "Red Bull Racing" },
  hadjar: { id: "red_bull", name: "Red Bull Racing" },
  hamilton: { id: "ferrari", name: "Ferrari" },
  leclerc: { id: "ferrari", name: "Ferrari" },
  norris: { id: "mclaren", name: "McLaren" },
  piastri: { id: "mclaren", name: "McLaren" },
  russell: { id: "mercedes", name: "Mercedes" },
  antonelli: { id: "mercedes", name: "Mercedes" },
  alonso: { id: "aston_martin", name: "Aston Martin" },
  stroll: { id: "aston_martin", name: "Aston Martin" },
  gasly: { id: "alpine", name: "Alpine F1 Team" },
  colapinto: { id: "alpine", name: "Alpine F1 Team" },
  albon: { id: "williams", name: "Williams" },
  sainz: { id: "williams", name: "Williams" },
  lawson: { id: "rb", name: "RB F1 Team" },
  lindblad: { id: "rb", name: "RB F1 Team" },
  hulkenberg: { id: "audi", name: "Audi" },
  bortoleto: { id: "audi", name: "Audi" },
  ocon: { id: "haas", name: "Haas F1 Team" },
  bearman: { id: "haas", name: "Haas F1 Team" },
  perez: { id: "cadillac", name: "Cadillac F1 Team" },
  bottas: { id: "cadillac", name: "Cadillac F1 Team" }
};

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
  SprintQualifying?: { date: string; time: string };
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

      // Lock picks effectively at the start of the session.
      // Race picks lock at race_deadline.
      let raceDeadline = new Date(raceDate);

      let sprintDeadline = null;
      let sprintDate = null;
      let sprintQualiDate = null;
      if (hasSprint) {
        if (race.Sprint) {
          sprintDeadline = new Date(`${race.Sprint.date}T${race.Sprint.time || "12:00:00Z"}`);
          sprintDate = new Date(`${race.Sprint.date}T${race.Sprint.time || "12:00:00Z"}`);
        }
        if (race.SprintQualifying) {
          sprintQualiDate = new Date(`${race.SprintQualifying.date}T${race.SprintQualifying.time || "12:00:00Z"}`);
        }
      }

      let qualiDate = null;
      if (race.Qualifying) {
        qualiDate = new Date(`${race.Qualifying.date}T${race.Qualifying.time || "12:00:00Z"}`);
      }

      await db`
        INSERT INTO races(name, date, has_sprint, status, race_deadline, sprint_deadline, sprint_date, sprint_quali_date, race_quali_date)
      VALUES(
        ${race.raceName},
        ${raceDate.toISOString()},
        ${hasSprint},
        'UPCOMING',
        ${raceDeadline.toISOString()},
        ${sprintDeadline?.toISOString() ?? null},
          ${sprintDate?.toISOString() ?? null},
          ${sprintQualiDate?.toISOString() ?? null},
          ${qualiDate?.toISOString() ?? null}
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
      await db`
        INSERT INTO drivers (
          driver_id,
          permanent_number,
          code,
          url,
          given_name,
          family_name,
          date_of_birth,
          nationality,
          constructor_id,
          constructor_name
        )
        VALUES (
          ${driver.driverId},
          ${driver.permanentNumber || null},
          ${driver.code || null},
          ${driver.url || null},
          ${driver.givenName},
          ${driver.familyName},
          ${driver.dateOfBirth || null},
          ${driver.nationality || null},
          ${DRIVER_CONSTRUCTOR_MAP[driver.driverId]?.id || null},
          ${DRIVER_CONSTRUCTOR_MAP[driver.driverId]?.name || null}
        )
      `;
      await Bun.sleep(20);
    }
    console.log(`Seeded ${drivers.length} drivers.`);
  } catch (err) {
    console.error("Failed to seed drivers from Ergast API:", err);
  }
}
