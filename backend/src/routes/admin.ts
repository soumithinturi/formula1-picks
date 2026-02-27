import { db } from "../db/index.ts";
import { withAdmin, parseBody } from "../middleware/auth.ts";
import { ResultSubmissionSchema, type PickRow, type LeagueRow, type ScoringConfig } from "../types/index.ts";
import { calculatePoints } from "../services/scoring.ts";
import { createNotificationsForAllPicksInRace } from "../services/notifications.ts";

/**
 * POST /api/v1/admin/results
 * Submits official race results, scores all picks across all leagues, and marks the race as COMPLETED.
 * Protected — ADMIN role required.
 */
export const submitResults = withAdmin(async (req) => {
  const { data, error } = await parseBody(req, ResultSubmissionSchema);
  if (error) return error;

  const results = data.results;

  // 1. Save the official results
  await db`
    INSERT INTO race_results (
      race_id,
      sprint_qualifying_p1, sprint_p1, sprint_p2, sprint_p3,
      race_qualifying_p1, race_p1, race_p2, race_p3,
      fastest_lap, first_dnf
    ) VALUES (
      ${data.raceId},
      ${results.sprintQualifyingP1 ?? null}, ${results.sprintP1 ?? null},
      ${results.sprintP2 ?? null}, ${results.sprintP3 ?? null},
      ${results.raceQualifyingP1 ?? null}, ${results.raceP1 ?? null},
      ${results.raceP2 ?? null}, ${results.raceP3 ?? null},
      ${results.fastestLap ?? null}, ${results.firstDnf ?? null}
    )
    ON CONFLICT (race_id) DO UPDATE SET
      sprint_qualifying_p1 = EXCLUDED.sprint_qualifying_p1,
      sprint_p1 = EXCLUDED.sprint_p1,
      sprint_p2 = EXCLUDED.sprint_p2,
      sprint_p3 = EXCLUDED.sprint_p3,
      race_qualifying_p1 = EXCLUDED.race_qualifying_p1,
      race_p1 = EXCLUDED.race_p1,
      race_p2 = EXCLUDED.race_p2,
      race_p3 = EXCLUDED.race_p3,
      fastest_lap = EXCLUDED.fastest_lap,
      first_dnf = EXCLUDED.first_dnf
  `;

  // 2. Fetch all picks for this race (across all leagues)
  const picks = await db<PickRow[]>`
    SELECT * FROM picks WHERE race_id = ${data.raceId}
  `;

  // 3. Fetch all leagues to get their scoring configs
  const leagues = await db<LeagueRow[]>`
    SELECT id, scoring_config FROM leagues
  `;
  const leagueConfigMap = new Map<string, ScoringConfig>(
    leagues.map((l) => [l.id, l.scoring_config])
  );

  // 4. Score each pick using its league's scoring config
  // Run updates in parallel for performance
  await Promise.all(
    picks.map((pick) => {
      let config = leagueConfigMap.get(pick.league_id);
      if (typeof config === "string") {
        config = JSON.parse(config);
      }
      const userPick = {
        sprintQualifyingP1: pick.sprint_qualifying_p1,
        sprintP1: pick.sprint_p1,
        sprintP2: pick.sprint_p2,
        sprintP3: pick.sprint_p3,
        raceQualifyingP1: pick.race_qualifying_p1,
        raceP1: pick.race_p1,
        raceP2: pick.race_p2,
        raceP3: pick.race_p3,
        fastestLap: pick.fastest_lap,
        firstDnf: pick.first_dnf,
      };
      const points = calculatePoints(userPick, results, config);

      return db`
        UPDATE picks
        SET total_points = ${points.score},
            correct_predictions = ${points.correct},
            total_predictions = ${points.total}
        WHERE id = ${pick.id}
      `;
    })
  );

  // 5. Fan out in-app notifications to all users who picked on this race
  const [race] = await db<{ name: string }[]>`SELECT name FROM races WHERE id = ${data.raceId}`;
  const raceName = race?.name ?? `Race #${data.raceId}`;
  await createNotificationsForAllPicksInRace(
    data.raceId,
    "RESULTS_IN",
    `${raceName} — Results In! 🏁`,
    "The official results have been submitted. Check your score on the leaderboard.",
    { raceId: data.raceId }
  );

  // 6. Mark race as completed
  await db`
    UPDATE races SET status = 'COMPLETED' WHERE id = ${data.raceId}
  `;

  return Response.json({ message: "Results processed successfully" });
});
