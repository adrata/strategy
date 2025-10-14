#!/usr/bin/env node

/**
 * Migration Status Check Script
 * 
 * This script checks which migrations have been applied to the database
 * and compares them against the expected migrations from the migration files.
 * 
 * Usage: node scripts/check-migration-status.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function checkMigrationStatus() {
  console.log('🔍 Checking Migration Status...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // 1. Get applied migrations from database
    console.log('1. Fetching applied migrations from database...');
    const appliedMigrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        finished_at,
        applied_steps_count,
        checksum
      FROM _prisma_migrations 
      ORDER BY finished_at ASC;
    `;

    const appliedMigrationNames = appliedMigrations.map(m => m.migration_name);
    console.log(`✅ Found ${appliedMigrationNames.length} applied migrations\n`);

    // 2. Get expected migrations from migration files
    console.log('2. Reading migration files...');
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('❌ Migrations directory not found');
      return;
    }

    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory())
      .sort();

    console.log(`✅ Found ${migrationDirs.length} migration directories\n`);

    // 3. Compare applied vs expected migrations
    console.log('3. Comparing applied vs expected migrations...');
    
    const missingMigrations = migrationDirs.filter(migration => 
      !appliedMigrationNames.includes(migration)
    );
    
    const extraMigrations = appliedMigrationNames.filter(migration => 
      !migrationDirs.includes(migration)
    );

    // 4. Check for critical migrations
    const criticalMigrations = [
      '20251009004916_baseline_streamlined_schema',
      '20251012140945_rename_to_main_seller',
      '20250130000000_add_ui_fields_and_opportunity_tracking'
    ];

    const missingCriticalMigrations = criticalMigrations.filter(migration => 
      !appliedMigrationNames.includes(migration)
    );

    // 5. Display results
    console.log('📊 Migration Status Report:');
    console.log('=' .repeat(50));
    console.log(`Total migration files: ${migrationDirs.length}`);
    console.log(`Applied migrations: ${appliedMigrationNames.length}`);
    console.log(`Missing migrations: ${missingMigrations.length}`);
    console.log(`Extra migrations: ${extraMigrations.length}`);
    console.log(`Missing critical migrations: ${missingCriticalMigrations.length}`);
    console.log('');

    if (missingMigrations.length > 0) {
      console.log('❌ Missing Migrations:');
      missingMigrations.forEach(migration => {
        const isCritical = criticalMigrations.includes(migration);
        console.log(`   ${isCritical ? '🚨' : '⚠️ '} ${migration} ${isCritical ? '(CRITICAL)' : ''}`);
      });
      console.log('');
    }

    if (extraMigrations.length > 0) {
      console.log('⚠️  Extra Migrations (not in files):');
      extraMigrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
      console.log('');
    }

    if (missingCriticalMigrations.length > 0) {
      console.log('🚨 CRITICAL: Missing Critical Migrations:');
      missingCriticalMigrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
      console.log('');
    }

    // 6. Show recent migrations
    console.log('📅 Recent Applied Migrations:');
    const recentMigrations = appliedMigrations.slice(-10);
    recentMigrations.forEach(migration => {
      const date = new Date(migration.finished_at).toLocaleDateString();
      console.log(`   - ${migration.migration_name} (${date})`);
    });
    console.log('');

    // 7. Generate recommendations
    console.log('💡 Recommendations:');
    
    if (missingCriticalMigrations.length > 0) {
      console.log('🚨 IMMEDIATE ACTION REQUIRED:');
      console.log('   Critical migrations are missing. These must be applied immediately.');
      console.log('   Run: npx prisma migrate deploy');
      console.log('');
    }

    if (missingMigrations.length > 0 && missingCriticalMigrations.length === 0) {
      console.log('⚠️  ACTION RECOMMENDED:');
      console.log('   Some migrations are missing but none are critical.');
      console.log('   Run: npx prisma migrate deploy');
      console.log('');
    }

    if (missingMigrations.length === 0) {
      console.log('✅ All migrations are up to date!');
    }

    // 8. Check if we're using the streamlined schema
    console.log('🔍 Schema Configuration Check:');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const buildScript = packageJson.scripts?.build || '';
      const postinstallScript = packageJson.scripts?.postinstall || '';
      
      if (buildScript.includes('schema-streamlined.prisma') || 
          postinstallScript.includes('schema-streamlined.prisma')) {
        console.log('✅ Using streamlined schema (schema-streamlined.prisma)');
      } else {
        console.log('⚠️  Not using streamlined schema - check package.json scripts');
      }
    }

    console.log('\n✅ Migration status check completed');

  } catch (error) {
    console.error('❌ Migration status check failed:', error);
    
    if (error.code === 'P1001') {
      console.log('💡 Database connection failed. Check your DATABASE_URL environment variable.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration status check
checkMigrationStatus().catch(console.error);
