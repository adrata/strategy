#!/usr/bin/env node

/**
 * Audit Company Names in Notary Everyday Workspace
 * 
 * Checks for:
 * - Long company names that might have tags attached
 * - Company names with unusual characters or patterns
 * - Duplicate or similar company names
 * - Tags that should be separated from names
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function auditNotaryCompanyNames() {
  try {
    console.log('🔍 Starting Notary Everyday Company Name Audit...\n');
    
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

    // Get all companies with their tags
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Total companies: ${companies.length}\n`);

    // Analysis arrays
    const longNames = [];
    const namesWithSpecialChars = [];
    const namesWithTags = [];
    const duplicateNames = new Map();
    const cleanNames = [];
    const suspiciousNames = [];
    const nonCompanyNames = [];

    // Analyze each company
    for (const company of companies) {
      const nameLength = company.name?.length || 0;
      
      // Check for long names (>100 chars)
      if (nameLength > 100) {
        longNames.push({
          id: company.id,
          name: company.name,
          length: nameLength,
          tags: company.tags
        });
      }

      // Check for special characters that might indicate tags
      if (company.name && /[#@\[\]{}\|]/.test(company.name)) {
        namesWithSpecialChars.push({
          id: company.id,
          name: company.name,
          tags: company.tags
        });
      }

      // Check if name appears to have tags embedded (common patterns)
      if (company.name && (
        company.name.includes(' - ') && company.name.split(' - ').length > 2 ||
        company.name.includes(' | ') ||
        company.name.includes('(') && company.name.includes(')') && nameLength > 50
      )) {
        namesWithTags.push({
          id: company.id,
          name: company.name,
          tags: company.tags
        });
      }

      // Track duplicate names
      const normalizedName = company.name?.toLowerCase().trim();
      if (normalizedName) {
        if (!duplicateNames.has(normalizedName)) {
          duplicateNames.set(normalizedName, []);
        }
        duplicateNames.get(normalizedName).push({
          id: company.id,
          name: company.name,
          domain: company.domain,
          website: company.website
        });
      }

      // Check for suspicious/non-company names
      if (company.name) {
        const lowerName = company.name.toLowerCase().trim();
        
        // Common non-company patterns
        const nonCompanyPatterns = [
          /^(we good|human resources|hr|it|marketing|sales|finance|accounting|legal|operations|admin|administration)$/i,
          /^(department|team|group|division|unit|section)$/i,
          /^(self employed|freelance|contractor|consultant)$/i,
          /^(unemployed|retired|student|graduate)$/i,
          /^(test|sample|example|demo|placeholder)$/i,
          /^(n\/a|na|none|null|empty|blank)$/i,
          /^(company|business|firm|enterprise|corporation|inc|llc|llp)$/i,
          /^(title|escrow|real estate|property|mortgage|loan)$/i,
          /^(agent|broker|realtor|notary|closer|processor)$/i
        ];
        
        // Check if it matches non-company patterns
        if (nonCompanyPatterns.some(pattern => pattern.test(lowerName))) {
          nonCompanyNames.push({
            id: company.id,
            name: company.name,
            tags: company.tags,
            domain: company.domain,
            website: company.website
          });
        }
        
        // Check for suspicious patterns (very short, all caps, etc.)
        if (lowerName.length < 3 || 
            (lowerName.length < 10 && /^[A-Z\s]+$/.test(company.name)) ||
            /^(a|an|the|and|or|but|in|on|at|to|for|of|with|by)\s/.test(lowerName) ||
            /^(mr|ms|mrs|dr|prof)\s/.test(lowerName) ||
            /@/.test(company.name) && !company.name.includes('.com')) {
          suspiciousNames.push({
            id: company.id,
            name: company.name,
            tags: company.tags,
            domain: company.domain,
            website: company.website
          });
        }
      }

      // Track clean names
      if (nameLength > 0 && nameLength <= 100 && !/[#@\[\]{}\|]/.test(company.name)) {
        cleanNames.push(company.name);
      }
    }

    // Filter only actual duplicates
    const actualDuplicates = Array.from(duplicateNames.entries())
      .filter(([_, entries]) => entries.length > 1)
      .map(([name, entries]) => ({ name, count: entries.length, entries }));

    // Generate report
    const report = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      auditDate: new Date().toISOString(),
      totalCompanies: companies.length,
      summary: {
        longNames: longNames.length,
        namesWithSpecialChars: namesWithSpecialChars.length,
        namesWithTags: namesWithTags.length,
        duplicateNames: actualDuplicates.length,
        cleanNames: cleanNames.length,
        suspiciousNames: suspiciousNames.length,
        nonCompanyNames: nonCompanyNames.length
      },
      issues: {
        longNames: longNames,
        namesWithSpecialChars: namesWithSpecialChars,
        namesWithTags: namesWithTags,
        duplicates: actualDuplicates,
        suspiciousNames: suspiciousNames,
        nonCompanyNames: nonCompanyNames
      },
      statistics: {
        averageNameLength: companies.reduce((sum, c) => sum + (c.name?.length || 0), 0) / companies.length,
        maxNameLength: Math.max(...companies.map(c => c.name?.length || 0)),
        minNameLength: Math.min(...companies.filter(c => c.name).map(c => c.name.length)),
        companiesWithTags: companies.filter(c => c.tags && c.tags.length > 0).length,
        averageTagsPerCompany: companies.reduce((sum, c) => sum + (c.tags?.length || 0), 0) / companies.length
      }
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'notary-company-names-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📊 AUDIT SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Companies: ${companies.length}`);
    console.log(`Clean Names: ${cleanNames.length} (${((cleanNames.length / companies.length) * 100).toFixed(1)}%)`);
    console.log(`Long Names (>100 chars): ${longNames.length}`);
    console.log(`Names with Special Characters: ${namesWithSpecialChars.length}`);
    console.log(`Names with Embedded Tags: ${namesWithTags.length}`);
    console.log(`Duplicate Names: ${actualDuplicates.length}`);
    console.log(`Suspicious Names: ${suspiciousNames.length}`);
    console.log(`Non-Company Names: ${nonCompanyNames.length}`);
    console.log('');
    console.log(`Average Name Length: ${report.statistics.averageNameLength.toFixed(1)} characters`);
    console.log(`Max Name Length: ${report.statistics.maxNameLength} characters`);
    console.log(`Companies with Tags: ${report.statistics.companiesWithTags}`);
    console.log(`Average Tags per Company: ${report.statistics.averageTagsPerCompany.toFixed(1)}`);

    if (longNames.length > 0) {
      console.log('\n⚠️  LONG NAMES (Top 10):');
      console.log('='.repeat(50));
      longNames.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. [${company.length} chars] ${company.name.substring(0, 80)}...`);
        if (company.tags && company.tags.length > 0) {
          console.log(`   Tags: ${company.tags.join(', ')}`);
        }
      });
    }

    if (namesWithSpecialChars.length > 0) {
      console.log('\n⚠️  NAMES WITH SPECIAL CHARACTERS (Top 10):');
      console.log('='.repeat(50));
      namesWithSpecialChars.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
      });
    }

    if (namesWithTags.length > 0) {
      console.log('\n⚠️  NAMES WITH EMBEDDED TAGS (Top 10):');
      console.log('='.repeat(50));
      namesWithTags.slice(0, 10).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
      });
    }

    if (actualDuplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE NAMES (Top 10):');
      console.log('='.repeat(50));
      actualDuplicates.slice(0, 10).forEach((dup, index) => {
        console.log(`${index + 1}. "${dup.name}" - ${dup.count} occurrences`);
        dup.entries.forEach(entry => {
          console.log(`   - ${entry.id}: ${entry.domain || entry.website || 'no domain'}`);
        });
      });
    }

    if (suspiciousNames.length > 0) {
      console.log('\n⚠️  SUSPICIOUS NAMES (Top 20):');
      console.log('='.repeat(50));
      suspiciousNames.slice(0, 20).forEach((company, index) => {
        console.log(`${index + 1}. "${company.name}" (${company.domain || 'no domain'})`);
      });
    }

    if (nonCompanyNames.length > 0) {
      console.log('\n⚠️  NON-COMPANY NAMES (All):');
      console.log('='.repeat(50));
      nonCompanyNames.forEach((company, index) => {
        console.log(`${index + 1}. "${company.name}" (${company.domain || 'no domain'})`);
      });
    }

    console.log('\n✅ Audit complete!');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

auditNotaryCompanyNames();

