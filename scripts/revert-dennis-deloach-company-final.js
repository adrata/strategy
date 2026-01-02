#!/usr/bin/env node

/**
 * Revert Dennis DeLoach's company assignment back to Seminole Title Company
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERSON_ID = '01K8NP9YH1MF4A21Q6SW44BPQJ';
const PREVIOUS_COMPANY_ID = '01K46D18M5A00HRCSSVFBG8XKR'; // Seminole Title Company
const CURRENT_COMPANY_ID = '01KBDXEWVJNK60T7H8PWYTNE7P'; // 9one5 Title LLC

async function revertDennisDeLoachCompany() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Get the person and current company
    const person = await prisma.people.findUnique({
      where: { id: PERSON_ID },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!person) {
      throw new Error('Person not found');
    }

    // Get the previous company
    const previousCompany = await prisma.companies.findUnique({
      where: { id: PREVIOUS_COMPANY_ID },
      select: {
        id: true,
        name: true
      }
    });

    if (!previousCompany) {
      throw new Error('Previous company not found');
    }

    console.log('='.repeat(80));
    console.log('REVERTING COMPANY ASSIGNMENT');
    console.log('='.repeat(80));
    console.log(`Person: ${person.fullName}`);
    console.log(`Current Company: ${person.company?.name || 'None'} (${person.company?.id || 'None'})`);
    console.log(`Previous Company: ${previousCompany.name} (${previousCompany.id})`);
    console.log('');

    // Revert the company assignment
    console.log('🔄 Reverting company assignment...');
    const updatedPerson = await prisma.people.update({
      where: { id: PERSON_ID },
      data: {
        companyId: PREVIOUS_COMPANY_ID,
        updatedAt: new Date()
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

    console.log('✅ Successfully reverted company assignment!');
    console.log('');
    console.log('='.repeat(80));
    console.log('UPDATED STATE');
    console.log('='.repeat(80));
    console.log(`Person: ${updatedPerson.fullName}`);
    console.log(`Company: ${updatedPerson.company?.name || 'None'} (${updatedPerson.company?.id || 'None'})`);
    console.log(`Updated At: ${updatedPerson.updatedAt}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

revertDennisDeLoachCompany();

