#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTable() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Create table
    console.log('🔨 Creating api_keys table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" VARCHAR(30) NOT NULL,
        "workspaceId" VARCHAR(30) NOT NULL,
        "userId" VARCHAR(30) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "keyPrefix" VARCHAR(50) NOT NULL,
        "hashedKey" VARCHAR(255) NOT NULL,
        "lastUsedAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ Table created\n');
    
    // Create indexes (IF NOT EXISTS handles duplicates)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "api_keys_workspaceId_idx" ON "api_keys"("workspaceId")',
      'CREATE INDEX IF NOT EXISTS "api_keys_userId_idx" ON "api_keys"("userId")',
      'CREATE INDEX IF NOT EXISTS "api_keys_keyPrefix_idx" ON "api_keys"("keyPrefix")',
      'CREATE INDEX IF NOT EXISTS "api_keys_isActive_idx" ON "api_keys"("isActive")',
      'CREATE INDEX IF NOT EXISTS "api_keys_expiresAt_idx" ON "api_keys"("expiresAt")'
    ];
    
    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
        console.log(`✅ Index created: ${indexSql.substring(0, 50)}...`);
      } catch (e) {
        if (e.message?.includes('already exists')) {
          console.log(`ℹ️  Index already exists`);
        } else {
          throw e;
        }
      }
    }
    
    // Add foreign keys
    console.log('\n🔗 Adding foreign key constraints...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_workspaceId_fkey'
          ) THEN
            ALTER TABLE "api_keys" 
            ADD CONSTRAINT "api_keys_workspaceId_fkey" 
            FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Foreign key: workspaceId');
    } catch (e) {
      console.log('ℹ️  Foreign key workspaceId:', e.message?.includes('already exists') ? 'already exists' : e.message);
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_userId_fkey'
          ) THEN
            ALTER TABLE "api_keys" 
            ADD CONSTRAINT "api_keys_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Foreign key: userId');
    } catch (e) {
      console.log('ℹ️  Foreign key userId:', e.message?.includes('already exists') ? 'already exists' : e.message);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTable();

