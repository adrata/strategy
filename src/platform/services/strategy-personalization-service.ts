/**
 * Strategy Personalization Service
 * Generates personalized Situation-Complication-Future State content based on buyer group archetypes and industry context
 */

import { BuyerGroupArchetype, determineArchetype } from './buyer-group-archetypes';

export interface StrategySummary {
  summary: string;
  situation: string;
  complication: string;
  futureState: string;
  archetype: BuyerGroupArchetype;
  industryContext: string;
  personalizedContent: {
    situation: string;
    complication: string;
    futureState: string;
  };
}

export interface PersonData {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  department: string;
  seniority: string;
  buyerGroupRole: string;
  painPoints: string[];
  goals: string[];
  challenges: string[];
  opportunities: string[];
  skills: string[];
  experience: any[];
  customFields: any;
}

export class StrategyPersonalizationService {
  private industryContexts: { [key: string]: any } = {
    'Technology': {
      terminology: {
        solutions: 'technology solutions',
        processes: 'development processes',
        efficiency: 'technical efficiency',
        innovation: 'digital innovation',
        transformation: 'digital transformation',
        optimization: 'system optimization'
      },
      painPoints: [
        'Legacy system limitations',
        'Technical debt accumulation',
        'Integration complexity',
        'Scalability challenges',
        'Security vulnerabilities',
        'Development bottlenecks'
      ],
      opportunities: [
        'Modern architecture implementation',
        'Cloud migration',
        'DevOps automation',
        'Security enhancement',
        'Performance optimization',
        'Developer productivity'
      ]
    },
    'Healthcare': {
      terminology: {
        solutions: 'healthcare solutions',
        processes: 'clinical processes',
        efficiency: 'clinical efficiency',
        innovation: 'healthcare innovation',
        transformation: 'clinical transformation',
        optimization: 'workflow optimization'
      },
      painPoints: [
        'Regulatory compliance complexity',
        'Patient data security',
        'Workflow inefficiencies',
        'Interoperability challenges',
        'Clinical documentation burden',
        'Care coordination gaps'
      ],
      opportunities: [
        'HIPAA-compliant workflows',
        'Clinical decision support',
        'Patient engagement tools',
        'Interoperability solutions',
        'Quality improvement',
        'Cost reduction'
      ]
    },
    'Manufacturing': {
      terminology: {
        solutions: 'manufacturing solutions',
        processes: 'production processes',
        efficiency: 'operational efficiency',
        innovation: 'manufacturing innovation',
        transformation: 'operational transformation',
        optimization: 'production optimization'
      },
      painPoints: [
        'Supply chain visibility gaps',
        'Production inefficiencies',
        'Quality control challenges',
        'Equipment downtime',
        'Manual processes',
        'Regulatory compliance'
      ],
      opportunities: [
        'Smart manufacturing',
        'Predictive maintenance',
        'Quality automation',
        'Supply chain optimization',
        'Production efficiency',
        'Cost reduction'
      ]
    },
    'Financial Services': {
      terminology: {
        solutions: 'financial solutions',
        processes: 'financial processes',
        efficiency: 'operational efficiency',
        innovation: 'fintech innovation',
        transformation: 'digital transformation',
        optimization: 'process optimization'
      },
      painPoints: [
        'Regulatory compliance complexity',
        'Data security requirements',
        'Legacy system limitations',
        'Customer experience gaps',
        'Operational inefficiencies',
        'Risk management challenges'
      ],
      opportunities: [
        'Digital banking solutions',
        'Risk management tools',
        'Customer experience enhancement',
        'Compliance automation',
        'Operational efficiency',
        'Innovation leadership'
      ]
    },
    'Retail': {
      terminology: {
        solutions: 'retail solutions',
        processes: 'retail processes',
        efficiency: 'operational efficiency',
        innovation: 'retail innovation',
        transformation: 'digital transformation',
        optimization: 'retail optimization'
      },
      painPoints: [
        'Inventory management challenges',
        'Customer experience gaps',
        'Omnichannel complexity',
        'Supply chain visibility',
        'Competitive pressure',
        'Technology integration'
      ],
      opportunities: [
        'Omnichannel experience',
        'Inventory optimization',
        'Customer personalization',
        'Supply chain visibility',
        'Operational efficiency',
        'Competitive advantage'
      ]
    }
  };

