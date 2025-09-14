#!/usr/bin/env node

/**
 * 🔍 FOCUSED AUDIT: DANO's SPECIFIC Notary Accounts
 * 
 * Filters and audits only notary/title-related accounts assigned to DANO
 * Excludes non-notary accounts that may have been mixed in
 * 
 * Usage: node scripts/audit-dano-notary-specific.js
 */

import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

/**
 * Check if account name is notary/title related
 */
function isNotaryRelated(name) {
  if (!name) return false;
  
  const notaryKeywords = [
    'title', 'escrow', 'closing', 'notary', 'abstract', 'settlement',
    'realty', 'real estate', 'property', 'land', 'mortgage'
  ];
  
  const nameLower = name.toLowerCase();
  return notaryKeywords.some(keyword => nameLower.includes(keyword));
}

/**
 * Audit CSV data for Dan's notary accounts only
 */
async function auditCSVNotaryData() {
  console.log('📊 AUDITING CSV: Dan\'s NOTARY-RELATED Accounts Only\n');
  
  const accounts = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('data/title-companies/notary_accounts.csv')
      .pipe(csv())
      .on('data', (row) => {
        accounts.push(row);
      })
      .on('end', () => {
        console.log(`📋 Loaded ${accounts.length} total accounts from CSV`);
        
        // Filter for Dan's accounts only
        const danoAccounts = accounts.filter(row => row.Assigned_User === 'dano');
        console.log(`👤 DANO's accounts: ${danoAccounts.length}`);
        
        // Filter for notary-related accounts only
        const notaryAccounts = danoAccounts.filter(row => 
          isNotaryRelated(row.Account) || 
          row['Connection w/ Notary Everyday'] === 'TRUE'
        );
        
        console.log(`🏢 Notary-related accounts: ${notaryAccounts.length}`);
        
        // Analyze by state
        const stateBreakdown = {};
        notaryAccounts.forEach(account => {
          const state = account.State_Full || account.State_Abbr || 'Unknown';
          if (!stateBreakdown[state]) {
            stateBreakdown[state] = {
              count: 0,
              accounts: [],
              cities: new Set(),
              withConnection: 0,
              withoutConnection: 0,
              industries: new Set()
            };
          }
          
          stateBreakdown[state].count++;
          stateBreakdown[state].accounts.push(account);
          stateBreakdown[state].cities.add(account.City || 'Unknown City');
          
          if (account['Connection w/ Notary Everyday'] === 'TRUE') {
            stateBreakdown[state].withConnection++;
          } else {
            stateBreakdown[state].withoutConnection++;
          }
        });
        
        console.log('\n📍 NOTARY ACCOUNTS BY STATE:');
        console.log('=============================');
        
        let totalArizona = 0;
        let totalFlorida = 0;
        let totalOther = 0;
        
        Object.entries(stateBreakdown).forEach(([state, data]) => {
          const cities = Array.from(data.cities).sort();
          const connectionRate = ((data.withConnection / data.count) * 100).toFixed(1);
          
          console.log(`\n🏢 ${state} (${data.count} accounts):`);
          console.log(`   📍 Cities: ${cities.join(', ')}`);
          console.log(`   ✅ With Notary Connection: ${data.withConnection}`);
          console.log(`   ❌ Without Connection: ${data.withoutConnection}`);
          console.log(`   📊 Connection Rate: ${connectionRate}%`);
          
          if (state === 'Arizona') totalArizona = data.count;
          else if (state === 'Florida') totalFlorida = data.count;
          else totalOther = data.count;
        });
        
        console.log('\n🎯 NOTARY ACCOUNTS SUMMARY:');
        console.log('============================');
        console.log(`📊 Total notary accounts assigned to Dan: ${notaryAccounts.length}`);
        console.log(`🌵 Arizona notary accounts: ${totalArizona}`);
        console.log(`🏖️ Florida notary accounts: ${totalFlorida}`);
        console.log(`🌍 Other states: ${totalOther}`);
        
        // Verify all are in Arizona or Florida
        const nonTargetStates = Object.keys(stateBreakdown).filter(state => 
          state !== 'Arizona' && state !== 'Florida'
        );
        
        if (nonTargetStates.length > 0) {
          console.log(`\n⚠️  WARNING: Found notary accounts in non-target states: ${nonTargetStates.join(', ')}`);
        } else {
          console.log('\n✅ SUCCESS: All Dan\'s notary accounts are in Arizona and Florida as expected');
        }
        
        // Show top notary accounts by score
        const topNotaryAccounts = notaryAccounts
          .sort((a, b) => (parseFloat(b.Score) || 0) - (parseFloat(a.Score) || 0))
          .slice(0, 15);
        
        console.log('\n🏆 TOP 15 NOTARY ACCOUNTS BY SCORE:');
        console.log('=====================================');
        topNotaryAccounts.forEach((account, index) => {
          const connection = account['Connection w/ Notary Everyday'] === 'TRUE' ? '✅' : '  ';
          console.log(`${index + 1}. ${connection} ${account.Account}`);
          console.log(`   📍 ${account.City}, ${account.State_Full}`);
          console.log(`   📏 ${account.Size}`);
          console.log(`   🎯 Score: ${account.Score}`);
          console.log(`   🔗 ${account.Domain || 'No website'}`);
          console.log('');
        });
        
        resolve({
          total: notaryAccounts.length,
          arizona: totalArizona,
          florida: totalFlorida,
          other: totalOther,
          stateBreakdown,
          topAccounts: topNotaryAccounts
        });
      })
      .on('error', reject);
  });
}

