#!/usr/bin/env node

/**
 * 🔍 AUDIT FAKE/PLACEHOLDER DATA
 * 
 * This script audits the TOP workspace to identify and flag:
 * 1. Fake/placeholder people (John Doe, Jane Smith, Test User, etc.)
 * 2. Test companies or dummy data
 * 3. Invalid email addresses
 * 4. Suspicious or placeholder data patterns
 * 5. Data quality issues that need attention
 */

const { PrismaClient } = require('@prisma/client');

class AuditFakePlaceholderData {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    
    // Common fake/placeholder patterns
    this.fakeNamePatterns = [
      /^john\s+doe$/i,
      /^jane\s+doe$/i,
      /^jane\s+smith$/i,
      /^john\s+smith$/i,
      /^test\s+user$/i,
      /^test\s+person$/i,
      /^demo\s+user$/i,
      /^sample\s+user$/i,
      /^placeholder$/i,
      /^fake\s+user$/i,
      /^dummy\s+user$/i,
      /^example\s+user$/i,
      /^admin\s+user$/i,
      /^system\s+user$/i,
      /^temp\s+user$/i,
      /^temporary\s+user$/i,
      /^user\s+\d+$/i,
      /^test\d+$/i,
      /^demo\d+$/i,
      /^sample\d+$/i,
      /^placeholder\d+$/i,
      /^fake\d+$/i,
      /^dummy\d+$/i,
      /^example\d+$/i,
      /^admin\d+$/i,
      /^system\d+$/i,
      /^temp\d+$/i,
      /^temporary\d+$/i,
      /^user\s+test$/i,
      /^user\s+demo$/i,
      /^user\s+sample$/i,
      /^user\s+placeholder$/i,
      /^user\s+fake$/i,
      /^user\s+dummy$/i,
      /^user\s+example$/i,
      /^user\s+admin$/i,
      /^user\s+system$/i,
      /^user\s+temp$/i,
      /^user\s+temporary$/i
    ];

    this.fakeEmailPatterns = [
      /^test@/i,
      /^demo@/i,
      /^sample@/i,
      /^placeholder@/i,
      /^fake@/i,
      /^dummy@/i,
      /^example@/i,
      /^admin@/i,
      /^system@/i,
      /^temp@/i,
      /^temporary@/i,
      /@test\./i,
      /@demo\./i,
      /@sample\./i,
      /@placeholder\./i,
      /@fake\./i,
      /@dummy\./i,
      /@example\./i,
      /@admin\./i,
      /@system\./i,
      /@temp\./i,
      /@temporary\./i,
      /@localhost/i,
      /@example\.com$/i,
      /@test\.com$/i,
      /@demo\.com$/i,
      /@sample\.com$/i,
      /@placeholder\.com$/i,
      /@fake\.com$/i,
      /@dummy\.com$/i,
      /@admin\.com$/i,
      /@system\.com$/i,
      /@temp\.com$/i,
      /@temporary\.com$/i
    ];

    this.fakeCompanyPatterns = [
      /^test\s+company$/i,
      /^demo\s+company$/i,
      /^sample\s+company$/i,
      /^placeholder\s+company$/i,
      /^fake\s+company$/i,
      /^dummy\s+company$/i,
      /^example\s+company$/i,
      /^admin\s+company$/i,
      /^system\s+company$/i,
      /^temp\s+company$/i,
      /^temporary\s+company$/i,
      /^test\s+corp$/i,
      /^demo\s+corp$/i,
      /^sample\s+corp$/i,
      /^placeholder\s+corp$/i,
      /^fake\s+corp$/i,
      /^dummy\s+corp$/i,
      /^example\s+corp$/i,
      /^admin\s+corp$/i,
      /^system\s+corp$/i,
      /^temp\s+corp$/i,
      /^temporary\s+corp$/i,
      /^test\s+inc$/i,
      /^demo\s+inc$/i,
      /^sample\s+inc$/i,
      /^placeholder\s+inc$/i,
      /^fake\s+inc$/i,
      /^dummy\s+inc$/i,
      /^example\s+inc$/i,
      /^admin\s+inc$/i,
      /^system\s+inc$/i,
      /^temp\s+inc$/i,
      /^temporary\s+inc$/i,
      /^test\s+llc$/i,
      /^demo\s+llc$/i,
      /^sample\s+llc$/i,
      /^placeholder\s+llc$/i,
      /^fake\s+llc$/i,
      /^dummy\s+llc$/i,
      /^example\s+llc$/i,
      /^admin\s+llc$/i,
      /^system\s+llc$/i,
      /^temp\s+llc$/i,
      /^temporary\s+llc$/i
    ];

