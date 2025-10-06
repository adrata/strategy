#!/usr/bin/env node

/**
 * 🔒 CYBERSECURITY DEMO DATA GENERATOR
 * 
 * Generates comprehensive cybersecurity enterprise demo data including:
 * - 2,000 cybersecurity companies and enterprises
 * - 19,234 cybersecurity professionals with realistic job roles
 * - 20 cybersecurity sales professionals
 * - 50 speedrun items (top cybersecurity opportunities)
 * - All data tagged as demo data for easy identification
 * - Focus on realistic buyer groups for enterprise cybersecurity platforms
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Demo workspace and user configuration (resolved dynamically for safety)
async function resolveDemoWorkspaceId(prisma) {
  // Prefer explicit DEMO_WORKSPACE_ID env if provided
  if (process.env.DEMO_WORKSPACE_ID && process.env.DEMO_WORKSPACE_ID.trim() !== '') {
    return process.env.DEMO_WORKSPACE_ID.trim();
  }

  // Try slug 'demo' first
  const bySlug = await prisma.workspaces.findFirst({ where: { slug: 'demo' } });
  if (bySlug?.id) return bySlug.id;

  // Fallback: any workspace with name containing 'demo'
  const byName = await prisma.workspaces.findFirst({ where: { name: { contains: 'demo', mode: 'insensitive' } } });
  if (byName?.id) return byName.id;

  throw new Error('Demo workspace not found. Please create a workspace with slug "demo" or set DEMO_WORKSPACE_ID env.');
}

async function resolveDanUserId(prisma) {
  // Try to find Dan
  const dan = await prisma.users.findFirst({ where: { email: 'dan@adrata.com' } });
  if (dan?.id) return dan.id;
  // Fallback to demo user if present
  const demoUser = await prisma.users.findFirst({ where: { id: 'demo-user-2025' } });
  return demoUser?.id || null;
}

// Cybersecurity companies and enterprises (top 50 for speedrun, then 1,950 more)
const CYBERSECURITY_COMPANIES = [
  // Top 50 cybersecurity companies and enterprises
  { name: 'Microsoft', industry: 'Cybersecurity', revenue: 211915, employees: 221000, hq: 'Redmond, WA', domain: 'microsoft.com', focus: 'Enterprise Security' },
  { name: 'Cisco Systems', industry: 'Cybersecurity', revenue: 57000, employees: 83000, hq: 'San Jose, CA', domain: 'cisco.com', focus: 'Network Security' },
  { name: 'Palo Alto Networks', industry: 'Cybersecurity', revenue: 6000, employees: 15000, hq: 'Santa Clara, CA', domain: 'paloaltonetworks.com', focus: 'Firewall & Security' },
  { name: 'CrowdStrike', industry: 'Cybersecurity', revenue: 2200, employees: 8000, hq: 'Austin, TX', domain: 'crowdstrike.com', focus: 'Endpoint Protection' },
  { name: 'Fortinet', industry: 'Cybersecurity', revenue: 4000, employees: 12000, hq: 'Sunnyvale, CA', domain: 'fortinet.com', focus: 'Network Security' },
  { name: 'Check Point', industry: 'Cybersecurity', revenue: 2500, employees: 6000, hq: 'Tel Aviv, Israel', domain: 'checkpoint.com', focus: 'Firewall & VPN' },
  { name: 'Splunk', industry: 'Cybersecurity', revenue: 2700, employees: 8000, hq: 'San Francisco, CA', domain: 'splunk.com', focus: 'Security Analytics' },
  { name: 'Okta', industry: 'Cybersecurity', revenue: 1500, employees: 6000, hq: 'San Francisco, CA', domain: 'okta.com', focus: 'Identity & Access' },
  { name: 'Zscaler', industry: 'Cybersecurity', revenue: 1200, employees: 5000, hq: 'San Jose, CA', domain: 'zscaler.com', focus: 'Cloud Security' },
  { name: 'CyberArk', industry: 'Cybersecurity', revenue: 600, employees: 2000, hq: 'Newton, MA', domain: 'cyberark.com', focus: 'Privileged Access' },
  { name: 'Rapid7', industry: 'Cybersecurity', revenue: 500, employees: 2000, hq: 'Boston, MA', domain: 'rapid7.com', focus: 'Vulnerability Management' },
  { name: 'Tenable', industry: 'Cybersecurity', revenue: 600, employees: 2000, hq: 'Columbia, MD', domain: 'tenable.com', focus: 'Vulnerability Assessment' },
  { name: 'Proofpoint', industry: 'Cybersecurity', revenue: 1000, employees: 3000, hq: 'Sunnyvale, CA', domain: 'proofpoint.com', focus: 'Email Security' },
  { name: 'Mimecast', industry: 'Cybersecurity', revenue: 500, employees: 2000, hq: 'London, UK', domain: 'mimecast.com', focus: 'Email Security' },
  { name: 'FireEye', industry: 'Cybersecurity', revenue: 800, employees: 3000, hq: 'Milpitas, CA', domain: 'fireeye.com', focus: 'Threat Intelligence' },
  { name: 'Mandiant', industry: 'Cybersecurity', revenue: 400, employees: 1500, hq: 'Alexandria, VA', domain: 'mandiant.com', focus: 'Incident Response' },
  { name: 'Darktrace', industry: 'Cybersecurity', revenue: 300, employees: 2000, hq: 'Cambridge, UK', domain: 'darktrace.com', focus: 'AI Security' },
  { name: 'SentinelOne', industry: 'Cybersecurity', revenue: 200, employees: 1000, hq: 'Mountain View, CA', domain: 'sentinelone.com', focus: 'Endpoint Protection' },
  { name: 'Carbon Black', industry: 'Cybersecurity', revenue: 300, employees: 1000, hq: 'Waltham, MA', domain: 'carbonblack.com', focus: 'Endpoint Detection' },
  { name: 'Tanium', industry: 'Cybersecurity', revenue: 400, employees: 1000, hq: 'Emeryville, CA', domain: 'tanium.com', focus: 'Endpoint Management' },
  { name: 'Qualys', industry: 'Cybersecurity', revenue: 400, employees: 2000, hq: 'Foster City, CA', domain: 'qualys.com', focus: 'Vulnerability Management' },
  { name: 'Netskope', industry: 'Cybersecurity', revenue: 300, employees: 1500, hq: 'Santa Clara, CA', domain: 'netskope.com', focus: 'Cloud Security' },
  { name: 'Cloudflare', industry: 'Cybersecurity', revenue: 1000, employees: 3000, hq: 'San Francisco, CA', domain: 'cloudflare.com', focus: 'Web Security' },
  { name: 'Akamai', industry: 'Cybersecurity', revenue: 3500, employees: 10000, hq: 'Cambridge, MA', domain: 'akamai.com', focus: 'Web Security' },
  { name: 'Imperva', industry: 'Cybersecurity', revenue: 400, employees: 1500, hq: 'Redwood Shores, CA', domain: 'imperva.com', focus: 'Data Security' },
  { name: 'F5 Networks', industry: 'Cybersecurity', revenue: 2500, employees: 6000, hq: 'Seattle, WA', domain: 'f5.com', focus: 'Application Security' },
  { name: 'Symantec', industry: 'Cybersecurity', revenue: 5000, employees: 15000, hq: 'Mountain View, CA', domain: 'symantec.com', focus: 'Endpoint Protection' },
  { name: 'McAfee', industry: 'Cybersecurity', revenue: 3000, employees: 8000, hq: 'San Jose, CA', domain: 'mcafee.com', focus: 'Antivirus & Security' },
  { name: 'Trend Micro', industry: 'Cybersecurity', revenue: 1500, employees: 5000, hq: 'Tokyo, Japan', domain: 'trendmicro.com', focus: 'Endpoint Security' },
  { name: 'Sophos', industry: 'Cybersecurity', revenue: 800, employees: 4000, hq: 'Abingdon, UK', domain: 'sophos.com', focus: 'Endpoint & Network Security' },
  { name: 'Kaspersky', industry: 'Cybersecurity', revenue: 700, employees: 4000, hq: 'Moscow, Russia', domain: 'kaspersky.com', focus: 'Antivirus & Security' },
  { name: 'ESET', industry: 'Cybersecurity', revenue: 400, employees: 2000, hq: 'Bratislava, Slovakia', domain: 'eset.com', focus: 'Endpoint Security' },
  { name: 'Bitdefender', industry: 'Cybersecurity', revenue: 300, employees: 1500, hq: 'Bucharest, Romania', domain: 'bitdefender.com', focus: 'Antivirus & Security' },
  { name: 'Malwarebytes', industry: 'Cybersecurity', revenue: 200, employees: 800, hq: 'Santa Clara, CA', domain: 'malwarebytes.com', focus: 'Malware Protection' },
  { name: 'Webroot', industry: 'Cybersecurity', revenue: 100, employees: 500, hq: 'Broomfield, CO', domain: 'webroot.com', focus: 'Endpoint Security' },
  { name: 'Avast', industry: 'Cybersecurity', revenue: 800, employees: 2000, hq: 'Prague, Czech Republic', domain: 'avast.com', focus: 'Consumer Security' },
  { name: 'AVG', industry: 'Cybersecurity', revenue: 200, employees: 1000, hq: 'Amsterdam, Netherlands', domain: 'avg.com', focus: 'Consumer Security' },
  { name: 'Norton', industry: 'Cybersecurity', revenue: 1000, employees: 3000, hq: 'Tempe, AZ', domain: 'norton.com', focus: 'Consumer Security' },
  { name: 'Keeper Security', industry: 'Cybersecurity', revenue: 100, employees: 500, hq: 'Chicago, IL', domain: 'keepersecurity.com', focus: 'Password Management' },
  { name: '1Password', industry: 'Cybersecurity', revenue: 200, employees: 300, hq: 'Toronto, Canada', domain: '1password.com', focus: 'Password Management' },
  { name: 'LastPass', industry: 'Cybersecurity', revenue: 150, employees: 400, hq: 'Boston, MA', domain: 'lastpass.com', focus: 'Password Management' },
  { name: 'Dashlane', industry: 'Cybersecurity', revenue: 100, employees: 300, hq: 'New York, NY', domain: 'dashlane.com', focus: 'Password Management' },
  { name: 'Bitwarden', industry: 'Cybersecurity', revenue: 50, employees: 100, hq: 'Santa Barbara, CA', domain: 'bitwarden.com', focus: 'Password Management' },
  { name: 'Duo Security', industry: 'Cybersecurity', revenue: 200, employees: 800, hq: 'Ann Arbor, MI', domain: 'duo.com', focus: 'Multi-Factor Authentication' },
  { name: 'Auth0', industry: 'Cybersecurity', revenue: 300, employees: 1000, hq: 'Bellevue, WA', domain: 'auth0.com', focus: 'Identity Management' },
  { name: 'SailPoint', industry: 'Cybersecurity', revenue: 400, employees: 2000, hq: 'Austin, TX', domain: 'sailpoint.com', focus: 'Identity Governance' },
  { name: 'ForgeRock', industry: 'Cybersecurity', revenue: 200, employees: 1000, hq: 'San Francisco, CA', domain: 'forgerock.com', focus: 'Identity Management' },
  { name: 'Ping Identity', industry: 'Cybersecurity', revenue: 300, employees: 1000, hq: 'Denver, CO', domain: 'pingidentity.com', focus: 'Identity & Access' },
  { name: 'OneLogin', industry: 'Cybersecurity', revenue: 100, employees: 500, hq: 'San Francisco, CA', domain: 'onelogin.com', focus: 'Single Sign-On' },
  { name: 'Centrify', industry: 'Cybersecurity', revenue: 150, employees: 600, hq: 'Santa Clara, CA', domain: 'centrify.com', focus: 'Privileged Access' },
  { name: 'BeyondTrust', industry: 'Cybersecurity', revenue: 200, employees: 800, hq: 'Atlanta, GA', domain: 'beyondtrust.com', focus: 'Privileged Access' },
  { name: 'Thycotic', industry: 'Cybersecurity', revenue: 100, employees: 400, hq: 'Washington, DC', domain: 'thycotic.com', focus: 'Privileged Access' },
  { name: 'Hashicorp', industry: 'Cybersecurity', revenue: 300, employees: 1000, hq: 'San Francisco, CA', domain: 'hashicorp.com', focus: 'Secrets Management' },
  { name: 'Conjur', industry: 'Cybersecurity', revenue: 50, employees: 200, hq: 'Somerville, MA', domain: 'conjur.org', focus: 'Secrets Management' },
  { name: 'Vault', industry: 'Cybersecurity', revenue: 100, employees: 300, hq: 'San Francisco, CA', domain: 'vaultproject.io', focus: 'Secrets Management' }
];

// Cybersecurity job titles and buyer roles
const CYBERSECURITY_JOB_TITLES = [
  // C-Level Executives
  'Chief Information Security Officer (CISO)', 'Chief Technology Officer (CTO)', 'Chief Information Officer (CIO)',
  'Chief Risk Officer (CRO)', 'Chief Executive Officer (CEO)', 'Chief Operating Officer (COO)',
  
  // Security Leadership
  'VP of Information Security', 'VP of Cybersecurity', 'VP of IT Security', 'VP of Risk Management',
  'Director of Information Security', 'Director of Cybersecurity', 'Director of IT Security',
  'Director of Risk Management', 'Director of Compliance', 'Director of Security Operations',
  
  // Security Management
  'Security Manager', 'Cybersecurity Manager', 'IT Security Manager', 'Risk Manager',
  'Compliance Manager', 'Security Operations Manager', 'Incident Response Manager',
  'Vulnerability Management Manager', 'Identity & Access Management Manager',
  
  // Technical Security Roles
  'Security Architect', 'Cybersecurity Architect', 'Information Security Architect',
  'Security Engineer', 'Cybersecurity Engineer', 'Network Security Engineer',
  'Application Security Engineer', 'Cloud Security Engineer', 'DevSecOps Engineer',
  'Security Analyst', 'Cybersecurity Analyst', 'SOC Analyst', 'Threat Analyst',
  'Vulnerability Analyst', 'Risk Analyst', 'Compliance Analyst',
  
  // Specialized Security Roles
  'Penetration Tester', 'Ethical Hacker', 'Red Team Lead', 'Blue Team Lead',
  'Incident Response Specialist', 'Digital Forensics Specialist', 'Malware Analyst',
  'Threat Intelligence Analyst', 'Security Researcher', 'Cryptographer',
  
  // Identity & Access Management
  'IAM Specialist', 'Identity Management Engineer', 'Access Control Specialist',
  'Privileged Access Management Specialist', 'Single Sign-On Specialist',
  
  // Compliance & Risk
  'Compliance Officer', 'Risk Assessment Specialist', 'Audit Specialist',
  'Governance Specialist', 'Policy Specialist', 'Regulatory Compliance Specialist',
  
  // Sales & Business Development
  'Cybersecurity Sales Director', 'Security Sales Manager', 'Cybersecurity Account Executive',
  'Security Solutions Architect', 'Cybersecurity Business Development Manager',
  'Security Channel Manager', 'Cybersecurity Sales Engineer',
  
  // Product & Marketing
  'Cybersecurity Product Manager', 'Security Product Marketing Manager',
  'Cybersecurity Marketing Director', 'Security Brand Manager',
  
  // Operations & Support
  'Security Operations Center (SOC) Manager', 'SOC Team Lead', 'Security Operations Specialist',
  'Security Support Engineer', 'Cybersecurity Support Specialist'
];

// Cybersecurity seller names
const CYBERSECURITY_SELLER_NAMES = [
  'Alex Chen', 'Sarah Rodriguez', 'Michael Thompson', 'Jennifer Kim', 'David Wilson',
  'Lisa Garcia', 'James Martinez', 'Maria Johnson', 'Robert Davis', 'Emily Brown',
  'Christopher Lee', 'Amanda White', 'Daniel Taylor', 'Jessica Anderson', 'Matthew Thomas',
  'Ashley Jackson', 'Ryan Harris', 'Nicole Martin', 'Kevin Thompson', 'Stephanie Garcia'
];

// Cybersecurity buyer groups and personas
const CYBERSECURITY_BUYER_GROUPS = [
  { name: 'Security Leadership', roles: ['CISO', 'VP of Security', 'Director of Security'], influence: 'High', budget: 'Large' },
  { name: 'IT Leadership', roles: ['CTO', 'CIO', 'VP of IT'], influence: 'High', budget: 'Large' },
  { name: 'Security Operations', roles: ['SOC Manager', 'Security Engineer', 'Security Analyst'], influence: 'Medium', budget: 'Medium' },
  { name: 'Risk & Compliance', roles: ['CRO', 'Compliance Manager', 'Risk Analyst'], influence: 'High', budget: 'Medium' },
  { name: 'Development Teams', roles: ['DevSecOps Engineer', 'Security Architect', 'Application Security Engineer'], influence: 'Medium', budget: 'Medium' },
  { name: 'Executive Leadership', roles: ['CEO', 'COO', 'Board Members'], influence: 'Very High', budget: 'Very Large' },
  { name: 'Procurement', roles: ['Procurement Manager', 'Vendor Manager', 'Contract Specialist'], influence: 'Medium', budget: 'Large' },
  { name: 'Legal & Compliance', roles: ['General Counsel', 'Legal Director', 'Compliance Officer'], influence: 'High', budget: 'Medium' }
];

async function generateCybersecurityDemoData() {
  try {
    console.log('🔒 Starting cybersecurity demo data generation...\n');

    // Resolve safe targets
    const DEMO_WORKSPACE_ID = await resolveDemoWorkspaceId(prisma);
    const OWNER_USER_ID = await resolveDanUserId(prisma);
    console.log('🔐 Target workspace:', DEMO_WORKSPACE_ID, 'ownerUser:', OWNER_USER_ID || 'none');

    // Check if demo data already exists
    const existingCompanies = await prisma.companies.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        tags: { has: 'demo-data' }
      }
    });
    
    if (existingCompanies > 0) {
      console.log(`⚠️  Demo data already exists (${existingCompanies} companies found). Skipping generation.`);
      console.log('🎉 Demo data is ready to use!');
      return;
    }

    // 1. Create 2,000 cybersecurity companies
    console.log('🏢 Creating 2,000 cybersecurity companies...');
    const companies = [];
    
    for (let i = 0; i < 2000; i++) {
      const company = CYBERSECURITY_COMPANIES[i % CYBERSECURITY_COMPANIES.length];
      const companyData = {
        id: `cybersecurity-company-${i + 1}`,
        workspaceId: DEMO_WORKSPACE_ID,
        name: company.name, // Use clean company names without random numbers
        industry: company.industry,
        revenue: company.revenue + (Math.random() * 1000 - 500), // Add some variation
        size: `${company.employees + Math.floor(Math.random() * 1000 - 500)}`, // Convert to string for size field
        city: company.hq.split(',')[0], // Extract city from headquarters
        state: company.hq.split(',')[1]?.trim(), // Extract state from headquarters
        country: company.hq.includes('UK') ? 'United Kingdom' : 
                company.hq.includes('Israel') ? 'Israel' :
                company.hq.includes('Japan') ? 'Japan' :
                company.hq.includes('Russia') ? 'Russia' :
                company.hq.includes('Slovakia') ? 'Slovakia' :
                company.hq.includes('Romania') ? 'Romania' :
                company.hq.includes('Canada') ? 'Canada' :
                company.hq.includes('Netherlands') ? 'Netherlands' :
                company.hq.includes('Czech Republic') ? 'Czech Republic' : 'United States',
        website: company.domain,
        description: `Cybersecurity company focused on ${company.focus}`,
        // Demo data tags
        tags: ['demo-data', 'cybersecurity', 'enterprise-security'],
        assignedUserId: OWNER_USER_ID,
        // Store seller relationship in customFields for navigation
        customFields: {
          sellerId: `cybersecurity-seller-${Math.floor(i / 100) + 1}`, // Each seller manages 100 companies
          navigationContext: 'seller-companies',
          focus: company.focus,
          originalEmployees: company.employees
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      companies.push(companyData);
    }

    // Insert companies in batches
    for (let i = 0; i < companies.length; i += 100) {
      const batch = companies.slice(i, i + 100);
      await prisma.companies.createMany({ data: batch });
      console.log(`✅ Created companies ${i + 1}-${Math.min(i + 100, companies.length)}`);
    }

    // 2. Create 19,234 cybersecurity professionals
    console.log('👥 Creating 19,234 cybersecurity professionals...');
    const people = [];
    
    for (let i = 0; i < 19234; i++) {
      const company = companies[i % companies.length];
      const jobTitle = CYBERSECURITY_JOB_TITLES[Math.floor(Math.random() * CYBERSECURITY_JOB_TITLES.length)];
      const firstName = ['Alex', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'James', 'Maria', 'Robert', 'Emily', 'Christopher', 'Amanda', 'Daniel', 'Jessica', 'Matthew', 'Ashley', 'Ryan', 'Nicole', 'Kevin', 'Stephanie'][Math.floor(Math.random() * 20)];
      const lastName = ['Chen', 'Rodriguez', 'Thompson', 'Kim', 'Wilson', 'Garcia', 'Martinez', 'Johnson', 'Davis', 'Brown', 'Lee', 'White', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'Harris', 'Martin', 'Thompson', 'Garcia'][Math.floor(Math.random() * 20)];
      
      const personData = {
        id: `cybersecurity-person-${i + 1}`,
        workspaceId: DEMO_WORKSPACE_ID,
        companyId: company.id,
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        jobTitle: jobTitle,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.website}`,
        phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        // Demo data tags
        tags: ['demo-data', 'cybersecurity', 'enterprise-professional'],
        assignedUserId: OWNER_USER_ID,
        // Store seller relationship in customFields for navigation
        customFields: {
          sellerId: company.customFields?.sellerId, // Inherit from company
          navigationContext: 'buyer-group',
          isBuyerGroupMember: true // 🆕 CRITICAL: Add buyer group membership for speedrun section
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      people.push(personData);
    }

    // Insert people in batches
    for (let i = 0; i < people.length; i += 100) {
      const batch = people.slice(i, i + 100);
      await prisma.people.createMany({ data: batch });
      console.log(`✅ Created people ${i + 1}-${Math.min(i + 100, people.length)}`);
    }

    // 3. Create 20 cybersecurity sellers
    console.log('💼 Creating 20 cybersecurity sellers...');
    const sellers = [];
    
    for (let i = 0; i < 20; i++) {
      const sellerName = CYBERSECURITY_SELLER_NAMES[i];
      const [firstName, lastName] = sellerName.split(' ');
      
      const sellerData = {
        id: `cybersecurity-seller-${i + 1}`,
        workspaceId: DEMO_WORKSPACE_ID,
        name: sellerName,
        firstName: firstName,
        lastName: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@adrata.com`,
        phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        title: 'Cybersecurity Sales Professional',
        department: 'Sales',
        // Demo data tags
        tags: ['demo-data', 'cybersecurity', 'sales-professional'],
        assignedUserId: OWNER_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      sellers.push(sellerData);
    }

    await prisma.sellers.createMany({ data: sellers });
    console.log('✅ Created 20 cybersecurity sellers');

    // 4. Create seller-company relationships for navigation flow
    console.log('🔗 Creating seller-company relationships...');
    const sellerCompanyRelations = [];
    
    // Each seller manages 100 companies (2000 companies / 20 sellers = 100 each)
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const startIndex = i * 100;
      const endIndex = Math.min(startIndex + 100, companies.length);
      
      for (let j = startIndex; j < endIndex; j++) {
        const company = companies[j];
        
        // Create a relationship record (we'll store this in the company's assignedUserId or use metadata)
        sellerCompanyRelations.push({
          sellerId: seller.id,
          companyId: company.id,
          relationship: 'manages',
          createdAt: new Date()
        });
      }
    }
    
    console.log(`✅ Created ${sellerCompanyRelations.length} seller-company relationships`);

    // 5. Create 50 speedrun items (top cybersecurity opportunities)
    console.log('⚡ Creating 50 speedrun items...');
    const speedrunItems = [];
    
    for (let i = 0; i < 50; i++) {
      const company = companies[i];
      const person = people[i * 10]; // Get a person from this company
      
      const speedrunData = {
        id: `cybersecurity-speedrun-${i + 1}`,
        workspaceId: DEMO_WORKSPACE_ID,
        firstName: person.firstName,
        lastName: person.lastName,
        fullName: person.fullName,
        email: person.email,
        company: company.name,
        jobTitle: person.jobTitle,
        status: ['new', 'qualified', 'proposal', 'negotiation', 'closed-won'][Math.floor(Math.random() * 5)],
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        estimatedValue: Math.floor(Math.random() * 500000) + 50000, // $50k - $550k
        description: `High-priority cybersecurity opportunity with ${company.name} focusing on ${company.focus}`,
        // Demo data tags
        tags: ['demo-data', 'cybersecurity', 'speedrun', 'high-priority'],
        assignedUserId: OWNER_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      speedrunItems.push(speedrunData);
    }

    await prisma.leads.createMany({ data: speedrunItems });
    console.log('✅ Created 50 speedrun items');

    console.log('\n🎉 Cybersecurity demo data generation complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Companies: 2,000 cybersecurity enterprises`);
    console.log(`   - People: 19,234 cybersecurity professionals`);
    console.log(`   - Sellers: 20 cybersecurity sales professionals`);
    console.log(`   - Speedrun: 50 high-priority opportunities`);
    console.log(`   - Seller-Company Relationships: ${sellerCompanyRelations.length} (100 companies per seller)`);
    console.log(`   - Navigation Flow: Seller List → Companies → Buyer Group → Person Record`);
    console.log(`   - All data tagged as 'demo-data' for easy identification`);

  } catch (error) {
    console.error('❌ Error generating cybersecurity demo data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the generator
generateCybersecurityDemoData();
