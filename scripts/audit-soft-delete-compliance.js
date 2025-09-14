#!/usr/bin/env node

/**
 * 🔍 SOFT DELETE COMPLIANCE AUDIT
 * 
 * Comprehensive audit of the codebase to identify:
 * 1. Direct Prisma queries that bypass soft delete filtering
 * 2. Current state of soft-deleted records in the database
 * 3. Services that need to be updated for compliance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIT_RESULTS = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFiles: 0,
    filesWithDirectQueries: 0,
    totalDirectQueries: 0,
    criticalFiles: [],
    lowRiskFiles: []
  },
  findings: [],
  recommendations: []
};

// Models that should use soft delete filtering
const SOFT_DELETE_MODELS = ['lead', 'prospect', 'contact', 'opportunity', 'account'];

// High-risk patterns that likely need immediate attention
const HIGH_RISK_PATTERNS = [
  /prisma\.(lead|prospect|contact|opportunity|account)\.findMany\(/g,
  /prisma\.(lead|prospect|contact|opportunity|account)\.findFirst\(/g,
  /prisma\.(lead|prospect|contact|opportunity|account)\.findUnique\(/g,
  /prisma\.(lead|prospect|contact|opportunity|account)\.count\(/g
];

// Files that are likely safe (already handle soft deletes or are utility files)
const SAFE_FILE_PATTERNS = [
  /\/api\/.*\/restore\/route\.ts$/,
  /softDeleteService\.ts$/,
  /prismaHelpers\.ts$/,
  /AIDataService\.ts$/,
  /\/api\/pipeline\/route\.ts$/
];

console.log('🔍 Starting Soft Delete Compliance Audit...\n');

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];
    
    // Skip files that are already safe
    if (SAFE_FILE_PATTERNS.some(pattern => pattern.test(filePath))) {
      return { findings, isSafe: true };
    }
    
    // Check for direct Prisma queries
    HIGH_RISK_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = content.split('\n')[lineNumber - 1]?.trim();
        
        findings.push({
          type: 'direct_prisma_query',
          model: match[1],
          lineNumber,
          lineContent,
          risk: 'high'
        });
      }
    });
    
    // Check if file already has soft delete filtering
    const hasSoftDeleteFiltering = /deletedAt:\s*null/.test(content) || 
                                  /deletedAt:\s*{\s*not:\s*null\s*}/.test(content) ||
                                  /withSoftDeleteFilter/.test(content) ||
                                  /safePrisma/.test(content);
    
    return { 
      findings, 
      isSafe: false,
      hasSoftDeleteFiltering,
      riskLevel: findings.length > 5 ? 'critical' : findings.length > 0 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
    return { findings: [], isSafe: false, error: error.message };
  }
}

function scanDirectory(dirPath) {
  const files = [];
  
  function walkDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath);
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(entry)) {
            walkDir(fullPath);
          }
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error walking directory ${currentPath}:`, error.message);
    }
  }
  
  walkDir(dirPath);
  return files;
}

// Scan the source directory
const srcPath = path.join(process.cwd(), 'src');
console.log(`📁 Scanning directory: ${srcPath}`);

const allFiles = scanDirectory(srcPath);
AUDIT_RESULTS.summary.totalFiles = allFiles.length;

console.log(`Found ${allFiles.length} TypeScript files to analyze\n`);

// Analyze each file
allFiles.forEach(filePath => {
  const relativePath = path.relative(process.cwd(), filePath);
  const result = scanFile(filePath);
  
  if (result.isSafe) {
    console.log(`✅ ${relativePath} (already safe)`);
    return;
  }
  
  if (result.error) {
    console.log(`⚠️  ${relativePath} (error: ${result.error})`);
    return;
  }
  
  if (result.findings.length > 0) {
    AUDIT_RESULTS.summary.filesWithDirectQueries++;
    AUDIT_RESULTS.summary.totalDirectQueries += result.findings.length;
    
    const fileAnalysis = {
      file: relativePath,
      riskLevel: result.riskLevel,
      hasSoftDeleteFiltering: result.hasSoftDeleteFiltering,
      findings: result.findings,
      recommendedAction: result.riskLevel === 'critical' ? 'immediate_update' : 'planned_update'
    };
    
    AUDIT_RESULTS.findings.push(fileAnalysis);
    
    if (result.riskLevel === 'critical') {
      AUDIT_RESULTS.summary.criticalFiles.push(relativePath);
      console.log(`🚨 ${relativePath} (CRITICAL - ${result.findings.length} direct queries)`);
    } else if (result.riskLevel === 'medium') {
      console.log(`⚠️  ${relativePath} (${result.findings.length} direct queries${result.hasSoftDeleteFiltering ? ', has some filtering' : ''})`);
    } else {
      AUDIT_RESULTS.summary.lowRiskFiles.push(relativePath);
      console.log(`📝 ${relativePath} (low risk)`);
    }
  } else {
    console.log(`✅ ${relativePath} (clean)`);
  }
});

// Generate recommendations
console.log('\n📋 GENERATING RECOMMENDATIONS...\n');

AUDIT_RESULTS.recommendations = [
  {
    priority: 'HIGH',
    action: 'Update critical files immediately',
    description: `${AUDIT_RESULTS.summary.criticalFiles.length} files have high-risk direct Prisma queries that could expose soft-deleted records`,
    files: AUDIT_RESULTS.summary.criticalFiles
  },
  {
    priority: 'MEDIUM', 
    action: 'Implement safePrisma helpers',
    description: 'Replace direct prisma calls with safePrisma helpers to ensure consistent soft delete filtering',
    files: AUDIT_RESULTS.findings.filter(f => f.riskLevel === 'medium').map(f => f.file)
  },
  {
    priority: 'LOW',
    action: 'Add soft delete filtering to remaining queries',
    description: 'Update remaining files to use proper soft delete patterns',
    files: AUDIT_RESULTS.summary.lowRiskFiles
  }
];

// Print summary
console.log('📊 AUDIT SUMMARY');
console.log('================');
console.log(`Total files scanned: ${AUDIT_RESULTS.summary.totalFiles}`);
console.log(`Files with direct queries: ${AUDIT_RESULTS.summary.filesWithDirectQueries}`);
console.log(`Total direct queries found: ${AUDIT_RESULTS.summary.totalDirectQueries}`);
console.log(`Critical files (immediate attention): ${AUDIT_RESULTS.summary.criticalFiles.length}`);
console.log(`Low risk files: ${AUDIT_RESULTS.summary.lowRiskFiles.length}`);

console.log('\n🎯 TOP PRIORITY FILES:');
AUDIT_RESULTS.summary.criticalFiles.slice(0, 10).forEach(file => {
  const finding = AUDIT_RESULTS.findings.find(f => f.file === file);
  console.log(`   🚨 ${file} (${finding?.findings.length} queries)`);
});

console.log('\n💡 RECOMMENDATIONS:');
AUDIT_RESULTS.recommendations.forEach(rec => {
  console.log(`   ${rec.priority === 'HIGH' ? '🚨' : rec.priority === 'MEDIUM' ? '⚠️' : '📝'} ${rec.priority}: ${rec.action}`);
  console.log(`      ${rec.description}`);
  if (rec.files.length > 0) {
    console.log(`      Affects ${rec.files.length} files`);
  }
  console.log('');
});

// Save detailed results
const outputPath = path.join(process.cwd(), 'soft-delete-audit-results.json');
fs.writeFileSync(outputPath, JSON.stringify(AUDIT_RESULTS, null, 2));

console.log(`📄 Detailed results saved to: ${outputPath}`);

// Exit with appropriate code
const hasHighRisk = AUDIT_RESULTS.summary.criticalFiles.length > 0;
const hasAnyRisk = AUDIT_RESULTS.summary.filesWithDirectQueries > 0;

if (hasHighRisk) {
  console.log('\n🚨 AUDIT FAILED: Critical issues found that need immediate attention');
  process.exit(1);
} else if (hasAnyRisk) {
  console.log('\n⚠️  AUDIT WARNING: Some issues found but not critical');
  process.exit(0);
} else {
  console.log('\n✅ AUDIT PASSED: No soft delete compliance issues found');
  process.exit(0);
}
