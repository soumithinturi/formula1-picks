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
  });

  afterAll(async () => {
    // Cleanup
    await db`DELETE FROM picks WHERE race_id IN (${openRaceId}, ${closedRaceId})`;
    await db`DELETE FROM races WHERE id IN (${openRaceId}, ${closedRaceId})`;
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
});
