import { db } from "../db/index.ts";
import { withAuth } from "../middleware/auth.ts";
import type { RaceRow } from "../types/index.ts";

/**
 * GET /api/v1/races
 * Returns all races ordered by date ascending.
 */
export const listRaces = withAuth(async (_req) => {
  const races = await db<RaceRow[]>`
    SELECT * FROM races ORDER BY date ASC
  `;
  return Response.json(races);
});
