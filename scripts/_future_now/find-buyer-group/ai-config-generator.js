/**
 * AI Configuration Generator
 * 
 * ENHANCED VERSION - Uses Claude AI to analyze comprehensive interview responses
 * and generate the BEST possible buyer group discovery configuration.
 * 
 * Key Improvements:
 * 1. Handles anti-persona data (who NOT to target)
 * 2. Uses champion and economic buyer personas
 * 3. Considers entry point strategy
 * 4. Applies blocker engagement preferences
 * 5. Uses success patterns from historical data
 */

const { AIReasoning } = require('./ai-reasoning');

class AIConfigGenerator extends AIReasoning {
  constructor(apiKey) {
    super(apiKey || process.env.ANTHROPIC_API_KEY);
  }

  /**
   * Generate buyer group discovery configuration from interview responses
   * @param {object} interviewResponses - Interview response object
   * @returns {Promise<object>} Generated configuration
   */
  async generateConfig(interviewResponses) {
    console.log('🤖 Analyzing responses with AI to build optimal buyer group config...');
    
    const prompt = this.buildConfigPrompt(interviewResponses);
    
    try {
      const response = await this.callClaude(prompt);
      const config = this.parseConfigResponse(response);
      
      // Apply explicit exclusions from interview (CRITICAL - these override AI suggestions)
      config.departmentFiltering.excludedDepartments = this.mergeExclusions(
        config.departmentFiltering.excludedDepartments || [],
        interviewResponses.excludeDepartments
      );
      config.titleFiltering.excludedTitles = this.mergeExclusions(
        config.titleFiltering.excludedTitles || [],
        interviewResponses.excludeTitles
      );
      
      console.log('✅ Configuration generated successfully');
      console.log(`   📋 Primary depts: ${config.departmentFiltering.primaryDepartments.join(', ')}`);
      console.log(`   🚫 Excluded depts: ${config.departmentFiltering.excludedDepartments.join(', ')}`);
      console.log(`   🚫 Excluded titles: ${(config.titleFiltering.excludedTitles || []).join(', ')}`);
      
      return config;
    } catch (error) {
      console.error('❌ AI config generation failed:', error.message);
      console.log('⚠️  Using enhanced fallback configuration...');
      return this.getFallbackConfig(interviewResponses);
    }
  }

  /**
   * Merge user-specified exclusions with AI-generated ones
   * @param {Array} aiExclusions - AI-generated exclusions
   * @param {string} userExclusions - User-specified exclusions (comma-separated string)
   * @returns {Array} Merged exclusions
   */
  mergeExclusions(aiExclusions, userExclusions) {
    const merged = [...aiExclusions];
    if (userExclusions) {
      const userList = userExclusions.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      userList.forEach(item => {
        if (!merged.includes(item)) {
          merged.push(item);
        }
      });
    }
    return merged;
  }

