/**
 * Smart Buyer Group Pipeline - Main Orchestrator
 * 
 * Coordinates 8-stage waterfall pipeline using all modules
 * Implements double-waterfall approach for cost efficiency
 */

const { CompanyIntelligence } = require('./company-intelligence');
const { PreviewSearch } = require('./preview-search');
const { SmartScoring } = require('./smart-scoring');
const { RoleAssignment } = require('./role-assignment');
const { CrossFunctionalCoverage } = require('./cross-functional');
const { CohesionValidator } = require('./cohesion-validator');
const { ResearchReport } = require('./research-report');
const { extractDomain, createUniqueId, delay } = require('./utils');

class SmartBuyerGroupPipeline {
  constructor(options = {}) {
    this.prisma = options.prisma || new (require('@prisma/client').PrismaClient)();
    this.workspaceId = options.workspaceId;
    this.dealSize = options.dealSize || 150000;
    this.productCategory = options.productCategory || 'sales';
    this.targetCompany = options.targetCompany || options.linkedinUrl;
    
    // Initialize modules
    this.companyIntel = new CompanyIntelligence(this.prisma, this.workspaceId);
    this.previewSearch = new PreviewSearch(process.env.CORESIGNAL_API_KEY);
    this.cohesionValidator = new CohesionValidator();
    this.reportGenerator = new ResearchReport();
    
    // Pipeline state
    this.pipelineState = {
      startTime: Date.now(),
      stage: 'initializing',
      totalEmployees: 0,
      processedEmployees: 0,
      finalBuyerGroup: [],
      costs: { preview: 0, collect: 0, total: 0 }
    };
  }

