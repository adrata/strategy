/**
 * Test if Prisma client has workshop models available
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testClient() {
  try {
    console.log('✅ Prisma client loaded');
    
    // Check if workshopFolder model exists
    if (prisma.workshopFolder) {
      console.log('✅ workshopFolder model is available');
      const count = await prisma.workshopFolder.count();
      console.log(`   Count: ${count}`);
    } else {
      console.log('❌ workshopFolder model NOT found');
    }
    
    // Check if workshopDocument model exists
    if (prisma.workshopDocument) {
      console.log('✅ workshopDocument model is available');
      const count = await prisma.workshopDocument.count();
      console.log(`   Count: ${count}`);
    } else {
      console.log('❌ workshopDocument model NOT found');
    }
    
    console.log('\n✅ Prisma client is working!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('workshopFolder')) {
      console.log('\n⚠️  Prisma client needs to be regenerated.');
      console.log('   Stop your dev server and run: npx prisma generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testClient();
