#!/usr/bin/env node

/**
 * Remove people from Dan's companies and re-run buyer group discovery (USA-only)
 * 
 * Companies (remove people and re-run buyer group):
 * - Revalize
 * - RentalResult
 * - Ocient
 * - Precisely
 * - Optitex
 * - SketchUp
 * 
 * Companies (remove completely):
 * - Winning Variant
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { ProductionBuyerGroupPipeline } = require('./_future_now/find-buyer-group/production-buyer-group');

const prisma = new PrismaClient();

const COMPANIES_TO_PROCESS = [
  'Revalize',
  'RentalResult',
  'Ocient',
  'Precisely',
  'Optitex',
  'SketchUp'
];

const COMPANIES_TO_REMOVE_COMPLETELY = [
  'Winning Variant'
];

async function main() {
  try {
    console.log('🚀 Starting Dan Companies People Removal and Buyer Group Re-run');
    console.log('═'.repeat(60));
    console.log('');

    // Step 1: Find Adrata workspace
    console.log('📋 Step 1: Finding Adrata workspace...');
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: 'adrata' },
          { name: { contains: 'Adrata', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!adrataWorkspace) {
      console.error('❌ Adrata workspace not found');
      process.exit(1);
    }

    console.log(`✅ Found workspace: ${adrataWorkspace.name} (${adrataWorkspace.id})\n`);

    // Step 2: Find the companies to process (remove people and re-run buyer group)
    console.log('📋 Step 2: Finding companies...');
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        name: { in: COMPANIES_TO_PROCESS },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        linkedinUrl: true,
        website: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    // Find companies to remove completely (Winning Variant) - using case-insensitive search
    const companiesToRemove = await prisma.companies.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        OR: COMPANIES_TO_REMOVE_COMPLETELY.map(name => ({
          name: { contains: name, mode: 'insensitive' }
        })),
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        linkedinUrl: true,
        website: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    if (companies.length === 0 && companiesToRemove.length === 0) {
      console.error('❌ No companies found');
      await prisma.$disconnect();
      process.exit(1);
    }

    if (companies.length > 0) {
      console.log(`✅ Found ${companies.length} companies to process:`);
      companies.forEach(company => {
        console.log(`   - ${company.name} (${company._count.people} people)`);
      });
    }
    
    if (companiesToRemove.length > 0) {
      console.log(`\n✅ Found ${companiesToRemove.length} companies to remove completely:`);
      companiesToRemove.forEach(company => {
        console.log(`   - ${company.name} (${company._count.people} people)`);
      });
    } else {
      console.log(`\n⚠️  No companies found to remove completely (Winning Variant not found)`);
    }
    console.log('');

    // Step 3: Remove people from each company
    if (companies.length > 0) {
      console.log('📋 Step 3: Removing people from companies...');
      console.log('─'.repeat(60));
    }
    
    for (const company of companies) {
      console.log(`\n🗑️  Processing: ${company.name}`);
      
      if (company._count.people === 0) {
        console.log(`   ⚠️  No people to remove`);
        continue;
      }

      // Find all people for this company
      const people = await prisma.people.findMany({
        where: {
          companyId: company.id,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true
        }
      });

      console.log(`   📊 Found ${people.length} people to remove`);

      // Soft delete all people
      const result = await prisma.people.updateMany({
        where: {
          companyId: company.id,
          deletedAt: null
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`   ✅ Soft deleted ${result.count} people`);
    }

    if (companies.length > 0) {
      console.log('\n✅ All people removed from companies\n');
    }

    // Step 3.5: Remove Winning Variant company completely (people + company)
    if (companiesToRemove.length > 0) {
      console.log('📋 Step 3.5: Removing Winning Variant company completely...');
      console.log('─'.repeat(60));
      
      for (const company of companiesToRemove) {
        console.log(`\n🗑️  Processing: ${company.name}`);
        
        if (company._count.people > 0) {
          // Soft delete all people first
          const peopleResult = await prisma.people.updateMany({
            where: {
              companyId: company.id,
              deletedAt: null
            },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Soft deleted ${peopleResult.count} people`);
        }
        
        // Soft delete the company
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Soft deleted company: ${company.name}`);
      }
      
      console.log('\n✅ Winning Variant company and people removed\n');
    }

    // Step 4: Re-run buyer group discovery for each company (USA-only)
    if (companies.length > 0) {
      console.log('📋 Step 4: Re-running buyer group discovery (USA-only)...');
      console.log('─'.repeat(60));

      for (const company of companies) {
        console.log(`\n🔍 Processing: ${company.name}`);
        
        // Determine the identifier (LinkedIn URL or website)
        let companyIdentifier = company.linkedinUrl || company.website;
        
        if (!companyIdentifier) {
          console.log(`   ⚠️  No LinkedIn URL or website found for ${company.name}, skipping buyer group discovery`);
          continue;
        }

        console.log(`   🔗 Using identifier: ${companyIdentifier}`);

        try {
          const pipeline = new ProductionBuyerGroupPipeline({
            workspaceId: adrataWorkspace.id,
            linkedinUrl: companyIdentifier,
            dealSize: 150000,
            maxPages: 5,
            skipInterview: true, // Use saved config if available
            usaOnly: true, // USA-only filter
            prisma: prisma // Pass prisma instance to avoid creating new connections
          });

          const result = await pipeline.run();
          
          if (result && result.buyerGroup) {
            console.log(`   ✅ Buyer group discovery completed for ${company.name}`);
            console.log(`   👥 Found ${result.buyerGroup.length} buyer group members`);
          } else {
            console.log(`   ⚠️  Buyer group discovery returned no results for ${company.name}`);
          }
        } catch (error) {
          console.error(`   ❌ Error running buyer group discovery for ${company.name}:`, error.message);
          if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
          }
          // Continue with next company
        }

        // Add a small delay between companies to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.log('📋 Step 4: Skipping buyer group discovery (no companies to process)');
    }

    console.log('\n✅ All operations completed!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

