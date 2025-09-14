const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDanoAccounts() {
  try {
    console.log('🔍 DEBUGGING DANO\'S ACCOUNTS');
    console.log('='.repeat(50));
    console.log('');
    
    // Get all email accounts
    const allAccounts = await prisma.email_accounts.findMany();
    
    console.log(`Total email accounts in database: ${allAccounts.length}`);
    console.log('');
    
    allAccounts.forEach((account, index) => {
      console.log(`${index + 1}. Account Details:`);
      console.log(`   ID: ${account.id}`);
      console.log(`   User ID: ${account.userId}`);
      console.log(`   Workspace ID: ${account.workspaceId}`);
      console.log(`   Platform: ${account.platform}`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Display Name: ${account.displayName}`);
      console.log(`   Active: ${account.isActive}`);
      console.log(`   Sync Status: ${account.syncStatus}`);
      console.log(`   Has Access Token: ${account.accessToken ? 'Yes' : 'No'}`);
      console.log(`   Token Expires: ${account.expiresAt ? account.expiresAt.toLocaleString() : 'N/A'}`);
      console.log(`   Last Sync: ${account.lastSyncAt.toLocaleString()}`);
      console.log('');
    });
    
    // Look for Dano specifically
    const danoAccounts = allAccounts.filter(account => 
      account.email.includes('dano') || 
      account.email.includes('retail-products')
    );
    
    console.log(`Found ${danoAccounts.length} accounts that might be Dano's:`);
    danoAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.email} (${account.platform}) - User: ${account.userId}, Workspace: ${account.workspaceId}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDanoAccounts();
