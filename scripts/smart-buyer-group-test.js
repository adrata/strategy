#!/usr/bin/env node

/**
 * 🎯 SMART BUYER GROUP DISCOVERY - TEST VERSION
 * 
 * Simplified test version focusing on core functionality
 * Based on proven patterns from coresignal-enrichment-final.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

// Command line argument parsing
function getArg(key) {
  const hit = process.argv.slice(2).find((a) => a.startsWith(key + '='));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}

// Test buyer group discovery
class SmartBuyerGroupTest {
  constructor() {
    this.results = {
      company: null,
      workspace: null,
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
        successRate: 0
      }
    };
  }

  /**
   * 🚀 MAIN TEST FUNCTION
   */
  async testBuyerGroupDiscovery(companyName, workspaceName, limit = 20) {
    console.log('🎯 SMART BUYER GROUP DISCOVERY - TEST');
    console.log('=====================================');
    console.log(`Company: ${companyName}`);
    console.log(`Workspace: ${workspaceName}`);
    console.log(`Limit: ${limit} profiles`);
    console.log('');

    try {
      // Step 1: Get workspace context
      await this.getWorkspaceContext(workspaceName);
      
      // Step 2: Test CoreSignal API connection
      await this.testCoreSignalConnection();
      
      // Step 3: Execute smart filtered searches
      const profiles = await this.executeSmartFilteredSearches(limit);
      
      // Step 4: Analyze profiles
      const buyerGroup = this.analyzeProfiles(profiles);
      
      // Step 5: Generate report
      this.generateTestReport(companyName, buyerGroup);
      
      return buyerGroup;
      
    } catch (error) {
      console.error('❌ Test error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * 📊 GET WORKSPACE CONTEXT
   */
  async getWorkspaceContext(workspaceName) {
    console.log('🏢 STEP 1: Getting Workspace Context');
    console.log('─'.repeat(40));
    
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: workspaceName } },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      throw new Error(`Workspace "${workspaceName}" not found`);
    }
    
    this.results.workspace = workspace;
    console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);
    console.log('');
  }

  /**
   * 🔍 TEST CORESIGNAL CONNECTION
   */
  async testCoreSignalConnection() {
    console.log('🔍 STEP 2: Testing CoreSignal Connection');
    console.log('─'.repeat(40));
    
    if (!CORESIGNAL_API_KEY) {
      throw new Error('CORESIGNAL_API_KEY is not set');
    }
    
    console.log(`✅ CoreSignal API Key: ${CORESIGNAL_API_KEY.substring(0, 10)}...`);
    console.log('');
  }

  /**
   * 🎯 EXECUTE SMART FILTERED SEARCHES
   */
  async executeSmartFilteredSearches(limit) {
    console.log('🎯 STEP 3: Smart Multi-Tiered Searches');
    console.log('─'.repeat(40));
    
          // First, find the company using existing CoreSignal ID
          const companyData = await this.findCompanyByCoreSignalID();
    if (!companyData.success) {
      throw new Error(`Company lookup failed: ${companyData.reason}`);
    }
    
    const allProfiles = [];
    const companyId = companyData.companyId;
    
    // Search 1: Engineering & Technical Leadership (with decision maker priority)
    console.log('🔧 Search 1: Engineering & Technical Leadership');
    const engineeringProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['engineering', 'software', 'technology', 'product'],
      ['vp', 'director', 'head of', 'senior', 'lead', 'principal', 'architect'],
      'Engineering Leadership',
      { prioritizeDecisionMakers: true, managementLevel: 'senior' }
    );
    allProfiles.push(...engineeringProfiles);
    
    // Search 2: Sales & Revenue Leadership (with decision maker priority)
    console.log('💰 Search 2: Sales & Revenue Leadership');
    const salesProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['sales', 'revenue', 'business development', 'commercial'],
      ['vp', 'director', 'head of', 'senior', 'manager'],
      'Sales & Revenue Leadership',
      { prioritizeDecisionMakers: true, managementLevel: 'senior' }
    );
    allProfiles.push(...salesProfiles);
    
    // Search 3: Operations & Finance (with decision maker priority)
    console.log('⚙️ Search 3: Operations & Finance');
    const operationsProfiles = await this.searchByDepartmentAndRole(
      companyId,
      ['operations', 'finance', 'procurement', 'legal', 'compliance'],
      ['vp', 'director', 'head of', 'manager'],
      'Operations & Finance',
      { prioritizeDecisionMakers: true, managementLevel: 'senior' }
    );
    allProfiles.push(...operationsProfiles);
    
    // Search 4: C-Level & Executive (decision makers only)
    console.log('👔 Search 4: C-Level & Executive');
    const executiveProfiles = await this.searchByTitles(
      companyId,
      ['CEO', 'CTO', 'CFO', 'COO', 'CMO', 'President', 'Founder'],
      'C-Level & Executive',
      { decisionMakersOnly: true }
    );
    allProfiles.push(...executiveProfiles);
    
    // Search 5: High-Value Decision Makers (salary + authority)
    console.log('💎 Search 5: High-Value Decision Makers');
    const highValueProfiles = await this.searchHighValueDecisionMakers(companyId);
    allProfiles.push(...highValueProfiles);
    
    // Remove duplicates and limit
    const uniqueProfiles = this.removeDuplicates(allProfiles);
    const limitedProfiles = uniqueProfiles.slice(0, limit);
    
    console.log(`✅ Total unique profiles found: ${uniqueProfiles.length}`);
    console.log(`📊 Profiles to analyze: ${limitedProfiles.length}`);
    console.log('');
    
    this.results.stats.totalCredits += 5; // 5 searches * 1 credit each
    
    return limitedProfiles;
  }

  /**
   * 🎯 FIND COMPANY BY EXISTING CORESIGNAL ID
   */
  async findCompanyByCoreSignalID() {
    console.log('🎯 STEP 2.5: Finding Company by Existing CoreSignal ID');
    console.log('─'.repeat(50));
    
    // Get company name from command line args
    const companyName = getArg('--company') || 'Dell Technologies';
    
    // Find company in our database with CoreSignal data
    const company = await prisma.companies.findFirst({
      where: {
        name: {
          contains: companyName,
          mode: 'insensitive'
        },
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
      return { success: false, reason: 'Company not found in our database with CoreSignal ID' };
    }
    
    const coresignalData = company.customFields?.coresignalData;
    const coresignalId = coresignalData?.id;
    const coresignalName = coresignalData?.company_name;
    
    console.log(`✅ Found company in database: ${company.name}`);
    console.log(`   Database ID: ${company.id}`);
    console.log(`   CoreSignal ID: ${coresignalId}`);
    console.log(`   CoreSignal Name: ${coresignalName}`);
    console.log(`   Website: ${company.website || 'N/A'}`);
    console.log(`   Industry: ${coresignalData?.company_industry || 'N/A'}`);
    console.log(`   Employees: ${coresignalData?.employees_count || 'N/A'}`);
    
    // No API calls needed - we already have the data!
    console.log(`💰 Credits used: 0 (using existing data)`);
    
    return {
      success: true,
      companyId: coresignalId,
      companyName: coresignalName,
      website: company.website,
      industry: coresignalData?.company_industry,
      employeesCount: coresignalData?.employees_count,
      coresignalData: coresignalData
    };
  }

  /**
   * 🔍 SEARCH COMPANY BY WEBSITE
   */
  async searchCompanyByWebsite(website) {
    const normalizedWebsite = this.normalizeWebsite(website);
    
    const searchQuery = {
      query: {
        bool: {
          should: [
            { match: { 'company_website': normalizedWebsite } },
            { match_phrase: { 'company_website': normalizedWebsite } },
            { match: { 'company_website': this.extractDomain(normalizedWebsite) } },
            { match_phrase: { 'company_website': this.extractDomain(normalizedWebsite) } }
          ],
          minimum_should_match: 1
        }
      }
    };

    try {
      const response = await this.callCoreSignalAPI('/company_multi_source/search/es_dsl', searchQuery, 'POST');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.log(`   ❌ Website search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * 📊 GET COMPANY DATA
   */
  async getCompanyData(companyId) {
    try {
      const response = await this.callCoreSignalAPI(`/company_multi_source/collect/${companyId}`, null, 'GET');
      return response && response.company_id ? response : null;
    } catch (error) {
      console.log(`   ❌ Company data collection failed: ${error.message}`);
      return null;
    }
  }

  /**
   * 🔍 SEARCH BY DEPARTMENT AND ROLE
   */
  async searchByDepartmentAndRole(companyId, departments, roles, searchName, options = {}) {
    const searchQuery = {
      query: {
        bool: {
          must: [
            // CRITICAL: Company-specific filtering
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
                            // Department filters
                            ...departments.map(dept => ({ match: { 'experience.department': dept } })),
                            ...departments.map(dept => ({ match: { 'experience.company_department': dept } })),
                            // Role/Title filters
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

    // Add decision maker priority if requested
    if (options.prioritizeDecisionMakers) {
      searchQuery.query.bool.must.push({ term: { 'is_decision_maker': 1 } });
    }

    // Add management level filtering
    if (options.managementLevel) {
      searchQuery.query.bool.must.push({ 
        term: { 'management_level': options.managementLevel } 
      });
    }

    try {
      const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', searchQuery, 'POST');
      const employeeIds = Array.isArray(response) ? response : [];
      
      console.log(`   Found ${employeeIds.length} ${searchName} employee IDs`);
      
      // Collect detailed profiles for the first few IDs
      const profiles = [];
      const collectLimit = Math.min(5, employeeIds.length); // Limit to 5 per search
      
      for (let i = 0; i < collectLimit; i++) {
        try {
          const profile = await this.collectEmployeeProfile(employeeIds[i]);
          if (profile) {
            profiles.push(profile);
          }
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${employeeIds[i]}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected ${profiles.length} detailed profiles`);
      this.results.stats.totalCredits += profiles.length * 2; // 2 credits per profile
      
      return profiles;
      
    } catch (error) {
      console.log(`   ⚠️ ${searchName} search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * 🔍 SEARCH BY TITLES
   */
  async searchByTitles(companyId, titles, searchName, options = {}) {
    const searchQuery = {
      query: {
        bool: {
          must: [
            // CRITICAL: Company-specific filtering
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
                            // Title filters
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

    // Add decision makers only filter if requested
    if (options.decisionMakersOnly) {
      searchQuery.query.bool.must.push({ term: { 'is_decision_maker': 1 } });
    }

    try {
      const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', searchQuery, 'POST');
      const employeeIds = Array.isArray(response) ? response : [];
      
      console.log(`   Found ${employeeIds.length} ${searchName} employee IDs`);
      
      // Collect detailed profiles for the first few IDs
      const profiles = [];
      const collectLimit = Math.min(5, employeeIds.length); // Limit to 5 per search
      
      for (let i = 0; i < collectLimit; i++) {
        try {
          const profile = await this.collectEmployeeProfile(employeeIds[i]);
          if (profile) {
            profiles.push(profile);
          }
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${employeeIds[i]}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected ${profiles.length} detailed profiles`);
      this.results.stats.totalCredits += profiles.length * 2; // 2 credits per profile
      
      return profiles;
      
    } catch (error) {
      console.log(`   ⚠️ ${searchName} search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * 💎 SEARCH HIGH-VALUE DECISION MAKERS
   */
  async searchHighValueDecisionMakers(companyId) {
    const searchQuery = {
      query: {
        bool: {
          must: [
            // CRITICAL: Company-specific filtering
            { term: { 'active_experience_company_id': companyId } },
            { term: { 'is_decision_maker': 1 } },
            { term: { 'management_level': 'senior' } },
            {
              range: {
                'salary_range_min': { gte: 150000 } // High salary threshold
              }
            }
          ]
        }
      }
    };

    try {
      const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', searchQuery, 'POST');
      const employeeIds = Array.isArray(response) ? response : [];
      
      console.log(`   Found ${employeeIds.length} high-value decision maker employee IDs`);
      
      // Collect detailed profiles for the first few IDs
      const profiles = [];
      const collectLimit = Math.min(3, employeeIds.length); // Limit to 3 for high-value search
      
      for (let i = 0; i < collectLimit; i++) {
        try {
          const profile = await this.collectEmployeeProfile(employeeIds[i]);
          if (profile) {
            profiles.push(profile);
          }
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${employeeIds[i]}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected ${profiles.length} high-value profiles`);
      this.results.stats.totalCredits += profiles.length * 2; // 2 credits per profile
      
      return profiles;
      
    } catch (error) {
      console.log(`   ⚠️ High-value search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * 🔄 REMOVE DUPLICATES
   */
  removeDuplicates(profiles) {
    const seen = new Set();
    return profiles.filter(profile => {
      const key = profile.id || profile.full_name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 📊 ANALYZE PROFILES WITH BUYER GROUP CONSTRAINTS
   */
  analyzeProfiles(profiles) {
    console.log('📊 STEP 4: Analyzing Profiles');
    console.log('─'.repeat(40));
    
    const buyerGroup = {
      decisionMakers: [],
      champions: [],
      influencers: [],
      stakeholders: [],
      blockers: [],
      introducers: []
    };

    // First pass: Assign roles to all profiles
    for (const profile of profiles) {
      const role = this.determineRole(profile);
      if (role && buyerGroup[role.role]) {
        buyerGroup[role.role].push(role);
      }
    }

    // Apply buyer group constraints
    const finalBuyerGroup = this.applyBuyerGroupConstraints(buyerGroup);

    console.log(`✅ Analyzed ${profiles.length} profiles`);
    console.log(`🎯 Final Buyer Group: ${Object.values(finalBuyerGroup).flat().length} people`);
    console.log(`   Decision Makers: ${finalBuyerGroup.decisionMakers.length}`);
    console.log(`   Champions: ${finalBuyerGroup.champions.length}`);
    console.log(`   Influencers: ${finalBuyerGroup.influencers.length}`);
    console.log(`   Stakeholders: ${finalBuyerGroup.stakeholders.length}`);
    console.log(`   Blockers: ${finalBuyerGroup.blockers.length}`);
    console.log(`   Introducers: ${finalBuyerGroup.introducers.length}`);
    console.log('');

    this.results.profiles = profiles;
    this.results.buyerGroup = finalBuyerGroup;
    
    return finalBuyerGroup;
  }

  /**
   * 🎯 APPLY BUYER GROUP CONSTRAINTS
   */
  applyBuyerGroupConstraints(buyerGroup) {
    const constraints = {
      maxTotal: 25,
      minDecisionMakers: 1,
      idealDecisionMakers: { min: 2, max: 4 },
      idealChampions: { min: 1, max: 2 },
      idealInfluencers: { min: 0, max: 0 }, // Not used in your spec
      idealStakeholders: { min: 3, max: 4 },
      idealBlockers: { min: 0, max: 3 },
      idealIntroducers: { min: 0, max: 2 }
    };

    console.log('🎯 Applying Buyer Group Constraints:');
    console.log(`   Max Total: ${constraints.maxTotal}`);
    console.log(`   Min Decision Makers: ${constraints.minDecisionMakers}`);
    console.log('');

    // CRITICAL: Must have at least 1 Decision Maker
    if (buyerGroup.decisionMakers.length === 0) {
      console.log('❌ ERROR: No Decision Makers found!');
      console.log('   This buyer group is invalid - must have at least 1 Decision Maker');
      return {
        decisionMakers: [],
        champions: [],
        influencers: [],
        stakeholders: [],
        blockers: [],
        introducers: []
      };
    }

    // Create final buyer group with constraints
    const finalBuyerGroup = {
      decisionMakers: buyerGroup.decisionMakers.slice(0, constraints.idealDecisionMakers.max),
      champions: buyerGroup.champions.slice(0, constraints.idealChampions.max),
      influencers: buyerGroup.influencers.slice(0, constraints.idealInfluencers.max),
      stakeholders: buyerGroup.stakeholders.slice(0, constraints.idealStakeholders.max),
      blockers: buyerGroup.blockers.slice(0, constraints.idealBlockers.max),
      introducers: buyerGroup.introducers.slice(0, constraints.idealIntroducers.max)
    };

    // Check total size constraint
    const totalMembers = Object.values(finalBuyerGroup).flat().length;
    if (totalMembers > constraints.maxTotal) {
      console.log(`⚠️ WARNING: Buyer group has ${totalMembers} members (max: ${constraints.maxTotal})`);
      console.log('   Truncating to meet size constraints...');
      
      // Truncate by priority: Decision Makers > Champions > Influencers > Others
      const allMembers = [
        ...finalBuyerGroup.decisionMakers,
        ...finalBuyerGroup.champions,
        ...finalBuyerGroup.influencers,
        ...finalBuyerGroup.stakeholders,
        ...finalBuyerGroup.blockers,
        ...finalBuyerGroup.introducers
      ];
      
      const truncatedMembers = allMembers.slice(0, constraints.maxTotal);
      
      // Rebuild buyer group from truncated list
      const rebuiltBuyerGroup = {
        decisionMakers: [],
        champions: [],
        influencers: [],
        stakeholders: [],
        blockers: [],
        introducers: []
      };
      
      for (const member of truncatedMembers) {
        if (rebuiltBuyerGroup[member.role]) {
          rebuiltBuyerGroup[member.role].push(member);
        }
      }
      
      return rebuiltBuyerGroup;
    }

    console.log(`✅ Buyer group constraints applied successfully`);
    console.log(`   Total members: ${totalMembers}`);
    console.log(`   Decision Makers: ${finalBuyerGroup.decisionMakers.length} (required: ${constraints.minDecisionMakers})`);
    console.log('');

    return finalBuyerGroup;
  }

  /**
   * 🎯 DETERMINE ROLE FOR PROFILE
   */
  determineRole(profile) {
    // Handle different profile structures
    const title = (profile.active_experience_title || profile.title || '').toLowerCase();
    const department = (profile.active_experience_department || profile.department || '').toLowerCase();
    const fullName = profile.full_name || profile.name || 'Unknown';
    const isDecisionMaker = profile.is_decision_maker === 1;
    
    console.log(`   Analyzing: ${fullName} - ${title} (${department}) - Decision Maker: ${isDecisionMaker}`);
    
    // PRIORITY 1: Use CoreSignal's decision maker flag
    if (isDecisionMaker) {
      return {
        role: 'decisionMakers',
        profile: { ...profile, full_name: fullName },
        confidence: 0.95,
        reasoning: 'CoreSignal decision maker flag'
      };
    }
    
    // PRIORITY 2: Decision Makers by title patterns (multilingual)
    const decisionMakerPatterns = [
      'ceo', 'cto', 'cfo', 'coo', 'cmo', 'president', 'founder',
      'vp', 'vice president', 'director', 'head of', 'chief',
      'lead', 'manager', 'owner', 'proprietario', 'propietario'
    ];
    
    if (decisionMakerPatterns.some(pattern => title.includes(pattern))) {
      return {
        role: 'decisionMakers',
        profile: { ...profile, full_name: fullName },
        confidence: 0.9,
        reasoning: 'High authority title pattern'
      };
    }
    
    // PRIORITY 3: Champions by technical patterns
    const championPatterns = [
      'engineer', 'developer', 'architect', 'scientist', 'analyst',
      'senior', 'lead', 'principal', 'elektiker', 'technician'
    ];
    
    if (championPatterns.some(pattern => title.includes(pattern)) ||
        department.includes('engineering') || department.includes('software') || 
        department.includes('technology') || department.includes('product')) {
      return {
        role: 'champions',
        profile: { ...profile, full_name: fullName },
        confidence: 0.8,
        reasoning: 'Technical expert pattern'
      };
    }
    
    // PRIORITY 4: Influencers by business patterns
    const influencerPatterns = [
      'sales', 'marketing', 'business', 'commercial', 'customer',
      'insights', 'strategy', 'growth', 'development'
    ];
    
    if (influencerPatterns.some(pattern => title.includes(pattern)) ||
        department.includes('sales') || department.includes('marketing') || 
        department.includes('business development')) {
      return {
        role: 'influencers',
        profile: { ...profile, full_name: fullName },
        confidence: 0.7,
        reasoning: 'Business influencer pattern'
      };
    }
    
    // PRIORITY 5: Blockers by gatekeeper patterns
    const blockerPatterns = [
      'legal', 'compliance', 'procurement', 'security', 'finance',
      'audit', 'risk', 'governance', 'regulatory'
    ];
    
    if (blockerPatterns.some(pattern => title.includes(pattern)) ||
        department.includes('legal') || department.includes('compliance') || 
        department.includes('procurement') || department.includes('security')) {
      return {
        role: 'blockers',
        profile: { ...profile, full_name: fullName },
        confidence: 0.6,
        reasoning: 'Potential gatekeeper pattern'
      };
    }
    
    // PRIORITY 6: Introducers by network patterns
    const introducerPatterns = [
      'partnership', 'alliance', 'relationship', 'network', 'community',
      'external', 'vendor', 'partner', 'liaison'
    ];
    
    if (introducerPatterns.some(pattern => title.includes(pattern))) {
      return {
        role: 'introducers',
        profile: { ...profile, full_name: fullName },
        confidence: 0.6,
        reasoning: 'Network connector pattern'
      };
    }
    
    // DEFAULT: Stakeholders
    return {
      role: 'stakeholders',
      profile: { ...profile, full_name: fullName },
      confidence: 0.5,
      reasoning: 'General stakeholder'
    };
  }

  /**
   * 📊 COLLECT EMPLOYEE PROFILE
   */
  async collectEmployeeProfile(employeeId) {
    const url = `${CORESIGNAL_BASE_URL}/employee_multi_source/collect/${employeeId}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': CORESIGNAL_API_KEY
    };

    try {
      const response = await fetch(url, { method: 'GET', headers });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error collecting profile ${employeeId}:`, error);
    }
    return null;
  }

  /**
   * 🔧 CALL CORESIGNAL API
   */
  async callCoreSignalAPI(endpoint, data, method = 'POST') {
    const url = `${CORESIGNAL_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': CORESIGNAL_API_KEY
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`CoreSignal API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CoreSignal API error:', error);
      throw error;
    }
  }

  /**
   * 🌐 NORMALIZE WEBSITE URL
   */
  normalizeWebsite(website) {
    if (!website) return '';
    
    // Remove trailing slashes
    let normalized = website.replace(/\/+$/, '');
    
    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }

  /**
   * 🌐 EXTRACT DOMAIN FROM WEBSITE
   */
  extractDomain(website) {
    try {
      const url = new URL(website);
      return url.hostname.replace(/^www\./, ''); // Remove www. prefix
    } catch (error) {
      // If URL parsing fails, try simple string extraction
      const match = website.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      return match ? match[1] : website;
    }
  }

  /**
   * 🎭 GENERATE MOCK PROFILES FOR TESTING
   */
  generateMockProfiles(count) {
    const mockProfiles = [];
    const titles = [
      'CEO', 'CTO', 'VP Engineering', 'Director of Product', 'Senior Software Engineer',
      'VP Sales', 'Marketing Director', 'Business Development Manager', 'Legal Counsel',
      'Procurement Manager', 'Finance Director', 'HR Manager', 'Data Scientist', 'Product Manager'
    ];
    
    const departments = [
      'Engineering', 'Sales', 'Marketing', 'Product', 'Legal', 'Finance', 'HR', 'Data Science'
    ];

    for (let i = 0; i < count; i++) {
      mockProfiles.push({
        id: 1000000 + i,
        full_name: `Test Person ${i + 1}`,
        active_experience_title: titles[i % titles.length],
        active_experience_department: departments[i % departments.length],
        active_experience_company_id: 12345,
        is_decision_maker: Math.random() > 0.7 ? 1 : 0
      });
    }

    return mockProfiles;
  }

  /**
   * 📊 GENERATE TEST REPORT
   */
  generateTestReport(companyName, buyerGroup) {
    const totalMembers = Object.values(buyerGroup).flat().length;
    
    console.log('📊 TEST REPORT');
    console.log('==============');
    console.log(`Company: ${companyName}`);
    console.log(`Total Members: ${totalMembers}`);
    console.log(`Decision Makers: ${buyerGroup.decisionMakers.length}`);
    console.log(`Champions: ${buyerGroup.champions.length}`);
    console.log(`Influencers: ${buyerGroup.influencers.length}`);
    console.log(`Stakeholders: ${buyerGroup.stakeholders.length}`);
    console.log(`Blockers: ${buyerGroup.blockers.length}`);
    console.log(`Introducers: ${buyerGroup.introducers.length}`);
    console.log(`Total Credits Used: ${this.results.stats.totalCredits}`);
    console.log('');

    // Show sample profiles
    console.log('📋 SAMPLE PROFILES:');
    this.results.profiles.slice(0, 5).forEach((profile, index) => {
      const name = profile.full_name || profile.name || 'Unknown';
      const title = profile.active_experience_title || profile.title || 'Unknown Title';
      console.log(`${index + 1}. ${name} - ${title}`);
    });
    console.log('');

    return {
      company: companyName,
      totalMembers: totalMembers,
      buyerGroup: buyerGroup,
      creditsUsed: this.results.stats.totalCredits
    };
  }
}

// Main execution
async function main() {
  const company = getArg('--company') || 'Dell Technologies';
  const workspace = getArg('--workspace') || 'TOP';
  const limit = parseInt(getArg('--limit') || '20', 10);

  const test = new SmartBuyerGroupTest();
  const report = await test.testBuyerGroupDiscovery(company, workspace, limit);
  
  console.log('✅ Smart Buyer Group Test Complete!');
  if (report && report.buyerGroup) {
    console.log(`📊 Found ${Object.values(report.buyerGroup).flat().length} buyer group members`);
    console.log(`💰 Total cost: ${report.creditsUsed} credits`);
  } else {
    console.log('📊 Test completed successfully');
  }
}

// Run the test
main().catch((err) => {
  console.error('❌ Error:', err && err.message ? err.message : err);
  process.exit(1);
});
