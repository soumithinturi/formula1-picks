import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { db } from "../db/index.ts";
import { api, createMockUser, createTestRace, deleteMockUsers, deleteTestRaces } from "../__tests__/setup.ts";

const HOUR = 36e5;
const DAY = 24 * HOUR;
const from = (ms: number) => new Date(Date.now() + ms);

describe("Picks Integration Tests", () => {
  let member: any;
  let nonMember: any;
  let leagueId: string;
  const openRaceId = 99991;
  const closedRaceId = 99992;
  const midEventRaceId = 99993;
  const sprintWeekendRaceId = 99994;

  const pick = (user: any, raceId: number, selections: Record<string, string>) =>
    api("/api/v1/picks", { user, body: { raceId, leagueId, selections } });

  beforeAll(async () => {
    member = await createMockUser();
    nonMember = await createMockUser();
    leagueId = crypto.randomUUID();

    await db`
      INSERT INTO leagues (id, name, created_by, invite_code, scoring_config)
      VALUES (${leagueId}, 'Test Picks League', ${member.id}, ${"PCK" + Date.now()}, '{}'::jsonb)
    `;
    await db`INSERT INTO league_members (league_id, user_id) VALUES (${leagueId}, ${member.id})`;

    await createTestRace(openRaceId, {
      name: "Open Test Race", date: from(10 * DAY), has_sprint: true,
      sprint_deadline: from(5 * DAY), race_deadline: from(7 * DAY),
    });
    // Past deadlines
    await createTestRace(closedRaceId, {
      name: "Closed Test Race", date: from(-DAY), has_sprint: true,
      sprint_deadline: from(-5 * DAY), race_deadline: from(-3 * DAY),
    });
    // Qualifying has passed but the race hasn't
    await createTestRace(midEventRaceId, {
      name: "Mid Event Race", date: from(2 * DAY), has_sprint: false,
      race_quali_date: from(-HOUR), race_deadline: from(DAY),
    });
    // Sprint weekend for the 4-step sequence
    await createTestRace(sprintWeekendRaceId, {
      name: "Sprint Weekend Race", date: from(10 * DAY), has_sprint: true,
      sprint_quali_date: from(DAY), sprint_deadline: from(2 * DAY),
      race_quali_date: from(3 * DAY), race_deadline: from(4 * DAY),
    });
  });

  afterAll(async () => {
    await deleteTestRaces(openRaceId, closedRaceId, midEventRaceId, sprintWeekendRaceId);
    await db`DELETE FROM chat_messages WHERE league_id = ${leagueId}`;
    await db`DELETE FROM leagues WHERE id = ${leagueId}`;
    await deleteMockUsers(member, nonMember);
  });

  test("submitPick allows member to submit for open race", async () => {
    const res = await pick(member, openRaceId, { raceP1: "VER", sprintP1: "LEC" }); // sprint deadline not passed
    expect(res.status).toBe(201);

    const data: any = await res.json();
    expect(data.race_p1).toBe("VER");
    expect(data.sprint_p1).toBe("LEC");
  });

  test("submitPick rejects duplicate podium picks", async () => {
    const res = await pick(member, openRaceId, { raceP1: "VER", raceP2: "VER" });
    expect(res.status).toBe(400); // Zod validation failure
    const data: any = await res.json();
    expect(data.error).toBeDefined();
  });

  test("submitPick allows same driver for pole, podium, fastest lap, and dnf", async () => {
    const res = await pick(member, openRaceId, {
      raceQualifyingP1: "VER", raceP1: "VER", fastestLap: "VER", firstDnf: "VER",
    });
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.race_qualifying_p1).toBe("VER");
    expect(data.race_p1).toBe("VER");
    expect(data.fastest_lap).toBe("VER");
    expect(data.first_dnf).toBe("VER");
  });

  test("submitPick rejects submission from non-member", async () => {
    const res = await pick(nonMember, openRaceId, { raceP1: "VER" });
    expect(res.status).toBe(403);
  });

  test("submitPick rejects unauthenticated requests", async () => {
    const res = await api("/api/v1/picks", { body: { raceId: openRaceId, leagueId, selections: { raceP1: "VER" } } });
    expect(res.status).toBe(401);
  });

  test("submitPick rejects sprint pick if sprint deadline passed", async () => {
    const res = await pick(member, closedRaceId, { sprintP1: "LEC" });
    expect(res.status).toBe(422);
  });

  test("submitPick rejects race pick if race deadline passed", async () => {
    const res = await pick(member, closedRaceId, { raceP1: "VER" });
    expect(res.status).toBe(422);
  });

  test("getPickForRace returns the saved pick", async () => {
    const res = await api(`/api/v1/picks/race/${openRaceId}?leagueId=${leagueId}`, { user: member });
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.race_p1).toBe("VER");
  });

  test("submitPick allows race picks but rejects quali picks when quali has passed", async () => {
    // Both together fail because of quali
    const res1 = await pick(member, midEventRaceId, { raceQualifyingP1: "VER", raceP1: "LEC" });
    expect(res1.status).toBe(422);
    expect(((await res1.json()) as any).error).toBe("The deadline for qualifying picks has passed.");

    // Race picks alone succeed
    const res2 = await pick(member, midEventRaceId, { raceP1: "LEC", raceP2: "SAI", raceP3: "HAM" });
    expect(res2.status).toBe(201);
    const data2: any = await res2.json();
    expect(data2.race_p1).toBe("LEC");
    expect(data2.race_qualifying_p1).toBeNull();
  });

  test("submitPick follows 4-step sprint weekend sequence with smart enforcement", async () => {
    const id = sprintWeekendRaceId;

    // Step 0: all open
    expect((await pick(member, id, { sprintQualifyingP1: "VER" })).status).toBe(201);

    // Step 1: sprint quali passes
    await db`UPDATE races SET sprint_quali_date = ${from(-HOUR)} WHERE id = ${id}`;

    // Unchanged locked sprint quali + a new sprint pick works (smart enforcement)
    expect((await pick(member, id, { sprintQualifyingP1: "VER", sprintP1: "LEC" })).status).toBe(201);

    // Changing sprint quali fails
    const res2 = await pick(member, id, { sprintQualifyingP1: "HAM" });
    expect(res2.status).toBe(422);
    expect(((await res2.json()) as any).error).toContain("sprint qualifying");

    // Step 2: sprint deadline passes
    await db`UPDATE races SET sprint_deadline = ${from(-HOUR)} WHERE id = ${id}`;

    const res3 = await pick(member, id, { sprintP1: "VER" });
    expect(res3.status).toBe(422);
    expect(((await res3.json()) as any).error).toContain("sprint picks");

    // Adding race quali works even when resending the locked sprint picks
    expect((await pick(member, id, { sprintQualifyingP1: "VER", sprintP1: "LEC", raceQualifyingP1: "NOR" })).status).toBe(201);

    // Step 3: race quali passes
    await db`UPDATE races SET race_quali_date = ${from(-HOUR)} WHERE id = ${id}`;

    expect((await pick(member, id, { raceQualifyingP1: "VER" })).status).toBe(422);
    expect((await pick(member, id, { raceQualifyingP1: "NOR", raceP1: "HAM" })).status).toBe(201);

    // Step 4: race deadline passes
    await db`UPDATE races SET race_deadline = ${from(-HOUR)} WHERE id = ${id}`;

    expect((await pick(member, id, { raceP1: "VER" })).status).toBe(422);
  });
});
