import { db } from "../db/index.ts";
import { withAuth, parseBody } from "../middleware/auth.ts";
import { PickSubmissionSchema, type PickRow, type RaceRow } from "../types/index.ts";
import { supabase } from "../lib/supabase.ts";


/**
 * GET /api/v1/picks/race/:raceId?leagueId=<uuid>
 * Returns the current user's pick for a specific race within a league.
 */
export const getPickForRace = withAuth(async (req) => {
  const url = new URL(req.url);
  const raceId = req.params.raceId;
  const leagueId = url.searchParams.get("leagueId");

  if (!raceId || !leagueId) {
    return Response.json({ error: "raceId and leagueId are required" }, { status: 400 });
  }

  const [pick] = await db<PickRow[]>`
    SELECT * FROM picks
    WHERE user_id = ${req.user.id}
      AND race_id = ${parseInt(raceId)}
      AND league_id = ${leagueId}
    LIMIT 1
  `;

  if (!pick) {
    return Response.json({ error: "Pick not found" }, { status: 404 });
  }

  return Response.json(pick);
});

/**
 * GET /api/v1/picks/race/:raceId/user/:userId?leagueId=<uuid>
 * Returns a specific user's pick for a specific race within a league.
 * Applies visibility rules: if the deadline hasn't passed, scrub the picks.
 */
export const getUserPickForRace = withAuth(async (req) => {
  const url = new URL(req.url);
  const raceId = req.params.raceId;
  const targetUserId = req.params.userId;
  const leagueId = url.searchParams.get("leagueId");

  if (!raceId || !targetUserId || !leagueId) {
    return Response.json({ error: "raceId, userId, and leagueId are required" }, { status: 400 });
  }

  // --- Security Check: Ensure requesting user is a member of the league ---
  const [membership] = await db`
    SELECT 1 FROM league_members
    WHERE league_id = ${leagueId} AND user_id = ${req.user.id}
    LIMIT 1
  `;

  if (!membership) {
    return Response.json({ error: "Forbidden: You are not a member of this league." }, { status: 403 });
  }

  // Fetch the target user's pick
  const [pick] = await db<PickRow[]>`
    SELECT * FROM picks
    WHERE user_id = ${targetUserId}
      AND race_id = ${parseInt(raceId)}
      AND league_id = ${leagueId}
    LIMIT 1
  `;

  if (!pick) {
    return Response.json({ error: "Pick not found" }, { status: 404 });
  }

  const [results] = await db`
    SELECT * FROM race_results WHERE race_id = ${parseInt(raceId)} LIMIT 1
  `;

  // If requesting own picks, return as is (with results attached)
  if (targetUserId === req.user.id) {
    return Response.json({ ...pick, results: results || null });
  }

  // Otherwise, apply visibility logic
  const [race] = await db<RaceRow[]>`
    SELECT * FROM races WHERE id = ${parseInt(raceId)} LIMIT 1
  `;

  if (!race) {
    return Response.json(pick); // Fallback
  }

  const now = new Date();
  const scrubbedPick = { ...pick };

  if (race.sprint_quali_date && now < new Date(race.sprint_quali_date)) {
    scrubbedPick.sprint_qualifying_p1 = null;
  }

  if (race.sprint_deadline && now < new Date(race.sprint_deadline)) {
    scrubbedPick.sprint_p1 = null;
    scrubbedPick.sprint_p2 = null;
    scrubbedPick.sprint_p3 = null;
    scrubbedPick.sprint_fastest_lap = null;
  }

  if (race.race_quali_date && now < new Date(race.race_quali_date)) {
    scrubbedPick.race_qualifying_p1 = null;
  }

  if (race.race_deadline && now < new Date(race.race_deadline)) {
    scrubbedPick.race_p1 = null;
    scrubbedPick.race_p2 = null;
    scrubbedPick.race_p3 = null;
    scrubbedPick.fastest_lap = null;
    scrubbedPick.first_dnf = null;
  }

  return Response.json({ ...scrubbedPick, results: results || null });
});

