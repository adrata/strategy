/**
 * 🎯 UNIVERSAL SELLER PROFILE SYSTEM
 * 
 * Adaptive seller profile generation for any B2B product/company combination
 */

import { SellerProfile } from './types';

/**
 * Universal Seller Profile Generator
 * Creates adaptive buyer group configurations for any B2B product
 */
class SellerProfileGenerator {
  
  /**
   * Generate a seller profile for any product/company combination
   */
  static generateProfile(config: {
    productName: string;
    sellerCompanyName: string;
    solutionCategory: SellerProfile['solutionCategory'];
    customSolutionCategory?: string;
    targetMarket?: SellerProfile['targetMarket'];
    dealSize?: SellerProfile['dealSize'];
    primaryPainPoints?: string[];
    targetDepartments?: string[];
    competitiveThreats?: string[];
    productCriticality?: SellerProfile['productCriticality'];
    integrationDepth?: SellerProfile['integrationDepth'];
  }): SellerProfile {
    
    const baseProfile = this.getBaseBySolutionCategory(config.solutionCategory, config.customSolutionCategory);
    
    // Apply customizations
    const profile: SellerProfile = {
      ...baseProfile,
      productName: config.productName,
      sellerCompanyName: config.sellerCompanyName,
      solutionCategory: config.solutionCategory,
      customSolutionCategory: config.customSolutionCategory,
      targetMarket: config.targetMarket || 'all',
      dealSize: config.dealSize || baseProfile.dealSize,
      primaryPainPoints: config.primaryPainPoints || baseProfile.primaryPainPoints || [],
      targetDepartments: config.targetDepartments || baseProfile.targetDepartments || [],
      competitiveThreats: config.competitiveThreats || baseProfile.competitiveThreats || [],
      productCriticality: config.productCriticality || baseProfile.productCriticality,
      integrationDepth: config.integrationDepth || baseProfile.integrationDepth
    } as SellerProfile;
    
    // Adapt role priorities based on solution category and target market
    profile['rolePriorities'] = this.adaptRolePriorities(profile);
    
    return profile;
  }
  
