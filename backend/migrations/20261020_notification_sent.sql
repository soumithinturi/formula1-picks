-- Dedupe table for session reminders: one row per user, race and session.
-- Assumes users.id is uuid and races.id is integer; adjust if the real column types differ.
CREATE TABLE IF NOT EXISTS notification_sent (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id integer NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  session text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, race_id, session)
);
