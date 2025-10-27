#!/usr/bin/env node

/**
 * Find Buyer Group - Complete Buying Committee Mapping Script
 * 
 * This script maps complete buying committees within target companies using
 * the Coresignal Employee Search Preview API to identify champions, decision makers,
 * stakeholders, blockers, and introducers through AI-powered hierarchy analysis.
 * 
 * Features:
 * - Comprehensive employee discovery using Preview API
 * - AI-powered organizational hierarchy analysis
 * - Buyer group role classification (5 core roles)
 * - Selective full profile collection
 * - Progress tracking and resumability
 * - Modern ES2024+ JavaScript best practices
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class BuyerGroupFinder {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    // Target company (required)
    this.targetCompanyId = options.targetCompanyId;
    this.targetCompanyLinkedInUrl = options.targetCompanyLinkedInUrl;
    
    // Discovery settings
    this.targetDepartments = options.targetDepartments || [
      'Sales and Business Development',
      'Marketing',
      'Product Management',
      'Operations',
      'Finance and Administration',
      'Legal and Compliance',
      'Engineering and Technical'
    ];
    
    // Buyer group composition targets
    this.buyerGroupTargets = {
      decision_maker: { min: 1, max: 3 },
      champion: { min: 2, max: 3 },
      stakeholder: { min: 2, max: 4 },
      blocker: { min: 1, max: 2 },
      introducer: { min: 2, max: 3 }
    };
    
    this.totalBuyerGroupSize = { min: 8, max: 15 };
    
    // AI settings
    this.useAI = options.useAI ?? true;
    this.analysisParallelism = options.analysisParallelism || 3;
    
    // API settings
    this.maxPreviewPages = options.maxPreviewPages || 20; // 200 employees
    this.previewPageSize = 10; // Fixed by Coresignal
    
    // Processing settings
    this.delayBetweenRequests = 1000; // 1 second
    this.delayBetweenBatches = 3000; // 3 seconds
    this.batchSize = 10;
    this.progressFile = '_future_now/buyer-group-progress.json';
    
    this.results = {
      company: null,
      discoveryMetrics: {
        totalEmployeesFound: 0,
        departmentsSearched: 0,
        previewPagesProcessed: 0,
        fullProfilesCollected: 0
      },
      organizationalInsights: {
        hierarchyLevels: {},
        departmentSizes: {},
        keyInfluencers: []
      },
      buyerGroup: [],
      buyerGroupComposition: {
        decision_maker: 0,
        champion: 0,
        stakeholder: 0,
        blocker: 0,
        introducer: 0,
        total: 0
      },
      qualityMetrics: {
        coverage: 'unknown',
        confidence: 'unknown',
        geographic_focus: 'unknown',
        overall_score: 0
      },
      creditsUsed: {
        preview_search: 0,
        full_collect: 0,
        total: 0
      },
      errors: [],
      startTime: new Date().toISOString()
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }

    if (!this.targetCompanyLinkedInUrl && !this.targetCompanyId) {
      console.error('❌ Either targetCompanyLinkedInUrl or targetCompanyId must be provided');
      process.exit(1);
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log(`🎯 Starting Buyer Group Discovery`);
      console.log(`🏢 Target Company: ${this.targetCompanyLinkedInUrl || this.targetCompanyId}`);
      console.log(`📊 Target Departments: ${this.targetDepartments.length}`);
      console.log(`🤖 AI Analysis: ${this.useAI ? 'Enabled' : 'Disabled'}`);
      
      await this.loadProgress();
      
      // Step 1: Get company information
      await this.loadCompanyInfo();
      
      // Step 2: Discover all employees using Preview API
      const allEmployees = await this.discoverAllEmployees();
      console.log(`📊 Found ${allEmployees.length} employees across all departments`);
      
      if (allEmployees.length === 0) {
        console.log('❌ No employees found for target company');
        return;
      }
      
      // Step 3: AI Analysis Phase (Parallel Processing)
      console.log(`🧠 Analyzing organizational structure with AI...`);
      const organizationalAnalysis = await this.analyzeOrganizationalStructure(allEmployees);
      
      // Step 4: Role Classification
      console.log(`🎭 Classifying buyer group roles...`);
      const classifiedEmployees = await this.classifyBuyerGroupRoles(allEmployees, organizationalAnalysis);
      
      // Step 5: Select top buyer group members
      const buyerGroupMembers = this.selectBuyerGroupMembers(classifiedEmployees);
      console.log(`👥 Selected ${buyerGroupMembers.length} buyer group members`);
      
      // Step 6: Collect full profiles for buyer group
      const buyerGroupWithProfiles = await this.collectBuyerGroupProfiles(buyerGroupMembers);
      console.log(`📋 Collected ${buyerGroupWithProfiles.length} full profiles`);
      
      // Update results
      this.results.buyerGroup = buyerGroupWithProfiles;
      this.results.buyerGroupComposition = this.calculateBuyerGroupComposition(buyerGroupWithProfiles);
      this.results.qualityMetrics = this.calculateQualityMetrics(buyerGroupWithProfiles, allEmployees);
      
      // Save final progress
      await this.saveProgress();
      
      console.log(`✅ Buyer Group discovery completed successfully`);
      console.log(`📈 Results: ${buyerGroupWithProfiles.length} buyer group members mapped`);
      console.log(`💳 Credits Used: ${this.results.creditsUsed.preview_search} preview, ${this.results.creditsUsed.full_collect} collect`);
      
    } catch (error) {
      console.error('❌ Buyer Group discovery failed:', error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      await this.saveProgress();
      await this.prisma.$disconnect();
    }
  }

  /**
   * Load company information from database or API
   */
  async loadCompanyInfo() {
    if (this.targetCompanyId) {
      // Load from database
      const company = await this.prisma.companies.findUnique({
        where: { id: this.targetCompanyId }
      });
      
      if (company) {
        this.results.company = {
          id: company.id,
          name: company.name,
          linkedInUrl: company.customFields?.coresignalLinkedInUrl || company.website,
          industry: company.industry,
          employeeCount: company.employeeCount
        };
        this.targetCompanyLinkedInUrl = this.results.company.linkedInUrl;
      }
    }
    
    if (!this.targetCompanyLinkedInUrl) {
      throw new Error('Could not determine company LinkedIn URL');
    }
  }

  /**
   * Discover all employees using Preview API with pagination
   */
  async discoverAllEmployees() {
    const allEmployees = [];
    
    for (const department of this.targetDepartments) {
      console.log(`🔍 Discovering employees in ${department}...`);
      
      let page = 1;
      let hasMore = true;
      let departmentEmployees = [];
      
      while (hasMore && page <= this.maxPreviewPages) {
        try {
          const employees = await this.searchEmployeesByDepartment(department, page);
          
          if (employees.length > 0) {
            departmentEmployees.push(...employees);
            page++;
            this.results.discoveryMetrics.previewPagesProcessed++;
          } else {
            hasMore = false;
          }
          
          // Delay between pages
          await this.delay(this.delayBetweenRequests);
          
        } catch (error) {
          console.error(`❌ Failed to search page ${page} for ${department}:`, error.message);
          hasMore = false;
        }
      }
      
      console.log(`📊 Found ${departmentEmployees.length} employees in ${department}`);
      allEmployees.push(...departmentEmployees);
    }
    
    // Remove duplicates
    const uniqueEmployees = this.removeDuplicateEmployees(allEmployees);
    this.results.discoveryMetrics.totalEmployeesFound = uniqueEmployees.length;
    this.results.discoveryMetrics.departmentsSearched = this.targetDepartments.length;
    
    return uniqueEmployees;
  }

  /**
   * Search employees by department using Preview API
   */
  async searchEmployeesByDepartment(department, page = 1) {
    const searchQuery = {
      "query": {
        "bool": {
          "must": [
            {
              "nested": {
                "path": "experience",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "match": {
                          "experience.company_linkedin_url": this.targetCompanyLinkedInUrl
                        }
                      },
                      {
                        "term": {
                          "experience.active_experience": 1
                        }
                      },
                      {
                        "match": {
                          "experience.active_experience_department": department
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

    const searchResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview?page=${page}&items_per_page=${this.previewPageSize}`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });

    if (!searchResponse.ok) {
      throw new Error(`Preview search failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    this.results.creditsUsed.preview_search++;
    this.results.creditsUsed.total++;

    return Array.isArray(searchData) ? searchData : [];
  }

  /**
   * Remove duplicate employees based on ID
   */
  removeDuplicateEmployees(employees) {
    const seen = new Set();
    return employees.filter(employee => {
      if (seen.has(employee.id)) {
        return false;
      }
      seen.add(employee.id);
      return true;
    });
  }

  /**
   * Analyze organizational structure using AI (Parallel Processing)
   */
  async analyzeOrganizationalStructure(employees) {
    if (!this.useAI || !this.claudeApiKey) {
      return this.analyzeOrganizationalStructureFallback(employees);
    }

    try {
      // Parallel AI analysis tasks
      const analyses = await Promise.all([
        this.analyzeHierarchy(employees),
        this.mapDepartments(employees),
        this.identifyWorkingRelationships(employees),
        this.detectInfluencePatterns(employees)
      ]);
      
      const analysis = {
        hierarchy: analyses[0],
        departments: analyses[1],
        relationships: analyses[2],
        influence: analyses[3]
      };
      
      // Update organizational insights
      this.results.organizationalInsights = {
        hierarchyLevels: analysis.hierarchy.hierarchyLevels,
        departmentSizes: analysis.departments.departmentSizes,
        keyInfluencers: analysis.influence.keyInfluencers
      };
      
      return analysis;
      
    } catch (error) {
      console.error('❌ AI organizational analysis failed:', error.message);
      console.log('🔄 Falling back to rule-based analysis');
      return this.analyzeOrganizationalStructureFallback(employees);
    }
  }

  /**
   * Analyze organizational hierarchy with Claude AI
   */
  async analyzeHierarchy(employees) {
    const prompt = `Analyze this employee dataset to understand organizational hierarchy:

Employees (${employees.length} total):
${employees.map(e => `- ${e.full_name}: ${e.active_experience_title} (${e.active_experience_management_level})`).join('\n')}

Determine:
1. **Reporting Structure**: Who likely reports to whom based on titles and management levels?
2. **Seniority Tiers**: Group people into C-level, VP-level, Director-level, Manager-level, Individual Contributor
3. **Functional Leaders**: Who leads each department/function?
4. **Cross-functional Relationships**: Which roles typically work together?

Return JSON:
{
  "hierarchyLevels": {
    "c_level": [{"id": 123, "name": "...", "title": "...", "influence_score": 95}],
    "vp_level": [...],
    "director_level": [...],
    "manager_level": [...],
    "individual_contributor": [...]
  },
  "reporting_relationships": [
    {"subordinate_id": 456, "likely_manager_id": 123, "confidence": 0.85}
  ],
  "functional_leaders": [
    {"department": "Sales", "leader_id": 123, "team_size": 15}
  ]
}`;

    const response = await this.callClaudeAPI(prompt);
    return response;
  }

  /**
   * Map department structures with Claude AI
   */
  async mapDepartments(employees) {
    const departmentCounts = this.calculateDepartmentCounts(employees);
    
    const prompt = `Analyze department structure and relationships:

Department Breakdown:
${Object.entries(departmentCounts).map(([dept, count]) => `- ${dept}: ${count} employees`).join('\n')}

Employee Details:
${employees.map(e => `- ${e.full_name}: ${e.active_experience_title} (${e.active_experience_department})`).join('\n')}

Determine:
1. **Department Sizes**: Count by department
2. **Department Leaders**: Who leads each department?
3. **Cross-functional Collaboration**: Which departments work together?
4. **Department Maturity**: How established is each department?

Return JSON:
{
  "departmentSizes": {
    "Sales and Business Development": 45,
    "Engineering and Technical": 62,
    "Marketing": 18
  },
  "departmentLeaders": [
    {"department": "Sales", "leader_id": 123, "title": "VP Sales"}
  ],
  "crossFunctionalRelationships": [
    {"dept1": "Sales", "dept2": "Marketing", "collaboration_level": "high"}
  ]
}`;

    const response = await this.callClaudeAPI(prompt);
    return response;
  }

  /**
   * Identify working relationships with Claude AI
   */
  async identifyWorkingRelationships(employees) {
    const prompt = `Analyze working relationships and collaboration patterns:

Employees:
${employees.map(e => `
- ${e.full_name}: ${e.active_experience_title}
  Department: ${e.active_experience_department}
  Management Level: ${e.active_experience_management_level}
  Connections: ${e.connections_count}
  Headline: ${e.headline}
`).join('\n')}

Determine:
1. **Key Collaborators**: Who works closely together?
2. **Influence Networks**: Who has the most internal connections?
3. **Decision-Making Patterns**: Who typically makes decisions together?
4. **Communication Hubs**: Who facilitates cross-team communication?

Return JSON:
{
  "keyCollaborators": [
    {"person1_id": 123, "person2_id": 456, "relationship_type": "peers", "confidence": 0.8}
  ],
  "influenceNetworks": [
    {"person_id": 123, "influence_score": 95, "network_size": 15}
  ],
  "decisionMakingGroups": [
    {"group_name": "Sales Leadership", "member_ids": [123, 456, 789]}
  ]
}`;

    const response = await this.callClaudeAPI(prompt);
    return response;
  }

  /**
   * Detect influence patterns with Claude AI
   */
  async detectInfluencePatterns(employees) {
    const prompt = `Analyze influence patterns and key decision makers:

Employees:
${employees.map(e => `
- ${e.full_name}: ${e.active_experience_title}
  Management Level: ${e.active_experience_management_level}
  Connections: ${e.connections_count}
  Followers: ${e.followers_count}
  Headline: ${e.headline}
`).join('\n')}

Determine:
1. **Key Influencers**: Who has the most influence in the organization?
2. **Decision Makers**: Who has budget authority and approval power?
3. **Champions**: Who would advocate for new solutions?
4. **Gatekeepers**: Who controls access to decision makers?

Return JSON:
{
  "keyInfluencers": [
    {"id": 123, "name": "Jane Smith", "title": "VP Sales", "influence_score": 95, "influence_type": "decision_maker"}
  ],
  "decisionMakers": [123, 456],
  "potentialChampions": [789, 101],
  "gatekeepers": [202, 303]
}`;

    const response = await this.callClaudeAPI(prompt);
    return response;
  }

  /**
   * Fallback organizational analysis when AI is unavailable
   */
  analyzeOrganizationalStructureFallback(employees) {
    const hierarchyLevels = this.calculateManagementLevelCounts(employees);
    const departmentSizes = this.calculateDepartmentCounts(employees);
    
    // Simple influence scoring based on connections and management level
    const keyInfluencers = employees
      .map(emp => ({
        id: emp.id,
        name: emp.full_name,
        title: emp.active_experience_title,
        influence_score: this.calculateInfluenceScore(emp),
        influence_type: this.determineInfluenceType(emp)
      }))
      .sort((a, b) => b.influence_score - a.influence_score)
      .slice(0, 10);
    
    return {
      hierarchy: { hierarchyLevels },
      departments: { departmentSizes },
      relationships: { keyCollaborators: [] },
      influence: { keyInfluencers }
    };
  }

  /**
   * Calculate influence score for employee
   */
  calculateInfluenceScore(employee) {
    let score = 0;
    
    // Management level scoring
    const level = employee.active_experience_management_level;
    if (level === 'C-Level') score += 40;
    else if (level === 'VP-Level') score += 30;
    else if (level === 'Director-Level') score += 20;
    else if (level === 'Manager-Level') score += 10;
    
    // LinkedIn engagement
    const connections = employee.connections_count || 0;
    const followers = employee.followers_count || 0;
    score += Math.min(30, (connections + followers) / 100);
    
    // Department influence
    const dept = employee.active_experience_department;
    if (dept === 'Sales and Business Development') score += 15;
    else if (dept === 'Operations') score += 10;
    else if (dept === 'Marketing') score += 5;
    
    return Math.min(100, score);
  }

  /**
   * Determine influence type for employee
   */
  determineInfluenceType(employee) {
    const level = employee.active_experience_management_level;
    const title = employee.active_experience_title.toLowerCase();
    
    if (level === 'C-Level' || (level === 'VP-Level' && title.includes('chief'))) {
      return 'decision_maker';
    } else if (level === 'VP-Level' || level === 'Director-Level') {
      return 'champion';
    } else if (title.includes('procurement') || title.includes('legal') || title.includes('compliance')) {
      return 'blocker';
    } else if (title.includes('sales') || title.includes('account') || title.includes('customer')) {
      return 'introducer';
    } else {
      return 'stakeholder';
    }
  }

  /**
   * Classify buyer group roles using AI
   */
  async classifyBuyerGroupRoles(employees, organizationalAnalysis) {
    const classifiedEmployees = [];
    
    for (const employee of employees) {
      try {
        const roleClassification = await this.classifyEmployeeRole(employee, organizationalAnalysis);
        classifiedEmployees.push({
          ...employee,
          ...roleClassification,
          processedAt: new Date().toISOString()
        });
        
        // Delay between classifications
        await this.delay(this.delayBetweenRequests);
        
      } catch (error) {
        console.error(`❌ Failed to classify ${employee.full_name}:`, error.message);
        classifiedEmployees.push({
          ...employee,
          role: 'stakeholder',
          confidence: 50,
          reasoning: 'Classification failed',
          priority: 1,
          influence_score: this.calculateInfluenceScore(employee),
          should_collect_full_profile: false
        });
      }
    }
    
    return classifiedEmployees;
  }

  /**
   * Classify individual employee role using Claude AI
   */
  async classifyEmployeeRole(employee, organizationalAnalysis) {
    if (!this.useAI || !this.claudeApiKey) {
      return this.classifyEmployeeRoleFallback(employee);
    }

    try {
      const prompt = `Given this employee and organizational context, determine their buyer group role:

Employee:
- Name: ${employee.full_name}
- Title: ${employee.active_experience_title}
- Department: ${employee.active_experience_department}
- Management Level: ${employee.active_experience_management_level}
- Connections: ${employee.connections_count}
- Followers: ${employee.followers_count}
- Headline: ${employee.headline}

Organizational Context:
- Total Employees Analyzed: ${this.results.discoveryMetrics.totalEmployeesFound}
- Hierarchy Levels: ${JSON.stringify(this.results.organizationalInsights.hierarchyLevels)}
- Department Sizes: ${JSON.stringify(this.results.organizationalInsights.departmentSizes)}

Buyer Group Role Definitions:
- **Decision Maker**: Has budget authority and final approval power (VP+ for enterprise, Director+ for mid-market)
- **Champion**: Internal advocate who actively promotes solutions (has credibility, benefits from solving problems)
- **Stakeholder**: Affected by or influences purchase but lacks final authority (provides input, controls implementation)
- **Blocker**: Can prevent or delay purchase through policy/process control (procurement, legal, security, compliance)
- **Introducer**: Has relationships and can facilitate access to decision makers (customer-facing, well-connected)

Current Buyer Group Composition:
- Decision Makers: ${this.results.buyerGroupComposition.decision_maker}/${this.buyerGroupTargets.decision_maker.max}
- Champions: ${this.results.buyerGroupComposition.champion}/${this.buyerGroupTargets.champion.max}
- Stakeholders: ${this.results.buyerGroupComposition.stakeholder}/${this.buyerGroupTargets.stakeholder.max}
- Blockers: ${this.results.buyerGroupComposition.blocker}/${this.buyerGroupTargets.blocker.max}
- Introducers: ${this.results.buyerGroupComposition.introducer}/${this.buyerGroupTargets.introducer.max}

Return ONLY valid JSON:
{
  "role": "decision_maker|champion|stakeholder|blocker|introducer",
  "confidence": <0-100>,
  "reasoning": "<1-2 sentence explanation>",
  "priority": <1-10, where 10 is highest priority for outreach>,
  "influence_score": <0-100>,
  "should_collect_full_profile": true|false
}`;

      const response = await this.callClaudeAPI(prompt);
      return response;
      
    } catch (error) {
      console.error(`❌ Claude AI role classification failed for ${employee.full_name}:`, error.message);
      return this.classifyEmployeeRoleFallback(employee);
    }
  }

  /**
   * Fallback role classification when AI is unavailable
   */
  classifyEmployeeRoleFallback(employee) {
    const level = employee.active_experience_management_level;
    const title = employee.active_experience_title.toLowerCase();
    const dept = employee.active_experience_department;
    
    let role = 'stakeholder';
    let confidence = 50;
    let priority = 5;
    
    // Decision makers
    if (level === 'C-Level' || (level === 'VP-Level' && (title.includes('chief') || title.includes('president')))) {
      role = 'decision_maker';
      confidence = 90;
      priority = 10;
    }
    // Champions
    else if (level === 'VP-Level' || level === 'Director-Level') {
      role = 'champion';
      confidence = 80;
      priority = 8;
    }
    // Blockers
    else if (title.includes('procurement') || title.includes('legal') || title.includes('compliance') || 
             title.includes('security') || dept === 'Legal and Compliance') {
      role = 'blocker';
      confidence = 85;
      priority = 7;
    }
    // Introducers
    else if (title.includes('sales') || title.includes('account') || title.includes('customer') || 
             dept === 'Sales and Business Development') {
      role = 'introducer';
      confidence = 75;
      priority = 6;
    }
    
    return {
      role,
      confidence,
      reasoning: `Rule-based classification: ${level} in ${dept}`,
      priority,
      influence_score: this.calculateInfluenceScore(employee),
      should_collect_full_profile: priority >= 7
    };
  }

  /**
   * Select top buyer group members based on priority and role targets
   */
  selectBuyerGroupMembers(classifiedEmployees) {
    const roleCounts = {
      decision_maker: 0,
      champion: 0,
      stakeholder: 0,
      blocker: 0,
      introducer: 0
    };
    
    const selectedMembers = [];
    
    // Sort by priority and confidence
    const sortedEmployees = classifiedEmployees
      .filter(emp => emp.should_collect_full_profile)
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.confidence - a.confidence;
      });
    
    for (const employee of sortedEmployees) {
      const role = employee.role;
      const target = this.buyerGroupTargets[role];
      
      // Check if we need more of this role
      if (roleCounts[role] < target.max) {
        selectedMembers.push(employee);
        roleCounts[role]++;
        
        // Stop if we've reached our total target
        if (selectedMembers.length >= this.totalBuyerGroupSize.max) {
          break;
        }
      }
    }
    
    // Fill remaining slots with highest priority employees
    if (selectedMembers.length < this.totalBuyerGroupSize.min) {
      const remaining = sortedEmployees
        .filter(emp => !selectedMembers.some(selected => selected.id === emp.id))
        .slice(0, this.totalBuyerGroupSize.min - selectedMembers.length);
      
      selectedMembers.push(...remaining);
    }
    
    return selectedMembers;
  }

  /**
   * Collect full profiles for buyer group members
   */
  async collectBuyerGroupProfiles(buyerGroupMembers) {
    const profiles = [];
    const totalBatches = Math.ceil(buyerGroupMembers.length / this.batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, buyerGroupMembers.length);
      const batch = buyerGroupMembers.slice(startIndex, endIndex);
      
      console.log(`📦 Collecting batch ${batchIndex + 1}/${totalBatches} (${batch.length} profiles)`);
      
      const batchPromises = batch.map(async (member) => {
        try {
          const fullProfile = await this.collectFullProfile(member.id);
          return {
            ...member,
            fullProfile
          };
        } catch (error) {
          console.error(`❌ Failed to collect profile for ${member.full_name}:`, error.message);
          return member; // Return without full profile
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      profiles.push(...batchResults);
      
      // Delay between batches
      if (batchIndex < totalBatches - 1) {
        await this.delay(this.delayBetweenBatches);
      }
    }
    
    this.results.discoveryMetrics.fullProfilesCollected = profiles.length;
    this.results.creditsUsed.full_collect = profiles.length;
    this.results.creditsUsed.total += profiles.length;
    
    return profiles;
  }

  /**
   * Collect full profile from Coresignal
   */
  async collectFullProfile(personId) {
    const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${personId}`, {
      method: 'GET',
      headers: {
        'apikey': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!collectResponse.ok) {
      throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
    }

    return await collectResponse.json();
  }

  /**
   * Calculate buyer group composition
   */
  calculateBuyerGroupComposition(buyerGroup) {
    const composition = {
      decision_maker: 0,
      champion: 0,
      stakeholder: 0,
      blocker: 0,
      introducer: 0,
      total: buyerGroup.length
    };
    
    for (const member of buyerGroup) {
      composition[member.role] = (composition[member.role] || 0) + 1;
    }
    
    return composition;
  }

  /**
   * Calculate quality metrics
   */
  calculateQualityMetrics(buyerGroup, allEmployees) {
    const composition = this.calculateBuyerGroupComposition(buyerGroup);
    
    // Coverage assessment
    const rolesPresent = Object.values(composition).filter(count => count > 0).length;
    const coverage = rolesPresent >= 5 ? 'excellent' : 
                    rolesPresent >= 4 ? 'good' : 
                    rolesPresent >= 3 ? 'acceptable' : 'poor';
    
    // Confidence assessment
    const avgConfidence = buyerGroup.reduce((sum, member) => sum + member.confidence, 0) / buyerGroup.length;
    const confidence = avgConfidence >= 80 ? 'high' : 
                      avgConfidence >= 60 ? 'medium' : 'low';
    
    // Geographic focus
    const countries = new Set(buyerGroup.map(member => member.location_country));
    const geographicFocus = countries.size === 1 ? 'focused' : 'diverse';
    
    // Overall score
    const overallScore = Math.round(
      (rolesPresent / 5) * 30 + // Role coverage (30%)
      (avgConfidence / 100) * 40 + // Confidence (40%)
      (buyerGroup.length / this.totalBuyerGroupSize.max) * 30 // Size (30%)
    );
    
    return {
      coverage,
      confidence,
      geographic_focus: geographicFocus,
      overall_score: Math.min(100, overallScore)
    };
  }

  /**
   * Call Claude API with error handling
   */
  async callClaudeAPI(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Calculate department counts from employee data
   */
  calculateDepartmentCounts(employees) {
    return employees.reduce((counts, employee) => {
      const dept = employee.active_experience_department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Calculate management level counts from employee data
   */
  calculateManagementLevelCounts(employees) {
    return employees.reduce((counts, employee) => {
      const level = employee.active_experience_management_level || 'Unknown';
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Load progress from file
   */
  async loadProgress() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.progressFile)) {
        const progressData = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        this.results = { ...this.results, ...progressData };
        console.log(`📂 Loaded progress: ${this.results.buyerGroup?.length || 0} buyer group members found`);
      }
    } catch (error) {
      console.log('📂 No existing progress file found, starting fresh');
    }
  }

  /**
   * Save progress to file
   */
  async saveProgress() {
    try {
      const fs = require('fs');
      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.progressFile, JSON.stringify(progressData, null, 2));
      console.log(`💾 Progress saved to ${this.progressFile}`);
    } catch (error) {
      console.error('❌ Failed to save progress:', error.message);
    }
  }

  /**
   * Utility method for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get final results summary
   */
  getResults() {
    return {
      ...this.results,
      endTime: new Date().toISOString(),
      processingTime: new Date() - new Date(this.results.startTime)
    };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node find_buyer_group.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --company-id "01K7DNYR5VZ7JY36KGKKN76XZ1"  Target company ID');
    console.log('  --linkedin-url "https://linkedin.com/company/acme"  Target company LinkedIn URL');
    console.log('  --departments "Sales,Marketing,Operations"  Target departments');
    console.log('  --max-pages 20  Maximum preview pages to search');
    console.log('  --disable-ai  Disable AI analysis (use rule-based)');
    console.log('');
    console.log('Examples:');
    console.log('  node find_buyer_group.js --company-id "01K7DNYR5VZ7JY36KGKKN76XZ1"');
    console.log('  node find_buyer_group.js --linkedin-url "https://linkedin.com/company/acme" --departments "Sales,Marketing"');
    process.exit(1);
  }
  
  // Parse command line arguments
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'company-id':
          options.targetCompanyId = value;
          break;
        case 'linkedin-url':
          options.targetCompanyLinkedInUrl = value;
          break;
        case 'departments':
          options.targetDepartments = value.split(',');
          break;
        case 'max-pages':
          options.maxPreviewPages = parseInt(value);
          break;
        case 'disable-ai':
          options.useAI = false;
          i--; // Don't skip next argument
          break;
      }
    }
  }
  
  const finder = new BuyerGroupFinder(options);
  
  finder.run()
    .then(() => {
      const results = finder.getResults();
      console.log('\n📊 Final Results:');
      console.log(`✅ Buyer Group Members: ${results.buyerGroup.length}`);
      console.log(`📈 Total Employees Found: ${results.discoveryMetrics.totalEmployeesFound}`);
      console.log(`🎯 Quality Score: ${results.qualityMetrics.overall_score}%`);
      console.log(`💳 Credits Used: ${results.creditsUsed.preview_search} preview, ${results.creditsUsed.full_collect} collect`);
      console.log(`⏱️ Processing Time: ${Math.round(results.processingTime / 1000)}s`);
      
      if (results.buyerGroup.length > 0) {
        console.log('\n👥 Buyer Group Composition:');
        Object.entries(results.buyerGroupComposition).forEach(([role, count]) => {
          if (role !== 'total') {
            console.log(`  ${role}: ${count}`);
          }
        });
        
        console.log('\n🏆 Top 5 Buyer Group Members:');
        results.buyerGroup.slice(0, 5).forEach((member, index) => {
          console.log(`${index + 1}. ${member.full_name} (${member.role}) - ${member.confidence}% confidence`);
        });
      }
    })
    .catch(error => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = BuyerGroupFinder;
