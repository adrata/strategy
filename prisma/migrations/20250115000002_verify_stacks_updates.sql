-- Verification migration to ensure all Stacks updates are applied
-- This migration is idempotent and safe to run multiple times

-- Verify isFlagged column exists (from 20250115000000)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StacksStory' AND column_name = 'isFlagged'
    ) THEN
        ALTER TABLE "StacksStory" ADD COLUMN "isFlagged" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Verify acceptanceCriteria column exists (from 20250115000001)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StacksStory' AND column_name = 'acceptanceCriteria'
    ) THEN
        ALTER TABLE "StacksStory" ADD COLUMN "acceptanceCriteria" TEXT;
    END IF;
END $$;

-- Verify StacksComment table exists (from 20250115000000)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'StacksComment'
    ) THEN
        CREATE TABLE "StacksComment" (
            "id" TEXT NOT NULL,
            "storyId" VARCHAR(30) NOT NULL,
            "parentId" TEXT,
            "content" TEXT NOT NULL,
            "createdById" VARCHAR(30) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deletedAt" TIMESTAMP(3),

            CONSTRAINT "StacksComment_pkey" PRIMARY KEY ("id")
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS "StacksComment_storyId_idx" ON "StacksComment"("storyId");
        CREATE INDEX IF NOT EXISTS "StacksComment_parentId_idx" ON "StacksComment"("parentId");
        CREATE INDEX IF NOT EXISTS "StacksComment_createdAt_idx" ON "StacksComment"("createdAt");
        CREATE INDEX IF NOT EXISTS "StacksComment_deletedAt_idx" ON "StacksComment"("deletedAt");

        -- Add foreign key constraints
        ALTER TABLE "StacksComment" ADD CONSTRAINT "StacksComment_storyId_fkey" 
            FOREIGN KEY ("storyId") REFERENCES "StacksStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        ALTER TABLE "StacksComment" ADD CONSTRAINT "StacksComment_parentId_fkey" 
            FOREIGN KEY ("parentId") REFERENCES "StacksComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        ALTER TABLE "StacksComment" ADD CONSTRAINT "StacksComment_createdById_fkey" 
            FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

