#!/usr/bin/env node

/**
 * 🔍 ANALYZE NOTARY EVERYDAY PROSPECT OVERLAPS
 * 
 * This script will:
 * 1. Check for overlaps between Notary Everyday prospects and other workspaces
 * 2. Analyze if these are truly new prospects or duplicates
 * 3. Check for overlaps with leads in other workspaces
 * 4. Identify potential data migration issues
 */

const { PrismaClient } = require('@prisma/client');

// Workspace IDs
const NOTARY_EVERYDAY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
const RETAIL_PRODUCT_SOLUTIONS_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function analyzeNotaryProspectOverlaps() {
  console.log('🔍 ANALYZING NOTARY EVERYDAY PROSPECT OVERLAPS');
  console.log('==============================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // 1. Get all Notary Everyday prospects with their key identifiers
    console.log('1️⃣ GETTING NOTARY EVERYDAY PROSPECTS...');
    console.log('----------------------------------------');
    
    const notaryProspects = await prisma.prospects.findMany({
      where: {
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        company: true,
        companyDomain: true,
        createdAt: true,
        status: true
      }
    });
    
    console.log(`📊 Found ${notaryProspects.length} Notary Everyday prospects\n`);
    
    // 2. Check for overlaps with Retail Product Solutions workspace
    console.log('2️⃣ CHECKING OVERLAPS WITH RETAIL PRODUCT SOLUTIONS...');
    console.log('----------------------------------------------------');
    
    // Get all email addresses from Notary Everyday prospects
    const notaryEmails = notaryProspects
      .map(p => [p.email, p.workEmail, p.personalEmail])
      .flat()
      .filter(email => email && email.trim() !== '');
    
    console.log(`📧 Notary Everyday has ${notaryEmails.length} email addresses`);
    
    let rpsProspectOverlaps = [];
    let leadOverlaps = [];
    
    if (notaryEmails.length > 0) {
      // Check for prospects in RPS workspace with same emails
      rpsProspectOverlaps = await prisma.prospects.findMany({
        where: {
          workspaceId: RETAIL_PRODUCT_SOLUTIONS_WORKSPACE_ID,
          deletedAt: null,
          OR: [
            { email: { in: notaryEmails } },
            { workEmail: { in: notaryEmails } },
            { personalEmail: { in: notaryEmails } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          company: true,
          createdAt: true,
          status: true
        }
      });
      
      console.log(`🔄 Found ${rpsProspectOverlaps.length} prospect overlaps with RPS workspace`);
      
      if (rpsProspectOverlaps.length > 0) {
        console.log('   Overlapping prospects:');
        rpsProspectOverlaps.slice(0, 10).forEach(prospect => {
          console.log(`   - ${prospect.fullName} (${prospect.email || prospect.workEmail || prospect.personalEmail})`);
        });
        if (rpsProspectOverlaps.length > 10) {
          console.log(`   ... and ${rpsProspectOverlaps.length - 10} more`);
        }
      }
    } else {
      console.log('⚠️  No email addresses found in Notary Everyday prospects to check overlaps');
    }
    
    // 3. Check for overlaps with leads in other workspaces
    console.log('\n3️⃣ CHECKING OVERLAPS WITH LEADS IN OTHER WORKSPACES...');
    console.log('----------------------------------------------------');
    
    if (notaryEmails.length > 0) {
      leadOverlaps = await prisma.leads.findMany({
        where: {
          workspaceId: {
            not: NOTARY_EVERYDAY_WORKSPACE_ID
          },
          deletedAt: null,
          OR: [
            { email: { in: notaryEmails } },
            { workEmail: { in: notaryEmails } },
            { personalEmail: { in: notaryEmails } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          company: true,
          workspaceId: true,
          createdAt: true,
          status: true
        }
      });
      
      console.log(`🔄 Found ${leadOverlaps.length} lead overlaps with other workspaces`);
      
      if (leadOverlaps.length > 0) {
        console.log('   Overlapping leads:');
        leadOverlaps.slice(0, 10).forEach(lead => {
          console.log(`   - ${lead.fullName} (${lead.email || lead.workEmail || lead.personalEmail}) - Workspace: ${lead.workspaceId}`);
        });
        if (leadOverlaps.length > 10) {
          console.log(`   ... and ${leadOverlaps.length - 10} more`);
        }
      }
    }
    
    // 4. Check for overlaps with persons table (if exists)
    console.log('\n4️⃣ CHECKING OVERLAPS WITH PERSONS TABLE...');
    console.log('-------------------------------------------');
    
    // Skip persons table check as it may not exist in current schema
    console.log('⏭️  Skipping persons table check (table may not exist)');
    const personOverlaps = [];
    
    // 5. Analyze the creation pattern
    console.log('\n5️⃣ ANALYZING CREATION PATTERNS...');
    console.log('----------------------------------');
    
    const creationDates = notaryProspects.map(p => p.createdAt);
    const earliestDate = new Date(Math.min(...creationDates));
    const latestDate = new Date(Math.max(...creationDates));
    
    console.log(`📅 Creation date range: ${earliestDate.toISOString()} to ${latestDate.toISOString()}`);
    console.log(`⏱️  Time span: ${Math.round((latestDate - earliestDate) / (1000 * 60 * 60))} hours`);
    
    // Group by creation date
    const creationByDate = {};
    notaryProspects.forEach(prospect => {
      const date = prospect.createdAt.toISOString().split('T')[0];
      creationByDate[date] = (creationByDate[date] || 0) + 1;
    });
    
    console.log('\n📊 Creation by date:');
    Object.entries(creationByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        console.log(`   ${date}: ${count} prospects`);
      });
    
    // 6. Check for systematic naming patterns
    console.log('\n6️⃣ ANALYZING NAMING PATTERNS...');
    console.log('--------------------------------');
    
    const namePatterns = {};
    notaryProspects.forEach(prospect => {
      const firstName = prospect.firstName?.toLowerCase() || '';
      const lastName = prospect.lastName?.toLowerCase() || '';
      
      if (firstName && lastName) {
        const pattern = `${firstName} ${lastName}`;
        namePatterns[pattern] = (namePatterns[pattern] || 0) + 1;
      }
    });
    
    const duplicateNames = Object.entries(namePatterns)
      .filter(([name, count]) => count > 1)
      .sort(([,a], [,b]) => b - a);
    
    console.log(`🔄 Found ${duplicateNames.length} duplicate name patterns`);
    if (duplicateNames.length > 0) {
      console.log('   Top duplicate names:');
      duplicateNames.slice(0, 10).forEach(([name, count]) => {
        console.log(`   - ${name}: ${count} prospects`);
      });
    }
    
    // 7. Check company patterns
    console.log('\n7️⃣ ANALYZING COMPANY PATTERNS...');
    console.log('--------------------------------');
    
    const companyPatterns = {};
    notaryProspects.forEach(prospect => {
      const company = prospect.company?.toLowerCase() || '';
      if (company) {
        companyPatterns[company] = (companyPatterns[company] || 0) + 1;
      }
    });
    
    const duplicateCompanies = Object.entries(companyPatterns)
      .filter(([company, count]) => count > 1)
      .sort(([,a], [,b]) => b - a);
    
    console.log(`🏢 Found ${duplicateCompanies.length} duplicate company patterns`);
    if (duplicateCompanies.length > 0) {
      console.log('   Top duplicate companies:');
      duplicateCompanies.slice(0, 10).forEach(([company, count]) => {
        console.log(`   - ${company}: ${count} prospects`);
      });
    }
    
    // 8. Summary and recommendations
    console.log('\n📋 OVERLAP ANALYSIS SUMMARY');
    console.log('===========================');
    
    const totalOverlaps = (rpsProspectOverlaps?.length || 0) + (leadOverlaps?.length || 0) + (personOverlaps?.length || 0);
    
    console.log(`✅ Total Notary Everyday prospects: ${notaryProspects.length}`);
    console.log(`🔄 Total overlaps found: ${totalOverlaps}`);
    console.log(`📊 Overlap percentage: ${((totalOverlaps / notaryProspects.length) * 100).toFixed(1)}%`);
    
    if (totalOverlaps > 0) {
      console.log('\n⚠️  RECOMMENDATIONS:');
      console.log('   - These prospects may be duplicates from other workspaces');
      console.log('   - Consider merging or removing duplicate records');
      console.log('   - Verify if these should be leads instead of prospects');
    } else {
      console.log('\n✅ NO OVERLAPS FOUND:');
      console.log('   - These appear to be genuinely new prospects');
      console.log('   - However, missing contact data makes them unusable');
      console.log('   - Consider data enrichment or manual data entry');
    }
    
    if (notaryEmails.length === 0) {
      console.log('\n🚨 CRITICAL ISSUE:');
      console.log('   - 100% of prospects are missing email addresses');
      console.log('   - This suggests a data import problem');
      console.log('   - These prospects are essentially unusable without contact info');
    }
    
  } catch (error) {
    console.error('❌ Error during overlap analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
if (require.main === module) {
  analyzeNotaryProspectOverlaps()
    .then(() => {
      console.log('\n✅ Overlap analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Overlap analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeNotaryProspectOverlaps };
