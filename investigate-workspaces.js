const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateWorkspaces() {
  console.log('🔍 Investigating workspaces and users...\n');
  
  try {
    // Find TOP workspace
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'TOP', mode: 'insensitive' } },
          { slug: { contains: 'top', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('🏢 TOP Workspace:', topWorkspace);
    
    // Find CloudCaddie workspace
    const cloudCaddieWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('🏢 CloudCaddie Workspace:', cloudCaddieWorkspace);
    
    // Find Notary Everyday workspace (for reference)
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary', mode: 'insensitive' } },
          { slug: { contains: 'notary', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('🏢 Notary Everyday Workspace (reference):', notaryWorkspace);
    console.log('\n---\n');
    
    // Find Victoria user
    const victoria = await prisma.users.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Victoria', mode: 'insensitive' } },
          { name: { contains: 'Victoria', mode: 'insensitive' } },
          { email: { contains: 'victoria', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    console.log('👤 Victoria:', victoria);
    
    // Find Justin user
    const justin = await prisma.users.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Justin', mode: 'insensitive' } },
          { name: { contains: 'Justin', mode: 'insensitive' } },
          { email: { contains: 'justin', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    console.log('👤 Justin:', justin);
    
    // Find Dano (for reference)
    const dano = await prisma.users.findFirst({
      where: {
        OR: [
          { firstName: { contains: 'Dano', mode: 'insensitive' } },
          { name: { contains: 'Dano', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    console.log('👤 Dano (reference):', dano);
    console.log('\n---\n');
    
    // Check people assigned to Victoria in TOP workspace
    if (victoria && topWorkspace) {
      const victoriaPeople = await prisma.people.count({
        where: {
          workspaceId: topWorkspace.id,
          mainSellerId: victoria.id,
          deletedAt: null
        }
      });
      
      const victoriaWithRank = await prisma.people.count({
        where: {
          workspaceId: topWorkspace.id,
          mainSellerId: victoria.id,
          deletedAt: null,
          globalRank: { not: null }
        }
      });
      
      console.log(`📊 Victoria in TOP workspace:`);
      console.log(`  Total people: ${victoriaPeople}`);
      console.log(`  People with globalRank: ${victoriaWithRank}`);
    }
    
    // Check people assigned to Justin in CloudCaddie workspace
    if (justin && cloudCaddieWorkspace) {
      const justinPeople = await prisma.people.count({
        where: {
          workspaceId: cloudCaddieWorkspace.id,
          mainSellerId: justin.id,
          deletedAt: null
        }
      });
      
      const justinWithRank = await prisma.people.count({
        where: {
          workspaceId: cloudCaddieWorkspace.id,
          mainSellerId: justin.id,
          deletedAt: null,
          globalRank: { not: null }
        }
      });
      
      console.log(`📊 Justin in CloudCaddie workspace:`);
      console.log(`  Total people: ${justinPeople}`);
      console.log(`  People with globalRank: ${justinWithRank}`);
    }
    
    // Check Dano in Notary Everyday (for reference)
    if (dano && notaryWorkspace) {
      const danoPeople = await prisma.people.count({
        where: {
          workspaceId: notaryWorkspace.id,
          mainSellerId: dano.id,
          deletedAt: null
        }
      });
      
      const danoWithRank = await prisma.people.count({
        where: {
          workspaceId: notaryWorkspace.id,
          mainSellerId: dano.id,
          deletedAt: null,
          globalRank: { not: null, gte: 1, lte: 50 }
        }
      });
      
      console.log(`📊 Dano in Notary Everyday workspace (reference):`);
      console.log(`  Total people: ${danoPeople}`);
      console.log(`  People with speedrun rank (1-50): ${danoWithRank}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateWorkspaces();
