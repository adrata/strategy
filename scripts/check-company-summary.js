#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCompanySummary() {
  const companyName = process.argv[2] || '5Bars';
  const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK';
  
  console.log(`Checking company: ${companyName}`);
  console.log('='.repeat(70));
  
  const company = await prisma.companies.findFirst({
    where: {
      name: { contains: companyName, mode: 'insensitive' },
      workspaceId: workspaceId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      description: true,
      descriptionEnriched: true,
      website: true,
      customFields: true
    }
  });
  
  if (!company) {
    console.log('Company not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`Found: ${company.name} (ID: ${company.id})`);
  console.log('');
  console.log('Description:', company.description || '(empty)');
  console.log('');
  console.log('Description Enriched:', company.descriptionEnriched || '(empty)');
  console.log('');
  console.log('Description Enriched Length:', company.descriptionEnriched ? company.descriptionEnriched.length : 0);
  console.log('');
  console.log('Description Enriched Preview:', company.descriptionEnriched ? company.descriptionEnriched.substring(0, 200) : '(empty)');
  console.log('');
  
  if (company.customFields) {
    const cf = company.customFields;
    console.log('Custom Fields (relevant):');
    console.log('  - aiSummaryGeneratedAt:', cf.aiSummaryGeneratedAt || '(not set)');
    console.log('  - aiSummaryModel:', cf.aiSummaryModel || '(not set)');
    console.log('  - aiSummaryDataSources:', cf.aiSummaryDataSources || '(not set)');
  }
  
  await prisma.$disconnect();
}

checkCompanySummary().catch(console.error);

