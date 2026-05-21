import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";


type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * GET /api/v1/leaderboard/:leagueId
 * Returns the standings for a league, sorted by total points descending.
 * Uses the league's scoring config (points are already stored on each pick row).
 */
export async function getLeaderboard(c: AppContext) {
  const leagueId = c.req.param("leagueId");
  const db = c.get("db");
  const user = c.get("user");

  if (!leagueId) {
    return c.json({ error: "leagueId is required" }, 400);
  }

  // --- Security Fix: Prevent IDOR ---
  const [membership] = await db`
    SELECT 1 FROM league_members
    WHERE league_id = ${leagueId} AND user_id = ${user.id}
    LIMIT 1
  `;

  if (!membership) {
    return c.json({ error: "Forbidden: You are not a member of this league." }, 403);
  }

  const raceId = c.req.query("raceId");

  // Aggregate total points per user for this league
  const standings = await db`
    SELECT
      u.id AS "userId",
      u.display_name AS "displayName",
      u.contact,
      u.avatar_url AS "avatarUrl",
      COUNT(p.id)::int AS "totalPredictions",
      COALESCE(SUM(p.correct_predictions), 0)::int AS "leagueCorrectPredictions",
      COALESCE(SUM(p.total_predictions), 0)::int AS "leagueTotalPredictions",
      COALESCE(SUM(p.total_points), 0)::int AS "totalPoints"
    FROM league_members lm
    INNER JOIN users u ON u.id = lm.user_id
    LEFT JOIN picks p ON p.user_id = lm.user_id 
      AND p.league_id = ${leagueId}
      ${raceId ? db`AND p.race_id = ${raceId}` : db``}
    WHERE lm.league_id = ${leagueId}
    GROUP BY u.id, u.display_name, u.contact, u.avatar_url
    ORDER BY "totalPoints" DESC
  `;

  return c.json(standings);
}
