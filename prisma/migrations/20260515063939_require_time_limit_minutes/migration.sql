-- Backfill timeLimitMinutes for rows that pre-date the per-question time system.
-- Mapping:
--   FUNCTION_JS / FUNCTION_PYTHON: EASY 15 | MEDIUM 30 | HARD 60
--   REACT_APP:                     EASY 30 | MEDIUM 45 | HARD 60
UPDATE "questions"
SET "timeLimitMinutes" = CASE
  WHEN "type" = 'REACT_APP' AND "difficulty" = 'EASY'   THEN 30
  WHEN "type" = 'REACT_APP' AND "difficulty" = 'MEDIUM' THEN 45
  WHEN "type" = 'REACT_APP' AND "difficulty" = 'HARD'   THEN 60
  WHEN "difficulty" = 'EASY'   THEN 15
  WHEN "difficulty" = 'MEDIUM' THEN 30
  WHEN "difficulty" = 'HARD'   THEN 60
  ELSE 30
END
WHERE "timeLimitMinutes" IS NULL;

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "timeLimitMinutes" SET NOT NULL;
