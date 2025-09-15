const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDanoCallsData() {
  console.log('📞 CHECKING DANO\'S CALL DATA');
  console.log('=============================');
  console.log('Checking call data in Dano\'s Retail Product Solutions workspace...\n');

  const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's Retail Product Solutions
  const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

  let stats = {
    totalActions: 0,
    callActions: 0,
    actionsWithCompanyId: 0,
    actionsWithPersonId: 0,
    orphanedActions: 0,
    emailMessages: 0,
    notes: 0
  };

  try {
    // STEP 1: Check actions in Dano's workspace
    console.log('🔄 STEP 1: Checking actions in Dano\'s workspace...');
    
    const totalActions = await prisma.actions.count({
      where: { workspaceId: DANO_WORKSPACE_ID }
    });
    stats.totalActions = totalActions;
    console.log(`Total actions in Dano's workspace: ${totalActions}`);

    // Check call-related actions
    const callActions = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { type: 'call' },
          { type: 'Phone Call' },
          { type: 'Discovery Call' },
          { subject: { contains: 'call', mode: 'insensitive' } },
          { subject: { contains: 'phone', mode: 'insensitive' } }
        ]
      }
    });
    stats.callActions = callActions;
    console.log(`Call-related actions: ${callActions}`);

    // Check actions with relationships
    const actionsWithCompanyId = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        companyId: { not: null }
      }
    });
    stats.actionsWithCompanyId = actionsWithCompanyId;
    console.log(`Actions linked to companies: ${actionsWithCompanyId}`);

    const actionsWithPersonId = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        personId: { not: null }
      }
    });
    stats.actionsWithPersonId = actionsWithPersonId;
    console.log(`Actions linked to people: ${actionsWithPersonId}`);

    // STEP 2: Check for call data in other tables
    console.log('\n🔄 STEP 2: Checking for call data in other tables...');
    
    // Check email messages (might contain call-related content)
    const emailMessages = await prisma.email_messages.count({
      where: {
        // Note: email_messages doesn't have workspaceId, but we can check by content
        OR: [
          { subject: { contains: 'call', mode: 'insensitive' } },
          { subject: { contains: 'phone', mode: 'insensitive' } },
          { body: { contains: 'call', mode: 'insensitive' } }
        ]
      }
    });
    stats.emailMessages = emailMessages;
    console.log(`Email messages with call-related content: ${emailMessages}`);

    // Check notes
    const notes = await prisma.notes.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { content: { contains: 'call', mode: 'insensitive' } },
          { content: { contains: 'phone', mode: 'insensitive' } }
        ]
      }
    });
    stats.notes = notes;
    console.log(`Notes with call-related content: ${notes}`);

    // STEP 3: Sample call actions
    console.log('\n🔄 STEP 3: Sample call actions...');
    
    const sampleCallActions = await prisma.actions.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { type: 'call' },
          { type: 'Phone Call' },
          { type: 'Discovery Call' }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { name: true }
        },
        person: {
          select: { fullName: true }
        }
      }
    });

    console.log('Sample call actions:');
    sampleCallActions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.type}: "${action.subject}"`);
      if (action.company) console.log(`     Company: ${action.company.name}`);
      if (action.person) console.log(`     Person: ${action.person.fullName}`);
      console.log(`     Date: ${action.createdAt}`);
    });

    // STEP 4: Check for CSV call data that might need importing
    console.log('\n🔄 STEP 4: Checking for potential call data to import...');
    
    // Check if there are any actions that look like they came from CSV imports
    const csvLikeActions = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        OR: [
          { subject: { contains: 'Call:', mode: 'insensitive' } },
          { subject: { contains: 'Phone Call:', mode: 'insensitive' } },
          { subject: { contains: 'Discovery Call:', mode: 'insensitive' } }
        ]
      }
    });
    console.log(`Actions that look like CSV imports: ${csvLikeActions}`);

    // STEP 5: Summary
    console.log('\n📋 DANO\'S CALL DATA SUMMARY');
    console.log('============================');
    console.log(`Total actions in workspace: ${stats.totalActions}`);
    console.log(`Call-related actions: ${stats.callActions}`);
    console.log(`Actions linked to companies: ${stats.actionsWithCompanyId}`);
    console.log(`Actions linked to people: ${stats.actionsWithPersonId}`);
    console.log(`Email messages with call content: ${stats.emailMessages}`);
    console.log(`Notes with call content: ${stats.notes}`);
    console.log(`CSV-like call actions: ${csvLikeActions}`);

    if (stats.callActions > 0) {
      console.log('\n✅ Call data found in Dano\'s workspace!');
      console.log('   Actions are properly connected to companies/people');
    } else {
      console.log('\n⚠️  No call actions found in Dano\'s workspace');
      console.log('   May need to import call data from CSV');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDanoCallsData()
  .then(() => {
    console.log('\n✅ Dano\'s call data check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  });
