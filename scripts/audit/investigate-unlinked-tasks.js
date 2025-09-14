const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateUnlinkedTasks() {
  try {
    console.log('🔍 INVESTIGATING UNLINKED TASKS');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. FIND UNLINKED TASKS
    console.log('📋 UNLINKED TASKS:');
    console.log('-'.repeat(30));
    
    const unlinkedTasks = await prisma.activities.findMany({
      where: {
        type: 'task',
        contactId: null,
        accountId: null,
        leadId: null,
        opportunityId: null
      },
      select: {
        id: true,
        subject: true,
        description: true,
        createdAt: true,
        userId: true,
        workspaceId: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Found ${unlinkedTasks.length} unlinked tasks`);
    console.log('');
    
    // 2. ANALYZE UNLINKED TASKS
    console.log('📊 UNLINKED TASKS ANALYSIS:');
    console.log('-'.repeat(30));
    
    unlinkedTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. "${task.subject}"`);
      console.log(`      ID: ${task.id}`);
      console.log(`      Description: ${task.description?.substring(0, 150)}...`);
      console.log(`      Created: ${task.createdAt.toISOString().split('T')[0]}`);
      console.log(`      User: ${task.userId}`);
      console.log(`      Workspace: ${task.workspaceId}`);
      console.log('');
    });
    
    // 3. CHECK WHY THEY'RE NOT LINKED
    console.log('🔍 WHY ARE THEY NOT LINKED?');
    console.log('-'.repeat(30));
    
    // Look for patterns in the subject/description
    const subjects = unlinkedTasks.map(task => task.subject);
    const descriptions = unlinkedTasks.map(task => task.description);
    
    console.log('   Common patterns in unlinked tasks:');
    
    // Check for LinkedIn connections
    const linkedinTasks = unlinkedTasks.filter(task => 
      task.subject?.toLowerCase().includes('linkedin') || 
      task.description?.toLowerCase().includes('linkedin')
    );
    console.log(`      LinkedIn-related tasks: ${linkedinTasks.length}`);
    
    // Check for email tasks
    const emailTasks = unlinkedTasks.filter(task => 
      task.subject?.toLowerCase().includes('email') || 
      task.description?.toLowerCase().includes('email')
    );
    console.log(`      Email-related tasks: ${emailTasks.length}`);
    
    // Check for call tasks
    const callTasks = unlinkedTasks.filter(task => 
      task.subject?.toLowerCase().includes('call') || 
      task.description?.toLowerCase().includes('call')
    );
    console.log(`      Call-related tasks: ${callTasks.length}`);
    
    // Check for generic tasks
    const genericTasks = unlinkedTasks.filter(task => 
      !task.subject?.toLowerCase().includes('linkedin') &&
      !task.subject?.toLowerCase().includes('email') &&
      !task.subject?.toLowerCase().includes('call')
    );
    console.log(`      Generic tasks: ${genericTasks.length}`);
    console.log('');
    
    // 4. CHECK IF ENTITIES EXIST FOR THESE TASKS
    console.log('🔍 CHECKING IF ENTITIES EXIST:');
    console.log('-'.repeat(30));
    
    for (const task of unlinkedTasks.slice(0, 5)) { // Check first 5
      console.log(`   Task: "${task.subject}"`);
      
      // Try to find entities mentioned in the description
      if (task.description) {
        const description = task.description.toLowerCase();
        
        // Look for company names
        const companies = await prisma.accounts.findMany({
          where: {
            OR: [
              { name: { contains: description.split(' ')[0], mode: 'insensitive' } },
              { legalName: { contains: description.split(' ')[0], mode: 'insensitive' } },
              { tradingName: { contains: description.split(' ')[0], mode: 'insensitive' } }
            ]
          },
          select: { id: true, name: true }
        });
        
        if (companies.length > 0) {
          console.log(`      Found potential companies: ${companies.map(c => c.name).join(', ')}`);
        } else {
          console.log(`      No matching companies found`);
        }
        
        // Look for contact names
        const words = description.split(' ').filter(word => word.length > 2);
        for (const word of words.slice(0, 3)) { // Check first 3 words
          const contacts = await prisma.contacts.findMany({
            where: {
              OR: [
                { firstName: { contains: word, mode: 'insensitive' } },
                { lastName: { contains: word, mode: 'insensitive' } }
              ]
            },
            select: { id: true, firstName: true, lastName: true }
          });
          
          if (contacts.length > 0) {
            console.log(`      Found potential contacts: ${contacts.map(c => `${c.firstName} ${c.lastName}`).join(', ')}`);
            break;
          }
        }
      }
      console.log('');
    }
    
    // 5. SUGGESTIONS FOR FIXING
    console.log('💡 SUGGESTIONS FOR FIXING:');
    console.log('-'.repeat(30));
    console.log('   1. LinkedIn tasks might not have specific company/contact names');
    console.log('   2. Some tasks might be general follow-ups without specific entities');
    console.log('   3. Some tasks might reference entities not in the database');
    console.log('   4. Some tasks might be system-generated or generic');
    console.log('');
    
    // 6. SUMMARY
    console.log('📊 UNLINKED TASKS SUMMARY:');
    console.log('-'.repeat(30));
    console.log(`   Total unlinked tasks: ${unlinkedTasks.length}`);
    console.log(`   LinkedIn tasks: ${linkedinTasks.length}`);
    console.log(`   Email tasks: ${emailTasks.length}`);
    console.log(`   Call tasks: ${callTasks.length}`);
    console.log(`   Generic tasks: ${genericTasks.length}`);
    console.log('');
    
    if (unlinkedTasks.length === 0) {
      console.log('🎉 ALL TASKS ARE LINKED!');
    } else {
      console.log(`⚠️  ${unlinkedTasks.length} tasks are not linked to entities`);
      console.log('   This is normal for generic tasks or tasks without specific entity references');
    }
    
  } catch (error) {
    console.error('❌ Error investigating unlinked tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateUnlinkedTasks();