    this.results = {
      analysisDate: new Date().toISOString(),
      totalPeople: 0,
      totalCompanies: 0,
      fakePeople: [],
      fakeCompanies: [],
      invalidEmails: [],
      suspiciousData: [],
      dataQualityIssues: [],
      recommendations: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔍 AUDIT FAKE/PLACEHOLDER DATA');
    console.log('===============================');
    console.log('');

    try {
      // Step 1: Audit People for fake/placeholder data
      await this.auditPeople();
      
      // Step 2: Audit Companies for fake/placeholder data
      await this.auditCompanies();
      
      // Step 3: Audit Email addresses
      await this.auditEmails();
      
      // Step 4: Look for suspicious data patterns
      await this.auditSuspiciousPatterns();
      
      // Step 5: Generate recommendations
      await this.generateRecommendations();
      
      // Step 6: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Audit failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async auditPeople() {
    console.log('👥 STEP 1: Auditing people for fake/placeholder data...');
    
    const allPeople = await this.prisma.people.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        jobTitle: true,
        company: {
          select: { name: true }
        }
      }
    });

    this.results.totalPeople = allPeople.length;
    console.log(`   📊 Analyzing ${allPeople.length} people...`);

    for (const person of allPeople) {
      const issues = [];

      // Check name patterns
      if (this.isFakeName(person.fullName) || this.isFakeName(person.firstName) || this.isFakeName(person.lastName)) {
        issues.push('Fake/placeholder name detected');
      }

      // Check for suspicious patterns
      if (this.hasSuspiciousPatterns(person)) {
        issues.push('Suspicious data patterns detected');
      }

      if (issues.length > 0) {
        this.results.fakePeople.push({
          id: person.id,
          fullName: person.fullName,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          jobTitle: person.jobTitle,
          company: person.company?.name,
          issues: issues
        });
      }
    }

    console.log(`   ❌ Found ${this.results.fakePeople.length} people with fake/placeholder data`);
    console.log('');
  }

  async auditCompanies() {
    console.log('🏢 STEP 2: Auditing companies for fake/placeholder data...');
    
    const allCompanies = await this.prisma.companies.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true
      }
    });

    this.results.totalCompanies = allCompanies.length;
    console.log(`   📊 Analyzing ${allCompanies.length} companies...`);

    for (const company of allCompanies) {
      const issues = [];

      // Check company name patterns
      if (this.isFakeCompany(company.name)) {
        issues.push('Fake/placeholder company name detected');
      }

      // Check for suspicious patterns
      if (this.hasSuspiciousCompanyPatterns(company)) {
        issues.push('Suspicious company data patterns detected');
      }

      if (issues.length > 0) {
        this.results.fakeCompanies.push({
          id: company.id,
          name: company.name,
          website: company.website,
          industry: company.industry,
          issues: issues
        });
      }
    }

    console.log(`   ❌ Found ${this.results.fakeCompanies.length} companies with fake/placeholder data`);
    console.log('');
  }

  async auditEmails() {
    console.log('📧 STEP 3: Auditing email addresses...');
    
    const peopleWithEmails = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        email: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: {
          select: { name: true }
        }
      }
    });

    console.log(`   📊 Analyzing ${peopleWithEmails.length} email addresses...`);

    for (const person of peopleWithEmails) {
      const issues = [];

      // Check email patterns
      if (this.isFakeEmail(person.email)) {
        issues.push('Fake/placeholder email detected');
      }

      // Check email format
      if (!this.isValidEmailFormat(person.email)) {
        issues.push('Invalid email format');
      }

      if (issues.length > 0) {
        this.results.invalidEmails.push({
          id: person.id,
          fullName: person.fullName,
          email: person.email,
          company: person.company?.name,
          issues: issues
        });
      }
    }

    console.log(`   ❌ Found ${this.results.invalidEmails.length} invalid/fake email addresses`);
    console.log('');
  }

  async auditSuspiciousPatterns() {
    console.log('🔍 STEP 4: Looking for suspicious data patterns...');
    
    // Check for duplicate names
    const duplicateNames = await this.prisma.people.groupBy({
      by: ['fullName'],
      where: { workspaceId: this.workspaceId },
      _count: { fullName: true },
      having: {
        fullName: {
          _count: {
            gt: 1
          }
        }
      }
    });

    if (duplicateNames.length > 0) {
      this.results.suspiciousData.push({
        type: 'Duplicate Names',
        count: duplicateNames.length,
        details: duplicateNames.map(d => `${d.fullName} (${d._count.fullName} occurrences)`)
      });
    }

    // Check for people with no company
    const peopleWithoutCompany = await this.prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        companyId: null
      }
    });

    if (peopleWithoutCompany > 0) {
      this.results.suspiciousData.push({
        type: 'People without Company',
        count: peopleWithoutCompany,
        details: [`${peopleWithoutCompany} people have no associated company`]
      });
    }

    // Check for companies with no people
    const companiesWithoutPeople = await this.prisma.companies.count({
      where: {
        workspaceId: this.workspaceId,
        people: { none: {} }
      }
    });

    if (companiesWithoutPeople > 0) {
      this.results.suspiciousData.push({
        type: 'Companies without People',
        count: companiesWithoutPeople,
        details: [`${companiesWithoutPeople} companies have no associated people`]
      });
    }

    console.log(`   🔍 Found ${this.results.suspiciousData.length} suspicious data patterns`);
    console.log('');
  }

  async generateRecommendations() {
    console.log('💡 STEP 5: Generating recommendations...');
    
    if (this.results.fakePeople.length > 0) {
      this.results.recommendations.push(`Review and potentially remove ${this.results.fakePeople.length} people with fake/placeholder data`);
    }

    if (this.results.fakeCompanies.length > 0) {
      this.results.recommendations.push(`Review and potentially remove ${this.results.fakeCompanies.length} companies with fake/placeholder data`);
    }

    if (this.results.invalidEmails.length > 0) {
      this.results.recommendations.push(`Review and fix ${this.results.invalidEmails.length} invalid email addresses`);
    }

    if (this.results.suspiciousData.length > 0) {
      this.results.recommendations.push('Investigate suspicious data patterns for data quality issues');
    }

    if (this.results.fakePeople.length === 0 && this.results.fakeCompanies.length === 0 && this.results.invalidEmails.length === 0) {
      this.results.recommendations.push('✅ No fake/placeholder data detected - data quality is excellent!');
    }

    console.log('💡 Recommendations:');
    if (this.results.recommendations.length > 0) {
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    console.log('');
  }

  async generateFinalReport() {
    console.log('📋 STEP 6: Generating final report...');
    
    console.log('\n🎉 FAKE/PLACEHOLDER DATA AUDIT REPORT');
    console.log('=====================================');
    console.log(`📅 Analysis Date: ${this.results.analysisDate}`);
    console.log('');

    console.log('📊 SUMMARY STATISTICS:');
    console.log(`   👥 Total People: ${this.results.totalPeople}`);
    console.log(`   🏢 Total Companies: ${this.results.totalCompanies}`);
    console.log(`   ❌ Fake/Placeholder People: ${this.results.fakePeople.length}`);
    console.log(`   ❌ Fake/Placeholder Companies: ${this.results.fakeCompanies.length}`);
    console.log(`   ❌ Invalid/Fake Emails: ${this.results.invalidEmails.length}`);
    console.log(`   🔍 Suspicious Data Patterns: ${this.results.suspiciousData.length}`);
    console.log('');

    if (this.results.fakePeople.length > 0) {
      console.log('❌ FAKE/PLACEHOLDER PEOPLE:');
      this.results.fakePeople.slice(0, 20).forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} (${person.email || 'No email'})`);
        console.log(`      Company: ${person.company || 'No company'}`);
        console.log(`      Issues: ${person.issues.join(', ')}`);
        console.log('');
      });
      
      if (this.results.fakePeople.length > 20) {
        console.log(`   ... and ${this.results.fakePeople.length - 20} more`);
        console.log('');
      }
    }

    if (this.results.fakeCompanies.length > 0) {
      console.log('❌ FAKE/PLACEHOLDER COMPANIES:');
      this.results.fakeCompanies.slice(0, 20).forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name}`);
        console.log(`      Website: ${company.website || 'No website'}`);
        console.log(`      Issues: ${company.issues.join(', ')}`);
        console.log('');
      });
      
      if (this.results.fakeCompanies.length > 20) {
        console.log(`   ... and ${this.results.fakeCompanies.length - 20} more`);
        console.log('');
      }
    }

    if (this.results.invalidEmails.length > 0) {
      console.log('❌ INVALID/FAKE EMAIL ADDRESSES:');
      this.results.invalidEmails.slice(0, 20).forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} - ${person.email}`);
        console.log(`      Company: ${person.company || 'No company'}`);
        console.log(`      Issues: ${person.issues.join(', ')}`);
        console.log('');
      });
      
      if (this.results.invalidEmails.length > 20) {
        console.log(`   ... and ${this.results.invalidEmails.length - 20} more`);
        console.log('');
      }
    }

    if (this.results.suspiciousData.length > 0) {
      console.log('🔍 SUSPICIOUS DATA PATTERNS:');
      this.results.suspiciousData.forEach((pattern, index) => {
        console.log(`   ${index + 1}. ${pattern.type}: ${pattern.count}`);
        pattern.details.forEach(detail => {
          console.log(`      - ${detail}`);
        });
        console.log('');
      });
    }

    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }

    // Overall assessment
    const hasIssues = this.results.fakePeople.length > 0 || this.results.fakeCompanies.length > 0 || this.results.invalidEmails.length > 0;

    console.log('🎯 OVERALL ASSESSMENT:');
    if (!hasIssues) {
      console.log('   🎉 EXCELLENT - No fake/placeholder data detected!');
      console.log('   ✅ Data quality is high and production-ready');
    } else {
      console.log('   ⚠️ ATTENTION NEEDED - Fake/placeholder data detected');
      console.log('   🔧 Review and clean up identified issues');
    }

    console.log('');
    console.log('🚀 TOP WORKSPACE DATA QUALITY AUDIT COMPLETE!');
  }

  // Helper methods
  isFakeName(name) {
    if (!name) return false;
    return this.fakeNamePatterns.some(pattern => pattern.test(name));
  }

  isFakeCompany(name) {
    if (!name) return false;
    return this.fakeCompanyPatterns.some(pattern => pattern.test(name));
  }

  isFakeEmail(email) {
    if (!email) return false;
    return this.fakeEmailPatterns.some(pattern => pattern.test(email));
  }

  isValidEmailFormat(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  hasSuspiciousPatterns(person) {
    // Check for suspicious patterns in person data
    if (person.fullName && person.fullName.length < 3) return true;
    if (person.firstName && person.firstName.length < 2) return true;
    if (person.lastName && person.lastName.length < 2) return true;
    if (person.jobTitle && person.jobTitle.toLowerCase().includes('test')) return true;
    if (person.jobTitle && person.jobTitle.toLowerCase().includes('demo')) return true;
    if (person.jobTitle && person.jobTitle.toLowerCase().includes('sample')) return true;
    if (person.jobTitle && person.jobTitle.toLowerCase().includes('placeholder')) return true;
    if (person.jobTitle && person.jobTitle.toLowerCase().includes('fake')) return true;
    if (person.jobTitle && person.jobTitle.toLowerCase().includes('dummy')) return true;
    return false;
  }

  hasSuspiciousCompanyPatterns(company) {
    // Check for suspicious patterns in company data
    if (company.name && company.name.length < 3) return true;
    if (company.website && company.website.includes('localhost')) return true;
    if (company.website && company.website.includes('test.')) return true;
    if (company.website && company.website.includes('demo.')) return true;
    if (company.website && company.website.includes('sample.')) return true;
    if (company.website && company.website.includes('placeholder.')) return true;
    if (company.website && company.website.includes('fake.')) return true;
    if (company.website && company.website.includes('dummy.')) return true;
    return false;
  }
}

// Execute the audit
async function main() {
  const auditor = new AuditFakePlaceholderData();
  await auditor.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AuditFakePlaceholderData;
