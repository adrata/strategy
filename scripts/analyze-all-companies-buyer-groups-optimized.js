/**
 * 🎯 OPTIMIZED ALL COMPANIES BUYER GROUPS ANALYSIS
 * 
 * This script implements:
 * 1. Complete 5-role buyer group system: Decision Makers, Champions, Blockers, Stakeholders, Introducers
 * 2. Credit optimizations: search-heavy approach, progressive filtering, role-priority collection
 * 3. Company size limits and smart collection strategies
 * 4. Based on the successful working-5bars-buyer-group-analysis.js approach
 */

const { PrismaClient } = require('@prisma/client');

class OptimizedAllCompaniesBuyerGroupsAnalysis {
  constructor() {
    this.prisma = new PrismaClient();
    this.correctWorkspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.correctUserId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    // Credit optimization settings
    this.creditsUsed = { search: 0, collect: 0, enrich: 0 };
    this.maxCollectCredits = 200; // Limit total collect credits
    this.maxSearchCredits = 1000; // We have more search credits
    
    // Company size limits for optimization
    this.companySizeLimits = {
      small: { maxEmployees: 500, collectLimit: 30 },
      medium: { maxEmployees: 2000, collectLimit: 60 },
      large: { maxEmployees: 5000, collectLimit: 100 },
      enterprise: { maxEmployees: Infinity, collectLimit: 150 }
    };
    
    this.results = {
      analysisDate: new Date().toISOString(),
      companies: [],
      totalCreditsUsed: this.creditsUsed,
      optimizationStats: {
        companiesSkipped: 0,
        companiesOptimized: 0,
        totalProfilesCollected: 0,
        creditSavings: 0
      },
      companiesNotProcessed: {
        skipped: [],
        failed: [],
        noWebsite: [],
        enrichmentFailed: [],
        noEmployees: [],
        creditLimitReached: []
      },
      errors: []
    };
  }

