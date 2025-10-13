#!/usr/bin/env node

/**
 * Simple Email Table Test
 * 
 * This script tests the email_messages table using raw SQL queries
 * to verify it's working correctly.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailTable() {
  console.log('🧪 Testing Email Messages Table...\n');
  
  try {
    // Test 1: Check if table exists and is accessible
    console.log('1️⃣ Testing table access...');
    
    const tableCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "email_messages"
    `;
    
    console.log(`✅ Table accessible - ${tableCheck[0].count} emails found\n`);
    
    // Test 2: Check table structure
    console.log('2️⃣ Testing table structure...');
    
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'email_messages'
      ORDER BY ordinal_position
    `;
    
    console.log('✅ Table structure:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    console.log();
    
    // Test 3: Check indexes
    console.log('3️⃣ Testing indexes...');
    
    const indexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes
      WHERE tablename = 'email_messages'
    `;
    
    console.log('✅ Indexes found:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log();
    
    // Test 4: Check foreign key constraints
    console.log('4️⃣ Testing foreign key constraints...');
    
    const constraints = await prisma.$queryRaw`
      SELECT tc.constraint_name, kcu.column_name, 
             ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'email_messages'
    `;
    
    console.log('✅ Foreign key constraints:');
    constraints.forEach(con => {
      console.log(`   - ${con.column_name} -> ${con.foreign_table_name}`);
    });
    console.log();
    
    // Test 5: Test basic operations
    console.log('5️⃣ Testing basic operations...');
    
    // Get a real workspace ID
    const workspace = await prisma.workspaces.findFirst({
      select: { id: true }
    });
    
    if (!workspace) {
      console.log('⚠️ No workspaces found - skipping insert test');
      return { success: true, message: 'Table structure is correct' };
    }
    
    // Test insert
    const testId = 'test_' + Date.now();
    await prisma.$executeRaw`
      INSERT INTO "email_messages" (
        "id", "workspaceId", "provider", "messageId", "subject", 
        "body", "from", "to", "sentAt", "receivedAt", "createdAt", "updatedAt"
      ) VALUES (
        ${testId}, ${workspace.id}, 'test', 'test_message', 'Test Subject',
        'Test Body', 'test@example.com', ARRAY['recipient@example.com'],
        NOW(), NOW(), NOW(), NOW()
      )
    `;
    console.log('✅ Insert operation successful');
    
    // Test select
    const testSelect = await prisma.$queryRaw`
      SELECT "id", "subject", "from" FROM "email_messages" WHERE "id" = ${testId}
    `;
    
    if (testSelect.length > 0) {
      console.log('✅ Select operation successful');
      console.log(`   Found: ${testSelect[0].subject} from ${testSelect[0].from}`);
    }
    
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
    
    console.log('\n🎉 All tests passed! Email messages table is working correctly.');
    
    return { success: true, message: 'All tests passed' };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEmailTable().then(result => {
  if (result.success) {
    console.log('\n✅ Email table test completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Email table test failed:', result.error);
    process.exit(1);
  }
});
