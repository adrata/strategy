-- Migration: Add Atrium Document Management System Tables
-- Date: 2025-01-28
-- Description: Safely add Atrium tables for document management without affecting existing data

-- Create atriumDocument table
CREATE TABLE IF NOT EXISTS "atriumDocument" (
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
    CONSTRAINT "atriumDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create atriumFolder table
CREATE TABLE IF NOT EXISTS "atriumFolder" (
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
    CONSTRAINT "atriumFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "atriumFolder"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumFolder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create atriumShare table
CREATE TABLE IF NOT EXISTS "atriumShare" (
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
    CONSTRAINT "atriumShare_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "atriumDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create atriumVersion table
CREATE TABLE IF NOT EXISTS "atriumVersion" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" VARCHAR(30) NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB,
    "contentHash" VARCHAR(64),
    "changeDescription" VARCHAR(500),
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "atriumVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "atriumDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT "atriumVersion_documentId_versionNumber_key" UNIQUE ("documentId", "versionNumber")
);

-- Create atriumComment table
CREATE TABLE IF NOT EXISTS "atriumComment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" VARCHAR(30) NOT NULL,
    "parentId" VARCHAR(30),
    "content" TEXT NOT NULL,
    "createdById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    
    -- Foreign key constraints
    CONSTRAINT "atriumComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "atriumDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "atriumComment"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create atriumActivity table
CREATE TABLE IF NOT EXISTS "atriumActivity" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" VARCHAR(30) NOT NULL,
    "activityType" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "metadata" JSONB DEFAULT '{}',
    "performedById" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "atriumActivity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "atriumDocument"("id") ON DELETE CASCADE,
    CONSTRAINT "atriumActivity_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Add foreign key constraint for atriumDocument.folderId after atriumFolder is created
ALTER TABLE "atriumDocument" 
ADD CONSTRAINT "atriumDocument_folderId_fkey" 
FOREIGN KEY ("folderId") REFERENCES "atriumFolder"("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_workspaceId" ON "atriumDocument"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_ownerId" ON "atriumDocument"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_companyId" ON "atriumDocument"("companyId");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_folderId" ON "atriumDocument"("folderId");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_documentType" ON "atriumDocument"("documentType");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_status" ON "atriumDocument"("status");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_createdAt" ON "atriumDocument"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_deletedAt" ON "atriumDocument"("deletedAt");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_workspaceId_documentType" ON "atriumDocument"("workspaceId", "documentType");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_workspaceId_status" ON "atriumDocument"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_reportType" ON "atriumDocument"("reportType");
CREATE INDEX IF NOT EXISTS "idx_atriumDocument_sourceRecordType_sourceRecordId" ON "atriumDocument"("sourceRecordType", "sourceRecordId");

CREATE INDEX IF NOT EXISTS "idx_atriumFolder_workspaceId" ON "atriumFolder"("workspaceId");
CREATE INDEX IF NOT EXISTS "idx_atriumFolder_parentId" ON "atriumFolder"("parentId");
CREATE INDEX IF NOT EXISTS "idx_atriumFolder_ownerId" ON "atriumFolder"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_atriumFolder_deletedAt" ON "atriumFolder"("deletedAt");

CREATE INDEX IF NOT EXISTS "idx_atriumShare_documentId" ON "atriumShare"("documentId");
CREATE INDEX IF NOT EXISTS "idx_atriumShare_shareToken" ON "atriumShare"("shareToken");
CREATE INDEX IF NOT EXISTS "idx_atriumShare_expiresAt" ON "atriumShare"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_atriumShare_isActive" ON "atriumShare"("isActive");

CREATE INDEX IF NOT EXISTS "idx_atriumVersion_documentId" ON "atriumVersion"("documentId");
CREATE INDEX IF NOT EXISTS "idx_atriumVersion_createdAt" ON "atriumVersion"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_atriumComment_documentId" ON "atriumComment"("documentId");
CREATE INDEX IF NOT EXISTS "idx_atriumComment_parentId" ON "atriumComment"("parentId");
CREATE INDEX IF NOT EXISTS "idx_atriumComment_createdAt" ON "atriumComment"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_atriumComment_deletedAt" ON "atriumComment"("deletedAt");

CREATE INDEX IF NOT EXISTS "idx_atriumActivity_documentId" ON "atriumActivity"("documentId");
CREATE INDEX IF NOT EXISTS "idx_atriumActivity_activityType" ON "atriumActivity"("activityType");
CREATE INDEX IF NOT EXISTS "idx_atriumActivity_createdAt" ON "atriumActivity"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_atriumActivity_performedById" ON "atriumActivity"("performedById");

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_atriumDocument_updated_at BEFORE UPDATE ON "atriumDocument" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atriumFolder_updated_at BEFORE UPDATE ON "atriumFolder" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atriumShare_updated_at BEFORE UPDATE ON "atriumShare" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atriumComment_updated_at BEFORE UPDATE ON "atriumComment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
