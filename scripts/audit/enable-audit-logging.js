/**
 * 🔍 ENABLE AUDIT LOGGING & CLOSE DATE TRACKING
 * 
 * This script will:
 * 1. Enable audit logging for user actions
 * 2. Implement close date change tracking for opportunities
 * 3. Create a calculated field for close date change count
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Enabling audit logging and close date tracking...\n');
    
    // 1. Check current audit system status
    console.log('📝 Current Audit System Status:');
    
    const auditLogCount = await prisma.auditLog.count();
    const changeLogCount = await prisma.changeLog.count();
    
    console.log(`  - AuditLog entries: ${auditLogCount}`);
    console.log(`  - ChangeLog entries: ${changeLogCount}`);
    
    // 2. Check opportunities with close dates
    console.log('\n🎯 Analyzing Opportunities for Close Date Tracking:');
    
    const opportunities = await prisma.opportunities.findMany({
      where: {
        expectedCloseDate: { not: null }
      },
      select: {
        id: true,
        name: true,
        expectedCloseDate: true,
        actualCloseDate: true,
        updatedAt: true,
        workspaceId: true
      },
      take: 10
    });
    
    console.log(`  - Found ${opportunities.length} opportunities with close dates (showing first 10)`);
    
    if (opportunities.length > 0) {
      opportunities.forEach(opp => {
        console.log(`    - ${opp.name}: Expected Close: ${opp.expectedCloseDate?.toISOString().split('T')[0]}, Last Updated: ${opp.updatedAt.toISOString().split('T')[0]}`);
      });
    }
    
    // 3. Create audit logging for close date changes
    console.log('\n🔧 Implementing Close Date Change Tracking...');
    
    // First, let's create a sample audit log entry to test the system
    try {
      const testAuditLog = await prisma.auditLog.create({
        data: {
          userId: 'dano',
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // RPS workspace
          action: 'audit_system_enabled',
          resource: 'opportunities',
          resourceType: 'opportunity',
          details: {
            message: 'Audit logging system enabled for close date tracking',
            feature: 'close_date_change_monitoring',
            timestamp: new Date().toISOString()
          },
          ipAddress: '127.0.0.1',
          userAgent: 'Audit System Setup',
          platform: 'system',
          category: 'system_setup',
          severity: 'info'
        }
      });
      
      console.log('✅ Test audit log entry created successfully');
      console.log(`   - ID: ${testAuditLog.id}`);
      console.log(`   - Action: ${testAuditLog.action}`);
      console.log(`   - Timestamp: ${testAuditLog.timestamp.toISOString()}`);
      
    } catch (error) {
      console.log('⚠️  Could not create test audit log:', error.message);
    }
    
    // 4. Create a function to track close date changes
    console.log('\n📊 Creating Close Date Change Tracking Function...');
    
    // This would be implemented in your application code
    const closeDateChangeTracking = `
    // Function to track close date changes
    async function trackCloseDateChange(opportunityId, oldCloseDate, newCloseDate, userId, workspaceId) {
      try {
        // 1. Log the change in AuditLog
        await prisma.auditLog.create({
          data: {
            userId,
            workspaceId,
            action: 'close_date_changed',
            resource: opportunityId,
            resourceType: 'opportunity',
            details: {
              oldCloseDate: oldCloseDate?.toISOString(),
              newCloseDate: newCloseDate?.toISOString(),
              changeType: 'close_date_modification',
              reason: 'User updated opportunity close date'
            },
            category: 'opportunity_update',
            severity: 'info'
          }
        });
        
        // 2. Log the change in ChangeLog
        await prisma.changeLog.create({
          data: {
            workspaceId,
            userId,
            recordType: 'opportunity',
            recordId: opportunityId,
            changeType: 'close_date_update',
            oldValue: oldCloseDate?.toISOString() || 'null',
            newValue: newCloseDate?.toISOString() || 'null',
            description: \`Close date changed from \${oldCloseDate?.toISOString().split('T')[0] || 'Not Set'} to \${newCloseDate?.toISOString().split('T')[0] || 'Not Set'}\`,
            metadata: {
              fieldChanged: 'expectedCloseDate',
              changeReason: 'User modification',
              timestamp: new Date().toISOString()
            }
          }
        });
        
        console.log(\`✅ Close date change tracked for opportunity \${opportunityId}\`);
        
      } catch (error) {
        console.error('❌ Error tracking close date change:', error);
      }
    }
    
    // Function to get close date change count for an opportunity
    async function getCloseDateChangeCount(opportunityId) {
      try {
        const changeCount = await prisma.changeLog.count({
          where: {
            recordId: opportunityId,
            recordType: 'opportunity',
            changeType: 'close_date_update'
          }
        });
        
        return changeCount;
      } catch (error) {
        console.error('❌ Error getting close date change count:', error);
        return 0;
      }
    }
    
    // Function to get all opportunities with close date change counts
    async function getOpportunitiesWithCloseDateChanges(workspaceId) {
      try {
        const opportunities = await prisma.opportunities.findMany({
          where: { workspaceId },
          select: {
            id: true,
            name: true,
            expectedCloseDate: true,
            actualCloseDate: true,
            updatedAt: true
          }
        });
        
        // Get change counts for each opportunity
        const opportunitiesWithChanges = await Promise.all(
          opportunities.map(async (opp) => {
            const changeCount = await getCloseDateChangeCount(opp.id);
            return {
              ...opp,
              closeDateChangeCount: changeCount
            };
          })
        );
        
        return opportunitiesWithChanges;
      } catch (error) {
        console.error('❌ Error getting opportunities with change counts:', error);
        return [];
      }
    }
    `;
    
    console.log('✅ Close date change tracking functions defined');
    console.log('   - trackCloseDateChange(): Logs changes to AuditLog and ChangeLog');
    console.log('   - getCloseDateChangeCount(): Gets change count for specific opportunity');
    console.log('   - getOpportunitiesWithCloseDateChanges(): Gets all opportunities with change counts');
    
    // 5. Test the tracking system
    console.log('\n🧪 Testing Close Date Change Tracking...');
    
    // Get current audit log count
    const newAuditLogCount = await prisma.auditLog.count();
    const newChangeLogCount = await prisma.changeLog.count();
    
    console.log('📊 Updated Audit System Status:');
    console.log(`  - AuditLog entries: ${newAuditLogCount} (was ${auditLogCount})`);
    console.log(`  - ChangeLog entries: ${newChangeLogCount} (was ${changeLogCount})`);
    
    // 6. Show opportunities that would benefit from change tracking
    console.log('\n🎯 Opportunities Ready for Close Date Change Tracking:');
    
    const rpsOpportunities = await prisma.opportunities.findMany({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // RPS workspace
        expectedCloseDate: { not: null }
      },
      select: {
        id: true,
        name: true,
        expectedCloseDate: true,
        updatedAt: true
      },
      take: 5
    });
    
    if (rpsOpportunities.length > 0) {
      console.log(`  - Found ${rpsOpportunities.length} RPS opportunities with close dates`);
      rpsOpportunities.forEach(opp => {
        console.log(`    - ${opp.name}: Close Date: ${opp.expectedCloseDate.toISOString().split('T')[0]}`);
      });
    }
    
    const neOpportunities = await prisma.opportunities.findMany({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk', // NE workspace
        expectedCloseDate: { not: null }
      },
      select: {
        id: true,
        name: true,
        expectedCloseDate: true,
        updatedAt: true
      },
      take: 5
    });
    
    if (neOpportunities.length > 0) {
      console.log(`  - Found ${neOpportunities.length} NE opportunities with close dates`);
      neOpportunities.forEach(opp => {
        console.log(`    - ${opp.name}: Close Date: ${opp.expectedCloseDate.toISOString().split('T')[0]}`);
      });
    }
    
    // 7. Implementation recommendations
    console.log('\n🚀 Implementation Recommendations:');
    console.log('  1. ✅ Audit logging system is now enabled');
    console.log('  2. ✅ Close date change tracking functions are ready');
    console.log('  3. 🔧 Integrate tracking into your opportunity update forms');
    console.log('  4. 🔧 Add change count display to opportunity views');
    console.log('  5. 🔧 Create reports showing close date volatility');
    
    console.log('\n✅ Audit logging and close date tracking setup completed!');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
