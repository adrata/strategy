-- Add isPrivate field to OasisChannel table
-- All existing channels default to public (isPrivate = false)

ALTER TABLE "OasisChannel" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- Explicitly set all existing channels to public (safety measure - ensures all channels are public by default)
UPDATE "OasisChannel" SET "isPrivate" = false;

