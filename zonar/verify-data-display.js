#!/usr/bin/env node

/**
 * Data Display Verification Script
 * 
 * This script verifies that enriched data is properly displayed and accessible
 * in the database and via API for all Notary Everyday records.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class DataDisplayVerifier {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      people: {
        total: 0,
        enriched: 0,
        displayable: 0,
        issues: []
      },
      companies: {
        total: 0,
        enriched: 0,
        displayable: 0,
        issues: []
      },
      apiAccess: {
        peopleEndpoint: false,
        companiesEndpoint: false,
        speedrunEndpoint: false
      }
    };
  }

  async run() {
    try {
      console.log('🖥️ Starting Data Display Verification...\n');
      
      // Verify people data display
      await this.verifyPeopleDataDisplay();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Verify companies data display
      await this.verifyCompaniesDataDisplay();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Verify API accessibility
      await this.verifyAPIAccess();
      
      // Print verification report
      this.printVerificationReport();
      
    } catch (error) {
      console.error('❌ Error in data display verification:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async verifyPeopleDataDisplay() {
    console.log('👤 Verifying People Data Display...');
    
    // Get sample of enriched people
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        title: true,
        bio: true,
        linkedinUrl: true,
        email: true,
        phone: true,
        dataQualityScore: true,
        aiIntelligence: true,
        aiConfidence: true,
        customFields: true,
        technicalSkills: true,
        softSkills: true,
        industrySkills: true,
        totalExperience: true,
        yearsAtCompany: true,
        yearsInRole: true,
        roleHistory: true,
        previousRoles: true,
        careerTimeline: true,
        degrees: true,
        institutions: true,
        fieldsOfStudy: true,
        certifications: true,
        publications: true,
        speakingEngagements: true,
        languages: true,
        linkedinConnections: true,
        linkedinFollowers: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            employeeCount: true,
            website: true,
            linkedinUrl: true
          }
        }
      },
      take: 20 // Sample 20 people
    });

    this.results.people.total = people.length;
    console.log(`   📊 Checking ${people.length} enriched people`);

    for (const person of people) {
      this.results.people.enriched++;
      
      // Check if data is properly displayed
      const displayIssues = this.checkPersonDisplayIssues(person);
      if (displayIssues.length === 0) {
        this.results.people.displayable++;
      } else {
        this.results.people.issues.push({
          id: person.id,
          name: person.fullName,
          issues: displayIssues
        });
      }
    }

    console.log(`   ✅ People data display verification complete`);
  }

  async verifyCompaniesDataDisplay() {
    console.log('🏢 Verifying Companies Data Display...');
    
    // Get sample of enriched companies
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        descriptionEnriched: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        size: true,
        employeeCount: true,
        foundedYear: true,
        revenue: true,
        currency: true,
        stockSymbol: true,
        isPublic: true,
        hqLocation: true,
        hqFullAddress: true,
        customFields: true
      },
      take: 20 // Sample 20 companies
    });

    this.results.companies.total = companies.length;
    console.log(`   📊 Checking ${companies.length} enriched companies`);

    for (const company of companies) {
      this.results.companies.enriched++;
      
      // Check if data is properly displayed
      const displayIssues = this.checkCompanyDisplayIssues(company);
      if (displayIssues.length === 0) {
        this.results.companies.displayable++;
      } else {
        this.results.companies.issues.push({
          id: company.id,
          name: company.name,
          issues: displayIssues
        });
      }
    }

    console.log(`   ✅ Companies data display verification complete`);
  }

  checkPersonDisplayIssues(person) {
    const issues = [];
    
    // Check basic display fields
    if (!person.fullName) issues.push('Missing full name');
    if (!person.jobTitle && !person.title) issues.push('Missing job title');
    
    // Check enriched fields
    if (!person.bio) issues.push('Missing bio/summary');
    if (!person.linkedinUrl) issues.push('Missing LinkedIn URL');
    
    // Check Coresignal data in customFields
    const coresignalData = person.customFields?.coresignalData;
    if (!coresignalData) {
      issues.push('Missing Coresignal data in customFields');
    } else {
      if (!coresignalData.full_name) issues.push('Missing Coresignal full name');
      if (!coresignalData.title) issues.push('Missing Coresignal title');
      if (!coresignalData.summary) issues.push('Missing Coresignal summary');
    }
    
    // Check AI intelligence
    if (!person.aiIntelligence) issues.push('Missing AI intelligence');
    if (!person.aiConfidence || person.aiConfidence === 0) issues.push('Missing AI confidence');
    
    // Check data quality
    if (!person.dataQualityScore || person.dataQualityScore === 0) issues.push('Missing data quality score');
    
    // Check mapped fields
    if (!person.technicalSkills || person.technicalSkills.length === 0) issues.push('Missing technical skills');
    if (!person.totalExperience) issues.push('Missing total experience');
    
    // Check company relationship
    if (!person.company) issues.push('Missing company relationship');
    
    return issues;
  }

  checkCompanyDisplayIssues(company) {
    const issues = [];
    
    // Check basic display fields
    if (!company.name) issues.push('Missing company name');
    
    // Check enriched fields
    if (!company.descriptionEnriched && !company.description) issues.push('Missing description');
    if (!company.website) issues.push('Missing website');
    if (!company.linkedinUrl) issues.push('Missing LinkedIn URL');
    if (!company.industry) issues.push('Missing industry');
    
    // Check Coresignal data in customFields
    const coresignalData = company.customFields?.coresignalData;
    if (!coresignalData) {
      issues.push('Missing Coresignal data in customFields');
    } else {
      if (!coresignalData.company_name && !coresignalData.name) issues.push('Missing Coresignal company name');
      if (!coresignalData.description) issues.push('Missing Coresignal description');
      if (!coresignalData.website) issues.push('Missing Coresignal website');
    }
    
    // Check data quality
    const dataQuality = company.customFields?.dataQualityScore;
    if (!dataQuality || dataQuality === 0) issues.push('Missing data quality score');
    
    return issues;
  }

  async verifyAPIAccess() {
    console.log('🌐 Verifying API Access...');
    
    try {
      // Test people endpoint
      const peopleResponse = await fetch(`http://localhost:3000/api/v1/people?workspaceId=${this.workspaceId}&limit=5`);
      if (peopleResponse.ok) {
        this.results.apiAccess.peopleEndpoint = true;
        console.log('   ✅ People API endpoint accessible');
      } else {
        console.log('   ❌ People API endpoint not accessible');
      }
    } catch (error) {
      console.log('   ❌ People API endpoint error:', error.message);
    }
    
    try {
      // Test companies endpoint
      const companiesResponse = await fetch(`http://localhost:3000/api/v1/companies?workspaceId=${this.workspaceId}&limit=5`);
      if (companiesResponse.ok) {
        this.results.apiAccess.companiesEndpoint = true;
        console.log('   ✅ Companies API endpoint accessible');
      } else {
        console.log('   ❌ Companies API endpoint not accessible');
      }
    } catch (error) {
      console.log('   ❌ Companies API endpoint error:', error.message);
    }
    
    try {
      // Test speedrun endpoint
      const speedrunResponse = await fetch(`http://localhost:3000/api/v1/speedrun?workspaceId=${this.workspaceId}&limit=5`);
      if (speedrunResponse.ok) {
        this.results.apiAccess.speedrunEndpoint = true;
        console.log('   ✅ Speedrun API endpoint accessible');
      } else {
        console.log('   ❌ Speedrun API endpoint not accessible');
      }
    } catch (error) {
      console.log('   ❌ Speedrun API endpoint error:', error.message);
    }
  }

  printVerificationReport() {
    console.log('\n🖥️ DATA DISPLAY VERIFICATION REPORT');
    console.log('====================================');
    
    // People Summary
    console.log('\n👤 PEOPLE DATA DISPLAY:');
    console.log(`   Total Checked: ${this.results.people.total}`);
    console.log(`   Enriched: ${this.results.people.enriched}`);
    console.log(`   Displayable: ${this.results.people.displayable}`);
    console.log(`   Issues Found: ${this.results.people.issues.length}`);
    
    if (this.results.people.issues.length > 0) {
      console.log('\n   People Display Issues:');
      this.results.people.issues.slice(0, 10).forEach(person => {
        console.log(`     - ${person.name}: ${person.issues.join(', ')}`);
      });
      if (this.results.people.issues.length > 10) {
        console.log(`     ... and ${this.results.people.issues.length - 10} more`);
      }
    }
    
    // Companies Summary
    console.log('\n🏢 COMPANIES DATA DISPLAY:');
    console.log(`   Total Checked: ${this.results.companies.total}`);
    console.log(`   Enriched: ${this.results.companies.enriched}`);
    console.log(`   Displayable: ${this.results.companies.displayable}`);
    console.log(`   Issues Found: ${this.results.companies.issues.length}`);
    
    if (this.results.companies.issues.length > 0) {
      console.log('\n   Company Display Issues:');
      this.results.companies.issues.slice(0, 10).forEach(company => {
        console.log(`     - ${company.name}: ${company.issues.join(', ')}`);
      });
      if (this.results.companies.issues.length > 10) {
        console.log(`     ... and ${this.results.companies.issues.length - 10} more`);
      }
    }
    
    // API Access Summary
    console.log('\n🌐 API ACCESS:');
    console.log(`   People Endpoint: ${this.results.apiAccess.peopleEndpoint ? '✅ Accessible' : '❌ Not Accessible'}`);
    console.log(`   Companies Endpoint: ${this.results.apiAccess.companiesEndpoint ? '✅ Accessible' : '❌ Not Accessible'}`);
    console.log(`   Speedrun Endpoint: ${this.results.apiAccess.speedrunEndpoint ? '✅ Accessible' : '❌ Not Accessible'}`);
    
    // Overall Assessment
    const peopleDisplayRate = this.results.people.total > 0 ? 
      Math.round((this.results.people.displayable / this.results.people.total) * 100) : 0;
    const companiesDisplayRate = this.results.companies.total > 0 ? 
      Math.round((this.results.companies.displayable / this.results.companies.total) * 100) : 0;
    
    console.log('\n📊 DISPLAY QUALITY METRICS:');
    console.log(`   People Display Rate: ${peopleDisplayRate}%`);
    console.log(`   Companies Display Rate: ${companiesDisplayRate}%`);
    
    const apiAccessRate = Object.values(this.results.apiAccess).filter(Boolean).length / Object.keys(this.results.apiAccess).length;
    console.log(`   API Access Rate: ${Math.round(apiAccessRate * 100)}%`);
    
    // Overall Grade
    const overallScore = Math.round((peopleDisplayRate + companiesDisplayRate + (apiAccessRate * 100)) / 3);
    let grade = 'F';
    if (overallScore >= 90) grade = 'A+';
    else if (overallScore >= 80) grade = 'A';
    else if (overallScore >= 70) grade = 'B';
    else if (overallScore >= 60) grade = 'C';
    else if (overallScore >= 50) grade = 'D';
    
    console.log(`\n🏆 OVERALL DISPLAY GRADE: ${grade} (${overallScore}/100)`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (peopleDisplayRate < 80) {
      console.log('   1. Fix people data display issues');
    }
    if (companiesDisplayRate < 80) {
      console.log('   2. Fix companies data display issues');
    }
    if (apiAccessRate < 1) {
      console.log('   3. Ensure API endpoints are running and accessible');
    }
    if (this.results.people.issues.length === 0 && this.results.companies.issues.length === 0 && apiAccessRate === 1) {
      console.log('   1. Data display is in excellent condition!');
    }
  }
}

// Run the verifier
const verifier = new DataDisplayVerifier();
verifier.run().catch(console.error);
