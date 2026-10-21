import { expect, test, describe } from "bun:test";
import { findFirstDnf, sessionTime } from "./cron.ts";

const r = (driverId: string, status: string, laps: string) => ({ status, laps, Driver: { driverId } });

describe("findFirstDnf", () => {
  test("returns null when everyone is classified, including lapped cars", () => {
    expect(findFirstDnf([r("a", "Finished", "57"), r("b", "+1 Lap", "56"), r("c", "+2 Laps", "55")])).toBeNull();
  });

  test("returns the driver who retired on the fewest laps", () => {
    const results = [r("a", "Finished", "57"), r("b", "Engine", "30"), r("c", "Collision", "12"), r("d", "+1 Lap", "56")];
    expect(findFirstDnf(results)).toBe("c");
  });

  test("ignores disqualified and did-not-start", () => {
    expect(findFirstDnf([r("a", "Disqualified", "57"), r("b", "Did not start", "0"), r("c", "Finished", "57")])).toBeNull();
  });
});

describe("sessionTime", () => {
  test("joins date and time, defaults to midnight UTC, and passes through missing sessions", () => {
    expect(sessionTime({ date: "2027-03-15", time: "04:00:00Z" })).toBe("2027-03-15T04:00:00Z");
    expect(sessionTime({ date: "2027-03-15" })).toBe("2027-03-15T00:00:00Z");
    expect(sessionTime(undefined)).toBeNull();
  });
});
