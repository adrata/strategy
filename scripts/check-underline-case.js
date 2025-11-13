#!/usr/bin/env node

/**
 * Check specific Underline company case
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUnderlineCase() {
  console.log('\n🔍 Checking Underline company case\n');

  try {
    // Find Underline company
    const companies = await prisma.companies.findMany({
      where: {
        name: {
          contains: 'Underline',
          mode: 'insensitive'
        },
        deletedAt: null
      },
      include: {
        people: {
          where: {
            deletedAt: null
          }
        }
      }
    });

    console.log(`Found ${companies.length} companies matching "Underline"\n`);

    for (const company of companies) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`Company: ${company.name}`);
      console.log(`ID: ${company.id}`);
      console.log(`Website: ${company.website || 'N/A'}`);
      console.log(`LinkedIn: ${company.linkedinUrl || 'N/A'}`);
      console.log(`People count: ${company.people.length}`);
      
      // Check buyer group members
      const buyerGroupMembers = company.people.filter(p => p.isBuyerGroupMember);
      console.log(`Buyer group members: ${buyerGroupMembers.length}`);
      
      if (buyerGroupMembers.length > 0) {
        console.log(`\nBuyer Group Members:`);
        
        const emailDomains = new Map();
        
        for (const person of buyerGroupMembers) {
          const email = person.email || person.workEmail;
          const domain = email && email.includes('@') ? email.split('@')[1] : 'N/A';
          
          if (!emailDomains.has(domain)) {
            emailDomains.set(domain, []);
          }
          emailDomains.get(domain).push(person);
          
          console.log(`\n  - ${person.fullName || `${person.firstName} ${person.lastName}`}`);
          console.log(`    Email: ${email || 'N/A'}`);
          console.log(`    Domain: ${domain}`);
          console.log(`    Job Title: ${person.jobTitle || 'N/A'}`);
          console.log(`    LinkedIn: ${person.linkedinUrl || 'N/A'}`);
          console.log(`    Buyer Group Role: ${person.buyerGroupRole || 'N/A'}`);
          
          // Check CoreSignal data
          if (person.coresignalData) {
            const coresignalData = person.coresignalData;
            const experience = coresignalData.experience || [];
            const currentExp = experience.find(e => e.active_experience === 1) || experience[0];
            
            if (currentExp) {
              console.log(`    CoreSignal Company: ${currentExp.company_name || 'N/A'}`);
              console.log(`    CoreSignal Company LinkedIn: ${currentExp.company_linkedin_url || 'N/A'}`);
              console.log(`    CoreSignal Company Website: ${currentExp.company_website || 'N/A'}`);
            }
          }
        }
        
        // Show domain summary
        console.log(`\n${'='.repeat(70)}`);
        console.log(`Domain Summary:`);
        for (const [domain, people] of emailDomains.entries()) {
          console.log(`  ${domain}: ${people.length} people`);
        }
        
        if (emailDomains.size > 1) {
          console.log(`\n⚠️  WARNING: Multiple email domains in buyer group!`);
        }
      }
    }

  } finally {
    await prisma.$disconnect();
  }
}

checkUnderlineCase().catch(console.error);

