#!/usr/bin/env node

/**
 * Verify that buyer group data is saved to streamlined schema
 * Checks companies, people, and all custom fields
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function verifySavedData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying saved buyer group data in top-temp workspace...\n');
    
    // Check companies with buyer group data
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        people: {
          some: {
            isBuyerGroupMember: true
          }
        }
      },
      include: {
        people: {
          where: {
            isBuyerGroupMember: true,
            deletedAt: null
          },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true,
            isBuyerGroupMember: true,
            buyerGroupOptimized: true,
            influenceScore: true,
            decisionPower: true,
            aiIntelligence: true,
            coresignalData: true,
            mainSellerId: true
          },
          take: 10
        }
      },
      take: 5
    });
    
    console.log(`📊 Found ${companies.length} companies with buyer group members\n`);
    
    for (const company of companies) {
      console.log(`🏢 ${company.name}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   Main Seller: ${company.mainSellerId || 'Unassigned'}`);
      console.log(`   Buyer Group Members: ${company.people.length}`);
      
      for (const person of company.people) {
        console.log(`\n   👤 ${person.fullName}`);
        console.log(`      Role: ${person.buyerGroupRole || 'N/A'}`);
        console.log(`      Title: ${person.jobTitle || 'N/A'}`);
        console.log(`      Buyer Group Member: ${person.isBuyerGroupMember}`);
        console.log(`      Optimized: ${person.buyerGroupOptimized || false}`);
        console.log(`      Influence Score: ${person.influenceScore || 0}`);
        console.log(`      Decision Power: ${person.decisionPower || 0}`);
        console.log(`      Main Seller: ${person.mainSellerId || 'Unassigned'}`);
        console.log(`      Has AI Intelligence: ${person.aiIntelligence ? 'Yes' : 'No'}`);
        console.log(`      Has Coresignal Data: ${person.coresignalData ? 'Yes' : 'No'}`);
      }
      console.log('');
    }
    
    // Count totals
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        isBuyerGroupMember: true,
        deletedAt: null
      }
    });
    
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        people: {
          some: {
            isBuyerGroupMember: true
          }
        }
      }
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Companies with Buyer Groups: ${totalCompanies}`);
    console.log(`   Total Buyer Group Members: ${totalPeople}`);
    
    // Check for people with all required fields
    const completeRecords = await prisma.people.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        isBuyerGroupMember: true,
        deletedAt: null,
        buyerGroupRole: { not: null },
        aiIntelligence: { not: null }
      }
    });
    
    console.log(`   Complete Records (with role & AI data): ${completeRecords}`);
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

verifySavedData().catch(console.error);

