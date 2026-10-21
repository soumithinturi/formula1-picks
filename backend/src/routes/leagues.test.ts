import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { db } from "../db/index.ts";
import { api, createMockUser, deleteMockUsers } from "../__tests__/setup.ts";

describe("Leagues Integration Tests", () => {
  let user1: any;
  let user2: any;
  let createdLeagueId: string;
  let inviteCode: string;

  beforeAll(async () => {
    user1 = await createMockUser();
    user2 = await createMockUser();
  });

  afterAll(async () => {
    await db`DELETE FROM leagues WHERE created_by = ${user1.id}`; // members and chat cascade
    await deleteMockUsers(user1, user2);
  });

  test("POST /leagues creates a new league", async () => {
    const res = await api("/api/v1/leagues", { user: user1, body: { name: "Test League 1" } });
    expect(res.status).toBe(201);

    const data: any = await res.json();
    expect(data.name).toBe("Test League 1");
    expect(data.created_by).toBe(user1.id);
    expect(data.invite_code).toMatch(/^[A-Z2-9]{8}$/);
    expect(data.scoring_config).toBeDefined();

    createdLeagueId = data.id;
    inviteCode = data.invite_code;

    // Creator is auto-joined
    const [member] = await db`SELECT * FROM league_members WHERE league_id = ${createdLeagueId} AND user_id = ${user1.id}`;
    expect(member).toBeDefined();
  });

  test("GET /leagues lists user leagues", async () => {
    const res = await api("/api/v1/leagues", { user: user1 });
    expect(res.status).toBe(200);

    const data: any = await res.json();
    const league = data.find((l: any) => l.id === createdLeagueId);
    expect(league).toBeDefined();
    expect(league.name).toBe("Test League 1");
  });

  test("GET /leagues/invite/:code returns preview info without login", async () => {
    const res = await api(`/api/v1/leagues/invite/${inviteCode}`);
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.name).toBe("Test League 1");
  });

  test("POST /leagues/join allows joining via invite code", async () => {
    const res = await api("/api/v1/leagues/join", { user: user2, body: { inviteCode } });
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.id).toBe(createdLeagueId);

    const [member] = await db`SELECT * FROM league_members WHERE league_id = ${createdLeagueId} AND user_id = ${user2.id}`;
    expect(member).toBeDefined();
  });

  test("POST /leagues/join prevents duplicate joins", async () => {
    const res = await api("/api/v1/leagues/join", { user: user2, body: { inviteCode } });
    expect(res.status).toBe(409);

    const data: any = await res.json();
    expect(data.error).toBe("Already a member of this league");
  });

  test("POST /leagues/join returns 404 for invalid code", async () => {
    const res = await api("/api/v1/leagues/join", { user: user2, body: { inviteCode: "INVALIDXYZ" } });
    expect(res.status).toBe(404);
  });
});
