/**
 * AI Configuration Generator
 * 
 * Uses Claude AI to analyze interview responses and generate
 * optimized buyer group discovery configuration
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
    console.log('🤖 Analyzing responses with AI...');
    
    const prompt = this.buildConfigPrompt(interviewResponses);
    
    try {
      const response = await this.callClaude(prompt);
      const config = this.parseConfigResponse(response);
      
      console.log('✅ Configuration generated successfully');
      return config;
    } catch (error) {
      console.error('❌ AI config generation failed:', error.message);
      console.log('⚠️  Using fallback configuration...');
      return this.getFallbackConfig(interviewResponses);
    }
  }

  /**
   * Build prompt for Claude to generate configuration
   * @param {object} responses - Interview responses
   * @returns {string} Claude prompt
   */
  buildConfigPrompt(responses) {
    return `You are an expert B2B sales intelligence consultant. Analyze these interview responses and generate an optimized buyer group discovery configuration.

INTERVIEW RESPONSES:
${JSON.stringify(responses, null, 2)}

Generate a detailed JSON configuration that includes:

1. PRODUCT CONFIGURATION:
   - productCategory: Choose from 'sales', 'engineering-services', 'consulting', 'technology', 'operations', 'finance', 'marketing', 'infrastructure', or 'custom'
   - productName: A descriptive name for their product/service
   - dealSizeRange: Parse the deal size into a number (handle ranges like "$150K-$500K" as 300000)

2. DEPARTMENT FILTERING:
   - primaryDepartments: Array of departments that are MUST-HAVES (e.g., ['engineering', 'it', 'operations'])
   - secondaryDepartments: Array of departments that are NICE-TO-HAVES (e.g., ['strategy', 'product'])
   - excludedDepartments: Array of departments to exclude (e.g., ['customer success', 'hr'])

3. TITLE FILTERING:
   - primaryTitles: Array of titles that are MUST-HAVES (e.g., ['cto', 'vp engineering', 'chief technology officer'])
   - secondaryTitles: Array of titles that are NICE-TO-HAVES (e.g., ['director', 'manager', 'head of'])
   - seniorityRequirements: Based on deal size, determine required seniority level ('c-level', 'vp', 'director', 'manager')

4. BUYER GROUP SIZING:
   Based on sales cycle complexity:
   - Short cycle (<3 months): ideal 4-6 members, min 3, max 8
   - Medium cycle (3-6 months): ideal 6-10 members, min 5, max 12
   - Long cycle (>6 months): ideal 8-15 members, min 6, max 20
   
   Return: { min, max, ideal }

5. ROLE PRIORITIES:
   Rank importance of each role type (1-10 scale, where 10 is critical):
   - decision: Priority for decision makers
   - champion: Priority for internal champions
   - stakeholder: Priority for stakeholders
   - blocker: Priority for blockers (procurement, legal)
   - introducer: Priority for introducers

6. SPECIAL REQUIREMENTS:
   - alwaysInclude: Array of titles/departments that must ALWAYS be in buyer group
   - dealSizeThresholds: Custom thresholds for different deal sizes (if applicable)
   - industrySpecific: Any industry-specific adjustments or notes

Be specific and optimize for finding the right buyer group. Consider the industries mentioned and decision maker types.

Return ONLY valid JSON, no markdown formatting. Structure should be:
{
  "productCategory": "...",
  "productName": "...",
  "dealSizeRange": number,
  "departmentFiltering": {
    "primaryDepartments": [...],
    "secondaryDepartments": [...],
    "excludedDepartments": [...]
  },
  "titleFiltering": {
    "primaryTitles": [...],
    "secondaryTitles": [...],
    "seniorityRequirements": "..."
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
    "alwaysInclude": [...],
    "dealSizeThresholds": {},
    "industrySpecific": "..."
  }
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

    // Determine buyer group size from sales cycle
    let buyerGroupSizing = { min: 4, max: 12, ideal: 6 };
    if (responses.salesCycle) {
      if (responses.salesCycle.includes('Short')) {
        buyerGroupSizing = { min: 3, max: 8, ideal: 5 };
      } else if (responses.salesCycle.includes('Long')) {
        buyerGroupSizing = { min: 6, max: 20, ideal: 10 };
      }
    }

    // Extract departments from responses
    const departments = responses.keyDepartments
      ? responses.keyDepartments.split(',').map(d => d.trim().toLowerCase())
      : ['operations', 'it', 'technology'];

    return {
      productCategory: 'custom',
      productName: responses.productDescription || 'Product/Service',
      dealSizeRange: dealSize,
      departmentFiltering: {
        primaryDepartments: departments,
        secondaryDepartments: ['strategy', 'product', 'finance'],
        excludedDepartments: []
      },
      titleFiltering: {
        primaryTitles: ['director', 'vp', 'vice president', 'chief'],
        secondaryTitles: ['manager', 'head of', 'lead'],
        seniorityRequirements: dealSize > 500000 ? 'c-level' : dealSize > 150000 ? 'vp' : 'director'
      },
      buyerGroupSizing: buyerGroupSizing,
      rolePriorities: {
        decision: 10,
        champion: 8,
        stakeholder: 6,
        blocker: 5,
        introducer: 4
      },
      specialRequirements: {
        alwaysInclude: responses.criticalRoles ? [responses.criticalRoles] : [],
        dealSizeThresholds: {},
        industrySpecific: responses.targetIndustries?.join(', ') || ''
      }
    };
  }
}

module.exports = { AIConfigGenerator };


