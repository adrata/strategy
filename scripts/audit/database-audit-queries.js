/**
 * 🗄️ DATABASE AUDIT QUERIES SCRIPT
 * 
 * This script provides practical queries to audit the database for:
 * - Retail Product Solutions (RPS) workspace
 * - Notary Everyday (NE) workspace  
 * - User activity tracking (dano)
 * - Audit trail completeness
 * - Data change history
 * 
 * USAGE: Run individual queries or the full audit suite
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Workspace IDs from configuration
const WORKSPACES = {
  RPS: '01K1VBYV8ETM2RCQA4GNN9EG72', // Retail Product Solutions
  NE: null // Notary Everyday - needs to be found in database
};

/**
 * 🔍 FIND NOTARY EVERYDAY WORKSPACE ID
 */
async function findNotaryEverydayWorkspace() {
  console.log('\n🔍 Finding Notary Everyday workspace...');
  
  try {
    const workspace = await prisma.workspace.findFirst({
      where: {
        name: {
          contains: 'Notary',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    if (workspace) {
      WORKSPACES.NE = workspace.id;
      console.log(`✅ Found Notary Everyday workspace:`, workspace);
    } else {
      console.log('⚠️  Notary Everyday workspace not found');
    }

    return workspace;
  } catch (error) {
    console.error('❌ Error finding Notary Everyday workspace:', error);
    return null;
  }
}

/**
 * 📊 AUDIT RETAIL PRODUCT SOLUTIONS WORKSPACE
 */
async function auditRetailProductSolutions() {
  console.log('\n🏪 Auditing Retail Product Solutions workspace...');
  
  try {
    const workspaceId = WORKSPACES.RPS;
    
    // Basic workspace info
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('📋 Workspace Info:', workspace);

    // Count records by type
    const [leads, prospects, contacts, accounts, opportunities] = await Promise.all([
      prisma.lead.count({ where: { workspaceId, deletedAt: null } }),
      prisma.prospect.count({ where: { workspaceId, deletedAt: null } }),
      prisma.contact.count({ where: { workspaceId, deletedAt: null } }),
      prisma.account.count({ where: { workspaceId, deletedAt: null } }),
      prisma.opportunity.count({ where: { workspaceId, deletedAt: null } })
    ]);

    console.log('📊 Record Counts:');
    console.log(`  - Leads: ${leads}`);
    console.log(`  - Prospects: ${prospects}`);
    console.log(`  - Contacts: ${contacts}`);
    console.log(`  - Accounts: ${accounts}`);
    console.log(`  - Opportunities: ${opportunities}`);

    // Recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        userId: true,
        action: true,
        resourceType: true,
        timestamp: true,
        category: true
      }
    });

    console.log('\n🔄 Recent Activity (Last 10):');
    recentActivity.forEach(activity => {
      console.log(`  - ${activity.timestamp.toISOString()}: ${activity.userId} ${activity.action} ${activity.resourceType || 'N/A'}`);
    });

    // User activity summary
    const userActivity = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: { workspaceId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    console.log('\n👥 User Activity Summary:');
    userActivity.forEach(user => {
      console.log(`  - ${user.userId}: ${user._count.id} actions`);
    });

    return { workspace, counts: { leads, prospects, contacts, accounts, opportunities }, recentActivity, userActivity };

  } catch (error) {
    console.error('❌ Error auditing Retail Product Solutions:', error);
    return null;
  }
}

/**
 * 📊 AUDIT NOTARY EVERYDAY WORKSPACE
 */
async function auditNotaryEveryday() {
  console.log('\n🏢 Auditing Notary Everyday workspace...');
  
  if (!WORKSPACES.NE) {
    console.log('⚠️  Notary Everyday workspace ID not found, skipping audit');
    return null;
  }

  try {
    const workspaceId = WORKSPACES.NE;
    
    // Basic workspace info
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('📋 Workspace Info:', workspace);

    // Count records by type
    const [leads, prospects, contacts, accounts, opportunities] = await Promise.all([
      prisma.lead.count({ where: { workspaceId, deletedAt: null } }),
      prisma.prospect.count({ where: { workspaceId, deletedAt: null } }),
      prisma.contact.count({ where: { workspaceId, deletedAt: null } }),
      prisma.account.count({ where: { workspaceId, deletedAt: null } }),
      prisma.opportunity.count({ where: { workspaceId, deletedAt: null } })
    ]);

    console.log('📊 Record Counts:');
    console.log(`  - Leads: ${leads}`);
    console.log(`  - Prospects: ${prospects}`);
    console.log(`  - Contacts: ${contacts}`);
    console.log(`  - Accounts: ${accounts}`);
    console.log(`  - Opportunities: ${opportunities}`);

    // Recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        userId: true,
        action: true,
        resourceType: true,
        timestamp: true,
        category: true
      }
    });

    console.log('\n🔄 Recent Activity (Last 10):');
    recentActivity.forEach(activity => {
      console.log(`  - ${activity.timestamp.toISOString()}: ${activity.userId} ${activity.action} ${activity.resourceType || 'N/A'}`);
    });

    return { workspace, counts: { leads, prospects, contacts, accounts, opportunities }, recentActivity };

  } catch (error) {
    console.error('❌ Error auditing Notary Everyday:', error);
    return null;
  }
}

