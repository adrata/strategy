const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPeopleVisibility() {
  try {
    console.log('🔍 Debugging why people are not showing in Dan\'s workspace...');
    
    // Find Dan Mirolli
    const dan = await prisma.users.findFirst({
      where: { 
        OR: [
          { name: { contains: 'mirolli', mode: 'insensitive' } },
          { email: { contains: 'mirolli', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true, activeWorkspaceId: true }
    });
    
    if (!dan) {
      console.log('❌ Dan Mirolli not found');
      return;
    }
    
    console.log('👤 Dan Mirolli:', dan);
    
    // Find Adrata workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { slug: 'adrata' },
      select: { id: true, name: true, slug: true }
    });
    
    console.log('🏢 Workspace:', workspace);
    
    // Check all people in the Adrata workspace assigned to Dan or unassigned
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        OR: [
          { mainSellerId: dan.id },
          { mainSellerId: null }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        mainSellerId: true,
        companyId: true,
        deletedAt: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });
    
    console.log(`\n📊 Total people in Adrata workspace (assigned to Dan or unassigned): ${allPeople.length}`);
    
    if (allPeople.length === 0) {
      console.log('❌ No people found in the workspace!');
    } else {
      console.log('\nPeople details:');
      allPeople.forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName} (${person.email})`);
        console.log(`   - Status: ${person.status || 'NULL'}`);
        console.log(`   - MainSellerId: ${person.mainSellerId || 'NULL'}`);
        console.log(`   - Company: ${person.company?.name || 'No company'}`);
        console.log(`   - DeletedAt: ${person.deletedAt || 'Not deleted'}`);
      });
    }
    
    // Check specifically for Winning Variant people
    console.log('\n🔍 Checking Winning Variant people specifically:');
    const winningVariantPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        company: {
          name: { contains: 'winning variant', mode: 'insensitive' }
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        mainSellerId: true,
        deletedAt: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${winningVariantPeople.length} people at Winning Variant:`);
    winningVariantPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email})`);
      console.log(`   - Status: ${person.status || 'NULL'}`);
      console.log(`   - MainSellerId: ${person.mainSellerId}`);
      console.log(`   - DeletedAt: ${person.deletedAt || 'Not deleted'}`);
    });
    
    // Check the People API filtering logic
    console.log('\n🔍 Checking what the People API would return:');
    const peopleApiWouldReturn = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        OR: [
          { mainSellerId: dan.id },
          { mainSellerId: null }
        ]
        // Note: People section might not filter by status
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        mainSellerId: true
      }
    });
    
    console.log(`People API would return: ${peopleApiWouldReturn.length} records`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPeopleVisibility();
