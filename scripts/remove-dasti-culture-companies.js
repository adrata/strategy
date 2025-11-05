#!/usr/bin/env node

/**
 * 🗑️ REMOVE D'ASTI AND CULTURE CULZ COMPANIES
 * 
 * Removes "D'Asti Maritime Services" and "Culture Culz" companies from Dan's Adrata workspace
 * Also removes all people associated with D'Asti (4 people)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeCompanies() {
  try {
    console.log('🗑️ Removing D\'Asti and Culture Culz companies...\n');
    
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

    // Find D'Asti company
    console.log('📋 FINDING D\'ASTI MARITIME SERVICES COMPANY:');
    const dastiCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: adrataWorkspace.id,
        OR: [
          { name: { contains: "D'Asti", mode: 'insensitive' } },
          { name: { contains: "Dasti", mode: 'insensitive' } },
          { name: { contains: "Maritime", mode: 'insensitive' } }
        ]
      }
    });
    
    if (!dastiCompany) {
      console.log('❌ D\'Asti company not found!');
    } else {
      console.log(`✅ Found company: ${dastiCompany.name} (${dastiCompany.id})\n`);
    }

    // Find Culture Culz company
    console.log('📋 FINDING CULTURE CULZ COMPANY:');
    const cultureCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: adrataWorkspace.id,
        OR: [
          { name: { contains: "Culture Culz", mode: 'insensitive' } },
          { name: { contains: "Culz", mode: 'insensitive' } }
        ]
      }
    });
    
    if (!cultureCompany) {
      console.log('❌ Culture Culz company not found!');
    } else {
      console.log(`✅ Found company: ${cultureCompany.name} (${cultureCompany.id})\n`);
    }

    // Delete people associated with D'Asti
    if (dastiCompany) {
      console.log('👥 FINDING PEOPLE ASSOCIATED WITH D\'ASTI:');
      const dastiPeople = await prisma.people.findMany({
        where: {
          workspaceId: adrataWorkspace.id,
          companyId: dastiCompany.id
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });
      
      console.log(`✅ Found ${dastiPeople.length} people associated with D'Asti:`);
      dastiPeople.forEach((person, i) => {
        const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
        console.log(`   ${i + 1}. ${name} (${person.email || 'no email'}) - ${person.id}`);
      });
      console.log('');

      // Delete people
      console.log('🗑️ DELETING PEOPLE FROM D\'ASTI:');
      const deletedPeople = await prisma.people.deleteMany({
        where: {
          workspaceId: adrataWorkspace.id,
          companyId: dastiCompany.id
        }
      });
      console.log(`✅ Deleted ${deletedPeople.count} people\n`);
    }

    // Delete actions associated with both companies
    if (dastiCompany) {
      console.log('📝 DELETING ACTIONS FROM D\'ASTI:');
      const deletedActionsDasti = await prisma.actions.deleteMany({
        where: {
          workspaceId: adrataWorkspace.id,
          companyId: dastiCompany.id
        }
      });
      console.log(`✅ Deleted ${deletedActionsDasti.count} actions from D'Asti`);
    }

    if (cultureCompany) {
      console.log('📝 DELETING ACTIONS FROM CULTURE CULZ:');
      const deletedActionsCulture = await prisma.actions.deleteMany({
        where: {
          workspaceId: adrataWorkspace.id,
          companyId: cultureCompany.id
        }
      });
      console.log(`✅ Deleted ${deletedActionsCulture.count} actions from Culture Culz`);
    }

    // Delete the companies themselves
    if (dastiCompany) {
      console.log('\n🗑️ DELETING D\'ASTI COMPANY:');
      await prisma.companies.delete({
        where: { id: dastiCompany.id }
      });
      console.log(`✅ Deleted D'Asti company`);
    }

    if (cultureCompany) {
      console.log('🗑️ DELETING CULTURE CULZ COMPANY:');
      await prisma.companies.delete({
        where: { id: cultureCompany.id }
      });
      console.log(`✅ Deleted Culture Culz company`);
    }

    console.log('\n🎉 Company removal complete!');

  } catch (error) {
    console.error('❌ Error during company removal:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the removal
removeCompanies();

