#!/usr/bin/env node

/**
 * Analyze Unlinked Emails
 * 
 * Categorizes unlinked emails to determine if they're:
 * - Sales/marketing emails (outbound)
 * - Customer emails (inbound from customers)
 * - Internal emails
 * - Other
 * 
 * Usage:
 *   node scripts/analyze-unlinked-emails.js [--workspace-id=WORKSPACE_ID]
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

class UnlinkedEmailAnalyzer {
  constructor(options = {}) {
    this.workspaceId = options.workspaceId || '01K75ZD7DWHG1XF16HAF2YVKCK';
    this.results = {
      total: 0,
      categories: {
        salesMarketing: {
          count: 0,
          percentage: 0,
          emails: []
        },
        customer: {
          count: 0,
          percentage: 0,
          emails: []
        },
        internal: {
          count: 0,
          percentage: 0,
          emails: []
        },
        other: {
          count: 0,
          percentage: 0,
          emails: []
        }
      },
      potentialCompanies: [],
      potentialPeople: []
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
   * Check if email is from known email providers (likely personal/internal)
   */
  isPersonalEmailProvider(domain) {
    const personalProviders = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'protonmail.com',
      'mail.com',
      'yandex.com',
      'zoho.com'
    ];
    return personalProviders.includes(domain?.toLowerCase());
  }

  /**
   * Check if email is internal (same domain as workspace)
   */
  isInternalEmail(email, workspaceDomain) {
    if (!workspaceDomain) return false;
    const emailDomain = this.extractDomain(email);
    return emailDomain === workspaceDomain.toLowerCase();
  }

  /**
   * Categorize email based on content and sender
   */
  categorizeEmail(email) {
    const subject = (email.subject || '').toLowerCase();
    const from = email.from?.toLowerCase() || '';
    const fromDomain = this.extractDomain(from);
    
    // Check for sales/marketing indicators
    const salesMarketingKeywords = [
      'unsubscribe',
      'marketing',
      'newsletter',
      'promotion',
      'special offer',
      'limited time',
      'act now',
      'click here',
      'buy now',
      'discount',
      'sale',
      'deal',
      'offer',
      'spam',
      'noreply',
      'no-reply',
      'donotreply',
      'mailing list',
      'email list'
    ];

    const hasSalesMarketingKeywords = salesMarketingKeywords.some(keyword => 
      subject.includes(keyword) || from.includes(keyword)
    );

    // Check for customer service indicators
    const customerServiceKeywords = [
      'support',
      'help',
      'customer service',
      'contact',
      'inquiry',
      'question',
      'request',
      'order',
      'invoice',
      'payment',
      'billing',
      'account',
      'service'
    ];

    const hasCustomerServiceKeywords = customerServiceKeywords.some(keyword =>
      subject.includes(keyword) || from.includes(keyword)
    );

    // Check if it's a personal email provider
    const isPersonal = this.isPersonalEmailProvider(fromDomain);

    // Categorize
    if (hasSalesMarketingKeywords || from.includes('noreply') || from.includes('no-reply')) {
      return 'salesMarketing';
    } else if (hasCustomerServiceKeywords || (!isPersonal && !hasSalesMarketingKeywords)) {
      return 'customer';
    } else if (isPersonal) {
      return 'internal';
    } else {
      return 'other';
    }
  }

  /**
   * Extract potential company information from email
   */
  extractPotentialCompany(email) {
    const from = email.from || '';
    const fromDomain = this.extractDomain(from);
    
    if (!fromDomain || this.isPersonalEmailProvider(fromDomain)) {
      return null;
    }

    // Extract company name from domain (e.g., "mail.example.com" -> "example")
    const domainParts = fromDomain.split('.');
    const companyName = domainParts.length >= 2 
      ? domainParts[domainParts.length - 2].charAt(0).toUpperCase() + domainParts[domainParts.length - 2].slice(1)
      : fromDomain.split('.')[0];

    return {
      name: companyName,
      domain: fromDomain,
      email: from,
      source: 'unlinked_email'
    };
  }

  /**
   * Extract potential person information from email
   */
  extractPotentialPerson(email) {
    const from = email.from || '';
    if (!from) return null;

    // Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
    const emailParts = from.split('@')[0];
    const nameParts = emailParts.split(/[._-]/);
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
      const lastName = nameParts[nameParts.length - 1].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].slice(1);
      return {
        fullName: `${firstName} ${lastName}`,
        email: from,
        workEmail: from,
        source: 'unlinked_email'
      };
    }

    return null;
  }

  /**
   * Analyze unlinked emails
   */
  async analyze() {
    this.log('ANALYZING UNLINKED EMAILS', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    // Get all unlinked emails
    const unlinkedEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: this.workspaceId,
        personId: null,
        companyId: null
      },
      select: {
        id: true,
        from: true,
        to: true,
        cc: true,
        subject: true,
        body: true,
        receivedAt: true
      },
      orderBy: {
        receivedAt: 'desc'
      }
    });

    this.results.total = unlinkedEmails.length;
    this.log(`Found ${unlinkedEmails.length} unlinked emails`, 'info');
    this.log('', 'info');

    // Categorize emails
    this.log('Categorizing emails...', 'info');
    const companyMap = new Map();
    const personMap = new Map();

    for (const email of unlinkedEmails) {
      const category = this.categorizeEmail(email);
      this.results.categories[category].count++;
      
      // Store sample emails (up to 10 per category)
      if (this.results.categories[category].emails.length < 10) {
        this.results.categories[category].emails.push({
          id: email.id,
          subject: email.subject,
          from: email.from,
          receivedAt: email.receivedAt
        });
      }

      // Extract potential company
      if (category === 'customer') {
        const potentialCompany = this.extractPotentialCompany(email);
        if (potentialCompany) {
          const key = potentialCompany.domain;
          if (!companyMap.has(key)) {
            companyMap.set(key, {
              ...potentialCompany,
              emailCount: 0,
              sampleEmails: []
            });
          }
          const company = companyMap.get(key);
          company.emailCount++;
          if (company.sampleEmails.length < 3) {
            company.sampleEmails.push({
              subject: email.subject,
              from: email.from,
              receivedAt: email.receivedAt
            });
          }
        }

        // Extract potential person
        const potentialPerson = this.extractPotentialPerson(email);
        if (potentialPerson) {
          const key = potentialPerson.email;
          if (!personMap.has(key)) {
            personMap.set(key, {
              ...potentialPerson,
              emailCount: 0
            });
          }
          personMap.get(key).emailCount++;
        }
      }
    }

    // Convert maps to arrays and sort by email count
    this.results.potentialCompanies = Array.from(companyMap.values())
      .sort((a, b) => b.emailCount - a.emailCount)
      .slice(0, 50); // Top 50 companies

    this.results.potentialPeople = Array.from(personMap.values())
      .filter(p => p.emailCount >= 2) // Only people with 2+ emails
      .sort((a, b) => b.emailCount - a.emailCount)
      .slice(0, 50); // Top 50 people

    // Calculate percentages
    for (const category in this.results.categories) {
      this.results.categories[category].percentage = 
        this.results.total > 0 
          ? (this.results.categories[category].count / this.results.total) * 100 
          : 0;
    }

    this.log('Analysis complete', 'success');
    this.log('', 'info');
  }

  /**
   * Generate report
   */
  generateReport() {
    this.log('='.repeat(70), 'info');
    this.log('UNLINKED EMAIL ANALYSIS REPORT', 'info');
    this.log('='.repeat(70), 'info');
    this.log('', 'info');

    // Summary
    this.log('SUMMARY:', 'info');
    this.log(`  Total unlinked emails: ${this.results.total}`, 'info');
    this.log('', 'info');

    // Categories
    this.log('CATEGORIES:', 'info');
    for (const [category, data] of Object.entries(this.results.categories)) {
      const icon = category === 'customer' ? '✅' : category === 'salesMarketing' ? '📧' : 'ℹ️';
      this.log(`  ${icon} ${category}: ${data.count} (${data.percentage.toFixed(2)}%)`, 'info');
    }
    this.log('', 'info');

    // Potential companies to add
    if (this.results.potentialCompanies.length > 0) {
      this.log('POTENTIAL COMPANIES TO ADD (from customer emails):', 'info');
      this.log(`  Found ${this.results.potentialCompanies.length} unique companies`, 'info');
      this.log('  Top 20 companies by email count:', 'info');
      this.results.potentialCompanies.slice(0, 20).forEach((company, idx) => {
        this.log(`    ${idx + 1}. ${company.name} (${company.domain}) - ${company.emailCount} emails`, 'info');
        if (company.sampleEmails.length > 0) {
          this.log(`       Sample: ${company.sampleEmails[0].subject}`, 'info');
        }
      });
      this.log('', 'info');
    }

    // Potential people to add
    if (this.results.potentialPeople.length > 0) {
      this.log('POTENTIAL PEOPLE TO ADD (from customer emails):', 'info');
      this.log(`  Found ${this.results.potentialPeople.length} unique people (2+ emails)`, 'info');
      this.log('  Top 20 people by email count:', 'info');
      this.results.potentialPeople.slice(0, 20).forEach((person, idx) => {
        this.log(`    ${idx + 1}. ${person.fullName} (${person.email}) - ${person.emailCount} emails`, 'info');
      });
      this.log('', 'info');
    }

    // Recommendations
    this.log('RECOMMENDATIONS:', 'info');
    const customerPercentage = this.results.categories.customer.percentage;
    if (customerPercentage > 30) {
      this.log(`  ✅ ${customerPercentage.toFixed(2)}% are customer emails - Consider adding these companies/people`, 'success');
      this.log(`     This represents ${this.results.categories.customer.count} potential customer records`, 'info');
    } else {
      this.log(`  ℹ️  ${customerPercentage.toFixed(2)}% are customer emails - May not be worth adding all`, 'info');
    }

    const salesMarketingPercentage = this.results.categories.salesMarketing.percentage;
    if (salesMarketingPercentage > 20) {
      this.log(`  ⚠️  ${salesMarketingPercentage.toFixed(2)}% are sales/marketing emails - Can be ignored`, 'warn');
    }

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
  }

  /**
   * Execute analysis
   */
  async execute() {
    try {
      await this.analyze();
      this.generateReport();
    } catch (error) {
      this.log(`Analysis failed: ${error.message}`, 'error');
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

  const analyzer = new UnlinkedEmailAnalyzer(options);

  try {
    await analyzer.execute();
    process.exit(0);
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = UnlinkedEmailAnalyzer;

