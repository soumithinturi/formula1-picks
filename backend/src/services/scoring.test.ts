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

    // P1: 5, P2: 3, P3: 1, Quali: 1, Fastest Lap: 1 === 11 points
    // Podium Bonus (every driver matched exactly + perfect order):
    // 3 drivers * 10 points = +30 points
    // Perfect Order = +15 points
    // Total = 11 + 30 + 15 = 56

    let expected = 0;
    expected += 5; // P1
    expected += 3; // P2
    expected += 1; // P3
    expected += 1; // Quali
    expected += 1; // FL
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

  test("handles null or undefined config safely", () => {
    const pick = { ...defaultResults };
    const scoreNull = calculatePoints(pick, defaultResults, null);
    const scoreUndef = calculatePoints(pick, defaultResults, undefined);
    expect(scoreNull.score).toBe(56);
    expect(scoreUndef.score).toBe(56);
  });

  test("handles partial custom scoring config safely", () => {
    const partialConfig = {
      p1: { enabled: true, points: 20 },
    } as any;
    const pick: PickSelections = { raceP1: "VER" };
    const score = calculatePoints(pick, defaultResults, partialConfig);
    // P1 (20) + Podium match (10) = 30
    expect(score.score).toBe(30);
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

  test("calculates sprint perfect score correctly", () => {
    const sprintResults: PickSelections = {
      ...defaultResults,
      sprintQualifyingP1: "VER",
      sprintP1: "VER",
      sprintP2: "NOR",
      sprintP3: "LEC",
      sprintFastestLap: "VER",
    };
    const pick = { ...sprintResults };
    const score = calculatePoints(pick, sprintResults, DEFAULT_SCORING_CONFIG);

    // Race perfect: 56
    // Sprint perfect:
    // Sprint Quali: 1
    // Sprint P1: 5, P2: 3, P3: 1
    // Sprint FL: 1
    // Sprint Podium Bonus: 3 * 10 = 30
    // Sprint Perfect Order: 15
    // Sprint Total = 1 + 5 + 3 + 1 + 1 + 30 + 15 = 56
    // Overall = 112
    expect(score.score).toBe(112);
  });
});
