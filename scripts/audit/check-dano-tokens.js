const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDanoTokens() {
  try {
    console.log('🔐 CHECKING DANO\'S TOKENS AND CREDENTIALS');
    console.log('='.repeat(50));
    console.log('');
    
    const danoUserId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Check all possible tables for tokens
    console.log('📧 Email Accounts:');
    const emailAccounts = await prisma.email_accounts.findMany({
      where: {
        OR: [
          { userId: danoUserId },
          { workspaceId: danoWorkspaceId }
        ]
      }
    });
    console.log(`   Found: ${emailAccounts.length} accounts`);
    emailAccounts.forEach(account => {
      console.log(`   - ${account.platform}: ${account.email} (${account.syncStatus})`);
    });
    console.log('');
    
    // Check if there are any other token-related tables
    console.log('🔍 Checking for other token tables...');
    
    // Try to find any tables that might contain tokens
    const tableNames = [
      'providerToken', 'oauth_tokens', 'tokens', 'credentials', 
      'user_tokens', 'workspace_tokens', 'microsoft_tokens'
    ];
    
    for (const tableName of tableNames) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        console.log(`   ${tableName}: ${result[0].count} records`);
      } catch (error) {
        // Table doesn't exist, ignore
      }
    }
    
    console.log('');
    console.log('💡 SUGGESTIONS:');
    console.log('   1. Check if Dano has connected his Microsoft account');
    console.log('   2. Verify the email sync is working');
    console.log('   3. Check if tokens are stored in a different table');
    console.log('   4. May need to re-authenticate Microsoft account');
    
  } catch (error) {
    console.error('❌ Error checking tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDanoTokens();
