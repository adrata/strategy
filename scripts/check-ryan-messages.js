const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRyanMessages() {
  try {
    const dmId = 'cmhkxjgrn0009i70hx5y506v0';
    
    console.log('🔍 Checking DM:', dmId);
    
    // Check if DM exists
    const dm = await prisma.oasisDirectMessage.findUnique({
      where: { id: dmId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
    
    if (!dm) {
      console.log('❌ DM not found');
      return;
    }
    
    console.log('✅ DM found:', {
      id: dm.id,
      workspaceId: dm.workspaceId,
      participants: dm.participants.map(p => ({
        userId: p.userId,
        userName: p.user.name || p.user.email
      }))
    });
    
    // Check messages in this DM
    const messages = await prisma.oasisMessage.findMany({
      where: {
        dmId: dmId,
        parentMessageId: null
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n📨 Found ${messages.length} messages in this DM:`);
    messages.forEach((msg, idx) => {
      console.log(`\n${idx + 1}. Message ID: ${msg.id}`);
      console.log(`   Content: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
      console.log(`   Sender: ${msg.sender.name || msg.sender.email}`);
      console.log(`   Created: ${msg.createdAt}`);
    });
    
    // Also check with alternative query structure
    console.log('\n🔍 Testing alternative query structure...');
    const messagesAlt = await prisma.oasisMessage.findMany({
      where: {
        dmId: dmId,
        parentMessageId: { equals: null }
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`✅ Alternative query returned ${messagesAlt.length} messages`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkRyanMessages();