  /**
   * Generate personalized strategy summary for a person
   */
  async generateStrategySummary(personData: PersonData): Promise<StrategySummary> {
    // Determine buyer group archetype
    const archetype = determineArchetype(personData);
    if (!archetype) {
      throw new Error('Unable to determine buyer group archetype');
    }

    // Get industry context
    const industryContext = this.getIndustryContext(personData.industry);
    
    // Generate personalized content
    const personalizedContent = this.generatePersonalizedContent(personData, archetype, industryContext);

    // Create strategy summary
    const summary = this.generateSummary(personData, archetype, industryContext);

    return {
      summary,
      situation: personalizedContent.situation,
      complication: personalizedContent.complication,
      futureState: personalizedContent.futureState,
      archetype,
      industryContext: personData.industry,
      personalizedContent
    };
  }

  /**
   * Get industry-specific context and terminology
   */
  private getIndustryContext(industry: string): any {
    const normalizedIndustry = this.normalizeIndustry(industry);
    return this.industryContexts[normalizedIndustry] || this.industryContexts['Technology'];
  }

  /**
   * Normalize industry name for consistent lookup
   */
  private normalizeIndustry(industry: string): string {
    const lowerIndustry = industry.toLowerCase();
    
    if (lowerIndustry.includes('tech') || lowerIndustry.includes('software') || lowerIndustry.includes('it')) {
      return 'Technology';
    }
    if (lowerIndustry.includes('health') || lowerIndustry.includes('medical') || lowerIndustry.includes('clinical')) {
      return 'Healthcare';
    }
    if (lowerIndustry.includes('manufacturing') || lowerIndustry.includes('production') || lowerIndustry.includes('industrial')) {
      return 'Manufacturing';
    }
    if (lowerIndustry.includes('financial') || lowerIndustry.includes('banking') || lowerIndustry.includes('fintech')) {
      return 'Financial Services';
    }
    if (lowerIndustry.includes('retail') || lowerIndustry.includes('commerce') || lowerIndustry.includes('ecommerce')) {
      return 'Retail';
    }
    
    return 'Technology'; // Default fallback
  }

  /**
   * Generate personalized content based on archetype and industry
   */
  private generatePersonalizedContent(
    personData: PersonData, 
    archetype: BuyerGroupArchetype, 
    industryContext: any
  ): { situation: string; complication: string; futureState: string } {
    
    // Get industry-specific terminology
    const terminology = industryContext.terminology;
    
    // Use archetype's industry-specific content if available, otherwise use generic
    const archetypeContent = archetype.industryPersonalization[personData.industry] || {
      situation: archetype.situation,
      complication: archetype.complication,
      futureState: archetype.futureState
    };

    // Personalize content with person-specific data
    const situation = this.personalizeSituation(archetypeContent.situation, personData, terminology);
    const complication = this.personalizeComplication(archetypeContent.complication, personData, terminology);
    const futureState = this.personalizeFutureState(archetypeContent.futureState, personData, terminology);

    return {
      situation,
      complication,
      futureState
    };
  }

  /**
   * Personalize situation content
   */
  private personalizeSituation(baseSituation: string, personData: PersonData, terminology: any): string {
    let situation = baseSituation;
    
    // Replace generic terms with person-specific data
    situation = situation.replace(/A motivated/g, `${personData.name} is a motivated`);
    situation = situation.replace(/A seasoned/g, `${personData.name} is a seasoned`);
    situation = situation.replace(/A promising/g, `${personData.name} is a promising`);
    situation = situation.replace(/A transformation/g, `${personData.name} is a transformation`);
    situation = situation.replace(/A technical/g, `${personData.name} is a technical`);
    
    // Add industry-specific context
    if (personData.industry) {
      situation += ` in the ${personData.industry} industry`;
    }
    
    // Add company context
    if (personData.company) {
      situation += ` at ${personData.company}`;
    }
    
    // Add role context
    if (personData.title) {
      situation += ` as ${personData.title}`;
    }
    
    return situation;
  }

