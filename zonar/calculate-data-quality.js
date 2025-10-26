#!/usr/bin/env node

/**
 * Data Quality Calculator
 * 
 * This script calculates and updates data quality scores for all people and companies
 * in the Notary Everyday workspace based on core fields, enrichment data, and AI intelligence.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class DataQualityCalculator {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      peopleProcessed: 0,
      companiesProcessed: 0,
      qualityScores: {
        excellent: 0,    // 90%+
        good: 0,         // 75-89%
        acceptable: 0,   // 60-74%
        poor: 0          // <60%
      }
    };
  }

  async run() {
    try {
      console.log('📊 Starting Data Quality Calculation for Notary Everyday workspace...\n');
      
      // Calculate quality for people
      await this.calculatePeopleQuality();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Calculate quality for companies
      await this.calculateCompaniesQuality();
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in data quality calculation:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async calculatePeopleQuality() {
    console.log('👤 Calculating Data Quality for People...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        jobTitle: true,
        title: true,
        department: true,
        seniority: true,
        bio: true,
        profilePictureUrl: true,
        customFields: true,
        coresignalData: true,
        enrichedData: true,
        aiIntelligence: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        influenceLevel: true,
        influenceScore: true,
        decisionPower: true,
        engagementLevel: true,
        engagementStrategy: true,
        communicationStyle: true,
        technicalSkills: true,
        softSkills: true,
        industrySkills: true,
        certifications: true,
        totalExperience: true,
        yearsAtCompany: true,
        yearsInRole: true,
        degrees: true,
        institutions: true,
        fieldsOfStudy: true,
        aiConfidence: true,
        emailConfidence: true,
        phoneConfidence: true,
        dataQualityScore: true,
        dataCompleteness: true,
        enrichmentScore: true,
        enrichmentSources: true,
        lastEnriched: true,
        aiLastUpdated: true,
        dataLastVerified: true
      }
    });

    console.log(`   📊 Found ${people.length} people to process`);
    
    const batchSize = 100;
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          const qualityData = this.calculatePersonQuality(person);
          await this.updatePersonQuality(person.id, qualityData);
          this.results.peopleProcessed++;
          
          // Categorize quality score
          if (qualityData.overallScore >= 90) this.results.qualityScores.excellent++;
          else if (qualityData.overallScore >= 75) this.results.qualityScores.good++;
          else if (qualityData.overallScore >= 60) this.results.qualityScores.acceptable++;
          else this.results.qualityScores.poor++;
          
        } catch (error) {
          console.error(`   ❌ Error processing ${person.fullName}:`, error.message);
        }
      }
    }
  }

  calculatePersonQuality(person) {
    const qualityBreakdown = {
      coreFields: this.calculateCoreFieldsScore(person),
      enrichmentData: this.calculateEnrichmentDataScore(person),
      aiIntelligence: this.calculateAIIntelligenceScore(person),
      contactInfo: this.calculateContactInfoScore(person),
      professionalData: this.calculateProfessionalDataScore(person)
    };

    // Calculate overall score (weighted)
    const overallScore = Math.round(
      (qualityBreakdown.coreFields * 0.25) +      // 25% - Core identity
      (qualityBreakdown.enrichmentData * 0.30) +  // 30% - Enrichment data
      (qualityBreakdown.aiIntelligence * 0.20) +  // 20% - AI intelligence
      (qualityBreakdown.contactInfo * 0.15) +     // 15% - Contact info
      (qualityBreakdown.professionalData * 0.10)  // 10% - Professional data
    );

    return {
      overallScore,
      dataCompleteness: this.calculateDataCompleteness(person),
      qualityBreakdown,
      enrichmentSources: this.getEnrichmentSources(person),
      lastEnriched: person.lastEnriched,
      aiLastUpdated: person.aiLastUpdated,
      dataLastVerified: person.dataLastVerified
    };
  }

  calculateCoreFieldsScore(person) {
    let score = 0;
    let maxScore = 0;

    // Name fields (30 points)
    maxScore += 30;
    if (person.fullName) score += 15;
    if (person.firstName && person.lastName) score += 15;

    // Job information (25 points)
    maxScore += 25;
    if (person.jobTitle || person.title) score += 15;
    if (person.department) score += 5;
    if (person.seniority) score += 5;

    // Basic profile (25 points)
    maxScore += 25;
    if (person.bio && person.bio.length > 50) score += 15;
    if (person.profilePictureUrl) score += 10;

    // Company association (20 points)
    maxScore += 20;
    if (person.companyId) score += 20;

    return Math.round((score / maxScore) * 100);
  }

  calculateEnrichmentDataScore(person) {
    let score = 0;
    let maxScore = 0;

    // Coresignal data (40 points)
    maxScore += 40;
    if (person.coresignalData || (person.customFields?.coresignalData)) {
      score += 40;
    }

    // Custom fields enrichment (30 points)
    maxScore += 30;
    if (person.customFields?.coresignalId) score += 15;
    if (person.customFields?.lastEnrichedAt) score += 15;

    // Skills and experience (20 points)
    maxScore += 20;
    if (person.technicalSkills?.length > 0) score += 7;
    if (person.softSkills?.length > 0) score += 7;
    if (person.totalExperience) score += 6;

    // Education (10 points)
    maxScore += 10;
    if (person.degrees || person.institutions?.length > 0) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  calculateAIIntelligenceScore(person) {
    let score = 0;
    let maxScore = 0;

    // AI intelligence data (50 points)
    maxScore += 50;
    if (person.aiIntelligence) score += 30;
    if (person.aiConfidence && person.aiConfidence > 0) score += 20;

    // Buyer group analysis (30 points)
    maxScore += 30;
    if (person.buyerGroupRole) score += 10;
    if (person.isBuyerGroupMember !== null) score += 10;
    if (person.influenceLevel) score += 10;

    // Engagement strategy (20 points)
    maxScore += 20;
    if (person.engagementStrategy) score += 10;
    if (person.communicationStyle) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  calculateContactInfoScore(person) {
    let score = 0;
    let maxScore = 0;

    // Email (40 points)
    maxScore += 40;
    if (person.email) score += 20;
    if (person.workEmail) score += 10;
    if (person.personalEmail) score += 10;

    // Phone (30 points)
    maxScore += 30;
    if (person.phone) score += 15;
    if (person.mobilePhone) score += 10;
    if (person.workPhone) score += 5;

    // Social/LinkedIn (30 points)
    maxScore += 30;
    if (person.linkedinUrl) score += 30;

    return Math.round((score / maxScore) * 100);
  }

  calculateProfessionalDataScore(person) {
    let score = 0;
    let maxScore = 0;

    // Experience data (40 points)
    maxScore += 40;
    if (person.totalExperience) score += 15;
    if (person.yearsAtCompany) score += 15;
    if (person.yearsInRole) score += 10;

    // Influence and decision power (30 points)
    maxScore += 30;
    if (person.influenceScore && person.influenceScore > 0) score += 15;
    if (person.decisionPower && person.decisionPower > 0) score += 15;

    // Engagement level (30 points)
    maxScore += 30;
    if (person.engagementLevel) score += 15;
    if (person.engagementStrategy) score += 15;

    return Math.round((score / maxScore) * 100);
  }

  calculateDataCompleteness(person) {
    const allFields = [
      'fullName', 'email', 'phone', 'linkedinUrl', 'jobTitle', 'department',
      'bio', 'profilePictureUrl', 'technicalSkills', 'softSkills', 'totalExperience',
      'buyerGroupRole', 'influenceLevel', 'engagementStrategy', 'aiIntelligence'
    ];

    const populatedFields = allFields.filter(field => {
      const value = person[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((populatedFields.length / allFields.length) * 100);
  }

  getEnrichmentSources(person) {
    const sources = [];
    
    if (person.customFields?.coresignalId) sources.push('coresignal');
    if (person.customFields?.pdlId) sources.push('pdl');
    if (person.customFields?.lushaId) sources.push('lusha');
    if (person.aiIntelligence) sources.push('ai');
    
    return sources;
  }

  async updatePersonQuality(personId, qualityData) {
    await this.prisma.people.update({
      where: { id: personId },
      data: {
        dataQualityScore: qualityData.overallScore,
        dataCompleteness: qualityData.dataCompleteness,
        dataQualityBreakdown: qualityData.qualityBreakdown,
        enrichmentSources: qualityData.enrichmentSources,
        lastEnriched: qualityData.lastEnriched,
        aiLastUpdated: qualityData.aiLastUpdated,
        dataLastVerified: qualityData.dataLastVerified,
        updatedAt: new Date()
      }
    });
  }

  async calculateCompaniesQuality() {
    console.log('🏢 Calculating Data Quality for Companies...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        email: true,
        phone: true,
        description: true,
        descriptionEnriched: true,
        industry: true,
        size: true,
        employeeCount: true,
        foundedYear: true,
        customFields: true
      }
    });

    console.log(`   📊 Found ${companies.length} companies to process`);
    
    const batchSize = 50;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)} (${batch.length} companies)`);
      
      for (const company of batch) {
        try {
          const qualityData = this.calculateCompanyQuality(company);
          await this.updateCompanyQuality(company.id, qualityData);
          this.results.companiesProcessed++;
          
        } catch (error) {
          console.error(`   ❌ Error processing ${company.name}:`, error.message);
        }
      }
    }
  }

  calculateCompanyQuality(company) {
    const qualityBreakdown = {
      coreFields: this.calculateCompanyCoreFieldsScore(company),
      enrichmentData: this.calculateCompanyEnrichmentDataScore(company),
      contactInfo: this.calculateCompanyContactInfoScore(company),
      businessData: this.calculateCompanyBusinessDataScore(company)
    };

    // Calculate overall score (weighted)
    const overallScore = Math.round(
      (qualityBreakdown.coreFields * 0.30) +      // 30% - Core company info
      (qualityBreakdown.enrichmentData * 0.40) +  // 40% - Enrichment data
      (qualityBreakdown.contactInfo * 0.20) +     // 20% - Contact info
      (qualityBreakdown.businessData * 0.10)      // 10% - Business data
    );

    return {
      overallScore,
      dataCompleteness: this.calculateCompanyDataCompleteness(company),
      qualityBreakdown,
      enrichmentSources: this.getCompanyEnrichmentSources(company),
      lastEnriched: company.lastEnriched,
      dataLastVerified: company.dataLastVerified
    };
  }

  calculateCompanyCoreFieldsScore(company) {
    let score = 0;
    let maxScore = 0;

    // Basic company info (50 points)
    maxScore += 50;
    if (company.name) score += 20;
    if (company.description && company.description.length > 50) score += 15;
    if (company.descriptionEnriched && company.descriptionEnriched.length > 50) score += 15;

    // Industry and size (30 points)
    maxScore += 30;
    if (company.industry) score += 15;
    if (company.size || company.employeeCount) score += 15;

    // Founded year (20 points)
    maxScore += 20;
    if (company.foundedYear) score += 20;

    return Math.round((score / maxScore) * 100);
  }

  calculateCompanyEnrichmentDataScore(company) {
    let score = 0;
    let maxScore = 0;

    // Coresignal data (60 points)
    maxScore += 60;
    if (company.customFields?.coresignalId) score += 60;

    // Custom fields enrichment (40 points)
    maxScore += 40;
    if (company.customFields?.lastEnrichedAt) score += 40;

    return Math.round((score / maxScore) * 100);
  }

  calculateCompanyContactInfoScore(company) {
    let score = 0;
    let maxScore = 0;

    // Website and social (50 points)
    maxScore += 50;
    if (company.website) score += 25;
    if (company.linkedinUrl) score += 25;

    // Contact info (50 points)
    maxScore += 50;
    if (company.email) score += 25;
    if (company.phone) score += 25;

    return Math.round((score / maxScore) * 100);
  }

  calculateCompanyBusinessDataScore(company) {
    let score = 0;
    let maxScore = 0;

    // Employee data (60 points)
    maxScore += 60;
    if (company.employeeCount) score += 30;
    if (company.size) score += 30;

    // Business info (40 points)
    maxScore += 40;
    if (company.industry) score += 20;
    if (company.foundedYear) score += 20;

    return Math.round((score / maxScore) * 100);
  }

  calculateCompanyDataCompleteness(company) {
    const allFields = [
      'name', 'website', 'linkedinUrl', 'email', 'phone', 'description',
      'descriptionEnriched', 'industry', 'size', 'employeeCount', 'foundedYear'
    ];

    const populatedFields = allFields.filter(field => {
      const value = company[field];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((populatedFields.length / allFields.length) * 100);
  }

  getCompanyEnrichmentSources(company) {
    const sources = [];
    
    if (company.customFields?.coresignalId) sources.push('coresignal');
    if (company.customFields?.pdlId) sources.push('pdl');
    if (company.customFields?.lushaId) sources.push('lusha');
    
    return sources;
  }

  async updateCompanyQuality(companyId, qualityData) {
    // Store quality data in customFields since the schema doesn't have dedicated fields
    await this.prisma.companies.update({
      where: { id: companyId },
      data: {
        customFields: {
          dataQualityScore: qualityData.overallScore,
          dataCompleteness: qualityData.dataCompleteness,
          dataQualityBreakdown: qualityData.qualityBreakdown,
          enrichmentSources: qualityData.enrichmentSources,
          lastEnriched: qualityData.lastEnriched,
          dataLastVerified: qualityData.dataLastVerified
        },
        updatedAt: new Date()
      }
    });
  }

  printResults() {
    console.log('\n📊 Data Quality Calculation Results:');
    console.log('=====================================');
    console.log(`People Processed: ${this.results.peopleProcessed}`);
    console.log(`Companies Processed: ${this.results.companiesProcessed}`);
    console.log('\nQuality Score Distribution:');
    console.log(`  Excellent (90%+): ${this.results.qualityScores.excellent}`);
    console.log(`  Good (75-89%): ${this.results.qualityScores.good}`);
    console.log(`  Acceptable (60-74%): ${this.results.qualityScores.acceptable}`);
    console.log(`  Poor (<60%): ${this.results.qualityScores.poor}`);
    
    const total = this.results.peopleProcessed + this.results.companiesProcessed;
    const excellent = this.results.qualityScores.excellent;
    const good = this.results.qualityScores.good;
    const acceptable = this.results.qualityScores.acceptable;
    const poor = this.results.qualityScores.poor;
    
    console.log('\nQuality Distribution:');
    console.log(`  Excellent: ${Math.round((excellent / total) * 100)}%`);
    console.log(`  Good: ${Math.round((good / total) * 100)}%`);
    console.log(`  Acceptable: ${Math.round((acceptable / total) * 100)}%`);
    console.log(`  Poor: ${Math.round((poor / total) * 100)}%`);
  }
}

// Run the calculator
const calculator = new DataQualityCalculator();
calculator.run().catch(console.error);
