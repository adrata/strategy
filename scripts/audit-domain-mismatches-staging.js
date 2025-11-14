#!/usr/bin/env node

/**
 * 🔍 AUDIT DOMAIN MISMATCHES IN BUYER GROUPS
 * 
 * This script scans all buyer group members and identifies cases where
 * email domain doesn't match company domain, with special focus on:
 * - Same base name but different TLD (e.g., underline.com vs underline.cz)
 * - Cross-company contamination
 * 
 * Usage:
 *   node scripts/audit-domain-mismatches-staging.js [options]
 * 
 * Options:
 *   --fix          Apply fixes to identified issues (removes from buyer group)
 *   --workspace    Specify workspace slug to audit (default: all workspaces)
 *   --output       Output file for detailed report (default: logs/domain-mismatch-audit-{timestamp}.json)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Extract domain from email or URL
 */
function extractDomain(input) {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

/**
 * Check if domains match (strict TLD checking)
 */
function domainsMatchStrict(emailDomain, companyDomain) {
  if (!emailDomain || !companyDomain) return false;
  
  // Extract root domains (handle subdomains)
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  return emailRoot === companyRoot;
}

/**
 * Categorize the type of mismatch
 */
function categorizeMismatch(emailDomain, companyDomain) {
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  const emailBase = emailRoot.split('.')[0];
  const companyBase = companyRoot.split('.')[0];
  
  // Same base name but different TLD (most critical - likely different companies)
  if (emailBase === companyBase && emailRoot !== companyRoot) {
    return {
      type: 'SAME_NAME_DIFFERENT_TLD',
      severity: 'HIGH',
      description: `Same company name "${emailBase}" but different TLDs (${emailRoot} vs ${companyRoot})`,
      autoFix: true
    };
  }
  
  // Completely different domains
  if (emailBase !== companyBase) {
    return {
      type: 'DIFFERENT_DOMAINS',
      severity: 'MEDIUM',
      description: `Different base names: ${emailBase} vs ${companyBase}`,
      autoFix: false
    };
  }
  
  // Subdomain variation (likely same company)
  return {
    type: 'SUBDOMAIN_VARIATION',
    severity: 'LOW',
    description: 'Subdomain variation of same domain',
    autoFix: false
  };
}

class DomainMismatchAuditor {
  constructor(options = {}) {
    this.workspaceSlug = options.workspace;
    this.shouldFix = options.fix || false;
    this.outputFile = options.output || `logs/domain-mismatch-audit-${Date.now()}.json`;
    
    this.stats = {
      totalBuyerGroupMembers: 0,
      mismatches: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      fixed: 0,
      errors: 0
    };
    
    this.results = [];
  }

  async run() {
    try {
      console.log('🔍 DOMAIN MISMATCH AUDIT - BUYER GROUPS');
      console.log('='.repeat(70));
      console.log('');
      
      if (this.workspaceSlug) {
        console.log(`📍 Workspace Filter: ${this.workspaceSlug}`);
      } else {
        console.log('📍 Scanning ALL workspaces');
      }
      
      console.log(`🔧 Fix Mode: ${this.shouldFix ? 'ENABLED - Will fix issues' : 'DISABLED - Dry run only'}`);
      console.log('');

      // Build workspace filter
      const workspaceFilter = this.workspaceSlug 
        ? { workspace: { slug: this.workspaceSlug } }
        : {};

      // Find all buyer group members
      console.log('📊 Fetching buyer group members...');
      const buyerGroupMembers = await prisma.people.findMany({
        where: {
          ...workspaceFilter,
          isBuyerGroupMember: true,
          deletedAt: null
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              domain: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      this.stats.totalBuyerGroupMembers = buyerGroupMembers.length;
      console.log(`✅ Found ${buyerGroupMembers.length} buyer group members`);
      console.log('');

      // Check each member
      console.log('🔍 Analyzing domain matches...');
      console.log('');

      for (const person of buyerGroupMembers) {
        await this.checkPerson(person);
      }

      // Print summary
      this.printSummary();

      // Save detailed report
      await this.saveReport();

      console.log('');
      console.log('='.repeat(70));
      console.log('✅ AUDIT COMPLETE');

    } catch (error) {
      console.error('❌ Audit failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async checkPerson(person) {
    const personEmail = person.email || person.workEmail;
    const company = person.company;

    // Skip if no email or company
    if (!personEmail || !company) {
      return;
    }

    const emailDomain = extractDomain(personEmail.split('@')[1]);
    const companyDomain = extractDomain(company.website || company.domain);

    // Skip if missing domain info
    if (!emailDomain || !companyDomain) {
      return;
    }

    // Check if domains match
    const domainsMatch = domainsMatchStrict(emailDomain, companyDomain);

    if (!domainsMatch) {
      this.stats.mismatches++;

      // Categorize the mismatch
      const mismatchInfo = categorizeMismatch(emailDomain, companyDomain);

      // Track severity
      if (mismatchInfo.severity === 'HIGH') this.stats.highSeverity++;
      else if (mismatchInfo.severity === 'MEDIUM') this.stats.mediumSeverity++;
      else if (mismatchInfo.severity === 'LOW') this.stats.lowSeverity++;

      const result = {
        personId: person.id,
        personName: person.fullName,
        personEmail: personEmail,
        emailDomain,
        companyId: company.id,
        companyName: company.name,
        companyDomain,
        workspaceSlug: person.workspace.slug,
        workspaceName: person.workspace.name,
        buyerGroupRole: person.buyerGroupRole,
        mismatchType: mismatchInfo.type,
        severity: mismatchInfo.severity,
        description: mismatchInfo.description,
        fixed: false
      };

      // Log the issue
      const severityEmoji = mismatchInfo.severity === 'HIGH' ? '🔴' : mismatchInfo.severity === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${severityEmoji} [${mismatchInfo.severity}] ${mismatchInfo.type}`);
      console.log(`   Person: ${person.fullName} (${personEmail})`);
      console.log(`   Company: ${company.name} (${companyDomain})`);
      console.log(`   Workspace: ${person.workspace.name} (${person.workspace.slug})`);
      console.log(`   Issue: ${mismatchInfo.description}`);

      // Apply fix if enabled and auto-fix is recommended
      if (this.shouldFix && mismatchInfo.autoFix) {
        try {
          await this.fixPerson(person);
          result.fixed = true;
          this.stats.fixed++;
          console.log(`   ✅ FIXED - Removed from buyer group`);
        } catch (error) {
          this.stats.errors++;
          result.error = error.message;
          console.log(`   ❌ FIX FAILED: ${error.message}`);
        }
      } else if (!this.shouldFix) {
        console.log(`   💡 To fix, run with --fix flag`);
      }

      console.log('');

      this.results.push(result);
    }
  }

  async fixPerson(person) {
    const emailDomain = extractDomain((person.email || person.workEmail).split('@')[1]);
    const companyDomain = extractDomain(person.company.website || person.company.domain);

    await prisma.people.update({
      where: { id: person.id },
      data: {
        isBuyerGroupMember: false,
        buyerGroupRole: null,
        buyerGroupStatus: null,
        buyerGroupOptimized: false,
        notes: person.notes 
          ? `${person.notes}\n[${new Date().toISOString()}] Removed from buyer group: email domain (${emailDomain}) doesn't match company domain (${companyDomain})`
          : `[${new Date().toISOString()}] Removed from buyer group: email domain (${emailDomain}) doesn't match company domain (${companyDomain})`,
        updatedAt: new Date()
      }
    });
  }

  printSummary() {
    console.log('');
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Buyer Group Members Scanned: ${this.stats.totalBuyerGroupMembers}`);
    console.log(`Total Domain Mismatches Found:     ${this.stats.mismatches}`);
    console.log('');
    console.log('By Severity:');
    console.log(`  🔴 High:   ${this.stats.highSeverity} (same name, different TLD - likely different companies)`);
    console.log(`  🟡 Medium: ${this.stats.mediumSeverity} (different domains)`);
    console.log(`  🟢 Low:    ${this.stats.lowSeverity} (subdomain variations)`);
    console.log('');
    
    if (this.shouldFix) {
      console.log(`✅ Fixed: ${this.stats.fixed}`);
      console.log(`❌ Errors: ${this.stats.errors}`);
    } else {
      console.log(`💡 Run with --fix flag to automatically fix HIGH severity issues`);
    }
  }

  async saveReport() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      workspaceSlug: this.workspaceSlug || 'ALL',
      fixMode: this.shouldFix,
      stats: this.stats,
      results: this.results
    };

    const outputPath = path.join(process.cwd(), this.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log('');
    console.log(`📄 Detailed report saved to: ${outputPath}`);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    fix: false,
    workspace: null,
    output: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--fix':
      case '-f':
        options.fix = true;
        break;
      case '--workspace':
      case '-w':
        options.workspace = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
    }
  }

  return options;
}

// Run the audit
const options = parseArgs();
const auditor = new DomainMismatchAuditor(options);
auditor.run().catch(console.error);

