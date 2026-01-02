/**
 * Smart Buyer Group Pipeline - Main Orchestrator
 * 
 * Coordinates 8-stage waterfall pipeline using all modules
 * Implements double-waterfall approach for cost efficiency
 */

const fetch = require('node-fetch');
const { PrismaClient, Prisma } = require('@prisma/client');
const { CompanyIntelligence } = require('./company-intelligence');
const { PreviewSearch } = require('./preview-search');
const { SmartScoring } = require('./smart-scoring');
const { RoleAssignment } = require('./role-assignment');
const { CrossFunctionalCoverage } = require('./cross-functional');
const { CohesionValidator } = require('./cohesion-validator');
const { ResearchReport } = require('./research-report');
const { AIReasoning } = require('./ai-reasoning');
const { BuyerGroupSizing } = require('./buyer-group-sizing');
const { extractDomain, createUniqueId, delay } = require('./utils');

// Import sophisticated multi-source email verification system
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

class SmartBuyerGroupPipeline {
  constructor(options = {}) {
    this.prisma = options.prisma || new PrismaClient();
    this.workspaceId = options.workspaceId;
    this.mainSellerId = options.mainSellerId || null; // 🏆 FIX: Store mainSellerId for assigning people
    this.dealSize = options.dealSize || 150000;
    this.productCategory = options.productCategory || 'sales';
    this.targetCompany = options.targetCompany || options.linkedinUrl;
    this.options = options; // Store all options for passing to modules
    
    // 🎯 STRICT SALES MODE: When enabled, ONLY finds sales/revenue roles
    // - No fallback to random employees
    // - Skips companies without sales people
    // - Returns empty buyer group if no sales hunters found
    this.strictSalesMode = options.strictSalesMode || false;
    
    // 🎯 HUNTER WEIGHTED MODE: Full buyer groups but exclude farmers
    // - Builds complete buyer groups with all roles
    // - Excludes "farmer" roles (Account Managers, Strategic AEs, CS)
    // - Prioritizes hunters in scoring
    this.hunterWeightedMode = options.hunterWeightedMode || false;
    
    // Sales hunter keywords for strict mode filtering
    this.salesHunterTitles = [
      'chief revenue officer', 'cro', 'vp sales', 'vice president sales',
      'vp revenue', 'svp sales', 'head of sales', 'sales director',
      'director of sales', 'rvp', 'regional vice president', 'commercial',
      'account executive', 'ae ', 'sales manager', 'bdr manager', 'sdr manager',
      'business development', 'sales development', 'revenue operations',
      'sales operations', 'sales enablement'
    ];
    
    // FARMER roles to exclude (they manage existing accounts, not new business)
    this.farmerTitles = [
      'account manager', 'strategic account', 'global account', 'named account',
      'key account', 'enterprise account manager', 'customer success',
      'client success', 'renewal', 'expansion', 'retention'
    ];
    
    // Titles to EXCLUDE in strict mode
    this.excludedTitles = [
      'marketing', 'hr', 'human resources', 'recruiter', 'recruiting', 'talent',
      'people', 'customer success', 'account manager', 'strategic account',
      'global account', 'partner', 'channel', 'support', 'engineer', 'product',
      'design', 'analyst', 'finance', 'legal', 'operations manager',
      'executive assistant', 'executive business partner', 'office manager'
    ];
    
    // Initialize modules
    this.companyIntel = new CompanyIntelligence(this.prisma, this.workspaceId);
    this.previewSearch = new PreviewSearch(process.env.CORESIGNAL_API_KEY);
    this.cohesionValidator = new CohesionValidator();
    this.reportGenerator = new ResearchReport();
    
    // Initialize AI reasoning if API key is available
    this.aiReasoning = process.env.ANTHROPIC_API_KEY ? new AIReasoning(process.env.ANTHROPIC_API_KEY) : null;
    
    // Initialize multi-source email verifier
    this.emailVerifier = new MultiSourceVerifier({
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
      TIMEOUT: 30000
    });
    
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
   * 🎯 Check if a person is a sales hunter (for strict sales mode)
   * Sales hunters are people who acquire new business, not farmers who expand existing accounts
   * @param {string} title - Person's job title
   * @returns {boolean} True if they are a sales hunter
   */
  isSalesHunter(title) {
    const t = (title || '').toLowerCase();
    
    // First check if excluded (farmers, marketing, HR, etc.)
    const isExcluded = this.excludedTitles.some(ex => t.includes(ex));
    if (isExcluded) return false;
    
    // Then check if they have a sales hunter title
    const isSales = this.salesHunterTitles.some(s => t.includes(s));
    return isSales;
  }

  /**
   * 🌾 Check if a person is a "farmer" (manages existing accounts, not new business)
   * Farmers include: Account Managers, Strategic AEs, Customer Success, Renewals
   * @param {string} title - Person's job title
   * @returns {boolean} True if they are a farmer
   */
  isFarmer(title) {
    const t = (title || '').toLowerCase();
    return this.farmerTitles.some(f => t.includes(f));
  }

  /**
   * 🎯 Filter buyer group to only sales hunters (for strict sales mode)
   * @param {Array} buyerGroup - Array of buyer group members
   * @returns {Array} Filtered array with only sales hunters
   */
  filterToSalesHunters(buyerGroup) {
    if (!this.strictSalesMode) return buyerGroup;
    
    const hunters = buyerGroup.filter(m => this.isSalesHunter(m.title));
    const removed = buyerGroup.length - hunters.length;
    
    if (removed > 0) {
      console.log(`🎯 Strict Sales Mode: Filtered ${removed} non-sales members, keeping ${hunters.length} sales hunters`);
    }
    
    return hunters;
  }

  /**
   * 🎯 Filter out farmers from buyer group (for hunter weighted mode)
   * Keeps full buyer group but removes farmer roles
   * @param {Array} buyerGroup - Array of buyer group members
   * @returns {Array} Filtered array without farmers
   */
  filterOutFarmers(buyerGroup) {
    if (!this.hunterWeightedMode) return buyerGroup;

    const filtered = buyerGroup.filter(m => !this.isFarmer(m.title));
    const removed = buyerGroup.length - filtered.length;

    if (removed > 0) {
      console.log(`🎯 Hunter Weighted: Removed ${removed} farmer roles, keeping ${filtered.length} members`);
    }

    return filtered;
  }

  /**
   * 🧠 Calculate optimal max results target for intelligent multi-query
   * Based on company size, buyer group needs, and cost efficiency
   *
   * @param {object} intelligence - Company intelligence data
   * @param {object} params - Pipeline parameters
   * @returns {number} Target max results for multi-query
   */
  calculateMaxResultsTarget(intelligence, params) {
    const companySize = intelligence.employeeCount || 100;
    const buyerGroupTarget = params.buyerGroupSize?.max || 15;

    // Base calculation: We want enough candidates to find a quality buyer group
    // Rule of thumb: Need ~10x candidates to find ideal buyer group after filtering
    const baseTarget = buyerGroupTarget * 10;

    // Adjust based on company size
    let maxTarget;
    if (companySize <= 100) {
      // Small company: Get everyone we can
      maxTarget = Math.min(companySize, 200);
    } else if (companySize <= 500) {
      // Medium company: Good sample
      maxTarget = Math.min(baseTarget, 300);
    } else if (companySize <= 2000) {
      // Large company: Larger sample needed
      maxTarget = Math.min(baseTarget * 1.5, 500);
    } else {
      // Enterprise: Need strategic sampling
      maxTarget = Math.min(baseTarget * 2, 750);
    }

    // Never exceed the total available
    const totalAvailable = intelligence.totalAvailable || companySize;
    maxTarget = Math.min(maxTarget, totalAvailable);

    // Minimum useful amount
    maxTarget = Math.max(maxTarget, 50);

    console.log(`📊 Max results target: ${maxTarget} (company: ${companySize} employees, buyer group: ${buyerGroupTarget})`);
    return maxTarget;
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
        // Use original identifier if available (for fresh Coresignal lookup), otherwise fall back to company data
        const identifier = company.originalIdentifier || company.linkedinUrl || company.website || company.name;
        return await this.companyIntel.research(identifier);
      });
      
      const params = this.companyIntel.calculateOptimalParameters(intelligence, this.dealSize);
      
      // Ensure companyName is set - use fallback if Coresignal validation failed
      if (!intelligence.companyName) {
        intelligence.companyName = company?.name || extractDomain(this.targetCompany) || 'Unknown Company';
        console.log(`⚠️  Company name not set, using fallback: ${intelligence.companyName}`);
      }
      
