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
): { score: number; correct: number; total: number } {
  let score = 0;
  let correct = 0;
  let total = 0;

  // Helper to count picks
  const checkPick = (userValue: string | null | undefined, officialValue: string | null | undefined, configRule: { enabled: boolean, points: number }) => {
    if (userValue) {
      total++;
      if (userValue === officialValue) {
        correct++;
        if (configRule.enabled) {
          score += configRule.points;
        }
      }
    }
  };

  // Sprint picks
  checkPick(userPick.sprintQualifyingP1, officialResults.sprintQualifyingP1, { enabled: false, points: 0 }); // config has no sprint quali, just count it
  checkPick(userPick.sprintP1, officialResults.sprintP1, { enabled: false, points: 0 }); // config has no sprint podium explicit rules yet, just count it
  checkPick(userPick.sprintP2, officialResults.sprintP2, { enabled: false, points: 0 });
  checkPick(userPick.sprintP3, officialResults.sprintP3, { enabled: false, points: 0 });
  checkPick(userPick.sprintFastestLap, officialResults.sprintFastestLap, config.sprintFastestLap);

  // Race picks
  checkPick(userPick.raceQualifyingP1, officialResults.raceQualifyingP1, config.quali);
  checkPick(userPick.raceP1, officialResults.raceP1, config.p1);
  checkPick(userPick.raceP2, officialResults.raceP2, config.p2);
  checkPick(userPick.raceP3, officialResults.raceP3, config.p3);
  checkPick(userPick.fastestLap, officialResults.fastestLap, config.fastestLap);
  checkPick(userPick.firstDnf, officialResults.firstDnf, config.firstDNF);

  // Bonus: Perfect Order (doesn't add to correct/total, just points)
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
  // Already counted in the "correct" counts above if exactly matching, but podium awards points for being in the top 3 at all
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

  return { score, correct, total };
}

