#!/usr/bin/env node

/**
 * Audit CoreSignal emails in CloudCaddie workspace
 * Checks for any emails containing 'coresignal' (case-insensitive)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditCoreSignalEmails() {
  try {
    console.log('🔍 AUDITING CORESIGNAL EMAILS IN CLOUDCADDIE WORKSPACE');
    console.log('======================================================\n');
    
    await prisma.$connect();
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } },
          { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Find people with CoreSignal emails
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        email: {
          contains: 'coresignal',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: {
          select: {
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${people.length} people with CoreSignal emails:\n`);
    
    if (people.length > 0) {
      people.forEach((p, index) => {
        console.log(`${index + 1}. ${p.fullName || 'Unknown'}`);
        console.log(`   Email: ${p.email}`);
        console.log(`   Company: ${p.company?.name || 'N/A'}`);
        console.log(`   Created: ${p.createdAt.toISOString()}`);
        console.log('');
      });
    } else {
      console.log('✅ No CoreSignal emails found in CloudCaddie workspace');
    }
    
    // Also check buyer group members
    const buyerGroupMembers = await prisma.buyerGroupMembers.findMany({
      where: {
        email: {
          contains: 'coresignal',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        buyerGroup: {
          select: {
            workspaceId: true,
            companyName: true
          }
        }
      }
    });
    
    const cloudcaddieBgMembers = buyerGroupMembers.filter(bgm => 
      bgm.buyerGroup?.workspaceId === workspace.id
    );
    
    console.log(`\n📊 Found ${cloudcaddieBgMembers.length} buyer group members with CoreSignal emails:\n`);
    
    if (cloudcaddieBgMembers.length > 0) {
      cloudcaddieBgMembers.forEach((bgm, index) => {
        console.log(`${index + 1}. ${bgm.name || 'Unknown'}`);
        console.log(`   Email: ${bgm.email}`);
        console.log(`   Company: ${bgm.buyerGroup?.companyName || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('✅ No CoreSignal emails found in buyer group members');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

auditCoreSignalEmails();

