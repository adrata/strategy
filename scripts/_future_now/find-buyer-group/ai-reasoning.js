/**
 * AI Reasoning Module
 * 
 * Uses Claude 4.5 Sonnet for intelligent profile analysis and role validation
 * Provides nuanced reasoning that rule-based logic cannot achieve
 */

class AIReasoning {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    // Use claude-3-5-sonnet-20241022 (latest) or fallback to claude-3-5-sonnet-20240620
    this.model = 'claude-3-5-sonnet-20240620'; // Claude 3.5 Sonnet (stable version)
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    
    if (!this.apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not found - AI features will be disabled');
    }
  }

  /**
   * AI-powered profile relevance analysis
   * Determines if person is relevant for specific product with detailed reasoning
   * @param {object} employee - Employee profile data
   * @param {object} productContext - Product and company context
   * @returns {object} Relevance analysis with score and reasoning
   */
  async analyzeProfileRelevance(employee, productContext) {
    const prompt = this.buildRelevancePrompt(employee, productContext);
    
    try {
      const response = await this.callClaude(prompt);
      return this.parseRelevanceResponse(response);
    } catch (error) {
      console.error('❌ AI relevance analysis failed:', error.message);
      return this.getFallbackRelevance(employee, productContext);
    }
  }

  /**
   * AI-powered buyer group composition validation
   * Reviews complete buyer group and suggests improvements
   * @param {Array} buyerGroup - Current buyer group
   * @param {object} companyContext - Company context
   * @param {object} productContext - Product context
   * @returns {object} Validation results with improvements
   */
  async validateBuyerGroup(buyerGroup, companyContext, productContext) {
    const prompt = this.buildValidationPrompt(buyerGroup, companyContext, productContext);
    
    try {
      const response = await this.callClaude(prompt);
      return this.parseValidationResponse(response);
    } catch (error) {
      console.error('❌ AI buyer group validation failed:', error.message);
      return this.getFallbackValidation(buyerGroup);
    }
  }

  /**
   * AI-powered role assignment reasoning
   * Determines optimal role based on full context
   * @param {object} employee - Employee data
   * @param {object} buyerGroupContext - Current buyer group context
   * @param {object} productContext - Product context
   * @returns {object} Role assignment with confidence and reasoning
   */
  async determineOptimalRole(employee, buyerGroupContext, productContext) {
    const prompt = this.buildRoleAssignmentPrompt(employee, buyerGroupContext, productContext);
    
    try {
      const response = await this.callClaude(prompt);
      return this.parseRoleAssignmentResponse(response);
    } catch (error) {
      console.error('❌ AI role assignment failed:', error.message);
      return this.getFallbackRoleAssignment(employee);
    }
  }

  /**
   * Build prompt for relevance analysis
   * @param {object} employee - Employee data
   * @param {object} productContext - Product context
   * @returns {string} Claude prompt
   */
  buildRelevancePrompt(employee, productContext) {
    return `You are an expert B2B sales strategist analyzing whether a person is relevant for selling ${productContext.productName || 'sales software'}.

EMPLOYEE PROFILE:
- Name: ${employee.name || 'Unknown'}
- Title: ${employee.title || 'Unknown'}
- Department: ${employee.department || 'Unknown'}
- Company: ${employee.company || 'Unknown'}
- LinkedIn: ${employee.linkedinUrl || 'N/A'}
- Connections: ${employee.connectionsCount || 0}
- Followers: ${employee.followersCount || 0}

PRODUCT CONTEXT:
- Product: ${productContext.productName || 'Sales Intelligence Software'}
- Category: ${productContext.productCategory || 'sales'}
- Deal Size: $${productContext.dealSize || 150000}
- Company Size: ${productContext.companySize || 'Unknown'} employees

ANALYSIS REQUIRED:
1. Is this person relevant for purchasing/implementing ${productContext.productName || 'sales software'}?
2. What is their likely role in the buying process?
3. What is their influence level (1-10)?
4. What specific reasoning supports your assessment?

Consider:
- Does their title/department suggest they would use, approve, or influence this product?
- Are there any red flags (e.g., Customer Success VP who explicitly doesn't manage sales)?
- What is their seniority and decision-making authority?
- How likely are they to be involved in this type of purchase?

Respond in JSON format:
{
  "relevance": 0.0-1.0,
  "role": "decision|champion|stakeholder|blocker|introducer|exclude",
  "influence": 1-10,
  "reasoning": "Detailed explanation of your assessment",
  "confidence": 0.0-1.0
}`;
  }

  /**
   * Build prompt for buyer group validation
   * @param {Array} buyerGroup - Current buyer group
   * @param {object} companyContext - Company context
   * @param {object} productContext - Product context
   * @returns {string} Claude prompt
   */
  buildValidationPrompt(buyerGroup, companyContext, productContext) {
    const groupSummary = buyerGroup.map(member => 
      `- ${member.name} (${member.title}, ${member.department}) - Role: ${member.buyerGroupRole || 'unassigned'}`
    ).join('\n');

    // Handle missing productContext gracefully
    const productName = productContext?.productName || 'Sales Intelligence Software';
    const dealSize = productContext?.dealSize || 150000;

    return `You are an expert B2B sales strategist reviewing a buyer group for selling ${productName}.

CURRENT BUYER GROUP (${buyerGroup.length} members):
${groupSummary}

COMPANY CONTEXT:
- Company: ${companyContext?.companyName || 'Unknown'}
- Size: ${companyContext?.companySize || 'Unknown'} employees
- Industry: ${companyContext?.industry || 'Unknown'}

PRODUCT CONTEXT:
- Product: ${productName}
- Deal Size: $${dealSize}

VALIDATION REQUIRED:
1. Is this buyer group well-composed for this deal?
2. Are there missing critical roles?
3. Are there inappropriate inclusions?
4. What improvements would you suggest?

Consider:
- Do we have the right decision makers for this deal size?
- Are there champions who can advocate internally?
- Do we have technical stakeholders for implementation?
- Are there any blockers we need to engage?
- Is the group size appropriate for the company size?

Respond in JSON format:
{
  "isValid": true/false,
  "score": 0-100,
  "missingRoles": ["role1", "role2"],
  "inappropriateInclusions": ["name1", "name2"],
  "improvements": ["suggestion1", "suggestion2"],
  "reasoning": "Detailed explanation of your assessment"
}`;
  }

  /**
   * Build prompt for role assignment
   * @param {object} employee - Employee data
   * @param {object} buyerGroupContext - Current buyer group context
   * @param {object} productContext - Product context
   * @returns {string} Claude prompt
   */
  buildRoleAssignmentPrompt(employee, buyerGroupContext, productContext) {
    // Handle case where buyerGroupContext might be an object instead of array
    const existingRoles = Array.isArray(buyerGroupContext) 
      ? buyerGroupContext.map(member => `${member.name} (${member.buyerGroupRole})`).join(', ')
      : 'None yet';

    return `You are an expert B2B sales strategist assigning a role to a buyer group member.

EMPLOYEE TO ASSIGN:
- Name: ${employee.name || 'Unknown'}
- Title: ${employee.title || 'Unknown'}
- Department: ${employee.department || 'Unknown'}
- Company: ${employee.company || 'Unknown'}

EXISTING BUYER GROUP ROLES:
${existingRoles || 'None yet'}

PRODUCT CONTEXT:
- Product: ${productContext.productName || 'Sales Intelligence Software'}
- Deal Size: $${productContext.dealSize || 150000}

ROLE OPTIONS:
- decision: Can approve the purchase (budget authority)
- champion: Can advocate internally (operational leader)
- stakeholder: Will be affected by implementation
- blocker: Can kill the deal (procurement, legal, security)
- introducer: Can facilitate connections
- exclude: Not relevant for this product

ASSIGNMENT REQUIRED:
1. What is the optimal role for this person?
2. What is your confidence level?
3. What specific reasoning supports this assignment?

Consider:
- Their seniority and authority level
- Their department's relevance to the product
- The deal size and their likely involvement
- Whether they would use, approve, or influence this purchase
- The current composition of the buyer group

Respond in JSON format:
{
  "role": "decision|champion|stakeholder|blocker|introducer|exclude",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of your assignment",
  "alternativeRoles": ["role1", "role2"]
}`;
  }

  /**
   * Call Claude API
   * @param {string} prompt - Prompt to send
   * @returns {string} Claude response
   */
  async callClaude(prompt) {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error ? JSON.stringify(errorData.error) : '';
      } catch (e) {
        errorDetails = await response.text();
      }
      throw new Error(`Claude API error: ${response.status} ${response.statusText}${errorDetails ? ' - ' + errorDetails : ''}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Parse relevance analysis response
   * @param {string} response - Claude response
   * @returns {object} Parsed relevance data
   */
  parseRelevanceResponse(response) {
    try {
      // Handle markdown-wrapped JSON responses
      let jsonString = response;
      if (response.includes('```json')) {
        const match = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonString = match[1];
        }
      }
      
      const parsed = JSON.parse(jsonString);
      return {
        relevance: Math.max(0, Math.min(1, parsed.relevance || 0)),
        role: parsed.role || 'stakeholder',
        influence: Math.max(1, Math.min(10, parsed.influence || 5)),
        reasoning: parsed.reasoning || 'AI analysis completed',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7))
      };
    } catch (error) {
      console.error('❌ Failed to parse AI relevance response:', error.message);
      return this.getFallbackRelevance();
    }
  }

  /**
   * Parse validation response
   * @param {string} response - Claude response
   * @returns {object} Parsed validation data
   */
  parseValidationResponse(response) {
    try {
      // Handle markdown-wrapped JSON responses
      let jsonString = response;
      if (response.includes('```json')) {
        const match = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonString = match[1];
        }
      }
      
      const parsed = JSON.parse(jsonString);
      return {
        isValid: parsed.isValid || false,
        overallScore: Math.max(0, Math.min(10, parsed.overallScore || parsed.score || 5)),
        missingRoles: parsed.missingRoles || [],
        inappropriateInclusions: parsed.inappropriateInclusions || [],
        improvements: parsed.improvements || [],
        reasoning: parsed.reasoning || 'AI validation completed'
      };
    } catch (error) {
      console.error('❌ Failed to parse AI validation response:', error.message);
      return this.getFallbackValidation();
    }
  }

  /**
   * Parse role assignment response
   * @param {string} response - Claude response
   * @returns {object} Parsed role assignment data
   */
  parseRoleAssignmentResponse(response) {
    try {
      // Handle markdown-wrapped JSON responses
      let jsonString = response;
      if (response.includes('```json')) {
        const match = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonString = match[1];
        }
      }
      
      const parsed = JSON.parse(jsonString);
      return {
        suggestedRole: parsed.suggestedRole || parsed.role || 'stakeholder',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
        reasoning: parsed.reasoning || 'AI role assignment completed',
        alternativeRoles: parsed.alternativeRoles || []
      };
    } catch (error) {
      console.error('❌ Failed to parse AI role assignment response:', error.message);
      return this.getFallbackRoleAssignment();
    }
  }

  /**
   * Get fallback relevance analysis
   * @param {object} employee - Employee data
   * @param {object} productContext - Product context
   * @returns {object} Fallback relevance data
   */
  getFallbackRelevance(employee, productContext) {
    const dept = employee.department?.toLowerCase() || '';
    const title = employee.title?.toLowerCase() || '';
    
    let relevance = 0.3;
    let role = 'stakeholder';
    
    if (dept.includes('sales') || dept.includes('revenue')) {
      relevance = 0.8;
      role = 'decision';
    } else if (dept.includes('marketing') || dept.includes('operations')) {
      relevance = 0.6;
      role = 'champion';
    }
    
    return {
      relevance,
      role,
      influence: 5,
      reasoning: 'Fallback analysis due to AI error',
      confidence: 0.5
    };
  }

  /**
   * Get fallback validation
   * @param {Array} buyerGroup - Buyer group
   * @returns {object} Fallback validation data
   */
  getFallbackValidation(buyerGroup) {
    return {
      isValid: buyerGroup.length > 0,
      score: 60,
      missingRoles: [],
      inappropriateInclusions: [],
      improvements: ['AI validation unavailable - manual review recommended'],
      reasoning: 'Fallback validation due to AI error'
    };
  }

  /**
   * Get fallback role assignment
   * @param {object} employee - Employee data
   * @returns {object} Fallback role assignment data
   */
  getFallbackRoleAssignment(employee) {
    const title = employee.title?.toLowerCase() || '';
    
    let role = 'stakeholder';
    if (title.includes('vp') || title.includes('chief')) {
      role = 'decision';
    } else if (title.includes('director') || title.includes('manager')) {
      role = 'champion';
    }
    
    return {
      role,
      confidence: 0.5,
      reasoning: 'Fallback assignment due to AI error',
      alternativeRoles: []
    };
  }
}

module.exports = { AIReasoning };
