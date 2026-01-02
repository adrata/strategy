/**
 * AI Reasoning Module
 * 
 * Uses Claude 4.5 Sonnet for intelligent profile analysis and role validation
 * Provides nuanced reasoning that rule-based logic cannot achieve
 */

class AIReasoning {
  constructor(apiKey) {
    // Clean API key - remove newlines and trim whitespace
    const cleanedApiKey = (apiKey || process.env.ANTHROPIC_API_KEY || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    this.apiKey = cleanedApiKey;
    // Use Claude Opus 4.5 for highest quality reasoning
    this.model = 'claude-opus-4-5-20251101'; // Claude Opus 4.5 (most capable model)
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
    const isEducation = productContext.productCategory === 'custom' && 
                        (productContext.productName?.toLowerCase().includes('retention') ||
                         productContext.productName?.toLowerCase().includes('student') ||
                         productContext.productName?.toLowerCase().includes('education'));
    
    const educationContext = isEducation ? `

HIGHER EDUCATION CONTEXT:
- Higher education institutions have unique organizational structures:
  * Provost/Vice Provost: Chief academic officer, often approves major academic initiatives
  * VP Student Affairs/Academic Affairs: Senior executives with budget authority for student services
  * Deans: College/school leaders, operational decision makers
  * Directors: Department heads, implementation leaders
- Retention solutions typically involve:
  * Student Affairs (student services, engagement, support)
  * Academic Affairs (academic advising, academic support)
  * Enrollment Management (retention strategy, student success)
  * Institutional Research (data analysis, metrics)
- Decision-making in education often involves shared governance and committee approval
- Budget authority varies: Provost/VP level ($500K+), Dean level ($100K-$500K), Director level (<$100K)

WHY EACH ROLE CARES ABOUT RETENTION:
- Provost/VP: Retention directly affects enrollment, revenue, institutional reputation, and accreditation metrics. Poor retention = financial and reputational damage.
- Chief Retention Officer (CRO): Dedicated role measured on retention metrics. Their job success depends on improving retention rates.
- Directors of Retention/Student Success: Use retention systems daily, see impact directly, advocate for solutions that help them succeed.
- Directors of Academic Advising: Retention is their core mission - they guide students to success and see dropouts as failures.
- Financial Aid Directors: Financial barriers are the #1 reason for dropout. They see students leave due to financial stress daily.
- Counseling Services Directors: Mental health issues significantly affect retention. They work with struggling students who may drop out.
- Registrar: Administrative inefficiencies cause student frustration and contribute to dropout. They see the impact of poor systems.
- Enrollment Management Directors: Manage BOTH recruitment AND retention strategies. Retention is half their responsibility.
- Institutional Research Directors: Data-driven decision making informs all retention strategies. They analyze what works and what doesn't.` : '';

    return `You are an expert B2B sales strategist analyzing whether a person is relevant for selling ${productContext.productName || 'sales software'}.${educationContext}

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
${isEducation ? '- In education: Does their role relate to student retention, student success, academic advising, or enrollment management?\n- Education hierarchy: Provost > VP > Dean > Director for decision-making authority\n- Why they care: Consider their specific motivations (financial impact, job performance, daily use, student outcomes)' : '- Are there any red flags (e.g., Customer Success VP who explicitly doesn\'t manage sales)?'}
- What is their seniority and decision-making authority?
- How likely are they to be involved in this type of purchase?
${isEducation ? '- Education purchasing: Often requires Provost/VP approval for $500K+ deals, Dean approval for $100K-$500K\n- Retention committees: Many institutions have cross-departmental retention committees - members may have titles that don\'t explicitly say "retention"\n- Cross-departmental collaboration: Retention requires coordination across Academic Affairs, Student Affairs, Enrollment Management, Financial Aid, and Counseling' : ''}

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

    const isEducation = productContext.productCategory === 'custom' && 
                        (productContext.productName?.toLowerCase().includes('retention') ||
                         productContext.productName?.toLowerCase().includes('student') ||
                         productContext.productName?.toLowerCase().includes('education'));
    
    const educationContext = isEducation ? `

HIGHER EDUCATION CONTEXT:
- Education hierarchy for retention solutions:
  * Provost/Vice Provost: Decision makers for $500K+ deals, approve major academic initiatives
  * VP Student Affairs/Academic Affairs: Decision makers for $200K-$1M deals, budget authority
  * Deans: Champions/Decision makers for $100K-$500K deals, operational leaders
  * Directors: Champions/Stakeholders, implementation leaders, use the system daily
  * Managers/Specialists: Stakeholders, end users
- Retention solutions typically need:
  * Decision: Provost, VP Student Affairs, VP Academic Affairs (budget approval)
  * Champion: Dean of Student Success, Director of Retention, Director of Student Success
  * Stakeholder: Directors of Academic Advising, First-Year Experience, Academic Support
  * Blocker: CFO, Procurement, Legal (for data privacy), IT Security

RETENTION-SPECIFIC ROLE PATTERNS:
- Chief Retention Officer (CRO): Decision maker - dedicated role with budget authority, measured on retention metrics
- Directors of Retention/Student Success: Champions - use systems daily, see impact directly, advocate internally
- Directors of Academic Advising: Champions - core mission is retention, guide students to success
- Directors of Enrollment Management: Decision makers/Champions - manage BOTH recruitment AND retention strategies
- Directors of Financial Aid: Stakeholders - financial barriers are #1 dropout reason, critical support role
- Directors of Counseling Services: Stakeholders - mental health affects retention, critical support role
- Registrar: Stakeholders - administrative efficiency impacts retention, sees frustration from poor systems
- Institutional Research Directors: Champions/Stakeholders - data-driven decision making, inform retention strategies

RETENTION COMMITTEES:
- Many institutions have cross-departmental retention committees
- Committee members may have titles that don't explicitly say "retention"
- Cross-departmental collaboration is essential for retention success
- Committee members often include: Provost/VP, Deans, Directors from Student Affairs, Academic Affairs, Enrollment Management, Financial Aid, Counseling, Institutional Research` : '';

    return `You are an expert B2B sales strategist assigning a role to a buyer group member.${educationContext}

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
${isEducation ? '- Education hierarchy: Provost > VP > Dean > Director\n- Budget authority: Provost/VP ($500K+), Dean ($100K-$500K), Director (<$100K)\n- Retention-specific roles: CRO = Decision maker, Directors of Retention/Student Success = Champions, Financial Aid/Counseling = Stakeholders' : ''}
- Their department's relevance to the product
- The deal size and their likely involvement
- Whether they would use, approve, or influence this purchase
- The current composition of the buyer group
${isEducation ? '- Education purchasing: Often requires multiple approvals (Provost + VP + Dean)\n- Retention solutions need both academic and student affairs representation\n- Retention committees: Members may have diverse titles but all care about retention\n- Cross-departmental collaboration: Retention requires coordination across multiple departments' : ''}

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

    // Ensure API key is clean
    const cleanedApiKey = this.apiKey.trim().replace(/\n/g, '').replace(/\r/g, '');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': cleanedApiKey,
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

  /**
   * Generate pain points using AI with directional intelligence
   * @param {object} member - Buyer group member
   * @param {object} productContext - Product context
   * @param {object} companyContext - Company context
   * @param {object} researchData - Research data including full profile
   * @returns {Promise<Array>} Array of pain points
   */
  async generatePainPoints(member, productContext, companyContext, researchData) {
    const prompt = this.buildPainPointsPrompt(member, productContext, companyContext, researchData);
    
    try {
      const response = await this.callClaude(prompt);
      return this.parsePainPointsResponse(response);
    } catch (error) {
      console.error('❌ AI pain points generation failed:', error.message);
      return this.getFallbackPainPoints(member, productContext);
    }
  }

  /**
   * Build prompt for pain points generation
   * @param {object} member - Buyer group member
   * @param {object} productContext - Product context
   * @param {object} companyContext - Company context
   * @param {object} researchData - Research data
   * @returns {string} Claude prompt
   */
  buildPainPointsPrompt(member, productContext, companyContext, researchData) {
    const isEducation = productContext.productCategory === 'custom' && 
                        (productContext.productName?.toLowerCase().includes('retention') ||
                         productContext.productName?.toLowerCase().includes('student') ||
                         productContext.productName?.toLowerCase().includes('education'));

    const experienceSummary = researchData?.experience?.slice(0, 5).map(exp => 
      `- ${exp.title || 'Unknown'} at ${exp.company_name || 'Unknown'} (${exp.start_date || 'Unknown'} - ${exp.end_date || 'Present'})`
    ).join('\n') || 'No experience data available';

    const skillsSummary = researchData?.skills?.slice(0, 10).join(', ') || 'No skills data available';

    return `You are an expert B2B sales strategist analyzing pain points for a potential buyer.

MEMBER PROFILE:
- Name: ${member.name || 'Unknown'}
- Title: ${member.title || 'Unknown'}
- Department: ${member.department || 'Unknown'}
- Company: ${companyContext?.companyName || 'Unknown'}
- LinkedIn: ${member.linkedinUrl || 'N/A'}
- Connections: ${researchData?.connections || member.connectionsCount || 0}
- Followers: ${researchData?.followers || member.followersCount || 0}

CAREER HISTORY (Recent):
${experienceSummary}

SKILLS:
${skillsSummary}

PRODUCT CONTEXT:
- Product: ${productContext?.productName || 'Business Solution'}
- Category: ${productContext?.productCategory || 'general'}
- Deal Size: $${productContext?.dealSize || 150000}
- Focus Area: ${productContext?.focusArea || 'General business improvement'}

COMPANY CONTEXT:
- Company: ${companyContext?.companyName || 'Unknown'}
- Industry: ${companyContext?.industry || 'Unknown'}
- Size: ${companyContext?.employeeCount || 'Unknown'} employees
- Revenue: ${companyContext?.revenue || 'Unknown'}

${isEducation ? `
HIGHER EDUCATION CONTEXT:
- Retention solutions address student dropout, academic performance, and student success
- Key pain points include: low retention rates, poor student engagement, lack of early warning systems, financial barriers, mental health support gaps, administrative inefficiencies
- Roles care about retention because it affects enrollment, revenue, accreditation, and institutional reputation
` : ''}

ANALYSIS REQUIRED:
Generate 3-5 specific, actionable pain points this person likely experiences related to ${productContext?.productName || 'this solution'}.

Each pain point should include:
- Title: Specific pain point (4-8 words)
- Description: Detailed explanation (2-3 sentences)
- Root Cause: Underlying factor (1 sentence)
- Frequency: How often it manifests (daily/weekly/monthly/quarterly)
- Impact: Specific consequences (2 sentences)
- Urgency: High/medium/low with urgency drivers
- Related Metrics: KPIs they're likely struggling with

Consider:
- Their role and responsibilities
- Their department's challenges
- Industry-specific pain points
- Company size and stage
- Their career trajectory and tenure
- Common challenges for their role type

Respond in JSON format:
{
  "painPoints": [
    {
      "title": "Pain point title",
      "description": "Detailed description",
      "rootCause": "Root cause explanation",
      "frequency": "daily|weekly|monthly|quarterly",
      "impact": "Impact description",
      "urgency": "high|medium|low",
      "urgencyDrivers": "What makes this urgent",
      "relatedMetrics": ["metric1", "metric2"]
    }
  ]
}`;
  }

  /**
   * Parse pain points response from Claude
   * @param {string} response - Claude response
   * @returns {Array} Array of pain points
   */
  parsePainPointsResponse(response) {
    try {
      // Handle markdown-wrapped JSON responses
      let jsonString = response;
      if (response.includes('```json')) {
        const match = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonString = match[1];
        }
      } else if (response.includes('```')) {
        // Handle code blocks without json tag
        const match = response.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonString = match[1];
        }
      }
      
      const parsed = JSON.parse(jsonString);
      const painPoints = parsed.painPoints || [];
      
      // Validate and ensure all required fields
      return painPoints.map(pp => ({
        title: pp.title || 'Unspecified pain point',
        description: pp.description || '',
        rootCause: pp.rootCause || '',
        frequency: pp.frequency || 'monthly',
        impact: pp.impact || '',
        urgency: pp.urgency || 'medium',
        urgencyDrivers: pp.urgencyDrivers || '',
        relatedMetrics: Array.isArray(pp.relatedMetrics) ? pp.relatedMetrics : []
      }));
    } catch (error) {
      console.error('❌ Failed to parse AI pain points response:', error.message);
      return this.getFallbackPainPoints(null, null);
    }
  }

