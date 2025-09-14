#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function searchOwenLeads() {
  try {
    await prisma.$connect();
    console.log('🔍 SEARCHING FOR LEADS WITH "OWEN"\\n');
    
    // Search for leads containing "Owen"
    const owenLeads = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.company,
        l.phone,
        l.email,
        l."assignedUserId",
        l."createdAt",
        l."updatedAt"
      FROM leads l
      WHERE (
        l.company ILIKE '%Owen%'
        OR l.email ILIKE '%Owen%'
        OR l.phone ILIKE '%Owen%'
      )
      ORDER BY l."updatedAt" DESC
    `;

    console.log(`Found ${owenLeads.length} leads with "Owen":\\n`);
    owenLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.company}`);
      console.log(`   Lead ID: ${lead.id}`);
      console.log(`   Phone: ${lead.phone || 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Assigned To: ${lead.assignedUserId || 'Unassigned'}`);
      console.log(`   Created: ${lead.createdAt}`);
      console.log(`   Updated: ${lead.updatedAt}`);
      console.log('');
    });

    // Also check if there are any leads with "Title" in the name that might be Owen's company
    console.log('🔍 SEARCHING FOR TITLE-RELATED LEADS\\n');
    
    const titleLeads = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.company,
        l.phone,
        l.email,
        l."assignedUserId",
        l."createdAt",
        l."updatedAt"
      FROM leads l
      WHERE l.company ILIKE '%Title%'
      ORDER BY l."updatedAt" DESC
    `;

    console.log(`Found ${titleLeads.length} leads with "Title" in name:\\n`);
    titleLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.company}`);
      console.log(`   Lead ID: ${lead.id}`);
      console.log(`   Phone: ${lead.phone || 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Assigned To: ${lead.assignedUserId || 'Unassigned'}`);
      console.log(`   Created: ${lead.createdAt}`);
      console.log(`   Updated: ${lead.updatedAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchOwenLeads();
