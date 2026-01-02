/**
 * Pipeline Validators Module
 * 
 * Comprehensive validation and verification for buyer group discovery:
 * 1. Product-relevance validation before role assignment
 * 2. LinkedIn URL verification step
 * 3. Web search verification for executives
 * 4. Exclusion rules per product category
 */

const fetch = require('node-fetch');

// =============================================================================
// PRODUCT CATEGORY EXCLUSION RULES
// =============================================================================

/**
 * Define which departments/titles should be EXCLUDED per product category
 * This prevents irrelevant people from being included in the buyer group
 */
const PRODUCT_EXCLUSION_RULES = {
  // HR Case Management (like HR Acuity)
  'hr-case-management': {
    excludeDepartments: [
      'government affairs',
      'public policy',
      'security investigations', // Physical/cyber security, not HR
      'physical security',
      'facilities',
      'real estate',
      'supply chain',
      'manufacturing',
      'warehouse',
      'logistics',
      'transportation'
    ],
    excludeTitles: [
      'security investigator', // Physical security, not HR
      'security analyst',      // Cyber security, not HR
      'government relations',
      'public affairs',
      'lobbyist',
      'policy advisor',
      'facilities manager',
      'real estate',
      'supply chain',
      'warehouse manager',
      'logistics'
    ],
    // These departments ARE relevant for HR Case Management
    relevantDepartments: [
      'human resources',
      'people operations',
      'people',
      'hr',
      'employee relations',
      'talent',
      'legal', // Employment law
      'compliance', // HR compliance
      'ethics', // Ethics & integrity
      'workforce'
    ],
    // These titles indicate high relevance
    relevantTitles: [
      'people',
      'hr',
      'human resources',
      'employee relations',
      'workforce',
      'ethics',
      'compliance',
      'legal counsel',
      'employment'
    ]
  },

  // Sales Software (CRM, Sales Enablement) - ACQUISITION FOCUSED
  // Account Management and Product roles are EXCLUDED because:
  // - Account Managers manage EXISTING customers (expansion/retention), not new business
  // - Product roles build products, they don't buy sales tools
  'sales': {
    excludeDepartments: [
      'manufacturing',
      'warehouse',
      'logistics',
      'supply chain',
      'facilities',
      'real estate',
      'research & development',  // Pure R&D, not product
      'account management',      // Existing customer focus, not acquisition
      'customer success',        // Existing customer focus, not acquisition
      'customer service',        // Support, not acquisition
      'product',                 // Product roles don't buy sales tools
      'product management',      // Product roles don't buy sales tools
      'engineering'              // Engineering builds, doesn't buy sales tools
    ],
    excludeTitles: [
      'manufacturing',
      'warehouse',
      'logistics',
      'supply chain',
      'facilities',
      'janitorial',
      'account manager',         // Manages existing customers
      'customer success',        // Manages existing customers
      'product manager',         // Builds product, doesn't buy sales tools
      'product owner',           // Builds product, doesn't buy sales tools
      'engineer',                // Builds product, doesn't buy sales tools
      'developer'                // Builds product, doesn't buy sales tools
    ],
    relevantDepartments: [
      'sales',
      'revenue',
      'business development',
      'sales operations',
      'revenue operations',
      'sales enablement',
      'go-to-market'
    ],
    relevantTitles: [
      'sales',
      'revenue',
      'business development',
      'cro',
      'chief revenue',
      'vp sales',
      'sales director',
      'revops',
      'growth'
    ]
  },

  // Marketing Software
  'marketing': {
    excludeDepartments: [
      'manufacturing',
      'warehouse',
      'logistics',
      'supply chain',
      'facilities',
      'accounting'
    ],
    excludeTitles: [
      'manufacturing',
      'warehouse',
      'logistics',
      'accountant'
    ],
    relevantDepartments: [
      'marketing',
      'brand',
      'communications',
      'content',
      'demand generation',
      'digital',
      'growth'
    ],
    relevantTitles: [
      'marketing',
      'brand',
      'content',
      'digital',
      'growth',
      'demand gen',
      'communications'
    ]
  },

  // Finance/Accounting Software
  'finance': {
    excludeDepartments: [
      'manufacturing',
      'warehouse',
      'logistics',
      'marketing' // Usually not involved
    ],
    excludeTitles: [
      'manufacturing',
      'warehouse',
      'marketing manager'
    ],
    relevantDepartments: [
      'finance',
      'accounting',
      'treasury',
      'tax',
      'audit',
      'financial planning'
    ],
    relevantTitles: [
      'finance',
      'accounting',
      'cfo',
      'controller',
      'treasurer',
      'auditor',
      'tax'
    ]
  },

  // Security Software
  'security': {
    excludeDepartments: [
      'marketing',
      'sales', // Unless selling security
      'hr',
      'facilities' // Physical only
    ],
    excludeTitles: [
      'marketing',
      'hr manager',
      'recruiter'
    ],
    relevantDepartments: [
      'security',
      'information security',
      'cybersecurity',
      'it',
      'technology',
      'infrastructure',
      'compliance',
      'risk'
    ],
    relevantTitles: [
      'security',
      'ciso',
      'cto',
      'it director',
      'infrastructure',
      'devops',
      'risk',
      'compliance'
    ]
  },

  // Default/Generic (no exclusions)
  'default': {
    excludeDepartments: [],
    excludeTitles: [],
    relevantDepartments: [],
    relevantTitles: []
  }
};

