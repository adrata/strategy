-- Create opportunities table - separate from companies to allow multiple opportunities per company
CREATE TABLE IF NOT EXISTS "opportunities" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "companyId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15, 2),
    "stage" VARCHAR(50) NOT NULL DEFAULT 'Discovery',
    "probability" DOUBLE PRECISION DEFAULT 0.1,
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "ownerId" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- Create indexes for opportunities table
CREATE INDEX IF NOT EXISTS "opportunities_workspaceId_idx" ON "opportunities"("workspaceId");
CREATE INDEX IF NOT EXISTS "opportunities_companyId_idx" ON "opportunities"("companyId");
CREATE INDEX IF NOT EXISTS "opportunities_ownerId_idx" ON "opportunities"("ownerId");
CREATE INDEX IF NOT EXISTS "opportunities_deletedAt_idx" ON "opportunities"("deletedAt");
CREATE INDEX IF NOT EXISTS "opportunities_stage_idx" ON "opportunities"("stage");
CREATE INDEX IF NOT EXISTS "opportunities_workspaceId_deletedAt_idx" ON "opportunities"("workspaceId", "deletedAt");
CREATE INDEX IF NOT EXISTS "opportunities_workspaceId_companyId_deletedAt_idx" ON "opportunities"("workspaceId", "companyId", "deletedAt");
CREATE INDEX IF NOT EXISTS "opportunities_workspaceId_ownerId_deletedAt_idx" ON "opportunities"("workspaceId", "ownerId", "deletedAt");

-- Add foreign key constraints for opportunities table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'opportunities_companyId_fkey'
    ) THEN
        ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'opportunities_ownerId_fkey'
    ) THEN
        ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_ownerId_fkey" 
        FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'opportunities_workspaceId_fkey'
    ) THEN
        ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

