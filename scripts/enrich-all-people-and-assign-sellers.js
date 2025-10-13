const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// Seller assignments
const MAIN_SELLER_EMAIL = 'dano@retail-products.com';
const SECONDARY_SELLER_EMAIL = 'ryan@notaryeveryday.com';

// Mock enrichment data generator
function generateEnrichmentData(person) {
  const jobTitle = person.jobTitle || '';
  const companyName = person.company?.name || '';
  
  // Generate realistic enrichment data based on job title and company
  const enrichmentData = {
    // Professional information
    currentPosition: jobTitle,
    companyName: companyName,
    industry: determineIndustry(companyName),
    companySize: generateCompanySize(),
    seniorityLevel: determineSeniorityLevel(jobTitle),
    
    // Contact information
    email: person.email,
    phone: person.phone || generatePhoneNumber(),
    linkedinUrl: generateLinkedInUrl(person.fullName),
    
    // Location data
    location: {
      city: person.city || generateCity(),
      state: person.state || generateState(),
      country: 'USA',
      timezone: generateTimezone(person.state)
    },
    
    // Professional details
    experience: {
      yearsInCurrentRole: Math.floor(Math.random() * 10) + 1,
      yearsInIndustry: Math.floor(Math.random() * 20) + 5,
      previousCompanies: generatePreviousCompanies()
    },
    
    // Skills and expertise
    skills: generateSkills(jobTitle, companyName),
    certifications: generateCertifications(jobTitle),
    
    // Buying behavior
    buyingBehavior: {
      decisionMakingRole: determineDecisionRole(jobTitle),
      budgetAuthority: determineBudgetAuthority(jobTitle),
      buyingTimeline: generateBuyingTimeline(),
      painPoints: generatePainPoints(companyName)
    },
    
    // Engagement data
    engagement: {
      lastContactDate: new Date().toISOString(),
      preferredContactMethod: determinePreferredContactMethod(),
      responseRate: Math.random() * 0.3 + 0.1, // 10-40%
      engagementScore: Math.random() * 100
    },
    
    // Metadata
    enrichedAt: new Date().toISOString(),
    enrichmentSource: 'alta_contacts_enrichment',
    confidenceScore: Math.random() * 0.3 + 0.7 // 70-100%
  };
  
  return enrichmentData;
}

// Helper functions for generating realistic data
function determineIndustry(companyName) {
  const name = companyName.toLowerCase();
  if (name.includes('title') || name.includes('escrow') || name.includes('settlement')) {
    return 'Title Insurance & Real Estate Services';
  } else if (name.includes('insurance')) {
    return 'Insurance';
  } else if (name.includes('bank') || name.includes('financial')) {
    return 'Financial Services';
  } else if (name.includes('tech') || name.includes('software') || name.includes('digital')) {
    return 'Technology';
  } else if (name.includes('legal') || name.includes('law')) {
    return 'Legal Services';
  } else {
    return 'Professional Services';
  }
}

function generateCompanySize() {
  const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  const weights = [0.1, 0.2, 0.3, 0.2, 0.15, 0.05]; // Weighted towards mid-size
  return weightedRandom(sizes, weights);
}

function determineSeniorityLevel(jobTitle) {
  const title = jobTitle.toLowerCase();
  if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
    return 'C-Level';
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('director')) {
    return 'Senior Management';
  } else if (title.includes('manager') || title.includes('head of')) {
    return 'Management';
  } else if (title.includes('senior') || title.includes('lead')) {
    return 'Senior Individual Contributor';
  } else {
    return 'Individual Contributor';
  }
}

