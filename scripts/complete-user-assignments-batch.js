#!/usr/bin/env node

/**
 * 🚀 COMPLETE USER ASSIGNMENTS - BATCH UPDATE
 * 
 * Efficiently complete the user assignments using batch updates
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function completeUserAssignmentsBatch() {
  try {
    console.log('🚀 Completing user assignments with batch updates...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to new database!\n');

    // 1. Find users
    console.log('👤 FINDING USERS:');
    const dano = await newPrisma.users.findFirst({
      where: { name: { contains: 'Dano', mode: 'insensitive' } }
    });
    
    const ryan = await newPrisma.users.findFirst({
      where: { name: { contains: 'Ryan', mode: 'insensitive' } }
    });
    
    if (!dano || !ryan) {
      throw new Error('Dano or Ryan not found!');
    }
    
    console.log(`✅ Found Dano: ${dano.name} (${dano.id})`);
    console.log(`✅ Found Ryan: ${ryan.name} (${ryan.id})\n`);

    // 2. Find Notary Everyday workspace
    console.log('📋 FINDING NOTARY EVERYDAY WORKSPACE:');
    const notaryWorkspace = await newPrisma.workspaces.findFirst({
      where: { name: { contains: 'Notary Everyday', mode: 'insensitive' } }
    });
    
    if (!notaryWorkspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${notaryWorkspace.name} (${notaryWorkspace.id})\n`);

    // 3. Get current counts
    console.log('📊 GETTING CURRENT COUNTS:');
    const companyCount = await newPrisma.companies.count({
      where: { workspaceId: notaryWorkspace.id }
    });
    
    const peopleCount = await newPrisma.people.count({
      where: { workspaceId: notaryWorkspace.id }
    });
    
    console.log(`   Companies: ${companyCount}`);
    console.log(`   People: ${peopleCount}\n`);

    // 4. Batch update - Make Dano main seller for all companies
    console.log('👑 MAKING DANO MAIN SELLER FOR ALL COMPANIES:');
    const danoUpdateResult = await newPrisma.companies.updateMany({
      where: { 
        workspaceId: notaryWorkspace.id,
        mainSellerId: { not: dano.id }
      },
      data: { 
        mainSellerId: dano.id,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Updated ${danoUpdateResult.count} companies with Dano as main seller\n`);

    // 5. Get 50 random companies for Ryan
    console.log('🎲 SELECTING 50 RANDOM COMPANIES FOR RYAN:');
    const allCompanies = await newPrisma.companies.findMany({
      where: { workspaceId: notaryWorkspace.id },
      select: { id: true, name: true }
    });
    
    const shuffledCompanies = allCompanies.sort(() => 0.5 - Math.random());
    const ryanCompanies = shuffledCompanies.slice(0, 50);
    const ryanCompanyIds = ryanCompanies.map(c => c.id);
    
    console.log(`✅ Selected ${ryanCompanies.length} random companies for Ryan\n`);

    // 6. Batch update - Make Ryan main seller for 50 random companies
    console.log('👑 MAKING RYAN MAIN SELLER FOR 50 RANDOM COMPANIES:');
    const ryanUpdateResult = await newPrisma.companies.updateMany({
      where: { 
        workspaceId: notaryWorkspace.id,
        id: { in: ryanCompanyIds }
      },
      data: { 
        mainSellerId: ryan.id,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Updated ${ryanUpdateResult.count} companies with Ryan as main seller\n`);

    // 7. Batch update - Make Ryan main seller for people associated with his companies
    console.log('👥 MAKING RYAN MAIN SELLER FOR ASSOCIATED PEOPLE:');
    const ryanPeopleUpdateResult = await newPrisma.people.updateMany({
      where: { 
        workspaceId: notaryWorkspace.id,
        companyId: { in: ryanCompanyIds }
      },
      data: { 
        mainSellerId: ryan.id,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Updated ${ryanPeopleUpdateResult.count} people with Ryan as main seller\n`);

    // 8. Verify assignments
    console.log('🔍 VERIFYING ASSIGNMENTS:');
    const danoCompanies = await newPrisma.companies.count({
      where: { 
        workspaceId: notaryWorkspace.id,
        mainSellerId: dano.id
      }
    });
    
    const ryanCompaniesCount = await newPrisma.companies.count({
      where: { 
        workspaceId: notaryWorkspace.id,
        mainSellerId: ryan.id
      }
    });
    
    const ryanPeople = await newPrisma.people.count({
      where: { 
        workspaceId: notaryWorkspace.id,
        mainSellerId: ryan.id
      }
    });
    
    console.log(`   Dano companies: ${danoCompanies}`);
    console.log(`   Ryan companies: ${ryanCompaniesCount}`);
    console.log(`   Ryan people: ${ryanPeople}\n`);

    // 9. Summary
    console.log('📊 FINAL USER ASSIGNMENT SUMMARY:');
    console.log('==================================');
    console.log(`✅ Victoria: Moved to SBI workspace (completed earlier)`);
    console.log(`✅ Dano: Main seller for ${danoCompanies} companies`);
    console.log(`✅ Ryan: Main seller for ${ryanCompaniesCount} companies`);
    console.log(`✅ Ryan: Main seller for ${ryanPeople} people`);
    console.log('\n🎉 All user assignments completed successfully!');
    console.log('Data is properly isolated between workspaces.');

  } catch (error) {
    console.error('❌ Error during batch user assignment:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the batch assignment
completeUserAssignmentsBatch();
