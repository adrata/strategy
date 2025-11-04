#!/usr/bin/env node

/**
 * 🎯 PROCESS REMAINING COMPANIES WITH LINKEDIN URLs
 * 
 * Processes the 10 companies that just received LinkedIn URLs for buyer group generation
 */

const { PrismaClient } = require('@prisma/client');
const { ProductionBuyerGroupPipeline } = require('./_future_now/find-buyer-group/production-buyer-group');
const { ConfigStorage } = require('./_future_now/find-buyer-group/config-storage');

const prisma = new PrismaClient();

async function processRemainingCompanies() {
  try {
    console.log('🎯 PROCESSING REMAINING COMPANIES WITH LINKEDIN URLs');
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
    
    console.log(`✅ Found workspace: ${workspace.name}\n`);
    
    // Find Justin
    const justin = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'justin.johnson@cloudcaddie.com' },
          { username: 'justin' }
        ]
      }
    });
    
    if (!justin) {
      console.log('❌ Justin not found');
      return;
    }
    
    // Get companies that have LinkedIn URLs but no buyer group members
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: justin.id,
        deletedAt: null,
        linkedinUrl: { not: null }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        domain: true,
        industry: true,
        size: true,
        employeeCount: true,
        _count: {
          select: {
            people: {
              where: {
                isBuyerGroupMember: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Filter companies without buyer group members
    const companiesNeedingBuyerGroups = allCompanies.filter(
      company => company._count.people === 0
    );
    
    console.log(`📊 Found ${companiesNeedingBuyerGroups.length} companies with LinkedIn URLs but no buyer groups\n`);
    
    if (companiesNeedingBuyerGroups.length === 0) {
      console.log('✅ All companies already have buyer groups!');
      return;
    }
    
    // Verify config is saved
    const configStorage = new ConfigStorage();
    const hasConfig = await configStorage.hasSavedConfig(workspace.id, prisma);
    
    if (!hasConfig) {
      console.log('⚠️  No saved configuration found. Creating CloudCaddie config...\n');
      
      const cloudCaddieConfig = {
        productName: "IT Staffing & Talent Acquisition Services",
        productCategory: "sales",
        dealSizeRange: 50000,
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
          blocker: [],
          introducer: ["Recruiting Manager", "Talent Manager"]
        },
        usaOnly: true,
        salesCycle: "medium"
      };
      
      await configStorage.saveConfigToDatabase(workspace.id, cloudCaddieConfig, prisma);
      console.log('✅ Configuration saved!\n');
    } else {
      console.log('✅ Using saved CloudCaddie configuration\n');
    }
    
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
        // Use LinkedIn URL as identifier
        const companyIdentifier = company.linkedinUrl;
        
        console.log(`   LinkedIn: ${companyIdentifier}`);
        console.log(`   Industry: ${company.industry || 'Unknown'}`);
        console.log(`   Size: ${company.size || 'Unknown'} (${company.employeeCount || 'Unknown'} employees)`);
        
        // Initialize pipeline
        const pipeline = new ProductionBuyerGroupPipeline({
          workspaceId: workspace.id,
          userId: justin.id,
          linkedinUrl: companyIdentifier,
          skipInterview: true,
          usaOnly: true,
          maxPages: 5
        });
        
        // Run the pipeline
        const result = await pipeline.run();
        
        if (result && result.buyerGroup && result.buyerGroup.length > 0) {
          console.log(`   ✅ Success! Generated buyer group with ${result.buyerGroup.length} members`);
          successCount++;
        } else {
          console.log(`   ⚠️  Warning: No buyer group generated`);
          errorCount++;
          errors.push({ company: company.name, error: 'No buyer group generated' });
        }
        
        // Add delay between companies
        if (i < companiesNeedingBuyerGroups.length - 1) {
          console.log(`   ⏳ Waiting 10 seconds before next company...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${company.name}:`, error.message);
        errorCount++;
        errors.push({ company: company.name, error: error.message });
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

processRemainingCompanies();

