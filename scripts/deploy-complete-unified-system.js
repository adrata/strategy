#!/usr/bin/env node

/**
 * 🚀 DEPLOY COMPLETE UNIFIED SYSTEM
 * 
 * Complete deployment of the unified enrichment system with all critical fixes
 * Includes: Employment verification, person lookup, buyer group relevance, technology search
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

class UnifiedSystemDeployment {
  constructor() {
    this.deploymentResults = {
      startTime: Date.now(),
      schemaApplied: false,
      oldSystemsArchived: false,
      newSystemDeployed: false,
      testsCompleted: false,
      errors: []
    };
  }
  
  async deployCompleteSystem() {
    console.log('🚀 DEPLOYING COMPLETE UNIFIED ENRICHMENT SYSTEM');
    console.log('===============================================');
    console.log(`📅 Deployment Date: ${new Date().toISOString()}`);
    console.log('');
    
    try {
      // Step 1: Apply database schema enhancements
      await this.applyDatabaseEnhancements();
      
      // Step 2: Validate system health
      await this.validateSystemHealth();
      
      // Step 3: Run comprehensive tests
      await this.runComprehensiveTests();
      
      // Step 4: Archive old systems (only if tests pass)
      if (this.deploymentResults.testsCompleted) {
        await this.archiveOldSystems();
      }
      
      // Step 5: Deploy unified system
      await this.deployUnifiedSystem();
      
      // Step 6: Final validation
      await this.finalValidation();
      
      this.printDeploymentSummary();
      
      return this.deploymentResults;
      
    } catch (error) {
      console.error('💥 Deployment failed:', error);
      await this.rollbackDeployment();
      throw error;
    }
  }
  
  async applyDatabaseEnhancements() {
    console.log('📊 STEP 1: Applying Database Schema Enhancements');
    console.log('-'.repeat(50));
    
    try {
      // Check if enhancements already applied
      const hasEnhancements = await this.checkSchemaEnhancements();
      
      if (hasEnhancements) {
        console.log('  ✅ Schema enhancements already applied');
        this.deploymentResults.schemaApplied = true;
        return;
      }
      
      console.log('  📝 Applying schema enhancements...');
      
      // Apply the schema enhancements
      await prisma.$executeRaw`
        -- Add buyer group intelligence fields to people table
        ALTER TABLE people ADD COLUMN IF NOT EXISTS buyerGroupRole VARCHAR(100);
        ALTER TABLE people ADD COLUMN IF NOT EXISTS buyerGroupConfidence DECIMAL(5,2);
        ALTER TABLE people ADD COLUMN IF NOT EXISTS influenceScore INTEGER DEFAULT 0;
        ALTER TABLE people ADD COLUMN IF NOT EXISTS authorityLevel VARCHAR(50);
        ALTER TABLE people ADD COLUMN IF NOT EXISTS painPoints TEXT[] DEFAULT '{}';
        ALTER TABLE people ADD COLUMN IF NOT EXISTS coreSignalId INTEGER;
        ALTER TABLE people ADD COLUMN IF NOT EXISTS perplexityVerified BOOLEAN DEFAULT false;
        ALTER TABLE people ADD COLUMN IF NOT EXISTS lastBuyerGroupUpdate TIMESTAMP;
        
        -- Add company intelligence fields
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS coreSignalId INTEGER;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS buyerGroupsGenerated BOOLEAN DEFAULT false;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS lastBuyerGroupUpdate TIMESTAMP;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS buyingProcess JSONB;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS competitiveLandscape TEXT[] DEFAULT '{}';
        
        -- Add buyer group intelligence fields
        ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS cohesionScore DECIMAL(5,2);
        ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS completeness DECIMAL(5,2);
        ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS confidence DECIMAL(5,2);
        ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS generationMethod VARCHAR(50);
        ALTER TABLE buyer_groups ADD COLUMN IF NOT EXISTS lastValidated TIMESTAMP;
        
        -- Add performance indexes
        CREATE INDEX IF NOT EXISTS idx_people_buyer_group_role ON people(buyerGroupRole);
        CREATE INDEX IF NOT EXISTS idx_people_influence_score ON people(influenceScore);
        CREATE INDEX IF NOT EXISTS idx_people_coresignal_id ON people(coreSignalId);
        CREATE INDEX IF NOT EXISTS idx_companies_buyer_groups_generated ON companies(buyerGroupsGenerated);
      `;
      
      console.log('  ✅ Database schema enhancements applied successfully');
      this.deploymentResults.schemaApplied = true;
      
    } catch (error) {
      console.error('  ❌ Database enhancement failed:', error);
      this.deploymentResults.errors.push(`Schema: ${error.message}`);
      throw error;
    }
  }
  
  async validateSystemHealth() {
    console.log('\n🏥 STEP 2: Validating System Health');
    console.log('-'.repeat(35));
    
    try {
      // Check API keys
      const requiredKeys = [
        { name: 'CoreSignal', key: process.env.CORESIGNAL_API_KEY },
        { name: 'Hunter.io', key: process.env.HUNTER_API_KEY },
        { name: 'Prospeo', key: process.env.PROSPEO_API_KEY },
        { name: 'Perplexity', key: process.env.PERPLEXITY_API_KEY }
      ];
      
      console.log('  🔑 Checking API keys...');
      const missingKeys = requiredKeys.filter(({ key }) => !key);
      
      if (missingKeys.length > 0) {
        console.log('  ❌ Missing API keys:');
        missingKeys.forEach(({ name }) => console.log(`    - ${name}`));
        throw new Error(`Missing required API keys: ${missingKeys.map(k => k.name).join(', ')}`);
      }
      
      console.log('  ✅ All API keys present');
      
      // Check database connectivity
      console.log('  🗄️ Checking database connectivity...');
      await prisma.$queryRaw`SELECT 1`;
      console.log('  ✅ Database connectivity confirmed');
      
      // Check TOP workspace data
      console.log('  📊 Checking TOP workspace data...');
      const topData = await this.checkTOPWorkspaceData();
      console.log(`  📈 TOP data: ${topData.companies} companies, ${topData.people} people`);
      
      if (topData.companies === 0) {
        throw new Error('No TOP companies found - check workspace ID');
      }
      
      console.log('  ✅ System health validation complete');
      
    } catch (error) {
      console.error('  ❌ System health validation failed:', error);
      this.deploymentResults.errors.push(`Health: ${error.message}`);
      throw error;
    }
  }
  
  async runComprehensiveTests() {
    console.log('\n🧪 STEP 3: Running Comprehensive Tests');
    console.log('-'.repeat(38));
    
    try {
      console.log('  🔧 Executing complete unified system test...');
      
      // Import and run the comprehensive test
      const { CompleteUnifiedSystemTest } = require('./complete-unified-system-test');
      const tester = new CompleteUnifiedSystemTest();
      const testResults = await tester.runCompleteTest();
      
      if (testResults.passedTests === testResults.totalTests && testResults.criticalIssues.length === 0) {
        console.log('  ✅ All tests passed - system ready for deployment');
        this.deploymentResults.testsCompleted = true;
      } else {
        throw new Error(`Tests failed: ${testResults.failedTests}/${testResults.totalTests}, Critical issues: ${testResults.criticalIssues.length}`);
      }
      
    } catch (error) {
      console.error('  ❌ Comprehensive tests failed:', error);
      this.deploymentResults.errors.push(`Tests: ${error.message}`);
      throw error;
    }
  }
  
  async archiveOldSystems() {
    console.log('\n🗂️ STEP 4: Archiving Old Enrichment Systems');
    console.log('-'.repeat(43));
    
    try {
      console.log('  📦 Executing archival of redundant systems...');
      
      // Import and run the archival system
      const { EnrichmentSystemArchiver } = require('./archive-old-enrichment-systems');
      const archiver = new EnrichmentSystemArchiver();
      await archiver.archiveOldSystems();
      
      console.log('  ✅ Old systems archived successfully');
      this.deploymentResults.oldSystemsArchived = true;
      
    } catch (error) {
      console.error('  ❌ Archival failed:', error);
      this.deploymentResults.errors.push(`Archival: ${error.message}`);
      throw error;
    }
  }
  
  async deployUnifiedSystem() {
    console.log('\n🚀 STEP 5: Deploying Unified System');
    console.log('-'.repeat(33));
    
    try {
      console.log('  🔧 Building and deploying unified system...');
      
      // Build the system
      const { execSync } = require('child_process');
      
      console.log('  📦 Building Next.js application...');
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('  🚀 Deploying to Vercel...');
      execSync('vercel --prod', { stdio: 'inherit' });
      
      console.log('  ✅ Unified system deployed successfully');
      this.deploymentResults.newSystemDeployed = true;
      
    } catch (error) {
      console.error('  ❌ Deployment failed:', error);
      this.deploymentResults.errors.push(`Deployment: ${error.message}`);
      throw error;
    }
  }
  
  async finalValidation() {
    console.log('\n✅ STEP 6: Final Validation');
    console.log('-'.repeat(25));
    
    try {
      // Test unified API endpoint
      console.log('  🔌 Testing unified API endpoint...');
      
      const healthResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/enrichment/unified?operation=health`);
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log(`  ✅ API health: ${health.status}`);
      } else {
        throw new Error(`API health check failed: ${healthResponse.status}`);
      }
      
      // Test capabilities endpoint
      const capabilitiesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/enrichment/unified?operation=capabilities`);
      
      if (capabilitiesResponse.ok) {
        const capabilities = await capabilitiesResponse.json();
        console.log(`  📊 Available operations: ${Object.keys(capabilities.operations).join(', ')}`);
      }
      
      console.log('  ✅ Final validation complete');
      
    } catch (error) {
      console.error('  ❌ Final validation failed:', error);
      this.deploymentResults.errors.push(`Validation: ${error.message}`);
      throw error;
    }
  }
  
  async checkSchemaEnhancements() {
    try {
      // Check if new columns exist
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'people' 
          AND column_name IN ('buyerGroupRole', 'influenceScore', 'coreSignalId')
      `;
      
      return result.length >= 3;
    } catch (error) {
      return false;
    }
  }
  
  async checkTOPWorkspaceData() {
    const [companies, people] = await Promise.all([
      prisma.companies.count({
        where: {
          workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
          deletedAt: null
        }
      }),
      prisma.people.count({
        where: {
          workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
          deletedAt: null
        }
      })
    ]);
    
    return { companies, people };
  }
  
  async rollbackDeployment() {
    console.log('\n🔄 ROLLING BACK DEPLOYMENT...');
    console.log('-'.repeat(30));
    
    try {
      // Rollback any applied changes
      if (this.deploymentResults.schemaApplied) {
        console.log('  ⚠️ Schema changes applied - manual rollback may be needed');
      }
      
      if (this.deploymentResults.oldSystemsArchived) {
        console.log('  📦 Old systems archived - can be restored from archive');
      }
      
      console.log('  💡 Check deployment logs and archives for recovery options');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    }
  }
  
  printDeploymentSummary() {
    const duration = Date.now() - this.deploymentResults.startTime;
    
    console.log('\n🎉 DEPLOYMENT SUMMARY');
    console.log('='.repeat(25));
    console.log(`⏱️ Total Duration: ${Math.round(duration/1000/60)} minutes`);
    console.log(`📊 Schema Applied: ${this.deploymentResults.schemaApplied ? '✅' : '❌'}`);
    console.log(`🧪 Tests Completed: ${this.deploymentResults.testsCompleted ? '✅' : '❌'}`);
    console.log(`🗂️ Old Systems Archived: ${this.deploymentResults.oldSystemsArchived ? '✅' : '❌'}`);
    console.log(`🚀 New System Deployed: ${this.deploymentResults.newSystemDeployed ? '✅' : '❌'}`);
    
    if (this.deploymentResults.errors.length > 0) {
      console.log(`\n❌ Errors (${this.deploymentResults.errors.length}):`);
      this.deploymentResults.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    const allSuccess = this.deploymentResults.schemaApplied && 
                      this.deploymentResults.testsCompleted && 
                      this.deploymentResults.oldSystemsArchived && 
                      this.deploymentResults.newSystemDeployed;
    
    if (allSuccess) {
      console.log('\n🎯 DEPLOYMENT SUCCESSFUL!');
      console.log('✅ Unified enrichment system is now live');
      console.log('📋 Ready for TOP enrichment and production use');
      
      console.log('\n🚀 IMMEDIATE NEXT STEPS:');
      console.log('1. Test unified API: GET /api/enrichment/unified?operation=health');
      console.log('2. Run TOP enrichment: node scripts/top-implementation/top-24h-enrichment.js');
      console.log('3. Monitor performance and accuracy metrics');
      console.log('4. Update client integrations to use unified API');
    } else {
      console.log('\n⚠️ PARTIAL DEPLOYMENT');
      console.log('🔧 Some steps failed - review errors and retry');
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Starting complete unified system deployment...');
    
    const deployment = new UnifiedSystemDeployment();
    const results = await deployment.deployCompleteSystem();
    
    console.log('\n✨ Deployment process complete!');
    console.log('📖 Check deployment summary above for results');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Deployment process failed:', error);
    console.log('\n🔄 Recovery options:');
    console.log('1. Check error messages above');
    console.log('2. Review deployment logs');
    console.log('3. Restore from archives if needed');
    console.log('4. Contact development team for assistance');
    
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { UnifiedSystemDeployment };
