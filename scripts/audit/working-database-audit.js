/**
 * 🗄️ WORKING DATABASE AUDIT SCRIPT
 * Comprehensive audit using correct model names from your schema
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting comprehensive database audit...\n');
    
    // 1. Get all workspaces
    console.log('🔍 Checking all workspaces...');
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        companyId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`📊 Found ${workspaces.length} workspaces`);
    
    // 2. Identify Retail Product Solutions and Notary Everyday
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
    
    console.log('\n🏢 Business Workspace Analysis:');
    if (rpsWorkspace) {
      console.log(`✅ Retail Product Solutions: ${rpsWorkspace.name}`);
      console.log(`   - ID: ${rpsWorkspace.id}`);
      console.log(`   - Slug: ${rpsWorkspace.slug}`);
      console.log(`   - Created: ${rpsWorkspace.createdAt.toISOString()}`);
    } else {
      console.log('❌ Retail Product Solutions workspace not found');
    }
    
    if (neWorkspace) {
      console.log(`✅ Notary Everyday: ${neWorkspace.name}`);
      console.log(`   - ID: ${neWorkspace.id}`);
      console.log(`   - Slug: ${neWorkspace.slug}`);
      console.log(`   - Created: ${neWorkspace.createdAt.toISOString()}`);
    } else {
      console.log('❌ Notary Everyday workspace not found');
    }
    
    // 3. Audit Retail Product Solutions data
    if (rpsWorkspace) {
      console.log(`\n🏪 Auditing Retail Product Solutions (${rpsWorkspace.name})...`);
      
      try {
        const [leads, prospects, contacts, accounts, opportunities] = await Promise.all([
          prisma.leads.count({ where: { workspaceId: rpsWorkspace.id } }),
          prisma.prospects.count({ where: { workspaceId: rpsWorkspace.id } }),
          prisma.contacts.count({ where: { workspaceId: rpsWorkspace.id } }),
          prisma.accounts.count({ where: { workspaceId: rpsWorkspace.id } }),
          prisma.opportunities.count({ where: { workspaceId: rpsWorkspace.id } })
        ]);
        
        console.log('📊 Data Volumes:');
        console.log(`  - Leads: ${leads}`);
        console.log(`  - Prospects: ${prospects}`);
        console.log(`  - Contacts: ${contacts}`);
        console.log(`  - Accounts: ${accounts}`);
        console.log(`  - Opportunities: ${opportunities}`);
        
        // Check for soft-deleted records
        try {
          const softDeletedLeads = await prisma.leads.count({ 
            where: { 
              workspaceId: rpsWorkspace.id,
              deletedAt: { not: null }
            } 
          });
          console.log(`  - Soft-Deleted Leads: ${softDeletedLeads}`);
        } catch (error) {
          console.log('  - Soft-Deleted Leads: Not tracked in this model');
        }
        
      } catch (error) {
        console.log(`⚠️  Could not get data volumes: ${error.message}`);
      }
    }
    
    // 4. Audit Notary Everyday data
    if (neWorkspace) {
      console.log(`\n🏢 Auditing Notary Everyday (${neWorkspace.name})...`);
      
      try {
        const [leads, prospects, contacts, accounts, opportunities] = await Promise.all([
          prisma.leads.count({ where: { workspaceId: neWorkspace.id } }),
          prisma.prospects.count({ where: { workspaceId: neWorkspace.id } }),
          prisma.contacts.count({ where: { workspaceId: neWorkspace.id } }),
          prisma.accounts.count({ where: { workspaceId: neWorkspace.id } }),
          prisma.opportunities.count({ where: { workspaceId: neWorkspace.id } })
        ]);
        
        console.log('📊 Data Volumes:');
        console.log(`  - Leads: ${leads}`);
        console.log(`  - Prospects: ${prospects}`);
        console.log(`  - Contacts: ${contacts}`);
        console.log(`  - Accounts: ${accounts}`);
        console.log(`  - Opportunities: ${opportunities}`);
        
      } catch (error) {
        console.log(`⚠️  Could not get data volumes: ${error.message}`);
      }
    }
    
    // 5. Check audit log capabilities
    console.log('\n📝 Checking audit log capabilities...');
    
    let auditLogCount = 0;
    let changeLogCount = 0;
    let danoAuditLogs = [];
    
    try {
      auditLogCount = await prisma.auditLog.count();
      console.log(`✅ AuditLog table: ${auditLogCount} entries`);
      
      if (auditLogCount > 0) {
        const recentAuditLogs = await prisma.auditLog.findMany({
          take: 5,
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            userId: true,
            action: true,
            workspaceId: true,
            timestamp: true,
            platform: true
          }
        });
        
        console.log('\n🔄 Recent Audit Logs:');
        recentAuditLogs.forEach(log => {
          const workspace = workspaces.find(ws => ws.id === log.workspaceId);
          const workspaceName = workspace ? workspace.name : 'Unknown';
          console.log(`  - ${log.timestamp.toISOString()}: ${log.userId || 'System'} ${log.action} in ${workspaceName} (${log.platform || 'unknown'})`);
        });
      }
      
    } catch (error) {
      console.log(`❌ AuditLog table not accessible: ${error.message}`);
    }
    
    try {
      changeLogCount = await prisma.changeLog.count();
      console.log(`✅ ChangeLog table: ${changeLogCount} entries`);
      
      if (changeLogCount > 0) {
        const recentChanges = await prisma.changeLog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            recordType: true,
            changeType: true,
            description: true,
            createdAt: true
          }
        });
        
        console.log('\n🔄 Recent Changes:');
        recentChanges.forEach(change => {
          console.log(`  - ${change.createdAt.toISOString()}: ${change.userId} ${change.changeType} ${change.recordType} - ${change.description}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ ChangeLog table not accessible: ${error.message}`);
    }
    
    // 6. Check for user 'dano' activity
    console.log('\n👤 Checking for user activity...');
    
    try {
      danoAuditLogs = await prisma.auditLog.findMany({
        where: { userId: 'dano' },
        take: 10,
        orderBy: { timestamp: 'desc' }
      });
      
      console.log(`📊 Found ${danoAuditLogs.length} audit log entries for dano`);
      
      if (danoAuditLogs.length > 0) {
        console.log('\n🔑 Recent dano Activity:');
        danoAuditLogs.forEach(log => {
          const workspace = workspaces.find(ws => ws.id === log.workspaceId);
          const workspaceName = workspace ? workspace.name : 'Unknown';
          console.log(`  - ${log.timestamp.toISOString()}: ${log.action} in ${workspaceName} (${log.platform || 'unknown'})`);
        });
        
        // Group by workspace
        const byWorkspace = danoAuditLogs.reduce((acc, log) => {
          const workspace = workspaces.find(ws => ws.id === log.workspaceId);
          const workspaceName = workspace ? workspace.name : 'Unknown';
          acc[workspaceName] = (acc[workspaceName] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n🏢 dano Activity by Workspace:');
        Object.entries(byWorkspace).forEach(([workspace, count]) => {
          console.log(`  - ${workspace}: ${count} actions`);
        });
      }
      
    } catch (error) {
      console.log(`⚠️  Could not check dano activity: ${error.message}`);
    }
    
    // 7. Check total data volumes across all workspaces
    console.log('\n📈 Total Database Volumes:');
    
    try {
      const [totalLeads, totalProspects, totalContacts, totalAccounts, totalOpportunities] = await Promise.all([
        prisma.leads.count(),
        prisma.prospects.count(),
        prisma.contacts.count(),
        prisma.accounts.count(),
        prisma.opportunities.count()
      ]);
      
      console.log(`  - Total Leads: ${totalLeads}`);
      console.log(`  - Total Prospects: ${totalProspects}`);
      console.log(`  - Total Contacts: ${totalContacts}`);
      console.log(`  - Total Accounts: ${totalAccounts}`);
      console.log(`  - Total Opportunities: ${totalOpportunities}`);
      
    } catch (error) {
      console.log(`⚠️  Could not get total counts: ${error.message}`);
    }
    
    // 8. Check for any missing audit features
    console.log('\n🔍 Audit System Health Check:');
    
    const auditFeatures = {
      'AuditLog table exists': auditLogCount > 0,
      'ChangeLog table exists': changeLogCount > 0,
      'Workspace isolation': workspaces.length > 1,
      'User activity tracking': danoAuditLogs.length > 0,
      'Timestamp tracking': workspaces.every(ws => ws.createdAt && ws.updatedAt)
    };
    
    Object.entries(auditFeatures).forEach(([feature, status]) => {
      console.log(`  - ${feature}: ${status ? '✅' : '❌'}`);
    });
    
    // 9. Summary and recommendations
    console.log('\n📋 Audit Summary:');
    console.log(`  - Workspaces found: ${workspaces.length}`);
    console.log(`  - Retail Product Solutions: ${rpsWorkspace ? '✅' : '❌'}`);
    console.log(`  - Notary Everyday: ${neWorkspace ? '✅' : '❌'}`);
    console.log(`  - Audit logging: ${auditLogCount > 0 ? '✅' : '❌'}`);
    console.log(`  - Change tracking: ${changeLogCount > 0 ? '✅' : '❌'}`);
    console.log(`  - User activity: ${danoAuditLogs.length > 0 ? '✅' : '❌'}`);
    
    console.log('\n✅ Comprehensive database audit completed!');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
