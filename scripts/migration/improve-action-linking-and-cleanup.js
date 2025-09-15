const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function improveActionLinkingAndCleanup() {
  console.log('🔧 IMPROVING ACTION LINKING AND CLEANING UP CATEGORIES');
  console.log('=====================================================');
  
  try {
    // 1. IMPROVE LINKEDIN CONNECTION REQUEST PEOPLE LINKING
    console.log('\n🔗 STEP 1: IMPROVING LINKEDIN CONNECTION REQUEST PEOPLE LINKING');
    console.log('===============================================================');
    
    const linkedinWithoutPeople = await prisma.actions.findMany({
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
      take: 50 // Process in batches
    });
    
    console.log(`📊 Found ${linkedinWithoutPeople.length} LinkedIn actions without people links`);
    
    let linkedinPeopleLinked = 0;
    
    for (const action of linkedinWithoutPeople) {
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
        linkedinPeopleLinked++;
        console.log(`  ✅ Linked LinkedIn action to ${person.fullName}`);
      } else {
        // Try to extract person name from subject/description and create person
        const personName = extractPersonNameFromLinkedIn(action.subject, action.description);
        if (personName) {
          const nameParts = personName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const newPerson = await prisma.people.create({
            data: {
              firstName: firstName,
              lastName: lastName,
              fullName: personName,
              companyId: action.companyId,
              workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          // Link the action to the new person
          await prisma.actions.update({
            where: { id: action.id },
            data: { personId: newPerson.id }
          });
          
          linkedinPeopleLinked++;
          console.log(`  ✅ Created person "${personName}" and linked to LinkedIn action`);
        }
      }
    }
    
    console.log(`✅ Linked ${linkedinPeopleLinked} LinkedIn actions to people`);
    
    // 2. IMPROVE EMAIL ACTIONS COMPANY LINKING
    console.log('\n📧 STEP 2: IMPROVING EMAIL ACTIONS COMPANY LINKING');
    console.log('=================================================');
    
    const emailsWithoutCompanies = await prisma.actions.findMany({
      where: {
        type: 'email',
        companyId: null,
        personId: { not: null },
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      select: {
        id: true,
        subject: true,
        personId: true
      }
    });
    
    console.log(`📊 Found ${emailsWithoutCompanies.length} email actions without company links`);
    
    let emailsCompanyLinked = 0;
    
    for (const email of emailsWithoutCompanies) {
      // Get the person's company
      const person = await prisma.people.findUnique({
        where: { id: email.personId },
        select: { companyId: true }
      });
      
      if (person && person.companyId) {
        // Link email to the person's company
        await prisma.actions.update({
          where: { id: email.id },
          data: { companyId: person.companyId }
        });
        emailsCompanyLinked++;
        console.log(`  ✅ Linked email to company ${person.companyId}`);
      }
    }
    
    console.log(`✅ Linked ${emailsCompanyLinked} email actions to companies`);
    
    // 3. IMPROVE MEETING ACTIONS LINKING
    console.log('\n📅 STEP 3: IMPROVING MEETING ACTIONS LINKING');
    console.log('===========================================');
    
    const meetingsWithoutLinks = await prisma.actions.findMany({
      where: {
        type: 'meeting',
        OR: [
          { personId: null },
          { companyId: null }
        ],
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      select: {
        id: true,
        subject: true,
        description: true,
        personId: true,
        companyId: true
      }
    });
    
    console.log(`📊 Found ${meetingsWithoutLinks.length} meeting actions needing better linking`);
    
    let meetingsLinked = 0;
    
    for (const meeting of meetingsWithoutLinks) {
      // Try to extract person name from subject
      const personName = extractPersonNameFromMeeting(meeting.subject, meeting.description);
      
      if (personName && !meeting.personId) {
        // Try to find existing person
        let person = await prisma.people.findFirst({
          where: {
            fullName: {
              contains: personName,
              mode: 'insensitive'
            },
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
          }
        });
        
        if (!person && meeting.companyId) {
          // Create new person
          const nameParts = personName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          person = await prisma.people.create({
            data: {
              firstName: firstName,
              lastName: lastName,
              fullName: personName,
              companyId: meeting.companyId,
              workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        
        if (person) {
          await prisma.actions.update({
            where: { id: meeting.id },
            data: { personId: person.id }
          });
          meetingsLinked++;
          console.log(`  ✅ Linked meeting to person ${person.fullName}`);
        }
      }
    }
    
    console.log(`✅ Linked ${meetingsLinked} meeting actions to people`);
    
    // 4. CLEAN UP ACTION CATEGORIES
    console.log('\n🧹 STEP 4: CLEANING UP ACTION CATEGORIES');
    console.log('========================================');
    
    // Merge "Email Sent" into "email"
    const emailSentUpdate = await prisma.actions.updateMany({
      where: {
        type: 'Email Sent',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      data: {
        type: 'email'
      }
    });
    console.log(`✅ Merged ${emailSentUpdate.count} "Email Sent" actions into "email"`);
    
    // Merge "linkedin inmail" into "linkedin_inmail"
    const linkedinInmailUpdate = await prisma.actions.updateMany({
      where: {
        type: 'linkedin inmail',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      data: {
        type: 'linkedin_inmail'
      }
    });
    console.log(`✅ Merged ${linkedinInmailUpdate.count} "linkedin inmail" actions into "linkedin_inmail"`);
    
    // Merge "linkedin" into "linkedin_inmail"
    const linkedinUpdate = await prisma.actions.updateMany({
      where: {
        type: 'linkedin',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      data: {
        type: 'linkedin_inmail'
      }
    });
    console.log(`✅ Merged ${linkedinUpdate.count} "linkedin" actions into "linkedin_inmail"`);
    
    // Convert "task" actions to appropriate types
    const taskActions = await prisma.actions.findMany({
      where: {
        type: 'task',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
      },
      select: {
        id: true,
        subject: true,
        description: true
      }
    });
    
    let taskConverted = 0;
    
    for (const task of taskActions) {
      let newType = 'task'; // Default
      
      if (task.subject?.toLowerCase().includes('navigator') || 
          task.description?.toLowerCase().includes('catalog')) {
        newType = 'email';
      } else if (task.subject?.toLowerCase().includes('vendor form')) {
        newType = 'task';
      }
      
      if (newType !== 'task') {
        await prisma.actions.update({
          where: { id: task.id },
          data: { type: newType }
        });
        taskConverted++;
        console.log(`  ✅ Converted task "${task.subject}" to ${newType}`);
      }
    }
    
    console.log(`✅ Converted ${taskConverted} task actions to appropriate types`);
    
    // 5. FINAL VERIFICATION
    console.log('\n🔍 STEP 5: FINAL VERIFICATION');
    console.log('=============================');
    
    const finalActionTypes = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM actions 
      WHERE "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      GROUP BY type
      ORDER BY count DESC;
    `;
    
    console.log('📊 FINAL ACTION TYPE DISTRIBUTION:');
    finalActionTypes.forEach(row => {
      console.log(`  ${row.type}: ${row.count} actions`);
    });
    
    // Check final linking status
    const totalActions = await prisma.actions.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    const linkedToPeople = await prisma.actions.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        personId: { not: null }
      }
    });
    
    const linkedToCompanies = await prisma.actions.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        companyId: { not: null }
      }
    });
    
    const linkedToBoth = await prisma.actions.count({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        personId: { not: null },
        companyId: { not: null }
      }
    });
    
    const peoplePercent = ((linkedToPeople / totalActions) * 100).toFixed(1);
    const companiesPercent = ((linkedToCompanies / totalActions) * 100).toFixed(1);
    const bothPercent = ((linkedToBoth / totalActions) * 100).toFixed(1);
    
    console.log('\n🔗 FINAL LINKING STATUS:');
    console.log(`  Total actions: ${totalActions}`);
    console.log(`  Linked to people: ${linkedToPeople} (${peoplePercent}%)`);
    console.log(`  Linked to companies: ${linkedToCompanies} (${companiesPercent}%)`);
    console.log(`  Linked to both: ${linkedToBoth} (${bothPercent}%)`);
    
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

function extractPersonNameFromMeeting(subject, description) {
  // Extract person name from meeting subject
  if (subject) {
    // Look for "Meeting to [Name]" pattern
    const meetingMatch = subject.match(/Meeting\s+to\s+([A-Za-z\s]+)/i);
    if (meetingMatch) {
      return meetingMatch[1].trim();
    }
    
    // Look for "Phone Call to [Name]" pattern
    const callMatch = subject.match(/Phone\s+Call\s+to\s+([A-Za-z\s]+)/i);
    if (callMatch) {
      return callMatch[1].trim();
    }
    
    // Look for "Discovery Call to [Name]" pattern
    const discoveryMatch = subject.match(/Discovery\s+Call\s+to\s+([A-Za-z\s]+)/i);
    if (discoveryMatch) {
      return discoveryMatch[1].trim();
    }
  }
  
  return null;
}

improveActionLinkingAndCleanup();
