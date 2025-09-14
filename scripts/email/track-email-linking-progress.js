const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function trackEmailLinkingProgress() {
  try {
    console.log('📊 EMAIL LINKING PROGRESS TRACKER');
    console.log('='.repeat(50));
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log('');
    
    // Get current stats
    const totalEmails = await prisma.email_messages.count();
    
    const emailToContact = await prisma.emailToContact.count();
    const emailToLead = await prisma.emailToLead.count();
    const emailToAccount = await prisma.emailToAccount.count();
    const emailToOpportunity = await prisma.emailToOpportunity.count();
    const emailToProspect = await prisma.emailToProspect.count();
    
    const totalLinks = emailToContact + emailToLead + emailToAccount + emailToOpportunity + emailToProspect;
    
    // Calculate linked emails
    const linkedEmailIds = new Set();
    const contactLinks = await prisma.emailToContact.findMany({ select: { A: true } });
    contactLinks.forEach(link => linkedEmailIds.add(link.A));
    
    const leadLinks = await prisma.emailToLead.findMany({ select: { A: true } });
    leadLinks.forEach(link => linkedEmailIds.add(link.A));
    
    const accountLinks = await prisma.emailToAccount.findMany({ select: { A: true } });
    accountLinks.forEach(link => linkedEmailIds.add(link.A));
    
    const opportunityLinks = await prisma.emailToOpportunity.findMany({ select: { A: true } });
    opportunityLinks.forEach(link => linkedEmailIds.add(link.A));
    
    const prospectLinks = await prisma.emailToProspect.findMany({ select: { A: true } });
    prospectLinks.forEach(link => linkedEmailIds.add(link.A));
    
    const linkedEmails = linkedEmailIds.size;
    const unlinkedEmails = totalEmails - linkedEmails;
    const linkingPercentage = ((linkedEmails / totalEmails) * 100).toFixed(1);
    
    // Display progress
    console.log('📈 CURRENT PROGRESS:');
    console.log('-'.repeat(30));
    console.log(`   Total emails: ${totalEmails.toLocaleString()}`);
    console.log(`   Linked emails: ${linkedEmails.toLocaleString()} (${linkingPercentage}%)`);
    console.log(`   Unlinked emails: ${unlinkedEmails.toLocaleString()}`);
    console.log(`   Total links: ${totalLinks.toLocaleString()}`);
    console.log('');
    
    console.log('🔗 LINKING BREAKDOWN:');
    console.log('-'.repeat(30));
    console.log(`   Contact links: ${emailToContact.toLocaleString()}`);
    console.log(`   Account links: ${emailToAccount.toLocaleString()}`);
    console.log(`   Opportunity links: ${emailToOpportunity.toLocaleString()}`);
    console.log(`   Prospect links: ${emailToProspect.toLocaleString()}`);
    console.log(`   Lead links: ${emailToLead.toLocaleString()}`);
    console.log('');
    
    // Progress bar
    const progressBarLength = 50;
    const filledLength = Math.round((linkedEmails / totalEmails) * progressBarLength);
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);
    
    console.log('📊 PROGRESS BAR:');
    console.log('-'.repeat(30));
    console.log(`   [${progressBar}] ${linkingPercentage}%`);
    console.log('');
    
    // Status
    if (linkingPercentage < 50) {
      console.log('🔄 STATUS: Email linking in progress...');
      console.log('   • Background process is working');
      console.log('   • Continue monitoring');
    } else if (linkingPercentage < 80) {
      console.log('🔄 STATUS: Email linking partially complete');
      console.log('   • Good progress made');
      console.log('   • Process continuing');
    } else {
      console.log('✅ STATUS: Email linking nearly complete');
      console.log('   • Almost finished');
      console.log('   • Ready for core entity linking');
    }
    
    console.log('');
    console.log('⏰ NEXT CHECK: Run this script again in a few minutes');
    console.log('   Command: node track-email-linking-progress.js');
    
  } catch (error) {
    console.error('❌ Error tracking email linking progress:', error);
  } finally {
    await prisma.$disconnect();
  }
}

trackEmailLinkingProgress();
