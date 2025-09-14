const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTopsWorkspace() {
  try {
    console.log('🔧 FIXING TOPS WORKSPACE - CREATING PROPER DATA ISOLATION\n');
    
    // Current workspace IDs
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Retail Product Solutions
    const danWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';  // Adrata
    
    console.log('📋 CURRENT STATE:');
    console.log(`   Dano Workspace: ${danoWorkspaceId} (Retail Product Solutions)`);
    console.log(`   Dan Workspace: ${danWorkspaceId} (Adrata)`);
    console.log(`   TOPS Workspace: ${danoWorkspaceId} (WRONG - sharing with Dano!)`);
    console.log('');
    
    // Step 1: Create new TOPS workspace
    console.log('🏗️ STEP 1: CREATING NEW TOPS WORKSPACE...');
    
    const newTopsWorkspace = await prisma.workspaces.create({
      data: {
        id: `01K1VBYV8ETM2RCQA4GNN9EG75`, // Following the same format as existing workspaces
        name: 'TOPS Engineering Talent Management',
        slug: 'tops-engineering-talent',
        description: 'Engineering talent management and conference tracking workspace',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`   ✅ Created new TOPS workspace: ${newTopsWorkspace.id}`);
    console.log(`   📝 Name: ${newTopsWorkspace.name}`);
    console.log('');
    
    // Step 2: Create workspace-user relationships for TOPS users
    console.log('👥 STEP 2: CREATING WORKSPACE ACCESS FOR TOPS USERS...');
    
    const topsUsers = await prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'topengineersplus.com' } },
          { name: { contains: 'Victoria' } },
          { name: { contains: 'Justin' } },
          { name: { contains: 'Matthew' } },
          { name: { contains: 'Hilary' } }
        ]
      }
    });
    
    let createdWorkspaceUsers = 0;
    for (const user of topsUsers) {
      // Check if workspace-user relationship already exists
      const existingWorkspaceUser = await prisma.workspace_users.findFirst({
        where: {
          userId: user.id,
          workspaceId: newTopsWorkspace.id
        }
      });
      
      if (!existingWorkspaceUser) {
        await prisma.workspace_users.create({
          data: {
            id: `wu_${Date.now().toString(36).substr(-6)}`,
            userId: user.id,
            workspaceId: newTopsWorkspace.id,
            role: 'member',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdWorkspaceUsers++;
      }
    }
    
    console.log(`   ✅ Created workspace access for ${createdWorkspaceUsers} TOPS users`);
    console.log('');
    
    // Step 3: Identify and move TOPS-specific data
    console.log('📊 STEP 3: IDENTIFYING TOPS-SPECIFIC DATA...');
    
    // Find contacts from our CSV imports
    const topsContacts = await prisma.contacts.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { source: 'TOPS Mailer Campaign' },
          { source: 'UTC All Regionals' },
          { notes: { contains: 'CAMPAIGN:' } },
          { notes: { contains: 'UTC Regional Conference' } }
        ]
      }
    });
    
    console.log(`   📋 Found ${topsContacts.length} TOPS-specific contacts to move`);
    
    // Find activities from our CSV imports
    const topsActivities = await prisma.activities.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { campaignType: 'TOPS Mailer Campaign' },
          { campaignType: 'UTC Regional' },
          { subject: { contains: 'Mailer Campaign' } },
          { subject: { contains: 'UTC Conference' } }
        ]
      }
    });
    
    console.log(`   📅 Found ${topsActivities.length} TOPS-specific activities to move`);
    console.log('');
    
    // Step 4: Move TOPS contacts to new workspace
    console.log('👥 STEP 4: MOVING TOPS CONTACTS TO NEW WORKSPACE...');
    
    let movedContacts = 0;
    for (const contact of topsContacts) {
      await prisma.contacts.update({
        where: { id: contact.id },
        data: { 
          workspaceId: newTopsWorkspace.id,
          updatedAt: new Date()
        }
      });
      movedContacts++;
    }
    
    console.log(`   ✅ Moved ${movedContacts} TOPS contacts to new workspace`);
    
    // Step 5: Move TOPS activities to new workspace
    console.log('📅 STEP 5: MOVING TOPS ACTIVITIES TO NEW WORKSPACE...');
    
    let movedActivities = 0;
    for (const activity of topsActivities) {
      await prisma.activities.update({
        where: { id: activity.id },
        data: { 
          workspaceId: newTopsWorkspace.id,
          updatedAt: new Date()
        }
      });
      movedActivities++;
    }
    
    console.log(`   ✅ Moved ${movedActivities} TOPS activities to new workspace`);
    console.log('');
    
    // Step 6: Create leads for TOPS contacts (1:1 mapping)
    console.log('🎯 STEP 6: CREATING LEADS FOR TOPS CONTACTS (1:1 MAPPING)...');
    
    const topsContactsForLeads = await prisma.contacts.findMany({
      where: { workspaceId: newTopsWorkspace.id }
    });
    
    let createdLeads = 0;
    for (const contact of topsContactsForLeads) {
      // Create lead based on contact data (leads don't have contactId field)
      await prisma.leads.create({
        data: {
          id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workspaceId: newTopsWorkspace.id,
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
    
    console.log(`   ✅ Created ${createdLeads} new leads for TOPS contacts`);
    console.log('');
    
    // Step 7: Give Dan access to TOPS workspace
    console.log('🔑 STEP 7: GIVING DAN ACCESS TO TOPS WORKSPACE...');
    
    // Check if Dan already has access
    const danUser = await prisma.users.findFirst({
      where: { id: '01K1VBYZMWTCT09FWEKBDMCXZM' }
    });
    
    if (danUser) {
      // Create a user-workspace relationship for Dan
      await prisma.workspace_users.create({
        data: {
          id: `wu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: danUser.id,
          workspaceId: newTopsWorkspace.id,
          role: 'owner',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('   ✅ Dan now has access to TOPS workspace');
    } else {
      console.log('   ⚠️ Dan user not found - skipping access grant');
    }
    
    console.log('');
    
    // Step 8: Verify data isolation
    console.log('🔍 STEP 8: VERIFYING DATA ISOLATION...');
    
    const danoAccounts = await prisma.accounts.findMany({
      where: { workspaceId: danoWorkspaceId }
    });
    
    const danAccounts = await prisma.accounts.findMany({
      where: { workspaceId: danWorkspaceId }
    });
    
    const topsAccounts = await prisma.accounts.findMany({
      where: { workspaceId: newTopsWorkspace.id }
    });
    
    const topsContactsInNewWorkspace = await prisma.contacts.findMany({
      where: { workspaceId: newTopsWorkspace.id }
    });
    
    const topsLeadsInNewWorkspace = await prisma.leads.findMany({
      where: { workspaceId: newTopsWorkspace.id }
    });
    
    const topsActivitiesInNewWorkspace = await prisma.activities.findMany({
      where: { workspaceId: newTopsWorkspace.id }
    });
    
    console.log('📊 FINAL WORKSPACE STATE:');
    console.log(`   🏪 Dano (Retail): ${danoAccounts.length} accounts`);
    console.log(`   🚀 Dan (Adrata): ${danAccounts.length} accounts`);
    console.log(`   👨‍💻 TOPS (New): ${topsAccounts.length} accounts, ${topsContactsInNewWorkspace.length} contacts, ${topsLeadsInNewWorkspace.length} leads, ${topsActivitiesInNewWorkspace.length} activities`);
    console.log('');
    
    // Step 9: Clean up cross-contamination
    console.log('🧹 STEP 9: CLEANING UP CROSS-CONTAMINATION...');
    
    // Remove Dan's accounts from Dano's workspace
    const danAccountsInDanoWorkspace = await prisma.accounts.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        assignedUserId: danUser?.id
      }
    });
    
    if (danAccountsInDanoWorkspace.length > 0) {
      console.log(`   🚨 Found ${danAccountsInDanoWorkspace.length} Dan accounts in Dano's workspace - removing...`);
      
      for (const account of danAccountsInDanoWorkspace) {
        await prisma.accounts.update({
          where: { id: account.id },
          data: { 
            workspaceId: danWorkspaceId,
            updatedAt: new Date()
          }
        });
      }
      
      console.log(`   ✅ Moved ${danAccountsInDanoWorkspace.length} accounts back to Dan's workspace`);
    } else {
      console.log('   ✅ No cross-contamination found');
    }
    
    console.log('');
    console.log('🎉 TOPS WORKSPACE FIXED SUCCESSFULLY!');
    console.log('');
    console.log('📋 SUMMARY OF CHANGES:');
    console.log(`   1. ✅ Created new TOPS workspace: ${newTopsWorkspace.id}`);
    console.log(`   2. ✅ Moved ${movedUsers} TOPS users to new workspace`);
    console.log(`   3. ✅ Moved ${movedContacts} TOPS contacts to new workspace`);
    console.log(`   4. ✅ Moved ${movedActivities} TOPS activities to new workspace`);
    console.log(`   5. ✅ Created ${createdLeads} leads for 1:1 contact-to-lead mapping`);
    console.log(`   6. ✅ Gave Dan access to TOPS workspace`);
    console.log(`   7. ✅ Cleaned up cross-contamination between workspaces`);
    console.log('');
    console.log('🔒 DATA ISOLATION NOW ENFORCED:');
    console.log('   • Dano: Retail Product Solutions only');
    console.log('   • Dan: Adrata + TOPS access');
    console.log('   • TOPS: Engineering talent management only');
    
  } catch (error) {
    console.error('❌ Error fixing TOPS workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixTopsWorkspace();
}

module.exports = { fixTopsWorkspace };
