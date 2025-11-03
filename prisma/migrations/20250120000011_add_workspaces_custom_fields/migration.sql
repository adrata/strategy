-- Add customFields column to workspaces table if it doesn't exist
-- This allows storing buyer group configuration and other workspace-specific settings
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "customFields" JSONB;

-- Create GIN index for efficient JSON queries on customFields
CREATE INDEX IF NOT EXISTS "idx_workspaces_custom_fields" ON "workspaces" USING GIN("customFields") WHERE "customFields" IS NOT NULL;

