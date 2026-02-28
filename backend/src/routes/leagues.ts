import { db } from "../db/index.ts";
import { withAuth, parseBody } from "../middleware/auth.ts";
import {
  CreateLeagueSchema,
  UpdateLeagueSchema,
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

  try {
    const scoringConfig = data.scoringConfig ?? DEFAULT_SCORING_CONFIG;
    // Generate a short, human-readable invite code
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const [league] = await db<LeagueRow[]>`
      INSERT INTO leagues (name, created_by, invite_code, scoring_config, created_at)
      VALUES (
        ${data.name},
        ${req.user.id},
        ${inviteCode},
        ${JSON.stringify(scoringConfig)}::jsonb,
        NOW()
      )
      RETURNING *
    `;

    // Auto-join the creator as a member
    await db`
      INSERT INTO league_members (league_id, user_id, joined_at)
      VALUES (${league.id}, ${req.user.id}, NOW())
    `;

    return Response.json({
      ...league,
      scoring_config: typeof league.scoring_config === "string" ? JSON.parse(league.scoring_config) : league.scoring_config
    }, { status: 201 });
  } catch (err: any) {
    console.error("League creation error:", err);
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
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
  return Response.json(leagues.map(l => ({
    ...l,
    scoring_config: typeof l.scoring_config === "string" ? JSON.parse(l.scoring_config) : l.scoring_config
  })));
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

  return Response.json({
    ...league,
    scoring_config: typeof league.scoring_config === "string" ? JSON.parse(league.scoring_config) : league.scoring_config
  });
});

/**
 * GET /api/v1/leagues/invite/:code
 * Returns basic public info for a league from an invite code (used for previewing).
 * Does not require auth.
 */
export const previewLeague = async (req: Request) => {
  const url = new URL(req.url);
  const code = url.pathname.split("/").pop();

  if (!code) {
    return Response.json({ error: "Missing invite code" }, { status: 400 });
  }

  try {
    const [league] = await db`
      SELECT id, name, created_by, invite_code
      FROM leagues 
      WHERE invite_code = ${code} 
      LIMIT 1
    `;

    if (!league) {
      return Response.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Get the creator's name
    const [creator] = await db`
      SELECT display_name FROM users WHERE id = ${league.created_by} LIMIT 1
    `;

    return Response.json({
      id: league.id,
      name: league.name,
      creatorName: creator?.display_name || "Unknown Driver"
    });
  } catch (err: any) {
    console.error("League preview error:", err);
    return Response.json({ error: "Failed to load league info" }, { status: 500 });
  }
};

/**
 * PATCH /api/v1/leagues/:id
 * Updates an existing league's metadata (e.g., name).
 * Requires the user to be the creator of the league.
 */
export const updateLeague = withAuth(async (req) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return Response.json({ error: "Missing league ID" }, { status: 400 });
  }

  const { data, error } = await parseBody(req, UpdateLeagueSchema);
  if (error) return error;

  try {
    // Check if the user is the creator of the league
    const [league] = await db`
      SELECT created_by FROM leagues WHERE id = ${id} LIMIT 1
    `;

    if (!league) {
      return Response.json({ error: "League not found" }, { status: 404 });
    }

    if (league.created_by !== req.user.id) {
      return Response.json({ error: "Only the league creator can edit the league" }, { status: 403 });
    }

    // Update the league name
    const [updatedLeague] = await db<LeagueRow[]>`
      UPDATE leagues
      SET name = ${data.name}
      WHERE id = ${id}
      RETURNING *
    `;

    return Response.json({
      ...updatedLeague,
      scoring_config: typeof updatedLeague.scoring_config === "string"
        ? JSON.parse(updatedLeague.scoring_config)
        : updatedLeague.scoring_config
    });
  } catch (err: any) {
    console.error("League update error:", err);
    return Response.json({ error: "Failed to update league" }, { status: 500 });
  }
});
