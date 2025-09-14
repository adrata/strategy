#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function findDanoLeads() {
  try {
    await prisma.$connect();
    console.log('🔍 FINDING DANO\'S LEADS (OWEN & DIGITAL TITLE)\n');
    
    // Dano's user ID
    const danoUserId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Search for leads assigned to Dano
    const danoLeads = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.company,
        l.phone,
        l.email,
        l."assignedUserId",
        l."createdAt",
        l."updatedAt"
      FROM leads l
      WHERE l."assignedUserId" = ${danoUserId}
      ORDER BY l."updatedAt" DESC
    `;

    console.log(`Found ${danoLeads.length} leads assigned to Dano:\n`);
    danoLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.company}`);
      console.log(`   Lead ID: ${lead.id}`);
      console.log(`   Phone: ${lead.phone || 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Created: ${lead.createdAt}`);
      console.log(`   Updated: ${lead.updatedAt}`);
      console.log('');
    });

    // Search specifically for Owen leads (could be company name or contact name)
    console.log('🔍 SEARCHING FOR OWEN-RELATED LEADS\n');
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
        OR l.company ILIKE '%Title%'
        OR l.company ILIKE '%Digital%'
      )
      ORDER BY l."updatedAt" DESC
    `;

    console.log(`Found ${owenLeads.length} leads with Owen/Title/Digital in company name:\n`);
    owenLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.company}`);
      console.log(`   Lead ID: ${lead.id}`);
      console.log(`   Phone: ${lead.phone || 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Assigned To: ${lead.assignedUserId === danoUserId ? 'Dano' : 'Other'}`);
      console.log(`   Created: ${lead.createdAt}`);
      console.log('');
    });

    // Search for any leads with "Digital Title" specifically
    console.log('🔍 SEARCHING FOR DIGITAL TITLE LEADS\n');
    const digitalTitleLeads = await prisma.$queryRaw`
      SELECT 
        l.id,
        l.company,
        l.phone,
        l.email,
        l."assignedUserId",
        l."createdAt",
        l."updatedAt"
      FROM leads l
      WHERE l.company ILIKE '%Digital Title%'
      ORDER BY l."updatedAt" DESC
    `;

    console.log(`Found ${digitalTitleLeads.length} leads with "Digital Title" in company name:\n`);
    digitalTitleLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.company}`);
      console.log(`   Lead ID: ${lead.id}`);
      console.log(`   Phone: ${lead.phone || 'N/A'}`);
      console.log(`   Email: ${lead.email || 'N/A'}`);
      console.log(`   Assigned To: ${lead.assignedUserId === danoUserId ? 'Dano' : 'Other'}`);
      console.log(`   Created: ${lead.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDanoLeads();
