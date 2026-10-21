import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { db } from "../db/index.ts";
import app from "../index.ts";

// These integration tests insert and delete rows. Never point them at real data.
if (!process.env.DATABASE_URL || process.env.CONFIRM_TEST_DB !== "1") {
  throw new Error(
    "Integration tests need DATABASE_URL pointing at a throwaway database, plus CONFIRM_TEST_DB=1 to confirm it."
  );
}

// Test races use this season so they never become the "latest season" real clients see.
export const TEST_SEASON = 1900;

const SUPABASE_URL = "http://localhost:54321";
const { publicKey, privateKey } = await generateKeyPair("ES256");
const jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: "test", alg: "ES256", use: "sig" }] };

// Serve our test public key where authMiddleware looks for Supabase's; everything else is untouched.
const realFetch = globalThis.fetch;
globalThis.fetch = ((input: any, init?: any) =>
  String(input) === `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`
    ? Promise.resolve(Response.json(jwks))
    : realFetch(input, init)) as typeof fetch;

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL },
  SUPABASE_URL,
  SUPABASE_SECRET_KEY: "test",
  SUPABASE_PUBLISHABLE_DEFAULT_KEY: "test",
  CRON_SECRET: "test",
  NODE_ENV: "development",
  INVITE_LIMITER: { limit: async () => ({ success: true }) },
};
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;

/** Calls the real app, signed in as `user` (a row from createMockUser) when given. */
export async function api(
  path: string,
  opts: { user?: { id: string }; method?: string; body?: unknown } = {}
) {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.user) {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: "test" })
      .setSubject(opts.user.id)
      .setExpirationTime("5m")
      .sign(privateKey);
    headers.Authorization = `Bearer ${token}`;
  }
  return app.request(
    path,
    {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    },
    env,
    ctx
  );
}

/** Creates an auth user plus the matching public.users row. */
export async function createMockUser(overrides: Partial<{ id: string; contact: string; role: "USER" | "ADMIN" }> = {}) {
  const id = overrides.id ?? crypto.randomUUID();
  const contact = overrides.contact ?? `test-${id}@example.com`;
  const role = overrides.role ?? "USER";

  await db`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (${id}, ${contact}, '{}'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `;

  await db`
    INSERT INTO users (id, contact, role)
    VALUES (${id}, ${contact}, ${role})
    ON CONFLICT (id) DO NOTHING
  `;

  return { id, contact, role };
}

/** Removes test users; public.users and everything hanging off them cascade. */
export async function deleteMockUsers(...users: { id: string }[]) {
  for (const u of users) await db`DELETE FROM auth.users WHERE id = ${u.id}`;
}

/** Inserts a race in the test season; columns not given use the table defaults. */
export async function createTestRace(id: number, cols: Record<string, unknown> = {}) {
  const row = { id, season: TEST_SEASON, round: id, name: `Test Race ${id}`, date: new Date(Date.now() + 864e5), ...cols };
  await db`INSERT INTO races ${db(row)} ON CONFLICT (id) DO NOTHING`;
}

/** Deletes test races and everything that references them (FKs are not cascading). */
export async function deleteTestRaces(...ids: number[]) {
  await db`DELETE FROM notifications WHERE metadata->>'raceId' IN ${db(ids.map(String))}`;
  await db`DELETE FROM picks WHERE race_id IN ${db(ids)}`;
  await db`DELETE FROM race_results WHERE race_id IN ${db(ids)}`;
  await db`DELETE FROM races WHERE id IN ${db(ids)}`;
}