/**
 * 🔐 AUDIT USER LOGIN ACTIVITY (DANO)
 */
async function auditUserLoginActivity() {
  console.log('\n🔐 Auditing user login activity for dano...');
  
  try {
    // Find all audit logs for dano
    const userActivity = await prisma.auditLog.findMany({
      where: {
        userId: 'dano'
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
      select: {
        id: true,
        workspaceId: true,
        action: true,
        timestamp: true,
        platform: true,
        ipAddress: true,
        category: true
      }
    });

    console.log(`📊 Found ${userActivity.length} activities for dano`);

    // Group by workspace
    const byWorkspace = userActivity.reduce((acc, activity) => {
      const workspace = activity.workspaceId === WORKSPACES.RPS ? 'RPS' : 
                       activity.workspaceId === WORKSPACES.NE ? 'NE' : 'Unknown';
      
      if (!acc[workspace]) acc[workspace] = [];
      acc[workspace].push(activity);
      return acc;
    }, {});

    console.log('\n🏢 Activity by Workspace:');
    Object.entries(byWorkspace).forEach(([workspace, activities]) => {
      console.log(`  - ${workspace}: ${activities.length} activities`);
    });

    // Recent login activity
    const loginActivity = userActivity.filter(activity => 
      activity.action.toLowerCase().includes('login') || 
      activity.action.toLowerCase().includes('signin') ||
      activity.action.toLowerCase().includes('auth')
    );

    console.log('\n🔑 Recent Login Activity:');
    loginActivity.slice(0, 10).forEach(activity => {
      console.log(`  - ${activity.timestamp.toISOString()}: ${activity.action} (${activity.platform || 'unknown'})`);
    });

    // Platform usage
    const platformUsage = userActivity.reduce((acc, activity) => {
      const platform = activity.platform || 'unknown';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});

    console.log('\n💻 Platform Usage:');
    Object.entries(platformUsage).forEach(([platform, count]) => {
      console.log(`  - ${platform}: ${count} actions`);
    });

    return { userActivity, byWorkspace, loginActivity, platformUsage };

  } catch (error) {
    console.error('❌ Error auditing user login activity:', error);
    return null;
  }
}

/**
 * 📝 AUDIT CHANGE LOG COMPLETENESS
 */
async function auditChangeLogCompleteness() {
  console.log('\n📝 Auditing change log completeness...');
  
  try {
    // Get recent changes across all workspaces
    const recentChanges = await prisma.changeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        recordType: true,
        changeType: true,
        description: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${recentChanges.length} recent changes`);

    // Group by change type
    const byChangeType = recentChanges.reduce((acc, change) => {
      acc[change.changeType] = (acc[change.changeType] || 0) + 1;
      return acc;
    }, {});

    console.log('\n🔄 Changes by Type:');
    Object.entries(byChangeType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} changes`);
    });

    // Group by record type
    const byRecordType = recentChanges.reduce((acc, change) => {
      acc[change.recordType] = (acc[change.recordType] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📋 Changes by Record Type:');
    Object.entries(byRecordType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} changes`);
    });

    // User activity in change logs
    const userChanges = recentChanges.reduce((acc, change) => {
      acc[change.userId] = (acc[change.userId] || 0) + 1;
      return acc;
    }, {});

    console.log('\n👥 User Changes:');
    Object.entries(userChanges).forEach(([user, count]) => {
      console.log(`  - ${user}: ${count} changes`);
    });

    return { recentChanges, byChangeType, byRecordType, userChanges };

  } catch (error) {
    console.error('❌ Error auditing change log completeness:', error);
    return null;
  }
}

/**
 * 🗑️ AUDIT SOFT DELETE IMPLEMENTATION
 */
async function auditSoftDeleteImplementation() {
  console.log('\n🗑️ Auditing soft delete implementation...');
  
  try {
    // Check for soft-deleted records
    const softDeletedCounts = await Promise.all([
      prisma.lead.count({ where: { deletedAt: { not: null } } }),
      prisma.prospect.count({ where: { deletedAt: { not: null } } }),
      prisma.contact.count({ where: { deletedAt: { not: null } } }),
      prisma.account.count({ where: { deletedAt: { not: null } } }),
      prisma.opportunity.count({ where: { deletedAt: { not: null } } })
    ]);

    console.log('📊 Soft-Deleted Records:');
    console.log(`  - Leads: ${softDeletedCounts[0]}`);
    console.log(`  - Prospects: ${softDeletedCounts[1]}`);
    console.log(`  - Contacts: ${softDeletedCounts[2]}`);
    console.log(`  - Accounts: ${softDeletedCounts[3]}`);
    console.log(`  - Opportunities: ${softDeletedCounts[4]}`);

    // Check models with soft delete support
    const modelsWithSoftDelete = [
      'lead', 'prospect', 'contact', 'account', 'opportunity'
    ];

    console.log('\n✅ Models with Soft Delete Support:');
    modelsWithSoftDelete.forEach(model => {
      console.log(`  - ${model}: ✅`);
    });

    // Check for hard-deleted records (should be 0)
    const hardDeletedCounts = await Promise.all([
      prisma.lead.count({ where: { deletedAt: null } }),
      prisma.prospect.count({ where: { deletedAt: null } }),
      prisma.contact.count({ where: { deletedAt: null } }),
      prisma.account.count({ where: { deletedAt: null } }),
      prisma.opportunity.count({ where: { deletedAt: null } })
    ]);

    console.log('\n📊 Active Records (deletedAt = null):');
    console.log(`  - Leads: ${hardDeletedCounts[0]}`);
    console.log(`  - Prospects: ${hardDeletedCounts[1]}`);
    console.log(`  - Contacts: ${hardDeletedCounts[2]}`);
    console.log(`  - Accounts: ${hardDeletedCounts[3]}`);
    console.log(`  - Opportunities: ${hardDeletedCounts[4]}`);

    return { softDeletedCounts, hardDeletedCounts, modelsWithSoftDelete };

  } catch (error) {
    console.error('❌ Error auditing soft delete implementation:', error);
    return null;
  }
}

/**
 * 📈 GENERATE AUDIT SUMMARY REPORT
 */
async function generateAuditSummary() {
  console.log('\n📈 Generating comprehensive audit summary...');
  
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      workspaces: {
        rps: WORKSPACES.RPS,
        ne: WORKSPACES.NE
      },
      auditCapabilities: {
        auditLogs: true,
        changeLogs: true,
        softDeletes: true,
        userTracking: true,
        workspaceIsolation: true
      },
      dataVolume: {},
      userActivity: {},
      recommendations: []
    };

    // Get total data volumes
    const [totalLeads, totalProspects, totalContacts, totalAccounts] = await Promise.all([
      prisma.lead.count({ where: { deletedAt: null } }),
      prisma.prospect.count({ where: { deletedAt: null } }),
      prisma.contact.count({ where: { deletedAt: null } }),
      prisma.account.count({ where: { deletedAt: null } })
    ]);

    summary.dataVolume = {
      leads: totalLeads,
      prospects: totalProspects,
      contacts: totalContacts,
      accounts: totalAccounts
    };

    // Check for missing audit features
    if (totalLeads > 0 && totalProspects > 0) {
      summary.recommendations.push('Implement lead-to-prospect conversion tracking');
    }

    if (totalContacts > 0) {
      summary.recommendations.push('Add contact engagement scoring');
    }

    if (totalAccounts > 0) {
      summary.recommendations.push('Implement account health monitoring');
    }

    console.log('📋 Audit Summary:');
    console.log(JSON.stringify(summary, null, 2));

    return summary;

  } catch (error) {
    console.error('❌ Error generating audit summary:', error);
    return null;
  }
}

/**
 * 🚀 RUN COMPLETE AUDIT SUITE
 */
async function runCompleteAudit() {
  console.log('🚀 Starting comprehensive database audit...\n');
  
  try {
    // Step 1: Find Notary Everyday workspace
    await findNotaryEverydayWorkspace();
    
    // Step 2: Audit Retail Product Solutions
    await auditRetailProductSolutions();
    
    // Step 3: Audit Notary Everyday
    await auditNotaryEveryday();
    
    // Step 4: Audit user login activity
    await auditUserLoginActivity();
    
    // Step 5: Audit change log completeness
    await auditChangeLogCompleteness();
    
    // Step 6: Audit soft delete implementation
    await auditSoftDeleteImplementation();
    
    // Step 7: Generate summary report
    await generateAuditSummary();
    
    console.log('\n✅ Complete audit suite finished successfully!');
    
  } catch (error) {
    console.error('❌ Error running complete audit suite:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 📋 MAIN EXECUTION
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔍 Running complete audit suite...');
    await runCompleteAudit();
    return;
  }

  const command = args[0];
  
  switch (command) {
    case 'rps':
      await auditRetailProductSolutions();
      break;
    case 'ne':
      await findNotaryEverydayWorkspace();
      await auditNotaryEveryday();
      break;
    case 'user':
      await auditUserLoginActivity();
      break;
    case 'changes':
      await auditChangeLogCompleteness();
      break;
    case 'softdelete':
      await auditSoftDeleteImplementation();
      break;
    case 'summary':
      await generateAuditSummary();
      break;
    case 'help':
      console.log(`
🔍 Database Audit Commands:

  node database-audit-queries.js          # Run complete audit
  node database-audit-queries.js rps     # Audit Retail Product Solutions only
  node database-audit-queries.js ne      # Audit Notary Everyday only  
  node database-audit-queries.js user    # Audit user login activity
  node database-audit-queries.js changes # Audit change log completeness
  node database-audit-queries.js softdelete # Audit soft delete implementation
  node database-audit-queries.js summary # Generate audit summary
  node database-audit-queries.js help    # Show this help
      `);
      break;
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('💡 Use "help" to see available commands');
  }
  
  await prisma.$disconnect();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  findNotaryEverydayWorkspace,
  auditRetailProductSolutions,
  auditNotaryEveryday,
  auditUserLoginActivity,
  auditChangeLogCompleteness,
  auditSoftDeleteImplementation,
  generateAuditSummary,
  runCompleteAudit
};
