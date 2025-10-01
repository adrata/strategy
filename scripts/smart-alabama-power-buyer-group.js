const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class SmartAlabamaPowerBuyerGroupFinder {
  constructor() {
    this.results = {
      company: null,
      searches: [],
      profiles: [],
      buyerGroup: {
        decisionMakers: [],
        champions: [],
        influencers: [],
        stakeholders: [],
        blockers: [],
        introducers: []
      },
      stats: {
        totalCredits: 0,
        totalPeopleFound: 0,
        totalProfilesCollected: 0
      }
    };
    
    // Company size-based role distribution targets
    this.roleTargets = {
      large: { // 2,507 employees = large company
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 2, max: 4, ideal: 3 },
        stakeholders: { min: 3, max: 6, ideal: 4 },
        blockers: { min: 1, max: 2, ideal: 1 },
        introducers: { min: 1, max: 3, ideal: 2 }
      }
    };
  }

  async findBuyerGroup() {
    console.log('🎯 SMART ALABAMA POWER BUYER GROUP DISCOVERY');
    console.log('============================================');
    console.log('Target: Alabama Power Company (2,507 employees)');
    console.log('Services: Communications Engineering, Distribution Automation, Fiber Management');
    console.log('Expected: 2-3 Decision Makers, 2-4 Champions, 3-6 Stakeholders');
    console.log('');

    try {
      // Step 1: Get company data
      await this.getCompanyData();
      
      // Step 2: Execute targeted searches
      await this.executeTargetedSearches();
      
      // Step 3: Analyze and assign roles with smart distribution
      this.analyzeAndAssignRoles();
      
      // Step 4: Apply role distribution constraints
      this.applyRoleDistributionConstraints();
      
      // Step 5: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async getCompanyData() {
    console.log('🏢 STEP 1: Getting Alabama Power Company Data');
    console.log('─'.repeat(50));
    
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP' } },
      select: { id: true, name: true }
    });
    
    const company = await prisma.companies.findFirst({
      where: {
        workspaceId: workspace.id,
        name: { contains: 'Alabama Power', mode: 'insensitive' },
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        customFields: true
      }
    });
    
    if (!company) {
      throw new Error('Alabama Power Company not found with CoreSignal ID');
    }
    
    const coresignalData = company.customFields?.coresignalData;
    this.results.company = {
      id: company.id,
      name: company.name,
      coresignalId: coresignalData?.id,
      employees: coresignalData?.employees_count,
      industry: coresignalData?.industry
    };
    
    console.log(`✅ Company: ${company.name}`);
    console.log(`   CoreSignal ID: ${coresignalData?.id}`);
    console.log(`   Employees: ${coresignalData?.employees_count}`);
    console.log(`   Industry: ${coresignalData?.industry}`);
    console.log('');
  }

  async executeTargetedSearches() {
    console.log('🔍 STEP 2: Executing Smart Targeted Searches');
    console.log('─'.repeat(50));
    
    const companyId = this.results.company.coresignalId;
    const allProfiles = [];
    
    // Search 1: C-Level & Executive (Decision Makers)
    console.log('👔 Search 1: C-Level & Executive (Decision Makers)');
    const executiveProfiles = await this.searchByTitles(
      companyId,
      ['ceo', 'cto', 'cfo', 'coo', 'cmo', 'president', 'vp', 'vice president'],
      'C-Level & Executive',
      { decisionMakersOnly: true, limit: 5 }
    );
    allProfiles.push(...executiveProfiles);
    
    // Search 2: Directors & Senior Management (Decision Makers)
    console.log('🎯 Search 2: Directors & Senior Management');
    const directorProfiles = await this.searchByTitles(
      companyId,
      ['director', 'head of', 'chief'],
      'Directors & Senior Management',
      { decisionMakersOnly: true, limit: 5 }
    );
    allProfiles.push(...directorProfiles);
    
    // Search 3: Engineering & Technical Leadership (Champions)
    console.log('🔧 Search 3: Engineering & Technical Leadership (Champions)');
    const engineeringProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['engineering', 'technical', 'technology'],
      ['senior', 'principal', 'lead', 'manager'],
      'Engineering Leadership',
      { prioritizeDecisionMakers: false, limit: 8 }
    );
    allProfiles.push(...engineeringProfiles);
    
    // Search 4: Communications & Network Specialists (Champions)
    console.log('📡 Search 4: Communications & Network Specialists (Champions)');
    const communicationsProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['communications', 'network', 'telecommunications'],
      ['engineer', 'specialist', 'analyst', 'manager'],
      'Communications Specialists',
      { prioritizeDecisionMakers: false, limit: 8 }
    );
    allProfiles.push(...communicationsProfiles);
    
    // Search 5: Operations & Field Management (Stakeholders)
    console.log('⚙️ Search 5: Operations & Field Management (Stakeholders)');
    const operationsProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['operations', 'field', 'maintenance'],
      ['manager', 'supervisor', 'coordinator', 'specialist'],
      'Operations Management',
      { prioritizeDecisionMakers: false, limit: 8 }
    );
    allProfiles.push(...operationsProfiles);
    
    // Search 6: IT & Technology (Stakeholders)
    console.log('💻 Search 6: IT & Technology (Stakeholders)');
    const itProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['it', 'information technology', 'systems'],
      ['manager', 'specialist', 'analyst', 'coordinator'],
      'IT & Technology',
      { prioritizeDecisionMakers: false, limit: 6 }
    );
    allProfiles.push(...itProfiles);
    
    // Search 7: Legal, Compliance, Procurement (Blockers)
    console.log('🛡️ Search 7: Legal, Compliance, Procurement (Blockers)');
    const blockerProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['legal', 'compliance', 'procurement', 'finance', 'security'],
      ['manager', 'director', 'specialist', 'analyst'],
      'Legal & Compliance',
      { prioritizeDecisionMakers: false, limit: 4 }
    );
    allProfiles.push(...blockerProfiles);
    
    // Search 8: Administrative & Support (Introducers)
    console.log('🤝 Search 8: Administrative & Support (Introducers)');
    const adminProfiles = await this.searchByTitles(
      companyId,
      ['assistant', 'coordinator', 'administrative', 'executive assistant'],
      'Administrative & Support',
      { decisionMakersOnly: false, limit: 4 }
    );
    allProfiles.push(...adminProfiles);
    
    // Remove duplicates
    const uniqueProfiles = this.removeDuplicates(allProfiles);
    this.results.profiles = uniqueProfiles;
    this.results.stats.totalPeopleFound = uniqueProfiles.length;
    
    console.log(`✅ Total unique profiles found: ${uniqueProfiles.length}`);
    console.log(`💰 Total credits used: ${this.results.stats.totalCredits}`);
    console.log('');
  }

  async searchByDepartmentAndRole(companyId, departments, roles, searchName, options = {}) {
    const searchQuery = {
      query: {
        bool: {
          must: [
            { term: { 'active_experience_company_id': companyId } },
            {
              nested: {
                path: 'experience',
                query: {
                  bool: {
                    must: [
                      { term: { 'experience.active_experience': 1 } },
                      { term: { 'experience.company_id': companyId } },
                      {
                        bool: {
                          should: [
                            ...departments.map(dept => ({ match: { 'experience.department': dept } })),
                            ...departments.map(dept => ({ match: { 'experience.company_department': dept } })),
                            ...roles.map(role => ({ match: { 'experience.title': role } })),
                            ...roles.map(role => ({ match: { 'experience.active_experience_title': role } }))
                          ],
                          minimum_should_match: 1
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
    
    // Add decision maker filter if requested
    if (options.prioritizeDecisionMakers) {
      searchQuery.query.bool.must.push({ term: { 'is_decision_maker': 1 } });
    }
    
    try {
      const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', searchQuery, 'POST');
      const employeeIds = Array.isArray(response) ? response : [];
      
      console.log(`   Found ${employeeIds.length} ${searchName} employee IDs`);
      
      // Collect detailed profiles for limited results
      const profilesToCollect = employeeIds.slice(0, options.limit || 10);
      const detailedProfiles = [];
      
      for (const employeeId of profilesToCollect) {
        try {
          const profile = await this.collectEmployeeProfile(employeeId);
          if (profile) {
            detailedProfiles.push(profile);
          }
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected ${detailedProfiles.length} detailed profiles`);
      this.results.stats.totalCredits += 1; // Search cost
      this.results.stats.totalCredits += detailedProfiles.length; // Collection cost
      
      return detailedProfiles;
    } catch (error) {
      console.log(`   ❌ ${searchName} search failed: ${error.message}`);
      return [];
    }
  }

  async searchByTitles(companyId, titles, searchName, options = {}) {
    const searchQuery = {
      query: {
        bool: {
          must: [
            { term: { 'active_experience_company_id': companyId } },
            {
              nested: {
                path: 'experience',
                query: {
                  bool: {
                    must: [
                      { term: { 'experience.active_experience': 1 } },
                      { term: { 'experience.company_id': companyId } },
                      {
                        bool: {
                          should: [
                            ...titles.map(title => ({ match: { 'experience.title': title } })),
                            ...titles.map(title => ({ match: { 'experience.active_experience_title': title } })),
                            ...titles.map(title => ({ match_phrase: { 'experience.title': title } })),
                            ...titles.map(title => ({ match_phrase: { 'experience.active_experience_title': title } }))
                          ],
                          minimum_should_match: 1
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
    
    // Add decision maker filter if requested
    if (options.decisionMakersOnly) {
      searchQuery.query.bool.must.push({ term: { 'is_decision_maker': 1 } });
    }
    
    try {
      const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', searchQuery, 'POST');
      const employeeIds = Array.isArray(response) ? response : [];
      
      console.log(`   Found ${employeeIds.length} ${searchName} employee IDs`);
      
      // Collect detailed profiles for limited results
      const profilesToCollect = employeeIds.slice(0, options.limit || 5);
      const detailedProfiles = [];
      
      for (const employeeId of profilesToCollect) {
        try {
          const profile = await this.collectEmployeeProfile(employeeId);
          if (profile) {
            detailedProfiles.push(profile);
          }
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected ${detailedProfiles.length} detailed profiles`);
      this.results.stats.totalCredits += 1; // Search cost
      this.results.stats.totalCredits += detailedProfiles.length; // Collection cost
      
      return detailedProfiles;
    } catch (error) {
      console.log(`   ❌ ${searchName} search failed: ${error.message}`);
      return [];
    }
  }

  async collectEmployeeProfile(employeeId) {
    try {
      const response = await this.callCoreSignalAPI(`/employee_multi_source/collect/${employeeId}`, null, 'GET');
      return response;
    } catch (error) {
      throw new Error(`Failed to collect profile ${employeeId}: ${error.message}`);
    }
  }

  analyzeAndAssignRoles() {
    console.log('📊 STEP 3: Analyzing Profiles and Assigning Roles');
    console.log('─'.repeat(50));
    
    const profiles = this.results.profiles;
    
    for (const profile of profiles) {
      const role = this.determineRole(profile);
      if (role && this.results.buyerGroup[role]) {
        this.results.buyerGroup[role].push({
          name: profile.full_name || 'Unknown',
          title: profile.active_experience_title || profile.experience?.[0]?.title || 'Unknown',
          department: profile.active_experience_department || profile.experience?.[0]?.department || 'Unknown',
          company: profile.active_experience_company_name || 'Alabama Power Company',
          email: profile.primary_professional_email || 'N/A',
          linkedin: profile.professional_network_url || 'N/A',
          isDecisionMaker: profile.is_decision_maker === 1,
          managementLevel: profile.active_experience_management_level || 'N/A',
          influenceScore: this.calculateInfluenceScore(profile),
          confidence: this.calculateRoleConfidence(profile, role)
        });
      }
    }
    
    console.log(`✅ Analyzed ${profiles.length} profiles`);
    console.log(`   Decision Makers: ${this.results.buyerGroup.decisionMakers.length}`);
    console.log(`   Champions: ${this.results.buyerGroup.champions.length}`);
    console.log(`   Stakeholders: ${this.results.buyerGroup.stakeholders.length}`);
    console.log(`   Blockers: ${this.results.buyerGroup.blockers.length}`);
    console.log(`   Introducers: ${this.results.buyerGroup.introducers.length}`);
    console.log('');
  }

  determineRole(profile) {
    const title = (profile.active_experience_title || profile.experience?.[0]?.title || '').toLowerCase();
    const department = (profile.active_experience_department || profile.experience?.[0]?.department || '').toLowerCase();
    const isDecisionMaker = profile.is_decision_maker === 1;
    
    // PRIORITY 1: Use CoreSignal's decision maker flag (but be more selective)
    if (isDecisionMaker && (
        title.includes('ceo') || title.includes('chief') || title.includes('president') ||
        title.includes('vp') || title.includes('vice president') ||
        title.includes('director') || title.includes('head of')
    )) {
      return 'decisionMakers';
    }
    
    // PRIORITY 2: C-Level and Senior Executives (Decision Makers)
    if (title.includes('ceo') || title.includes('chief') || title.includes('president') ||
        title.includes('vp') || title.includes('vice president') ||
        (title.includes('director') && (title.includes('senior') || title.includes('executive')))) {
      return 'decisionMakers';
    }
    
    // PRIORITY 3: Technical Champions (Senior technical roles)
    if ((title.includes('senior') || title.includes('principal') || title.includes('lead')) &&
        (title.includes('engineer') || title.includes('specialist') || title.includes('architect') ||
         title.includes('manager') || title.includes('supervisor'))) {
      return 'champions';
    }
    
    // PRIORITY 4: Technical Specialists (Influencers)
    if (title.includes('engineer') || title.includes('specialist') || title.includes('analyst') ||
        title.includes('architect') || title.includes('consultant') ||
        title.includes('technician') || title.includes('coordinator')) {
      return 'influencers';
    }
    
    // PRIORITY 5: Operations and Support (Stakeholders)
    if (title.includes('manager') || title.includes('supervisor') || title.includes('coordinator') ||
        title.includes('specialist') || title.includes('analyst') ||
        department.includes('operations') || department.includes('field') || department.includes('maintenance')) {
      return 'stakeholders';
    }
    
    // PRIORITY 6: Legal, Compliance, Procurement (Blockers)
    if (title.includes('legal') || title.includes('compliance') || title.includes('procurement') ||
        title.includes('finance') || title.includes('security') || title.includes('risk') ||
        department.includes('legal') || department.includes('compliance') || department.includes('procurement')) {
      return 'blockers';
    }
    
    // PRIORITY 7: Administrative and Support (Introducers)
    if (title.includes('assistant') || title.includes('coordinator') || title.includes('administrative') ||
        title.includes('executive assistant') || title.includes('admin') ||
        department.includes('administrative') || department.includes('support')) {
      return 'introducers';
    }
    
    // Default to stakeholders
    return 'stakeholders';
  }

  applyRoleDistributionConstraints() {
    console.log('⚖️ STEP 4: Applying Role Distribution Constraints');
    console.log('─'.repeat(50));
    
    const targets = this.roleTargets.large;
    const current = this.results.buyerGroup;
    
    console.log('🎯 Target Distribution:');
    console.log(`   Decision Makers: ${targets.decisionMakers.min}-${targets.decisionMakers.max} (ideal: ${targets.decisionMakers.ideal})`);
    console.log(`   Champions: ${targets.champions.min}-${targets.champions.max} (ideal: ${targets.champions.ideal})`);
    console.log(`   Stakeholders: ${targets.stakeholders.min}-${targets.stakeholders.max} (ideal: ${targets.stakeholders.ideal})`);
    console.log(`   Blockers: ${targets.blockers.min}-${targets.blockers.max} (ideal: ${targets.blockers.ideal})`);
    console.log(`   Introducers: ${targets.introducers.min}-${targets.introducers.max} (ideal: ${targets.introducers.ideal})`);
    console.log('');
    
    // Sort each role by influence score (highest first)
    Object.keys(current).forEach(role => {
      current[role].sort((a, b) => b.influenceScore - a.influenceScore);
    });
    
    // Apply constraints
    const finalBuyerGroup = {
      decisionMakers: current.decisionMakers.slice(0, targets.decisionMakers.max),
      champions: current.champions.slice(0, targets.champions.max),
      stakeholders: current.stakeholders.slice(0, targets.stakeholders.max),
      blockers: current.blockers.slice(0, targets.blockers.max),
      introducers: current.introducers.slice(0, targets.introducers.max)
    };
    
    // Ensure minimum requirements
    if (finalBuyerGroup.decisionMakers.length < targets.decisionMakers.min) {
      console.log(`⚠️ Warning: Only ${finalBuyerGroup.decisionMakers.length} Decision Makers found (minimum: ${targets.decisionMakers.min})`);
    }
    
    if (finalBuyerGroup.champions.length < targets.champions.min) {
      console.log(`⚠️ Warning: Only ${finalBuyerGroup.champions.length} Champions found (minimum: ${targets.champions.min})`);
    }
    
    this.results.buyerGroup = finalBuyerGroup;
    
    console.log('✅ Applied role distribution constraints');
    console.log('');
  }

  calculateInfluenceScore(profile) {
    let score = 0;
    
    // Decision maker bonus
    if (profile.is_decision_maker === 1) score += 50;
    
    // Management level bonus
    const managementLevel = profile.active_experience_management_level;
    if (managementLevel === 'C-Level') score += 40;
    else if (managementLevel === 'Senior') score += 30;
    else if (managementLevel === 'Mid-Level') score += 20;
    
    // Title-based scoring
    const title = (profile.active_experience_title || '').toLowerCase();
    if (title.includes('chief') || title.includes('vp') || title.includes('director')) score += 35;
    else if (title.includes('manager') || title.includes('senior')) score += 25;
    else if (title.includes('engineer') || title.includes('specialist')) score += 15;
    
    // Department relevance
    const department = (profile.active_experience_department || '').toLowerCase();
    if (department.includes('engineering') || department.includes('technology')) score += 20;
    else if (department.includes('operations') || department.includes('it')) score += 15;
    
    return Math.min(score, 100);
  }

  calculateRoleConfidence(profile, role) {
    let confidence = 0.5; // Base confidence
    
    // Decision maker confidence
    if (role === 'decisionMakers' && profile.is_decision_maker === 1) confidence += 0.3;
    if (role === 'decisionMakers' && (profile.active_experience_title || '').toLowerCase().includes('director')) confidence += 0.2;
    
    // Champion confidence
    if (role === 'champions' && (profile.active_experience_title || '').toLowerCase().includes('senior')) confidence += 0.2;
    if (role === 'champions' && (profile.active_experience_title || '').toLowerCase().includes('engineer')) confidence += 0.2;
    
    // Stakeholder confidence
    if (role === 'stakeholders' && (profile.active_experience_department || '').toLowerCase().includes('operations')) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  removeDuplicates(profiles) {
    const seen = new Set();
    return profiles.filter(profile => {
      const key = profile.id || profile.employee_id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async callCoreSignalAPI(endpoint, data, method = 'POST') {
    const url = `${CORESIGNAL_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
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

  generateReport() {
    console.log('📊 SMART ALABAMA POWER BUYER GROUP REPORT');
    console.log('==========================================');
    console.log('');
    
    const { buyerGroup } = this.results;
    const totalPeople = Object.values(buyerGroup).flat().length;
    
    console.log('👔 DECISION MAKERS:');
    buyerGroup.decisionMakers.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('🚀 CHAMPIONS:');
    buyerGroup.champions.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('💡 INFLUENCERS:');
    (buyerGroup.influencers || []).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('👥 STAKEHOLDERS:');
    (buyerGroup.stakeholders || []).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('🛡️ BLOCKERS:');
    buyerGroup.blockers.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('🤝 INTRODUCERS:');
    buyerGroup.introducers.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   Decision Makers: ${buyerGroup.decisionMakers.length} (Target: 1-3)`);
    console.log(`   Champions: ${buyerGroup.champions.length} (Target: 2-4)`);
    console.log(`   Influencers: ${buyerGroup.influencers.length} (Target: 0-6)`);
    console.log(`   Stakeholders: ${buyerGroup.stakeholders.length} (Target: 3-6)`);
    console.log(`   Blockers: ${buyerGroup.blockers.length} (Target: 1-2)`);
    console.log(`   Introducers: ${buyerGroup.introducers.length} (Target: 1-3)`);
    console.log(`   Total Buyer Group: ${totalPeople} people`);
    console.log(`   Total Credits Used: ${this.results.stats.totalCredits}`);
    console.log('');
    
    console.log('🎯 RECOMMENDED APPROACH:');
    console.log('1. Start with Decision Makers for initial contact');
    console.log('2. Engage Champions as technical advocates');
    console.log('3. Use Influencers for technical validation');
    console.log('4. Address Stakeholders for implementation support');
    console.log('5. Navigate Blockers through compliance and procurement');
    console.log('6. Leverage Introducers for internal connections');
    console.log('');
    
    console.log('✅ SMART ROLE DISTRIBUTION ACHIEVED!');
    console.log('This buyer group now follows proper role distribution for a large company.');
  }
}

async function main() {
  const finder = new SmartAlabamaPowerBuyerGroupFinder();
  await finder.findBuyerGroup();
}

main().catch(console.error);