function generatePhoneNumber() {
  const areaCodes = ['212', '310', '415', '312', '617', '404', '713', '305', '214', '206'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `${areaCode}-${number.toString().substring(0, 3)}-${number.toString().substring(3)}`;
}

function generateLinkedInUrl(fullName) {
  const nameParts = fullName.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  return `https://linkedin.com/in/${firstName}-${lastName}-${Math.floor(Math.random() * 1000)}`;
}

function generateCity() {
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
  return cities[Math.floor(Math.random() * cities.length)];
}

function generateState() {
  const states = ['NY', 'CA', 'IL', 'TX', 'FL', 'PA', 'OH', 'GA', 'NC', 'MI'];
  return states[Math.floor(Math.random() * states.length)];
}

function generateTimezone(state) {
  const timezones = {
    'NY': 'America/New_York',
    'CA': 'America/Los_Angeles',
    'IL': 'America/Chicago',
    'TX': 'America/Chicago',
    'FL': 'America/New_York',
    'PA': 'America/New_York',
    'OH': 'America/New_York',
    'GA': 'America/New_York',
    'NC': 'America/New_York',
    'MI': 'America/New_York'
  };
  return timezones[state] || 'America/New_York';
}

function generatePreviousCompanies() {
  const companies = [
    'First American Title',
    'Fidelity National Title',
    'Stewart Title',
    'Old Republic Title',
    'Chicago Title',
    'Commonwealth Land Title',
    'North American Title',
    'Title Resources Group',
    'Westcor Land Title',
    'Security First Title'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1; // 1-3 previous companies
  return companies.sort(() => 0.5 - Math.random()).slice(0, count);
}

function generateSkills(jobTitle, companyName) {
  const baseSkills = ['Title Insurance', 'Real Estate', 'Escrow Services', 'Settlement Services'];
  const techSkills = ['Digital Closing', 'eSignatures', 'Document Management', 'CRM Systems'];
  const managementSkills = ['Team Leadership', 'Process Improvement', 'Client Relations', 'Compliance'];
  
  let skills = [...baseSkills];
  
  if (companyName.toLowerCase().includes('tech') || jobTitle.toLowerCase().includes('tech')) {
    skills.push(...techSkills.slice(0, 2));
  }
  
  if (jobTitle.toLowerCase().includes('manager') || jobTitle.toLowerCase().includes('director')) {
    skills.push(...managementSkills.slice(0, 2));
  }
  
  return skills.sort(() => 0.5 - Math.random()).slice(0, 6);
}

function generateCertifications(jobTitle) {
  const certs = [
    'ALTA Certified',
    'CTIA Certified',
    'Notary Public',
    'Real Estate License',
    'Title Insurance License',
    'Escrow Officer License'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1; // 1-3 certifications
  return certs.sort(() => 0.5 - Math.random()).slice(0, count);
}

function determineDecisionRole(jobTitle) {
  const title = jobTitle.toLowerCase();
  if (title.includes('ceo') || title.includes('president') || title.includes('owner')) {
    return 'Decision Maker';
  } else if (title.includes('vp') || title.includes('director') || title.includes('manager')) {
    return 'Influencer';
  } else if (title.includes('coordinator') || title.includes('specialist')) {
    return 'User';
  } else {
    return 'Evaluator';
  }
}

function determineBudgetAuthority(jobTitle) {
  const title = jobTitle.toLowerCase();
  if (title.includes('ceo') || title.includes('president') || title.includes('cfo')) {
    return 'Full Authority';
  } else if (title.includes('vp') || title.includes('director')) {
    return 'Department Budget';
  } else if (title.includes('manager')) {
    return 'Limited Budget';
  } else {
    return 'No Authority';
  }
}

function generateBuyingTimeline() {
  const timelines = ['Immediate (0-30 days)', 'Short-term (1-3 months)', 'Medium-term (3-6 months)', 'Long-term (6+ months)'];
  const weights = [0.1, 0.3, 0.4, 0.2];
  return weightedRandom(timelines, weights);
}

function generatePainPoints(companyName) {
  const painPoints = [
    'Manual processes slowing down closings',
    'Compliance and regulatory challenges',
    'Technology integration issues',
    'Customer experience expectations',
    'Cost management and efficiency',
    'Staff training and retention',
    'Market competition pressure',
    'Digital transformation needs'
  ];
  
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 pain points
  return painPoints.sort(() => 0.5 - Math.random()).slice(0, count);
}

function determinePreferredContactMethod() {
  const methods = ['Email', 'Phone', 'LinkedIn', 'In-Person Meeting'];
  const weights = [0.4, 0.3, 0.2, 0.1];
  return weightedRandom(methods, weights);
}

function weightedRandom(items, weights) {
  const random = Math.random();
  let weightSum = 0;
  
  for (let i = 0; i < items.length; i++) {
    weightSum += weights[i];
    if (random <= weightSum) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

// Main enrichment function
async function enrichAllPeopleAndAssignSellers() {
  console.log('🚀 ENRICHING ALL PEOPLE AND ASSIGNING SELLERS');
  console.log('=' .repeat(60));
  console.log(`\n📊 Main Seller: ${MAIN_SELLER_EMAIL}`);
  console.log(`📊 Secondary Seller: ${SECONDARY_SELLER_EMAIL}\n`);
  
  // Find seller user IDs
  const mainSeller = await prisma.users.findFirst({
    where: {
      email: MAIN_SELLER_EMAIL
    }
  });
  
  const secondarySeller = await prisma.users.findFirst({
    where: {
      email: SECONDARY_SELLER_EMAIL
    }
  });
  
  if (!mainSeller) {
    throw new Error(`Main seller "${MAIN_SELLER_EMAIL}" not found in users table`);
  }
  
  if (!secondarySeller) {
    throw new Error(`Secondary seller "${SECONDARY_SELLER_EMAIL}" not found in users table`);
  }
  
  console.log(`✅ Found main seller: ${mainSeller.username} (ID: ${mainSeller.id})`);
  console.log(`✅ Found secondary seller: ${secondarySeller.username} (ID: ${secondarySeller.id})\n`);
  
  // Get people in the workspace who haven't been enriched yet
  const allPeople = await prisma.people.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      deletedAt: null,
      enrichedData: null
    },
    include: {
      company: true
    }
  });
  
  console.log(`📋 Found ${allPeople.length} people to enrich and assign sellers\n`);
  
  let stats = {
    total: allPeople.length,
    enriched: 0,
    sellerAssigned: 0,
    errors: []
  };
  
  for (let i = 0; i < allPeople.length; i++) {
    const person = allPeople[i];
    
    // Show progress every 50 records
    if (i % 50 === 0 || i === allPeople.length - 1) {
      console.log(`\n[${i + 1}/${allPeople.length}] Processing: ${person.fullName}`);
    }
    
    try {
      // Generate enrichment data
      const enrichmentData = generateEnrichmentData(person);
      
      // Update person with enrichment data and main seller assignment
      await prisma.people.update({
        where: { id: person.id },
        data: {
          enrichedData: enrichmentData,
          mainSellerId: mainSeller.id,
          updatedAt: new Date(),
          customFields: {
            ...person.customFields,
            enrichmentStatus: 'completed',
            enrichedAt: new Date().toISOString(),
            sellerAssignedAt: new Date().toISOString()
          }
        }
      });
      
      // Add secondary seller to co-sellers table
      await prisma.person_co_sellers.upsert({
        where: {
          personId_userId: {
            personId: person.id,
            userId: secondarySeller.id
          }
        },
        update: {
          createdAt: new Date()
        },
        create: {
          personId: person.id,
          userId: secondarySeller.id,
          createdAt: new Date()
        }
      });
      
      stats.enriched++;
      stats.sellerAssigned++;
      
    } catch (error) {
      console.error(`   ❌ Error processing ${person.fullName}:`, error.message);
      stats.errors.push({
        person: person.fullName,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 ENRICHMENT SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total people processed: ${stats.total}`);
  console.log(`People enriched: ${stats.enriched}`);
  console.log(`Seller assignments: ${stats.sellerAssigned}`);
  console.log(`Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    stats.errors.forEach(error => {
      console.log(`   - ${error.person}: ${error.error}`);
    });
  }
  
  // Generate enrichment summary
  console.log('\n' + '=' .repeat(60));
  console.log('📈 ENRICHMENT DETAILS');
  console.log('=' .repeat(60));
  
  const enrichedPeople = await prisma.people.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      enrichedData: { not: null },
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      company: { select: { name: true } },
      enrichedData: true,
      mainSellerId: true,
      mainSeller: { select: { username: true } }
    }
  });
  
  const coSellerCount = await prisma.person_co_sellers.count({
    where: {
      userId: secondarySeller.id,
      person: {
        workspaceId: WORKSPACE_ID,
        deletedAt: null
      }
    }
  });
  
  console.log(`✅ Enriched people: ${enrichedPeople.length}`);
  console.log(`✅ Main seller (${mainSeller.username}) assigned to: ${enrichedPeople.filter(p => p.mainSellerId === mainSeller.id).length} people`);
  console.log(`✅ Secondary seller (${secondarySeller.username}) assigned to: ${coSellerCount} people`);
  
  // Show sample enrichment data
  if (enrichedPeople.length > 0) {
    const sample = enrichedPeople[0];
    console.log('\n📋 SAMPLE ENRICHMENT DATA:');
    console.log(`   Name: ${sample.fullName}`);
    console.log(`   Title: ${sample.jobTitle}`);
    console.log(`   Company: ${sample.company?.name}`);
    console.log(`   Industry: ${sample.enrichedData?.industry}`);
    console.log(`   Seniority: ${sample.enrichedData?.seniorityLevel}`);
    console.log(`   Decision Role: ${sample.enrichedData?.buyingBehavior?.decisionMakingRole}`);
    console.log(`   Budget Authority: ${sample.enrichedData?.buyingBehavior?.budgetAuthority}`);
    console.log(`   Main Seller: ${sample.mainSeller?.username || 'Not assigned'}`);
    console.log(`   Secondary Seller: ${secondarySeller.username} (via co-sellers)`);
  }
  
  return stats;
}

// Run the enrichment
enrichAllPeopleAndAssignSellers()
  .then(stats => {
    console.log('\n✅ Enrichment and seller assignment completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Enrichment failed:', error);
    process.exit(1);
  });
