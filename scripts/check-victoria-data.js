#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Find TOP Engineering Plus workspace
  const workspace = await prisma.workspaces.findFirst({
    where: { slug: 'top-engineering-plus' }
  });
  console.log('Workspace:', workspace?.id, workspace?.name);
  
  // Count people in this workspace
  const peopleCount = await prisma.people.count({
    where: { workspaceId: workspace?.id, deletedAt: null }
  });
  console.log('People count:', peopleCount);
  
  // Get a sample person with lots of data
  const person = await prisma.people.findFirst({
    where: { 
      workspaceId: workspace?.id, 
      deletedAt: null, 
      companyId: { not: null },
      // Find one with customFields data
      customFields: { not: null }
    },
    include: { company: true }
  });
  
  if (person) {
    console.log('\n' + '='.repeat(60));
    console.log('SAMPLE PERSON');
    console.log('='.repeat(60));
    console.log('ID:', person.id);
    console.log('Name:', person.fullName);
    console.log('Title:', person.jobTitle);
    console.log('Company:', person.company?.name);
    console.log('Status:', person.status);
    console.log('MainSeller:', person.mainSellerId);
    console.log('buyerGroupRole:', person.buyerGroupRole);
    console.log('decisionPower:', person.decisionPower);
    console.log('influenceLevel:', person.influenceLevel);
    console.log('engagementStrategy:', person.engagementStrategy);
    
    console.log('\n--- customFields ---');
    if (person.customFields) {
      console.log('Keys:', Object.keys(person.customFields));
      Object.entries(person.customFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && 
            !(Array.isArray(value) && value.length === 0)) {
          const display = typeof value === 'object' ? JSON.stringify(value).substring(0, 80) : String(value).substring(0, 80);
          console.log(`  ${key}: ${display}`);
        }
      });
    } else {
      console.log('  (empty)');
    }
    
    console.log('\n--- coresignalData ---');
    if (person.coresignalData) {
      console.log('Keys:', Object.keys(person.coresignalData).slice(0, 10));
    } else {
      console.log('  (empty)');
    }
  } else {
    console.log('No person with customFields found, trying any person...');
    const anyPerson = await prisma.people.findFirst({
      where: { workspaceId: workspace?.id, deletedAt: null },
      include: { company: true }
    });
    if (anyPerson) {
      console.log('Found:', anyPerson.fullName, 'at', anyPerson.company?.name);
    }
  }
  
  // Check company data
  console.log('\n' + '='.repeat(60));
  console.log('SAMPLE COMPANY');
  console.log('='.repeat(60));
  
  const company = await prisma.companies.findFirst({
    where: { 
      workspaceId: workspace?.id, 
      deletedAt: null,
      customFields: { not: null }
    }
  });
  
  if (company) {
    console.log('Name:', company.name);
    console.log('Industry:', company.industry);
    console.log('Size:', company.size);
    console.log('Description:', company.description?.substring(0, 100));
    console.log('businessChallenges:', company.businessChallenges);
    console.log('competitors:', company.competitors);
    console.log('strategicInitiatives:', company.strategicInitiatives);
    
    console.log('\n--- customFields ---');
    if (company.customFields) {
      console.log('Keys:', Object.keys(company.customFields));
      Object.entries(company.customFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && 
            !(Array.isArray(value) && value.length === 0)) {
          const display = typeof value === 'object' ? JSON.stringify(value).substring(0, 80) : String(value).substring(0, 80);
          console.log(`  ${key}: ${display}`);
        }
      });
    }
  } else {
    const anyCompany = await prisma.companies.findFirst({
      where: { workspaceId: workspace?.id, deletedAt: null }
    });
    if (anyCompany) {
      console.log('Found company:', anyCompany.name);
      console.log('customFields:', anyCompany.customFields);
    }
  }
  
  // Check workspace config (what Victoria sells)
  console.log('\n' + '='.repeat(60));
  console.log('WORKSPACE CONFIG (What Victoria sells)');
  console.log('='.repeat(60));
  
  if (workspace) {
    console.log('Name:', workspace.name);
    console.log('Industry:', workspace.industry);
    console.log('Business Model:', workspace.businessModel);
    console.log('Sales Methodology:', workspace.salesMethodology);
    console.log('ICP:', workspace.idealCustomerProfile?.substring(0, 150));
    console.log('Products:', workspace.productPortfolio);
    console.log('Services:', workspace.serviceOfferings);
    console.log('Value Props:', workspace.valuePropositions);
    console.log('Target Industries:', workspace.targetIndustries);
    console.log('Competitive Advantages:', workspace.competitiveAdvantages);
  }
  
  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  prisma.$disconnect();
});



