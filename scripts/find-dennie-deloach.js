#!/usr/bin/env node

/**
 * Find Dennie DeLoach and check their company assignment
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findDennieDeLoach() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Search for Dennie DeLoach
    console.log('🔍 Searching for Dennie DeLoach...\n');
    
    const people = await prisma.people.findMany({
      where: {
        OR: [
          { fullName: { contains: 'Dennie', mode: 'insensitive' } },
          { fullName: { contains: 'DeLoach', mode: 'insensitive' } },
          { firstName: { contains: 'Dennie', mode: 'insensitive' } },
          { lastName: { contains: 'DeLoach', mode: 'insensitive' } }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true
          }
        }
      }
    });

    if (people.length === 0) {
      console.log('❌ Dennie DeLoach not found');
      return;
    }

    console.log(`✅ Found ${people.length} matching record(s):\n`);

    for (const person of people) {
      console.log('='.repeat(80));
      console.log(`Person ID: ${person.id}`);
      console.log(`Full Name: ${person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim()}`);
      console.log(`Email: ${person.email || 'N/A'}`);
      console.log(`Workspace ID: ${person.workspaceId}`);
      console.log(`Current Company: ${person.company?.name || 'N/A'} (ID: ${person.companyId || 'N/A'})`);
      console.log(`Company Website: ${person.company?.website || 'N/A'}`);
      console.log(`Created At: ${person.createdAt}`);
      console.log(`Updated At: ${person.updatedAt}`);
      console.log('='.repeat(80));
      console.log('');
    }

    // Check for audit logs or history
    console.log('🔍 Checking for recent updates...\n');
    
    // Get the most likely match (first one or exact match)
    const targetPerson = people.find(p => 
      p.fullName?.toLowerCase().includes('dennie') && 
      p.fullName?.toLowerCase().includes('deloach')
    ) || people[0];

    if (targetPerson) {
      console.log(`Target Person: ${targetPerson.fullName} (${targetPerson.id})`);
      console.log(`Current Company: ${targetPerson.company?.name || 'None'} (${targetPerson.companyId || 'None'})\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

findDennieDeLoach();

