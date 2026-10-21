-- Races were keyed by round number only, so a second season would overwrite the first.
-- Existing rows are all 2026, with id = round. New seasons get ids from the sequence.
ALTER TABLE races ADD COLUMN IF NOT EXISTS season integer;
ALTER TABLE races ADD COLUMN IF NOT EXISTS round integer;

UPDATE races SET season = 2026, round = id WHERE season IS NULL;

ALTER TABLE races ALTER COLUMN season SET NOT NULL;
ALTER TABLE races ALTER COLUMN round SET NOT NULL;
ALTER TABLE races ADD CONSTRAINT races_season_round_key UNIQUE (season, round);

-- The 2026 rows were inserted with explicit ids, so the sequence may still sit at 1.
SELECT setval('races_id_seq', (SELECT max(id) FROM races));
