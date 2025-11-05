-- Add points field to StacksStory
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "points" INTEGER;

