import { db } from "../db/index.ts";
import { withAuth, parseBody } from "../middleware/auth.ts";
import {
  CreateLeagueSchema,
  JoinLeagueSchema,
  DEFAULT_SCORING_CONFIG,
  type LeagueRow,
} from "../types/index.ts";

/**
 * POST /api/v1/leagues
 * Creates a new league with an optional custom scoring config.
 * Automatically adds the creator as a member.
 */
export const createLeague = withAuth(async (req) => {
  const { data, error } = await parseBody(req, CreateLeagueSchema);
  if (error) return error;

  const scoringConfig = data.scoringConfig ?? DEFAULT_SCORING_CONFIG;
  // Generate a short, human-readable invite code
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const [league] = await db<LeagueRow[]>`
    INSERT INTO leagues (name, created_by, invite_code, scoring_config, created_at)
    VALUES (
      ${data.name},
      ${req.user.id},
      ${inviteCode},
      ${JSON.stringify(scoringConfig)},
      NOW()
    )
    RETURNING *
  `;

  // Auto-join the creator as a member
  await db`
    INSERT INTO league_members (league_id, user_id, joined_at)
    VALUES (${league.id}, ${req.user.id}, NOW())
  `;

  return Response.json(league, { status: 201 });
});

/**
 * GET /api/v1/leagues
 * Returns all leagues the current user is a member of.
 */
export const listLeagues = withAuth(async (req) => {
  const leagues = await db<LeagueRow[]>`
    SELECT l.*
    FROM leagues l
    INNER JOIN league_members lm ON lm.league_id = l.id
    WHERE lm.user_id = ${req.user.id}
    ORDER BY l.created_at DESC
  `;
  return Response.json(leagues);
});

/**
 * POST /api/v1/leagues/join
 * Joins a league using an invite code.
 */
export const joinLeague = withAuth(async (req) => {
  const { data, error } = await parseBody(req, JoinLeagueSchema);
  if (error) return error;

  const [league] = await db<LeagueRow[]>`
    SELECT * FROM leagues WHERE invite_code = ${data.inviteCode} LIMIT 1
  `;

  if (!league) {
    return Response.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if already a member
  const [existing] = await db`
    SELECT 1 FROM league_members
    WHERE league_id = ${league.id} AND user_id = ${req.user.id}
    LIMIT 1
  `;

  if (existing) {
    return Response.json({ error: "Already a member of this league" }, { status: 409 });
  }

  await db`
    INSERT INTO league_members (league_id, user_id, joined_at)
    VALUES (${league.id}, ${req.user.id}, NOW())
  `;

  return Response.json(league);
});
