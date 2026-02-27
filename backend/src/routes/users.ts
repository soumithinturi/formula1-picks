import { parseBody } from "../middleware/auth.ts";
import { UpdateProfileSchema } from "../types/index.ts";
import { db } from "../db/index.ts";
import type { AuthedRequest } from "../middleware/auth.ts";

/**
 * PUT /api/v1/users/me
 * Updates the current user's profile.
 */
export async function updateProfile(req: AuthedRequest): Promise<Response> {
  const { data, error } = await parseBody(req, UpdateProfileSchema);
  if (error) return error;

  const updates: Record<string, any> = {};
  if ("display_name" in data) updates.display_name = data.display_name;
  if ("full_name" in data) updates.full_name = data.full_name;
  if ("avatar_url" in data) updates.avatar_url = data.avatar_url;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updatedUser] = await db`
    UPDATE users
    SET ${db(updates)}
    WHERE id = ${req.user.id}
    RETURNING id, contact, display_name, full_name, avatar_url, role
  `;

  if (!updatedUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user: updatedUser });
}