  /**
   * Personalize complication content
   */
  private personalizeComplication(baseComplication: string, personData: PersonData, terminology: any): string {
    let complication = baseComplication;
    
    // Add person-specific pain points if available
    if (personData.painPoints && personData.painPoints.length > 0) {
      const painPoint = personData.painPoints[0];
      complication += ` Specifically, they are dealing with ${painPoint.toLowerCase()}.`;
    }
    
    // Add industry-specific challenges
    const industryChallenges = this.getIndustryChallenges(personData.industry);
    if (industryChallenges.length > 0) {
      complication += ` In the ${personData.industry} industry, this includes ${industryChallenges[0].toLowerCase()}.`;
    }
    
    return complication;
  }

  /**
   * Personalize future state content
   */
  private personalizeFutureState(baseFutureState: string, personData: PersonData, terminology: any): string {
    let futureState = baseFutureState;
    
    // Add person-specific goals if available
    if (personData.goals && personData.goals.length > 0) {
      const goal = personData.goals[0];
      futureState += ` This aligns with their goal to ${goal.toLowerCase()}.`;
    }
    
    // Add industry-specific opportunities
    const industryOpportunities = this.getIndustryOpportunities(personData.industry);
    if (industryOpportunities.length > 0) {
      futureState += ` In the ${personData.industry} industry, this enables ${industryOpportunities[0].toLowerCase()}.`;
    }
    
    return futureState;
  }

  /**
   * Generate overall strategy summary
   */
  private generateSummary(personData: PersonData, archetype: BuyerGroupArchetype, industryContext: any): string {
    const role = archetype.role;
    const archetypeName = archetype.name;
    const industry = personData.industry || 'their industry';
    
    return `${personData.name} is a ${archetypeName} in the ${role} category, positioned to drive strategic initiatives in the ${industry} sector. Their ${archetype.characteristics.decisionMakingStyle.toLowerCase()} and focus on ${archetype.characteristics.keyNeeds[0].toLowerCase()} make them a key stakeholder for ${industryContext.terminology.solutions}.`;
  }

  /**
   * Get industry-specific challenges
   */
  private getIndustryChallenges(industry: string): string[] {
    const context = this.getIndustryContext(industry);
    return context.painPoints || [];
  }

  /**
   * Get industry-specific opportunities
   */
  private getIndustryOpportunities(industry: string): string[] {
    const context = this.getIndustryContext(industry);
    return context.opportunities || [];
  }

  /**
   * Generate AI-powered strategy content using external AI service
   */
  async generateAIStrategyContent(personData: PersonData, archetype: BuyerGroupArchetype): Promise<{
    situation: string;
    complication: string;
    futureState: string;
  }> {
    // This would integrate with OpenRouter/Claude AI service
    // For now, return the archetype-based content
    const industryContext = this.getIndustryContext(personData.industry);
    return this.generatePersonalizedContent(personData, archetype, industryContext);
  }

  /**
   * Save strategy summary to database
   */
  async saveStrategySummary(personId: string, strategySummary: StrategySummary): Promise<void> {
    // This would save to database customFields
    // Implementation would depend on your database service
    console.log(`Saving strategy summary for person ${personId}:`, strategySummary);
  }

  /**
   * Load existing strategy summary from database
   */
  async loadStrategySummary(personId: string): Promise<StrategySummary | null> {
    // This would load from database customFields
    // Implementation would depend on your database service
    console.log(`Loading strategy summary for person ${personId}`);
    return null;
  }
}

/**
 * Utility functions for strategy personalization
 */
export class StrategyUtils {
  /**
   * Extract key insights from person data
   */
  static extractInsights(personData: PersonData): {
    keyStrengths: string[];
    primaryConcerns: string[];
    decisionFactors: string[];
  } {
    return {
      keyStrengths: personData.skills?.slice(0, 3) || [],
      primaryConcerns: personData.challenges?.slice(0, 3) || [],
      decisionFactors: personData.goals?.slice(0, 3) || []
    };
  }

  /**
   * Generate industry-specific terminology mapping
   */
  static getIndustryTerminology(industry: string): { [key: string]: string } {
    const service = new StrategyPersonalizationService();
    const context = service['getIndustryContext'](industry);
    return context.terminology || {};
  }

  /**
   * Validate person data for strategy generation
   */
  static validatePersonData(personData: PersonData): { isValid: boolean; missingFields: string[] } {
    const requiredFields = ['id', 'name', 'title', 'company'];
    const missingFields = requiredFields.filter(field => !personData[field as keyof PersonData]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}
