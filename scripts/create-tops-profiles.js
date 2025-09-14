const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTopsProfiles() {
  try {
    console.log('👥 Creating TOPS Team Profiles...\n');

    // Check if profiles already exist
    const existingProfiles = await prisma.users.findMany({
      where: {
        OR: [
          { email: 'vleland@topengineersplus.com' },
          { email: 'mtorvik@topengineersplus.com' },
          { email: 'jbedard@topengineersplus.com' }
        ]
      }
    });

    if (existingProfiles.length > 0) {
      console.log('✅ Some TOPS profiles already exist:');
      existingProfiles.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.email})`);
      });
      console.log('');
    }

    // Create Victoria Leland - Business Development Manager
    console.log('👩‍💼 Creating Victoria Leland profile...');
    const victoria = await prisma.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Victoria Leland',
        email: 'vleland@topengineersplus.com',
        title: 'Business Development Manager',
        department: 'Sales',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Victoria Leland created: ${victoria.id}`);

    // Create Matthew Torvik - Controller (reports to Victoria)
    console.log('👨‍💼 Creating Matthew Torvik profile...');
    const matthew = await prisma.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Matthew Torvik',
        email: 'mtorvik@topengineersplus.com',
        title: 'Controller',
        department: 'Finance',
        manager: victoria.id, // Reports to Victoria
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Matthew Torvik created: ${matthew.id} (reports to Victoria)`);

    // Create Justin Bedard - Business Relationship Manager (reports to Victoria)
    console.log('👨‍💼 Creating Justin Bedard profile...');
    const justin = await prisma.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Justin Bedard',
        email: 'jbedard@topengineersplus.com',
        title: 'Business Relationship Manager',
        department: 'Sales',
        manager: victoria.id, // Reports to Victoria
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Justin Bedard created: ${justin.id} (reports to Victoria)`);

    console.log('\n🎉 TOPS TEAM PROFILES CREATED SUCCESSFULLY!');
    console.log('\n📊 TEAM STRUCTURE:');
    console.log('   👩‍💼 Victoria Leland (Business Development Manager)');
    console.log('      ├── 👨‍💼 Matthew Torvik (Controller)');
    console.log('      └── 👨‍💼 Justin Bedard (Business Relationship Manager)');
    
    console.log('\n🛡️ SAFETY CONFIRMATION:');
    console.log('   ✅ Only ADDED new profiles');
    console.log('   ✅ No existing data was modified');
    console.log('   ✅ No existing data was deleted');
    console.log('   ✅ Established proper reporting relationships');

  } catch (error) {
    console.error('❌ Error creating TOPS profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the profile creator
if (require.main === module) {
  createTopsProfiles();
}

module.exports = { createTopsProfiles };
