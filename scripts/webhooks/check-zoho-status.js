const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkZohoSetup() {
  try {
    console.log('🔍 Checking Zoho CRM setup for dano...');
    
    const zohoToken = await prisma.providerToken.findFirst({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        provider: 'zoho'
      },
      include: {
        connectedProvider: true
      }
    });
    
    if (zohoToken) {
      console.log('✅ Zoho token found');
      console.log('   Email:', zohoToken.connectedProvider?.email);
      console.log('   Expires at:', zohoToken.expiresAt);
      console.log('   Has refresh token:', !!zohoToken.refreshToken);
    } else {
      console.log('❌ No Zoho token found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkZohoSetup();
