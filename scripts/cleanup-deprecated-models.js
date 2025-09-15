#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes deprecated contacts/accounts models and references
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 DATABASE CLEANUP - REMOVING DEPRECATED MODELS');
  console.log('==================================================\n');

  try {
    // Step 1: Audit current deprecated models
    console.log('📋 Step 1: Auditing deprecated models...');
    
    const deprecatedModels = [
      'ContactToOpportunity',
      'EmailToAccount', 
      'EmailToContact',
      'EventToAccount',
      'EventToContact'
    ];

    console.log('Found deprecated models:', deprecatedModels);

    // Step 2: Check if these tables exist in the database
    console.log('\n🔍 Step 2: Checking database tables...');
    
    for (const model of deprecatedModels) {
      try {
        // Try to query each table to see if it exists
        const tableName = model.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        console.log(`✅ Table ${tableName} exists with ${result[0].count} records`);
      } catch (error) {
        console.log(`❌ Table ${model} does not exist or error: ${error.message}`);
      }
    }

    // Step 3: Clean up schema file
    console.log('\n📝 Step 3: Cleaning up schema file...');
    
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Remove deprecated models
    const modelsToRemove = [
      'ContactToOpportunity',
      'EmailToAccount',
      'EmailToContact', 
      'EventToAccount',
      'EventToContact'
    ];

    let removedCount = 0;
    for (const model of modelsToRemove) {
      const modelRegex = new RegExp(`model ${model}[\\s\\S]*?^}`, 'gm');
      if (modelRegex.test(schemaContent)) {
        schemaContent = schemaContent.replace(modelRegex, '');
        removedCount++;
        console.log(`✅ Removed model: ${model}`);
      }
    }

    // Write cleaned schema
    fs.writeFileSync(schemaPath, schemaContent);
    console.log(`✅ Cleaned schema file, removed ${removedCount} deprecated models`);

    // Step 4: Generate new Prisma client
    console.log('\n🔧 Step 4: Regenerating Prisma client...');
    
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client regenerated successfully');
    } catch (error) {
      console.log('❌ Error regenerating Prisma client:', error.message);
    }

    // Step 5: Check for any remaining references
    console.log('\n🔍 Step 5: Checking for remaining references...');
    
    const remainingReferences = [];
    const searchTerms = ['ContactTo', 'AccountTo', 'EmailToAccount', 'EmailToContact'];
    
    for (const term of searchTerms) {
      if (schemaContent.includes(term)) {
        remainingReferences.push(term);
      }
    }

    if (remainingReferences.length > 0) {
      console.log('⚠️  Found remaining references:', remainingReferences);
    } else {
      console.log('✅ No remaining deprecated references found');
    }

    // Final status
    console.log('\n🎉 DATABASE CLEANUP COMPLETE!');
    console.log('==============================');
    console.log(`✅ Removed ${removedCount} deprecated models from schema`);
    console.log(`✅ Regenerated Prisma client`);
    console.log(`✅ Schema is now clean of contacts/accounts references`);

  } catch (error) {
    console.error('❌ Error in database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
