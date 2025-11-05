#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for GitLab
 * 
 * GitLab was found to have 8 USA employees, so we can create buyer groups
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { ProductionBuyerGroupPipeline } = require('./_future_now/find-buyer-group/production-buyer-group');

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const GITLAB_COMPANY_ID = '01K9AR5VSX2APF0BQFT9WF4VNM';

async function runGitLabBuyerGroup() {
  console.log('🚀 Running Buyer Group Discovery for GitLab');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();

    // Get GitLab company
    const company = await prisma.companies.findUnique({
      where: { id: GITLAB_COMPANY_ID },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true
      }
    });

    if (!company) {
      throw new Error('GitLab company not found');
    }

    console.log(`Company: ${company.name}`);
    console.log(`LinkedIn: ${company.linkedinUrl}`);
    console.log(`Website: ${company.website}\n`);

    const identifier = company.linkedinUrl || company.website;
    
    console.log(`🚀 Starting buyer group discovery (USA-only, real data only)...\n`);

    // Initialize pipeline
    const pipeline = new ProductionBuyerGroupPipeline({
      workspaceId: ADRATA_WORKSPACE_ID,
      linkedinUrl: identifier,
      dealSize: 150000,
      maxPages: 5, // Search more pages
      skipInterview: true,
      usaOnly: true, // USA-only filter for Adrata
      prisma: prisma
    });

    const startTime = Date.now();
    const result = await pipeline.run();
    const processingTime = Date.now() - startTime;

    console.log(`\n✅ Completed in ${(processingTime / 1000).toFixed(1)}s`);

    if (result && result.buyerGroup) {
      const buyerGroupSize = Array.isArray(result.buyerGroup) 
        ? result.buyerGroup.length 
        : Object.keys(result.buyerGroup).length;
      
      console.log(`\n📊 Results:`);
      console.log(`   Buyer Group Members: ${buyerGroupSize}`);
      
      // Verify buyer group was saved
      const savedBG = await prisma.buyerGroups.findFirst({
        where: {
          workspaceId: ADRATA_WORKSPACE_ID,
          companyName: company.name
        }
      });

      if (savedBG) {
        console.log(`   ✅ Buyer group saved: ${savedBG.id}`);
      }

      // Check People records
      const people = await prisma.people.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
          buyerGroupRole: { not: null }
        }
      });

      console.log(`   👥 People with buyer group roles: ${people.length}`);
      if (people.length > 0) {
        console.log(`   Roles:`);
        const roleCounts = {};
        people.forEach(p => {
          roleCounts[p.buyerGroupRole] = (roleCounts[p.buyerGroupRole] || 0) + 1;
        });
        Object.entries(roleCounts).forEach(([role, count]) => {
          console.log(`     - ${role}: ${count}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runGitLabBuyerGroup();

