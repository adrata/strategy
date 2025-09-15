const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = 50;
const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

// ULID generation function
function generateULID() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 10);
  return timestamp + random;
}

async function correctedPeopleImport() {
  try {
    console.log('🚀 CORRECTED PEOPLE IMPORT - Retail Product Solutions');
    console.log('='.repeat(60));
    console.log('📋 Logic: People are core records, linked to leads/prospects');
    console.log('='.repeat(60));
    
    // Step 1: Import companies first (deduplicated)
    await importCompaniesDeduplicated();
    
    // Step 2: Import people from contacts CSV as prospects
    await importPeopleFromContactsAsProspects();
    
    // Step 3: Import people from leads CSV as leads
    await importPeopleFromLeadsAsLeads();
    
    // Step 4: Final verification
    await finalVerification();
    
    console.log('\n✅ CORRECTED PEOPLE IMPORT COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importCompaniesDeduplicated() {
  console.log('\n🏢 IMPORTING COMPANIES (DEDUPLICATED)');
  console.log('='.repeat(50));
  
  const contactsCsv = fs.readFileSync('Contacts_2025_09_15.csv', 'utf8');
  const leadsCsv = fs.readFileSync('Leads_2025_09_15.csv', 'utf8');
  
  const companies = new Set();
  
  // From contacts CSV
  const contactLines = contactsCsv.split('\n');
  const contactHeaders = contactLines[0].split(',');
  const companyNameIndex = contactHeaders.findIndex(h => h.toLowerCase().includes('account name'));
  
  for (let i = 1; i < contactLines.length; i++) {
    if (contactLines[i].trim()) {
      const columns = contactLines[i].split(',');
      const companyName = columns[companyNameIndex]?.trim();
      if (companyName && !companyName.startsWith('zcrm_')) {
        companies.add(companyName);
      }
    }
  }
  
  // From leads CSV
  const leadLines = leadsCsv.split('\n');
  const leadHeaders = leadLines[0].split(',');
  const leadCompanyIndex = leadHeaders.findIndex(h => h.toLowerCase().includes('company'));
  
  for (let i = 1; i < leadLines.length; i++) {
    if (leadLines[i].trim()) {
      const columns = leadLines[i].split(',');
      const companyName = columns[leadCompanyIndex]?.trim();
      if (companyName) companies.add(companyName);
    }
  }
  
  // Get existing companies
  const existingCompanies = await prisma.companies.findMany({
    where: { workspaceId: RETAIL_WORKSPACE_ID },
    select: { name: true }
  });
  
  const existingCompanyNames = new Set(existingCompanies.map(c => c.name.toLowerCase()));
  const newCompanies = Array.from(companies).filter(company => 
    !existingCompanyNames.has(company.toLowerCase())
  );
  
  console.log(`📊 Found ${companies.size} unique companies`);
  console.log(`✅ ${newCompanies.length} new companies to create`);
  
  if (newCompanies.length === 0) {
    console.log('⏭️  No new companies to import');
    return;
  }
  
  // Import companies in batches
  const batches = chunkArray(newCompanies, BATCH_SIZE);
  let totalCreated = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📦 Processing company batch ${i + 1}/${batches.length} (${batch.length} companies)`);
    
    const companyPromises = batch.map(companyName => 
      prisma.companies.create({
        data: {
          id: generateULID(),
          name: companyName,
          workspaceId: RETAIL_WORKSPACE_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    );
    
    try {
      await Promise.all(companyPromises);
      totalCreated += batch.length;
      console.log(`✅ Created ${batch.length} companies (Total: ${totalCreated})`);
    } catch (error) {
      console.error(`❌ Error in batch ${i + 1}:`, error.message);
    }
  }
  
  console.log(`🏢 Companies import complete: ${totalCreated} created`);
}

async function importPeopleFromContactsAsProspects() {
  console.log('\n👥 IMPORTING PEOPLE FROM CONTACTS AS PROSPECTS');
  console.log('='.repeat(50));
  
  const contactsCsv = fs.readFileSync('Contacts_2025_09_15.csv', 'utf8');
  const lines = contactsCsv.split('\n');
  const headers = lines[0].split(',');
  
  // Find column indices
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const firstNameIndex = headers.findIndex(h => h.toLowerCase().includes('first name'));
  const lastNameIndex = headers.findIndex(h => h.toLowerCase().includes('last name'));
  const companyNameIndex = headers.findIndex(h => h.toLowerCase().includes('account name'));
  const titleIndex = headers.findIndex(h => h.toLowerCase().includes('title'));
  const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone'));
  const mobileIndex = headers.findIndex(h => h.toLowerCase().includes('mobile'));
  
  // Get existing people by email
  const existingPeople = await prisma.people.findMany({
    where: { workspaceId: RETAIL_WORKSPACE_ID },
    select: { email: true, workEmail: true, personalEmail: true }
  });
  
  const existingEmails = new Set();
  existingPeople.forEach(person => {
    if (person.email) existingEmails.add(person.email.toLowerCase());
    if (person.workEmail) existingEmails.add(person.workEmail.toLowerCase());
    if (person.personalEmail) existingEmails.add(person.personalEmail.toLowerCase());
  });
  
  // Prepare new people data
  const newPeople = [];
  const newProspects = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const columns = lines[i].split(',');
      const email = columns[emailIndex]?.toLowerCase().trim();
      
      if (email && email.includes('@') && !existingEmails.has(email)) {
        const firstName = columns[firstNameIndex]?.trim() || '';
        const lastName = columns[lastNameIndex]?.trim() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const companyName = columns[companyNameIndex]?.trim() || '';
        
        if (companyName && !companyName.startsWith('zcrm_')) {
          const personId = generateULID();
          
          // Create person record
          newPeople.push({
            id: personId,
            firstName,
            lastName,
            fullName,
            email,
            company: companyName,
            title: columns[titleIndex]?.trim() || '',
            phone: columns[phoneIndex]?.trim() || '',
            mobile: columns[mobileIndex]?.trim() || '',
            workspaceId: RETAIL_WORKSPACE_ID,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Create corresponding prospect record
          newProspects.push({
            id: generateULID(),
            firstName,
            lastName,
            fullName,
            email,
            company: companyName,
            title: columns[titleIndex]?.trim() || '',
            phone: columns[phoneIndex]?.trim() || '',
            mobilePhone: columns[mobileIndex]?.trim() || '',
            workspaceId: RETAIL_WORKSPACE_ID,
            personId: personId,
            status: 'engaged',
            source: 'contacts_csv_import',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
  }
  
  console.log(`📊 Found ${newPeople.length} new people to create`);
  console.log(`📊 Found ${newProspects.length} new prospects to create`);
  
  if (newPeople.length === 0) {
    console.log('⏭️  No new people to import');
    return;
  }
  
  // Import people in batches
  const peopleBatches = chunkArray(newPeople, BATCH_SIZE);
  let peopleCreated = 0;
  
  for (let i = 0; i < peopleBatches.length; i++) {
    const batch = peopleBatches[i];
    console.log(`📦 Processing people batch ${i + 1}/${peopleBatches.length} (${batch.length} people)`);
    
    const peoplePromises = batch.map(personData => 
      prisma.people.create({ data: personData })
    );
    
    try {
      await Promise.all(peoplePromises);
      peopleCreated += batch.length;
      console.log(`✅ Created ${batch.length} people (Total: ${peopleCreated})`);
    } catch (error) {
      console.error(`❌ Error in people batch ${i + 1}:`, error.message);
    }
  }
  
  // Import prospects in batches
  const prospectBatches = chunkArray(newProspects, BATCH_SIZE);
  let prospectsCreated = 0;
  
  for (let i = 0; i < prospectBatches.length; i++) {
    const batch = prospectBatches[i];
    console.log(`📦 Processing prospects batch ${i + 1}/${prospectBatches.length} (${batch.length} prospects)`);
    
    const prospectPromises = batch.map(prospectData => 
      prisma.prospects.create({ data: prospectData })
    );
    
    try {
      await Promise.all(prospectPromises);
      prospectsCreated += batch.length;
      console.log(`✅ Created ${batch.length} prospects (Total: ${prospectsCreated})`);
    } catch (error) {
      console.error(`❌ Error in prospects batch ${i + 1}:`, error.message);
    }
  }
  
  console.log(`👥 People from contacts complete: ${peopleCreated} people, ${prospectsCreated} prospects`);
}

async function importPeopleFromLeadsAsLeads() {
  console.log('\n🎯 IMPORTING PEOPLE FROM LEADS CSV AS LEADS');
  console.log('='.repeat(50));
  
  const leadsCsv = fs.readFileSync('Leads_2025_09_15.csv', 'utf8');
  const lines = leadsCsv.split('\n');
  const headers = lines[0].split(',');
  
  // Find column indices
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
  const firstNameIndex = headers.findIndex(h => h.toLowerCase().includes('first name'));
  const lastNameIndex = headers.findIndex(h => h.toLowerCase().includes('last name'));
  const companyIndex = headers.findIndex(h => h.toLowerCase().includes('company'));
  const titleIndex = headers.findIndex(h => h.toLowerCase().includes('title'));
  const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone'));
  const mobileIndex = headers.findIndex(h => h.toLowerCase().includes('mobile'));
  
  // Get existing people by email
  const existingPeople = await prisma.people.findMany({
    where: { workspaceId: RETAIL_WORKSPACE_ID },
    select: { email: true, workEmail: true, personalEmail: true }
  });
  
  const existingEmails = new Set();
  existingPeople.forEach(person => {
    if (person.email) existingEmails.add(person.email.toLowerCase());
    if (person.workEmail) existingEmails.add(person.workEmail.toLowerCase());
    if (person.personalEmail) existingEmails.add(person.personalEmail.toLowerCase());
  });
  
  // Get existing leads by email
  const existingLeads = await prisma.leads.findMany({
    where: { workspaceId: RETAIL_WORKSPACE_ID },
    select: { email: true }
  });
  
  const existingLeadEmails = new Set(existingLeads.map(lead => lead.email?.toLowerCase()).filter(Boolean));
  
  // Prepare new people and leads data
  const newPeople = [];
  const newLeads = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const columns = lines[i].split(',');
      const email = columns[emailIndex]?.toLowerCase().trim();
      
      if (email && email.includes('@') && !existingEmails.has(email) && !existingLeadEmails.has(email)) {
        const firstName = columns[firstNameIndex]?.trim() || '';
        const lastName = columns[lastNameIndex]?.trim() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const companyName = columns[companyIndex]?.trim() || '';
        
        const personId = generateULID();
        
        // Create person record
        newPeople.push({
          id: personId,
          firstName,
          lastName,
          fullName,
          email,
          company: companyName,
          title: columns[titleIndex]?.trim() || '',
          phone: columns[phoneIndex]?.trim() || '',
          mobile: columns[mobileIndex]?.trim() || '',
          workspaceId: RETAIL_WORKSPACE_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Create corresponding lead record
        newLeads.push({
          id: generateULID(),
          firstName,
          lastName,
          fullName,
          email,
          company: companyName,
          title: columns[titleIndex]?.trim() || '',
          phone: columns[phoneIndex]?.trim() || '',
          mobilePhone: columns[mobileIndex]?.trim() || '',
          workspaceId: RETAIL_WORKSPACE_ID,
          personId: personId,
          status: 'new',
          source: 'leads_csv_import',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  }
  
  console.log(`📊 Found ${newPeople.length} new people to create`);
  console.log(`📊 Found ${newLeads.length} new leads to create`);
  
  if (newPeople.length === 0) {
    console.log('⏭️  No new people to import');
    return;
  }
  
  // Import people in batches
  const peopleBatches = chunkArray(newPeople, BATCH_SIZE);
  let peopleCreated = 0;
  
  for (let i = 0; i < peopleBatches.length; i++) {
    const batch = peopleBatches[i];
    console.log(`📦 Processing people batch ${i + 1}/${peopleBatches.length} (${batch.length} people)`);
    
    const peoplePromises = batch.map(personData => 
      prisma.people.create({ data: personData })
    );
    
    try {
      await Promise.all(peoplePromises);
      peopleCreated += batch.length;
      console.log(`✅ Created ${batch.length} people (Total: ${peopleCreated})`);
    } catch (error) {
      console.error(`❌ Error in people batch ${i + 1}:`, error.message);
    }
  }
  
  // Import leads in batches
  const leadBatches = chunkArray(newLeads, BATCH_SIZE);
  let leadsCreated = 0;
  
  for (let i = 0; i < leadBatches.length; i++) {
    const batch = leadBatches[i];
    console.log(`📦 Processing leads batch ${i + 1}/${leadBatches.length} (${batch.length} leads)`);
    
    const leadPromises = batch.map(leadData => 
      prisma.leads.create({ data: leadData })
    );
    
    try {
      await Promise.all(leadPromises);
      leadsCreated += batch.length;
      console.log(`✅ Created ${batch.length} leads (Total: ${leadsCreated})`);
    } catch (error) {
      console.error(`❌ Error in leads batch ${i + 1}:`, error.message);
    }
  }
  
  console.log(`🎯 People from leads complete: ${peopleCreated} people, ${leadsCreated} leads`);
}

async function finalVerification() {
  console.log('\n📊 FINAL VERIFICATION');
  console.log('='.repeat(40));
  
  const [people, companies, leads, prospects, opportunities] = await Promise.all([
    prisma.people.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.companies.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.leads.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.prospects.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } }),
    prisma.opportunities.count({ where: { workspaceId: RETAIL_WORKSPACE_ID } })
  ]);
  
  console.log(`👥 Total People: ${people.toLocaleString()}`);
  console.log(`🏢 Total Companies: ${companies.toLocaleString()}`);
  console.log(`🎯 Total Leads: ${leads.toLocaleString()}`);
  console.log(`🔍 Total Prospects: ${prospects.toLocaleString()}`);
  console.log(`💼 Total Opportunities: ${opportunities.toLocaleString()}`);
  
  const totalRecords = people + companies + leads + prospects + opportunities;
  console.log(`📈 Total Records: ${totalRecords.toLocaleString()}`);
  
  // Check that every lead and prospect has a person
  const leadsWithoutPeople = await prisma.leads.count({
    where: { 
      workspaceId: RETAIL_WORKSPACE_ID,
      personId: null
    }
  });
  
  const prospectsWithoutPeople = await prisma.prospects.count({
    where: { 
      workspaceId: RETAIL_WORKSPACE_ID,
      personId: null
    }
  });
  
  console.log(`\n🔗 RELATIONSHIP CHECK:`);
  console.log(`🎯 Leads without people: ${leadsWithoutPeople}`);
  console.log(`🔍 Prospects without people: ${prospectsWithoutPeople}`);
  
  if (leadsWithoutPeople === 0 && prospectsWithoutPeople === 0) {
    console.log(`✅ Perfect! Every lead and prospect has a corresponding person record`);
  } else {
    console.log(`⚠️  Some leads/prospects are missing person records`);
  }
}

// Utility function to chunk array into batches
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Run the import
correctedPeopleImport();

