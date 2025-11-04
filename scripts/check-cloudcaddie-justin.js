#!/usr/bin/env node

/**
 * 🔍 CHECK CLOUDCADDIE WORKSPACE AND JUSTIN USER
 * 
 * Verifies if CloudCaddie workspace and Justin Johnson user exist in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCloudCaddieAndJustin() {
  try {
    console.log('🔍 CHECKING CLOUDCADDIE WORKSPACE AND JUSTIN USER');
    console.log('=================================================\n');
    
    await prisma.$connect();
    
    // 1. Check CloudCaddie workspace
    console.log('1️⃣ CHECKING CLOUDCADDIE WORKSPACE:');
    console.log('-----------------------------------');
    
    const cloudCaddieWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { name: { contains: 'Cloud Caddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
        ]
      }
    });
    
    if (cloudCaddieWorkspace) {
      console.log('✅ CloudCaddie workspace FOUND:');
      console.log(`   ID: ${cloudCaddieWorkspace.id}`);
      console.log(`   Name: ${cloudCaddieWorkspace.name}`);
      console.log(`   Slug: ${cloudCaddieWorkspace.slug}`);
      console.log(`   Created: ${cloudCaddieWorkspace.createdAt}`);
      
      // Check workspace users
      const workspaceUsers = await prisma.workspace_users.findMany({
        where: { workspaceId: cloudCaddieWorkspace.id },
        include: { user: true }
      });
      
      console.log(`\n   👥 Workspace has ${workspaceUsers.length} user(s):`);
      workspaceUsers.forEach(wu => {
        console.log(`      - ${wu.user.name} (${wu.user.email}) - Role: ${wu.role}`);
      });
    } else {
      console.log('❌ CloudCaddie workspace NOT FOUND');
    }
    
    // 2. Check Justin Johnson user
    console.log('\n2️⃣ CHECKING JUSTIN JOHNSON USER:');
    console.log('----------------------------------');
    
    const justin = await prisma.users.findFirst({
      where: {
        OR: [
          { name: { contains: 'Justin Johnson', mode: 'insensitive' } },
          { email: { contains: 'justin', mode: 'insensitive' } }
        ]
      }
    });
    
    if (justin) {
      console.log('✅ Justin Johnson user FOUND:');
      console.log(`   ID: ${justin.id}`);
      console.log(`   Name: ${justin.name}`);
      console.log(`   Email: ${justin.email}`);
      console.log(`   Created: ${justin.createdAt}`);
      
      // Check which workspaces Justin belongs to
      const justinWorkspaces = await prisma.workspace_users.findMany({
        where: { userId: justin.id },
        include: { workspace: true }
      });
      
      console.log(`\n   🏢 Justin belongs to ${justinWorkspaces.length} workspace(s):`);
      justinWorkspaces.forEach(wu => {
        console.log(`      - ${wu.workspace.name} (${wu.workspace.slug}) - Role: ${wu.role}`);
      });
      
      // Check if Justin is main seller for any companies/people
      const justinCompanies = await prisma.companies.count({
        where: { mainSellerId: justin.id }
      });
      
      const justinPeople = await prisma.people.count({
        where: { mainSellerId: justin.id }
      });
      
      console.log(`\n   📊 Justin is main seller for:`);
      console.log(`      - ${justinCompanies} companies`);
      console.log(`      - ${justinPeople} people`);
    } else {
      console.log('❌ Justin Johnson user NOT FOUND');
    }
    
    // 3. Check if Justin is in CloudCaddie workspace
    if (cloudCaddieWorkspace && justin) {
      console.log('\n3️⃣ CHECKING JUSTIN IN CLOUDCADDIE:');
      console.log('-----------------------------------');
      
      const justinInCloudCaddie = await prisma.workspace_users.findFirst({
        where: {
          workspaceId: cloudCaddieWorkspace.id,
          userId: justin.id
        }
      });
      
      if (justinInCloudCaddie) {
        console.log('✅ Justin is in CloudCaddie workspace');
        console.log(`   Role: ${justinInCloudCaddie.role}`);
      } else {
        console.log('❌ Justin is NOT in CloudCaddie workspace');
      }
    }
    
    console.log('\n✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCloudCaddieAndJustin();

