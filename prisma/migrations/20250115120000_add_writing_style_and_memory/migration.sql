-- AlterTable
ALTER TABLE "user_ai_preferences" ADD COLUMN "writingStyleAnalysis" TEXT;
ALTER TABLE "user_ai_preferences" ADD COLUMN "writingStylePrompt" TEXT;
ALTER TABLE "user_ai_preferences" ADD COLUMN "persistentMemory" TEXT;
ALTER TABLE "user_ai_preferences" ADD COLUMN "useEmojis" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_ai_preferences" ADD COLUMN "communicationSamples" JSONB;
ALTER TABLE "user_ai_preferences" ADD COLUMN "lastStyleUpdate" TIMESTAMP(3);
