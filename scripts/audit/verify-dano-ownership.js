const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDanoOwnership() {
  try {
    console.log('👤 VERIFYING DANO OWNERSHIP OF IMPORTED DATA');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. FIND DANO'S USER ID
    console.log('🔍 FINDING DANO:');
    console.log('-'.repeat(30));
    
    const dano = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'dano@retail-products.com' },
          { email: { contains: 'dano', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (!dano) {
      console.log('   ❌ Dano not found in users table');
      return;
    }
    
    console.log(`   ✅ Found Dano: ${dano.firstName} ${dano.lastName} (${dano.email})`);
    console.log(`   User ID: ${dano.id}`);
    console.log('');
    
    // 2. FIND RETAIL PRODUCT SOLUTIONS WORKSPACE
    console.log('🏢 FINDING RETAIL PRODUCT SOLUTIONS:');
    console.log('-'.repeat(30));
    
    const rpsWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'retail', mode: 'insensitive' } },
          { name: { contains: 'product', mode: 'insensitive' } },
          { name: { contains: 'solutions', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true
      }
    });
    
    if (!rpsWorkspace) {
      console.log('   ❌ Retail Product Solutions workspace not found');
      return;
    }
    
    console.log(`   ✅ Found workspace: ${rpsWorkspace.name}`);
    console.log(`   Workspace ID: ${rpsWorkspace.id}`);
    console.log('');
    
    // 3. CHECK NOTES OWNERSHIP
    console.log('📝 CHECKING NOTES OWNERSHIP:');
    console.log('-'.repeat(30));
    
    const totalNotes = await prisma.notes.count();
    const danoNotes = await prisma.notes.count({
      where: {
        OR: [
          { authorId: dano.id },
          { workspaceId: rpsWorkspace.id }
        ]
      }
    });
    
    console.log(`   Total notes: ${totalNotes}`);
    console.log(`   Dano's notes: ${danoNotes}`);
    console.log(`   Percentage: ${((danoNotes/totalNotes)*100).toFixed(1)}%`);
    
    // Check by author
    const notesByAuthor = await prisma.notes.count({
      where: { authorId: dano.id }
    });
    
    // Check by workspace
    const notesByWorkspace = await prisma.notes.count({
      where: { workspaceId: rpsWorkspace.id }
    });
    
    console.log(`   Notes by Dano (authorId): ${notesByAuthor}`);
    console.log(`   Notes in RPS workspace: ${notesByWorkspace}`);
    console.log('');
    
    // 4. CHECK ACTIVITIES OWNERSHIP
    console.log('✅ CHECKING ACTIVITIES OWNERSHIP:');
    console.log('-'.repeat(30));
    
    const totalActivities = await prisma.activities.count();
    const danoActivities = await prisma.activities.count({
      where: {
        OR: [
          { userId: dano.id },
          { workspaceId: rpsWorkspace.id }
        ]
      }
    });
    
    console.log(`   Total activities: ${totalActivities}`);
    console.log(`   Dano's activities: ${danoActivities}`);
    console.log(`   Percentage: ${((danoActivities/totalActivities)*100).toFixed(1)}%`);
    
    // Check by user
    const activitiesByUser = await prisma.activities.count({
      where: { userId: dano.id }
    });
    
    // Check by workspace
    const activitiesByWorkspace = await prisma.activities.count({
      where: { workspaceId: rpsWorkspace.id }
    });
    
    console.log(`   Activities by Dano (userId): ${activitiesByUser}`);
    console.log(`   Activities in RPS workspace: ${activitiesByWorkspace}`);
    console.log('');
    
    // 5. SAMPLE DATA VERIFICATION
    console.log('📋 SAMPLE DATA VERIFICATION:');
    console.log('-'.repeat(30));
    
    // Sample notes
    const sampleNotes = await prisma.notes.findMany({
      where: {
        OR: [
          { authorId: dano.id },
          { workspaceId: rpsWorkspace.id }
        ]
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        title: true,
        authorId: true,
        workspaceId: true,
        createdAt: true
      }
    });
    
    console.log('   Sample Dano notes:');
    sampleNotes.forEach((note, index) => {
      console.log(`      ${index + 1}. ${note.type} - "${note.title}"`);
      console.log(`         Author: ${note.authorId === dano.id ? 'Dano' : 'Other'}`);
      console.log(`         Workspace: ${note.workspaceId === rpsWorkspace.id ? 'RPS' : 'Other'}`);
      console.log(`         Date: ${note.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Sample activities
    const sampleActivities = await prisma.activities.findMany({
      where: {
        OR: [
          { userId: dano.id },
          { workspaceId: rpsWorkspace.id }
        ]
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        subject: true,
        userId: true,
        workspaceId: true,
        createdAt: true
      }
    });
    
    console.log('   Sample Dano activities:');
    sampleActivities.forEach((activity, index) => {
      console.log(`      ${index + 1}. ${activity.type} - "${activity.subject}"`);
      console.log(`         User: ${activity.userId === dano.id ? 'Dano' : 'Other'}`);
      console.log(`         Workspace: ${activity.workspaceId === rpsWorkspace.id ? 'RPS' : 'Other'}`);
      console.log(`         Date: ${activity.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // 6. CHECK FOR MISMATCHED DATA
    console.log('🔍 CHECKING FOR MISMATCHED DATA:');
    console.log('-'.repeat(30));
    
    // Notes not in RPS workspace
    const notesNotInRPS = await prisma.notes.count({
      where: {
        workspaceId: { not: rpsWorkspace.id }
      }
    });
    
    // Activities not in RPS workspace
    const activitiesNotInRPS = await prisma.activities.count({
      where: {
        workspaceId: { not: rpsWorkspace.id }
      }
    });
    
    // Notes not by Dano
    const notesNotByDano = await prisma.notes.count({
      where: {
        authorId: { not: dano.id }
      }
    });
    
    // Activities not by Dano
    const activitiesNotByDano = await prisma.activities.count({
      where: {
        userId: { not: dano.id }
      }
    });
    
    console.log(`   Notes not in RPS workspace: ${notesNotInRPS}`);
    console.log(`   Activities not in RPS workspace: ${activitiesNotInRPS}`);
    console.log(`   Notes not by Dano: ${notesNotByDano}`);
    console.log(`   Activities not by Dano: ${activitiesNotByDano}`);
    console.log('');
    
    // 7. SUMMARY
    console.log('📊 OWNERSHIP SUMMARY:');
    console.log('-'.repeat(30));
    console.log(`   👤 Dano (${dano.email}):`);
    console.log(`      Notes: ${notesByAuthor}/${totalNotes} (${((notesByAuthor/totalNotes)*100).toFixed(1)}%)`);
    console.log(`      Activities: ${activitiesByUser}/${totalActivities} (${((activitiesByUser/totalActivities)*100).toFixed(1)}%)`);
    console.log('');
    console.log(`   🏢 RPS Workspace (${rpsWorkspace.name}):`);
    console.log(`      Notes: ${notesByWorkspace}/${totalNotes} (${((notesByWorkspace/totalNotes)*100).toFixed(1)}%)`);
    console.log(`      Activities: ${activitiesByWorkspace}/${totalActivities} (${((activitiesByWorkspace/totalActivities)*100).toFixed(1)}%)`);
    console.log('');
    
    if (notesByAuthor === totalNotes && activitiesByUser === totalActivities) {
      console.log('🎉 PERFECT! All imported data belongs to Dano');
    } else if (notesByAuthor > 0 && activitiesByUser > 0) {
      console.log('✅ GOOD! Most imported data belongs to Dano');
    } else {
      console.log('⚠️  ISSUE! Some imported data may not belong to Dano');
    }
    
  } catch (error) {
    console.error('❌ Error verifying Dano ownership:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDanoOwnership();
