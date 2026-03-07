import { expect, test, describe, beforeAll, afterAll, mock } from "bun:test";
import { db } from "../db/index.ts";
import { createMockUser } from "../__tests__/setup.ts";

let mockUserContext: any = null;

mock.module("../middleware/auth.ts", () => ({
  withAuth: (handler: any) => async (req: Request) => {
    if (!mockUserContext) return Response.json({ error: "Unauthorized" }, { status: 401 });
    (req as any).user = mockUserContext;
    return handler(req);
  },
  parseBody: async (req: Request, schema: any) => {
    try {
      const body = await req.json();
      const parsed = schema.safeParse(body);
      if (!parsed.success) return { error: Response.json({ error: "Invalid body" }, { status: 400 }) };
      return { data: parsed.data };
    } catch {
      return { error: Response.json({ error: "Invalid JSON" }, { status: 400 }) };
    }
  }
}));

const { submitPick, getPickForRace } = await import("./picks.ts");

describe("Picks Integration Tests", () => {
  let member: any;
  let nonMember: any;
  let leagueId: string;
  let openRaceId = 99991;
  let closedRaceId = 99992;
  let midEventRaceId = 99993;
  let sprintWeekendRaceId = 99994;

  beforeAll(async () => {
    member = await createMockUser({ display_name: "Member User" } as any);
    nonMember = await createMockUser({ display_name: "Non Member" } as any);
    leagueId = crypto.randomUUID();

    // Create a league and add member
    await db`
      INSERT INTO leagues (id, name, created_by, invite_code, scoring_config)
      VALUES (${leagueId}, 'Test Picks League', ${member.id}, 'PCK123', '{}'::jsonb)
    `;
    await db`
      INSERT INTO league_members (league_id, user_id)
      VALUES (${leagueId}, ${member.id})
    `;

    // Create a race with Future deadlines
    await db`
      INSERT INTO races (id, name, date, has_sprint, status, sprint_deadline, race_deadline)
      VALUES (
        ${openRaceId}, 
        'Open Test Race', 
        NOW() + INTERVAL '10 days', 
        true, 
        'UPCOMING', 
        NOW() + INTERVAL '5 days', 
        NOW() + INTERVAL '7 days'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Create a race with Past deadlines
    await db`
      INSERT INTO races (id, name, date, has_sprint, status, sprint_deadline, race_deadline)
      VALUES (
        ${closedRaceId}, 
        'Closed Test Race', 
        NOW() - INTERVAL '1 days', 
        true, 
        'UPCOMING', 
        NOW() - INTERVAL '5 days', 
        NOW() - INTERVAL '3 days'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Create a race where Qualifying has passed but Race hasn't
    await db`
      INSERT INTO races (id, name, date, has_sprint, status, race_quali_date, race_deadline)
      VALUES (
        ${midEventRaceId}, 
        'Mid Event Race', 
        NOW() + INTERVAL '2 days', 
        false, 
        'UPCOMING', 
        NOW() - INTERVAL '1 hours', 
        NOW() + INTERVAL '1 days'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Create a Sprint Weekend Race for 4-step sequence verification
    await db`
      INSERT INTO races (id, name, date, has_sprint, status, sprint_quali_date, sprint_deadline, race_quali_date, race_deadline)
      VALUES (
        ${sprintWeekendRaceId}, 
        'Sprint Weekend Race', 
        NOW() + INTERVAL '10 days', 
        true, 
        'UPCOMING', 
        NOW() + INTERVAL '1 days', 
        NOW() + INTERVAL '2 days', 
        NOW() + INTERVAL '3 days', 
        NOW() + INTERVAL '4 days'
      )
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    // Cleanup
    await db`DELETE FROM picks WHERE race_id IN (${openRaceId}, ${closedRaceId}, ${midEventRaceId}, ${sprintWeekendRaceId})`;
    await db`DELETE FROM races WHERE id IN (${openRaceId}, ${closedRaceId}, ${midEventRaceId}, ${sprintWeekendRaceId})`;
    await db`DELETE FROM league_members WHERE league_id = ${leagueId}`;
    await db`DELETE FROM leagues WHERE id = ${leagueId}`;
  });

  test("submitPick allows member to submit for open race", async () => {
    mockUserContext = member;
    const req = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: openRaceId,
        leagueId,
        selections: {
          raceP1: "VER",
          sprintP1: "LEC" // Allowed because sprint deadline hasn't passed
        }
      })
    });

    const res = await submitPick(req);
    expect(res.status).toBe(201);

    const data: any = await res.json();
    expect(data.race_p1).toBe("VER");
    expect(data.sprint_p1).toBe("LEC");
  });

  test("submitPick rejects duplicate podium picks", async () => {
    mockUserContext = member;
    const req = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: openRaceId,
        leagueId,
        selections: {
          raceP1: "VER",
          raceP2: "VER" // Duplicate podium
        }
      })
    });

    const res = await submitPick(req);
    expect(res.status).toBe(400); // Zod validation failure
    const data: any = await res.json();
    expect(data.error).toBe("Invalid body");
  });

  test("submitPick allows same driver for pole, podium, fastest lap, and dnf", async () => {
    mockUserContext = member;
    const req = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: openRaceId,
        leagueId,
        selections: {
          raceQualifyingP1: "VER",
          raceP1: "VER",
          fastestLap: "VER",
          firstDnf: "VER"
        }
      })
    });

    const res = await submitPick(req);
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.race_qualifying_p1).toBe("VER");
    expect(data.race_p1).toBe("VER");
    expect(data.fastest_lap).toBe("VER");
    expect(data.first_dnf).toBe("VER");
  });

  test("submitPick rejects submission from non-member", async () => {
    mockUserContext = nonMember;
    const req = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({ raceId: openRaceId, leagueId, selections: { raceP1: "VER" } })
    });

    const res = await submitPick(req);
    expect(res.status).toBe(403);
  });

  test("submitPick rejects sprint pick if sprint deadline passed", async () => {
    mockUserContext = member;
    const req = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: closedRaceId,
        leagueId,
        selections: { sprintP1: "LEC" }
      })
    });

    const res = await submitPick(req);
    expect(res.status).toBe(422);
  });

  test("submitPick rejects race pick if race deadline passed", async () => {
    mockUserContext = member;
    const req = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: closedRaceId,
        leagueId,
        selections: { raceP1: "VER" } // Only race pick
      })
    });

    const res = await submitPick(req);
    expect(res.status).toBe(422);
  });

  test("getPickForRace returns the saved pick", async () => {
    mockUserContext = member;
    // We need to set the param via Bun router usually, but here req is parsed by our route manually reading req.params.
    // Wait, the route gets req.params! The `req.params.raceId` is injected by Bun's router.
    // If we call the handler directly, `req.params` won't exist.
    // The route is:
    // export const getPickForRace = withAuth(async (req) => { ... req.params.raceId; ... });
    // So we must manually mock `req.params`.
    const req = new Request(`http://localhost/api/v1/picks/race/${openRaceId}?leagueId=${leagueId}`) as any;
    req.params = { raceId: openRaceId.toString() };

    const res = await getPickForRace(req);
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.race_p1).toBe("VER");
  });

  test("submitPick allows race picks but rejects quali picks when quali has passed", async () => {
    mockUserContext = member;

    // 1. Try to submit both -> should fail because of quali
    const req1 = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: midEventRaceId,
        leagueId,
        selections: {
          raceQualifyingP1: "VER",
          raceP1: "LEC"
        }
      })
    });
    const res1 = await submitPick(req1);
    expect(res1.status).toBe(422);
    const data1: any = await res1.json();
    expect(data1.error).toBe("The deadline for qualifying picks has passed.");

    // 2. Try to submit only race picks -> should succeed
    const req2 = new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: midEventRaceId,
        leagueId,
        selections: {
          raceP1: "LEC",
          raceP2: "SAI",
          raceP3: "HAM"
        }
      })
    });
    const res2 = await submitPick(req2);
    expect(res2.status).toBe(201);
    const data2: any = await res2.json();
    expect(data2.race_p1).toBe("LEC");
    expect(data2.race_qualifying_p1).toBeNull();
  });

  test("submitPick follows 4-step sprint weekend sequence with smart enforcement", async () => {
    mockUserContext = member;

    // Step 0: All open - submit Sprint Quali
    const res0 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: { sprintQualifyingP1: "VER" }
      })
    }));
    expect(res0.status).toBe(201);

    // Step 1: Sprint Quali passes. 
    // Modify race data to make sprint_quali_date in the past
    await db`UPDATE races SET sprint_quali_date = NOW() - INTERVAL '1 hours' WHERE id = ${sprintWeekendRaceId}`;

    // Submitting unchanged Sprint Quali + new Sprint Pick should WORK (Smart Enforcement)
    const res1 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: {
          sprintQualifyingP1: "VER", // Unchanged, locked
          sprintP1: "LEC" // New, open
        }
      })
    }));
    expect(res1.status).toBe(201);

    // Submitting CHANGED Sprint Quali should FAIL
    const res2 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: { sprintQualifyingP1: "HAM" }
      })
    }));
    expect(res2.status).toBe(422);
    expect(((await res2.json()) as any).error).toContain("sprint qualifying");

    // Step 2: Sprint deadline passes
    await db`UPDATE races SET sprint_deadline = NOW() - INTERVAL '1 hours' WHERE id = ${sprintWeekendRaceId}`;

    // Changing Sprint P1 should FAIL
    const res3 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: { sprintP1: "VER" }
      })
    }));
    expect(res3.status).toBe(422);
    expect(((await res3.json()) as any).error).toContain("sprint picks");

    // Adding Race Quali should WORK (even if sending existing locked sprint picks)
    const res4 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: {
          sprintQualifyingP1: "VER",
          sprintP1: "LEC",
          raceQualifyingP1: "NOR"
        }
      })
    }));
    expect(res4.status).toBe(201);

    // Step 3: Race Quali passes
    await db`UPDATE races SET race_quali_date = NOW() - INTERVAL '1 hours' WHERE id = ${sprintWeekendRaceId}`;

    // Changing Race Quali should FAIL
    const res5 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: { raceQualifyingP1: "VER" }
      })
    }));
    expect(res5.status).toBe(422);

    // Updating Race P1 should WORK
    const res6 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: {
          raceQualifyingP1: "NOR",
          raceP1: "HAM"
        }
      })
    }));
    expect(res6.status).toBe(201);

    // Step 4: Race Deadline passes
    await db`UPDATE races SET race_deadline = NOW() - INTERVAL '1 hours' WHERE id = ${sprintWeekendRaceId}`;

    // Changing Race P1 should FAIL
    const res7 = await submitPick(new Request("http://localhost/api/v1/picks", {
      method: "POST",
      body: JSON.stringify({
        raceId: sprintWeekendRaceId,
        leagueId,
        selections: { raceP1: "VER" }
      })
    }));
    expect(res7.status).toBe(422);
  });
});