/**
 * POST /api/v1/picks
 * Submits or updates a pick for a race within a league.
 * Enforces sprint and race deadlines.
 */
export const submitPick = withAuth(async (req) => {
  const { data, error } = await parseBody(req, PickSubmissionSchema);
  if (error) return error;

  // --- Security Fix: Prevent Submission for Non-Members ---
  const [membership] = await db`
    SELECT 1 FROM league_members
    WHERE league_id = ${data.leagueId} AND user_id = ${req.user.id}
    LIMIT 1
  `;

  if (!membership) {
    return Response.json({ error: "Forbidden: You are not a member of this league." }, { status: 403 });
  }

  // Fetch the race to check deadlines
  const [race] = await db<RaceRow[]>`
    SELECT * FROM races WHERE id = ${data.raceId} LIMIT 1
  `;

  if (!race) {
    return Response.json({ error: `Race not found: ${data.raceId}` }, { status: 404 });
  }

  // Fetch existing pick to support "Smart Enforcement" (only block if locked field is CHANGED)
  const [existingPick] = await db<PickRow[]>`
    SELECT * FROM picks 
    WHERE user_id = ${req.user.id} AND race_id = ${data.raceId} AND league_id = ${data.leagueId}
    LIMIT 1
  `;

  const now = new Date();
  const sel = data.selections;

  // Helper to check if a field is locked and being modified
  const isLockedAndModified = (field: keyof PickRow, newValue: string | null | undefined, deadline: string | null) => {
    if (!deadline) return false;
    if (now <= new Date(deadline)) return false;

    // If we're here, it's past the deadline.
    // IMPORTANT: If newValue is undefined, it means the field is NOT being modified.
    if (newValue === undefined) return false;

    // Compare with existing pick. If it's a new pick (existingPick is undefined), 
    // we consider the "old value" to be null.
    const oldValue = existingPick ? (existingPick as any)[field] : null;

    return newValue !== oldValue;
  };

  // 1. Sprint Qualifying
  if (isLockedAndModified("sprint_qualifying_p1", sel.sprintQualifyingP1, race.sprint_quali_date)) {
    return Response.json({ error: "The deadline for sprint qualifying picks has passed." }, { status: 422 });
  }

  // 2. Sprint Picks
  const sprintFields: (keyof PickRow)[] = ["sprint_p1", "sprint_p2", "sprint_p3", "sprint_fastest_lap"];
  const sprintSelKeys: (keyof typeof sel)[] = ["sprintP1", "sprintP2", "sprintP3", "sprintFastestLap"];

  for (let i = 0; i < sprintFields.length; i++) {
    if (isLockedAndModified(sprintFields[i], sel[sprintSelKeys[i]], race.sprint_deadline)) {
      return Response.json({ error: "The deadline for sprint picks has passed." }, { status: 422 });
    }
  }

  // 3. Race Qualifying
  if (isLockedAndModified("race_qualifying_p1", sel.raceQualifyingP1, race.race_quali_date)) {
    return Response.json({ error: "The deadline for qualifying picks has passed." }, { status: 422 });
  }

  // 4. Race Picks
  const raceFields: (keyof PickRow)[] = ["race_p1", "race_p2", "race_p3", "fastest_lap", "first_dnf"];
  const raceSelKeys: (keyof typeof sel)[] = ["raceP1", "raceP2", "raceP3", "fastestLap", "firstDnf"];

  for (let i = 0; i < raceFields.length; i++) {
    if (isLockedAndModified(raceFields[i], sel[raceSelKeys[i]], race.race_deadline)) {
      return Response.json({ error: "The deadline for race picks has passed." }, { status: 422 });
    }
  }

  // Upsert the pick (insert or update if one already exists for this user/race/league)
  const [savedPick] = await db<PickRow[]>`
    INSERT INTO picks (
      user_id, race_id, league_id, total_points, submitted_at,
      sprint_qualifying_p1, sprint_p1, sprint_p2, sprint_p3, sprint_fastest_lap,
      race_qualifying_p1, race_p1, race_p2, race_p3,
      fastest_lap, first_dnf
    ) VALUES (
      ${req.user.id}, ${data.raceId}, ${data.leagueId}, 0, NOW(),
      ${sel.sprintQualifyingP1 ?? (existingPick?.sprint_qualifying_p1 || null)}, 
      ${sel.sprintP1 ?? (existingPick?.sprint_p1 || null)},
      ${sel.sprintP2 ?? (existingPick?.sprint_p2 || null)}, 
      ${sel.sprintP3 ?? (existingPick?.sprint_p3 || null)}, 
      ${sel.sprintFastestLap ?? (existingPick?.sprint_fastest_lap || null)},
      ${sel.raceQualifyingP1 ?? (existingPick?.race_qualifying_p1 || null)}, 
      ${sel.raceP1 ?? (existingPick?.race_p1 || null)},
      ${sel.raceP2 ?? (existingPick?.race_p2 || null)}, 
      ${sel.raceP3 ?? (existingPick?.race_p3 || null)},
      ${sel.fastestLap ?? (existingPick?.fastest_lap || null)}, 
      ${sel.firstDnf ?? (existingPick?.first_dnf || null)}
    )
    ON CONFLICT (user_id, race_id, league_id) DO UPDATE SET
      sprint_qualifying_p1 = EXCLUDED.sprint_qualifying_p1,
      sprint_p1 = EXCLUDED.sprint_p1,
      sprint_p2 = EXCLUDED.sprint_p2,
      sprint_p3 = EXCLUDED.sprint_p3,
      sprint_fastest_lap = EXCLUDED.sprint_fastest_lap,
      race_qualifying_p1 = EXCLUDED.race_qualifying_p1,
      race_p1 = EXCLUDED.race_p1,
      race_p2 = EXCLUDED.race_p2,
      race_p3 = EXCLUDED.race_p3,
      fastest_lap = EXCLUDED.fastest_lap,
      first_dnf = EXCLUDED.first_dnf,
      submitted_at = NOW()
    RETURNING *
  `;

  // Fire system message to the specific league chat — non-blocking
  const raceName = (race as any).name || `Race #${data.raceId}`;
  queueMicrotask(() => broadcastPickSystemMessage(req.user.id, raceName, data.leagueId));

  return Response.json(savedPick, { status: 201 });
});

