import { db } from "../db/index.ts";

/**
 * Creates a mock user in the database for testing.
 * The user id is deterministic or random.
 */
export async function createMockUser(overrides: Partial<{ id: string; contact: string; role: "USER" | "ADMIN" }> = {}) {
  const id = overrides.id ?? crypto.randomUUID();
  const contact = overrides.contact ?? `test-${id}@example.com`;
  const role = overrides.role ?? "USER";

  await db`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (${id}, ${contact}, '{}'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `;

  await db`
    INSERT INTO users (id, contact, role) 
    VALUES (${id}, ${contact}, ${role})
    ON CONFLICT (id) DO NOTHING
  `;

  return { id, contact, role };
}

/**
 * Mocks the \`verifyToken\` logic in auth.ts to bypass real JWT checks.
 * In your test file, you can mock \`verifyToken\` directly or just use this helper to 
 * inject the user if you restructure the middleware exports.
 * 
 * For Bun: 
 * \`mock.module("../middleware/auth.ts", () => { ... })\` is usually done per-test file.
 */
