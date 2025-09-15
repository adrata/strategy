#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';

async function auditPersonCompanyRelationships() {
  try {
    console.log('🔍 Auditing person/company relationships for Notary Everyday workspace...');
    
    // Get all prospects
    const prospects = await prisma.prospects.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        personId: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });
    
    console.log(`📊 Found ${prospects.length} prospects`);
    
    // Get all people
    const people = await prisma.people.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });
    
    console.log(`👥 Found ${people.length} people`);
    
    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`🏢 Found ${companies.length} companies`);
    
    // Check prospects without personId
    const prospectsWithoutPerson = prospects.filter(p => !p.personId);
    console.log(`\n⚠️  Prospects without personId: ${prospectsWithoutPerson.length}`);
    
    if (prospectsWithoutPerson.length > 0) {
      console.log('Sample prospects without personId:');
      prospectsWithoutPerson.slice(0, 5).forEach(p => {
        console.log(`- ${p.fullName} (${p.company || 'No company'})`);
      });
    }
    
    // Check for duplicate people (same name + email)
    const duplicatePeople = [];
    const peopleMap = new Map();
    
    people.forEach(person => {
      const key = `${person.fullName}_${person.email || person.workEmail || person.personalEmail || 'no-email'}`;
      if (peopleMap.has(key)) {
        duplicatePeople.push([peopleMap.get(key), person]);
      } else {
        peopleMap.set(key, person);
      }
    });
    
    console.log(`\n🔄 Duplicate people found: ${duplicatePeople.length}`);
    if (duplicatePeople.length > 0) {
      console.log('Sample duplicates:');
      duplicatePeople.slice(0, 3).forEach(([p1, p2]) => {
        console.log(`- ${p1.fullName} (${p1.id}) vs (${p2.id})`);
      });
    }
    
    // Check prospects that should have corresponding people
    const prospectsNeedingPeople = [];
    const peopleByEmail = new Map();
    
    // Index people by email
    people.forEach(person => {
      const emails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (!peopleByEmail.has(email)) {
          peopleByEmail.set(email, []);
        }
        peopleByEmail.get(email).push(person);
      });
    });
    
    // Find prospects that should have people records
    prospects.forEach(prospect => {
      if (!prospect.personId) {
        const emails = [prospect.email, prospect.workEmail, prospect.personalEmail].filter(Boolean);
        let foundPerson = null;
        
        for (const email of emails) {
          if (peopleByEmail.has(email)) {
            foundPerson = peopleByEmail.get(email)[0];
            break;
          }
        }
        
        if (foundPerson) {
          prospectsNeedingPeople.push({
            prospect,
            person: foundPerson
          });
        }
      }
    });
    
    console.log(`\n🔗 Prospects that need personId updates: ${prospectsNeedingPeople.length}`);
    
    if (prospectsNeedingPeople.length > 0) {
      console.log('Sample prospects needing personId:');
      prospectsNeedingPeople.slice(0, 5).forEach(({ prospect, person }) => {
        console.log(`- ${prospect.fullName} -> Person: ${person.fullName} (${person.id})`);
      });
      
      // Update prospects with personId
      console.log('\n🔄 Updating prospects with personId...');
      let updatedCount = 0;
      
      for (const { prospect, person } of prospectsNeedingPeople) {
        try {
          await prisma.prospects.update({
            where: { id: prospect.id },
            data: { personId: person.id }
          });
          updatedCount++;
          
          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount} prospects...`);
          }
        } catch (error) {
          console.error(`❌ Error updating prospect ${prospect.fullName}:`, error.message);
        }
      }
      
      console.log(`✅ Updated ${updatedCount} prospects with personId`);
    }
    
    // Check company relationships
    const companiesByName = new Map();
    companies.forEach(company => {
      companiesByName.set(company.name.toLowerCase(), company);
    });
    
    const prospectsNeedingCompanies = [];
    prospects.forEach(prospect => {
      if (prospect.company && !companiesByName.has(prospect.company.toLowerCase())) {
        prospectsNeedingCompanies.push(prospect);
      }
    });
    
    console.log(`\n🏢 Prospects with companies not in companies table: ${prospectsNeedingCompanies.length}`);
    
    if (prospectsNeedingCompanies.length > 0) {
      console.log('Sample prospects with missing companies:');
      prospectsNeedingCompanies.slice(0, 5).forEach(p => {
        console.log(`- ${p.fullName} -> Company: ${p.company}`);
      });
      
      // Create missing companies
      console.log('\n🔄 Creating missing companies...');
      let createdCount = 0;
      
      for (const prospect of prospectsNeedingCompanies) {
        if (prospect.company) {
          try {
            const companyId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            await prisma.companies.create({
              data: {
                id: companyId,
                workspaceId: NOTARY_WORKSPACE_ID,
                name: prospect.company,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            createdCount++;
            companiesByName.set(prospect.company.toLowerCase(), { id: companyId, name: prospect.company });
            
            if (createdCount % 20 === 0) {
              console.log(`✅ Created ${createdCount} companies...`);
            }
          } catch (error) {
            console.error(`❌ Error creating company ${prospect.company}:`, error.message);
          }
        }
      }
      
      console.log(`✅ Created ${createdCount} missing companies`);
    }
    
    // Final verification
    const finalProspects = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const finalPeople = await prisma.people.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const finalCompanies = await prisma.companies.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const prospectsWithPersonId = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        personId: { not: null }
      }
    });
    
    console.log(`\n📊 Final audit results:`);
    console.log(`- Prospects: ${finalProspects}`);
    console.log(`- People: ${finalPeople}`);
    console.log(`- Companies: ${finalCompanies}`);
    console.log(`- Prospects with personId: ${prospectsWithPersonId} (${Math.round(prospectsWithPersonId/finalProspects*100)}%)`);
    
  } catch (error) {
    console.error('❌ Fatal error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditPersonCompanyRelationships();