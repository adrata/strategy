#!/usr/bin/env node

/**
 * 👥 SETUP NOTARY EVERYDAY USERS
 * 
 * Sets up user assignments for Notary Everyday workspace with proper isolation
 */

const { PrismaClient } = require('@prisma/client');

// Database connections
const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

const newPrisma = new PrismaClient();

async function setupNotaryEverydayUsers() {
  try {
    console.log('👥 Setting up Notary Everyday users with proper workspace isolation...\n');
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // 1. Find Notary Everyday workspace
    console.log('📋 FINDING NOTARY EVERYDAY WORKSPACE:');
    
    const notaryWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });
    
    if (!notaryWorkspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${notaryWorkspace.name} (${notaryWorkspace.id})\n`);

    // 2. Find Victoria in the new database
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
      throw new Error('Victoria user not found in new database!');
    }
    
    console.log(`✅ Found Victoria: ${victoria.name} (${victoria.id})\n`);

    // 3. Get Dano and Ryan from old database
    console.log('👤 GETTING DANO AND RYAN FROM OLD DATABASE:');
    
    const dano = await sbiPrisma.$queryRaw`
      SELECT id, name, email, "firstName", "lastName", timezone, "createdAt", "updatedAt"
      FROM users 
      WHERE name ILIKE '%dano%' OR "firstName" ILIKE '%dano%' OR "lastName" ILIKE '%dano%'
      LIMIT 1;
    `;
    
    const ryan = await sbiPrisma.$queryRaw`
      SELECT id, name, email, "firstName", "lastName", timezone, "createdAt", "updatedAt"
      FROM users 
      WHERE name ILIKE '%ryan%' OR "firstName" ILIKE '%ryan%' OR "lastName" ILIKE '%ryan%'
      LIMIT 1;
    `;
    
    if (!dano || dano.length === 0) {
      throw new Error('Dano user not found in old database!');
    }
    
    if (!ryan || ryan.length === 0) {
      throw new Error('Ryan user not found in old database!');
    }
    
    console.log(`✅ Found Dano: ${dano[0].name} (${dano[0].email})`);
    console.log(`✅ Found Ryan: ${ryan[0].name} (${ryan[0].email})\n`);

    // 4. Create Dano and Ryan in new database
    console.log('👤 CREATING DANO AND RYAN IN NEW DATABASE:');
    
    let newDano = await newPrisma.users.findFirst({
      where: {
        email: dano[0].email
      }
    });
    
    if (!newDano) {
      newDano = await newPrisma.users.create({
        data: {
          email: dano[0].email,
          name: dano[0].name,
          firstName: dano[0].firstName,
          lastName: dano[0].lastName,
          timezone: dano[0].timezone || 'UTC',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created Dano: ${newDano.name} (${newDano.id})`);
    } else {
      console.log(`📋 Dano already exists: ${newDano.name} (${newDano.id})`);
    }
    
    let newRyan = await newPrisma.users.findFirst({
      where: {
        email: ryan[0].email
      }
    });
    
    if (!newRyan) {
      newRyan = await newPrisma.users.create({
        data: {
          email: ryan[0].email,
          name: ryan[0].name,
          firstName: ryan[0].firstName,
          lastName: ryan[0].lastName,
          timezone: ryan[0].timezone || 'UTC',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created Ryan: ${newRyan.name} (${newRyan.id})`);
    } else {
      console.log(`📋 Ryan already exists: ${newRyan.name} (${newRyan.id})`);
    }

    // 5. Add users to Notary Everyday workspace
    console.log('\n🏢 ADDING USERS TO NOTARY EVERYDAY WORKSPACE:');
    
    // Add Victoria to workspace
    const victoriaWorkspace = await newPrisma.workspace_users.findFirst({
      where: {
        workspaceId: notaryWorkspace.id,
        userId: victoria.id
      }
    });
    
    if (!victoriaWorkspace) {
      await newPrisma.workspace_users.create({
        data: {
          workspaceId: notaryWorkspace.id,
          userId: victoria.id,
          role: 'SELLER',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Added Victoria to Notary Everyday workspace`);
    } else {
      console.log(`📋 Victoria already in Notary Everyday workspace`);
    }
    
    // Add Dano to workspace
    const danoWorkspace = await newPrisma.workspace_users.findFirst({
      where: {
        workspaceId: notaryWorkspace.id,
        userId: newDano.id
      }
    });
    
    if (!danoWorkspace) {
      await newPrisma.workspace_users.create({
        data: {
          workspaceId: notaryWorkspace.id,
          userId: newDano.id,
          role: 'SELLER',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Added Dano to Notary Everyday workspace`);
    } else {
      console.log(`📋 Dano already in Notary Everyday workspace`);
    }
    
    // Add Ryan to workspace
    const ryanWorkspace = await newPrisma.workspace_users.findFirst({
      where: {
        workspaceId: notaryWorkspace.id,
        userId: newRyan.id
      }
    });
    
    if (!ryanWorkspace) {
      await newPrisma.workspace_users.create({
        data: {
          workspaceId: notaryWorkspace.id,
          userId: newRyan.id,
          role: 'SELLER',
          updatedAt: new Date()
        }
      });
      console.log(`✅ Added Ryan to Notary Everyday workspace`);
    } else {
      console.log(`📋 Ryan already in Notary Everyday workspace`);
    }

    // 6. Get all companies and people in Notary Everyday workspace
    console.log('\n📊 GETTING NOTARY EVERYDAY DATA:');
    
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
    
    console.log(`   Found ${companies.length} companies`);
    console.log(`   Found ${people.length} people`);

    // 7. Make Victoria the main seller for all people and companies
    console.log('\n👑 MAKING VICTORIA MAIN SELLER FOR ALL PEOPLE:');
    
    let victoriaPeopleUpdated = 0;
    for (const person of people) {
      await newPrisma.people.update({
        where: { id: person.id },
        data: { 
          mainSellerId: victoria.id,
          updatedAt: new Date()
        }
      });
      victoriaPeopleUpdated++;
    }
    
    console.log(`✅ Updated ${victoriaPeopleUpdated} people with Victoria as main seller`);

    // 8. Make Dano the main seller for all companies
    console.log('\n👑 MAKING DANO MAIN SELLER FOR ALL COMPANIES:');
    
    let danoCompaniesUpdated = 0;
    for (const company of companies) {
      await newPrisma.companies.update({
        where: { id: company.id },
        data: { 
          mainSellerId: newDano.id,
          updatedAt: new Date()
        }
      });
      danoCompaniesUpdated++;
    }
    
    console.log(`✅ Updated ${danoCompaniesUpdated} companies with Dano as main seller`);

    // 9. Make Ryan the co-seller for all companies
    console.log('\n👥 MAKING RYAN CO-SELLER FOR ALL COMPANIES:');
    
    let ryanCoSellerAdded = 0;
    for (const company of companies) {
      // Check if Ryan is already a co-seller for this company
      const existingCoSeller = await newPrisma.person_co_sellers.findFirst({
        where: {
          personId: company.id, // Using company ID as personId for co-seller relationship
          userId: newRyan.id
        }
      });
      
      if (!existingCoSeller) {
        await newPrisma.person_co_sellers.create({
          data: {
            personId: company.id,
            userId: newRyan.id
          }
        });
        ryanCoSellerAdded++;
      }
    }
    
    console.log(`✅ Added Ryan as co-seller for ${ryanCoSellerAdded} companies`);

    // 10. Select 50 random companies for Ryan to be main seller
    console.log('\n🎲 SELECTING 50 RANDOM COMPANIES FOR RYAN:');
    
    const shuffledCompanies = companies.sort(() => 0.5 - Math.random());
    const ryanCompanies = shuffledCompanies.slice(0, 50);
    
    console.log(`✅ Selected ${ryanCompanies.length} random companies for Ryan`);

    // 11. Make Ryan the main seller for the 50 random companies
    console.log('\n👑 MAKING RYAN MAIN SELLER FOR 50 RANDOM COMPANIES:');
    
    let ryanMainSellerUpdated = 0;
    for (const company of ryanCompanies) {
      await newPrisma.companies.update({
        where: { id: company.id },
        data: { 
          mainSellerId: newRyan.id,
          updatedAt: new Date()
        }
      });
      ryanMainSellerUpdated++;
    }
    
    console.log(`✅ Updated ${ryanMainSellerUpdated} companies with Ryan as main seller`);

    // 12. Make Ryan the main seller for people associated with his companies
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
          mainSellerId: newRyan.id,
          updatedAt: new Date()
        }
      });
      ryanPeopleUpdated++;
    }
    
    console.log(`✅ Updated ${ryanPeopleUpdated} people with Ryan as main seller`);

    // 13. Summary
    console.log('\n📊 USER ASSIGNMENT SUMMARY:');
    console.log('============================');
    console.log(`✅ Workspace: ${notaryWorkspace.name}`);
    console.log(`✅ Victoria: Main seller for ${victoriaPeopleUpdated} people`);
    console.log(`✅ Dano: Main seller for ${danoCompaniesUpdated} companies`);
    console.log(`✅ Ryan: Co-seller for ${ryanCoSellerAdded} companies`);
    console.log(`✅ Ryan: Main seller for ${ryanMainSellerUpdated} companies`);
    console.log(`✅ Ryan: Main seller for ${ryanPeopleUpdated} people`);
    console.log('\n🎉 User assignments completed successfully!');
    console.log('All data is properly isolated within the Notary Everyday workspace.');

  } catch (error) {
    console.error('❌ Error during user setup:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run the setup
setupNotaryEverydayUsers();
