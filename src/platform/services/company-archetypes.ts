/**
 * Company Archetype System
 * Defines 5 company archetypes with industry-specific personalization
 */

export interface CompanyArchetype {
  id: string;
  name: string;
  role: string;
  description: string;
  characteristics: string[];
  situation: string;
  complication: string;
  futureState: string;
  industryVariations: Record<string, {
    situation: string;
    complication: string;
    futureState: string;
  }>;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  targetIndustry: string;
  size: number;
  revenue: number;
  age: number;
  growthStage: 'startup' | 'growth' | 'mature' | 'declining';
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
}

export const COMPANY_ARCHETYPES: CompanyArchetype[] = [
  {
    id: 'market-leader',
    name: 'The Market Leader',
    role: 'Industry Dominator',
    description: 'Dominant player in their industry with strong market position',
    characteristics: [
      'Market share leader',
      'Strong brand recognition',
      'Established customer base',
      'Innovation leadership',
      'Competitive moats'
    ],
    situation: 'Established market position with strong brand recognition and customer loyalty',
    complication: 'Threat from disruptors, need to maintain competitive edge, market saturation',
    futureState: 'Sustained market dominance through continuous innovation and strategic expansion',
    industryVariations: {
      'Technology/SaaS': {
        situation: 'Dominant platform with network effects and high switching costs',
        complication: 'Cloud-native disruptors, open source alternatives, platform lock-in risks',
        futureState: 'Platform ecosystem dominance with AI/ML integration and global expansion'
      },
      'Healthcare': {
        situation: 'Leading healthcare provider with established patient relationships and clinical excellence',
        complication: 'Regulatory changes, cost pressures, telemedicine disruption, staffing challenges',
        futureState: 'Integrated care delivery system with digital health innovation and population health management'
      },
      'Financial Services': {
        situation: 'Trusted financial institution with strong capital position and regulatory relationships',
        complication: 'Fintech disruption, digital transformation, regulatory compliance, cybersecurity threats',
        futureState: 'Digital-first financial ecosystem with embedded finance and personalized services'
      }
    }
  },
  {
    id: 'fast-growing-disruptor',
    name: 'The Fast-Growing Disruptor',
    role: 'Market Challenger',
    description: 'Rapidly scaling company challenging established players',
    characteristics: [
      'High growth rate',
      'Innovative approach',
      'Agile operations',
      'Technology advantage',
      'Market disruption'
    ],
    situation: 'Gaining momentum with innovative approach and strong growth trajectory',
    complication: 'Scaling challenges, resource constraints, competitive response, market education',
    futureState: 'Become the new market leader or strong #2 player with sustainable competitive advantage',
    industryVariations: {
      'Technology/SaaS': {
        situation: 'Rapidly scaling SaaS platform with viral growth and product-market fit',
        complication: 'Infrastructure scaling, customer success at scale, enterprise sales challenges',
        futureState: 'Category-defining platform with global reach and ecosystem partnerships'
      },
      'Healthcare': {
        situation: 'Disruptive healthcare technology with proven clinical outcomes and growing adoption',
        complication: 'Regulatory approval processes, provider adoption, reimbursement challenges',
        futureState: 'Standard of care technology with global deployment and clinical evidence'
      },
      'Financial Services': {
        situation: 'Fintech disruptor with innovative financial products and digital-first approach',
        complication: 'Regulatory compliance, trust building, capital requirements, competitive response',
        futureState: 'Next-generation financial services platform with embedded finance capabilities'
      }
    }
  },
  {
    id: 'enterprise-incumbent',
    name: 'The Enterprise Incumbent',
    role: 'Legacy Modernizer',
    description: 'Large, established enterprise with legacy systems undergoing transformation',
    characteristics: [
      'Large customer base',
      'Legacy infrastructure',
      'Complex operations',
      'Regulatory compliance',
      'Transformation focus'
    ],
    situation: 'Strong customer base but aging infrastructure and processes',
    complication: 'Technical debt, resistance to change, competitive pressure, digital transformation',
    futureState: 'Successfully modernized enterprise with competitive advantage and operational efficiency',
    industryVariations: {
      'Technology/SaaS': {
        situation: 'Established enterprise software with large installed base and complex integrations',
        complication: 'Legacy system modernization, cloud migration, user experience transformation',
        futureState: 'Modern cloud-native platform with AI capabilities and seamless user experience'
      },
      'Healthcare': {
        situation: 'Large healthcare system with established operations and patient relationships',
        complication: 'EHR modernization, interoperability challenges, cost management, quality improvement',
        futureState: 'Integrated health system with predictive analytics and personalized care delivery'
      },
      'Financial Services': {
        situation: 'Traditional financial institution with established customer relationships and regulatory compliance',
        complication: 'Core system modernization, digital banking transformation, regulatory adaptation',
        futureState: 'Digital-first financial institution with personalized services and regulatory excellence'
      }
    }
  },
  {
    id: 'niche-specialist',
    name: 'The Niche Specialist',
    role: 'Vertical Expert',
    description: 'Focused on specific vertical or customer segment with deep specialization',
    characteristics: [
      'Vertical focus',
      'Deep expertise',
      'Customer intimacy',
      'Specialized solutions',
      'Market niche'
    ],
    situation: 'Strong position in specific niche with deep customer understanding',
    complication: 'Limited growth potential, larger competitors entering niche, market expansion challenges',
    futureState: 'Dominant niche leader with expansion opportunities and acquisition potential',
    industryVariations: {
      'Technology/SaaS': {
        situation: 'Specialized software solution for specific industry with deep domain expertise',
        complication: 'Market size limitations, enterprise competition, feature commoditization',
        futureState: 'Industry-standard solution with platform expansion and acquisition opportunities'
      },
      'Healthcare': {
        situation: 'Specialized healthcare provider with expertise in specific medical conditions or populations',
        complication: 'Limited patient volume, reimbursement challenges, competition from larger systems',
        futureState: 'Center of excellence with national recognition and research partnerships'
      },
      'Financial Services': {
        situation: 'Specialized financial services for specific customer segments or products',
        complication: 'Regulatory complexity, market concentration, technology disruption',
        futureState: 'Leading specialist with expanded product portfolio and market presence'
      }
    }
  },
  {
    id: 'regional-player',
    name: 'The Regional Player',
    role: 'Geographic Leader',
    description: 'Strong presence in specific geographic region with expansion potential',
    characteristics: [
      'Regional dominance',
      'Local relationships',
      'Geographic focus',
      'Expansion potential',
      'Market knowledge'
    ],
    situation: 'Established regional presence and relationships with strong local market knowledge',
    complication: 'National/global competitors, expansion risks, resource constraints, market saturation',
    futureState: 'Multi-region leader or acquisition target with strategic value',
    industryVariations: {
      'Technology/SaaS': {
        situation: 'Regional software provider with strong local market presence and customer relationships',
        complication: 'National platform competition, feature parity challenges, customer migration',
        futureState: 'Multi-region platform with national presence and acquisition opportunities'
      },
      'Healthcare': {
        situation: 'Regional healthcare provider with strong community relationships and local market share',
        complication: 'National health system competition, technology investment requirements, talent retention',
        futureState: 'Multi-region health system with integrated care delivery and technology leadership'
      },
      'Financial Services': {
        situation: 'Regional financial institution with strong local relationships and community presence',
        complication: 'National bank competition, digital transformation costs, regulatory complexity',
        futureState: 'Multi-region financial services provider with digital capabilities and strategic partnerships'
      }
    }
  }
];

