#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addEnhancedFields() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    console.log('🔨 Adding enhanced fields to api_keys table...\n');
    
    // Add new columns if they don't exist
    const columns = [
      { name: 'scopes', type: 'TEXT[]', default: "'{}'::text[]" },
      { name: 'allowedIps', type: 'TEXT[]', default: "'{}'::text[]" },
      { name: 'deniedIps', type: 'TEXT[]', default: "'{}'::text[]" },
      { name: 'rateLimitPerHour', type: 'INTEGER', default: '1000' },
      { name: 'rateLimitPerDay', type: 'INTEGER', default: '10000' },
      { name: 'lastRotatedAt', type: 'TIMESTAMP(3)', default: null },
      { name: 'rotationGracePeriodEndsAt', type: 'TIMESTAMP(3)', default: null }
    ];
    
    for (const col of columns) {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'api_keys' AND column_name = '${col.name}'
            ) THEN
              ${col.type.includes('[]') 
                ? `ALTER TABLE "api_keys" ADD COLUMN "${col.name}" ${col.type} DEFAULT ${col.default};`
                : `ALTER TABLE "api_keys" ADD COLUMN "${col.name}" ${col.type} DEFAULT ${col.default};`
              }
            END IF;
          END $$;
        `);
        console.log(`✅ Added column: ${col.name}`);
      } catch (e) {
        if (e.message?.includes('already exists')) {
          console.log(`ℹ️  Column ${col.name} already exists`);
        } else {
          console.error(`❌ Error adding ${col.name}:`, e.message);
        }
      }
    }
    
    // Create api_key_usage table
    console.log('\n🔨 Creating api_key_usage table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "api_key_usage" (
        "id" VARCHAR(30) NOT NULL,
        "apiKeyId" VARCHAR(30) NOT NULL,
        "endpoint" VARCHAR(255) NOT NULL,
        "method" VARCHAR(10) NOT NULL,
        "statusCode" INTEGER NOT NULL,
        "responseTime" INTEGER NOT NULL,
        "ipAddress" VARCHAR(45),
        "userAgent" VARCHAR(500),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "api_key_usage_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ api_key_usage table created\n');
    
    // Create indexes for api_key_usage
    const usageIndexes = [
      'CREATE INDEX IF NOT EXISTS "api_key_usage_apiKeyId_idx" ON "api_key_usage"("apiKeyId")',
      'CREATE INDEX IF NOT EXISTS "api_key_usage_createdAt_idx" ON "api_key_usage"("createdAt")',
      'CREATE INDEX IF NOT EXISTS "api_key_usage_endpoint_idx" ON "api_key_usage"("endpoint")',
      'CREATE INDEX IF NOT EXISTS "api_key_usage_statusCode_idx" ON "api_key_usage"("statusCode")'
    ];
    
    for (const indexSql of usageIndexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
        console.log(`✅ Index created`);
      } catch (e) {
        console.log(`ℹ️  Index:`, e.message?.includes('already exists') ? 'already exists' : e.message);
      }
    }
    
    // Add foreign key
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'api_key_usage_apiKeyId_fkey'
          ) THEN
            ALTER TABLE "api_key_usage" 
            ADD CONSTRAINT "api_key_usage_apiKeyId_fkey" 
            FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
      console.log('✅ Foreign key: apiKeyId');
    } catch (e) {
      console.log('ℹ️  Foreign key:', e.message?.includes('already exists') ? 'already exists' : e.message);
    }
    
    // Add index for lastUsedAt if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "api_keys_lastUsedAt_idx" ON "api_keys"("lastUsedAt");
      `);
      console.log('✅ Index: lastUsedAt');
    } catch (e) {
      console.log('ℹ️  Index lastUsedAt:', e.message?.includes('already exists') ? 'already exists' : e.message);
    }
    
    console.log('\n✅ Enhanced fields migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addEnhancedFields();

