/**
 * Script to clean up duplicate DMs
 * 
 * This script identifies and removes duplicate DMs between the same participants,
 * keeping the one with the most recent message.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicateDMs() {
  try {
    console.log('\n🔍 Finding duplicate DMs...');
    console.log('='.repeat(80));
    
    // Get all DMs with their participants and messages
    const allDMs = await prisma.oasisDirectMessage.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log(`📊 Total DMs: ${allDMs.length}`);
    
    // Group DMs by participant combination and workspace
    const dmGroups = new Map();
    
    allDMs.forEach(dm => {
      const participantIds = dm.participants
        .map(p => p.userId)
        .sort()
        .join(',');
      const key = `${dm.workspaceId}:${participantIds}`;
      
      if (!dmGroups.has(key)) {
        dmGroups.set(key, []);
      }
      dmGroups.get(key).push(dm);
    });
    
    // Find groups with duplicates
    const duplicateGroups = Array.from(dmGroups.entries())
      .filter(([_, dms]) => dms.length > 1);
    
    console.log(`\n🔍 Found ${duplicateGroups.length} groups with duplicates`);
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate DMs found!');
      return;
    }
    
    let totalDeleted = 0;
    
    for (const [key, dms] of duplicateGroups) {
      const [workspaceId, participantIds] = key.split(':');
      const participantNames = dms[0].participants.map(p => p.user.name).join(', ');
      
      console.log(`\n📋 Duplicate group: ${participantNames}`);
      console.log(`   Workspace: ${workspaceId}`);
      console.log(`   ${dms.length} duplicate DMs found`);
      
      // Sort by message priority:
      // 1. DMs with user messages (not AI welcome messages)
      // 2. DMs with most recent messages
      // 3. DMs with any messages
      // 4. DMs with no messages
      const sorted = dms.sort((a, b) => {
        const aLastMsg = a.messages[0];
        const bLastMsg = b.messages[0];
        
        // Check if messages are AI welcome messages
        const aIsAIWelcome = aLastMsg && 
          aLastMsg.sender.email === 'ai@adrata.com' && 
          aLastMsg.content.includes("I'm Adrata");
        const bIsAIWelcome = bLastMsg && 
          bLastMsg.sender.email === 'ai@adrata.com' && 
          bLastMsg.content.includes("I'm Adrata");
        
        // Prefer DMs with user messages over AI welcome messages
        if (!aIsAIWelcome && bIsAIWelcome) return -1;
        if (aIsAIWelcome && !bIsAIWelcome) return 1;
        
        // If one has messages and the other doesn't, prefer the one with messages
        if (aLastMsg && !bLastMsg) return -1;
        if (!aLastMsg && bLastMsg) return 1;
        if (!aLastMsg && !bLastMsg) return 0;
        
        // Both have messages, compare dates
        return new Date(bLastMsg.createdAt).getTime() - new Date(aLastMsg.createdAt).getTime();
      });
      
      // Keep the first one (most recent message)
      const dmToKeep = sorted[0];
      const dmsToDelete = sorted.slice(1);
      
      console.log(`   ✅ Keeping DM: ${dmToKeep.id}`);
      if (dmToKeep.messages[0]) {
        console.log(`      Last message: "${dmToKeep.messages[0].content.substring(0, 50)}..."`);
        console.log(`      From: ${dmToKeep.messages[0].sender.name}`);
        console.log(`      Date: ${dmToKeep.messages[0].createdAt}`);
      } else {
        console.log(`      No messages`);
      }
      
      // Delete duplicate DMs
      for (const dm of dmsToDelete) {
        console.log(`   ❌ Deleting DM: ${dm.id}`);
        if (dm.messages[0]) {
          console.log(`      Last message: "${dm.messages[0].content.substring(0, 50)}..."`);
          console.log(`      From: ${dm.messages[0].sender.name}`);
        } else {
          console.log(`      No messages`);
        }
        
        // Delete all messages in this DM
        const messageCount = await prisma.oasisMessage.count({
          where: { dmId: dm.id }
        });
        
        if (messageCount > 0) {
          console.log(`      Deleting ${messageCount} messages...`);
          
          // Delete read receipts first
          await prisma.oasisReadReceipt.deleteMany({
            where: {
              message: {
                dmId: dm.id
              }
            }
          });
          
          // Delete reactions
          await prisma.oasisReaction.deleteMany({
            where: {
              message: {
                dmId: dm.id
              }
            }
          });
          
          // Delete messages
          await prisma.oasisMessage.deleteMany({
            where: { dmId: dm.id }
          });
        }
        
        // Delete participants
        await prisma.oasisDMParticipant.deleteMany({
          where: { dmId: dm.id }
        });
        
        // Delete the DM
        await prisma.oasisDirectMessage.delete({
          where: { id: dm.id }
        });
        
        totalDeleted++;
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate DMs.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateDMs();

