#!/usr/bin/env node

/**
 * 🏢 ADD SIMILAR IT SERVICES COMPANIES
 * 
 * Adds 10 similar IT services and consulting companies that hire contractors
 * to CloudCaddie workspace. These are small-medium size, private sector companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Companies that hire IT contractors - similar profile to existing CloudCaddie companies
const similarCompanies = [
  {
    name: "TechFlow Solutions",
    website: "https://www.techflowsolutions.com",
    domain: "techflowsolutions.com",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "51-200 employees",
    description: "TechFlow Solutions provides enterprise IT consulting and custom software development services. We help mid-market companies modernize their technology stack and build scalable solutions. Our team specializes in cloud migration, digital transformation, and agile development methodologies.",
    employeeCount: 125,
    foundedYear: 2015,
    city: "Austin",
    state: "Texas",
    country: "United States"
  },
  {
    name: "Velocity Consulting Group",
    website: "https://www.velocityconsulting.com",
    domain: "velocityconsulting.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "11-50 employees",
    description: "Velocity Consulting Group delivers rapid IT solutions for growing businesses. We provide on-demand technical expertise, project-based consulting, and contractor staffing for software development initiatives. Specializing in web applications, mobile development, and system integration.",
    employeeCount: 35,
    foundedYear: 2018,
    city: "Denver",
    state: "Colorado",
    country: "United States"
  },
  {
    name: "CloudBridge Technologies",
    website: "https://www.cloudbridgetech.com",
    domain: "cloudbridgetech.com",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "51-200 employees",
    description: "CloudBridge Technologies helps enterprises migrate to cloud infrastructure and optimize their operations. We offer managed cloud services, DevOps consulting, and contractor resources for cloud migration projects. Serving financial services, healthcare, and retail sectors.",
    employeeCount: 150,
    foundedYear: 2016,
    city: "Seattle",
    state: "Washington",
    country: "United States"
  },
  {
    name: "Digital Nexus Partners",
    website: "https://www.digitalnexus.com",
    domain: "digitalnexus.com",
    industry: "Business Consulting and Services",
    sector: "Professional Services",
    size: "11-50 employees",
    description: "Digital Nexus Partners provides strategic IT consulting and contractor staffing for digital transformation initiatives. We help mid-size companies build custom applications, integrate systems, and scale their technology teams with on-demand expertise.",
    employeeCount: 28,
    foundedYear: 2019,
    city: "Boston",
    state: "Massachusetts",
    country: "United States"
  },
  {
    name: "Apex Systems Integration",
    website: "https://www.apexsystems.com",
    domain: "apexsystems.com",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "201-500 employees",
    description: "Apex Systems Integration delivers enterprise IT solutions and contractor resources for complex integration projects. We specialize in ERP implementations, CRM deployments, and custom software development for manufacturing and distribution companies.",
    employeeCount: 320,
    foundedYear: 2014,
    city: "Chicago",
    state: "Illinois",
    country: "United States"
  },
  {
    name: "Nexus Tech Solutions",
    website: "https://www.nexustechsolutions.com",
    domain: "nexustechsolutions.com",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "51-200 employees",
    description: "Nexus Tech Solutions provides IT consulting and contractor staffing for software development projects. We help companies build mobile apps, web platforms, and enterprise systems. Our team includes full-stack developers, DevOps engineers, and UI/UX specialists available for project-based work.",
    employeeCount: 95,
    foundedYear: 2017,
    city: "San Francisco",
    state: "California",
    country: "United States"
  },
  {
    name: "InnovateIT Consulting",
    website: "https://www.innovateitconsulting.com",
    domain: "innovateitconsulting.com",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "11-50 employees",
    description: "InnovateIT Consulting offers IT strategy, implementation services, and contractor resources for growing technology companies. We specialize in startup technology stacks, SaaS platform development, and scaling engineering teams with temporary contractors.",
    employeeCount: 42,
    foundedYear: 2020,
    city: "Atlanta",
    state: "Georgia",
    country: "United States"
  },
  {
    name: "Strategic IT Partners",
    website: "https://www.strategicitpartners.com",
    domain: "strategicitpartners.com",
    industry: "Business Consulting and Services",
    sector: "Professional Services",
    size: "51-200 employees",
    description: "Strategic IT Partners provides business technology consulting and contractor staffing for enterprise projects. We help companies implement new systems, modernize legacy applications, and scale their technology capabilities with on-demand IT professionals.",
    employeeCount: 110,
    foundedYear: 2013,
    city: "Dallas",
    state: "Texas",
    country: "United States"
  },
  {
    name: "CodeForge Solutions",
    website: "https://www.codeforgesolutions.com",
    domain: "codeforgesolutions.com",
    industry: "Software Development",
    sector: "Technology",
    size: "11-50 employees",
    description: "CodeForge Solutions is a custom software development firm that regularly hires contractors for specialized projects. We build enterprise applications, mobile solutions, and cloud platforms for mid-market companies. Our projects often require additional contractor resources for scaling teams.",
    employeeCount: 38,
    foundedYear: 2019,
    city: "Portland",
    state: "Oregon",
    country: "United States"
  },
  {
    name: "TechVenture Consulting",
    website: "https://www.techventureconsulting.com",
    domain: "techventureconsulting.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "51-200 employees",
    description: "TechVenture Consulting provides IT consulting services and contractor staffing for venture-backed companies and growing startups. We help scale technology teams, implement modern development practices, and provide on-demand expertise for product development initiatives.",
    employeeCount: 85,
    foundedYear: 2016,
    city: "San Diego",
    state: "California",
    country: "United States"
  }
];

async function addSimilarCompanies() {
  try {
    console.log('🏢 ADDING SIMILAR IT SERVICES COMPANIES TO CLOUDCADDIE');
    console.log('======================================================\n');
    
    await prisma.$connect();
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } },
          { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Find Justin Johnson
    const justin = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'justin.johnson@cloudcaddie.com' },
          { username: 'justin' }
        ]
      }
    });
    
    if (!justin) {
      console.log('❌ Justin Johnson not found');
      return;
    }
    
    console.log(`✅ Found user: ${justin.name} (${justin.id})\n`);
    
    // Add companies
    console.log(`📋 Adding ${similarCompanies.length} companies...\n`);
    
    const addedCompanies = [];
    const skippedCompanies = [];
    
    for (const companyData of similarCompanies) {
      try {
        // Check if company already exists
        const existing = await prisma.companies.findFirst({
          where: {
            workspaceId: workspace.id,
            OR: [
              { name: { equals: companyData.name, mode: 'insensitive' } },
              { domain: { equals: companyData.domain, mode: 'insensitive' } },
              { website: { contains: companyData.domain, mode: 'insensitive' } }
            ]
          }
        });
        
        if (existing) {
          console.log(`⏭️  Skipping ${companyData.name} (already exists)`);
          skippedCompanies.push(companyData.name);
          continue;
        }
        
        // Create company
        const company = await prisma.companies.create({
          data: {
            workspaceId: workspace.id,
            name: companyData.name,
            website: companyData.website,
            domain: companyData.domain,
            industry: companyData.industry,
            sector: companyData.sector,
            size: companyData.size,
            description: companyData.description,
            employeeCount: companyData.employeeCount,
            foundedYear: companyData.foundedYear,
            city: companyData.city,
            state: companyData.state,
            country: companyData.country,
            mainSellerId: justin.id,
            status: 'LEAD',
            priority: 'MEDIUM',
            tags: ['IT Services', 'Contractor Hiring', 'Private Sector', 'Small-Medium'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Added: ${company.name} (${company.id})`);
        addedCompanies.push(company);
        
      } catch (error) {
        console.error(`❌ Error adding ${companyData.name}:`, error.message);
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`✅ Added: ${addedCompanies.length} companies`);
    console.log(`⏭️  Skipped: ${skippedCompanies.length} companies (already exist)`);
    console.log(`📝 Total: ${addedCompanies.length + skippedCompanies.length} processed\n`);
    
    if (addedCompanies.length > 0) {
      console.log('✅ Added Companies:');
      addedCompanies.forEach((c, idx) => {
        console.log(`   ${idx + 1}. ${c.name} - ${c.industry}`);
      });
    }
    
    // Verify final count
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });
    
    console.log(`\n📈 Total companies in CloudCaddie workspace: ${totalCompanies}`);
    console.log(`👤 All companies assigned to: ${justin.name}`);
    console.log('\n🎉 Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSimilarCompanies();