  /**
   * Build prompt for Claude to generate configuration
   * @param {object} responses - Interview responses
   * @returns {string} Claude prompt
   */
  buildConfigPrompt(responses) {
    return `You are an expert B2B sales intelligence consultant specializing in buyer group discovery. 
Analyze these comprehensive interview responses and generate the OPTIMAL buyer group configuration.

CRITICAL: The goal is to find the RIGHT people who can actually BUY, not just anyone at the company.

═══════════════════════════════════════════════════════════════════════
INTERVIEW RESPONSES:
═══════════════════════════════════════════════════════════════════════
${JSON.stringify(responses, null, 2)}

═══════════════════════════════════════════════════════════════════════
CONFIGURATION REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════

1. PRODUCT CONFIGURATION:
   - productCategory: Choose the BEST fit from: 'sales', 'sales-intelligence', 'revenue-operations', 'marketing', 'hr', 'finance', 'security', 'engineering', 'operations', or 'custom'
   - productName: Descriptive name from their description
   - dealSizeRange: Parse deal size to number (e.g., "$50K" = 50000, "$25K-$100K" = 62500)
   - primaryProblem: The core problem they solve (from interview)

2. DEPARTMENT FILTERING (CRITICAL):
   - primaryDepartments: Departments that are MUST-HAVES based on their champion/buyer personas
   - secondaryDepartments: Nice-to-have departments
   - excludedDepartments: 
     * Start with what they explicitly said to exclude
     * Add logical exclusions based on product category
     * For sales tools: ALWAYS exclude 'product', 'engineering', 'customer success', 'account management' unless specifically mentioned as relevant

3. TITLE FILTERING (CRITICAL):
   - primaryTitles: Extract from their "best closing title" and "economic buyer" responses
   - secondaryTitles: Extract from their "champion persona" response
   - excludedTitles:
     * Start with what they explicitly said to exclude
     * For sales tools: ALWAYS exclude 'account manager', 'product manager', 'engineer', 'developer' unless relevant
   - seniorityRequirements: Based on deal size and C-level threshold response

4. BUYER GROUP SIZING (based on their buying committee size response):
   - Small (1-3): { min: 2, max: 4, ideal: 3 }
   - Medium (3-5): { min: 3, max: 6, ideal: 4 }
   - Large (5-8): { min: 4, max: 8, ideal: 6 }
   - Enterprise (8+): { min: 6, max: 12, ideal: 8 }

5. ROLE PRIORITIES (based on entry point strategy):
   - If "Economic buyer first": decision: 10, champion: 7
   - If "Champion first": champion: 10, decision: 8
   - If "End user first": stakeholder: 9, champion: 8, decision: 7
   - If "Multiple entry points": decision: 9, champion: 9, stakeholder: 7
   
   Blocker priority based on their response:
   - "Yes, always": blocker: 8
   - "Only for enterprise": blocker: 5
   - "Only if required": blocker: 3
   - "No, avoid": blocker: 1

6. SPECIAL REQUIREMENTS:
   - alwaysInclude: From their "must-have titles" response
   - bestClosingTitle: The title that closes most deals (use this for prioritization)
   - targetCompanySize: From their response
   - targetIndustries: From their response

7. LOCATION FILTERING:
   - usaOnly: true if "USA only", false otherwise

═══════════════════════════════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown). Structure:
{
  "productCategory": "...",
  "productName": "...",
  "dealSizeRange": number,
  "primaryProblem": "...",
  "departmentFiltering": {
    "primaryDepartments": ["..."],
    "secondaryDepartments": ["..."],
    "excludedDepartments": ["..."]
  },
  "titleFiltering": {
    "primaryTitles": ["..."],
    "secondaryTitles": ["..."],
    "excludedTitles": ["..."],
    "seniorityRequirements": "vp|director|manager"
  },
  "buyerGroupSizing": {
    "min": number,
    "max": number,
    "ideal": number
  },
  "rolePriorities": {
    "decision": number,
    "champion": number,
    "stakeholder": number,
    "blocker": number,
    "introducer": number
  },
  "specialRequirements": {
    "alwaysInclude": ["..."],
    "bestClosingTitle": "...",
    "targetCompanySize": "...",
    "targetIndustries": ["..."]
  },
  "usaOnly": boolean
}`;
  }

