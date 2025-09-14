-- Add workspaceId to Company table for multi-tenant isolation
-- This ensures each workspace (partner) has their own company records

-- Add the workspaceId column
ALTER TABLE "Company" ADD COLUMN "workspaceId" VARCHAR(30);

-- Create indexes for performance
CREATE INDEX "Company_workspaceId_idx" ON "Company"("workspaceId");
CREATE INDEX "Company_workspaceId_name_idx" ON "Company"("workspaceId", "name");

-- Update existing companies to use a default workspace
-- In production, you should assign proper workspace IDs
UPDATE "Company" SET "workspaceId" = 'default-workspace' WHERE "workspaceId" IS NULL;

-- Make workspaceId NOT NULL after setting default values
ALTER TABLE "Company" ALTER COLUMN "workspaceId" SET NOT NULL;
