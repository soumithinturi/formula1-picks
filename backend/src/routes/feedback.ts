import { supabase } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/auth";

export async function submitFeedback(req: AuthedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    type: 'bug' | 'feature_request' | 'general';
    message: string;
    appVersion?: string;
    metadata?: any;
  };

  const { type, message, appVersion, metadata } = body;

  if (!type || !message) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
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
    return Response.json({ error: "Failed to submit feedback" }, { status: 500 });
  }

  return Response.json({ data }, { status: 201 });
}
