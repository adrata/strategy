const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateEmails() {
  try {
    console.log('🧹 CLEANING UP DUPLICATE EMAILS');
    console.log('=====================================');
    
    // Find all duplicate messageIds
    const duplicateMessageIds = await prisma.$queryRaw`
      SELECT "messageId", COUNT(*) as count
      FROM email_messages 
      WHERE "messageId" IS NOT NULL
      GROUP BY "messageId"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;
    
    console.log(`🔍 Found ${duplicateMessageIds.length} duplicate messageIds`);
    
    let totalDeleted = 0;
    
    for (const duplicate of duplicateMessageIds) {
      console.log(`\n📧 Processing messageId: ${duplicate.messageId} (${duplicate.count} copies)`);
      
      // Get all emails with this messageId
      const emails = await prisma.email_messages.findMany({
        where: { messageId: duplicate.messageId },
        orderBy: { createdAt: 'asc' } // Keep the oldest one
      });
      
      if (emails.length > 1) {
        // Keep the first (oldest) email, delete the rest
        const emailsToDelete = emails.slice(1);
        
        console.log(`   Keeping oldest email (ID: ${emails[0].id})`);
        console.log(`   Deleting ${emailsToDelete.length} duplicates`);
        
        for (const emailToDelete of emailsToDelete) {
          // First, delete all links to this email
          await Promise.all([
            prisma.emailToContact.deleteMany({ where: { A: emailToDelete.id } }),
            prisma.emailToAccount.deleteMany({ where: { A: emailToDelete.id } }),
            prisma.emailToLead.deleteMany({ where: { A: emailToDelete.id } }),
            prisma.emailToOpportunity.deleteMany({ where: { A: emailToDelete.id } }),
            prisma.emailToProspect.deleteMany({ where: { A: emailToDelete.id } }),
            prisma.emailToPerson.deleteMany({ where: { A: emailToDelete.id } }),
            prisma.emailToCompany.deleteMany({ where: { A: emailToDelete.id } })
          ]);
          
          // Then delete the email
          await prisma.email_messages.delete({
            where: { id: emailToDelete.id }
          });
          
          totalDeleted++;
        }
      }
    }
    
    console.log(`\n✅ Cleanup completed!`);
    console.log(`   Deleted ${totalDeleted} duplicate emails`);
    
    // Verify the cleanup
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT "messageId", COUNT(*) as count
      FROM email_messages 
      WHERE "messageId" IS NOT NULL
      GROUP BY "messageId"
      HAVING COUNT(*) > 1
    `;
    
    console.log(`🔍 Remaining duplicates: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('🎉 All duplicates cleaned up successfully!');
    } else {
      console.log('⚠️  Some duplicates still remain:');
      remainingDuplicates.forEach(dup => {
        console.log(`   ${dup.messageId}: ${dup.count} copies`);
      });
    }
    
    // Show final stats
    const finalEmailCount = await prisma.email_messages.count();
    console.log(`\n📊 Final email count: ${finalEmailCount}`);
    
  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateEmails();
