#!/usr/bin/env node

/**
 * TOP Data Audit Script
 * 
 * This script audits all companies, people, leads, and prospects in the TOP system
 * against the provided data files:
 * - _data/Exported Capsule Contacts 2025-08-29.xlsx
 * - _data/Physical Mailer Campaign 2025-08-29.xlsx  
 * - _data/UTC All Regions 2023.xlsx
 * 
 * The script will:
 * 1. Load and parse the CSV data files
 * 2. Query the database for existing records
 * 3. Compare and identify matches, mismatches, and missing data
 * 4. Generate a comprehensive audit report
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');

// Initialize Prisma client
const prisma = new PrismaClient();

// Data file paths
const DATA_DIR = path.join(__dirname, '..', '_data');
const CAPSULE_CONTACTS_FILE = path.join(DATA_DIR, 'Exported Capsule Contacts 2025-08-29.xlsx');
const PHYSICAL_MAILER_FILE = path.join(DATA_DIR, 'Physical Mailer Campaign 2025-08-29.xlsx');
const UTC_REGIONS_FILE = path.join(DATA_DIR, 'UTC All Regions 2023.xlsx');

// CSV versions (if available)
const CAPSULE_CONTACTS_CSV = path.join(__dirname, '..', 'data', 'Physical Mailer Campaign 2025-08-29.xlsx - contacts.csv');
const UTC_REGIONS_CSV = path.join(__dirname, '..', 'data', 'UTC All Regions 2023.xlsx - Sheet1.csv');

// Workspace ID for TOP (Dan's workspace)
const TOP_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

// Audit results storage
const auditResults = {
  summary: {
    totalCompanies: 0,
    totalPeople: 0,
    totalLeads: 0,
    totalProspects: 0,
    matchedCompanies: 0,
    matchedPeople: 0,
    matchedLeads: 0,
    matchedProspects: 0,
    missingCompanies: 0,
    missingPeople: 0,
    missingLeads: 0,
    missingProspects: 0,
    dataQualityIssues: 0
  },
  companies: {
    matched: [],
    missing: [],
    qualityIssues: []
  },
  people: {
    matched: [],
    missing: [],
    qualityIssues: []
  },
  leads: {
    matched: [],
    missing: [],
    qualityIssues: []
  },
  prospects: {
    matched: [],
    missing: [],
    qualityIssues: []
  },
  recommendations: []
};

/**
 * Parse CSV file and return array of records
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  CSV file not found: ${filePath}`);
      resolve([]);
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`✅ Parsed ${results.length} records from ${path.basename(filePath)}`);
        resolve(results);
      })
      .on('error', reject);
  });
}

/**
 * Normalize company name for comparison
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize person name for comparison
 */
