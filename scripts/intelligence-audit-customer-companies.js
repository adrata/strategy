#!/usr/bin/env node

/**
 * Intelligence Audit - Customer Companies
 * 
 * Analyzes unlinked customer emails to identify utility/energy companies
 * and provides intelligence about the types of companies they target.
 * 
 * Usage:
 *   node scripts/intelligence-audit-customer-companies.js [--workspace-id=WORKSPACE_ID]
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Exclude these domains (internal/service providers)
const EXCLUDED_DOMAINS = [
  'topengineersplus.com',
  'messaging.microsoft.com',
  'adrata.com',
  'service.govdelivery.com',
  'adp.com',
  'm.learn.coursera.org',
  'yammer.com',
  'customer.ionwave.net',
  'capsulecrm.com',
  'mgs.opentable.com',
  'checkr.com',
  'em1.turbotax.intuit.com',
  'reply.getweave.com',
  'office365.com',
  'mail.microsoft',
  'sharepointonline.com',
  'gmail.com',
  'canva.com',
  'citypass.com',
  'qr-code-generator.com',
  'weebly.com',
  'paychex.com',
  'fathom.video',
  'budget.com',
  'adobe.com',
  'medallia.com',
  'teamflect.com'
];

// Utility/Energy industry keywords
const UTILITY_KEYWORDS = [
  'utility', 'utilities', 'power', 'electric', 'energy', 'gas', 'water', 'sewer',
  'cooperative', 'co-op', 'municipal', 'public works', 'infrastructure',
  'transmission', 'distribution', 'generation', 'renewable', 'solar', 'wind',
  'hydroelectric', 'nuclear', 'grid', 'substation', 'transmission line'
];

// Government/Public sector keywords
const GOVERNMENT_KEYWORDS = [
  'city', 'county', 'state', 'federal', 'government', 'municipal', 'public',
  'department', 'authority', 'commission', 'district', 'agency'
];

class IntelligenceAudit {
  constructor(options = {}) {
    this.workspaceId = options.workspaceId || '01K75ZD7DWHG1XF16HAF2YVKCK';
    this.results = {
      totalEmails: 0,
      companies: [],
      industries: {},
      companyTypes: {
        utility: [],
        energy: [],
        government: [],
        other: []
      },
      intelligence: {
        targetIndustries: [],
        companySizes: {},
        geographicDistribution: {},
        engagementLevels: {}
      }
    };
  }

  log(message, level = 'info') {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  /**
   * Extract domain from email
   */
  extractDomain(email) {
    if (!email || typeof email !== 'string') return null;
    const match = email.toLowerCase().trim().match(/@([^@]+)$/);
    return match ? match[1] : null;
  }

  /**
   * Normalize domain
   */
  normalizeDomain(domain) {
    if (!domain) return null;
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .trim();
  }

  /**
   * Extract base domain
   */
  extractBaseDomain(domain) {
    if (!domain) return null;
    const normalized = this.normalizeDomain(domain);
    if (!normalized) return null;
    const parts = normalized.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return normalized;
  }

  /**
   * Check if domain should be excluded
   */
  shouldExclude(domain) {
    const normalized = this.normalizeDomain(domain);
    const baseDomain = this.extractBaseDomain(domain);
    return EXCLUDED_DOMAINS.some(excluded => 
      normalized === excluded || 
      normalized.includes(excluded) || 
      excluded.includes(normalized) ||
      baseDomain === excluded
    );
  }

  /**
   * Categorize company by industry
   */
  categorizeCompany(companyName, domain, emailData) {
    const nameLower = (companyName || '').toLowerCase();
    const domainLower = (domain || '').toLowerCase();
    const subjectLower = (emailData.subject || '').toLowerCase();
    const bodyLower = (emailData.body || '').toLowerCase();
    const allText = `${nameLower} ${domainLower} ${subjectLower} ${bodyLower}`;

    // Check for utility keywords (more specific)
    const utilityIndicators = [
      'electric cooperative', 'electric co-op', 'power company', 'power authority',
      'electric utility', 'public utility', 'municipal utility', 'rural electric',
      'electric association', 'power district', 'electric company', 'power cooperative'
    ];
    
    const hasUtilityIndicators = utilityIndicators.some(indicator =>
      allText.includes(indicator)
    );

    // Check for utility keywords
    const hasUtilityKeywords = UTILITY_KEYWORDS.some(keyword => 
      allText.includes(keyword)
    );

    // Check for government keywords
    const hasGovernmentKeywords = GOVERNMENT_KEYWORDS.some(keyword =>
      allText.includes(keyword)
    );

    // Determine category - prioritize utility
    if (hasUtilityIndicators || (hasUtilityKeywords && (
      nameLower.includes('electric') || nameLower.includes('power') || 
      nameLower.includes('utility') || nameLower.includes('cooperative') ||
      nameLower.includes('co-op') || nameLower.includes('municipal')
    ))) {
      return 'utility';
    } else if (hasUtilityKeywords && (
      nameLower.includes('energy') || nameLower.includes('fiber') ||
      nameLower.includes('broadband') || nameLower.includes('telecom')
    )) {
      return 'energy';
    } else if (hasGovernmentKeywords || nameLower.includes('city of') || 
               nameLower.includes('county') || nameLower.includes('state') ||
               subjectLower.includes('city of') || subjectLower.includes('county')) {
      return 'government';
    }

    return 'other';
  }

  /**
   * Extract company name from domain
   */
  extractCompanyName(domain) {
    if (!domain) return 'Unknown Company';
    const normalized = this.normalizeDomain(domain);
    const parts = normalized.split('.');
    
    // Remove common TLDs and get company name
    if (parts.length >= 2) {
      const companyPart = parts[parts.length - 2];
      // Capitalize first letter
      return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
    }
    
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  /**
   * Analyze emails and extract company intelligence
   */
  async analyze() {
    this.log('INTELLIGENCE AUDIT - CUSTOMER COMPANIES', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    // Get all unlinked customer emails (excluding sales/marketing)
    const allUnlinkedEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: this.workspaceId,
        personId: null,
        companyId: null
      },
      select: {
        id: true,
        from: true,
        to: true,
        subject: true,
        body: true,
        receivedAt: true
      },
      orderBy: {
        receivedAt: 'desc'
      }
    });

    // Filter out emails without from address
    const unlinkedEmails = allUnlinkedEmails.filter(e => e.from && e.from.trim().length > 0);

    this.results.totalEmails = unlinkedEmails.length;
    this.log(`Analyzing ${unlinkedEmails.length} unlinked emails`, 'info');
    this.log('', 'info');

    // Group emails by company domain
    const companyMap = new Map();

    for (const email of unlinkedEmails) {
      const fromDomain = this.extractDomain(email.from);
      if (!fromDomain || this.shouldExclude(fromDomain)) {
        continue;
      }

      const normalizedDomain = this.normalizeDomain(fromDomain);
      const baseDomain = this.extractBaseDomain(fromDomain);

      if (!companyMap.has(baseDomain)) {
        const companyName = this.extractCompanyName(baseDomain);
        const category = this.categorizeCompany(companyName, baseDomain, email);

        companyMap.set(baseDomain, {
          name: companyName,
          domain: baseDomain,
          fullDomain: normalizedDomain,
          category: category,
          emailCount: 0,
          emails: [],
          people: new Set(),
          firstEmail: email.receivedAt,
          lastEmail: email.receivedAt,
          subjects: []
        });
      }

      const company = companyMap.get(baseDomain);
      company.emailCount++;
      company.people.add(email.from);
      
      if (company.emails.length < 5) {
        company.emails.push({
          subject: email.subject,
          from: email.from,
          receivedAt: email.receivedAt
        });
      }

      if (email.subject && company.subjects.length < 10) {
        company.subjects.push(email.subject);
      }

      if (email.receivedAt < company.firstEmail) {
        company.firstEmail = email.receivedAt;
      }
      if (email.receivedAt > company.lastEmail) {
        company.lastEmail = email.receivedAt;
      }
    }

    // Convert to array and categorize
    this.results.companies = Array.from(companyMap.values())
      .sort((a, b) => b.emailCount - a.emailCount);

    // Categorize companies
    for (const company of this.results.companies) {
      this.results.companyTypes[company.category].push(company);
      
      // Track industries
      if (!this.results.industries[company.category]) {
        this.results.industries[company.category] = [];
      }
      this.results.industries[company.category].push(company);
    }

    // Calculate intelligence metrics
    this.calculateIntelligence();

    this.log('Analysis complete', 'success');
    this.log('', 'info');
  }

  /**
   * Calculate intelligence metrics
   */
  calculateIntelligence() {
    // Target industries
    const industryCounts = {};
    for (const company of this.results.companies) {
      industryCounts[company.category] = (industryCounts[company.category] || 0) + 1;
    }

    this.results.intelligence.targetIndustries = Object.entries(industryCounts)
      .map(([industry, count]) => ({
        industry,
        count,
        percentage: (count / this.results.companies.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Company sizes (by email volume)
    this.results.intelligence.companySizes = {
      high: this.results.companies.filter(c => c.emailCount >= 10).length,
      medium: this.results.companies.filter(c => c.emailCount >= 5 && c.emailCount < 10).length,
      low: this.results.companies.filter(c => c.emailCount < 5).length
    };

    // Engagement levels (by time span)
    const now = new Date();
    for (const company of this.results.companies) {
      const daysSinceFirst = Math.floor((now - new Date(company.firstEmail)) / (1000 * 60 * 60 * 24));
      const daysSinceLast = Math.floor((now - new Date(company.lastEmail)) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLast <= 30) {
        company.engagementLevel = 'active';
      } else if (daysSinceLast <= 90) {
        company.engagementLevel = 'recent';
      } else {
        company.engagementLevel = 'dormant';
      }
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    this.log('='.repeat(70), 'info');
    this.log('INTELLIGENCE AUDIT REPORT', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    // Summary
    this.log('SUMMARY:', 'info');
    this.log(`  Total companies identified: ${this.results.companies.length}`, 'info');
    this.log(`  Total emails analyzed: ${this.results.totalEmails}`, 'info');
    this.log('', 'info');

    // Target Industries
    this.log('TARGET INDUSTRIES:', 'info');
    for (const industry of this.results.intelligence.targetIndustries) {
      const icon = industry.industry === 'utility' || industry.industry === 'energy' ? '⚡' : 
                   industry.industry === 'government' ? '🏛️' : 'ℹ️';
      this.log(`  ${icon} ${industry.industry}: ${industry.count} companies (${industry.percentage.toFixed(2)}%)`, 'info');
    }
    this.log('', 'info');

    // Utility Companies
    if (this.results.companyTypes.utility.length > 0) {
      this.log('UTILITY COMPANIES:', 'info');
      this.log(`  Found ${this.results.companyTypes.utility.length} utility companies`, 'success');
      this.log('  Top utility companies:', 'info');
      this.results.companyTypes.utility.slice(0, 15).forEach((company, idx) => {
        this.log(`    ${idx + 1}. ${company.name} (${company.domain})`, 'info');
        this.log(`       - ${company.emailCount} emails, ${company.people.size} contacts`, 'info');
        this.log(`       - Engagement: ${company.engagementLevel}`, 'info');
        if (company.subjects.length > 0) {
          this.log(`       - Sample: ${company.subjects[0]}`, 'info');
        }
      });
      this.log('', 'info');
    }

    // Energy Companies
    if (this.results.companyTypes.energy.length > 0) {
      this.log('ENERGY COMPANIES:', 'info');
      this.log(`  Found ${this.results.companyTypes.energy.length} energy companies`, 'success');
      this.log('  Top energy companies:', 'info');
      this.results.companyTypes.energy.slice(0, 15).forEach((company, idx) => {
        this.log(`    ${idx + 1}. ${company.name} (${company.domain})`, 'info');
        this.log(`       - ${company.emailCount} emails, ${company.people.size} contacts`, 'info');
        this.log(`       - Engagement: ${company.engagementLevel}`, 'info');
        if (company.subjects.length > 0) {
          this.log(`       - Sample: ${company.subjects[0]}`, 'info');
        }
      });
      this.log('', 'info');
    }

    // Government Entities
    if (this.results.companyTypes.government.length > 0) {
      this.log('GOVERNMENT ENTITIES:', 'info');
      this.log(`  Found ${this.results.companyTypes.government.length} government entities`, 'success');
      this.log('  Top government entities:', 'info');
      this.results.companyTypes.government.slice(0, 15).forEach((company, idx) => {
        this.log(`    ${idx + 1}. ${company.name} (${company.domain})`, 'info');
        this.log(`       - ${company.emailCount} emails, ${company.people.size} contacts`, 'info');
        this.log(`       - Engagement: ${company.engagementLevel}`, 'info');
        if (company.subjects.length > 0) {
          this.log(`       - Sample: ${company.subjects[0]}`, 'info');
        }
      });
      this.log('', 'info');
    }

    // Company Sizes
    this.log('COMPANY ENGAGEMENT LEVELS:', 'info');
    this.log(`  High engagement (10+ emails): ${this.results.intelligence.companySizes.high}`, 'info');
    this.log(`  Medium engagement (5-9 emails): ${this.results.intelligence.companySizes.medium}`, 'info');
    this.log(`  Low engagement (<5 emails): ${this.results.intelligence.companySizes.low}`, 'info');
    this.log('', 'info');

    // Recommendations
    this.log('RECOMMENDATIONS:', 'info');
    const utilityEnergyCount = this.results.companyTypes.utility.length + this.results.companyTypes.energy.length;
    const utilityEnergyPercentage = (utilityEnergyCount / this.results.companies.length) * 100;
    
    if (utilityEnergyPercentage > 50) {
      this.log(`  ✅ ${utilityEnergyPercentage.toFixed(2)}% are utility/energy companies - Strong focus confirmed`, 'success');
    } else {
      this.log(`  ⚠️  ${utilityEnergyPercentage.toFixed(2)}% are utility/energy companies - Mixed focus`, 'warn');
    }

    this.log(`  📊 Priority companies to add:`, 'info');
    const priorityCompanies = [
      ...this.results.companyTypes.utility,
      ...this.results.companyTypes.energy,
      ...this.results.companyTypes.government
    ]
      .filter(c => c.emailCount >= 3)
      .sort((a, b) => b.emailCount - a.emailCount)
      .slice(0, 20);

    priorityCompanies.forEach((company, idx) => {
      this.log(`    ${idx + 1}. ${company.name} (${company.domain}) - ${company.emailCount} emails`, 'info');
    });

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
  }

  /**
   * Execute audit
   */
  async execute() {
    try {
      await this.analyze();
      this.generateReport();
    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      console.error(error);
      throw error;
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    workspaceId: args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1] || '01K75ZD7DWHG1XF16HAF2YVKCK'
  };

  const audit = new IntelligenceAudit(options);

  try {
    await audit.execute();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = IntelligenceAudit;

