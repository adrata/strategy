-- Add ownerId column to people table
-- This migration adds the ownerId field for multi-player sales

-- Add ownerId column
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "ownerId" VARCHAR(30);

-- Add index for performance
CREATE INDEX IF NOT EXISTS "people_ownerId_idx" ON "people"("ownerId");

-- Add composite indexes for performance
CREATE INDEX IF NOT EXISTS "people_workspaceId_ownerId_status_idx" ON "people"("workspaceId", "ownerId", "status");
CREATE INDEX IF NOT EXISTS "people_workspaceId_ownerId_status_deletedAt_idx" ON "people"("workspaceId", "ownerId", "status", "deletedAt");

-- Create person_co_sellers table if it doesn't exist
CREATE TABLE IF NOT EXISTS "person_co_sellers" (
    "id" TEXT NOT NULL,
    "personId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "person_co_sellers_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "person_co_sellers" ADD CONSTRAINT "person_co_sellers_personId_fkey" 
    FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "person_co_sellers" ADD CONSTRAINT "person_co_sellers_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for person_co_sellers
CREATE INDEX IF NOT EXISTS "person_co_sellers_personId_idx" ON "person_co_sellers"("personId");
CREATE INDEX IF NOT EXISTS "person_co_sellers_userId_idx" ON "person_co_sellers"("userId");
CREATE INDEX IF NOT EXISTS "person_co_sellers_createdAt_idx" ON "person_co_sellers"("createdAt");

-- Add unique constraint
ALTER TABLE "person_co_sellers" ADD CONSTRAINT "person_co_sellers_personId_userId_key" 
    UNIQUE ("personId", "userId");
