import { expect, test, describe, beforeAll, afterAll, mock } from "bun:test";
import { db } from "../db/index.ts";
import { createMockUser } from "../__tests__/setup.ts";
import { DEFAULT_SCORING_CONFIG } from "../types/index.ts";

let mockUserContext: any = null;

mock.module("../middleware/auth.ts", () => ({
  withAuth: (handler: any) => async (req: Request) => {
    if (!mockUserContext) return Response.json({ error: "Unauthorized" }, { status: 401 });
    (req as any).user = mockUserContext;
    return handler(req);
  },
  withAdmin: (handler: any) => async (req: Request) => {
    if (!mockUserContext || mockUserContext.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
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

const { submitResults } = await import("./admin.ts");
const { getLeaderboard } = await import("./leaderboard.ts");

describe("Admin & Leaderboard Integration Tests", () => {
  let adminUser: any;
  let player1: any;
  let player2: any;
  let leagueId: string;
  let raceId = 99993;

  beforeAll(async () => {
    adminUser = await createMockUser({ role: "ADMIN", display_name: "Admin" } as any);
    player1 = await createMockUser({ display_name: "Player 1" } as any);
    player2 = await createMockUser({ display_name: "Player 2" } as any);
    leagueId = crypto.randomUUID();

    // Create a league
    await db`
      INSERT INTO leagues (id, name, created_by, invite_code, scoring_config)
      VALUES (${leagueId}, 'Admin Test League', ${adminUser.id}, 'ADM123', ${JSON.stringify(DEFAULT_SCORING_CONFIG)}::jsonb)
    `;

    // Add players to league
    await db`INSERT INTO league_members (league_id, user_id) VALUES (${leagueId}, ${player1.id})`;
    await db`INSERT INTO league_members (league_id, user_id) VALUES (${leagueId}, ${player2.id})`;

    // Create a race
    await db`
      INSERT INTO races (id, name, date, has_sprint, status)
      VALUES (${raceId}, 'Score Test Race', NOW(), false, 'UPCOMING')
      ON CONFLICT (id) DO NOTHING
    `;

    // Create picks for players
    // Player 1 picks perfectly
    await db`
      INSERT INTO picks (user_id, race_id, league_id, total_points, submitted_at, race_p1, fastest_lap)
      VALUES (${player1.id}, ${raceId}, ${leagueId}, 0, NOW(), 'VER', 'VER')
    `;

    // Player 2 picks incorrectly
    await db`
      INSERT INTO picks (user_id, race_id, league_id, total_points, submitted_at, race_p1, fastest_lap)
      VALUES (${player2.id}, ${raceId}, ${leagueId}, 0, NOW(), 'NOR', 'LEC')
    `;
  });

  afterAll(async () => {
    // Cleanup
    await db`DELETE FROM race_results WHERE race_id = ${raceId}`;
    await db`DELETE FROM picks WHERE race_id = ${raceId}`;
    await db`DELETE FROM races WHERE id = ${raceId}`;
    await db`DELETE FROM league_members WHERE league_id = ${leagueId}`;
    await db`DELETE FROM leagues WHERE id = ${leagueId}`;
  });

  test("submitResults calculates points and marks race completed", async () => {
    mockUserContext = adminUser;

    const req = new Request("http://localhost/api/v1/admin/results", {
      method: "POST",
      body: JSON.stringify({
        raceId,
        results: {
          raceP1: "VER",
          fastestLap: "VER"
        }
      })
    });

    const res = await submitResults(req);
    expect(res.status).toBe(200);

    // Verify race is completed
    const [race] = await db`SELECT status FROM races WHERE id = ${raceId}`;
    expect(race.status).toBe("COMPLETED");

    // Verify pick points were updated
    const [p1Pick] = await db`SELECT total_points FROM picks WHERE user_id = ${player1.id} AND race_id = ${raceId}`;
    expect(p1Pick.total_points).toBeGreaterThan(0); // Perfect pick

    const [p2Pick] = await db`SELECT total_points FROM picks WHERE user_id = ${player2.id} AND race_id = ${raceId}`;
    expect(p2Pick.total_points).toBe(0); // Incorrect pick
  });

  test("submitResults rejects non-admin users", async () => {
    mockUserContext = player1; // Not an admin

    const req = new Request("http://localhost/api/v1/admin/results", {
      method: "POST",
      body: JSON.stringify({ raceId, results: { raceP1: "VER" } })
    });

    const res = await submitResults(req);
    expect(res.status).toBe(403);
  });

  test("getLeaderboard returns correctly sorted rankings", async () => {
    mockUserContext = player1;

    const req = new Request(`http://localhost/api/v1/leaderboard/${leagueId}`) as any;
    req.params = { leagueId };

    const res = await getLeaderboard(req);
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.length).toBe(2);

    // Player 1 should be first because they scored points
    expect(data[0].userId).toBe(player1.id);
    expect(data[0].totalPoints).toBeGreaterThan(0);

    // Player 2 should be second because they scored 0
    expect(data[1].userId).toBe(player2.id);
    expect(data[1].totalPoints).toBe(0);
  });

  test("getLeaderboard rejects non-members", async () => {
    const randomUser = await createMockUser();
    mockUserContext = randomUser;

    const req = new Request(`http://localhost/api/v1/leaderboard/${leagueId}`) as any;
    req.params = { leagueId };

    const res = await getLeaderboard(req);
    expect(res.status).toBe(403);
  });
});
