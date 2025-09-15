#!/usr/bin/env node

/**
 * 🔍 NOTARY EVERYDAY WORKSPACE PROSPECTS AUDIT
 * 
 * Comprehensive audit of prospects in the Notary Everyday workspace
 * Expected: ~390 prospects
 * 
 * This script will:
 * 1. Count total prospects in Notary Everyday workspace
 * 2. Analyze prospect data quality and completeness
 * 3. Check for duplicate or orphaned records
 * 4. Verify relationships with companies and persons
 * 5. Identify any data integrity issues
 */

const { PrismaClient } = require('@prisma/client');

// Notary Everyday workspace ID
const NOTARY_EVERYDAY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';

async function auditNotaryEverydayProspects() {
  console.log('🔍 NOTARY EVERYDAY WORKSPACE PROSPECTS AUDIT');
  console.log('============================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Verify workspace exists
    console.log('1️⃣ VERIFYING WORKSPACE...');
    console.log('-------------------------');
    
    const workspace = await prisma.workspaces.findUnique({
      where: { id: NOTARY_EVERYDAY_WORKSPACE_ID },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`✅ Workspace found: ${workspace.name}`);
    console.log(`   - ID: ${workspace.id}`);
    console.log(`   - Slug: ${workspace.slug || 'none'}`);
    console.log(`   - Created: ${workspace.createdAt.toISOString()}`);
    console.log(`   - Updated: ${workspace.updatedAt.toISOString()}\n`);
    
    // 2. Count total prospects
    console.log('2️⃣ PROSPECT COUNT ANALYSIS...');
    console.log('-----------------------------');
    
    const totalProspects = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Total prospects in Notary Everyday workspace: ${totalProspects}`);
    console.log(`🎯 Expected: ~390 prospects`);
    console.log(`📈 Difference: ${totalProspects - 390} (${totalProspects > 390 ? 'more' : 'fewer'} than expected)\n`);
    
    // 3. Analyze prospect status distribution
    console.log('3️⃣ PROSPECT STATUS DISTRIBUTION...');
    console.log('----------------------------------');
    
    const statusDistribution = await prisma.prospects.groupBy({
      by: ['status'],
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    statusDistribution.forEach(status => {
      console.log(`   - ${status.status}: ${status._count.id} prospects`);
    });
    console.log('');
    
    // 4. Analyze prospect engagement levels
    console.log('4️⃣ ENGAGEMENT LEVEL DISTRIBUTION...');
    console.log('-----------------------------------');
    
    const engagementDistribution = await prisma.prospects.groupBy({
      by: ['engagementLevel'],
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    engagementDistribution.forEach(engagement => {
      console.log(`   - ${engagement.engagementLevel}: ${engagement._count.id} prospects`);
    });
    console.log('');
    
    // 5. Check for prospects with missing critical data
    console.log('5️⃣ DATA QUALITY ANALYSIS...');
    console.log('----------------------------');
    
    const missingEmail = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { email: null },
          { email: '' },
          { workEmail: null },
          { workEmail: '' }
        ]
      }
    });
    
    const missingCompany = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { company: null },
          { company: '' }
        ]
      }
    });
    
    const missingPhone = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { phone: null },
          { phone: '' },
          { mobilePhone: null },
          { mobilePhone: '' },
          { workPhone: null },
          { workPhone: '' }
        ]
      }
    });
    
    const missingPersonId = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        personId: null
      }
    });
    
    console.log(`📧 Missing email: ${missingEmail} prospects`);
    console.log(`🏢 Missing company: ${missingCompany} prospects`);
    console.log(`📞 Missing phone: ${missingPhone} prospects`);
    console.log(`👤 Missing personId: ${missingPersonId} prospects\n`);
    
    // 6. Check for duplicate prospects (same email)
    console.log('6️⃣ DUPLICATE ANALYSIS...');
    console.log('------------------------');
    
    const duplicateEmails = await prisma.prospects.groupBy({
      by: ['email'],
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        email: {
          not: null
        }
      },
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`🔄 Duplicate email addresses: ${duplicateEmails.length}`);
    if (duplicateEmails.length > 0) {
      console.log('   Top duplicates:');
      duplicateEmails.slice(0, 5).forEach(dup => {
        console.log(`   - ${dup.email}: ${dup._count.id} prospects`);
      });
    }
    console.log('');
    
    // 7. Analyze company distribution
    console.log('7️⃣ COMPANY DISTRIBUTION...');
    console.log('--------------------------');
    
    const companyDistribution = await prisma.prospects.groupBy({
      by: ['company'],
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        company: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });
    
    console.log('🏢 Top 10 companies by prospect count:');
    companyDistribution.forEach(company => {
      console.log(`   - ${company.company}: ${company._count.id} prospects`);
    });
    console.log('');
    
    // 8. Check prospects with company relationships
    console.log('8️⃣ COMPANY RELATIONSHIP ANALYSIS...');
    console.log('-----------------------------------');
    
    const prospectsWithCompanyId = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        companyId: {
          not: null
        }
      }
    });
    
    const prospectsWithCompanyName = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        company: {
          not: null
        }
      }
    });
    
    console.log(`🔗 Prospects with companyId: ${prospectsWithCompanyId}`);
    console.log(`📝 Prospects with company name: ${prospectsWithCompanyName}`);
    console.log(`📊 Company relationship coverage: ${((prospectsWithCompanyId / totalProspects) * 100).toFixed(1)}%\n`);
    
    // 9. Check for prospects that might be leads
    console.log('9️⃣ LEAD/PROSPECT CLASSIFICATION...');
    console.log('----------------------------------');
    
    const leadsInWorkspace = await prisma.leads.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`📋 Total leads in workspace: ${leadsInWorkspace}`);
    console.log(`🎯 Total prospects in workspace: ${totalProspects}`);
    console.log(`📊 Lead/Prospect ratio: ${(leadsInWorkspace / totalProspects).toFixed(2)}\n`);
    
    // 10. Recent activity analysis
    console.log('🔟 RECENT ACTIVITY ANALYSIS...');
    console.log('------------------------------');
    
    const recentProspects = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    
    const updatedProspects = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null,
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    
    console.log(`🆕 Prospects created in last 30 days: ${recentProspects}`);
    console.log(`🔄 Prospects updated in last 30 days: ${updatedProspects}\n`);
    
    // 11. Summary and recommendations
    console.log('📋 AUDIT SUMMARY & RECOMMENDATIONS');
    console.log('==================================');
    
    console.log(`✅ Total prospects found: ${totalProspects}`);
    console.log(`🎯 Expected prospects: ~390`);
    
    if (totalProspects < 390) {
      console.log(`⚠️  MISSING PROSPECTS: ${390 - totalProspects} prospects are missing`);
      console.log('   Recommendations:');
      console.log('   - Check if prospects were accidentally deleted');
      console.log('   - Verify if prospects were moved to leads');
      console.log('   - Check for prospects in other workspaces');
    } else if (totalProspects > 390) {
      console.log(`📈 EXTRA PROSPECTS: ${totalProspects - 390} more than expected`);
      console.log('   Recommendations:');
      console.log('   - Verify if these are legitimate prospects');
      console.log('   - Check for duplicate entries');
      console.log('   - Consider if some should be leads instead');
    } else {
      console.log('✅ Prospect count matches expected amount!');
    }
    
    if (missingEmail > 0) {
      console.log(`\n⚠️  ${missingEmail} prospects missing email addresses`);
    }
    
    if (missingCompany > 0) {
      console.log(`⚠️  ${missingCompany} prospects missing company information`);
    }
    
    if (duplicateEmails.length > 0) {
      console.log(`\n🔄 Found ${duplicateEmails.length} duplicate email addresses`);
      console.log('   - Review and merge duplicate prospects');
    }
    
    if (missingPersonId > 0) {
      console.log(`\n👤 ${missingPersonId} prospects missing personId relationships`);
      console.log('   - Consider linking prospects to person records');
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditNotaryEverydayProspects()
    .then(() => {
      console.log('\n✅ Audit completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { auditNotaryEverydayProspects };
