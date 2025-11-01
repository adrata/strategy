-- Safe Migration: Rename Atrium to Workshop
-- This checks if tables exist before renaming

-- Step 1: Add WORKSHOP_ACCESS to Permission enum (already done in part1)
-- ALTER TYPE "public"."Permission" ADD VALUE IF NOT EXISTS 'WORKSHOP_ACCESS';

-- Step 2: Update permissions table to use WORKSHOP_ACCESS (only if ATRIUM_ACCESS exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "permissions" WHERE "name" = 'ATRIUM_ACCESS'::"Permission") THEN
    UPDATE "permissions" 
    SET "name" = 'WORKSHOP_ACCESS'::"Permission"
    WHERE "name" = 'ATRIUM_ACCESS'::"Permission";
  END IF;
END $$;

-- Step 3: Rename tables only if they exist
DO $$
BEGIN
  -- Check and rename atriumShare
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'atriumShare') THEN
    ALTER TABLE "atriumShare" DROP CONSTRAINT IF EXISTS "atriumShare_documentId_fkey";
    ALTER TABLE "atriumShare" RENAME TO "workshopShare";
  END IF;
  
  -- Check and rename atriumVersion
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'atriumVersion') THEN
    ALTER TABLE "atriumVersion" DROP CONSTRAINT IF EXISTS "atriumVersion_documentId_fkey";
    ALTER TABLE "atriumVersion" RENAME TO "workshopVersion";
  END IF;
  
  -- Check and rename atriumComment
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'atriumComment') THEN
    ALTER TABLE "atriumComment" DROP CONSTRAINT IF EXISTS "atriumComment_documentId_fkey";
    ALTER TABLE "atriumComment" RENAME TO "workshopComment";
  END IF;
  
  -- Check and rename atriumActivity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'atriumActivity') THEN
    ALTER TABLE "atriumActivity" DROP CONSTRAINT IF EXISTS "atriumActivity_documentId_fkey";
    ALTER TABLE "atriumActivity" RENAME TO "workshopActivity";
  END IF;
  
  -- Check and rename atriumFolder
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'atriumFolder') THEN
    ALTER TABLE "atriumFolder" DROP CONSTRAINT IF EXISTS "atriumFolder_parentId_fkey";
    ALTER TABLE "atriumFolder" RENAME TO "workshopFolder";
  END IF;
  
  -- Check and rename atriumDocument (must be last due to dependencies)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'atriumDocument') THEN
    ALTER TABLE "atriumDocument" DROP CONSTRAINT IF EXISTS "atriumDocument_folderId_fkey";
    ALTER TABLE "atriumDocument" RENAME TO "workshopDocument";
  END IF;
END $$;

-- Step 4: Rename constraints (only if tables exist)
DO $$
BEGIN
  -- Rename constraints on workshopDocument
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopDocument') THEN
    BEGIN
      ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_ownerId_fkey" TO "workshopDocument_ownerId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_workspaceId_fkey" TO "workshopDocument_workspaceId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_companyId_fkey" TO "workshopDocument_companyId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_createdById_fkey" TO "workshopDocument_createdById_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_folderId_fkey" TO "workshopDocument_folderId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopDocument" RENAME CONSTRAINT "atriumDocument_pkey" TO "workshopDocument_pkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  -- Rename constraints on workshopFolder
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopFolder') THEN
    BEGIN
      ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_parentId_fkey" TO "workshopFolder_parentId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_workspaceId_fkey" TO "workshopFolder_workspaceId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_ownerId_fkey" TO "workshopFolder_ownerId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopFolder" RENAME CONSTRAINT "atriumFolder_pkey" TO "workshopFolder_pkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  -- Rename constraints on workshopShare
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopShare') THEN
    BEGIN
      ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_documentId_fkey" TO "workshopShare_documentId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_createdById_fkey" TO "workshopShare_createdById_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_pkey" TO "workshopShare_pkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopShare" RENAME CONSTRAINT "atriumShare_shareToken_key" TO "workshopShare_shareToken_key";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  -- Rename constraints on workshopVersion
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopVersion') THEN
    BEGIN
      ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_documentId_fkey" TO "workshopVersion_documentId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_createdById_fkey" TO "workshopVersion_createdById_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_pkey" TO "workshopVersion_pkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopVersion" RENAME CONSTRAINT "atriumVersion_documentId_versionNumber_key" TO "workshopVersion_documentId_versionNumber_key";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  -- Rename constraints on workshopComment
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopComment') THEN
    BEGIN
      ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_documentId_fkey" TO "workshopComment_documentId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_parentId_fkey" TO "workshopComment_parentId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_createdById_fkey" TO "workshopComment_createdById_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopComment" RENAME CONSTRAINT "atriumComment_pkey" TO "workshopComment_pkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  -- Rename constraints on workshopActivity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopActivity') THEN
    BEGIN
      ALTER TABLE "workshopActivity" RENAME CONSTRAINT "atriumActivity_documentId_fkey" TO "workshopActivity_documentId_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopActivity" RENAME CONSTRAINT "atriumActivity_performedById_fkey" TO "workshopActivity_performedById_fkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE "workshopActivity" RENAME CONSTRAINT "atriumActivity_pkey" TO "workshopActivity_pkey";
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Step 5: Re-add foreign key constraints (if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopDocument') AND 
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopFolder') THEN
    ALTER TABLE "workshopDocument" 
    DROP CONSTRAINT IF EXISTS "workshopDocument_folderId_fkey";
    ALTER TABLE "workshopDocument" 
    ADD CONSTRAINT "workshopDocument_folderId_fkey" 
    FOREIGN KEY ("folderId") REFERENCES "workshopFolder"("id") ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopShare') AND 
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopDocument') THEN
    ALTER TABLE "workshopShare" 
    DROP CONSTRAINT IF EXISTS "workshopShare_documentId_fkey";
    ALTER TABLE "workshopShare" 
    ADD CONSTRAINT "workshopShare_documentId_fkey" 
    FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopVersion') AND 
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopDocument') THEN
    ALTER TABLE "workshopVersion" 
    DROP CONSTRAINT IF EXISTS "workshopVersion_documentId_fkey";
    ALTER TABLE "workshopVersion" 
    ADD CONSTRAINT "workshopVersion_documentId_fkey" 
    FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopComment') AND 
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopDocument') THEN
    ALTER TABLE "workshopComment" 
    DROP CONSTRAINT IF EXISTS "workshopComment_documentId_fkey";
    ALTER TABLE "workshopComment" 
    ADD CONSTRAINT "workshopComment_documentId_fkey" 
    FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopActivity') AND 
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopDocument') THEN
    ALTER TABLE "workshopActivity" 
    DROP CONSTRAINT IF EXISTS "workshopActivity_documentId_fkey";
    ALTER TABLE "workshopActivity" 
    ADD CONSTRAINT "workshopActivity_documentId_fkey" 
    FOREIGN KEY ("documentId") REFERENCES "workshopDocument"("id") ON DELETE CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshopFolder') THEN
    ALTER TABLE "workshopFolder" 
    DROP CONSTRAINT IF EXISTS "workshopFolder_parentId_fkey";
    ALTER TABLE "workshopFolder" 
    ADD CONSTRAINT "workshopFolder_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "workshopFolder"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Note: Index and trigger renaming would continue here, but this covers the critical renaming