function normalizePersonName(firstName, lastName) {
  const first = (firstName || '').toLowerCase().trim();
  const last = (lastName || '').toLowerCase().trim();
  return `${first} ${last}`.trim();
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email) {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Load and process UTC Regions data
 */
async function loadUTCRegionsData() {
  console.log('\n📊 Loading UTC Regions data...');
  const utcData = await parseCSV(UTC_REGIONS_CSV);
  
  const processedData = {
    companies: new Map(),
    people: new Map()
  };
  
  utcData.forEach((record, index) => {
    if (!record.Company || !record['First Name'] || !record['Last Name']) {
      return; // Skip incomplete records
    }
    
    const companyName = normalizeCompanyName(record.Company);
    const personName = normalizePersonName(record['First Name'], record['Last Name']);
    const email = normalizeEmail(record.Email);
    
    // Store company
    if (!processedData.companies.has(companyName)) {
      processedData.companies.set(companyName, {
        name: record.Company,
        normalizedName: companyName,
        industry: 'Utilities',
        region: record['Region '] || 'Unknown',
        people: []
      });
    }
    
    // Store person
    const personKey = `${personName}_${email}`;
    if (!processedData.people.has(personKey)) {
      const person = {
        firstName: record['First Name'],
        lastName: record['Last Name'],
        fullName: `${record['First Name']} ${record['Last Name']}`,
        normalizedName: personName,
        email: email,
        title: record.Title || '',
        company: record.Company,
        normalizedCompanyName: companyName,
        address: record.Address || '',
        city: record.City || '',
        state: record.State || '',
        zipCode: record['Zip Code'] || '',
        phone: record['Work Phone'] || '',
        fax: record['Fax Number'] || '',
        region: record['Region '] || 'Unknown',
        notes: record.Notes || '',
        source: 'UTC Regions 2023'
      };
      
      processedData.people.set(personKey, person);
      processedData.companies.get(companyName).people.push(person);
    }
  });
  
  console.log(`✅ Processed ${processedData.companies.size} companies and ${processedData.people.size} people from UTC Regions`);
  return processedData;
}

/**
 * Load and process Physical Mailer Campaign data
 */
async function loadPhysicalMailerData() {
  console.log('\n📊 Loading Physical Mailer Campaign data...');
  const mailerData = await parseCSV(CAPSULE_CONTACTS_CSV);
  
  const processedData = {
    companies: new Map(),
    people: new Map()
  };
  
  mailerData.forEach((record, index) => {
    if (!record.Organization && !record.Company) {
      return; // Skip records without company info
    }
    
    const companyName = normalizeCompanyName(record.Organization || record.Company);
    const personName = normalizePersonName(record['First Name'], record['Last Name']);
    const email = normalizeEmail(record.Email || record['Email Address']);
    
    // Store company
    if (!processedData.companies.has(companyName)) {
      processedData.companies.set(companyName, {
        name: record.Organization || record.Company,
        normalizedName: companyName,
        industry: 'Utilities',
        people: []
      });
    }
    
    // Store person
    const personKey = `${personName}_${email}`;
    if (!processedData.people.has(personKey)) {
      const person = {
        firstName: record['First Name'],
        lastName: record['Last Name'],
        fullName: record.Name || `${record['First Name']} ${record['Last Name']}`,
        normalizedName: personName,
        email: email,
        title: record.Title || record['Job Title'] || '',
        company: record.Organization || record.Company,
        normalizedCompanyName: companyName,
        address: record['Address Street'] || '',
        city: record.City || '',
        state: record.State || '',
        zipCode: record.Postcode || '',
        phone: record['Phone Number'] || record['Work Phone'] || '',
        mobilePhone: record['Mobile Phone'] || '',
        region: record.Region || 'Unknown',
        notes: record.Notes || '',
        source: 'Physical Mailer Campaign 2025'
      };
      
      processedData.people.set(personKey, person);
      processedData.companies.get(companyName).people.push(person);
    }
  });
  
  console.log(`✅ Processed ${processedData.companies.size} companies and ${processedData.people.size} people from Physical Mailer Campaign`);
  return processedData;
}

/**
 * Load existing data from TOP database
 */
async function loadTOPData() {
  console.log('\n📊 Loading TOP database data...');
  
  try {
    // Load companies
    const companies = await prisma.companies.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
      include: {
        people: true
      }
    });
    
    // Load people
    const people = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
      include: {
        company: true
      }
    });
    
    // Load leads
    const leads = await prisma.leads.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });
    
    // Load prospects
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });
    
    console.log(`✅ Loaded ${companies.length} companies, ${people.length} people, ${leads.length} leads, ${prospects.length} prospects from TOP database`);
    
    return {
      companies,
      people,
      leads,
      prospects
    };
  } catch (error) {
    console.error('❌ Error loading TOP database data:', error);
    throw error;
  }
}

/**
 * Compare companies between data files and database
 */
async function auditCompanies(fileData, dbData) {
  console.log('\n🔍 Auditing companies...');
  
  const dbCompanies = new Map();
  dbData.companies.forEach(company => {
    const normalizedName = normalizeCompanyName(company.name);
    dbCompanies.set(normalizedName, company);
  });
  
  // Check companies from data files
  for (const [normalizedName, fileCompany] of fileData.companies) {
    if (dbCompanies.has(normalizedName)) {
      // Company exists in database
      const dbCompany = dbCompanies.get(normalizedName);
      auditResults.companies.matched.push({
        fileCompany: fileCompany.name,
        dbCompany: dbCompany.name,
        dbId: dbCompany.id,
        matchType: 'exact',
        peopleCount: fileCompany.people.length,
        dbPeopleCount: dbCompany.people.length
      });
      auditResults.summary.matchedCompanies++;
    } else {
      // Company missing from database
      auditResults.companies.missing.push({
        name: fileCompany.name,
        normalizedName: normalizedName,
        peopleCount: fileCompany.people.length,
        source: fileCompany.people[0]?.source || 'Unknown'
      });
      auditResults.summary.missingCompanies++;
    }
  }
  
  // Check for companies in database but not in files
  const fileCompanyNames = new Set(fileData.companies.keys());
  for (const [normalizedName, dbCompany] of dbCompanies) {
    if (!fileCompanyNames.has(normalizedName)) {
      auditResults.companies.qualityIssues.push({
        name: dbCompany.name,
        normalizedName: normalizedName,
        issue: 'Company exists in database but not in data files',
        dbId: dbCompany.id
      });
      auditResults.summary.dataQualityIssues++;
    }
  }
  
  auditResults.summary.totalCompanies = fileData.companies.size;
  console.log(`✅ Company audit complete: ${auditResults.summary.matchedCompanies} matched, ${auditResults.summary.missingCompanies} missing`);
}

