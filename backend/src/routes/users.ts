import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";

import { parseBody } from "../middleware/auth.ts";
import { UpdateProfileSchema } from "../types/index.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * GET /api/v1/users/me
 * Returns the current user's profile including preferences.
 */
export async function getProfile(c: AppContext) {
  const db = c.get("db");
  const userId = c.get("user").id;

  const [user] = await db`
    SELECT id, contact, display_name, full_name, avatar_url, role, preferences
    FROM users WHERE id = ${userId}
  `;

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Calculate global prediction stats from all their picks
  const [stats] = await db`
    SELECT
       COALESCE(SUM(correct_predictions), 0)::int AS "globalCorrectPredictions",
       COALESCE(SUM(total_predictions), 0)::int AS "globalTotalPredictions"
     FROM picks WHERE user_id = ${userId}
  `;

  return c.json({ user, stats });
}

/**
 * PUT /api/v1/users/me
 * Updates the current user's profile and/or preferences.
 */
export async function updateProfile(c: AppContext) {
  const { data, error } = await parseBody(c, UpdateProfileSchema);
  if (error) return error;

  const db = c.get("db");
  const userId = c.get("user").id;

  const updates: Record<string, any> = {};
  if ("display_name" in data) updates.display_name = data.display_name;
  if ("full_name" in data) updates.full_name = data.full_name;
  if ("avatar_url" in data) updates.avatar_url = data.avatar_url;

  // Merge new preferences with the existing ones.
  const hasPreferences = "preferences" in data && data.preferences !== undefined;

  if (Object.keys(updates).length === 0 && !hasPreferences) {
    return c.json({ error: "No fields to update" }, 400);
  }

  let updatedUser;
  const hasScalars = Object.keys(updates).length > 0;
  const prefsJson = data.preferences;

  if (hasScalars && hasPreferences) {
    [updatedUser] = await db`
      UPDATE users
       SET display_name = COALESCE(${updates.display_name ?? null}, display_name),
           full_name    = COALESCE(${updates.full_name ?? null}, full_name),
           avatar_url   = COALESCE(${updates.avatar_url ?? null}, avatar_url),
           preferences  = (
             COALESCE(
               CASE WHEN jsonb_typeof(preferences) = 'object' THEN preferences ELSE '{}'::jsonb END,
               '{}'::jsonb
             ) || ${JSON.stringify(prefsJson)}::jsonb
           )
       WHERE id = ${userId}
       RETURNING id, contact, display_name, full_name, avatar_url, role, preferences
    `;
  } else if (hasPreferences) {
    [updatedUser] = await db`
      UPDATE users
       SET preferences = (
             COALESCE(
               CASE WHEN jsonb_typeof(preferences) = 'object' THEN preferences ELSE '{}'::jsonb END,
               '{}'::jsonb
             ) || ${JSON.stringify(prefsJson)}::jsonb
           )
       WHERE id = ${userId}
       RETURNING id, contact, display_name, full_name, avatar_url, role, preferences
    `;
  } else {
    [updatedUser] = await db`
      UPDATE users
       SET display_name = COALESCE(${updates.display_name ?? null}, display_name),
           full_name    = COALESCE(${updates.full_name ?? null}, full_name),
           avatar_url   = COALESCE(${updates.avatar_url ?? null}, avatar_url)
       WHERE id = ${userId}
       RETURNING id, contact, display_name, full_name, avatar_url, role, preferences
    `;
  }

  if (!updatedUser) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user: updatedUser });
}

/**
 * DELETE /api/v1/users/me
 * Permanently deletes the current user's account from the database and Supabase Auth.
 */
export async function deleteProfile(c: AppContext) {
  const db = c.get("db");
  const supabase = c.get("supabase");
  const userId = c.get("user").id;

  try {
    const [deletedUser] = await db`
      DELETE FROM public.users 
      WHERE id = ${userId} 
      RETURNING id
    `;

    if (!deletedUser) {
      return c.json({ error: "User not found or already deleted" }, 404);
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Failed to delete user from Supabase Auth:", authError);
      return c.json({
        error: "Failed to fully delete account from Auth provider. Check SUPABASE_SECRET_KEY.",
        details: authError.message
      }, 500);
    }

    return c.json({ success: true, message: "Account deleted successfully." });
  } catch (err: any) {
    console.error("Account deletion error:", err);
    return c.json({
      error: "An unexpected error occurred deleting the account.",
      details: err?.message || String(err)
    }, 500);
  }
}
