/**
 * Script to check if opportunity records exist in production database
 * for the "top" workspace
 */

import { prisma } from '@/platform/database/prisma-client';

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

async function checkOpportunities() {
  try {
    console.log(`🔍 Checking for opportunities in workspace: ${TOP_WORKSPACE_ID}`);
    
    // Check if opportunities table exists by trying to count
    const count = await prisma.opportunities.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`✅ Found ${count} opportunity records in production database`);
    
    if (count > 0) {
      // Get a sample of opportunities
      const sample = await prisma.opportunities.findMany({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`\n📋 Sample opportunities (first 5):`);
      sample.forEach((opp, index) => {
        console.log(`  ${index + 1}. ${opp.name} (ID: ${opp.id})`);
        console.log(`     Company: ${opp.company.name} (Status: ${opp.company.status})`);
        console.log(`     Stage: ${opp.stage}, Amount: ${opp.amount || 'N/A'}`);
        console.log(`     Created: ${opp.createdAt.toISOString()}`);
        console.log('');
      });
      
      // Also check companies with status OPPORTUNITY
      const companiesWithOpportunityStatus = await prisma.companies.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          status: 'OPPORTUNITY',
          deletedAt: null
        }
      });
      
      console.log(`\n📊 Companies with status=OPPORTUNITY: ${companiesWithOpportunityStatus}`);
      
      if (companiesWithOpportunityStatus > count) {
        console.log(`⚠️  Note: There are more companies with OPPORTUNITY status (${companiesWithOpportunityStatus}) than opportunity records (${count})`);
        console.log(`   This suggests some opportunities might be stored as companies with status=OPPORTUNITY`);
      }
    } else {
      console.log(`\n⚠️  No opportunity records found in opportunities table`);
      
      // Check if there are companies with OPPORTUNITY status
      const companiesWithOpportunityStatus = await prisma.companies.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          status: 'OPPORTUNITY',
          deletedAt: null
        }
      });
      
      console.log(`\n📊 Companies with status=OPPORTUNITY: ${companiesWithOpportunityStatus}`);
      
      if (companiesWithOpportunityStatus > 0) {
        console.log(`\n✅ Opportunities exist as companies with status=OPPORTUNITY`);
        console.log(`   This is the expected behavior for the streamlined schema`);
      } else {
        console.log(`\n❌ No opportunities found in either opportunities table or companies table`);
      }
    }
    
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log(`\n❌ Opportunities table does not exist in production database`);
      console.log(`   Error: ${error.message}`);
      
      // Check companies table instead
      console.log(`\n🔍 Checking companies table for OPPORTUNITY status...`);
      try {
        const companiesWithOpportunityStatus = await prisma.companies.count({
          where: {
            workspaceId: TOP_WORKSPACE_ID,
            status: 'OPPORTUNITY',
            deletedAt: null
          }
        });
        
        console.log(`✅ Found ${companiesWithOpportunityStatus} companies with status=OPPORTUNITY`);
        
        if (companiesWithOpportunityStatus > 0) {
          const sample = await prisma.companies.findMany({
            where: {
              workspaceId: TOP_WORKSPACE_ID,
              status: 'OPPORTUNITY',
              deletedAt: null
            },
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          });
          
          console.log(`\n📋 Sample companies with OPPORTUNITY status (first 5):`);
          sample.forEach((company, index) => {
            console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`);
            console.log(`     Status: ${company.status}`);
            console.log(`     Created: ${company.createdAt.toISOString()}`);
            console.log('');
          });
        }
      } catch (companiesError) {
        console.error(`❌ Error checking companies:`, companiesError);
      }
    } else {
      console.error(`❌ Error checking opportunities:`, error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkOpportunities();

