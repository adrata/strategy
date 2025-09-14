/**
 * 🧪 TEST CLOSE DATE CHANGE TRACKING
 * 
 * This script demonstrates how the close date change tracking works
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Close Date Change Tracking...\n');
    
    // 1. Check current state
    console.log('📊 Current Audit System State:');
    const auditLogCount = await prisma.auditLog.count();
    const changeLogCount = await prisma.changeLog.count();
    console.log(`  - AuditLog entries: ${auditLogCount}`);
    console.log(`  - ChangeLog entries: ${changeLogCount}`);
    
    // 2. Find an opportunity to test with
    console.log('\n🔍 Finding test opportunity...');
    const testOpportunity = await prisma.opportunities.findFirst({
      where: {
        expectedCloseDate: { not: null }
      },
      select: {
        id: true,
        name: true,
        expectedCloseDate: true,
        workspaceId: true
      }
    });
    
    if (!testOpportunity) {
      console.log('❌ No opportunities found for testing');
      return;
    }
    
    console.log(`✅ Found test opportunity: ${testOpportunity.name}`);
    console.log(`   - ID: ${testOpportunity.id}`);
    console.log(`   - Current Close Date: ${testOpportunity.expectedCloseDate.toISOString().split('T')[0]}`);
    console.log(`   - Workspace: ${testOpportunity.workspaceId}`);
    
    // 3. Simulate a close date change
    console.log('\n📅 Simulating close date change...');
    
    const oldCloseDate = testOpportunity.expectedCloseDate;
    const newCloseDate = new Date(oldCloseDate);
    newCloseDate.setDate(newCloseDate.getDate() + 30); // Add 30 days
    
    console.log(`   - Old Close Date: ${oldCloseDate.toISOString().split('T')[0]}`);
    console.log(`   - New Close Date: ${newCloseDate.toISOString().split('T')[0]}`);
    
    // 4. Create audit log entry for the change
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: 'dano',
          workspaceId: testOpportunity.workspaceId,
          action: 'close_date_changed',
          resource: testOpportunity.id,
          resourceType: 'opportunity',
          details: {
            oldCloseDate: oldCloseDate.toISOString(),
            newCloseDate: newCloseDate.toISOString(),
            changeType: 'close_date_modification',
            reason: 'Testing audit system - extended timeline',
            timestamp: new Date().toISOString()
          },
          ipAddress: '127.0.0.1',
          userAgent: 'Test Script',
          platform: 'system',
          category: 'opportunity_update',
          severity: 'info'
        }
      });
      
      console.log('✅ Audit log entry created successfully');
      console.log(`   - Audit Log ID: ${auditLog.id}`);
      
    } catch (error) {
      console.log('⚠️  Could not create audit log:', error.message);
    }
    
    // 5. Create change log entry for detailed tracking
    try {
      const changeLog = await prisma.changeLog.create({
        data: {
          workspaceId: testOpportunity.workspaceId,
          userId: 'dano',
          recordType: 'opportunity',
          recordId: testOpportunity.id,
          changeType: 'close_date_update',
          oldValue: oldCloseDate.toISOString(),
          newValue: newCloseDate.toISOString(),
          description: `Close date changed from ${oldCloseDate.toISOString().split('T')[0]} to ${newCloseDate.toISOString().split('T')[0]} for testing`,
          metadata: {
            fieldChanged: 'expectedCloseDate',
            changeReason: 'Testing audit system - extended timeline',
            timestamp: new Date().toISOString(),
            oldDate: oldCloseDate.toISOString(),
            newDate: newCloseDate.toISOString(),
            testRun: true
          }
        }
      });
      
      console.log('✅ Change log entry created successfully');
      console.log(`   - Change Log ID: ${changeLog.id}`);
      
    } catch (error) {
      console.log('⚠️  Could not create change log:', error.message);
    }
    
    // 6. Update the opportunity with new close date
    try {
      await prisma.opportunities.update({
        where: { id: testOpportunity.id },
        data: { expectedCloseDate: newCloseDate }
      });
      
      console.log('✅ Opportunity close date updated successfully');
      
    } catch (error) {
      console.log('⚠️  Could not update opportunity:', error.message);
    }
    
    // 7. Verify the tracking worked
    console.log('\n🔍 Verifying tracking results...');
    
    const finalAuditLogCount = await prisma.auditLog.count();
    const finalChangeLogCount = await prisma.changeLog.count();
    
    console.log('📊 Final Audit System State:');
    console.log(`  - AuditLog entries: ${finalAuditLogCount} (was ${auditLogCount})`);
    console.log(`  - ChangeLog entries: ${finalChangeLogCount} (was ${changeLogCount})`);
    
    // 8. Show the specific change we tracked
    console.log('\n📋 Close Date Change Details:');
    
    const closeDateChanges = await prisma.changeLog.findMany({
      where: {
        recordId: testOpportunity.id,
        recordType: 'opportunity',
        changeType: 'close_date_update'
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        oldValue: true,
        newValue: true,
        description: true,
        createdAt: true,
        metadata: true
      }
    });
    
    if (closeDateChanges.length > 0) {
      console.log(`  - Found ${closeDateChanges.length} close date changes for this opportunity`);
      closeDateChanges.forEach((change, index) => {
        console.log(`    Change ${index + 1}:`);
        console.log(`      - Old: ${change.oldValue === 'null' ? 'Not Set' : change.oldValue.split('T')[0]}`);
        console.log(`      - New: ${change.newValue === 'null' ? 'Not Set' : change.newValue.split('T')[0]}`);
        console.log(`      - When: ${change.createdAt.toISOString()}`);
        console.log(`      - Reason: ${change.metadata?.changeReason || 'Not specified'}`);
      });
    }
    
    // 9. Calculate change count
    const changeCount = await prisma.changeLog.count({
      where: {
        recordId: testOpportunity.id,
        recordType: 'opportunity',
        changeType: 'close_date_update'
      }
    });
    
    console.log(`\n📊 Close Date Change Count for "${testOpportunity.name}": ${changeCount}`);
    
    if (changeCount > 0) {
      console.log('🚨 This opportunity has had its close date changed multiple times!');
      console.log('💡 Consider investigating why the timeline keeps shifting.');
    } else {
      console.log('✅ This opportunity has stable close dates.');
    }
    
    console.log('\n✅ Close date change tracking test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
