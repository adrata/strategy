#!/usr/bin/env node

/**
 * 🎯 POPULATE ADRATA TEST DATA
 * Adds 10,000 companies and 1,000 people to the existing 'adrata' workspace
 * for testing system performance with large datasets
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Sample data for realistic test data generation
const COMPANY_NAMES = [
  'TechCorp', 'InnovateLabs', 'DataFlow', 'CloudSync', 'NextGen', 'FutureSoft', 'DigitalEdge', 'SmartSolutions',
  'ProActive', 'EliteSystems', 'PrimeTech', 'AdvancedAI', 'QuantumLeap', 'CyberShield', 'NetWork', 'DataVault',
  'CloudFirst', 'TechBridge', 'InnovationHub', 'DigitalWorks', 'SmartCore', 'FutureTech', 'ProVision', 'EliteData',
  'QuantumSoft', 'CyberCore', 'NetSolutions', 'DataWorks', 'CloudTech', 'TechVision', 'InnovateCore', 'DigitalFirst',
  'SmartBridge', 'FutureCore', 'ProTech', 'EliteVision', 'QuantumWorks', 'CyberSoft', 'NetCore', 'DataVision',
  'CloudWorks', 'TechCore', 'InnovateSoft', 'DigitalCore', 'SmartWorks', 'FutureSoft', 'ProCore', 'EliteWorks'
];

const COMPANY_SUFFIXES = [
  'Inc', 'LLC', 'Corp', 'Ltd', 'Group', 'Systems', 'Technologies', 'Solutions', 'Services', 'Enterprises',
  'Partners', 'Associates', 'Holdings', 'International', 'Global', 'Digital', 'Software', 'Consulting', 'Analytics'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Energy',
  'Transportation', 'Media', 'Telecommunications', 'Automotive', 'Aerospace', 'Pharmaceuticals', 'Biotechnology',
  'Consulting', 'Legal Services', 'Marketing', 'E-commerce', 'SaaS', 'Cybersecurity', 'AI/ML', 'Blockchain',
  'Fintech', 'Edtech', 'Healthtech', 'Cleantech', 'Agtech', 'PropTech', 'InsurTech'
];

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
  'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
  'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
  'Kenneth', 'Laura', 'Kevin', 'Sarah', 'Brian', 'Kimberly', 'George', 'Deborah', 'Edward', 'Dorothy',
  'Ronald', 'Lisa', 'Timothy', 'Nancy', 'Jason', 'Karen', 'Jeffrey', 'Betty', 'Ryan', 'Helen',
  'Jacob', 'Sandra', 'Gary', 'Donna', 'Nicholas', 'Carol', 'Eric', 'Ruth', 'Jonathan', 'Sharon',
  'Stephen', 'Michelle', 'Larry', 'Laura', 'Justin', 'Sarah', 'Scott', 'Kimberly', 'Brandon', 'Deborah'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper'
];

const JOB_TITLES = [
  'CEO', 'CTO', 'CFO', 'COO', 'VP of Sales', 'VP of Marketing', 'VP of Engineering', 'VP of Operations',
  'Director of Sales', 'Director of Marketing', 'Director of Engineering', 'Director of Operations',
  'Sales Manager', 'Marketing Manager', 'Engineering Manager', 'Operations Manager', 'Product Manager',
  'Business Development Manager', 'Account Manager', 'Project Manager', 'Senior Developer', 'Developer',
  'Data Scientist', 'Data Analyst', 'UX Designer', 'UI Designer', 'DevOps Engineer', 'QA Engineer',
  'Sales Representative', 'Marketing Specialist', 'Business Analyst', 'Financial Analyst', 'HR Manager',
  'Customer Success Manager', 'Technical Writer', 'Solutions Architect', 'System Administrator',
  'Network Engineer', 'Security Engineer', 'Machine Learning Engineer', 'AI Researcher'
];

const DEPARTMENTS = [
  'Executive', 'Sales', 'Marketing', 'Engineering', 'Operations', 'Finance', 'Human Resources',
  'Customer Success', 'Product', 'Business Development', 'Legal', 'IT', 'Data Science', 'Design',
  'Quality Assurance', 'DevOps', 'Security', 'Research & Development', 'Strategy', 'Partnerships'
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
  'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
  'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit',
  'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
  'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs',
  'Raleigh', 'Miami', 'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa'
];

const STATES = [
  'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN',
  'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT', 'IA', 'NV',
  'AR', 'MS', 'KS', 'NM', 'NE', 'WV', 'ID', 'HI', 'NH', 'ME', 'RI', 'MT', 'DE', 'SD', 'ND', 'AK', 'VT', 'WY'
];

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Netherlands'];

const COMPANY_STATUSES = ['ACTIVE', 'PROSPECT', 'OPPORTUNITY', 'CLIENT'];
const PERSON_STATUSES = ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CLIENT'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateCompanyName() {
  const baseName = getRandomElement(COMPANY_NAMES);
  const suffix = getRandomElement(COMPANY_SUFFIXES);
  const number = Math.random() > 0.7 ? ` ${Math.floor(Math.random() * 1000)}` : '';
  return `${baseName}${number} ${suffix}`;
}

function generateEmail(firstName, lastName, companyName) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = getRandomElement(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateWorkEmail(firstName, lastName, companyName) {
  const cleanCompanyName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanCompanyName}.com`;
}

function generatePhone() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${number}`;
}

function generateLinkedInUrl(firstName, lastName) {
  return `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.floor(Math.random() * 1000)}`;
}

async function createCompanies(workspaceId, count = 10000) {
  console.log(`🏢 Creating ${count} companies...`);
  
  const companies = [];
  const batchSize = 100;
  
  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const currentBatchSize = Math.min(batchSize, count - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const companyName = generateCompanyName();
      const industry = getRandomElement(INDUSTRIES);
      const city = getRandomElement(CITIES);
      const state = getRandomElement(STATES);
      const country = getRandomElement(COUNTRIES);
      const status = getRandomElement(COMPANY_STATUSES);
      const priority = getRandomElement(PRIORITIES);
      
      const company = {
        workspaceId,
        name: companyName,
        legalName: companyName,
        description: `${companyName} is a leading company in the ${industry.toLowerCase()} industry, providing innovative solutions and services.`,
        website: `https://www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        email: `info@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: generatePhone(),
        address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Blvd'])}`,
        city,
        state,
        country,
        postalCode: (Math.floor(Math.random() * 90000) + 10000).toString(),
        industry,
        sector: industry,
        size: getRandomElement(['Startup', 'Small', 'Medium', 'Large', 'Enterprise']),
        revenue: Math.floor(Math.random() * 1000000000) + 1000000,
        currency: 'USD',
        employeeCount: Math.floor(Math.random() * 10000) + 10,
        foundedYear: Math.floor(Math.random() * 50) + 1974,
        domain: `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        status,
        priority,
        tags: getRandomElements(['enterprise', 'startup', 'tech', 'saas', 'b2b', 'b2c', 'ai', 'cloud', 'data'], Math.floor(Math.random() * 4) + 1),
        globalRank: Math.floor(Math.random() * 1000) + 1,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        updatedAt: new Date()
      };
      
      batch.push(company);
    }
    
    try {
      const createdCompanies = await prisma.companies.createMany({
        data: batch,
        skipDuplicates: true
      });
      companies.push(...batch);
      console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}: ${createdCompanies.count} companies`);
    } catch (error) {
      console.error(`❌ Error creating company batch:`, error.message);
    }
  }
  
  console.log(`✅ Created ${companies.length} companies total`);
  return companies;
}

async function createPeople(workspaceId, companies, count = 1000) {
  console.log(`👥 Creating ${count} people...`);
  
  const people = [];
  const batchSize = 100;
  
  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const currentBatchSize = Math.min(batchSize, count - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const jobTitle = getRandomElement(JOB_TITLES);
      const department = getRandomElement(DEPARTMENTS);
      const company = getRandomElement(companies);
      const status = getRandomElement(PERSON_STATUSES);
      const priority = getRandomElement(PRIORITIES);
      const city = getRandomElement(CITIES);
      const state = getRandomElement(STATES);
      const country = getRandomElement(COUNTRIES);
      
      const person = {
        workspaceId,
        companyId: company.id,
        firstName,
        lastName,
        fullName,
        displayName: fullName,
        salutation: getRandomElement(['Mr.', 'Ms.', 'Dr.', 'Prof.']),
        jobTitle,
        title: jobTitle,
        department,
        seniority: getRandomElement(['Entry', 'Mid', 'Senior', 'Executive', 'C-Level']),
        email: generateEmail(firstName, lastName, company.name),
        workEmail: generateWorkEmail(firstName, lastName, company.name),
        phone: generatePhone(),
        mobilePhone: generatePhone(),
        workPhone: generatePhone(),
        linkedinUrl: generateLinkedInUrl(firstName, lastName),
        address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Blvd'])}`,
        city,
        state,
        country,
        postalCode: (Math.floor(Math.random() * 90000) + 10000).toString(),
        gender: getRandomElement(['Male', 'Female', 'Other']),
        bio: `${fullName} is a ${jobTitle.toLowerCase()} at ${company.name}, specializing in ${department.toLowerCase()} with extensive experience in the industry.`,
        status,
        priority,
        source: getRandomElement(['LinkedIn', 'Website', 'Referral', 'Cold Outreach', 'Event', 'Social Media']),
        tags: getRandomElements(['decision-maker', 'influencer', 'champion', 'gatekeeper', 'budget-holder'], Math.floor(Math.random() * 3) + 1),
        preferredLanguage: 'en',
        timezone: getRandomElement(['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver']),
        emailVerified: Math.random() > 0.3,
        phoneVerified: Math.random() > 0.5,
        engagementScore: Math.random() * 100,
        globalRank: Math.floor(Math.random() * 1000) + 1,
        companyRank: Math.floor(Math.random() * 100) + 1,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        updatedAt: new Date()
      };
      
      batch.push(person);
    }
    
    try {
      const createdPeople = await prisma.people.createMany({
        data: batch,
        skipDuplicates: true
      });
      people.push(...batch);
      console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}: ${createdPeople.count} people`);
    } catch (error) {
      console.error(`❌ Error creating people batch:`, error.message);
    }
  }
  
  console.log(`✅ Created ${people.length} people total`);
  return people;
}

async function main() {
  try {
    console.log('🚀 Starting Adrata test data population...');
    
    // Find the existing 'adrata' workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'adrata' },
          { slug: 'adrata' }
        ]
      }
    });
    
    if (!workspace) {
      console.error('❌ Adrata workspace not found. Please ensure the workspace exists.');
      process.exit(1);
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    
    // Check if data already exists
    const existingCompanies = await prisma.companies.count({
      where: { workspaceId: workspace.id }
    });
    
    const existingPeople = await prisma.people.count({
      where: { workspaceId: workspace.id }
    });
    
    console.log(`📊 Current data in workspace:`);
    console.log(`   Companies: ${existingCompanies}`);
    console.log(`   People: ${existingPeople}`);
    
    if (existingCompanies > 0 || existingPeople > 0) {
      console.log('⚠️  Workspace already has data. This script will add additional records.');
    }
    
    // Create companies
    const companies = await createCompanies(workspace.id, 10000);
    
    if (companies.length === 0) {
      console.log('❌ No companies were created. Cannot create people without companies.');
      process.exit(1);
    }
    
    // Create people
    const people = await createPeople(workspace.id, companies, 1000);
    
    // Final summary
    const finalCompanyCount = await prisma.companies.count({
      where: { workspaceId: workspace.id }
    });
    
    const finalPeopleCount = await prisma.people.count({
      where: { workspaceId: workspace.id }
    });
    
    console.log('\n🎉 Test data population complete!');
    console.log(`📊 Final counts in ${workspace.name} workspace:`);
    console.log(`   Companies: ${finalCompanyCount}`);
    console.log(`   People: ${finalPeopleCount}`);
    console.log(`   Total records: ${finalCompanyCount + finalPeopleCount}`);
    
  } catch (error) {
    console.error('❌ Error populating test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
