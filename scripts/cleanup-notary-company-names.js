#!/usr/bin/env node

/**
 * Cleanup Company Names in Notary Everyday Workspace
 * 
 * Fixes:
 * - Long names (extract company name from LinkedIn headlines)
 * - Special characters and formatting
 * - Embedded location tags
 * - Non-company names (remove)
 * - Keep suspicious names but clean them up
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Cleanup functions
function cleanCompanyName(name) {
  if (!name) return name;
  
  let cleaned = name.trim();
  
  // Remove LinkedIn headline patterns (keep only company name)
  if (cleaned.includes(' | ') && cleaned.length > 80) {
    // Extract company name from LinkedIn headline
    const parts = cleaned.split(' | ');
    if (parts.length > 1) {
      // Take the first part as company name
      cleaned = parts[0].trim();
    }
  }
  
  // Clean up special characters
  cleaned = cleaned
    .replace(/^::\|?\s*/, '') // Remove leading ::| 
    .replace(/\s*\|::\s*$/, '') // Remove trailing |::
    .replace(/^@/, '') // Remove leading @
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Clean up location suffixes (keep location but format better)
  cleaned = cleaned
    .replace(/\s*\|\s*/g, ' - ') // Replace | with - for locations
    .replace(/\s*-\s*-\s*/g, ' - ') // Fix double dashes
    .trim();
  
  return cleaned;
}

function isNonCompanyName(name) {
  if (!name) return false;
  
  const lowerName = name.toLowerCase().trim();
  const nonCompanyPatterns = [
    /^(we good|human resources|hr|it|marketing|sales|finance|accounting|legal|operations|admin|administration)$/i,
    /^(department|team|group|division|unit|section)$/i,
    /^(self employed|freelance|contractor|consultant)$/i,
    /^(unemployed|retired|student|graduate)$/i,
    /^(test|sample|example|demo|placeholder)$/i,
    /^(n\/a|na|none|null|empty|blank)$/i
  ];
  
  return nonCompanyPatterns.some(pattern => pattern.test(lowerName));
}

async function cleanupNotaryCompanyNames() {
  try {
    console.log('🧹 Starting Notary Everyday Company Name Cleanup...\n');
    
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

    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        id: true,
        name: true,
        tags: true,
        domain: true,
        website: true
      }
    });

    console.log(`📊 Processing ${companies.length} companies...\n`);

    const changes = {
      cleaned: [],
      removed: [],
      unchanged: []
    };

    // Process each company
    for (const company of companies) {
      const originalName = company.name;
      
      // Check if it's a non-company name
      if (isNonCompanyName(originalName)) {
        changes.removed.push({
          id: company.id,
          originalName: originalName,
          reason: 'Non-company name'
        });
        continue;
      }
      
      // Clean the name
      const cleanedName = cleanCompanyName(originalName);
      
      // Only update if name actually changed
      if (cleanedName !== originalName && cleanedName.length > 0) {
        try {
          await prisma.companies.update({
            where: { id: company.id },
            data: { name: cleanedName }
          });
          
          changes.cleaned.push({
            id: company.id,
            originalName: originalName,
            cleanedName: cleanedName,
            domain: company.domain
          });
        } catch (error) {
          console.error(`❌ Error updating company ${company.id}:`, error.message);
        }
      } else {
        changes.unchanged.push({
          id: company.id,
          name: originalName
        });
      }
    }

    // Remove non-company entries
    for (const removal of changes.removed) {
      try {
        await prisma.companies.delete({
          where: { id: removal.id }
        });
        console.log(`🗑️  Removed: "${removal.originalName}"`);
      } catch (error) {
        console.error(`❌ Error removing company ${removal.id}:`, error.message);
      }
    }

    // Generate report
    const report = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      cleanupDate: new Date().toISOString(),
      totalProcessed: companies.length,
      summary: {
        cleaned: changes.cleaned.length,
        removed: changes.removed.length,
        unchanged: changes.unchanged.length
      },
      changes: changes
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'notary-company-cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📊 CLEANUP SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Processed: ${companies.length}`);
    console.log(`Names Cleaned: ${changes.cleaned.length}`);
    console.log(`Names Removed: ${changes.removed.length}`);
    console.log(`Names Unchanged: ${changes.unchanged.length}`);
    console.log('');

    if (changes.cleaned.length > 0) {
      console.log('✨ CLEANED NAMES (Top 20):');
      console.log('='.repeat(50));
      changes.cleaned.slice(0, 20).forEach((change, index) => {
        console.log(`${index + 1}. "${change.originalName}"`);
        console.log(`   → "${change.cleanedName}"`);
        if (change.domain) console.log(`   Domain: ${change.domain}`);
        console.log('');
      });
    }

    if (changes.removed.length > 0) {
      console.log('🗑️  REMOVED NAMES:');
      console.log('='.repeat(50));
      changes.removed.forEach((removal, index) => {
        console.log(`${index + 1}. "${removal.originalName}" - ${removal.reason}`);
      });
    }

    console.log('\n✅ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupNotaryCompanyNames();
