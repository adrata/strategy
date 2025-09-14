const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database for data...');
    
    // Check workspaces
    const workspaces = await prisma.workspace.findMany({ take: 5 });
    console.log(`📊 Workspaces found: ${workspaces.length}`);
    workspaces.forEach(w => console.log(`  - ${w.id}: ${w.name} (${w.slug})`));
    
    // Check users
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`👥 Users found: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.id}: ${u.email} (${u.name})`));
    
    // Check workspace memberships
    const memberships = await prisma.workspaceMembership.findMany({ 
      include: { workspace: true, user: true },
      take: 5 
    });
    console.log(`🔗 Workspace memberships found: ${memberships.length}`);
    memberships.forEach(m => console.log(`  - ${m.user.email} -> ${m.workspace.name} (${m.workspace.id})`));
    
    // Check contacts
    const contacts = await prisma.contact.findMany({ take: 5 });
    console.log(`📞 Contacts found: ${contacts.length}`);
    contacts.forEach(c => console.log(`  - ${c.id}: ${c.fullName} (${c.email}) - workspace: ${c.workspaceId}`));
    
    // Check accounts
    const accounts = await prisma.account.findMany({ take: 5 });
    console.log(`🏢 Accounts found: ${accounts.length}`);
    accounts.forEach(a => console.log(`  - ${a.id}: ${a.name} - workspace: ${a.workspaceId}`));
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
