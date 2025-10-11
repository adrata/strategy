/**
 * Industry-Specific Buyer Group Intelligence
 * Uses real CoreSignal company_industry and company_type data
 * Implements NAICS-aligned industry classifications for consistency
 */

import { SellerProfile, CoreSignalProfile } from './types';

// NAICS-aligned industry classifications (based on real data patterns)
export interface IndustryProfile {
  naicsCode?: string;
  regulatoryLevel: 'high' | 'medium' | 'low';
  complianceGates: string[];
  typicalBuyerGroupSize: { min: number; max: number };
  decisionStyle: 'consensus' | 'executive' | 'technical' | 'committee';
  keyStakeholderTypes: string[];
  procurementMaturity: 'mature' | 'developing' | 'minimal';
  securityRequirements: 'high' | 'medium' | 'low';
  budgetCycles: 'annual' | 'quarterly' | 'continuous';
}

// Industry patterns based on CoreSignal company_industry values
export const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  // Technology Industries (NAICS 54151x)
  'computer software': {
    naicsCode: '541511',
    regulatoryLevel: 'medium',
    complianceGates: ['Security', 'Privacy', 'SOC2'],
    typicalBuyerGroupSize: { min: 8, max: 12 },
    decisionStyle: 'technical',
    keyStakeholderTypes: ['CTO', 'VP Engineering', 'Security', 'Product'],
    procurementMaturity: 'developing',
    securityRequirements: 'high',
    budgetCycles: 'continuous'
  },
  'information technology': {
    naicsCode: '541512',
    regulatoryLevel: 'medium',
    complianceGates: ['Security', 'IT Architecture', 'Vendor Management'],
    typicalBuyerGroupSize: { min: 6, max: 10 },
    decisionStyle: 'technical',
    keyStakeholderTypes: ['CIO', 'IT Director', 'Security', 'Operations'],
    procurementMaturity: 'mature',
    securityRequirements: 'high',
    budgetCycles: 'annual'
  },
  
  // Financial Services (NAICS 52xxxx)
  'financial services': {
    naicsCode: '522110',
    regulatoryLevel: 'high',
    complianceGates: ['Compliance', 'Risk Management', 'Audit', 'Legal', 'Security'],
    typicalBuyerGroupSize: { min: 10, max: 15 },
    decisionStyle: 'committee',
    keyStakeholderTypes: ['Chief Risk Officer', 'Compliance Director', 'CISO', 'CFO'],
    procurementMaturity: 'mature',
    securityRequirements: 'high',
    budgetCycles: 'annual'
  },
  'banking': {
    naicsCode: '522110',
    regulatoryLevel: 'high',
    complianceGates: ['Regulatory Compliance', 'Risk Assessment', 'Audit', 'Legal'],
    typicalBuyerGroupSize: { min: 12, max: 18 },
    decisionStyle: 'committee',
    keyStakeholderTypes: ['Chief Risk Officer', 'Compliance', 'Legal', 'Operations'],
    procurementMaturity: 'mature',
    securityRequirements: 'high',
    budgetCycles: 'annual'
  },
  
  // Healthcare (NAICS 62xxxx)
  'healthcare': {
    naicsCode: '621111',
    regulatoryLevel: 'high',
    complianceGates: ['HIPAA', 'Privacy Officer', 'Clinical', 'Legal', 'IT Security'],
    typicalBuyerGroupSize: { min: 8, max: 14 },
    decisionStyle: 'consensus',
    keyStakeholderTypes: ['CMO', 'CNO', 'Privacy Officer', 'IT Director', 'Compliance'],
    procurementMaturity: 'developing',
    securityRequirements: 'high',
    budgetCycles: 'annual'
  },
  'pharmaceuticals': {
    naicsCode: '325412',
    regulatoryLevel: 'high',
    complianceGates: ['FDA', 'Regulatory Affairs', 'Quality', 'Legal', 'Security'],
    typicalBuyerGroupSize: { min: 10, max: 16 },
    decisionStyle: 'committee',
    keyStakeholderTypes: ['Regulatory Affairs', 'Quality Director', 'R&D', 'Legal'],
    procurementMaturity: 'mature',
    securityRequirements: 'high',
    budgetCycles: 'annual'
  },
  
  // Manufacturing (NAICS 31-33)
  'manufacturing': {
    naicsCode: '336411',
    regulatoryLevel: 'medium',
    complianceGates: ['Operations', 'Quality', 'Safety', 'Procurement'],
    typicalBuyerGroupSize: { min: 6, max: 10 },
    decisionStyle: 'executive',
    keyStakeholderTypes: ['COO', 'Plant Manager', 'Quality Director', 'Procurement'],
    procurementMaturity: 'mature',
    securityRequirements: 'medium',
    budgetCycles: 'annual'
  },
  
  // Retail (NAICS 44-45)
  'retail': {
    naicsCode: '445110',
    regulatoryLevel: 'low',
    complianceGates: ['Operations', 'IT', 'Finance'],
    typicalBuyerGroupSize: { min: 4, max: 8 },
    decisionStyle: 'executive',
    keyStakeholderTypes: ['COO', 'CIO', 'CFO', 'Operations'],
    procurementMaturity: 'developing',
    securityRequirements: 'medium',
    budgetCycles: 'quarterly'
  },
  
  // Government/Public Sector (NAICS 92xxxx)
  'government': {
    naicsCode: '921130',
    regulatoryLevel: 'high',
    complianceGates: ['Procurement Office', 'Legal', 'Security', 'Budget Office'],
    typicalBuyerGroupSize: { min: 8, max: 15 },
    decisionStyle: 'committee',
    keyStakeholderTypes: ['Procurement Director', 'CIO', 'Legal Counsel', 'Budget Director'],
    procurementMaturity: 'mature',
    securityRequirements: 'high',
    budgetCycles: 'annual'
  },
  
  // Default for unrecognized industries
  'other': {
    regulatoryLevel: 'medium',
    complianceGates: ['IT', 'Finance', 'Legal'],
    typicalBuyerGroupSize: { min: 6, max: 10 },
    decisionStyle: 'consensus',
    keyStakeholderTypes: ['Manager', 'Director', 'VP'],
    procurementMaturity: 'developing',
    securityRequirements: 'medium',
    budgetCycles: 'quarterly'
  }
};

