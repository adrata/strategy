-- Migration: Rename Atrium to Workshop
-- Date: 2025-02-01
-- Description: Complete rebrand of Atrium to Workshop - rename tables, constraints, indexes, and enum values

-- Note: PostgreSQL doesn't support renaming enum values directly, so we'll need to:
-- 1. Add the new enum value
-- 2. Update all references to use the new value
-- 3. Optionally remove the old enum value (commented out for safety)

-- Step 1: Add WORKSHOP_ACCESS to Permission enum
ALTER TYPE "public"."Permission" ADD VALUE IF NOT EXISTS 'WORKSHOP_ACCESS';

-- Step 2: Update permissions table to use WORKSHOP_ACCESS
UPDATE "permissions" 
SET "name" = 'WORKSHOP_ACCESS'::"Permission"
WHERE "name" = 'ATRIUM_ACCESS'::"Permission";

-- Step 3: Rename tables in dependency order (child tables first, then parent tables)
-- First, drop foreign key constraints that reference the tables we're renaming
ALTER TABLE "atriumShare" DROP CONSTRAINT IF EXISTS "atriumShare_documentId_fkey";
ALTER TABLE "atriumVersion" DROP CONSTRAINT IF EXISTS "atriumVersion_documentId_fkey";
ALTER TABLE "atriumComment" DROP CONSTRAINT IF EXISTS "atriumComment_documentId_fkey";
ALTER TABLE "atriumActivity" DROP CONSTRAINT IF EXISTS "atriumActivity_documentId_fkey";
ALTER TABLE "atriumDocument" DROP CONSTRAINT IF EXISTS "atriumDocument_folderId_fkey";
ALTER TABLE "atriumFolder" DROP CONSTRAINT IF EXISTS "atriumFolder_parentId_fkey";

-- Rename tables
ALTER TABLE "atriumShare" RENAME TO "workshopShare";
ALTER TABLE "atriumVersion" RENAME TO "workshopVersion";
ALTER TABLE "atriumComment" RENAME TO "workshopComment";
ALTER TABLE "atriumActivity" RENAME TO "workshopActivity";
ALTER TABLE "atriumFolder" RENAME TO "workshopFolder";
ALTER TABLE "atriumDocument" RENAME TO "workshopDocument";

-- Step 4: Rename constraints on workshopDocument
ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_ownerId_fkey" TO "workshopDocument_ownerId_fkey";
ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_workspaceId_fkey" TO "workshopDocument_workspaceId_fkey";
ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_companyId_fkey" TO "workshopDocument_companyId_fkey";
ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_createdById_fkey" TO "workshopDocument_createdById_fkey";
ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_folderId_fkey" TO "workshopDocument_folderId_fkey";
ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_pkey" TO "workshopDocument_pkey";

-- Step 5: Rename constraints on workshopFolder
ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_parentId_fkey" TO "workshopFolder_parentId_fkey";
ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_workspaceId_fkey" TO "workshopFolder_workspaceId_fkey";
ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_ownerId_fkey" TO "workshopFolder_ownerId_fkey";
ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_pkey" TO "workshopFolder_pkey";

-- Step 6: Rename constraints on workshopShare
ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_documentId_fkey" TO "workshopShare_documentId_fkey";
ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_createdById_fkey" TO "workshopShare_createdById_fkey";
ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_pkey" TO "workshopShare_pkey";
ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_shareToken_key" TO "workshopShare_shareToken_key";

-- Step 7: Rename constraints on workshopVersion
ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_documentId_fkey" TO "workshopVersion_documentId_fkey";
ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_createdById_fkey" TO "workshopVersion_createdById_fkey";
ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_pkey" TO "workshopVersion_pkey";
ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_documentId_versionNumber_key" TO "workshopVersion_documentId_versionNumber_key";

-- Step 8: Rename constraints on workshopComment
ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_documentId_fkey" TO "workshopComment_documentId_fkey";
ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_parentId_fkey" TO "workshopComment_parentId_fkey";
ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_createdById_fkey" TO "workshopComment_createdById_fkey";
ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_pkey" TO "workshopComment_pkey";

-- Step 9: Rename constraints on workshopActivity
ALTER TABLE "workshopActivity" RENAME CONSTRAINT "atriumActivity_documentId_fkey" TO "workshopActivity_documentId_fkey";
ALTER TABLE "workshopActivity" RENAME CONSTRAINT "atriumActivity_performedById_fkey" TO "workshopActivity_performedById_fkey";
ALTER TABLE "workshopActivity" RENAME CONSTRAINT "atriumActivity_pkey" TO "workshopActivity_pkey";

-- Step 10: Re-add foreign key constraints with new names
ALTER TABLE "workshopDocument" 
ADD CONSTRAINT "workshopDocument_folderId_fkey" 
FOREIGN KEY ("folderId") REFERENCES "workshopFolder"("id") ON DELETE SET NULL;

ALTER TABLE "workshopShare" 
ADD CONSTRAINT "workshopShare_documentId_fkey" 
FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;

ALTER TABLE "workshopVersion" 
ADD CONSTRAINT "workshopVersion_documentId_fkey" 
FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;

ALTER TABLE "workshopComment" 
ADD CONSTRAINT "workshopComment_documentId_fkey" 
FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;

ALTER TABLE "workshopActivity" 
ADD CONSTRAINT "workshopActivity_documentId_fkey" 
FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;

