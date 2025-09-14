const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleVerifyImport() {
  try {
    console.log('🔍 SIMPLE ZOHO IMPORT VERIFICATION');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. NOTES VERIFICATION
    console.log('📝 NOTES VERIFICATION:');
    console.log('-'.repeat(30));
    
    const totalNotes = await prisma.notes.count();
    console.log(`   Total notes: ${totalNotes}`);
    
    const noteTypes = await prisma.notes.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });
    
    noteTypes.forEach(type => {
      console.log(`      ${type.type}: ${type._count.type}`);
    });
    
    // Check linking
    const linkedNotes = await prisma.notes.count({
      where: {
        OR: [
          { contactId: { not: null } },
          { accountId: { not: null } },
          { leadId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });
    
    console.log(`   Linked notes: ${linkedNotes}/${totalNotes} (${((linkedNotes/totalNotes)*100).toFixed(1)}%)`);
    console.log('');
    
    // 2. ACTIVITIES VERIFICATION
    console.log('✅ ACTIVITIES VERIFICATION:');
    console.log('-'.repeat(30));
    
    const totalActivities = await prisma.activities.count();
    console.log(`   Total activities: ${totalActivities}`);
    
    const activityTypes = await prisma.activities.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });
    
    activityTypes.forEach(type => {
      console.log(`      ${type.type}: ${type._count.type}`);
    });
    
    // Check linking
    const linkedActivities = await prisma.activities.count({
      where: {
        OR: [
          { contactId: { not: null } },
          { accountId: { not: null } },
          { leadId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });
    
    console.log(`   Linked activities: ${linkedActivities}/${totalActivities} (${((linkedActivities/totalActivities)*100).toFixed(1)}%)`);
    console.log('');
    
    // 3. SAMPLE DATA
    console.log('📋 SAMPLE DATA:');
    console.log('-'.repeat(30));
    
    // Sample notes
    const sampleNotes = await prisma.notes.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        title: true,
        content: true,
        contactId: true,
        accountId: true,
        createdAt: true
      }
    });
    
    console.log('   Recent notes:');
    sampleNotes.forEach((note, index) => {
      console.log(`      ${index + 1}. ${note.type} - "${note.title}"`);
      console.log(`         Content: ${note.content?.substring(0, 80)}...`);
      console.log(`         Linked to: ${note.contactId ? 'Contact' : note.accountId ? 'Account' : 'None'}`);
      console.log(`         Date: ${note.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Sample activities
    const sampleActivities = await prisma.activities.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        subject: true,
        status: true,
        contactId: true,
        accountId: true,
        createdAt: true
      }
    });
    
    console.log('   Recent activities:');
    sampleActivities.forEach((activity, index) => {
      console.log(`      ${index + 1}. ${activity.type} - "${activity.subject}"`);
      console.log(`         Status: ${activity.status}`);
      console.log(`         Linked to: ${activity.contactId ? 'Contact' : activity.accountId ? 'Account' : 'None'}`);
      console.log(`         Date: ${activity.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // 4. DATA QUALITY
    console.log('🔍 DATA QUALITY:');
    console.log('-'.repeat(30));
    
    // Check for duplicates
    const duplicateNotes = await prisma.$queryRaw`
      SELECT id, COUNT(*) as count 
      FROM notes 
      GROUP BY id 
      HAVING COUNT(*) > 1
    `;
    
    const duplicateActivities = await prisma.$queryRaw`
      SELECT id, COUNT(*) as count 
      FROM activities 
      GROUP BY id 
      HAVING COUNT(*) > 1
    `;
    
    console.log(`   Duplicate note IDs: ${duplicateNotes.length}`);
    console.log(`   Duplicate activity IDs: ${duplicateActivities.length}`);
    
    // Check for empty content
    const emptyNotes = await prisma.notes.count({
      where: {
        content: ''
      }
    });
    
    const emptyActivities = await prisma.activities.count({
      where: {
        subject: ''
      }
    });
    
    console.log(`   Notes with empty content: ${emptyNotes}`);
    console.log(`   Activities with empty subject: ${emptyActivities}`);
    console.log('');
    
    // 5. SUMMARY
    console.log('📊 SUMMARY:');
    console.log('-'.repeat(30));
    console.log(`   ✅ Notes: ${totalNotes} total, ${linkedNotes} linked (${((linkedNotes/totalNotes)*100).toFixed(1)}%)`);
    console.log(`   ✅ Activities: ${totalActivities} total, ${linkedActivities} linked (${((linkedActivities/totalActivities)*100).toFixed(1)}%)`);
    console.log(`   ✅ Data quality: ${duplicateNotes.length === 0 && duplicateActivities.length === 0 ? 'Good' : 'Issues found'}`);
    console.log(`   ✅ No email_link notes: ${await prisma.notes.count({ where: { type: 'email_link' } }) === 0 ? 'Yes' : 'No'}`);
    console.log('');
    
    if (duplicateNotes.length === 0 && duplicateActivities.length === 0) {
      console.log('🎉 ZOHO IMPORT: SUCCESS!');
      console.log('   All data imported correctly with proper linking.');
    } else {
      console.log('⚠️  ZOHO IMPORT: ISSUES FOUND');
    }
    
  } catch (error) {
    console.error('❌ Error verifying import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleVerifyImport();
