/**
 * 🎯 SIMPLE 5BARS BUYER GROUP ANALYSIS
 * 
 * Simplified approach using proven working patterns
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Simple5BarsBuyerGroupAnalysis {
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
      peopleData: [],
      buyerGroupAnalysis: null,
      databaseUpdates: { newPeople: 0, updatedPeople: 0, existingPeople: 0 },
      creditsUsed: this.creditsUsed,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 SIMPLE 5BARS BUYER GROUP ANALYSIS');
    console.log('====================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Domain: ${this.domain}`);
    console.log('');

    try {
      // Step 1: Get current company data
      await this.getCurrentCompanyData();
      
      // Step 2: Try to find people using the working employee search pattern
      await this.searchPeopleByCompanyName();
      
      // Step 3: Analyze buyer group roles
      await this.analyzeBuyerGroupRoles();
      
      // Step 4: Update database
      await this.updateDatabaseWithPeople();
      
      // Step 5: Save results
      await this.saveResults();
      
      console.log('\n✅ ANALYSIS COMPLETE!');
      console.log(`📊 Total people found: ${this.results.peopleData.length}`);
      console.log(`🆕 New people added: ${this.results.databaseUpdates.newPeople}`);
      console.log(`🔄 People updated: ${this.results.databaseUpdates.updatedPeople}`);
      console.log(`💰 Credits used: ${JSON.stringify(this.creditsUsed)}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
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

  async searchPeopleByCompanyName() {
    console.log('\n👥 STEP 2: Searching for people by company name...');
    
    if (!this.apiKey) {
      console.log('   ❌ CoreSignal API key not configured');
      this.results.errors.push('CoreSignal API key not configured');
      return;
    }

    try {
      console.log(`   🔍 Searching for people at: ${this.companyName}`);
      
      // Use the EXACT working pattern from the codebase
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      should: [
                        { match: { 'experience.company_name': this.companyName } },
                        { match_phrase: { 'experience.company_name': this.companyName } },
                        { match: { 'experience.company_name': '5Bars Services' } },
                        { match: { 'experience.company_name': '5 Bars Services' } }
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
      console.log(`   📊 Search response length: ${Array.isArray(searchData) ? searchData.length : 'Not an array'}`);
      
      // Handle different response formats
      let employeeIds = [];
      if (Array.isArray(searchData)) {
        employeeIds = searchData;
      } else if (searchData && searchData.hits && searchData.hits.hits) {
        employeeIds = searchData.hits.hits.map(hit => hit._id);
      } else if (searchData && Array.isArray(searchData.data)) {
        employeeIds = searchData.data.map(item => item.id);
      }
      
      console.log(`   📊 Found ${employeeIds.length} employee IDs`);
      this.creditsUsed.search += 1;
      
      // Collect detailed data for each person
      for (const employeeId of employeeIds.slice(0, 20)) { // Limit to first 20 to avoid too many API calls
        try {
          const personData = await this.collectPersonData(employeeId);
          
          if (personData) {
            this.results.peopleData.push({
              coresignalId: employeeId,
              name: personData.full_name || personData.first_name + ' ' + personData.last_name || 'Unknown',
              title: personData.headline || personData.experience?.[0]?.position_title || 'Unknown',
              email: personData.primary_professional_email || null,
              linkedinUrl: personData.linkedin_url || null,
              location: personData.location_full || null,
              experience: personData.experience || [],
              skills: personData.inferred_skills || [],
              education: personData.education || [],
              rawData: personData
            });
          }
          
          await this.delay(1000); // Rate limiting
          
        } catch (error) {
          console.error(`   ❌ Failed to collect data for person ${employeeId}:`, error.message);
          this.results.errors.push(`Person data collection for ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected detailed data for ${this.results.peopleData.length} people`);
      
    } catch (error) {
      console.error('   ❌ People search failed:', error.message);
      this.results.errors.push(`People search: ${error.message}`);
    }
  }

  async collectPersonData(employeeId) {
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
      return personData;
      
    } catch (error) {
      console.error(`   ❌ Failed to collect person ${employeeId}:`, error.message);
      return null;
    }
  }

  async analyzeBuyerGroupRoles() {
    console.log('\n🎯 STEP 3: Analyzing buyer group roles...');
    
    if (this.results.peopleData.length === 0) {
      console.log('   ⚠️ No people data to analyze');
      return;
    }

    const peopleWithRoles = this.results.peopleData.map(person => {
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

    this.results.peopleData = peopleWithRoles;
    
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

    console.log(`   ✅ Analyzed ${peopleWithRoles.length} people`);
    console.log(`   🎯 Decision Makers: ${roleDistribution.decisionMakers}`);
    console.log(`   🏆 Champions: ${roleDistribution.champions}`);
    console.log(`   💡 Influencers: ${roleDistribution.influencers}`);
    console.log(`   👥 Stakeholders: ${roleDistribution.stakeholders}`);
    console.log(`   🎯 Primary Contact: ${primaryContact.name} (${primaryContact.role})`);
  }

  async updateDatabaseWithPeople() {
    console.log('\n💾 STEP 4: Updating database with people...');
    
    if (this.results.peopleData.length === 0) {
      console.log('   ⚠️ No people data to update');
      return;
    }

    for (const person of this.results.peopleData) {
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
    const filename = `simple-5bars-buyer-group-analysis-${timestamp}.json`;
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
    const title = (person.title || '').toLowerCase();
    
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
      title: candidates[0].title,
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
    
    const completeData = people.filter(p => p.email && p.title).length;
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
      jobTitle: person.title,
      email: person.email,
      companyId: this.companyId,
      workspaceId: this.workspaceId,
      tags: ['CoreSignal', 'Buyer Group Member', person.buyerGroupRole],
      customFields: {
        coresignalId: person.coresignalId,
        buyerGroupRole: person.buyerGroupRole,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        analysis: person.analysis,
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

// Execute the analysis
async function main() {
  const analyzer = new Simple5BarsBuyerGroupAnalysis();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Simple5BarsBuyerGroupAnalysis;