  /**
   * Get base profile template by solution category
   */
  private static getBaseBySolutionCategory(category: SellerProfile['solutionCategory'], customCategory?: string): Partial<SellerProfile> {
    const templates: Record<string, Partial<SellerProfile>> = {
      revenue_technology: {
        buyingCenter: 'operations',
        decisionLevel: 'director',
        dealSize: 'medium',
        targetDepartments: ['sales', 'revenue operations', 'business development'],
        primaryPainPoints: ['revenue visibility', 'sales process efficiency', 'pipeline accuracy', 'buyer group identification'],
        competitiveThreats: ['finance', 'procurement'],
        productCriticality: 'important',
        integrationDepth: 'moderate',
        securityGateLevel: 'medium',
        procurementMaturity: 'developing',
        mustHaveTitles: ['sales', 'revenue', 'business development'],
        adjacentFunctions: ['marketing', 'customer success'],
        disqualifiers: ['hr', 'facilities'],
        geo: ['US', 'EMEA', 'APAC']
      },
      security: {
        buyingCenter: 'technical',
        decisionLevel: 'director',
        dealSize: 'large',
        targetDepartments: ['security', 'it', 'compliance', 'risk management'],
        primaryPainPoints: ['cyber threats', 'compliance requirements', 'data protection', 'incident response'],
        competitiveThreats: ['finance', 'legal'],
        productCriticality: 'mission_critical',
        integrationDepth: 'deep',
        securityGateLevel: 'high',
        procurementMaturity: 'mature',
        mustHaveTitles: ['security', 'compliance', 'risk'],
        adjacentFunctions: ['it', 'engineering'],
        disqualifiers: ['sales', 'marketing'],
        geo: ['US', 'EMEA', 'APAC']
      },
      analytics: {
        buyingCenter: 'technical',
        decisionLevel: 'director',
        dealSize: 'medium',
        targetDepartments: ['data', 'analytics', 'business intelligence', 'operations'],
        primaryPainPoints: ['data insights', 'reporting efficiency', 'decision making', 'data quality'],
        competitiveThreats: ['finance', 'engineering'],
        productCriticality: 'important',
        integrationDepth: 'moderate',
        securityGateLevel: 'medium',
        procurementMaturity: 'developing',
        mustHaveTitles: ['data', 'analytics', 'intelligence'],
        adjacentFunctions: ['operations', 'business'],
        disqualifiers: ['hr', 'facilities'],
        geo: ['US', 'EMEA', 'APAC']
      },
      infrastructure: {
        buyingCenter: 'technical',
        decisionLevel: 'director',
        dealSize: 'large',
        targetDepartments: ['it', 'engineering', 'devops', 'platform'],
        primaryPainPoints: ['system reliability', 'scalability', 'performance', 'cost optimization'],
        competitiveThreats: ['finance', 'security'],
        productCriticality: 'mission_critical',
        integrationDepth: 'deep',
        securityGateLevel: 'high',
        procurementMaturity: 'mature',
        mustHaveTitles: ['engineering', 'infrastructure', 'platform'],
        adjacentFunctions: ['security', 'operations'],
        disqualifiers: ['sales', 'marketing'],
        geo: ['US', 'EMEA', 'APAC']
      },
      platform: {
        buyingCenter: 'technical',
        decisionLevel: 'vp',
        dealSize: 'enterprise',
        targetDepartments: ['engineering', 'product', 'platform', 'architecture'],
        primaryPainPoints: ['developer productivity', 'system integration', 'platform standardization'],
        competitiveThreats: ['finance', 'security'],
        productCriticality: 'mission_critical',
        integrationDepth: 'deep',
        securityGateLevel: 'high',
        procurementMaturity: 'mature',
        mustHaveTitles: ['platform', 'engineering', 'architecture'],
        adjacentFunctions: ['product', 'devops'],
        disqualifiers: ['sales', 'marketing'],
        geo: ['US', 'EMEA', 'APAC']
      },
      operations: {
        buyingCenter: 'operations',
        decisionLevel: 'director',
        dealSize: 'medium',
        targetDepartments: ['operations', 'business operations', 'process improvement'],
        primaryPainPoints: ['operational efficiency', 'process automation', 'cost reduction'],
        competitiveThreats: ['finance', 'hr'],
        productCriticality: 'important',
        integrationDepth: 'moderate',
        securityGateLevel: 'medium',
        procurementMaturity: 'developing',
        mustHaveTitles: ['operations', 'process', 'efficiency'],
        adjacentFunctions: ['finance', 'hr'],
        disqualifiers: ['sales', 'marketing'],
        geo: ['US', 'EMEA', 'APAC']
      },
      marketing: {
        buyingCenter: 'functional',
        decisionLevel: 'director',
        dealSize: 'medium',
        targetDepartments: ['marketing', 'digital marketing', 'demand generation'],
        primaryPainPoints: ['lead generation', 'campaign effectiveness', 'attribution', 'customer engagement'],
        competitiveThreats: ['finance', 'sales'],
        productCriticality: 'important',
        integrationDepth: 'moderate',
        securityGateLevel: 'medium',
        procurementMaturity: 'developing',
        mustHaveTitles: ['marketing', 'demand', 'campaign'],
        adjacentFunctions: ['sales', 'customer success'],
        disqualifiers: ['engineering', 'security'],
        geo: ['US', 'EMEA', 'APAC']
      },
      hr: {
        buyingCenter: 'functional',
        decisionLevel: 'director',
        dealSize: 'medium',
        targetDepartments: ['hr', 'talent', 'people operations'],
        primaryPainPoints: ['talent acquisition', 'employee engagement', 'performance management'],
        competitiveThreats: ['finance', 'legal'],
        productCriticality: 'important',
        integrationDepth: 'moderate',
        securityGateLevel: 'medium',
        procurementMaturity: 'developing',
        mustHaveTitles: ['hr', 'talent', 'people'],
        adjacentFunctions: ['operations', 'finance'],
        disqualifiers: ['sales', 'engineering'],
        geo: ['US', 'EMEA', 'APAC']
      },
      finance: {
        buyingCenter: 'financial',
        decisionLevel: 'director',
        dealSize: 'large',
        targetDepartments: ['finance', 'accounting', 'financial planning'],
        primaryPainPoints: ['financial reporting', 'compliance', 'cost management', 'forecasting'],
        competitiveThreats: ['legal', 'it'],
        productCriticality: 'mission_critical',
        integrationDepth: 'deep',
        securityGateLevel: 'high',
        procurementMaturity: 'mature',
        mustHaveTitles: ['finance', 'accounting', 'financial'],
        adjacentFunctions: ['operations', 'legal'],
        disqualifiers: ['sales', 'marketing'],
        geo: ['US', 'EMEA', 'APAC']
      },
      legal: {
        buyingCenter: 'functional',
        decisionLevel: 'director',
        dealSize: 'large',
        targetDepartments: ['legal', 'compliance', 'risk'],
        primaryPainPoints: ['compliance management', 'contract management', 'risk mitigation'],
        competitiveThreats: ['finance', 'security'],
        productCriticality: 'mission_critical',
        integrationDepth: 'moderate',
        securityGateLevel: 'high',
        procurementMaturity: 'mature',
        mustHaveTitles: ['legal', 'compliance', 'contract'],
        adjacentFunctions: ['finance', 'risk'],
        disqualifiers: ['sales', 'marketing'],
        geo: ['US', 'EMEA', 'APAC']
      },
      custom: {
        buyingCenter: 'mixed',
        decisionLevel: 'director',
        dealSize: 'medium',
        targetDepartments: ['operations'],
        primaryPainPoints: ['operational efficiency', 'process improvement'],
        competitiveThreats: ['finance'],
        productCriticality: 'important',
        integrationDepth: 'moderate',
        securityGateLevel: 'medium',
        procurementMaturity: 'developing',
        mustHaveTitles: ['manager', 'director'],
        adjacentFunctions: ['operations'],
        disqualifiers: [],
        geo: ['US', 'EMEA', 'APAC']
      }
    };
    
    const template = templates[category];
    return template !== undefined ? template : templates.custom!;
  }
  
