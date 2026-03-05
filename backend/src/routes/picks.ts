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
  // --------------------------------------------------------

  // Fetch the race to check deadlines and sprint status
  const [race] = await db<RaceRow[]>`
    SELECT * FROM races WHERE id = ${data.raceId} LIMIT 1
  `;

  if (!race) {
    return Response.json({ error: `Race not found: ${data.raceId}` }, { status: 404 });
  }

  const now = new Date();
  const sel = data.selections;

  // Enforce sprint deadline if any sprint picks are being submitted
  const hasSprintPicks = sel.sprintQualifyingP1 || sel.sprintP1 || sel.sprintP2 || sel.sprintP3 || sel.sprintFastestLap;
  if (hasSprintPicks && race.sprint_deadline) {
    if (now > new Date(race.sprint_deadline)) {
      return Response.json({ error: "The deadline for sprint picks has passed." }, { status: 422 });
    }
  }

  // Enforce race deadline if any race picks are being submitted
  const hasRacePicks =
    sel.raceQualifyingP1 || sel.raceP1 || sel.raceP2 || sel.raceP3 || sel.fastestLap || sel.firstDnf;
  if (hasRacePicks && race.race_deadline) {
    if (now > new Date(race.race_deadline)) {
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
      ${sel.sprintQualifyingP1 ?? null}, ${sel.sprintP1 ?? null},
      ${sel.sprintP2 ?? null}, ${sel.sprintP3 ?? null}, ${sel.sprintFastestLap ?? null},
      ${sel.raceQualifyingP1 ?? null}, ${sel.raceP1 ?? null},
      ${sel.raceP2 ?? null}, ${sel.raceP3 ?? null},
      ${sel.fastestLap ?? null}, ${sel.firstDnf ?? null}
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

  // Fire system message to all league chats — non-blocking
  const raceName = (race as any).name || `Race #${data.raceId}`;
  queueMicrotask(() => broadcastPickSystemMessage(req.user.id, raceName));

  return Response.json(savedPick, { status: 201 });
});

/**
 * Sends a system chat message to all leagues a user is a member of, announcing pick activity.
 * Called after a pick is submitted/updated. Non-blocking — errors are logged but not thrown.
 */
export async function broadcastPickSystemMessage(
  userId: string,
  raceName: string
): Promise<void> {
  try {
    const [userRow] = await db`
      SELECT display_name, contact FROM users WHERE id = ${userId} LIMIT 1
    `;
    const displayName = (userRow as any)?.display_name || (userRow as any)?.contact || "Someone";

    // Find all leagues this user belongs to
    const leagues = await db`
      SELECT league_id FROM league_members WHERE user_id = ${userId}
      UNION
      SELECT id AS league_id FROM leagues WHERE created_by = ${userId}
    `;

    if (!leagues.length) return;

    const message = `🏎️ ${displayName} locked in their picks for ${raceName}`;

    const rows = (leagues as any[]).map((l: any) => ({
      league_id: l.league_id,
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
