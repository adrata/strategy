/**
 * 🎯 VALIDATE 5BARS CURRENT EMPLOYEES
 * 
 * Find and validate people who are CURRENTLY working at 5bars.net
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Validate5BarsCurrentEmployees {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.companyName = '5 Bars Services, LLC';
    this.website = 'https://www.5bars.net';
    this.domain = '5bars.net';
    
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.creditsUsed = { search: 0, collect: 0 };
    this.results = {
      companyId: this.companyId,
      companyName: this.companyName,
      website: this.website,
      analysisDate: new Date().toISOString(),
      currentEmployees: [],
      rejectedCandidates: [],
      buyerGroupAnalysis: null,
      databaseUpdates: { newPeople: 0, updatedPeople: 0, existingPeople: 0 },
      creditsUsed: this.creditsUsed,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 VALIDATE 5BARS CURRENT EMPLOYEES');
    console.log('====================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Domain: ${this.domain}`);
    console.log('');

    try {
      // Step 1: Get current company data
      await this.getCurrentCompanyData();
      
      // Step 2: Search for people with strict current employment validation
      await this.searchCurrentEmployees();
      
      // Step 3: Analyze buyer group roles for current employees only
      await this.analyzeBuyerGroupRoles();
      
      // Step 4: Update database with validated current employees
      await this.updateDatabaseWithPeople();
      
      // Step 5: Save results
      await this.saveResults();
      
      console.log('\n✅ VALIDATION COMPLETE!');
      console.log(`📊 Current employees found: ${this.results.currentEmployees.length}`);
      console.log(`❌ Rejected candidates: ${this.results.rejectedCandidates.length}`);
      console.log(`🆕 New people added: ${this.results.databaseUpdates.newPeople}`);
      console.log(`🔄 People updated: ${this.results.databaseUpdates.updatedPeople}`);
      console.log(`💰 Credits used: ${JSON.stringify(this.creditsUsed)}`);
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.results.errors.push(error.message);
      await this.saveResults();
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getCurrentCompanyData() {
    console.log('📋 STEP 1: Getting current company data...');
    
    const company = await this.prisma.companies.findUnique({
      where: { id: this.companyId },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        size: true,
        customFields: true,
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            email: true,
            customFields: true
          }
        }
      }
    });

    if (!company) {
      throw new Error(`Company not found: ${this.companyId}`);
    }

    this.results.companyData = {
      id: company.id,
      name: company.name,
      website: company.website,
      industry: company.industry,
      size: company.size,
      existingPeople: company.people.length,
      people: company.people
    };

    console.log(`   ✅ Company: ${company.name}`);
    console.log(`   👥 Existing people: ${company.people.length}`);
    console.log(`   🌐 Website: ${company.website || 'Not set'}`);
    console.log(`   🏭 Industry: ${company.industry || 'Not set'}`);
  }

  async searchCurrentEmployees() {
    console.log('\n👥 STEP 2: Searching for CURRENT employees only...');
    
    if (!this.apiKey) {
      console.log('   ❌ CoreSignal API key not configured');
      this.results.errors.push('CoreSignal API key not configured');
      return;
    }

    try {
      console.log(`   🔍 Searching for CURRENT employees at: ${this.companyName}`);
      
      // Use strict query to find people with ACTIVE experience at 5bars.net
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      must: [
                        { term: { 'experience.active_experience': 1 } }, // ACTIVE experience only
                        {
                          bool: {
                            should: [
                              { match: { 'experience.company_name': this.companyName } },
                              { match_phrase: { 'experience.company_name': this.companyName } },
                              { match: { 'experience.company_name': '5Bars Services' } },
                              { match: { 'experience.company_name': '5 Bars Services' } },
                              { match: { 'experience.company_website': this.website } },
                              { match: { 'experience.company_website': this.domain } }
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      };
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=50', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      console.log(`   📊 Search status: ${searchResponse.status}`);
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error(`   ❌ Search failed: ${searchResponse.status} - ${errorText}`);
        this.results.errors.push(`People search failed: ${searchResponse.status} - ${errorText}`);
        return;
      }

      const searchData = await searchResponse.json();
      console.log(`   📊 Search response type: ${typeof searchData}`);
      
      // Handle different response formats
      let employeeIds = [];
      if (Array.isArray(searchData)) {
        employeeIds = searchData;
      } else if (searchData && searchData.hits && searchData.hits.hits) {
        employeeIds = searchData.hits.hits.map(hit => hit._id);
      } else if (searchData && Array.isArray(searchData.data)) {
        employeeIds = searchData.data.map(item => item.id);
      }
      
      console.log(`   📊 Found ${employeeIds.length} potential employee IDs`);
      this.creditsUsed.search += 1;
      
      // Collect and validate each person
      for (const employeeId of employeeIds.slice(0, 30)) { // Limit to first 30
        try {
          const personData = await this.collectAndValidatePerson(employeeId);
          
          if (personData && personData.isCurrentEmployee) {
            this.results.currentEmployees.push(personData);
            console.log(`   ✅ VALIDATED: ${personData.name} - ${personData.currentTitle} at ${personData.currentCompany}`);
          } else if (personData) {
            this.results.rejectedCandidates.push({
              name: personData.name,
              reason: personData.rejectionReason,
              currentCompany: personData.currentCompany,
              currentTitle: personData.currentTitle
            });
            console.log(`   ❌ REJECTED: ${personData.name} - ${personData.rejectionReason} (works at ${personData.currentCompany})`);
          }
          
          await this.delay(1000); // Rate limiting
          
        } catch (error) {
          console.error(`   ❌ Failed to validate person ${employeeId}:`, error.message);
          this.results.errors.push(`Person validation for ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Validation complete: ${this.results.currentEmployees.length} current employees, ${this.results.rejectedCandidates.length} rejected`);
      
    } catch (error) {
      console.error('   ❌ Employee search failed:', error.message);
      this.results.errors.push(`Employee search: ${error.message}`);
    }
  }

  async collectAndValidatePerson(employeeId) {
    try {
      const response = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Collection failed: ${response.status}`);
      }

      const personData = await response.json();
      this.creditsUsed.collect += 1;
      
      // Validate current employment
      const validation = this.validateCurrentEmployment(personData);
      
      return {
        coresignalId: employeeId,
        name: personData.full_name || personData.first_name + ' ' + personData.last_name || 'Unknown',
        email: personData.primary_professional_email || null,
        linkedinUrl: personData.linkedin_url || null,
        location: personData.location_full || null,
        experience: personData.experience || [],
        skills: personData.inferred_skills || [],
        education: personData.education || [],
        rawData: personData,
        isCurrentEmployee: validation.isCurrent,
        currentCompany: validation.currentCompany,
        currentTitle: validation.currentTitle,
        rejectionReason: validation.rejectionReason
      };
      
    } catch (error) {
      console.error(`   ❌ Failed to collect person ${employeeId}:`, error.message);
      return null;
    }
  }

  validateCurrentEmployment(personData) {
    if (!personData.experience || personData.experience.length === 0) {
      return {
        isCurrent: false,
        currentCompany: 'Unknown',
        currentTitle: 'Unknown',
        rejectionReason: 'No experience data available'
      };
    }

    // Find the most recent active experience
    const activeExperiences = personData.experience.filter(exp => exp.active_experience === 1);
    
    if (activeExperiences.length === 0) {
      return {
        isCurrent: false,
        currentCompany: 'Unknown',
        currentTitle: 'Unknown',
        rejectionReason: 'No active experience found'
      };
    }

    // Sort by date to get the most recent
    const sortedExperiences = activeExperiences.sort((a, b) => {
      const dateA = new Date(a.date_from || 0);
      const dateB = new Date(b.date_from || 0);
      return dateB - dateA;
    });

    const currentExperience = sortedExperiences[0];
    const currentCompany = currentExperience.company_name || 'Unknown';
    const currentTitle = currentExperience.position_title || 'Unknown';

    // Check if current company matches 5bars.net
    const companyMatches = this.checkCompanyMatch(currentCompany);
    
    if (companyMatches) {
      return {
        isCurrent: true,
        currentCompany: currentCompany,
        currentTitle: currentTitle,
        rejectionReason: null
      };
    } else {
      return {
        isCurrent: false,
        currentCompany: currentCompany,
        currentTitle: currentTitle,
        rejectionReason: `Currently works at ${currentCompany}, not 5bars.net`
      };
    }
  }

  checkCompanyMatch(companyName) {
    if (!companyName) return false;
    
    const normalizedCompany = companyName.toLowerCase().trim();
    const targetVariations = [
      '5bars services',
      '5 bars services',
      '5bars',
      '5 bars',
      '5bars.net',
      '5bars services llc',
      '5 bars services llc'
    ];
    
    return targetVariations.some(variation => 
      normalizedCompany.includes(variation) || variation.includes(normalizedCompany)
    );
  }

  async analyzeBuyerGroupRoles() {
    console.log('\n🎯 STEP 3: Analyzing buyer group roles for current employees...');
    
    if (this.results.currentEmployees.length === 0) {
      console.log('   ⚠️ No current employees to analyze');
      return;
    }

    const peopleWithRoles = this.results.currentEmployees.map(person => {
      const role = this.analyzeBuyerGroupRole(person);
      const influence = this.calculateInfluenceLevel(person, role);
      const engagement = this.calculateEngagementPriority(person, role, influence);
      
      return {
        ...person,
        buyerGroupRole: role.role,
        influenceLevel: influence.level,
        engagementPriority: engagement.priority,
        decisionMakingPower: role.decisionPower,
        analysis: {
          roleReasoning: role.reasoning,
          influenceFactors: influence.factors,
          engagementStrategy: engagement.strategy,
          painPoints: this.identifyPainPoints(person, role),
          valueProps: this.identifyValueProps(person, role)
        }
      };
    });

    this.results.currentEmployees = peopleWithRoles;
    
    // Generate buyer group summary
    const roleDistribution = this.calculateRoleDistribution(peopleWithRoles);
    const primaryContact = this.identifyPrimaryContact(peopleWithRoles);
    const engagementStrategy = this.generateEngagementStrategy(peopleWithRoles);
    
    this.results.buyerGroupAnalysis = {
      totalMembers: peopleWithRoles.length,
      roleDistribution,
      primaryContact,
      engagementStrategy,
      confidence: this.calculateAnalysisConfidence(peopleWithRoles),
      analysisDate: new Date().toISOString()
    };

    console.log(`   ✅ Analyzed ${peopleWithRoles.length} current employees`);
    console.log(`   🎯 Decision Makers: ${roleDistribution.decisionMakers}`);
    console.log(`   🏆 Champions: ${roleDistribution.champions}`);
    console.log(`   💡 Influencers: ${roleDistribution.influencers}`);
    console.log(`   👥 Stakeholders: ${roleDistribution.stakeholders}`);
    console.log(`   🎯 Primary Contact: ${primaryContact.name} (${primaryContact.role})`);
  }

  async updateDatabaseWithPeople() {
    console.log('\n💾 STEP 4: Updating database with validated current employees...');
    
    if (this.results.currentEmployees.length === 0) {
      console.log('   ⚠️ No current employees to update');
      return;
    }

    for (const person of this.results.currentEmployees) {
      try {
        // Check if person already exists
        const existingPerson = await this.findExistingPerson(person);
        
        if (existingPerson) {
          // Update existing person with buyer group data
          await this.updateExistingPerson(existingPerson, person);
          this.results.databaseUpdates.updatedPeople++;
          console.log(`   🔄 Updated: ${person.name} (${person.buyerGroupRole})`);
        } else {
          // Create new person record
          await this.createNewPerson(person);
          this.results.databaseUpdates.newPeople++;
          console.log(`   🆕 Created: ${person.name} (${person.buyerGroupRole})`);
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to update ${person.name}:`, error.message);
        this.results.errors.push(`Database update for ${person.name}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Database updates complete`);
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `validate-5bars-current-employees-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  // Helper methods (same as before)
  analyzeBuyerGroupRole(person) {
    const title = (person.currentTitle || '').toLowerCase();
    
    if (title.includes('ceo') || title.includes('chief executive') || title.includes('president')) {
      return { role: 'Decision Maker', decisionPower: 95, reasoning: 'Executive leadership role' };
    }
    if (title.includes('cto') || title.includes('chief technology') || title.includes('chief technical')) {
      return { role: 'Decision Maker', decisionPower: 90, reasoning: 'Technology leadership' };
    }
    if (title.includes('cfo') || title.includes('chief financial') || title.includes('vp finance')) {
      return { role: 'Decision Maker', decisionPower: 85, reasoning: 'Financial leadership' };
    }
    if (title.includes('director') || title.includes('vp') || title.includes('vice president')) {
      return { role: 'Champion', decisionPower: 70, reasoning: 'Senior management role' };
    }
    if (title.includes('manager') || title.includes('lead') || title.includes('head of')) {
      return { role: 'Champion', decisionPower: 60, reasoning: 'Management role' };
    }
    if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
      return { role: 'Influencer', decisionPower: 40, reasoning: 'Technical role' };
    }
    if (title.includes('analyst') || title.includes('specialist') || title.includes('coordinator')) {
      return { role: 'Influencer', decisionPower: 30, reasoning: 'Specialized role' };
    }
    
    return { role: 'Stakeholder', decisionPower: 20, reasoning: 'General role' };
  }

  calculateInfluenceLevel(person, role) {
    const factors = [];
    let score = 0;
    
    if (role.role === 'Decision Maker') {
      score += 40;
      factors.push('Executive/Leadership role');
    } else if (role.role === 'Champion') {
      score += 30;
      factors.push('Management role');
    } else if (role.role === 'Influencer') {
      score += 20;
      factors.push('Technical/Specialized role');
    }
    
    let level;
    if (score >= 60) level = 'High';
    else if (score >= 40) level = 'Medium';
    else level = 'Low';
    
    return { level, factors, score };
  }

  calculateEngagementPriority(person, role, influence) {
    let priority;
    let strategy;
    
    if (role.role === 'Decision Maker' && influence.level === 'High') {
      priority = 'High';
      strategy = 'Executive-level strategic discussions';
    } else if (role.role === 'Champion' && influence.level === 'High') {
      priority = 'High';
      strategy = 'Management-level solution discussions';
    } else if (role.role === 'Decision Maker' || role.role === 'Champion') {
      priority = 'Medium';
      strategy = 'Solution-focused discussions';
    } else if (role.role === 'Influencer' && influence.level === 'High') {
      priority = 'Medium';
      strategy = 'Technical discussions';
    } else {
      priority = 'Low';
      strategy = 'Information gathering';
    }
    
    return { priority, strategy };
  }

  identifyPainPoints(person, role) {
    const painPoints = [];
    
    if (role.role === 'Decision Maker') {
      painPoints.push('Strategic business growth challenges');
      painPoints.push('Resource allocation and capacity planning');
    } else if (role.role === 'Champion') {
      painPoints.push('Operational efficiency improvements');
      painPoints.push('Team productivity and performance');
    } else if (role.role === 'Influencer') {
      painPoints.push('Technical implementation challenges');
      painPoints.push('Tool and process optimization');
    }
    
    return painPoints;
  }

  identifyValueProps(person, role) {
    const valueProps = [];
    
    if (role.role === 'Decision Maker') {
      valueProps.push('Strategic business value and ROI');
      valueProps.push('Competitive advantage and market positioning');
    } else if (role.role === 'Champion') {
      valueProps.push('Operational efficiency gains');
      valueProps.push('Team productivity improvements');
    } else if (role.role === 'Influencer') {
      valueProps.push('Technical excellence and innovation');
      valueProps.push('Implementation support and training');
    }
    
    return valueProps;
  }

  calculateRoleDistribution(people) {
    const distribution = {
      decisionMakers: 0,
      champions: 0,
      influencers: 0,
      stakeholders: 0
    };
    
    people.forEach(person => {
      distribution[person.buyerGroupRole.toLowerCase().replace(' ', '') + 's']++;
    });
    
    return distribution;
  }

  identifyPrimaryContact(people) {
    const candidates = people.filter(p => 
      p.buyerGroupRole === 'Decision Maker' || p.buyerGroupRole === 'Champion'
    );
    
    if (candidates.length === 0) {
      return people[0] || { name: 'Unknown', role: 'Unknown' };
    }
    
    candidates.sort((a, b) => {
      const aScore = (a.influenceLevel === 'High' ? 3 : a.influenceLevel === 'Medium' ? 2 : 1) + 
                    (a.decisionMakingPower || 0) / 100;
      const bScore = (b.influenceLevel === 'High' ? 3 : b.influenceLevel === 'Medium' ? 2 : 1) + 
                    (b.decisionMakingPower || 0) / 100;
      return bScore - aScore;
    });
    
    return {
      name: candidates[0].name,
      role: candidates[0].buyerGroupRole,
      title: candidates[0].currentTitle,
      influence: candidates[0].influenceLevel,
      reasoning: 'Highest influence and decision-making power'
    };
  }

  generateEngagementStrategy(people) {
    const strategy = {
      approach: 'Multi-touch, role-based engagement',
      sequence: [],
      timeline: '4-6 weeks',
      keyMessages: []
    };
    
    const sortedPeople = people.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.engagementPriority] - priorityOrder[a.engagementPriority];
    });
    
    sortedPeople.forEach((person, index) => {
      strategy.sequence.push({
        step: index + 1,
        person: person.name,
        role: person.buyerGroupRole,
        approach: person.analysis.engagementStrategy,
        timeline: `${index + 1}-${index + 2} weeks`
      });
    });
    
    strategy.keyMessages = [
      'Strategic business value and competitive advantage',
      'Operational efficiency and productivity gains',
      'Technical excellence and implementation support',
      'Scalable solutions for growth and expansion'
    ];
    
    return strategy;
  }

  calculateAnalysisConfidence(people) {
    if (people.length === 0) return 0;
    
    let confidence = 50;
    
    if (people.length >= 10) confidence += 20;
    else if (people.length >= 5) confidence += 10;
    
    const decisionMakers = people.filter(p => p.buyerGroupRole === 'Decision Maker').length;
    if (decisionMakers > 0) confidence += 15;
    
    const highInfluence = people.filter(p => p.influenceLevel === 'High').length;
    if (highInfluence > 0) confidence += 10;
    
    const completeData = people.filter(p => p.email && p.currentTitle).length;
    const dataCompleteness = completeData / people.length;
    confidence += Math.round(dataCompleteness * 15);
    
    return Math.min(confidence, 100);
  }

  async findExistingPerson(person) {
    const matches = await this.prisma.people.findMany({
      where: {
        OR: [
          { email: person.email },
          { fullName: person.name },
          { 
            AND: [
              { firstName: person.name.split(' ')[0] },
              { lastName: person.name.split(' ').slice(1).join(' ') }
            ]
          }
        ],
        companyId: this.companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        customFields: true
      }
    });
    
    return matches[0] || null;
  }

  async updateExistingPerson(existingPerson, person) {
    const updateData = {
      customFields: {
        ...existingPerson.customFields,
        coresignalId: person.coresignalId,
        buyerGroupRole: person.buyerGroupRole,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        analysis: person.analysis,
        currentCompany: person.currentCompany,
        currentTitle: person.currentTitle,
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.people.update({
      where: { id: existingPerson.id },
      data: updateData
    });
  }

  async createNewPerson(person) {
    const personData = {
      firstName: person.name.split(' ')[0],
      lastName: person.name.split(' ').slice(1).join(' ') || '',
      fullName: person.name,
      jobTitle: person.currentTitle,
      email: person.email,
      companyId: this.companyId,
      workspaceId: this.workspaceId,
      tags: ['CoreSignal', 'Buyer Group Member', person.buyerGroupRole, 'Current Employee'],
      customFields: {
        coresignalId: person.coresignalId,
        buyerGroupRole: person.buyerGroupRole,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        analysis: person.analysis,
        currentCompany: person.currentCompany,
        currentTitle: person.currentTitle,
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.people.create({
      data: personData
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the validation
async function main() {
  const validator = new Validate5BarsCurrentEmployees();
  await validator.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Validate5BarsCurrentEmployees;
