import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";


type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

export async function submitFeedback(c: AppContext) {
  const userId = c.get("user").id;
  const supabase = c.get("supabase");

  const body = await c.req.json() as {
    type: 'bug' | 'feature_request' | 'general';
    message: string;
    appVersion?: string;
    metadata?: any;
  };

  const { type, message, appVersion, metadata } = body;

  if (!type || !message) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const { data, error } = await supabase
    .from("feedback")
    .insert([{
      user_id: userId,
      type,
      message,
      app_version: appVersion,
      metadata,
    }])
    .select()
    .single();

  if (error) {
    console.error("Failed to submit feedback:", error);
    return c.json({ error: "Failed to submit feedback" }, 500);
  }

  return c.json({ data }, 201);
}