// Regional adaptations based on location data from CoreSignal
export interface RegionalProfile {
  region: string;
  decisionMakingStyle: 'hierarchical' | 'consensus' | 'collaborative';
  procurementFormality: 'high' | 'medium' | 'low';
  relationshipImportance: 'high' | 'medium' | 'low';
  regulatoryComplexity: 'high' | 'medium' | 'low';
  languageConsiderations: string[];
}

export const REGIONAL_PROFILES: Record<string, RegionalProfile> = {
  'US': {
    region: 'North America',
    decisionMakingStyle: 'consensus',
    procurementFormality: 'medium',
    relationshipImportance: 'medium',
    regulatoryComplexity: 'medium',
    languageConsiderations: ['English']
  },
  'CA': {
    region: 'North America',
    decisionMakingStyle: 'consensus',
    procurementFormality: 'medium',
    relationshipImportance: 'high',
    regulatoryComplexity: 'medium',
    languageConsiderations: ['English', 'French']
  },
  'UK': {
    region: 'EMEA',
    decisionMakingStyle: 'consensus',
    procurementFormality: 'high',
    relationshipImportance: 'high',
    regulatoryComplexity: 'high',
    languageConsiderations: ['English']
  },
  'DE': {
    region: 'EMEA',
    decisionMakingStyle: 'hierarchical',
    procurementFormality: 'high',
    relationshipImportance: 'high',
    regulatoryComplexity: 'high',
    languageConsiderations: ['German', 'English']
  },
  'FR': {
    region: 'EMEA',
    decisionMakingStyle: 'hierarchical',
    procurementFormality: 'high',
    relationshipImportance: 'high',
    regulatoryComplexity: 'high',
    languageConsiderations: ['French', 'English']
  },
  'JP': {
    region: 'APAC',
    decisionMakingStyle: 'consensus',
    procurementFormality: 'high',
    relationshipImportance: 'high',
    regulatoryComplexity: 'medium',
    languageConsiderations: ['Japanese', 'English']
  },
  'AU': {
    region: 'APAC',
    decisionMakingStyle: 'collaborative',
    procurementFormality: 'medium',
    relationshipImportance: 'medium',
    regulatoryComplexity: 'medium',
    languageConsiderations: ['English']
  }
};

