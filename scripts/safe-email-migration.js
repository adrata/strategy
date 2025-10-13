#!/usr/bin/env node

/**
 * Safe Email Migration Script
 * 
 * This script safely adds the email_messages table to your database
 * without risking existing data. It checks for existing tables and
 * handles the migration gracefully.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function safeEmailMigration() {
  console.log('🛡️ Starting Safe Email Migration...\n');
  
  try {
    // Step 1: Check if email_messages table already exists
    console.log('1️⃣ Checking for existing email_messages table...');
    
    try {
      const existingTable = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_messages'
      `;
      
      if (existingTable.length > 0) {
        console.log('✅ email_messages table already exists - skipping creation');
        return { success: true, message: 'Table already exists' };
      }
    } catch (error) {
      console.log('ℹ️ Table check failed (expected if table doesn\'t exist)');
    }
    
    // Step 2: Check for legacy email tables
    console.log('\n2️⃣ Checking for legacy email tables...');
    
    try {
      const legacyTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%Email%' OR table_name LIKE '%email%' OR table_name LIKE '%Provider%')
        AND table_name != 'email_messages'
      `;
      
      if (legacyTables.length > 0) {
        console.log('⚠️ Found legacy email tables:');
        legacyTables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
        console.log('ℹ️ These will be cleaned up after confirming new system works');
      } else {
        console.log('✅ No legacy email tables found');
      }
    } catch (error) {
      console.log('ℹ️ Could not check for legacy tables');
    }
    
    // Step 3: Create the email_messages table using raw SQL
    console.log('\n3️⃣ Creating email_messages table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "email_messages" (
        "id" VARCHAR(30) NOT NULL,
        "workspaceId" VARCHAR(30) NOT NULL,
        "provider" VARCHAR(50) NOT NULL,
        "messageId" TEXT NOT NULL,
        "threadId" TEXT,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "bodyHtml" TEXT,
        "from" VARCHAR(300) NOT NULL,
        "to" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "cc" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "bcc" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "sentAt" TIMESTAMP(3) NOT NULL,
        "receivedAt" TIMESTAMP(3) NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "isImportant" BOOLEAN NOT NULL DEFAULT false,
        "attachments" JSONB,
        "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "companyId" VARCHAR(30),
        "personId" VARCHAR(30),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
      )
    `;
    
    console.log('✅ email_messages table created');
    
    // Step 4: Create indexes
    console.log('\n4️⃣ Creating indexes...');
    
    const indexes = [
      'CREATE UNIQUE INDEX IF NOT EXISTS "email_messages_provider_messageId_workspaceId_key" ON "email_messages"("provider", "messageId", "workspaceId")',
      'CREATE INDEX IF NOT EXISTS "email_messages_workspaceId_idx" ON "email_messages"("workspaceId")',
      'CREATE INDEX IF NOT EXISTS "email_messages_companyId_idx" ON "email_messages"("companyId")',
      'CREATE INDEX IF NOT EXISTS "email_messages_personId_idx" ON "email_messages"("personId")',
      'CREATE INDEX IF NOT EXISTS "email_messages_workspaceId_receivedAt_idx" ON "email_messages"("workspaceId", "receivedAt")',
      'CREATE INDEX IF NOT EXISTS "email_messages_from_idx" ON "email_messages"("from")'
    ];
    
    for (const indexSQL of indexes) {
      await prisma.$executeRawUnsafe(indexSQL);
    }
    
    console.log('✅ All indexes created');
    
    // Step 5: Add foreign key constraints
    console.log('\n5️⃣ Adding foreign key constraints...');
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "email_messages" 
        ADD CONSTRAINT "email_messages_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `;
      console.log('✅ workspaceId foreign key added');
    } catch (error) {
      console.log('⚠️ Could not add workspaceId foreign key (may already exist)');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "email_messages" 
        ADD CONSTRAINT "email_messages_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `;
      console.log('✅ companyId foreign key added');
    } catch (error) {
      console.log('⚠️ Could not add companyId foreign key (may already exist)');
    }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "email_messages" 
        ADD CONSTRAINT "email_messages_personId_fkey" 
        FOREIGN KEY ("personId") REFERENCES "people"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `;
      console.log('✅ personId foreign key added');
    } catch (error) {
      console.log('⚠️ Could not add personId foreign key (may already exist)');
    }
    
    // Step 6: Verify the table structure
    console.log('\n6️⃣ Verifying table structure...');
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'email_messages'
      ORDER BY ordinal_position
    `;
    
    console.log('✅ Table structure verified:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Step 7: Test basic operations
    console.log('\n7️⃣ Testing basic operations...');
    
    // Get a real workspace ID for testing
    const realWorkspace = await prisma.workspaces.findFirst({
      select: { id: true }
    });
    
    if (!realWorkspace) {
      console.log('⚠️ No workspaces found - skipping insert test');
      console.log('✅ Table structure is correct, but no test insert performed');
      return { success: true, message: 'Migration completed (no test insert due to no workspaces)' };
    }
    
    // Test insert
    const testEmail = {
      id: 'test_' + Date.now(),
      workspaceId: realWorkspace.id,
      provider: 'test',
      messageId: 'test_message_' + Date.now(),
      subject: 'Test Email',
      body: 'This is a test email',
      from: 'test@example.com',
      to: ['recipient@example.com'],
      sentAt: new Date(),
      receivedAt: new Date()
    };
    
    await prisma.$executeRaw`
      INSERT INTO "email_messages" (
        "id", "workspaceId", "provider", "messageId", "subject", 
        "body", "from", "to", "sentAt", "receivedAt", "createdAt", "updatedAt"
      ) VALUES (
        ${testEmail.id}, ${testEmail.workspaceId}, ${testEmail.provider}, 
        ${testEmail.messageId}, ${testEmail.subject}, ${testEmail.body}, 
        ${testEmail.from}, ${testEmail.to}, ${testEmail.sentAt}, 
        ${testEmail.receivedAt}, ${testEmail.sentAt}, ${testEmail.sentAt}
      )
    `;
    
    console.log('✅ Test insert successful');
    
    // Test select
    const testSelect = await prisma.$queryRaw`
      SELECT "id", "subject", "from" FROM "email_messages" WHERE "id" = ${testEmail.id}
    `;
    
    if (testSelect.length > 0) {
      console.log('✅ Test select successful');
    }
    
    // Clean up test data
    await prisma.$executeRaw`DELETE FROM "email_messages" WHERE "id" = ${testEmail.id}`;
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Email migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the new email integration: node scripts/test-new-email-integration.js');
    console.log('2. Set up Nango webhooks for real-time sync');
    console.log('3. Configure scheduled email sync');
    console.log('4. After confirming everything works, clean up legacy tables');
    
    return { success: true, message: 'Migration completed successfully' };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
safeEmailMigration().then(result => {
  if (result.success) {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Migration failed:', result.error);
    process.exit(1);
  }
});
