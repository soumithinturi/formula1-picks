import { supabase } from "../lib/supabase.ts";
import { parseBody } from "../middleware/auth.ts";
import { AuthRequestSchema, AuthVerifySchema } from "../types/index.ts";
import { db } from "../db/index.ts";

/**
 * POST /api/v1/auth/request
 * Sends a magic link (email) or OTP (phone) via Supabase Auth.
 */
export async function requestOtp(req: Request): Promise<Response> {
  const { data, error } = await parseBody(req, AuthRequestSchema);
  if (error) return error;

  if (data.type === "email") {
    const { error: supabaseError } = await supabase.auth.signInWithOtp({
      email: data.contact,
      options: {
        // OTP code flow — user enters the 6-digit code, not a link
        shouldCreateUser: true,
      },
    });
    if (supabaseError) {
      return Response.json({ error: supabaseError.message }, { status: 400 });
    }
  } else {
    const { error: supabaseError } = await supabase.auth.signInWithOtp({
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

  let sessionResult;

  if (data.type === "email") {
    sessionResult = await supabase.auth.verifyOtp({
      email: data.contact,
      token: data.code,
      type: "email",
    });
  } else {
    sessionResult = await supabase.auth.verifyOtp({
      phone: data.contact,
      token: data.code,
      type: "sms",
    });
  }

  const { data: sessionData, error: supabaseError } = sessionResult;

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
