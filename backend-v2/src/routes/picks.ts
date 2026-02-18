import { db } from "../db/index.ts";
import { withAuth, parseBody } from "../middleware/auth.ts";
import { PickSubmissionSchema, type PickRow, type RaceRow } from "../types/index.ts";

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
  const hasSprintPicks = sel.sprintQualifyingP1 || sel.sprintP1 || sel.sprintP2 || sel.sprintP3;
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
      sprint_qualifying_p1, sprint_p1, sprint_p2, sprint_p3,
      race_qualifying_p1, race_p1, race_p2, race_p3,
      fastest_lap, first_dnf
    ) VALUES (
      ${req.user.id}, ${data.raceId}, ${data.leagueId}, 0, NOW(),
      ${sel.sprintQualifyingP1 ?? null}, ${sel.sprintP1 ?? null},
      ${sel.sprintP2 ?? null}, ${sel.sprintP3 ?? null},
      ${sel.raceQualifyingP1 ?? null}, ${sel.raceP1 ?? null},
      ${sel.raceP2 ?? null}, ${sel.raceP3 ?? null},
      ${sel.fastestLap ?? null}, ${sel.firstDnf ?? null}
    )
    ON CONFLICT (user_id, race_id, league_id) DO UPDATE SET
      sprint_qualifying_p1 = EXCLUDED.sprint_qualifying_p1,
      sprint_p1 = EXCLUDED.sprint_p1,
      sprint_p2 = EXCLUDED.sprint_p2,
      sprint_p3 = EXCLUDED.sprint_p3,
      race_qualifying_p1 = EXCLUDED.race_qualifying_p1,
      race_p1 = EXCLUDED.race_p1,
      race_p2 = EXCLUDED.race_p2,
      race_p3 = EXCLUDED.race_p3,
      fastest_lap = EXCLUDED.fastest_lap,
      first_dnf = EXCLUDED.first_dnf,
      submitted_at = NOW()
    RETURNING *
  `;

  return Response.json(savedPick, { status: 201 });
});
