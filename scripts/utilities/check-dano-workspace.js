const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDanoWorkspace() {
  try {
    console.log('🔍 Checking Dano\'s workspace associations...\n');

    // Find Dano's user record
    const danoUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'dano@retail-products.com' },
          { email: 'dan@adrata.com' },
          { name: { contains: 'Dano' } },
          { name: { contains: 'Dan' } }
        ]
      },
      include: {
        workspaceMemberships: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (danoUser) {
      console.log('👤 Dano\'s User Record:');
      console.log(`  ID: ${danoUser.id}`);
      console.log(`  Email: ${danoUser.email}`);
      console.log(`  Name: ${danoUser.name}`);
      console.log(`  Created: ${danoUser.createdAt.toLocaleString()}`);
      
      console.log('\n🏢 Workspace Associations:');
      if (danoUser.workspaceMemberships.length > 0) {
        danoUser.workspaceMemberships.forEach(ws => {
          console.log(`  - ${ws.workspace.name} (${ws.workspace.id}) - Role: ${ws.role}`);
        });
      } else {
        console.log('  ❌ No workspace associations found');
      }
    } else {
      console.log('❌ Dano user not found');
    }

    // Check workspace membership
    const memberships = await prisma.workspaceMembership.findMany({
      where: {
        OR: [
          { workspaceId: 'retail-product-solutions' },
          { workspaceId: 'retailproductsolutions' },
          { workspaceId: 'adrata' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('\n📋 Workspace Memberships:');
    memberships.forEach(membership => {
      console.log(`  - ${membership.user.name} (${membership.user.email})`);
      console.log(`    Workspace: ${membership.workspace.name} (${membership.workspace.id})`);
      console.log(`    Role: ${membership.role} - Active: ${membership.isActive}`);
    });

    // Check workspace users
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        OR: [
          { workspaceId: 'retail-product-solutions' },
          { workspaceId: 'retailproductsolutions' },
          { workspaceId: 'adrata' }
        ]
      }
    });

    console.log('\n👥 Workspace Users:');
    workspaceUsers.forEach(wsUser => {
      console.log(`  - User ID: ${wsUser.userId}`);
      console.log(`    Workspace ID: ${wsUser.workspaceId}`);
      console.log(`    Role: ${wsUser.role}`);
    });

    // Check retail-product-solutions workspace data
    const retailWorkspace = await prisma.workspaces.findUnique({
      where: { id: 'retail-product-solutions' },
      include: {
        _count: {
          select: {
            leads: true,
            opportunities: true,
            accounts: true,
            contacts: true
          }
        }
      }
    });

    if (retailWorkspace) {
      console.log('\n📊 Retail Product Solutions Workspace Data:');
      console.log(`  Name: ${retailWorkspace.name}`);
      console.log(`  ID: ${retailWorkspace.id}`);
      console.log(`  Leads: ${retailWorkspace._count.leads}`);
      console.log(`  Opportunities: ${retailWorkspace._count.opportunities}`);
      console.log(`  Accounts: ${retailWorkspace._count.accounts}`);
      console.log(`  Contacts: ${retailWorkspace._count.contacts}`);
    }

    // Check if there are any leads/opportunities that could be used for Speedrun
    const speedrunOpportunities = await prisma.opportunities.findMany({
      where: {
        workspaceId: 'retail-product-solutions',
        stage: {
          in: ['Build Rapport', 'Qualify', 'Propose', 'Negotiate', 'Close', 'Discovery']
        }
      },
      take: 5,
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        accounts: {
          select: {
            name: true,
            contacts: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true
              }
            }
          }
        }
      }
    });

    console.log('\n🏃 Speedrun-Ready Opportunities:');
    speedrunOpportunities.forEach(opp => {
      console.log(`\n  💰 ${opp.name} (${opp.stage}) - $${opp.amount?.toLocaleString() || 'N/A'}`);
      console.log(`     Company: ${opp.accounts?.name || 'Unknown'}`);
      console.log(`     Contacts: ${opp.accounts?.contacts?.length || 0}`);
      
      if (opp.accounts?.contacts?.length > 0) {
        opp.accounts.contacts.slice(0, 3).forEach(contact => {
          console.log(`       - ${contact.firstName} ${contact.lastName} (${contact.jobTitle || 'No title'})`);
        });
        if (opp.accounts.contacts.length > 3) {
          console.log(`       ... and ${opp.accounts.contacts.length - 3} more`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking Dano workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDanoWorkspace(); 