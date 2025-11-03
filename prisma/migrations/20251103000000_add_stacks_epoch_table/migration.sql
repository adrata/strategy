-- Create StacksEpoch table
-- This table represents higher-level items that contain epics
-- Hierarchy: Project -> Epoch -> Epic -> Story -> Task
-- 
-- SAFETY NOTES:
-- - Uses IF NOT EXISTS to prevent errors if table already exists
-- - Does not drop or modify existing data
-- - All foreign keys use ON DELETE SET NULL or CASCADE appropriately
-- - Indexes are created with IF NOT EXISTS to prevent duplicates

CREATE TABLE IF NOT EXISTS "StacksEpoch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'todo',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "product" VARCHAR(50),
    "section" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StacksEpoch_pkey" PRIMARY KEY ("id")
);

-- Create foreign key to StacksProject
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'StacksEpoch_projectId_fkey'
    ) THEN
        ALTER TABLE "StacksEpoch" 
        ADD CONSTRAINT "StacksEpoch_projectId_fkey" 
        FOREIGN KEY ("projectId") 
        REFERENCES "StacksProject"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "StacksEpoch_projectId_idx" ON "StacksEpoch"("projectId");
CREATE INDEX IF NOT EXISTS "StacksEpoch_projectId_status_idx" ON "StacksEpoch"("projectId", "status");

-- Add epochId column to StacksEpic table if it doesn't exist
-- This allows epics to belong to epochs (Epoch -> Epic relationship)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StacksEpic' 
        AND column_name = 'epochId'
    ) THEN
        ALTER TABLE "StacksEpic" 
        ADD COLUMN "epochId" TEXT;
        
        -- Add foreign key constraint
        ALTER TABLE "StacksEpic" 
        ADD CONSTRAINT "StacksEpic_epochId_fkey" 
        FOREIGN KEY ("epochId") 
        REFERENCES "StacksEpoch"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS "StacksEpic_epochId_idx" ON "StacksEpic"("epochId");
    END IF;
END $$;

-- Ensure StacksStory has epochId column (should already exist from previous migration)
-- This allows stories to belong directly to epochs (Epoch -> Story relationship)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StacksStory' 
        AND column_name = 'epochId'
    ) THEN
        ALTER TABLE "StacksStory" 
        ADD COLUMN "epochId" TEXT;
        
        -- Add foreign key constraint
        ALTER TABLE "StacksStory" 
        ADD CONSTRAINT "StacksStory_epochId_fkey" 
        FOREIGN KEY ("epochId") 
        REFERENCES "StacksEpoch"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        -- Create index if it doesn't exist
        CREATE INDEX IF NOT EXISTS "StacksStory_epochId_idx" ON "StacksStory"("epochId");
    END IF;
END $$;

-- Ensure StacksStory still has epicId column (epics should still exist)
-- This preserves the Epic -> Story relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StacksStory' 
        AND column_name = 'epicId'
    ) THEN
        ALTER TABLE "StacksStory" 
        ADD COLUMN "epicId" TEXT;
        
        -- Add foreign key constraint
        ALTER TABLE "StacksStory" 
        ADD CONSTRAINT "StacksStory_epicId_fkey" 
        FOREIGN KEY ("epicId") 
        REFERENCES "StacksEpic"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        -- Create index if it doesn't exist
        CREATE INDEX IF NOT EXISTS "StacksStory_epicId_idx" ON "StacksStory"("epicId");
    END IF;
END $$;

-- Verify StacksEpic table exists (it should, but check to be safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'StacksEpic'
    ) THEN
        -- Create StacksEpic table if it doesn't exist (shouldn't happen, but safety check)
        CREATE TABLE "StacksEpic" (
            "id" TEXT NOT NULL,
            "projectId" TEXT NOT NULL,
            "epochId" TEXT,
            "title" VARCHAR(200) NOT NULL,
            "description" TEXT,
            "status" VARCHAR(20) NOT NULL DEFAULT 'todo',
            "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
            "product" VARCHAR(50),
            "section" VARCHAR(50),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "StacksEpic_pkey" PRIMARY KEY ("id")
        );
        
        -- Add foreign key to StacksProject
        ALTER TABLE "StacksEpic" 
        ADD CONSTRAINT "StacksEpic_projectId_fkey" 
        FOREIGN KEY ("projectId") 
        REFERENCES "StacksProject"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
        
        -- Create indexes
        CREATE INDEX "StacksEpic_projectId_idx" ON "StacksEpic"("projectId");
        CREATE INDEX "StacksEpic_projectId_status_idx" ON "StacksEpic"("projectId", "status");
    END IF;
END $$;

