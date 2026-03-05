import type { AuthedRequest } from "../middleware/auth.ts";
import { db } from "../db/index.ts";
import { supabase } from "../lib/supabase.ts";
import { z } from "zod";

const SendMessageSchema = z.object({
  leagueId: z.string().uuid(),
  message: z.string().min(1).max(500).trim(),
});

/**
 * GET /api/v1/chat/:leagueId
 * Fetch the last 50 messages for a league.
 * Auth: injected via withAuth middleware — user must be a member or creator.
 */
export async function getChatMessages(req: AuthedRequest): Promise<Response> {
  const url = new URL(req.url);
  const leagueId = url.pathname.split("/").pop();
  if (!leagueId) return Response.json({ error: "Missing leagueId" }, { status: 400 });

  // Verify user is a member or creator of the league
  const result = await db`
    SELECT 1 FROM league_members WHERE league_id = ${leagueId} AND user_id = ${req.user.id}
    UNION
    SELECT 1 FROM leagues WHERE id = ${leagueId} AND created_by = ${req.user.id}
    LIMIT 1
  `;
  if (!result.length) return Response.json({ error: "Forbidden" }, { status: 403 });

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

  return Response.json(messages);
}

/**
 * POST /api/v1/chat
 * Send a message to a league chat.
 * Auth: injected via withAuth middleware — user must be a member or creator.
 */
export async function sendChatMessage(req: AuthedRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { leagueId, message } = parsed.data;

  // Verify user is a member or creator of the league
  const result = await db`
    SELECT 1 FROM league_members WHERE league_id = ${leagueId} AND user_id = ${req.user.id}
    UNION
    SELECT 1 FROM leagues WHERE id = ${leagueId} AND created_by = ${req.user.id}
    LIMIT 1
  `;
  if (!result.length) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Insert using service role Supabase client — bypasses RLS.
  // Realtime pushes the event to all subscribers automatically.
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ league_id: leagueId, user_id: req.user.id, message })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert chat message:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
