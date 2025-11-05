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
const { AIReasoning } = require('./ai-reasoning');
const { extractDomain, createUniqueId, delay } = require('./utils');

class SmartBuyerGroupPipeline {
  constructor(options = {}) {
    this.prisma = options.prisma || new (require('@prisma/client').PrismaClient)();
    this.workspaceId = options.workspaceId;
    this.dealSize = options.dealSize || 150000;
    this.productCategory = options.productCategory || 'sales';
    this.targetCompany = options.targetCompany || options.linkedinUrl;
    this.options = options; // Store all options for passing to modules
    
    // Initialize modules
    this.companyIntel = new CompanyIntelligence(this.prisma, this.workspaceId);
    this.previewSearch = new PreviewSearch(process.env.CORESIGNAL_API_KEY);
    this.cohesionValidator = new CohesionValidator();
    this.reportGenerator = new ResearchReport();
    
    // Initialize AI reasoning if API key is available
    this.aiReasoning = process.env.ANTHROPIC_API_KEY ? new AIReasoning(process.env.ANTHROPIC_API_KEY) : null;
    
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
   * @param {object} company - Company object from database
   * @returns {object} Complete results with buyer group and report
   */
  async run(company) {
    console.log('🚀 Smart Buyer Group Discovery Pipeline Starting...');
    console.log(`📊 Target: ${company?.name || 'Unknown'} | Deal Size: $${this.dealSize.toLocaleString()}`);
    
    try {
      // Stage 1: Company Intelligence
      const intelligence = await this.executeStage('company-intelligence', async () => {
        // Use company name, website, or LinkedIn URL as identifier
        const identifier = company.linkedinUrl || company.website || company.name;
        return await this.companyIntel.research(identifier);
      });
      
      const params = this.companyIntel.calculateOptimalParameters(intelligence, this.dealSize);
      
      // Stage 2: Wide Preview Search (cheap)
      const previewEmployees = await this.executeStage('preview-search', async () => {
        return await this.previewSearch.discoverAllStakeholders(
          {
            linkedinUrl: intelligence.linkedinUrl,
            website: intelligence.website,
            companyName: intelligence.companyName
          },
          params.maxPreviewPages,
          params.filteringLevel,
          this.productCategory,
          this.options.customFiltering || null,
          this.options.usaOnly || false
        );
      });
      
      this.pipelineState.totalEmployees = previewEmployees.length;
      this.pipelineState.costs.preview = previewEmployees.length * 0.1; // $0.10 per preview
      
      // Stage 3: Smart Scoring & Filtering (free)
      const scoredEmployees = await this.executeStage('smart-scoring', async () => {
        const scoring = new SmartScoring(intelligence, this.dealSize, this.productCategory, this.options.customFiltering || null);
        return scoring.scoreEmployees(previewEmployees);
      });
      
      // Stage 3: Adaptive Filtering with CEO Fallback
      let relevantEmployees = scoredEmployees.filter(emp => 
        emp.relevance > 0.2 && emp.scores.influence > 2 && emp.scores.departmentFit > 3
      );
      
      console.log(`🎯 Strict filtering: ${relevantEmployees.length} relevant candidates`);
      
      // If zero results, use relaxed filtering
      if (relevantEmployees.length === 0 && scoredEmployees.length > 0) {
        console.log('⚠️ Strict filtering yielded 0 results, applying relaxed criteria...');
        relevantEmployees = scoredEmployees.filter(emp => 
          emp.relevance > 0.1 && emp.scores.influence > 1 && emp.scores.departmentFit > 1
        );
        console.log(`🎯 Relaxed filtering: ${relevantEmployees.length} relevant candidates`);
      }
      
      // If still zero, fall back to CEO/C-level executives
      if (relevantEmployees.length === 0 && scoredEmployees.length > 0) {
        console.log('⚠️ Relaxed filtering yielded 0 results, finding CEO/C-level...');
        relevantEmployees = scoredEmployees.filter(emp => 
          emp.title?.toLowerCase().includes('ceo') ||
          emp.title?.toLowerCase().includes('founder') ||
          emp.title?.toLowerCase().includes('president') ||
          emp.title?.toLowerCase().includes('chief')
        );
        console.log(`🎯 CEO/C-level filtering: ${relevantEmployees.length} relevant candidates`);
      }
      
      // Absolute fallback: take top 5 by overall score
      if (relevantEmployees.length === 0 && scoredEmployees.length > 0) {
        console.log('⚠️ CEO filter yielded 0 results, taking top 5 by score...');
        relevantEmployees = scoredEmployees
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
          .slice(0, 5);
        console.log(`🎯 Top 5 fallback: ${relevantEmployees.length} relevant candidates`);
      }
      
      console.log(`🎯 Final filtered to ${relevantEmployees.length} relevant candidates`);
      
      // Stage 3.5: AI Relevance Analysis (optional - only if ANTHROPIC_API_KEY exists)
      let aiEnhancedEmployees = relevantEmployees;
      if (this.aiReasoning) {
        aiEnhancedEmployees = await this.executeStage('ai-relevance', async () => {
          console.log('🤖 Running AI relevance analysis on top candidates...');
          const enhanced = [];
          
          // Only analyze top 20 candidates to manage costs
          const topCandidates = relevantEmployees.slice(0, 20);
          
          for (const emp of topCandidates) {
            try {
              const aiAnalysis = await this.aiReasoning.analyzeProfileRelevance(emp, {
                productName: 'Sales Intelligence Software',
                productCategory: this.productCategory,
                dealSize: this.dealSize,
                companySize: intelligence.employeeCount
              });
              
              enhanced.push({
                ...emp,
                aiRelevance: aiAnalysis.relevance,
                aiReasoning: aiAnalysis.reasoning,
                aiConfidence: aiAnalysis.confidence,
                // Override relevance with AI analysis if confidence is high
                relevance: aiAnalysis.confidence > 0.7 ? aiAnalysis.relevance : emp.relevance
              });
              
              // Rate limiting for AI calls
              await delay(100);
            } catch (error) {
              console.warn(`⚠️ AI analysis failed for ${emp.name}:`, error.message);
              // Keep original employee data if AI fails
              enhanced.push(emp);
            }
          }
          
          // Add remaining employees without AI analysis
          const remaining = relevantEmployees.slice(20);
          enhanced.push(...remaining);
          
          console.log(`🤖 AI enhanced ${topCandidates.length} candidates`);
          return enhanced;
        });
      }
      
      // Stage 4: Role Assignment (free)
      const employeesWithRoles = await this.executeStage('role-assignment', async () => {
        const roleAssignment = new RoleAssignment(
          this.dealSize, 
          intelligence.revenue || 0, 
          intelligence.employeeCount || 0
        );
        return roleAssignment.assignRoles(aiEnhancedEmployees);
      });
      
      // Stage 4.5: AI Role Validation (optional - only if ANTHROPIC_API_KEY exists)
      let aiValidatedEmployees = employeesWithRoles;
      if (this.aiReasoning) {
        aiValidatedEmployees = await this.executeStage('ai-role-validation', async () => {
          console.log('🤖 Running AI role validation...');
          const validated = [];
          
          for (const emp of employeesWithRoles) {
            try {
              const aiRoleAnalysis = await this.aiReasoning.determineOptimalRole(
                emp, 
                employeesWithRoles, // buyerGroupContext
                {
                  productName: 'Sales Intelligence Software',
                  productCategory: this.productCategory,
                  dealSize: this.dealSize,
                  companySize: intelligence.employeeCount
                }
              );
              
              validated.push({
                ...emp,
                aiRoleValidation: aiRoleAnalysis,
                // Override role if AI confidence is high and suggests different role
                buyerGroupRole: aiRoleAnalysis.confidence > 0.8 && aiRoleAnalysis.suggestedRole !== emp.buyerGroupRole 
                  ? aiRoleAnalysis.suggestedRole 
                  : emp.buyerGroupRole,
                aiRoleReasoning: aiRoleAnalysis.reasoning
              });
              
              // Rate limiting for AI calls
              await delay(100);
            } catch (error) {
              console.warn(`⚠️ AI role validation failed for ${emp.name}:`, error.message);
              // Keep original role if AI fails
              validated.push(emp);
            }
          }
          
          console.log(`🤖 AI validated roles for ${validated.length} employees`);
          return validated;
        });
      }
      
      // Stage 5: Select Optimal Group (free)
      const initialBuyerGroup = await this.executeStage('group-selection', async () => {
        const buyerGroupSize = this.options.buyerGroupSize || params.buyerGroupSize;
        const roleAssignment = new RoleAssignment(
          this.dealSize, 
          intelligence.revenue || 0, 
          intelligence.employeeCount || 0,
          this.options.rolePriorities || null
        );
        return roleAssignment.selectOptimalBuyerGroup(aiValidatedEmployees, buyerGroupSize);
      });
      
      // Stage 6: Cross-Functional Coverage (free)
      const { enhanced: crossFunctionalGroup, coverage } = await this.executeStage('cross-functional', async () => {
        const crossFunctional = new CrossFunctionalCoverage(this.dealSize);
        return crossFunctional.validate(initialBuyerGroup, aiValidatedEmployees);
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
      
      // Stage 8.5: AI Buyer Group Validation (optional - only if ANTHROPIC_API_KEY exists)
      let aiValidatedBuyerGroup = enrichedBuyerGroup;
      let aiValidationResults = null;
      if (this.aiReasoning && enrichedBuyerGroup && enrichedBuyerGroup.length > 0) {
        const aiValidation = await this.executeStage('ai-buyer-group-validation', async () => {
          console.log('🤖 Running AI buyer group validation...');
          
          try {
            const validation = await this.aiReasoning.validateBuyerGroup(
              enrichedBuyerGroup, 
              {
                companyName: intelligence.companyName,
                companySize: intelligence.employeeCount,
                industry: intelligence.industry
              },
              {
                productName: 'Sales Intelligence Software',
                productCategory: this.productCategory,
                dealSize: this.dealSize
              }
            );
            
            console.log(`🤖 AI validation completed: ${validation.overallScore}/10`);
            return validation;
          } catch (error) {
            console.warn(`⚠️ AI buyer group validation failed:`, error.message);
            return null;
          }
        });
        
        aiValidationResults = aiValidation;
        
        // Apply AI recommendations if confidence is high
        if (aiValidation && aiValidation.confidence > 0.7) {
          console.log('🤖 Applying AI recommendations to buyer group...');
          // Note: In a full implementation, we would apply the recommendations here
          // For now, we'll just log them
          console.log('AI Recommendations:', aiValidation.recommendations);
        }
      }
      
      // Stage 9: Generate Research Report (free)
      const report = await this.executeStage('report-generation', async () => {
        console.log(`🔍 Debug: enrichedBuyerGroup =`, enrichedBuyerGroup ? enrichedBuyerGroup.length : 'undefined');
        console.log(`🔍 Debug: enrichedBuyerGroup type =`, typeof enrichedBuyerGroup);
        console.log(`🔍 Debug: enrichedBuyerGroup || [] =`, (enrichedBuyerGroup || []).length);
        
        try {
          return this.reportGenerator.generate({
            intelligence,
            previewEmployees,
            buyerGroup: aiValidatedBuyerGroup || enrichedBuyerGroup || [],
            coverage,
            cohesion,
            costs: this.pipelineState.costs,
            dealSize: this.dealSize,
            companyName: intelligence.companyName || extractDomain(this.targetCompany),
            searchParameters: params,
            aiValidation: aiValidationResults
          });
        } catch (error) {
          console.error(`❌ Report generation error:`, error.message);
          console.error(`❌ Error stack:`, error.stack);
          throw error;
        }
      });
      
      // Stage 10: Lusha Phone Enrichment
      const phoneEnrichedBuyerGroup = await this.executeStage('lusha-phone-enrichment', async () => {
        return await this.enrichBuyerGroupWithLusha(enrichedBuyerGroup);
      });
      
      // Stage 11: Database Persistence
      await this.executeStage('database-persistence', async () => {
        return await this.saveBuyerGroupToDatabase(phoneEnrichedBuyerGroup, report, intelligence);
      });
      
      this.pipelineState.finalBuyerGroup = phoneEnrichedBuyerGroup;
      this.pipelineState.stage = 'completed';
      
      const processingTime = Date.now() - this.pipelineState.startTime;
      
      console.log('✅ Pipeline completed successfully!');
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`💰 Total cost: $${this.pipelineState.costs.total.toFixed(2)}`);
      console.log(`👥 Final buyer group: ${phoneEnrichedBuyerGroup.length} members`);
      console.log(`📊 Cohesion score: ${cohesion.score}%`);
      
      return {
        buyerGroup: phoneEnrichedBuyerGroup,
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
   * Extract email from Coresignal data
   * @param {object} fullProfile - Full Coresignal profile data
   * @returns {string|null} Best email found (only real emails, not @coresignal.temp)
   */
  extractEmailFromCoresignal(fullProfile) {
    if (!fullProfile) return null;
    
    // Check emails array
    if (fullProfile.emails && Array.isArray(fullProfile.emails) && fullProfile.emails.length > 0) {
      // Find the best email (prioritize personal/work emails, exclude fake ones)
      const validEmails = fullProfile.emails
        .map(e => (typeof e === 'string' ? e : e.email || e.address))
        .filter(email => email && !email.includes('@coresignal.temp') && email.includes('@'));
      
      if (validEmails.length > 0) {
        // Prefer work/personal emails
        const workEmail = fullProfile.emails.find(e => {
          const email = typeof e === 'string' ? e : e.email || e.address;
          return email && (e.type === 'work' || e.type === 'professional');
        });
        if (workEmail) {
          const email = typeof workEmail === 'string' ? workEmail : workEmail.email || workEmail.address;
          if (email && !email.includes('@coresignal.temp')) return email;
        }
        return validEmails[0];
      }
    }
    
    // Check direct email field
    if (fullProfile.email && typeof fullProfile.email === 'string') {
      if (!fullProfile.email.includes('@coresignal.temp') && fullProfile.email.includes('@')) {
        return fullProfile.email;
      }
    }
    
    return null;
  }

  /**
   * Extract phone number from Coresignal data
   * @param {object} fullProfile - Full Coresignal profile data
   * @returns {string|null} Best phone number found
   */
  extractPhoneFromCoresignal(fullProfile) {
    if (!fullProfile?.phoneNumbers || fullProfile.phoneNumbers.length === 0) {
      return null;
    }
    
    // Prioritize: direct > mobile > work > main
    const phones = fullProfile.phoneNumbers;
    const direct = phones.find(p => p.type === 'direct');
    const mobile = phones.find(p => p.type === 'mobile');
    const work = phones.find(p => p.type === 'work');
    const main = phones.find(p => p.type === 'main');
    
    return direct?.number || mobile?.number || work?.number || main?.number || phones[0]?.number;
  }

  /**
   * Enrich buyer group with Lusha phone data
   * @param {Array} buyerGroup - Buyer group members
   * @returns {Array} Enriched buyer group
   */
  async enrichBuyerGroupWithLusha(buyerGroup) {
    const apiKey = process.env.LUSHA_API_KEY;
    if (!apiKey) {
      console.log('⚠️ LUSHA_API_KEY not found, skipping phone enrichment');
      return buyerGroup;
    }
    
    console.log(`📞 Enriching ${buyerGroup.length} members with Lusha phone data...`);
    
    for (const member of buyerGroup) {
      if (member.linkedinUrl) {
        const phoneData = await this.enrichWithLushaLinkedIn(member.linkedinUrl, apiKey);
        if (phoneData) {
          member.phone1 = phoneData.phone1;
          member.phone1Type = phoneData.phone1Type;
          member.phone1Verified = phoneData.phone1Verified;
          member.phone2 = phoneData.phone2;
          member.phone2Type = phoneData.phone2Type;
          member.directDialPhone = phoneData.directDialPhone;
          member.mobilePhone = phoneData.mobilePhone;
          member.workPhone = phoneData.workPhone;
          member.phoneEnrichmentSource = phoneData.phoneEnrichmentSource;
          member.phoneEnrichmentDate = phoneData.phoneEnrichmentDate;
          member.phoneDataQuality = phoneData.phoneDataQuality;
        }
      }
      await delay(500); // Rate limiting
    }
    
    return buyerGroup;
  }

  /**
   * Enrich contact with Lusha using LinkedIn URL
   * @param {string} linkedinUrl - LinkedIn profile URL
   * @param {string} apiKey - Lusha API key
   * @returns {object|null} Phone data or null
   */
  async enrichWithLushaLinkedIn(linkedinUrl, apiKey) {
    try {
      console.log(`   🔗 LinkedIn enrichment: ${linkedinUrl.split('/in/')[1] || 'profile'}...`);
      
      const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
        method: 'GET',
        headers: {
          'api_key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Lusha v2 response format: { contact: { data: {...}, error: {...}, isCreditCharged: boolean } }
        if (data.contact && data.contact.data && !data.contact.error) {
          const personData = data.contact.data;
          
          if (personData.phoneNumbers && personData.phoneNumbers.length > 0) {
            const phoneData = this.extractLushaPhoneData(personData);
            
            console.log(`   ✅ LinkedIn Phone: Found ${personData.phoneNumbers.length} phones for ${personData.fullName || 'contact'}`);
            console.log(`   💳 Credit charged: ${data.contact.isCreditCharged}`);
            
            return phoneData;
          } else {
            console.log(`   ⚠️ LinkedIn Phone: No phone numbers in response`);
          }
        } else if (data.contact && data.contact.error) {
          console.log(`   ⚠️ LinkedIn Phone: ${data.contact.error.message} (${data.contact.error.name})`);
          console.log(`   💳 Credit charged: ${data.contact.isCreditCharged}`);
        } else {
          console.log(`   ⚠️ LinkedIn Phone: Unexpected response format`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ⚠️ LinkedIn Phone API error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`   ⚠️ LinkedIn Phone error:`, error.message);
    }
    
    return null;
  }

  /**
   * Extract and organize phone numbers from Lusha response
   * @param {object} lushaResponse - Lusha API response
   * @returns {object} Structured phone data
   */
  extractLushaPhoneData(lushaResponse) {
    const phones = lushaResponse.phoneNumbers || [];
    
    if (phones.length === 0) {
      return {
        phoneEnrichmentSource: 'lusha_v2_linkedin',
        phoneEnrichmentDate: new Date(),
        phoneDataQuality: 0
      };
    }
    
    // Lusha v2 uses 'phoneType' not 'type', and different type values
    const directDial = phones.find(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
    const mobile = phones.find(p => p.phoneType === 'mobile');
    const work = phones.find(p => p.phoneType === 'work' || p.phoneType === 'office');
    const main = phones.find(p => p.phoneType === 'main' || p.phoneType === 'company');
    
    // Get the two most valuable phone numbers
    const prioritizedPhones = [directDial, mobile, work, main].filter(Boolean);
    
    const result = {
      phoneEnrichmentSource: 'lusha_v2_linkedin',
      phoneEnrichmentDate: new Date(),
      phoneDataQuality: this.calculatePhoneQuality(phones)
    };
    
    // Set phone1 (highest priority)
    if (prioritizedPhones[0]) {
      result.phone1 = prioritizedPhones[0].number;
      result.phone1Type = prioritizedPhones[0].phoneType;
      result.phone1Verified = !prioritizedPhones[0].doNotCall; // Lusha uses doNotCall flag
      result.phone1Extension = prioritizedPhones[0].extension;
    }
    
    // Set phone2 (second highest priority)
    if (prioritizedPhones[1]) {
      result.phone2 = prioritizedPhones[1].number;
      result.phone2Type = prioritizedPhones[1].phoneType;
      result.phone2Verified = !prioritizedPhones[1].doNotCall;
      result.phone2Extension = prioritizedPhones[1].extension;
    }
    
    // Set specific phone type fields for quick access
    if (directDial) {
      result.directDialPhone = directDial.number;
    }
    
    if (mobile) {
      result.mobilePhone = mobile.number;
      result.mobilePhoneVerified = !mobile.doNotCall;
    }
    
    if (work) {
      result.workPhone = work.number;
      result.workPhoneVerified = !work.doNotCall;
    }
    
    return result;
  }

  /**
   * Calculate phone data quality score (0-100)
   * @param {Array} phones - Array of phone numbers
   * @returns {number} Quality score
   */
  calculatePhoneQuality(phones) {
    if (phones.length === 0) return 0;
    
    let quality = 30; // Base score for having any phone
    
    // Bonus for phone types (business value) - using Lusha's phoneType field
    const hasDirectDial = phones.some(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
    const hasMobile = phones.some(p => p.phoneType === 'mobile');
    const hasWork = phones.some(p => p.phoneType === 'work' || p.phoneType === 'office');
    
    if (hasDirectDial) quality += 30; // Direct dial is most valuable
    if (hasMobile) quality += 20;     // Mobile is very valuable
    if (hasWork) quality += 15;       // Work phone is valuable
    
    // Bonus for verification (Lusha uses doNotCall: false as verification)
    const verifiedPhones = phones.filter(p => !p.doNotCall).length;
    quality += verifiedPhones * 5; // 5 points per verified phone
    
    // Bonus for multiple phone numbers
    if (phones.length >= 2) quality += 10;
    if (phones.length >= 3) quality += 5;
    
    return Math.min(quality, 100);
  }

  /**
   * Determine communication style based on role and department
   * @param {string} title - Job title
   * @param {string} department - Department
   * @returns {string} Communication style
   */
  determineCommunicationStyle(title, department) {
    const titleLower = (title || '').toLowerCase();
    const deptLower = (department || '').toLowerCase();
    
    if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('founder')) {
      return 'Direct and strategic';
    }
    if (titleLower.includes('vp') || titleLower.includes('director') || titleLower.includes('head of')) {
      return 'Professional and data-driven';
    }
    if (deptLower.includes('sales') || titleLower.includes('sales')) {
      return 'Persuasive and relationship-focused';
    }
    if (deptLower.includes('marketing') || titleLower.includes('marketing')) {
      return 'Creative and collaborative';
    }
    if (deptLower.includes('engineering') || titleLower.includes('engineer')) {
      return 'Technical and detail-oriented';
    }
    if (deptLower.includes('finance') || titleLower.includes('finance')) {
      return 'Analytical and risk-averse';
    }
    
    return 'Professional and collaborative';
  }

  /**
   * Determine decision making style based on role and department
   * @param {string} title - Job title
   * @param {string} department - Department
   * @returns {string} Decision making style
   */
  determineDecisionMaking(title, department) {
    const titleLower = (title || '').toLowerCase();
    const deptLower = (department || '').toLowerCase();
    
    if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('founder')) {
      return 'Autonomous and strategic';
    }
    if (titleLower.includes('vp') || titleLower.includes('director')) {
      return 'Collaborative with final authority';
    }
    if (deptLower.includes('sales') || titleLower.includes('sales')) {
      return 'Fast and opportunity-driven';
    }
    if (deptLower.includes('finance') || titleLower.includes('finance')) {
      return 'Data-driven and risk-conscious';
    }
    if (deptLower.includes('legal') || titleLower.includes('legal')) {
      return 'Compliance-focused and cautious';
    }
    
    return 'Collaborative and consensus-driven';
  }

  /**
   * Determine preferred contact method based on role and available data
   * @param {object} member - Buyer group member
   * @returns {string} Preferred contact method
   */
  determinePreferredContact(member) {
    if (member.phone1 || member.mobilePhone) {
      return 'Phone call';
    }
    if (member.email) {
      return 'Email';
    }
    if (member.linkedinUrl) {
      return 'LinkedIn message';
    }
    return 'Email';
  }

  /**
   * Determine response time based on role
   * @param {string} title - Job title
   * @returns {string} Expected response time
   */
  determineResponseTime(title) {
    const titleLower = (title || '').toLowerCase();
    
    if (titleLower.includes('ceo') || titleLower.includes('president')) {
      return '24-48 hours';
    }
    if (titleLower.includes('vp') || titleLower.includes('director')) {
      return '1-2 business days';
    }
    if (titleLower.includes('manager') || titleLower.includes('head of')) {
      return '2-3 business days';
    }
    
    return '3-5 business days';
  }

  /**
   * Generate pain points based on role, department, and industry
   * @param {string} title - Job title
   * @param {string} department - Department
   * @param {string} industry - Industry
   * @returns {Array} Array of pain points
   */
  generatePainPoints(title, department, industry) {
    const painPoints = [];
    const titleLower = (title || '').toLowerCase();
    const deptLower = (department || '').toLowerCase();
    
    // Role-specific pain points
    if (titleLower.includes('sales') || deptLower.includes('sales')) {
      painPoints.push('Lead quality and conversion rates', 'Sales process efficiency', 'Revenue forecasting accuracy');
    }
    if (titleLower.includes('marketing') || deptLower.includes('marketing')) {
      painPoints.push('Lead generation ROI', 'Marketing attribution', 'Content performance measurement');
    }
    if (titleLower.includes('ceo') || titleLower.includes('president')) {
      painPoints.push('Revenue growth', 'Operational efficiency', 'Market expansion');
    }
    if (titleLower.includes('cfo') || titleLower.includes('finance')) {
      painPoints.push('Cost optimization', 'Financial forecasting', 'Budget management');
    }
    
    // Industry-specific pain points
    if (industry && industry.toLowerCase().includes('technology')) {
      painPoints.push('Digital transformation', 'Data security', 'Scalability challenges');
    }
    
    return painPoints.slice(0, 3); // Limit to 3 most relevant
  }

  /**
   * Generate goals based on role and department
   * @param {string} title - Job title
   * @param {string} department - Department
   * @returns {Array} Array of goals
   */
  generateGoals(title, department) {
    const goals = [];
    const titleLower = (title || '').toLowerCase();
    const deptLower = (department || '').toLowerCase();
    
    if (titleLower.includes('sales') || deptLower.includes('sales')) {
      goals.push('Increase revenue', 'Improve conversion rates', 'Expand market reach');
    }
    if (titleLower.includes('marketing') || deptLower.includes('marketing')) {
      goals.push('Generate qualified leads', 'Improve brand awareness', 'Optimize marketing spend');
    }
    if (titleLower.includes('ceo') || titleLower.includes('president')) {
      goals.push('Drive company growth', 'Improve operational efficiency', 'Expand market presence');
    }
    
    return goals.slice(0, 3);
  }

  /**
   * Generate challenges based on role, department, and industry
   * @param {string} title - Job title
   * @param {string} department - Department
   * @param {string} industry - Industry
   * @returns {Array} Array of challenges
   */
  generateChallenges(title, department, industry) {
    const challenges = [];
    const titleLower = (title || '').toLowerCase();
    const deptLower = (department || '').toLowerCase();
    
    if (titleLower.includes('sales') || deptLower.includes('sales')) {
      challenges.push('Competitive market pressure', 'Long sales cycles', 'Lead quality issues');
    }
    if (titleLower.includes('marketing') || deptLower.includes('marketing')) {
      challenges.push('ROI measurement', 'Content creation demands', 'Channel attribution');
    }
    
    return challenges.slice(0, 3);
  }

  /**
   * Generate opportunities based on role, department, and industry
   * @param {string} title - Job title
   * @param {string} department - Department
   * @param {string} industry - Industry
   * @returns {Array} Array of opportunities
   */
  generateOpportunities(title, department, industry) {
    const opportunities = [];
    const titleLower = (title || '').toLowerCase();
    const deptLower = (department || '').toLowerCase();
    
    if (titleLower.includes('sales') || deptLower.includes('sales')) {
      opportunities.push('New market segments', 'Upselling existing customers', 'Partnership opportunities');
    }
    if (titleLower.includes('marketing') || deptLower.includes('marketing')) {
      opportunities.push('Digital transformation', 'Personalization at scale', 'Marketing automation');
    }
    
    return opportunities.slice(0, 3);
  }

  /**
   * Generate intelligence summary for the person
   * @param {object} member - Buyer group member
   * @param {object} intelligence - Company intelligence
   * @returns {string} Intelligence summary
   */
  generateIntelligenceSummary(member, intelligence) {
    const role = member.buyerGroupRole;
    const title = member.title;
    const department = member.department;
    const influenceScore = member.scores?.influence || 0;
    
    let summary = `${title} in ${department} with ${influenceScore}/10 influence score. `;
    
    if (role === 'decision') {
      summary += `Primary decision maker with budget authority for ${intelligence.industry} solutions. `;
    } else if (role === 'champion') {
      summary += `Key champion who can influence decision makers and drive adoption. `;
    } else if (role === 'blocker') {
      summary += `Potential blocker who may raise concerns about compliance, security, or budget. `;
    } else if (role === 'introducer') {
      summary += `Valuable introducer who can facilitate connections and provide internal insights. `;
    } else {
      summary += `Important stakeholder with influence over the buying process. `;
    }
    
    summary += `Engagement strategy should focus on ${this.determinePreferredContact(member).toLowerCase()} communication.`;
    
    return summary;
  }

  /**
   * Extract soft skills from Coresignal data
   * @param {object} coresignalData - Coresignal profile data
   * @returns {Array} Array of soft skills
   */
  extractSoftSkills(coresignalData) {
    const skills = coresignalData.inferred_skills || [];
    const softSkills = skills.filter(skill => 
      ['leadership', 'communication', 'teamwork', 'problem solving', 'strategic thinking', 
       'collaboration', 'mentoring', 'coaching', 'relationship building', 'negotiation'].includes(skill.toLowerCase())
    );
    return softSkills.slice(0, 5);
  }

  /**
   * Extract industry skills from Coresignal data
   * @param {object} coresignalData - Coresignal profile data
   * @param {string} industry - Industry
   * @returns {Array} Array of industry skills
   */
  extractIndustrySkills(coresignalData, industry) {
    const skills = coresignalData.inferred_skills || [];
    const industryKeywords = industry ? industry.toLowerCase().split(' ') : [];
    
    const industrySkills = skills.filter(skill => 
      industryKeywords.some(keyword => skill.toLowerCase().includes(keyword)) ||
      ['saas', 'cloud', 'enterprise', 'b2b', 'technology', 'software', 'digital'].includes(skill.toLowerCase())
    );
    
    return industrySkills.slice(0, 5);
  }

  /**
   * Calculate data quality score for the person
   * @param {object} member - Buyer group member
   * @param {object} coresignalData - Coresignal profile data
   * @returns {number} Data quality score (0-100)
   */
  calculateDataQualityScore(member, coresignalData) {
    let score = 0;
    
    // Basic information completeness
    if (member.name) score += 10;
    if (member.title) score += 10;
    if (member.email) score += 15;
    if (member.phone || member.phone1) score += 15;
    if (member.linkedinUrl) score += 10;
    
    // Coresignal data richness
    if (coresignalData.experience && coresignalData.experience.length > 0) score += 10;
    if (coresignalData.inferred_skills && coresignalData.inferred_skills.length > 0) score += 10;
    if (coresignalData.summary) score += 10;
    if (coresignalData.connections_count > 0) score += 5;
    if (coresignalData.followers_count > 0) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate enrichment score for the person
   * @param {object} member - Buyer group member
   * @param {object} coresignalData - Coresignal profile data
   * @returns {number} Enrichment score (0-100)
   */
  calculateEnrichmentScore(member, coresignalData) {
    let score = 0;
    
    // Data sources
    if (coresignalData.id) score += 30; // Coresignal data
    if (member.phone1 || member.phone2) score += 20; // Lusha phone data
    if (member.email) score += 15; // Email data
    if (member.linkedinUrl) score += 15; // LinkedIn data
    
    // Data completeness
    const dataQuality = this.calculateDataQualityScore(member, coresignalData);
    score += dataQuality * 0.2; // 20% of data quality score
    
    return Math.min(score, 100);
  }

  /**
   * Calculate global rank for Speedrun prioritization
   * @param {object} member - Buyer group member
   * @param {object} coresignalData - Coresignal profile data
   * @param {string} role - Buyer group role
   * @returns {number} Global rank (lower = higher priority)
   */
  calculateGlobalRank(member, coresignalData, role) {
    let rank = 1000; // Base rank
    
    // Role priority: Champion → Introducer → Decision → Stakeholder → Blocker
    switch (role) {
      case 'champion':
        rank -= 500; // Highest priority
        break;
      case 'introducer':
        rank -= 400;
        break;
      case 'decision':
        rank -= 300;
        break;
      case 'stakeholder':
        rank -= 200;
        break;
      case 'blocker':
        rank += 100; // Lowest priority
        break;
    }
    
    // Influence score (higher influence = lower rank)
    const influenceScore = member.scores?.influence || 0;
    rank -= influenceScore * 20;
    
    // Engagement score (higher engagement = lower rank)
    const engagementScore = member.overallScore || 0;
    rank -= engagementScore * 2;
    
    // LinkedIn connections (more connections = lower rank)
    const connections = coresignalData.connections_count || 0;
    if (connections > 1000) rank -= 100;
    else if (connections > 500) rank -= 50;
    else if (connections > 200) rank -= 25;
    
    // LinkedIn followers (more followers = lower rank)
    const followers = coresignalData.followers_count || 0;
    if (followers > 5000) rank -= 50;
    else if (followers > 1000) rank -= 25;
    else if (followers > 100) rank -= 10;
    
    // Data quality (better data = lower rank)
    const dataQuality = this.calculateDataQualityScore(member, coresignalData);
    rank -= dataQuality * 2;
    
    // Ensure rank is positive
    return Math.max(1, Math.round(rank));
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
      // 1. Find or create company record
      const company = await this.findOrCreateCompany(intelligence);
      
      // 2. Create/update People records for ALL buyer group members
      console.log(`👥 Creating/updating People records for ${buyerGroup.length} members...`);
      for (const member of buyerGroup) {
        const nameParts = member.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Extract email from Coresignal data (prioritize real emails from fullProfile)
        const coresignalEmail = this.extractEmailFromCoresignal(member.fullProfile);
        // Use coresignal email if available, otherwise fallback to member.email (but only if it's not fake)
        const email = coresignalEmail || (member.email && !member.email.includes('@coresignal.temp') ? member.email : null);
        
        // Extract phone from Coresignal data
        const coresignalPhone = this.extractPhoneFromCoresignal(member.fullProfile);
        
        // Check if person already exists
        // Use LinkedIn URL as primary identifier, fallback to email if no LinkedIn
        const existingPerson = await this.prisma.people.findFirst({
          where: {
            workspaceId: this.workspaceId,
            OR: [
              member.linkedinUrl ? { linkedinUrl: member.linkedinUrl } : null,
              email ? { email: email } : null
            ].filter(Boolean)
          }
        });

        // Extract comprehensive intelligence data from Coresignal
        const coresignalData = member.fullProfile || {};
        const experience = coresignalData.experience || [];
        const currentExperience = experience.find(exp => exp.active_experience === 1) || experience[0] || {};
        
        // Calculate derived intelligence fields
        const totalExperienceMonths = coresignalData.total_experience_duration_months || 0;
        const yearsExperience = Math.floor(totalExperienceMonths / 12);
        const yearsAtCompany = currentExperience.duration_months ? Math.floor(currentExperience.duration_months / 12) : 0;
        
        // Determine influence level based on scores and role
        const influenceScore = member.scores?.influence || 0;
        const decisionPower = member.scores?.seniority || 0;
        let influenceLevel = 'low';
        if (influenceScore >= 7) influenceLevel = 'high';
        else if (influenceScore >= 4) influenceLevel = 'medium';
        
        // Determine engagement level based on overall score
        const engagementScore = member.overallScore || 0;
        let engagementLevel = 'low';
        if (engagementScore >= 80) engagementLevel = 'high';
        else if (engagementScore >= 60) engagementLevel = 'medium';
        
        // Generate AI intelligence data
        const aiIntelligence = {
          influenceLevel,
          engagementLevel,
          decisionPower,
          influenceScore,
          primaryRole: member.title,
          department: member.department,
          communicationStyle: this.determineCommunicationStyle(member.title, member.department),
          decisionMaking: this.determineDecisionMaking(member.title, member.department),
          preferredContact: this.determinePreferredContact(member),
          responseTime: this.determineResponseTime(member.title),
          painPoints: this.generatePainPoints(member.title, member.department, intelligence.industry),
          interests: coresignalData.interests || [],
          goals: this.generateGoals(member.title, member.department),
          challenges: this.generateChallenges(member.title, member.department, intelligence.industry),
          opportunities: this.generateOpportunities(member.title, member.department, intelligence.industry),
          intelligenceSummary: this.generateIntelligenceSummary(member, intelligence),
          lastUpdated: new Date().toISOString()
        };

        if (existingPerson) {
          // Update existing person with comprehensive intelligence data
          await this.prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              companyId: company.id, // Ensure company link
              buyerGroupRole: member.buyerGroupRole,
              isBuyerGroupMember: true,
              buyerGroupOptimized: true,
              coresignalData: member.fullProfile, // Keep coresignal data
              enrichedData: aiIntelligence,
              aiIntelligence: aiIntelligence,
              aiLastUpdated: new Date(),
              influenceScore: influenceScore,
              decisionPower: decisionPower,
              engagementScore: engagementScore,
              lastEnriched: new Date(),
              // Phone data from Coresignal
              phone: coresignalPhone || member.phone,
              // Phone data (streamlined schema - only basic phone fields)
              mobilePhone: member.mobilePhone,
              workPhone: member.workPhone,
              phoneVerified: member.phone1Verified || false,
              phoneConfidence: member.phoneDataQuality ? member.phoneDataQuality / 100 : undefined,
              phoneQualityScore: member.phoneDataQuality ? member.phoneDataQuality / 100 : undefined,
              // Intelligence fields for person record tabs
              influenceLevel: influenceLevel,
              engagementLevel: engagementLevel,
              communicationStyle: aiIntelligence.communicationStyle,
              decisionMaking: aiIntelligence.decisionMaking,
              preferredContact: aiIntelligence.preferredContact,
              responseTime: aiIntelligence.responseTime,
              totalExperienceMonths: totalExperienceMonths,
              yearsExperience: yearsExperience,
              yearsAtCompany: yearsAtCompany,
              currentCompany: currentExperience.company_name,
              currentRole: member.title,
              industryExperience: currentExperience.company_industry,
              // LinkedIn data
              linkedinConnections: coresignalData.connections_count,
              linkedinFollowers: coresignalData.followers_count,
              // Skills and experience
              technicalSkills: coresignalData.inferred_skills || [],
              softSkills: this.extractSoftSkills(coresignalData),
              industrySkills: this.extractIndustrySkills(coresignalData, currentExperience.company_industry),
              // Data quality
              dataQualityScore: this.calculateDataQualityScore(member, coresignalData),
              enrichmentScore: this.calculateEnrichmentScore(member, coresignalData),
              enrichmentSources: ['coresignal', 'lusha'],
              enrichmentVersion: '2.1.0',
              dataSources: ['coresignal', 'lusha'],
              // AI confidence
              aiConfidence: member.roleConfidence ? member.roleConfidence / 100 : 0.8,
              // Global rank for Speedrun prioritization
              globalRank: this.calculateGlobalRank(member, coresignalData, member.buyerGroupRole)
            }
          });
        } else {
          // Create new person with comprehensive intelligence data
          await this.prisma.people.create({
            data: {
              workspaceId: this.workspaceId,
              companyId: company.id, // Link to company
              firstName: firstName,
              lastName: lastName,
              fullName: member.name,
              jobTitle: member.title,
              title: member.title,
              department: member.department,
              email: email,
              phone: coresignalPhone || member.phone,
              linkedinUrl: member.linkedinUrl,
              buyerGroupRole: member.buyerGroupRole,
              isBuyerGroupMember: true,
              buyerGroupOptimized: true,
              coresignalData: member.fullProfile, // Keep coresignal data
              enrichedData: aiIntelligence,
              aiIntelligence: aiIntelligence,
              aiLastUpdated: new Date(),
              influenceScore: influenceScore,
              decisionPower: decisionPower,
              engagementScore: engagementScore,
              lastEnriched: new Date(),
              // Phone data (streamlined schema - only basic phone fields)
              mobilePhone: member.mobilePhone,
              workPhone: member.workPhone,
              phoneVerified: member.phone1Verified || false,
              phoneConfidence: member.phoneDataQuality ? member.phoneDataQuality / 100 : undefined,
              phoneQualityScore: member.phoneDataQuality ? member.phoneDataQuality / 100 : undefined,
              // Intelligence fields for person record tabs
              influenceLevel: influenceLevel,
              engagementLevel: engagementLevel,
              communicationStyle: aiIntelligence.communicationStyle,
              decisionMaking: aiIntelligence.decisionMaking,
              preferredContact: aiIntelligence.preferredContact,
              responseTime: aiIntelligence.responseTime,
              totalExperienceMonths: totalExperienceMonths,
              yearsExperience: yearsExperience,
              yearsAtCompany: yearsAtCompany,
              currentCompany: currentExperience.company_name,
              currentRole: member.title,
              industryExperience: currentExperience.company_industry,
              // LinkedIn data
              linkedinConnections: coresignalData.connections_count,
              linkedinFollowers: coresignalData.followers_count,
              // Skills and experience
              technicalSkills: coresignalData.inferred_skills || [],
              softSkills: this.extractSoftSkills(coresignalData),
              industrySkills: this.extractIndustrySkills(coresignalData, currentExperience.company_industry),
              // Data quality
              dataQualityScore: this.calculateDataQualityScore(member, coresignalData),
              enrichmentScore: this.calculateEnrichmentScore(member, coresignalData),
              enrichmentSources: ['coresignal', 'lusha'],
              enrichmentVersion: '2.1.0',
              dataSources: ['coresignal', 'lusha'],
              // AI confidence
              aiConfidence: member.roleConfidence ? member.roleConfidence / 100 : 0.8,
              // Global rank for Speedrun prioritization
              globalRank: this.calculateGlobalRank(member, coresignalData, member.buyerGroupRole)
            }
          });
        }
      }
      
      // 3. Create BuyerGroups record (for audit trail) - TEMPORARILY DISABLED
      // TODO: Fix Prisma client cache issue
      let buyerGroupRecord = null;
      try {
        buyerGroupRecord = await this.prisma.buyerGroups.create({
        data: {
          id: createUniqueId('bg'),
          workspaceId: this.workspaceId,
          companyName: intelligence.companyName || extractDomain(this.targetCompany),
            website: intelligence.website,
          industry: intelligence.industry,
          companySize: intelligence.employeeCount?.toString(),
            cohesionScore: report.cohesionAnalysis?.overallScore || 0,
            overallConfidence: report.qualityMetrics?.averageConfidence || 0,
          totalMembers: buyerGroup.length,
          processingTime: Date.now() - this.pipelineState.startTime,
          metadata: {
            report: report,
            intelligence: intelligence,
            costs: this.pipelineState.costs,
            companyTier: intelligence.tier,
            dealSize: this.dealSize,
            totalEmployeesFound: this.pipelineState.totalEmployees,
            totalCost: this.pipelineState.costs.total,
              pipelineVersion: '2.1.0',
              aiEnabled: !!this.aiReasoning,
            createdAt: new Date().toISOString()
          },
          updatedAt: new Date()
        }
      });
        console.log('✅ BuyerGroups record created successfully');
      } catch (error) {
        console.warn('⚠️ BuyerGroups creation failed, continuing without audit trail:', error.message);
        buyerGroupRecord = { id: 'temp-' + Date.now() };
      }
      
      // 4. Create BuyerGroupMembers records (for relationship tracking)
      try {
      const memberRecords = buyerGroup.map(member => {
        // Extract email from Coresignal data (prioritize real emails from fullProfile)
        const coresignalEmail = this.extractEmailFromCoresignal(member.fullProfile);
        const email = coresignalEmail || (member.email && !member.email.includes('@coresignal.temp') ? member.email : null);
        
        return {
          id: createUniqueId('bgm'),
          buyerGroupId: buyerGroupRecord.id,
          name: member.name,
          title: member.title,
          department: member.department,
          role: member.buyerGroupRole,
          email: email, // Only real emails, no fake @coresignal.temp
          linkedin: member.linkedinUrl,
          confidence: member.roleConfidence || 0,
          influenceScore: member.scores?.influence || 0,
          updatedAt: new Date()
        };
      });
      
      await this.prisma.buyerGroupMembers.createMany({
        data: memberRecords
      });
        console.log('✅ BuyerGroupMembers records created successfully');
      } catch (error) {
        console.warn('⚠️ BuyerGroupMembers creation failed, continuing without relationship tracking:', error.message);
      }
      
      console.log('✅ Buyer group saved to database successfully');
      console.log(`   - Company: ${company.name} (${company.id})`);
      console.log(`   - People records: ${buyerGroup.length} created/updated`);
      console.log(`   - Buyer group: ${buyerGroupRecord.id}`);
      
    } catch (error) {
      console.error('❌ Failed to save buyer group to database:', error.message);
      throw error;
    }
  }

  /**
   * Find or create company record
   * @param {object} intelligence - Company intelligence data
   * @returns {object} Company record
   */
  async findOrCreateCompany(intelligence) {
    console.log('🏢 Finding or creating company record...');
    
    try {
      // First try to find by website domain
      let company = null;
      if (intelligence.website) {
        const domain = extractDomain(intelligence.website);
        company = await this.prisma.companies.findFirst({
            where: {
                workspaceId: this.workspaceId,
            OR: [
              { website: { contains: domain } },
              { domain: domain }
            ]
          }
        });
      }
      
      // If not found by website, try by name
      if (!company && intelligence.companyName) {
        company = await this.prisma.companies.findFirst({
          where: {
              workspaceId: this.workspaceId,
            name: { contains: intelligence.companyName, mode: 'insensitive' }
            }
          });
        }
      
      // If still not found, create new company
      if (!company) {
        console.log(`📝 Creating new company record for ${intelligence.companyName}`);
        company = await this.prisma.companies.create({
          data: {
            workspaceId: this.workspaceId,
            name: intelligence.companyName || 'Unknown Company',
            website: intelligence.website,
            industry: intelligence.industry,
            employeeCount: intelligence.employeeCount,
            revenue: intelligence.revenue,
            description: intelligence.description,
            domain: intelligence.website ? extractDomain(intelligence.website) : null,
            status: 'ACTIVE',
            priority: 'MEDIUM',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Created company: ${company.name} (${company.id})`);
      } else {
        console.log(`✅ Found existing company: ${company.name} (${company.id})`);
        
        // Update company with latest intelligence data
        if (intelligence.website && !company.website) {
          await this.prisma.companies.update({
            where: { id: company.id },
            data: {
              website: intelligence.website,
              domain: extractDomain(intelligence.website)
            }
          });
        }
      }
      
      return company;
    } catch (error) {
      console.error('❌ Failed to find or create company:', error.message);
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
      'ai-relevance', 'role-assignment', 'ai-role-validation', 'group-selection', 
      'cross-functional', 'profile-collection', 'cohesion-validation', 'ai-buyer-group-validation',
      'report-generation', 'database-persistence', 'completed'
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
