import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";
import type { DriverRow } from "../types/index.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * GET /api/v1/drivers
 * Returns all drivers ordered by family name.
 */
export async function listDrivers(c: AppContext) {
  const db = c.get("db");
  const driversRows = await db<DriverRow[]>`
    SELECT * FROM drivers ORDER BY family_name ASC
  `;

  const drivers = driversRows.map((row) => ({
    driverId: row.driver_id,
    permanentNumber: row.permanent_number,
    code: row.code,
    url: row.url,
    givenName: row.given_name,
    familyName: row.family_name,
    dateOfBirth: row.date_of_birth,
    nationality: row.nationality,
    constructorId: row.constructor_id,
    constructorName: row.constructor_name,
    points: parseFloat(row.points as any) || 0,
    wins: parseInt(row.wins as any) || 0,
    rank: parseInt(row.rank as any) || 999
  }));

  return c.json(drivers);
}
