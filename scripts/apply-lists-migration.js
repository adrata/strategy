const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying lists migration...');
    
    // Add visibleFields to company_lists if table exists
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "company_lists" 
        ADD COLUMN IF NOT EXISTS "visibleFields" JSONB;
      `);
      console.log('✅ Added visibleFields column to company_lists');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  company_lists table does not exist yet, skipping...');
      } else {
        throw error;
      }
    }
    
    // Create lists table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "lists" (
        "id" VARCHAR(30) NOT NULL,
        "workspaceId" VARCHAR(30) NOT NULL,
        "userId" VARCHAR(30) NOT NULL,
        "section" VARCHAR(50) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(500),
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "filters" JSONB,
        "sortField" VARCHAR(50),
        "sortDirection" VARCHAR(10),
        "searchQuery" VARCHAR(500),
        "visibleFields" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ Created lists table');
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "lists_workspaceId_idx" ON "lists"("workspaceId");',
      'CREATE INDEX IF NOT EXISTS "lists_userId_idx" ON "lists"("userId");',
      'CREATE INDEX IF NOT EXISTS "lists_workspaceId_userId_idx" ON "lists"("workspaceId", "userId");',
      'CREATE INDEX IF NOT EXISTS "lists_section_idx" ON "lists"("section");',
      'CREATE INDEX IF NOT EXISTS "lists_workspaceId_section_idx" ON "lists"("workspaceId", "section");',
      'CREATE INDEX IF NOT EXISTS "lists_workspaceId_userId_section_idx" ON "lists"("workspaceId", "userId", "section");',
      'CREATE INDEX IF NOT EXISTS "lists_isDefault_idx" ON "lists"("isDefault");',
      'CREATE INDEX IF NOT EXISTS "lists_deletedAt_idx" ON "lists"("deletedAt");'
    ];
    
    for (const indexSql of indexes) {
      await prisma.$executeRawUnsafe(indexSql);
    }
    console.log('✅ Created indexes for lists table');
    
    // Add foreign keys (may fail due to permissions, but that's okay)
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'lists_userId_fkey'
          ) THEN
            ALTER TABLE "lists" ADD CONSTRAINT "lists_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'lists_workspaceId_fkey'
          ) THEN
            ALTER TABLE "lists" ADD CONSTRAINT "lists_workspaceId_fkey" 
            FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Added foreign key constraints');
    } catch (error) {
      console.log('⚠️  Could not add foreign key constraints (may require admin permissions):', error.message);
      console.log('   The table and indexes were created successfully. Foreign keys can be added later if needed.');
    }
    
    console.log('\n🎉 Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

