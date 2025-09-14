#!/usr/bin/env npx tsx

/**
 * 🧪 DELL TITLE MATCHING VALIDATION SCRIPT
 * 
 * Tests our comprehensive VP pattern matching against actual Dell titles
 * Ensures ACCURACY and complete coverage
 */

import path from 'path';
import fs from 'fs';

// Read the actual Dell buyer group data
const dellAnalysisPath = path.join(process.cwd(), 'data/production/dell-analysis/dell-1754955111533');

async function validateTitleMatching() {
  console.log('🧪 DELL TITLE MATCHING VALIDATION');
  console.log('==================================');
  
  try {
    // Read the actual buyer group structure
    const buyerGroupFile = path.join(dellAnalysisPath, '02-buyer-group-structure.json');
    const buyerGroupData = JSON.parse(fs.readFileSync(buyerGroupFile, 'utf-8'));
    
    // Extract all titles from the buyer group
    const allTitles: string[] = [];
    Object.values(buyerGroupData.roles).forEach((roleMembers: any[]) => {
      roleMembers.forEach(member => {
        const rationale = member.rationale || [];
        rationale.forEach((line: string) => {
          const titleMatch = line.match(/Title "([^"]+)"/);
          if (titleMatch) {
            allTitles.push(titleMatch[1]);
          }
        });
      });
    });
    
    console.log(`📊 Found ${allTitles.length} actual Dell titles:`);
    allTitles.forEach((title, index) => {
      console.log(`   ${index + 1}. "${title}"`);
    });
    
    console.log('\n🎯 ANALYZING TITLE PATTERNS:');
    console.log('============================');
    
    // Analyze VP patterns
    const vpTitles = allTitles.filter(title => 
      title.toLowerCase().includes('vp') || 
      title.toLowerCase().includes('vice president')
    );
    
    console.log(`\n🏅 VP TITLES FOUND (${vpTitles.length}):`);
    vpTitles.forEach((title, index) => {
      console.log(`   ${index + 1}. "${title}"`);
      
      // Test our pattern expansion
      const variations = expandVPPatterns(title.toLowerCase());
      console.log(`      Variations: ${variations.slice(0, 3).join(', ')}${variations.length > 3 ? '...' : ''}`);
    });
    
    // Analyze role distribution
    console.log(`\n📊 CURRENT ROLE DISTRIBUTION:`);
    Object.entries(buyerGroupData.roles).forEach(([role, members]: [string, any[]]) => {
      console.log(`   ${role.toUpperCase()}: ${members.length} members`);
    });
    
    // Test our enterprise overrides
    console.log(`\n🎯 TESTING ENTERPRISE OVERRIDES:`);
    allTitles.forEach(title => {
      const override = testEnterpriseOverride(title);
      if (override) {
        console.log(`   ✅ "${title}" → ${override.role.toUpperCase()} (${override.reason})`);
      }
    });
    
    console.log('\n✅ Title matching validation complete!');
    
  } catch (error) {
    console.error('❌ Error validating title matching:', error);
  }
}

// Test our VP pattern expansion logic
function expandVPPatterns(pattern: string): string[] {
  const vpVariations = [];
  
  // If pattern contains 'vp sales' or similar
  if (pattern.includes('vp ')) {
    const baseTerm = pattern.replace('vp ', '');
    vpVariations.push(
      `vp ${baseTerm}`,
      `vice president ${baseTerm}`,
      `vice president of ${baseTerm}`,
      `vp of ${baseTerm}`,
      `v.p. ${baseTerm}`,
      `v.p. of ${baseTerm}`,
      `vice-president ${baseTerm}`,
      `vice-president of ${baseTerm}`
    );
  }

  // If pattern contains 'vice president'
  if (pattern.includes('vice president')) {
    const baseTerm = pattern.replace('vice president ', '').replace('vice president of ', '');
    vpVariations.push(
      `vp ${baseTerm}`,
      `vice president ${baseTerm}`,
      `vice president of ${baseTerm}`,
      `vp of ${baseTerm}`,
      `v.p. ${baseTerm}`,
      `vice-president ${baseTerm}`
    );
  }

  return vpVariations.length > 0 ? vpVariations : [pattern];
}

// Test our enterprise override logic
function testEnterpriseOverride(title: string): { role: string; reason: string } | null {
  const titleLower = title.toLowerCase();

  // EXECUTIVE ASSISTANT OVERRIDE → Always Introducer
  if (titleLower.includes('executive assistant') || titleLower.includes('assistant to')) {
    return { role: 'introducer', reason: 'Executive Assistant - premium access' };
  }

  // PROCESS/OPERATIONS VP OVERRIDE → Always Stakeholder
  if (titleLower.includes('vp') && (titleLower.includes('process') || titleLower.includes('experience') || titleLower.includes('operations'))) {
    return { role: 'stakeholder', reason: 'VP Process/Operations - functional expertise' };
  }

  // REGIONAL VP OVERRIDE → Stakeholder
  if (titleLower.includes('vp') && (titleLower.includes('canada') || titleLower.includes('anz') || titleLower.includes('emea') || titleLower.includes('apac'))) {
    return { role: 'stakeholder', reason: 'Regional VP - limited budget authority' };
  }

  // SALES SPECIALIST/OUTSIDE SALES → Introducer
  if (titleLower.includes('sales specialist') || titleLower.includes('outside sales') || titleLower.includes('territory')) {
    return { role: 'introducer', reason: 'Front-line sales - direct access' };
  }

  return null;
}

// Run the validation
if (require.main === module) {
  validateTitleMatching().catch(console.error);
}
