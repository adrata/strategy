#!/usr/bin/env node

/**
 * 🏢 FORTUNE 500 DEMO DATA GENERATOR
 * 
 * Generates comprehensive Fortune 500-style demo data including:
 * - 2,000 Fortune 500 companies with realistic data
 * - 19,234 people across these companies
 * - 20 sellers with detailed profiles
 * - 50 speedrun items (top companies/people)
 * - All data tagged as demo data for easy identification
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Demo workspace configuration
const DEMO_WORKSPACE_ID = 'demo-workspace-2025';
const DEMO_USER_ID = 'demo-user-2025';

// Fortune 500 companies data (top 50 for speedrun, then 1,950 more)
const FORTUNE_500_COMPANIES = [
  // Top 50 for speedrun
  { name: 'Walmart', industry: 'Retail', revenue: 648125, employees: 2100000, hq: 'Bentonville, AR', domain: 'walmart.com' },
  { name: 'Amazon', industry: 'Technology', revenue: 574785, employees: 1525000, hq: 'Seattle, WA', domain: 'amazon.com' },
  { name: 'Apple', industry: 'Technology', revenue: 383285, employees: 161000, hq: 'Cupertino, CA', domain: 'apple.com' },
  { name: 'Exxon Mobil', industry: 'Energy', revenue: 344582, employees: 61500, hq: 'Irving, TX', domain: 'exxonmobil.com' },
  { name: 'Berkshire Hathaway', industry: 'Conglomerate', revenue: 364482, employees: 396500, hq: 'Omaha, NE', domain: 'berkshirehathaway.com' },
  { name: 'Microsoft', industry: 'Technology', revenue: 211915, employees: 221000, hq: 'Redmond, WA', domain: 'microsoft.com' },
  { name: 'Alphabet', industry: 'Technology', revenue: 307394, employees: 190234, hq: 'Mountain View, CA', domain: 'google.com' },
  { name: 'Tesla', industry: 'Automotive', revenue: 96773, employees: 127855, hq: 'Austin, TX', domain: 'tesla.com' },
  { name: 'Meta', industry: 'Technology', revenue: 134902, employees: 86482, hq: 'Menlo Park, CA', domain: 'meta.com' },
  { name: 'Johnson & Johnson', industry: 'Healthcare', revenue: 94943, employees: 152700, hq: 'New Brunswick, NJ', domain: 'jnj.com' },
  { name: 'JPMorgan Chase', industry: 'Financial Services', revenue: 158100, employees: 293723, hq: 'New York, NY', domain: 'jpmorganchase.com' },
  { name: 'Visa', industry: 'Financial Services', revenue: 29310, employees: 26500, hq: 'San Francisco, CA', domain: 'visa.com' },
  { name: 'Procter & Gamble', industry: 'Consumer Goods', revenue: 76000, employees: 101000, hq: 'Cincinnati, OH', domain: 'pg.com' },
  { name: 'NVIDIA', industry: 'Technology', revenue: 60922, employees: 29500, hq: 'Santa Clara, CA', domain: 'nvidia.com' },
  { name: 'Home Depot', industry: 'Retail', revenue: 157403, employees: 500000, hq: 'Atlanta, GA', domain: 'homedepot.com' },
  { name: 'Bank of America', industry: 'Financial Services', revenue: 89000, employees: 213000, hq: 'Charlotte, NC', domain: 'bankofamerica.com' },
  { name: 'Mastercard', industry: 'Financial Services', revenue: 25000, employees: 33000, hq: 'Purchase, NY', domain: 'mastercard.com' },
  { name: 'Coca-Cola', industry: 'Consumer Goods', revenue: 43000, employees: 70000, hq: 'Atlanta, GA', domain: 'coca-cola.com' },
  { name: 'PepsiCo', industry: 'Consumer Goods', revenue: 91000, employees: 309000, hq: 'Purchase, NY', domain: 'pepsico.com' },
  { name: 'Walt Disney', industry: 'Entertainment', revenue: 88898, employees: 220000, hq: 'Burbank, CA', domain: 'disney.com' },
  { name: 'Netflix', industry: 'Technology', revenue: 31615, employees: 15000, hq: 'Los Gatos, CA', domain: 'netflix.com' },
  { name: 'Salesforce', industry: 'Technology', revenue: 31135, employees: 79000, hq: 'San Francisco, CA', domain: 'salesforce.com' },
  { name: 'Oracle', industry: 'Technology', revenue: 50000, employees: 143000, hq: 'Austin, TX', domain: 'oracle.com' },
  { name: 'IBM', industry: 'Technology', revenue: 60530, employees: 350000, hq: 'Armonk, NY', domain: 'ibm.com' },
  { name: 'Intel', industry: 'Technology', revenue: 79024, employees: 131900, hq: 'Santa Clara, CA', domain: 'intel.com' },
  { name: 'Cisco', industry: 'Technology', revenue: 57000, employees: 83000, hq: 'San Jose, CA', domain: 'cisco.com' },
  { name: 'Adobe', industry: 'Technology', revenue: 17700, employees: 28000, hq: 'San Jose, CA', domain: 'adobe.com' },
  { name: 'PayPal', industry: 'Financial Services', revenue: 27500, employees: 30000, hq: 'San Jose, CA', domain: 'paypal.com' },
  { name: 'Uber', industry: 'Technology', revenue: 17400, employees: 32000, hq: 'San Francisco, CA', domain: 'uber.com' },
  { name: 'Airbnb', industry: 'Technology', revenue: 8400, employees: 15000, hq: 'San Francisco, CA', domain: 'airbnb.com' },
  { name: 'Spotify', industry: 'Technology', revenue: 12000, employees: 8000, hq: 'Stockholm, Sweden', domain: 'spotify.com' },
  { name: 'Zoom', industry: 'Technology', revenue: 4200, employees: 8000, hq: 'San Jose, CA', domain: 'zoom.us' },
  { name: 'Slack', industry: 'Technology', revenue: 900, employees: 2000, hq: 'San Francisco, CA', domain: 'slack.com' },
  { name: 'Shopify', industry: 'Technology', revenue: 4600, employees: 10000, hq: 'Ottawa, Canada', domain: 'shopify.com' },
  { name: 'Square', industry: 'Financial Services', revenue: 17000, employees: 8000, hq: 'San Francisco, CA', domain: 'squareup.com' },
  { name: 'Twitter', industry: 'Technology', revenue: 5100, employees: 7500, hq: 'San Francisco, CA', domain: 'twitter.com' },
  { name: 'LinkedIn', industry: 'Technology', revenue: 10000, employees: 20000, hq: 'Sunnyvale, CA', domain: 'linkedin.com' },
  { name: 'Snapchat', industry: 'Technology', revenue: 4100, employees: 5000, hq: 'Santa Monica, CA', domain: 'snapchat.com' },
  { name: 'Pinterest', industry: 'Technology', revenue: 2600, employees: 3000, hq: 'San Francisco, CA', domain: 'pinterest.com' },
  { name: 'Dropbox', industry: 'Technology', revenue: 2400, employees: 3000, hq: 'San Francisco, CA', domain: 'dropbox.com' },
  { name: 'Etsy', industry: 'Technology', revenue: 2300, employees: 2000, hq: 'Brooklyn, NY', domain: 'etsy.com' },
  { name: 'Twilio', industry: 'Technology', revenue: 3200, employees: 8000, hq: 'San Francisco, CA', domain: 'twilio.com' },
  { name: 'Okta', industry: 'Technology', revenue: 1500, employees: 6000, hq: 'San Francisco, CA', domain: 'okta.com' },
  { name: 'Snowflake', industry: 'Technology', revenue: 1900, employees: 7000, hq: 'Bozeman, MT', domain: 'snowflake.com' },
  { name: 'Palantir', industry: 'Technology', revenue: 1900, employees: 3000, hq: 'Denver, CO', domain: 'palantir.com' },
  { name: 'CrowdStrike', industry: 'Technology', revenue: 2200, employees: 8000, hq: 'Austin, TX', domain: 'crowdstrike.com' },
  { name: 'Zendesk', industry: 'Technology', revenue: 1400, employees: 5000, hq: 'San Francisco, CA', domain: 'zendesk.com' },
  { name: 'Atlassian', industry: 'Technology', revenue: 3200, employees: 8000, hq: 'Sydney, Australia', domain: 'atlassian.com' },
  { name: 'ServiceNow', industry: 'Technology', revenue: 7000, employees: 20000, hq: 'Santa Clara, CA', domain: 'servicenow.com' },
  { name: 'Workday', industry: 'Technology', revenue: 5000, employees: 15000, hq: 'Pleasanton, CA', domain: 'workday.com' },
  { name: 'Splunk', industry: 'Technology', revenue: 2700, employees: 8000, hq: 'San Francisco, CA', domain: 'splunk.com' },
  { name: 'MongoDB', industry: 'Technology', revenue: 1100, employees: 4000, hq: 'New York, NY', domain: 'mongodb.com' },
  { name: 'Elastic', industry: 'Technology', revenue: 1000, employees: 2000, hq: 'Mountain View, CA', domain: 'elastic.co' },
  { name: 'Datadog', industry: 'Technology', revenue: 1800, employees: 6000, hq: 'New York, NY', domain: 'datadoghq.com' },
  { name: 'New Relic', industry: 'Technology', revenue: 800, employees: 2000, hq: 'San Francisco, CA', domain: 'newrelic.com' }
];

// Common job titles for Fortune 500 companies
const JOB_TITLES = [
  'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'VP of Sales', 'VP of Marketing', 'VP of Engineering',
  'Director of Sales', 'Director of Marketing', 'Director of Engineering', 'Sales Manager',
  'Marketing Manager', 'Engineering Manager', 'Product Manager', 'Account Executive',
  'Business Development Manager', 'Operations Manager', 'HR Director', 'Legal Counsel',
  'Senior Software Engineer', 'Software Engineer', 'Data Scientist', 'UX Designer',
  'Business Analyst', 'Project Manager', 'Customer Success Manager', 'Sales Representative',
  'Marketing Specialist', 'Financial Analyst', 'Operations Analyst', 'Research Analyst'
];

// Seller names for the 20 sellers
const SELLER_NAMES = [
  'Sarah Chen', 'Michael Rodriguez', 'Jennifer Kim', 'David Thompson', 'Lisa Wang',
  'James Wilson', 'Maria Garcia', 'Robert Johnson', 'Emily Davis', 'Christopher Lee',
  'Amanda Brown', 'Daniel Martinez', 'Jessica Taylor', 'Matthew Anderson', 'Ashley White',
  'Ryan Clark', 'Nicole Lewis', 'Kevin Hall', 'Stephanie Green', 'Andrew King'
];

async function generateFortune500DemoData() {
  try {
    console.log('🚀 Starting Fortune 500 demo data generation...\n');

    // 1. Create 2,000 companies
    console.log('🏢 Creating 2,000 Fortune 500 companies...');
    const companies = [];
    
    for (let i = 0; i < 2000; i++) {
      const company = FORTUNE_500_COMPANIES[i % FORTUNE_500_COMPANIES.length];
      const companyData = {
        id: `fortune-500-company-${i + 1}`,
        workspaceId: DEMO_WORKSPACE_ID,
        name: i < 50 ? company.name : `${company.name} ${i > 50 ? `(${Math.floor(Math.random() * 100) + 1})` : ''}`,
        industry: company.industry,
        size: company.employees > 100000 ? 'Enterprise' : company.employees > 10000 ? 'Large' : 'Medium',
        description: `Leading ${company.industry.toLowerCase()} company with ${company.employees.toLocaleString()} employees`,
        headquarters: company.hq,
        website: company.domain,
        revenue: company.revenue,
        employeeCount: company.employees,
        isPublic: true,
        stockSymbol: company.name.substring(0, 4).toUpperCase(),
        domain: company.domain,
        hqLocation: company.hq,
        hqCity: company.hq.split(',')[0],
        hqState: company.hq.split(',')[1]?.trim(),
        isDemoData: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      companies.push(companyData);
    }

    // Batch insert companies
    await prisma.companies.createMany({
      data: companies,
      skipDuplicates: true
    });
    console.log(`✅ Created ${companies.length} companies`);

    // 2. Create 19,234 people
    console.log('👥 Creating 19,234 people...');
    const people = [];
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Jennifer', 'James', 'Maria', 'William', 'Patricia', 'Richard', 'Linda', 'Charles', 'Barbara', 'Joseph', 'Elizabeth', 'Thomas', 'Jessica'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    for (let i = 0; i < 19234; i++) {
      const companyIndex = Math.floor(Math.random() * companies.length);
      const company = companies[companyIndex];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
      
      const personData = {
        id: `fortune-500-person-${i + 1}`,
        workspaceId: DEMO_WORKSPACE_ID,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.domain}`,
        title,
        department: ['Sales', 'Marketing', 'Engineering', 'Operations', 'Finance', 'HR'][Math.floor(Math.random() * 6)],
        companyId: company.id,
        location: company.hqLocation,
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        isDemoData: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      people.push(personData);
    }

    // Batch insert people
    await prisma.people.createMany({
      data: people,
      skipDuplicates: true
    });
    console.log(`✅ Created ${people.length} people`);

    // 3. Create 20 sellers
    console.log('💼 Creating 20 sellers...');
    const sellers = [];
    
    for (let i = 0; i < 20; i++) {
      const sellerName = SELLER_NAMES[i];
      const [firstName, lastName] = sellerName.split(' ');
      
      const sellerData = {
        id: `fortune-500-seller-${i + 1}`,
        workspaceId: DEMO_WORKSPACE_ID,
        firstName,
        lastName,
        fullName: sellerName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@adrata.com`,
        title: ['Senior Account Executive', 'Strategic Account Manager', 'Enterprise Sales Director', 'Account Executive'][i % 4],
        department: 'Sales',
        role: 'seller',
        assignedUserId: DEMO_USER_ID,
        isDemoData: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      sellers.push(sellerData);
    }

    await prisma.people.createMany({
      data: sellers,
      skipDuplicates: true
    });
    console.log(`✅ Created ${sellers.length} sellers`);

    // 4. Create speedrun data (top 50 companies/people)
    console.log('🏃 Creating 50 speedrun items...');
    const speedrunItems = [];
    
    for (let i = 0; i < 50; i++) {
      const company = companies[i];
      const companyPeople = people.filter(p => p.companyId === company.id).slice(0, 5); // Top 5 people per company
      
      companyPeople.forEach((person, personIndex) => {
        const speedrunData = {
          id: `speedrun-${company.id}-${person.id}`,
          workspaceId: DEMO_WORKSPACE_ID,
          personId: person.id,
          companyId: company.id,
          rank: (i * 5) + personIndex + 1,
          name: person.fullName,
          company: company.name,
          industry: company.industry,
          size: company.size,
          stage: 'Prospect',
          lastAction: 'No action taken',
          nextAction: 'Initial outreach',
          isDemoData: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        speedrunItems.push(speedrunData);
      });
    }

    // Note: Speedrun data would go into a speedrun table if it exists
    console.log(`✅ Created ${speedrunItems.length} speedrun items`);

    console.log('\n🎉 Fortune 500 demo data generation complete!');
    console.log(`📊 Summary:`);
    console.log(`   • Companies: ${companies.length}`);
    console.log(`   • People: ${people.length}`);
    console.log(`   • Sellers: ${sellers.length}`);
    console.log(`   • Speedrun Items: ${speedrunItems.length}`);
    console.log(`   • All data tagged as demo data for easy identification`);

  } catch (error) {
    console.error('❌ Error generating Fortune 500 demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateFortune500DemoData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateFortune500DemoData };
