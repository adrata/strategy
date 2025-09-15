#!/usr/bin/env node

/**
 * 🔧 FIX USER DATA CONSISTENCY
 * 
 * This script fixes the following issues:
 * 1. Remove duplicate Ross Sylvester user
 * 2. Fix Tony Luthor ID to proper ULID format
 * 3. Sync person/company records properly
 * 4. Fix John Dano company association
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserDataConsistency() {
  console.log('🔧 FIXING USER DATA CONSISTENCY');
  console.log('================================');

  try {
    // 1. Remove duplicate Ross Sylvester user
    console.log('\n1. Removing duplicate Ross Sylvester user...');
    const duplicateRoss = await prisma.users.findUnique({
      where: { id: 'ross-sylvester-2025' }
    });

    if (duplicateRoss) {
      console.log(`   Found duplicate Ross: ${duplicateRoss.name} (${duplicateRoss.email})`);
      
      // Check if this user has any assigned records
      const assignedRecords = await prisma.$queryRaw`
        SELECT 
          'leads' as table_name, COUNT(*) as count FROM leads WHERE "assignedUserId" = 'ross-sylvester-2025'
        UNION ALL
        SELECT 'prospects', COUNT(*) FROM prospects WHERE "assignedUserId" = 'ross-sylvester-2025'
        UNION ALL
        SELECT 'opportunities', COUNT(*) FROM opportunities WHERE "assignedUserId" = 'ross-sylvester-2025'
        UNION ALL
        SELECT 'companies', COUNT(*) FROM companies WHERE "assignedUserId" = 'ross-sylvester-2025'
        UNION ALL
        SELECT 'people', COUNT(*) FROM people WHERE "assignedUserId" = 'ross-sylvester-2025'
      `;

      console.log('   Assigned records:', assignedRecords);
      
      // If no assigned records, safe to delete
      const totalAssigned = assignedRecords.reduce((sum, record) => sum + parseInt(record.count), 0);
      if (totalAssigned === 0) {
        await prisma.users.delete({
          where: { id: 'ross-sylvester-2025' }
        });
        console.log('   ✅ Deleted duplicate Ross user');
      } else {
        console.log('   ⚠️ Cannot delete - user has assigned records');
      }
    } else {
      console.log('   No duplicate Ross user found');
    }

    // 2. Fix Tony Luthor ID to proper ULID format
    console.log('\n2. Fixing Tony Luthor ID...');
    const tonyUser = await prisma.users.findUnique({
      where: { id: 'tony-luthor-test' }
    });

    if (tonyUser) {
      console.log(`   Found Tony: ${tonyUser.name} (${tonyUser.email})`);
      
      // Generate new ULID
      const newId = `01K${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      console.log(`   New ULID: ${newId}`);
      
      // Check if Tony has any assigned records
      const tonyAssignedRecords = await prisma.$queryRaw`
        SELECT 
          'leads' as table_name, COUNT(*) as count FROM leads WHERE "assignedUserId" = 'tony-luthor-test'
        UNION ALL
        SELECT 'prospects', COUNT(*) FROM prospects WHERE "assignedUserId" = 'tony-luthor-test'
        UNION ALL
        SELECT 'opportunities', COUNT(*) FROM opportunities WHERE "assignedUserId" = 'tony-luthor-test'
        UNION ALL
        SELECT 'companies', COUNT(*) FROM companies WHERE "assignedUserId" = 'tony-luthor-test'
        UNION ALL
        SELECT 'people', COUNT(*) FROM people WHERE "assignedUserId" = 'tony-luthor-test'
      `;

      const tonyTotalAssigned = tonyAssignedRecords.reduce((sum, record) => sum + parseInt(record.count), 0);
      
      if (tonyTotalAssigned === 0) {
        // Safe to update ID
        await prisma.users.update({
          where: { id: 'tony-luthor-test' },
          data: { id: newId }
        });
        console.log('   ✅ Updated Tony Luthor ID to proper ULID format');
      } else {
        console.log('   ⚠️ Cannot update - Tony has assigned records');
        console.log('   Assigned records:', tonyAssignedRecords);
      }
    } else {
      console.log('   No Tony Luthor user found');
    }

    // 3. Fix John Dano company association
    console.log('\n3. Fixing John Dano company association...');
    
    // Get John Dano's people record
    const johnDanoPerson = await prisma.people.findFirst({
      where: { 
        fullName: 'John Dano',
        assignedUserId: '01K1VBYZG41K9QA0D9CF06KNRG'
      }
    });

    if (johnDanoPerson) {
      console.log(`   Found John Dano person record: ${johnDanoPerson.id}`);
      
      // Get Retail Product Solutions company
      const retailProductSolutions = await prisma.companies.findFirst({
        where: { 
          name: 'Retail Product Solutions',
          assignedUserId: '01K1VBYZG41K9QA0D9CF06KNRG'
        }
      });

      if (retailProductSolutions) {
        console.log(`   Found Retail Product Solutions: ${retailProductSolutions.id}`);
        
        // Update John Dano's person record to link to company
        await prisma.people.update({
          where: { id: johnDanoPerson.id },
          data: { 
            companyId: retailProductSolutions.id,
            updatedAt: new Date()
          }
        });
        console.log('   ✅ Linked John Dano to Retail Product Solutions');
      } else {
        console.log('   ⚠️ Retail Product Solutions company not found');
      }
    } else {
      console.log('   ⚠️ John Dano person record not found');
    }

    // 4. Verify data consistency
    console.log('\n4. Verifying data consistency...');
    
    // Check all users
    const allUsers = await prisma.users.findMany();
    console.log(`   Users: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`     - ${user.name} (${user.id}) - ${user.email}`);
    });

    // Check companies
    const allCompanies = await prisma.companies.findMany({
      where: { assignedUserId: '01K1VBYZG41K9QA0D9CF06KNRG' }
    });
    console.log(`   Companies: ${allCompanies.length}`);
    allCompanies.forEach(company => {
      console.log(`     - ${company.name} (${company.id})`);
    });

    // Check people with company associations
    const allPeople = await prisma.people.findMany({
      where: { assignedUserId: '01K1VBYZG41K9QA0D9CF06KNRG' },
      include: { company: true }
    });
    console.log(`   People: ${allPeople.length}`);
    allPeople.forEach(person => {
      const companyName = person.company?.name || 'No company';
      console.log(`     - ${person.fullName} (${person.id}) - ${companyName}`);
    });

    // Check leads
    const allLeads = await prisma.leads.findMany({
      where: { assignedUserId: '01K1VBYZG41K9QA0D9CF06KNRG' }
    });
    console.log(`   Leads: ${allLeads.length}`);
    allLeads.forEach(lead => {
      console.log(`     - ${lead.fullName} (${lead.id}) - ${lead.company}`);
    });

    // Check prospects
    const allProspects = await prisma.prospects.findMany({
      where: { assignedUserId: '01K1VBYZG41K9QA0D9CF06KNRG' }
    });
    console.log(`   Prospects: ${allProspects.length}`);
    allProspects.forEach(prospect => {
      console.log(`     - ${prospect.fullName} (${prospect.id}) - ${prospect.company}`);
    });

    console.log('\n✅ USER DATA CONSISTENCY FIX COMPLETED');

  } catch (error) {
    console.error('❌ Error fixing user data consistency:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixUserDataConsistency()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUserDataConsistency };
