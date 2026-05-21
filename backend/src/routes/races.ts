import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";
import type { RaceRow } from "../types/index.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * GET /api/v1/races
 * Returns all races ordered by date ascending.
 */
export async function listRaces(c: AppContext) {
  const db = c.get("db");
  const races = await db<RaceRow[]>`
    SELECT * FROM races ORDER BY date ASC
  `;
  return c.json(races);
}
