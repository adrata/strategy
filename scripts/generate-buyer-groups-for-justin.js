#!/usr/bin/env node

/**
 * 🎯 GENERATE BUYER GROUPS FOR JUSTIN'S COMPANIES
 * 
 * Runs buyer group discovery for all companies in Justin's CloudCaddie workspace
 * Uses the production buyer group pipeline
 */

const { PrismaClient } = require('@prisma/client');
const { ProductionBuyerGroupPipeline } = require('./_future_now/find-buyer-group/production-buyer-group');
const { ConfigStorage } = require('./_future_now/find-buyer-group/config-storage');

const prisma = new PrismaClient();

async function generateBuyerGroupsForJustin() {
  try {
    console.log('🎯 GENERATING BUYER GROUPS FOR JUSTIN\'S COMPANIES');
    console.log('==================================================\n');
    
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
    
    // Get all companies assigned to Justin
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: justin.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        domain: true,
        industry: true,
        size: true,
        employeeCount: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${companies.length} companies for Justin\n`);
    
    if (companies.length === 0) {
      console.log('⚠️  No companies found for Justin');
      return;
    }
    
    // Check which companies already have buyer groups
    const companiesWithBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        companyName: true
      }
    });
    
    const existingCompanyNames = new Set(
      companiesWithBuyerGroups.map(bg => bg.companyName.toLowerCase())
    );
    
    const companiesNeedingBuyerGroups = companies.filter(
      company => !existingCompanyNames.has(company.name.toLowerCase())
    );
    
    console.log(`📈 Companies needing buyer groups: ${companiesNeedingBuyerGroups.length}`);
    console.log(`✅ Companies with existing buyer groups: ${companies.length - companiesNeedingBuyerGroups.length}\n`);
    
    if (companiesNeedingBuyerGroups.length === 0) {
      console.log('✅ All companies already have buyer groups!');
      return;
    }
    
    // CloudCaddie Consulting - IT Staffing & Talent Acquisition
    // Based on https://cloudcaddieconsulting.com/
    // Services: Direct Hire, Contract, Contract-to-Hire
    // Target: Companies that need IT talent (HR, IT Management, Engineering leaders)
    console.log('📋 CloudCaddie Consulting Configuration:');
    console.log('   Business: IT Staffing & Talent Acquisition');
    console.log('   Services: Direct Hire, Contract, Contract-to-Hire');
    console.log('   Target: Companies needing IT talent');
    console.log('   Decision Makers: HR, IT Management, Engineering Leaders, CTOs\n');
    
    // Create personalized config for CloudCaddie based on their website
    // https://cloudcaddieconsulting.com/ - IT Staffing & Talent Acquisition
    const cloudCaddieConfig = {
      productName: "IT Staffing & Talent Acquisition Services",
      productCategory: "sales", // B2B sales
      dealSizeRange: 50000, // Average deal size (user said price doesn't matter)
      departmentFiltering: {
        primaryDepartments: ["Human Resources", "HR", "People Operations", "Talent Acquisition"],
        secondaryDepartments: ["IT", "Engineering", "Technology", "Information Technology", "Software Development"],
        excludedDepartments: ["Manufacturing", "Operations", "Warehouse"]
      },
      titleFiltering: {
        primaryTitles: [
          "Chief Technology Officer", "CTO",
          "VP Engineering", "VP of Engineering", "Vice President Engineering",
          "Director of IT", "IT Director", "Director Information Technology",
          "VP Human Resources", "VP HR", "Vice President Human Resources",
          "Director of Talent Acquisition", "Talent Acquisition Director",
          "Head of Engineering", "Engineering Manager",
          "Chief Information Officer", "CIO"
        ],
        secondaryTitles: [
          "HR Manager", "Human Resources Manager",
          "Recruiting Manager", "Talent Manager",
          "IT Manager", "Technology Manager",
          "Engineering Manager", "Development Manager"
        ]
      },
      buyerGroupSizing: {
        min: 4,
        ideal: 6,
        max: 10
      },
      rolePriorities: {
        decision: ["CTO", "CIO", "VP Engineering", "VP HR"],
        champion: ["Director IT", "Director Talent Acquisition", "Head of Engineering"],
        stakeholder: ["HR Manager", "IT Manager", "Engineering Manager"],
        blocker: [], // Less relevant for staffing
        introducer: ["Recruiting Manager", "Talent Manager"]
      },
      usaOnly: true, // Focus on USA-based companies
      salesCycle: "medium" // 3-6 months typical for hiring decisions
    };
    
    // Save config to database so pipeline can use it
    console.log('💾 Saving CloudCaddie configuration to database...');
    const configStorage = new ConfigStorage();
    await configStorage.saveConfigToDatabase(
      workspace.id,
      cloudCaddieConfig,
      prisma
    );
    console.log('✅ Configuration saved!\n');
    
    // Process companies
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    console.log(`🚀 Starting buyer group generation for ${companiesNeedingBuyerGroups.length} companies...\n`);
    
    for (let i = 0; i < companiesNeedingBuyerGroups.length; i++) {
      const company = companiesNeedingBuyerGroups[i];
      const progress = `[${i + 1}/${companiesNeedingBuyerGroups.length}]`;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${progress} Processing: ${company.name}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        // Determine company identifier (prefer LinkedIn URL, then website, then domain)
        const companyIdentifier = company.linkedinUrl || company.website || `https://${company.domain}` || company.name;
        
        console.log(`   Using identifier: ${companyIdentifier}`);
        console.log(`   Industry: ${company.industry || 'Unknown'}`);
        console.log(`   Size: ${company.size || 'Unknown'} (${company.employeeCount || 'Unknown'} employees)`);
        
        // Initialize pipeline - it will automatically load the saved config
        const pipeline = new ProductionBuyerGroupPipeline({
          workspaceId: workspace.id,
          userId: justin.id,
          linkedinUrl: companyIdentifier,
          skipInterview: true, // Use saved config from database
          usaOnly: true, // Focus on USA-based employees
          maxPages: 5 // Limit preview pages for cost control
        });
        
        // Run the pipeline
        const result = await pipeline.run();
        
        if (result && result.buyerGroup && result.buyerGroup.length > 0) {
          console.log(`   ✅ Success! Generated buyer group with ${result.buyerGroup.length} members`);
          successCount++;
        } else {
          console.log(`   ⚠️  Warning: No buyer group generated or pipeline returned empty result`);
          errorCount++;
          errors.push({ company: company.name, error: 'No buyer group generated' });
        }
        
        // Add delay between companies to avoid rate limiting
        if (i < companiesNeedingBuyerGroups.length - 1) {
          console.log(`   ⏳ Waiting 10 seconds before next company...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${company.name}:`, error.message);
        errorCount++;
        errors.push({ company: company.name, error: error.message });
        
        // Continue with next company even if this one fails
        continue;
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Successfully processed: ${successCount} companies`);
    console.log(`❌ Failed: ${errorCount} companies`);
    console.log(`📝 Total processed: ${companiesNeedingBuyerGroups.length} companies`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Errors:`);
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.company}: ${err.error}`);
      });
    }
    
    console.log('\n🎉 Buyer group generation complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check for command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];

if (dryRun) {
  console.log('🔍 DRY RUN MODE - Will not actually generate buyer groups\n');
}

generateBuyerGroupsForJustin();

