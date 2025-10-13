#!/usr/bin/env node

/**
 * 👑 ASSIGN JUSTIN AS MAIN SELLER
 * 
 * Forces Justin Johnson to be the main seller for all CloudCaddie data
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function assignJustinMainSeller() {
  try {
    console.log('👑 Assigning Justin as main seller for CloudCaddie...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to new database!\n');

    // 1. Find Justin Johnson
    console.log('👤 FINDING JUSTIN JOHNSON:');
    const justin = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Justin Johnson',
          mode: 'insensitive'
        }
      }
    });
    
    if (!justin) {
      throw new Error('Justin Johnson not found!');
    }
    
    console.log(`✅ Found Justin: ${justin.name} (${justin.id})\n`);

    // 2. Find CloudCaddie workspace
    console.log('📋 FINDING CLOUDCADDIE WORKSPACE:');
    const cloudCaddieWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'CloudCaddie',
          mode: 'insensitive'
        }
      }
    });
    
    if (!cloudCaddieWorkspace) {
      throw new Error('CloudCaddie workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${cloudCaddieWorkspace.name} (${cloudCaddieWorkspace.id})\n`);

    // 3. Force assign Justin as main seller for ALL companies
    console.log('🏢 ASSIGNING JUSTIN AS MAIN SELLER FOR ALL COMPANIES:');
    const companyUpdateResult = await newPrisma.companies.updateMany({
      where: { 
        workspaceId: cloudCaddieWorkspace.id
      },
      data: { 
        mainSellerId: justin.id,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Updated ${companyUpdateResult.count} companies with Justin as main seller\n`);

    // 4. Force assign Justin as main seller for ALL people
    console.log('👥 ASSIGNING JUSTIN AS MAIN SELLER FOR ALL PEOPLE:');
    const peopleUpdateResult = await newPrisma.people.updateMany({
      where: { 
        workspaceId: cloudCaddieWorkspace.id
      },
      data: { 
        mainSellerId: justin.id,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Updated ${peopleUpdateResult.count} people with Justin as main seller\n`);

    // 5. Verify assignments
    console.log('🔍 VERIFYING ASSIGNMENTS:');
    const justinCompanies = await newPrisma.companies.count({
      where: { 
        workspaceId: cloudCaddieWorkspace.id,
        mainSellerId: justin.id
      }
    });
    
    const justinPeople = await newPrisma.people.count({
      where: { 
        workspaceId: cloudCaddieWorkspace.id,
        mainSellerId: justin.id
      }
    });
    
    const totalCompanies = await newPrisma.companies.count({
      where: { workspaceId: cloudCaddieWorkspace.id }
    });
    
    const totalPeople = await newPrisma.people.count({
      where: { workspaceId: cloudCaddieWorkspace.id }
    });
    
    console.log(`   Total companies: ${totalCompanies}`);
    console.log(`   Justin companies: ${justinCompanies}`);
    console.log(`   Total people: ${totalPeople}`);
    console.log(`   Justin people: ${justinPeople}\n`);

    if (justinCompanies === totalCompanies && justinPeople === totalPeople) {
      console.log('🎉 SUCCESS: Justin is now the main seller for all CloudCaddie data!');
    } else {
      console.log('⚠️  Some assignments may have failed. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error during assignment:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the assignment
assignJustinMainSeller();
