-- Add acceptanceCriteria field to StacksStory
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "acceptanceCriteria" TEXT;

