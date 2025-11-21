/**
 * Reset Victoria's Chat
 * 
 * This script deletes all AI conversations and messages for Victoria
 * to clear out old hardcoded messages and technical difficulties messages
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetVictoriaChat() {
  try {
    console.log('🔍 Finding Victoria\'s user account...');
    
    // Find Victoria by email or name
    const victoria = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'victoria', mode: 'insensitive' } },
          { name: { contains: 'victoria', mode: 'insensitive' } },
          { firstName: { contains: 'victoria', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true
      }
    });

    if (!victoria) {
      console.error('❌ Victoria not found. Please check the user exists.');
      process.exit(1);
    }

    console.log('✅ Found Victoria:', {
      id: victoria.id,
      email: victoria.email,
      name: victoria.name,
      firstName: victoria.firstName
    });

    // Get all workspaces for Victoria via workspace_users
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        userId: victoria.id
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const workspaceIds = workspaceUsers.map(wu => wu.workspace.id);
    
    console.log(`\n📁 Found ${workspaceIds.length} workspace(s) for Victoria:`);
    workspaceUsers.forEach(wu => {
      console.log(`   - ${wu.workspace.name} (${wu.workspace.id})`);
    });
    
    if (workspaceIds.length === 0) {
      console.error('❌ Victoria has no workspaces.');
      process.exit(1);
    }

    console.log(`\n🗑️  Deleting all conversations and messages for Victoria in ${workspaceIds.length} workspace(s)...`);

    // Delete all messages first (they have foreign key to conversations)
    for (const workspaceId of workspaceIds) {
      console.log(`\n📦 Processing workspace: ${workspaceId}`);
      
      // Get all conversations for this workspace and user
      const conversations = await prisma.ai_conversations.findMany({
        where: {
          userId: victoria.id,
          workspaceId: workspaceId
        },
        select: {
          id: true,
          title: true
        }
      });

      console.log(`   Found ${conversations.length} conversations`);

      if (conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        
        // Delete all messages in these conversations
        const deletedMessages = await prisma.ai_messages.deleteMany({
          where: {
            conversationId: { in: conversationIds }
          }
        });
        
        console.log(`   ✅ Deleted ${deletedMessages.count} messages`);

        // Delete all conversations
        const deletedConversations = await prisma.ai_conversations.deleteMany({
          where: {
            id: { in: conversationIds }
          }
        });
        
        console.log(`   ✅ Deleted ${deletedConversations.count} conversations`);
      } else {
        console.log(`   ℹ️  No conversations found for this workspace`);
      }
    }

    console.log('\n✅ Successfully reset Victoria\'s chat!');
    console.log('\n📝 Note: Victoria will need to refresh her browser to see the cleared chat.');
    console.log('   The localStorage cache will be cleared when she refreshes.');

  } catch (error) {
    console.error('❌ Error resetting Victoria\'s chat:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetVictoriaChat()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