/**
 * Audit database for Dan's notary-related accounts only
 */
async function auditDatabaseNotaryData() {
  console.log('\n🗄️  AUDITING DATABASE: Dan\'s NOTARY-RELATED Accounts Only\n');
  
  try {
    await prisma.$connect();
    
    // Find Dan's user ID
    const danoUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'dano', mode: 'insensitive' } },
          { firstName: { contains: 'dano', mode: 'insensitive' } },
          { lastName: { contains: 'dano', mode: 'insensitive' } }
        ]
      },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (!danoUser) {
      console.log('❌ Could not find Dan\'s user account in database');
      return null;
    }
    
            console.log(`👤 Found DANO's user: ${danoUser.firstName} ${danoUser.lastName} (${danoUser.email})`);
    
    // Find ALL accounts assigned to Dan
    const allDanoAccounts = await prisma.accounts.findMany({
      where: {
        assignedUserId: danoUser.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        country: true,
        industry: true,
        website: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { contacts: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
            console.log(`📊 Found ${allDanoAccounts.length} total accounts assigned to DANO`);
    
    // Filter for notary-related accounts only
    const notaryAccounts = allDanoAccounts.filter(account => 
      isNotaryRelated(account.name) || 
      (account.industry && account.industry.toLowerCase().includes('title'))
    );
    
    console.log(`🏢 Notary-related accounts: ${notaryAccounts.length}`);
    console.log(`📋 Non-notary accounts: ${allDanoAccounts.length - notaryAccounts.length}`);
    
    // Show some examples of non-notary accounts
    const nonNotaryAccounts = allDanoAccounts.filter(account => 
      !isNotaryRelated(account.name) && 
      (!account.industry || !account.industry.toLowerCase().includes('title'))
    );
    
    if (nonNotaryAccounts.length > 0) {
      console.log('\n📋 EXAMPLES OF NON-NOTARY ACCOUNTS:');
      console.log('=====================================');
      nonNotaryAccounts.slice(0, 10).forEach((account, index) => {
        console.log(`${index + 1}. ${account.name}`);
        console.log(`   📍 ${account.city || 'No city'}, ${account.state || 'No state'}`);
        console.log(`   🏭 ${account.industry || 'No industry'}`);
        console.log('');
      });
      
      if (nonNotaryAccounts.length > 10) {
        console.log(`... and ${nonNotaryAccounts.length - 10} more non-notary accounts`);
      }
    }
    
    // Analyze notary accounts by state
    const stateBreakdown = {};
    notaryAccounts.forEach(account => {
      const state = account.state || 'Unknown';
      if (!stateBreakdown[state]) {
        stateBreakdown[state] = {
          count: 0,
          accounts: [],
          cities: new Set(),
          withContacts: 0,
          withoutContacts: 0
        };
      }
      
      stateBreakdown[state].count++;
      stateBreakdown[state].accounts.push(account);
      if (account.city) stateBreakdown[state].cities.add(account.city);
      
      if (account._count.contacts > 0) {
        stateBreakdown[state].withContacts++;
      } else {
        stateBreakdown[state].withoutContacts++;
      }
    });
    
    console.log('\n📍 NOTARY ACCOUNTS BY STATE (DATABASE):');
    console.log('=========================================');
    
    let totalArizona = 0;
    let totalFlorida = 0;
    let totalOther = 0;
    
    Object.entries(stateBreakdown).forEach(([state, data]) => {
      const cities = Array.from(data.cities).sort();
      const contactRate = ((data.withContacts / data.count) * 100).toFixed(1);
      
      console.log(`\n🏢 ${state} (${data.count} accounts):`);
      console.log(`   📍 Cities: ${cities.length > 0 ? cities.join(', ') : 'No city data'}`);
      console.log(`   👥 With contacts: ${data.withContacts}`);
      console.log(`   👤 Without contacts: ${data.withoutContacts}`);
      console.log(`   📊 Contact rate: ${contactRate}%`);
      
      if (state === 'AZ' || state === 'Arizona') totalArizona = data.count;
      else if (state === 'FL' || state === 'Florida') totalFlorida = data.count;
      else totalOther = data.count;
    });
    
    console.log('\n🎯 NOTARY ACCOUNTS SUMMARY (DATABASE):');
    console.log('=======================================');
    console.log(`📊 Total notary accounts in database: ${notaryAccounts.length}`);
    console.log(`🌵 Arizona notary accounts: ${totalArizona}`);
    console.log(`🏖️ Florida notary accounts: ${totalFlorida}`);
    console.log(`🌍 Other states: ${totalOther}`);
    
    // Show top notary accounts by contact count
    const topContactNotaryAccounts = notaryAccounts
      .filter(acc => acc._count.contacts > 0)
      .sort((a, b) => b._count.contacts - a._count.contacts)
      .slice(0, 10);
    
    if (topContactNotaryAccounts.length > 0) {
      console.log('\n👥 TOP 10 NOTARY ACCOUNTS BY CONTACT COUNT:');
      console.log('=============================================');
      topContactNotaryAccounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.name}`);
        console.log(`   📍 ${account.city || 'No city'}, ${account.state || 'No state'}`);
        console.log(`   👥 ${account._count.contacts} contacts`);
        console.log(`   🔗 ${account.website || 'No website'}`);
        console.log('');
      });
    }
    
    return {
      total: notaryAccounts.length,
      arizona: totalArizona,
      florida: totalFlorida,
      other: totalOther,
      stateBreakdown,
      topContactAccounts: topContactNotaryAccounts,
      nonNotaryCount: nonNotaryAccounts.length
    };
    
  } catch (error) {
    console.error('❌ Database audit error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate focused audit report
 */
async function generateFocusedReport(csvData, dbData) {
  console.log('\n📋 GENERATING FOCUSED NOTARY AUDIT REPORT\n');
  console.log('==========================================');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      csvNotaryTotal: csvData?.total || 0,
      dbNotaryTotal: dbData?.total || 0,
      csvArizona: csvData?.arizona || 0,
      csvFlorida: csvData?.florida || 0,
      dbArizona: dbData?.arizona || 0,
      dbFlorida: dbData?.florida || 0,
      nonNotaryAccounts: dbData?.nonNotaryCount || 0
    },
    validation: {
      allNotaryInTargetStates: true,
      csvDbNotaryMatch: false,
      stateDistributionMatch: false,
      noNonNotaryAccounts: false
    },
    recommendations: []
  };
  
  // Validate all notary accounts are in target states
  if (csvData && (csvData.arizona + csvData.florida) !== csvData.total) {
    report.validation.allNotaryInTargetStates = false;
    report.recommendations.push('Some notary accounts are not in Arizona or Florida - review CSV data');
  }
  
  // Check if CSV and DB notary counts match
  if (csvData && dbData && csvData.total === dbData.total) {
    report.validation.csvDbNotaryMatch = true;
  } else {
    report.recommendations.push('CSV and database notary account counts do not match - investigate discrepancy');
  }
  
  // Check if state distributions match
  if (csvData && dbData && 
      csvData.arizona === dbData.arizona && 
      csvData.florida === dbData.florida) {
    report.validation.stateDistributionMatch = true;
  } else {
    report.recommendations.push('State distributions do not match between CSV and database for notary accounts');
  }
  
  // Check for non-notary accounts
  if (dbData && dbData.nonNotaryCount === 0) {
    report.validation.noNonNotaryAccounts = true;
  } else {
    report.recommendations.push(`Found ${dbData?.nonNotaryCount || 0} non-notary accounts mixed in - consider cleanup`);
  }
  
  // Additional recommendations
  if (csvData && csvData.arizona < 30) {
    report.recommendations.push('Consider adding more Arizona notary accounts to reach target distribution');
  }
  
  if (csvData && csvData.florida < 100) {
    report.recommendations.push('Consider adding more Florida notary accounts to reach target distribution');
  }
  
  console.log('\n📊 FOCUSED AUDIT RESULTS:');
  console.log('==========================');
  console.log(`✅ All notary accounts in target states: ${report.validation.allNotaryInTargetStates ? 'YES' : 'NO'}`);
  console.log(`✅ CSV/DB notary counts match: ${report.validation.csvDbNotaryMatch ? 'YES' : 'NO'}`);
  console.log(`✅ State distributions match: ${report.validation.stateDistributionMatch ? 'YES' : 'NO'}`);
  console.log(`✅ No non-notary accounts mixed in: ${report.validation.noNonNotaryAccounts ? 'YES' : 'NO'}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  } else {
    console.log('\n🎉 All validations passed! DANO\'s notary accounts are properly configured.');
  }
  
  return report;
}

/**
 * Main focused audit function
 */
async function main() {
  try {
    console.log('🔍 FOCUSED AUDIT: DANO\'s NOTARY Accounts in Arizona & Florida\n');
    console.log('================================================================\n');
    
    // Step 1: Audit CSV notary data
    const csvData = await auditCSVNotaryData();
    
    // Step 2: Audit database notary data
    const dbData = await auditDatabaseNotaryData();
    
    // Step 3: Generate focused report
    const auditReport = await generateFocusedReport(csvData, dbData);
    
    console.log('\n🎯 FOCUSED AUDIT COMPLETE!');
    console.log('============================');
    
    if (auditReport.validation.allNotaryInTargetStates && 
        auditReport.validation.csvDbNotaryMatch && 
        auditReport.validation.stateDistributionMatch &&
        auditReport.validation.noNonNotaryAccounts) {
      console.log('✅ SUCCESS: All validations passed');
      console.log('✅ Dan\'s notary accounts are properly configured in Arizona and Florida');
    } else {
      console.log('⚠️  ISSUES FOUND: Review recommendations above');
    }
    
    // Final summary
    console.log('\n📊 FINAL NOTARY ACCOUNTS SUMMARY:');
    console.log('==================================');
    console.log(`📋 CSV: ${csvData?.total || 0} notary accounts (AZ: ${csvData?.arizona || 0}, FL: ${csvData?.florida || 0})`);
    console.log(`🗄️  DB: ${dbData?.total || 0} notary accounts (AZ: ${dbData?.arizona || 0}, FL: ${dbData?.florida || 0})`);
    console.log(`🧹 Non-notary accounts found: ${dbData?.nonNotaryCount || 0}`);
    
  } catch (error) {
    console.error('❌ Focused audit failed:', error);
    process.exit(1);
  }
}

// Run the focused audit
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
