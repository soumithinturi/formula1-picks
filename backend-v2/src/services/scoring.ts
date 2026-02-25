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

  // Race picks
  if (config.quali.enabled && userPick.raceQualifyingP1 && userPick.raceQualifyingP1 === officialResults.raceQualifyingP1)
    score += config.quali.points;

  if (config.p1.enabled && userPick.raceP1 && userPick.raceP1 === officialResults.raceP1)
    score += config.p1.points;

  if (config.p2.enabled && userPick.raceP2 && userPick.raceP2 === officialResults.raceP2)
    score += config.p2.points;

  if (config.p3.enabled && userPick.raceP3 && userPick.raceP3 === officialResults.raceP3)
    score += config.p3.points;

  if (config.fastestLap.enabled && userPick.fastestLap && userPick.fastestLap === officialResults.fastestLap)
    score += config.fastestLap.points;

  if (config.firstDNF.enabled && userPick.firstDnf && userPick.firstDnf === officialResults.firstDnf)
    score += config.firstDNF.points;

  // Bonus: Perfect Order
  const hasPerfectOrder =
    userPick.raceP1 &&
    userPick.raceP2 &&
    userPick.raceP3 &&
    userPick.raceP1 === officialResults.raceP1 &&
    userPick.raceP2 === officialResults.raceP2 &&
    userPick.raceP3 === officialResults.raceP3;

  if (config.perfectOrder.enabled && hasPerfectOrder) {
    score += config.perfectOrder.points;
  }

  // Bonus: Podium (Any driver in top 3 predicted in any top 3 position)
  if (config.podium.enabled) {
    const officialTop3 = [officialResults.raceP1, officialResults.raceP2, officialResults.raceP3].filter(Boolean);
    const userTop3 = [userPick.raceP1, userPick.raceP2, userPick.raceP3].filter(Boolean);

    let podiumMatches = 0;
    for (const driver of userTop3) {
      if (driver && officialTop3.includes(driver)) {
        podiumMatches++;
      }
    }
    // E.g. 1 point for each correct podium driver, or flat bonus? The UI implies points per driver since it's "Points awarded for any driver who finishes in the top 3"
    score += podiumMatches * config.podium.points;
  }

  return score;
}