  /**
   * Adapt role priorities based on solution category and context
   */
  private static adaptRolePriorities(profile: SellerProfile): SellerProfile['rolePriorities'] {
    const baseRoles = this.getBaseRolesByCategory(profile.solutionCategory);
    
    // Customize based on target departments
    const customizedRoles = { ...baseRoles };
    
    if (profile.targetDepartments) {
      // Add department-specific champions and introducers
      profile.targetDepartments.forEach(dept => {
        const deptRoles = this.getDepartmentRoles(dept);
        customizedRoles.champion.push(...deptRoles.champion);
        customizedRoles.introducer.push(...deptRoles.introducer);
      });
    }
    
    // Add competitive threats as potential blockers
    if (profile.competitiveThreats) {
      profile.competitiveThreats.forEach(threat => {
        const threatRoles = this.getDepartmentRoles(threat);
        customizedRoles.blocker.push(...threatRoles.decision, ...threatRoles.champion);
      });
    }
    
    // Deduplicate
    Object.keys(customizedRoles).forEach(role => {
      (customizedRoles as any)[role] = Array.from(new Set((customizedRoles as any)[role]));
    });
    
    return customizedRoles;
  }
  
  /**
   * Get base roles by solution category
   */
  private static getBaseRolesByCategory(category: SellerProfile['solutionCategory']) {
    const categoryRoles: Record<string, SellerProfile['rolePriorities']> = {
      revenue_technology: {
        decision: ['chief revenue officer', 'vp sales', 'sales director', 'head of sales'],
        champion: ['director sales', 'sales manager', 'revenue operations', 'sales operations'],
        stakeholder: ['marketing director', 'customer success', 'business development'],
        blocker: ['finance director', 'procurement', 'legal'],
        introducer: ['account executive', 'sales representative', 'business development rep']
      },
      security: {
        decision: ['chief security officer', 'ciso', 'vp security', 'security director'],
        champion: ['security manager', 'it security', 'compliance manager', 'risk manager'],
        stakeholder: ['it director', 'engineering director', 'privacy officer'],
        blocker: ['finance director', 'legal counsel', 'procurement'],
        introducer: ['security analyst', 'it administrator', 'compliance analyst']
      },
      analytics: {
        decision: ['chief data officer', 'vp analytics', 'data director', 'analytics director'],
        champion: ['data manager', 'analytics manager', 'business intelligence', 'data scientist'],
        stakeholder: ['operations director', 'business analyst', 'product manager'],
        blocker: ['finance director', 'engineering director', 'legal'],
        introducer: ['data analyst', 'business analyst', 'reporting specialist']
      },
      infrastructure: {
        decision: ['chief technology officer', 'vp engineering', 'infrastructure director'],
        champion: ['engineering manager', 'devops manager', 'platform manager', 'site reliability'],
        stakeholder: ['product director', 'security director', 'operations'],
        blocker: ['finance director', 'security director', 'procurement'],
        introducer: ['software engineer', 'devops engineer', 'platform engineer']
      },
      platform: {
        decision: ['chief technology officer', 'vp engineering', 'platform director'],
        champion: ['platform manager', 'engineering manager', 'architect', 'technical lead'],
        stakeholder: ['product director', 'devops', 'security'],
        blocker: ['finance director', 'security director', 'legal'],
        introducer: ['platform engineer', 'software engineer', 'technical specialist']
      },
      operations: {
        decision: ['chief operating officer', 'vp operations', 'operations director'],
        champion: ['operations manager', 'process manager', 'business analyst'],
        stakeholder: ['finance director', 'hr director', 'it'],
        blocker: ['finance director', 'legal', 'hr'],
        introducer: ['business analyst', 'operations specialist', 'process analyst']
      },
      marketing: {
        decision: ['chief marketing officer', 'vp marketing', 'marketing director'],
        champion: ['marketing manager', 'demand generation', 'digital marketing'],
        stakeholder: ['sales director', 'customer success', 'product'],
        blocker: ['finance director', 'sales director', 'legal'],
        introducer: ['marketing specialist', 'campaign manager', 'content manager']
      },
      hr: {
        decision: ['chief people officer', 'vp hr', 'hr director'],
        champion: ['hr manager', 'talent manager', 'people operations'],
        stakeholder: ['operations director', 'finance', 'legal'],
        blocker: ['finance director', 'legal counsel', 'operations'],
        introducer: ['hr specialist', 'recruiter', 'hr analyst']
      },
      finance: {
        decision: ['chief financial officer', 'vp finance', 'finance director'],
        champion: ['finance manager', 'controller', 'financial analyst'],
        stakeholder: ['operations director', 'legal', 'it'],
        blocker: ['legal counsel', 'audit', 'compliance'],
        introducer: ['financial analyst', 'accountant', 'finance specialist']
      },
      legal: {
        decision: ['general counsel', 'chief legal officer', 'legal director'],
        champion: ['legal counsel', 'compliance manager', 'contract manager'],
        stakeholder: ['finance director', 'operations', 'hr'],
        blocker: ['finance director', 'security director', 'audit'],
        introducer: ['legal analyst', 'compliance specialist', 'paralegal']
      }
    };
    
    return categoryRoles[category] || this.getGenericRoles();
  }
  
