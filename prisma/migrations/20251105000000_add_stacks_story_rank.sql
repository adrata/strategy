-- Add rank field to StacksStory table for backlog ordering
-- Rank is a 1-based integer that determines the order of stories in the backlog
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "rank" INTEGER;

-- Add index on projectId and rank for efficient ordering queries
CREATE INDEX IF NOT EXISTS "StacksStory_projectId_rank_idx" ON "StacksStory"("projectId", "rank");