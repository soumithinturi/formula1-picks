import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";

import { parseBody } from "../middleware/auth.ts";
import {
  CreateLeagueSchema,
  UpdateLeagueSchema,
  JoinLeagueSchema,
  DEFAULT_SCORING_CONFIG,
  type LeagueRow,
} from "../types/index.ts";
import { notifyLeagueJoin } from "../services/pushService.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * POST /api/v1/leagues
 * Creates a new league with an optional custom scoring config.
 * Automatically adds the creator as a member.
 */
export async function createLeague(c: AppContext) {
  const { data, error } = await parseBody(c, CreateLeagueSchema);
  if (error) return error;

  const db = c.get("db");
  const user = c.get("user");

  try {
    const scoringConfig = data.scoringConfig ?? DEFAULT_SCORING_CONFIG;
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const [league] = await db<LeagueRow[]>`
      INSERT INTO leagues (name, created_by, invite_code, scoring_config, created_at)
      VALUES (${data.name}, ${user.id}, ${inviteCode}, ${JSON.stringify(scoringConfig)}::jsonb, NOW())
      RETURNING *
    `;

    // Auto-join the creator as a member
    await db`
      INSERT INTO league_members (league_id, user_id, joined_at)
      VALUES (${league.id}, ${user.id}, NOW())
    `;

    return c.json({
      ...league,
      members_count: 1,
      scoring_config: typeof league.scoring_config === "string" ? JSON.parse(league.scoring_config) : league.scoring_config
    }, 201);
  } catch (err: any) {
    console.error("League creation error:", err);
    return c.json({ error: err.message || String(err) }, 500);
  }
}

/**
 * GET /api/v1/leagues
 * Returns all leagues the current user is a member of.
 */
export async function listLeagues(c: AppContext) {
  const db = c.get("db");
  const user = c.get("user");

  const leagues = await db<LeagueRow[]>`
    SELECT l.*, (SELECT count(*) FROM league_members WHERE league_id = l.id)::int as members_count
    FROM leagues l
    INNER JOIN league_members lm ON lm.league_id = l.id
    WHERE lm.user_id = ${user.id}
    ORDER BY l.created_at DESC
  `;
  return c.json(leagues.map(l => ({
    ...l,
    scoring_config: typeof l.scoring_config === "string" ? JSON.parse(l.scoring_config) : l.scoring_config
  })));
}

/**
 * POST /api/v1/leagues/join
 * Joins a league using an invite code.
 */
export async function joinLeague(c: AppContext) {
  const { data, error } = await parseBody(c, JoinLeagueSchema);
  if (error) return error;

  const db = c.get("db");
  const user = c.get("user");

  const [league] = await db<LeagueRow[]>`
    SELECT * FROM leagues WHERE invite_code = ${data.inviteCode} LIMIT 1
  `;

  if (!league) {
    return c.json({ error: "Invalid invite code" }, 404);
  }

  // Check if already a member
  const [existing] = await db`
    SELECT 1 FROM league_members
    WHERE league_id = ${league.id} AND user_id = ${user.id}
    LIMIT 1
  `;

  if (existing) {
    return c.json({ error: "Already a member of this league" }, 409);
  }

  await db`
    INSERT INTO league_members (league_id, user_id, joined_at)
    VALUES (${league.id}, ${user.id}, NOW())
  `;

  // Trigger push notifications (awaited to avoid prematurely ending db pool)
  const [currentUser] = await db`SELECT display_name FROM users WHERE id = ${user.id} LIMIT 1`;
  await notifyLeagueJoin(db, league.id, user.id, currentUser?.display_name || "A user").catch(console.error);

  const [updatedLeague] = await db<any[]>`
    SELECT l.*, (SELECT count(*) FROM league_members WHERE league_id = l.id)::int as members_count
    FROM leagues l WHERE l.id = ${league.id}
  `;

  return c.json({
    ...updatedLeague,
    scoring_config: typeof updatedLeague.scoring_config === "string" ? JSON.parse(updatedLeague.scoring_config) : updatedLeague.scoring_config
  });
}

/**
 * GET /api/v1/leagues/invite/:code
 * Returns basic public info for a league from an invite code (used for previewing).
 * Does not require auth.
 */
