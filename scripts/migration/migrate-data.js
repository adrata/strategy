#!/usr/bin/env node

/**
 * Data Migration Script
 * Migrates data from old tables to new unified tables
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

console.log('🚀 Starting data migration to unified tables...');

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

// Function to safely get array value
function safeArray(value) {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value;
}

async function migrateCompanies() {
  console.log('📊 Migrating Companies...');
  
  const workspaces = await prisma.workspaces.findMany();
  let totalCompanies = 0;
  
  for (const workspace of workspaces) {
    console.log(`  Processing workspace: ${workspace.id}`);
    
    const companyMap = new Map();
    
    // Migrate from accounts table
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const account of accounts) {
      const key = `${account.name}-${workspace.id}`;
      if (!companyMap.has(key)) {
        const companyId = generateId('comp');
        
        await prisma.$executeRaw`
          INSERT INTO "CompanyUnified" (
            id, workspaceId, name, website, industry, size, email, phone,
            address, city, state, country, postalCode, entityType, status, tier,
            revenue, contractValue, currency, lastContactDate, nextFollowUpDate,
            engagementLevel, buyingSignals, painPoints, interests, description,
            notes, tags, customFields, assignedUserId, createdAt, updatedAt, deletedAt
          ) VALUES (
            ${companyId}, ${workspace.id}, ${account.name}, ${account.website},
            ${account.industry}, ${account.size}, ${account.email}, ${account.phone},
            ${account.address}, ${account.city}, ${account.state}, ${account.country},
            ${account.postalCode}, 'account', ${account.status}, ${account.tier},
            ${account.revenue}, ${account.contractValue}, ${account.currency || 'USD'},
            ${account.lastContactDate}, ${account.nextFollowUpDate},
            ${account.engagementLevel}, ${JSON.stringify(safeArray(account.buyingSignals))},
            ${JSON.stringify(safeArray(account.painPoints))}, ${JSON.stringify(safeArray(account.interests))},
            ${account.description}, ${account.notes}, ${JSON.stringify(safeArray(account.tags))},
            ${account.customFields ? JSON.stringify(account.customFields) : null},
            ${account.assignedUserId}, ${account.createdAt}, ${account.updatedAt}, ${account.deletedAt}
          )
        `;
        
        companyMap.set(key, companyId);
        totalCompanies++;
      }
    }
    
    // Migrate from clients table
    const clients = await prisma.clients.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const client of clients) {
      const key = `${client.name || 'Client'}-${workspace.id}`;
      if (!companyMap.has(key)) {
        const companyId = generateId('comp');
        
        await prisma.$executeRaw`
          INSERT INTO "CompanyUnified" (
            id, workspaceId, name, website, industry, size, email, phone,
            address, city, state, country, postalCode, entityType, status, tier,
            revenue, contractValue, currency, lastContactDate, nextFollowUpDate,
            engagementLevel, buyingSignals, painPoints, interests, description,
            notes, tags, customFields, assignedUserId, createdAt, updatedAt, deletedAt
          ) VALUES (
            ${companyId}, ${workspace.id}, ${client.name || 'Client'}, ${client.website},
            ${client.industry}, ${client.size}, ${client.email}, ${client.phone},
            ${client.address}, ${client.city}, ${client.state}, ${client.country},
            ${client.postalCode}, 'client', ${client.customerStatus}, ${client.tier},
            ${client.totalLifetimeValue}, ${client.lastDealValue}, 'USD',
            ${client.lastEngagementDate}, ${client.nextBestActionDate},
            ${client.engagementLevel}, ${JSON.stringify(safeArray(client.buyingSignals))},
            ${JSON.stringify(safeArray(client.painPoints))}, ${JSON.stringify(safeArray(client.interests))},
            ${client.description}, ${client.notes}, ${JSON.stringify(safeArray(client.tags))},
            ${client.customFields ? JSON.stringify(client.customFields) : null},
            ${client.assignedUserId}, ${client.createdAt}, ${client.updatedAt}, ${client.deletedAt}
          )
        `;
        
        companyMap.set(key, companyId);
        totalCompanies++;
      }
    }
    
    // Migrate unique companies from leads
    const leadCompanies = await prisma.leads.findMany({
      where: { 
        workspaceId: workspace.id,
        company: { not: null }
      },
      select: { company: true },
      distinct: ['company']
    });
    
    for (const leadCompany of leadCompanies) {
      const key = `${leadCompany.company}-${workspace.id}`;
      if (!companyMap.has(key)) {
        const companyId = generateId('comp');
        
        await prisma.$executeRaw`
          INSERT INTO "CompanyUnified" (
            id, workspaceId, name, entityType, status, createdAt, updatedAt
          ) VALUES (
            ${companyId}, ${workspace.id}, ${leadCompany.company}, 'prospect',
            'active', NOW(), NOW()
          )
        `;
        
        companyMap.set(key, companyId);
        totalCompanies++;
      }
    }
    
    console.log(`  ✅ Created ${companyMap.size} companies for workspace ${workspace.id}`);
  }
  
  console.log(`✅ Total companies migrated: ${totalCompanies}`);
  return totalCompanies;
}

async function migratePersons() {
  console.log('👥 Migrating Persons...');
  
  const workspaces = await prisma.workspaces.findMany();
  let totalPersons = 0;
  
  for (const workspace of workspaces) {
    console.log(`  Processing workspace: ${workspace.id}`);
    
    const personMap = new Map();
    
    // Migrate from contacts table
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const contact of contacts) {
      const key = `${contact.email || contact.fullName}-${workspace.id}`;
      if (!personMap.has(key)) {
        const personId = generateId('person');
        
        await prisma.$executeRaw`
          INSERT INTO "PersonUnified" (
            id, workspaceId, firstName, lastName, fullName, email, phone, mobile,
            jobTitle, title, department, seniority, company, entityType, status, priority, source,
            lastContactDate, nextFollowUpDate, engagementLevel, buyingSignals, painPoints, interests,
            accountId, workEmail, personalEmail, secondaryEmail, mobilePhone, workPhone,
            linkedinUrl, twitterHandle, address, city, state, country, postalCode, location, timezone,
            bio, notes, tags, customFields, assignedUserId, createdAt, updatedAt, deletedAt
          ) VALUES (
            ${personId}, ${workspace.id}, ${contact.firstName}, ${contact.lastName},
            ${contact.fullName}, ${contact.email}, ${contact.phone}, ${contact.mobilePhone},
            ${contact.jobTitle}, ${contact.jobTitle}, ${contact.department}, ${contact.seniority},
            ${contact.company}, 'contact', ${contact.status}, ${contact.priority}, ${contact.source},
            ${contact.lastContactDate}, ${contact.nextFollowUpDate}, ${contact.engagementLevel},
            ${JSON.stringify(safeArray(contact.buyingSignals))}, ${JSON.stringify(safeArray(contact.painPoints))},
            ${JSON.stringify(safeArray(contact.interests))}, ${contact.accountId}, ${contact.workEmail},
            ${contact.personalEmail}, ${contact.secondaryEmail}, ${contact.mobilePhone}, ${contact.workPhone},
            ${contact.linkedinUrl}, ${contact.twitterHandle}, ${contact.address}, ${contact.city},
            ${contact.state}, ${contact.country}, ${contact.postalCode}, ${contact.location}, ${contact.timezone},
            ${contact.bio}, ${contact.notes}, ${JSON.stringify(safeArray(contact.tags))},
            ${contact.customFields ? JSON.stringify(contact.customFields) : null},
            ${contact.assignedUserId}, ${contact.createdAt}, ${contact.updatedAt}, ${contact.deletedAt}
          )
        `;
        
        personMap.set(key, personId);
        totalPersons++;
      }
    }
    
    // Migrate from leads table
    const leads = await prisma.leads.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const lead of leads) {
      const key = `${lead.email || lead.fullName}-${workspace.id}`;
      if (!personMap.has(key)) {
        const personId = generateId('person');
        
        await prisma.$executeRaw`
          INSERT INTO "PersonUnified" (
            id, workspaceId, firstName, lastName, fullName, email, phone, mobile,
            jobTitle, title, department, company, entityType, status, priority, source,
            currentStage, relationship, buyerGroupRole, estimatedValue, currency,
            lastContactDate, nextFollowUpDate, lastActionDate, nextActionDate, nextAction,
            engagementLevel, buyingSignals, painPoints, interests, budget, authority, needUrgency, timeline,
            marketingQualified, salesQualified, workEmail, personalEmail, mobilePhone, workPhone,
            linkedinUrl, address, city, state, country, postalCode, location, timezone,
            notes, tags, customFields, assignedUserId, createdAt, updatedAt, deletedAt
          ) VALUES (
            ${personId}, ${workspace.id}, ${lead.firstName}, ${lead.lastName},
            ${lead.fullName}, ${lead.email}, ${lead.phone}, ${lead.mobilePhone},
            ${lead.jobTitle}, ${lead.title}, ${lead.department}, ${lead.company},
            'lead', ${lead.status}, ${lead.priority}, ${lead.source},
            ${lead.currentStage}, ${lead.relationship}, ${lead.buyerGroupRole}, ${lead.estimatedValue}, ${lead.currency || 'USD'},
            ${lead.lastContactDate}, ${lead.nextFollowUpDate}, ${lead.lastActionDate}, ${lead.nextActionDate}, ${lead.nextAction},
            ${lead.engagementLevel}, ${JSON.stringify(safeArray(lead.buyingSignals))}, ${JSON.stringify(safeArray(lead.painPoints))},
            ${JSON.stringify(safeArray(lead.interests))}, ${lead.budget}, ${lead.authority}, ${lead.needUrgency}, ${lead.timeline},
            ${lead.marketingQualified}, ${lead.salesQualified}, ${lead.workEmail}, ${lead.personalEmail},
            ${lead.mobilePhone}, ${lead.workPhone}, ${lead.linkedinUrl}, ${lead.address}, ${lead.city},
            ${lead.state}, ${lead.country}, ${lead.postalCode}, ${lead.location}, ${lead.timezone},
            ${lead.notes}, ${JSON.stringify(safeArray(lead.tags))},
            ${lead.customFields ? JSON.stringify(lead.customFields) : null},
            ${lead.assignedUserId}, ${lead.createdAt}, ${lead.updatedAt}, ${lead.deletedAt}
          )
        `;
        
        personMap.set(key, personId);
        totalPersons++;
      }
    }
    
    // Migrate from prospects table
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: workspace.id }
    });
    
    for (const prospect of prospects) {
      const key = `${prospect.email || prospect.fullName}-${workspace.id}`;
      if (!personMap.has(key)) {
        const personId = generateId('person');
        
        await prisma.$executeRaw`
          INSERT INTO "PersonUnified" (
            id, workspaceId, firstName, lastName, fullName, email, phone, mobile,
            jobTitle, title, department, company, entityType, status, priority, source,
            currentStage, relationship, buyerGroupRole, estimatedValue, currency,
            lastContactDate, nextFollowUpDate, lastActionDate, nextActionDate, nextAction,
            engagementLevel, buyingSignals, painPoints, interests, budget, authority, needUrgency, timeline,
            marketingQualified, salesQualified, workEmail, personalEmail, mobilePhone, workPhone,
            linkedinUrl, address, city, state, country, postalCode, location, timezone,
            notes, tags, customFields, assignedUserId, createdAt, updatedAt, deletedAt
          ) VALUES (
            ${personId}, ${workspace.id}, ${prospect.firstName}, ${prospect.lastName},
            ${prospect.fullName}, ${prospect.email}, ${prospect.phone}, ${prospect.mobilePhone},
            ${prospect.jobTitle}, ${prospect.title}, ${prospect.department}, ${prospect.company},
            'prospect', ${prospect.status}, ${prospect.priority}, ${prospect.source},
            ${prospect.currentStage}, ${prospect.relationship}, ${prospect.buyerGroupRole}, ${prospect.estimatedValue}, ${prospect.currency || 'USD'},
            ${prospect.lastContactDate}, ${prospect.nextFollowUpDate}, ${prospect.lastActionDate}, ${prospect.nextActionDate}, ${prospect.nextAction},
            ${prospect.engagementLevel}, ${JSON.stringify(safeArray(prospect.buyingSignals))}, ${JSON.stringify(safeArray(prospect.painPoints))},
            ${JSON.stringify(safeArray(prospect.interests))}, ${prospect.budget}, ${prospect.authority}, ${prospect.needUrgency}, ${prospect.timeline},
            ${prospect.marketingQualified}, ${prospect.salesQualified}, ${prospect.workEmail}, ${prospect.personalEmail},
            ${prospect.mobilePhone}, ${prospect.workPhone}, ${prospect.linkedinUrl}, ${prospect.address}, ${prospect.city},
            ${prospect.state}, ${prospect.country}, ${prospect.postalCode}, ${prospect.location}, ${prospect.timezone},
            ${prospect.notes}, ${JSON.stringify(safeArray(prospect.tags))},
            ${prospect.customFields ? JSON.stringify(prospect.customFields) : null},
            ${prospect.assignedUserId}, ${prospect.createdAt}, ${prospect.updatedAt}, ${prospect.deletedAt}
          )
        `;
        
        personMap.set(key, personId);
        totalPersons++;
      }
    }
    
    console.log(`  ✅ Created ${personMap.size} persons for workspace ${workspace.id}`);
  }
  
  console.log(`✅ Total persons migrated: ${totalPersons}`);
  return totalPersons;
}

async function updateOpportunities() {
  console.log('🎯 Updating Opportunities...');
  
  // Update opportunities to link to new Person and Company tables
  const opportunities = await prisma.opportunities.findMany();
  let updatedOpportunities = 0;
  
  for (const opportunity of opportunities) {
    // Find corresponding person in new table
    let personId = null;
    if (opportunity.leadId) {
      const lead = await prisma.leads.findUnique({ where: { id: opportunity.leadId } });
      if (lead) {
        const person = await prisma.$queryRaw`
          SELECT id FROM "PersonUnified" 
          WHERE "workspaceId" = ${lead.workspaceId} 
          AND "fullName" = ${lead.fullName} 
          AND "email" = ${lead.email}
          LIMIT 1
        `;
        if (person && person.length > 0) {
          personId = person[0].id;
        }
      }
    }
    
    // Find corresponding company in new table
    let companyId = null;
    if (opportunity.accountId) {
      const account = await prisma.accounts.findUnique({ where: { id: opportunity.accountId } });
      if (account) {
        const company = await prisma.$queryRaw`
          SELECT id FROM "CompanyUnified" 
          WHERE "workspaceId" = ${account.workspaceId} 
          AND "name" = ${account.name}
          LIMIT 1
        `;
        if (company && company.length > 0) {
          companyId = company[0].id;
        }
      }
    }
    
    // Update opportunity with new IDs
    if (personId || companyId) {
      await prisma.$executeRaw`
        UPDATE opportunities 
        SET "personId" = ${personId}, "companyId" = ${companyId}
        WHERE id = ${opportunity.id}
      `;
      updatedOpportunities++;
    }
  }
  
  console.log(`✅ Updated ${updatedOpportunities} opportunities`);
  return updatedOpportunities;
}

async function migrateData() {
  try {
    console.log('🚀 Starting complete data migration...');
    
    // Step 1: Migrate Companies
    const companiesMigrated = await migrateCompanies();
    
    // Step 2: Migrate Persons
    const personsMigrated = await migratePersons();
    
    // Step 3: Update Opportunities
    const opportunitiesUpdated = await updateOpportunities();
    
    console.log('✅ Data migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Companies migrated: ${companiesMigrated}`);
    console.log(`   - Persons migrated: ${personsMigrated}`);
    console.log(`   - Opportunities updated: ${opportunitiesUpdated}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateData().catch(console.error);
