import { createClient } from "@supabase/supabase-js";
import { parseBody } from "../middleware/auth.ts";
import { AuthRequestSchema, AuthVerifySchema } from "../types/index.ts";
import { z } from "zod";
import { db } from "../db/index.ts";

// The same preset palette as the frontend profile picker.
const AVATAR_COLORS = [
  "#dc2626", "#ea580c", "#eab308", "#16a34a", "#2563eb",
  "#4f46e5", "#9333ea", "#ec4899", "#1e293b", "#94a3b8"
];

/**
 * Pick two distinct random colors from AVATAR_COLORS for the helmet and background.
 */
function randomAvatarUrl(): string {
  const helmetIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
  let bgIndex: number;
  do {
    bgIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
  } while (bgIndex === helmetIndex);
  return JSON.stringify({ helmetColor: AVATAR_COLORS[helmetIndex], bgColor: AVATAR_COLORS[bgIndex] });
}

function getCookieString(token: string) {
  // 1 week expiry. Use SameSite=None and Secure for cross-origin in production.
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = isProd ? "None" : "Lax";
  const secure = isProd ? "Secure;" : "";
  return `f1_auth_token=${token}; HttpOnly; ${secure} SameSite=${sameSite}; Path=/; Max-Age=${60 * 60 * 24 * 7}; Partitioned`;
}

function getClearCookieString() {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = isProd ? "None" : "Lax";
  const secure = isProd ? "Secure;" : "";
  return `f1_auth_token=; HttpOnly; ${secure} SameSite=${sameSite}; Path=/; Max-Age=0; Partitioned`;
}

/**
 * POST /api/v1/auth/request
 * Sends a magic link (email) or OTP (phone) via Supabase Auth.
 */
export async function requestOtp(req: Request): Promise<Response> {
  const { data, error } = await parseBody(req, AuthRequestSchema);
  if (error) return error;

  const authClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (data.type === "email") {
    const { error: supabaseError } = await authClient.auth.signInWithOtp({
      email: data.contact,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: req.headers.get("origin") || undefined, // Send them back to where they came from
      },
    });
    if (supabaseError) {
      return Response.json({ error: supabaseError.message }, { status: 400 });
    }
  } else {
    const { error: supabaseError } = await authClient.auth.signInWithOtp({
      phone: data.contact,
    });
    if (supabaseError) {
      return Response.json({ error: supabaseError.message }, { status: 400 });
    }
  }

  return Response.json({ message: "Code sent" });
}

/**
 * POST /api/v1/auth/verify
 * Verifies the OTP code and returns a JWT session token.
 * Auto-creates the user profile in our `users` table on first login.
 */
export async function verifyOtp(req: Request): Promise<Response> {
  const { data, error } = await parseBody(req, AuthVerifySchema);
  if (error) return error;

  const authClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let sessionResult;

  if (data.type === "email") {
    sessionResult = await authClient.auth.verifyOtp({
      email: data.contact,
      token: data.code,
      type: "email",
    });
  } else {
    sessionResult = await authClient.auth.verifyOtp({
      phone: data.contact,
      token: data.code,
      type: "sms",
    });
  }

  const { data: sessionData, error: supabaseError } = sessionResult;
  console.log("verifyOtp returned from Supabase:", {
    token_iat: sessionData?.session?.user?.last_sign_in_at,
    session_access_token_snip: sessionData?.session?.access_token?.substring(0, 15),
    error: supabaseError
  });

  if (supabaseError || !sessionData.session || !sessionData.user) {
    return Response.json(
      { error: supabaseError?.message ?? "Invalid or expired code" },
      { status: 401 }
    );
  }

  const { user: supabaseUser, session } = sessionData;

  // Upsert user profile in our own users table.
  // On first login this creates the row with a random avatar; on subsequent logins it's a no-op.
  const newAvatarUrl = randomAvatarUrl();
  await db`
    INSERT INTO users (id, contact, role, avatar_url, created_at)
    VALUES (
      ${supabaseUser.id},
      ${data.contact},
      'USER',
      ${newAvatarUrl},
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;

  // Fetch the full user profile to return
  const [userProfile] = await db`
    SELECT id, contact, display_name, full_name, avatar_url, role, preferences FROM users WHERE id = ${supabaseUser.id}
  `;

  return Response.json({
    token: session.access_token,
    user: userProfile,
  }, {
    headers: {
      "Set-Cookie": getCookieString(session.access_token)
    }
  });
}

/**
 * POST /api/v1/auth/sync
 * Takes an access_token from a Magic Link redirect,
 * creates the user profile if it doesn't exist, and returns it.
 */
export async function syncAuth(req: Request): Promise<Response> {
  const { data, error } = await parseBody(req, z.object({ access_token: z.string() }));
  if (error) return error;

  const authClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Ask Supabase to verify the token and return the user
  const { data: { user }, error: authError } = await authClient.auth.getUser(data.access_token);

  if (authError || !user) {
    return Response.json({ error: "Invalid access token" }, { status: 401 });
  }

  const contact = user.email || user.phone || "";

  // Upsert user profile with a random avatar on first creation.
  const newAvatarUrl = randomAvatarUrl();
  await db`
    INSERT INTO users (id, contact, role, avatar_url, created_at)
    VALUES (${user.id}, ${contact}, 'USER', ${newAvatarUrl}, NOW())
    ON CONFLICT (id) DO NOTHING
  `;

  const [userProfile] = await db`
    SELECT id, contact, display_name, full_name, avatar_url, role, preferences FROM users WHERE id = ${user.id}
  `;
  return Response.json({
    user: userProfile
  }, {
    headers: {
      "Set-Cookie": getCookieString(data.access_token)
    }
  });
}

/**
 * POST /api/v1/auth/logout
 * Clears the HttpOnly cookie.
 */
export async function logoutUser(_req: Request): Promise<Response> {
  return Response.json({ message: "Logged out" }, {
    headers: {
      "Set-Cookie": getClearCookieString()
    }
  });
}
