#!/usr/bin/env node

/**
 * Hierarchical Migration Script
 * Creates Person/Company master records and links business entities to them
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🚀 Starting hierarchical migration...');

// Function to generate unique ID
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to safely get value
function safeValue(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

async function createPersonMasterRecords() {
  console.log('👥 Creating Person master records...');
  
  const workspaces = await prisma.workspaces.findMany();
  let totalPersonsCreated = 0;
  
  for (const workspace of workspaces) {
    console.log(`  Processing workspace: ${workspace.id}`);
    
    const personMap = new Map();
    
    // Get all unique persons from contacts, leads, prospects
    const allPersons = [];
    
    // From contacts
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: workspace.id }
    });
    contacts.forEach(contact => {
      const key = contact.email || `${contact.firstName}-${contact.lastName}`;
      allPersons.push({
        key,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: contact.fullName,
        phone: contact.phone,
        mobile: contact.mobilePhone,
        jobTitle: contact.jobTitle,
        department: contact.department,
        company: contact.company,
        linkedinUrl: contact.linkedinUrl,
        location: contact.location,
        timezone: contact.timezone,
        bio: contact.bio,
        notes: contact.notes,
        tags: contact.tags,
        source: 'contact'
      });
    });
    
    // From leads
    const leads = await prisma.leads.findMany({
      where: { workspaceId: workspace.id }
    });
    leads.forEach(lead => {
      const key = lead.email || `${lead.firstName}-${lead.lastName}`;
      allPersons.push({
        key,
        email: lead.email,
        firstName: lead.firstName,
        lastName: lead.lastName,
        fullName: lead.fullName,
        phone: lead.phone,
        mobile: lead.mobilePhone,
        jobTitle: lead.jobTitle,
        department: lead.department,
        company: lead.company,
        linkedinUrl: lead.linkedinUrl,
        location: lead.location,
        timezone: lead.timezone,
        notes: lead.notes,
        tags: lead.tags,
        source: 'lead'
      });
    });
    
    // From prospects
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: workspace.id }
    });
    prospects.forEach(prospect => {
      const key = prospect.email || `${prospect.firstName}-${prospect.lastName}`;
      allPersons.push({
        key,
        email: prospect.email,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        fullName: prospect.fullName,
        phone: prospect.phone,
        mobile: prospect.mobilePhone,
        jobTitle: prospect.jobTitle,
        department: prospect.department,
        company: prospect.company,
        linkedinUrl: prospect.linkedinUrl,
        location: prospect.location,
        timezone: prospect.timezone,
        notes: prospect.notes,
        tags: prospect.tags,
        source: 'prospect'
      });
    });
    
    // Create unique Person records
    for (const personData of allPersons) {
      if (!personMap.has(personData.key)) {
        const personId = generateId('person');
        
        await prisma.person.create({
          data: {
            id: personId,
            workspaceId: workspace.id,
            name: personData.fullName,
            firstName: personData.firstName,
            lastName: personData.lastName,
            fullName: personData.fullName,
            email: personData.email,
            phone: personData.phone,
            mobile: personData.mobile,
            jobTitle: personData.jobTitle,
            department: personData.department,
            company: personData.company,
            linkedinUrl: personData.linkedinUrl,
            location: personData.location,
            timezone: personData.timezone,
            bio: personData.bio,
            notes: personData.notes,
            tags: personData.tags || [],
            dataSource: personData.source,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        personMap.set(personData.key, personId);
        totalPersonsCreated++;
      }
    }
    
    console.log(`  ✅ Created ${personMap.size} Person records for workspace ${workspace.id}`);
  }
  
  console.log(`✅ Total Person records created: ${totalPersonsCreated}`);
  return totalPersonsCreated;
}

async function createCompanyMasterRecords() {
  console.log('🏢 Creating Company master records...');
  
  const workspaces = await prisma.workspaces.findMany();
  let totalCompaniesCreated = 0;
  
  for (const workspace of workspaces) {
    console.log(`  Processing workspace: ${workspace.id}`);
    
    const companyMap = new Map();
    
    // Get all unique companies from accounts
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const account of accounts) {
      const key = account.name;
      if (!companyMap.has(key)) {
        const companyId = generateId('comp');
        
        await prisma.company.create({
          data: {
            id: companyId,
            workspaceId: workspace.id,
            name: account.name,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        companyMap.set(key, companyId);
        totalCompaniesCreated++;
      }
    }
    
    console.log(`  ✅ Created ${companyMap.size} Company records for workspace ${workspace.id}`);
  }
  
  console.log(`✅ Total Company records created: ${totalCompaniesCreated}`);
  return totalCompaniesCreated;
}

async function linkBusinessEntitiesToMasters() {
  console.log('🔗 Linking business entities to master records...');
  
  const workspaces = await prisma.workspaces.findMany();
  let totalLinksCreated = 0;
  
  for (const workspace of workspaces) {
    console.log(`  Processing workspace: ${workspace.id}`);
    
    // Link contacts to Person
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const contact of contacts) {
      const person = await prisma.person.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [
            { email: contact.email },
            { 
              AND: [
                { firstName: contact.firstName },
                { lastName: contact.lastName }
              ]
            }
          ]
        }
      });
      
      if (person) {
        await prisma.contacts.update({
          where: { id: contact.id },
          data: { personId: person.id }
        });
        totalLinksCreated++;
      }
    }
    
    // Link leads to Person
    const leads = await prisma.leads.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const lead of leads) {
      const person = await prisma.person.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [
            { email: lead.email },
            { 
              AND: [
                { firstName: lead.firstName },
                { lastName: lead.lastName }
              ]
            }
          ]
        }
      });
      
      if (person) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { personId: person.id }
        });
        totalLinksCreated++;
      }
    }
    
    // Link prospects to Person
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const prospect of prospects) {
      const person = await prisma.person.findFirst({
        where: {
          workspaceId: workspace.id,
          OR: [
            { email: prospect.email },
            { 
              AND: [
                { firstName: prospect.firstName },
                { lastName: prospect.lastName }
              ]
            }
          ]
        }
      });
      
      if (person) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { personId: person.id }
        });
        totalLinksCreated++;
      }
    }
    
    // Link accounts to Company
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const account of accounts) {
      const company = await prisma.company.findFirst({
        where: {
          workspaceId: workspace.id,
          name: account.name
        }
      });
      
      if (company) {
        await prisma.accounts.update({
          where: { id: account.id },
          data: { companyId: company.id }
        });
        totalLinksCreated++;
      }
    }
    
    console.log(`  ✅ Created links for workspace ${workspace.id}`);
  }
  
  console.log(`✅ Total links created: ${totalLinksCreated}`);
  return totalLinksCreated;
}

async function runHierarchicalMigration() {
  try {
    console.log('🚀 Starting hierarchical migration...');
    
    // Step 1: Create Person master records
    const personsCreated = await createPersonMasterRecords();
    
    // Step 2: Create Company master records
    const companiesCreated = await createCompanyMasterRecords();
    
    // Step 3: Link business entities to masters
    const linksCreated = await linkBusinessEntitiesToMasters();
    
    console.log('✅ Hierarchical migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Person records created: ${personsCreated}`);
    console.log(`   - Company records created: ${companiesCreated}`);
    console.log(`   - Business entity links created: ${linksCreated}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runHierarchicalMigration().catch(console.error);
