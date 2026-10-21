import type { Sql } from "../db/index.ts";
import type { LeagueRow, PickRow, PickSelections } from "../types/index.ts";
import { calculatePoints, parseScoringConfig } from "./scoring.ts";
import { createNotificationsForAllPicksInRace } from "./notifications.ts";

/** `picks` and `race_results` share the same snake_case result columns. */
export function rowToSelections(row: any): PickSelections {
  return {
    sprintQualifyingP1: row?.sprint_qualifying_p1,
    sprintP1: row?.sprint_p1,
    sprintP2: row?.sprint_p2,
    sprintP3: row?.sprint_p3,
    sprintFastestLap: row?.sprint_fastest_lap,
    raceQualifyingP1: row?.race_qualifying_p1,
    raceP1: row?.race_p1,
    raceP2: row?.race_p2,
    raceP3: row?.race_p3,
    fastestLap: row?.fastest_lap,
    firstDnf: row?.first_dnf,
  };
}

/** Scores every pick for a race (all leagues). Safe to run twice: it only overwrites points. */
export async function scoreRacePicks(db: Sql, raceId: number, official: PickSelections) {
  const picks = await db<PickRow[]>`SELECT * FROM picks WHERE race_id = ${raceId}`;
  const leagues = await db<LeagueRow[]>`SELECT id, scoring_config FROM leagues`;
  const configs = new Map(leagues.map((l) => [l.id, parseScoringConfig(l.scoring_config)]));

  await Promise.all(
    picks.map((pick) => {
      const points = calculatePoints(rowToSelections(pick), official, configs.get(pick.league_id));
      return db`
        UPDATE picks
        SET total_points = ${points.score},
            correct_predictions = ${points.correct},
            total_predictions = ${points.total}
        WHERE id = ${pick.id}
      `;
    })
  );
}

/**
 * Marks the race COMPLETED and sends the "Results In" notifications, once.
 * The status update is the claim: overlapping cron runs or an admin resubmit
 * get `false` and send nothing.
 */
export async function completeRace(db: Sql, raceId: number, title: string, body: string): Promise<boolean> {
  const claimed = await db`
    UPDATE races SET status = 'COMPLETED'
    WHERE id = ${raceId} AND status <> 'COMPLETED'
    RETURNING id
  `;
  if (claimed.length === 0) return false;

  await createNotificationsForAllPicksInRace(db, raceId, "RESULTS_IN", title, body, { raceId });
  return true;
}
