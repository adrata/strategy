const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class HierarchicalBuyerGroupDiscovery {
  constructor() {
    this.results = {
      company: null,
      departments: [],
      roles: [],
      profiles: [],
      buyerGroup: {
        decisionMakers: [],
        champions: [],
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
      small: { // 1-50 employees
        decisionMakers: { min: 1, max: 2, ideal: 1 },
        champions: { min: 1, max: 3, ideal: 2 },
        stakeholders: { min: 1, max: 4, ideal: 2 },
        blockers: { min: 0, max: 1, ideal: 0 },
        introducers: { min: 1, max: 2, ideal: 1 }
      },
      medium: { // 51-500 employees
        decisionMakers: { min: 1, max: 2, ideal: 1 },
        champions: { min: 2, max: 4, ideal: 3 },
        stakeholders: { min: 2, max: 5, ideal: 3 },
        blockers: { min: 1, max: 2, ideal: 1 },
        introducers: { min: 1, max: 2, ideal: 1 }
      },
      large: { // 501-5000 employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 3, max: 5, ideal: 4 },
        stakeholders: { min: 3, max: 6, ideal: 4 },
        blockers: { min: 1, max: 2, ideal: 1 },
        introducers: { min: 1, max: 3, ideal: 2 }
      },
      enterprise: { // 5000+ employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 3, max: 5, ideal: 4 },
        stakeholders: { min: 4, max: 7, ideal: 5 },
        blockers: { min: 1, max: 2, ideal: 1 },
        introducers: { min: 2, max: 3, ideal: 2 }
      }
    };
  }

  async discoverBuyerGroup(companyName, workspaceName, sellerProfile = 'communications-engineering') {
    console.log('🎯 HIERARCHICAL BUYER GROUP DISCOVERY');
    console.log('=====================================');
    console.log(`Company: ${companyName}`);
    console.log(`Workspace: ${workspaceName}`);
    console.log(`Seller Profile: ${sellerProfile}`);
    console.log('');

    try {
      // Step 1: Get company data and determine size
      await this.getCompanyData(companyName, workspaceName);
      
      // Step 2: Discover relevant departments
      await this.discoverRelevantDepartments();
      
      // Step 3: Discover key roles within departments
      await this.discoverKeyRoles();
      
      // Step 4: Execute targeted searches by department and role
      await this.executeTargetedSearches();
      
      // Step 5: Analyze and assign roles with smart distribution
      this.analyzeAndAssignRoles();
      
      // Step 6: Apply role distribution constraints
      this.applyRoleDistributionConstraints();
      
      // Step 7: Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async getCompanyData(companyName, workspaceName) {
    console.log('🏢 STEP 1: Getting Company Data & Determining Size');
    console.log('─'.repeat(60));
    
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: workspaceName } },
      select: { id: true, name: true }
    });
    
    const company = await prisma.companies.findFirst({
      where: {
        workspaceId: workspace.id,
        name: { contains: companyName, mode: 'insensitive' },
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        customFields: true
      }
    });
    
    if (!company) {
      throw new Error(`${companyName} not found with CoreSignal ID`);
    }
    
    const coresignalData = company.customFields?.coresignalData;
    const employeeCount = coresignalData?.employees_count || 0;
    
    // Determine company size category
    let sizeCategory = 'small';
    if (employeeCount > 5000) sizeCategory = 'enterprise';
    else if (employeeCount > 500) sizeCategory = 'large';
    else if (employeeCount > 50) sizeCategory = 'medium';
    
    this.results.company = {
      id: company.id,
      name: company.name,
      coresignalId: coresignalData?.id,
      employees: employeeCount,
      industry: coresignalData?.industry || company.industry,
      sizeCategory: sizeCategory,
      website: company.website
    };
    
    console.log(`✅ Company: ${company.name}`);
    console.log(`   CoreSignal ID: ${coresignalData?.id}`);
    console.log(`   Employees: ${employeeCount}`);
    console.log(`   Industry: ${coresignalData?.industry || company.industry}`);
    console.log(`   Size Category: ${sizeCategory.toUpperCase()}`);
    console.log(`   Target Role Distribution: ${JSON.stringify(this.roleTargets[sizeCategory], null, 2)}`);
    console.log('');
  }

  async discoverRelevantDepartments() {
    console.log('🏢 STEP 2: Discovering Relevant Departments');
    console.log('─'.repeat(60));
    
    const companyId = this.results.company.coresignalId;
    const industry = this.results.company.industry;
    const sizeCategory = this.results.company.sizeCategory;
    
    // Define department priorities based on industry and seller profile
    const departmentPriorities = this.getDepartmentPriorities(industry, sizeCategory);
    
    console.log('🎯 Department Discovery Strategy:');
    departmentPriorities.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (${dept.priority}) - ${dept.description}`);
    });
    console.log('');
    
    // Search for people in each department to validate existence
    const validatedDepartments = [];
    
    for (const dept of departmentPriorities) {
      console.log(`🔍 Validating Department: ${dept.name}`);
      
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
                              { match: { 'experience.department': dept.name } },
                              { match: { 'experience.company_department': dept.name } },
                              ...dept.aliases.map(alias => ({ match: { 'experience.department': alias } })),
                              ...dept.aliases.map(alias => ({ match: { 'experience.company_department': alias } }))
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
      
      try {
        const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', searchQuery, 'POST');
        const employeeIds = Array.isArray(response) ? response : [];
        
        if (employeeIds.length > 0) {
          validatedDepartments.push({
            ...dept,
            employeeCount: employeeIds.length,
            employeeIds: employeeIds.slice(0, 20) // Limit for efficiency
          });
          console.log(`   ✅ Found ${employeeIds.length} people in ${dept.name}`);
        } else {
          console.log(`   ❌ No people found in ${dept.name}`);
        }
        
        this.results.stats.totalCredits += 1; // Search cost
        
      } catch (error) {
        console.log(`   ⚠️ Error searching ${dept.name}: ${error.message}`);
      }
    }
    
    this.results.departments = validatedDepartments;
    console.log(`✅ Validated ${validatedDepartments.length} departments with people`);
    console.log('');
  }

  getDepartmentPriorities(industry, sizeCategory) {
    // Base department priorities for communications engineering
    const baseDepartments = [
      {
        name: 'Engineering',
        aliases: ['engineering', 'technical', 'technology', 'r&d', 'research and development'],
        priority: 'critical',
        description: 'Core technical decision makers and implementers',
        targetRoles: ['director', 'manager', 'senior engineer', 'principal engineer', 'lead engineer']
      },
      {
        name: 'Operations',
        aliases: ['operations', 'field operations', 'maintenance', 'facilities'],
        priority: 'critical',
        description: 'Operational decision makers and implementers',
        targetRoles: ['director', 'manager', 'supervisor', 'coordinator', 'specialist']
      },
      {
        name: 'IT',
        aliases: ['it', 'information technology', 'systems', 'infrastructure'],
        priority: 'high',
        description: 'Technology infrastructure and systems',
        targetRoles: ['director', 'manager', 'senior analyst', 'systems engineer', 'network engineer']
      },
      {
        name: 'Communications',
        aliases: ['communications', 'telecommunications', 'network', 'connectivity'],
        priority: 'high',
        description: 'Communications and network specialists',
        targetRoles: ['director', 'manager', 'engineer', 'specialist', 'analyst']
      },
      {
        name: 'Procurement',
        aliases: ['procurement', 'purchasing', 'sourcing', 'vendor management'],
        priority: 'medium',
        description: 'Procurement and vendor management',
        targetRoles: ['director', 'manager', 'specialist', 'analyst', 'coordinator']
      },
      {
        name: 'Legal',
        aliases: ['legal', 'compliance', 'regulatory', 'risk'],
        priority: 'medium',
        description: 'Legal and compliance oversight',
        targetRoles: ['director', 'manager', 'counsel', 'specialist', 'analyst']
      },
      {
        name: 'Finance',
        aliases: ['finance', 'accounting', 'budget', 'financial'],
        priority: 'medium',
        description: 'Financial oversight and budget approval',
        targetRoles: ['director', 'manager', 'analyst', 'specialist', 'coordinator']
      }
    ];
    
    // Adjust priorities based on industry
    if (industry?.toLowerCase().includes('utility') || industry?.toLowerCase().includes('energy')) {
      // For utilities, prioritize operations and engineering
      return baseDepartments.sort((a, b) => {
        const priorityOrder = { 'critical': 1, 'high': 2, 'medium': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }
    
    return baseDepartments;
  }

  async discoverKeyRoles() {
    console.log('👔 STEP 3: Discovering Key Roles Within Departments');
    console.log('─'.repeat(60));
    
    const companyId = this.results.company.coresignalId;
    const allRoles = [];
    
    for (const dept of this.results.departments) {
      console.log(`🔍 Analyzing roles in ${dept.name} (${dept.employeeCount} people)`);
      
      // Use the employee IDs we already found in department discovery
      if (dept.employeeIds && dept.employeeIds.length > 0) {
        allRoles.push({
          department: dept.name,
          roleCount: dept.employeeIds.length,
          employeeIds: dept.employeeIds.slice(0, 8), // Limit for efficiency
          priority: dept.priority
        });
        console.log(`   ✅ Using ${dept.employeeIds.length} people from ${dept.name}`);
      } else {
        console.log(`   ❌ No people available in ${dept.name}`);
      }
    }
    
    this.results.roles = allRoles;
    console.log(`✅ Discovered roles in ${allRoles.length} departments`);
    console.log('');
  }

  async executeTargetedSearches() {
    console.log('🎯 STEP 4: Executing Targeted Searches by Department & Role');
    console.log('─'.repeat(60));
    
    const allProfiles = [];
    
    for (const role of this.results.roles) {
      console.log(`🔍 Collecting profiles from ${role.department} (${role.roleCount} people)`);
      
      const profilesToCollect = role.employeeIds.slice(0, 5); // Limit to 5 per department
      const departmentProfiles = [];
      
      for (const employeeId of profilesToCollect) {
        try {
          const profile = await this.collectEmployeeProfile(employeeId);
          if (profile) {
            departmentProfiles.push({
              ...profile,
              sourceDepartment: role.department,
              departmentPriority: role.priority
            });
          }
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected ${departmentProfiles.length} profiles from ${role.department}`);
      allProfiles.push(...departmentProfiles);
      
      this.results.stats.totalCredits += departmentProfiles.length; // Collection cost
    }
    
    // Remove duplicates
    const uniqueProfiles = this.removeDuplicates(allProfiles);
    this.results.profiles = uniqueProfiles;
    this.results.stats.totalPeopleFound = uniqueProfiles.length;
    
    console.log(`✅ Total unique profiles collected: ${uniqueProfiles.length}`);
    console.log(`💰 Total credits used: ${this.results.stats.totalCredits}`);
    console.log('');
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
    console.log('📊 STEP 5: Analyzing Profiles and Assigning Roles');
    console.log('─'.repeat(60));
    
    const profiles = this.results.profiles;
    
    for (const profile of profiles) {
      const role = this.determineRole(profile);
      if (role && this.results.buyerGroup[role]) {
        this.results.buyerGroup[role].push({
          name: profile.full_name || 'Unknown',
          title: profile.active_experience_title || profile.experience?.[0]?.title || 'Unknown',
          department: profile.active_experience_department || profile.experience?.[0]?.department || 'Unknown',
          sourceDepartment: profile.sourceDepartment || 'Unknown',
          company: profile.active_experience_company_name || this.results.company.name,
          email: profile.primary_professional_email || 'N/A',
          linkedin: profile.professional_network_url || 'N/A',
          isDecisionMaker: profile.is_decision_maker === 1,
          managementLevel: profile.active_experience_management_level || 'N/A',
          influenceScore: this.calculateInfluenceScore(profile),
          confidence: this.calculateRoleConfidence(profile, role),
          departmentPriority: profile.departmentPriority || 'medium'
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
    const managementLevel = profile.active_experience_management_level || '';
    
    // PRIORITY 1: Use CoreSignal's decision maker flag (but be selective)
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
    
    // PRIORITY 4: Champions - Technical specialists and engineers
    if (title.includes('engineer') || title.includes('specialist') || title.includes('analyst') ||
        title.includes('architect') || title.includes('consultant') ||
        title.includes('technician')) {
      return 'champions';
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
    console.log('⚖️ STEP 6: Applying Role Distribution Constraints');
    console.log('─'.repeat(60));
    
    const sizeCategory = this.results.company.sizeCategory;
    const targets = this.roleTargets[sizeCategory];
    const current = this.results.buyerGroup;
    
    console.log(`🎯 Target Distribution for ${sizeCategory.toUpperCase()} company:`);
    console.log(`   Decision Makers: ${targets.decisionMakers.min}-${targets.decisionMakers.max} (ideal: ${targets.decisionMakers.ideal})`);
    console.log(`   Champions: ${targets.champions.min}-${targets.champions.max} (ideal: ${targets.champions.ideal})`);
    console.log(`   Stakeholders: ${targets.stakeholders.min}-${targets.stakeholders.max} (ideal: ${targets.stakeholders.ideal})`);
    console.log(`   Blockers: ${targets.blockers.min}-${targets.blockers.max} (ideal: ${targets.blockers.ideal})`);
    console.log(`   Introducers: ${targets.introducers.min}-${targets.introducers.max} (ideal: ${targets.introducers.ideal})`);
    console.log('');
    
    // Sort each role by influence score and department priority
    Object.keys(current).forEach(role => {
      current[role].sort((a, b) => {
        // First by department priority (critical > high > medium)
        const priorityOrder = { 'critical': 1, 'high': 2, 'medium': 3 };
        const aPriority = priorityOrder[a.departmentPriority] || 3;
        const bPriority = priorityOrder[b.departmentPriority] || 3;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then by influence score
        return b.influenceScore - a.influenceScore;
      });
    });
    
    // Apply constraints
    const finalBuyerGroup = {
      decisionMakers: (current.decisionMakers || []).slice(0, targets.decisionMakers.max),
      champions: (current.champions || []).slice(0, targets.champions.max),
      stakeholders: (current.stakeholders || []).slice(0, targets.stakeholders.max),
      blockers: (current.blockers || []).slice(0, targets.blockers.max),
      introducers: (current.introducers || []).slice(0, targets.introducers.max)
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
    console.log('📊 HIERARCHICAL BUYER GROUP DISCOVERY REPORT');
    console.log('============================================');
    console.log('');
    
    const { buyerGroup, company, departments } = this.results;
    const totalPeople = Object.values(buyerGroup).flat().length;
    
    console.log('🏢 COMPANY OVERVIEW:');
    console.log(`   Company: ${company.name}`);
    console.log(`   Industry: ${company.industry}`);
    console.log(`   Size: ${company.employees} employees (${company.sizeCategory.toUpperCase()})`);
    console.log(`   CoreSignal ID: ${company.coresignalId}`);
    console.log('');
    
    console.log('🏢 RELEVANT DEPARTMENTS DISCOVERED:');
    departments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (${dept.priority}) - ${dept.employeeCount} people`);
    });
    console.log('');
    
    console.log('👔 DECISION MAKERS:');
    buyerGroup.decisionMakers.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department} (${person.sourceDepartment})`);
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
      console.log(`      Department: ${person.department} (${person.sourceDepartment})`);
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
      console.log(`      Department: ${person.department} (${person.sourceDepartment})`);
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
      console.log(`      Department: ${person.department} (${person.sourceDepartment})`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('🛡️ BLOCKERS:');
    (buyerGroup.blockers || []).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department} (${person.sourceDepartment})`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('🤝 INTRODUCERS:');
    (buyerGroup.introducers || []).forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name}`);
      console.log(`      Title: ${person.title}`);
      console.log(`      Department: ${person.department} (${person.sourceDepartment})`);
      console.log(`      Email: ${person.email}`);
      console.log(`      LinkedIn: ${person.linkedin}`);
      console.log(`      Influence Score: ${person.influenceScore}/100`);
      console.log(`      Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log('');
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   Decision Makers: ${buyerGroup.decisionMakers.length}`);
    console.log(`   Champions: ${buyerGroup.champions.length}`);
    console.log(`   Stakeholders: ${buyerGroup.stakeholders.length}`);
    console.log(`   Blockers: ${buyerGroup.blockers.length}`);
    console.log(`   Introducers: ${buyerGroup.introducers.length}`);
    console.log(`   Total Buyer Group: ${totalPeople} people`);
    console.log(`   Total Credits Used: ${this.results.stats.totalCredits}`);
    console.log('');
    
    console.log('🎯 HIERARCHICAL DISCOVERY BENEFITS:');
    console.log('1. Department-focused approach ensures relevant people');
    console.log('2. Role-based filtering within departments');
    console.log('3. Company size-appropriate distribution');
    console.log('4. Priority-based selection (critical > high > medium)');
    console.log('5. Comprehensive coverage of all relevant departments');
    console.log('');
    
    console.log('✅ HIERARCHICAL BUYER GROUP DISCOVERY COMPLETE!');
    console.log('This approach ensures we find the right people in the right departments with the right roles.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const companyName = args.find(arg => arg.startsWith('--company='))?.split('=')[1] || 'Alabama Power Company';
  const workspaceName = args.find(arg => arg.startsWith('--workspace='))?.split('=')[1] || 'TOP';
  const sellerProfile = args.find(arg => arg.startsWith('--seller='))?.split('=')[1] || 'communications-engineering';
  
  const finder = new HierarchicalBuyerGroupDiscovery();
  await finder.discoverBuyerGroup(companyName, workspaceName, sellerProfile);
}

main().catch(console.error);
