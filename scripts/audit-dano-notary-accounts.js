#!/usr/bin/env node

/**
 * 🔍 AUDIT: DANO's Notary Accounts in Arizona & Florida
 * 
 * Comprehensive audit of all accounts assigned to 'dano' in the notary services
 * Confirms locations are in Arizona and Florida as expected
 * 
 * Usage: node scripts/audit-dano-notary-accounts.js
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
 * Audit CSV data for DANO's notary accounts
 */
async function auditCSVData() {
      console.log('📊 AUDITING CSV DATA: DANO\'s Notary Accounts\n');
  
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
        
        // Analyze by state
        const stateBreakdown = {};
        danoAccounts.forEach(account => {
          const state = account.State_Full || account.State_Abbr || 'Unknown';
          if (!stateBreakdown[state]) {
            stateBreakdown[state] = {
              count: 0,
              accounts: [],
              cities: new Set(),
              withConnection: 0,
              withoutConnection: 0
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
        
        console.log('\n📍 STATE BREAKDOWN:');
        console.log('==================');
        
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
        
        console.log('\n🎯 SUMMARY:');
        console.log('===========');
        console.log(`📊 Total accounts assigned to Dan: ${danoAccounts.length}`);
        console.log(`🌵 Arizona accounts: ${totalArizona}`);
        console.log(`🏖️ Florida accounts: ${totalFlorida}`);
        console.log(`🌍 Other states: ${totalOther}`);
        
        // Verify all are in Arizona or Florida
        const nonTargetStates = Object.keys(stateBreakdown).filter(state => 
          state !== 'Arizona' && state !== 'Florida'
        );
        
        if (nonTargetStates.length > 0) {
          console.log(`\n⚠️  WARNING: Found accounts in non-target states: ${nonTargetStates.join(', ')}`);
        } else {
          console.log('\n✅ SUCCESS: All Dan\'s accounts are in Arizona and Florida as expected');
        }
        
        // Show top accounts by score
        const topAccounts = danoAccounts
          .sort((a, b) => (parseFloat(b.Score) || 0) - (parseFloat(a.Score) || 0))
          .slice(0, 10);
        
        console.log('\n🏆 TOP 10 ACCOUNTS BY SCORE:');
        console.log('=============================');
        topAccounts.forEach((account, index) => {
          const connection = account['Connection w/ Notary Everyday'] === 'TRUE' ? '✅' : '  ';
          console.log(`${index + 1}. ${connection} ${account.Account}`);
          console.log(`   📍 ${account.City}, ${account.State_Full}`);
          console.log(`   📏 ${account.Size}`);
          console.log(`   🎯 Score: ${account.Score}`);
          console.log(`   🔗 ${account.Domain || 'No website'}`);
          console.log('');
        });
        
        resolve({
          total: danoAccounts.length,
          arizona: totalArizona,
          florida: totalFlorida,
          other: totalOther,
          stateBreakdown,
          topAccounts
        });
      })
      .on('error', reject);
  });
}

/**
 * Audit database data for Dan's notary accounts
 */
