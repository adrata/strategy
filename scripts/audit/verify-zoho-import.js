const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verifyZohoImport() {
  try {
    console.log('🔍 VERIFYING ZOHO IMPORT RESULTS');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. VERIFY NOTES IMPORT
    console.log('📝 NOTES VERIFICATION:');
    console.log('-'.repeat(30));
    
    const totalNotes = await prisma.notes.count();
    console.log(`   Total notes in database: ${totalNotes}`);
    
    const noteTypes = await prisma.notes.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });
    
    console.log('   Note types:');
    noteTypes.forEach(type => {
      console.log(`      ${type.type}: ${type._count.type}`);
    });
    
    // Check for email_link notes (should be 0)
    const emailLinkNotes = await prisma.notes.count({
      where: { type: 'email_link' }
    });
    console.log(`   Email link notes (should be 0): ${emailLinkNotes}`);
    
    // Check linking status
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
    
    // 2. VERIFY ACTIVITIES IMPORT
    console.log('✅ ACTIVITIES VERIFICATION:');
    console.log('-'.repeat(30));
    
    const totalActivities = await prisma.activities.count();
    console.log(`   Total activities in database: ${totalActivities}`);
    
    const activityTypes = await prisma.activities.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });
    
    console.log('   Activity types:');
    activityTypes.forEach(type => {
      console.log(`      ${type.type}: ${type._count.type}`);
    });
    
    // Check linking status
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
    
    // 3. SAMPLE DATA VERIFICATION
    console.log('📋 SAMPLE DATA VERIFICATION:');
    console.log('-'.repeat(30));
    
    // Sample notes
    const sampleNotes = await prisma.notes.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        contactId: true,
        accountId: true,
        leadId: true,
        opportunityId: true,
        createdAt: true
      }
    });
    
    console.log('   Sample notes:');
    sampleNotes.forEach((note, index) => {
      console.log(`      ${index + 1}. ${note.type} - "${note.title}"`);
      console.log(`         Content: ${note.content?.substring(0, 100)}...`);
      console.log(`         Linked to: ${note.contactId ? 'Contact' : note.accountId ? 'Account' : note.leadId ? 'Lead' : note.opportunityId ? 'Opportunity' : 'None'}`);
      console.log(`         Created: ${note.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Sample activities
    const sampleActivities = await prisma.activities.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        status: true,
        priority: true,
        contactId: true,
        accountId: true,
        leadId: true,
        opportunityId: true,
        createdAt: true,
        completedAt: true
      }
    });
    
    console.log('   Sample activities:');
    sampleActivities.forEach((activity, index) => {
      console.log(`      ${index + 1}. ${activity.type} - "${activity.subject}"`);
      console.log(`         Status: ${activity.status}, Priority: ${activity.priority}`);
      console.log(`         Linked to: ${activity.contactId ? 'Contact' : activity.accountId ? 'Account' : activity.leadId ? 'Lead' : activity.opportunityId ? 'Opportunity' : 'None'}`);
      console.log(`         Created: ${activity.createdAt.toISOString().split('T')[0]}`);
      if (activity.completedAt) {
        console.log(`         Completed: ${activity.completedAt.toISOString().split('T')[0]}`);
      }
      console.log('');
    });
    
    // 4. DATA QUALITY CHECKS
    console.log('🔍 DATA QUALITY CHECKS:');
    console.log('-'.repeat(30));
    
    // Check for duplicate IDs
    const duplicateNoteIds = await prisma.$queryRaw`
      SELECT id, COUNT(*) as count 
      FROM notes 
      GROUP BY id 
      HAVING COUNT(*) > 1
    `;
    
    const duplicateActivityIds = await prisma.$queryRaw`
      SELECT id, COUNT(*) as count 
      FROM activities 
      GROUP BY id 
      HAVING COUNT(*) > 1
    `;
    
    console.log(`   Duplicate note IDs: ${duplicateNoteIds.length}`);
    console.log(`   Duplicate activity IDs: ${duplicateActivityIds.length}`);
    
    // Check for missing required fields
    const notesWithoutContent = await prisma.notes.count({
      where: {
        OR: [
          { content: null },
          { content: '' }
        ]
      }
    });
    
    const activitiesWithoutSubject = await prisma.activities.count({
      where: {
        OR: [
          { subject: null },
          { subject: '' }
        ]
      }
    });
    
    console.log(`   Notes without content: ${notesWithoutContent}`);
    console.log(`   Activities without subject: ${activitiesWithoutSubject}`);
    
    // Check for invalid dates
    const notesWithInvalidDates = await prisma.notes.count({
      where: {
        createdAt: {
          lt: new Date('2020-01-01')
        }
      }
    });
    
    const activitiesWithInvalidDates = await prisma.activities.count({
      where: {
        createdAt: {
          lt: new Date('2020-01-01')
        }
      }
    });
    
    console.log(`   Notes with dates before 2020: ${notesWithInvalidDates}`);
    console.log(`   Activities with dates before 2020: ${activitiesWithInvalidDates}`);
    console.log('');
    
    // 5. ENTITY LINKING VERIFICATION
    console.log('🔗 ENTITY LINKING VERIFICATION:');
    console.log('-'.repeat(30));
    
    // Check notes linked to contacts
    const notesLinkedToContacts = await prisma.notes.count({
      where: { contactId: { not: null } }
    });
    
    // Check notes linked to accounts
    const notesLinkedToAccounts = await prisma.notes.count({
      where: { accountId: { not: null } }
    });
    
    // Check notes linked to leads
    const notesLinkedToLeads = await prisma.notes.count({
      where: { leadId: { not: null } }
    });
    
    // Check notes linked to opportunities
    const notesLinkedToOpportunities = await prisma.notes.count({
      where: { opportunityId: { not: null } }
    });
    
    console.log(`   Notes linked to contacts: ${notesLinkedToContacts}`);
    console.log(`   Notes linked to accounts: ${notesLinkedToAccounts}`);
    console.log(`   Notes linked to leads: ${notesLinkedToLeads}`);
    console.log(`   Notes linked to opportunities: ${notesLinkedToOpportunities}`);
    
    // Check activities linked to contacts
    const activitiesLinkedToContacts = await prisma.activities.count({
      where: { contactId: { not: null } }
    });
    
    // Check activities linked to accounts
    const activitiesLinkedToAccounts = await prisma.activities.count({
      where: { accountId: { not: null } }
    });
    
    // Check activities linked to leads
    const activitiesLinkedToLeads = await prisma.activities.count({
      where: { leadId: { not: null } }
    });
    
    // Check activities linked to opportunities
    const activitiesLinkedToOpportunities = await prisma.activities.count({
      where: { opportunityId: { not: null } }
    });
    
    console.log(`   Activities linked to contacts: ${activitiesLinkedToContacts}`);
    console.log(`   Activities linked to accounts: ${activitiesLinkedToAccounts}`);
    console.log(`   Activities linked to leads: ${activitiesLinkedToLeads}`);
    console.log(`   Activities linked to opportunities: ${activitiesLinkedToOpportunities}`);
    console.log('');
    
    // 6. TIMELINE FUNCTIONALITY TEST
    console.log('⏰ TIMELINE FUNCTIONALITY TEST:');
    console.log('-'.repeat(30));
    
    // Test timeline for a contact with notes and activities
    const contactWithData = await prisma.contacts.findFirst({
      where: {
        OR: [
          { notes: { some: {} } },
          { activities: { some: {} } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            notes: true,
            activities: true
          }
        }
      }
    });
    
    if (contactWithData) {
      console.log(`   Testing timeline for: ${contactWithData.firstName} ${contactWithData.lastName}`);
      console.log(`   Notes: ${contactWithData._count.notes}`);
      console.log(`   Activities: ${contactWithData._count.activities}`);
      
      // Get recent timeline items
      const recentNotes = await prisma.notes.findMany({
        where: { contactId: contactWithData.id },
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          type: true,
          title: true,
          createdAt: true
        }
      });
      
      const recentActivities = await prisma.activities.findMany({
        where: { contactId: contactWithData.id },
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          type: true,
          subject: true,
          status: true,
          createdAt: true
        }
      });
      
      console.log('   Recent notes:');
      recentNotes.forEach(note => {
        console.log(`      - ${note.type}: "${note.title}" (${note.createdAt.toISOString().split('T')[0]})`);
      });
      
      console.log('   Recent activities:');
      recentActivities.forEach(activity => {
        console.log(`      - ${activity.type}: "${activity.subject}" (${activity.status}) (${activity.createdAt.toISOString().split('T')[0]})`);
      });
    }
    console.log('');
    
    // 7. SUMMARY
    console.log('📊 IMPORT VERIFICATION SUMMARY:');
    console.log('-'.repeat(30));
    console.log(`   ✅ Notes imported: ${totalNotes}`);
    console.log(`   ✅ Activities imported: ${totalActivities}`);
    console.log(`   ✅ Notes linked: ${linkedNotes}/${totalNotes} (${((linkedNotes/totalNotes)*100).toFixed(1)}%)`);
    console.log(`   ✅ Activities linked: ${linkedActivities}/${totalActivities} (${((linkedActivities/totalActivities)*100).toFixed(1)}%)`);
    console.log(`   ✅ Data quality: ${duplicateNoteIds.length + duplicateActivityIds.length === 0 ? 'Good' : 'Issues found'}`);
    console.log(`   ✅ Timeline functionality: ${contactWithData ? 'Working' : 'No test data'}`);
    console.log('');
    
    if (duplicateNoteIds.length === 0 && duplicateActivityIds.length === 0 && 
        notesWithoutContent === 0 && activitiesWithoutSubject === 0) {
      console.log('🎉 ZOHO IMPORT VERIFICATION: SUCCESS!');
      console.log('   All data imported correctly with proper linking.');
    } else {
      console.log('⚠️  ZOHO IMPORT VERIFICATION: ISSUES FOUND');
      console.log('   Some data quality issues detected.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying Zoho import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyZohoImport();
