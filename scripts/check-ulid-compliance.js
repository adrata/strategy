#!/usr/bin/env node

/**
 * 🔍 CHECK ULID COMPLIANCE
 * 
 * Checks all records in the database to ensure they have proper ULIDs
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function checkUlidCompliance() {
  try {
    console.log('🔍 CHECKING ULID COMPLIANCE\n');
    console.log('===========================\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // ULID pattern: 26 characters, starts with timestamp (0-9), contains uppercase letters and numbers
    const ulidPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    
    // Models to check (excluding those that use CUID in schema)
    const modelsToCheck = [
      'roles',
      'permissions', 
      'role_permissions',
      'user_roles',
      'workspaces',
      'users',
      'workspace_users',
      'auth_sessions',
      'reset_tokens',
      'companies',
      'people',
      'person_co_sellers',
      'actions',
      'audit_logs',
      'grand_central_connections',
      'grand_central_workflows',
      'grand_central_executions',
      'BuyerGroupMembers',
      'BuyerGroups',
      'ChronicleReport',
      'ChronicleShare',
      'ai_conversations',
      'ai_messages'
    ];

    let totalRecords = 0;
    let nonUlidRecords = 0;
    const issues = [];

    for (const modelName of modelsToCheck) {
      try {
        console.log(`📋 Checking ${modelName}...`);
        
        // Get all records for this model
        const records = await newPrisma[modelName].findMany({
          select: { id: true }
        });
        
        const modelTotal = records.length;
        const modelNonUlid = records.filter(record => !ulidPattern.test(record.id)).length;
        
        totalRecords += modelTotal;
        nonUlidRecords += modelNonUlid;
        
        if (modelNonUlid > 0) {
          const nonUlidIds = records
            .filter(record => !ulidPattern.test(record.id))
            .map(record => record.id)
            .slice(0, 5); // Show first 5 examples
          
          issues.push({
            model: modelName,
            total: modelTotal,
            nonUlid: modelNonUlid,
            examples: nonUlidIds
          });
          
          console.log(`   ❌ ${modelNonUlid}/${modelTotal} records have non-ULID IDs`);
          console.log(`   Examples: ${nonUlidIds.join(', ')}`);
        } else {
          console.log(`   ✅ All ${modelTotal} records have valid ULIDs`);
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error checking ${modelName}: ${error.message}`);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total records checked: ${totalRecords}`);
    console.log(`Records with non-ULID IDs: ${nonUlidRecords}`);
    console.log(`Compliance rate: ${((totalRecords - nonUlidRecords) / totalRecords * 100).toFixed(2)}%`);

    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      console.log('================');
      issues.forEach(issue => {
        console.log(`${issue.model}: ${issue.nonUlid}/${issue.total} non-ULID records`);
        console.log(`  Examples: ${issue.examples.join(', ')}`);
      });
      
      console.log('\n🔧 RECOMMENDATIONS:');
      console.log('===================');
      console.log('1. Update schema to use @default(ulid()) for all models');
      console.log('2. Create migration script to update existing non-ULID records');
      console.log('3. Ensure all new records use ULID format');
    } else {
      console.log('\n🎉 ALL RECORDS ARE ULID COMPLIANT!');
    }

  } catch (error) {
    console.error('❌ Error during ULID compliance check:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the check
checkUlidCompliance();
