#!/usr/bin/env node

/**
 * 🔍 CSV vs DATABASE AUDIT
 * 
 * Audits the Contacts_2025_09_15.csv file against the current database
 * to identify missing leads/prospects and proper classification
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

async function auditCsvVsDatabase() {
  console.log('🔍 CSV vs DATABASE AUDIT');
  console.log('='.repeat(60));
  console.log('Auditing Contacts_2025_09_15.csv against current database');
  console.log('');

  try {
    // Phase 1: Load and parse CSV data
    const csvData = await loadCsvData();
    
    // Phase 2: Get current database state
    const dbData = await getDatabaseData();
    
    // Phase 3: Compare and identify discrepancies
    await compareData(csvData, dbData);
    
    // Phase 4: Generate recommendations
    await generateRecommendations(csvData, dbData);
    
    console.log('');
    console.log('✅ CSV vs DATABASE AUDIT COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error in CSV vs Database audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function loadCsvData() {
  console.log('📊 PHASE 1: LOADING CSV DATA');
  console.log('-'.repeat(50));
  
  return new Promise((resolve, reject) => {
    const contacts = [];
    
    fs.createReadStream('Contacts_2025_09_15.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Clean and normalize the data
        const contact = {
          recordId: row['Record Id'],
          firstName: row['First Name']?.trim(),
          lastName: row['Last Name']?.trim(),
          fullName: `${row['First Name']?.trim()} ${row['Last Name']?.trim()}`.trim(),
          email: row['Email']?.trim(),
          title: row['Title']?.trim(),
          department: row['Department']?.trim(),
          phone: row['Phone']?.trim(),
          mobile: row['Mobile']?.trim(),
          accountName: row['Account Name']?.trim(),
          leadSource: row['Lead Source']?.trim(),
          lastActivityTime: row['Last Activity Time']?.trim(),
          lastAction: row['Last Action']?.trim(),
          nextAction: row['Next Action']?.trim(),
          linkedinUrl: row['Personal LinkedIn']?.trim(),
          createdTime: row['Created Time']?.trim(),
          modifiedTime: row['Modified Time']?.trim()
        };
        
        // Only include contacts with valid data
        if (contact.firstName && contact.lastName && contact.email) {
          contacts.push(contact);
        }
      })
      .on('end', () => {
        console.log(`   ✅ Loaded ${contacts.length.toLocaleString()} contacts from CSV`);
        console.log('');
        resolve(contacts);
      })
      .on('error', reject);
  });
}

async function getDatabaseData() {
  console.log('🗄️ PHASE 2: GETTING DATABASE DATA');
  console.log('-'.repeat(50));
  
  const [
    currentLeads,
    currentProspects,
    currentPeople,
    currentActions
  ] = await Promise.all([
    prisma.leads.findMany({
      where: { workspaceId: RETAIL_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        title: true,
        company: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.prospects.findMany({
      where: { workspaceId: RETAIL_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        title: true,
        company: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.people.findMany({
      where: { workspaceId: RETAIL_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.actions.findMany({
      where: { workspaceId: RETAIL_WORKSPACE_ID },
      select: {
        id: true,
        type: true,
        subject: true,
        leadId: true,
        prospectId: true,
        personId: true,
        companyId: true,
        createdAt: true
      }
    })
  ]);

  console.log(`   Current Leads: ${currentLeads.length.toLocaleString()}`);
  console.log(`   Current Prospects: ${currentProspects.length.toLocaleString()}`);
  console.log(`   Current People: ${currentPeople.length.toLocaleString()}`);
  console.log(`   Current Actions: ${currentActions.length.toLocaleString()}`);
  console.log('');

  return {
    leads: currentLeads,
    prospects: currentProspects,
    people: currentPeople,
    actions: currentActions
  };
}

async function compareData(csvData, dbData) {
  console.log('🔍 PHASE 3: COMPARING DATA');
  console.log('-'.repeat(50));
  
  // Create lookup maps for database records
  const dbLeadsMap = new Map();
  const dbProspectsMap = new Map();
  const dbPeopleMap = new Map();
  
  dbData.leads.forEach(lead => {
    const key = lead.email || lead.workEmail || lead.personalEmail;
    if (key) dbLeadsMap.set(key.toLowerCase(), lead);
  });
  
  dbData.prospects.forEach(prospect => {
    const key = prospect.email || prospect.workEmail || prospect.personalEmail;
    if (key) dbProspectsMap.set(key.toLowerCase(), prospect);
  });
  
  dbData.people.forEach(person => {
    const key = person.email || person.workEmail || person.personalEmail;
    if (key) dbPeopleMap.set(key.toLowerCase(), person);
  });

  // Analyze CSV contacts
  let csvInLeads = 0;
  let csvInProspects = 0;
  let csvInPeople = 0;
  let csvMissing = 0;
  let csvHasEngagement = 0;
  let csvNoEngagement = 0;

  const missingContacts = [];
  const engagementAnalysis = [];

  for (const csvContact of csvData) {
    const email = csvContact.email.toLowerCase();
    const inLeads = dbLeadsMap.has(email);
    const inProspects = dbProspectsMap.has(email);
    const inPeople = dbPeopleMap.has(email);
    
    if (inLeads) csvInLeads++;
    if (inProspects) csvInProspects++;
    if (inPeople) csvInPeople++;
    if (!inLeads && !inProspects && !inPeople) {
      csvMissing++;
      missingContacts.push(csvContact);
    }

    // Check for engagement indicators
    const hasLastActivity = csvContact.lastActivityTime && csvContact.lastActivityTime.trim() !== '';
    const hasLastAction = csvContact.lastAction && csvContact.lastAction.trim() !== '';
    const hasNextAction = csvContact.nextAction && csvContact.nextAction.trim() !== '';
    const hasLinkedIn = csvContact.linkedinUrl && csvContact.linkedinUrl.trim() !== '';
    
    const hasEngagement = hasLastActivity || hasLastAction || hasNextAction || hasLinkedIn;
    
    if (hasEngagement) {
      csvHasEngagement++;
    } else {
      csvNoEngagement++;
    }

    engagementAnalysis.push({
      name: csvContact.fullName,
      email: csvContact.email,
      hasEngagement,
      lastActivity: csvContact.lastActivityTime,
      lastAction: csvContact.lastAction,
      nextAction: csvContact.nextAction,
      linkedin: csvContact.linkedinUrl,
      inLeads,
      inProspects,
      inPeople
    });
  }

  console.log('📊 CSV CONTACT ANALYSIS:');
  console.log(`   Total CSV Contacts: ${csvData.length.toLocaleString()}`);
  console.log(`   Found in Leads: ${csvInLeads.toLocaleString()}`);
  console.log(`   Found in Prospects: ${csvInProspects.toLocaleString()}`);
  console.log(`   Found in People: ${csvInPeople.toLocaleString()}`);
  console.log(`   Missing from Database: ${csvMissing.toLocaleString()}`);
  console.log('');
  
  console.log('🎯 ENGAGEMENT ANALYSIS:');
  console.log(`   CSV Contacts with Engagement: ${csvHasEngagement.toLocaleString()}`);
  console.log(`   CSV Contacts without Engagement: ${csvNoEngagement.toLocaleString()}`);
  console.log(`   Engagement Rate: ${((csvHasEngagement / csvData.length) * 100).toFixed(1)}%`);
  console.log('');

  // Show sample missing contacts
  if (missingContacts.length > 0) {
    console.log('❌ SAMPLE MISSING CONTACTS (first 10):');
    missingContacts.slice(0, 10).forEach((contact, i) => {
      console.log(`   ${i + 1}. ${contact.fullName} (${contact.email}) - ${contact.title || 'No Title'}`);
    });
    console.log('');
  }

  // Show engagement classification recommendations
  const shouldBeLeads = engagementAnalysis.filter(c => c.hasEngagement && !c.inLeads);
  const shouldBeProspects = engagementAnalysis.filter(c => !c.hasEngagement && !c.inProspects);

  console.log('🎯 CLASSIFICATION RECOMMENDATIONS:');
  console.log(`   Should be Leads (have engagement): ${shouldBeLeads.length.toLocaleString()}`);
  console.log(`   Should be Prospects (no engagement): ${shouldBeProspects.length.toLocaleString()}`);
  console.log('');

  if (shouldBeLeads.length > 0) {
    console.log('📈 SAMPLE CONTACTS THAT SHOULD BE LEADS:');
    shouldBeLeads.slice(0, 5).forEach((contact, i) => {
      console.log(`   ${i + 1}. ${contact.name} (${contact.email})`);
      console.log(`      - Last Activity: ${contact.lastActivity || 'None'}`);
      console.log(`      - Last Action: ${contact.lastAction || 'None'}`);
      console.log(`      - LinkedIn: ${contact.linkedin ? 'Yes' : 'No'}`);
    });
    console.log('');
  }

  if (shouldBeProspects.length > 0) {
    console.log('📋 SAMPLE CONTACTS THAT SHOULD BE PROSPECTS:');
    shouldBeProspects.slice(0, 5).forEach((contact, i) => {
      console.log(`   ${i + 1}. ${contact.name} (${contact.email})`);
    });
    console.log('');
  }
}

async function generateRecommendations(csvData, dbData) {
  console.log('💡 PHASE 4: GENERATING RECOMMENDATIONS');
  console.log('-'.repeat(50));
  
  const totalCsvContacts = csvData.length;
  const currentLeads = dbData.leads.length;
  const currentProspects = dbData.prospects.length;
  const currentTotal = currentLeads + currentProspects;
  
  console.log('📊 CURRENT STATE:');
  console.log(`   CSV Contacts: ${totalCsvContacts.toLocaleString()}`);
  console.log(`   Database Leads: ${currentLeads.toLocaleString()}`);
  console.log(`   Database Prospects: ${currentProspects.toLocaleString()}`);
  console.log(`   Database Total: ${currentTotal.toLocaleString()}`);
  console.log(`   Missing: ${(totalCsvContacts - currentTotal).toLocaleString()}`);
  console.log('');
  
  // Calculate expected distribution based on engagement
  let expectedLeads = 0;
  let expectedProspects = 0;
  
  for (const contact of csvData) {
    const hasEngagement = contact.lastActivityTime || contact.lastAction || contact.nextAction || contact.linkedinUrl;
    if (hasEngagement) {
      expectedLeads++;
    } else {
      expectedProspects++;
    }
  }
  
  console.log('🎯 EXPECTED DISTRIBUTION:');
  console.log(`   Expected Leads: ${expectedLeads.toLocaleString()} (${((expectedLeads / totalCsvContacts) * 100).toFixed(1)}%)`);
  console.log(`   Expected Prospects: ${expectedProspects.toLocaleString()} (${((expectedProspects / totalCsvContacts) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('🔧 RECOMMENDED ACTIONS:');
  console.log('   1. Import missing contacts from CSV');
  console.log('   2. Classify based on engagement history:');
  console.log(`      - Leads: ${expectedLeads.toLocaleString()} contacts with engagement`);
  console.log(`      - Prospects: ${expectedProspects.toLocaleString()} contacts without engagement`);
  console.log('   3. Update existing records to match CSV data');
  console.log('   4. Ensure proper action linking for engagement tracking');
  console.log('');
  
  const dataQualityScore = ((currentTotal / totalCsvContacts) * 100).toFixed(1);
  console.log('📈 DATA QUALITY ASSESSMENT:');
  console.log(`   Coverage: ${dataQualityScore}% (${currentTotal}/${totalCsvContacts})`);
  
  if (parseFloat(dataQualityScore) >= 95) {
    console.log('   ✅ EXCELLENT - Database is well-populated');
  } else if (parseFloat(dataQualityScore) >= 80) {
    console.log('   ✅ GOOD - Minor gaps to fill');
  } else {
    console.log('   ⚠️  NEEDS ATTENTION - Significant data gaps');
  }
}

// Run the audit
auditCsvVsDatabase().catch(console.error);

