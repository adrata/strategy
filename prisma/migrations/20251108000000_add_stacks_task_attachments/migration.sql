-- Add attachments column to StacksTask table if it doesn't exist
-- This column stores JSON data for file attachments

ALTER TABLE "StacksTask" ADD COLUMN IF NOT EXISTS "attachments" JSONB;

