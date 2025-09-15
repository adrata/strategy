#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dano's Notary Everyday workspace ID
const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function debugPeopleCompanyData() {
  try {
    console.log('🔍 DEBUGGING PEOPLE-COMPANY DATA RELATIONSHIPS');
    console.log('='.repeat(60));
    console.log('');

    // 1. Check total people count
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null
      }
    });
    console.log(`📊 Total people in Dano's Notary Everyday workspace: ${totalPeople}`);

    // 2. Check people with companyId
    const peopleWithCompanyId = await prisma.people.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null }
      }
    });
    console.log(`🏢 People with companyId: ${peopleWithCompanyId}`);

    // 3. Check people without companyId
    const peopleWithoutCompanyId = await prisma.people.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null,
        companyId: null
      }
    });
    console.log(`❌ People without companyId: ${peopleWithoutCompanyId}`);
    console.log('');

    // 4. Sample people with company relationships
    console.log('🔍 SAMPLE PEOPLE WITH COMPANY RELATIONSHIPS:');
    console.log('-'.repeat(50));
    
    const peopleWithCompanies = await prisma.people.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null,
        companyId: { not: null }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        }
      },
      take: 10
    });

    if (peopleWithCompanies.length > 0) {
      peopleWithCompanies.forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName}`);
        console.log(`   Company: ${person.company?.name || 'Unknown'}`);
        console.log(`   CompanyId: ${person.companyId}`);
        console.log(`   Industry: ${person.company?.industry || 'Unknown'}`);
        console.log('');
      });
    } else {
      console.log('   No people with company relationships found!');
      console.log('');
    }

    // 5. Sample people without company relationships
    console.log('❌ SAMPLE PEOPLE WITHOUT COMPANY RELATIONSHIPS:');
    console.log('-'.repeat(50));
    
    const peopleWithoutCompanies = await prisma.people.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null,
        companyId: null
      },
      take: 10
    });

    if (peopleWithoutCompanies.length > 0) {
      peopleWithoutCompanies.forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName}`);
        console.log(`   Email: ${person.email || 'No email'}`);
        console.log(`   Job Title: ${person.jobTitle || 'No title'}`);
        console.log('');
      });
    } else {
      console.log('   All people have company relationships!');
      console.log('');
    }

    // 6. Check total companies
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null
      }
    });
    console.log(`🏢 Total companies in Dano's Notary Everyday workspace: ${totalCompanies}`);

    // 7. Sample companies
    console.log('🏢 SAMPLE COMPANIES:');
    console.log('-'.repeat(30));
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null
      },
      take: 10
    });

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Industry: ${company.industry || 'Unknown'}`);
      console.log(`   Website: ${company.website || 'No website'}`);
      console.log('');
    });

    // 8. Check if there are leads/prospects with company data that could be used
    console.log('🔍 CHECKING LEADS/PROSPECTS FOR COMPANY DATA:');
    console.log('-'.repeat(50));
    
    const leadsWithCompanies = await prisma.leads.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null,
        company: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true
      },
      take: 10
    });

    console.log(`📊 Leads with company data: ${leadsWithCompanies.length}`);
    if (leadsWithCompanies.length > 0) {
      leadsWithCompanies.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.fullName} → ${lead.company}`);
      });
    }

    const prospectsWithCompanies = await prisma.prospects.findMany({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        deletedAt: null,
        company: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true
      },
      take: 10
    });

    console.log(`📊 Prospects with company data: ${prospectsWithCompanies.length}`);
    if (prospectsWithCompanies.length > 0) {
      prospectsWithCompanies.forEach((prospect, index) => {
        console.log(`${index + 1}. ${prospect.fullName} → ${prospect.company}`);
      });
    }

    console.log('');
    console.log('✅ DEBUG COMPLETE');
    
  } catch (error) {
    console.error('❌ Error debugging people-company data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPeopleCompanyData();