/**
 * Compare people between data files and database
 */
async function auditPeople(fileData, dbData) {
  console.log('\n🔍 Auditing people...');
  
  const dbPeople = new Map();
  dbData.people.forEach(person => {
    const normalizedName = normalizePersonName(person.firstName, person.lastName);
    const email = normalizeEmail(person.email);
    const key = `${normalizedName}_${email}`;
    dbPeople.set(key, person);
  });
  
  // Check people from data files
  for (const [key, filePerson] of fileData.people) {
    if (dbPeople.has(key)) {
      // Person exists in database
      const dbPerson = dbPeople.get(key);
      auditResults.people.matched.push({
        filePerson: filePerson.fullName,
        dbPerson: dbPerson.fullName,
        dbId: dbPerson.id,
        email: filePerson.email,
        company: filePerson.company,
        matchType: 'exact'
      });
      auditResults.summary.matchedPeople++;
    } else {
      // Person missing from database
      auditResults.people.missing.push({
        name: filePerson.fullName,
        email: filePerson.email,
        company: filePerson.company,
        title: filePerson.title,
        source: filePerson.source
      });
      auditResults.summary.missingPeople++;
    }
  }
  
  // Check for people in database but not in files
  const filePersonKeys = new Set(fileData.people.keys());
  for (const [key, dbPerson] of dbPeople) {
    if (!filePersonKeys.has(key)) {
      auditResults.people.qualityIssues.push({
        name: dbPerson.fullName,
        email: dbPerson.email,
        company: dbPerson.company?.name || 'Unknown',
        issue: 'Person exists in database but not in data files',
        dbId: dbPerson.id
      });
      auditResults.summary.dataQualityIssues++;
    }
  }
  
  auditResults.summary.totalPeople = fileData.people.size;
  console.log(`✅ People audit complete: ${auditResults.summary.matchedPeople} matched, ${auditResults.summary.missingPeople} missing`);
}

/**
 * Compare leads and prospects
 */
async function auditLeadsAndProspects(fileData, dbData) {
  console.log('\n🔍 Auditing leads and prospects...');
  
  // Create lookup maps for database records
  const dbLeads = new Map();
  const dbProspects = new Map();
  
  dbData.leads.forEach(lead => {
    const normalizedName = normalizePersonName(lead.firstName, lead.lastName);
    const email = normalizeEmail(lead.email);
    const key = `${normalizedName}_${email}`;
    dbLeads.set(key, lead);
  });
  
  dbData.prospects.forEach(prospect => {
    const normalizedName = normalizePersonName(prospect.firstName, prospect.lastName);
    const email = normalizeEmail(prospect.email);
    const key = `${normalizedName}_${email}`;
    dbProspects.set(key, prospect);
  });
  
  // Check people from files against leads and prospects
  for (const [key, filePerson] of fileData.people) {
    const isLead = dbLeads.has(key);
    const isProspect = dbProspects.has(key);
    
    if (isLead) {
      const dbLead = dbLeads.get(key);
      auditResults.leads.matched.push({
        name: filePerson.fullName,
        email: filePerson.email,
        company: filePerson.company,
        dbId: dbLead.id,
        status: dbLead.status,
        source: filePerson.source
      });
      auditResults.summary.matchedLeads++;
    } else if (isProspect) {
      const dbProspect = dbProspects.get(key);
      auditResults.prospects.matched.push({
        name: filePerson.fullName,
        email: filePerson.email,
        company: filePerson.company,
        dbId: dbProspect.id,
        status: dbProspect.status,
        source: filePerson.source
      });
      auditResults.summary.matchedProspects++;
    } else {
      // Person exists in files but not as lead or prospect
      auditResults.leads.missing.push({
        name: filePerson.fullName,
        email: filePerson.email,
        company: filePerson.company,
        title: filePerson.title,
        source: filePerson.source,
        potentialType: 'lead_or_prospect'
      });
      auditResults.summary.missingLeads++;
    }
  }
  
  auditResults.summary.totalLeads = dbData.leads.length;
  auditResults.summary.totalProspects = dbData.prospects.length;
  console.log(`✅ Leads/Prospects audit complete: ${auditResults.summary.matchedLeads} leads matched, ${auditResults.summary.matchedProspects} prospects matched`);
}

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations() {
  console.log('\n💡 Generating recommendations...');
  
  const recommendations = [];
  
  // Company recommendations
  if (auditResults.summary.missingCompanies > 0) {
    recommendations.push({
      category: 'Companies',
      priority: 'High',
      issue: `${auditResults.summary.missingCompanies} companies from data files are missing from TOP database`,
      recommendation: 'Import missing companies to ensure complete data coverage',
      affectedRecords: auditResults.companies.missing.length
    });
  }
  
  // People recommendations
  if (auditResults.summary.missingPeople > 0) {
    recommendations.push({
      category: 'People',
      priority: 'High',
      issue: `${auditResults.summary.missingPeople} people from data files are missing from TOP database`,
      recommendation: 'Import missing people and associate them with their companies',
      affectedRecords: auditResults.people.missing.length
    });
  }
  
  // Lead/Prospect recommendations
  if (auditResults.summary.missingLeads > 0) {
    recommendations.push({
      category: 'Leads/Prospects',
      priority: 'Medium',
      issue: `${auditResults.summary.missingLeads} people from data files could be converted to leads or prospects`,
      recommendation: 'Review missing people and convert qualified contacts to leads/prospects',
      affectedRecords: auditResults.leads.missing.length
    });
  }
  
  // Data quality recommendations
  if (auditResults.summary.dataQualityIssues > 0) {
    recommendations.push({
      category: 'Data Quality',
      priority: 'Medium',
      issue: `${auditResults.summary.dataQualityIssues} data quality issues found`,
      recommendation: 'Review and clean up data inconsistencies',
      affectedRecords: auditResults.summary.dataQualityIssues
    });
  }
  
  auditResults.recommendations = recommendations;
  console.log(`✅ Generated ${recommendations.length} recommendations`);
}

