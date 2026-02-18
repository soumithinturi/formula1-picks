import { jwtVerify, createRemoteJWKSet } from "jose";
import type { UserRow } from "../types/index.ts";
import { db } from "../db/index.ts";

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL environment variable is required");

// Supabase now uses asymmetric ES256 signing — fetch the public key from the JWKS endpoint.
// jose caches this automatically after the first fetch.
const JWKS = createRemoteJWKSet(
  new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
);

export interface AuthedUser {
  id: string;
  contact: string;
  role: "USER" | "ADMIN";
}

// Extends the standard Bun Request type to carry the authenticated user
export interface AuthedRequest extends Request {
  user: AuthedUser;
  params: Record<string, string>;
}

type RouteHandler = (req: Request) => Response | Promise<Response>;
type AuthedHandler = (req: AuthedRequest) => Response | Promise<Response>;

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Returns the authenticated user or null if invalid.
 */
async function verifyToken(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      // Supabase ES256 asymmetric signing
      algorithms: ["ES256"],
    });

    const sub = payload.sub;
    if (!sub) return null;

    // Fetch the user's role from our users table
    const [user] = await db<UserRow[]>`
      SELECT id, contact, role FROM users WHERE id = ${sub} LIMIT 1
    `;

    if (!user) return null;

    return { id: user.id, contact: user.contact, role: user.role };
  } catch {
    return null;
  }
}

/**
 * Wraps a route handler with JWT authentication.
 * Injects `req.user` on success, returns 401 on failure.
 */
export function withAuth(handler: AuthedHandler): RouteHandler {
  return async (req: Request) => {
    const user = await verifyToken(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Attach user to the request object
    (req as AuthedRequest).user = user;
    return handler(req as AuthedRequest);
  };
}

/**
 * Wraps a route handler with JWT authentication + ADMIN role check.
 * Returns 403 if the user is not an admin.
 */
export function withAdmin(handler: AuthedHandler): RouteHandler {
  return withAuth(async (req: AuthedRequest) => {
    if (req.user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req);
  });
}

/**
 * Parses a JSON body and validates it with a Zod schema.
 * Returns { data } on success or { error: Response } on failure.
 */
export async function parseBody<T>(
  req: Request,
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { format: () => unknown } } }
): Promise<{ data: T; error?: never } | { data?: never; error: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: Response.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: Response.json({ error: result.error.format() }, { status: 400 }) };
  }

  return { data: result.data };
}
