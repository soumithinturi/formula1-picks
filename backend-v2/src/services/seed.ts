import { db } from "../db/index.ts";

// 2025 Season Static Data
const STATIC_RACES = [
  { name: "Australian Grand Prix", date: "2025-03-16T05:00:00Z", has_sprint: false },
  { name: "Chinese Grand Prix", date: "2025-03-23T07:00:00Z", has_sprint: true },
  { name: "Japanese Grand Prix", date: "2025-04-06T05:00:00Z", has_sprint: false },
  { name: "Bahrain Grand Prix", date: "2025-04-13T15:00:00Z", has_sprint: false },
  { name: "Saudi Arabian Grand Prix", date: "2025-04-20T17:00:00Z", has_sprint: false },
  { name: "Miami Grand Prix", date: "2025-05-04T20:00:00Z", has_sprint: true },
  { name: "Emilia Romagna Grand Prix", date: "2025-05-18T13:00:00Z", has_sprint: false },
  { name: "Monaco Grand Prix", date: "2025-05-25T13:00:00Z", has_sprint: false },
  { name: "Spanish Grand Prix", date: "2025-06-01T13:00:00Z", has_sprint: false },
  { name: "Canadian Grand Prix", date: "2025-06-15T18:00:00Z", has_sprint: false },
  { name: "Austrian Grand Prix", date: "2025-06-29T13:00:00Z", has_sprint: true },
  { name: "British Grand Prix", date: "2025-07-06T14:00:00Z", has_sprint: false },
  { name: "Belgian Grand Prix", date: "2025-07-27T13:00:00Z", has_sprint: true },
  { name: "Hungarian Grand Prix", date: "2025-08-03T13:00:00Z", has_sprint: false },
  { name: "Dutch Grand Prix", date: "2025-08-31T13:00:00Z", has_sprint: false },
  { name: "Italian Grand Prix", date: "2025-09-07T13:00:00Z", has_sprint: false },
  { name: "Azerbaijan Grand Prix", date: "2025-09-21T11:00:00Z", has_sprint: false },
  { name: "Singapore Grand Prix", date: "2025-10-05T12:00:00Z", has_sprint: false },
  { name: "United States Grand Prix", date: "2025-10-19T19:00:00Z", has_sprint: true },
  { name: "Mexico City Grand Prix", date: "2025-10-26T20:00:00Z", has_sprint: false },
  { name: "São Paulo Grand Prix", date: "2025-11-09T17:00:00Z", has_sprint: true },
  { name: "Las Vegas Grand Prix", date: "2025-11-22T06:00:00Z", has_sprint: false },
  { name: "Qatar Grand Prix", date: "2025-11-30T17:00:00Z", has_sprint: true },
  { name: "Abu Dhabi Grand Prix", date: "2025-12-07T13:00:00Z", has_sprint: false },
];

const STATIC_DRIVERS = [
  { fullName: "Max Verstappen", racingNumber: "1", teamName: "Red Bull Racing", tla: "VER" },
  { fullName: "Sergio Perez", racingNumber: "11", teamName: "Red Bull Racing", tla: "PER" },
  { fullName: "Lewis Hamilton", racingNumber: "44", teamName: "Ferrari", tla: "HAM" },
  { fullName: "Charles Leclerc", racingNumber: "16", teamName: "Ferrari", tla: "LEC" },
  { fullName: "George Russell", racingNumber: "63", teamName: "Mercedes", tla: "RUS" },
  { fullName: "Kimi Antonelli", racingNumber: "12", teamName: "Mercedes", tla: "ANT" },
  { fullName: "Lando Norris", racingNumber: "4", teamName: "McLaren", tla: "NOR" },
  { fullName: "Oscar Piastri", racingNumber: "81", teamName: "McLaren", tla: "PIA" },
  { fullName: "Fernando Alonso", racingNumber: "14", teamName: "Aston Martin", tla: "ALO" },
  { fullName: "Lance Stroll", racingNumber: "18", teamName: "Aston Martin", tla: "STR" },
  { fullName: "Pierre Gasly", racingNumber: "10", teamName: "Alpine", tla: "GAS" },
  { fullName: "Jack Doohan", racingNumber: "7", teamName: "Alpine", tla: "DOO" },
  { fullName: "Alexander Albon", racingNumber: "23", teamName: "Williams", tla: "ALB" },
  { fullName: "Carlos Sainz", racingNumber: "55", teamName: "Williams", tla: "SAI" },
  { fullName: "Yuki Tsunoda", racingNumber: "22", teamName: "RB", tla: "TSU" },
  { fullName: "Liam Lawson", racingNumber: "30", teamName: "RB", tla: "LAW" },
  { fullName: "Nico Hulkenberg", racingNumber: "27", teamName: "Kick Sauber", tla: "HUL" },
  { fullName: "Gabriel Bortoleto", racingNumber: "5", teamName: "Kick Sauber", tla: "BOR" },
  { fullName: "Esteban Ocon", racingNumber: "31", teamName: "Haas", tla: "OCO" },
  { fullName: "Oliver Bearman", racingNumber: "87", teamName: "Haas", tla: "BEA" },
];

/**
 * Seeds the database with 2025 race schedule and driver list from static JSON.
 * Only runs if the respective tables are empty — safe to call on every startup.
 */
export async function seedDatabase(): Promise<void> {
  await Promise.all([seedRaces(), seedDrivers()]);
}

async function seedRaces(): Promise<void> {
  const [{ count }] = await db<[{ count: string }]>`
    SELECT COUNT(*) as count FROM races
  `;

  if (parseInt(count) > 0) {
    console.log("Race data already exists. Skipping seed.");
    return;
  }

  console.log("Seeding race data from static JSON...");

  for (const race of STATIC_RACES) {
    const raceDate = new Date(race.date);

    // Race deadline = race day at noon local time (placeholder)
    // In a real app, this should be dynamic based on Qualifying start time
    const raceDeadline = new Date(raceDate);
    raceDeadline.setHours(12, 0, 0, 0);

    // Sprint deadline = day before race at noon (placeholder)
    const sprintDeadline = race.has_sprint ? new Date(raceDeadline) : null;
    if (sprintDeadline) sprintDeadline.setDate(sprintDeadline.getDate() - 1);

    await db`
      INSERT INTO races (name, date, has_sprint, status, race_deadline, sprint_deadline)
      VALUES (
        ${race.name},
        ${raceDate.toISOString()},
        ${race.has_sprint},
        'UPCOMING',
        ${raceDeadline.toISOString()},
        ${sprintDeadline?.toISOString() ?? null}
      )
    `;
  }

  console.log(`Seeded ${STATIC_RACES.length} races.`);
}

async function seedDrivers(): Promise<void> {
  const [{ count }] = await db<[{ count: string }]>`
    SELECT COUNT(*) as count FROM drivers
  `;

  if (parseInt(count) > 0) {
    console.log("Driver data already exists. Skipping seed.");
    return;
  }

  console.log("Seeding driver data from static JSON...");

  for (const driver of STATIC_DRIVERS) {
    await db`
      INSERT INTO drivers (full_name, racing_number, team_name, tla)
      VALUES (
        ${driver.fullName},
        ${driver.racingNumber},
        ${driver.teamName},
        ${driver.tla}
      )
    `;
  }

  console.log(`Seeded ${STATIC_DRIVERS.length} drivers.`);
}
