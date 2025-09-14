/**
 * 🔍 SIMPLE DATABASE AUDIT SCRIPT
 * Quick examination of database state for Retail Product Solutions and Notary Everyday
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting simple database audit...\n');
    
    // 1. Check all workspaces
    console.log('🔍 Checking all workspaces...');
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`📊 Found ${workspaces.length} workspaces:`);
    workspaces.forEach(ws => {
      console.log(`  - ${ws.name} (ID: ${ws.id}, Slug: ${ws.slug || 'none'})`);
    });
    
    // 2. Look specifically for Retail Product Solutions and Notary Everyday
    console.log('\n🏪 Looking for specific business workspaces...');
    
    const rpsWorkspace = workspaces.find(ws => 
      ws.name.toLowerCase().includes('retail') || 
      ws.name.toLowerCase().includes('product') ||
      ws.slug === 'rps'
    );
    
    const neWorkspace = workspaces.find(ws => 
      ws.name.toLowerCase().includes('notary') || 
      ws.name.toLowerCase().includes('everyday') ||
      ws.slug === 'ne'
    );
    
    if (rpsWorkspace) {
      console.log(`✅ Retail Product Solutions found: ${rpsWorkspace.name} (ID: ${rpsWorkspace.id})`);
    } else {
      console.log('❌ Retail Product Solutions workspace not found');
    }
    
    if (neWorkspace) {
      console.log(`✅ Notary Everyday found: ${neWorkspace.name} (ID: ${neWorkspace.id})`);
    } else {
      console.log('❌ Notary Everyday workspace not found');
    }
    
    // 3. Check data volumes for each workspace
    if (rpsWorkspace) {
      console.log(`\n📊 Data volumes for ${rpsWorkspace.name}:`);
      const [leads, prospects, contacts, accounts] = await Promise.all([
        prisma.lead.count({ where: { workspaceId: rpsWorkspace.id } }),
        prisma.prospect.count({ where: { workspaceId: rpsWorkspace.id } }),
        prisma.contact.count({ where: { workspaceId: rpsWorkspace.id } }),
        prisma.account.count({ where: { workspaceId: rpsWorkspace.id } })
      ]);
      
      console.log(`  - Leads: ${leads}`);
      console.log(`  - Prospects: ${prospects}`);
      console.log(`  - Contacts: ${contacts}`);
      console.log(`  - Accounts: ${accounts}`);
    }
    
    if (neWorkspace) {
      console.log(`\n📊 Data volumes for ${neWorkspace.name}:`);
      const [leads, prospects, contacts, accounts] = await Promise.all([
        prisma.lead.count({ where: { workspaceId: neWorkspace.id } }),
        prisma.prospect.count({ where: { workspaceId: neWorkspace.id } }),
        prisma.contact.count({ where: { workspaceId: neWorkspace.id } }),
        prisma.account.count({ where: { workspaceId: neWorkspace.id } })
      ]);
      
      console.log(`  - Leads: ${leads}`);
      console.log(`  - Prospects: ${prospects}`);
      console.log(`  - Contacts: ${contacts}`);
      console.log(`  - Accounts: ${accounts}`);
    }
    
    // 4. Check audit log capabilities
    console.log('\n📝 Checking audit log capabilities...');
    
    try {
      const auditLogCount = await prisma.auditLog.count();
      console.log(`✅ AuditLog table exists with ${auditLogCount} entries`);
    } catch (error) {
      console.log('❌ AuditLog table not accessible:', error.message);
    }
    
    try {
      const changeLogCount = await prisma.changeLog.count();
      console.log(`✅ ChangeLog table exists with ${changeLogCount} entries`);
    } catch (error) {
      console.log('❌ ChangeLog table not accessible:', error.message);
    }
    
    // 5. Check for user 'dano'
    console.log('\n👤 Checking for user activity...');
    
    try {
      const userActivity = await prisma.auditLog.findMany({
        where: { userId: 'dano' },
        take: 5,
        orderBy: { timestamp: 'desc' }
      });
      
      console.log(`📊 Found ${userActivity.length} recent activities for dano`);
      if (userActivity.length > 0) {
        userActivity.forEach(activity => {
          console.log(`  - ${activity.timestamp}: ${activity.action} (${activity.platform || 'unknown'})`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not check user activity:', error.message);
    }
    
    // 6. Check total data volumes
    console.log('\n📈 Total database volumes:');
    
    try {
      const [totalLeads, totalProspects, totalContacts, totalAccounts] = await Promise.all([
        prisma.lead.count(),
        prisma.prospect.count(),
        prisma.contact.count(),
        prisma.account.count()
      ]);
      
      console.log(`  - Total Leads: ${totalLeads}`);
      console.log(`  - Total Prospects: ${totalProspects}`);
      console.log(`  - Total Contacts: ${totalContacts}`);
      console.log(`  - Total Accounts: ${totalAccounts}`);
    } catch (error) {
      console.log('⚠️  Could not get total counts:', error.message);
    }
    
    console.log('\n✅ Simple database audit completed!');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
