#!/usr/bin/env node

/**
 * Test enrichment with people who have both LinkedIn and Email
 * This helps verify the combined search is working correctly
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findPeopleWithBoth() {
  try {
    const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK';
    
    // Find people with both LinkedIn and email who need enrichment
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        linkedinUrl: { not: null },
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ],
        // Missing CoreSignal data
        OR: [
          { coresignalData: null },
          { 
            customFields: {
              path: ['coresignal', 'employeeId'],
              equals: null
            }
          }
        ],
        // NOT enriched via buyer group
        OR: [
          { buyerGroupRole: null },
          { isBuyerGroupMember: false }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            linkedinUrl: true,
            website: true
          }
        }
      },
      take: 5,
      orderBy: {
        fullName: 'asc'
      }
    });
    
    console.log(`Found ${people.length} people with both LinkedIn and Email needing enrichment`);
    console.log('');
    
    for (const person of people) {
      console.log(`${person.fullName}`);
      console.log(`  LinkedIn: ${person.linkedinUrl}`);
      console.log(`  Email: ${person.email || person.workEmail || person.personalEmail}`);
      console.log(`  Company: ${person.company?.name || 'N/A'}`);
      console.log(`  Company LinkedIn: ${person.company?.linkedinUrl || 'N/A'}`);
      console.log('');
    }
    
    return people;
    
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

findPeopleWithBoth();