ALTER TABLE "workshopFolder" 
ADD CONSTRAINT "workshopFolder_parentId_fkey" 
FOREIGN KEY ("parentId") REFERENCES "workshopFolder"("id") ON DELETE CASCADE;

-- Step 11: Rename indexes on workshopDocument
ALTER INDEX IF EXISTS "idx_atriumDocument_workspaceId" RENAME TO "idx_workshopDocument_workspaceId";
ALTER INDEX IF EXISTS "idx_atriumDocument_ownerId" RENAME TO "idx_workshopDocument_ownerId";
ALTER INDEX IF EXISTS "idx_atriumDocument_companyId" RENAME TO "idx_workshopDocument_companyId";
ALTER INDEX IF EXISTS "idx_atriumDocument_folderId" RENAME TO "idx_workshopDocument_folderId";
ALTER INDEX IF EXISTS "idx_atriumDocument_documentType" RENAME TO "idx_workshopDocument_documentType";
ALTER INDEX IF EXISTS "idx_atriumDocument_status" RENAME TO "idx_workshopDocument_status";
ALTER INDEX IF EXISTS "idx_atriumDocument_createdAt" RENAME TO "idx_workshopDocument_createdAt";
ALTER INDEX IF EXISTS "idx_atriumDocument_deletedAt" RENAME TO "idx_workshopDocument_deletedAt";
ALTER INDEX IF EXISTS "idx_atriumDocument_workspaceId_documentType" RENAME TO "idx_workshopDocument_workspaceId_documentType";
ALTER INDEX IF EXISTS "idx_atriumDocument_workspaceId_status" RENAME TO "idx_workshopDocument_workspaceId_status";
ALTER INDEX IF EXISTS "idx_atriumDocument_reportType" RENAME TO "idx_workshopDocument_reportType";
ALTER INDEX IF EXISTS "idx_atriumDocument_sourceRecordType_sourceRecordId" RENAME TO "idx_workshopDocument_sourceRecordType_sourceRecordId";

-- Step 12: Rename indexes on workshopFolder
ALTER INDEX IF EXISTS "idx_atriumFolder_workspaceId" RENAME TO "idx_workshopFolder_workspaceId";
ALTER INDEX IF EXISTS "idx_atriumFolder_parentId" RENAME TO "idx_workshopFolder_parentId";
ALTER INDEX IF EXISTS "idx_atriumFolder_ownerId" RENAME TO "idx_workshopFolder_ownerId";
ALTER INDEX IF EXISTS "idx_atriumFolder_deletedAt" RENAME TO "idx_workshopFolder_deletedAt";

-- Step 13: Rename indexes on workshopShare
ALTER INDEX IF EXISTS "idx_atriumShare_documentId" RENAME TO "idx_workshopShare_documentId";
ALTER INDEX IF EXISTS "idx_atriumShare_shareToken" RENAME TO "idx_workshopShare_shareToken";
ALTER INDEX IF EXISTS "idx_atriumShare_expiresAt" RENAME TO "idx_workshopShare_expiresAt";
ALTER INDEX IF EXISTS "idx_atriumShare_isActive" RENAME TO "idx_workshopShare_isActive";

-- Step 14: Rename indexes on workshopVersion
ALTER INDEX IF EXISTS "idx_atriumVersion_documentId" RENAME TO "idx_workshopVersion_documentId";
ALTER INDEX IF EXISTS "idx_atriumVersion_createdAt" RENAME TO "idx_workshopVersion_createdAt";

-- Step 15: Rename indexes on workshopComment
ALTER INDEX IF EXISTS "idx_atriumComment_documentId" RENAME TO "idx_workshopComment_documentId";
ALTER INDEX IF EXISTS "idx_atriumComment_parentId" RENAME TO "idx_workshopComment_parentId";
ALTER INDEX IF EXISTS "idx_atriumComment_createdAt" RENAME TO "idx_workshopComment_createdAt";
ALTER INDEX IF EXISTS "idx_atriumComment_deletedAt" RENAME TO "idx_workshopComment_deletedAt";

-- Step 16: Rename indexes on workshopActivity
ALTER INDEX IF EXISTS "idx_atriumActivity_documentId" RENAME TO "idx_workshopActivity_documentId";
ALTER INDEX IF EXISTS "idx_atriumActivity_activityType" RENAME TO "idx_workshopActivity_activityType";
ALTER INDEX IF EXISTS "idx_atriumActivity_createdAt" RENAME TO "idx_workshopActivity_createdAt";
ALTER INDEX IF EXISTS "idx_atriumActivity_performedById" RENAME TO "idx_workshopActivity_performedById";

-- Step 17: Rename triggers
DROP TRIGGER IF EXISTS "update_atriumDocument_updated_at" ON "workshopDocument";
DROP TRIGGER IF EXISTS "update_atriumFolder_updated_at" ON "workshopFolder";
DROP TRIGGER IF EXISTS "update_atriumShare_updated_at" ON "workshopShare";
DROP TRIGGER IF EXISTS "update_atriumComment_updated_at" ON "workshopComment";

CREATE TRIGGER "update_workshopDocument_updated_at" BEFORE UPDATE ON "workshopDocument" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "update_workshopFolder_updated_at" BEFORE UPDATE ON "workshopFolder" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "update_workshopShare_updated_at" BEFORE UPDATE ON "workshopShare" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER "update_workshopComment_updated_at" BEFORE UPDATE ON "workshopComment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

