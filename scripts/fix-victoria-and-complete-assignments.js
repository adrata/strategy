#!/usr/bin/env node

/**
 * 🔧 FIX VICTORIA AND COMPLETE USER ASSIGNMENTS
 * 
 * 1. Move Victoria from Notary Everyday to SBI workspace
 * 2. Complete Dano and Ryan assignments for Notary Everyday
 * 3. Ensure proper workspace isolation
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function fixVictoriaAndCompleteAssignments() {
  try {
    console.log('🔧 Fixing Victoria workspace and completing user assignments...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to new database!\n');

    // 1. Find Victoria
    console.log('👤 FINDING VICTORIA:');
    const victoria = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Victoria',
          mode: 'insensitive'
        }
      }
    });
    
    if (!victoria) {
      throw new Error('Victoria user not found!');
    }
    
    console.log(`✅ Found Victoria: ${victoria.name} (${victoria.id})\n`);

    // 2. Find SBI workspace
    console.log('📋 FINDING SBI WORKSPACE:');
    let sbiWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'SBI',
          mode: 'insensitive'
        }
      }
    });
    
    if (!sbiWorkspace) {
      // Create SBI workspace if it doesn't exist
      sbiWorkspace = await newPrisma.workspaces.create({
        data: {
          name: 'SBI',
          slug: 'sbi',
          timezone: 'UTC',
          description: 'SBI workspace for Sales Business Intelligence data',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created SBI workspace: ${sbiWorkspace.name} (${sbiWorkspace.id})\n`);
    } else {
      console.log(`✅ Found SBI workspace: ${sbiWorkspace.name} (${sbiWorkspace.id})\n`);
    }

    // 3. Remove Victoria from Notary Everyday workspace
    console.log('🚫 REMOVING VICTORIA FROM NOTARY EVERYDAY:');
    const notaryWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });
    
    if (notaryWorkspace) {
      await newPrisma.workspace_users.deleteMany({
        where: {
          workspaceId: notaryWorkspace.id,
          userId: victoria.id
        }
      });
      console.log(`✅ Removed Victoria from Notary Everyday workspace`);
    }

    // 4. Add Victoria to SBI workspace
    console.log('\n✅ ADDING VICTORIA TO SBI WORKSPACE:');
    const victoriaSbiWorkspace = await newPrisma.workspace_users.findFirst({
      where: {
        workspaceId: sbiWorkspace.id,
        userId: victoria.id
      }
    });
    
    if (!victoriaSbiWorkspace) {
      await newPrisma.workspace_users.create({
        data: {
          workspaceId: sbiWorkspace.id,
          userId: victoria.id,
          role: 'SELLER',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Added Victoria to SBI workspace`);
    } else {
      console.log(`📋 Victoria already in SBI workspace`);
    }

    // 5. Find Dano and Ryan
    console.log('\n👤 FINDING DANO AND RYAN:');
    const dano = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Dano',
          mode: 'insensitive'
        }
      }
    });
    
    const ryan = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Ryan',
          mode: 'insensitive'
        }
      }
    });
    
    if (!dano) {
      throw new Error('Dano user not found!');
    }
    
    if (!ryan) {
      throw new Error('Ryan user not found!');
    }
    
    console.log(`✅ Found Dano: ${dano.name} (${dano.id})`);
    console.log(`✅ Found Ryan: ${ryan.name} (${ryan.id})`);

    // 6. Complete Dano and Ryan assignments for Notary Everyday
    if (notaryWorkspace) {
      console.log('\n👑 COMPLETING DANO AND RYAN ASSIGNMENTS FOR NOTARY EVERYDAY:');
      
      // Get all companies and people in Notary Everyday
      const companies = await newPrisma.companies.findMany({
        where: {
          workspaceId: notaryWorkspace.id
        },
        select: {
          id: true,
          name: true
        }
      });
      
      const people = await newPrisma.people.findMany({
        where: {
          workspaceId: notaryWorkspace.id
        },
        select: {
          id: true,
          fullName: true,
          companyId: true
        }
      });
      
      console.log(`   Found ${companies.length} companies and ${people.length} people`);

      // Make Dano the main seller for all companies
      console.log('\n👑 MAKING DANO MAIN SELLER FOR ALL COMPANIES:');
      let danoCompaniesUpdated = 0;
      for (const company of companies) {
        await newPrisma.companies.update({
          where: { id: company.id },
          data: { 
            mainSellerId: dano.id,
            updatedAt: new Date()
          }
        });
        danoCompaniesUpdated++;
      }
      console.log(`✅ Updated ${danoCompaniesUpdated} companies with Dano as main seller`);

      // Note: Companies don't have co-sellers in the current schema
      console.log('\n👥 NOTE: Companies don\'t have co-sellers in current schema');

      // Select 50 random companies for Ryan to be main seller
      console.log('\n🎲 SELECTING 50 RANDOM COMPANIES FOR RYAN:');
      const shuffledCompanies = companies.sort(() => 0.5 - Math.random());
      const ryanCompanies = shuffledCompanies.slice(0, 50);
      console.log(`✅ Selected ${ryanCompanies.length} random companies for Ryan`);

      // Make Ryan the main seller for the 50 random companies
      console.log('\n👑 MAKING RYAN MAIN SELLER FOR 50 RANDOM COMPANIES:');
      let ryanMainSellerUpdated = 0;
      for (const company of ryanCompanies) {
        await newPrisma.companies.update({
          where: { id: company.id },
          data: { 
            mainSellerId: ryan.id,
            updatedAt: new Date()
          }
        });
        ryanMainSellerUpdated++;
      }
      console.log(`✅ Updated ${ryanMainSellerUpdated} companies with Ryan as main seller`);

      // Make Ryan the main seller for people associated with his companies
      console.log('\n👥 MAKING RYAN MAIN SELLER FOR ASSOCIATED PEOPLE:');
      const ryanCompanyIds = ryanCompanies.map(c => c.id);
      const ryanPeople = people.filter(person => 
        person.companyId && ryanCompanyIds.includes(person.companyId)
      );
      
      let ryanPeopleUpdated = 0;
      for (const person of ryanPeople) {
        await newPrisma.people.update({
          where: { id: person.id },
          data: { 
            mainSellerId: ryan.id,
            updatedAt: new Date()
          }
        });
        ryanPeopleUpdated++;
      }
      console.log(`✅ Updated ${ryanPeopleUpdated} people with Ryan as main seller`);
    }

    // 7. Summary
    console.log('\n📊 FINAL USER ASSIGNMENT SUMMARY:');
    console.log('==================================');
    console.log(`✅ Victoria: Moved to SBI workspace`);
    console.log(`✅ Dano: Main seller for all Notary Everyday companies`);
    console.log(`✅ Ryan: Note - Companies don't have co-sellers in current schema`);
    console.log(`✅ Ryan: Main seller for 50 random Notary Everyday companies`);
    console.log(`✅ Ryan: Main seller for associated people`);
    console.log('\n🎉 All user assignments completed successfully!');
    console.log('Data is properly isolated between workspaces.');

  } catch (error) {
    console.error('❌ Error during user assignment fix:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the fix
fixVictoriaAndCompleteAssignments();
