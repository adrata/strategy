const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickEmailStatus() {
  try {
    console.log('📧 QUICK EMAIL STATUS CHECK');
    console.log('='.repeat(40));
    console.log('');
    
    // 1. Total emails
    const totalEmails = await prisma.email_messages.count();
    console.log(`📊 Total emails: ${totalEmails}`);
    
    // 2. Recent emails (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEmails = await prisma.email_messages.count({
      where: { sentAt: { gte: thirtyDaysAgo } }
    });
    console.log(`📅 Recent emails (30 days): ${recentEmails}`);
    
    // 3. Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const lastWeekEmails = await prisma.email_messages.count({
      where: { sentAt: { gte: sevenDaysAgo } }
    });
    console.log(`📅 Last 7 days: ${lastWeekEmails}`);
    
    // 4. Latest email
    const latestEmail = await prisma.email_messages.findFirst({
      orderBy: { sentAt: 'desc' },
      select: { subject: true, sentAt: true, from: true }
    });
    
    if (latestEmail) {
      console.log(`📧 Latest email: "${latestEmail.subject}"`);
      console.log(`   From: ${latestEmail.from}`);
      console.log(`   Date: ${latestEmail.sentAt.toLocaleString()}`);
    }
    
    // 5. Total links
    const totalLinks = await prisma.emailToContact.count() +
                      await prisma.emailToAccount.count() +
                      await prisma.emailToLead.count() +
                      await prisma.emailToOpportunity.count() +
                      await prisma.emailToProspect.count() +
                      await prisma.emailToPerson.count() +
                      await prisma.emailToCompany.count();
    
    console.log(`🔗 Total email links: ${totalLinks}`);
    
    // 6. Sample recent emails
    console.log('');
    console.log('📧 SAMPLE RECENT EMAILS:');
    console.log('-'.repeat(30));
    
    const sampleEmails = await prisma.email_messages.findMany({
      where: { sentAt: { gte: sevenDaysAgo } },
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: { subject: true, from: true, sentAt: true }
    });
    
    sampleEmails.forEach((email, index) => {
      console.log(`${index + 1}. "${email.subject}"`);
      console.log(`   From: ${email.from} - ${email.sentAt.toLocaleDateString()}`);
    });
    
    console.log('');
    console.log('🎯 CLIENT DEMO STATUS:');
    console.log(`   ✅ ${totalEmails} total emails processed`);
    console.log(`   ✅ ${recentEmails} recent emails (30 days)`);
    console.log(`   ✅ ${lastWeekEmails} emails this week`);
    console.log(`   ✅ ${totalLinks} entity links created`);
    console.log(`   ✅ Latest activity: ${latestEmail?.sentAt.toLocaleDateString()}`);
    
    if (recentEmails > 0) {
      console.log('');
      console.log('🚀 READY FOR CLIENT DEMO!');
      console.log('   Recent email data is available and linked');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickEmailStatus();
