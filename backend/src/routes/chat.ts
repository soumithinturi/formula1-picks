import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";

import { z } from "zod";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

const SendMessageSchema = z.object({
  leagueId: z.string().uuid(),
  message: z.string().min(1).max(500).trim(),
});

/**
 * GET /api/v1/chat/:leagueId
 * Fetch the last 50 messages for a league.
 */
export async function getChatMessages(c: AppContext) {
  const db = c.get("db");
  const user = c.get("user");
  const leagueId = c.req.param("leagueId");

  if (!leagueId) return c.json({ error: "Missing leagueId" }, 400);

  // Verify user is a member or creator of the league
  const result = await db`
    SELECT 1 FROM league_members WHERE league_id = ${leagueId} AND user_id = ${user.id}
    UNION
    SELECT 1 FROM leagues WHERE id = ${leagueId} AND created_by = ${user.id}
    LIMIT 1
  `;
  if (!result.length) return c.json({ error: "Forbidden" }, 403);

  const messages = await db`
    SELECT 
      cm.id,
      cm.league_id,
      cm.user_id,
      cm.message,
      cm.created_at,
      cm.type,
      u.display_name,
      u.avatar_url
    FROM chat_messages cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.league_id = ${leagueId}
    ORDER BY cm.created_at ASC
    LIMIT 50
  `;

  return c.json(messages);
}

/**
 * POST /api/v1/chat
 * Send a message to a league chat.
 */
export async function sendChatMessage(c: AppContext) {
  const db = c.get("db");
  const user = c.get("user");
  const supabase = c.get("supabase");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { leagueId, message } = parsed.data;

  // Verify user is a member or creator of the league
  const result = await db`
    SELECT 1 FROM league_members WHERE league_id = ${leagueId} AND user_id = ${user.id}
    UNION
    SELECT 1 FROM leagues WHERE id = ${leagueId} AND created_by = ${user.id}
    LIMIT 1
  `;
  if (!result.length) return c.json({ error: "Forbidden" }, 403);

  // Insert using service role Supabase client — bypasses RLS.
  // Realtime pushes the event to all subscribers automatically.
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ league_id: leagueId, user_id: user.id, message })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert chat message:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }

  return c.json(data, 201);
}
