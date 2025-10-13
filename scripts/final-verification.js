#!/usr/bin/env node

/**
 * 🔍 FINAL VERIFICATION
 * 
 * Verifies the current state of all workspaces and ULID compliance
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function finalVerification() {
  try {
    console.log('🔍 FINAL VERIFICATION\n');
    console.log('=====================\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Check all workspaces
    console.log('🏢 WORKSPACES:');
    const workspaces = await newPrisma.workspaces.findMany({
      include: {
        _count: {
          select: {
            companies: true,
            people: true,
            workspace_users: true
          }
        }
      }
    });
    
    for (const workspace of workspaces) {
      console.log(`\n📋 ${workspace.name} (${workspace.id}):`);
      console.log(`   Companies: ${workspace._count.companies}`);
      console.log(`   People: ${workspace._count.people}`);
      console.log(`   Users: ${workspace._count.workspace_users}`);
    }

    // 2. Check ULID compliance
    console.log('\n🔍 ULID COMPLIANCE CHECK:');
    const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    
    const companies = await newPrisma.companies.findMany({
      select: { id: true }
    });
    
    const people = await newPrisma.people.findMany({
      select: { id: true }
    });
    
    const nonUlidCompanies = companies.filter(c => !ulidPattern.test(c.id));
    const nonUlidPeople = people.filter(p => !ulidPattern.test(p.id));
    
    console.log(`   Companies: ${companies.length - nonUlidCompanies.length}/${companies.length} have ULIDs`);
    console.log(`   People: ${people.length - nonUlidPeople.length}/${people.length} have ULIDs`);
    
    if (nonUlidCompanies.length > 0) {
      console.log(`   ⚠️  ${nonUlidCompanies.length} companies still have non-ULID IDs`);
    }
    
    if (nonUlidPeople.length > 0) {
      console.log(`   ⚠️  ${nonUlidPeople.length} people still have non-ULID IDs`);
    }

    // 3. Check user assignments
    console.log('\n👥 USER ASSIGNMENTS:');
    
    // Check main sellers
    const companiesWithMainSellers = await newPrisma.companies.count({
      where: { mainSellerId: { not: null } }
    });
    
    const peopleWithMainSellers = await newPrisma.people.count({
      where: { mainSellerId: { not: null } }
    });
    
    console.log(`   Companies with main sellers: ${companiesWithMainSellers}`);
    console.log(`   People with main sellers: ${peopleWithMainSellers}`);

    // 4. Summary
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`✅ Total workspaces: ${workspaces.length}`);
    console.log(`✅ Total companies: ${companies.length}`);
    console.log(`✅ Total people: ${people.length}`);
    console.log(`✅ ULID compliance: ${((companies.length + people.length - nonUlidCompanies.length - nonUlidPeople.length) / (companies.length + people.length) * 100).toFixed(2)}%`);
    
    if (nonUlidCompanies.length === 0 && nonUlidPeople.length === 0) {
      console.log('\n🎉 ALL RECORDS ARE ULID COMPLIANT!');
    } else {
      console.log('\n⚠️  Some records still need ULID updates');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the verification
finalVerification();
