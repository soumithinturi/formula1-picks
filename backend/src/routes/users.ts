import { parseBody } from "../middleware/auth.ts";
import { UpdateProfileSchema } from "../types/index.ts";
import { db } from "../db/index.ts";
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

