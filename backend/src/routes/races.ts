import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";
import type { RaceRow } from "../types/index.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * GET /api/v1/races
 * Returns one season's races ordered by date ascending: ?season=YYYY, default the latest season.
 */
export async function listRaces(c: AppContext) {
  const db = c.get("db");
  const season = parseInt(c.req.query("season") ?? "");
  const races = await db<RaceRow[]>`
    SELECT * FROM races
    WHERE season = COALESCE(${Number.isNaN(season) ? null : season}::int, (SELECT max(season) FROM races))
    ORDER BY date ASC
  `;
  return c.json(races);
}
