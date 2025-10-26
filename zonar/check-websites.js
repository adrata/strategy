#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkCompanyWebsites() {
  const prisma = new PrismaClient();
  
  try {
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        linkedinUrl: true
      },
      take: 20
    });
    
    console.log('Sample companies with website data:');
    console.log('=====================================');
    
    let withWebsite = 0;
    let withDomain = 0;
    let withLinkedIn = 0;
    
    companies.forEach(company => {
      console.log(`- ${company.name}`);
      console.log(`  Website: ${company.website || 'None'}`);
      console.log(`  Domain: ${company.domain || 'None'}`);
      console.log(`  LinkedIn: ${company.linkedinUrl || 'None'}`);
      console.log('');
      
      if (company.website) withWebsite++;
      if (company.domain) withDomain++;
      if (company.linkedinUrl) withLinkedIn++;
    });
    
    console.log('Summary:');
    console.log(`Companies with website: ${withWebsite}/${companies.length}`);
    console.log(`Companies with domain: ${withDomain}/${companies.length}`);
    console.log(`Companies with LinkedIn: ${withLinkedIn}/${companies.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanyWebsites();