  /**
   * Run the complete buyer group discovery pipeline
   * @returns {object} Complete results with buyer group and report
   */
  async run() {
    console.log('🚀 Smart Buyer Group Discovery Pipeline Starting...');
    console.log(`📊 Target: ${this.targetCompany} | Deal Size: $${this.dealSize.toLocaleString()}`);
    
    try {
      // Stage 1: Company Intelligence
      const intelligence = await this.executeStage('company-intelligence', async () => {
        return await this.companyIntel.research(this.targetCompany);
      });
      
      const params = this.companyIntel.calculateOptimalParameters(intelligence, this.dealSize);
      
      // Stage 2: Wide Preview Search (cheap)
      const previewEmployees = await this.executeStage('preview-search', async () => {
        return await this.previewSearch.discoverAllStakeholders(
          this.targetCompany,
          params.maxPreviewPages
        );
      });
      
      this.pipelineState.totalEmployees = previewEmployees.length;
      this.pipelineState.costs.preview = previewEmployees.length * 0.1; // $0.10 per preview
      
      // Stage 3: Smart Scoring & Filtering (free)
      const scoredEmployees = await this.executeStage('smart-scoring', async () => {
        const scoring = new SmartScoring(intelligence, this.dealSize, this.productCategory);
        return scoring.scoreEmployees(previewEmployees);
      });
      
      const relevantEmployees = scoredEmployees.filter(emp => 
        emp.relevance > 0.1 && emp.scores.influence > 2
      );
      
      console.log(`🎯 Filtered to ${relevantEmployees.length} relevant candidates`);
      
      // Stage 4: Role Assignment (free)
      const employeesWithRoles = await this.executeStage('role-assignment', async () => {
        const roleAssignment = new RoleAssignment(
          this.dealSize, 
          this.companyIntelligence?.revenue || 0, 
          this.companyIntelligence?.employees || 0
        );
        return roleAssignment.assignRoles(relevantEmployees);
      });
      
      // Stage 5: Select Optimal Group (free)
      const initialBuyerGroup = await this.executeStage('group-selection', async () => {
        const roleAssignment = new RoleAssignment(
          this.dealSize, 
          this.companyIntelligence?.revenue || 0, 
          this.companyIntelligence?.employees || 0
        );
        return roleAssignment.selectOptimalBuyerGroup(employeesWithRoles, params.buyerGroupSize);
      });
      
      // Stage 6: Cross-Functional Coverage (free)
      const { enhanced: crossFunctionalGroup, coverage } = await this.executeStage('cross-functional', async () => {
        const crossFunctional = new CrossFunctionalCoverage(this.dealSize);
        return crossFunctional.validate(initialBuyerGroup, relevantEmployees);
      });
      
      // Stage 7: Collect Full Profiles (expensive - only for final group)
      const enrichedBuyerGroup = await this.executeStage('profile-collection', async () => {
        console.log(`🔍 Debug: crossFunctionalGroup =`, crossFunctionalGroup ? crossFunctionalGroup.length : 'undefined');
        console.log(`🔍 Debug: initialBuyerGroup =`, initialBuyerGroup ? initialBuyerGroup.length : 'undefined');
        const groupToEnrich = crossFunctionalGroup || initialBuyerGroup || [];
        console.log(`🔍 Debug: groupToEnrich =`, groupToEnrich.length);
        return await this.collectFullProfiles(groupToEnrich);
      });
      
      this.pipelineState.costs.collect = enrichedBuyerGroup.length * 1.0; // $1.00 per collect
      this.pipelineState.costs.total = this.pipelineState.costs.preview + this.pipelineState.costs.collect;
      
      // Stage 8: Cohesion Validation (free)
      const cohesion = await this.executeStage('cohesion-validation', async () => {
        return this.cohesionValidator.validate(enrichedBuyerGroup || []);
      });
      
      // Stage 9: Generate Research Report (free)
      const report = await this.executeStage('report-generation', async () => {
        console.log(`🔍 Debug: enrichedBuyerGroup =`, enrichedBuyerGroup ? enrichedBuyerGroup.length : 'undefined');
        console.log(`🔍 Debug: enrichedBuyerGroup type =`, typeof enrichedBuyerGroup);
        console.log(`🔍 Debug: enrichedBuyerGroup || [] =`, (enrichedBuyerGroup || []).length);
        
        try {
          return this.reportGenerator.generate({
            intelligence,
            previewEmployees,
            buyerGroup: enrichedBuyerGroup || [],
            coverage,
            cohesion,
            costs: this.pipelineState.costs,
            dealSize: this.dealSize,
            companyName: intelligence.companyName || extractDomain(this.targetCompany),
            searchParameters: params
          });
        } catch (error) {
          console.error(`❌ Report generation error:`, error.message);
          console.error(`❌ Error stack:`, error.stack);
          throw error;
        }
      });
      
      // Stage 10: Database Persistence
      await this.executeStage('database-persistence', async () => {
        return await this.saveBuyerGroupToDatabase(enrichedBuyerGroup, report, intelligence);
      });
      
      this.pipelineState.finalBuyerGroup = enrichedBuyerGroup;
      this.pipelineState.stage = 'completed';
      
      const processingTime = Date.now() - this.pipelineState.startTime;
      
      console.log('✅ Pipeline completed successfully!');
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`💰 Total cost: $${this.pipelineState.costs.total.toFixed(2)}`);
      console.log(`👥 Final buyer group: ${enrichedBuyerGroup.length} members`);
      console.log(`📊 Cohesion score: ${cohesion.score}%`);
      
      return {
        buyerGroup: enrichedBuyerGroup,
        report,
        cohesion,
        coverage,
        intelligence,
        costs: this.pipelineState.costs,
        processingTime,
        pipelineState: this.pipelineState
      };
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      this.pipelineState.stage = 'failed';
      this.pipelineState.error = error.message;
      throw error;
    }
  }

  /**
   * Execute a pipeline stage with error handling and progress tracking
   * @param {string} stageName - Name of the stage
   * @param {Function} stageFunction - Function to execute
   * @returns {*} Stage result
   */
  async executeStage(stageName, stageFunction) {
    console.log(`🔄 Executing stage: ${stageName}`);
    this.pipelineState.stage = stageName;
    
    try {
      const result = await stageFunction();
      console.log(`✅ Stage completed: ${stageName}`);
      return result;
    } catch (error) {
      console.error(`❌ Stage failed: ${stageName}`, error.message);
      throw new Error(`Stage ${stageName} failed: ${error.message}`);
    }
  }

  /**
   * Collect full profiles for final buyer group members
   * @param {Array} buyerGroup - Buyer group members
   * @returns {Array} Enriched buyer group with full profiles
   */
  async collectFullProfiles(buyerGroup) {
    console.log(`📥 Collecting full profiles for ${buyerGroup.length} members...`);
    
    const enriched = [];
    
    for (const member of buyerGroup) {
      try {
        const fullProfile = await this.collectSingleProfile(member.id);
        enriched.push({
          ...member,
          fullProfile,
          enrichedAt: new Date().toISOString()
        });
        
        // Rate limiting
        await delay(200);
      } catch (error) {
        console.error(`❌ Failed to collect profile for ${member.name}:`, error.message);
        // Keep member with preview data
        enriched.push({
          ...member,
          fullProfile: null,
          enrichmentError: error.message
        });
      }
    }
    
    console.log(`✅ Collected ${enriched.length} full profiles`);
    return enriched;
  }

  /**
   * Collect single profile from Coresignal with retry logic
   * @param {string} employeeId - Employee ID
   * @param {number} maxRetries - Maximum number of retries
   * @returns {object} Full profile data
   */
  async collectSingleProfile(employeeId, maxRetries = 3) {
    const apiKey = process.env.CORESIGNAL_API_KEY;
    const baseUrl = 'https://api.coresignal.com/cdapi/v2';
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 Collecting profile ${employeeId} (attempt ${attempt}/${maxRetries})...`);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        // Try employee_multi_source/collect first
        const response = await fetch(`${baseUrl}/employee_multi_source/collect/${employeeId}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Profile collected successfully on attempt ${attempt}`);
          return await response.json();
        }
        
        // If not found, try person_multi_source/collect
        if (response.status === 404) {
          console.log(`⚠️ Employee not found, trying person collect...`);
          
          const personResponse = await fetch(`${baseUrl}/person_multi_source/collect/${employeeId}`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
              'Accept': 'application/json'
            },
            signal: controller.signal
          });
          
          if (personResponse.ok) {
            console.log(`✅ Person profile collected successfully on attempt ${attempt}`);
            return await personResponse.json();
          }
        }
        
        // Handle specific error codes
        if (response.status === 524 || response.status === 504) {
          throw new Error(`Gateway timeout (${response.status}) - attempt ${attempt}`);
        } else if (response.status === 429) {
          throw new Error(`Rate limited (${response.status}) - attempt ${attempt}`);
        } else {
          throw new Error(`Profile collection failed: ${response.status} ${response.statusText}`);
        }
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Profile collection attempt ${attempt} failed: ${error.message}`);
        
        // Don't retry on non-retryable errors
        if (error.name === 'AbortError') {
          console.log(`⏰ Request timeout on attempt ${attempt}`);
        } else if (error.message.includes('401') || error.message.includes('403')) {
          console.log(`🔒 Authentication error - not retrying`);
          throw error;
        } else if (error.message.includes('404')) {
          console.log(`🔍 Profile not found - not retrying`);
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          console.log(`💥 All ${maxRetries} attempts failed for profile ${employeeId}`);
          throw lastError;
        }
        
        // Wait before retrying with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
      }
    }
    
    throw lastError;
  }

  /**
   * Save buyer group to database
   * @param {Array} buyerGroup - Final buyer group
   * @param {object} report - Research report
   * @param {object} intelligence - Company intelligence
   */
  async saveBuyerGroupToDatabase(buyerGroup, report, intelligence) {
    console.log('💾 Saving buyer group to database...');
    
    try {
      // Create BuyerGroups record
      const buyerGroupRecord = await this.prisma.buyerGroups.create({
        data: {
          id: createUniqueId('bg'),
          workspaceId: this.workspaceId,
          companyName: intelligence.companyName || extractDomain(this.targetCompany),
          website: this.targetCompany.includes('http') ? this.targetCompany : null,
          industry: intelligence.industry,
          companySize: intelligence.employeeCount?.toString(),
          cohesionScore: report.cohesionAnalysis.overallScore,
          overallConfidence: report.qualityMetrics.averageConfidence,
          totalMembers: buyerGroup.length,
          processingTime: Date.now() - this.pipelineState.startTime,
          metadata: {
            report: report,
            intelligence: intelligence,
            costs: this.pipelineState.costs,
            pipelineVersion: '2.0.0',
            createdAt: new Date().toISOString()
          },
          updatedAt: new Date()
        }
      });
      
      // Create BuyerGroupMembers records
      const memberRecords = buyerGroup.map(member => ({
        id: createUniqueId('bgm'),
        buyerGroupId: buyerGroupRecord.id,
        name: member.name,
        title: member.title,
        role: member.buyerGroupRole,
        email: member.email,
        phone: member.phone,
        linkedin: member.linkedinUrl,
        confidence: member.roleConfidence || 0,
        influenceScore: member.scores?.influence || 0,
        updatedAt: new Date()
      }));
      
      await this.prisma.buyerGroupMembers.createMany({
        data: memberRecords
      });
      
      // Update people records
      for (const member of buyerGroup) {
        if (member.email) {
          await this.prisma.people.upsert({
            where: {
              workspaceId_email: {
                workspaceId: this.workspaceId,
                email: member.email
              }
            },
            create: {
              workspaceId: this.workspaceId,
              firstName: member.name.split(' ')[0] || '',
              lastName: member.name.split(' ').slice(1).join(' ') || '',
              fullName: member.name,
              jobTitle: member.title,
              department: member.department,
              email: member.email,
              phone: member.phone,
              linkedinUrl: member.linkedinUrl,
              buyerGroupRole: member.buyerGroupRole,
              isBuyerGroupMember: true,
              buyerGroupOptimized: true,
              coresignalData: member.fullProfile,
              influenceScore: member.scores?.influence || 0,
              decisionPower: member.scores?.seniority || 0,
              engagementScore: member.overallScore || 0,
              lastEnriched: new Date()
            },
            update: {
              buyerGroupRole: member.buyerGroupRole,
              isBuyerGroupMember: true,
              coresignalData: member.fullProfile,
              influenceScore: member.scores?.influence || 0,
              lastEnriched: new Date()
            }
          });
        }
      }
      
      console.log('✅ Buyer group saved to database successfully');
      
    } catch (error) {
      console.error('❌ Failed to save buyer group to database:', error.message);
      throw error;
    }
  }

  /**
   * Get pipeline status
   * @returns {object} Current pipeline status
   */
  getStatus() {
    return {
      stage: this.pipelineState.stage,
      progress: this.getProgress(),
      costs: this.pipelineState.costs,
      totalEmployees: this.pipelineState.totalEmployees,
      processedEmployees: this.pipelineState.processedEmployees,
      finalBuyerGroupSize: this.pipelineState.finalBuyerGroup.length,
      processingTime: Date.now() - this.pipelineState.startTime
    };
  }

  /**
   * Get progress percentage
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    const stages = [
      'initializing', 'company-intelligence', 'preview-search', 'smart-scoring',
      'role-assignment', 'group-selection', 'cross-functional', 'profile-collection',
      'cohesion-validation', 'report-generation', 'database-persistence', 'completed'
    ];
    
    const currentIndex = stages.indexOf(this.pipelineState.stage);
    return currentIndex >= 0 ? Math.round((currentIndex / (stages.length - 1)) * 100) : 0;
  }

  /**
   * Validate pipeline configuration
   * @returns {object} Validation results
   */
  validateConfiguration() {
    const issues = [];
    
    if (!this.workspaceId) {
      issues.push('Workspace ID is required');
    }
    
    if (!this.targetCompany) {
      issues.push('Target company is required');
    }
    
    if (!process.env.CORESIGNAL_API_KEY) {
      issues.push('CORESIGNAL_API_KEY environment variable is required');
    }
    
    if (this.dealSize <= 0) {
      issues.push('Deal size must be positive');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

module.exports = { SmartBuyerGroupPipeline };