  /**
   * Get department-specific roles
   */
  private static getDepartmentRoles(department: string) {
    const deptMap: Record<string, { decision: string[]; champion: string[]; introducer: string[] }> = {
      sales: {
        decision: ['vp sales', 'sales director', 'head of sales'],
        champion: ['sales manager', 'territory manager'],
        introducer: ['account executive', 'sales representative']
      },
      marketing: {
        decision: ['vp marketing', 'marketing director', 'cmo'],
        champion: ['marketing manager', 'demand generation'],
        introducer: ['marketing specialist', 'campaign manager']
      },
      finance: {
        decision: ['cfo', 'finance director', 'controller'],
        champion: ['finance manager', 'financial analyst'],
        introducer: ['accountant', 'financial analyst']
      },
      security: {
        decision: ['ciso', 'security director', 'vp security'],
        champion: ['security manager', 'security analyst'],
        introducer: ['security specialist', 'compliance analyst']
      },
      it: {
        decision: ['cio', 'it director', 'vp it'],
        champion: ['it manager', 'systems administrator'],
        introducer: ['it specialist', 'network administrator']
      },
      engineering: {
        decision: ['cto', 'engineering director', 'vp engineering'],
        champion: ['engineering manager', 'tech lead'],
        introducer: ['software engineer', 'developer']
      },
      operations: {
        decision: ['coo', 'operations director', 'vp operations'],
        champion: ['operations manager', 'process manager'],
        introducer: ['operations analyst', 'business analyst']
      },
      hr: {
        decision: ['chro', 'hr director', 'vp hr'],
        champion: ['hr manager', 'talent manager'],
        introducer: ['hr specialist', 'recruiter']
      },
      legal: {
        decision: ['general counsel', 'legal director'],
        champion: ['legal counsel', 'compliance manager'],
        introducer: ['legal analyst', 'paralegal']
      },
      procurement: {
        decision: ['procurement director', 'vp procurement'],
        champion: ['procurement manager', 'sourcing manager'],
        introducer: ['procurement analyst', 'buyer']
      }
    };
    
    const dept = department.toLowerCase();
    return deptMap[dept] || { decision: [], champion: [], introducer: [] };
  }
  
