import { db } from "../db/index.ts";
import { withAuth } from "../middleware/auth.ts";
import type { DriverRow } from "../types/index.ts";

/**
 * GET /api/v1/drivers
 * Returns all drivers ordered by racing number.
 */
export const listDrivers = withAuth(async (_req) => {
  const drivers = await db<DriverRow[]>`
    SELECT * FROM drivers ORDER BY racing_number ASC
  `;
  return Response.json(drivers);
});
