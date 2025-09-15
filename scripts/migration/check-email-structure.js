const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmailStructure() {
  console.log('🔍 CHECKING EMAIL MESSAGES STRUCTURE');
  console.log('====================================');
  console.log('Checking actual database structure...\n');

  try {
    // Check what fields actually exist in email_messages table
    console.log('🔄 Checking email_messages table structure...');
    
    const emailStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'email_messages'
      ORDER BY ordinal_position
    `;
    
    console.log('Email messages table structure:');
    emailStructure.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    // Try to get a sample email with basic fields
    console.log('\n🔄 Getting sample email data...');
    
    const sampleEmail = await prisma.$queryRaw`
      SELECT 
        id,
        "messageId",
        "threadId",
        subject,
        body,
        "sentAt",
        "receivedAt",
        "createdAt"
      FROM email_messages
      LIMIT 1
    `;
    
    if (sampleEmail.length > 0) {
      console.log('Sample email:');
      console.log(JSON.stringify(sampleEmail[0], null, 2));
    } else {
      console.log('No email messages found');
    }

    // Check total count
    const totalEmails = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM email_messages
    `;
    console.log(`\nTotal email messages: ${totalEmails[0].count}`);

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailStructure()
  .then(() => {
    console.log('\n✅ Email structure check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  });

