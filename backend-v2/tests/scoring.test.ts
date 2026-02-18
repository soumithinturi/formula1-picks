import { describe, it, expect } from "bun:test";
import { calculatePoints } from "../src/services/scoring.ts";
import { DEFAULT_SCORING_CONFIG, type PickSelections, type ScoringConfig } from "../src/types/index.ts";

const EMPTY_PICK: PickSelections = {};

const FULL_RESULT: PickSelections = {
  sprintQualifyingP1: "VER",
  sprintP1: "VER",
  sprintP2: "NOR",
  sprintP3: "PIA",
  raceQualifyingP1: "VER",
  raceP1: "VER",
  raceP2: "NOR",
  raceP3: "PIA",
  fastestLap: "HAM",
  firstDnf: "ALO",
};

describe("calculatePoints", () => {
  it("returns 0 for an empty pick", () => {
    expect(calculatePoints(EMPTY_PICK, FULL_RESULT)).toBe(0);
  });

  it("returns 0 when all picks are wrong", () => {
    const wrongPick: PickSelections = {
      sprintQualifyingP1: "HAM",
      sprintP1: "HAM",
      sprintP2: "HAM",
      sprintP3: "HAM",
      raceQualifyingP1: "HAM",
      raceP1: "HAM",
      raceP2: "HAM",
      raceP3: "HAM",
      fastestLap: "VER",
      firstDnf: "NOR",
    };
    expect(calculatePoints(wrongPick, FULL_RESULT)).toBe(0);
  });

  it("returns max score (23) for a perfect pick with default config", () => {
    // Max = 1+5+3+1 (sprint) + 1+5+3+1+1+2 (race) = 23
    expect(calculatePoints(FULL_RESULT, FULL_RESULT)).toBe(23);
  });

  it("returns correct partial score (race P1 + fastest lap = 6)", () => {
    const partialPick: PickSelections = {
      raceP1: "VER",
      fastestLap: "HAM",
    };
    expect(calculatePoints(partialPick, FULL_RESULT)).toBe(6); // 5 + 1
  });

  it("uses custom scoring config from league", () => {
    const customConfig: ScoringConfig = {
      ...DEFAULT_SCORING_CONFIG,
      raceP1: 10, // doubled
      firstDnf: 5, // increased
    };
    const pick: PickSelections = {
      raceP1: "VER",
      firstDnf: "ALO",
    };
    expect(calculatePoints(pick, FULL_RESULT, customConfig)).toBe(15); // 10 + 5
  });

  it("only scores sprint picks for sprint weekends", () => {
    const sprintOnlyPick: PickSelections = {
      sprintP1: "VER",
      sprintP2: "NOR",
    };
    expect(calculatePoints(sprintOnlyPick, FULL_RESULT)).toBe(8); // 5 + 3
  });
});
