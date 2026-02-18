import type { ScoringConfig, PickSelections } from "../types/index.ts";
import { DEFAULT_SCORING_CONFIG } from "../types/index.ts";

/**
 * Calculates the total points for a user's pick against the official results.
 * Uses the league's custom scoring config (falls back to defaults if not provided).
 *
 * This is a pure function — no DB calls, fully unit-testable.
 */
export function calculatePoints(
  userPick: PickSelections,
  officialResults: PickSelections,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  let score = 0;

  // Sprint picks
  if (userPick.sprintQualifyingP1 && userPick.sprintQualifyingP1 === officialResults.sprintQualifyingP1)
    score += config.sprintQualifyingP1;
  if (userPick.sprintP1 && userPick.sprintP1 === officialResults.sprintP1)
    score += config.sprintP1;
  if (userPick.sprintP2 && userPick.sprintP2 === officialResults.sprintP2)
    score += config.sprintP2;
  if (userPick.sprintP3 && userPick.sprintP3 === officialResults.sprintP3)
    score += config.sprintP3;

  // Race picks
  if (userPick.raceQualifyingP1 && userPick.raceQualifyingP1 === officialResults.raceQualifyingP1)
    score += config.raceQualifyingP1;
  if (userPick.raceP1 && userPick.raceP1 === officialResults.raceP1)
    score += config.raceP1;
  if (userPick.raceP2 && userPick.raceP2 === officialResults.raceP2)
    score += config.raceP2;
  if (userPick.raceP3 && userPick.raceP3 === officialResults.raceP3)
    score += config.raceP3;
  if (userPick.fastestLap && userPick.fastestLap === officialResults.fastestLap)
    score += config.fastestLap;
  if (userPick.firstDnf && userPick.firstDnf === officialResults.firstDnf)
    score += config.firstDnf;

  return score;
}
