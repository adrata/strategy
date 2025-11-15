#!/usr/bin/env node

/**
 * 📊 DETAILED AUDIT: BUYER GROUP PEOPLE DATA STRUCTURE
 * 
 * Shows detailed data structure for sample people enriched via buyer group pipeline.
 * This helps understand what data is stored and where.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class DetailedBuyerGroupPeopleAudit {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus workspace
    this.sampleSize = 5; // Number of sample people to show
  }

  async audit() {
    try {
      console.log('📊 DETAILED AUDIT: BUYER GROUP PEOPLE DATA STRUCTURE');
      console.log('====================================================');
      console.log(`📊 Workspace ID: ${this.workspaceId}`);
      console.log('');

      // Find sample people enriched via buyer group pipeline
      const buyerGroupPeople = await this.findBuyerGroupPeople();

      console.log(`📋 Found ${buyerGroupPeople.length} people enriched via buyer group pipeline`);
      console.log(`📊 Showing detailed data for ${Math.min(this.sampleSize, buyerGroupPeople.length)} sample people`);
      console.log('');

      if (buyerGroupPeople.length === 0) {
        console.log('⚠️  No buyer group people found');
        return;
      }

      // Show detailed data for sample people
      const samples = buyerGroupPeople.slice(0, this.sampleSize);
      for (let i = 0; i < samples.length; i++) {
        const person = samples[i];
        console.log(`\n${'='.repeat(80)}`);
        console.log(`PERSON ${i + 1}/${samples.length}: ${person.fullName || 'Unknown'}`);
        console.log('='.repeat(80));
        this.showPersonDetails(person);
      }

      // Summary
      console.log(`\n${'='.repeat(80)}`);
      console.log('SUMMARY');
      console.log('='.repeat(80));
      this.showSummary(buyerGroupPeople);

    } catch (error) {
      console.error('❌ ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Find people enriched via buyer group pipeline
   */
  async findBuyerGroupPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { buyerGroupRole: { not: null } },
          { isBuyerGroupMember: true }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });
  }

  /**
   * Show detailed data for a person
   */
  showPersonDetails(person) {
    // Basic Info
    console.log('\n👤 BASIC INFORMATION:');
    console.log(`   ID: ${person.id}`);
    console.log(`   First Name: ${person.firstName || '❌ Missing'}`);
    console.log(`   Last Name: ${person.lastName || '❌ Missing'}`);
    console.log(`   Full Name: ${person.fullName || '❌ Missing'}`);
    console.log(`   Company: ${person.company?.name || '❌ Missing'}`);

    // Contact Info
    console.log('\n📧 CONTACT INFORMATION:');
    console.log(`   Email: ${person.email || '❌ Missing'}`);
    console.log(`   Work Email: ${person.workEmail || '❌ Missing'}`);
    console.log(`   Personal Email: ${person.personalEmail || '❌ Missing'}`);
    console.log(`   Phone: ${person.phone || '❌ Missing'}`);
    console.log(`   Mobile Phone: ${person.mobilePhone || '❌ Missing'}`);
    console.log(`   Work Phone: ${person.workPhone || '❌ Missing'}`);
    console.log(`   LinkedIn URL: ${person.linkedinUrl || '❌ Missing'}`);

    // Professional Info
    console.log('\n💼 PROFESSIONAL INFORMATION:');
    console.log(`   Job Title: ${person.jobTitle || '❌ Missing'}`);
    console.log(`   Title: ${person.title || '❌ Missing'}`);
    console.log(`   Department: ${person.department || '❌ Missing'}`);

    // Buyer Group Info
    console.log('\n🎯 BUYER GROUP INFORMATION:');
    console.log(`   Buyer Group Role: ${person.buyerGroupRole || '❌ Missing'}`);
    console.log(`   Is Buyer Group Member: ${person.isBuyerGroupMember ? '✅ Yes' : '❌ No'}`);
    console.log(`   Influence Score: ${person.influenceScore !== null ? person.influenceScore : '❌ Missing'}`);
    console.log(`   Authority Level: ${person.authorityLevel || '❌ Missing'}`);
    console.log(`   CoreSignal ID: ${person.coreSignalId || '❌ Missing'}`);

    // CoreSignal Data
    console.log('\n🔍 CORESIGNAL DATA:');
    if (person.coresignalData) {
      const coresignalData = typeof person.coresignalData === 'object'
        ? person.coresignalData
        : JSON.parse(person.coresignalData || '{}');
      
      if (coresignalData && Object.keys(coresignalData).length > 0) {
        console.log(`   ✅ Has CoreSignal Data (${Object.keys(coresignalData).length} fields)`);
        console.log(`   CoreSignal ID: ${coresignalData.id || 'N/A'}`);
        console.log(`   Full Name: ${coresignalData.full_name || 'N/A'}`);
        console.log(`   LinkedIn URL: ${coresignalData.linkedin_url || 'N/A'}`);
        console.log(`   Primary Email: ${coresignalData.primary_professional_email || 'N/A'}`);
        console.log(`   Active Title: ${coresignalData.active_experience_title || 'N/A'}`);
        console.log(`   Active Company: ${coresignalData.active_experience_company || 'N/A'}`);
        console.log(`   Location: ${coresignalData.location_full || 'N/A'}`);
        console.log(`   Summary: ${coresignalData.summary ? coresignalData.summary.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`   Experience Count: ${coresignalData.experience?.length || 0}`);
        console.log(`   Education Count: ${coresignalData.education?.length || 0}`);
        console.log(`   Skills Count: ${coresignalData.inferred_skills?.length || 0}`);
        
        // Show top-level keys
        const topKeys = Object.keys(coresignalData).slice(0, 20);
        console.log(`   Top-level keys: ${topKeys.join(', ')}${Object.keys(coresignalData).length > 20 ? '...' : ''}`);
      } else {
        console.log('   ❌ CoreSignal Data is empty or invalid');
      }
    } else {
      console.log('   ❌ No CoreSignal Data field');
    }

    // Enriched Data
    console.log('\n✨ ENRICHED DATA:');
    if (person.enrichedData) {
      const enrichedData = typeof person.enrichedData === 'object'
        ? person.enrichedData
        : JSON.parse(person.enrichedData || '{}');
      
      if (enrichedData && Object.keys(enrichedData).length > 0) {
        console.log(`   ✅ Has Enriched Data (${Object.keys(enrichedData).length} top-level keys)`);
        const topKeys = Object.keys(enrichedData).slice(0, 15);
        console.log(`   Top-level keys: ${topKeys.join(', ')}${Object.keys(enrichedData).length > 15 ? '...' : ''}`);
        
        // Show some common fields
        if (enrichedData.overview) {
          console.log(`   Overview: ${JSON.stringify(enrichedData.overview).substring(0, 150)}...`);
        }
        if (enrichedData.buyerGroupRole) {
          console.log(`   Buyer Group Role: ${enrichedData.buyerGroupRole}`);
        }
      } else {
        console.log('   ❌ Enriched Data is empty or invalid');
      }
    } else {
      console.log('   ❌ No Enriched Data field');
    }

    // AI Intelligence
    console.log('\n🤖 AI INTELLIGENCE:');
    if (person.aiIntelligence) {
      const aiIntelligence = typeof person.aiIntelligence === 'object'
        ? person.aiIntelligence
        : JSON.parse(person.aiIntelligence || '{}');
      
      if (aiIntelligence && Object.keys(aiIntelligence).length > 0) {
        console.log(`   ✅ Has AI Intelligence (${Object.keys(aiIntelligence).length} top-level keys)`);
        const topKeys = Object.keys(aiIntelligence).slice(0, 15);
        console.log(`   Top-level keys: ${topKeys.join(', ')}${Object.keys(aiIntelligence).length > 15 ? '...' : ''}`);
      } else {
        console.log('   ❌ AI Intelligence is empty or invalid');
      }
    } else {
      console.log('   ❌ No AI Intelligence field');
    }

    // Custom Fields
    console.log('\n📝 CUSTOM FIELDS:');
    if (person.customFields) {
      const customFields = typeof person.customFields === 'object'
        ? person.customFields
        : JSON.parse(person.customFields || '{}');
      
      if (customFields && Object.keys(customFields).length > 0) {
        console.log(`   ✅ Has Custom Fields (${Object.keys(customFields).length} top-level keys)`);
        const topKeys = Object.keys(customFields).slice(0, 15);
        console.log(`   Top-level keys: ${topKeys.join(', ')}${Object.keys(customFields).length > 15 ? '...' : ''}`);
        
        if (customFields.coresignal) {
          console.log(`   ✅ Has CoreSignal in Custom Fields`);
          console.log(`   CoreSignal Employee ID: ${customFields.coresignal.employeeId || 'N/A'}`);
        }
      } else {
        console.log('   ❌ Custom Fields is empty or invalid');
      }
    } else {
      console.log('   ❌ No Custom Fields');
    }

    // Data Completeness Score
    console.log('\n📊 DATA COMPLETENESS:');
    const score = this.calculateCompletenessScore(person);
    console.log(`   Score: ${score.score}/100 (${score.grade})`);
    console.log(`   Missing: ${score.missingFields.join(', ') || 'None'}`);
  }

  /**
   * Calculate completeness score
   */
  calculateCompletenessScore(person) {
    let score = 0;
    const missingFields = [];

    // Basic info (20 points)
    if (person.firstName) score += 5;
    else missingFields.push('firstName');
    if (person.lastName) score += 5;
    else missingFields.push('lastName');
    if (person.fullName) score += 10;
    else missingFields.push('fullName');

    // Contact info (30 points)
    if (person.email || person.workEmail) score += 15;
    else missingFields.push('email');
    if (person.linkedinUrl) score += 15;
    else missingFields.push('linkedinUrl');

    // Professional info (20 points)
    if (person.jobTitle || person.title) score += 20;
    else missingFields.push('jobTitle');

    // CoreSignal data (20 points)
    if (person.coresignalData) {
      const coresignalData = typeof person.coresignalData === 'object'
        ? person.coresignalData
        : JSON.parse(person.coresignalData || '{}');
      if (coresignalData && Object.keys(coresignalData).length > 0) {
        score += 20;
      } else {
        missingFields.push('coresignalData');
      }
    } else {
      missingFields.push('coresignalData');
    }

    // Enriched/AI data (10 points)
    if (person.enrichedData || person.aiIntelligence) {
      score += 10;
    } else {
      missingFields.push('enrichedData/aiIntelligence');
    }

    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return { score, grade, missingFields };
  }

  /**
   * Show summary statistics
   */
  showSummary(people) {
    let hasCoresignalData = 0;
    let hasEnrichedData = 0;
    let hasAiIntelligence = 0;
    let hasCustomFields = 0;
    let hasCustomFieldsCoresignal = 0;
    let hasEmail = 0;
    let hasLinkedIn = 0;
    let hasTitle = 0;

    for (const person of people) {
      if (person.coresignalData) {
        const coresignalData = typeof person.coresignalData === 'object'
          ? person.coresignalData
          : JSON.parse(person.coresignalData || '{}');
        if (coresignalData && Object.keys(coresignalData).length > 0) {
          hasCoresignalData++;
        }
      }

      if (person.enrichedData) {
        const enrichedData = typeof person.enrichedData === 'object'
          ? person.enrichedData
          : JSON.parse(person.enrichedData || '{}');
        if (enrichedData && Object.keys(enrichedData).length > 0) {
          hasEnrichedData++;
        }
      }

      if (person.aiIntelligence) {
        const aiIntelligence = typeof person.aiIntelligence === 'object'
          ? person.aiIntelligence
          : JSON.parse(person.aiIntelligence || '{}');
        if (aiIntelligence && Object.keys(aiIntelligence).length > 0) {
          hasAiIntelligence++;
        }
      }

      if (person.customFields) {
        const customFields = typeof person.customFields === 'object'
          ? person.customFields
          : JSON.parse(person.customFields || '{}');
        if (customFields && Object.keys(customFields).length > 0) {
          hasCustomFields++;
          if (customFields.coresignal) {
            hasCustomFieldsCoresignal++;
          }
        }
      }

      if (person.email || person.workEmail || person.personalEmail) hasEmail++;
      if (person.linkedinUrl) hasLinkedIn++;
      if (person.jobTitle || person.title) hasTitle++;
    }

    const total = people.length;

    console.log(`Total People: ${total}`);
    console.log(`\nData Field Coverage:`);
    console.log(`   Email: ${hasEmail} (${Math.round(hasEmail/total*100)}%)`);
    console.log(`   LinkedIn: ${hasLinkedIn} (${Math.round(hasLinkedIn/total*100)}%)`);
    console.log(`   Title: ${hasTitle} (${Math.round(hasTitle/total*100)}%)`);
    console.log(`   CoreSignal Data: ${hasCoresignalData} (${Math.round(hasCoresignalData/total*100)}%)`);
    console.log(`   Enriched Data: ${hasEnrichedData} (${Math.round(hasEnrichedData/total*100)}%)`);
    console.log(`   AI Intelligence: ${hasAiIntelligence} (${Math.round(hasAiIntelligence/total*100)}%)`);
    console.log(`   Custom Fields: ${hasCustomFields} (${Math.round(hasCustomFields/total*100)}%)`);
    console.log(`   Custom Fields (CoreSignal): ${hasCustomFieldsCoresignal} (${Math.round(hasCustomFieldsCoresignal/total*100)}%)`);
  }
}

// Run the audit
async function main() {
  const auditor = new DetailedBuyerGroupPeopleAudit();
  await auditor.audit();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DetailedBuyerGroupPeopleAudit;

