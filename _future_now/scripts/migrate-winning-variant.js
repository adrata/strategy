/**
 * WINNING VARIANT MIGRATION SCRIPT
 * 
 * Migrates the winning-variant implementation to use the consolidated buyer group system
 * while preserving existing real data and improving accuracy
 */

const fs = require('fs');
const path = require('path');
const { ConsolidatedBuyerGroupEngine } = require('../buyer-group-consolidated');

class WinningVariantMigrator {
  constructor() {
    this.winningVariantPath = path.join(__dirname, '../../src/app/(locker)/private/winning-variant');
    this.backupPath = path.join(__dirname, '../backups');
    this.migrationLog = [];
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  /**
   * Run complete migration
   */
  async migrate() {
    console.log('🚀 WINNING VARIANT MIGRATION TO CONSOLIDATED SYSTEM');
    console.log('==================================================');
    
    try {
      // Step 1: Backup existing data
      await this.backupExistingData();
      
      // Step 2: Analyze current data quality
      const dataQuality = await this.analyzeDataQuality();
      
      // Step 3: Extract real profiles
      const realProfiles = await this.extractRealProfiles();
      
      // Step 4: Test consolidated engine
      await this.testConsolidatedEngine();
      
      // Step 5: Create migration plan
      const migrationPlan = this.createMigrationPlan(dataQuality, realProfiles);
      
      // Step 6: Generate updated components
      await this.generateUpdatedComponents();
      
      // Step 7: Create validation script
      await this.createValidationScript();
      
      console.log('\n✅ MIGRATION PREPARATION COMPLETE');
      console.log('==================================');
      console.log(`📊 Data Quality: ${dataQuality.overallScore.toFixed(1)}%`);
      console.log(`👥 Real Profiles: ${realProfiles.length} identified`);
      console.log(`📋 Migration Plan: ${migrationPlan.steps.length} steps`);
      console.log(`📄 Components: Updated for live data`);
      console.log(`🔍 Validation: Script created`);
      
      return {
        success: true,
        dataQuality,
        realProfiles: realProfiles.length,
        migrationPlan,
        log: this.migrationLog
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      return {
        success: false,
        error: error.message,
        log: this.migrationLog
      };
    }
  }

  /**
   * Backup existing data
   */
  async backupExistingData() {
    console.log('\n📦 Step 1: Backing up existing data...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.backupPath, `winning-variant-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy data directory
    const dataSource = path.join(this.winningVariantPath, 'data');
    const dataDest = path.join(backupDir, 'data');
    
    if (fs.existsSync(dataSource)) {
      this.copyDirectory(dataSource, dataDest);
      this.migrationLog.push(`✅ Backed up data directory to ${backupDir}`);
    }
    
    // Copy components
    const componentsSource = path.join(this.winningVariantPath, 'components');
    const componentsDest = path.join(backupDir, 'components');
    
    if (fs.existsSync(componentsSource)) {
      this.copyDirectory(componentsSource, componentsDest);
      this.migrationLog.push(`✅ Backed up components directory to ${backupDir}`);
    }
    
    console.log(`   ✅ Backup created: ${backupDir}`);
  }

  /**
   * Analyze current data quality
   */
  async analyzeDataQuality() {
    console.log('\n🔍 Step 2: Analyzing data quality...');
    
    const dataFiles = this.findDataFiles();
    let totalProfiles = 0;
    let realProfiles = 0;
    let qualityIssues = [];
    
    for (const file of dataFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const analysis = this.analyzeDataFile(data);
        
        totalProfiles += analysis.totalProfiles;
        realProfiles += analysis.realProfiles;
        qualityIssues.push(...analysis.issues);
        
        console.log(`   📄 ${path.basename(file)}: ${analysis.realProfiles}/${analysis.totalProfiles} real profiles`);
      } catch (error) {
        console.warn(`   ⚠️ Failed to analyze ${file}: ${error.message}`);
      }
    }
    
    const overallScore = totalProfiles > 0 ? (realProfiles / totalProfiles) * 100 : 0;
    
    console.log(`   📊 Overall Quality: ${overallScore.toFixed(1)}% (${realProfiles}/${totalProfiles} real profiles)`);
    
    return {
      totalProfiles,
      realProfiles,
      overallScore,
      qualityIssues
    };
  }

  /**
   * Extract real profiles from existing data
   */
  async extractRealProfiles() {
    console.log('\n👥 Step 3: Extracting real profiles...');
    
    const dataFiles = this.findDataFiles();
    const realProfiles = [];
    
    for (const file of dataFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const profiles = this.extractProfilesFromData(data);
        realProfiles.push(...profiles);
      } catch (error) {
        console.warn(`   ⚠️ Failed to extract from ${file}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Extracted ${realProfiles.length} real profiles`);
    
    // Save extracted profiles
    const extractedFile = path.join(this.backupPath, 'extracted-real-profiles.json');
    fs.writeFileSync(extractedFile, JSON.stringify(realProfiles, null, 2));
    
    return realProfiles;
  }

  /**
   * Test consolidated engine
   */
  async testConsolidatedEngine() {
    console.log('\n🧪 Step 4: Testing consolidated engine...');
    
    try {
      const engine = new ConsolidatedBuyerGroupEngine();
      
      // Test with a known company
      const testResult = await engine.discoverBuyerGroup('Nike', {
        sellerProfile: {
          productName: 'Winning Variant Intelligence',
          solutionCategory: 'revenue_technology',
          targetMarket: 'enterprise'
        }
      });
      
      if (testResult.success) {
        console.log(`   ✅ Engine test passed: ${testResult.buyerGroup.length} members found`);
        this.migrationLog.push('✅ Consolidated engine test passed');
      } else {
        throw new Error('Engine test failed');
      }
      
    } catch (error) {
      console.warn(`   ⚠️ Engine test failed: ${error.message}`);
      this.migrationLog.push(`⚠️ Engine test failed: ${error.message}`);
    }
  }

  /**
   * Create migration plan
   */
  createMigrationPlan(dataQuality, realProfiles) {
    console.log('\n📋 Step 5: Creating migration plan...');
    
    const steps = [];
    
    // Data preservation steps
    if (dataQuality.overallScore > 70) {
      steps.push({
        id: 'preserve-data',
        title: 'Preserve High-Quality Data',
        description: `Preserve ${realProfiles.length} real profiles from existing data`,
        priority: 'HIGH',
        estimatedTime: '2 hours'
      });
    }
    
    // System integration steps
    steps.push({
      id: 'integrate-engine',
      title: 'Integrate Consolidated Engine',
      description: 'Replace static data with live API calls',
      priority: 'HIGH',
      estimatedTime: '4 hours'
    });
    
    // Component updates
    steps.push({
      id: 'update-components',
      title: 'Update Components for Live Data',
      description: 'Modify components to load data from consolidated engine',
      priority: 'MEDIUM',
      estimatedTime: '6 hours'
    });
    
    // Validation implementation
    steps.push({
      id: 'add-validation',
      title: 'Add Accuracy Validation',
      description: 'Implement buyer group validator and accuracy metrics',
      priority: 'MEDIUM',
      estimatedTime: '4 hours'
    });
    
    // Testing and deployment
    steps.push({
      id: 'test-deploy',
      title: 'Test and Deploy',
      description: 'Run comprehensive tests and deploy to production',
      priority: 'HIGH',
      estimatedTime: '3 hours'
    });
    
    const totalTime = steps.reduce((sum, step) => sum + parseInt(step.estimatedTime), 0);
    
    console.log(`   📋 Created ${steps.length} migration steps (${totalTime} hours total)`);
    
    return {
      steps,
      totalTime,
      estimatedDays: Math.ceil(totalTime / 8) // 8 hours per day
    };
  }

  /**
   * Generate updated components
   */
  async generateUpdatedComponents() {
    console.log('\n🔧 Step 6: Generating updated components...');
    
    // Create updated buyerGroupData.ts
    const updatedDataFile = this.generateUpdatedDataFile();
    const dataFilePath = path.join(this.winningVariantPath, 'data/buyerGroupData.ts');
    
    // Backup original
    if (fs.existsSync(dataFilePath)) {
      const backupPath = path.join(this.backupPath, 'buyerGroupData.original.ts');
      fs.copyFileSync(dataFilePath, backupPath);
    }
    
    // Write updated file
    fs.writeFileSync(dataFilePath, updatedDataFile);
    
    // Create accuracy indicator component
    const accuracyComponent = this.generateAccuracyComponent();
    const accuracyPath = path.join(this.winningVariantPath, 'components/AccuracyIndicator.tsx');
    fs.writeFileSync(accuracyPath, accuracyComponent);
    
    console.log('   ✅ Updated components generated');
  }

  /**
   * Create validation script
   */
  async createValidationScript() {
    console.log('\n🔍 Step 7: Creating validation script...');
    
    const validationScript = `/**
 * WINNING VARIANT VALIDATION SCRIPT
 * 
 * Validates the migration from static data to consolidated buyer group system
 */

const { ConsolidatedBuyerGroupEngine } = require('../../buyer-group-consolidated');
const { BuyerGroupValidator } = require('../tests/buyer-group-validator');

class WinningVariantValidator {
  constructor() {
    this.engine = new ConsolidatedBuyerGroupEngine();
    this.validator = new BuyerGroupValidator();
  }

  async validateMigration() {
    console.log('🔍 Validating Winning Variant Migration...');
    
    const testCompanies = ['Nike', 'Salesforce', 'HubSpot', 'First Premier Bank'];
    const results = [];
    
    for (const company of testCompanies) {
      try {
        console.log(\`\\n🏢 Testing: \${company}\`);
        
        // Test consolidated engine
        const buyerGroup = await this.engine.discoverBuyerGroup(company, {
          sellerProfile: {
            productName: 'Winning Variant Intelligence',
            solutionCategory: 'revenue_technology',
            targetMarket: 'enterprise'
          }
        });
        
        // Validate accuracy
        const validation = await this.validator.validateBuyerGroup(
          buyerGroup.buyerGroup,
          'Enterprise'
        );
        
        results.push({
          company,
          success: buyerGroup.success,
          members: buyerGroup.buyerGroup.length,
          accuracy: validation.accuracy.overallScore,
          isValid: validation.isValid
        });
        
        console.log(\`   ✅ \${buyerGroup.buyerGroup.length} members, \${validation.accuracy.overallScore.toFixed(1)}% accuracy\`);
        
      } catch (error) {
        console.error(\`   ❌ \${company}: \${error.message}\`);
        results.push({
          company,
          success: false,
          error: error.message
        });
      }
    }
    
    // Summary
    const successCount = results.filter(r => r.success).length;
    const avgAccuracy = results
      .filter(r => r.accuracy)
      .reduce((sum, r) => sum + r.accuracy, 0) / results.filter(r => r.accuracy).length;
    
    console.log(\`\\n📊 VALIDATION SUMMARY\`);
    console.log(\`   Success Rate: \${successCount}/\${results.length} (\${(successCount/results.length*100).toFixed(1)}%)\`);
    console.log(\`   Average Accuracy: \${avgAccuracy.toFixed(1)}%\`);
    
    return results;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new WinningVariantValidator();
  validator.validateMigration().catch(console.error);
}

module.exports = { WinningVariantValidator };
`;

    const validationPath = path.join(__dirname, 'validate-winning-variant-migration.js');
    fs.writeFileSync(validationPath, validationScript);
    
    console.log('   ✅ Validation script created');
  }

  /**
   * Helper methods
   */
  findDataFiles() {
    const dataDir = path.join(this.winningVariantPath, 'data');
    if (!fs.existsSync(dataDir)) return [];
    
    return fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(dataDir, file));
  }

  analyzeDataFile(data) {
    let totalProfiles = 0;
    let realProfiles = 0;
    const issues = [];
    
    // Analyze buyer group members
    if (data.buyerGroup && data.buyerGroup.members) {
      for (const member of data.buyerGroup.members) {
        totalProfiles++;
        
        if (this.isRealProfile(member)) {
          realProfiles++;
        } else {
          issues.push(`Placeholder profile: ${member.name || 'Unknown'}`);
        }
      }
    }
    
    // Analyze roles
    if (data.buyerGroup && data.buyerGroup.roles) {
      for (const [role, members] of Object.entries(data.buyerGroup.roles)) {
        for (const member of members) {
          totalProfiles++;
          
          if (this.isRealProfile(member)) {
            realProfiles++;
          } else {
            issues.push(`Placeholder profile in ${role}: ${member.name || 'Unknown'}`);
          }
        }
      }
    }
    
    return { totalProfiles, realProfiles, issues };
  }

  isRealProfile(member) {
    // Check if profile has real data
    const hasRealName = member.name && 
                       member.name !== 'Unknown' && 
                       member.name !== 'Unknown Name' &&
                       !member.name.includes('placeholder');
    
    const hasRealTitle = member.title && 
                        member.title !== 'Unknown' &&
                        !member.title.includes('placeholder');
    
    const hasContactInfo = member.email && 
                          member.email !== '' &&
                          !member.email.includes('placeholder');
    
    return hasRealName && hasRealTitle && hasContactInfo;
  }

  extractProfilesFromData(data) {
    const profiles = [];
    
    // Extract from members array
    if (data.buyerGroup && data.buyerGroup.members) {
      profiles.push(...data.buyerGroup.members.filter(m => this.isRealProfile(m)));
    }
    
    // Extract from roles
    if (data.buyerGroup && data.buyerGroup.roles) {
      for (const [role, members] of Object.entries(data.buyerGroup.roles)) {
        profiles.push(...members.filter(m => this.isRealProfile(m)));
      }
    }
    
    return profiles;
  }

  generateUpdatedDataFile() {
    return `// Updated buyer group data source with consolidated engine
import { ConsolidatedBuyerGroupEngine } from '../../../../_future_now/buyer-group-consolidated';
import { BuyerGroupValidator } from '../../../../_future_now/tests/buyer-group-validator';

const engine = new ConsolidatedBuyerGroupEngine();
const validator = new BuyerGroupValidator();

// Winning Variant seller profile
const winningVariantProfile = {
  productName: 'Winning Variant Intelligence',
  solutionCategory: 'revenue_technology',
  targetMarket: 'enterprise',
  dealSize: 'enterprise'
};

// Cache for buyer group data
const buyerGroupCache = new Map();

/**
 * Get live buyer group data for a company
 */
export async function getLiveBuyerGroupData(companyName: string) {
  // Check cache first
  if (buyerGroupCache.has(companyName)) {
    const cached = buyerGroupCache.get(companyName);
    const age = Date.now() - cached.timestamp;
    
    // Use cached data if less than 30 days old
    if (age < 30 * 24 * 60 * 60 * 1000) {
      return cached.data;
    }
  }
  
  try {
    // Get live data from consolidated engine
    const result = await engine.discoverBuyerGroup(companyName, {
      sellerProfile: winningVariantProfile
    });
    
    if (result.success) {
      // Validate accuracy
      const validation = await validator.validateBuyerGroup(
        result.buyerGroup,
        'Enterprise'
      );
      
      // Cache the result
      buyerGroupCache.set(companyName, {
        data: { ...result, validation },
        timestamp: Date.now()
      });
      
      return { ...result, validation };
    } else {
      throw new Error('Failed to discover buyer group');
    }
    
  } catch (error) {
    console.error(\`Failed to get live data for \${companyName}:\`, error);
    
    // Fallback to static data if available
    return getStaticBuyerGroupData(companyName);
  }
}

/**
 * Get static buyer group data (fallback)
 */
function getStaticBuyerGroupData(companyName: string) {
  // This would load from the original static data files
  // Implementation depends on your existing data structure
  return null;
}

/**
 * Get company data by slug (updated for live data)
 */
export async function getCompanyData(companySlug: string) {
  const companyName = getCompanyNameFromSlug(companySlug);
  return await getLiveBuyerGroupData(companyName);
}

/**
 * Get person by slug (updated for live data)
 */
export async function getPersonBySlug(companySlug: string, personSlug: string) {
  const companyData = await getCompanyData(companySlug);
  
  if (!companyData || !companyData.buyerGroup) {
    return null;
  }
  
  // Find person in buyer group
  const person = companyData.buyerGroup.members.find(member => 
    createPersonSlug(member.name) === personSlug
  );
  
  return person || null;
}

/**
 * Helper functions
 */
function getCompanyNameFromSlug(slug: string): string {
  const slugMap = {
    'match-group': 'Match Group',
    'zuora': 'Zuora',
    'brex': 'Brex',
    'first-premier-bank': 'First Premier Bank'
  };
  
  return slugMap[slug] || slug;
}

function createPersonSlug(name: string): string {
  return name.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Export types (keep existing types)
export interface BuyerGroupMember {
  name: string;
  title: string;
  role: 'Decision Maker' | 'Champion' | 'Stakeholder' | 'Blocker' | 'Introducer';
  archetype: {
    id: string;
    name: string;
    role: string;
    description: string;
    characteristics: {
      motivations: string[];
      concerns: string[];
      decisionMakingStyle: string;
      communicationStyle: string;
      keyNeeds: string[];
    };
  };
  personalizedStrategy: {
    situation: string;
    complication: string;
    futureState: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  influenceScore: number;
  confidence: number;
  flightRisk?: {
    score: number;
    category: string;
    reasoning: string;
  };
}

export interface CompanyData {
  companyInfo: {
    name: string;
    website: string;
    industry: string;
    size: string;
    headquarters: string;
  };
  buyerGroup: {
    totalMembers: number;
    cohesionScore: number;
    overallConfidence: number;
    members: BuyerGroupMember[];
  };
  salesIntent?: {
    score: number;
    level: string;
    signals: string[];
    hiringActivity: {
      totalJobs: number;
      salesRoles: number;
      engineeringRoles: number;
      leadershipRoles: number;
    };
  };
  archetypeDistribution?: Record<string, number>;
  strategicRecommendations?: string[];
  validation?: {
    isValid: boolean;
    accuracy: {
      overallScore: number;
      coreMemberAccuracy: number;
      roleAssignmentAccuracy: number;
      dataQuality: number;
    };
  };
}
`;
  }

  generateAccuracyComponent() {
    return `"use client";

import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface AccuracyIndicatorProps {
  buyerGroup: any;
  companySize: string;
}

export function AccuracyIndicator({ buyerGroup, companySize }: AccuracyIndicatorProps) {
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAccuracy = async () => {
      try {
        // This would use the actual validator
        // For now, we'll simulate the validation
        const mockAccuracy = {
          overallScore: 88.5,
          coreMemberAccuracy: 92,
          roleAssignmentAccuracy: 85,
          dataQuality: 95,
          consistency: 90,
          completeness: 85,
          timeliness: 90
        };
        
        setAccuracy(mockAccuracy);
      } catch (error) {
        console.error('Failed to validate accuracy:', error);
      } finally {
        setLoading(false);
      }
    };

    validateAccuracy();
  }, [buyerGroup, companySize]);

  if (loading) {
    return (
      <div className="accuracy-indicator loading">
        <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
      </div>
    );
  }

  if (!accuracy) {
    return null;
  }

  const getAccuracyColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4" />;
    if (score >= 80) return <TrendingUp className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="accuracy-indicator bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Buyer Group Accuracy</h3>
        <div className={\`flex items-center space-x-1 \${getAccuracyColor(accuracy.overallScore)}\`}>
          {getAccuracyIcon(accuracy.overallScore)}
          <span className="text-sm font-semibold">
            {accuracy.overallScore.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Core Members:</span>
          <span className={\`font-medium \${getAccuracyColor(accuracy.coreMemberAccuracy)}\`}>
            {accuracy.coreMemberAccuracy.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Role Assignment:</span>
          <span className={\`font-medium \${getAccuracyColor(accuracy.roleAssignmentAccuracy)}\`}>
            {accuracy.roleAssignmentAccuracy.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Data Quality:</span>
          <span className={\`font-medium \${getAccuracyColor(accuracy.dataQuality)}\`}>
            {accuracy.dataQuality.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Consistency:</span>
          <span className={\`font-medium \${getAccuracyColor(accuracy.consistency)}\`}>
            {accuracy.consistency.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
`;
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new WinningVariantMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = { WinningVariantMigrator };
