-- Add AI personality preferences to user profiles
-- This allows users to customize their AI assistant's personality

-- Create UserAIPreferences table
CREATE TABLE "UserAIPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "personalityId" TEXT NOT NULL DEFAULT 'balanced',
    "personalityName" TEXT NOT NULL DEFAULT 'Balanced Professional',
    "customPrompt" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'helpful and professional',
    "style" TEXT NOT NULL DEFAULT 'balanced',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAIPreferences_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for user + workspace combination
CREATE UNIQUE INDEX "UserAIPreferences_userId_workspaceId_key" ON "UserAIPreferences"("userId", "workspaceId");

-- Create indices for performance
CREATE INDEX "UserAIPreferences_userId_idx" ON "UserAIPreferences"("userId");
CREATE INDEX "UserAIPreferences_workspaceId_idx" ON "UserAIPreferences"("workspaceId");
CREATE INDEX "UserAIPreferences_personalityId_idx" ON "UserAIPreferences"("personalityId");

-- Add foreign key constraints
ALTER TABLE "UserAIPreferences" ADD CONSTRAINT "UserAIPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAIPreferences" ADD CONSTRAINT "UserAIPreferences_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