export const TARGET_INDUSTRIES = [
  { category: 'Technology/SaaS', industries: ['Software', 'IT Services', 'Cloud Platforms', 'Cybersecurity', 'AI/ML'] },
  { category: 'Healthcare', industries: ['Hospitals', 'Clinics', 'Medical Practices', 'Pharmaceuticals', 'Medical Devices'] },
  { category: 'Financial Services', industries: ['Banks', 'Insurance', 'Fintech', 'Investment', 'Credit Unions'] },
  { category: 'Manufacturing', industries: ['Production', 'Industrial', 'Supply Chain', 'Automotive', 'Aerospace'] },
  { category: 'Retail/E-commerce', industries: ['B2C Retail', 'B2B Commerce', 'E-commerce', 'Marketplaces', 'Logistics'] },
  { category: 'Professional Services', industries: ['Consulting', 'Legal', 'Accounting', 'Marketing', 'Real Estate'] },
  { category: 'Real Estate', industries: ['Title Companies', 'Brokerages', 'Property Management', 'Construction', 'Development'] },
  { category: 'Education', industries: ['Schools', 'Universities', 'E-learning', 'Training', 'Research'] },
  { category: 'Government/Public Sector', industries: ['Federal', 'State', 'Local', 'Defense', 'Infrastructure'] },
  { category: 'Non-Profit', industries: ['Associations', 'Charities', 'Foundations', 'Religious', 'Social Services'] }
];

export function determineCompanyArchetype(profile: CompanyProfile): CompanyArchetype {
  const { size, revenue, age, growthStage, marketPosition } = profile;
  
  // Market Leader: Large, established, leading position
  if (size > 1000 && revenue > 100000000 && age > 10 && marketPosition === 'leader') {
    return COMPANY_ARCHETYPES[0]; // market-leader
  }
  
  // Fast-Growing Disruptor: High growth, innovative, challenging
  if (growthStage === 'growth' && marketPosition === 'challenger' && age < 10) {
    return COMPANY_ARCHETYPES[1]; // fast-growing-disruptor
  }
  
  // Enterprise Incumbent: Large, established, legacy systems
  if (size > 500 && age > 15 && marketPosition === 'leader') {
    return COMPANY_ARCHETYPES[2]; // enterprise-incumbent
  }
  
  // Niche Specialist: Smaller, focused, specialized
  if (size < 500 && marketPosition === 'niche') {
    return COMPANY_ARCHETYPES[3]; // niche-specialist
  }
  
  // Regional Player: Medium size, regional focus
  if (size > 100 && size < 1000 && marketPosition === 'follower') {
    return COMPANY_ARCHETYPES[4]; // regional-player
  }
  
  // Default to Fast-Growing Disruptor for startups
  return COMPANY_ARCHETYPES[1];
}

export function getIndustryPersonalizedContent(
  archetype: CompanyArchetype, 
  targetIndustry: string
): { situation: string; complication: string; futureState: string } {
  const industryCategory = TARGET_INDUSTRIES.find(cat => 
    cat.industries.some(ind => ind.toLowerCase().includes(targetIndustry.toLowerCase()))
  )?.category || 'Technology/SaaS';
  
  return archetype.industryVariations[industryCategory] || {
    situation: archetype.situation,
    complication: archetype.complication,
    futureState: archetype.futureState
  };
}

export function getArchetypeById(id: string): CompanyArchetype | undefined {
  return COMPANY_ARCHETYPES.find(archetype => archetype.id === id);
}

export function getAllArchetypes(): CompanyArchetype[] {
  return COMPANY_ARCHETYPES;
}

export function getTargetIndustries(): typeof TARGET_INDUSTRIES {
  return TARGET_INDUSTRIES;
}