  /**
   * Generic role priorities for unknown categories
   */
  private static getGenericRoles(): SellerProfile['rolePriorities'] {
    return {
      decision: ['director', 'vp', 'head of', 'chief'],
      champion: ['manager', 'lead', 'senior'],
      stakeholder: ['analyst', 'specialist', 'coordinator'],
      blocker: ['finance', 'legal', 'procurement', 'security'],
      introducer: ['specialist', 'analyst', 'coordinator', 'associate']
    };
  }
}

// Legacy predefined profiles for backward compatibility
export const SELLER_PROFILES: Record<string, SellerProfile> = {
  'buyer-group-intelligence': {
    productName: 'Buyer Group Intelligence',
    sellerCompanyName: 'Adrata',
    solutionCategory: 'revenue_technology',
    targetMarket: 'enterprise',
    buyingCenter: 'operations',
    decisionLevel: 'vp', // $250K-$1M requires VP+ approval
    dealSize: 'enterprise',
    targetDepartments: ['sales', 'revenue operations', 'business development'],
    primaryPainPoints: ['buyer group identification', 'stakeholder mapping', 'sales process efficiency'],
    competitiveThreats: ['finance', 'procurement'],
    productCriticality: 'mission_critical', // $250K+ is mission critical
    integrationDepth: 'deep', // Enterprise integration requirements
    securityGateLevel: 'high', // Dell has strict security requirements
    procurementMaturity: 'mature', // Dell has mature procurement process
    buyingGovernance: 'enterprise', // Formal buying committee
    decisionStyle: 'committee', // Multiple stakeholders involved
    
    // OPTIMAL BUYER GROUP DESIGN FOR ADRATA ($250K-$1M ENTERPRISE DEAL)
    // CLEAR NON-OVERLAPPING ROLE DEFINITIONS
    rolePriorities: {
      decision: [
        // TIER 1: C-Level with Budget Authority (EXCLUSIVE TO DECISION)
        'cro',
        'chief revenue officer',
        'chief executive officer',
        'ceo',
        // TIER 2: VP-Level with Direct Budget Control (EXCLUSIVE TO DECISION)  
        'vp sales',
        'vice president sales',
        'svp sales',
        'senior vice president sales',
        'vp business development',
        'vp enterprise sales',
        'vp field sales',
        'vp revenue',
        'vice president revenue',
        // TIER 3: VP Operations with Budget Authority (EXCLUSIVE TO DECISION)
        'vp sales operations',
        'vice president sales operations',
        'vp commercial operations'
      ],
      champion: [
        // TIER 1: Director-Level Sales Leaders (PERFECT CHAMPIONS - NO VP OVERLAP)
        'director sales',
        'director business development', 
        'director enterprise sales',
        'director field sales',
        'director customer success',
        'regional director sales',
        'director inside sales',
        'director channel sales',
        // TIER 2: Director-Level Ops (CHAMPION LEVEL ONLY)
        'director sales operations',
        'director sales enablement', 
        'director revenue operations',
        'director commercial operations',
        'head of sales operations',
        'head of revenue operations',
        'head of sales enablement',
        // TIER 3: Senior Management (BELOW DIRECTOR)
        'senior manager sales',
        'principal sales manager',
        'senior sales manager',
        'sales team lead'
      ],
      stakeholder: [
        // TIER 1: Sales-Adjacent (Understand Challenges)
        'vp marketing',
        'vice president marketing',
        'director product marketing',
        'vp customer success',
        'vice president customer success',
        // TIER 2: Technical/IT (Integration Concerns)
        'cio',
        'chief information officer',
        'vp it',
        'vice president it',
        'vp engineering',
        'director analytics',
        // TIER 3: Financial (Budget/ROI Validation)
        'finance director',
        'vp finance',
        'director fp&a'
      ],
      blocker: [
        // RESEARCH-BACKED: Enterprise Procurement (Controls vendor approval/contracts)
        'director procurement', 'vp procurement', 'chief procurement officer',
        'procurement manager', 'global procurement director', 'senior procurement manager',
        'sourcing manager', 'strategic sourcing director', 'sourcing director',
        'vendor manager', 'vendor relationship manager', 'supplier relations manager',
        'category manager', 'technology procurement manager', 'it procurement specialist',
        
        // RESEARCH-BACKED: Legal/Compliance (Can veto for regulatory/risk reasons)
        'vp legal', 'general counsel', 'chief legal officer',
        'legal director', 'legal counsel', 'deputy general counsel',
        'compliance director', 'chief compliance officer', 'compliance manager',
        'risk director', 'chief risk officer', 'risk management director',
        'privacy officer', 'data privacy officer', 'chief privacy officer',
        
        // RESEARCH-BACKED: IT Security (Can block for security/integration concerns)
        'ciso', 'chief information security officer', 'chief security officer',
        'security director', 'vp security', 'information security director',
        'cybersecurity director', 'security operations director',
        'privacy officer',
        'data protection officer'
      ],
      introducer: [
        // TIER 1: Individual Contributors with Network Access (NOT MANAGERS)
        'account executive',
        'senior account executive',
        'enterprise account executive',
        'sales representative',
        'outside sales representative',
        'territory manager',
        'territory sales representative',
        // TIER 2: Business Development (FRONT-LINE ONLY)
        'business development representative',
        'senior business development representative',
        'bdr',
        'sdr',
        'sales development representative',
        // TIER 3: Account Management (INDIVIDUAL CONTRIBUTORS)
        'key account manager',
        'strategic account manager',
        'account manager',
        'customer success manager',
        'technical account manager',
        // TIER 4: Sales Support with Access
        'sales specialist',
        'inside sales representative',
        'sales engineer',
        'solution consultant'
      ]
    },
    
    mustHaveTitles: ['sales', 'revenue', 'business development'],
    adjacentFunctions: ['marketing', 'customer success'],
    disqualifiers: ['hr', 'facilities', 'legal counsel'],
    geo: ['US', 'EMEA', 'APAC']
  },
  
  'universal-b2b': SellerProfileGenerator.generateProfile({
    productName: 'Universal B2B Solution',
    sellerCompanyName: 'Generic Company',
    solutionCategory: 'operations',
    targetDepartments: ['operations', 'business'],
    primaryPainPoints: ['operational efficiency', 'process improvement'],
    competitiveThreats: ['finance'],
    dealSize: 'medium'
  }),
  
  'cybersecurity-platform': SellerProfileGenerator.generateProfile({
    productName: 'Enterprise Security Platform',
    sellerCompanyName: 'Security Corp',
    solutionCategory: 'security',
    targetDepartments: ['security', 'it', 'compliance'],
    primaryPainPoints: ['cyber threats', 'compliance requirements', 'data protection'],
    competitiveThreats: ['finance', 'legal'],
    dealSize: 'large',
    productCriticality: 'mission_critical'
  }),
  
  'analytics-platform': SellerProfileGenerator.generateProfile({
    productName: 'Business Intelligence Platform',
    sellerCompanyName: 'Analytics Inc',
    solutionCategory: 'analytics',
    targetDepartments: ['data', 'analytics', 'business intelligence'],
    primaryPainPoints: ['data insights', 'reporting efficiency', 'decision making'],
    competitiveThreats: ['finance', 'engineering'],
    dealSize: 'medium'
  }),
  
  'hr-platform': SellerProfileGenerator.generateProfile({
    productName: 'HR Management Platform',
    sellerCompanyName: 'HR Solutions',
    solutionCategory: 'hr',
    targetDepartments: ['hr', 'talent', 'people operations'],
    primaryPainPoints: ['talent acquisition', 'employee engagement', 'performance management'],
    competitiveThreats: ['finance', 'legal'],
    dealSize: 'medium'
  }),
  
  'marketing-automation': SellerProfileGenerator.generateProfile({
    productName: 'Marketing Automation Platform',
    sellerCompanyName: 'MarTech Corp',
    solutionCategory: 'marketing',
    targetDepartments: ['marketing', 'digital marketing', 'demand generation'],
    primaryPainPoints: ['lead generation', 'campaign effectiveness', 'attribution'],
    competitiveThreats: ['finance', 'sales'],
    dealSize: 'medium'
  }),

  // ENHANCED: Dell North America Enterprise Sales optimized profile for $250K deal
  'dell-na-enterprise-250k': SellerProfileGenerator.generateProfile({
    productName: 'Buyer Group Intelligence',
    sellerCompanyName: 'Adrata',
    solutionCategory: 'revenue_technology',
    targetMarket: 'enterprise',
    dealSize: 'enterprise',
    targetDepartments: [
      'sales',
      'revenue operations',
      'sales operations',
      'business development',
      'commercial operations'
    ],
    primaryPainPoints: [
      'buyer group identification',
      'enterprise sales efficiency', 
      'revenue operations optimization',
      'sales process automation',
      'pipeline accuracy'
    ],
    competitiveThreats: ['finance', 'procurement', 'security'],
    productCriticality: 'mission_critical',
    integrationDepth: 'deep'
  })
};

/**
 * Get predefined seller profile by key
 */
export function getSellerProfile(profileKey: string): SellerProfile {
  const profile = SELLER_PROFILES[profileKey];
  if (!profile) {
    throw new Error(`Seller profile '${profileKey}' not found. Available profiles: ${Object.keys(SELLER_PROFILES).join(', ')}`);
  }
  return profile;
}

/**
 * List all available predefined profiles
 */
export function listAvailableProfiles(): string[] {
  return Object.keys(SELLER_PROFILES);
}

/**
 * Create a custom seller profile for any company/product combination
 */
export function createSellerProfile(config: {
  productName: string;
  sellerCompanyName: string;
  solutionCategory: SellerProfile['solutionCategory'];
  customSolutionCategory?: string;
  targetMarket?: SellerProfile['targetMarket'];
  dealSize?: SellerProfile['dealSize'];
  primaryPainPoints?: string[];
  targetDepartments?: string[];
  competitiveThreats?: string[];
  productCriticality?: SellerProfile['productCriticality'];
  integrationDepth?: SellerProfile['integrationDepth'];
}): SellerProfile {
  return SellerProfileGenerator.generateProfile(config);
}

// Export the generator for direct use
export { SellerProfileGenerator };
