-- Create company_lists table for saved company list filters and preferences
CREATE TABLE IF NOT EXISTS "company_lists" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "filters" JSONB,
    "sortField" VARCHAR(50),
    "sortDirection" VARCHAR(10),
    "searchQuery" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "company_lists_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "company_lists_workspaceId_idx" ON "company_lists"("workspaceId");
CREATE INDEX IF NOT EXISTS "company_lists_userId_idx" ON "company_lists"("userId");
CREATE INDEX IF NOT EXISTS "company_lists_workspaceId_userId_idx" ON "company_lists"("workspaceId", "userId");
CREATE INDEX IF NOT EXISTS "company_lists_isDefault_idx" ON "company_lists"("isDefault");
CREATE INDEX IF NOT EXISTS "company_lists_deletedAt_idx" ON "company_lists"("deletedAt");

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'company_lists_userId_fkey'
    ) THEN
        ALTER TABLE "company_lists" ADD CONSTRAINT "company_lists_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'company_lists_workspaceId_fkey'
    ) THEN
        ALTER TABLE "company_lists" ADD CONSTRAINT "company_lists_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

