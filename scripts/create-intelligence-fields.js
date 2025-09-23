#!/usr/bin/env node

/**
 * 🔧 CREATE INTELLIGENCE FIELDS
 * 
 * This script creates the recommended database fields for rich
 * Overview and Intelligence tabs based on CoreSignal data analysis
 */

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function createIntelligenceFields() {
  console.log('🔧 CREATING INTELLIGENCE FIELDS');
  console.log('===============================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Check current schema
    console.log('📊 Checking current companies table schema...');
    const currentSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    const existingColumns = currentSchema.map(col => col.column_name);

    // Define new columns to add
    const newColumns = [
      // HIGH PRIORITY - Overview Tab Fields
      { name: 'linkedin_url', type: 'VARCHAR(500)', priority: 'HIGH', reason: 'Overview tab - LinkedIn profile' },
      { name: 'founded_year', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab - Company founding year' },
      { name: 'employee_count', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab - Number of employees' },
      { name: 'active_job_postings', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab - Current job postings' },
      { name: 'linkedin_followers', type: 'INTEGER', priority: 'HIGH', reason: 'Overview tab - LinkedIn follower count' },
      
      // HIGH PRIORITY - Intelligence Tab Fields
      { name: 'naics_codes', type: 'TEXT[]', priority: 'HIGH', reason: 'Intelligence tab - Industry classification' },
      { name: 'sic_codes', type: 'TEXT[]', priority: 'HIGH', reason: 'Intelligence tab - Standard industry codes' },
      { name: 'situation_analysis', type: 'TEXT', priority: 'HIGH', reason: 'Intelligence tab - AI-generated analysis' },
      { name: 'complications', type: 'TEXT', priority: 'HIGH', reason: 'Intelligence tab - AI-generated complications' },
      { name: 'strategic_intelligence', type: 'TEXT', priority: 'HIGH', reason: 'Intelligence tab - AI-generated insights' },
      
      // MEDIUM PRIORITY - Social Media Fields
      { name: 'facebook_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media - Facebook profile' },
      { name: 'twitter_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media - Twitter profile' },
      { name: 'instagram_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media - Instagram profile' },
      { name: 'youtube_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media - YouTube channel' },
      { name: 'github_url', type: 'VARCHAR(500)', priority: 'MEDIUM', reason: 'Social media - GitHub profile' },
      
      // MEDIUM PRIORITY - Business Intelligence Fields
      { name: 'technologies_used', type: 'TEXT[]', priority: 'MEDIUM', reason: 'Technology intelligence - Tech stack' },
      { name: 'competitors', type: 'TEXT[]', priority: 'MEDIUM', reason: 'Competitive analysis - Competitor list' },
      { name: 'revenue_currency', type: 'VARCHAR(3)', priority: 'MEDIUM', reason: 'Financial data - Revenue currency' },
      { name: 'last_funding_amount', type: 'BIGINT', priority: 'MEDIUM', reason: 'Financial data - Last funding amount' },
      { name: 'last_funding_date', type: 'DATE', priority: 'MEDIUM', reason: 'Financial data - Last funding date' }
    ];

    console.log('🔍 Checking which columns need to be added...');
    
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col.name));

    if (columnsToAdd.length === 0) {
      console.log('✅ All intelligence fields already exist!');
      return;
    }

    console.log(`📋 Columns to add: ${columnsToAdd.length}`);
    
    // Group by priority
    const highPriority = columnsToAdd.filter(col => col.priority === 'HIGH');
    const mediumPriority = columnsToAdd.filter(col => col.priority === 'MEDIUM');

    console.log(`   High Priority: ${highPriority.length} fields`);
    console.log(`   Medium Priority: ${mediumPriority.length} fields\n`);

    // Add high priority columns first
    if (highPriority.length > 0) {
      console.log('🔧 Adding HIGH PRIORITY columns...');
      for (const column of highPriority) {
        try {
          const sql = `ALTER TABLE companies ADD COLUMN ${column.name} ${column.type}`;
          console.log(`   Adding ${column.name}...`);
          
          await prisma.$executeRawUnsafe(sql);
          console.log(`   ✅ ${column.name} added successfully`);
          
          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️  ${column.name} already exists, skipping`);
          } else {
            console.error(`   ❌ Failed to add ${column.name}: ${error.message}`);
          }
        }
      }
    }

    // Add medium priority columns
    if (mediumPriority.length > 0) {
      console.log('\n🔧 Adding MEDIUM PRIORITY columns...');
      for (const column of mediumPriority) {
        try {
          const sql = `ALTER TABLE companies ADD COLUMN ${column.name} ${column.type}`;
          console.log(`   Adding ${column.name}...`);
          
          await prisma.$executeRawUnsafe(sql);
          console.log(`   ✅ ${column.name} added successfully`);
          
          // Small delay between operations
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ⚠️  ${column.name} already exists, skipping`);
          } else {
            console.error(`   ❌ Failed to add ${column.name}: ${error.message}`);
          }
        }
      }
    }

    // Verify final schema
    console.log('\n📊 Verifying final schema...');
    const finalSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Final columns:');
    finalSchema.forEach(col => {
      const isNew = columnsToAdd.some(newCol => newCol.name === col.column_name);
      const marker = isNew ? '🆕' : '  ';
      console.log(`   ${marker} ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n✅ Intelligence fields creation completed successfully!');
    console.log('🔒 All existing data preserved');

    console.log('\n💡 NEXT STEPS:');
    console.log('==============');
    console.log('1. 🔄 Regenerate Prisma client: npx prisma generate');
    console.log('2. 🚀 Run complete enrichment script');
    console.log('3. 📊 Update UI components to use new fields');
    console.log('4. 🎯 Enjoy rich Overview and Intelligence tabs!');

  } catch (error) {
    console.error('❌ Intelligence fields creation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createIntelligenceFields().catch(console.error);
