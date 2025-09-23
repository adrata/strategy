#!/usr/bin/env node

/**
 * 🔍 AUDIT REAL PEOPLE ONLY
 * 
 * Comprehensive audit to ensure we only have real people in the database
 * Identifies and removes any fake, test, or placeholder people
 */

const { PrismaClient } = require('@prisma/client');

class AuditRealPeopleOnly {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    this.results = {
      totalPeople: 0,
      realPeople: 0,
      fakePeople: [],
      suspiciousPeople: [],
      peopleToRemove: [],
      peopleToReview: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔍 AUDITING REAL PEOPLE ONLY');
    console.log('============================\n');

    try {
      await this.auditAllPeople();
      await this.generateReport();
      await this.cleanupFakePeople();
    } catch (error) {
      console.error('❌ Audit failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async auditAllPeople() {
    console.log('🔍 STEP 1: Auditing all people for authenticity...');
    
    const allPeople = await this.prisma.people.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        linkedinUrl: true,
        companyId: true,
        buyerGroupRole: true,
        tags: true,
        customFields: true,
        company: {
          select: { name: true }
        }
      }
    });

    this.results.totalPeople = allPeople.length;
    console.log(`📊 Found ${allPeople.length} total people to audit`);
    console.log('');

    for (const person of allPeople) {
      const auditResult = this.auditPerson(person);
      
      if (auditResult.isFake) {
        this.results.fakePeople.push({
          ...person,
          reason: auditResult.reason,
          confidence: auditResult.confidence
        });
        this.results.peopleToRemove.push(person.id);
      } else if (auditResult.isSuspicious) {
        this.results.suspiciousPeople.push({
          ...person,
          reason: auditResult.reason,
          confidence: auditResult.confidence
        });
        this.results.peopleToReview.push(person.id);
      } else {
        this.results.realPeople++;
      }
    }

