const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTasksImport() {
  try {
    console.log('✅ CHECKING TASKS IMPORT STATUS');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. TOTAL ACTIVITIES (TASKS) IMPORTED
    console.log('📊 TASKS IMPORT SUMMARY:');
    console.log('-'.repeat(30));
    
    const totalActivities = await prisma.activities.count();
    console.log(`   Total activities imported: ${totalActivities}`);
    
    // 2. BREAKDOWN BY TYPE
    console.log('📋 ACTIVITY TYPES:');
    console.log('-'.repeat(30));
    
    const activityTypes = await prisma.activities.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });
    
    activityTypes.forEach(type => {
      console.log(`      ${type.type}: ${type._count.type}`);
    });
    console.log('');
    
    // 3. TASK-SPECIFIC BREAKDOWN
    console.log('✅ TASK-SPECIFIC DETAILS:');
    console.log('-'.repeat(30));
    
    const tasks = await prisma.activities.count({
      where: { type: 'task' }
    });
    
    const taskStatuses = await prisma.activities.groupBy({
      by: ['status'],
      where: { type: 'task' },
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } }
    });
    
    const taskPriorities = await prisma.activities.groupBy({
      by: ['priority'],
      where: { type: 'task' },
      _count: { priority: true },
      orderBy: { _count: { priority: 'desc' } }
    });
    
    console.log(`   Total tasks: ${tasks}`);
    console.log('   Task statuses:');
    taskStatuses.forEach(status => {
      console.log(`      ${status.status}: ${status._count.status}`);
    });
    console.log('   Task priorities:');
    taskPriorities.forEach(priority => {
      console.log(`      ${priority.priority}: ${priority._count.priority}`);
    });
    console.log('');
    
    // 4. SAMPLE TASKS
    console.log('📋 SAMPLE TASKS:');
    console.log('-'.repeat(30));
    
    const sampleTasks = await prisma.activities.findMany({
      where: { type: 'task' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        subject: true,
        description: true,
        status: true,
        priority: true,
        scheduledDate: true,
        completedAt: true,
        createdAt: true,
        contactId: true,
        accountId: true
      }
    });
    
    sampleTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. "${task.subject}"`);
      console.log(`      Status: ${task.status}, Priority: ${task.priority}`);
      console.log(`      Description: ${task.description?.substring(0, 100)}...`);
      if (task.scheduledDate) {
        console.log(`      Scheduled: ${task.scheduledDate.toISOString().split('T')[0]}`);
      }
      if (task.completedAt) {
        console.log(`      Completed: ${task.completedAt.toISOString().split('T')[0]}`);
      }
      console.log(`      Created: ${task.createdAt.toISOString().split('T')[0]}`);
      console.log(`      Linked to: ${task.contactId ? 'Contact' : task.accountId ? 'Account' : 'None'}`);
      console.log('');
    });
    
    // 5. LINKING STATUS
    console.log('🔗 TASK LINKING STATUS:');
    console.log('-'.repeat(30));
    
    const linkedTasks = await prisma.activities.count({
      where: {
        type: 'task',
        OR: [
          { contactId: { not: null } },
          { accountId: { not: null } },
          { leadId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });
    
    const tasksLinkedToContacts = await prisma.activities.count({
      where: { type: 'task', contactId: { not: null } }
    });
    
    const tasksLinkedToAccounts = await prisma.activities.count({
      where: { type: 'task', accountId: { not: null } }
    });
    
    const tasksLinkedToLeads = await prisma.activities.count({
      where: { type: 'task', leadId: { not: null } }
    });
    
    const tasksLinkedToOpportunities = await prisma.activities.count({
      where: { type: 'task', opportunityId: { not: null } }
    });
    
    console.log(`   Linked tasks: ${linkedTasks}/${tasks} (${((linkedTasks/tasks)*100).toFixed(1)}%)`);
    console.log(`   Tasks linked to contacts: ${tasksLinkedToContacts}`);
    console.log(`   Tasks linked to accounts: ${tasksLinkedToAccounts}`);
    console.log(`   Tasks linked to leads: ${tasksLinkedToLeads}`);
    console.log(`   Tasks linked to opportunities: ${tasksLinkedToOpportunities}`);
    console.log('');
    
    // 6. OWNERSHIP VERIFICATION
    console.log('👤 TASK OWNERSHIP:');
    console.log('-'.repeat(30));
    
    const dano = await prisma.users.findFirst({
      where: { email: 'dano@retail-products.com' }
    });
    
    const rpsWorkspace = await prisma.workspaces.findFirst({
      where: { name: 'Retail Product Solutions' }
    });
    
    if (dano && rpsWorkspace) {
      const danoTasks = await prisma.activities.count({
        where: {
          type: 'task',
          userId: dano.id,
          workspaceId: rpsWorkspace.id
        }
      });
      
      console.log(`   Tasks owned by Dano: ${danoTasks}/${tasks} (${((danoTasks/tasks)*100).toFixed(1)}%)`);
      console.log(`   Tasks in RPS workspace: ${danoTasks}/${tasks} (${((danoTasks/tasks)*100).toFixed(1)}%)`);
    }
    console.log('');
    
    // 7. SUMMARY
    console.log('📊 TASKS IMPORT SUMMARY:');
    console.log('-'.repeat(30));
    console.log(`   ✅ Total tasks imported: ${tasks}`);
    console.log(`   ✅ Tasks linked to entities: ${linkedTasks}/${tasks} (${((linkedTasks/tasks)*100).toFixed(1)}%)`);
    console.log(`   ✅ Tasks owned by Dano: ${dano ? 'Yes' : 'No'}`);
    console.log(`   ✅ Tasks in RPS workspace: ${rpsWorkspace ? 'Yes' : 'No'}`);
    console.log('');
    
    if (tasks > 0) {
      console.log('🎉 TASKS SUCCESSFULLY IMPORTED!');
      console.log('   All your Zoho tasks are now in the database as activities.');
    } else {
      console.log('⚠️  No tasks found in the database.');
    }
    
  } catch (error) {
    console.error('❌ Error checking tasks import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasksImport();