  /**
   * Parse Claude's JSON response
   * @param {string} response - Claude API response
   * @returns {object} Parsed configuration
   */
  parseConfigResponse(response) {
    try {
      // Try to extract JSON from markdown code blocks
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.includes('```json')) {
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonString = match[1].trim();
        }
      } else if (jsonString.includes('```')) {
        const match = jsonString.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonString = match[1].trim();
        }
      }
      
      // Find JSON object boundaries
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
      
      const config = JSON.parse(jsonString);
      
      // Validate required fields
      this.validateConfig(config);
      
      return config;
    } catch (error) {
      console.error('Failed to parse AI config response:', error.message);
      throw new Error(`Failed to parse AI configuration: ${error.message}`);
    }
  }

  /**
   * Validate configuration has required fields
   * @param {object} config - Configuration object
   */
  validateConfig(config) {
    const required = [
      'productCategory',
      'productName',
      'dealSizeRange',
      'departmentFiltering',
      'titleFiltering',
      'buyerGroupSizing',
      'rolePriorities'
    ];
    
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }
    
    // Validate nested objects
    if (!config.departmentFiltering.primaryDepartments) {
      config.departmentFiltering.primaryDepartments = [];
    }
    if (!config.buyerGroupSizing.min) {
      config.buyerGroupSizing.min = 4;
    }
    if (!config.buyerGroupSizing.ideal) {
      config.buyerGroupSizing.ideal = 6;
    }
    if (!config.buyerGroupSizing.max) {
      config.buyerGroupSizing.max = 12;
    }
  }

  /**
   * Get fallback configuration if AI fails
   * ENHANCED to properly use all interview responses including anti-personas
   * @param {object} responses - Interview responses
   * @returns {object} Fallback configuration
   */
  getFallbackConfig(responses) {
    // Parse deal size
    let dealSize = 150000;
    if (responses.dealSize) {
      const sizeMatch = responses.dealSize.match(/\$?\s*(\d+(?:\.\d+)?)\s*[KMkm]?/);
      if (sizeMatch) {
        let num = parseFloat(sizeMatch[1]);
        if (responses.dealSize.toLowerCase().includes('k')) {
          num *= 1000;
        } else if (responses.dealSize.toLowerCase().includes('m')) {
          num *= 1000000;
        }
        dealSize = Math.round(num);
      }
    }

    // Determine buyer group size from buying committee size response
    let buyerGroupSizing = { min: 4, max: 8, ideal: 5 };
    if (responses.buyingCommitteeSize) {
      if (responses.buyingCommitteeSize.includes('Small')) {
        buyerGroupSizing = { min: 2, max: 4, ideal: 3 };
      } else if (responses.buyingCommitteeSize.includes('Medium')) {
        buyerGroupSizing = { min: 3, max: 6, ideal: 4 };
      } else if (responses.buyingCommitteeSize.includes('Large')) {
        buyerGroupSizing = { min: 4, max: 8, ideal: 6 };
      } else if (responses.buyingCommitteeSize.includes('Enterprise')) {
        buyerGroupSizing = { min: 6, max: 12, ideal: 8 };
      }
    } else if (responses.salesCycle) {
      // Fallback to sales cycle if no committee size
      if (responses.salesCycle.includes('Fast')) {
        buyerGroupSizing = { min: 2, max: 5, ideal: 3 };
      } else if (responses.salesCycle.includes('Enterprise')) {
        buyerGroupSizing = { min: 6, max: 15, ideal: 10 };
      }
    }

    // Extract primary departments from keyDepartments (array from multi-select)
    let primaryDepartments = ['sales', 'revenue operations'];
    if (responses.keyDepartments) {
      if (Array.isArray(responses.keyDepartments)) {
        primaryDepartments = responses.keyDepartments.map(d => d.toLowerCase());
      } else {
        primaryDepartments = responses.keyDepartments.split(',').map(d => d.trim().toLowerCase());
      }
    }

    // Extract excluded departments from user input (CRITICAL)
    let excludedDepartments = [];
    if (responses.excludeDepartments) {
      excludedDepartments = responses.excludeDepartments.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
    }
    
    // Extract excluded titles from user input (CRITICAL)
    let excludedTitles = [];
    if (responses.excludeTitles) {
      excludedTitles = responses.excludeTitles.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    // Extract primary titles from champion and economic buyer personas
    let primaryTitles = [];
    if (responses.economicBuyer) {
      // Parse titles from economic buyer description
      const economicTitles = this.extractTitlesFromDescription(responses.economicBuyer);
      primaryTitles.push(...economicTitles);
    }
    if (responses.bestClosingTitle) {
      primaryTitles.push(responses.bestClosingTitle.toLowerCase());
    }
    if (primaryTitles.length === 0) {
      primaryTitles = ['vp', 'director', 'head of'];
    }

    // Extract secondary titles from champion persona
    let secondaryTitles = [];
    if (responses.championPersona) {
      const championTitles = this.extractTitlesFromDescription(responses.championPersona);
      secondaryTitles.push(...championTitles);
    }
    if (secondaryTitles.length === 0) {
      secondaryTitles = ['manager', 'senior manager', 'lead'];
    }

    // Determine role priorities based on entry point strategy
    let rolePriorities = { decision: 10, champion: 8, stakeholder: 6, blocker: 5, introducer: 4 };
    if (responses.entryPointStrategy) {
      if (responses.entryPointStrategy.includes('Economic buyer')) {
        rolePriorities = { decision: 10, champion: 7, stakeholder: 5, blocker: 4, introducer: 3 };
      } else if (responses.entryPointStrategy.includes('Champion')) {
        rolePriorities = { decision: 8, champion: 10, stakeholder: 6, blocker: 4, introducer: 5 };
      } else if (responses.entryPointStrategy.includes('End user')) {
        rolePriorities = { decision: 7, champion: 8, stakeholder: 10, blocker: 3, introducer: 6 };
      } else if (responses.entryPointStrategy.includes('Multiple')) {
        rolePriorities = { decision: 9, champion: 9, stakeholder: 7, blocker: 5, introducer: 6 };
      }
    }

    // Adjust blocker priority based on blocker engagement response
    if (responses.blockerEngagement) {
      if (responses.blockerEngagement.includes('Yes, always')) {
        rolePriorities.blocker = 8;
      } else if (responses.blockerEngagement.includes('enterprise')) {
        rolePriorities.blocker = 5;
      } else if (responses.blockerEngagement.includes('required')) {
        rolePriorities.blocker = 3;
      } else if (responses.blockerEngagement.includes('No')) {
        rolePriorities.blocker = 1;
      }
    }

    // Determine product category from product categories selection
    let productCategory = 'custom';
    if (responses.productCategories && responses.productCategories.length > 0) {
      const firstCategory = responses.productCategories[0].toLowerCase();
      if (firstCategory.includes('sales intelligence')) {
        productCategory = 'sales-intelligence';
      } else if (firstCategory.includes('crm') || firstCategory.includes('pipeline')) {
        productCategory = 'sales';
      } else if (firstCategory.includes('revenue operations')) {
        productCategory = 'revenue-operations';
      } else if (firstCategory.includes('marketing')) {
        productCategory = 'marketing';
      } else if (firstCategory.includes('hr')) {
        productCategory = 'hr';
      } else if (firstCategory.includes('finance')) {
        productCategory = 'finance';
      } else if (firstCategory.includes('security')) {
        productCategory = 'security';
      } else if (firstCategory.includes('engineering')) {
        productCategory = 'engineering';
      }
    }

    // Determine USA-only setting
    const usaOnly = responses.usaOnly === 'USA only' || 
                    responses.usaOnly === 'Yes - Only include USA-based employees' ||
                    (responses.usaOnly && responses.usaOnly.includes('USA only'));

    return {
      productCategory,
      productName: responses.productDescription || 'Product/Service',
      dealSizeRange: dealSize,
      primaryProblem: responses.primaryProblem || '',
      departmentFiltering: {
        primaryDepartments,
        secondaryDepartments: ['strategy', 'operations'],
        excludedDepartments
      },
      titleFiltering: {
        primaryTitles: [...new Set(primaryTitles)],
        secondaryTitles: [...new Set(secondaryTitles)],
        excludedTitles,
        seniorityRequirements: dealSize > 250000 ? 'vp' : dealSize > 100000 ? 'director' : 'manager'
      },
      buyerGroupSizing,
      rolePriorities,
      specialRequirements: {
        alwaysInclude: responses.criticalRoles ? responses.criticalRoles.split(',').map(r => r.trim()) : [],
        bestClosingTitle: responses.bestClosingTitle || '',
        targetCompanySize: responses.targetCompanySize || 'All sizes',
        targetIndustries: responses.targetIndustries || []
      },
      usaOnly
    };
  }

  /**
   * Extract title keywords from a free-text description
   * @param {string} description - Description containing titles
   * @returns {Array} Extracted title keywords
   */
  extractTitlesFromDescription(description) {
    const titles = [];
    const lowerDesc = description.toLowerCase();
    
    // Common title patterns to look for
    const patterns = [
      'ceo', 'cfo', 'cto', 'coo', 'cro', 'cmo', 'ciso',
      'chief revenue', 'chief technology', 'chief operating', 'chief financial',
      'vp sales', 'vp of sales', 'vp revenue', 'vp marketing', 'vp operations',
      'vice president', 'svp', 'evp',
      'director', 'senior director', 'head of',
      'manager', 'senior manager',
      'revops', 'revenue operations', 'sales operations', 'sales ops'
    ];
    
    patterns.forEach(pattern => {
      if (lowerDesc.includes(pattern)) {
        titles.push(pattern);
      }
    });
    
    return titles;
  }
}

module.exports = { AIConfigGenerator };


