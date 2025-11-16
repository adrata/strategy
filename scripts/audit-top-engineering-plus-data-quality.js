#!/usr/bin/env node

/**
 * TOP Engineering Plus Data Quality Audit
 * 
 * Audits all people and company data in TOP Engineering Plus to identify:
 * 1. Capitalization inconsistencies (all caps vs proper case)
 * 2. Missing or incomplete data
 * 3. Data formatting issues
 * 4. Other data quality problems
 * 
 * Usage:
 *   node scripts/audit-top-engineering-plus-data-quality.js [--fix]
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const FIX_MODE = process.argv.includes('--fix');

/**
 * Common business abbreviations that should stay uppercase
 */
const BUSINESS_ABBREVIATIONS = new Set([
  'LLC', 'L.L.C.', 'L.L.C',
  'INC', 'INC.', 'INCORPORATED',
  'CORP', 'CORP.', 'CORPORATION',
  'LTD', 'LTD.', 'LIMITED',
  'CO', 'CO.',
  'PLC', 'P.L.C.',
  'SA', 'S.A.',
  'GMBH',
  'AG', 'A.G.',
  'BV', 'B.V.',
  'NV', 'N.V.',
  'SPA', 'S.P.A.',
  'SRL', 'S.R.L.',
  'PTY', 'PTY.',
  'PVT', 'PVT.',
  'USA', 'U.S.A.',
  'US', 'U.S.',
  'UK', 'U.K.',
  'EPC', 'E.P.C.',
  'IPS', 'I.P.S.',
  'GVTC', 'G.V.T.C.',
  'DCIS', 'D.C.I.S.',
  'MSIS', 'M.S.I.S.'
]);

/**
 * State abbreviations (2-letter codes)
 */
const STATE_ABBREVIATIONS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

/**
 * Check if a word is an acronym (all caps, 2+ letters, no vowels pattern)
 */
function isAcronym(word) {
  if (!word || word.length < 2) return false;
  
  // Check if it's a known abbreviation
  const upperWord = word.toUpperCase().replace(/[.,]/g, '');
  if (BUSINESS_ABBREVIATIONS.has(upperWord) || STATE_ABBREVIATIONS.has(upperWord)) {
    return true;
  }
  
  // Check if it's all caps and short (likely acronym)
  if (word === word.toUpperCase() && word.length <= 5 && /^[A-Z.]+$/.test(word)) {
    // If it has periods, it's likely an acronym (e.g., "U.S.A.")
    if (word.includes('.')) return true;
    // If it's 2-3 letters, likely an acronym
    if (word.length <= 3) return true;
  }
  
  return false;
}

/**
 * Properly capitalize a person name (Title Case)
 */
