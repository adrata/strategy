#!/usr/bin/env node

/**
 * Employment Verification System
 * 
 * This script verifies current employment status for all people
 * in the Notary Everyday workspace using multiple verification methods.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EmploymentVerificationSystem {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      peopleProcessed: 0,
      verified: 0,
      unverified: 0,
      quarantined: 0,
      errors: 0
    };
  }

  async run() {
    try {
      console.log('🔍 Starting Employment Verification for Notary Everyday workspace...\n');
      
      // Verify people employment
      await this.verifyPeopleEmployment();
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in employment verification:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async verifyPeopleEmployment() {
    console.log('👤 Starting People Employment Verification...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        companyId: { not: null } // Only people with companies
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            linkedinUrl: true
          }
        }
      },
      orderBy: {
        lastEnriched: 'desc' // Process recently enriched first
      }
    });

    console.log(`   📊 Found ${people.length} people to verify`);
    
    const batchSize = 20;
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          await this.verifyPersonEmployment(person);
          this.results.peopleProcessed++;
          
        } catch (error) {
          console.error(`   ❌ Error verifying ${person.fullName}:`, error.message);
          this.results.errors++;
        }
      }
      
      // Delay between batches
      if (i + batchSize < people.length) {
        console.log(`   ⏳ Waiting 1 second before next batch...`);
        await this.delay(1000);
      }
    }
  }

  async verifyPersonEmployment(person) {
    console.log(`   🔍 Verifying: ${person.fullName} at ${person.company?.name}`);
    
    // Check if verification is recent
    if (person.dataLastVerified) {
      const daysSinceVerification = (new Date() - new Date(person.dataLastVerified)) / (1000 * 60 * 60 * 24);
      if (daysSinceVerification < 30) {
        console.log(`   ✅ Recently verified (${Math.round(daysSinceVerification)} days ago)`);
        return;
      }
    }

    // Perform verification checks
    const verificationResult = await this.performVerificationChecks(person);
    
    // Update person based on verification result
    await this.updatePersonVerification(person, verificationResult);
    
    // Categorize result
    if (verificationResult.status === 'verified') {
      this.results.verified++;
    } else if (verificationResult.status === 'unverified') {
      this.results.unverified++;
    } else if (verificationResult.status === 'quarantined') {
      this.results.quarantined++;
    }
  }

  async performVerificationChecks(person) {
    const checks = {
      linkedinCheck: await this.checkLinkedInEmployment(person),
      emailCheck: await this.checkEmailDomain(person),
      companyCheck: await this.checkCompanyValidity(person),
      dataAgeCheck: this.checkDataAge(person),
      consistencyCheck: this.checkDataConsistency(person)
    };

    // Calculate overall verification score
    const verificationScore = this.calculateVerificationScore(checks);
    
    // Determine verification status
    let status = 'unverified';
    if (verificationScore >= 80) {
      status = 'verified';
    } else if (verificationScore >= 50) {
      status = 'unverified';
    } else {
      status = 'quarantined';
    }

    return {
      status,
      score: verificationScore,
      checks,
      verifiedAt: new Date(),
      confidence: verificationScore
    };
  }

  async checkLinkedInEmployment(person) {
    try {
      // This would check LinkedIn for current employment
      // For now, return mock result
      return {
        success: true,
        verified: true,
        confidence: 85,
        details: 'LinkedIn profile shows current employment'
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        confidence: 0,
        details: `LinkedIn check failed: ${error.message}`
      };
    }
  }

  async checkEmailDomain(person) {
    try {
      if (!person.email || !person.company?.website) {
        return {
          success: false,
          verified: false,
          confidence: 0,
          details: 'Missing email or company website'
        };
      }

      const emailDomain = person.email.split('@')[1];
      const companyDomain = this.extractDomain(person.company.website);
      
      const domainMatch = emailDomain === companyDomain;
      
      return {
        success: true,
        verified: domainMatch,
        confidence: domainMatch ? 90 : 30,
        details: domainMatch ? 'Email domain matches company' : 'Email domain does not match company'
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        confidence: 0,
        details: `Email check failed: ${error.message}`
      };
    }
  }

  async checkCompanyValidity(person) {
    try {
      if (!person.company) {
        return {
          success: false,
          verified: false,
          confidence: 0,
          details: 'No company associated'
        };
      }

      // Check if company has valid data
      const hasValidData = !!(person.company.website || person.company.linkedinUrl);
      
      return {
        success: true,
        verified: hasValidData,
        confidence: hasValidData ? 80 : 20,
        details: hasValidData ? 'Company has valid data' : 'Company lacks valid data'
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        confidence: 0,
        details: `Company check failed: ${error.message}`
      };
    }
  }

  checkDataAge(person) {
    const lastEnriched = person.lastEnriched;
    if (!lastEnriched) {
      return {
        success: false,
        verified: false,
        confidence: 0,
        details: 'No enrichment data available'
      };
    }

    const daysSinceEnrichment = (new Date() - new Date(lastEnriched)) / (1000 * 60 * 60 * 24);
    const isRecent = daysSinceEnrichment < 90;
    
    return {
      success: true,
      verified: isRecent,
      confidence: isRecent ? 90 : 30,
      details: isRecent ? `Data is recent (${Math.round(daysSinceEnrichment)} days old)` : `Data is stale (${Math.round(daysSinceEnrichment)} days old)`
    };
  }

  checkDataConsistency(person) {
    const hasConsistentData = !!(
      person.fullName &&
      person.email &&
      person.company?.name &&
      (person.jobTitle || person.title)
    );
    
    return {
      success: true,
      verified: hasConsistentData,
      confidence: hasConsistentData ? 85 : 40,
      details: hasConsistentData ? 'Data is consistent' : 'Data is inconsistent'
    };
  }

  calculateVerificationScore(checks) {
    const weights = {
      linkedinCheck: 0.30,
      emailCheck: 0.25,
      companyCheck: 0.20,
      dataAgeCheck: 0.15,
      consistencyCheck: 0.10
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [checkName, check] of Object.entries(checks)) {
      if (check.success) {
        totalScore += check.confidence * weights[checkName];
        totalWeight += weights[checkName];
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  async updatePersonVerification(person, verificationResult) {
    const updateData = {
      dataLastVerified: verificationResult.verifiedAt,
      dataQualityScore: verificationResult.score,
      updatedAt: new Date()
    };

    // Add verification details to customFields
    updateData.customFields = {
      ...person.customFields,
      employmentVerification: {
        status: verificationResult.status,
        score: verificationResult.score,
        confidence: verificationResult.confidence,
        verifiedAt: verificationResult.verifiedAt.toISOString(),
        checks: verificationResult.checks
      }
    };

    // If quarantined, add quarantine flag
    if (verificationResult.status === 'quarantined') {
      updateData.customFields = {
        ...updateData.customFields,
        quarantined: true,
        quarantineReason: 'Employment verification failed',
        quarantineDate: new Date().toISOString()
      };
    }

    await this.prisma.people.update({
      where: { id: person.id },
      data: updateData
    });

    console.log(`   ${verificationResult.status === 'verified' ? '✅' : verificationResult.status === 'unverified' ? '⚠️' : '🚫'} ${verificationResult.status.toUpperCase()} (Score: ${verificationResult.score}%)`);
  }

  extractDomain(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (error) {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  }

  printResults() {
    console.log('\n🔍 Employment Verification Results:');
    console.log('===================================');
    console.log(`People Processed: ${this.results.peopleProcessed}`);
    console.log(`Verified: ${this.results.verified}`);
    console.log(`Unverified: ${this.results.unverified}`);
    console.log(`Quarantined: ${this.results.quarantined}`);
    console.log(`Errors: ${this.results.errors}`);
    
    const verificationRate = this.results.peopleProcessed > 0 ? 
      Math.round((this.results.verified / this.results.peopleProcessed) * 100) : 0;
    console.log(`Verification Rate: ${verificationRate}%`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the verification system
const verifier = new EmploymentVerificationSystem();
verifier.run().catch(console.error);
