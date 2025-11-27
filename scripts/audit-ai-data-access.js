#!/usr/bin/env node
/**
 * Comprehensive AI Data Access Audit Script
 * 
 * This script queries the database directly for a sample person record in Victoria's
 * workspace (TOP Engineering Plus) and outputs all available data fields to verify
 * what the AI should be able to access.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Victoria's workspace ID
const VICTORIA_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const VICTORIA_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

async function auditPersonData() {
  console.log('\n' + '='.repeat(80));
  console.log('AI DATA ACCESS AUDIT - PERSON RECORDS');
  console.log('='.repeat(80));

  // Get a sample person with all related data
  const person = await prisma.people.findFirst({
    where: {
      workspaceId: VICTORIA_WORKSPACE_ID,
      mainSellerId: VICTORIA_USER_ID,
      deletedAt: null,
      companyId: { not: null },
    },
    include: {
      company: {
        include: {
          mainSeller: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      },
      mainSeller: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!person) {
    console.log('No person found for Victoria in TOP Engineering Plus workspace');
    return;
  }

  console.log('\n--- SAMPLE PERSON RECORD ---');
  console.log(`Name: ${person.fullName}`);
  console.log(`Title: ${person.jobTitle}`);
  console.log(`Company: ${person.company?.name}`);
  console.log(`Status: ${person.status}`);
  console.log(`Email: ${person.email}`);
  console.log(`Phone: ${person.phone}`);

  console.log('\n--- BASIC DATA FIELDS ---');
  const basicFields = [
    'firstName', 'lastName', 'fullName', 'jobTitle', 'department', 'seniority',
    'email', 'workEmail', 'personalEmail', 'phone', 'mobilePhone', 'workPhone',
    'linkedinUrl', 'linkedinNavigatorUrl', 'city', 'state', 'country',
    'status', 'priority', 'source', 'notes', 'tags'
  ];
  basicFields.forEach(field => {
    const value = person[field];
    if (value !== null && value !== undefined) {
      console.log(`  ${field}: ${JSON.stringify(value).substring(0, 100)}`);
    }
  });

  console.log('\n--- INTELLIGENCE DATA (customFields) ---');
  if (person.customFields) {
    const cf = person.customFields;
    console.log(`  customFields exists: YES (${Object.keys(cf).length} keys)`);
    Object.keys(cf).forEach(key => {
      const value = cf[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 100) 
          : String(value).substring(0, 100);
        console.log(`    ${key}: ${displayValue}`);
      }
    });
  } else {
    console.log('  customFields: EMPTY');
  }

  console.log('\n--- BUYER GROUP FIELDS (Direct on model) ---');
  const buyerGroupFields = [
    'buyerGroupRole', 'buyerGroupStatus', 'isBuyerGroupMember', 'buyerGroupOptimized',
    'decisionPower', 'decisionPowerScore', 'influenceLevel', 'influenceScore',
    'communicationStyle', 'engagementLevel', 'engagementStrategy',
    'decisionMaking', 'preferredContact', 'responseTime'
  ];
  buyerGroupFields.forEach(field => {
    const value = person[field];
    if (value !== null && value !== undefined) {
      console.log(`  ${field}: ${value}`);
    }
  });

  console.log('\n--- ENRICHMENT DATA (coresignalData) ---');
  if (person.coresignalData) {
    const cs = person.coresignalData;
    console.log(`  coresignalData exists: YES (${Object.keys(cs).length} keys)`);
    Object.keys(cs).slice(0, 15).forEach(key => {
      const value = cs[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 80) 
          : String(value).substring(0, 80);
        console.log(`    ${key}: ${displayValue}`);
      }
    });
  } else {
    console.log('  coresignalData: EMPTY');
  }

  console.log('\n--- ENRICHED DATA (enrichedData) ---');
  if (person.enrichedData) {
    const ed = person.enrichedData;
    console.log(`  enrichedData exists: YES (${Object.keys(ed).length} keys)`);
    Object.keys(ed).slice(0, 10).forEach(key => {
      const value = ed[key];
      if (value !== null && value !== undefined) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 80) 
          : String(value).substring(0, 80);
        console.log(`    ${key}: ${displayValue}`);
      }
    });
  } else {
    console.log('  enrichedData: EMPTY');
  }

  console.log('\n--- AI INTELLIGENCE (aiIntelligence) ---');
  if (person.aiIntelligence) {
    const ai = person.aiIntelligence;
    console.log(`  aiIntelligence exists: YES (${Object.keys(ai).length} keys)`);
    Object.keys(ai).slice(0, 10).forEach(key => {
      const value = ai[key];
      if (value !== null && value !== undefined) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 80) 
          : String(value).substring(0, 80);
        console.log(`    ${key}: ${displayValue}`);
      }
    });
  } else {
    console.log('  aiIntelligence: EMPTY');
  }

  console.log('\n--- SKILLS & EXPERIENCE ---');
  const skillFields = [
    'technicalSkills', 'softSkills', 'industrySkills', 'certifications',
    'achievements', 'languages', 'speakingEngagements', 'publications',
    'totalExperience', 'yearsAtCompany', 'yearsInRole', 'leadershipExperience'
  ];
  skillFields.forEach(field => {
    const value = person[field];
    if (value !== null && value !== undefined && 
        !(Array.isArray(value) && value.length === 0)) {
      console.log(`  ${field}: ${JSON.stringify(value).substring(0, 80)}`);
    }
  });

  return person;
}

async function auditCompanyData() {
  console.log('\n' + '='.repeat(80));
  console.log('AI DATA ACCESS AUDIT - COMPANY RECORDS');
  console.log('='.repeat(80));

  // Get a sample company with all data
  const company = await prisma.companies.findFirst({
    where: {
      workspaceId: VICTORIA_WORKSPACE_ID,
      mainSellerId: VICTORIA_USER_ID,
      deletedAt: null,
    },
    include: {
      mainSeller: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });

  if (!company) {
    console.log('No company found for Victoria in TOP Engineering Plus workspace');
    return;
  }

  console.log('\n--- SAMPLE COMPANY RECORD ---');
  console.log(`Name: ${company.name}`);
  console.log(`Industry: ${company.industry}`);
  console.log(`Size: ${company.size}`);
  console.log(`Status: ${company.status}`);
  console.log(`Website: ${company.website}`);

  console.log('\n--- BASIC COMPANY FIELDS ---');
  const basicFields = [
    'name', 'legalName', 'tradingName', 'description', 'website', 'email',
    'industry', 'sector', 'size', 'employeeCount', 'revenue', 'foundedYear',
    'city', 'state', 'country', 'hqCity', 'hqState', 'linkedinUrl',
    'status', 'priority', 'notes', 'tags', 'marketPosition'
  ];
  basicFields.forEach(field => {
    const value = company[field];
    if (value !== null && value !== undefined) {
      console.log(`  ${field}: ${JSON.stringify(value).substring(0, 100)}`);
    }
  });

  console.log('\n--- COMPANY INTELLIGENCE (customFields) ---');
  if (company.customFields) {
    const cf = company.customFields;
    console.log(`  customFields exists: YES (${Object.keys(cf).length} keys)`);
    Object.keys(cf).forEach(key => {
      const value = cf[key];
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 100) 
          : String(value).substring(0, 100);
        console.log(`    ${key}: ${displayValue}`);
      }
    });
  } else {
    console.log('  customFields: EMPTY');
  }

  console.log('\n--- STRATEGIC ARRAYS (Direct on model) ---');
  const arrayFields = [
    'businessChallenges', 'businessPriorities', 'competitors', 
    'competitiveAdvantages', 'growthOpportunities', 'strategicInitiatives',
    'techStack', 'technologiesUsed', 'marketThreats', 'successMetrics'
  ];
  arrayFields.forEach(field => {
    const value = company[field];
    if (value !== null && value !== undefined && Array.isArray(value) && value.length > 0) {
      console.log(`  ${field}: ${JSON.stringify(value).substring(0, 100)}`);
    }
  });

  console.log('\n--- COMPANY AI INTELLIGENCE (companyIntelligence) ---');
  if (company.companyIntelligence) {
    const ci = company.companyIntelligence;
    console.log(`  companyIntelligence exists: YES (${Object.keys(ci).length} keys)`);
    Object.keys(ci).slice(0, 10).forEach(key => {
      const value = ci[key];
      if (value !== null && value !== undefined) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 80) 
          : String(value).substring(0, 80);
        console.log(`    ${key}: ${displayValue}`);
      }
    });
  } else {
    console.log('  companyIntelligence: EMPTY');
  }

  console.log('\n--- AI INTELLIGENCE (aiIntelligence) ---');
  if (company.aiIntelligence) {
    const ai = company.aiIntelligence;
    console.log(`  aiIntelligence exists: YES (${Object.keys(ai).length} keys)`);
    Object.keys(ai).slice(0, 10).forEach(key => {
      const value = ai[key];
      if (value !== null && value !== undefined) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 80) 
          : String(value).substring(0, 80);
        console.log(`    ${key}: ${displayValue}`);
      }
    });
  } else {
    console.log('  aiIntelligence: EMPTY');
  }

  return company;
}

async function auditSellerData() {
  console.log('\n' + '='.repeat(80));
  console.log('AI DATA ACCESS AUDIT - SELLER/USER DATA');
  console.log('='.repeat(80));

  // Get Victoria's user record
  const user = await prisma.users.findUnique({
    where: { id: VICTORIA_USER_ID },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      timezone: true,
      speedrunRankingMode: true,
      dashboardConfig: true,
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('\n--- SELLER/USER DATA ---');
  console.log(`  Name: ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  First Name: ${user.firstName}`);
  console.log(`  Last Name: ${user.lastName}`);

  // Get workspace config (what they sell, their ICP, etc.)
  const workspace = await prisma.workspaces.findFirst({
    where: { id: VICTORIA_WORKSPACE_ID }
  });

  if (workspace) {
    console.log('\n--- WORKSPACE/SALES CONFIG ---');
    console.log(`  Workspace: ${workspace.name}`);
    console.log(`  Industry: ${workspace.industry}`);
    console.log(`  Business Model: ${workspace.businessModel}`);
    console.log(`  Sales Methodology: ${workspace.salesMethodology}`);
    console.log(`  ICP: ${workspace.idealCustomerProfile?.substring(0, 150)}...`);
    
    if (workspace.productPortfolio?.length > 0) {
      console.log(`  Products: ${workspace.productPortfolio.join(', ')}`);
    }
    if (workspace.serviceOfferings?.length > 0) {
      console.log(`  Services: ${workspace.serviceOfferings.join(', ')}`);
    }
    if (workspace.valuePropositions?.length > 0) {
      console.log(`  Value Props: ${workspace.valuePropositions.join(', ')}`);
    }
    if (workspace.competitiveAdvantages?.length > 0) {
      console.log(`  Competitive Advantages: ${workspace.competitiveAdvantages.join(', ')}`);
    }
    if (workspace.targetIndustries?.length > 0) {
      console.log(`  Target Industries: ${workspace.targetIndustries.join(', ')}`);
    }
  }

  return { user, workspace };
}

async function checkAIContextBuilder() {
  console.log('\n' + '='.repeat(80));
  console.log('CHECKING AI CONTEXT BUILDER ACCESS');
  console.log('='.repeat(80));

  // List all fields the AI SHOULD have access to via context builder
  console.log('\n--- FIELDS AI CONTEXT BUILDER SHOULD ACCESS ---');
  
  const personFields = {
    'Basic Info': ['firstName', 'lastName', 'fullName', 'jobTitle', 'email', 'phone', 'linkedinUrl'],
    'Company': ['company.name', 'company.industry', 'company.size', 'company.description'],
    'Status': ['status', 'priority', 'globalRank', 'notes'],
    'Buyer Group': ['buyerGroupRole', 'buyerGroupStatus', 'decisionPower', 'influenceLevel'],
    'Engagement': ['engagementLevel', 'engagementStrategy', 'communicationStyle', 'preferredContact'],
    'Intelligence (customFields)': ['painPoints', 'goals', 'challenges', 'opportunities', 'strategySummary'],
    'Enrichment': ['coresignalData', 'enrichedData', 'technicalSkills', 'softSkills'],
    'AI Generated': ['aiIntelligence', 'directionalIntelligence', 'nextAction'],
  };

  Object.keys(personFields).forEach(category => {
    console.log(`\n  ${category}:`);
    personFields[category].forEach(field => {
      console.log(`    - ${field}`);
    });
  });
}

async function main() {
  try {
    await auditPersonData();
    await auditCompanyData();
    await auditSellerData();
    await checkAIContextBuilder();
    
    console.log('\n' + '='.repeat(80));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(80));
    console.log('\nTo verify the AI has access to this data:');
    console.log('1. Navigate to staging.adrata.com and login as Victoria (vleland / TOPgtm01!)');
    console.log('2. Click on the person record audited above');
    console.log('3. Ask the AI: "Tell me everything you know about this person"');
    console.log('4. Verify the AI mentions: name, title, company, and any intelligence data');
    
  } catch (error) {
    console.error('Audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


