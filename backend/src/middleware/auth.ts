import { createMiddleware } from "hono/factory";
import { jwtVerify, createLocalJWKSet } from "jose";
import type { Context } from "hono";
import type { UserRow } from "../types/index.ts";
import type { Bindings, Variables } from "../types/env.ts";

// Cache the raw JWKS JSON object globally as a pure data structure to avoid context context leaks in Workers
let cachedJWKSetJSON: any = null;
let fetchPromise: Promise<any> | null = null;

async function getJWKSetJSON(supabaseUrl: string) {
  if (cachedJWKSetJSON) return cachedJWKSetJSON;

  if (!fetchPromise) {
    fetchPromise = (async () => {
      try {
        const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
        const res = await fetch(jwksUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch JWKS: ${res.statusText}`);
        }
        const json = await res.json();
        cachedJWKSetJSON = json;
        return json;
      } catch (err) {
        fetchPromise = null; // Reset on failure so we can try again
        throw err;
      }
    })();
  }

  return fetchPromise;
}

export interface AuthedUser {
  id: string;
  contact: string;
  role: "USER" | "ADMIN";
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split("; ").map(c => {
      const [key, ...v] = c.split("=");
      return [key, decodeURIComponent(v.join("="))];
    })
  );
}

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Extracts and verifies the Supabase JWT from the Authorization header or Cookie.
 * Returns the authenticated user or null if invalid.
 */
async function verifyToken(c: AppContext): Promise<AuthedUser | null> {
  let token = "";

  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookies = parseCookies(c.req.header("Cookie") ?? null);
    token = cookies["f1_auth_token"] || "";
  }

  if (!token) return null;

  try {
    const supabaseUrl = c.get("env").SUPABASE_URL;
    const jwkSetJSON = await getJWKSetJSON(supabaseUrl);
    const JWKS = createLocalJWKSet(jwkSetJSON);

    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ["ES256"],
    });

    const sub = payload.sub;
    if (!sub) return null;

    const db = c.get("db");
    const [user] = await db<UserRow[]>`
      SELECT id, contact, role FROM users 
      WHERE id = ${sub} 
      LIMIT 1
    `;

    if (!user) return null;

    return { id: user.id, contact: user.contact, role: user.role };
  } catch (err) {
    console.error("JWT Verification failed:", err);
    return null;
  }
}

/**
 * Hono middleware that enforces JWT authentication.
 * Sets `c.set("user", authedUser)` on success, returns 401 on failure.
 */
export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const user = await verifyToken(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", user);
  await next();
});

/**
 * Hono middleware that enforces JWT authentication + ADMIN role.
 * Returns 403 if the user is not an admin.
 */
export const adminMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const user = await verifyToken(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (user.role !== "ADMIN") {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("user", user);
  await next();
});

/**
 * Parses a JSON body and validates it with a Zod schema.
 * Returns { data } on success or { error: Response } on failure.
 */
export async function parseBody<T>(
  c: AppContext,
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { format: () => unknown } } }
): Promise<{ data: T; error?: never } | { data?: never; error: Response }> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return { error: c.json({ error: "Invalid JSON body" }, 400) as unknown as Response };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: c.json({ error: result.error.format() }, 400) as unknown as Response };
  }

  return { data: result.data };
}
