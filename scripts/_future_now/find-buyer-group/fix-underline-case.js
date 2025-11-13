#!/usr/bin/env node

/**
 * Fix the specific Underline domain mismatch case
 * Olga Lev (underline.cz) incorrectly assigned to Underline (underline.com)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUnderlineCase() {
  console.log('\n🔧 Fixing Underline domain mismatch case\n');

  try {
    // Find Olga Lev
    const olgaLev = await prisma.people.findFirst({
      where: {
        OR: [
          { fullName: { contains: 'Olga Lev', mode: 'insensitive' } },
          { email: { contains: 'olga.lev@underline.cz', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      include: {
        company: true
      }
    });

    if (!olgaLev) {
      console.log('❌ Olga Lev not found');
      return;
    }

    console.log(`Found: ${olgaLev.fullName}`);
    console.log(`Email: ${olgaLev.email}`);
    console.log(`Company: ${olgaLev.company?.name}`);
    console.log(`Company Website: ${olgaLev.company?.website}`);
    console.log(`Is Buyer Group Member: ${olgaLev.isBuyerGroupMember}`);
    console.log(`Buyer Group Role: ${olgaLev.buyerGroupRole}`);

    const emailDomain = olgaLev.email?.split('@')[1]?.toLowerCase();
    const companyDomain = olgaLev.company?.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();

    console.log(`\nEmail domain: ${emailDomain}`);
    console.log(`Company domain: ${companyDomain}`);
    console.log(`Match: ${emailDomain === companyDomain ? '✅' : '❌'}`);

    if (emailDomain !== companyDomain && olgaLev.isBuyerGroupMember) {
      console.log(`\n🔧 Removing ${olgaLev.fullName} from buyer group...`);
      
      await prisma.people.update({
        where: { id: olgaLev.id },
        data: {
          isBuyerGroupMember: false,
          buyerGroupRole: null
        }
      });

      console.log('✅ Fixed!');
    } else if (!olgaLev.isBuyerGroupMember) {
      console.log('\n✅ Already fixed - not in buyer group');
    } else {
      console.log('\n✅ Domain matches - no fix needed');
    }

    // Also check for any other underline domain mismatches
    console.log('\n📊 Checking all Underline companies...');
    
    const underlineCompanies = await prisma.companies.findMany({
      where: {
        name: { contains: 'Underline', mode: 'insensitive' },
        deletedAt: null
      },
      include: {
        people: {
          where: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      }
    });

    for (const company of underlineCompanies) {
      console.log(`\n📍 ${company.name} (${company.website})`);
      console.log(`   Buyer group: ${company.people.length} members`);
      
      for (const person of company.people) {
        const email = person.email || person.workEmail;
        const emailDom = email?.split('@')[1]?.toLowerCase();
        const compDom = company.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        
        const match = emailDom && compDom && emailDom.split('.').slice(-2).join('.') === compDom.split('.').slice(-2).join('.');
        console.log(`   ${match ? '✅' : '❌'} ${person.fullName || person.firstName} (${email})`);
        
        if (!match && email) {
          console.log(`      Removing from buyer group...`);
          await prisma.people.update({
            where: { id: person.id },
            data: {
              isBuyerGroupMember: false,
              buyerGroupRole: null
            }
          });
          console.log(`      ✅ Fixed!`);
        }
      }
    }

    console.log('\n✅ All Underline cases fixed!\n');

  } finally {
    await prisma.$disconnect();
  }
}

fixUnderlineCase().catch(console.error);