/**
 * Generate comprehensive audit report
 */
function generateAuditReport() {
  const timestamp = new Date().toISOString();
  const report = {
    auditInfo: {
      timestamp: timestamp,
      workspaceId: TOP_WORKSPACE_ID,
      dataFiles: [
        'UTC All Regions 2023.xlsx',
        'Physical Mailer Campaign 2025-08-29.xlsx',
        'Exported Capsule Contacts 2025-08-29.xlsx'
      ]
    },
    summary: auditResults.summary,
    detailedResults: {
      companies: auditResults.companies,
      people: auditResults.people,
      leads: auditResults.leads,
      prospects: auditResults.prospects
    },
    recommendations: auditResults.recommendations
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', '_data', `TOP_AUDIT_REPORT_${timestamp.split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 Audit report saved to: ${reportPath}`);
  
  // Print summary to console
  console.log('\n' + '='.repeat(80));
  console.log('📊 TOP DATA AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`📅 Audit Date: ${timestamp}`);
  console.log(`🏢 Workspace: TOP (${TOP_WORKSPACE_ID})`);
  console.log('');
  console.log('📈 DATA COVERAGE:');
  console.log(`   Companies: ${auditResults.summary.matchedCompanies}/${auditResults.summary.totalCompanies} matched (${Math.round(auditResults.summary.matchedCompanies/auditResults.summary.totalCompanies*100)}%)`);
  console.log(`   People: ${auditResults.summary.matchedPeople}/${auditResults.summary.totalPeople} matched (${Math.round(auditResults.summary.matchedPeople/auditResults.summary.totalPeople*100)}%)`);
  console.log(`   Leads: ${auditResults.summary.matchedLeads} matched`);
  console.log(`   Prospects: ${auditResults.summary.matchedProspects} matched`);
  console.log('');
  console.log('❌ MISSING DATA:');
  console.log(`   Companies: ${auditResults.summary.missingCompanies} missing`);
  console.log(`   People: ${auditResults.summary.missingPeople} missing`);
  console.log(`   Potential Leads: ${auditResults.summary.missingLeads} missing`);
  console.log('');
  console.log('⚠️  DATA QUALITY ISSUES:');
  console.log(`   Issues Found: ${auditResults.summary.dataQualityIssues}`);
  console.log('');
  console.log('💡 RECOMMENDATIONS:');
  auditResults.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.recommendation}`);
  });
  console.log('='.repeat(80));
  
  return report;
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🚀 Starting TOP Data Audit...');
  console.log('='.repeat(80));
  
  try {
    // Load data from files
    const utcData = await loadUTCRegionsData();
    const mailerData = await loadPhysicalMailerData();
    
    // Combine data from all sources
    const combinedFileData = {
      companies: new Map([...utcData.companies, ...mailerData.companies]),
      people: new Map([...utcData.people, ...mailerData.people])
    };
    
    // Load data from database
    const dbData = await loadTOPData();
    
    // Run audits
    await auditCompanies(combinedFileData, dbData);
    await auditPeople(combinedFileData, dbData);
    await auditLeadsAndProspects(combinedFileData, dbData);
    
    // Generate recommendations and report
    generateRecommendations();
    const report = generateAuditReport();
    
    console.log('\n✅ Audit completed successfully!');
    return report;
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  runAudit()
    .then(() => {
      console.log('\n🎉 TOP Data Audit completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runAudit };
