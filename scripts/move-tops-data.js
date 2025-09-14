const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function moveTopsData() {
  try {
    console.log('🚚 MOVING TOPS DATA TO NEW WORKSPACE...\n');
    
    // Workspace IDs
    const oldTopsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Currently shared with Dano
    const newTopsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG75'; // New isolated workspace
    
    console.log('📋 WORKSPACE IDENTIFICATION:');
    console.log(`   Old TOPS (shared): ${oldTopsWorkspaceId}`);
    console.log(`   New TOPS (isolated): ${newTopsWorkspaceId}\n`);
    
    // Step 1: Move TOPS contacts (those with TOPS-related sources)
    console.log('👥 STEP 1: MOVING TOPS CONTACTS...');
    const topsContacts = await prisma.contacts.findMany({
      where: {
        workspaceId: oldTopsWorkspaceId,
        OR: [
          { source: { contains: 'TOPS' } },
          { source: { contains: 'Capsule' } },
          { source: { contains: 'Conference' } },
          { source: { contains: 'Mailer' } }
        ]
      }
    });
    
    console.log(`   📋 Found ${topsContacts.length} TOPS contacts to move`);
    
    let movedContacts = 0;
    for (const contact of topsContacts) {
      await prisma.contacts.update({
        where: { id: contact.id },
        data: { 
          workspaceId: newTopsWorkspaceId,
          updatedAt: new Date()
        }
      });
      movedContacts++;
    }
    console.log(`   ✅ Moved ${movedContacts} contacts to new workspace\n`);
    
    // Step 2: Move TOPS activities
    console.log('📅 STEP 2: MOVING TOPS ACTIVITIES...');
    const topsActivities = await prisma.activities.findMany({
      where: {
        workspaceId: oldTopsWorkspaceId,
        OR: [
          { description: { contains: 'TOPS' } },
          { description: { contains: 'Capsule' } },
          { description: { contains: 'Conference' } },
          { description: { contains: 'Mailer' } },
          { campaignType: { contains: 'Mailer' } }
        ]
      }
    });
    
    console.log(`   📅 Found ${topsActivities.length} TOPS activities to move`);
    
    let movedActivities = 0;
    for (const activity of topsActivities) {
      await prisma.activities.update({
        where: { id: activity.id },
        data: { 
          workspaceId: newTopsWorkspaceId,
          updatedAt: new Date()
        }
      });
      movedActivities++;
    }
    console.log(`   ✅ Moved ${movedActivities} activities to new workspace\n`);
    
    // Step 3: Create leads for TOPS contacts (1:1 mapping)
    console.log('🎯 STEP 3: CREATING LEADS FOR TOPS CONTACTS...');
    const topsContactsInNewWorkspace = await prisma.contacts.findMany({
      where: { workspaceId: newTopsWorkspaceId }
    });
    
    console.log(`   📋 Found ${topsContactsInNewWorkspace.length} TOPS contacts in new workspace`);
    
    let createdLeads = 0;
    for (const contact of topsContactsInNewWorkspace) {
      await prisma.leads.create({
        data: {
          id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: newTopsWorkspaceId,
          assignedUserId: null,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          company: contact.company || 'Unknown',
          status: 'New',
          source: contact.source || 'TOPS Import',
          notes: `Imported from ${contact.source || 'TOPS data'}. ${contact.notes || ''}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdLeads++;
    }
    console.log(`   ✅ Created ${createdLeads} leads for 1:1 contact mapping\n`);
    
    // Step 4: Verify final state
    console.log('🔍 STEP 4: VERIFYING FINAL STATE...');
    
    const oldWorkspaceContacts = await prisma.contacts.findMany({
      where: { workspaceId: oldTopsWorkspaceId }
    });
    
    const newWorkspaceContacts = await prisma.contacts.findMany({
      where: { workspaceId: newTopsWorkspaceId }
    });
    
    const newWorkspaceLeads = await prisma.leads.findMany({
      where: { workspaceId: newTopsWorkspaceId }
    });
    
    const newWorkspaceActivities = await prisma.activities.findMany({
      where: { workspaceId: newTopsWorkspaceId }
    });
    
    console.log('📊 FINAL WORKSPACE STATE:');
    console.log(`   🏪 Old TOPS (shared): ${oldWorkspaceContacts.length} contacts`);
    console.log(`   👨‍💻 New TOPS (isolated): ${newWorkspaceContacts.length} contacts, ${newWorkspaceLeads.length} leads, ${newWorkspaceActivities.length} activities`);
    
    console.log('\n🎉 TOPS DATA MOVED SUCCESSFULLY!');
    console.log('🔒 Data isolation now enforced between Dano, Dan, and TOPS workspaces.');
    
  } catch (error) {
    console.error('❌ Error moving TOPS data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

moveTopsData();