export class IndustryAdapter {
  /**
   * Get industry profile from CoreSignal company_industry data
   */
  static getIndustryProfile(companyIndustry: string | undefined): IndustryProfile {
    if (!companyIndustry) return INDUSTRY_PROFILES['other']!;
    
    const industryLower = companyIndustry.toLowerCase();
    
    // Direct matches
    if (INDUSTRY_PROFILES[industryLower]) {
      return INDUSTRY_PROFILES[industryLower]!;
    }
    
    // Fuzzy matches for common variations
    if (industryLower.includes('software') || industryLower.includes('saas')) {
      return INDUSTRY_PROFILES['computer software']!;
    }
    if (industryLower.includes('bank') || industryLower.includes('financial')) {
      return INDUSTRY_PROFILES['financial services']!;
    }
    if (industryLower.includes('health') || industryLower.includes('medical')) {
      return INDUSTRY_PROFILES['healthcare']!;
    }
    if (industryLower.includes('pharma') || industryLower.includes('pharmaceutical')) {
      return INDUSTRY_PROFILES['pharmaceuticals']!;
    }
    if (industryLower.includes('manufactur') || industryLower.includes('industrial')) {
      return INDUSTRY_PROFILES['manufacturing']!;
    }
    if (industryLower.includes('retail') || industryLower.includes('ecommerce')) {
      return INDUSTRY_PROFILES['retail']!;
    }
    if (industryLower.includes('government') || industryLower.includes('public')) {
      return INDUSTRY_PROFILES['government']!;
    }
    
    return INDUSTRY_PROFILES['other']!;
  }

  /**
   * Get regional profile from CoreSignal location data
   */
  static getRegionalProfile(countryCode: string | undefined): RegionalProfile {
    if (!countryCode) return REGIONAL_PROFILES['US']!; // Default
    
    const code = countryCode.toUpperCase();
    return REGIONAL_PROFILES[code] || REGIONAL_PROFILES['US']!;
  }

  /**
   * Adapt seller profile based on industry and regional context
   */
  static adaptSellerProfile(
    baseProfile: SellerProfile, 
    industryProfile: IndustryProfile,
    regionalProfile: RegionalProfile
  ): SellerProfile {
    return {
      ...baseProfile,
      // Override with industry-specific adaptations
      buyingGovernance: industryProfile['procurementMaturity'] === 'mature' ? 'enterprise' : 
                       industryProfile['procurementMaturity'] === 'developing' ? 'structured' : 'agile',
      securityGateLevel: industryProfile.securityRequirements,
      procurementMaturity: industryProfile.procurementMaturity,
      decisionStyle: regionalProfile['decisionMakingStyle'] === 'hierarchical' ? 'executive' :
                    regionalProfile['decisionMakingStyle'] === 'consensus' ? 'consensus' :
                    regionalProfile['decisionMakingStyle'] === 'collaborative' ? 'committee' : 'consensus',
      
      // Add industry-specific stakeholder roles
      rolePriorities: {
        ...baseProfile.rolePriorities,
        // Enhance with industry-specific roles
        stakeholder: [
          ...baseProfile.rolePriorities.stakeholder,
          ...industryProfile.keyStakeholderTypes
        ],
        blocker: [
          ...baseProfile.rolePriorities.blocker,
          ...industryProfile.complianceGates
        ]
      }
    };
  }

  /**
   * Calculate industry-adapted buyer group size range
   */
  static getAdaptedBuyerGroupSize(
    baseDealSize: string,
    industryProfile: IndustryProfile,
    regionalProfile: RegionalProfile
  ): { min: number; max: number } {
    const baseSize = this.getBaseDealSize(baseDealSize);
    
    // Industry adjustment
    const industryAdjustment = industryProfile['regulatoryLevel'] === 'high' ? 1.3 :
                              industryProfile['regulatoryLevel'] === 'medium' ? 1.1 : 1.0;
    
    // Regional adjustment
    const regionalAdjustment = regionalProfile['procurementFormality'] === 'high' ? 1.2 :
                              regionalProfile['procurementFormality'] === 'medium' ? 1.1 : 1.0;
    
    const adjustedMin = Math.round(baseSize.min * industryAdjustment * regionalAdjustment);
    const adjustedMax = Math.round(baseSize.max * industryAdjustment * regionalAdjustment);
    
    return {
      min: Math.max(adjustedMin, industryProfile.typicalBuyerGroupSize.min),
      max: Math.min(adjustedMax, industryProfile.typicalBuyerGroupSize.max)
    };
  }

  private static getBaseDealSize(dealSize: string): { min: number; max: number } {
    switch (dealSize) {
      case 'small': return { min: 4, max: 6 };
      case 'medium': return { min: 6, max: 8 };
      case 'large': return { min: 8, max: 12 };
      case 'enterprise': return { min: 10, max: 15 };
      default: return { min: 6, max: 10 };
    }
  }
}
