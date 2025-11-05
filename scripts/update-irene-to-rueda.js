const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📝 Updating Irene Serrato to Irene Rueda...');
    
    const ireneUser = await prisma.users.findUnique({
      where: { email: 'irene@notaryeveryday.com' }
    });

    if (!ireneUser) {
      console.log('❌ User irene@notaryeveryday.com not found');
      process.exit(1);
    }

    console.log('   Current name:', ireneUser.name);
    console.log('   Current firstName:', ireneUser.firstName);
    console.log('   Current lastName:', ireneUser.lastName);
    
    const updated = await prisma.users.update({
      where: { id: ireneUser.id },
      data: {
        firstName: 'Irene',
        lastName: 'Rueda',
        name: 'Irene Rueda'
      }
    });
    
    console.log('✅ Updated user:');
    console.log('   Name:', updated.name);
    console.log('   FirstName:', updated.firstName);
    console.log('   LastName:', updated.lastName);
    console.log('   Email:', updated.email);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

