#!/usr/bin/env node

/**
 * 🗑️ CLEAR VICTORIA'S CONVERSATION HISTORY IN TOP WORKSPACE
 * 
 * Clears all AI conversations for Victoria Leland in the TOP workspace
 * This will make the main chat empty when she logs in
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearVictoriaTopConversations() {
  try {
    console.log('🔍 Finding Victoria Leland user...\n');
    
    // Find Victoria by email
    const victoria = await prisma.users.findFirst({
      where: {
        email: {
          contains: 'vleland',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!victoria) {
      throw new Error('Victoria Leland user not found');
    }

    console.log(`✅ Found user: ${victoria.name} (${victoria.email})`);
    console.log(`   User ID: ${victoria.id}\n`);

    // Find TOP workspace
    console.log('🔍 Finding TOP workspace...\n');
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: '01K75ZD7DWHG1XF16HAF2YVKCK' }, // Known TOP workspace ID
          { name: { contains: 'TOP', mode: 'insensitive' } },
          { slug: 'top' }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    if (!topWorkspace) {
      throw new Error('TOP workspace not found');
    }

    console.log(`✅ Found workspace: ${topWorkspace.name} (${topWorkspace.slug || 'no slug'})`);
    console.log(`   Workspace ID: ${topWorkspace.id}\n`);

    // Find all conversations for Victoria in TOP workspace
    console.log('🔍 Finding all conversations for Victoria in TOP workspace...\n');
    
    const conversations = await prisma.ai_conversations.findMany({
      where: {
        userId: victoria.id,
        workspaceId: topWorkspace.id,
        deletedAt: null // Only get non-deleted conversations
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    if (conversations.length === 0) {
      console.log('✅ No conversations found for Victoria in TOP workspace.\n');
      return;
    }

    console.log('='.repeat(80));
    console.log(`\n📊 Found ${conversations.length} conversation(s):\n`);
    
    conversations.forEach((conv, index) => {
      console.log(`${index + 1}. Conversation ID: ${conv.id}`);
      console.log(`   Title: "${conv.title}"`);
      console.log(`   Messages: ${conv._count.messages}`);
      console.log(`   Created: ${conv.createdAt.toISOString()}`);
      console.log(`   Last Activity: ${conv.lastActivity.toISOString()}`);
      console.log(`   Active: ${conv.isActive}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log(`\n⚠️  Ready to soft delete ${conversations.length} conversation(s).`);
    console.log('   This will set deletedAt timestamp but preserve the data.\n');

    // Soft delete all conversations
    console.log('🗑️  Soft deleting conversations...\n');

    const deletedAt = new Date();
    const result = await prisma.ai_conversations.updateMany({
      where: {
        userId: victoria.id,
        workspaceId: topWorkspace.id,
        deletedAt: null
      },
      data: {
        deletedAt: deletedAt,
        isActive: false
      }
    });

    console.log(`✅ Successfully soft deleted ${result.count} conversation(s).`);
    console.log(`   Deleted at: ${deletedAt.toISOString()}\n`);

    // Verify deletion
    console.log('🔍 Verifying deletion...\n');
    const remaining = await prisma.ai_conversations.count({
      where: {
        userId: victoria.id,
        workspaceId: topWorkspace.id,
        deletedAt: null
      }
    });

    if (remaining === 0) {
      console.log('✅ All conversations successfully deleted.\n');
    } else {
      console.log(`⚠️  Warning: ${remaining} conversation(s) still remain.\n`);
    }

    console.log('📝 Note: localStorage conversations will be cleared when Victoria logs in fresh.');
    console.log(`   Storage key: adrata-conversations-${topWorkspace.id}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearVictoriaTopConversations()
  .then(() => {
    console.log('✅ Script completed successfully.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

