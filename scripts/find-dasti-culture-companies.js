#!/usr/bin/env node

/**
 * 🔍 FIND D'ASTI AND CULTURE CULZ COMPANIES
 * 
 * Searches for companies matching "D'Asti Maritime Services" and "Culture Culz"
 * in Dan's Adrata workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findCompanies() {
  try {
    console.log('🔍 Searching for companies...\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Find Dan's Adrata workspace
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: 'Adrata'
      }
    });

    if (!adratraWorkspace) {
      console.log('❌ Adrata workspace not found!');
      return;
    }

    console.log(`✅ Found Adrata workspace: ${adratraWorkspace.id}\n`);

    // Search for D'Asti company
    console.log('📋 SEARCHING FOR D\'ASTI MARITIME SERVICES COMPANY:');
    const dastiCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        OR: [
          { name: { contains: "D'Asti", mode: 'insensitive' } },
          { name: { contains: "Dasti", mode: 'insensitive' } },
          { name: { contains: "Maritime", mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${dastiCompanies.length} companies matching D'Asti:`);
    dastiCompanies.forEach((company, i) => {
      console.log(`   ${i + 1}. ${company.name} (${company.id}) - domain: ${company.domain || 'N/A'}`);
    });
    console.log('');

    // Search for Culture Culz company
    console.log('📋 SEARCHING FOR CULTURE CULZ COMPANY:');
    const cultureCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        OR: [
          { name: { contains: "Culture", mode: 'insensitive' } },
          { name: { contains: "Culz", mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${cultureCompanies.length} companies matching Culture Culz:`);
    cultureCompanies.forEach((company, i) => {
      console.log(`   ${i + 1}. ${company.name} (${company.id}) - domain: ${company.domain || 'N/A'}`);
    });
    console.log('');

    // If D'Asti company found, list people
    if (dastiCompanies.length > 0) {
      const dastiCompany = dastiCompanies[0];
      console.log(`👥 PEOPLE ASSOCIATED WITH ${dastiCompany.name}:`);
      const dastiPeople = await prisma.people.findMany({
        where: {
          workspaceId: adrataWorkspace.id,
          companyId: dastiCompany.id
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true
        }
      });
      
      console.log(`Found ${dastiPeople.length} people:`);
      dastiPeople.forEach((person, i) => {
        const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
        console.log(`   ${i + 1}. ${name} (${person.email || 'no email'}) - ${person.title || 'N/A'} - ${person.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

findCompanies();
