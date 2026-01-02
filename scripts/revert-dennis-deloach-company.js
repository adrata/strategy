#!/usr/bin/env node

/**
 * Revert Dennis DeLoach's company assignment
 * Find the previous company and restore it
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERSON_ID = '01K8NP9YH1MF4A21Q6SW44BPQJ';
const CURRENT_COMPANY_ID = '01KBDXEWVJNK60T7H8PWYTNE7P'; // 9one5 Title LLC

async function revertDennisDeLoachCompany() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Get the person
    const person = await prisma.people.findUnique({
      where: { id: PERSON_ID },
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

    if (!person) {
      throw new Error('Person not found');
    }

    console.log('='.repeat(80));
    console.log('CURRENT STATE');
    console.log('='.repeat(80));
    console.log(`Person: ${person.fullName}`);
    console.log(`Current Company: ${person.company?.name || 'None'} (${person.companyId || 'None'})`);
    console.log(`Updated At: ${person.updatedAt}`);
    console.log('');

    // Check actions to see if there's history
    console.log('🔍 Checking actions history...\n');
    const actions = await prisma.actions.findMany({
      where: {
        personId: PERSON_ID,
        deletedAt: null
      },
      select: {
        id: true,
        type: true,
        subject: true,
        companyId: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`Found ${actions.length} actions\n`);

    // Look for actions with different company IDs
    const companyIds = new Set();
    actions.forEach(action => {
      if (action.companyId && action.companyId !== CURRENT_COMPANY_ID) {
        companyIds.add(action.companyId);
        console.log(`Found action with different company: ${action.company?.name || action.companyId}`);
        console.log(`   Action: ${action.subject} (${action.type})`);
        console.log(`   Date: ${action.createdAt}`);
        console.log('');
      }
    });

    // Check email messages for company associations
    console.log('🔍 Checking email associations...\n');
    const emails = await prisma.email_messages.findMany({
      where: {
        personId: PERSON_ID,
        companyId: { not: null }
      },
      select: {
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const emailCompanyIds = new Set();
    emails.forEach(email => {
      if (email.companyId && email.companyId !== CURRENT_COMPANY_ID) {
        emailCompanyIds.add(email.companyId);
        console.log(`Found email with company: ${email.company?.name || email.companyId}`);
        console.log(`   Date: ${email.createdAt}`);
        console.log('');
      }
    });

    // Find the most common previous company
    const allPreviousCompanyIds = Array.from(new Set([...companyIds, ...emailCompanyIds]));
    
    if (allPreviousCompanyIds.length === 0) {
      console.log('⚠️  Could not find previous company from actions or emails');
      console.log('   You may need to specify the previous company ID manually\n');
      return;
    }

    // Get company details
    console.log('='.repeat(80));
    console.log('PREVIOUS COMPANY CANDIDATES');
    console.log('='.repeat(80));
    
    const previousCompanies = [];
    for (const companyId of allPreviousCompanyIds) {
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          website: true,
          createdAt: true
        }
      });
      
      if (company) {
        // Count how many times this company appears
        const actionCount = actions.filter(a => a.companyId === companyId).length;
        const emailCount = emails.filter(e => e.companyId === companyId).length;
        
        previousCompanies.push({
          ...company,
          actionCount,
          emailCount,
          totalReferences: actionCount + emailCount
        });
        
        console.log(`Company: ${company.name} (${company.id})`);
        console.log(`   References: ${actionCount} actions, ${emailCount} emails`);
        console.log('');
      }
    }

    // Find the most likely previous company (most references)
    if (previousCompanies.length > 0) {
      previousCompanies.sort((a, b) => b.totalReferences - a.totalReferences);
      const mostLikelyPrevious = previousCompanies[0];
      
      console.log('='.repeat(80));
      console.log('MOST LIKELY PREVIOUS COMPANY');
      console.log('='.repeat(80));
      console.log(`Company: ${mostLikelyPrevious.name} (${mostLikelyPrevious.id})`);
      console.log(`   References: ${mostLikelyPrevious.totalReferences} total`);
      console.log('');
      
      // Ask for confirmation (in a real script, you'd prompt)
      console.log('⚠️  To revert, run:');
      console.log(`   UPDATE people SET "companyId" = '${mostLikelyPrevious.id}' WHERE id = '${PERSON_ID}';`);
      console.log('');
      console.log('Or I can do it automatically. Should I proceed?');
      
      // For now, let's just show what would happen
      // In production, you'd want user confirmation
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

revertDennisDeLoachCompany();

