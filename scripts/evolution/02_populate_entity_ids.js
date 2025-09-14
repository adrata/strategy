/**
 * POPULATE ENTITY IDS - UNIFIED TRACKING SYSTEM
 * 
 * This script populates the entity_id fields for all existing records
 * using ULID generation for consistent, sortable identifiers
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

async function populateEntityIds() {
  console.log('🚀 Starting entity_id population...');
  
  try {
    // Populate companies
    console.log('📊 Populating companies...');
    const companies = await prisma.company.findMany({
      where: { entity_id: null }
    });
    
    for (const company of companies) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE company 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${company.id}
      `;
    }
    console.log(`✅ Populated ${companies.length} companies`);

    // Populate people
    console.log('👥 Populating people...');
    const people = await prisma.person.findMany({
      where: { entity_id: null }
    });
    
    for (const person of people) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE person 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${person.id}
      `;
    }
    console.log(`✅ Populated ${people.length} people`);

    // Populate leads
    console.log('🎯 Populating leads...');
    const leads = await prisma.leads.findMany({
      where: { entity_id: null }
    });
    
    for (const lead of leads) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE leads 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${lead.id}
      `;
    }
    console.log(`✅ Populated ${leads.length} leads`);

    // Populate prospects
    console.log('🔍 Populating prospects...');
    const prospects = await prisma.prospects.findMany({
      where: { entity_id: null }
    });
    
    for (const prospect of prospects) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE prospects 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${prospect.id}
      `;
    }
    console.log(`✅ Populated ${prospects.length} prospects`);

    // Populate opportunities
    console.log('💰 Populating opportunities...');
    const opportunities = await prisma.opportunities.findMany({
      where: { entity_id: null }
    });
    
    for (const opportunity of opportunities) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE opportunities 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${opportunity.id}
      `;
    }
    console.log(`✅ Populated ${opportunities.length} opportunities`);

    // Populate clients
    console.log('🏢 Populating clients...');
    const clients = await prisma.clients.findMany({
      where: { entity_id: null }
    });
    
    for (const client of clients) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE clients 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${client.id}
      `;
    }
    console.log(`✅ Populated ${clients.length} clients`);

    // Populate accounts (for migration)
    console.log('📋 Populating accounts...');
    const accounts = await prisma.accounts.findMany({
      where: { entity_id: null }
    });
    
    for (const account of accounts) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE accounts 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${account.id}
      `;
    }
    console.log(`✅ Populated ${accounts.length} accounts`);

    // Populate contacts (for migration)
    console.log('📞 Populating contacts...');
    const contacts = await prisma.contacts.findMany({
      where: { entity_id: null }
    });
    
    for (const contact of contacts) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE contacts 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${contact.id}
      `;
    }
    console.log(`✅ Populated ${contacts.length} contacts`);

    // Populate partners
    console.log('🤝 Populating partners...');
    const partners = await prisma.partners.findMany({
      where: { entity_id: null }
    });
    
    for (const partner of partners) {
      const entityId = ulid();
      await prisma.$executeRaw`
        UPDATE partners 
        SET entity_id = ${entityId}, "updatedAt" = NOW() 
        WHERE id = ${partner.id}
      `;
    }
    console.log(`✅ Populated ${partners.length} partners`);

    console.log('🎉 Entity ID population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error populating entity IDs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population
populateEntityIds()
  .then(() => {
    console.log('✅ Entity ID population completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Entity ID population failed:', error);
    process.exit(1);
  });