class PipelineValidators {
  constructor(options = {}) {
    this.productCategory = options.productCategory || 'default';
    this.customExclusions = options.customExclusions || {};
    this.shouldVerifyLinkedIn = options.verifyLinkedIn !== false; // Default true
    this.shouldVerifyExecutives = options.verifyExecutives !== false; // Default true
    this.perplexityApiKey = options.perplexityApiKey || process.env.PERPLEXITY_API_KEY;
    
    // Get exclusion rules for this product category
    this.exclusionRules = PRODUCT_EXCLUSION_RULES[this.productCategory] || 
                          PRODUCT_EXCLUSION_RULES['default'];
    
    // Merge custom exclusions
    if (this.customExclusions.excludeDepartments) {
      this.exclusionRules.excludeDepartments = [
        ...this.exclusionRules.excludeDepartments,
        ...this.customExclusions.excludeDepartments
      ];
    }
    if (this.customExclusions.excludeTitles) {
      this.exclusionRules.excludeTitles = [
        ...this.exclusionRules.excludeTitles,
        ...this.customExclusions.excludeTitles
      ];
    }
  }

  // ===========================================================================
  // 1. PRODUCT-RELEVANCE VALIDATION
  // ===========================================================================

  /**
   * Check if an employee is relevant to the product being sold
   * @param {object} employee - Employee data
   * @returns {object} { isRelevant: boolean, relevanceScore: number, reason: string }
   */
  validateProductRelevance(employee) {
    const title = (employee.title || '').toLowerCase();
    const department = (employee.department || '').toLowerCase();
    const fullContext = `${title} ${department}`;
    
    // Check for explicit exclusions first - must check FULL context
    const excludedDept = this.exclusionRules.excludeDepartments.find(
      dept => fullContext.includes(dept.toLowerCase())
    );
    
    const excludedTitle = this.exclusionRules.excludeTitles.find(
      t => fullContext.includes(t.toLowerCase())
    );
    
    // Exclusions take precedence over everything except CEO/CFO/CPO
    const isCLevel = title.includes('ceo') || title.includes('cfo') || 
                     title.includes('cpo') || title.includes('coo') ||
                     title.includes('chief people') || title.includes('chief human');
    
    if ((excludedDept || excludedTitle) && !isCLevel) {
      return {
        isRelevant: false,
        relevanceScore: 0,
        reason: `Excluded: "${excludedDept || excludedTitle}" not relevant to ${this.productCategory}`,
        excludedBy: excludedDept || excludedTitle
      };
    }
    
    // Check for high relevance
    const isRelevantDept = this.exclusionRules.relevantDepartments.some(
      dept => department.includes(dept.toLowerCase())
    );
    
    const isRelevantTitle = this.exclusionRules.relevantTitles.some(
      t => title.includes(t.toLowerCase())
    );
    
    // Calculate relevance score
    let relevanceScore = 30; // Lower base score
    
    if (isRelevantDept) relevanceScore += 40;
    if (isRelevantTitle) relevanceScore += 30;
    
    // C-level executives are always relevant (CPO, CHRO especially)
    if (isCLevel) {
      relevanceScore = 100;
    }
    
    // VPs in relevant departments
    if (title.includes('vp') || title.includes('vice president')) {
      if (isRelevantDept || isRelevantTitle) {
        relevanceScore = Math.max(relevanceScore, 80);
      } else {
        relevanceScore = Math.max(relevanceScore, 50); // VP but not relevant dept
      }
    }
    
    // Directors in relevant departments
    if (title.includes('director')) {
      if (isRelevantDept || isRelevantTitle) {
        relevanceScore = Math.max(relevanceScore, 75);
      } else {
        relevanceScore = Math.max(relevanceScore, 45); // Director but not relevant dept
      }
    }
    
    return {
      isRelevant: relevanceScore >= 50,
      relevanceScore,
      reason: relevanceScore >= 80 ? 'High relevance to product' :
              relevanceScore >= 60 ? 'Moderate relevance' :
              relevanceScore >= 50 ? 'Low but acceptable relevance' :
              'Below relevance threshold'
    };
  }

