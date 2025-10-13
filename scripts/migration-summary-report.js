#!/usr/bin/env node

/**
 * 📊 MIGRATION SUMMARY REPORT
 * 
 * Comprehensive report on what has been migrated and what's missing
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function migrationSummaryReport() {
  try {
    console.log('📊 MIGRATION SUMMARY REPORT\n');
    console.log('===========================\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to new database!\n');

    // 1. Current workspaces in new database
    console.log('📋 CURRENT WORKSPACES IN NEW DATABASE:');
    console.log('======================================');
    
    const workspaces = await newPrisma.workspaces.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    workspaces.forEach((workspace, index) => {
      console.log(`${index + 1}. ${workspace.name} (${workspace.id})`);
    });
    console.log('');

    // 2. Data counts by workspace
    console.log('📊 DATA COUNTS BY WORKSPACE:');
    console.log('============================');
    
    for (const workspace of workspaces) {
      const companyCount = await newPrisma.companies.count({
        where: { workspaceId: workspace.id }
      });
      
      const peopleCount = await newPrisma.people.count({
        where: { workspaceId: workspace.id }
      });
      
      console.log(`${workspace.name}:`);
      console.log(`  Companies: ${companyCount}`);
      console.log(`  People: ${peopleCount}`);
      console.log('');
    }

    // 3. User assignments
    console.log('👥 USER ASSIGNMENTS:');
    console.log('====================');
    
    const users = await newPrisma.users.findMany({
      where: {
        name: {
          in: ['Victoria Leland', 'Just Dano', 'Ryan Serrato']
        }
      }
    });
    
    for (const user of users) {
      const workspaceUsers = await newPrisma.workspace_users.findMany({
        where: { userId: user.id },
        include: { workspace: true }
      });
      
      console.log(`${user.name}:`);
      workspaceUsers.forEach(wu => {
        console.log(`  - ${wu.workspace.name} (${wu.role})`);
      });
      console.log('');
    }

    // 4. Missing workspaces from audit
    console.log('❌ MISSING WORKSPACES (from audit):');
    console.log('===================================');
    console.log('These workspaces have significant data but are not migrated:');
    console.log('');
    console.log('1. Demo Workspace: 2,000 companies, 19,254 people');
    console.log('2. TOP Engineering Plus: 514 companies, 4,179 people');
    console.log('3. Retail Product Solutions: 605 companies, 1,779 people');
    console.log('4. Adrata: 433 companies, 42 people');
    console.log('5. CloudCaddie: 25 companies, 43 people');
    console.log('');

    // 5. Migration status
    console.log('✅ COMPLETED MIGRATIONS:');
    console.log('========================');
    console.log('1. Notary Everyday: 3,676 companies, 394 people');
    console.log('   - All people set to LEAD status');
    console.log('   - Dano: Main seller for 3,626 companies');
    console.log('   - Ryan: Main seller for 50 companies');
    console.log('   - Victoria: Moved to SBI workspace');
    console.log('');

    // 6. Schema updates
    console.log('🔧 SCHEMA UPDATES COMPLETED:');
    console.log('============================');
    console.log('1. Added vertical field to people table');
    console.log('2. Added opportunity tracking fields to companies table');
    console.log('3. Changed notes field from Json to String for both tables');
    console.log('4. Added comprehensive SBI career and enrichment fields:');
    console.log('   - Career data (currentRole, experience, achievements)');
    console.log('   - Education data (degrees, institutions, fieldsOfStudy)');
    console.log('   - Skills & expertise (technicalSkills, softSkills)');
    console.log('   - Buyer group & decision making fields');
    console.log('   - Enrichment & intelligence data');
    console.log('   - Contact & verification data');
    console.log('');

    // 7. API updates
    console.log('🔌 API UPDATES COMPLETED:');
    console.log('=========================');
    console.log('1. Updated /api/v1/people to include vertical and notes');
    console.log('2. Updated /api/v1/companies to include opportunity fields and notes');
    console.log('3. All v1 APIs now support the new streamlined schema');
    console.log('');

    // 8. Recommendations
    console.log('🎯 NEXT STEPS RECOMMENDED:');
    console.log('===========================');
    console.log('1. Migrate Demo Workspace (largest dataset)');
    console.log('2. Migrate TOP Engineering Plus (high-value SBI data)');
    console.log('3. Migrate Retail Product Solutions');
    console.log('4. Migrate Adrata workspace');
    console.log('5. Migrate CloudCaddie workspace');
    console.log('6. Verify all company-people associations are preserved');
    console.log('7. Test UI components with migrated data');
    console.log('8. Update any remaining custom fields references');
    console.log('');

    console.log('🎉 MIGRATION STATUS: PARTIALLY COMPLETE');
    console.log('Notary Everyday workspace fully migrated with proper user assignments.');
    console.log('Several other workspaces with significant data still need migration.');

  } catch (error) {
    console.error('❌ Error during summary report:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the summary report
migrationSummaryReport();
