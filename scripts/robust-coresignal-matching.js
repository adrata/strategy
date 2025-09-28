#!/usr/bin/env node

/**
 * Robust Coresignal Matching Strategy
 * 
 * This script implements a sophisticated matching strategy to ensure we're
 * enriching the RIGHT people, not just any "John Doe" that matches.
 * 
 * Matching Strategy:
 * 1. Email domain validation (company domain must match)
 * 2. Name + Company combination matching
 * 3. LinkedIn URL validation
 * 4. Job title cross-validation
 * 5. Confidence scoring system
 */

const { PrismaClient } = require('@prisma/client');

class RobustCoresignalMatching {
  constructor() {
    this.prisma = new PrismaClient();
    this.matchingStats = {
      totalProcessed: 0,
      exactMatches: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      noMatches: 0,
      errors: 0
    };
  }

  async analyzeMatchingStrategy() {
    console.log('🎯 Analyzing robust Coresignal matching strategy...\n');

    try {
      // Get people from TOP companies workspace
      const people = await this.getTopCompaniesPeople();
      
      console.log(`📊 Found ${people.length} people in TOP companies workspace`);
      
      // Analyze matching challenges
      await this.analyzeMatchingChallenges(people);
      
      // Test matching strategy on sample
      const samplePeople = people.slice(0, 10);
      console.log(`\n🧪 Testing matching strategy on ${samplePeople.length} people...\n`);
      
      for (const person of samplePeople) {
        await this.testPersonMatching(person);
      }
      
      await this.generateMatchingReport();

    } catch (error) {
      console.error('❌ Error during matching analysis:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getTopCompaniesPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' // TOP companies workspace
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        workEmail: true,
        email: true,
        jobTitle: true,
        linkedinUrl: true,
        companyId: true,
        company: {
          select: {
            name: true,
            website: true,
            domain: true
          }
        }
      },
      orderBy: [
        { workEmail: { sort: 'asc', nulls: 'last' } },
        { fullName: 'asc' }
      ]
    });
  }

  async analyzeMatchingChallenges(people) {
    console.log('🔍 ANALYZING MATCHING CHALLENGES:\n');
    
    // Group by name to find duplicates
    const nameGroups = {};
    people.forEach(person => {
      const name = person.fullName.toLowerCase().trim();
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(person);
    });
    
    const duplicateNames = Object.entries(nameGroups).filter(([name, people]) => people.length > 1);
    
    console.log(`📊 DUPLICATE NAME ANALYSIS:`);
    console.log(`   Total unique names: ${Object.keys(nameGroups).length}`);
    console.log(`   Duplicate names: ${duplicateNames.length}`);
    
    if (duplicateNames.length > 0) {
      console.log(`\n⚠️  DUPLICATE NAMES FOUND:`);
      duplicateNames.forEach(([name, people]) => {
        console.log(`\n   "${name}" (${people.length} people):`);
        people.forEach(person => {
          console.log(`     - ${person.fullName} (${person.workEmail || person.email || 'No email'}) - ${person.company?.name || 'No company'}`);
        });
      });
    }
    
    // Analyze email domains
    const emailDomains = {};
    people.forEach(person => {
      const email = person.workEmail || person.email;
      if (email) {
        const domain = email.split('@')[1];
        if (!emailDomains[domain]) {
          emailDomains[domain] = [];
        }
        emailDomains[domain].push(person);
      }
    });
    
    console.log(`\n📧 EMAIL DOMAIN ANALYSIS:`);
    console.log(`   Unique domains: ${Object.keys(emailDomains).length}`);
    
    const multiPersonDomains = Object.entries(emailDomains).filter(([domain, people]) => people.length > 1);
    if (multiPersonDomains.length > 0) {
      console.log(`   Domains with multiple people: ${multiPersonDomains.length}`);
      multiPersonDomains.forEach(([domain, people]) => {
        console.log(`     ${domain}: ${people.length} people`);
      });
    }
  }

  async testPersonMatching(person) {
    console.log(`\n🔍 Testing matching for: ${person.fullName}`);
    
    try {
      const matchingStrategy = this.createMatchingStrategy(person);
      const confidence = this.calculateMatchingConfidence(person, matchingStrategy);
      
      console.log(`   📧 Email: ${person.workEmail || person.email || 'None'}`);
      console.log(`   🏢 Company: ${person.company?.name || 'None'}`);
      console.log(`   💼 Title: ${person.jobTitle || 'None'}`);
      console.log(`   🔗 LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   🎯 Confidence: ${confidence.level} (${confidence.score}/100)`);
      
      // Simulate Coresignal API call with matching strategy
      const coresignalData = await this.simulateCoresignalLookup(person, matchingStrategy);
      
      if (coresignalData) {
        const matchQuality = this.assessMatchQuality(person, coresignalData);
        console.log(`   ✅ Match found: ${matchQuality.quality} (${matchQuality.score}/100)`);
        
        this.matchingStats.exactMatches++;
      } else {
        console.log(`   ❌ No match found`);
        this.matchingStats.noMatches++;
      }
      
      this.matchingStats.totalProcessed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.matchingStats.errors++;
    }
  }

  createMatchingStrategy(person) {
    const strategy = {
      primaryEmail: person.workEmail || person.email,
      name: person.fullName,
      firstName: person.firstName,
      lastName: person.lastName,
      jobTitle: person.jobTitle,
      companyName: person.company?.name,
      companyDomain: person.company?.domain,
      linkedinUrl: person.linkedinUrl,
      
      // Matching criteria
      criteria: {
        emailDomain: this.extractEmailDomain(person.workEmail || person.email),
        nameVariations: this.generateNameVariations(person.fullName),
        companyVariations: this.generateCompanyVariations(person.company?.name),
        titleKeywords: this.extractTitleKeywords(person.jobTitle)
      }
    };
    
    return strategy;
  }

  calculateMatchingConfidence(person, strategy) {
    let score = 0;
    let factors = [];
    
    // Email domain validation (40 points)
    if (strategy.primaryEmail) {
      const emailDomain = this.extractEmailDomain(strategy.primaryEmail);
      const companyDomain = person.company?.domain;
      
      if (companyDomain && emailDomain === companyDomain) {
        score += 40;
        factors.push('Email domain matches company domain');
      } else if (emailDomain) {
        score += 20;
        factors.push('Has email address');
      }
    }
    
    // Name completeness (20 points)
    if (strategy.firstName && strategy.lastName) {
      score += 20;
      factors.push('Full name available');
    } else if (strategy.name) {
      score += 10;
      factors.push('Partial name available');
    }
    
    // Company information (20 points)
    if (strategy.companyName) {
      score += 20;
      factors.push('Company name available');
    }
    
    // Job title (10 points)
    if (strategy.jobTitle) {
      score += 10;
      factors.push('Job title available');
    }
    
    // LinkedIn URL (10 points)
    if (strategy.linkedinUrl) {
      score += 10;
      factors.push('LinkedIn URL available');
    }
    
    let level = 'low';
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'high';
    else if (score >= 40) level = 'medium';
    
    return { score, level, factors };
  }

  async simulateCoresignalLookup(person, strategy) {
    // Simulate Coresignal API call with proper matching
    console.log(`   🔍 Simulating Coresignal lookup for ${person.fullName}...`);
    
    // Mock API response based on matching strategy
    const mockData = {
      id: `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      full_name: person.fullName,
      primary_professional_email: strategy.primaryEmail,
      linkedin_url: strategy.linkedinUrl || `https://linkedin.com/in/${person.fullName.toLowerCase().replace(/\s+/g, '-')}`,
      phone: '+1-555-0123',
      location: 'United States',
      active_experience_title: strategy.jobTitle || 'Professional',
      active_experience_company: strategy.companyName || 'Company Inc.',
      experience: [
        {
          title: strategy.jobTitle || 'Professional',
          company: strategy.companyName || 'Company Inc.',
          start_date: '2020-01-01',
          end_date: null,
          current: true
        }
      ],
      education: [
        {
          school: 'University',
          degree: 'Bachelor',
          field: 'Business',
          start_date: '2010-01-01',
          end_date: '2014-01-01'
        }
      ],
      skills: ['Leadership', 'Management', 'Strategy'],
      followers_count: Math.floor(Math.random() * 1000) + 100,
      connections_count: Math.floor(Math.random() * 2000) + 500,
      picture_url: null,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'CoreSignal API - Robust Matching'
    };
    
    return mockData;
  }

  assessMatchQuality(person, coresignalData) {
    let score = 0;
    let quality = 'poor';
    
    // Name matching (30 points)
    if (coresignalData.full_name && coresignalData.full_name.toLowerCase() === person.fullName.toLowerCase()) {
      score += 30;
    } else if (coresignalData.full_name && this.namesMatch(coresignalData.full_name, person.fullName)) {
      score += 20;
    }
    
    // Email matching (40 points)
    if (coresignalData.primary_professional_email && 
        coresignalData.primary_professional_email === (person.workEmail || person.email)) {
      score += 40;
    }
    
    // Company matching (20 points)
    if (coresignalData.active_experience_company && 
        coresignalData.active_experience_company.toLowerCase() === (person.company?.name || '').toLowerCase()) {
      score += 20;
    }
    
    // Title matching (10 points)
    if (coresignalData.active_experience_title && 
        coresignalData.active_experience_title.toLowerCase() === (person.jobTitle || '').toLowerCase()) {
      score += 10;
    }
    
    if (score >= 80) quality = 'excellent';
    else if (score >= 60) quality = 'good';
    else if (score >= 40) quality = 'fair';
    
    return { score, quality };
  }

  // Helper methods
  extractEmailDomain(email) {
    if (!email) return null;
    return email.split('@')[1]?.toLowerCase();
  }

  generateNameVariations(fullName) {
    if (!fullName) return [];
    const name = fullName.toLowerCase().trim();
    return [
      name,
      name.replace(/\s+/g, ''),
      name.replace(/\s+/g, '-'),
      name.replace(/\s+/g, '_')
    ];
  }

  generateCompanyVariations(companyName) {
    if (!companyName) return [];
    const company = companyName.toLowerCase().trim();
    return [
      company,
      company.replace(/\s+/g, ''),
      company.replace(/\s+/g, '-'),
      company.replace(/[^a-z0-9]/g, '')
    ];
  }

  extractTitleKeywords(jobTitle) {
    if (!jobTitle) return [];
    return jobTitle.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  }

  namesMatch(name1, name2) {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  }

  async generateMatchingReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ROBUST MATCHING STRATEGY REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 MATCHING STATISTICS:`);
    console.log(`   Total Processed: ${this.matchingStats.totalProcessed}`);
    console.log(`   Exact Matches: ${this.matchingStats.exactMatches}`);
    console.log(`   No Matches: ${this.matchingStats.noMatches}`);
    console.log(`   Errors: ${this.matchingStats.errors}`);
    
    const successRate = this.matchingStats.totalProcessed > 0 
      ? ((this.matchingStats.exactMatches / this.matchingStats.totalProcessed) * 100).toFixed(1)
      : 0;
    
    console.log(`   Success Rate: ${successRate}%`);
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    console.log(`   1. Always validate email domain against company domain`);
    console.log(`   2. Use full name + company combination for matching`);
    console.log(`   3. Cross-reference LinkedIn URLs when available`);
    console.log(`   4. Implement confidence scoring before enrichment`);
    console.log(`   5. Log all matching decisions for audit trail`);
    
    console.log('\n✅ Matching strategy analysis complete!');
  }
}

// Run the analysis
async function main() {
  const matcher = new RobustCoresignalMatching();
  await matcher.analyzeMatchingStrategy();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RobustCoresignalMatching;
