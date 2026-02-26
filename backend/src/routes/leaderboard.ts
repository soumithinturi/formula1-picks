import { db } from "../db/index.ts";
import { withAuth } from "../middleware/auth.ts";
import type { LeaderboardEntry } from "../types/index.ts";

/**
 * GET /api/v1/leaderboard/:leagueId
 * Returns the standings for a league, sorted by total points descending.
 * Uses the league's scoring config (points are already stored on each pick row).
 */
export const getLeaderboard = withAuth(async (req) => {
  const leagueId = req.params.leagueId;

  if (!leagueId) {
    return Response.json({ error: "leagueId is required" }, { status: 400 });
  }

  // --- Security Fix: Prevent IDOR ---
  // Ensure the requesting user is actually a member of this league
  const [membership] = await db`
    SELECT 1 FROM league_members
    WHERE league_id = ${leagueId} AND user_id = ${req.user.id}
    LIMIT 1
  `;

  if (!membership) {
    return Response.json({ error: "Forbidden: You are not a member of this league." }, { status: 403 });
  }
  // ----------------------------------

  // Aggregate total points per user for this league
  const standings = await db<LeaderboardEntry[]>`
    SELECT
      u.id AS "userId",
      u.display_name AS "displayName",
      u.contact,
      COALESCE(SUM(p.total_points), 0) AS "totalPoints"
    FROM league_members lm
    INNER JOIN users u ON u.id = lm.user_id
    LEFT JOIN picks p ON p.user_id = lm.user_id AND p.league_id = ${leagueId}
    WHERE lm.league_id = ${leagueId}
    GROUP BY u.id, u.display_name, u.contact
    ORDER BY "totalPoints" DESC
  `;

  return Response.json(standings);
});
