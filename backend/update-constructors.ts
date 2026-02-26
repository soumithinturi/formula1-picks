import { db } from "./src/db/index.ts";

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

async function updateConstructors() {
  console.log("Updating existing drivers with constructor info...");
  for (const [driverId, constructorInfo] of Object.entries(DRIVER_CONSTRUCTOR_MAP)) {
    await db`
      UPDATE drivers 
      SET constructor_id = ${constructorInfo.id}, constructor_name = ${constructorInfo.name}
      WHERE driver_id = ${driverId}
    `;
    console.log(`Updated ${driverId} -> ${constructorInfo.name}`);
  }
  console.log("Done!");
  process.exit(0);
}

updateConstructors();
