-- Add isFlagged field to StacksStory
ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "isFlagged" BOOLEAN NOT NULL DEFAULT false;

-- Create StacksComment table
CREATE TABLE IF NOT EXISTS "StacksComment" (
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
ALTER TABLE "StacksComment" ADD CONSTRAINT "StacksComment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "StacksStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StacksComment" ADD CONSTRAINT "StacksComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StacksComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StacksComment" ADD CONSTRAINT "StacksComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

