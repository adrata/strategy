-- Add statusChangedAt column to StacksStory
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP;

-- Initialize existing records: set statusChangedAt = updatedAt for all existing stories
UPDATE "StacksStory" SET "statusChangedAt" = "updatedAt" WHERE "statusChangedAt" IS NULL;