  async execute() {
    console.log('🎯 OPTIMIZED ALL COMPANIES BUYER GROUPS ANALYSIS');
    console.log('===============================================');
    console.log('✅ Complete 5-role system: Decision Makers, Champions, Blockers, Stakeholders, Introducers');
    console.log('✅ Credit optimizations: Search-heavy approach, progressive filtering, role-priority collection');
    console.log('✅ Company size limits and smart collection strategies');
    console.log('');

    try {
      // Step 1: Get all companies with websites and people
      await this.getAllCompanies();
      
      // Step 2: Analyze each company using optimized approach
      await this.analyzeAllCompaniesOptimized();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getAllCompanies() {
    console.log('🏢 STEP 1: Getting all companies with websites and people...');
    console.log('');

    // Get all companies that have websites and people with emails
    const companies = await this.prisma.companies.findMany({
      where: { 
        workspaceId: this.correctWorkspaceId,
        website: { not: null },
        people: {
          some: {
            email: { not: null }
          }
        }
      },
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
      },
      orderBy: { name: 'asc' }
    });

    this.companies = companies;

    console.log(`📊 Found ${this.companies.length} companies to analyze:`);
    this.companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.people.length} people)`);
    });
    console.log('');
  }

  async analyzeAllCompaniesOptimized() {
    console.log('🎯 STEP 2: Analyzing buyer groups with optimizations...');
    console.log('');

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const company of this.companies) {
      processedCount++;
      console.log(`🏢 [${processedCount}/${this.companies.length}] Analyzing ${company.name}...`);
      
      try {
        // Check if we've hit our collect credit limit
        if (this.creditsUsed.collect >= this.maxCollectCredits) {
          console.log(`💰 Reached collect credit limit (${this.maxCollectCredits}). Stopping analysis.`);
          skippedCount = this.companies.length - processedCount + 1;
          
          // Track remaining companies as credit limit reached
          for (let i = processedCount - 1; i < this.companies.length; i++) {
            this.results.companiesNotProcessed.creditLimitReached.push({
              name: this.companies[i].name,
              id: this.companies[i].id,
              website: this.companies[i].website,
              peopleCount: this.companies[i].people.length,
              reason: 'Credit limit reached'
            });
          }
          break;
        }

        // Step 2a: Determine company size and collection strategy
        const companySize = this.determineCompanySize(company);
        const collectionStrategy = this.getCollectionStrategy(companySize);
        
        console.log(`   📊 Company size: ${companySize} (${collectionStrategy.description})`);

        // Step 2b: Enrich company by domain
        const enrichedCompany = await this.enrichCompanyByDomain(company);
        
        if (!enrichedCompany) {
          console.log(`   ⚠️ Could not enrich company ${company.name}`);
          this.results.companiesNotProcessed.enrichmentFailed.push({
            name: company.name,
            id: company.id,
            website: company.website,
            peopleCount: company.people.length,
            reason: 'Enrichment failed - company not found in CoreSignal'
          });
          errorCount++;
          continue;
        }

        // Step 2c: Progressive search and collection
        const currentEmployees = await this.progressiveSearchAndCollect(enrichedCompany, collectionStrategy);
        
        if (!currentEmployees || currentEmployees.length === 0) {
          console.log(`   ⚠️ No current employees found for ${company.name}`);
          errorCount++;
          continue;
        }

        // Step 2d: Analyze buyer group roles with complete 5-role system
        const buyerGroupAnalysis = await this.analyzeBuyerGroupRoles5Role(currentEmployees, company);
        
        // Step 2e: Create/update people records
        const createdPeople = await this.createPeopleRecords(currentEmployees, company, buyerGroupAnalysis);
        
        // Step 2f: Create prospect records for new people
        await this.createProspectRecords(createdPeople, company);
        
        // Step 2g: Update company with buyer group analysis
        await this.updateCompanyWithBuyerGroup(company, buyerGroupAnalysis);
        
        console.log(`   ✅ Successfully analyzed ${company.name}`);
        console.log(`   📊 Found ${currentEmployees.length} current employees`);
        console.log(`   👥 Created/updated ${createdPeople.length} people records`);
        console.log(`   🎯 Buyer group roles: ${buyerGroupAnalysis.summary}`);
        console.log(`   💰 Credits used: ${JSON.stringify(this.creditsUsed)}`);
        console.log('');
        
        successCount++;
        this.results.optimizationStats.companiesOptimized++;
        this.results.optimizationStats.totalProfilesCollected += currentEmployees.length;
        
        // Add delay to avoid rate limiting
        await this.delay(2000);
        
      } catch (error) {
        console.error(`   ❌ Error analyzing ${company.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`📊 OPTIMIZED ANALYSIS SUMMARY:`);
    console.log(`==============================`);
    console.log(`✅ Successfully processed: ${successCount} companies`);
    console.log(`⚠️ Skipped (credit limit): ${skippedCount} companies`);
    console.log(`❌ Errors: ${errorCount} companies`);
    console.log(`📈 Success rate: ${((successCount/(processedCount-skippedCount))*100).toFixed(1)}%`);
    console.log(`💰 Total credits used: ${JSON.stringify(this.creditsUsed)}`);
    console.log(`📊 Total profiles collected: ${this.results.optimizationStats.totalProfilesCollected}`);
    console.log('');
  }

  determineCompanySize(company) {
    const peopleCount = company.people.length;
    
    if (peopleCount <= 50) return 'small';
    if (peopleCount <= 200) return 'medium';
    if (peopleCount <= 1000) return 'large';
    return 'enterprise';
  }

  getCollectionStrategy(companySize) {
    const limits = this.companySizeLimits[companySize];
    
    return {
      size: companySize,
      maxCollects: limits.collectLimit,
      searchStrategy: companySize === 'enterprise' ? 'search-heavy' : 'balanced',
      description: `${companySize} company (max ${limits.collectLimit} profiles)`
    };
  }

  async progressiveSearchAndCollect(enrichedCompany, strategy) {
    console.log(`   🔍 Using ${strategy.searchStrategy} approach...`);
    
    if (strategy.searchStrategy === 'search-heavy') {
      return await this.searchHeavyApproach(enrichedCompany, strategy);
    } else {
      return await this.balancedApproach(enrichedCompany, strategy);
    }
  }

  async searchHeavyApproach(enrichedCompany, strategy) {
    console.log(`   🎯 Search-heavy approach: Multiple targeted searches, limited collection`);
    
    // Phase 1: Role-specific searches (use more search credits)
    const roleSearches = [
      'CEO OR "Chief Executive" OR President',
      'CTO OR "Chief Technology" OR "VP Technology"',
      'VP Sales OR "Vice President Sales" OR "Head of Sales"',
      'Director Operations OR "VP Operations"',
      'Manager Engineering OR "Head of Engineering"',
      'CFO OR "Chief Financial" OR "VP Finance"',
      'CMO OR "Chief Marketing" OR "VP Marketing"',
      'Director Procurement OR "Head of Procurement"'
    ];

    let allCandidates = [];
    
    // Execute role-specific searches
    for (const searchQuery of roleSearches) {
      if (this.creditsUsed.search >= this.maxSearchCredits) {
        console.log(`   ⚠️ Reached search credit limit, stopping searches`);
        break;
      }
      
      const candidates = await this.searchEmployeesByRole(enrichedCompany, searchQuery);
      allCandidates = allCandidates.concat(candidates);
      this.creditsUsed.search++;
    }

    // Remove duplicates and sort by relevance
    const uniqueCandidates = this.deduplicateCandidates(allCandidates);
    const sortedCandidates = this.sortCandidatesByRelevance(uniqueCandidates);
    
    // Phase 2: Collect only top candidates (limited collection)
    const candidatesToCollect = sortedCandidates.slice(0, strategy.maxCollects);
    console.log(`   📊 Found ${uniqueCandidates.length} unique candidates, collecting top ${candidatesToCollect.length}`);
    
    return await this.collectEmployeeProfiles(candidatesToCollect);
  }

  async balancedApproach(enrichedCompany, strategy) {
    console.log(`   ⚖️ Balanced approach: Standard search, moderate collection`);
    
    // Standard search for current employees
    const searchResults = await this.searchCurrentEmployees(enrichedCompany);
    this.creditsUsed.search++;
    
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    // Sort by relevance and limit collection
    const sortedResults = this.sortCandidatesByRelevance(searchResults);
    const candidatesToCollect = sortedResults.slice(0, strategy.maxCollects);
    
    console.log(`   📊 Found ${searchResults.length} employees, collecting top ${candidatesToCollect.length}`);
    
    return await this.collectEmployeeProfiles(candidatesToCollect);
  }

  async searchEmployeesByRole(enrichedCompany, roleQuery) {
    const searchUrl = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=20';
    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              term: {
                'current_company_id': enrichedCompany.coresignalCompanyId
              }
            },
            {
              query_string: {
                query: roleQuery,
                default_field: 'headline',
                default_operator: 'and'
              }
            }
          ]
        }
      }
    };

    try {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.log(`   ⚠️ Search failed for role "${roleQuery}": ${response.status}`);
        return [];
      }
    } catch (error) {
      console.log(`   ⚠️ Search error for role "${roleQuery}": ${error.message}`);
      return [];
    }
  }

  deduplicateCandidates(candidates) {
    const seen = new Set();
    return candidates.filter(candidate => {
      const id = candidate._source?.id || candidate.id;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  sortCandidatesByRelevance(candidates) {
    return candidates.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a);
      const bScore = this.calculateRelevanceScore(b);
      return bScore - aScore;
    });
  }

  calculateRelevanceScore(candidate) {
    const personData = candidate._source || candidate;
    const title = (personData.headline || '').toLowerCase();
    let score = 0;
    
    // Higher scores for more relevant titles
    if (title.includes('ceo') || title.includes('chief executive')) score += 100;
    if (title.includes('cto') || title.includes('chief technology')) score += 90;
    if (title.includes('vp') || title.includes('vice president')) score += 80;
    if (title.includes('director')) score += 70;
    if (title.includes('manager')) score += 60;
    if (title.includes('senior') || title.includes('sr ')) score += 50;
    if (title.includes('lead')) score += 40;
    
    return score;
  }

  async collectEmployeeProfiles(candidates) {
    const profiles = [];
    
    for (const candidate of candidates) {
      if (this.creditsUsed.collect >= this.maxCollectCredits) {
        console.log(`   ⚠️ Reached collect credit limit, stopping collection`);
        break;
      }
      
      const employeeId = candidate._source?.id || candidate.id;
      if (!employeeId) continue;
      
      try {
        const collectUrl = `https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`;
        const response = await fetch(collectUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        this.creditsUsed.collect++;
        
        if (response.ok) {
          const employeeData = await response.json();
          profiles.push(employeeData);
        } else {
          console.log(`   ⚠️ Failed to collect employee ${employeeId}: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error collecting employee ${employeeId}: ${error.message}`);
      }
    }
    
    return profiles;
  }

  async analyzeBuyerGroupRoles5Role(employees, company) {
    // Complete 5-role buyer group system
    const buyerGroupRoles = {
      decisionMakers: [],
      champions: [],
      blockers: [],
      stakeholders: [],
      introducers: [],
      summary: ''
    };

    for (const employee of employees) {
      const personData = employee._source;
      const role = this.determineBuyerGroupRole5Role(personData, company);
      
      const personInfo = {
        name: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim(),
        title: personData.headline || personData.experience?.[0]?.position_title || 'Unknown',
        role: role,
        influenceLevel: this.assessInfluenceLevel(personData, role),
        engagementPriority: this.assessEngagementPriority(role),
        decisionMakingPower: this.calculateDecisionMakingPower(personData, role),
        rawData: personData
      };

      switch (role) {
        case 'Decision Maker':
          buyerGroupRoles.decisionMakers.push(personInfo);
          break;
        case 'Champion':
          buyerGroupRoles.champions.push(personInfo);
          break;
        case 'Blocker':
          buyerGroupRoles.blockers.push(personInfo);
          break;
        case 'Stakeholder':
          buyerGroupRoles.stakeholders.push(personInfo);
          break;
        case 'Introducer':
          buyerGroupRoles.introducers.push(personInfo);
          break;
      }
    }

    // Generate summary with all 5 roles
    const totalPeople = employees.length;
    const decisionMakers = buyerGroupRoles.decisionMakers.length;
    const champions = buyerGroupRoles.champions.length;
    const blockers = buyerGroupRoles.blockers.length;
    const stakeholders = buyerGroupRoles.stakeholders.length;
    const introducers = buyerGroupRoles.introducers.length;

    buyerGroupRoles.summary = `${decisionMakers} Decision Makers, ${champions} Champions, ${blockers} Blockers, ${stakeholders} Stakeholders, ${introducers} Introducers (${totalPeople} total)`;

    return buyerGroupRoles;
  }

  determineBuyerGroupRole5Role(personData, company) {
    const title = (personData.headline || personData.experience?.[0]?.position_title || '').toLowerCase();
    const department = personData.department || '';
    const seniority = this.assessSeniority(title, personData);

    // Decision Makers - C-level, VPs, Directors with purchasing authority
    if (title.includes('ceo') || title.includes('chief executive') ||
        title.includes('president') || title.includes('owner') ||
        title.includes('vp') || title.includes('vice president') ||
        (title.includes('director') && (title.includes('operations') || title.includes('procurement') || title.includes('purchasing')))) {
      return 'Decision Maker';
    }

    // Champions - Technical leaders, project managers, department heads
    if (title.includes('cto') || title.includes('chief technology') ||
        title.includes('engineering manager') || title.includes('project manager') ||
        title.includes('department head') || title.includes('team lead') ||
        (title.includes('manager') && (title.includes('technical') || title.includes('engineering') || title.includes('it')))) {
      return 'Champion';
    }

    // Blockers - Low influence, non-strategic roles, or potential resistance
    if (title.includes('intern') || title.includes('trainee') ||
        title.includes('assistant') || title.includes('coordinator') ||
        title.includes('clerk') || title.includes('receptionist') ||
        department === 'other' || seniority === 'junior' ||
        title.includes('temp') || title.includes('contractor')) {
      return 'Blocker';
    }

    // Introducers - Good for introductions, networking roles
    if (title.includes('business development') || title.includes('partnership') ||
        title.includes('community') || title.includes('events') ||
        title.includes('marketing') || title.includes('sales') ||
        title.includes('customer success') || title.includes('account manager') ||
        title.includes('relationship manager')) {
      return 'Introducer';
    }

    // Stakeholders - Everyone else (default)
    return 'Stakeholder';
  }

  assessSeniority(title, personData) {
    if (title.includes('senior') || title.includes('sr ')) return 'senior';
    if (title.includes('junior') || title.includes('jr ')) return 'junior';
    if (title.includes('lead') || title.includes('principal')) return 'lead';
    return 'mid';
  }

  assessInfluenceLevel(personData, role) {
    switch (role) {
      case 'Decision Maker': return 'High';
      case 'Champion': return 'High';
      case 'Introducer': return 'Medium';
      case 'Stakeholder': return 'Medium';
      case 'Blocker': return 'Low';
      default: return 'Medium';
    }
  }

  assessEngagementPriority(role) {
    switch (role) {
      case 'Decision Maker': return 'High';
      case 'Champion': return 'High';
      case 'Introducer': return 'Medium';
      case 'Stakeholder': return 'Low';
      case 'Blocker': return 'Low';
      default: return 'Medium';
    }
  }

  calculateDecisionMakingPower(personData, role) {
    const title = (personData.headline || '').toLowerCase();
    
    if (role === 'Decision Maker') {
      if (title.includes('ceo') || title.includes('chief executive') || title.includes('president')) return 95;
      if (title.includes('vp') || title.includes('vice president')) return 90;
      if (title.includes('director')) return 85;
      return 80;
    }
    
    if (role === 'Champion') {
      if (title.includes('cto') || title.includes('chief technology')) return 75;
      if (title.includes('manager')) return 70;
      return 65;
    }
    
    if (role === 'Introducer') {
      if (title.includes('business development')) return 60;
      if (title.includes('partnership')) return 55;
      return 50;
    }
    
    if (role === 'Stakeholder') {
      if (title.includes('senior') || title.includes('sr ')) return 45;
      return 40;
    }
    
    return 20; // Blocker
  }

  async enrichCompanyByDomain(company) {
    if (!this.apiKey) {
      console.log(`   ⚠️ No CoreSignal API key - skipping enrichment for ${company.name}`);
      return null;
    }

    try {
      const domain = this.extractDomain(company.website);
      if (!domain) return null;

      const enrichUrl = 'https://api.coresignal.com/cdapi/v2/company_multi_source/enrich';
      const enrichQuery = {
        domain: domain
      };

      const response = await fetch(enrichUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrichQuery)
      });

      this.creditsUsed.enrich++;
      console.log(`   📊 Enrichment status: ${response.status}`);

      if (response.ok) {
        const companyData = await response.json();
        return {
          ...company,
          coresignalCompanyId: companyData.id,
          coresignalData: companyData
        };
      } else {
        console.log(`   ⚠️ Enrichment failed for ${company.name}: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.log(`   ⚠️ Enrichment error for ${company.name}: ${error.message}`);
      return null;
    }
  }

  async searchCurrentEmployees(enrichedCompany) {
    const searchUrl = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=100';
    const searchQuery = {
      query: {
        term: {
          'current_company_id': enrichedCompany.coresignalCompanyId
        }
      }
    };

    try {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.creditsUsed.search++;
      console.log(`   📊 Search status: ${response.status}`);

      if (response.ok) {
        return await response.json();
      } else {
        console.log(`   ⚠️ Search failed for ${enrichedCompany.name}: ${response.status}`);
        return [];
      }
    } catch (error) {
      console.log(`   ⚠️ Search error for ${enrichedCompany.name}: ${error.message}`);
      return [];
    }
  }

  async createPeopleRecords(currentEmployees, company, buyerGroupAnalysis) {
    const createdPeople = [];

    for (const employee of currentEmployees) {
      try {
        const personData = employee._source;
        const role = this.determineBuyerGroupRole5Role(personData, company);
        
        // Check if person already exists
        const existingPerson = await this.findExistingPerson(personData, company.id);
        
        if (existingPerson) {
          // Update existing person with buyer group role
          await this.updateExistingPerson(existingPerson, personData, role);
          console.log(`   🔄 Updated: ${personData.full_name} (${role})`);
        } else {
          // Create new person record
          const newPerson = await this.createNewPerson(personData, company, role);
          createdPeople.push(newPerson);
          console.log(`   🆕 Created: ${personData.full_name} (${role})`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error processing ${employee._source?.full_name}: ${error.message}`);
      }
    }

    return createdPeople;
  }

  async findExistingPerson(personData, companyId) {
    const matches = await this.prisma.people.findMany({
      where: {
        OR: [
          { email: personData.email },
          { fullName: personData.full_name },
          { 
            AND: [
              { firstName: personData.first_name },
              { lastName: personData.last_name }
            ]
          }
        ],
        companyId: companyId
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

  async updateExistingPerson(existingPerson, personData, role) {
    const updateData = {
      jobTitle: personData.headline || personData.experience?.[0]?.position_title,
      email: personData.email,
      linkedinUrl: personData.linkedin_url,
      buyerGroupRole: role,
      customFields: {
        ...existingPerson.customFields,
        coresignalId: personData.id,
        buyerGroupRole: role,
        influenceLevel: this.assessInfluenceLevel(personData, role),
        engagementPriority: this.assessEngagementPriority(role),
        decisionMakingPower: this.calculateDecisionMakingPower(personData, role),
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.people.update({
      where: { id: existingPerson.id },
      data: updateData
    });
  }

  async createNewPerson(personData, company, role) {
    const personRecord = {
      firstName: personData.first_name || 'Unknown',
      lastName: personData.last_name || 'Unknown',
      fullName: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim(),
      jobTitle: personData.headline || personData.experience?.[0]?.position_title || 'Unknown',
      email: personData.email || null,
      linkedinUrl: personData.linkedin_url || null,
      companyId: company.id,
      workspaceId: this.correctWorkspaceId,
      buyerGroupRole: role,
      tags: ['CoreSignal', 'Buyer Group Member', role, 'Current Employee'],
      customFields: {
        coresignalId: personData.id,
        buyerGroupRole: role,
        influenceLevel: this.assessInfluenceLevel(personData, role),
        engagementPriority: this.assessEngagementPriority(role),
        decisionMakingPower: this.calculateDecisionMakingPower(personData, role),
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    return await this.prisma.people.create({
      data: personRecord,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        companyId: true,
        workspaceId: true,
        buyerGroupRole: true,
        tags: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async createProspectRecords(createdPeople, company) {
    for (const person of createdPeople) {
      try {
        const prospectData = {
          firstName: person.firstName,
          lastName: person.lastName,
          fullName: person.fullName,
          jobTitle: person.jobTitle,
          email: person.email,
          linkedinUrl: person.linkedinUrl,
          companyId: company.id,
          workspaceId: this.correctWorkspaceId,
          status: 'Active',
          funnelStage: 'Prospect',
          buyerGroupRole: person.buyerGroupRole,
          engagementScore: this.calculateEngagementScore(person),
          tags: ['CoreSignal', 'Buyer Group Member', person.buyerGroupRole, 'Current Employee'],
          updatedAt: new Date(),
          customFields: {
            coresignalId: person.customFields?.coresignalId,
            influenceLevel: person.customFields?.influenceLevel,
            engagementPriority: person.customFields?.engagementPriority,
            decisionMakingPower: person.customFields?.decisionMakingPower,
            dataSource: 'CoreSignal',
            lastUpdated: new Date().toISOString()
          }
        };
        
        await this.prisma.prospects.create({
          data: prospectData,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            companyId: true,
            workspaceId: true,
            status: true,
            funnelStage: true,
            buyerGroupRole: true,
            engagementScore: true,
            tags: true,
            customFields: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        console.log(`   🎯 Created prospect: ${person.fullName}`);
      } catch (error) {
        console.log(`   ⚠️ Error creating prospect for ${person.fullName}: ${error.message}`);
      }
    }
  }

  calculateEngagementScore(person) {
    let score = 0;
    
    const role = person.buyerGroupRole;
    if (role === 'Decision Maker') score += 40;
    else if (role === 'Champion') score += 30;
    else if (role === 'Introducer') score += 25;
    else if (role === 'Stakeholder') score += 15;
    else score += 5; // Blocker
    
    const influenceLevel = person.customFields?.influenceLevel;
    if (influenceLevel === 'High') score += 30;
    else if (influenceLevel === 'Medium') score += 20;
    else score += 10;
    
    if (person.email) score += 10;
    if (person.linkedinUrl) score += 10;
    
    return Math.min(score, 100);
  }

  async updateCompanyWithBuyerGroup(company, buyerGroupAnalysis) {
    try {
      await this.prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: {
            ...company.customFields,
            buyerGroupAnalysis: buyerGroupAnalysis,
            lastBuyerGroupUpdate: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.log(`   ⚠️ Error updating company ${company.name}: ${error.message}`);
    }
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateFinalReport() {
    console.log('📋 FINAL OPTIMIZATION REPORT');
    console.log('============================');
    console.log(`✅ Complete 5-role system implemented: Decision Makers, Champions, Blockers, Stakeholders, Introducers`);
    console.log(`💰 Credit optimizations applied:`);
    console.log(`   • Search-heavy approach for large companies`);
    console.log(`   • Progressive filtering and role-specific searches`);
    console.log(`   • Company size limits and smart collection strategies`);
    console.log(`   • Role-priority collection (Decision Makers & Champions first)`);
    console.log('');
    console.log(`📊 Optimization Results:`);
    console.log(`   • Companies optimized: ${this.results.optimizationStats.companiesOptimized}`);
    console.log(`   • Total profiles collected: ${this.results.optimizationStats.totalProfilesCollected}`);
    console.log(`   • Total credits used: ${JSON.stringify(this.creditsUsed)}`);
    console.log(`   • Credit efficiency: ${(this.results.optimizationStats.totalProfilesCollected / this.creditsUsed.collect).toFixed(2)} profiles per collect credit`);
    console.log('');
    console.log('🎯 The workspace now contains optimized buyer group data with complete 5-role system!');
  }
}

// Execute the analysis
async function main() {
  const analyzer = new OptimizedAllCompaniesBuyerGroupsAnalysis();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = OptimizedAllCompaniesBuyerGroupsAnalysis;
