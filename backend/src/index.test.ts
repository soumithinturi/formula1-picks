import { expect, test, describe } from "bun:test";
import app from "./index.ts";

const baseEnv = {
  HYPERDRIVE: { connectionString: "postgresql://u:p@localhost:5432/none" }, // never connected to
  SUPABASE_URL: "http://localhost:54321",
  SUPABASE_SECRET_KEY: "test-key",
  NODE_ENV: "production",
};
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;
const call = (path: string, init: RequestInit, env: object) => app.request(path, init, env, ctx);

describe("cron webhook secret", () => {
  const post = (headers: Record<string, string>, env: object) =>
    call("/api/v1/internal/cron/standings", { method: "POST", headers }, env);

  test("rejects a missing or wrong secret", async () => {
    const env = { ...baseEnv, CRON_SECRET: "s3cret" };
    expect((await post({}, env)).status).toBe(403);
    expect((await post({ "x-cron-secret": "nope" }, env)).status).toBe(403);
  });

  test("fails closed when CRON_SECRET is not configured, even outside production", async () => {
    const res = await post({ "x-cron-secret": "anything" }, { ...baseEnv, NODE_ENV: "development" });
    expect(res.status).toBe(500);
  });
});

describe("CORS", () => {
  const withOrigin = (origin: string) => call("/api/v1/races", { headers: { Origin: origin } }, baseEnv);

  test("does not echo unknown origins", async () => {
    const res = await withOrigin("https://evil.example");
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  test("allows the production origin", async () => {
    const origin = "https://formula1-picks.sintur-labs.workers.dev";
    expect((await withOrigin(origin)).headers.get("access-control-allow-origin")).toBe(origin);
  });
});
