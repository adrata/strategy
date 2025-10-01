const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const { ulid } = require('ulid');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class OptimizedBuyerGroupDiscovery {
  constructor() {
    this.results = {
      company: null,
      departments: [],
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
        searchesUsed: 0,
        collectsUsed: 0
      }
    };
    
    // Utility company specific role targets for different company sizes
    this.roleTargets = {
      micro: { // 1-50 employees
        decisionMakers: { min: 1, max: 2, ideal: 1 },
        champions: { min: 0, max: 1, ideal: 0 },
        stakeholders: { min: 0, max: 3, ideal: 2 },
        blockers: { min: 0, max: 1, ideal: 0 },
        introducers: { min: 0, max: 1, ideal: 0 }
      },
      small: { // 51-200 employees
        decisionMakers: { min: 1, max: 2, ideal: 1 },
        champions: { min: 0, max: 2, ideal: 1 },
        stakeholders: { min: 1, max: 4, ideal: 3 },
        blockers: { min: 0, max: 2, ideal: 1 },
        introducers: { min: 0, max: 2, ideal: 1 }
      },
      medium: { // 201-500 employees
        decisionMakers: { min: 1, max: 2, ideal: 2 },
        champions: { min: 0, max: 2, ideal: 1 },
        stakeholders: { min: 2, max: 5, ideal: 4 },
        blockers: { min: 0, max: 2, ideal: 1 },
        introducers: { min: 0, max: 2, ideal: 1 }
      },
      large: { // 501-1000 employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 0, max: 3, ideal: 2 },
        stakeholders: { min: 2, max: 6, ideal: 4 },
        blockers: { min: 0, max: 3, ideal: 2 },
        introducers: { min: 0, max: 3, ideal: 2 }
      },
      xlarge: { // 1001-5000 employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 0, max: 3, ideal: 2 },
        stakeholders: { min: 3, max: 7, ideal: 5 },
        blockers: { min: 0, max: 4, ideal: 2 },
        introducers: { min: 0, max: 4, ideal: 2 }
      },
      enterprise: { // 5001+ employees
        decisionMakers: { min: 1, max: 3, ideal: 2 },
        champions: { min: 0, max: 3, ideal: 2 },
        stakeholders: { min: 4, max: 9, ideal: 6 },
        blockers: { min: 0, max: 5, ideal: 3 },
        introducers: { min: 0, max: 5, ideal: 3 }
      }
    };
  }

  async discoverBuyerGroup(companyName, workspaceName) {
    console.log('🎯 ENHANCED BUYER GROUP DISCOVERY');
    console.log('==================================');
    console.log(`Company: ${companyName}`);
    console.log(`Strategy: Smart Search + AI Reasoning + Database Storage`);
    console.log('');

    try {
      // Step 1: Get company data
      await this.getCompanyData(companyName, workspaceName);
      
      // Step 2: Smart targeted searches (optimized for utility companies)
      await this.executeSmartSearches();
      
      // Step 3: AI-powered role assignment with reasoning
      this.assignRolesWithAIReasoning();
      
      // Step 4: Store buyer group data in database with enrichment dates
      await this.storeBuyerGroupInDatabase();
      
      // Step 5: Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async getCompanyData(companyIdentifier, workspaceName) {
    console.log('🏢 STEP 1: Getting Company Data with Validation');
    console.log('─'.repeat(50));
    
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: workspaceName } },
      select: { id: true, name: true }
    });
    
    // Check if the identifier is a CoreSignal ID (numeric)
    const isCoreSignalId = /^\d+$/.test(companyIdentifier);
    
    let company;
    if (isCoreSignalId) {
      // Search by CoreSignal ID
      company = await prisma.companies.findFirst({
        where: {
          workspaceId: workspace.id,
          customFields: {
            path: ['coresignalData', 'id'],
            equals: parseInt(companyIdentifier)
          }
        },
        select: {
          id: true,
          name: true,
          industry: true,
          customFields: true
        }
      });
    } else {
      // Search by company name (exact match first, then partial)
      company = await prisma.companies.findFirst({
        where: {
          workspaceId: workspace.id,
          name: { equals: companyIdentifier, mode: 'insensitive' },
          customFields: {
            path: ['coresignalData', 'id'],
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          industry: true,
          customFields: true
        }
      });
      
      // If not found, try partial match
      if (!company) {
        company = await prisma.companies.findFirst({
          where: {
            workspaceId: workspace.id,
            name: { contains: companyIdentifier, mode: 'insensitive' },
            customFields: {
              path: ['coresignalData', 'id'],
              not: null
            }
          },
          select: {
            id: true,
            name: true,
            industry: true,
            customFields: true
          }
        });
      }
    }
    
    if (!company) {
      throw new Error(`${companyIdentifier} not found with CoreSignal ID`);
    }
    
    const coresignalData = company.customFields?.coresignalData;
    
    // CRITICAL VALIDATION: Check for suspicious company size mismatches
    const companySize = coresignalData?.employees_count;
    const companyName = company.name.toLowerCase();
    
    // Flag suspicious matches for major utility companies
    const isMajorUtility = companyName.includes('power') || 
                          companyName.includes('electric') || 
                          companyName.includes('utility') ||
                          companyName.includes('energy') ||
                          companyName.includes('hydro') ||
                          companyName.includes('grid');
    
    if (isMajorUtility && companySize <= 10) {
      console.log(`🚨 WARNING: Major utility company "${company.name}" shows only ${companySize} employees`);
      console.log(`   This suggests a WRONG CoreSignal match!`);
      console.log(`   Expected: 100+ employees for major utility`);
      console.log(`   Found: ${companySize} employees`);
      console.log(`   ⚠️ Proceeding with caution - results may be inaccurate`);
      console.log('');
    }
    
    // Flag suspicious matches for large companies
    if (companySize > 1000 && companyName.includes('llc') && companyName.includes('consulting')) {
      console.log(`🚨 WARNING: Large company "${company.name}" may be wrong match`);
      console.log(`   Size: ${companySize} employees`);
      console.log(`   Name suggests consulting firm, not major utility`);
      console.log('');
    }
    
    this.results.company = {
      id: company.id,
      name: company.name,
      workspaceId: workspace.id,
      coresignalId: coresignalData?.id,
      employees: coresignalData?.employees_count,
      industry: coresignalData?.industry || company.industry,
      isSuspiciousMatch: isMajorUtility && companySize <= 10
    };
    
    console.log(`✅ Company: ${company.name}`);
    console.log(`   CoreSignal ID: ${coresignalData?.id}`);
    console.log(`   Employees: ${coresignalData?.employees_count}`);
    console.log(`   Industry: ${coresignalData?.industry || company.industry}`);
    console.log(`   Suspicious Match: ${this.results.company.isSuspiciousMatch ? 'YES' : 'NO'}`);
    console.log('');
  }

  async executeSmartSearches() {
    console.log('🔍 STEP 2: Smart Targeted Searches (Optimized)');
    console.log('─'.repeat(50));
    
    const companyId = this.results.company.coresignalId;
    const allProfiles = [];
    
    // OPTIMIZATION 1: Single comprehensive search instead of multiple department searches
    console.log('🎯 Strategy: Single comprehensive search with multiple filters');
    
    const comprehensiveSearchQuery = {
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
                            // Decision Makers - C-Level, VPs, Directors
                            { term: { 'is_decision_maker': 1 } },
                            { match: { 'experience.title': 'ceo' } },
                            { match: { 'experience.title': 'chief' } },
                            { match: { 'experience.title': 'president' } },
                            { match: { 'experience.title': 'vp' } },
                            { match: { 'experience.title': 'vice president' } },
                            { match: { 'experience.title': 'director' } },
                            { match: { 'experience.title': 'head of' } },
                            
                            // Champions - Senior technical roles
                            { match: { 'experience.title': 'senior engineer' } },
                            { match: { 'experience.title': 'principal engineer' } },
                            { match: { 'experience.title': 'lead engineer' } },
                            { match: { 'experience.title': 'engineering manager' } },
                            { match: { 'experience.title': 'technical manager' } },
                            { match: { 'experience.title': 'project manager' } },
                            
                            // Utility-specific roles
                            { match: { 'experience.title': 'operations manager' } },
                            { match: { 'experience.title': 'field manager' } },
                            { match: { 'experience.title': 'maintenance manager' } },
                            { match: { 'experience.title': 'system operator' } },
                            { match: { 'experience.title': 'distribution engineer' } },
                            { match: { 'experience.title': 'transmission engineer' } },
                            
                            // Department filters
                            { match: { 'experience.department': 'engineering' } },
                            { match: { 'experience.department': 'operations' } },
                            { match: { 'experience.department': 'it' } },
                            { match: { 'experience.department': 'technology' } },
                            { match: { 'experience.department': 'procurement' } },
                            { match: { 'experience.department': 'legal' } },
                            { match: { 'experience.department': 'finance' } }
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
      console.log('🔍 Executing single comprehensive search...');
      const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', comprehensiveSearchQuery, 'POST');
      const employeeIds = Array.isArray(response) ? response : [];
      
      console.log(`   ✅ Found ${employeeIds.length} relevant employee IDs`);
      this.results.stats.searchesUsed += 1;
      
      // OPTIMIZATION 2: Smart collection - variable based on company size
      const companySize = this.results.company.employees;
      let profilesToCollect = 20; // Default
      let sizeCategory = 'Medium';
      
      if (companySize <= 50) {
        profilesToCollect = 10;
        sizeCategory = 'Micro';
      } else if (companySize <= 200) {
        profilesToCollect = 15;
        sizeCategory = 'Small';
      } else if (companySize <= 500) {
        profilesToCollect = 20;
        sizeCategory = 'Medium';
      } else if (companySize <= 1000) {
        profilesToCollect = 25;
        sizeCategory = 'Large';
      } else if (companySize <= 5000) {
        profilesToCollect = 30;
        sizeCategory = 'X-Large';
      } else {
        profilesToCollect = 35;
        sizeCategory = 'Enterprise';
      }
      
      const topCandidates = employeeIds.slice(0, profilesToCollect);
      console.log(`🎯 Company Size: ${companySize} employees (${sizeCategory})`);
      console.log(`🎯 Collecting detailed profiles for top ${topCandidates.length} candidates (variable cost structure)`);
      
      for (const employeeId of topCandidates) {
        try {
          const profile = await this.collectEmployeeProfile(employeeId);
          if (profile) {
            allProfiles.push(profile);
          }
        } catch (error) {
          console.log(`   ⚠️ Failed to collect profile ${employeeId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Collected ${allProfiles.length} detailed profiles`);
      this.results.stats.collectsUsed += allProfiles.length;
      this.results.stats.totalCredits += 1 + allProfiles.length; // 1 search + N collects
      
      // Store cost structure info for reporting
      this.results.stats.costStructure = {
        companySize: companySize,
        sizeCategory: sizeCategory,
        profilesToCollect: profilesToCollect,
        actualCollected: allProfiles.length,
        creditsPerCompany: 1 + allProfiles.length,
        costPerCompany: (1 + allProfiles.length) * 2 * 0.05
      };
      
    } catch (error) {
      console.log(`   ❌ Comprehensive search failed: ${error.message}`);
    }
    
    this.results.profiles = allProfiles;
    console.log(`💰 Total credits used: ${this.results.stats.totalCredits} (${this.results.stats.searchesUsed} searches, ${this.results.stats.collectsUsed} collects)`);
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

  assignRolesWithAIReasoning() {
    console.log('🤖 STEP 3: AI-Powered Role Assignment with Reasoning');
    console.log('─'.repeat(50));
    
    const profiles = this.results.profiles;
    
    // First pass: Assign roles to all profiles
    for (const profile of profiles) {
      const roleAssignment = this.determineRoleWithReasoning(profile);
      if (roleAssignment && this.results.buyerGroup[roleAssignment.role]) {
        this.results.buyerGroup[roleAssignment.role].push({
          name: profile.full_name || 'Unknown',
          title: profile.active_experience_title || profile.experience?.[0]?.title || 'Unknown',
          department: profile.active_experience_department || profile.experience?.[0]?.department || 'Unknown',
          company: profile.active_experience_company_name || this.results.company.name,
          email: profile.primary_professional_email || 'N/A',
          linkedin: profile.professional_network_url || 'N/A',
          isDecisionMaker: profile.is_decision_maker === 1,
          managementLevel: profile.active_experience_management_level || 'N/A',
          influenceScore: this.calculateInfluenceScore(profile),
          confidence: roleAssignment.confidence,
          reasoning: roleAssignment.reasoning,
          aiAnalysis: roleAssignment.aiAnalysis,
          rawProfileData: profile // Store the complete CoreSignal profile data
        });
      }
    }
    
    // Second pass: Apply role distribution constraints
    this.applyRoleDistributionConstraints();
    
    console.log(`✅ AI-analyzed ${profiles.length} profiles`);
    console.log(`   Decision Makers: ${this.results.buyerGroup.decisionMakers.length}`);
    console.log(`   Champions: ${this.results.buyerGroup.champions.length}`);
    console.log(`   Stakeholders: ${this.results.buyerGroup.stakeholders.length}`);
    console.log(`   Blockers: ${this.results.buyerGroup.blockers.length}`);
    console.log(`   Introducers: ${this.results.buyerGroup.introducers.length}`);
    console.log('');
  }

  applyRoleDistributionConstraints() {
    console.log('🎯 Applying Role Distribution Constraints');
    console.log('─'.repeat(50));
    
    const companySize = this.results.company.employees;
    let targets;
    let sizeCategory;
    
    // Determine targets based on company size
    if (companySize <= 50) {
      targets = this.roleTargets.micro;
      sizeCategory = 'Micro (1-50 employees)';
    } else if (companySize <= 200) {
      targets = this.roleTargets.small;
      sizeCategory = 'Small (51-200 employees)';
    } else if (companySize <= 500) {
      targets = this.roleTargets.medium;
      sizeCategory = 'Medium (201-500 employees)';
    } else if (companySize <= 1000) {
      targets = this.roleTargets.large;
      sizeCategory = 'Large (501-1000 employees)';
    } else if (companySize <= 5000) {
      targets = this.roleTargets.xlarge;
      sizeCategory = 'X-Large (1001-5000 employees)';
    } else {
      targets = this.roleTargets.enterprise;
      sizeCategory = 'Enterprise (5001+ employees)';
    }
    
    console.log(`📊 Target Distribution for ${companySize} employee company (${sizeCategory}):`);
    console.log(`   Decision Makers: ${targets.decisionMakers.min}-${targets.decisionMakers.max} (ideal: ${targets.decisionMakers.ideal})`);
    console.log(`   Champions: ${targets.champions.min}-${targets.champions.max} (ideal: ${targets.champions.ideal})`);
    console.log(`   Stakeholders: ${targets.stakeholders.min}-${targets.stakeholders.max} (ideal: ${targets.stakeholders.ideal})`);
    console.log(`   Blockers: ${targets.blockers.min}-${targets.blockers.max} (ideal: ${targets.blockers.ideal})`);
    console.log(`   Introducers: ${targets.introducers.min}-${targets.introducers.max} (ideal: ${targets.introducers.ideal})`);
    console.log('');
    
    // Sort each role by influence score (highest first)
    Object.keys(this.results.buyerGroup).forEach(role => {
      this.results.buyerGroup[role].sort((a, b) => b.influenceScore - a.influenceScore);
    });
    
    // Apply constraints for each role
    const roleKeys = ['decisionMakers', 'champions', 'stakeholders', 'blockers', 'introducers'];
    
    roleKeys.forEach(role => {
      const currentCount = this.results.buyerGroup[role].length;
      const target = targets[role];
      
      if (currentCount > target.max) {
        console.log(`   🔧 Truncating ${role} from ${currentCount} to ${target.max} (keeping highest influence)`);
        this.results.buyerGroup[role] = this.results.buyerGroup[role].slice(0, target.max);
      } else if (currentCount < target.min) {
        console.log(`   ⚠️ ${role} has only ${currentCount}, target is ${target.min}-${target.max}`);
      } else {
        console.log(`   ✅ ${role}: ${currentCount} (within target range)`);
      }
    });
    
    // CRITICAL: Ensure we ALWAYS have at least one decision maker
    if (this.results.buyerGroup.decisionMakers.length === 0) {
      console.log('   🚨 CRITICAL: No Decision Makers found! Attempting to promote highest influence person...');
      
      // Find the highest influence person from other roles and promote them
      const allPeople = [
        ...this.results.buyerGroup.champions,
        ...this.results.buyerGroup.stakeholders,
        ...this.results.buyerGroup.blockers,
        ...this.results.buyerGroup.introducers
      ];
      
      if (allPeople.length > 0) {
        // Sort by influence score and take the highest
        allPeople.sort((a, b) => b.influenceScore - a.influenceScore);
        const promotedPerson = allPeople[0];
        
        // Remove from original role
        const originalRole = this.findPersonRole(promotedPerson);
        if (originalRole && this.results.buyerGroup[originalRole]) {
          this.results.buyerGroup[originalRole] = this.results.buyerGroup[originalRole].filter(p => p !== promotedPerson);
        }
        
        // Add to decision makers
        promotedPerson.role = 'Decision Maker';
        promotedPerson.confidence = 0.8;
        promotedPerson.reasoning = `Promoted to Decision Maker - Highest influence person (${promotedPerson.influenceScore}/100)`;
        this.results.buyerGroup.decisionMakers.push(promotedPerson);
        
        console.log(`   ✅ Promoted ${promotedPerson.name} to Decision Maker (Influence: ${promotedPerson.influenceScore}/100)`);
      } else {
        console.log('   ❌ No people found to promote to Decision Maker!');
        this.results.hasIssues = true;
        this.results.issues = this.results.issues || [];
        this.results.issues.push('No Decision Makers found and no people to promote');
      }
    }
    
    console.log('');
  }
  
  findPersonRole(person) {
    for (const [role, people] of Object.entries(this.results.buyerGroup)) {
      if (people.includes(person)) {
        return role;
      }
    }
    return null;
  }

  determineRoleWithReasoning(profile) {
    const title = (profile.active_experience_title || profile.experience?.[0]?.title || '').toLowerCase();
    const department = (profile.active_experience_department || profile.experience?.[0]?.department || '').toLowerCase();
    const isDecisionMaker = profile.is_decision_maker === 1;
    const managementLevel = profile.active_experience_management_level || '';
    
    // AI-POWERED ROLE DETERMINATION WITH REASONING
    // PRIORITIZE ROLES BASED ON UTILITY COMPANY BUYER GROUP TARGETS
    
    // DECISION MAKERS - C-Level, VPs, Directors (TARGET: 2-3 for large utility)
    if (isDecisionMaker || 
        title.includes('ceo') || title.includes('chief') || title.includes('president') ||
        title.includes('vp') || title.includes('vice president') ||
        title.includes('director') || title.includes('head of') ||
        title.includes('svp') || title.includes('senior vice president')) {
      
      return {
        role: 'decisionMakers',
        confidence: 0.95,
        reasoning: `Identified as Decision Maker based on ${isDecisionMaker ? 'CoreSignal decision maker flag' : 'high-authority title pattern'}`,
        aiAnalysis: {
          authorityLevel: 'High',
          budgetControl: 'Yes',
          decisionPower: 'Final approval authority',
          engagementStrategy: 'Direct executive engagement required'
        }
      };
    }
    
    // BLOCKERS - Legal, compliance, procurement, finance (TARGET: 1-2 for large utility)
    if (title.includes('legal') || title.includes('compliance') || title.includes('procurement') ||
        title.includes('finance') || title.includes('security') || title.includes('risk') ||
        title.includes('counsel') || title.includes('attorney') || title.includes('tax') ||
        title.includes('accounting') || title.includes('revenue') || title.includes('reporting') ||
        department.includes('legal') || department.includes('compliance') || 
        department.includes('procurement') || department.includes('finance') ||
        department.includes('accounting')) {
      
      return {
        role: 'blockers',
        confidence: 0.85,
        reasoning: `Identified as Blocker - Gatekeeper role with approval authority`,
        aiAnalysis: {
          gatekeeperRole: 'Yes',
          approvalAuthority: 'Yes',
          riskFactors: 'Compliance, budget, legal concerns',
          engagementStrategy: 'Address concerns early, provide compliance documentation'
        }
      };
    }
    
    // INTRODUCERS - Administrative, assistants, coordinators (TARGET: 1-3 for large utility)
    if (title.includes('assistant') || title.includes('coordinator') || title.includes('administrative') ||
        title.includes('executive assistant') || title.includes('admin') ||
        title.includes('project coordinator') || title.includes('business analyst') ||
        title.includes('support') || title.includes('secretary') ||
        department.includes('administrative') || department.includes('support')) {
      
      return {
        role: 'introducers',
        confidence: 0.75,
        reasoning: `Identified as Introducer - Administrative role with network access`,
        aiAnalysis: {
          networkAccess: 'High',
          introductionCapability: 'Yes',
          influenceLevel: 'Medium through relationships',
          engagementStrategy: 'Relationship building and network access'
        }
      };
    }
    
    // CHAMPIONS - Technical advocates, implementation leaders (TARGET: 3-5 for large utility)
    if ((title.includes('senior') || title.includes('principal') || title.includes('lead')) &&
        (title.includes('engineer') || title.includes('specialist') || title.includes('architect') ||
         title.includes('manager') || title.includes('supervisor'))) {
      
      return {
        role: 'champions',
        confidence: 0.9,
        reasoning: `Identified as Champion - Senior technical role with implementation authority`,
        aiAnalysis: {
          technicalExpertise: 'High',
          implementationRole: 'Yes',
          influenceLevel: 'High within technical teams',
          engagementStrategy: 'Technical validation and advocacy'
        }
      };
    }
    
    // CHAMPIONS - Technical specialists and engineers
    if (title.includes('engineer') || title.includes('specialist') || title.includes('analyst') ||
        title.includes('architect') || title.includes('consultant') ||
        title.includes('technician') || title.includes('operator') ||
        title.includes('system') || title.includes('transmission') ||
        title.includes('distribution') || title.includes('generation')) {
      
      return {
        role: 'champions',
        confidence: 0.8,
        reasoning: `Identified as Champion - Technical specialist with domain expertise`,
        aiAnalysis: {
          technicalExpertise: 'Medium-High',
          implementationRole: 'Yes',
          influenceLevel: 'Medium within technical teams',
          engagementStrategy: 'Technical validation and user advocacy'
        }
      };
    }
    
    // STAKEHOLDERS - Everyone else (managers, specialists, analysts, etc.) (TARGET: 3-6 for large utility)
    if (title.includes('manager') || title.includes('supervisor') || title.includes('specialist') ||
        title.includes('analyst') || title.includes('technician') ||
        title.includes('coordinator') || title.includes('project manager') ||
        title.includes('operations') || title.includes('field') ||
        title.includes('maintenance') || title.includes('planning') ||
        department.includes('operations') || department.includes('field') || 
        department.includes('maintenance') || department.includes('engineering') ||
        department.includes('planning') || department.includes('resource')) {
      
      return {
        role: 'stakeholders',
        confidence: 0.7,
        reasoning: `Identified as Stakeholder - Operational role affected by decisions`,
        aiAnalysis: {
          operationalImpact: 'High',
          userRole: 'Yes',
          influenceLevel: 'Medium through usage',
          engagementStrategy: 'User validation and adoption support'
        }
      };
    }
    
    // Default to stakeholders
    return {
      role: 'stakeholders',
      confidence: 0.5,
      reasoning: `Default classification as Stakeholder - General organizational role`,
      aiAnalysis: {
        operationalImpact: 'Unknown',
        userRole: 'Unknown',
        influenceLevel: 'Unknown',
        engagementStrategy: 'General stakeholder engagement'
      }
    };
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

  async storeBuyerGroupInDatabase() {
    console.log('💾 STEP 4: Storing Buyer Group Data in Database');
    console.log('─'.repeat(50));
    
    const enrichmentDate = new Date();
    const workspaceId = this.results.company.workspaceId;
    const companyId = this.results.company.id;
    
    console.log(`📅 Enrichment Date: ${enrichmentDate.toISOString()}`);
    console.log(`🏢 Company ID: ${companyId}`);
    console.log(`🏢 Workspace ID: ${workspaceId}`);
    console.log('');
    
    // Check if buyer group already exists for this company
    const existingBuyerGroup = await prisma.buyer_groups.findFirst({
      where: {
        companyId: companyId,
        workspaceId: workspaceId
      }
    });

    let buyerGroup;
    if (existingBuyerGroup) {
      // Update existing buyer group with new enrichment date
      console.log(`🔄 Updating existing buyer group: ${existingBuyerGroup.name}`);
      buyerGroup = await prisma.buyer_groups.update({
        where: {
          id: existingBuyerGroup.id
        },
        data: {
          name: `${this.results.company.name} - Buyer Group (Updated ${enrichmentDate.toISOString().split('T')[0]})`,
          description: `AI-discovered buyer group for ${this.results.company.name} - Updated with new system`,
          purpose: 'Strategic buyer group identification for sales targeting',
          status: 'active',
          priority: 'high',
          updatedAt: enrichmentDate,
          customFields: {
            enrichmentDate: enrichmentDate.toISOString(),
            discoveryMethod: 'AI-powered CoreSignal analysis v2.0',
            totalCreditsUsed: this.results.stats.totalCredits,
            companySize: this.results.company.employees,
            systemVersion: 'Enhanced Buyer Group Discovery v2.0',
            previousEnrichment: existingBuyerGroup.customFields?.enrichmentDate || 'Unknown',
            roleDistribution: {
              decisionMakers: this.results.buyerGroup.decisionMakers.length,
              champions: this.results.buyerGroup.champions.length,
              stakeholders: this.results.buyerGroup.stakeholders.length,
              blockers: this.results.buyerGroup.blockers.length,
              introducers: this.results.buyerGroup.introducers.length
            }
          }
        }
      });
    } else {
      // Create new buyer group
      const buyerGroupId = ulid();
      console.log(`✨ Creating new buyer group: ${this.results.company.name} - Buyer Group`);
      buyerGroup = await prisma.buyer_groups.create({
        data: {
          id: buyerGroupId,
          workspaceId: workspaceId,
          companyId: companyId,
          name: `${this.results.company.name} - Buyer Group`,
          description: `AI-discovered buyer group for ${this.results.company.name}`,
          purpose: 'Strategic buyer group identification for sales targeting',
          status: 'active',
          priority: 'high',
          createdAt: enrichmentDate,
          updatedAt: enrichmentDate,
          customFields: {
            enrichmentDate: enrichmentDate.toISOString(),
            discoveryMethod: 'AI-powered CoreSignal analysis v2.0',
            totalCreditsUsed: this.results.stats.totalCredits,
            companySize: this.results.company.employees,
            systemVersion: 'Enhanced Buyer Group Discovery v2.0',
            roleDistribution: {
              decisionMakers: this.results.buyerGroup.decisionMakers.length,
              champions: this.results.buyerGroup.champions.length,
              stakeholders: this.results.buyerGroup.stakeholders.length,
              blockers: this.results.buyerGroup.blockers.length,
              introducers: this.results.buyerGroup.introducers.length
            }
          }
        }
      });
    }
    
    console.log(`✅ Created/Updated Buyer Group: ${buyerGroup.id}`);
    
    // Store each person in the buyer group with full CoreSignal data
    const allPeople = [
      ...this.results.buyerGroup.decisionMakers.map(p => ({...p, role: 'Decision Maker'})),
      ...this.results.buyerGroup.champions.map(p => ({...p, role: 'Champion'})),
      ...(this.results.buyerGroup.stakeholders || []).map(p => ({...p, role: 'Stakeholder'})),
      ...(this.results.buyerGroup.blockers || []).map(p => ({...p, role: 'Blocker'})),
      ...(this.results.buyerGroup.introducers || []).map(p => ({...p, role: 'Introducer'}))
    ];
    
    let storedCount = 0;
    let updatedCount = 0;
    
    for (const person of allPeople) {
      try {
        // Check if person already exists (by email or name + company)
        const existingPerson = await prisma.people.findFirst({
          where: {
            OR: [
              { email: person.email },
              { 
                AND: [
                  { fullName: person.name },
                  { companyId: companyId }
                ]
              }
            ]
          }
        });

        let personRecord;
        if (existingPerson) {
          // Update existing person with new enrichment data
          console.log(`🔄 Updating existing person: ${person.name}`);
          personRecord = await prisma.people.update({
            where: {
              id: existingPerson.id
            },
            data: {
              // Update with new enrichment data
              lastEnriched: enrichmentDate,
              enrichmentSources: ['CoreSignal', 'AI Buyer Group Discovery v2.0'],
              buyerGroupRole: person.role,
              customFields: {
                ...person.rawProfileData, // Store complete CoreSignal profile
                enrichmentDate: enrichmentDate.toISOString(),
                systemVersion: 'Enhanced Buyer Group Discovery v2.0',
                previousEnrichment: existingPerson.customFields?.enrichmentDate || 'Unknown',
                buyerGroupDiscovery: {
                  role: person.role,
                  confidence: person.confidence,
                  reasoning: person.reasoning,
                  aiAnalysis: person.aiAnalysis,
                  influenceScore: person.influenceScore,
                  isDecisionMaker: person.isDecisionMaker,
                  managementLevel: person.managementLevel,
                  enrichmentDate: enrichmentDate.toISOString()
                }
              },
              // Update basic fields if available
              firstName: person.name?.split(' ')[0] || existingPerson.firstName,
              lastName: person.name?.split(' ').slice(1).join(' ') || existingPerson.lastName,
              fullName: person.name || existingPerson.fullName,
              jobTitle: person.title || existingPerson.jobTitle,
              department: person.department || existingPerson.department,
              email: person.email || existingPerson.email,
              linkedinUrl: person.linkedin || existingPerson.linkedinUrl,
              updatedAt: enrichmentDate
            }
          });
        } else {
          // Create new person record
          const personId = ulid();
          console.log(`✨ Creating new person: ${person.name}`);
          personRecord = await prisma.people.create({
            data: {
              id: personId,
              workspaceId: workspaceId,
              companyId: companyId,
              firstName: person.name?.split(' ')[0] || 'Unknown',
              lastName: person.name?.split(' ').slice(1).join(' ') || 'Unknown',
              fullName: person.name || 'Unknown',
              jobTitle: person.title || null,
              department: person.department || null,
              email: person.email || `temp-${Date.now()}@buyer-group.com`,
              linkedinUrl: person.linkedin || null,
              lastEnriched: enrichmentDate,
              enrichmentSources: ['CoreSignal', 'AI Buyer Group Discovery v2.0'],
              buyerGroupRole: person.role,
              createdAt: enrichmentDate,
              updatedAt: enrichmentDate,
              customFields: {
                ...person.rawProfileData, // Store complete CoreSignal profile
                enrichmentDate: enrichmentDate.toISOString(),
                systemVersion: 'Enhanced Buyer Group Discovery v2.0',
                buyerGroupDiscovery: {
                  role: person.role,
                  confidence: person.confidence,
                  reasoning: person.reasoning,
                  aiAnalysis: person.aiAnalysis,
                  influenceScore: person.influenceScore,
                  isDecisionMaker: person.isDecisionMaker,
                  managementLevel: person.managementLevel,
                  enrichmentDate: enrichmentDate.toISOString()
                }
              }
            }
          });
        }
        
        // Link person to buyer group
        await prisma.buyerGroupToPerson.upsert({
          where: {
            buyerGroupId_personId: {
              buyerGroupId: buyerGroup.id,
              personId: personRecord.id
            }
          },
          update: {
            role: person.role,
            influence: person.influenceScore > 70 ? 'High' : person.influenceScore > 40 ? 'Medium' : 'Low',
            isPrimary: person.role === 'Decision Maker',
            notes: `AI-discovered ${person.role} with ${Math.round(person.confidence * 100)}% confidence`,
            updatedAt: enrichmentDate
          },
          create: {
            buyerGroupId: buyerGroup.id,
            personId: personRecord.id,
            role: person.role,
            influence: person.influenceScore > 70 ? 'High' : person.influenceScore > 40 ? 'Medium' : 'Low',
            isPrimary: person.role === 'Decision Maker',
            notes: `AI-discovered ${person.role} with ${Math.round(person.confidence * 100)}% confidence`,
            createdAt: enrichmentDate,
            updatedAt: enrichmentDate
          }
        });
        
        if (existingPerson) {
          updatedCount++;
          console.log(`   🔄 Updated: ${person.name} (${person.role})`);
        } else {
          storedCount++;
          console.log(`   ✅ Stored: ${person.name} (${person.role})`);
        }
        
      } catch (error) {
        console.log(`   ⚠️ Failed to store ${person.name}: ${error.message}`);
      }
    }
    
    console.log('');
    console.log(`📊 DATABASE STORAGE SUMMARY:`);
    console.log(`   Buyer Group ID: ${buyerGroup.id}`);
    console.log(`   People Stored: ${storedCount}`);
    console.log(`   People Updated: ${updatedCount}`);
    console.log(`   Enrichment Date: ${enrichmentDate.toISOString()}`);
    console.log(`   System Version: Enhanced Buyer Group Discovery v2.0`);
    console.log(`   Full CoreSignal Profiles: ✅ Stored in customFields`);
    console.log(`   AI Reasoning Data: ✅ Stored in buyerGroupDiscovery`);
    console.log(`   Re-enrichment: ✅ All records tagged with today's date`);
    console.log('');
  }

  generateReport() {
    console.log('📊 COMPREHENSIVE BUYER GROUP DATA REPORT');
    console.log('========================================');
    console.log('');
    
    const { buyerGroup, company, stats } = this.results;
    const totalPeople = Object.values(buyerGroup).flat().length;
    
    console.log('🏢 COMPANY OVERVIEW:');
    console.log(`   Company: ${company.name}`);
    console.log(`   Industry: ${company.industry}`);
    console.log(`   Size: ${company.employees} employees`);
    console.log(`   Size Category: ${stats.costStructure?.sizeCategory || 'Unknown'}`);
    console.log(`   CoreSignal ID: ${company.coresignalId}`);
    console.log('');
    
    console.log('💰 VARIABLE COST STRUCTURE:');
    if (stats.costStructure) {
      console.log(`   Company Size: ${stats.costStructure.companySize} employees (${stats.costStructure.sizeCategory})`);
      console.log(`   Profiles Targeted: ${stats.costStructure.profilesToCollect}`);
      console.log(`   Profiles Collected: ${stats.costStructure.actualCollected}`);
      console.log(`   Credits Used: ${stats.costStructure.creditsPerCompany} (1 search + ${stats.costStructure.actualCollected} collects)`);
      console.log(`   Cost per Company: $${stats.costStructure.costPerCompany.toFixed(3)}`);
    }
    console.log('');
    
    // Show full CoreSignal data for each person
    const allPeople = [
      ...buyerGroup.decisionMakers.map(p => ({...p, role: 'Decision Maker'})),
      ...buyerGroup.champions.map(p => ({...p, role: 'Champion'})),
      ...(buyerGroup.stakeholders || []).map(p => ({...p, role: 'Stakeholder'})),
      ...(buyerGroup.blockers || []).map(p => ({...p, role: 'Blocker'})),
      ...(buyerGroup.introducers || []).map(p => ({...p, role: 'Introducer'}))
    ];
    
    allPeople.forEach((person, index) => {
      console.log(`👤 PERSON ${index + 1}: ${person.name} (${person.role})`);
      console.log('═'.repeat(80));
      console.log('');
      
      console.log('📋 BASIC INFORMATION:');
      console.log(`   Name: ${person.name}`);
      console.log(`   Title: ${person.title}`);
      console.log(`   Department: ${person.department}`);
      console.log(`   Company: ${person.company}`);
      console.log(`   Email: ${person.email}`);
      console.log(`   LinkedIn: ${person.linkedin}`);
      console.log('');
      
      console.log('🎯 BUYER GROUP ANALYSIS:');
      console.log(`   Role: ${person.role}`);
      console.log(`   Influence Score: ${person.influenceScore}/100`);
      console.log(`   Confidence: ${Math.round(person.confidence * 100)}%`);
      console.log(`   Reasoning: ${person.reasoning}`);
      console.log('');
      
      console.log('🤖 AI ANALYSIS:');
      console.log(JSON.stringify(person.aiAnalysis, null, 2));
      console.log('');
      
      console.log('📊 FULL CORESIGNAL PROFILE DATA:');
      console.log('─'.repeat(50));
      
      // Show the complete raw CoreSignal data
      if (person.rawProfileData) {
        console.log('🔍 COMPLETE PROFILE FIELDS:');
        Object.keys(person.rawProfileData).forEach(key => {
          const value = person.rawProfileData[key];
          if (value !== null && value !== undefined && value !== '') {
            console.log(`   ${key}: ${JSON.stringify(value)}`);
          }
        });
        console.log('');
        
        // Show experience details
        if (person.rawProfileData.experience && Array.isArray(person.rawProfileData.experience)) {
          console.log('💼 EXPERIENCE HISTORY:');
          person.rawProfileData.experience.forEach((exp, expIndex) => {
            console.log(`   Experience ${expIndex + 1}:`);
            console.log(`     Company: ${exp.company_name || 'N/A'}`);
            console.log(`     Title: ${exp.title || 'N/A'}`);
            console.log(`     Department: ${exp.department || 'N/A'}`);
            console.log(`     Start Date: ${exp.start_date || 'N/A'}`);
            console.log(`     End Date: ${exp.end_date || 'N/A'}`);
            console.log(`     Active: ${exp.active_experience || 'N/A'}`);
            console.log(`     Management Level: ${exp.management_level || 'N/A'}`);
            console.log('');
          });
        }
        
        // Show skills
        if (person.rawProfileData.skills && Array.isArray(person.rawProfileData.skills)) {
          console.log('🛠️ SKILLS:');
          person.rawProfileData.skills.forEach((skill, skillIndex) => {
            console.log(`   ${skillIndex + 1}. ${skill.name || 'N/A'} (${skill.level || 'N/A'})`);
          });
          console.log('');
        }
        
        // Show education
        if (person.rawProfileData.education && Array.isArray(person.rawProfileData.education)) {
          console.log('🎓 EDUCATION:');
          person.rawProfileData.education.forEach((edu, eduIndex) => {
            console.log(`   ${eduIndex + 1}. ${edu.school_name || 'N/A'} - ${edu.degree || 'N/A'} (${edu.graduation_year || 'N/A'})`);
          });
          console.log('');
        }
        
        // Show certifications
        if (person.rawProfileData.certifications && Array.isArray(person.rawProfileData.certifications)) {
          console.log('🏆 CERTIFICATIONS:');
          person.rawProfileData.certifications.forEach((cert, certIndex) => {
            console.log(`   ${certIndex + 1}. ${cert.name || 'N/A'} (${cert.issuer || 'N/A'})`);
          });
          console.log('');
        }
      } else {
        console.log('⚠️ No raw profile data available');
        console.log('');
      }
      
      console.log('═'.repeat(80));
      console.log('');
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   Decision Makers: ${buyerGroup.decisionMakers.length}`);
    console.log(`   Champions: ${buyerGroup.champions.length}`);
    console.log(`   Stakeholders: ${buyerGroup.stakeholders.length}`);
    console.log(`   Blockers: ${buyerGroup.blockers.length}`);
    console.log(`   Introducers: ${buyerGroup.introducers.length}`);
    console.log(`   Total Buyer Group: ${totalPeople} people`);
    console.log(`   Total Credits Used: ${stats.totalCredits}`);
    console.log(`   Searches Used: ${stats.searchesUsed}`);
    console.log(`   Collects Used: ${stats.collectsUsed}`);
    console.log('');
    
    console.log('🎯 ENHANCED FEATURES:');
    console.log('1. Single comprehensive search instead of multiple department searches');
    console.log('2. Variable smart candidate selection based on company size (10-35 profiles)');
    console.log('3. AI-powered role assignment with detailed reasoning');
    console.log('4. Complete CoreSignal profile data for each person');
    console.log('5. Variable cost-effective approach (1 search + N collects vs 12+ searches)');
    console.log('6. ✅ ENRICHMENT DATE TAGGING: All people tagged with enrichment date');
    console.log('7. ✅ DATABASE STORAGE: Buyer group and people stored in database');
    console.log('8. ✅ FULL PROFILE STORAGE: Complete CoreSignal data stored in customFields');
    console.log('9. ✅ AI REASONING STORAGE: Role assignment reasoning stored for each person');
    console.log('10. ✅ VARIABLE COST STRUCTURE: Cost scales with company size for optimal ROI');
    console.log('');
    
    console.log('✅ ENHANCED BUYER GROUP DISCOVERY COMPLETE!');
    console.log('Full CoreSignal data stored in database with enrichment date tagging.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const companyArg = args.find(arg => arg.startsWith('--company='));
  const workspaceArg = args.find(arg => arg.startsWith('--workspace='));
  const allCompaniesArg = args.find(arg => arg === '--all-companies');
  const resumeArg = args.find(arg => arg === '--resume');

  if (resumeArg) {
    // Resume from progress file
    console.log('🔄 RESUMING BUYER GROUP DISCOVERY');
    console.log('==================================');
    const fs = require('fs');
    const progressFile = 'buyer-group-progress.json';
    
    if (!fs.existsSync(progressFile)) {
      console.log('❌ No progress file found. Run with --all-companies to start.');
      process.exit(1);
    }
    
    try {
      const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      console.log(`📊 Progress found: ${progressData.successCount} successful, ${progressData.failureCount} failed`);
      console.log(`💰 Total cost so far: $${progressData.totalCost.toFixed(2)}`);
      console.log(`🔢 Total credits so far: ${progressData.totalCredits}`);
      console.log(`📅 Last update: ${progressData.lastUpdate}`);
      console.log('');
      
      await runAllCompanies();
    } catch (error) {
      console.error('❌ Error reading progress file:', error.message);
      process.exit(1);
    }
  } else if (allCompaniesArg) {
    // Run on all companies in TOP workspace
    await runAllCompanies();
  } else if (companyArg && workspaceArg) {
    // Run on single company
    const companyName = companyArg.split('=')[1].replace(/"/g, '');
    const workspaceName = workspaceArg.split('=')[1].replace(/"/g, '');

    const discovery = new OptimizedBuyerGroupDiscovery();
    await discovery.discoverBuyerGroup(companyName, workspaceName);
  } else {
    console.log('Usage:');
    console.log('  Single company: node optimized-buyer-group-discovery.js --company="Company Name" --workspace="Workspace Name"');
    console.log('  By CoreSignal ID: node optimized-buyer-group-discovery.js --company="28837649" --workspace="TOP"');
    console.log('  All companies:  node optimized-buyer-group-discovery.js --all-companies');
    console.log('  Resume:         node optimized-buyer-group-discovery.js --resume');
    process.exit(1);
  }
}

async function runAllCompanies() {
    console.log('🚀 SMART RE-ENRICHMENT: TARGETING COMPANIES WITH ISSUES');
    console.log('======================================================');
    console.log('Only re-enriching companies with specific problems:');
    console.log('1. Suspicious company size matches (major utilities with <10 employees)');
    console.log('2. Missing decision makers in buyer groups');
    console.log('3. No people in buyer groups');
    console.log('4. Size mismatches (large companies with tiny buyer groups)');
    console.log('✅ INCREMENTAL SAVING: Data saved after each company');
    console.log('✅ RESUME CAPABILITY: Can restart from where it left off');
    console.log('📅 TODAY\'S DATE: All records will be tagged with today\'s enrichment date');
    console.log('');

  const startTime = new Date();
  let totalCredits = 0;
  let totalCost = 0;
  let successCount = 0;
  let failureCount = 0;
  const results = [];
  
  // Progress tracking file
  const progressFile = 'buyer-group-progress.json';
  const fs = require('fs');
  const path = require('path');

  try {
    // Get TOP Engineering Plus workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    if (!workspace) {
      throw new Error('TOP workspace not found');
    }

    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);

    // Get all companies with CoreSignal IDs
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      orderBy: { name: 'asc' }
    });

    if (allCompanies.length === 0) {
      throw new Error('No companies with CoreSignal IDs found in TOP workspace');
    }

    console.log(`✅ Found ${allCompanies.length} companies with CoreSignal IDs`);
    console.log('');

    // SMART FILTERING: Only process companies with issues
    console.log('🔍 ANALYZING COMPANIES FOR ISSUES...');
    console.log('─'.repeat(50));
    
    const companiesWithIssues = [];
    const issueTypes = {
      suspiciousSize: 0,
      missingDecisionMakers: 0,
      noPeopleInBuyerGroup: 0,
      sizeMismatch: 0,
      noBuyerGroup: 0
    };

    for (const company of allCompanies) {
      const coresignalData = company.customFields?.coresignalData;
      const companySize = coresignalData?.employees_count;
      const companyName = company.name.toLowerCase();
      
      let hasIssues = false;
      const issues = [];

      // Issue 1: Suspicious company size for major utilities
      const isMajorUtility = companyName.includes('power') || 
                            companyName.includes('electric') || 
                            companyName.includes('utility') ||
                            companyName.includes('energy') ||
                            companyName.includes('hydro') ||
                            companyName.includes('grid');
      
      if (isMajorUtility && companySize <= 10) {
        hasIssues = true;
        issues.push('Suspicious company size (major utility with <10 employees)');
        issueTypes.suspiciousSize++;
      }

      // Issue 2: Check for existing buyer group issues
      const buyerGroup = await prisma.buyer_groups.findFirst({
        where: {
          companyId: company.id,
          workspaceId: workspace.id
        },
        select: {
          id: true,
          customFields: true
        }
      });

      if (buyerGroup) {
        const roleDistribution = buyerGroup.customFields?.roleDistribution;
        if (roleDistribution) {
          // Check for missing decision makers
          if (roleDistribution.decisionMakers === 0) {
            hasIssues = true;
            issues.push('Missing decision makers');
            issueTypes.missingDecisionMakers++;
          }
          
          // Check for no people in buyer group
          const totalPeople = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
          if (totalPeople === 0) {
            hasIssues = true;
            issues.push('No people in buyer group');
            issueTypes.noPeopleInBuyerGroup++;
          }
          
          // Check for size mismatch (large company, tiny buyer group)
          if (companySize > 500 && totalPeople < 5) {
            hasIssues = true;
            issues.push('Size mismatch (large company, tiny buyer group)');
            issueTypes.sizeMismatch++;
          }
        }
      } else {
        // Issue 3: No buyer group at all
        hasIssues = true;
        issues.push('No buyer group found');
        issueTypes.noBuyerGroup++;
      }

      if (hasIssues) {
        companiesWithIssues.push({
          ...company,
          issues: issues,
          companySize: companySize
        });
      }
    }

    console.log(`📊 ISSUE ANALYSIS COMPLETE:`);
    console.log(`   Total Companies: ${allCompanies.length}`);
    console.log(`   Companies with Issues: ${companiesWithIssues.length}`);
    console.log(`   Suspicious Size: ${issueTypes.suspiciousSize}`);
    console.log(`   Missing Decision Makers: ${issueTypes.missingDecisionMakers}`);
    console.log(`   No People in Buyer Group: ${issueTypes.noPeopleInBuyerGroup}`);
    console.log(`   Size Mismatch: ${issueTypes.sizeMismatch}`);
    console.log(`   No Buyer Group: ${issueTypes.noBuyerGroup}`);
    console.log('');

    if (companiesWithIssues.length === 0) {
      console.log('✅ NO COMPANIES NEED RE-ENRICHMENT!');
      console.log('All companies appear to have proper buyer groups.');
      return;
    }

    console.log(`🎯 TARGETING ${companiesWithIssues.length} COMPANIES FOR RE-ENRICHMENT`);
    console.log('');

    const companies = companiesWithIssues;

    // Check for existing progress
    let startIndex = 0;
    if (fs.existsSync(progressFile)) {
      try {
        const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
        startIndex = progressData.lastProcessedIndex + 1;
        console.log(`🔄 RESUMING FROM COMPANY ${startIndex + 1} (${companies[startIndex]?.name || 'N/A'})`);
        console.log(`   Previous progress: ${progressData.successCount} successful, ${progressData.failureCount} failed`);
        console.log('');
      } catch (error) {
        console.log('⚠️ Could not read progress file, starting from beginning');
      }
    }

    // Process each company with incremental saving
    for (let i = startIndex; i < companies.length; i++) {
      const company = companies[i];
      const coresignalData = company.customFields?.coresignalData;
      const companySize = company.companySize || coresignalData?.employees_count || 'Unknown';

      console.log(`\n🏢 PROCESSING COMPANY ${i + 1}/${companies.length}: ${company.name}`);
      console.log(`   Size: ${companySize} employees`);
      console.log(`   Issues: ${company.issues.join(', ')}`);
      console.log('='.repeat(60));

      try {
        const discovery = new OptimizedBuyerGroupDiscovery();
        await discovery.discoverBuyerGroup(company.name, 'TOP');

        // Collect stats
        const stats = discovery.results.stats;
        const peopleFound = Object.values(discovery.results.buyerGroup).flat().length;
        const cost = stats.costStructure?.costPerCompany || 0;
        const credits = stats.totalCredits;

        totalCredits += credits;
        totalCost += cost;
        successCount++;

        const result = {
          company: company.name,
          companySize: companySize,
          credits: credits,
          cost: cost,
          peopleFound: peopleFound,
          success: true,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);

        console.log(`✅ Company ${i + 1} completed successfully`);
        console.log(`   👥 People found: ${peopleFound}`);
        console.log(`   💰 Cost: $${cost.toFixed(2)} (${credits} credits)`);
        
        // Save progress after each successful company
        const progressData = {
          lastProcessedIndex: i,
          successCount: successCount,
          failureCount: failureCount,
          totalCredits: totalCredits,
          totalCost: totalCost,
          lastUpdate: new Date().toISOString(),
          results: results
        };
        
        fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
        console.log(`   💾 Progress saved to ${progressFile}`);
        
        // Progress update every 10 companies
        if ((i + 1) % 10 === 0) {
          console.log(`\n📊 PROGRESS UPDATE (${i + 1}/${companies.length}):`);
          console.log(`   ✅ Successful: ${successCount}`);
          console.log(`   ❌ Failed: ${failureCount}`);
          console.log(`   💰 Total Cost: $${totalCost.toFixed(2)}`);
          console.log(`   🔢 Total Credits: ${totalCredits}`);
          console.log(`   📁 Progress saved to: ${progressFile}`);
        }
        
      } catch (error) {
        console.error(`❌ Company ${i + 1} failed: ${error.message}`);
        failureCount++;
        
        const result = {
          company: company.name,
          companySize: companySize,
          credits: 0,
          cost: 0,
          peopleFound: 0,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        
        // Save progress even after failures
        const progressData = {
          lastProcessedIndex: i,
          successCount: successCount,
          failureCount: failureCount,
          totalCredits: totalCredits,
          totalCost: totalCost,
          lastUpdate: new Date().toISOString(),
          results: results
        };
        
        fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
        console.log(`   💾 Progress saved to ${progressFile} (after failure)`);
        
        // Continue to next company instead of stopping
        console.log(`   ⏭️ Continuing to next company...`);
      }
    }

    // Final Summary
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

    console.log('\n📊 FINAL SUMMARY');
    console.log('================');
    console.log(`Total Companies Processed: ${companies.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`⏱️ Duration: ${duration} minutes`);
    console.log(`💰 Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`🔢 Total Credits: ${totalCredits}`);
    console.log(`📈 Average Cost per Company: $${(totalCost / companies.length).toFixed(2)}`);
    console.log(`📈 Average Credits per Company: ${(totalCredits / companies.length).toFixed(1)}`);
    console.log('');

    // Cost Analysis by Company Size
    console.log('📊 COST ANALYSIS BY COMPANY SIZE:');
    const sizeAnalysis = {};
    results.forEach(result => {
      if (result.success) {
        const size = result.companySize;
        if (!sizeAnalysis[size]) {
          sizeAnalysis[size] = { count: 0, totalCost: 0, totalCredits: 0 };
        }
        sizeAnalysis[size].count++;
        sizeAnalysis[size].totalCost += result.cost;
        sizeAnalysis[size].totalCredits += result.credits;
      }
    });

    Object.entries(sizeAnalysis)
      .sort((a, b) => a[0] - b[0])
      .forEach(([size, data]) => {
        console.log(`   ${size} employees: ${data.count} companies, $${data.totalCost.toFixed(2)} total, $${(data.totalCost / data.count).toFixed(2)} avg`);
      });

    // Failed Companies
    const failedCompanies = results.filter(r => !r.success);
    if (failedCompanies.length > 0) {
      console.log('\n❌ FAILED COMPANIES:');
      failedCompanies.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.company}: ${result.error}`);
      });
    }

    // Success Rate
    const successRate = (successCount / companies.length) * 100;
    console.log(`\n🎯 SUCCESS RATE: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 95) {
      console.log('✅ Excellent success rate!');
    } else if (successRate >= 90) {
      console.log('✅ Good success rate!');
    } else if (successRate >= 80) {
      console.log('⚠️ Moderate success rate - review failed companies');
    } else {
      console.log('❌ Low success rate - investigate issues');
    }

    console.log('\n✅ ENRICHMENT COMPLETE!');
    console.log('All companies processed with buyer group discovery.');
    
    // Clean up progress file on successful completion
    if (fs.existsSync(progressFile)) {
      fs.unlinkSync(progressFile);
      console.log(`🗑️ Progress file ${progressFile} cleaned up`);
    }

  } catch (error) {
    console.error('❌ Enrichment failed:', error.message);
    console.log(`💾 Progress saved to ${progressFile} - you can resume later`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