      // Stage 2: Wide Preview Search (cheap) - with adaptive expansion
      let previewResult = await this.executeStage('preview-search', async () => {
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

      // Extract employees array from result (backward compatibility)
      let previewEmployees = previewResult.employees || [];
      let totalAvailable = previewResult.totalAvailable || previewEmployees.length;
      let hitLimit = previewResult.hitLimit || false;

      // ENHANCED: Try alternative company identifiers if no employees found
      if (previewEmployees.length === 0) {
        console.log('⚠️ No employees found with primary identifiers, trying alternatives...');

        // Strategy 1: Try company name search if we have LinkedIn/website but no results
        if (intelligence.companyName && !intelligence.linkedinUrl && !intelligence.website) {
          console.log('🔍 Strategy 1: Trying company name search...');
          const nameResult = await this.previewSearch.discoverAllStakeholders(
            {
              companyName: intelligence.companyName,
              linkedinUrl: null,
              website: null
            },
            params.maxPreviewPages,
            'none', // No filtering for name search
            this.productCategory,
            this.options.customFiltering || null,
            this.options.usaOnly || false
          );
          const nameEmployees = nameResult.employees || [];
          if (nameEmployees.length > 0) {
            previewEmployees = nameEmployees;
            totalAvailable = nameResult.totalAvailable || nameEmployees.length;
            hitLimit = nameResult.hitLimit || false;
            console.log(`✅ Found ${previewEmployees.length} employees via company name search`);
          }
        }
        
        // Strategy 2: Try parent domain if subdomain
        if (previewEmployees.length === 0 && intelligence.website) {
          const domain = intelligence.website.replace(/^https?:\/\//, '').split('/')[0];
          if (domain.split('.').length > 2) {
            const parentDomain = domain.split('.').slice(-2).join('.');
            console.log(`🔍 Strategy 2: Trying parent domain: ${parentDomain}...`);
            const parentResult = await this.previewSearch.discoverAllStakeholders(
              {
                linkedinUrl: intelligence.linkedinUrl,
                website: `https://${parentDomain}`,
                companyName: intelligence.companyName
              },
              params.maxPreviewPages,
              params.filteringLevel,
              this.productCategory,
              this.options.customFiltering || null,
              this.options.usaOnly || false
            );
            const parentEmployees = parentResult.employees || [];
            if (parentEmployees.length > 0) {
              previewEmployees = parentEmployees;
              totalAvailable = parentResult.totalAvailable || parentEmployees.length;
              hitLimit = parentResult.hitLimit || false;
              console.log(`✅ Found ${previewEmployees.length} employees via parent domain`);
            }
          }
        }

        // Strategy 3: Try LinkedIn company search by name if we have company name
        if (previewEmployees.length === 0 && intelligence.companyName && !intelligence.linkedinUrl) {
          console.log('🔍 Strategy 3: Trying LinkedIn company search by name...');
          try {
            // Search for company on LinkedIn via Coresignal company search
            const companySearchResult = await this.companyIntel.searchCompanyByName(intelligence.companyName);
            if (companySearchResult && companySearchResult.linkedin_url) {
              console.log(`✅ Found LinkedIn URL: ${companySearchResult.linkedin_url}`);
              const linkedinResult = await this.previewSearch.discoverAllStakeholders(
                {
                  linkedinUrl: companySearchResult.linkedin_url,
                  website: intelligence.website,
                  companyName: intelligence.companyName
                },
                params.maxPreviewPages,
                params.filteringLevel,
                this.productCategory,
                this.options.customFiltering || null,
                this.options.usaOnly || false
              );
              const linkedinEmployees = linkedinResult.employees || [];
              if (linkedinEmployees.length > 0) {
                previewEmployees = linkedinEmployees;
                totalAvailable = linkedinResult.totalAvailable || linkedinEmployees.length;
                hitLimit = linkedinResult.hitLimit || false;
                intelligence.linkedinUrl = companySearchResult.linkedin_url; // Update intelligence
                console.log(`✅ Found ${previewEmployees.length} employees via LinkedIn company search`);
              }
            }
          } catch (error) {
            console.log(`⚠️ LinkedIn company search failed: ${error.message}`);
          }
        }
        
        // Strategy 4: Try company name search (if we have very few results or no results)
        // If we got very few employees (< 5), try searching by company name with no filtering to get more candidates
        if ((previewEmployees.length === 0 || previewEmployees.length < 5) && intelligence.companyName) {
          console.log(`🔍 Strategy 4: Trying company name search (found ${previewEmployees.length} employees, need more)...`);
          // Search by company name only (no LinkedIn URL) with no filtering to cast wider net
          const nameResult = await this.previewSearch.discoverAllStakeholders(
            {
              companyName: intelligence.companyName,
              linkedinUrl: null, // Don't use LinkedIn URL - search by name only
              website: intelligence.website
            },
            params.maxPreviewPages + 5, // Search more pages
            'none', // No filtering - we'll filter after getting all candidates
            this.productCategory,
            this.options.customFiltering || null,
            this.options.usaOnly || false
          );
          const nameEmployees = nameResult.employees || [];
          if (nameEmployees.length > previewEmployees.length) {
            // Merge results, preferring name search results (they're more comprehensive)
            const existingIds = new Set(previewEmployees.map(e => e.id));
            const newEmployees = nameEmployees.filter(e => !existingIds.has(e.id));
            previewEmployees = [...previewEmployees, ...newEmployees];
            totalAvailable = Math.max(totalAvailable, nameResult.totalAvailable || nameEmployees.length);
            hitLimit = hitLimit || nameResult.hitLimit || false;
            console.log(`✅ Found ${newEmployees.length} additional employees via company name search (total: ${previewEmployees.length})`);
          } else if (nameEmployees.length > 0 && previewEmployees.length === 0) {
            // If we had 0 and name search found some, use those
            previewEmployees = nameEmployees;
            totalAvailable = nameResult.totalAvailable || nameEmployees.length;
            hitLimit = nameResult.hitLimit || false;
            console.log(`✅ Found ${previewEmployees.length} employees via company name search`);
          }
        }
      }

      // Strategy 4: Try company name search if we have very few results (< 5 employees)
      // This helps when LinkedIn URL search returns limited results but we need more candidates
      if (previewEmployees.length > 0 && previewEmployees.length < 5 && intelligence.companyName) {
        console.log(`🔍 Strategy 4: Trying company name search (found ${previewEmployees.length} employees, need more)...`);
        // Search by company name only (no LinkedIn URL) with no filtering to cast wider net
        const nameResult = await this.previewSearch.discoverAllStakeholders(
          {
            companyName: intelligence.companyName,
            linkedinUrl: null, // Don't use LinkedIn URL - search by name only
            website: intelligence.website
          },
          params.maxPreviewPages + 5, // Search more pages
          'none', // No filtering - we'll filter after getting all candidates
          this.productCategory,
          this.options.customFiltering || null,
          this.options.usaOnly || false
        );
        const nameEmployees = nameResult.employees || [];
        if (nameEmployees.length > previewEmployees.length) {
          // Merge results, preferring name search results (they're more comprehensive)
          const existingIds = new Set(previewEmployees.map(e => e.id));
          const newEmployees = nameEmployees.filter(e => !existingIds.has(e.id));
          previewEmployees = [...previewEmployees, ...newEmployees];
          totalAvailable = Math.max(totalAvailable, nameResult.totalAvailable || nameEmployees.length);
          hitLimit = hitLimit || nameResult.hitLimit || false;
          console.log(`✅ Found ${newEmployees.length} additional employees via company name search (total: ${previewEmployees.length})`);
        }
      }

      // Adaptive expansion: If we found very few employees, search more pages
      const minEmployeesNeeded = Math.max(5, Math.floor((intelligence.employeeCount || 100) * 0.1));
      if (previewEmployees.length < minEmployeesNeeded && previewEmployees.length < 50 && previewEmployees.length > 0) {
        const additionalPages = Math.min(5, Math.ceil((minEmployeesNeeded - previewEmployees.length) / 50));
        if (additionalPages > 0) {
          console.log(`📈 Found only ${previewEmployees.length} employees, expanding search by ${additionalPages} more pages...`);
          const additionalResult = await this.previewSearch.discoverAllStakeholders(
            {
              linkedinUrl: intelligence.linkedinUrl,
              website: intelligence.website,
              companyName: intelligence.companyName
            },
            params.maxPreviewPages + additionalPages,
            params.filteringLevel,
            this.productCategory,
            this.options.customFiltering || null,
            this.options.usaOnly || false
          );

          const additionalEmployees = additionalResult.employees || [];

          // Merge and deduplicate by ID
          const existingIds = new Set(previewEmployees.map(e => e.id));
          const newEmployees = additionalEmployees.filter(e => !existingIds.has(e.id));
          previewEmployees = [...previewEmployees, ...newEmployees];
          totalAvailable = Math.max(totalAvailable, additionalResult.totalAvailable || additionalEmployees.length);
          hitLimit = hitLimit || additionalResult.hitLimit || false;
          console.log(`✅ Expanded search found ${newEmployees.length} additional employees (total: ${previewEmployees.length})`);
        }
      }
      
      // 🧠 INTELLIGENT MULTI-QUERY: Expand search when hitting API limit
      // This uses cheap preview queries (search credits) to get more candidates
      // before expensive collect operations
      if (hitLimit && this.options.customFiltering && previewEmployees.length < totalAvailable) {
        const maxResultsTarget = this.calculateMaxResultsTarget(intelligence, params);

        if (previewEmployees.length < maxResultsTarget && totalAvailable > previewEmployees.length) {
          console.log(`🧠 INTELLIGENT MULTI-QUERY: Expanding from ${previewEmployees.length} to target ${maxResultsTarget}...`);
          console.log(`   Total available in Coresignal: ${totalAvailable}`);

          try {
            const expandedEmployees = await this.previewSearch.intelligentMultiQuery(
              {
                linkedinUrl: intelligence.linkedinUrl,
                website: intelligence.website,
                companyName: intelligence.companyName
              },
              this.options.customFiltering,
              maxResultsTarget
            );

            if (expandedEmployees.length > previewEmployees.length) {
              const newCount = expandedEmployees.length - previewEmployees.length;
              console.log(`✅ Intelligent multi-query found ${newCount} additional employees`);
              previewEmployees = expandedEmployees;
            } else {
              console.log(`⚠️ Intelligent multi-query did not find additional unique employees`);
            }
          } catch (error) {
            console.log(`⚠️ Intelligent multi-query failed: ${error.message}`);
            // Continue with existing results
          }
        }
      }

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
      
      // 🎯 HUNTER WEIGHTED MODE: Full buyer groups but exclude farmers
      if (this.hunterWeightedMode && !this.strictSalesMode) {
        console.log('🎯 Hunter Weighted Mode: Building full buyer group, excluding farmers');
        
        // Filter out farmer roles from the candidate pool
        const beforeCount = relevantEmployees.length;
        relevantEmployees = relevantEmployees.filter(emp => !this.isFarmer(emp.title));
        const removed = beforeCount - relevantEmployees.length;
        
        if (removed > 0) {
          console.log(`🎯 Hunter Weighted: Removed ${removed} farmer roles (Account Managers, Strategic AEs, CS)`);
        }
        console.log(`🎯 Hunter Weighted: ${relevantEmployees.length} candidates remaining`);
      }
      
      // 🎯 STRICT SALES MODE: Skip all fallbacks - only keep sales hunters
      if (this.strictSalesMode) {
        console.log('🎯 Strict Sales Mode: Only keeping sales/revenue roles, no fallbacks');
        
        // Filter to only sales hunters from the scored employees
        relevantEmployees = scoredEmployees.filter(emp => this.isSalesHunter(emp.title));
        console.log(`🎯 Strict Sales Mode: Found ${relevantEmployees.length} sales hunters`);
        
        if (relevantEmployees.length === 0) {
          console.log('⚠️ No sales hunters found - SKIPPING this company (strict mode)');
          console.log('   This company may not have USA-based sales people');
          // Return early with empty result
        }
      } else {
        // Original fallback logic for non-strict mode
      
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
      
      // Absolute fallback: take top candidates by overall score, but exclude clearly irrelevant roles
      if (relevantEmployees.length === 0 && scoredEmployees.length > 0) {
        console.log('⚠️ CEO filter yielded 0 results, taking top candidates by score with basic filtering...');
        // Apply basic filtering to exclude clearly irrelevant roles (AV, facilities, maintenance, etc.)
        const basicFiltered = scoredEmployees.filter(emp => {
          const title = (emp.title || '').toLowerCase();
          const dept = (emp.department || '').toLowerCase();
          // Exclude AV, facilities, maintenance, custodial, security, dining, housing
          const excludedKeywords = ['av operations', 'audio visual', 'av technician', 'facilities', 'maintenance', 'custodial', 'security', 'dining', 'housing'];
          const isExcluded = excludedKeywords.some(keyword => title.includes(keyword) || dept.includes(keyword));
          if (isExcluded) {
            console.log(`   ⚠️ Excluding ${emp.name || 'unknown'} - ${title} (excluded keyword match)`);
            return false;
          }
          // Prefer people with some relevance or influence
          return (emp.relevance || 0) > 0.05 || (emp.scores?.influence || 0) > 0 || (emp.scores?.departmentFit || 0) > 0;
        });
        
        // Sort by total score and take top candidates
        relevantEmployees = basicFiltered
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
          .slice(0, Math.min(10, basicFiltered.length)); // Take up to 10, not just 5
        console.log(`🎯 Top candidates fallback: ${relevantEmployees.length} relevant candidates (after excluding AV/facilities/maintenance)`);
      }
      
      // Final safety net: if we still have 0, use ALL scored employees (we need at least 1)
      if (relevantEmployees.length === 0 && scoredEmployees.length > 0) {
        console.log('⚠️ All filters yielded 0 results, using ALL scored employees as fallback...');
        relevantEmployees = scoredEmployees
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
          .slice(0, Math.min(10, scoredEmployees.length)); // Take up to 10 best
        console.log(`🎯 Final fallback: ${relevantEmployees.length} candidates (using all available)`);
        }
      }
      
      // CRITICAL: If we have NO employees at all, this is a failure case
      // The pipeline will handle this later, but we log it here
      if (previewEmployees.length === 0) {
        console.log('⚠️ WARNING: No employees found in Coresignal for this company');
        console.log('   This may indicate:');
        console.log('   - Company not in Coresignal database');
        console.log('   - Wrong company matched');
        console.log('   - Very small company with no LinkedIn presence');
        console.log('   - Company name/domain mismatch');
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
          intelligence.employeeCount || 0,
          null, // rolePriorities
          this.productCategory, // productCategory for dynamic role assignment
          intelligence.industry // companyIndustry for dynamic role assignment
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
      
      // Stage 5: Determine Optimal Buyer Group Size (smart sizing)
      const sizing = new BuyerGroupSizing(this.dealSize, intelligence, aiValidatedEmployees);
      const sizeConstraints = sizing.determineOptimalSize();
      
      console.log(`📏 Buyer Group Size Analysis:`);
      console.log(`   Constraints: ${sizeConstraints.min}-${sizeConstraints.max} (ideal: ${sizeConstraints.ideal})`);
      console.log(`   Reasoning: ${sizeConstraints.reasoning}`);
      if (sizeConstraints.acceptSinglePerson) {
        console.log(`   ✅ Single person buyer group acceptable`);
      }
      
      // Stage 5: Select Optimal Group (free)
      const initialBuyerGroup = await this.executeStage('group-selection', async () => {
        // Use smart sizing constraints instead of rigid tier-based size
        const buyerGroupSize = {
          min: sizeConstraints.min,
          max: sizeConstraints.max,
          ideal: sizeConstraints.ideal
        };
        
        const roleAssignment = new RoleAssignment(
          this.dealSize, 
          intelligence.revenue || 0, 
          intelligence.employeeCount || 0,
          this.options.rolePriorities || null,
          this.productCategory, // productCategory for dynamic role assignment
          intelligence.industry // companyIndustry for dynamic role assignment
        );
        const selected = roleAssignment.selectOptimalBuyerGroup(aiValidatedEmployees, buyerGroupSize);
        
        // Validate the selected size
        const validation = sizing.validateSize(selected.length, sizeConstraints);
        const recommendation = sizing.getRecommendation(selected.length, sizeConstraints);
        
        console.log(`📊 Buyer Group Size Validation:`);
        console.log(`   Actual: ${selected.length} members`);
        console.log(`   Score: ${validation.score}/100`);
        console.log(`   ${validation.reasoning}`);
        console.log(`   Recommendation: ${recommendation.message}`);
        
        // Store sizing info in pipeline state
        this.pipelineState.buyerGroupSizing = {
          constraints: sizeConstraints,
          validation: validation,
          recommendation: recommendation
        };
        
        return selected;
      });
      
      // CRITICAL: Ensure we have at least 1 person in buyer group
      if (initialBuyerGroup.length === 0 && aiValidatedEmployees.length > 0) {
        console.log('⚠️ Buyer group is empty, adding best available candidate as decision maker...');
        const bestCandidate = aiValidatedEmployees
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))[0];
        bestCandidate.buyerGroupRole = 'decision';
        bestCandidate.roleConfidence = 70;
        bestCandidate.roleReasoning = 'Added as fallback - only available candidate';
        initialBuyerGroup.push(bestCandidate);
        console.log(`✅ Added ${bestCandidate.name} as decision maker`);
      }
      
      // Stage 6: Cross-Functional Coverage (free)
      const { enhanced: crossFunctionalGroup, coverage } = await this.executeStage('cross-functional', async () => {
        const crossFunctional = new CrossFunctionalCoverage(this.dealSize);
        return crossFunctional.validate(initialBuyerGroup, aiValidatedEmployees);
      });
      
      // CRITICAL: Final check - ensure we have at least 1 person
      if (crossFunctionalGroup.length === 0 && aiValidatedEmployees.length > 0) {
        console.log('⚠️ Cross-functional group is empty, adding best available candidate...');
        const bestCandidate = aiValidatedEmployees
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))[0];
        bestCandidate.buyerGroupRole = 'decision';
        bestCandidate.roleConfidence = 70;
        bestCandidate.roleReasoning = 'Added as final fallback - only available candidate';
        crossFunctionalGroup.push(bestCandidate);
        console.log(`✅ Added ${bestCandidate.name} as decision maker`);
      }
      
