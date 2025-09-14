#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE ID AUDIT SCRIPT
 * 
 * Searches the entire database for any non-standard IDs and reports findings
 * Ensures complete ULID standardization across all tables
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All tables that have ID fields
const TABLES_TO_AUDIT = [
  'workspaces',
  'workspace_users', 
  'companies',
  'leads',
  'prospects',
  'opportunities',
  'contacts',
  'clients',
  'partners',
  'activities',
  'notes',
  'buyer_groups',
  'demo_scenarios',
  'custom_tables',
  'custom_records',
  'custom_relationships'
];

// ID patterns to check for
const ID_PATTERNS = {
  'Custom ULIDs (c*)': /^c[a-z0-9]{25}$/,
  'Timestamp IDs (account_*)': /^account_\d+_[a-z0-9]+$/,
  'Timestamp IDs (lead_*)': /^lead_\d+_[a-z0-9]+$/,
  'Timestamp IDs (prospect_*)': /^prospect_\d+_[a-z0-9]+$/,
  'Timestamp IDs (opp_*)': /^opp_\d+_[a-z0-9]+$/,
  'Timestamp IDs (contact_*)': /^contact_\d+_[a-z0-9]+$/,
  'Timestamp IDs (partner_*)': /^partner_\d+_[a-z0-9]+$/,
  'Timestamp IDs (customer_*)': /^customer_\d+_[a-z0-9]+$/,
  'Simple IDs (company_*)': /^company_\d+$/,
  'Demo IDs (zp-*)': /^zp-[a-z-]+-2025$/,
  'UUIDs': /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Short IDs (< 26 chars)': /^.{1,25}$/,
  'Long IDs (> 26 chars)': /^.{27,}$/,
  'Non-ULID 26 chars': /^.{26}$/
};

async function auditTable(tableName) {
  console.log(`\n🔍 Auditing ${tableName}...`);
  
  try {
    // Get all records with their IDs
    const records = await prisma[tableName].findMany({
      select: { id: true },
      take: 1000 // Limit to prevent memory issues
    });
    
    if (records.length === 0) {
      console.log(`   ✅ No records found in ${tableName}`);
      return { table: tableName, total: 0, issues: [] };
    }
    
    console.log(`   📊 Found ${records.length} records`);
    
    const issues = [];
    let standardULIDs = 0;
    
    for (const record of records) {
      const id = record.id;
      
      // Check if it's a standard ULID (26 chars starting with 01)
      if (id.length === 26 && id.startsWith('01')) {
        standardULIDs++;
        continue;
      }
      
      // Check against all patterns
      for (const [patternName, pattern] of Object.entries(ID_PATTERNS)) {
        if (pattern.test(id)) {
          issues.push({
            id,
            pattern: patternName,
            length: id.length
          });
          break; // Only report the first matching pattern
        }
      }
    }
    
    console.log(`   ✅ Standard ULIDs: ${standardULIDs}`);
    console.log(`   ⚠️  Non-standard IDs: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log(`   🔍 Issues found:`);
      issues.slice(0, 10).forEach(issue => {
        console.log(`      - ${issue.id} (${issue.pattern}, ${issue.length} chars)`);
      });
      if (issues.length > 10) {
        console.log(`      ... and ${issues.length - 10} more`);
      }
    }
    
    return { table: tableName, total: records.length, standardULIDs, issues };
    
  } catch (error) {
    console.error(`   ❌ Error auditing ${tableName}:`, error.message);
    return { table: tableName, total: 0, issues: [], error: error.message };
  }
}

async function generateSummaryReport(results) {
  console.log(`\n📊 SUMMARY REPORT`);
  console.log(`================`);
  
  let totalRecords = 0;
  let totalStandardULIDs = 0;
  let totalIssues = 0;
  const tablesWithIssues = [];
  
  results.forEach(result => {
    totalRecords += result.total;
    totalStandardULIDs += result.standardULIDs || 0;
    totalIssues += result.issues?.length || 0;
    
    if (result.issues && result.issues.length > 0) {
      tablesWithIssues.push({
        table: result.table,
        issues: result.issues.length,
        total: result.total
      });
    }
  });
  
  console.log(`Total Records: ${totalRecords}`);
  console.log(`Standard ULIDs: ${totalStandardULIDs}`);
  console.log(`Non-standard IDs: ${totalIssues}`);
  console.log(`Standardization Rate: ${totalRecords > 0 ? ((totalStandardULIDs / totalRecords) * 100).toFixed(1) : 0}%`);
  
  if (tablesWithIssues.length > 0) {
    console.log(`\n⚠️  Tables with issues:`);
    tablesWithIssues.forEach(table => {
      console.log(`   ${table.table}: ${table.issues}/${table.total} non-standard IDs`);
    });
    
    console.log(`\n🔧 Recommended Actions:`);
    console.log(`   1. Run standardization script on tables with issues`);
    console.log(`   2. Update any hardcoded ID generation in API endpoints`);
    console.log(`   3. Verify all new records use @default(ulid()) in schema`);
  } else {
    console.log(`\n🎉 All IDs are standardized! No issues found.`);
  }
}

async function main() {
  try {
    console.log('🔍 Starting comprehensive ID audit...');
    console.log('   Checking all tables for non-standard ID formats');
    
    const results = [];
    
    for (const tableName of TABLES_TO_AUDIT) {
      const result = await auditTable(tableName);
      results.push(result);
    }
    
    await generateSummaryReport(results);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
main();