  /**
   * Filter employees by product relevance
   * @param {Array} employees - Array of employees
   * @returns {Array} Filtered employees with relevance data
   */
  filterByProductRelevance(employees) {
    console.log(`\n🎯 Validating product relevance for ${this.productCategory}...`);
    
    const results = employees.map(emp => {
      const validation = this.validateProductRelevance(emp);
      return {
        ...emp,
        productRelevance: validation
      };
    });
    
    const relevant = results.filter(emp => emp.productRelevance.isRelevant);
    const excluded = results.filter(emp => !emp.productRelevance.isRelevant);
    
    console.log(`✅ ${relevant.length} relevant | ❌ ${excluded.length} excluded`);
    
    if (excluded.length > 0) {
      console.log('   Excluded:');
      excluded.slice(0, 5).forEach(emp => {
        console.log(`   - ${emp.name} (${emp.title}): ${emp.productRelevance.reason}`);
      });
      if (excluded.length > 5) {
        console.log(`   ... and ${excluded.length - 5} more`);
      }
    }
    
    return relevant;
  }

  // ===========================================================================
  // 2. LINKEDIN URL VERIFICATION
  // ===========================================================================

  /**
   * Verify a LinkedIn URL is valid and accessible
   * @param {string} linkedinUrl - LinkedIn profile URL
   * @returns {object} { isValid: boolean, status: string, suggestedUrl: string|null }
   */
  async verifyLinkedInUrl(linkedinUrl) {
    if (!linkedinUrl) {
      return { isValid: false, status: 'missing', suggestedUrl: null };
    }
    
    // Normalize URL
    let url = linkedinUrl.trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    // Extract LinkedIn slug
    const slugMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (!slugMatch) {
      return { isValid: false, status: 'invalid_format', suggestedUrl: null };
    }
    
    const slug = slugMatch[1];
    
    // Check for obviously fake/templated slugs
    const suspiciousPatterns = [
      /^[a-z]+-[a-z]+$/,           // Just "firstname-lastname" with no ID
      /^[a-z]+-[a-z]+-[a-z]+$/,    // "first-middle-last" with no ID
      /-google$/,                   // Templated "-google" suffix
      /-company$/                   // Templated "-company" suffix
    ];
    
    // If slug looks templated but has no numeric ID, flag it
    const hasNumericId = /\d/.test(slug);
    const looksTemplated = suspiciousPatterns.some(p => p.test(slug));
    
    if (looksTemplated && !hasNumericId) {
      return { 
        isValid: false, 
        status: 'likely_templated', 
        suggestedUrl: null,
        note: 'LinkedIn URL appears to be templated without actual profile ID'
      };
    }
    
    // If we have a numeric ID in the slug, it's likely valid
    if (hasNumericId) {
      return {
        isValid: true,
        status: 'verified_format',
        suggestedUrl: `https://www.linkedin.com/in/${slug}`
      };
    }
    
    // For slugs without numeric IDs, mark as needs_verification
    return {
      isValid: true,
      status: 'needs_verification',
      suggestedUrl: `https://www.linkedin.com/in/${slug}`,
      note: 'URL format valid but profile existence not confirmed'
    };
  }

  /**
   * Verify LinkedIn URLs for all employees
   * @param {Array} employees - Array of employees
   * @returns {Array} Employees with LinkedIn verification status
   */
  async verifyLinkedInUrls(employees) {
    if (!this.shouldVerifyLinkedIn) {
      return employees;
    }
    
    console.log(`\n🔗 Verifying LinkedIn URLs for ${employees.length} employees...`);
    
    const results = [];
    let verified = 0;
    let invalid = 0;
    let missing = 0;
    
    for (const emp of employees) {
      const verification = await this.verifyLinkedInUrl(emp.linkedin || emp.linkedinUrl);
      
      results.push({
        ...emp,
        linkedinVerification: verification
      });
      
      if (verification.status === 'missing') missing++;
      else if (verification.isValid) verified++;
      else invalid++;
    }
    
    console.log(`✅ ${verified} verified | ⚠️ ${invalid} invalid | ❓ ${missing} missing`);
    
    return results;
  }

