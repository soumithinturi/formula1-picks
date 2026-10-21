import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { db } from "../db/index.ts";
import { api, createMockUser, createTestRace, deleteMockUsers, deleteTestRaces } from "../__tests__/setup.ts";
import { DEFAULT_SCORING_CONFIG } from "../types/index.ts";

describe("Admin & Leaderboard Integration Tests", () => {
  let adminUser: any;
  let player1: any;
  let player2: any;
  let outsider: any;
  let leagueId: string;
  const raceId = 99981;

  const submit = (user: any, results: Record<string, string>) =>
    api("/api/v1/admin/results", { user, body: { raceId, results } });

  beforeAll(async () => {
    adminUser = await createMockUser({ role: "ADMIN" });
    player1 = await createMockUser();
    player2 = await createMockUser();
    outsider = await createMockUser();
    leagueId = crypto.randomUUID();

    await db`
      INSERT INTO leagues (id, name, created_by, invite_code, scoring_config)
      VALUES (${leagueId}, 'Admin Test League', ${adminUser.id}, ${"ADM" + Date.now()}, ${JSON.stringify(DEFAULT_SCORING_CONFIG)}::jsonb)
    `;
    await db`INSERT INTO league_members (league_id, user_id) VALUES (${leagueId}, ${player1.id})`;
    await db`INSERT INTO league_members (league_id, user_id) VALUES (${leagueId}, ${player2.id})`;

    await createTestRace(raceId, { name: "Score Test Race", date: new Date(), has_sprint: false });

    // Player 1 picks correctly, player 2 doesn't
    await db`
      INSERT INTO picks (user_id, race_id, league_id, total_points, submitted_at, race_p1, fastest_lap)
      VALUES (${player1.id}, ${raceId}, ${leagueId}, 0, NOW(), 'VER', 'VER')
    `;
    await db`
      INSERT INTO picks (user_id, race_id, league_id, total_points, submitted_at, race_p1, fastest_lap)
      VALUES (${player2.id}, ${raceId}, ${leagueId}, 0, NOW(), 'NOR', 'LEC')
    `;
  });

  afterAll(async () => {
    await deleteTestRaces(raceId);
    await db`DELETE FROM leagues WHERE id = ${leagueId}`;
    await deleteMockUsers(adminUser, player1, player2, outsider);
  });

  const resultsInCount = async () => {
    const rows = await db`
      SELECT 1 FROM notifications WHERE type = 'RESULTS_IN' AND metadata->>'raceId' = ${String(raceId)}
    `;
    return rows.length;
  };

  test("submitResults calculates points and marks race completed", async () => {
    const res = await submit(adminUser, { raceP1: "VER", fastestLap: "VER" });
    expect(res.status).toBe(200);

    const [race] = await db`SELECT status FROM races WHERE id = ${raceId}`;
    expect(race.status).toBe("COMPLETED");

    const [p1Pick] = await db`SELECT total_points FROM picks WHERE user_id = ${player1.id} AND race_id = ${raceId}`;
    expect(p1Pick.total_points).toBeGreaterThan(0);

    const [p2Pick] = await db`SELECT total_points FROM picks WHERE user_id = ${player2.id} AND race_id = ${raceId}`;
    expect(p2Pick.total_points).toBe(0);

    expect(await resultsInCount()).toBe(2); // one per player
  });

  test("resubmitting keeps saved fields and does not notify again", async () => {
    // Only a corrected fastest lap: raceP1 saved earlier must survive
    const res = await submit(adminUser, { fastestLap: "NOR" });
    expect(res.status).toBe(200);

    const [saved] = await db`SELECT race_p1, fastest_lap FROM race_results WHERE race_id = ${raceId}`;
    expect(saved.race_p1).toBe("VER");
    expect(saved.fastest_lap).toBe("NOR");

    expect(await resultsInCount()).toBe(2);
  });

  test("submitResults rejects non-admin users", async () => {
    const res = await submit(player1, { raceP1: "VER" });
    expect(res.status).toBe(403);
  });

  test("getLeaderboard returns sorted rankings without contact details", async () => {
    const res = await api(`/api/v1/leaderboard/${leagueId}`, { user: player1 });
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.length).toBe(2);

    // Player 1 has the points (VER podium pick; fastest lap changed to NOR in the correction)
    expect(data[0].userId).toBe(player1.id);
    expect(data[0].totalPoints).toBeGreaterThan(0);
    expect(data[1].userId).toBe(player2.id);

    expect(data[0]).not.toHaveProperty("contact");
  });

  test("getLeaderboard rejects non-members", async () => {
    const res = await api(`/api/v1/leaderboard/${leagueId}`, { user: outsider });
    expect(res.status).toBe(403);
  });
});
