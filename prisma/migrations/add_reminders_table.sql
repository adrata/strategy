-- Create reminders table
CREATE TABLE IF NOT EXISTS "reminders" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "entityType" VARCHAR(20) NOT NULL,
    "entityId" VARCHAR(30) NOT NULL,
    "reminderAt" TIMESTAMP(6) NOT NULL,
    "note" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "reminders_workspaceId_idx" ON "reminders"("workspaceId");
CREATE INDEX IF NOT EXISTS "reminders_userId_idx" ON "reminders"("userId");
CREATE INDEX IF NOT EXISTS "reminders_entityType_entityId_idx" ON "reminders"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "reminders_reminderAt_idx" ON "reminders"("reminderAt");
CREATE INDEX IF NOT EXISTS "reminders_isCompleted_idx" ON "reminders"("isCompleted");
CREATE INDEX IF NOT EXISTS "reminders_workspaceId_reminderAt_idx" ON "reminders"("workspaceId", "reminderAt");
CREATE INDEX IF NOT EXISTS "reminders_workspaceId_userId_isCompleted_idx" ON "reminders"("workspaceId", "userId", "isCompleted");
CREATE INDEX IF NOT EXISTS "reminders_workspaceId_entityType_entityId_idx" ON "reminders"("workspaceId", "entityType", "entityId");

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reminders_userId_fkey'
    ) THEN
        ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reminders_workspaceId_fkey'
    ) THEN
        ALTER TABLE "reminders" ADD CONSTRAINT "reminders_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

