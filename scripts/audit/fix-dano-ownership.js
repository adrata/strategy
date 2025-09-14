const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDanoOwnership() {
  try {
    console.log('🔧 FIXING DANO OWNERSHIP OF IMPORTED DATA');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. FIND DANO AND RPS WORKSPACE
    const dano = await prisma.users.findFirst({
      where: { email: 'dano@retail-products.com' }
    });
    
    const rpsWorkspace = await prisma.workspaces.findFirst({
      where: { name: 'Retail Product Solutions' }
    });
    
    if (!dano || !rpsWorkspace) {
      console.log('❌ Could not find Dano or RPS workspace');
      return;
    }
    
    console.log(`✅ Found Dano: ${dano.email} (${dano.id})`);
    console.log(`✅ Found RPS workspace: ${rpsWorkspace.name} (${rpsWorkspace.id})`);
    console.log('');
    
    // 2. FIX NOTES OWNERSHIP
    console.log('📝 FIXING NOTES OWNERSHIP:');
    console.log('-'.repeat(30));
    
    // Update all notes to be owned by Dano and in RPS workspace
    const notesUpdate = await prisma.notes.updateMany({
      where: {
        OR: [
          { authorId: { not: dano.id } },
          { workspaceId: { not: rpsWorkspace.id } }
        ]
      },
      data: {
        authorId: dano.id,
        workspaceId: rpsWorkspace.id
      }
    });
    
    console.log(`   Updated ${notesUpdate.count} notes to be owned by Dano in RPS workspace`);
    
    // 3. FIX ACTIVITIES OWNERSHIP
    console.log('✅ FIXING ACTIVITIES OWNERSHIP:');
    console.log('-'.repeat(30));
    
    // Update all activities to be owned by Dano and in RPS workspace
    const activitiesUpdate = await prisma.activities.updateMany({
      where: {
        OR: [
          { userId: { not: dano.id } },
          { workspaceId: { not: rpsWorkspace.id } }
        ]
      },
      data: {
        userId: dano.id,
        workspaceId: rpsWorkspace.id
      }
    });
    
    console.log(`   Updated ${activitiesUpdate.count} activities to be owned by Dano in RPS workspace`);
    console.log('');
    
    // 4. VERIFY THE FIX
    console.log('🔍 VERIFYING THE FIX:');
    console.log('-'.repeat(30));
    
    const totalNotes = await prisma.notes.count();
    const danoNotes = await prisma.notes.count({
      where: {
        authorId: dano.id,
        workspaceId: rpsWorkspace.id
      }
    });
    
    const totalActivities = await prisma.activities.count();
    const danoActivities = await prisma.activities.count({
      where: {
        userId: dano.id,
        workspaceId: rpsWorkspace.id
      }
    });
    
    console.log(`   Notes: ${danoNotes}/${totalNotes} (${((danoNotes/totalNotes)*100).toFixed(1)}%)`);
    console.log(`   Activities: ${danoActivities}/${totalActivities} (${((danoActivities/totalActivities)*100).toFixed(1)}%)`);
    console.log('');
    
    // 5. SAMPLE VERIFICATION
    console.log('📋 SAMPLE VERIFICATION:');
    console.log('-'.repeat(30));
    
    const sampleNotes = await prisma.notes.findMany({
      where: {
        authorId: dano.id,
        workspaceId: rpsWorkspace.id
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
    
    const sampleActivities = await prisma.activities.findMany({
      where: {
        userId: dano.id,
        workspaceId: rpsWorkspace.id
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
    
    // 6. FINAL SUMMARY
    console.log('📊 FINAL OWNERSHIP SUMMARY:');
    console.log('-'.repeat(30));
    console.log(`   👤 Dano (${dano.email}):`);
    console.log(`      Notes: ${danoNotes}/${totalNotes} (${((danoNotes/totalNotes)*100).toFixed(1)}%)`);
    console.log(`      Activities: ${danoActivities}/${totalActivities} (${((danoActivities/totalActivities)*100).toFixed(1)}%)`);
    console.log('');
    console.log(`   🏢 RPS Workspace (${rpsWorkspace.name}):`);
    console.log(`      Notes: ${danoNotes}/${totalNotes} (${((danoNotes/totalNotes)*100).toFixed(1)}%)`);
    console.log(`      Activities: ${danoActivities}/${totalActivities} (${((danoActivities/totalActivities)*100).toFixed(1)}%)`);
    console.log('');
    
    if (danoNotes === totalNotes && danoActivities === totalActivities) {
      console.log('🎉 PERFECT! All imported data now belongs to Dano in RPS workspace');
    } else {
      console.log('⚠️  Some data may still not be properly owned by Dano');
    }
    
  } catch (error) {
    console.error('❌ Error fixing Dano ownership:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDanoOwnership();
