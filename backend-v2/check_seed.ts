import { db } from "./src/db/index";

async function check() {
  const [{ count: raceCount }] = await db`SELECT COUNT(*) as count FROM races`;
  const [{ count: driverCount }] = await db`SELECT COUNT(*) as count FROM drivers`;

  console.log(`Races in DB: ${raceCount}`);
  console.log(`Drivers in DB: ${driverCount}`);

  // Also verify a specific race to be sure
  if (parseInt(raceCount) > 0) {
    const [race] = await db`SELECT name FROM races WHERE name = 'Australian Grand Prix' LIMIT 1`;
    console.log(`Found race: ${race?.name}`);
  }

  process.exit(0);
}

check();
