const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixActionLinkingAndTypes() {
  console.log('🔧 FIXING ACTION LINKING AND STANDARDIZING TYPES');
  console.log('================================================');
  
  try {
    // 1. STANDARDIZE LINKEDIN ACTION TYPES
    console.log('\n📋 STEP 1: STANDARDIZING LINKEDIN ACTION TYPES');
    console.log('===============================================');
    
    // Update LinkedIn connection requests (currently "task" type)
    const linkedinConnectionUpdates = await prisma.actions.updateMany({
      where: {
        type: 'task',
        subject: {
          contains: 'LinkedIn',
          mode: 'insensitive'
        },
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      data: {
        type: 'linkedin_connection_request'
      }
    });
    console.log(`✅ Updated ${linkedinConnectionUpdates.count} LinkedIn connection requests`);
    
    // Update LinkedIn InMail actions
    const linkedinInmailUpdates = await prisma.actions.updateMany({
      where: {
        type: 'linkedin_inmail',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      data: {
        type: 'linkedin_inmail'
      }
    });
    console.log(`✅ Updated ${linkedinInmailUpdates.count} LinkedIn InMail actions`);
    
    // 2. FIX MEETING/CALL ACTION TYPES
    console.log('\n📞 STEP 2: STANDARDIZING MEETING/CALL ACTION TYPES');
    console.log('=================================================');
    
    // Standardize call types
    const callUpdates = await prisma.actions.updateMany({
      where: {
        type: {
          in: ['Phone Call', 'Discovery Call']
        },
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      data: {
        type: 'call'
      }
    });
    console.log(`✅ Updated ${callUpdates.count} call actions to standard type`);
    
    // Standardize meeting types
    const meetingUpdates = await prisma.actions.updateMany({
      where: {
        type: 'Meeting',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      data: {
        type: 'meeting'
      }
    });
    console.log(`✅ Updated ${meetingUpdates.count} meeting actions to standard type`);
    
    // 3. FIX UNLINKED ACTIONS
    console.log('\n🔗 STEP 3: FIXING UNLINKED ACTIONS');
    console.log('==================================');
    
    // Get actions that are linked to companies but not people
    const companyLinkedActions = await prisma.actions.findMany({
      where: {
        companyId: { not: null },
        personId: null,
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      select: {
        id: true,
        type: true,
        subject: true,
        companyId: true
      },
      take: 20
    });
    
    console.log(`📊 Found ${companyLinkedActions.length} actions linked to companies but not people`);
    
    let linkedToPeople = 0;
    
    for (const action of companyLinkedActions) {
      // Try to find a person from the same company
      const person = await prisma.people.findFirst({
        where: {
          companyId: action.companyId,
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
        }
      });
      
      if (person) {
        // Link action to the person
        await prisma.actions.update({
          where: { id: action.id },
          data: { personId: person.id }
        });
        linkedToPeople++;
        console.log(`  ✅ Linked action "${action.subject}" to person ${person.fullName}`);
      }
    }
    
    console.log(`✅ Linked ${linkedToPeople} actions to people`);
    
    // 4. CREATE MISSING PEOPLE FOR LINKEDIN CONNECTION REQUESTS
    console.log('\n👥 STEP 4: CREATING MISSING PEOPLE FOR LINKEDIN CONNECTIONS');
    console.log('==========================================================');
    
    const linkedinConnections = await prisma.actions.findMany({
      where: {
        type: 'linkedin_connection_request',
        personId: null,
        companyId: { not: null },
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      select: {
        id: true,
        subject: true,
        description: true,
        companyId: true
      },
      take: 10
    });
    
    let createdPeople = 0;
    
    for (const connection of linkedinConnections) {
      // Extract person name from subject or description
      const personName = extractPersonNameFromLinkedIn(connection.subject, connection.description);
      
      if (personName) {
        // Check if person already exists
        const existingPerson = await prisma.people.findFirst({
          where: {
            fullName: {
              contains: personName,
              mode: 'insensitive'
            },
            companyId: connection.companyId,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
          }
        });
        
        if (!existingPerson) {
          // Create new person
          const nameParts = personName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const newPerson = await prisma.people.create({
            data: {
              firstName: firstName,
              lastName: lastName,
              fullName: personName,
              companyId: connection.companyId,
              workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          // Link the action to the new person
          await prisma.actions.update({
            where: { id: connection.id },
            data: { personId: newPerson.id }
          });
          
          createdPeople++;
          console.log(`  ✅ Created person "${personName}" and linked to action`);
        }
      }
    }
    
    console.log(`✅ Created ${createdPeople} new people for LinkedIn connections`);
    
    // 5. FINAL VERIFICATION
    console.log('\n🔍 STEP 5: FINAL VERIFICATION');
    console.log('=============================');
    
    // Check action type distribution
    const actionTypes = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM actions 
      WHERE "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      GROUP BY type
      ORDER BY count DESC;
    `;
    
    console.log('📊 FINAL ACTION TYPE DISTRIBUTION:');
    actionTypes.forEach(row => {
      console.log(`  ${row.type}: ${row.count} actions`);
    });
    
    // Check linking status
    const totalActions = await prisma.actions.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    const linkedActions = await prisma.actions.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        OR: [
          { personId: { not: null } },
          { companyId: { not: null } }
        ]
      }
    });
    
    const unlinkedActions = totalActions - linkedActions;
    
    console.log('\n🔗 FINAL LINKING STATUS:');
    console.log(`  Total actions: ${totalActions}`);
    console.log(`  Linked actions: ${linkedActions}`);
    console.log(`  Unlinked actions: ${unlinkedActions}`);
    
    // Check LinkedIn action types specifically
    const linkedinTypes = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM actions 
      WHERE (type ILIKE '%linkedin%' OR subject ILIKE '%linkedin%')
      AND "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      GROUP BY type
      ORDER BY count DESC;
    `;
    
    console.log('\n🔗 LINKEDIN ACTION TYPES:');
    linkedinTypes.forEach(row => {
      console.log(`  ${row.type}: ${row.count} actions`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function extractPersonNameFromLinkedIn(subject, description) {
  // Extract person name from LinkedIn connection request
  if (subject && subject.includes('(')) {
    const match = subject.match(/\(([^)]+)\)/);
    if (match) {
      return match[1].trim();
    }
  }
  
  if (description) {
    // Look for "Hey [Name]" pattern
    const heyMatch = description.match(/Hey\s+([A-Za-z]+)/);
    if (heyMatch) {
      return heyMatch[1];
    }
    
    // Look for other name patterns
    const nameMatch = description.match(/([A-Z][a-z]+)\s+(congrats|my team|we have)/);
    if (nameMatch) {
      return nameMatch[1];
    }
  }
  
  return null;
}

fixActionLinkingAndTypes();
