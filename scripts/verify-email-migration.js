#!/usr/bin/env node

/**
 * Verify Email Migration Script
 * 
 * This script verifies that the email_messages table was created correctly
 * and all the necessary indexes and constraints are in place.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyEmailMigration() {
  console.log('🔍 Verifying Email Migration...\n');
  
  try {
    // Check if table exists
    console.log('1️⃣ Checking if email_messages table exists...');
    
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'email_messages'
    `;
    
    if (tableExists.length === 0) {
      console.log('❌ email_messages table does not exist');
      return { success: false, error: 'Table not found' };
    }
    
    console.log('✅ email_messages table exists');
    
    // Check table structure
    console.log('\n2️⃣ Checking table structure...');
    
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'email_messages'
      ORDER BY ordinal_position
    `;
    
    const expectedColumns = [
      'id', 'workspaceId', 'provider', 'messageId', 'threadId',
      'subject', 'body', 'bodyHtml', 'from', 'to', 'cc', 'bcc',
      'sentAt', 'receivedAt', 'isRead', 'isImportant', 'attachments',
      'labels', 'companyId', 'personId', 'createdAt', 'updatedAt'
    ];
    
    const actualColumns = columns.map(col => col.column_name);
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
      return { success: false, error: 'Missing columns' };
    }
    
    console.log('✅ All expected columns present');
    
    // Check indexes
    console.log('\n3️⃣ Checking indexes...');
    
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'email_messages'
    `;
    
    const expectedIndexes = [
      'email_messages_pkey',
      'email_messages_provider_messageId_workspaceId_key',
      'email_messages_workspaceId_idx',
      'email_messages_companyId_idx',
      'email_messages_personId_idx',
      'email_messages_workspaceId_receivedAt_idx',
      'email_messages_from_idx'
    ];
    
    const actualIndexes = indexes.map(idx => idx.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !actualIndexes.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.log('❌ Missing indexes:', missingIndexes);
      return { success: false, error: 'Missing indexes' };
    }
    
    console.log('✅ All expected indexes present');
    
    // Check foreign key constraints
    console.log('\n4️⃣ Checking foreign key constraints...');
    
    const constraints = await prisma.$queryRaw`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'email_messages'
    `;
    
    const expectedConstraints = [
      'email_messages_workspaceId_fkey',
      'email_messages_companyId_fkey',
      'email_messages_personId_fkey'
    ];
    
    const actualConstraints = constraints.map(con => con.constraint_name);
    const missingConstraints = expectedConstraints.filter(con => !actualConstraints.includes(con));
    
    if (missingConstraints.length > 0) {
      console.log('❌ Missing foreign key constraints:', missingConstraints);
      return { success: false, error: 'Missing foreign key constraints' };
    }
    
    console.log('✅ All expected foreign key constraints present');
    
    // Test basic operations
    console.log('\n5️⃣ Testing basic operations...');
    
    // Get a real workspace ID for testing
    const realWorkspace = await prisma.workspaces.findFirst({
      select: { id: true }
    });
    
    if (!realWorkspace) {
      console.log('⚠️ No workspaces found - skipping insert test');
      console.log('✅ Table structure is correct, but no test insert performed');
      return { success: true, message: 'Verification completed (no test insert due to no workspaces)' };
    }
    
    // Test insert
    const testId = 'verify_' + Date.now();
    await prisma.$executeRaw`
      INSERT INTO "email_messages" (
        "id", "workspaceId", "provider", "messageId", "subject", 
        "body", "from", "to", "sentAt", "receivedAt", "createdAt", "updatedAt"
      ) VALUES (
        ${testId}, ${realWorkspace.id}, 'test', 'test_message', 'Test Subject',
        'Test Body', 'test@example.com', ARRAY['recipient@example.com'],
        NOW(), NOW(), NOW(), NOW()
      )
    `;
    console.log('✅ Insert operation successful');
    
    // Test select
    const testSelect = await prisma.$queryRaw`
      SELECT "id", "subject", "from" FROM "email_messages" WHERE "id" = ${testId}
    `;
    
    if (testSelect.length === 0) {
      console.log('❌ Select operation failed');
      return { success: false, error: 'Select operation failed' };
    }
    console.log('✅ Select operation successful');
    
    // Test update
    await prisma.$executeRaw`
      UPDATE "email_messages" 
      SET "subject" = 'Updated Subject', "updatedAt" = NOW()
      WHERE "id" = ${testId}
    `;
    console.log('✅ Update operation successful');
    
    // Test delete
    await prisma.$executeRaw`DELETE FROM "email_messages" WHERE "id" = ${testId}`;
    console.log('✅ Delete operation successful');
    
    console.log('\n🎉 Email migration verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ email_messages table exists');
    console.log('✅ All expected columns present');
    console.log('✅ All expected indexes present');
    console.log('✅ All expected foreign key constraints present');
    console.log('✅ All basic operations working');
    
    return { success: true, message: 'Verification completed successfully' };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyEmailMigration().then(result => {
  if (result.success) {
    console.log('\n✅ Verification completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Verification failed:', result.error);
    process.exit(1);
  }
});
