const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDanBuyerGroup() {
  try {
    console.log('🎯 TESTING BUYER GROUP ANALYSIS FOR DAN');
    console.log('=====================================\n');
    
    // Find Dan's user
    const danUser = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });
    
    if (!danUser) {
      console.log('❌ Dan user not found');
      return;
    }
    
    console.log(`👤 Dan User: ${danUser.name} (${danUser.id})`);
    
    // Find Dan's Adrata workspace
    const danWorkspaces = await prisma.workspace_users.findMany({
      where: { userId: danUser.id }
    });
    
    console.log('\n🏢 Dan\'s Workspaces:');
    for (const wu of danWorkspaces) {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: wu.workspaceId }
      });
      console.log(`   • ${workspace?.name || 'Unknown'} (${wu.workspaceId})`);
    }
    
    // Find the Adrata workspace (should be the one with "Adrata" in the name)
    const adrataWorkspace = danWorkspaces.find(async (wu) => {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: wu.workspaceId }
      });
      return workspace?.name?.includes('Adrata');
    });
    
    if (!adrataWorkspace) {
      console.log('\n❌ Dan\'s Adrata workspace not found');
      return;
    }
    
    const workspace = await prisma.workspaces.findUnique({
      where: { id: adrataWorkspace.workspaceId }
    });
    
    console.log(`\n🎯 Using workspace: ${workspace.name} (${workspace.id})`);
    
    // Get one account from Dan's workspace
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId: workspace.id },
      take: 1
    });
    
    if (accounts.length === 0) {
      console.log('\n❌ No accounts found in Dan\'s workspace');
      return;
    }
    
    const testAccount = accounts[0];
    console.log(`\n📋 Test Account: ${testAccount.name}`);
    console.log(`   Website: ${testAccount.website || 'N/A'}`);
    console.log(`   Industry: ${testAccount.industry || 'N/A'}`);
    
    // Now let's test the buyer group analysis API
    console.log('\n🚀 Testing Buyer Group Analysis API...');
    
    const testData = {
      companyName: testAccount.name,
      website: testAccount.website,
      industry: testAccount.industry || 'Technology',
      dealSize: 50000,
      targetRoles: ['CEO', 'CTO', 'VP Engineering', 'Product Manager']
    };
    
    console.log('\n📊 Test Data:');
    console.log(JSON.stringify(testData, null, 2));
    
    console.log('\n✅ Ready to test buyer group analysis!');
    console.log('💡 Next step: Run the intelligence API with this account data');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDanBuyerGroup();
