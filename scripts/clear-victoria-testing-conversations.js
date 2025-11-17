#!/usr/bin/env node

/**
 * 🗑️ CLEAR VICTORIA'S TESTING CONVERSATIONS
 * 
 * Finds and soft deletes AI conversations with "testing" in the title
 * for Victoria Leland (vleland@topengineersplus.com)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearVictoriaTestingConversations() {
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

    // Find all conversations for Victoria that contain "testing" in title
    console.log('🔍 Finding conversations with "testing" in title...\n');
    
    const conversations = await prisma.ai_conversations.findMany({
      where: {
        userId: victoria.id,
        title: {
          contains: 'testing',
          mode: 'insensitive'
        },
        deletedAt: null // Only get non-deleted conversations
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
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
      console.log('✅ No conversations found with "testing" in the title.\n');
      return;
    }

    console.log(`📋 Found ${conversations.length} conversation(s) to review:\n`);
    console.log('=' .repeat(80));
    
    conversations.forEach((conv, index) => {
      console.log(`\n${index + 1}. Conversation ID: ${conv.id}`);
      console.log(`   Title: "${conv.title}"`);
      console.log(`   Workspace: ${conv.workspace.name} (${conv.workspace.slug})`);
      console.log(`   Messages: ${conv._count.messages}`);
      console.log(`   Created: ${conv.createdAt.toISOString()}`);
      console.log(`   Last Activity: ${conv.lastActivity.toISOString()}`);
      console.log(`   Active: ${conv.isActive}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n⚠️  Ready to soft delete ${conversations.length} conversation(s).`);
    console.log('   This will set deletedAt timestamp but preserve the data.\n');

    // Ask for confirmation (in a real script, you'd use readline)
    // For now, we'll proceed with the deletion
    console.log('🗑️  Soft deleting conversations...\n');

    const deletedAt = new Date();
    let deletedCount = 0;

    for (const conv of conversations) {
      const result = await prisma.ai_conversations.updateMany({
        where: {
          id: conv.id,
          userId: victoria.id,
          deletedAt: null // Only delete if not already deleted
        },
        data: {
          deletedAt: deletedAt,
          isActive: false
        }
      });

      if (result.count > 0) {
        deletedCount++;
        console.log(`✅ Soft deleted: "${conv.title}" (${conv.id})`);
      } else {
        console.log(`⚠️  Skipped (already deleted): "${conv.title}" (${conv.id})`);
      }
    }

    console.log(`\n✅ Successfully soft deleted ${deletedCount} conversation(s).`);
    console.log(`   Deleted at: ${deletedAt.toISOString()}\n`);

    // Verify deletion
    console.log('🔍 Verifying deletion...\n');
    const remaining = await prisma.ai_conversations.count({
      where: {
        userId: victoria.id,
        title: {
          contains: 'testing',
          mode: 'insensitive'
        },
        deletedAt: null
      }
    });

    if (remaining === 0) {
      console.log('✅ All "testing" conversations have been soft deleted.\n');
    } else {
      console.log(`⚠️  Warning: ${remaining} conversation(s) still remain (may have been created during deletion).\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearVictoriaTestingConversations()
  .then(() => {
    console.log('✅ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

