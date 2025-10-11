const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class AlabamaPowerBuyerGroupFinder {
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
  }

  async findBuyerGroup() {
    console.log('🎯 ALABAMA POWER BUYER GROUP DISCOVERY');
    console.log('=====================================');
    console.log('Target: Alabama Power Company (2,507 employees)');
    console.log('Services: Communications Engineering, Distribution Automation, Fiber Management');
    console.log('');

    try {
      // Step 1: Get company data
      await this.getCompanyData();
      
      // Step 2: Execute targeted searches
      await this.executeTargetedSearches();
      
      // Step 3: Analyze and assign roles
      this.analyzeAndAssignRoles();
      
      // Step 4: Generate report
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
    console.log('🔍 STEP 2: Executing Targeted Searches');
    console.log('─'.repeat(50));
    
    const companyId = this.results.company.coresignalId;
    const allProfiles = [];
    
    // Search 1: Engineering & Technical Leadership
    console.log('🔧 Search 1: Engineering & Technical Leadership');
    const engineeringProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['engineering', 'technical', 'technology'],
      ['vp', 'director', 'manager', 'senior', 'principal', 'lead'],
      'Engineering Leadership',
      { prioritizeDecisionMakers: true, managementLevel: 'senior' }
    );
    allProfiles.push(...engineeringProfiles);
    
    // Search 2: Communications & Network Specialists
    console.log('📡 Search 2: Communications & Network Specialists');
    const communicationsProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['communications', 'network', 'telecommunications'],
      ['engineer', 'specialist', 'analyst', 'technician', 'manager'],
      'Communications Specialists',
      { prioritizeDecisionMakers: false }
    );
    allProfiles.push(...communicationsProfiles);
    
    // Search 3: Operations & Field Management
    console.log('⚙️ Search 3: Operations & Field Management');
    const operationsProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['operations', 'field', 'maintenance'],
      ['manager', 'supervisor', 'director', 'vp', 'lead'],
      'Operations Management',
      { prioritizeDecisionMakers: true }
    );
    allProfiles.push(...operationsProfiles);
    
    // Search 4: IT & Technology Management
    console.log('💻 Search 4: IT & Technology Management');
    const itProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['it', 'information technology', 'systems'],
      ['manager', 'director', 'vp', 'chief', 'senior'],
      'IT Management',
      { prioritizeDecisionMakers: true }
    );
    allProfiles.push(...itProfiles);
    
    // Search 5: C-Level & Executive
    console.log('👔 Search 5: C-Level & Executive');
    const executiveProfiles = await this.searchByTitles(
      companyId,
      ['ceo', 'cto', 'cio', 'coo', 'cfo', 'president', 'vp', 'vice president'],
      'C-Level & Executive',
      { decisionMakersOnly: true }
    );
    allProfiles.push(...executiveProfiles);
    
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
    
    // Add management level filter if requested
    if (options.managementLevel) {
      searchQuery.query.bool.must.push({ term: { 'management_level': options.managementLevel } });
    }
    
    try {
      const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', searchQuery, 'POST');
      const employeeIds = Array.isArray(response) ? response : [];
      
      console.log(`   Found ${employeeIds.length} ${searchName} employee IDs`);
      
      // Collect detailed profiles for first 10 results
      const profilesToCollect = employeeIds.slice(0, 10);
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
      
      // Collect detailed profiles for first 5 results
      const profilesToCollect = employeeIds.slice(0, 5);
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
          influenceScore: this.calculateInfluenceScore(profile)
        });
      }
    }
    
    console.log(`✅ Analyzed ${profiles.length} profiles`);
    console.log('');
  }

  determineRole(profile) {
    const title = (profile.active_experience_title || profile.experience?.[0]?.title || '').toLowerCase();
    const department = (profile.active_experience_department || profile.experience?.[0]?.department || '').toLowerCase();
    const isDecisionMaker = profile.is_decision_maker === 1;
    
    // Decision Makers - C-level, VPs, Directors
    if (isDecisionMaker || 
        title.includes('ceo') || title.includes('chief') || title.includes('president') ||
        title.includes('vp') || title.includes('vice president') ||
        title.includes('director') || title.includes('head of')) {
      return 'decisionMakers';
    }
    
    // Champions - Senior technical roles, managers
    if (title.includes('senior') || title.includes('principal') || title.includes('lead') ||
        title.includes('manager') || title.includes('supervisor') ||
        (title.includes('engineer') && (title.includes('senior') || title.includes('principal'))) ||
        title.includes('project manager') || title.includes('technical lead')) {
      return 'champions';
    }
    
    // Influencers - Technical specialists, analysts
    if (title.includes('engineer') || title.includes('specialist') || title.includes('analyst') ||
        title.includes('architect') || title.includes('consultant') ||
        title.includes('technician') || title.includes('coordinator')) {
      return 'influencers';
    }
    
    // Blockers - Legal, compliance, procurement
    if (title.includes('legal') || title.includes('compliance') || title.includes('procurement') ||
        title.includes('finance') || title.includes('security') || title.includes('risk')) {
      return 'blockers';
    }
    
    // Introducers - Administrative, assistants
    if (title.includes('assistant') || title.includes('coordinator') || title.includes('administrative') ||
        title.includes('executive assistant') || title.includes('admin')) {
      return 'introducers';
    }
    
    // Default to stakeholders
    return 'stakeholders';
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
    console.log('📊 ALABAMA POWER BUYER GROUP REPORT');
    console.log('===================================');
    console.log('');
    
    const { buyerGroup } = this.results;
    
    console.log('👔 DECISION MAKERS:');
    buyerGroup.decisionMakers.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
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
      console.log('');
    });
    
    console.log('💡 INFLUENCERS:');
    buyerGroup.influencers.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log('');
    });
    
    console.log('👥 STAKEHOLDERS:');
    buyerGroup.stakeholders.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department}`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
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
      console.log('');
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   Decision Makers: ${buyerGroup.decisionMakers.length}`);
    console.log(`   Champions: ${buyerGroup.champions.length}`);
    console.log(`   Influencers: ${buyerGroup.influencers.length}`);
    console.log(`   Stakeholders: ${buyerGroup.stakeholders.length}`);
    console.log(`   Blockers: ${buyerGroup.blockers.length}`);
    console.log(`   Introducers: ${buyerGroup.introducers.length}`);
    console.log(`   Total Buyer Group: ${Object.values(buyerGroup).flat().length} people`);
    console.log(`   Total Credits Used: ${this.results.stats.totalCredits}`);
    console.log('');
    
    console.log('🎯 RECOMMENDED APPROACH:');
    console.log('1. Start with Decision Makers for initial contact');
    console.log('2. Engage Champions as technical advocates');
    console.log('3. Use Influencers for technical validation');
    console.log('4. Address Stakeholders for implementation support');
    console.log('5. Navigate Blockers through compliance and procurement');
    console.log('6. Leverage Introducers for internal connections');
  }
}

async function main() {
  const finder = new AlabamaPowerBuyerGroupFinder();
  await finder.findBuyerGroup();
}

main().catch(console.error);
