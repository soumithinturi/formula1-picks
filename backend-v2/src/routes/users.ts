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

  const [updatedUser] = await db`
    UPDATE users
    SET display_name = ${data.display_name}
    WHERE id = ${req.user.id}
    RETURNING id, contact, display_name, role
  `;

  if (!updatedUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user: updatedUser });
}
