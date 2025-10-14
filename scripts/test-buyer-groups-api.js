#!/usr/bin/env node

/**
 * Test script for the buyer groups fast API
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBuyerGroupsAPI() {
  try {
    // Find a company with buyer group data
    const company = await prisma.companies.findFirst({
      where: {
        name: { contains: 'Accenture' }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!company) {
      console.log('No Accenture company found, looking for any company with buyer group people...');
      
      const companyWithPeople = await prisma.companies.findFirst({
        where: {
          people: {
            some: {
              buyerGroupRole: { not: null }
            }
          }
        },
        select: {
          id: true,
          name: true,
          people: {
            where: {
              buyerGroupRole: { not: null }
            },
            select: {
              id: true,
              fullName: true,
              buyerGroupRole: true,
              isBuyerGroupMember: true
            }
          }
        }
      });

      if (companyWithPeople) {
        console.log('Found company with buyer group people:');
        console.log('Company:', companyWithPeople.name, '(ID:', companyWithPeople.id, ')');
        console.log('People with buyer group roles:', companyWithPeople.people.length);
        companyWithPeople.people.forEach(person => {
          console.log(`  - ${person.fullName} (${person.buyerGroupRole}) - Member: ${person.isBuyerGroupMember}`);
        });
        
        // Test the API endpoint
        console.log('\n🧪 Testing API endpoint...');
        const testUrl = `http://localhost:3000/api/data/buyer-groups/fast?companyId=${companyWithPeople.id}`;
        console.log('Test URL:', testUrl);
        console.log('You can test this URL in your browser or with curl');
        
      } else {
        console.log('No companies found with buyer group people');
      }
    } else {
      console.log('Found Accenture company:', company.name, '(ID:', company.id, ')');
      
      // Get people for this company
      const people = await prisma.people.findMany({
        where: {
          companyId: company.id,
          buyerGroupRole: { not: null }
        },
        select: {
          id: true,
          fullName: true,
          buyerGroupRole: true,
          isBuyerGroupMember: true
        }
      });
      
      console.log('People with buyer group roles:', people.length);
      people.forEach(person => {
        console.log(`  - ${person.fullName} (${person.buyerGroupRole}) - Member: ${person.isBuyerGroupMember}`);
      });
      
      // Test the API endpoint
      console.log('\n🧪 Testing API endpoint...');
      const testUrl = `http://localhost:3000/api/data/buyer-groups/fast?companyId=${company.id}`;
      console.log('Test URL:', testUrl);
      console.log('You can test this URL in your browser or with curl');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBuyerGroupsAPI();
