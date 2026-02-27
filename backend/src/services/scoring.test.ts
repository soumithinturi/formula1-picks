import { describe, expect, test } from "bun:test";
import { calculatePoints } from "./scoring.ts";
import { DEFAULT_SCORING_CONFIG, type PickSelections } from "../types/index.ts";

describe("Scoring Logic", () => {
  const defaultResults: PickSelections = {
    raceQualifyingP1: "VER",
    raceP1: "VER",
    raceP2: "NOR",
    raceP3: "LEC",
    fastestLap: "VER",
    firstDnf: "SAR",
  };

  test("calculates perfect score correctly", () => {
    const pick = { ...defaultResults };
    const score = calculatePoints(pick, defaultResults, DEFAULT_SCORING_CONFIG);

    // P1: 5, P2: 3, P3: 1, Quali: 1, Fastest Lap: 5 === 15 points
    // Podium Bonus (every driver matched exactly + perfect order):
    // 3 drivers * 10 points = +30 points
    // Perfect Order = +15 points
    // Total = 15 + 30 + 15 = 60

    let expected = 0;
    expected += 5; // P1
    expected += 3; // P2
    expected += 1; // P3
    expected += 1; // Quali
    expected += 5; // FL
    expected += (3 * 10); // Podium (all 3 in top 3)
    expected += 15; // Perfect order

    expect(score.score).toBe(expected);
  });

  test("calculates score with mixed podium", () => {
    const pick: PickSelections = {
      raceQualifyingP1: "NOR", // 0
      raceP1: "NOR",           // 0
      raceP2: "VER",           // 0
      raceP3: "LEC",           // 1 (matched)
      fastestLap: "LEC",       // 0
    };

    const score = calculatePoints(pick, defaultResults, DEFAULT_SCORING_CONFIG);

    // Base: P3 (1) = 1 point
    // Podium: NOR, VER, LEC are all in official top 3 (VER, NOR, LEC). So 3 drivers * 10 = 30 points
    // Perfect order: No.
    // Total: 1 + 30 = 31
    expect(score.score).toBe(31);
  });

  test("handles empty picks safely", () => {
    const score = calculatePoints({}, defaultResults, DEFAULT_SCORING_CONFIG);
    expect(score.score).toBe(0);
  });

  test("uses custom scoring config correctly", () => {
    const customConfig = { ...DEFAULT_SCORING_CONFIG };
    customConfig.p1 = { enabled: true, points: 25 };
    customConfig.podium = { enabled: false, points: 10 };
    customConfig.perfectOrder = { enabled: false, points: 15 };

    const pick: PickSelections = {
      raceP1: "VER",
    };

    const score = calculatePoints(pick, defaultResults, customConfig);
    expect(score.score).toBe(25);
  });

  test("ignores disabled rules", () => {
    const customConfig = { ...DEFAULT_SCORING_CONFIG };
    customConfig.p1 = { enabled: false, points: 25 };
    customConfig.podium = { enabled: false, points: 10 }; // disable podium to isolate

    const pick: PickSelections = {
      raceP1: "VER",
    };

    const score = calculatePoints(pick, defaultResults, customConfig);
    expect(score.score).toBe(0);
  });
});