/**
 * Sends a system chat message to all leagues a user is a member of, announcing pick activity.
 * Called after a pick is submitted/updated. Non-blocking — errors are logged but not thrown.
 */
export async function broadcastPickSystemMessage(
  userId: string,
  raceName: string,
  leagueId?: string
): Promise<void> {
  try {
    const [userRow] = await db`
      SELECT display_name, contact FROM users WHERE id = ${userId} LIMIT 1
    `;
    const displayName = (userRow as any)?.display_name || (userRow as any)?.contact || "Someone";

    let leagueIds: string[] = [];
    if (leagueId) {
      leagueIds = [leagueId];
    } else {
      // Fallback: Find all leagues this user belongs to (backward compatibility or global events)
      const leagues = await db`
        SELECT league_id FROM league_members WHERE user_id = ${userId}
        UNION
        SELECT id AS league_id FROM leagues WHERE created_by = ${userId}
      `;
      leagueIds = (leagues as any[]).map(l => l.league_id);
    }

    if (!leagueIds.length) return;

    const message = `🏎️ ${displayName} locked in their picks for ${raceName}`;

    const rows = leagueIds.map((id: string) => ({
      league_id: id,
      user_id: userId,
      message,
      type: 'system',
    }));

    const { error } = await supabase.from("chat_messages").insert(rows);
    if (error) console.error("Failed to broadcast pick system messages:", error);
  } catch (err) {
    console.error("broadcastPickSystemMessage error:", err);
  }
}
