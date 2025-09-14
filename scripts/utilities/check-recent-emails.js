const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentEmails() {
  try {
    console.log('🔍 Checking for recent emails in Dano\'s workspace...');
    
    // Get Dano's workspace - use the correct workspace ID
    const danoUser = await prisma.users.findFirst({
      where: { email: 'dano@retail-products.com' }
    });
    
    if (!danoUser) {
      console.log('❌ Dano user not found');
      return;
    }
    
    console.log('👤 Found Dano:', danoUser.name, 'ID:', danoUser.id);
    console.log('🏢 Active Workspace ID:', danoUser.activeWorkspaceId);
    
    // Use Dano's workspace ID
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    console.log('🏢 Using Workspace ID:', workspaceId);
    
    // Check for emails in the last 10 days
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    
    // First get email accounts for this workspace
    const emailAccounts = await prisma.email_accounts.findMany({
      where: { workspaceId: workspaceId },
      select: { id: true }
    });
    
    const accountIds = emailAccounts.map(acc => acc.id);
    
    if (accountIds.length === 0) {
      console.log('❌ No email accounts found for Dano\'s workspace');
      console.log('💡 Dano needs to connect his email account in the integrations page');
      return;
    }
    
    console.log(`📧 Found ${accountIds.length} email account(s) for Dano's workspace`);
    
    const recentEmails = await prisma.email_messages.findMany({
      where: {
        accountId: { in: accountIds },
        receivedAt: {
          gte: tenDaysAgo
        }
      },
      orderBy: { receivedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        subject: true,
        from: true,
        receivedAt: true,
        body: true,
        isRead: true
      }
    });
    
    console.log(`📧 Found ${recentEmails.length} emails in the last 10 days:`);
    
    if (recentEmails.length === 0) {
      console.log('⚠️ No emails found in the last 10 days');
      console.log('💡 This could mean:');
      console.log('   1. Email integration is not set up yet');
      console.log('   2. No emails have been received recently');
      console.log('   3. Email sync is not working properly');
      console.log('   4. Emails are being filtered out during sync');
    } else {
      recentEmails.forEach((email, index) => {
        console.log(`${index + 1}. "${email.subject}" from ${email.from} at ${email.receivedAt}`);
        if (email.subject && email.subject.toLowerCase().includes('buy')) {
          console.log('   🎯 BUYING SIGNAL EMAIL DETECTED!');
          console.log('   📄 Content preview:', email.body ? email.body.substring(0, 200) + '...' : 'No content');
        }
      });
    }
    
    // Check webhook subscription status
    console.log('\n🔔 Checking webhook subscription status...');
    const microsoftTokens = await prisma.microsoftOAuthToken.findMany({
      where: {
        email: 'dano@retail-products.com'
      },
      select: {
        email: true,
        expiresAt: true,
        isValid: true,
        subscriptionId: true,
        subscriptionExpiresAt: true
      }
    });
    
    if (microsoftTokens.length > 0) {
      const token = microsoftTokens[0];
      console.log('📧 Microsoft OAuth Status:');
      console.log('   Email:', token.email);
      console.log('   Token expires:', token.expiresAt);
      console.log('   Token valid:', token.isValid);
      console.log('   Subscription ID:', token.subscriptionId || 'None');
      console.log('   Subscription expires:', token.subscriptionExpiresAt || 'None');
      
      if (token.subscriptionId) {
        console.log('✅ Webhook subscription is active!');
      } else {
        console.log('❌ No webhook subscription found');
      }
    } else {
      console.log('❌ No Microsoft OAuth tokens found for Dano');
    }
    
  } catch (error) {
    console.error('❌ Error checking emails:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentEmails();
