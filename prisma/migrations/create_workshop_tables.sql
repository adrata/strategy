-- Migration: Create Workshop Document Management System Tables
-- Date: 2025-11-04
-- Description: Create workshop tables directly (workbench rebrand)

-- Create workshopDocument table
CREATE TABLE IF NOT EXISTS "workshopDocument" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "content" JSONB,
    "fileUrl" VARCHAR(1000),
    "fileType" VARCHAR(100) NOT NULL DEFAULT 'text/plain',
    "fileSize" INTEGER,
    "documentType" VARCHAR(20) NOT NULL DEFAULT 'paper',
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    -- Security & Classification
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "classification" VARCHAR(50) NOT NULL DEFAULT 'internal',
    "requiresAuth" BOOLEAN NOT NULL DEFAULT true,
    
    -- Organization
    "folderId" VARCHAR(30),
    "tags" TEXT[] DEFAULT '{}',
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    
    -- Ownership & Workspace
    "ownerId" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "companyId" VARCHAR(30),
    
    -- Analytics
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    
    -- Report-specific fields (for Chronicle integration)
    "reportType" VARCHAR(50),
    "sourceRecordId" VARCHAR(30),
    "sourceRecordType" VARCHAR(50),
    "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "createdById" VARCHAR(30) NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT "workshopDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create workshopFolder table
CREATE TABLE IF NOT EXISTS "workshopFolder" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "parentId" VARCHAR(30),
    "workspaceId" VARCHAR(30) NOT NULL,
    "ownerId" VARCHAR(30) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    
    -- Foreign key constraints
    CONSTRAINT "workshopFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "workshopFolder"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopFolder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Add foreign key constraint for workshopDocument.folderId after workshopFolder is created
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'workshopDocument_folderId_fkey'
    ) THEN
        ALTER TABLE "workshopDocument" 
        ADD CONSTRAINT "workshopDocument_folderId_fkey" 
        FOREIGN KEY ("folderId") REFERENCES "workshopFolder"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Create workshopShare table
CREATE TABLE IF NOT EXISTS "workshopShare" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" VARCHAR(30) NOT NULL,
    "shareToken" VARCHAR(100) NOT NULL UNIQUE,
    "shareUrl" VARCHAR(500),
    "permissions" TEXT[] DEFAULT '{"READ"}',
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "workshopShare_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create workshopVersion table
CREATE TABLE IF NOT EXISTS "workshopVersion" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" VARCHAR(30) NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB,
    "contentHash" VARCHAR(64),
    "changeDescription" VARCHAR(500),
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "workshopVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT "workshopVersion_documentId_versionNumber_key" UNIQUE ("documentId", "versionNumber")
);

-- Create workshopComment table
CREATE TABLE IF NOT EXISTS "workshopComment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" VARCHAR(30) NOT NULL,
    "parentId" VARCHAR(30),
    "content" TEXT NOT NULL,
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    
    -- Foreign key constraints
    CONSTRAINT "workshopComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "workshopComment"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create workshopActivity table
CREATE TABLE IF NOT EXISTS "workshopActivity" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" VARCHAR(30) NOT NULL,
    "activityType" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "metadata" JSONB DEFAULT '{}',
    "performedById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "workshopActivity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "workshopActivity_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_workspaceId" ON "workshopDocument"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_ownerId" ON "workshopDocument"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_companyId" ON "workshopDocument"("companyId");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_folderId" ON "workshopDocument"("folderId");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_documentType" ON "workshopDocument"("documentType");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_status" ON "workshopDocument"("status");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_createdAt" ON "workshopDocument"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_deletedAt" ON "workshopDocument"("deletedAt");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_workspaceId_documentType" ON "workshopDocument"("workspaceId", "documentType");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_workspaceId_status" ON "workshopDocument"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_reportType" ON "workshopDocument"("reportType");
CREATE INDEX IF NOT EXISTS "idx_workshopDocument_sourceRecordType_sourceRecordId" ON "workshopDocument"("sourceRecordType", "sourceRecordId");

CREATE INDEX IF NOT EXISTS "idx_workshopFolder_workspaceId" ON "workshopFolder"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_workshopFolder_parentId" ON "workshopFolder"("parentId");
CREATE INDEX IF NOT EXISTS "idx_workshopFolder_ownerId" ON "workshopFolder"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_workshopFolder_deletedAt" ON "workshopFolder"("deletedAt");

CREATE INDEX IF NOT EXISTS "idx_workshopShare_documentId" ON "workshopShare"("documentId");
CREATE INDEX IF NOT EXISTS "idx_workshopShare_shareToken" ON "workshopShare"("shareToken");
CREATE INDEX IF NOT EXISTS "idx_workshopShare_expiresAt" ON "workshopShare"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_workshopShare_isActive" ON "workshopShare"("isActive");

CREATE INDEX IF NOT EXISTS "idx_workshopVersion_documentId" ON "workshopVersion"("documentId");
CREATE INDEX IF NOT EXISTS "idx_workshopVersion_createdAt" ON "workshopVersion"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_workshopComment_documentId" ON "workshopComment"("documentId");
CREATE INDEX IF NOT EXISTS "idx_workshopComment_parentId" ON "workshopComment"("parentId");
CREATE INDEX IF NOT EXISTS "idx_workshopComment_createdAt" ON "workshopComment"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_workshopComment_deletedAt" ON "workshopComment"("deletedAt");

CREATE INDEX IF NOT EXISTS "idx_workshopActivity_documentId" ON "workshopActivity"("documentId");
CREATE INDEX IF NOT EXISTS "idx_workshopActivity_activityType" ON "workshopActivity"("activityType");
CREATE INDEX IF NOT EXISTS "idx_workshopActivity_createdAt" ON "workshopActivity"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_workshopActivity_performedById" ON "workshopActivity"("performedById");

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workshopDocument_updated_at BEFORE UPDATE ON "workshopDocument" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshopFolder_updated_at BEFORE UPDATE ON "workshopFolder" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshopShare_updated_at BEFORE UPDATE ON "workshopShare" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshopComment_updated_at BEFORE UPDATE ON "workshopComment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

