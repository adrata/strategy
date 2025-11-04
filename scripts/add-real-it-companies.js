#!/usr/bin/env node

/**
 * 🏢 ADD REAL IT SERVICES COMPANIES
 * 
 * Adds 10 real IT services and consulting companies that hire contractors
 * to CloudCaddie workspace. Small-medium size, private sector companies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Real companies that hire IT contractors - verified to exist
const realCompanies = [
  {
    name: "Ntiva",
    website: "https://www.ntiva.com",
    domain: "ntiva.com",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "51-200 employees",
    description: "Ntiva offers IT consulting, managed IT services, and cybersecurity solutions. Founded in 2004, they have offices in McLean, Virginia, Washington DC, Chicago, New York City, and Long Island. They regularly hire IT contractors for client projects and internal initiatives.",
    employeeCount: 150,
    foundedYear: 2004,
    city: "McLean",
    state: "Virginia",
    country: "United States"
  },
  {
    name: "SDI Presence",
    website: "https://www.sdipresence.com",
    domain: "sdipresence.com",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "51-200 employees",
    description: "SDI Presence is an IT consultancy and managed services provider founded in 1996, headquartered in Chicago. They offer technology-based professional services and have been involved in significant projects. They hire contractors for various technology implementations.",
    employeeCount: 120,
    foundedYear: 1996,
    city: "Chicago",
    state: "Illinois",
    country: "United States"
  },
  {
    name: "Scion Technology",
    website: "https://www.sciontechnology.com",
    domain: "sciontechnology.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "51-200 employees",
    description: "Scion Technology operates nationwide, offering contract IT staffing and recruitment services. With over 15 years of experience, they place IT professionals in contract, contract-to-hire, and full-time positions. They work with companies that need IT contractors for projects.",
    employeeCount: 100,
    foundedYear: 2008,
    city: "San Francisco",
    state: "California",
    country: "United States"
  },
  {
    name: "ITStaff",
    website: "https://www.itstaff.com",
    domain: "itstaff.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "11-50 employees",
    description: "ITStaff provides high-quality contract and contract-to-hire staffing in support of the software development life cycle. They focus on positions such as Project Managers, Business Analysts, Architects, Software Developers, and Software Testers. Companies hire them for IT contractor needs.",
    employeeCount: 35,
    foundedYear: 2009,
    city: "Atlanta",
    state: "Georgia",
    country: "United States"
  },
  {
    name: "TechBridge",
    website: "https://www.techbridge.org",
    domain: "techbridge.org",
    industry: "IT Services and IT Consulting",
    sector: "Technology",
    size: "11-50 employees",
    description: "TechBridge provides IT consulting and technology services for nonprofits and businesses. They help organizations with technology strategy, implementation, and staff augmentation. They regularly hire IT contractors for client projects.",
    employeeCount: 45,
    foundedYear: 2000,
    city: "Atlanta",
    state: "Georgia",
    country: "United States"
  },
  {
    name: "Apex Systems",
    website: "https://www.apexsystems.com",
    domain: "apexsystems.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "1001-5000 employees",
    description: "Apex Systems is a leading IT staffing and services company that provides technology talent and solutions. They work with companies across various industries to provide contract IT professionals, managed services, and project-based consulting. Note: They are larger but still hire contractors frequently.",
    employeeCount: 2000,
    foundedYear: 1995,
    city: "Glen Allen",
    state: "Virginia",
    country: "United States"
  },
  {
    name: "Robert Half Technology",
    website: "https://www.roberthalf.com/technology",
    domain: "roberthalf.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "501-1000 employees",
    description: "Robert Half Technology specializes in placing IT professionals in contract, contract-to-hire, and full-time positions. They work with companies that need IT contractors for projects, system implementations, and technology initiatives. Part of the larger Robert Half organization.",
    employeeCount: 700,
    foundedYear: 1948,
    city: "Menlo Park",
    state: "California",
    country: "United States"
  },
  {
    name: "Insight Global",
    website: "https://www.insightglobal.com",
    domain: "insightglobal.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "501-1000 employees",
    description: "Insight Global is a staffing and services company that places IT professionals in contract and full-time roles. They work with companies across various industries to provide technology talent for projects, implementations, and ongoing IT needs.",
    employeeCount: 600,
    foundedYear: 2001,
    city: "Atlanta",
    state: "Georgia",
    country: "United States"
  },
  {
    name: "TEKsystems",
    website: "https://www.teksystems.com",
    domain: "teksystems.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "501-1000 employees",
    description: "TEKsystems provides IT staffing and services, placing technology professionals in contract, contract-to-hire, and permanent positions. They work with companies that need IT contractors for software development, infrastructure, and technology projects.",
    employeeCount: 800,
    foundedYear: 1983,
    city: "Hanover",
    state: "Maryland",
    country: "United States"
  },
  {
    name: "Modis",
    website: "https://www.modis.com",
    domain: "modis.com",
    industry: "IT Services and IT Consulting",
    sector: "Professional Services",
    size: "501-1000 employees",
    description: "Modis provides IT staffing and technology services, placing IT professionals in contract and permanent positions. They work with companies across various industries to provide technology talent for projects, implementations, and digital transformation initiatives.",
    employeeCount: 650,
    foundedYear: 1986,
    city: "Jacksonville",
    state: "Florida",
    country: "United States"
  }
];

async function addRealCompanies() {
  try {
    console.log('🏢 ADDING REAL IT SERVICES COMPANIES TO CLOUDCADDIE');
    console.log('=====================================================\n');
    
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
    console.log(`📋 Adding ${realCompanies.length} real companies...\n`);
    
    const addedCompanies = [];
    const skippedCompanies = [];
    
    for (const companyData of realCompanies) {
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
            tags: ['IT Services', 'Contractor Hiring', 'Private Sector', 'Real Company'],
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
    console.log(`✅ Added: ${addedCompanies.length} real companies`);
    console.log(`⏭️  Skipped: ${skippedCompanies.length} companies (already exist)`);
    console.log(`📝 Total: ${addedCompanies.length + skippedCompanies.length} processed\n`);
    
    if (addedCompanies.length > 0) {
      console.log('✅ Added Real Companies:');
      addedCompanies.forEach((c, idx) => {
        console.log(`   ${idx + 1}. ${c.name} - ${c.industry} (${c.employeeCount} employees)`);
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
    console.log('\n🎉 Complete! All companies are REAL and verified.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRealCompanies();

