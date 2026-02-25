import { db } from "./src/db/index.ts";

async function clearData() {
  console.log("Dropping old static data to trigger re-seed with live Jolpi Ergast 2026 data...");
  await db`DELETE FROM picks;`;
  await db`DELETE FROM races;`;
  await db`DELETE FROM drivers;`;
  console.log("Done. Next server reboot or hot-reload will fetch live data.");
  process.exit(0);
}

clearData();