function properCasePersonName(name) {
  if (!name) return null;
  
  // Handle special cases for names
  const specialCases = {
    'mc': 'Mc',
    'mac': 'Mac',
    "o'": "O'",
    "d'": "D'",
    'van ': 'van ',
    'de ': 'de ',
    'von ': 'von ',
    'la ': 'la ',
    'le ': 'le ',
    'del ': 'del ',
    'al ': 'al '  // Arabic prefix
  };
  
  let normalized = name.trim();
  
  // Check if it's all caps (likely needs fixing)
  const isAllCaps = normalized === normalized.toUpperCase() && normalized.length > 1;
  const isAllLower = normalized === normalized.toLowerCase() && normalized.length > 1;
  
  if (!isAllCaps && !isAllLower) {
    // Already properly formatted, just normalize spacing
    return normalized.replace(/\s+/g, ' ').trim();
  }
  
  // Convert from all caps/lowercase to proper case
  normalized = normalized.toLowerCase();
  
  // Split into words
  const words = normalized.split(/\s+/);
  
  // Capitalize each word, handling special cases
  const properWords = words.map((word, index) => {
    if (!word) return '';
    
    // Handle single letters (like "M." or "P.")
    if (word.length === 1 || (word.length === 2 && word.endsWith('.'))) {
      return word.toUpperCase();
    }
    
    // Handle initials with periods (like "B.J." or "B.J")
    if (word.includes('.')) {
      const parts = word.split('.');
      // If all parts are single letters or empty, it's initials
      if (parts.every(part => part.length <= 1)) {
        return word.toUpperCase();
      }
    }
    
    // Handle two-letter abbreviations that might be initials (like "JJ")
    // But only if it's all caps originally
    if (word.length === 2 && isAllCaps && /^[a-z]{2}$/.test(word)) {
      // Check if it's a common name abbreviation
      const commonInitials = ['jj', 'tj', 'jd', 'jp', 'jc', 'jm', 'js', 'jt', 'jw'];
      if (commonInitials.includes(word)) {
        return word.toUpperCase();
      }
    }
    
    // Handle special prefixes (like "al", "van", "de", etc.)
    for (const [prefix, replacement] of Object.entries(specialCases)) {
      if (word.toLowerCase().startsWith(prefix)) {
        const rest = word.slice(prefix.length);
        if (rest) {
          // For "al", capitalize the rest properly
          if (prefix === 'al ') {
            return replacement.trim() + ' ' + (rest.charAt(0).toUpperCase() + rest.slice(1));
          }
          return replacement + (rest.charAt(0).toUpperCase() + rest.slice(1));
        } else {
          return replacement.trim();
        }
      }
    }
    
    // Check if it's an acronym (all caps, short, likely an acronym)
    // For person names, we're more conservative - only keep as acronym if it's very short
    if (isAllCaps && word.length <= 4 && /^[a-z]+$/.test(word)) {
      // Could be an acronym, but for names we'll capitalize normally
      // unless it's a known abbreviation
      if (BUSINESS_ABBREVIATIONS.has(word.toUpperCase()) || 
          word.toUpperCase() === 'DCIS' || 
          word.toUpperCase() === 'MSIS') {
        return word.toUpperCase();
      }
    }
    
    // Standard capitalization
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  
  return properWords.join(' ').trim();
}

/**
 * Properly capitalize a company name (Title Case, preserving abbreviations)
 */
function properCaseCompanyName(name) {
  if (!name) return null;
  
  let normalized = name.trim();
  
  // Check if it's all caps (likely needs fixing)
  const isAllCaps = normalized === normalized.toUpperCase() && normalized.length > 1;
  const isAllLower = normalized === normalized.toLowerCase() && normalized.length > 1;
  
  if (!isAllCaps && !isAllLower) {
    // Already properly formatted, just normalize spacing
    return normalized.replace(/\s+/g, ' ').trim();
  }
  
  // Convert from all caps/lowercase to proper case
  normalized = normalized.toLowerCase();
  
  // Split into words, preserving punctuation
  const words = normalized.split(/\s+/);
  
  // Capitalize each word, preserving abbreviations
  const properWords = words.map((word, index) => {
    if (!word) return '';
    
    // Remove trailing punctuation temporarily
    const trailingPunct = word.match(/[.,;:!?]+$/)?.[0] || '';
    const cleanWord = word.replace(/[.,;:!?]+$/, '');
    
    // Check if it's an acronym or abbreviation
    if (isAcronym(cleanWord)) {
      return cleanWord.toUpperCase() + trailingPunct;
    }
    
    // Handle common business suffixes
    const lowerWord = cleanWord.toLowerCase();
    if (['llc', 'inc', 'corp', 'ltd', 'co', 'plc', 'sa', 'gmbh', 'ag', 'bv', 'nv', 'spa', 'srl', 'pty', 'pvt'].includes(lowerWord)) {
      return cleanWord.toUpperCase() + trailingPunct;
    }
    
    // Handle state abbreviations (2-letter codes)
    if (cleanWord.length === 2 && STATE_ABBREVIATIONS.has(cleanWord.toUpperCase())) {
      return cleanWord.toUpperCase() + trailingPunct;
    }
    
    // Handle common acronyms that might not be in our list
    // Short all-caps words (2-5 letters) that were originally all caps are likely acronyms
    if (isAllCaps && cleanWord.length >= 2 && cleanWord.length <= 5 && /^[a-z]+$/.test(cleanWord)) {
      // Check if it looks like an acronym (no vowels or very short)
      const hasVowels = /[aeiou]/.test(cleanWord);
      if (!hasVowels || cleanWord.length <= 3) {
        return cleanWord.toUpperCase() + trailingPunct;
      }
    }
    
    // Standard capitalization
    return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1) + trailingPunct;
  });
  
  return properWords.join(' ').trim();
}

/**
 * Properly capitalize a name (Title Case) - generic function
 */
function properCase(name, type = 'person') {
  if (type === 'company') {
    return properCaseCompanyName(name);
  }
  return properCasePersonName(name);
}

/**
 * Check if a name is all caps
 */
function isAllCaps(name) {
  if (!name || name.length <= 1) return false;
  return name === name.toUpperCase() && /[A-Z]/.test(name);
}

/**
 * Check if a name is all lowercase
 */
function isAllLowercase(name) {
  if (!name || name.length <= 1) return false;
  return name === name.toLowerCase() && /[a-z]/.test(name);
}

/**
 * Check if a name has inconsistent capitalization
 */
function hasInconsistentCapitalization(name) {
  if (!name) return false;
  return isAllCaps(name) || isAllLowercase(name);
}

/**
 * Check data completeness for a person
 */
function checkPersonDataQuality(person) {
  const issues = [];
  
  // Name issues
  if (hasInconsistentCapitalization(person.firstName)) {
    issues.push({
      type: 'capitalization',
      field: 'firstName',
      value: person.firstName,
      suggested: properCase(person.firstName, 'person')
    });
  }
  
  if (hasInconsistentCapitalization(person.lastName)) {
    issues.push({
      type: 'capitalization',
      field: 'lastName',
      value: person.lastName,
      suggested: properCase(person.lastName, 'person')
    });
  }
  
  if (hasInconsistentCapitalization(person.fullName)) {
    issues.push({
      type: 'capitalization',
      field: 'fullName',
      value: person.fullName,
      suggested: properCase(person.fullName, 'person')
    });
  }
  
  // Missing data
  if (!person.email && !person.workEmail && !person.personalEmail) {
    issues.push({ type: 'missing', field: 'email', value: null });
  }
  
  if (!person.jobTitle) {
    issues.push({ type: 'missing', field: 'jobTitle', value: null });
  }
  
  if (!person.companyId) {
    issues.push({ type: 'missing', field: 'companyId', value: null });
  }
  
  // Data quality issues
  if (person.fullName && person.fullName.trim().length === 0) {
    issues.push({ type: 'empty', field: 'fullName', value: person.fullName });
  }
  
  if (person.email && !person.email.includes('@')) {
    issues.push({ type: 'invalid', field: 'email', value: person.email });
  }
  
  return issues;
}

/**
 * Check data completeness for a company
 */
function checkCompanyDataQuality(company) {
  const issues = [];
  
  // Name issues
  if (hasInconsistentCapitalization(company.name)) {
    issues.push({
      type: 'capitalization',
      field: 'name',
      value: company.name,
      suggested: properCase(company.name, 'company')
    });
  }
  
  // Missing data
  if (!company.website) {
    issues.push({ type: 'missing', field: 'website', value: null });
  }
  
  if (!company.industry) {
    issues.push({ type: 'missing', field: 'industry', value: null });
  }
  
  // Data quality issues
  if (company.name && company.name.trim().length === 0) {
    issues.push({ type: 'empty', field: 'name', value: company.name });
  }
  
  if (company.website && !company.website.startsWith('http')) {
    issues.push({ type: 'invalid', field: 'website', value: company.website });
  }
  
  return issues;
}

class TopEngineeringPlusDataQualityAudit {
  constructor() {
    this.auditResults = {
      people: {
        total: 0,
        active: 0,
        issues: {
          capitalization: [],
          missing: [],
          invalid: [],
          empty: []
        },
        summary: {
          allCaps: 0,
          allLowercase: 0,
          missingEmail: 0,
          missingJobTitle: 0,
          missingCompany: 0
        }
      },
      companies: {
        total: 0,
        active: 0,
        issues: {
          capitalization: [],
          missing: [],
          invalid: [],
          empty: []
        },
        summary: {
          allCaps: 0,
          allLowercase: 0,
          missingWebsite: 0,
          missingIndustry: 0
        }
      }
    };
  }

  log(message, level = 'info') {
    const icons = {
      error: '❌',
      warn: '⚠️',
      success: '✅',
      info: 'ℹ️'
    };
    const icon = icons[level] || 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async execute() {
    try {
      this.log('TOP ENGINEERING PLUS DATA QUALITY AUDIT', 'info');
      this.log('='.repeat(70), 'info');
      this.log('', 'info');

      await this.auditPeople();
      await this.auditCompanies();
      this.generateReport();
      
      if (FIX_MODE) {
        await this.fixIssues();
      }

    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }

  async auditPeople() {
    this.log('Auditing people data...', 'info');
    
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        jobTitle: true,
        companyId: true,
        deletedAt: true
      }
    });

    this.auditResults.people.total = allPeople.length;
    this.auditResults.people.active = allPeople.filter(p => !p.deletedAt).length;

    for (const person of allPeople) {
      if (person.deletedAt) continue; // Skip deleted records
      
      const issues = checkPersonDataQuality(person);
      
      for (const issue of issues) {
        this.auditResults.people.issues[issue.type].push({
          id: person.id,
          fullName: person.fullName,
          ...issue
        });
        
        // Update summary
        if (issue.type === 'capitalization') {
          if (isAllCaps(issue.value)) {
            this.auditResults.people.summary.allCaps++;
          } else if (isAllLowercase(issue.value)) {
            this.auditResults.people.summary.allLowercase++;
          }
        } else if (issue.type === 'missing') {
          if (issue.field === 'email') {
            this.auditResults.people.summary.missingEmail++;
          } else if (issue.field === 'jobTitle') {
            this.auditResults.people.summary.missingJobTitle++;
          } else if (issue.field === 'companyId') {
            this.auditResults.people.summary.missingCompany++;
          }
        }
      }
    }

    this.log(`Audited ${this.auditResults.people.active} active people`, 'success');
  }

  async auditCompanies() {
    this.log('Auditing companies data...', 'info');
    
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: WORKSPACE_ID
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        deletedAt: true
      }
    });

    this.auditResults.companies.total = allCompanies.length;
    this.auditResults.companies.active = allCompanies.filter(c => !c.deletedAt).length;

    for (const company of allCompanies) {
      if (company.deletedAt) continue; // Skip deleted records
      
      const issues = checkCompanyDataQuality(company);
      
      for (const issue of issues) {
        this.auditResults.companies.issues[issue.type].push({
          id: company.id,
          name: company.name,
          ...issue
        });
        
        // Update summary
        if (issue.type === 'capitalization') {
          if (isAllCaps(issue.value)) {
            this.auditResults.companies.summary.allCaps++;
          } else if (isAllLowercase(issue.value)) {
            this.auditResults.companies.summary.allLowercase++;
          }
        } else if (issue.type === 'missing') {
          if (issue.field === 'website') {
            this.auditResults.companies.summary.missingWebsite++;
          } else if (issue.field === 'industry') {
            this.auditResults.companies.summary.missingIndustry++;
          }
        }
      }
    }

    this.log(`Audited ${this.auditResults.companies.active} active companies`, 'success');
  }

  generateReport() {
    this.log('', 'info');
    this.log('DATA QUALITY AUDIT REPORT', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    // People Report
    this.log('PEOPLE DATA QUALITY', 'info');
    this.log(`Total: ${this.auditResults.people.total} (${this.auditResults.people.active} active)`, 'info');
    this.log('', 'info');
    
    this.log('Capitalization Issues:', 'warn');
    this.log(`  - All Caps Names: ${this.auditResults.people.summary.allCaps}`, 'warn');
    this.log(`  - All Lowercase Names: ${this.auditResults.people.summary.allLowercase}`, 'warn');
    this.log(`  - Total Capitalization Issues: ${this.auditResults.people.issues.capitalization.length}`, 'warn');
    this.log('', 'info');
    
    this.log('Missing Data:', 'warn');
    this.log(`  - Missing Email: ${this.auditResults.people.summary.missingEmail}`, 'warn');
    this.log(`  - Missing Job Title: ${this.auditResults.people.summary.missingJobTitle}`, 'warn');
    this.log(`  - Missing Company: ${this.auditResults.people.summary.missingCompany}`, 'warn');
    this.log('', 'info');
    
    this.log('Other Issues:', 'warn');
    this.log(`  - Invalid Data: ${this.auditResults.people.issues.invalid.length}`, 'warn');
    this.log(`  - Empty Fields: ${this.auditResults.people.issues.empty.length}`, 'warn');
    this.log('', 'info');

    // Companies Report
    this.log('COMPANIES DATA QUALITY', 'info');
    this.log(`Total: ${this.auditResults.companies.total} (${this.auditResults.companies.active} active)`, 'info');
    this.log('', 'info');
    
    this.log('Capitalization Issues:', 'warn');
    this.log(`  - All Caps Names: ${this.auditResults.companies.summary.allCaps}`, 'warn');
    this.log(`  - All Lowercase Names: ${this.auditResults.companies.summary.allLowercase}`, 'warn');
    this.log(`  - Total Capitalization Issues: ${this.auditResults.companies.issues.capitalization.length}`, 'warn');
    this.log('', 'info');
    
    this.log('Missing Data:', 'warn');
    this.log(`  - Missing Website: ${this.auditResults.companies.summary.missingWebsite}`, 'warn');
    this.log(`  - Missing Industry: ${this.auditResults.companies.summary.missingIndustry}`, 'warn');
    this.log('', 'info');
    
    this.log('Other Issues:', 'warn');
    this.log(`  - Invalid Data: ${this.auditResults.companies.issues.invalid.length}`, 'warn');
    this.log(`  - Empty Fields: ${this.auditResults.companies.issues.empty.length}`, 'warn');
    this.log('', 'info');

    // Sample issues
    if (this.auditResults.people.issues.capitalization.length > 0) {
      this.log('Sample People Capitalization Issues (first 10):', 'warn');
      this.auditResults.people.issues.capitalization.slice(0, 10).forEach(issue => {
        this.log(`  - ${issue.fullName || 'N/A'}: "${issue.value}" → "${issue.suggested}"`, 'warn');
      });
      this.log('', 'info');
    }

    if (this.auditResults.companies.issues.capitalization.length > 0) {
      this.log('Sample Companies Capitalization Issues (first 10):', 'warn');
      this.auditResults.companies.issues.capitalization.slice(0, 10).forEach(issue => {
        this.log(`  - ${issue.name}: "${issue.value}" → "${issue.suggested}"`, 'warn');
      });
      this.log('', 'info');
    }

    // Save detailed report to file
    const reportPath = path.join(__dirname, '..', 'logs', `top-engineering-plus-data-quality-audit-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
    this.log(`Detailed report saved to: ${reportPath}`, 'success');
  }

  async fixIssues() {
    this.log('', 'info');
    this.log('FIXING DATA QUALITY ISSUES', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    let fixedPeople = 0;
    let fixedCompanies = 0;

    // Fix people capitalization issues
    for (const issue of this.auditResults.people.issues.capitalization) {
      try {
        const updateData = {};
        if (issue.field === 'firstName') {
          updateData.firstName = issue.suggested;
          // Also update fullName if it exists
          const person = await prisma.people.findUnique({ where: { id: issue.id }, select: { lastName: true } });
          if (person && person.lastName) {
            updateData.fullName = `${issue.suggested} ${person.lastName}`;
          }
        } else if (issue.field === 'lastName') {
          updateData.lastName = issue.suggested;
          // Also update fullName if it exists
          const person = await prisma.people.findUnique({ where: { id: issue.id }, select: { firstName: true } });
          if (person && person.firstName) {
            updateData.fullName = `${person.firstName} ${issue.suggested}`;
          }
        } else if (issue.field === 'fullName') {
          updateData.fullName = issue.suggested;
        }

        await prisma.people.update({
          where: { id: issue.id },
          data: updateData
        });
        fixedPeople++;
      } catch (error) {
        this.log(`Failed to fix person ${issue.id}: ${error.message}`, 'error');
      }
    }

    // Fix companies capitalization issues
    for (const issue of this.auditResults.companies.issues.capitalization) {
      try {
        await prisma.companies.update({
          where: { id: issue.id },
          data: { name: issue.suggested }
        });
        fixedCompanies++;
      } catch (error) {
        this.log(`Failed to fix company ${issue.id}: ${error.message}`, 'error');
      }
    }

    this.log(`Fixed ${fixedPeople} people and ${fixedCompanies} companies`, 'success');
  }
}

// Run the audit
if (require.main === module) {
  const audit = new TopEngineeringPlusDataQualityAudit();
  audit.execute().catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

module.exports = { TopEngineeringPlusDataQualityAudit };