      // CRITICAL: Final safety check before profile collection
      const groupToEnrich = crossFunctionalGroup.length > 0 ? crossFunctionalGroup : initialBuyerGroup;
      if (groupToEnrich.length === 0 && aiValidatedEmployees.length > 0) {
        console.log('⚠️ No buyer group members before profile collection, adding best candidate...');
        const bestCandidate = aiValidatedEmployees
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))[0];
        bestCandidate.buyerGroupRole = 'decision';
        bestCandidate.roleConfidence = 70;
        bestCandidate.roleReasoning = 'Added as final safety fallback';
        groupToEnrich.push(bestCandidate);
        console.log(`✅ Added ${bestCandidate.name} as decision maker`);
      }
      
      // Stage 7: Collect Full Profiles (expensive - only for final group)
      const enrichedBuyerGroup = await this.executeStage('profile-collection', async () => {
        console.log(`🔍 Debug: crossFunctionalGroup =`, crossFunctionalGroup ? crossFunctionalGroup.length : 'undefined');
        console.log(`🔍 Debug: initialBuyerGroup =`, initialBuyerGroup ? initialBuyerGroup.length : 'undefined');
        console.log(`🔍 Debug: groupToEnrich =`, groupToEnrich.length);
        return await this.collectFullProfiles(groupToEnrich);
      });
      
      // Stage 7.5: Multi-Source Email Verification & Discovery
      const emailVerifiedBuyerGroup = await this.executeStage('email-verification', async () => {
        return await this.verifyAndEnrichEmails(enrichedBuyerGroup, intelligence);
      });
      
      this.pipelineState.costs.collect = enrichedBuyerGroup.length * 1.0; // $1.00 per collect
      this.pipelineState.costs.email = emailVerifiedBuyerGroup.reduce((sum, m) => sum + (m.emailVerificationCost || 0), 0);
      
      // Stage 8: Cohesion Validation (free)
      const cohesion = await this.executeStage('cohesion-validation', async () => {
        return this.cohesionValidator.validate(emailVerifiedBuyerGroup || []);
      });
      
      // Stage 8.5: AI Buyer Group Validation (optional - only if ANTHROPIC_API_KEY exists)
      let aiValidatedBuyerGroup = emailVerifiedBuyerGroup;
      let aiValidationResults = null;
      if (this.aiReasoning && emailVerifiedBuyerGroup && emailVerifiedBuyerGroup.length > 0) {
        const aiValidation = await this.executeStage('ai-buyer-group-validation', async () => {
          console.log('🤖 Running AI buyer group validation...');
          
          try {
            const validation = await this.aiReasoning.validateBuyerGroup(
              emailVerifiedBuyerGroup, 
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
        console.log(`🔍 Debug: emailVerifiedBuyerGroup =`, emailVerifiedBuyerGroup ? emailVerifiedBuyerGroup.length : 'undefined');
        console.log(`🔍 Debug: emailVerifiedBuyerGroup type =`, typeof emailVerifiedBuyerGroup);
        console.log(`🔍 Debug: emailVerifiedBuyerGroup || [] =`, (emailVerifiedBuyerGroup || []).length);
        
        try {
          return this.reportGenerator.generate({
            intelligence,
            previewEmployees,
            buyerGroup: aiValidatedBuyerGroup || emailVerifiedBuyerGroup || [],
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
      
      // Stage 10: Multi-Source Phone Verification & Enrichment
      const phoneEnrichedBuyerGroup = await this.executeStage('phone-verification', async () => {
        return await this.verifyAndEnrichPhones(emailVerifiedBuyerGroup, intelligence);
      });
      
      this.pipelineState.costs.phone = phoneEnrichedBuyerGroup.reduce((sum, m) => sum + (m.phoneVerificationCost || 0), 0);
      this.pipelineState.costs.total = this.pipelineState.costs.preview + this.pipelineState.costs.collect + this.pipelineState.costs.email + this.pipelineState.costs.phone;
      
      // Stage 10.5: Add Pain Points to Buyer Group Members
      const buyerGroupWithPainPoints = await this.executeStage('pain-points-enrichment', async () => {
        console.log('🎯 Enriching buyer group members with pain points...');
        const enrichedMembers = [];
        for (const member of phoneEnrichedBuyerGroup) {
          try {
            const painPoints = await this.generateEnhancedPainPoints(member, intelligence);
            enrichedMembers.push({
              ...member,
              painPoints: painPoints
            });
          } catch (error) {
            console.warn(`⚠️  Failed to generate pain points for ${member.name}: ${error.message}`);
            enrichedMembers.push({
              ...member,
              painPoints: []
            });
          }
        }
        console.log(`✅ Added pain points to ${enrichedMembers.length} buyer group members`);
        return enrichedMembers;
      });
      
      // Stage 11: Database Persistence (conditional)
      if (!this.options.skipDatabase) {
        await this.executeStage('database-persistence', async () => {
          return await this.saveBuyerGroupToDatabase(buyerGroupWithPainPoints, report, intelligence);
        });
      } else {
        console.log('⏭️  Skipping database persistence (skipDatabase flag set)');
      }
      
      this.pipelineState.finalBuyerGroup = buyerGroupWithPainPoints;
      this.pipelineState.stage = 'completed';
      
      const processingTime = Date.now() - this.pipelineState.startTime;
      
      console.log('✅ Pipeline completed successfully!');
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`💰 Total cost: $${this.pipelineState.costs.total.toFixed(2)}`);
      console.log(`👥 Final buyer group: ${buyerGroupWithPainPoints.length} members`);
      console.log(`📊 Cohesion score: ${cohesion.score}%`);
      
      return {
        buyerGroup: buyerGroupWithPainPoints,
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
    // Clean API key - remove newlines and trim whitespace
    const apiKey = (process.env.CORESIGNAL_API_KEY || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    if (!apiKey) {
      throw new Error('CORESIGNAL_API_KEY not found in environment variables');
    }
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
   * Calculate churn prediction based on average time in role
   * @param {Array} experience - Array of experience records from Coresignal
   * @param {number} currentMonthsInRole - Current months in role
   * @returns {object} Churn prediction data
   */
  calculateChurnPrediction(experience = [], currentMonthsInRole = 0) {
    if (!Array.isArray(experience) || experience.length === 0) {
      return {
        averageTimeInRoleMonths: null,
        predictedDepartureMonths: null,
        churnRiskScore: 50, // Medium risk if no data
        churnRiskLevel: 'medium',
        predictedDepartureDate: null,
        reasoning: 'Insufficient experience data for churn prediction'
      };
    }

    // Calculate average time in each role (excluding current role)
    const completedRoles = experience.filter(exp => 
      exp.active_experience === 0 && exp.duration_months && exp.duration_months > 0
    );

    if (completedRoles.length === 0) {
      // If no completed roles, use industry averages or default
      const defaultAverageMonths = 24; // 2 years default
      const monthsUntilDeparture = Math.max(0, defaultAverageMonths - currentMonthsInRole);
      const churnRiskScore = currentMonthsInRole >= defaultAverageMonths ? 70 : 30;
      
      return {
        averageTimeInRoleMonths: defaultAverageMonths,
        predictedDepartureMonths: monthsUntilDeparture,
        churnRiskScore: churnRiskScore,
        churnRiskLevel: churnRiskScore >= 60 ? 'high' : churnRiskScore >= 40 ? 'medium' : 'low',
        predictedDepartureDate: monthsUntilDeparture > 0 
          ? new Date(Date.now() + monthsUntilDeparture * 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        reasoning: `No completed roles found, using industry default (${defaultAverageMonths} months). Current: ${currentMonthsInRole} months.`
      };
    }

    // Calculate average time in role from completed positions
    const totalMonths = completedRoles.reduce((sum, exp) => sum + (exp.duration_months || 0), 0);
    const averageTimeInRoleMonths = Math.round(totalMonths / completedRoles.length);

    // Predict departure: average time - current time = months until likely departure
    const predictedDepartureMonths = Math.max(0, averageTimeInRoleMonths - currentMonthsInRole);

    // Calculate churn risk score (0-100)
    // Higher score = higher risk of leaving soon
    let churnRiskScore = 50; // Base score
    
    if (currentMonthsInRole >= averageTimeInRoleMonths) {
      // Already past average - high risk
      churnRiskScore = 70 + Math.min(20, (currentMonthsInRole - averageTimeInRoleMonths) / 2);
    } else if (currentMonthsInRole >= averageTimeInRoleMonths * 0.8) {
      // Approaching average - medium-high risk
      churnRiskScore = 55 + ((currentMonthsInRole / averageTimeInRoleMonths) * 15);
    } else {
      // Well below average - low risk
      churnRiskScore = 30 + ((currentMonthsInRole / averageTimeInRoleMonths) * 20);
    }

    // Adjust for number of roles (more roles = higher churn tendency)
    if (completedRoles.length >= 5) {
      churnRiskScore += 10; // Job hopper
    } else if (completedRoles.length >= 3) {
      churnRiskScore += 5;
    }

    // Cap at 0-100
    churnRiskScore = Math.max(0, Math.min(100, Math.round(churnRiskScore)));

    // Determine risk level
    let churnRiskLevel = 'low';
    if (churnRiskScore >= 60) churnRiskLevel = 'high';
    else if (churnRiskScore >= 40) churnRiskLevel = 'medium';

    // Calculate predicted departure date
    const predictedDepartureDate = predictedDepartureMonths > 0
      ? new Date(Date.now() + predictedDepartureMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Determine refresh priority and schedule based on risk level
    // Red (High Risk): Daily refresh - people likely to leave soon
    // Orange (Medium): Weekly refresh
    // Green (Low Risk): Monthly refresh - standard Coresignal refresh rate
    const refreshSchedule = this.calculateRefreshSchedule(churnRiskScore, churnRiskLevel, predictedDepartureMonths);

    return {
      averageTimeInRoleMonths: averageTimeInRoleMonths,
      predictedDepartureMonths: predictedDepartureMonths,
      churnRiskScore: churnRiskScore,
      churnRiskLevel: churnRiskLevel,
      predictedDepartureDate: predictedDepartureDate,
      reasoning: `Average time in role: ${averageTimeInRoleMonths} months. Current: ${currentMonthsInRole} months. Predicted departure in ${predictedDepartureMonths} months.`,
      completedRolesCount: completedRoles.length,
      // Refresh scheduling
      refreshPriority: refreshSchedule.priority,
      refreshColor: refreshSchedule.color,
      refreshFrequency: refreshSchedule.frequency,
      nextRefreshDate: refreshSchedule.nextRefreshDate,
      lastRefreshDate: new Date().toISOString() // Set to now on initial calculation
    };
  }

  /**
   * Calculate refresh schedule based on churn risk
   * @param {number} churnRiskScore - Churn risk score (0-100)
   * @param {string} churnRiskLevel - Risk level (low/medium/high)
   * @param {number} predictedDepartureMonths - Months until predicted departure
   * @returns {object} Refresh schedule configuration
   */
  calculateRefreshSchedule(churnRiskScore, churnRiskLevel, predictedDepartureMonths) {
    const now = new Date();
    
    // Red (High Risk): Daily refresh
    // - Risk score >= 60
    // - OR predicted departure within 3 months
    if (churnRiskScore >= 60 || (predictedDepartureMonths !== null && predictedDepartureMonths <= 3)) {
      const nextRefresh = new Date(now);
      nextRefresh.setDate(nextRefresh.getDate() + 1); // Tomorrow
      
      return {
        priority: 'high',
        color: 'red',
        frequency: 'daily',
        frequencyDays: 1,
        nextRefreshDate: nextRefresh.toISOString(),
        reasoning: 'High churn risk - refresh daily to catch departures early'
      };
    }
    
    // Orange (Medium Risk): Weekly refresh
    // - Risk score 40-59
    // - OR predicted departure within 6 months
    if (churnRiskScore >= 40 || (predictedDepartureMonths !== null && predictedDepartureMonths <= 6)) {
      const nextRefresh = new Date(now);
      nextRefresh.setDate(nextRefresh.getDate() + 7); // 1 week
      
      return {
        priority: 'medium',
        color: 'orange',
        frequency: 'weekly',
        frequencyDays: 7,
        nextRefreshDate: nextRefresh.toISOString(),
        reasoning: 'Medium churn risk - refresh weekly to monitor changes'
      };
    }
    
    // Green (Low Risk): Monthly refresh (standard Coresignal rate)
    // - Risk score < 40
    // - Predicted departure > 6 months away
    const nextRefresh = new Date(now);
    nextRefresh.setMonth(nextRefresh.getMonth() + 1); // 1 month
    
    return {
      priority: 'low',
      color: 'green',
      frequency: 'monthly',
      frequencyDays: 30,
      nextRefreshDate: nextRefresh.toISOString(),
      reasoning: 'Low churn risk - monthly refresh aligns with Coresignal update cycle'
    };
  }

  /**
   * Verify and enrich emails for buyer group members using multi-source verification
   * @param {Array} buyerGroup - Buyer group members
   * @param {object} intelligence - Company intelligence data
   * @returns {Array} Buyer group with verified/discovered emails
   */
  async verifyAndEnrichEmails(buyerGroup, intelligence) {
    console.log(`📧 Verifying and enriching emails for ${buyerGroup.length} members...`);
    
    const enrichedGroup = [];
    let totalCost = 0;
    let emailsVerified = 0;
    let emailsDiscovered = 0;
    
    for (const member of buyerGroup) {
      try {
        // Extract existing email from Coresignal data
        const coresignalEmail = this.extractEmailFromCoresignal(member.fullProfile);
        const existingEmail = coresignalEmail || (member.email && !member.email.includes('@coresignal.temp') ? member.email : null);
        
        const companyDomain = intelligence.website ? extractDomain(intelligence.website) : null;
        
        let verifiedEmail = null;
        let emailConfidence = 0;
        let emailVerificationDetails = [];
        let verificationCost = 0;
        
        if (existingEmail) {
          // Verify existing email with multi-layer verification
          console.log(`   ✅ Verifying existing email: ${existingEmail}`);
          
          const verification = await this.emailVerifier.verifyEmailMultiLayer(
            existingEmail,
            member.name,
            companyDomain
          );
          
          if (verification.valid) {
            verifiedEmail = existingEmail;
            emailConfidence = verification.confidence;
            emailVerificationDetails = verification.validationDetails || [];
            emailsVerified++;
            
            // Estimate cost: $0.001 for ZeroBounce or $0.003 for MyEmailVerifier
            verificationCost = 0.003; // Conservative estimate
          } else {
            console.log(`   ⚠️ Email validation failed (${verification.confidence}% confidence), trying discovery...`);
          }
        }
        
        // If no email or validation failed, try to discover email
        if (!verifiedEmail) {
          console.log(`   🔍 Discovering email for ${member.name}...`);
          
          // Use Prospeo for email discovery if available
          if (process.env.PROSPEO_API_KEY) {
            try {
              const prospeoResult = await this.discoverEmailWithProspeo(
                member.name,
                intelligence.companyName,
                companyDomain
              );
              
              if (prospeoResult && prospeoResult.email) {
                verifiedEmail = prospeoResult.email;
                emailConfidence = prospeoResult.confidence || 80;
                emailVerificationDetails = prospeoResult.verificationDetails || [];
                verificationCost = 0.0198; // Prospeo cost per verified email
                emailsDiscovered++;
                
                console.log(`   ✅ Discovered email: ${verifiedEmail} (${emailConfidence}% confidence)`);
              }
            } catch (error) {
              console.log(`   ⚠️ Email discovery failed: ${error.message}`);
            }
          }
        }
        
        totalCost += verificationCost;
        
        enrichedGroup.push({
          ...member,
          email: verifiedEmail || existingEmail || member.email,
          emailVerified: !!verifiedEmail,
          emailConfidence: emailConfidence,
          emailVerificationDetails: emailVerificationDetails,
          emailVerificationCost: verificationCost,
          emailSource: verifiedEmail ? (existingEmail ? 'verified' : 'discovered') : 'unverified'
        });
        
        // Rate limiting
        await delay(100);
        
      } catch (error) {
        console.error(`   ❌ Failed to verify/discover email for ${member.name}:`, error.message);
        // Keep member with original email data
        enrichedGroup.push({
          ...member,
          emailVerified: false,
          emailConfidence: 0,
          emailVerificationError: error.message
        });
      }
    }
    
    console.log(`✅ Email verification complete:`);
    console.log(`   - Verified: ${emailsVerified} emails`);
    console.log(`   - Discovered: ${emailsDiscovered} emails`);
    console.log(`   - Total cost: $${totalCost.toFixed(4)}`);
    
    return enrichedGroup;
  }
  
  /**
   * Discover email using Prospeo Email Finder
   * @param {string} name - Person's full name
   * @param {string} companyName - Company name
   * @param {string} companyDomain - Company domain
   * @returns {object|null} Email discovery result
   */
  async discoverEmailWithProspeo(name, companyName, companyDomain) {
    // Clean Prospeo API key - remove newlines and trim whitespace
    const prospeoApiKey = (process.env.PROSPEO_API_KEY || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    if (!prospeoApiKey) {
      return null;
    }
    
    try {
      // Parse name for API
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      
      const response = await fetch('https://api.prospeo.io/email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': prospeoApiKey
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          company_domain: companyDomain
        }),
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.email && data.email.email) {
          const isValid = data.email.verification?.result === 'deliverable';
          const confidence = isValid ? 85 : 50;
          
          return {
            email: data.email.email,
            confidence: confidence,
            isValid: isValid,
            pattern: data.email.email_pattern,
            verificationDetails: [{
              layer: 'Prospeo',
              status: data.email.verification?.result || 'unknown',
              confidence: confidence,
              reasoning: `Discovered via Prospeo: ${data.email.verification?.result || 'found'}`
            }]
          };
        }
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        console.log(`   ⚠️ Prospeo API error: ${response.status} - ${errorData.message || errorText.substring(0, 100)}`);
        if (response.status === 401) {
          console.log(`   💡 Prospeo authentication failed - check PROSPEO_API_KEY is valid`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Prospeo discovery error: ${error.message}`);
    }
    
    return null;
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
   * Verify and enrich phone numbers for buyer group members using multi-source verification
   * @param {Array} buyerGroup - Buyer group members
   * @param {object} intelligence - Company intelligence data
   * @returns {Array} Buyer group with verified/discovered phone numbers
   */
  async verifyAndEnrichPhones(buyerGroup, intelligence) {
    console.log(`📞 Verifying and enriching phone numbers for ${buyerGroup.length} members...`);
    
    const enrichedGroup = [];
    let totalCost = 0;
    let phonesVerified = 0;
    let phonesDiscovered = 0;
    
    for (const member of buyerGroup) {
      try {
        // Extract existing phone from Coresignal data
        const coresignalPhone = this.extractPhoneFromCoresignal(member.fullProfile);
        const existingPhone = coresignalPhone || member.phone || member.mobilePhone || member.workPhone;
        
        let verifiedPhone = null;
        let phoneConfidence = 0;
        let phoneVerificationDetails = [];
        let verificationCost = 0;
        let phoneType = 'unknown';
        let phoneMetadata = {};
        
        if (existingPhone) {
          // Verify existing phone with multi-source verification
          console.log(`   ✅ Verifying existing phone: ${existingPhone}`);
          
          const verification = await this.emailVerifier.verifyPhone(
            existingPhone,
            member.name,
            intelligence.companyName,
            member.linkedinUrl
          );
          
          if (verification.valid) {
            verifiedPhone = existingPhone;
            phoneConfidence = verification.confidence;
            phoneVerificationDetails = verification.verificationDetails || [];
            phonesVerified++;
            
            // Determine phone type from verification sources
            phoneType = this.extractPhoneType(verification.verificationDetails);
            phoneMetadata = verification.metadata || {};
            
            // Estimate cost: Lusha (~$0.01) + Twilio (~$0.005) + PDL (~$0.01) + Prospeo (~$0.02)
            verificationCost = 0.045; // Conservative estimate for multi-source
          } else {
            console.log(`   ⚠️ Phone validation failed (${verification.confidence}% confidence), trying discovery...`);
          }
        }
        
        // If no phone or validation failed, try to discover phone
        if (!verifiedPhone && member.linkedinUrl) {
          console.log(`   🔍 Discovering phone for ${member.name}...`);
          
          // Try Lusha first for phone discovery
          if (process.env.LUSHA_API_KEY) {
            try {
              console.log(`   🔗 Lusha enrichment: ${member.linkedinUrl.split('/').pop()}...`);
              const cleanedLushaKey = (process.env.LUSHA_API_KEY || '').trim().replace(/\n/g, '').replace(/\r/g, '');
              const lushaResult = await this.enrichWithLushaLinkedIn(member.linkedinUrl, cleanedLushaKey);
              
              if (lushaResult && (lushaResult.phone1 || lushaResult.mobilePhone || lushaResult.directDialPhone)) {
                verifiedPhone = lushaResult.directDialPhone || lushaResult.mobilePhone || lushaResult.phone1;
                phoneConfidence = lushaResult.phoneDataQuality || 75;
                phoneType = this.determineLushaPhoneType(lushaResult);
                phoneVerificationDetails = [{
                  source: 'Lusha',
                  verified: true,
                  confidence: phoneConfidence,
                  reasoning: `Discovered via Lusha LinkedIn enrichment: ${phoneType}`
                }];
                verificationCost = 0.01;
                phonesDiscovered++;
                console.log(`   ✅ Lusha phone: ${verifiedPhone} (${phoneConfidence}% confidence)`);
              }
            } catch (error) {
              console.log(`   ⚠️ Lusha Phone API error: ${error.message?.substring(0, 50)}`);
            }
          }
          
          // Fallback to Prospeo if Lusha didn't find phone
          if (!verifiedPhone && process.env.PROSPEO_API_KEY) {
            try {
              console.log(`   🔗 Prospeo enrichment: ${member.linkedinUrl.split('/').pop()}...`);
              const prospeoResult = await this.enrichWithProspeoLinkedIn(member.linkedinUrl);
              
              if (prospeoResult && prospeoResult.phone) {
                verifiedPhone = prospeoResult.phone;
                phoneConfidence = 70;
                phoneType = 'mobile';
                phoneVerificationDetails = [{
                  source: 'Prospeo',
                  verified: true,
                  confidence: phoneConfidence,
                  reasoning: 'Discovered via Prospeo LinkedIn enrichment'
                }];
                verificationCost = 0.02;
                phonesDiscovered++;
                console.log(`   ✅ Prospeo phone: ${verifiedPhone} (${phoneConfidence}% confidence)`);
              }
            } catch (error) {
              console.log(`   ⚠️ Prospeo Phone API error: ${error.message?.substring(0, 50)}`);
            }
          }
        }
        
        totalCost += verificationCost;
        
        enrichedGroup.push({
          ...member,
          phone: verifiedPhone || existingPhone || member.phone,
          phone1: verifiedPhone || existingPhone,
          phoneVerified: !!verifiedPhone,
          phoneConfidence: phoneConfidence,
          phoneVerificationDetails: phoneVerificationDetails,
          phoneVerificationCost: verificationCost,
          phoneSource: verifiedPhone ? (existingPhone ? 'verified' : 'discovered') : 'unverified',
          phoneType: phoneType,
          phoneMetadata: phoneMetadata,
          // Keep existing Lusha data structure for backward compatibility
          mobilePhone: member.mobilePhone || (phoneType === 'mobile' ? verifiedPhone : null),
          workPhone: member.workPhone || (phoneType === 'work' ? verifiedPhone : null),
          directDialPhone: member.directDialPhone || (phoneType === 'direct' ? verifiedPhone : null)
        });
        
        // Rate limiting
        await delay(500);
        
      } catch (error) {
        console.error(`   ❌ Failed to verify/discover phone for ${member.name}:`, error.message);
        // Keep member with original phone data
        enrichedGroup.push({
          ...member,
          phoneVerified: false,
          phoneConfidence: 0,
          phoneVerificationError: error.message
        });
      }
    }
    
    console.log(`✅ Phone verification complete:`);
    console.log(`   - Verified: ${phonesVerified} phones`);
    console.log(`   - Discovered: ${phonesDiscovered} phones`);
    console.log(`   - Total cost: $${totalCost.toFixed(4)}`);
    
    return enrichedGroup;
  }
  
  /**
   * Extract phone type from verification details
   * @param {Array} verificationDetails - Verification details from multi-source
   * @returns {string} Phone type: direct, mobile, work, or unknown
   */
  extractPhoneType(verificationDetails) {
    if (!verificationDetails || verificationDetails.length === 0) {
      return 'unknown';
    }
    
    // Check each source for phone type information
    for (const detail of verificationDetails) {
      if (detail.metadata?.lineType) {
        return detail.metadata.lineType;
      }
      if (detail.reasoning?.toLowerCase().includes('direct')) {
        return 'direct';
      }
      if (detail.reasoning?.toLowerCase().includes('mobile')) {
        return 'mobile';
      }
      if (detail.reasoning?.toLowerCase().includes('work')) {
        return 'work';
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Determine phone type from Lusha data
   * @param {object} lushaData - Lusha enrichment result
   * @returns {string} Phone type
   */
  determineLushaPhoneType(lushaData) {
    if (lushaData.directDialPhone) return 'direct';
    if (lushaData.mobilePhone) return 'mobile';
    if (lushaData.workPhone) return 'work';
    if (lushaData.phone1Type) return lushaData.phone1Type;
    return 'unknown';
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
   * Enrich contact with phone number from Prospeo LinkedIn lookup
   * @param {string} linkedinUrl - LinkedIn profile URL
   * @returns {object} Prospeo enrichment result with phone
   */
  async enrichWithProspeoLinkedIn(linkedinUrl) {
    try {
      const prospeoKey = process.env.PROSPEO_API_KEY;
      if (!prospeoKey) return null;
      
      const response = await fetch('https://api.prospeo.io/linkedin-email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': prospeoKey
        },
        body: JSON.stringify({ url: linkedinUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.error && data.response) {
          const result = {
            email: typeof data.response.email === 'string' 
              ? data.response.email 
              : data.response.email?.email,
            phone: data.response.phone || data.response.mobile_phone || null,
            firstName: data.response.first_name,
            lastName: data.response.last_name,
            title: data.response.title,
            company: data.response.company
          };
          
          return result;
        }
      } else {
        const errorText = await response.text();
        console.log(`   ⚠️ Prospeo API error: ${response.status} - ${errorText.substring(0, 50)}`);
      }
      
    } catch (error) {
      console.log(`   ⚠️ Prospeo error:`, error.message);
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
   * Generate enhanced pain points using AI reasoning
   * @param {object} member - Buyer group member
   * @param {object} intelligence - Company intelligence
   * @returns {Promise<Array>} Array of pain points
   */
  async generateEnhancedPainPoints(member, intelligence) {
    // Use AI reasoning if available
    if (this.aiReasoning) {
      try {
        const productContext = {
          productName: this.options.productName || this.productCategory,
          productCategory: this.productCategory,
          dealSize: this.dealSize,
          focusArea: this.options.productName || 'General business improvement'
        };
        
        const companyContext = {
          companyName: intelligence.companyName,
          industry: intelligence.industry,
          employeeCount: intelligence.employeeCount,
          revenue: intelligence.revenue,
          website: intelligence.website,
          linkedinUrl: intelligence.linkedinUrl
        };
        
        // Gather research data from member's full profile
        const researchData = {
          fullProfile: member.fullProfile || {},
          experience: member.fullProfile?.experience || [],
          skills: member.fullProfile?.inferred_skills || [],
          connections: member.fullProfile?.connections_count || 0,
          followers: member.fullProfile?.followers_count || 0,
          productContext: productContext // Include product context for research analysis
        };
        
        // Generate pain points with directional intelligence
        const painPoints = await this.aiReasoning.generatePainPoints(
          member, 
          productContext, 
          companyContext,
          researchData
        );
        return painPoints;
      } catch (error) {
        console.warn(`⚠️  Failed to generate AI pain points for ${member.name}: ${error.message}`);
        // Fallback to basic pain points
      }
    }
    
    // Fallback to basic pain points
    return this.generatePainPoints(member.title, member.department, intelligence.industry);
  }

  /**
   * Generate pain points based on role, department, and industry (fallback method)
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
      painPoints.push({
        title: 'Lead quality and conversion rates',
        description: 'Struggling with low-quality leads and poor conversion rates.',
        impact: 'Reduced revenue and inefficient sales processes.',
        urgency: 'high'
      });
      painPoints.push({
        title: 'Sales process efficiency',
        description: 'Manual processes slowing down sales cycles.',
        impact: 'Lost opportunities and decreased productivity.',
        urgency: 'medium'
      });
    }
    if (titleLower.includes('marketing') || deptLower.includes('marketing')) {
      painPoints.push({
        title: 'Lead generation ROI',
        description: 'Difficulty measuring and optimizing marketing ROI.',
        impact: 'Unclear marketing effectiveness and budget allocation.',
        urgency: 'high'
      });
    }
    if (titleLower.includes('ceo') || titleLower.includes('president')) {
      painPoints.push({
        title: 'Revenue growth',
        description: 'Challenges in achieving sustainable revenue growth.',
        impact: 'Competitive pressure and market expansion needs.',
        urgency: 'high'
      });
    }
    if (titleLower.includes('cfo') || titleLower.includes('finance')) {
      painPoints.push({
        title: 'Cost optimization',
        description: 'Need to reduce costs while maintaining quality.',
        impact: 'Pressure to improve profitability and efficiency.',
        urgency: 'high'
      });
    }
    
    // Industry-specific pain points
    if (industry && industry.toLowerCase().includes('technology')) {
      painPoints.push({
        title: 'Digital transformation',
        description: 'Challenges in modernizing technology infrastructure.',
        impact: 'Competitive disadvantage and operational inefficiencies.',
        urgency: 'high'
      });
    }
    
    // Default if nothing matches
    if (painPoints.length === 0) {
      painPoints.push({
        title: 'Operational efficiency',
        description: 'Seeking ways to improve processes and reduce manual work.',
        impact: 'Time and resource constraints limiting growth.',
        urgency: 'medium'
      });
    }
    
    return painPoints.slice(0, 5); // Limit to 5 most relevant
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
      const company = await this.findOrCreateCompany(intelligence, this.mainSellerId);
      
      // 2. Create/update People records for ALL buyer group members
      console.log(`👥 Creating/updating People records for ${buyerGroup.length} members...`);
      
      // CRITICAL: Validate all employees are from the correct company before saving
      const validatedMembers = [];
      const rejectedMembers = [];
      
      for (const member of buyerGroup) {
        // Validate employee is from correct company
        const validation = this.validateEmployeeCompany(member, intelligence, company);
        if (!validation.isValid) {
          console.log(`❌ REJECTED: ${member.name} - ${validation.reason}`);
          rejectedMembers.push({ member, reason: validation.reason });
          continue; // Skip invalid employees
        }
        validatedMembers.push(member);
      }
      
      if (rejectedMembers.length > 0) {
        console.log(`⚠️ Rejected ${rejectedMembers.length} employees for company mismatch`);
        const profileFailures = rejectedMembers.filter(r => r.reason.includes('No current company experience') && !r.reason.includes('no company search match'));
        if (profileFailures.length > 0) {
          console.log(`   ⚠️ ${profileFailures.length} employees rejected due to profile collection failures`);
          console.log(`   💡 These employees were found via company search but profile collection failed`);
          console.log(`   💡 Consider checking CORESIGNAL_API_KEY format`);
        }
        console.log(`   Continuing with ${validatedMembers.length} validated employees`);
      }
      
      // Only save validated members
      for (const member of validatedMembers) {
        const nameParts = member.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Extract email from Coresignal data (prioritize real emails from fullProfile)
        const coresignalEmail = this.extractEmailFromCoresignal(member.fullProfile);
        // Use coresignal email if available, otherwise fallback to member.email (but only if it's not fake)
        const email = coresignalEmail || (member.email && !member.email.includes('@coresignal.temp') ? member.email : null);
        
        // Extract phone from Coresignal data
        const coresignalPhone = this.extractPhoneFromCoresignal(member.fullProfile);
        
        // Extract LinkedIn URL from Coresignal fullProfile (prioritize fullProfile over preview data)
        const coresignalLinkedIn = member.fullProfile?.linkedin_url || 
                                   member.fullProfile?.linkedinUrl || 
                                   member.fullProfile?.profile_url ||
                                   null;
        // Use LinkedIn URL from fullProfile if available, otherwise use preview data
        const linkedinUrl = coresignalLinkedIn || member.linkedinUrl || null;
        
        // Check if person already exists
        // Use LinkedIn URL as primary identifier, fallback to email if no LinkedIn
        const existingPerson = await this.prisma.people.findFirst({
          where: {
            workspaceId: this.workspaceId,
            OR: [
              linkedinUrl ? { linkedinUrl: linkedinUrl } : null,
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
        const monthsAtCompany = currentExperience.duration_months || 0;
        const monthsInCurrentRole = currentExperience.duration_months || 0;
        
        // Calculate churn prediction: average time in role vs current time
        const churnPrediction = this.calculateChurnPrediction(experience, monthsInCurrentRole);
        
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
          painPoints: await this.generateEnhancedPainPoints(member, intelligence),
          interests: coresignalData.interests || [],
          goals: this.generateGoals(member.title, member.department),
          challenges: this.generateChallenges(member.title, member.department, intelligence.industry),
          opportunities: this.generateOpportunities(member.title, member.department, intelligence.industry),
          intelligenceSummary: this.generateIntelligenceSummary(member, intelligence),
          churnPrediction: churnPrediction,
          lastUpdated: new Date().toISOString()
        };

        if (existingPerson) {
          // Preserve existing customFields
          const existingCustomFields = existingPerson.customFields && typeof existingPerson.customFields === 'object' 
            ? existingPerson.customFields 
            : {};
          
          // Update existing person with comprehensive intelligence data
          await this.prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              companyId: company.id, // Ensure company link
              // 🏆 FIX: Set mainSellerId if provided, otherwise preserve existing
              mainSellerId: this.mainSellerId || existingPerson.mainSellerId,
              buyerGroupRole: member.buyerGroupRole,
              isBuyerGroupMember: true,
              buyerGroupOptimized: true,
              coresignalData: member.fullProfile, // Keep coresignal data
              enrichedData: {
                ...(existingPerson?.enrichedData && typeof existingPerson.enrichedData === 'object' ? existingPerson.enrichedData : {}),
                ...aiIntelligence,
                emailVerificationDetails: member.emailVerificationDetails || [],
                emailSource: member.emailSource || 'unverified',
                phoneVerificationDetails: member.phoneVerificationDetails || [],
                phoneSource: member.phoneSource || 'unverified',
                phoneType: member.phoneType || 'unknown',
                phoneMetadata: member.phoneMetadata || {}
              },
              aiIntelligence: aiIntelligence,
              aiLastUpdated: new Date(),
              influenceScore: influenceScore,
              decisionPower: decisionPower,
              engagementScore: engagementScore,
              lastEnriched: new Date(),
              // Email data with verification
              email: email,
              emailVerified: member.emailVerified || false,
              emailConfidence: member.emailConfidence || 0,
              // Phone data from Coresignal
              phone: coresignalPhone || member.phone,
              // Phone data (streamlined schema - only basic phone fields)
              mobilePhone: member.mobilePhone,
              workPhone: member.workPhone,
              phoneVerified: member.phoneVerified || member.phone1Verified || false,
              phoneConfidence: member.phoneConfidence || (member.phoneDataQuality ? member.phoneDataQuality / 100 : 0),
              phoneQualityScore: member.phoneConfidence || (member.phoneDataQuality ? member.phoneDataQuality / 100 : 0),
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
              yearsInRole: Math.floor(monthsInCurrentRole / 12),
              currentCompany: currentExperience.company_name,
              currentRole: member.title,
              industryExperience: currentExperience.company_industry,
              // Churn prediction and refresh scheduling (stored in customFields for easy querying)
              customFields: {
                ...existingCustomFields,
                churnPrediction: {
                  averageTimeInRoleMonths: churnPrediction.averageTimeInRoleMonths,
                  predictedDepartureMonths: churnPrediction.predictedDepartureMonths,
                  churnRiskScore: churnPrediction.churnRiskScore,
                  churnRiskLevel: churnPrediction.churnRiskLevel,
                  predictedDepartureDate: churnPrediction.predictedDepartureDate,
                  reasoning: churnPrediction.reasoning,
                  completedRolesCount: churnPrediction.completedRolesCount,
                  // Refresh scheduling
                  refreshPriority: churnPrediction.refreshPriority,
                  refreshColor: churnPrediction.refreshColor,
                  refreshFrequency: churnPrediction.refreshFrequency,
                  refreshFrequencyDays: churnPrediction.refreshFrequencyDays,
                  nextRefreshDate: churnPrediction.nextRefreshDate,
                  lastRefreshDate: churnPrediction.lastRefreshDate
                }
              },
              // Direct fields for easy querying and filtering
              dataLastVerified: new Date(), // Set to now when data is fresh
              // Store refresh info in aiIntelligence for quick access (merge with existing)
              aiIntelligence: {
                ...(existingPerson?.aiIntelligence && typeof existingPerson.aiIntelligence === 'object' ? existingPerson.aiIntelligence : {}),
                ...aiIntelligence,
                refreshStatus: {
                  priority: churnPrediction.refreshPriority,
                  color: churnPrediction.refreshColor,
                  frequency: churnPrediction.refreshFrequency,
                  nextRefreshDate: churnPrediction.nextRefreshDate,
                  lastRefreshDate: churnPrediction.lastRefreshDate
                }
              },
              aiLastUpdated: new Date(),
              // LinkedIn data - update from fullProfile if available
              linkedinUrl: linkedinUrl || existingPerson.linkedinUrl,
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
              // 🏆 FIX: Set mainSellerId when creating new person
              mainSellerId: this.mainSellerId,
              firstName: firstName,
              lastName: lastName,
              fullName: member.name,
              jobTitle: member.title,
              title: member.title,
              department: member.department,
              email: email,
              emailVerified: member.emailVerified || false,
              emailConfidence: member.emailConfidence || 0,
              phone: coresignalPhone || member.phone,
              linkedinUrl: linkedinUrl, // Use LinkedIn URL from fullProfile (prioritized over preview data)
              // Store verification details in enrichedData
              enrichedData: {
                ...aiIntelligence,
                emailVerificationDetails: member.emailVerificationDetails || [],
                emailSource: member.emailSource || 'unverified',
                phoneVerificationDetails: member.phoneVerificationDetails || [],
                phoneSource: member.phoneSource || 'unverified',
                phoneType: member.phoneType || 'unknown',
                phoneMetadata: member.phoneMetadata || {}
              },
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
              phoneVerified: member.phoneVerified || member.phone1Verified || false,
              phoneConfidence: member.phoneConfidence || (member.phoneDataQuality ? member.phoneDataQuality / 100 : 0),
              phoneQualityScore: member.phoneConfidence || (member.phoneDataQuality ? member.phoneDataQuality / 100 : 0),
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
              yearsInRole: Math.floor(monthsInCurrentRole / 12),
              currentCompany: currentExperience.company_name,
              currentRole: member.title,
              industryExperience: currentExperience.company_industry,
              // Churn prediction and refresh scheduling (stored in customFields for easy querying)
              customFields: {
                churnPrediction: {
                  averageTimeInRoleMonths: churnPrediction.averageTimeInRoleMonths,
                  predictedDepartureMonths: churnPrediction.predictedDepartureMonths,
                  churnRiskScore: churnPrediction.churnRiskScore,
                  churnRiskLevel: churnPrediction.churnRiskLevel,
                  predictedDepartureDate: churnPrediction.predictedDepartureDate,
                  reasoning: churnPrediction.reasoning,
                  completedRolesCount: churnPrediction.completedRolesCount,
                  // Refresh scheduling
                  refreshPriority: churnPrediction.refreshPriority,
                  refreshColor: churnPrediction.refreshColor,
                  refreshFrequency: churnPrediction.refreshFrequency,
                  refreshFrequencyDays: churnPrediction.refreshFrequencyDays,
                  nextRefreshDate: churnPrediction.nextRefreshDate,
                  lastRefreshDate: churnPrediction.lastRefreshDate
                }
              },
              // Direct fields for easy querying
              dataLastVerified: new Date(), // Set to now when data is fresh
              // Store refresh info in aiIntelligence for quick access
              aiIntelligence: {
                ...aiIntelligence,
                refreshStatus: {
                  priority: churnPrediction.refreshPriority,
                  color: churnPrediction.refreshColor,
                  frequency: churnPrediction.refreshFrequency,
                  nextRefreshDate: churnPrediction.nextRefreshDate,
                  lastRefreshDate: churnPrediction.lastRefreshDate
                }
              },
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
          companyId: company.id, // Link to company record
          companyName: intelligence.companyName || extractDomain(this.targetCompany),
            website: intelligence.website,
          industry: intelligence.industry,
          companySize: intelligence.employeeCount?.toString(),
            cohesionScore: report.cohesionAnalysis?.overallScore || 0,
            overallConfidence: report.qualityMetrics?.averageConfidence || 0,
          totalMembers: validatedMembers.length,
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
      const memberRecords = validatedMembers.map(member => {
        // Extract email from Coresignal data (prioritize real emails from fullProfile)
        const coresignalEmail = this.extractEmailFromCoresignal(member.fullProfile);
        const email = coresignalEmail || (member.email && !member.email.includes('@coresignal.temp') ? member.email : null);
        
        // Extract phone from Coresignal data
        const coresignalPhone = this.extractPhoneFromCoresignal(member.fullProfile);
        const phone = coresignalPhone || member.phone || member.mobilePhone || member.workPhone || null;
        
        return {
          id: createUniqueId('bgm'),
          buyerGroupId: buyerGroupRecord.id,
          name: member.name,
          title: member.title,
          department: member.department,
          role: member.buyerGroupRole,
          email: email, // Only real emails, no fake @coresignal.temp
          phone: phone, // Include phone data
          linkedin: member.linkedinUrl,
          confidence: member.roleConfidence || 0,
          influenceScore: member.scores?.influence || 0,
          coresignalId: member.id ? member.id.toString() : null,
          customFields: {
            // Store enriched data in customFields for reference
            coresignalData: member.fullProfile || null,
            enrichedData: {
              emailVerificationDetails: member.emailVerificationDetails || [],
              emailSource: member.emailSource || 'unverified',
              phoneVerificationDetails: member.phoneVerificationDetails || [],
              phoneSource: member.phoneSource || 'unverified',
              phoneType: member.phoneType || 'unknown',
              phoneMetadata: member.phoneMetadata || {}
            },
            emailVerified: member.emailVerified || false,
            emailConfidence: member.emailConfidence || 0,
            phoneVerified: member.phoneVerified || false,
            phoneConfidence: member.phoneConfidence || 0
          },
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
      console.log(`   - People records: ${validatedMembers.length} created/updated (${rejectedMembers.length} rejected)`);
      console.log(`   - Buyer group: ${buyerGroupRecord.id}`);
      
      // Log quality metrics
      if (rejectedMembers.length > 0) {
        console.log(`\n⚠️ Quality Check: ${rejectedMembers.length} employees rejected for company mismatch`);
        rejectedMembers.forEach(({ member, reason }) => {
          console.log(`   - ${member.name}: ${reason}`);
        });
      } else {
        console.log(`\n✅ Quality Check: All ${validatedMembers.length} employees validated as correct company`);
      }
      
    } catch (error) {
      console.error('❌ Failed to save buyer group to database:', error.message);
      throw error;
    }
  }

  /**
   * Validate that employee is from the correct company
   * CRITICAL: Ensures data quality by verifying company match
   * @param {object} member - Buyer group member
   * @param {object} intelligence - Company intelligence
   * @param {object} company - Database company record
   * @returns {object} Validation result with isValid and reason
   */
  validateEmployeeCompany(member, intelligence, company) {
    // Check if employee was found via LinkedIn URL search
    // When searching by LinkedIn URL, Coresignal filters by experience.company_linkedin_url with active_experience=1
    // This means employees returned SHOULD be at the target company
    const wasFoundViaLinkedInSearch = member.id && intelligence.linkedinUrl;
    
    // Get profile data for validation
    const coresignalData = member.fullProfile || {};
    const experience = coresignalData.experience || [];
    const currentExperience = experience.find(exp => exp.active_experience === 1) || experience[0] || {};
    
    // PRIORITY 1: If found via LinkedIn URL search, trust the search result
    // Coresignal's LinkedIn URL search filters by company, so these employees belong to the target company
    if (wasFoundViaLinkedInSearch) {
      // Still validate profile data if available, but trust search result
      if (currentExperience && currentExperience.company_name) {
        // Validate profile matches target company
        const employeeCompanyName = (currentExperience.company_name || '').toLowerCase();
        const targetCompanyName = (intelligence.companyName || company.name || '').toLowerCase();
        
        // Normalize for comparison
        const normalize = (name) => {
          return name.toLowerCase()
            .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
        };
        
        const normalizedEmployee = normalize(employeeCompanyName);
        const normalizedTarget = normalize(targetCompanyName);
        
        // If profile matches, great - return early
        if (normalizedEmployee === normalizedTarget || 
            normalizedEmployee.includes(normalizedTarget) || 
            normalizedTarget.includes(normalizedEmployee)) {
          return { isValid: true, reason: 'LinkedIn search + profile company match' };
        }
        
        // If profile shows different company but we searched by LinkedIn URL, trust the search
        // Profile data might be outdated (e.g., person left but profile not updated)
        return {
          isValid: true,
          reason: `LinkedIn URL search result (profile shows "${currentExperience.company_name}" but search filtered by target company)`
        };
      }
      
      // No profile data but found via LinkedIn search - trust the search
      return {
        isValid: true,
        reason: 'Employee found via LinkedIn company search (Coresignal filtered by company LinkedIn URL)'
      };
    }
    
    // PRIORITY 2: If NOT found via LinkedIn search, validate strictly using profile data
    if (!member.fullProfile || !currentExperience || !currentExperience.company_name) {
      return {
        isValid: false,
        reason: 'No current company experience found in Coresignal data and not found via LinkedIn company search'
      };
    }
    
    const employeeCompanyName = (currentExperience.company_name || '').toLowerCase();
    const targetCompanyName = (intelligence.companyName || company.name || '').toLowerCase();
    
    // Normalize company names for comparison
    const normalize = (name) => {
      return name
        .toLowerCase()
        .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    
    const normalizedEmployee = normalize(employeeCompanyName);
    const normalizedTarget = normalize(targetCompanyName);
    
    // Check 1: Exact match
    if (normalizedEmployee === normalizedTarget) {
      return { isValid: true, reason: 'Exact company name match' };
    }
    
    // Check 2: Contains match (e.g., "GitLab Inc" contains "GitLab")
    if (normalizedEmployee.includes(normalizedTarget) || normalizedTarget.includes(normalizedEmployee)) {
      return { isValid: true, reason: 'Company name contains match' };
    }
    
    // Check 3: LinkedIn URL match (strongest signal)
    const employeeLinkedIn = (currentExperience.company_linkedin_url || '').toLowerCase();
    const targetLinkedIn = (intelligence.linkedinUrl || company.linkedinUrl || '').toLowerCase();
    
    if (employeeLinkedIn && targetLinkedIn) {
      // Normalize LinkedIn URLs (remove -com, -inc suffixes)
      const normalizeLinkedIn = (url) => {
        const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
        if (match) {
          return match[1].replace(/-(com|inc|llc|ltd|corp)$/i, '').toLowerCase();
        }
        return url.toLowerCase();
      };
      
      const normalizedEmployeeLinkedIn = normalizeLinkedIn(employeeLinkedIn);
      const normalizedTargetLinkedIn = normalizeLinkedIn(targetLinkedIn);
      
      if (normalizedEmployeeLinkedIn === normalizedTargetLinkedIn) {
        return { isValid: true, reason: 'LinkedIn URL match' };
      }
    }
    
    // Check 4: Website domain match
    const employeeWebsite = (currentExperience.company_website || '').toLowerCase();
    const targetWebsite = (intelligence.website || company.website || '').toLowerCase();
    
    if (employeeWebsite && targetWebsite) {
      const extractDomain = (url) => {
        if (!url) return '';
        return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
      };
      
      const employeeDomain = extractDomain(employeeWebsite);
      const targetDomain = extractDomain(targetWebsite);
      
      if (employeeDomain === targetDomain) {
        return { isValid: true, reason: 'Website domain match' };
      }
      
      // Check parent domain match
      if (employeeDomain.split('.').length > 2 && targetDomain.split('.').length > 2) {
        const employeeRoot = employeeDomain.split('.').slice(-2).join('.');
        const targetRoot = targetDomain.split('.').slice(-2).join('.');
        if (employeeRoot === targetRoot) {
          return { isValid: true, reason: 'Parent domain match' };
        }
      }
    }
    
    // Check 5: Email domain validation (CRITICAL for preventing mismatches)
    // This prevents cases like underline.com vs underline.cz being grouped together
    const memberEmail = member.email || member.workEmail;
    if (memberEmail && memberEmail.includes('@')) {
      const emailDomain = memberEmail.split('@')[1]?.toLowerCase();
      const companyWebsite = intelligence.website || company.website;
      
      if (emailDomain && companyWebsite) {
        const extractDomainHelper = (url) => {
          if (!url) return '';
          return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        };
        
        const companyDomain = extractDomainHelper(companyWebsite);
        
        // Root domains must match exactly (including TLD)
        // underline.com !== underline.cz
        if (!this.domainsMatchStrict(emailDomain, companyDomain)) {
          return {
            isValid: false,
            reason: `Email domain mismatch: ${emailDomain} does not match company domain ${companyDomain}`
          };
        }
      }
    }
    
    // Check 6: Fuzzy name similarity (last resort)
    const similarity = this.calculateNameSimilarity(employeeCompanyName, targetCompanyName);
    if (similarity > 0.85) {
      return { isValid: true, reason: `High name similarity (${(similarity * 100).toFixed(1)}%)` };
    }
    
    // Reject if no match found
    return {
      isValid: false,
      reason: `Company mismatch: Employee at "${employeeCompanyName}" but target is "${targetCompanyName}" (similarity: ${(similarity * 100).toFixed(1)}%)`
    };
  }

  /**
   * Calculate name similarity (Levenshtein-based)
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {number} Similarity score (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalize = (name) => {
      return name
        .toLowerCase()
        .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    
    const norm1 = normalize(name1);
    const norm2 = normalize(name2);
    
    if (norm1 === norm2) return 1.0;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    // Simple Levenshtein distance
    const longer = norm1.length > norm2.length ? norm1 : norm2;
    const shorter = norm1.length > norm2.length ? norm2 : norm1;
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return 1 - (distance / longer.length);
  }

  /**
   * Calculate Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Strict domain matching for email validation
   * Ensures exact root domain match (including TLD)
   * @param {string} emailDomain - Email domain (e.g., 'underline.cz')
   * @param {string} companyDomain - Company domain (e.g., 'underline.com')
   * @returns {boolean} True if domains match exactly
   */
  domainsMatchStrict(emailDomain, companyDomain) {
    if (!emailDomain || !companyDomain) return false;
    
    const parts1 = emailDomain.split('.');
    const parts2 = companyDomain.split('.');
    
    // Need at least 2 parts for a valid domain (name.tld)
    if (parts1.length < 2 || parts2.length < 2) return false;
    
    // Get root domain (last 2 parts: domain.tld)
    const root1 = parts1.slice(-2).join('.');
    const root2 = parts2.slice(-2).join('.');
    
    // Must match exactly (including TLD)
    // This ensures underline.com !== underline.cz
    // But allows mail.underline.com === underline.com
    return root1 === root2;
  }

  /**
   * Find or create company record
   * @param {object} intelligence - Company intelligence data
   * @param {string} mainSellerId - Optional mainSellerId to set on company
   * @returns {object} Company record
   */
  async findOrCreateCompany(intelligence, mainSellerId = null) {
    console.log('🏢 Finding or creating company record...');
    
    try {
      // Use mainSellerId from intelligence if provided, otherwise use parameter
      const companyMainSellerId = intelligence.mainSellerId || mainSellerId || this.mainSellerId;
      
      // First try to find by website domain
      let company = null;
      if (intelligence.website) {
        const domain = extractDomain(intelligence.website);
        try {
          company = await this.prisma.companies.findFirst({
            where: {
              workspaceId: this.workspaceId,
              OR: [
                { website: { contains: domain } },
                { domain: domain }
              ]
            }
          });
        } catch (error) {
          // If error is about coreCompanyId, use raw SQL to bypass Prisma validation
          if (error.message && error.message.includes('coreCompanyId')) {
            console.log('⚠️  Prisma validation issue, using raw SQL workaround...');
            try {
              // Use Prisma's $queryRaw with template literals (handles parameters correctly)
              const results = await this.prisma.$queryRaw`
                SELECT * FROM companies 
                WHERE "workspaceId" = ${this.workspaceId}
                AND ("website" LIKE ${'%' + domain + '%'} OR "domain" = ${domain})
                AND "deletedAt" IS NULL
                LIMIT 1
              `;
              if (results && results.length > 0) {
                company = results[0];
                console.log(`✅ Found company via raw SQL: ${company.name}`);
              }
            } catch (rawError) {
              console.log(`⚠️  Raw SQL also failed: ${rawError.message}`);
              // Continue - will create company if not found
            }
          } else {
            throw error;
          }
        }
      }
      
      // If not found by website, try by LinkedIn URL
      if (!company && intelligence.linkedinUrl) {
        const linkedinId = intelligence.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
        if (linkedinId) {
          try {
            company = await this.prisma.companies.findFirst({
              where: {
                workspaceId: this.workspaceId,
                linkedinUrl: { contains: linkedinId }
              }
            });
            if (company) {
              console.log(`✅ Found company by LinkedIn URL: ${company.name}`);
            }
          } catch (error) {
            // If error is about coreCompanyId, use raw SQL to bypass Prisma validation
            if (error.message && error.message.includes('coreCompanyId')) {
              console.log('⚠️  Prisma validation issue, using raw SQL workaround...');
              try {
                const results = await this.prisma.$queryRaw`
                  SELECT * FROM companies 
                  WHERE "workspaceId" = ${this.workspaceId}
                  AND "linkedinUrl" LIKE ${'%' + linkedinId + '%'}
                  AND "deletedAt" IS NULL
                  LIMIT 1
                `;
                if (results && results.length > 0) {
                  company = results[0];
                  console.log(`✅ Found company via raw SQL (LinkedIn): ${company.name}`);
                }
              } catch (rawError) {
                console.log(`⚠️  Raw SQL also failed: ${rawError.message}`);
                // Continue - will create company if not found
              }
            } else {
              // Non-critical error, continue
              console.log(`⚠️  LinkedIn URL search failed: ${error.message}`);
            }
          }
        }
      }

      // If not found by website or LinkedIn, try by name
      if (!company && intelligence.companyName) {
        try {
          company = await this.prisma.companies.findFirst({
            where: {
              workspaceId: this.workspaceId,
              name: { contains: intelligence.companyName, mode: 'insensitive' }
            }
          });
        } catch (error) {
          // If error is about coreCompanyId, use raw SQL to bypass Prisma validation
          if (error.message && error.message.includes('coreCompanyId')) {
            console.log('⚠️  Prisma validation issue, using raw SQL workaround...');
            try {
              // Use Prisma's $queryRaw with template literals (handles parameters correctly)
              const results = await this.prisma.$queryRaw`
                SELECT * FROM companies 
                WHERE "workspaceId" = ${this.workspaceId}
                AND LOWER("name") LIKE ${'%' + intelligence.companyName.toLowerCase() + '%'}
                AND "deletedAt" IS NULL
                LIMIT 1
              `;
              if (results && results.length > 0) {
                company = results[0];
                console.log(`✅ Found company via raw SQL: ${company.name}`);
              }
            } catch (rawError) {
              console.log(`⚠️  Raw SQL also failed: ${rawError.message}`);
              // Continue - will create company if not found
            }
          } else {
            throw error;
          }
        }
      }
      
      // If still not found, create new company
      if (!company) {
        console.log(`📝 Creating new company record for ${intelligence.companyName}`);
        
        // Try Prisma create first (preferred method)
        try {
          company = await this.prisma.companies.create({
            data: {
              workspaceId: this.workspaceId,
              name: intelligence.companyName || 'Unknown Company',
              website: intelligence.website,
              linkedinUrl: intelligence.linkedinUrl,
              industry: intelligence.industry,
              employeeCount: intelligence.employeeCount,
              revenue: intelligence.revenue,
              description: intelligence.description,
              domain: intelligence.website ? extractDomain(intelligence.website) : null,
              mainSellerId: companyMainSellerId,
              status: 'ACTIVE',
              priority: 'MEDIUM',
              updatedAt: new Date()
            }
          });
          console.log(`✅ Created company: ${company.name} (${company.id})`);
          if (companyMainSellerId) {
            console.log(`   👤 Set mainSellerId: ${companyMainSellerId}`);
          }
        } catch (createError) {
          // If Prisma create fails, check if it's a validation error or actual DB error
          const isValidationError = createError.message && (
            createError.message.includes('coreCompanyId') || 
            createError.message.includes('additionalStatuses') ||
            createError.message.includes('does not exist')
          );
          
          if (isValidationError) {
            console.log('⚠️  Prisma validation error detected, using direct database connection...');
            
            // Use Prisma's direct connection to bypass client validation
            const companyId = createUniqueId('co');
            const domain = intelligence.website ? extractDomain(intelligence.website) : null;
            const revenue = intelligence.revenue ? parseFloat(intelligence.revenue) : null;
            
            try {
              // Use Prisma's $executeRaw with proper enum casting
              // Insert without status/priority first (they have defaults), then update if needed
              await this.prisma.$executeRaw(Prisma.sql`
                INSERT INTO companies (
                  id, "workspaceId", name, website, "linkedinUrl", industry, "employeeCount", revenue, description, domain, "mainSellerId", "createdAt", "updatedAt"
                ) VALUES (
                  ${companyId}, 
                  ${this.workspaceId}, 
                  ${intelligence.companyName || 'Unknown Company'}, 
                  ${intelligence.website || null}, 
                  ${intelligence.linkedinUrl || null}, 
                  ${intelligence.industry || null}, 
                  ${intelligence.employeeCount || null}, 
                  ${revenue}, 
                  ${intelligence.description || null}, 
                  ${domain}, 
                  ${companyMainSellerId || null}, 
                  NOW(), 
                  NOW()
                )
              `);
              
              // Fetch using Prisma query (should work)
              const results = await this.prisma.$queryRaw(Prisma.sql`
                SELECT * FROM companies WHERE id = ${companyId}
              `);
              
              if (results && results.length > 0) {
                company = results[0];
                console.log(`✅ Created company via Prisma.sql: ${company.name} (${company.id})`);
                if (companyMainSellerId) {
                  console.log(`   👤 Set mainSellerId: ${companyMainSellerId}`);
                }
              } else {
                throw new Error('Failed to fetch created company');
              }
            } catch (rawError) {
              console.error('❌ Raw SQL create failed:', rawError.message);
              // Last resort: try without mainSellerId
              if (rawError.message.includes('mainSellerId')) {
                console.log('⚠️  Trying without mainSellerId field...');
                try {
                  // Insert without status/priority (they have defaults: ACTIVE and MEDIUM)
                  await this.prisma.$executeRaw(Prisma.sql`
                    INSERT INTO companies (
                      id, "workspaceId", name, website, "linkedinUrl", industry, "employeeCount", revenue, description, domain, "createdAt", "updatedAt"
                    ) VALUES (
                      ${companyId}, ${this.workspaceId}, ${intelligence.companyName || 'Unknown Company'}, 
                      ${intelligence.website || null}, ${intelligence.linkedinUrl || null}, ${intelligence.industry || null}, 
                      ${intelligence.employeeCount || null}, ${revenue}, 
                      ${intelligence.description || null}, ${domain}, 
                      NOW(), NOW()
                    )
                  `);
                  
                  const results = await this.prisma.$queryRaw(Prisma.sql`
                    SELECT * FROM companies WHERE id = ${companyId}
                  `);
                  
                  if (results && results.length > 0) {
                    company = results[0];
                    console.log(`✅ Created company (without mainSellerId): ${company.name}`);
                    // Update mainSellerId separately if needed
                    if (companyMainSellerId) {
                      try {
                        await this.prisma.companies.update({
                          where: { id: company.id },
                          data: { mainSellerId: companyMainSellerId }
                        });
                        console.log(`   👤 Updated mainSellerId: ${companyMainSellerId}`);
                      } catch (updateError) {
                        console.log(`   ⚠️  Could not set mainSellerId: ${updateError.message}`);
                      }
                    }
                  }
                } catch (fallbackError) {
                  console.error('❌ Fallback create also failed:', fallbackError.message);
                  throw fallbackError;
                }
              } else {
                throw rawError;
              }
            }
          } else {
            console.error('❌ Failed to create company:', createError.message);
            throw createError;
          }
        }
      } else {
        console.log(`✅ Found existing company: ${company.name} (${company.id})`);
        
        // Update company with latest intelligence data and mainSellerId if needed
        const updateData = {};
        if (intelligence.website && !company.website) {
          updateData.website = intelligence.website;
          updateData.domain = extractDomain(intelligence.website);
        }
        // Set LinkedIn URL if company doesn't have one and we have one
        if (intelligence.linkedinUrl && !company.linkedinUrl) {
          updateData.linkedinUrl = intelligence.linkedinUrl;
          console.log(`   🔗 Setting LinkedIn URL: ${intelligence.linkedinUrl}`);
        }
        // Set mainSellerId if company doesn't have one and we have one to set
        if (companyMainSellerId && !company.mainSellerId) {
          updateData.mainSellerId = companyMainSellerId;
          console.log(`   👤 Setting mainSellerId: ${companyMainSellerId}`);
        }
        
        if (Object.keys(updateData).length > 0) {
          await this.prisma.companies.update({
            where: { id: company.id },
            data: updateData
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
