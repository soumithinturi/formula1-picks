import { parseBody } from "../middleware/auth.ts";
import { UpdateProfileSchema } from "../types/index.ts";
import { db } from "../db/index.ts";
import { supabase } from "../lib/supabase.ts";
import type { AuthedRequest } from "../middleware/auth.ts";

/**
 * GET /api/v1/users/me
 * Returns the current user's profile including preferences.
 */
export async function getProfile(req: AuthedRequest): Promise<Response> {
  const [user] = await db`
    SELECT id, contact, display_name, full_name, avatar_url, role, preferences
    FROM users
    WHERE id = ${req.user.id}
  `;

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate global prediction stats from all their picks
  const [stats] = await db`
    SELECT
      COALESCE(SUM(correct_predictions), 0)::int AS "globalCorrectPredictions",
      COALESCE(SUM(total_predictions), 0)::int AS "globalTotalPredictions"
    FROM picks
    WHERE user_id = ${req.user.id}
  `;

  return Response.json({ user, stats });
}

/**
 * PUT /api/v1/users/me
 * Updates the current user's profile and/or preferences.
 */
export async function updateProfile(req: AuthedRequest): Promise<Response> {
  const { data, error } = await parseBody(req, UpdateProfileSchema);
  if (error) return error;

  const updates: Record<string, any> = {};
  if ("display_name" in data) updates.display_name = data.display_name;
  if ("full_name" in data) updates.full_name = data.full_name;
  if ("avatar_url" in data) updates.avatar_url = data.avatar_url;

  // Merge new preferences with the existing ones.
  // Theme and timezone are written by two separate contexts, so we must merge
  // rather than overwrite. The CASE guard coerces any non-object stored value
  // (e.g. a corrupt '[]') back to '{}' before merging to prevent array concat.
  const hasPreferences = "preferences" in data && data.preferences !== undefined;

  if (Object.keys(updates).length === 0 && !hasPreferences) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  let updatedUser;
  const hasScalars = Object.keys(updates).length > 0;

  const prefsJson = data.preferences;

  if (hasScalars && hasPreferences) {
    [updatedUser] = await db`
      UPDATE users
      SET ${db(updates)},
          preferences = (
            COALESCE(
              CASE WHEN jsonb_typeof(preferences) = 'object' THEN preferences ELSE '{}'::jsonb END,
              '{}'::jsonb
            ) || ${prefsJson}
          )
      WHERE id = ${req.user.id}
      RETURNING id, contact, display_name, full_name, avatar_url, role, preferences
    `;
  } else if (hasPreferences) {
    [updatedUser] = await db`
      UPDATE users
      SET preferences = (
            COALESCE(
              CASE WHEN jsonb_typeof(preferences) = 'object' THEN preferences ELSE '{}'::jsonb END,
              '{}'::jsonb
            ) || ${prefsJson}
          )
      WHERE id = ${req.user.id}
      RETURNING id, contact, display_name, full_name, avatar_url, role, preferences
    `;
  } else {
    // Scalar fields only — straightforward update.
    [updatedUser] = await db`
      UPDATE users
      SET ${db(updates)}
      WHERE id = ${req.user.id}
      RETURNING id, contact, display_name, full_name, avatar_url, role, preferences
    `;
  }

  if (!updatedUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user: updatedUser });
}

/**
 * DELETE /api/v1/users/me
 * Permanently deletes the current user's account from the database and Supabase Auth.
 */
export async function deleteProfile(req: AuthedRequest): Promise<Response> {
  const userId = req.user.id;

  try {
    // 1. Delete user from the public.users database (cascade should handle related records if set)
    const [deletedUser] = await db`
      DELETE FROM public.users
      WHERE id = ${userId}
      RETURNING id
    `;

    if (!deletedUser) {
      return Response.json({ error: "User not found or already deleted" }, { status: 404 });
    }

    // 2. Delete user from Supabase Auth explicitly using the Admin API
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Failed to delete user from Supabase Auth:", authError);
      return Response.json({
        error: "Failed to fully delete account from Auth provider. Check SUPABASE_SECRET_KEY.",
        details: authError.message
      }, { status: 500 });
    }

    return Response.json({ success: true, message: "Account deleted successfully." });
  } catch (err: any) {
    console.error("Account deletion error:", err);
    return Response.json({
      error: "An unexpected error occurred deleting the account.",
      details: err?.message || String(err)
    }, { status: 500 });
  }
}