  /**
   * Get fallback pain points
   * @param {object} member - Buyer group member (optional)
   * @param {object} productContext - Product context (optional)
   * @returns {Array} Array of basic pain points
   */
  getFallbackPainPoints(member, productContext) {
    const title = member?.title?.toLowerCase() || '';
    const dept = member?.department?.toLowerCase() || '';
    const productName = productContext?.productName || 'this solution';
    
    const painPoints = [];
    
    if (title.includes('director') || title.includes('manager')) {
      painPoints.push({
        title: `Lack of visibility into ${productName} performance`,
        description: `As a ${member?.title || 'leader'}, they struggle to track key metrics and make data-driven decisions.`,
        rootCause: 'Insufficient data and reporting capabilities',
        frequency: 'weekly',
        impact: 'Affects decision-making and team performance',
        urgency: 'medium',
        urgencyDrivers: 'Need for better performance tracking',
        relatedMetrics: ['Performance metrics', 'KPIs']
      });
    }
    
    if (dept.includes('student') || dept.includes('academic')) {
      painPoints.push({
        title: `Challenges with ${productName} implementation`,
        description: `Their department faces operational challenges that impact efficiency and outcomes.`,
        rootCause: 'Operational inefficiencies and resource constraints',
        frequency: 'daily',
        impact: 'Affects daily operations and team productivity',
        urgency: 'high',
        urgencyDrivers: 'Operational pressure and resource needs',
        relatedMetrics: ['Efficiency metrics', 'Outcome metrics']
      });
    }
    
    // Default pain point if none added
    if (painPoints.length === 0) {
      painPoints.push({
        title: `Need for improved ${productName} capabilities`,
        description: `They face challenges that could be addressed by ${productName}.`,
        rootCause: 'Current limitations and constraints',
        frequency: 'monthly',
        impact: 'Affects their ability to achieve goals',
        urgency: 'medium',
        urgencyDrivers: 'Business needs and objectives',
        relatedMetrics: ['Key performance indicators']
      });
    }
    
    return painPoints;
  }
}

module.exports = { AIReasoning };
