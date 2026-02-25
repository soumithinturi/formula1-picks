
import { createClient } from "@supabase/supabase-js";
import { parseBody } from "../middleware/auth.ts";
import { AuthRequestSchema, AuthVerifySchema } from "../types/index.ts";
import { z } from "zod";
import { db } from "../db/index.ts";

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
  // On first login this creates the row; on subsequent logins it's a no-op.
  await db`
    INSERT INTO users (id, contact, role, created_at)
    VALUES (
      ${supabaseUser.id},
      ${data.contact},
      'USER',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;

  // Fetch the full user profile to return
  const [userProfile] = await db`
    SELECT id, contact, display_name, role FROM users WHERE id = ${supabaseUser.id}
  `;

  return Response.json({
    token: session.access_token,
    user: userProfile,
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

  // Upsert user profile
  await db`
    INSERT INTO users (id, contact, role, created_at)
    VALUES (${user.id}, ${contact}, 'USER', NOW())
    ON CONFLICT (id) DO NOTHING
  `;

  const [userProfile] = await db`
    SELECT id, contact, display_name, role FROM users WHERE id = ${user.id}
  `;

  return Response.json({ user: userProfile });
}
