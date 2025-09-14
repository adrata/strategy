import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserAssociations() {
  try {
    console.log('🔄 Starting user association updates...');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        workspaces: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('👥 Found users:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));

    // Get all workspaces
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    console.log('🏢 Found workspaces:', workspaces.map(w => ({ id: w.id, name: w.name, slug: w.slug })));

    // Find Dano and Dan users
    const dano = users.find(u => u.email === 'dano@retail-products.com');
    const dan = users.find(u => u.email === 'dan@adrata.com');
    
    console.log('👤 Dano user:', dano ? { id: dano.id, email: dano.email } : 'Not found');
    console.log('👤 Dan user:', dan ? { id: dan.id, email: dan.email } : 'Not found');

    // Find RPS and Adrata workspaces
    const rpsWorkspace = workspaces.find(w => w.name === 'Retail Product Solutions');
    const adrataWorkspace = workspaces.find(w => w.name === 'adrata');
    
    console.log('🏢 RPS workspace:', rpsWorkspace ? { id: rpsWorkspace.id, name: rpsWorkspace.name } : 'Not found');
    console.log('🏢 Adrata workspace:', adrataWorkspace ? { id: adrataWorkspace.id, name: adrataWorkspace.name } : 'Not found');

    if (!dano || !rpsWorkspace) {
      console.log('❌ Missing required data (Dano user or RPS workspace)');
      return;
    }

    // 1. Associate Adrata partner with all users
    console.log('\n🔄 Step 1: Associating Adrata partner with all users...');
    
    if (adrataWorkspace) {
      const adrataPartners = await prisma.partners.findMany({
        where: {
          workspaceId: adrataWorkspace.id,
          name: { contains: 'Adrata', mode: 'insensitive' }
        }
      });

      console.log(`📊 Found ${adrataPartners.length} Adrata partners`);

      for (const partner of adrataPartners) {
        // Associate with all users in the Adrata workspace
        for (const user of users) {
          const userWorkspace = user.workspaces.find(w => w.id === adrataWorkspace.id);
          if (userWorkspace) {
            await prisma.partners.update({
              where: { id: partner.id },
              data: { assignedUserId: user.id }
            });
            console.log(`✅ Associated Adrata partner "${partner.name}" with user ${user.email}`);
          }
        }
      }
    }

    // 2. Associate RPS clients with Dano (not Dan)
    console.log('\n🔄 Step 2: Associating RPS clients with Dano...');
    
    const rpsClients = await prisma.clients.findMany({
      where: {
        workspaceId: rpsWorkspace.id
      }
    });

    console.log(`📊 Found ${rpsClients.length} RPS clients`);

    for (const client of rpsClients) {
      await prisma.clients.update({
        where: { id: client.id },
        data: { assignedUserId: dano.id }
      });
      console.log(`✅ Associated RPS client with Dano (${dano.email})`);
    }

    // 3. Associate RPS partners with Dano (not Dan)
    console.log('\n🔄 Step 3: Associating RPS partners with Dano...');
    
    const rpsPartners = await prisma.partners.findMany({
      where: {
        workspaceId: rpsWorkspace.id
      }
    });

    console.log(`📊 Found ${rpsPartners.length} RPS partners`);

    for (const partner of rpsPartners) {
      await prisma.partners.update({
        where: { id: partner.id },
        data: { assignedUserId: dano.id }
      });
      console.log(`✅ Associated RPS partner "${partner.name}" with Dano (${dano.email})`);
    }

    console.log('\n✅ User association updates completed successfully!');

  } catch (error) {
    console.error('❌ Error updating user associations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserAssociations();
