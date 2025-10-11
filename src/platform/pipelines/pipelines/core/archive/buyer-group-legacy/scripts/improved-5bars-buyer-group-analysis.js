/**
 * 🎯 IMPROVED 5BARS BUYER GROUP ANALYSIS
 * 
 * Enhanced version with:
 * 1. Fixed rank column issue
 * 2. Rich CoreSignal profiles
 * 3. TOP-specific buyer group logic
 * 4. Active employment validation
 * 5. Person and prospect record creation
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Improved5BarsBuyerGroupAnalysis {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.companyName = '5 Bars Services, LLC';
    this.website = 'https://www.5bars.net';
    this.domain = '5bars.net';
    
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.creditsUsed = { search: 0, collect: 0, enrich: 0 };
    this.results = {
      companyId: this.companyId,
      companyName: this.companyName,
      website: this.website,
      analysisDate: new Date().toISOString(),
      coresignalCompany: null,
      currentEmployees: [],
      buyerGroupAnalysis: null,
      databaseUpdates: { newPeople: 0, updatedPeople: 0, newProspects: 0, existingPeople: 0 },
      creditsUsed: this.creditsUsed,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 IMPROVED 5BARS BUYER GROUP ANALYSIS');
    console.log('=====================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Domain: ${this.domain}`);
    console.log('');

    try {
      // Step 1: Get current company data
      await this.getCurrentCompanyData();
      
      // Step 2: Enrich company by domain
      await this.enrichCompanyByDomain();
      
      // Step 3: Search current employees by company ID
      await this.searchCurrentEmployeesByCompanyId();
      
      // Step 4: Analyze buyer group roles with TOP-specific logic
      await this.analyzeBuyerGroupRolesForTOP();
      
      // Step 5: Create/update people and prospect records
      await this.createPeopleAndProspectRecords();
      
      // Step 6: Save results
      await this.saveResults();
      
      console.log('\n✅ IMPROVED ANALYSIS COMPLETE!');
      console.log(`📊 Current employees found: ${this.results.currentEmployees.length}`);
      console.log(`🆕 New people added: ${this.results.databaseUpdates.newPeople}`);
      console.log(`🔄 People updated: ${this.results.databaseUpdates.updatedPeople}`);
      console.log(`🎯 New prospects created: ${this.results.databaseUpdates.newProspects}`);
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

  async enrichCompanyByDomain() {
    console.log('\n🏢 STEP 2: Enriching company by domain...');
    
    if (!this.apiKey) {
      console.log('   ❌ CoreSignal API key not configured');
      this.results.errors.push('CoreSignal API key not configured');
      return;
    }

    try {
      console.log(`   🔍 Enriching company by domain: ${this.domain}`);
      
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${this.domain}`,
        {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      console.log(`   📊 Enrichment status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   ❌ Company enrichment failed: ${response.status} - ${errorText}`);
        this.results.errors.push(`Company enrichment failed: ${response.status} - ${errorText}`);
        return;
      }

      const companyData = await response.json();
      this.creditsUsed.enrich += 1;
      
      this.results.coresignalCompany = {
        id: companyData.id,
        name: companyData.company_name,
        website: companyData.website,
        industry: companyData.industry,
        employeesCount: companyData.employees_count,
        size: companyData.company_size_range,
        location: companyData.hq_country,
        founded: companyData.founded_year,
        description: companyData.description,
        linkedinUrl: companyData.linkedin_url,
        rawData: companyData
      };

      console.log(`   ✅ Company enriched: ${companyData.company_name}`);
      console.log(`   🆔 CoreSignal ID: ${companyData.id}`);
      console.log(`   👥 Employee count: ${companyData.employees_count || 'Unknown'}`);
      console.log(`   🏭 Industry: ${companyData.industry || 'Unknown'}`);
      
    } catch (error) {
      console.error('   ❌ Company enrichment failed:', error.message);
      this.results.errors.push(`Company enrichment: ${error.message}`);
    }
  }

  async searchCurrentEmployeesByCompanyId() {
    console.log('\n👥 STEP 3: Searching current employees by company ID...');
    
    if (!this.results.coresignalCompany) {
      console.log('   ⚠️ No CoreSignal company data - skipping employee search');
      return;
    }

    const coresignalCompanyId = this.results.coresignalCompany.id;
    
    try {
      console.log(`   🔍 Searching for current employees at company ID: ${coresignalCompanyId}`);
      
      // Use strict query for current employees only
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
                        { term: { 'experience.company_id': coresignalCompanyId } } // Direct company ID match
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      };
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=100', {
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
        console.error(`   ❌ Employee search failed: ${searchResponse.status} - ${errorText}`);
        this.results.errors.push(`Employee search failed: ${searchResponse.status} - ${errorText}`);
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
      
      console.log(`   📊 Found ${employeeIds.length} current employee IDs`);
      this.creditsUsed.search += 1;
      
      // Collect rich profile data for each current employee
      for (const employeeId of employeeIds.slice(0, 50)) {
        try {
          const richProfile = await this.collectRichPersonProfile(employeeId);
          
          if (richProfile && this.validateActiveEmployment(richProfile)) {
            this.results.currentEmployees.push(richProfile);
            console.log(`   ✅ VALIDATED: ${richProfile.name} - ${richProfile.currentTitle} at ${richProfile.currentCompany}`);
          } else if (richProfile) {
            console.log(`   ❌ REJECTED: ${richProfile.name} - Not currently employed at 5bars.net`);
          }
          
          await this.delay(1000); // Rate limiting
          
        } catch (error) {
          console.error(`   ❌ Failed to collect data for person ${employeeId}:`, error.message);
          this.results.errors.push(`Person data collection for ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected rich profiles for ${this.results.currentEmployees.length} current employees`);
      
    } catch (error) {
      console.error('   ❌ Employee search failed:', error.message);
      this.results.errors.push(`Employee search: ${error.message}`);
    }
  }

  async collectRichPersonProfile(employeeId) {
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
      
      // Extract rich profile data
      const richProfile = {
        coresignalId: employeeId,
        name: personData.full_name || personData.first_name + ' ' + personData.last_name || 'Unknown',
        firstName: personData.first_name || '',
        lastName: personData.last_name || '',
        email: personData.primary_professional_email || null,
        linkedinUrl: personData.linkedin_url || null,
        location: personData.location_full || null,
        headline: personData.headline || '',
        summary: personData.summary || '',
        pictureUrl: personData.picture_url || null,
        connectionsCount: personData.connections_count || null,
        followersCount: personData.followers_count || null,
        experience: personData.experience || [],
        skills: personData.inferred_skills || [],
        education: personData.education || [],
        interests: personData.interests || [],
        currentCompany: this.getCurrentCompany(personData),
        currentTitle: this.getCurrentTitle(personData),
        currentLocation: personData.location_full || null,
        rawData: personData
      };
      
      return richProfile;
      
    } catch (error) {
      console.error(`   ❌ Failed to collect person ${employeeId}:`, error.message);
      return null;
    }
  }

  getCurrentCompany(personData) {
    if (!personData.experience || personData.experience.length === 0) return 'Unknown';
    
    const activeExperience = personData.experience.find(exp => exp.active_experience === 1);
    return activeExperience?.company_name || 'Unknown';
  }

  getCurrentTitle(personData) {
    if (!personData.experience || personData.experience.length === 0) return 'Unknown';
    
    const activeExperience = personData.experience.find(exp => exp.active_experience === 1);
    return activeExperience?.position_title || personData.headline || 'Unknown';
  }

  validateActiveEmployment(richProfile) {
    // Double-check that they're currently employed at 5bars.net
    const currentCompany = richProfile.currentCompany.toLowerCase();
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
      currentCompany.includes(variation) || variation.includes(currentCompany)
    );
  }

  async analyzeBuyerGroupRolesForTOP() {
    console.log('\n🎯 STEP 4: Analyzing buyer group roles for TOP as seller...');
    
    if (this.results.currentEmployees.length === 0) {
      console.log('   ⚠️ No current employees to analyze');
      return;
    }

    const peopleWithRoles = this.results.currentEmployees.map(person => {
      const role = this.analyzeBuyerGroupRoleForTOP(person);
      const influence = this.calculateInfluenceLevel(person, role);
      const engagement = this.calculateEngagementPriority(person, role, influence);
      
      return {
        ...person,
        buyerGroupRole: role.role,
        influenceLevel: influence.level,
        engagementPriority: engagement.priority,
        decisionMakingPower: role.decisionPower,
        topEngagementStrategy: this.generateIndividualTOPEngagementStrategy(person, role),
        analysis: {
          roleReasoning: role.reasoning,
          influenceFactors: influence.factors,
          engagementStrategy: engagement.strategy,
          painPoints: this.identifyTOPPainPoints(person, role),
          valueProps: this.identifyTOPValueProps(person, role),
          competitiveAdvantage: this.identifyTOPCompetitiveAdvantage(person, role)
        }
      };
    });

    this.results.currentEmployees = peopleWithRoles;
    
    // Generate buyer group summary
    const roleDistribution = this.calculateRoleDistribution(peopleWithRoles);
    const primaryContact = this.identifyPrimaryContact(peopleWithRoles);
    const engagementStrategy = this.generateTOPEngagementStrategy(peopleWithRoles);
    
    this.results.buyerGroupAnalysis = {
      totalMembers: peopleWithRoles.length,
      roleDistribution,
      primaryContact,
      engagementStrategy,
      topValueProposition: this.generateTOPValueProposition(),
      confidence: this.calculateAnalysisConfidence(peopleWithRoles),
      analysisDate: new Date().toISOString()
    };

    console.log(`   ✅ Analyzed ${peopleWithRoles.length} current employees for TOP`);
    console.log(`   🎯 Decision Makers: ${roleDistribution.decisionMakers}`);
    console.log(`   🏆 Champions: ${roleDistribution.champions}`);
    console.log(`   💡 Influencers: ${roleDistribution.influencers}`);
    console.log(`   👥 Stakeholders: ${roleDistribution.stakeholders}`);
    console.log(`   🎯 Primary Contact: ${primaryContact.name} (${primaryContact.role})`);
  }

  analyzeBuyerGroupRoleForTOP(person) {
    const title = (person.currentTitle || '').toLowerCase();
    const name = (person.name || '').toLowerCase();
    
    // TOP-specific buyer group analysis for telecommunications/construction industry
    
    // Decision Makers - Can approve purchases and sign contracts
    if (title.includes('ceo') || title.includes('chief executive') || title.includes('president') || 
        title.includes('owner') || title.includes('founder')) {
      return { role: 'Decision Maker', decisionPower: 95, reasoning: 'Executive leadership with purchasing authority' };
    }
    if (title.includes('cto') || title.includes('chief technology') || title.includes('chief technical') ||
        title.includes('vp technology') || title.includes('director of technology')) {
      return { role: 'Decision Maker', decisionPower: 90, reasoning: 'Technology leadership with infrastructure decisions' };
    }
    if (title.includes('cfo') || title.includes('chief financial') || title.includes('vp finance') ||
        title.includes('controller') || title.includes('finance director')) {
      return { role: 'Decision Maker', decisionPower: 85, reasoning: 'Financial leadership with budget approval' };
    }
    if (title.includes('operations director') || title.includes('vp operations') || 
        title.includes('construction manager') || title.includes('project director')) {
      return { role: 'Decision Maker', decisionPower: 80, reasoning: 'Operations leadership with project approval' };
    }
    
    // Champions - Can influence decisions and drive adoption
    if (title.includes('director') || title.includes('vp') || title.includes('vice president')) {
      return { role: 'Champion', decisionPower: 70, reasoning: 'Senior management with influence over decisions' };
    }
    if (title.includes('manager') || title.includes('lead') || title.includes('head of') ||
        title.includes('supervisor') || title.includes('foreman')) {
      return { role: 'Champion', decisionPower: 60, reasoning: 'Management role with team influence' };
    }
    if (title.includes('project manager') || title.includes('construction manager') ||
        title.includes('field manager') || title.includes('operations manager')) {
      return { role: 'Champion', decisionPower: 65, reasoning: 'Project management with implementation influence' };
    }
    
    // Influencers - Can provide technical input and recommendations
    if (title.includes('engineer') || title.includes('developer') || title.includes('architect') ||
        title.includes('technician') || title.includes('specialist')) {
      return { role: 'Influencer', decisionPower: 40, reasoning: 'Technical role with solution recommendations' };
    }
    if (title.includes('analyst') || title.includes('coordinator') || title.includes('planner')) {
      return { role: 'Influencer', decisionPower: 35, reasoning: 'Analytical role with process recommendations' };
    }
    if (title.includes('safety') || title.includes('quality') || title.includes('compliance')) {
      return { role: 'Influencer', decisionPower: 45, reasoning: 'Compliance role with safety/quality influence' };
    }
    
    // Stakeholders - General team members
    return { role: 'Stakeholder', decisionPower: 20, reasoning: 'Team member with general input' };
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
    
    // Additional factors for telecommunications/construction
    if (person.currentTitle?.toLowerCase().includes('construction') || 
        person.currentTitle?.toLowerCase().includes('project')) {
      score += 10;
      factors.push('Construction/Project experience');
    }
    
    if (person.currentTitle?.toLowerCase().includes('safety') || 
        person.currentTitle?.toLowerCase().includes('compliance')) {
      score += 5;
      factors.push('Safety/Compliance expertise');
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
      strategy = 'Executive-level strategic discussions about infrastructure and growth';
    } else if (role.role === 'Champion' && influence.level === 'High') {
      priority = 'High';
      strategy = 'Management-level discussions about operational efficiency and project success';
    } else if (role.role === 'Decision Maker' || role.role === 'Champion') {
      priority = 'Medium';
      strategy = 'Solution-focused discussions about construction and telecommunications needs';
    } else if (role.role === 'Influencer' && influence.level === 'High') {
      priority = 'Medium';
      strategy = 'Technical discussions about implementation and best practices';
    } else {
      priority = 'Low';
      strategy = 'Information gathering and relationship building';
    }
    
    return { priority, strategy };
  }

  generateIndividualTOPEngagementStrategy(person, role) {
    const strategies = [];
    
    if (role.role === 'Decision Maker') {
      strategies.push('Focus on ROI and business growth opportunities');
      strategies.push('Discuss scalability and future infrastructure needs');
      strategies.push('Present case studies of similar telecommunications projects');
    } else if (role.role === 'Champion') {
      strategies.push('Emphasize operational efficiency and project success');
      strategies.push('Discuss team productivity and safety improvements');
      strategies.push('Share implementation best practices');
    } else if (role.role === 'Influencer') {
      strategies.push('Provide technical specifications and requirements');
      strategies.push('Discuss compliance and safety standards');
      strategies.push('Share industry best practices and innovations');
    }
    
    return strategies;
  }

  identifyTOPPainPoints(person, role) {
    const painPoints = [];
    
    if (role.role === 'Decision Maker') {
      painPoints.push('Infrastructure scalability and growth challenges');
      painPoints.push('Budget optimization and cost control');
      painPoints.push('Regulatory compliance and safety requirements');
    } else if (role.role === 'Champion') {
      painPoints.push('Project timeline and delivery challenges');
      painPoints.push('Team productivity and resource allocation');
      painPoints.push('Quality control and safety management');
    } else if (role.role === 'Influencer') {
      painPoints.push('Technical implementation challenges');
      painPoints.push('Equipment and tool optimization');
      painPoints.push('Safety and compliance procedures');
    }
    
    return painPoints;
  }

  identifyTOPValueProps(person, role) {
    const valueProps = [];
    
    if (role.role === 'Decision Maker') {
      valueProps.push('Strategic infrastructure development and growth');
      valueProps.push('Cost-effective construction and installation solutions');
      valueProps.push('Regulatory compliance and safety expertise');
    } else if (role.role === 'Champion') {
      valueProps.push('Project efficiency and timeline optimization');
      valueProps.push('Team productivity and safety improvements');
      valueProps.push('Quality assurance and best practices');
    } else if (role.role === 'Influencer') {
      valueProps.push('Technical excellence and innovation');
      valueProps.push('Equipment and tool optimization');
      valueProps.push('Safety training and compliance support');
    }
    
    return valueProps;
  }

  identifyTOPCompetitiveAdvantage(person, role) {
    const advantages = [];
    
    advantages.push('Specialized telecommunications and construction expertise');
    advantages.push('Proven track record with similar projects');
    advantages.push('Comprehensive safety and compliance programs');
    advantages.push('Advanced equipment and technology solutions');
    advantages.push('Local market knowledge and relationships');
    
    return advantages;
  }

  generateTOPValueProposition() {
    return {
      headline: 'TOP Engineers Plus: Your Complete Telecommunications Infrastructure Partner',
      keyBenefits: [
        'Expert engineering and installation services for all transmission mediums',
        'Comprehensive safety and compliance programs',
        'Proven track record with telecommunications projects',
        'Advanced equipment and technology solutions',
        'Local expertise with national capabilities'
      ],
      differentiators: [
        'Single resource for complete infrastructure optimization',
        'Expertise in copper, coax, fiber optic, and wireless',
        'Structured cable and wireless infrastructure integration',
        'Engineering, installation, and maintenance services'
      ]
    };
  }

  async createPeopleAndProspectRecords() {
    console.log('\n💾 STEP 5: Creating people and prospect records...');
    
    if (this.results.currentEmployees.length === 0) {
      console.log('   ⚠️ No current employees to create records for');
      return;
    }

    for (const person of this.results.currentEmployees) {
      try {
        // Check if person already exists
        const existingPerson = await this.findExistingPerson(person);
        
        if (existingPerson) {
          // Update existing person with rich profile data
          await this.updateExistingPerson(existingPerson, person);
          this.results.databaseUpdates.updatedPeople++;
          console.log(`   🔄 Updated: ${person.name} (${person.buyerGroupRole})`);
        } else {
          // Create new person record
          await this.createNewPerson(person);
          this.results.databaseUpdates.newPeople++;
          console.log(`   🆕 Created: ${person.name} (${person.buyerGroupRole})`);
        }
        
        // Create prospect record for new people
        if (!existingPerson) {
          await this.createProspectRecord(person);
          this.results.databaseUpdates.newProspects++;
          console.log(`   🎯 Created prospect: ${person.name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to create records for ${person.name}:`, error.message);
        this.results.errors.push(`Record creation for ${person.name}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Record creation complete`);
  }

  async findExistingPerson(person) {
    const matches = await this.prisma.people.findMany({
      where: {
        OR: [
          { email: person.email },
          { fullName: person.name },
          { 
            AND: [
              { firstName: person.firstName },
              { lastName: person.lastName }
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
      jobTitle: person.currentTitle,
      email: person.email,
      linkedinUrl: person.linkedinUrl,
      customFields: {
        ...existingPerson.customFields,
        coresignalId: person.coresignalId,
        buyerGroupRole: person.buyerGroupRole,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        topEngagementStrategy: person.topEngagementStrategy,
        analysis: person.analysis,
        richProfile: {
          headline: person.headline,
          summary: person.summary,
          pictureUrl: person.pictureUrl,
          connectionsCount: person.connectionsCount,
          followersCount: person.followersCount,
          skills: person.skills,
          education: person.education,
          interests: person.interests,
          currentCompany: person.currentCompany,
          currentLocation: person.currentLocation
        },
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
      firstName: person.firstName,
      lastName: person.lastName,
      fullName: person.name,
      jobTitle: person.currentTitle,
      email: person.email,
      linkedinUrl: person.linkedinUrl,
      companyId: this.companyId,
      workspaceId: this.workspaceId,
      tags: ['CoreSignal', 'Buyer Group Member', person.buyerGroupRole, 'Current Employee', '5Bars Services'],
      customFields: {
        coresignalId: person.coresignalId,
        buyerGroupRole: person.buyerGroupRole,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        topEngagementStrategy: person.topEngagementStrategy,
        analysis: person.analysis,
        richProfile: {
          headline: person.headline,
          summary: person.summary,
          pictureUrl: person.pictureUrl,
          connectionsCount: person.connectionsCount,
          followersCount: person.followersCount,
          skills: person.skills,
          education: person.education,
          interests: person.interests,
          currentCompany: person.currentCompany,
          currentLocation: person.currentLocation
        },
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.people.create({
      data: personData
    });
  }

  async createProspectRecord(person) {
    const prospectData = {
      firstName: person.firstName,
      lastName: person.lastName,
      fullName: person.name,
      jobTitle: person.currentTitle,
      email: person.email,
      linkedinUrl: person.linkedinUrl,
      companyId: this.companyId,
      workspaceId: this.workspaceId,
      status: 'Active',
      funnelStage: 'Prospect',
      buyerGroupRole: person.buyerGroupRole,
      engagementScore: this.calculateEngagementScore(person),
      tags: ['CoreSignal', 'Buyer Group Member', person.buyerGroupRole, 'Current Employee', '5Bars Services'],
      customFields: {
        coresignalId: person.coresignalId,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        topEngagementStrategy: person.topEngagementStrategy,
        analysis: person.analysis,
        richProfile: {
          headline: person.headline,
          summary: person.summary,
          pictureUrl: person.pictureUrl,
          connectionsCount: person.connectionsCount,
          followersCount: person.followersCount,
          skills: person.skills,
          education: person.education,
          interests: person.interests,
          currentCompany: person.currentCompany,
          currentLocation: person.currentLocation
        },
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.prospects.create({
      data: prospectData
    });
  }

  calculateEngagementScore(person) {
    let score = 0;
    
    if (person.buyerGroupRole === 'Decision Maker') score += 40;
    else if (person.buyerGroupRole === 'Champion') score += 30;
    else if (person.buyerGroupRole === 'Influencer') score += 20;
    else score += 10;
    
    if (person.influenceLevel === 'High') score += 30;
    else if (person.influenceLevel === 'Medium') score += 20;
    else score += 10;
    
    if (person.email) score += 10;
    if (person.linkedinUrl) score += 10;
    
    return Math.min(score, 100);
  }

  // Helper methods (same as before)
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

  generateTOPEngagementStrategy(people) {
    const strategy = {
      approach: 'Multi-touch, role-based engagement for telecommunications infrastructure',
      sequence: [],
      timeline: '4-6 weeks',
      keyMessages: []
    };
    
    const sortedPeople = [...people].sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.engagementPriority] - priorityOrder[a.engagementPriority];
    });
    
    sortedPeople.forEach((person, index) => {
      strategy.sequence.push({
        step: index + 1,
        person: person.name,
        role: person.buyerGroupRole,
        approach: person.analysis.engagementStrategy,
        topStrategy: person.topEngagementStrategy,
        timeline: `${index + 1}-${index + 2} weeks`
      });
    });
    
    strategy.keyMessages = [
      'Complete telecommunications infrastructure solutions',
      'Expert engineering and installation services',
      'Safety and compliance excellence',
      'Proven track record with similar projects',
      'Advanced equipment and technology'
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

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `improved-5bars-buyer-group-analysis-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the analysis
async function main() {
  const analyzer = new Improved5BarsBuyerGroupAnalysis();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Improved5BarsBuyerGroupAnalysis;
