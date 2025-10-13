#!/usr/bin/env node

/**
 * 🔍 FINAL AUDIT: VICTORIA'S AI CONVERSATIONS
 * 
 * Comprehensive audit of AI conversations for Victoria (vleland@topengineersplus.com) 
 * in both old and new databases
 */

const { PrismaClient } = require('@prisma/client');

// Database connections
const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

const newPrisma = new PrismaClient();

async function auditVictoriaAiConversationsFinal() {
  try {
    console.log('🔍 FINAL AUDIT: VICTORIA\'S AI CONVERSATIONS');
    console.log('=============================================\n');
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // 1. Find TOP Engineering Plus workspace in both databases
    console.log('📋 WORKSPACE INFORMATION:');
    
    // Old database
    const sbiWorkspace = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE '%top engineering plus%'
      LIMIT 1;
    `;
    
    if (!sbiWorkspace || sbiWorkspace.length === 0) {
      throw new Error('TOP Engineering Plus workspace not found in SBI database!');
    }
    
    console.log(`✅ SBI Workspace: ${sbiWorkspace[0].name} (${sbiWorkspace[0].id})`);
    
    // New database
    const newWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP Engineering Plus',
          mode: 'insensitive'
        }
      }
    });
    
    if (!newWorkspace) {
      throw new Error('TOP Engineering Plus workspace not found in new database!');
    }
    
    console.log(`✅ New Workspace: ${newWorkspace.name} (${newWorkspace.id})\n`);

    // 2. Find Victoria's user record in both databases
    console.log('👤 USER INFORMATION:');
    
    // Old database
    const sbiVictoria = await sbiPrisma.$queryRaw`
      SELECT id, name, email, username, "createdAt", "updatedAt"
      FROM users 
      WHERE email = 'vleland@topengineersplus.com'
      LIMIT 1;
    `;
    
    if (!sbiVictoria || sbiVictoria.length === 0) {
      throw new Error('Victoria not found in SBI database!');
    }
    
    console.log(`✅ SBI Victoria: ${sbiVictoria[0].name} (${sbiVictoria[0].email}) - ID: ${sbiVictoria[0].id}`);
    
    // New database
    const newVictoria = await newPrisma.users.findFirst({
      where: {
        email: 'vleland@topengineersplus.com'
      }
    });
    
    if (!newVictoria) {
      throw new Error('Victoria not found in new database!');
    }
    
    console.log(`✅ New Victoria: ${newVictoria.name} (${newVictoria.email}) - ID: ${newVictoria.id}\n`);

    // 3. Check AI conversations in OLD database (Chat system)
    console.log('💬 OLD DATABASE AI CONVERSATIONS (Chat System):');
    
    // Check if Victoria is a member of any chats
    const sbiChatMemberships = await sbiPrisma.$queryRaw`
      SELECT 
        cm."chatId",
        c.name,
        c.type,
        c."createdAt",
        c."updatedAt"
      FROM "ChatMember" cm
      JOIN "Chat" c ON cm."chatId" = c.id
      WHERE cm."userId" = ${sbiVictoria[0].id}
      ORDER BY c."updatedAt" DESC;
    `;
    
    console.log(`📊 Found ${sbiChatMemberships.length} chat memberships in old database`);
    
    if (sbiChatMemberships.length > 0) {
      console.log('\n📋 Chats Victoria is a member of:');
      sbiChatMemberships.forEach((chat, index) => {
        console.log(`${index + 1}. ${chat.name} (${chat.type})`);
        console.log(`   Chat ID: ${chat.chatId}`);
        console.log(`   Created: ${chat.createdAt}`);
        console.log(`   Updated: ${chat.updatedAt}`);
        console.log('');
      });
      
      // Check messages in each chat
      let totalSbiMessages = 0;
      for (const chat of sbiChatMemberships) {
        const messages = await sbiPrisma.$queryRaw`
          SELECT 
            id,
            content,
            type,
            "createdAt",
            "senderId"
          FROM "Message" 
          WHERE "chatId" = ${chat.chatId}
          ORDER BY "createdAt" ASC;
        `;
        
        totalSbiMessages += messages.length;
        console.log(`💬 Chat "${chat.name}": ${messages.length} messages`);
        
        if (messages.length > 0) {
          const userMessages = messages.filter(m => m.senderId === sbiVictoria[0].id).length;
          const otherMessages = messages.length - userMessages;
          console.log(`   Victoria's messages: ${userMessages}`);
          console.log(`   Other messages: ${otherMessages}`);
          
          // Show sample messages
          const sampleMessages = messages.slice(0, 3);
          sampleMessages.forEach((msg, msgIndex) => {
            const isVictoria = msg.senderId === sbiVictoria[0].id;
            const preview = msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content;
            console.log(`     ${msgIndex + 1}. [${isVictoria ? 'Victoria' : 'Other'}] ${preview}`);
          });
          console.log('');
        }
      }
      
      console.log(`📊 Total messages in old database: ${totalSbiMessages}`);
    } else {
      console.log('   No chat memberships found');
    }

    // 4. Check AI conversations in NEW database (ai_conversations system)
    console.log('\n💬 NEW DATABASE AI CONVERSATIONS (ai_conversations system):');
    
    const newConversations = await newPrisma.ai_conversations.findMany({
      where: {
        workspaceId: newWorkspace.id,
        userId: newVictoria.id,
        deletedAt: null
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });
    
    console.log(`📊 Found ${newConversations.length} AI conversations in new database`);
    
    if (newConversations.length > 0) {
      console.log('\n📋 AI Conversations:');
      newConversations.forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.title}`);
        console.log(`   ID: ${conv.id}`);
        console.log(`   Messages: ${conv.messages.length}`);
        console.log(`   Last Activity: ${conv.lastActivity}`);
        console.log(`   Active: ${conv.isActive}`);
        console.log(`   Created: ${conv.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   No AI conversations found');
    }

    // 5. Check for any other AI-related data
    console.log('\n🔍 OTHER AI-RELATED DATA:');
    
    // Check user_ai_preferences in old database
    const sbiAiPreferences = await sbiPrisma.$queryRaw`
      SELECT * FROM user_ai_preferences 
      WHERE "userId" = ${sbiVictoria[0].id};
    `;
    
    console.log(`📊 AI preferences in old database: ${sbiAiPreferences.length}`);
    if (sbiAiPreferences.length > 0) {
      console.table(sbiAiPreferences);
    }

    // 6. Generate final summary
    console.log('\n📊 FINAL AUDIT SUMMARY:');
    console.log('========================');
    console.log(`Old Database (Chat System):`);
    console.log(`  - Chat Memberships: ${sbiChatMemberships.length}`);
    console.log(`  - AI Preferences: ${sbiAiPreferences.length}`);
    console.log(`New Database (ai_conversations System):`);
    console.log(`  - AI Conversations: ${newConversations.length}`);
    console.log(`  - Total Messages: ${newConversations.reduce((sum, conv) => sum + conv.messages.length, 0)}`);
    
    // Determine migration status
    if (sbiChatMemberships.length === 0 && newConversations.length === 0) {
      console.log('\n✅ MIGRATION STATUS: No AI conversations found in either database');
      console.log('   Victoria has no AI context to migrate');
    } else if (sbiChatMemberships.length > 0 && newConversations.length === 0) {
      console.log('\n⚠️  MIGRATION STATUS: AI conversations exist in old database but not migrated');
      console.log('   Migration needed to preserve AI context');
    } else if (sbiChatMemberships.length === 0 && newConversations.length > 0) {
      console.log('\n✅ MIGRATION STATUS: AI conversations exist in new database');
      console.log('   Migration appears to be complete');
    } else {
      console.log('\n🤔 MIGRATION STATUS: AI conversations exist in both databases');
      console.log('   Detailed comparison needed');
    }

    // 7. Save detailed report
    const reportData = {
      auditDate: new Date().toISOString(),
      workspace: {
        sbi: {
          id: sbiWorkspace[0].id,
          name: sbiWorkspace[0].name
        },
        new: {
          id: newWorkspace.id,
          name: newWorkspace.name
        }
      },
      user: {
        sbi: {
          id: sbiVictoria[0].id,
          name: sbiVictoria[0].name,
          email: sbiVictoria[0].email
        },
        new: {
          id: newVictoria.id,
          name: newVictoria.name,
          email: newVictoria.email
        }
      },
      oldDatabase: {
        chatMemberships: sbiChatMemberships,
        aiPreferences: sbiAiPreferences
      },
      newDatabase: {
        conversations: newConversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          messageCount: conv.messages.length,
          lastActivity: conv.lastActivity,
          isActive: conv.isActive,
          createdAt: conv.createdAt
        }))
      },
      summary: {
        sbiChatMemberships: sbiChatMemberships.length,
        sbiAiPreferences: sbiAiPreferences.length,
        newConversations: newConversations.length,
        newMessages: newConversations.reduce((sum, conv) => sum + conv.messages.length, 0),
        migrationNeeded: sbiChatMemberships.length > 0 && newConversations.length === 0
      }
    };

    const fs = require('fs');
    const reportPath = 'docs/reports/victoria-ai-conversations-final-audit.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

auditVictoriaAiConversationsFinal();
