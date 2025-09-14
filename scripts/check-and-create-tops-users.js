const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndCreateTopsUsers() {
  try {
    console.log('👥 CHECKING AND CREATING TOPS USERS\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Check existing users
    console.log('🔍 CHECKING EXISTING USERS...');
    const existingUsers = await prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'topengineersplus.com' } },
          { name: { contains: 'Victoria' } },
          { name: { contains: 'Justin' } },
          { name: { contains: 'Hilary' } }
        ]
      }
    });

    console.log(`   Found ${existingUsers.length} existing TOPS users:`);
    existingUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ${user.title || 'No title'}`);
    });
    console.log('');

    // Define required TOPS users
    const requiredUsers = [
      {
        name: 'Victoria Leland',
        email: 'vleland@topengineersplus.com',
        title: 'Business Development Manager',
        department: 'Sales'
      },
      {
        name: 'Justin Bedard',
        email: 'jbedard@topengineersplus.com',
        title: 'Chief Operating Officer',
        department: 'Operations'
      },
      {
        name: 'Hilary Tristan',
        email: 'htristan@topengineersplus.com',
        title: 'Sales Representative',
        department: 'Sales'
      }
    ];

    console.log('📋 REQUIRED TOPS USERS:');
    requiredUsers.forEach(user => {
      console.log(`   • ${user.name} - ${user.title}`);
    });
    console.log('');

    // Create missing users
    let createdUsers = 0;
    for (const userData of requiredUsers) {
      const existingUser = existingUsers.find(u => 
        u.email === userData.email || u.name === userData.name
      );

      if (!existingUser) {
        try {
          const newUser = await prisma.users.create({
            data: {
              id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: userData.name,
              email: userData.email,
              title: userData.title,
              department: userData.department,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });

          console.log(`   ✅ Created user: ${newUser.name} (${newUser.email})`);
          createdUsers++;
        } catch (error) {
          console.log(`   ❌ Error creating user ${userData.name}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ User already exists: ${existingUser.name} (${existingUser.email})`);
      }
    }

    console.log(`\n🎯 USER STATUS: ${createdUsers} new users created`);
    
    // Final user count
    const finalUsers = await prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'topengineersplus.com' } },
          { name: { contains: 'Victoria' } },
          { name: { contains: 'Justin' } },
          { name: { contains: 'Hilary' } }
        ]
      }
    });

    console.log(`   Total TOPS users: ${finalUsers.length}`);
    console.log('   Ready for data import!');

  } catch (error) {
    console.error('❌ Error checking/creating TOPS users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the user check/creation
if (require.main === module) {
  checkAndCreateTopsUsers();
}

module.exports = { checkAndCreateTopsUsers };