  // ===========================================================================
  // 3. WEB SEARCH VERIFICATION FOR EXECUTIVES
  // ===========================================================================

  /**
   * Verify an executive via web search
   * @param {object} employee - Employee data
   * @param {string} companyName - Company name
   * @returns {object} Verification results
   */
  async verifyExecutiveViaWeb(employee, companyName) {
    if (!this.perplexityApiKey) {
      return {
        verified: false,
        status: 'no_api_key',
        confidence: 0,
        sources: []
      };
    }
    
    const name = employee.name;
    const title = employee.title;
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant. Verify if the person works at the company in the specified role. Return JSON only: {"verified": true/false, "confidence": 0-100, "currentTitle": "title if found", "sources": ["url1", "url2"], "linkedinUrl": "url if found"}'
            },
            {
              role: 'user',
              content: `Does ${name} currently work at ${companyName} as ${title}? Search recent news, LinkedIn, and company pages. Return JSON only.`
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      });
      
      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Try to parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            verified: result.verified === true,
            status: result.verified ? 'web_verified' : 'not_found',
            confidence: result.confidence || 0,
            currentTitle: result.currentTitle || title,
            sources: result.sources || [],
            suggestedLinkedIn: result.linkedinUrl || null
          };
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract info from text
        const verified = content.toLowerCase().includes('yes') || 
                        content.toLowerCase().includes('verified') ||
                        content.toLowerCase().includes('confirmed');
        return {
          verified,
          status: verified ? 'web_verified' : 'uncertain',
          confidence: verified ? 60 : 30,
          sources: [],
          rawResponse: content
        };
      }
    } catch (error) {
      console.log(`   ⚠️ Web verification failed for ${name}: ${error.message}`);
      return {
        verified: false,
        status: 'error',
        confidence: 0,
        error: error.message
      };
    }
    
    return {
      verified: false,
      status: 'unknown',
      confidence: 0
    };
  }

  /**
   * Check if employee is an executive requiring web verification
   * @param {object} employee - Employee data
   * @returns {boolean}
   */
  isExecutive(employee) {
    const title = (employee.title || '').toLowerCase();
    return title.includes('ceo') || 
           title.includes('cfo') || 
           title.includes('cto') || 
           title.includes('coo') ||
           title.includes('chief') ||
           title.includes('president') ||
           (title.includes('vp') && !title.includes('avp')) ||
           title.includes('vice president') ||
           title.includes('senior director');
  }

  /**
   * Verify executives via web search
   * @param {Array} employees - Array of employees
   * @param {string} companyName - Company name
   * @returns {Array} Employees with executive verification
   */
  async verifyExecutivesViaWebSearch(employees, companyName) {
    if (!this.shouldVerifyExecutives || !this.perplexityApiKey) {
      return employees;
    }
    
    const executives = employees.filter(emp => this.isExecutive(emp));
    
    if (executives.length === 0) {
      return employees;
    }
    
    console.log(`\n🔍 Web-verifying ${executives.length} executives at ${companyName}...`);
    
    const results = [];
    
    for (const emp of employees) {
      if (this.isExecutive(emp)) {
        console.log(`   Verifying: ${emp.name} (${emp.title})...`);
        const verification = await this.verifyExecutiveViaWeb(emp, companyName);
        
        results.push({
          ...emp,
          executiveVerification: verification
        });
        
        if (verification.verified) {
          console.log(`   ✅ Verified: ${emp.name}`);
        } else {
          console.log(`   ⚠️ Not verified: ${emp.name} (${verification.status})`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        results.push(emp);
      }
    }
    
    const verified = results.filter(e => e.executiveVerification?.verified).length;
    const unverified = executives.length - verified;
    
    console.log(`✅ ${verified} executives verified | ⚠️ ${unverified} unverified`);
    
    return results;
  }

  // ===========================================================================
  // 4. COMPREHENSIVE VALIDATION PIPELINE
  // ===========================================================================

  /**
   * Run all validations on the buyer group
   * @param {Array} employees - Array of employees
   * @param {string} companyName - Company name
   * @returns {object} Validated buyer group with stats
   */
  async validateBuyerGroup(employees, companyName) {
    console.log('\n' + '='.repeat(70));
    console.log('🛡️  BUYER GROUP VALIDATION PIPELINE');
    console.log('='.repeat(70));
    console.log(`Product Category: ${this.productCategory}`);
    console.log(`Company: ${companyName}`);
    console.log(`Initial Count: ${employees.length}`);
    
    // Step 1: Product relevance filtering
    let validated = this.filterByProductRelevance(employees);
    
    // Step 2: LinkedIn URL verification
    validated = await this.verifyLinkedInUrls(validated);
    
    // Step 3: Executive web verification
    validated = await this.verifyExecutivesViaWebSearch(validated, companyName);
    
    // Calculate stats
    const stats = {
      initial: employees.length,
      afterRelevance: validated.length,
      linkedInVerified: validated.filter(e => e.linkedinVerification?.isValid).length,
      linkedInInvalid: validated.filter(e => e.linkedinVerification && !e.linkedinVerification.isValid).length,
      executivesVerified: validated.filter(e => e.executiveVerification?.verified).length,
      executivesUnverified: validated.filter(e => e.executiveVerification && !e.executiveVerification.verified).length
    };
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Initial candidates: ${stats.initial}`);
    console.log(`After product relevance: ${stats.afterRelevance}`);
    console.log(`LinkedIn verified: ${stats.linkedInVerified}`);
    console.log(`LinkedIn invalid: ${stats.linkedInInvalid}`);
    console.log(`Executives web-verified: ${stats.executivesVerified}`);
    console.log(`Executives unverified: ${stats.executivesUnverified}`);
    console.log('='.repeat(70) + '\n');
    
    return {
      buyerGroup: validated,
      stats,
      exclusionRules: this.exclusionRules
    };
  }
}

// =============================================================================
// BLOCKER RELEVANCE CHECKER
// =============================================================================

/**
 * Enhanced blocker checking that considers product category
 * @param {string} department - Employee department
 * @param {string} title - Employee title
 * @param {string} productCategory - Product being sold
 * @returns {object} { isBlocker: boolean, blockerType: string, reason: string }
 */
function checkBlockerRelevance(department, title, productCategory) {
  const deptLower = (department || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();
  
  // Universal blockers (always relevant)
  const universalBlockers = {
    'legal': 'Legal department reviews all contracts',
    'procurement': 'Procurement controls vendor selection',
    'finance': 'Finance approves budgets'
  };
  
  // Product-specific blockers
  const productBlockers = {
    'hr-case-management': {
      'compliance': 'HR compliance oversight',
      'ethics': 'Ethics program alignment',
      'employee relations': 'ER policy alignment'
    },
    'security': {
      'it': 'IT security review',
      'compliance': 'Security compliance',
      'risk': 'Risk assessment'
    },
    'sales': {
      'it': 'CRM/system integration',
      'operations': 'Process alignment'
    }
  };
  
  // Check universal blockers
  for (const [keyword, reason] of Object.entries(universalBlockers)) {
    if (deptLower.includes(keyword) || titleLower.includes(keyword)) {
      return { isBlocker: true, blockerType: keyword, reason };
    }
  }
  
  // Check product-specific blockers
  const specificBlockers = productBlockers[productCategory] || {};
  for (const [keyword, reason] of Object.entries(specificBlockers)) {
    if (deptLower.includes(keyword) || titleLower.includes(keyword)) {
      return { isBlocker: true, blockerType: keyword, reason };
    }
  }
  
  // NOT a blocker: Security for HR software, Government Affairs for any software
  if (productCategory === 'hr-case-management') {
    if (deptLower.includes('security') && !deptLower.includes('information security')) {
      return { 
        isBlocker: false, 
        blockerType: null, 
        reason: 'Physical/investigative security not relevant for HR case management' 
      };
    }
    if (deptLower.includes('government') || titleLower.includes('government')) {
      return { 
        isBlocker: false, 
        blockerType: null, 
        reason: 'Government affairs not relevant for HR case management' 
      };
    }
  }
  
  return { isBlocker: false, blockerType: null, reason: 'Not a blocker function' };
}

module.exports = {
  PipelineValidators,
  PRODUCT_EXCLUSION_RULES,
  checkBlockerRelevance
};
