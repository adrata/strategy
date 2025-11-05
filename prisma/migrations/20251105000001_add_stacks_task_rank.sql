-- Add rank field to StacksTask table for backlog ordering
-- Rank is a 1-based integer that determines the order of tasks in the backlog
ALTER TABLE "StacksTask" ADD COLUMN IF NOT EXISTS "rank" INTEGER;

-- Add index on projectId and rank for efficient ordering queries
CREATE INDEX IF NOT EXISTS "StacksTask_projectId_rank_idx" ON "StacksTask"("projectId", "rank");