async function auditDatabaseData() {
  console.log('\n🗄️  AUDITING DATABASE: Dan\'s Notary Accounts\n');
  
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
    
    // Find accounts assigned to Dan
    const danoAccounts = await prisma.accounts.findMany({
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
    
            console.log(`📊 Found ${danoAccounts.length} accounts assigned to DANO in database`);
    
    // Analyze by state
    const stateBreakdown = {};
    danoAccounts.forEach(account => {
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
    
    console.log('\n📍 DATABASE STATE BREAKDOWN:');
    console.log('============================');
    
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
    
    console.log('\n🎯 DATABASE SUMMARY:');
    console.log('===================');
    console.log(`📊 Total accounts in database: ${danoAccounts.length}`);
    console.log(`🌵 Arizona accounts: ${totalArizona}`);
    console.log(`🏖️ Florida accounts: ${totalFlorida}`);
    console.log(`🌍 Other states: ${totalOther}`);
    
    // Show accounts with most contacts
    const topContactAccounts = danoAccounts
      .filter(acc => acc._count.contacts > 0)
      .sort((a, b) => b._count.contacts - a._count.contacts)
      .slice(0, 10);
    
    if (topContactAccounts.length > 0) {
      console.log('\n👥 TOP 10 ACCOUNTS BY CONTACT COUNT:');
      console.log('=====================================');
      topContactAccounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.name}`);
        console.log(`   📍 ${account.city || 'No city'}, ${account.state || 'No state'}`);
        console.log(`   👥 ${account._count.contacts} contacts`);
        console.log(`   🔗 ${account.website || 'No website'}`);
        console.log('');
      });
    }
    
    return {
      total: danoAccounts.length,
      arizona: totalArizona,
      florida: totalFlorida,
      other: totalOther,
      stateBreakdown,
      topContactAccounts
    };
    
  } catch (error) {
    console.error('❌ Database audit error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Cross-reference CSV and database data
 */
async function crossReferenceData(csvData, dbData) {
  console.log('\n🔍 CROSS-REFERENCING CSV vs DATABASE\n');
  console.log('====================================');
  
  if (!csvData || !dbData) {
    console.log('❌ Cannot cross-reference - missing data from one source');
    return;
  }
  
  console.log(`📊 CSV: ${csvData.total} accounts (AZ: ${csvData.arizona}, FL: ${csvData.florida})`);
  console.log(`🗄️  DB: ${dbData.total} accounts (AZ: ${dbData.arizona}, FL: ${dbData.florida})`);
  
  const csvDiff = csvData.total - dbData.total;
  if (csvDiff > 0) {
    console.log(`⚠️  CSV has ${csvDiff} more accounts than database`);
  } else if (csvDiff < 0) {
    console.log(`⚠️  Database has ${Math.abs(csvDiff)} more accounts than CSV`);
  } else {
    console.log('✅ Account counts match between CSV and database');
  }
  
  // Check for state discrepancies
  const csvArizonaDiff = csvData.arizona - dbData.arizona;
  const csvFloridaDiff = csvData.florida - dbData.florida;
  
  if (csvArizonaDiff !== 0) {
    console.log(`⚠️  Arizona count mismatch: CSV ${csvData.arizona} vs DB ${dbData.arizona} (diff: ${csvArizonaDiff})`);
  }
  
  if (csvFloridaDiff !== 0) {
    console.log(`⚠️  Florida count mismatch: CSV ${csvData.florida} vs DB ${dbData.florida} (diff: ${csvFloridaDiff})`);
  }
  
  if (csvArizonaDiff === 0 && csvFloridaDiff === 0) {
    console.log('✅ State distributions match between CSV and database');
  }
}

/**
 * Generate audit report
 */
async function generateAuditReport(csvData, dbData) {
  console.log('\n📋 GENERATING AUDIT REPORT\n');
  console.log('==========================');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      csvTotal: csvData?.total || 0,
      dbTotal: dbData?.total || 0,
      csvArizona: csvData?.arizona || 0,
      csvFlorida: csvData?.florida || 0,
      dbArizona: dbData?.arizona || 0,
      dbFlorida: dbData?.florida || 0
    },
    validation: {
      allInTargetStates: true,
      csvDbMatch: false,
      stateDistributionMatch: false
    },
    recommendations: []
  };
  
  // Validate all accounts are in target states
  if (csvData && (csvData.arizona + csvData.florida) !== csvData.total) {
    report.validation.allInTargetStates = false;
    report.recommendations.push('Some accounts are not in Arizona or Florida - review CSV data');
  }
  
  // Check if CSV and DB counts match
  if (csvData && dbData && csvData.total === dbData.total) {
    report.validation.csvDbMatch = true;
  } else {
    report.recommendations.push('CSV and database account counts do not match - investigate discrepancy');
  }
  
  // Check if state distributions match
  if (csvData && dbData && 
      csvData.arizona === dbData.arizona && 
      csvData.florida === dbData.florida) {
    report.validation.stateDistributionMatch = true;
  } else {
    report.recommendations.push('State distributions do not match between CSV and database');
  }
  
  // Additional recommendations
  if (csvData && csvData.arizona < 50) {
    report.recommendations.push('Consider adding more Arizona accounts to reach target distribution');
  }
  
  if (csvData && csvData.florida < 100) {
    report.recommendations.push('Consider adding more Florida accounts to reach target distribution');
  }
  
  console.log('\n📊 AUDIT RESULTS:');
  console.log('==================');
  console.log(`✅ All accounts in target states: ${report.validation.allInTargetStates ? 'YES' : 'NO'}`);
  console.log(`✅ CSV/DB counts match: ${report.validation.csvDbMatch ? 'YES' : 'NO'}`);
  console.log(`✅ State distributions match: ${report.validation.stateDistributionMatch ? 'YES' : 'NO'}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  } else {
    console.log('\n🎉 All validations passed! Dan\'s notary accounts are properly configured.');
  }
  
  return report;
}

/**
 * Main audit function
 */
async function main() {
  try {
    console.log('🔍 COMPREHENSIVE AUDIT: DANO\'s Notary Accounts in Arizona & Florida\n');
    console.log('==================================================================\n');
    
    // Step 1: Audit CSV data
    const csvData = await auditCSVData();
    
    // Step 2: Audit database data
    const dbData = await auditDatabaseData();
    
    // Step 3: Cross-reference data
    await crossReferenceData(csvData, dbData);
    
    // Step 4: Generate final report
    const auditReport = await generateAuditReport(csvData, dbData);
    
    console.log('\n🎯 AUDIT COMPLETE!');
    console.log('===================');
    
    if (auditReport.validation.allInTargetStates && 
        auditReport.validation.csvDbMatch && 
        auditReport.validation.stateDistributionMatch) {
      console.log('✅ SUCCESS: All validations passed');
      console.log('✅ Dan\'s notary accounts are properly configured in Arizona and Florida');
    } else {
      console.log('⚠️  ISSUES FOUND: Review recommendations above');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
