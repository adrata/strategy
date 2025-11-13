-- Add visibleFields column to company_lists table
ALTER TABLE "company_lists" 
ADD COLUMN IF NOT EXISTS "visibleFields" JSONB;

-- Create generic lists table for all sections (companies, people, leads, prospects, opportunities, clients)
-- Excludes speedrun section
CREATE TABLE IF NOT EXISTS "lists" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "section" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "filters" JSONB,
    "sortField" VARCHAR(50),
    "sortDirection" VARCHAR(10),
    "searchQuery" VARCHAR(500),
    "visibleFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- Create indexes for lists table
CREATE INDEX IF NOT EXISTS "lists_workspaceId_idx" ON "lists"("workspaceId");
CREATE INDEX IF NOT EXISTS "lists_userId_idx" ON "lists"("userId");
CREATE INDEX IF NOT EXISTS "lists_workspaceId_userId_idx" ON "lists"("workspaceId", "userId");
CREATE INDEX IF NOT EXISTS "lists_section_idx" ON "lists"("section");
CREATE INDEX IF NOT EXISTS "lists_workspaceId_section_idx" ON "lists"("workspaceId", "section");
CREATE INDEX IF NOT EXISTS "lists_workspaceId_userId_section_idx" ON "lists"("workspaceId", "userId", "section");
CREATE INDEX IF NOT EXISTS "lists_isDefault_idx" ON "lists"("isDefault");
CREATE INDEX IF NOT EXISTS "lists_deletedAt_idx" ON "lists"("deletedAt");

-- Add foreign key constraints for lists table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lists_userId_fkey'
    ) THEN
        ALTER TABLE "lists" ADD CONSTRAINT "lists_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lists_workspaceId_fkey'
    ) THEN
        ALTER TABLE "lists" ADD CONSTRAINT "lists_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

