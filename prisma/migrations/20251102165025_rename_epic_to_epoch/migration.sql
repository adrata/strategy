-- Rename StacksEpic to StacksEpoch
ALTER TABLE "StacksEpic" RENAME TO "StacksEpoch";

-- Rename epicId to epochId in StacksStory
ALTER TABLE "StacksStory" RENAME COLUMN "epicId" TO "epochId";

-- Update foreign key constraint name if it exists
-- PostgreSQL auto-renames foreign key constraints, but let's ensure index name is updated
DROP INDEX IF EXISTS "StacksStory_epicId_idx";
CREATE INDEX IF NOT EXISTS "StacksStory_epochId_idx" ON "StacksStory"("epochId");