    console.log(`✅ Real people: ${this.results.realPeople}`);
    console.log(`❌ Fake people: ${this.results.fakePeople.length}`);
    console.log(`⚠️ Suspicious people: ${this.results.suspiciousPeople.length}`);
    console.log('');
  }

  auditPerson(person) {
    const firstName = (person.firstName || '').toLowerCase();
    const lastName = (person.lastName || '').toLowerCase();
    const fullName = (person.fullName || '').toLowerCase();
    const jobTitle = (person.jobTitle || '').toLowerCase();
    const email = (person.email || '').toLowerCase();
    const companyName = (person.company?.name || '').toLowerCase();

    // Check for obvious fake/test data
    const fakePatterns = [
      // Test names
      'test', 'fake', 'dummy', 'sample', 'example', 'demo', 'placeholder',
      'john doe', 'jane doe', 'john smith', 'jane smith',
      'unknown', 'n/a', 'na', 'tbd', 'to be determined',
      
      // Generic names
      'person', 'user', 'employee', 'staff', 'member', 'contact',
      'first name', 'last name', 'full name',
      
      // Test companies
      'test company', 'sample company', 'demo company', 'fake company',
      'example corp', 'test inc', 'sample llc',
      
      // Generic titles
      'test title', 'sample title', 'example title', 'unknown title',
      'job title', 'position', 'role'
    ];

    // Check for suspicious patterns
    const suspiciousPatterns = [
      // Incomplete data
      'unknown', 'n/a', 'na', 'tbd', 'to be determined',
      
      // Generic data
      'employee', 'staff', 'member', 'contact', 'person',
      
      // Missing critical data
      !person.email && !person.linkedinUrl,
      !person.jobTitle || person.jobTitle === 'Unknown Title',
      
      // Suspicious email patterns
      email.includes('test@') || email.includes('fake@') || email.includes('example@'),
      
      // Suspicious LinkedIn patterns
      person.linkedinUrl && (
        person.linkedinUrl.includes('test') || 
        person.linkedinUrl.includes('fake') ||
        person.linkedinUrl.includes('example')
      )
    ];

    // Check for fake data
    for (const pattern of fakePatterns) {
      if (firstName.includes(pattern) || lastName.includes(pattern) || 
          fullName.includes(pattern) || jobTitle.includes(pattern) ||
          companyName.includes(pattern)) {
        return {
          isFake: true,
          isSuspicious: false,
          reason: `Contains fake pattern: "${pattern}"`,
          confidence: 95
        };
      }
    }

    // Check for suspicious data
    let suspiciousCount = 0;
    for (const pattern of suspiciousPatterns) {
      if (pattern === true || 
          (typeof pattern === 'string' && (
            firstName.includes(pattern) || lastName.includes(pattern) ||
            fullName.includes(pattern) || jobTitle.includes(pattern) ||
            companyName.includes(pattern)
          ))) {
        suspiciousCount++;
      }
    }

    if (suspiciousCount >= 2) {
      return {
        isFake: false,
        isSuspicious: true,
        reason: `Multiple suspicious indicators (${suspiciousCount})`,
        confidence: 70
      };
    }

    // Check for missing critical data
    if (!person.email && !person.linkedinUrl && !person.jobTitle) {
      return {
        isFake: false,
        isSuspicious: true,
        reason: 'Missing all critical data (email, LinkedIn, job title)',
        confidence: 80
      };
    }

    // Check for placeholder data
    if (person.firstName === 'Unknown' && person.lastName === 'Unknown') {
      return {
        isFake: true,
        isSuspicious: false,
        reason: 'Placeholder name (Unknown Unknown)',
        confidence: 90
      };
    }

    // Check for test email domains
    if (email && (
      email.includes('@test.') || 
      email.includes('@fake.') || 
      email.includes('@example.') ||
      email.includes('@sample.') ||
      email.includes('@demo.')
    )) {
      return {
        isFake: true,
        isSuspicious: false,
        reason: 'Test email domain',
        confidence: 95
      };
    }

    // Check for suspicious job titles
    if (jobTitle && (
      jobTitle === 'unknown title' ||
      jobTitle === 'test title' ||
      jobTitle === 'sample title' ||
      jobTitle === 'example title'
    )) {
      return {
        isFake: true,
        isSuspicious: false,
        reason: 'Fake job title',
        confidence: 90
      };
    }

    return {
      isFake: false,
      isSuspicious: false,
      reason: 'Appears to be real person',
      confidence: 95
    };
  }

  async generateReport() {
    console.log('📋 STEP 2: Generating audit report...');
    
    console.log('\n🎉 REAL PEOPLE AUDIT REPORT');
    console.log('============================');
    console.log(`📊 Total people audited: ${this.results.totalPeople}`);
    console.log(`✅ Real people: ${this.results.realPeople}`);
    console.log(`❌ Fake people found: ${this.results.fakePeople.length}`);
    console.log(`⚠️ Suspicious people: ${this.results.suspiciousPeople.length}`);
    console.log('');

    if (this.results.fakePeople.length > 0) {
      console.log('❌ FAKE PEOPLE TO REMOVE:');
      this.results.fakePeople.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} (${person.company?.name})`);
        console.log(`      Reason: ${person.reason} (Confidence: ${person.confidence}%)`);
        console.log(`      Email: ${person.email || 'None'}`);
        console.log(`      Title: ${person.jobTitle || 'None'}`);
        console.log('');
      });
    }

    if (this.results.suspiciousPeople.length > 0) {
      console.log('⚠️ SUSPICIOUS PEOPLE TO REVIEW:');
      this.results.suspiciousPeople.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} (${person.company?.name})`);
        console.log(`      Reason: ${person.reason} (Confidence: ${person.confidence}%)`);
        console.log(`      Email: ${person.email || 'None'}`);
        console.log(`      Title: ${person.jobTitle || 'None'}`);
        console.log('');
      });
    }

    console.log('🎯 RECOMMENDATIONS:');
    if (this.results.fakePeople.length > 0) {
      console.log(`   1. Remove ${this.results.fakePeople.length} fake people`);
    }
    if (this.results.suspiciousPeople.length > 0) {
      console.log(`   2. Review ${this.results.suspiciousPeople.length} suspicious people`);
    }
    if (this.results.fakePeople.length === 0 && this.results.suspiciousPeople.length === 0) {
      console.log('   ✅ All people appear to be real - no action needed');
    }
    console.log('');
  }

  async cleanupFakePeople() {
    if (this.results.fakePeople.length === 0) {
      console.log('✅ No fake people to remove');
      return;
    }

    console.log(`🧹 STEP 3: Removing ${this.results.fakePeople.length} fake people...`);
    
    for (const fakePerson of this.results.fakePeople) {
      try {
        // Remove from buyer groups first
        await this.prisma.buyerGroupToPerson.deleteMany({
          where: { personId: fakePerson.id }
        });

        // Remove the person
        await this.prisma.people.delete({
          where: { id: fakePerson.id }
        });

        console.log(`   ✅ Removed fake person: ${fakePerson.fullName}`);
      } catch (error) {
        console.error(`   ❌ Failed to remove ${fakePerson.fullName}:`, error.message);
        this.results.errors.push(`Failed to remove ${fakePerson.fullName}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Cleanup complete! Removed ${this.results.fakePeople.length} fake people`);
  }
}

if (require.main === module) {
  const auditor = new AuditRealPeopleOnly();
  auditor.execute().catch(console.error);
}

module.exports = AuditRealPeopleOnly;
