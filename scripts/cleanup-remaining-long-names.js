#!/usr/bin/env node

/**
 * Cleanup Remaining Long Company Names in Notary Everyday Workspace
 * 
 * Targets specific long names that weren't caught in the first cleanup
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Enhanced cleanup function for long names
function cleanLongCompanyName(name) {
  if (!name) return name;
  
  let cleaned = name.trim();
  
  // Specific patterns to clean
  const patterns = [
    // Remove phone numbers and contact info
    {
      pattern: /\s*\(ph\.\s*[\d\-\.\s]+\)/gi,
      replacement: ''
    },
    {
      pattern: /\s*\(\d{3}\.\d{3}\.\d{4}\)/gi,
      replacement: ''
    },
    {
      pattern: /\s*\/\s*[\w\s@\.]+@[\w\s\.]+\.com/gi,
      replacement: ''
    },
    {
      pattern: /\s*602\.\d{3}\.\d{4}\s*\/\s*[\w\s@\.]+@[\w\s\.]+\.com/gi,
      replacement: ''
    },
    // Remove long descriptive phrases
    {
      pattern: /\s*-\s*Tactically Executing Real Estate Transactions for Financial Lending Institutions Through The Entire Loan Life Cycle/gi,
      replacement: ''
    },
    {
      pattern: /\s*and\s+Mezzo-soprano/gi,
      replacement: ''
    },
    {
      pattern: /\s*\(fka\s+[^)]+\)/gi,
      replacement: ''
    },
    {
      pattern: /\s*for\s+The\s+Residences/gi,
      replacement: ''
    },
    {
      pattern: /\s*of\s+Dr\.\s+Phillips/gi,
      replacement: ''
    },
    {
      pattern: /\s*-Arkansas/gi,
      replacement: ''
    },
    {
      pattern: /\s*\/Albertelli\s+Law/gi,
      replacement: ''
    },
    {
      pattern: /\s*Software\s+Corporation/gi,
      replacement: ' Software'
    },
    {
      pattern: /\s*Research\s+&\s+Retrieval/gi,
      replacement: ''
    },
    {
      pattern: /\s*University\s+of\s+Colorado\s+Denver/gi,
      replacement: ''
    },
    {
      pattern: /\s*Sunstar\s+Realty/gi,
      replacement: ' Realty'
    }
  ];
  
  // Apply patterns
  patterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });
  
  // Clean up extra spaces and dashes
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/g, '')
    .replace(/^\s*-\s*/g, '')
    .trim();
  
  return cleaned;
}

async function cleanupRemainingLongNames() {
  try {
    console.log('🧹 Cleaning up remaining long company names...\n');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Get companies with long names (>80 chars) or specific problematic patterns
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { name: { contains: 'Tactically Executing' } },
          { name: { contains: 'Mezzo-soprano' } },
          { name: { contains: 'ph. 623-455-3683' } },
          { name: { contains: '602.332.3111' } },
          { name: { contains: 'fka Meridian' } },
          { name: { contains: 'for The Residences' } },
          { name: { contains: 'of Dr. Phillips' } },
          { name: { contains: 'Albertelli Law' } },
          { name: { contains: 'Software Corporation' } },
          { name: { contains: 'Research & Retrieval' } },
          { name: { contains: 'University of Colorado' } },
          { name: { contains: 'Sunstar Realty' } }
        ]
      },
      select: {
        id: true,
        name: true,
        domain: true,
        website: true
      }
    });

    console.log(`📊 Found ${companies.length} companies with long/problematic names\n`);

    const changes = [];

    // Process each company
    for (const company of companies) {
      const originalName = company.name;
      const cleanedName = cleanLongCompanyName(originalName);
      
      if (cleanedName !== originalName && cleanedName.length > 0) {
        try {
          await prisma.companies.update({
            where: { id: company.id },
            data: { name: cleanedName }
          });
          
          changes.push({
            id: company.id,
            originalName: originalName,
            cleanedName: cleanedName,
            domain: company.domain,
            lengthReduction: originalName.length - cleanedName.length
          });
          
          console.log(`✅ Cleaned: "${originalName}"`);
          console.log(`   → "${cleanedName}" (${originalName.length - cleanedName.length} chars shorter)`);
          console.log('');
        } catch (error) {
          console.error(`❌ Error updating company ${company.id}:`, error.message);
        }
      }
    }

    // Generate report
    const report = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      cleanupDate: new Date().toISOString(),
      totalProcessed: companies.length,
      totalCleaned: changes.length,
      changes: changes,
      summary: {
        totalCharactersRemoved: changes.reduce((sum, change) => sum + change.lengthReduction, 0),
        averageLengthReduction: changes.length > 0 ? 
          changes.reduce((sum, change) => sum + change.lengthReduction, 0) / changes.length : 0
      }
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'notary-long-names-cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📊 CLEANUP SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Companies Processed: ${companies.length}`);
    console.log(`Names Cleaned: ${changes.length}`);
    console.log(`Total Characters Removed: ${report.summary.totalCharactersRemoved}`);
    console.log(`Average Length Reduction: ${report.summary.averageLengthReduction.toFixed(1)} characters`);
    console.log('');

    if (changes.length > 0) {
      console.log('✨ CLEANED NAMES:');
      console.log('='.repeat(50));
      changes.forEach((change, index) => {
        console.log(`${index + 1}. [${change.lengthReduction} chars shorter]`);
        console.log(`   Before: "${change.originalName}"`);
        console.log(`   After:  "${change.cleanedName}"`);
        if (change.domain) console.log(`   Domain: ${change.domain}`);
        console.log('');
      });
    }

    console.log('✅ Long names cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRemainingLongNames();