export async function previewLeague(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
  const code = c.req.param("code");
  const db = c.get("db");

  if (!code) {
    return c.json({ error: "Missing invite code" }, 400);
  }

  try {
    const [league] = await db`
      SELECT id, name, created_by, invite_code, invite_message
      FROM leagues WHERE invite_code = ${code} LIMIT 1
    `;

    if (!league) {
      return c.json({ error: "Invalid invite code" }, 404);
    }

    const [creator] = await db`
      SELECT display_name FROM users WHERE id = ${league.created_by} LIMIT 1
    `;

    return c.json({
      id: league.id,
      name: league.name,
      creatorName: creator?.display_name || "Unknown Driver",
      inviteMessage: league.invite_message || null,
    });
  } catch (err: any) {
    console.error("League preview error:", err);
    return c.json({ error: "Failed to load league info" }, 500);
  }
}

/**
 * PATCH /api/v1/leagues/:id
 * Updates an existing league's metadata (e.g., name).
 * Requires the user to be the creator of the league.
 */
export async function updateLeague(c: AppContext) {
  const id = c.req.param("id");
  const db = c.get("db");
  const user = c.get("user");

  if (!id) {
    return c.json({ error: "Missing league ID" }, 400);
  }

  const { data, error } = await parseBody(c, UpdateLeagueSchema);
  if (error) return error;

  try {
    const [league] = await db`
      SELECT created_by FROM leagues WHERE id = ${id} LIMIT 1
    `;

    if (!league) {
      return c.json({ error: "League not found" }, 404);
    }

    if (league.created_by !== user.id) {
      return c.json({ error: "Only the league creator can edit the league" }, 403);
    }

    if (data.name !== undefined) {
      await db`UPDATE leagues SET name = ${data.name} WHERE id = ${id}`;
    }
    if (data.invite_message !== undefined) {
      await db`UPDATE leagues SET invite_message = ${data.invite_message} WHERE id = ${id}`;
    }

    const [updatedLeague] = await db<any[]>`
      SELECT l.*, (SELECT count(*) FROM league_members WHERE league_id = l.id)::int as members_count
      FROM leagues l WHERE l.id = ${id}
    `;

    return c.json({
      ...updatedLeague,
      scoring_config: typeof updatedLeague.scoring_config === "string"
        ? JSON.parse(updatedLeague.scoring_config)
        : updatedLeague.scoring_config
    });
  } catch (err: any) {
    console.error("League update error:", err);
    return c.json({ error: "Failed to update league" }, 500);
  }
}

/**
 * POST /api/v1/leagues/:id/leave
 * Removes the current user from the league.
 */
export async function leaveLeague(c: AppContext) {
  const id = c.req.param("id");
  const db = c.get("db");
  const user = c.get("user");

  if (!id) {
    return c.json({ error: "Missing league ID" }, 400);
  }

  try {
    const [league] = await db`SELECT 1 FROM leagues WHERE id = ${id}`;
    if (!league) {
      return c.json({ error: "League not found" }, 404);
    }

    await db`
      DELETE FROM league_members
      WHERE league_id = ${id} AND user_id = ${user.id}
    `;

    return c.json({ success: true });
  } catch (err: any) {
    console.error("Leave league error:", err);
    return c.json({ error: "Failed to leave league" }, 500);
  }
}

/**
 * DELETE /api/v1/leagues/:id
 * Deletes the league and all associated data.
 * Only the creator can perform this action.
 */
export async function deleteLeague(c: AppContext) {
  const id = c.req.param("id");
  const db = c.get("db");
  const user = c.get("user");

  if (!id) {
    return c.json({ error: "Missing league ID" }, 400);
  }

  try {
    const [league] = await db`
      SELECT created_by FROM leagues WHERE id = ${id} LIMIT 1
    `;

    if (!league) {
      return c.json({ error: "League not found" }, 404);
    }

    if (league.created_by !== user.id) {
      return c.json({ error: "Only the league creator can delete the league" }, 403);
    }

    // Delete picks first (due to NO ACTION constraint on league_id)
    await db`DELETE FROM picks WHERE league_id = ${id}`;

    // Delete the league (cascades to league_members and chat_messages)
    await db`DELETE FROM leagues WHERE id = ${id}`;

    return c.json({ success: true });
  } catch (err: any) {
    console.error("Delete league error:", err);
    return c.json({ error: "Failed to delete league" }, 500);
  }
}
