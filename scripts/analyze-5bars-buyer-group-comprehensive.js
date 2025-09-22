/**
 * 🎯 COMPREHENSIVE 5BARS BUYER GROUP ANALYSIS
 * 
 * This script will:
 * 1. Find 5bars.net company in CoreSignal
 * 2. Discover all people at the company
 * 3. Analyze buyer group roles and influence
 * 4. Add new people to database or update existing ones
 * 5. Tag existing people with buyer group roles
 * 6. Generate comprehensive buyer group analysis
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class FiveBarsBuyerGroupAnalyzer {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.companyName = '5Bars Services';
    this.domain = '5bars.net';
    
    // CoreSignal API configuration
    this.config = {
      apiKey: process.env.CORESIGNAL_API_KEY,
      baseUrl: 'https://api.coresignal.com',
      maxRetries: 3,
      rateLimitDelay: 1000
    };
    
    this.creditsUsed = { search: 0, collect: 0 };
    this.results = {
      companyId: this.companyId,
      companyName: this.companyName,
      domain: this.domain,
      analysisDate: new Date().toISOString(),
      companyData: null,
      peopleData: [],
      buyerGroupAnalysis: null,
      databaseUpdates: {
        newPeople: 0,
        updatedPeople: 0,
        existingPeople: 0
      },
      creditsUsed: this.creditsUsed,
      errors: []
    };
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('🎯 COMPREHENSIVE 5BARS BUYER GROUP ANALYSIS');
    console.log('==========================================');
    console.log(`Company: ${this.companyName} (${this.domain})`);
    console.log(`Company ID: ${this.companyId}`);
    console.log(`Workspace ID: ${this.workspaceId}`);
    console.log('');

    try {
      // Step 1: Get current company data
      await this.getCurrentCompanyData();
      
      // Step 2: Find company in CoreSignal
      await this.findCompanyInCoreSignal();
      
      // Step 3: Discover people at the company
      await this.discoverPeopleAtCompany();
      
      // Step 4: Analyze buyer group roles
      await this.analyzeBuyerGroupRoles();
      
      // Step 5: Update database with new/updated people
      await this.updateDatabaseWithPeople();
      
      // Step 6: Generate comprehensive buyer group analysis
      await this.generateBuyerGroupAnalysis();
      
      // Step 7: Save results
      await this.saveResults();
      
      console.log('\n✅ ANALYSIS COMPLETE!');
      console.log(`📊 Total people found: ${this.results.peopleData.length}`);
      console.log(`🆕 New people added: ${this.results.databaseUpdates.newPeople}`);
      console.log(`🔄 People updated: ${this.results.databaseUpdates.updatedPeople}`);
      console.log(`📋 Existing people: ${this.results.databaseUpdates.existingPeople}`);
      console.log(`💰 Credits used: ${JSON.stringify(this.creditsUsed)}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.errors.push(error.message);
      await this.saveResults();
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * 📋 Get current company data from database
   */
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
        revenue: true,
        description: true,
        city: true,
        state: true,
        country: true,
        address: true,
        tags: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
        people: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            phone: true,
            department: true,
            customFields: true,
            tags: true,
            status: true,
            createdAt: true,
            updatedAt: true
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
      people: company.people.map(p => ({
        id: p.id,
        fullName: p.fullName,
        jobTitle: p.jobTitle,
        email: p.email,
        customFields: p.customFields
      }))
    };

    console.log(`   ✅ Company: ${company.name}`);
    console.log(`   👥 Existing people: ${company.people.length}`);
    console.log(`   🌐 Website: ${company.website || 'Not set'}`);
    console.log(`   🏭 Industry: ${company.industry || 'Not set'}`);
  }

  /**
   * 🔍 Find company in CoreSignal
   */
  async findCompanyInCoreSignal() {
    console.log('\n🔍 STEP 2: Finding company in CoreSignal...');
    
    const searchQueries = [
      { name: '5Bars Services', domain: '5bars.net' },
      { name: '5 Bars Services', domain: '5bars.net' },
      { name: '5Bars', domain: '5bars.net' },
      { name: '5 Bars', domain: '5bars.net' }
    ];

    let bestMatch = null;
    let bestScore = 0;

    for (const query of searchQueries) {
      try {
        console.log(`   🔍 Searching for: ${query.name} (${query.domain})`);
        
        // Use the correct Elasticsearch DSL query pattern from existing code
        const searchQuery = {
          query: {
            bool: {
              should: [
                { match: { company_name: query.name } },
                { match: { website: query.domain } },
                { match_phrase: { company_name: query.name } }
              ]
            }
          },
          size: 10
        };
        
        const searchResponse = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');

        if (searchResponse && searchResponse.hits && searchResponse.hits.hits) {
          const matches = searchResponse.hits.hits;
          console.log(`   📊 Found ${matches.length} potential matches`);
          
          for (const match of matches) {
            const company = match._source;
            const score = this.calculateCompanyMatchScore(company, query);
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                id: match._id,
                data: company,
                score: score,
                query: query
              };
            }
          }
        }
        
        this.creditsUsed.search += 1;
        await this.delay(this.config.rateLimitDelay);
        
      } catch (error) {
        console.error(`   ❌ Search failed for ${query.name}:`, error.message);
        this.results.errors.push(`Company search for ${query.name}: ${error.message}`);
      }
    }

    if (bestMatch) {
      console.log(`   ✅ Best match found: ${bestMatch.data.company_name}`);
      console.log(`   🎯 Match score: ${bestMatch.score}/100`);
      console.log(`   🆔 CoreSignal ID: ${bestMatch.id}`);
      
      this.results.coreSignalCompany = bestMatch;
      
      // Collect detailed company data using the correct endpoint
      try {
        const companyData = await this.callCoreSignalAPI(`/cdapi/v2/company_multi_source/collect/${bestMatch.id}`, null, 'GET');
        this.results.coreSignalCompany.detailedData = companyData;
        this.creditsUsed.collect += 1;
        console.log(`   📊 Detailed company data collected`);
      } catch (error) {
        console.error(`   ❌ Failed to collect company data:`, error.message);
        this.results.errors.push(`Company data collection: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️ No company matches found in CoreSignal`);
      this.results.errors.push('No company matches found in CoreSignal');
    }
  }

  /**
   * 👥 Discover people at the company
   */
  async discoverPeopleAtCompany() {
    console.log('\n👥 STEP 3: Discovering people at the company...');
    
    if (!this.results.coreSignalCompany) {
      console.log('   ⚠️ No CoreSignal company data - skipping people discovery');
      return;
    }

    const companyId = this.results.coreSignalCompany.id;
    const companyName = this.results.coreSignalCompany.data.company_name;
    
    try {
      console.log(`   🔍 Searching for people at company ID: ${companyId} (${companyName})`);
      
      // Use the correct Elasticsearch DSL query pattern from existing code
      const peopleSearchQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      should: [
                        { term: { 'experience.company_id': companyId } },
                        { match: { 'experience.company_name': companyName } },
                        { match_phrase: { 'experience.company_name': companyName } }
                      ]
                    }
                  }
                }
              }
            ]
          }
        },
        size: 100
      };
      
      const peopleResponse = await this.callCoreSignalAPI('/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=100', peopleSearchQuery, 'POST');

      // Handle different response formats
      let employeeIds = [];
      if (Array.isArray(peopleResponse)) {
        // Direct array of IDs
        employeeIds = peopleResponse;
      } else if (peopleResponse && peopleResponse.hits && peopleResponse.hits.hits) {
        // Elasticsearch response format
        employeeIds = peopleResponse.hits.hits.map(hit => hit._id);
      } else if (peopleResponse && Array.isArray(peopleResponse.data)) {
        // Data array format
        employeeIds = peopleResponse.data.map(item => item.id);
      }
      
      console.log(`   📊 Found ${employeeIds.length} people in CoreSignal`);
      
      // Collect detailed data for each person
      for (const employeeId of employeeIds) {
        try {
          const personData = await this.callCoreSignalAPI(`/cdapi/v2/employee_multi_source/collect/${employeeId}`, null, 'GET');
          
          if (personData) {
            this.results.peopleData.push({
              coresignalId: employeeId,
              name: personData.name || 'Unknown',
              title: personData.title || 'Unknown',
              email: personData.email || null,
              linkedinUrl: personData.linkedin_url || null,
              location: personData.location || null,
              experience: personData.experience || [],
              skills: personData.skills || [],
              education: personData.education || [],
              rawData: personData
            });
          }
          
          this.creditsUsed.collect += 1;
          await this.delay(this.config.rateLimitDelay);
          
        } catch (error) {
          console.error(`   ❌ Failed to collect data for person ${employeeId}:`, error.message);
          this.results.errors.push(`Person data collection for ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected detailed data for ${this.results.peopleData.length} people`);
      this.creditsUsed.search += 1;
      
    } catch (error) {
      console.error('   ❌ People discovery failed:', error.message);
      this.results.errors.push(`People discovery: ${error.message}`);
    }
  }

  /**
   * 🎯 Analyze buyer group roles
   */
  async analyzeBuyerGroupRoles() {
    console.log('\n🎯 STEP 4: Analyzing buyer group roles...');
    
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

  /**
   * 💾 Update database with new/updated people
   */
  async updateDatabaseWithPeople() {
    console.log('\n💾 STEP 5: Updating database with people...');
    
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

  /**
   * 📊 Generate comprehensive buyer group analysis
   */
  async generateBuyerGroupAnalysis() {
    console.log('\n📊 STEP 6: Generating comprehensive buyer group analysis...');
    
    if (!this.results.buyerGroupAnalysis) {
      console.log('   ⚠️ No buyer group analysis to generate');
      return;
    }

    // Update company with buyer group analysis
    const companyUpdate = {
      customFields: {
        ...this.results.companyData.customFields,
        buyerGroupAnalysis: this.results.buyerGroupAnalysis,
        coresignalData: {
          companyId: this.results.coreSignalCompany?.id,
          peopleCount: this.results.peopleData.length,
          lastUpdated: new Date().toISOString()
        }
      }
    };

    try {
      await this.prisma.companies.update({
        where: { id: this.companyId },
        data: companyUpdate
      });
      
      console.log(`   ✅ Company updated with buyer group analysis`);
    } catch (error) {
      console.error(`   ❌ Failed to update company:`, error.message);
      this.results.errors.push(`Company update: ${error.message}`);
    }
  }

  /**
   * 💾 Save results to file
   */
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `5bars-buyer-group-analysis-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  // Helper methods
  async callCoreSignalAPI(endpoint, data, method = 'GET') {
    const url = `${this.config.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'apikey': this.config.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`CoreSignal API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  calculateCompanyMatchScore(company, query) {
    let score = 0;
    
    // Name matching
    if (company.company_name && query.name) {
      const nameMatch = company.company_name.toLowerCase().includes(query.name.toLowerCase()) ||
                       query.name.toLowerCase().includes(company.company_name.toLowerCase());
      if (nameMatch) score += 40;
    }
    
    // Domain matching
    if (company.domain && query.domain) {
      if (company.domain === query.domain) score += 60;
    }
    
    return score;
  }

  analyzeBuyerGroupRole(person) {
    const title = (person.title || '').toLowerCase();
    const name = (person.name || '').toLowerCase();
    
    // Decision Makers
    if (title.includes('ceo') || title.includes('chief executive') || title.includes('president')) {
      return {
        role: 'Decision Maker',
        decisionPower: 95,
        reasoning: 'Executive leadership role with ultimate decision authority'
      };
    }
    
    if (title.includes('cto') || title.includes('chief technology') || title.includes('chief technical')) {
      return {
        role: 'Decision Maker',
        decisionPower: 90,
        reasoning: 'Technology leadership with high decision authority'
      };
    }
    
    if (title.includes('cfo') || title.includes('chief financial') || title.includes('vp finance')) {
      return {
        role: 'Decision Maker',
        decisionPower: 85,
        reasoning: 'Financial leadership with budget approval authority'
      };
    }
    
    // Champions
    if (title.includes('director') || title.includes('vp') || title.includes('vice president')) {
      return {
        role: 'Champion',
        decisionPower: 70,
        reasoning: 'Senior management role with significant influence'
      };
    }
    
    if (title.includes('manager') || title.includes('lead') || title.includes('head of')) {
      return {
        role: 'Champion',
        decisionPower: 60,
        reasoning: 'Management role with team influence'
      };
    }
    
    // Influencers
    if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
      return {
        role: 'Influencer',
        decisionPower: 40,
        reasoning: 'Technical role with implementation influence'
      };
    }
    
    if (title.includes('analyst') || title.includes('specialist') || title.includes('coordinator')) {
      return {
        role: 'Influencer',
        decisionPower: 30,
        reasoning: 'Specialized role with domain expertise'
      };
    }
    
    // Default to Stakeholder
    return {
      role: 'Stakeholder',
      decisionPower: 20,
      reasoning: 'General role with limited decision influence'
    };
  }

  calculateInfluenceLevel(person, role) {
    const factors = [];
    let score = 0;
    
    // Role-based influence
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
    
    // Experience-based influence
    if (person.experience && person.experience.length > 0) {
      const yearsOfExperience = this.calculateYearsOfExperience(person.experience);
      if (yearsOfExperience > 10) {
        score += 20;
        factors.push('Senior experience (10+ years)');
      } else if (yearsOfExperience > 5) {
        score += 10;
        factors.push('Mid-level experience (5+ years)');
      }
    }
    
    // Education-based influence
    if (person.education && person.education.length > 0) {
      const hasAdvancedDegree = person.education.some(edu => 
        edu.degree && (edu.degree.toLowerCase().includes('master') || edu.degree.toLowerCase().includes('phd'))
      );
      if (hasAdvancedDegree) {
        score += 10;
        factors.push('Advanced degree');
      }
    }
    
    // Determine level
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
      strategy = 'Executive-level strategic discussions, direct approach';
    } else if (role.role === 'Champion' && influence.level === 'High') {
      priority = 'High';
      strategy = 'Management-level solution discussions, relationship building';
    } else if (role.role === 'Decision Maker' || role.role === 'Champion') {
      priority = 'Medium';
      strategy = 'Solution-focused discussions, value proposition alignment';
    } else if (role.role === 'Influencer' && influence.level === 'High') {
      priority = 'Medium';
      strategy = 'Technical discussions, implementation support';
    } else {
      priority = 'Low';
      strategy = 'Information gathering, relationship building';
    }
    
    return { priority, strategy };
  }

  identifyPainPoints(person, role) {
    const painPoints = [];
    
    if (role.role === 'Decision Maker') {
      painPoints.push('Strategic business growth challenges');
      painPoints.push('Resource allocation and capacity planning');
      painPoints.push('Market expansion and competitive positioning');
    } else if (role.role === 'Champion') {
      painPoints.push('Operational efficiency improvements');
      painPoints.push('Team productivity and performance');
      painPoints.push('Project delivery and quality');
    } else if (role.role === 'Influencer') {
      painPoints.push('Technical implementation challenges');
      painPoints.push('Tool and process optimization');
      painPoints.push('Skill development and training');
    }
    
    return painPoints;
  }

  identifyValueProps(person, role) {
    const valueProps = [];
    
    if (role.role === 'Decision Maker') {
      valueProps.push('Strategic business value and ROI');
      valueProps.push('Competitive advantage and market positioning');
      valueProps.push('Scalable growth solutions');
    } else if (role.role === 'Champion') {
      valueProps.push('Operational efficiency gains');
      valueProps.push('Team productivity improvements');
      valueProps.push('Project success and delivery');
    } else if (role.role === 'Influencer') {
      valueProps.push('Technical excellence and innovation');
      valueProps.push('Implementation support and training');
      valueProps.push('Tool and process improvements');
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
    // Find the highest influence Decision Maker or Champion
    const candidates = people.filter(p => 
      p.buyerGroupRole === 'Decision Maker' || p.buyerGroupRole === 'Champion'
    );
    
    if (candidates.length === 0) {
      return people[0] || { name: 'Unknown', role: 'Unknown' };
    }
    
    // Sort by influence level and decision power
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
    
    // Sort people by engagement priority
    const sortedPeople = people.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.engagementPriority] - priorityOrder[a.engagementPriority];
    });
    
    // Create engagement sequence
    sortedPeople.forEach((person, index) => {
      strategy.sequence.push({
        step: index + 1,
        person: person.name,
        role: person.buyerGroupRole,
        approach: person.analysis.engagementStrategy,
        timeline: `${index + 1}-${index + 2} weeks`
      });
    });
    
    // Generate key messages
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
    
    let confidence = 50; // Base confidence
    
    // More people = higher confidence
    if (people.length >= 10) confidence += 20;
    else if (people.length >= 5) confidence += 10;
    
    // Decision makers present = higher confidence
    const decisionMakers = people.filter(p => p.buyerGroupRole === 'Decision Maker').length;
    if (decisionMakers > 0) confidence += 15;
    
    // High influence people = higher confidence
    const highInfluence = people.filter(p => p.influenceLevel === 'High').length;
    if (highInfluence > 0) confidence += 10;
    
    // Complete data = higher confidence
    const completeData = people.filter(p => p.email && p.title).length;
    const dataCompleteness = completeData / people.length;
    confidence += Math.round(dataCompleteness * 15);
    
    return Math.min(confidence, 100);
  }

  async findExistingPerson(person) {
    // Try multiple matching strategies
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

  calculateYearsOfExperience(experience) {
    if (!experience || experience.length === 0) return 0;
    
    let totalYears = 0;
    experience.forEach(exp => {
      if (exp.start_date && exp.end_date) {
        const start = new Date(exp.start_date);
        const end = new Date(exp.end_date);
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
        totalYears += Math.max(0, years);
      }
    });
    
    return Math.round(totalYears);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the analysis
async function main() {
  const analyzer = new FiveBarsBuyerGroupAnalyzer();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FiveBarsBuyerGroupAnalyzer;
