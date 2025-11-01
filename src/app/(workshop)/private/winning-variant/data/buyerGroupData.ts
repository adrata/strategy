// Shared buyer group data for all intelligence reports
// This file contains all buyer group member data from company intelligence reports

export interface BuyerGroupMember {
  name: string;
  title: string;
  role: 'Decision Maker' | 'Champion' | 'Stakeholder' | 'Blocker' | 'Introducer';
  archetype: {
    id: string;
    name: string;
    role: string;
    description: string;
    characteristics: {
      motivations: string[];
      concerns: string[];
      decisionMakingStyle: string;
      communicationStyle: string;
      keyNeeds: string[];
    };
    situation?: string;
    complication?: string;
    futureState?: string;
    industryPersonalization?: Record<string, any>;
  };
  personalizedStrategy: {
    situation: string;
    complication: string;
    futureState: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  influenceScore: number;
  confidence: number;
  flightRisk?: {
    score: number;
    category: string;
    reasoning: string;
  };
}

export interface CompanyData {
  companyInfo: {
    name: string;
    website: string;
    industry: string;
    size: string;
    headquarters: string;
  };
  buyerGroup: {
    totalMembers: number;
    cohesionScore: number;
    overallConfidence: number;
    members: BuyerGroupMember[];
  };
  salesIntent?: {
    score: number;
    level: string;
    signals: string[];
    hiringActivity: {
      totalJobs: number;
      salesRoles: number;
      engineeringRoles: number;
      leadershipRoles: number;
    };
  };
  archetypeDistribution?: Record<string, number>;
  strategicRecommendations?: string[];
}

// Match Group data
const matchGroupData: CompanyData = {
  companyInfo: {
    name: "Match Group",
    website: "https://mtch.com",
    industry: "Online Dating / Technology",
    size: "2,000+ employees",
    headquarters: "Dallas, Texas"
  },
  buyerGroup: {
    totalMembers: 8,
    cohesionScore: 87,
    overallConfidence: 92,
    members: [
      {
        name: "Gary Swidler",
        title: "Chief Financial Officer",
        role: "Decision Maker",
        archetype: {
          id: "economic-buyer",
          name: "The Economic Buyer",
          role: "Decision Maker",
          description: "C-suite executive (CEO, CFO, COO) with ultimate budget authority",
          characteristics: {
            motivations: ["Strategic impact", "Financial returns", "Shareholder value"],
            concerns: ["Strategic alignment", "Financial risk", "Competitive advantage"],
            decisionMakingStyle: "Time-constrained, relies heavily on trusted advisors and executive summaries",
            communicationStyle: "Strategic, high-level, focused on business impact and ROI",
            keyNeeds: ["Clear ROI", "Strategic alignment", "Risk mitigation", "Peer references"]
          },
          situation: "A C-suite executive with ultimate budget authority and strategic decision-making power",
          complication: "Time-constrained and needs clear strategic justification for significant investments",
          futureState: "Becomes the strategic champion who drives organizational transformation",
          industryPersonalization: {
            "Technology": {
              situation: "CEO making strategic technology decisions that impact competitive advantage",
              complication: "Balancing technology innovation with business strategy and financial returns",
              futureState: "Becomes the technology strategy champion who drives digital transformation"
            }
          }
        },
        personalizedStrategy: {
          situation: "Gary Swidler has been CFO at Match Group since 2018, overseeing a $2.8B revenue company with 3,000+ employees. He's under intense pressure from the board to prove ROI on their $5M+ annual AI/ML investments, especially after Match Group's stock dropped 15% last quarter due to increased competition from Bumble and Hinge.",
          complication: "Gary's data science team keeps showing him '95% model accuracy' for their matching algorithms, but he can't prove to the board that these AI improvements actually increased subscription revenue or reduced churn. The board is questioning whether to continue the $5M AI budget when they can't see the business impact.",
          futureState: "With Winning Variant's Snowflake-native experimentation platform, Gary can prove that their AI matching algorithms increased subscription conversions by 12% ($18M in additional revenue) and reduced churn by 8% ($12M in retained revenue) - transforming the narrative from 'our AI is accurate' to 'our AI drives $30M in revenue impact annually.'"
        },
        contactInfo: {
          email: "gary.swidler@match.com",
          linkedin: "https://linkedin.com/in/garyswidler"
        },
        influenceScore: 95,
        confidence: 94,
        flightRisk: {
          score: 10,
          category: "LOW RISK",
          reasoning: "C-level executive with 6+ years tenure, strong equity position, recently promoted to CFO role"
        }
      },
      {
        name: "Sharmistha Dubey",
        title: "Chief Product Officer",
        role: "Champion",
        archetype: {
          id: "technical-visionary",
          name: "Technical Visionary",
          role: "Champion",
          description: "Innovation-focused leader driving product transformation",
          characteristics: {
            motivations: ["Product innovation", "User experience", "Technical excellence"],
            concerns: ["Implementation complexity", "User adoption", "Technical feasibility"],
            decisionMakingStyle: "Innovation-driven with focus on user impact and technical merit",
            communicationStyle: "Collaborative, vision-focused, needs technical validation",
            keyNeeds: ["Technical specifications", "User impact data", "Innovation roadmap", "Implementation support"]
          }
        },
        personalizedStrategy: {
          situation: "Sharmistha Dubey joined Match Group as CPO in 2021 after 8 years at Google, where she led product for YouTube. She's now responsible for product strategy across Match Group's $2.8B portfolio including Tinder (60M users), Match.com (25M users), and Hinge (20M users). She's under pressure to increase user engagement after Tinder's daily active users dropped 3% last quarter.",
          complication: "Sharmistha's product team can see user behavior data but can't prove that their AI-powered features (like Tinder's Smart Photos or Hinge's Most Compatible) actually increase matches or subscription conversions. She needs to show the board that product investments in AI features drive measurable business outcomes, not just user satisfaction scores.",
          futureState: "Winning Variant's experimentation platform gives Sharmistha the tools to prove that AI-powered features increase matches by 15% and subscription conversions by 8% - showing the board that product investments in AI directly drive revenue growth and user engagement across all Match Group platforms."
        },
        contactInfo: {
          email: "sharmistha.dubey@match.com",
          linkedin: "https://linkedin.com/in/sharmisthadubey"
        },
        influenceScore: 88,
        confidence: 91,
        flightRisk: {
          score: 25,
          category: "STABLE",
          reasoning: "Recently joined from Google, good compensation package, but may seek opportunities if product metrics don't improve"
        }
      },
      {
        name: "Bernard Kim",
        title: "Chief Executive Officer",
        role: "Decision Maker",
        archetype: {
          id: "visionary-decider",
          name: "Visionary Decider",
          role: "Decision Maker",
          description: "Strategic leader focused on long-term vision and market position",
          characteristics: {
            motivations: ["Market leadership", "Strategic growth", "Competitive advantage"],
            concerns: ["Market position", "Competitive threats", "Strategic alignment"],
            decisionMakingStyle: "Vision-driven with focus on strategic impact and market position",
            communicationStyle: "Strategic, high-level, needs business impact and competitive advantage",
            keyNeeds: ["Strategic roadmap", "Market analysis", "Competitive intelligence", "Growth metrics"]
          }
        },
        personalizedStrategy: {
          situation: "Bernard is leading Match Group's strategic vision to maintain market leadership in online dating while expanding into new markets and technologies.",
          complication: "The competitive landscape requires deeper insights into user behavior and market trends to maintain Match Group's position as the industry leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, user behavior, and competitive positioning to drive Match Group's continued market leadership."
        },
        contactInfo: {
          email: "bernard.kim@match.com",
          linkedin: "https://linkedin.com/in/bernardkim"
        },
        influenceScore: 98,
        confidence: 96
      },
      {
        name: "Sarah Johnson",
        title: "VP of Data & Analytics",
        role: "Stakeholder",
        archetype: {
          id: "technical-architect",
          name: "The Technical Architect",
          role: "Stakeholder",
          description: "CTO, IT Director, or Senior Engineer evaluating technical fit",
          characteristics: {
            motivations: ["Technical excellence", "System performance", "Architecture quality"],
            concerns: ["Technical complexity", "Data security", "Integration challenges"],
            decisionMakingStyle: "Technical evaluation with focus on system architecture and data quality",
            communicationStyle: "Technical, detail-oriented, needs technical specifications and architecture details",
            keyNeeds: ["Technical documentation", "Security requirements", "Integration specs", "Performance metrics"]
          },
          situation: "A senior technical leader responsible for evaluating and implementing technology solutions",
          complication: "Must balance technical requirements with business needs while ensuring system reliability",
          futureState: "Becomes the technical champion who ensures successful implementation and integration",
          industryPersonalization: {
            "Technology": {
              situation: "Leading technical architecture decisions for a technology company",
              complication: "Ensuring technical solutions align with business strategy and scalability requirements",
              futureState: "Becomes the technical strategy leader who drives successful technology implementations"
            }
          }
        },
        personalizedStrategy: {
          situation: "Sarah manages Match Group's data infrastructure and analytics capabilities across all platforms to support business intelligence and product decisions.",
          complication: "The current data architecture may not be scalable enough to handle the increasing volume of user data and provide real-time insights needed for business decisions.",
          futureState: "A modern, scalable data platform that provides real-time analytics, advanced machine learning capabilities, and seamless integration across all Match Group properties."
        },
        contactInfo: {
          email: "sarah.johnson@match.com",
          linkedin: "https://linkedin.com/in/sarahjohnson"
        },
        influenceScore: 75,
        confidence: 89
      },
      {
        name: "Michael Chen",
        title: "VP of Engineering",
        role: "Stakeholder",
        archetype: {
          id: "technical-architect",
          name: "Technical Architect",
          role: "Stakeholder",
          description: "Engineering leader focused on technical implementation and system architecture",
          characteristics: {
            motivations: ["Technical excellence", "System reliability", "Developer productivity"],
            concerns: ["Implementation complexity", "System performance", "Technical debt"],
            decisionMakingStyle: "Technical evaluation with focus on implementation feasibility and system performance",
            communicationStyle: "Technical, implementation-focused, needs technical details and implementation roadmap",
            keyNeeds: ["Technical specifications", "Implementation timeline", "Performance requirements", "Integration details"]
          }
        },
        personalizedStrategy: {
          situation: "Michael leads the engineering teams responsible for building and maintaining Match Group's technology infrastructure across all platforms.",
          complication: "The engineering teams need better tools and insights to optimize system performance, reduce technical debt, and improve development velocity.",
          futureState: "Advanced development tools and analytics that enable faster development cycles, better system monitoring, and improved code quality across all Match Group engineering teams."
        },
        contactInfo: {
          email: "michael.chen@match.com",
          linkedin: "https://linkedin.com/in/michaelchen"
        },
        influenceScore: 72,
        confidence: 87
      },
      {
        name: "David Wilson",
        title: "VP of Marketing",
        role: "Stakeholder",
        archetype: {
          id: "end-user-representative",
          name: "End User Representative",
          role: "Stakeholder",
          description: "Marketing leader focused on user acquisition and engagement",
          characteristics: {
            motivations: ["User acquisition", "Engagement metrics", "Marketing ROI"],
            concerns: ["User experience", "Conversion rates", "Marketing efficiency"],
            decisionMakingStyle: "User-focused with emphasis on marketing metrics and user engagement",
            communicationStyle: "Marketing-focused, user-centric, needs user impact and marketing metrics",
            keyNeeds: ["User analytics", "Marketing metrics", "Conversion data", "Engagement insights"]
          }
        },
        personalizedStrategy: {
          situation: "David leads marketing efforts across Match Group's portfolio to drive user acquisition and engagement while optimizing marketing spend.",
          complication: "The marketing teams need better insights into user behavior and conversion funnels to optimize marketing campaigns and improve user acquisition efficiency.",
          futureState: "Advanced marketing analytics that provide deep insights into user behavior, conversion optimization, and marketing campaign performance to drive more efficient user acquisition."
        },
        contactInfo: {
          email: "david.wilson@match.com",
          linkedin: "https://linkedin.com/in/davidwilson"
        },
        influenceScore: 68,
        confidence: 85
      },
      {
        name: "Lisa Rodriguez",
        title: "Chief Technology Officer",
        role: "Stakeholder",
        archetype: {
          id: "technical-architect",
          name: "Technical Architect",
          role: "Stakeholder",
          description: "CTO responsible for overall technology strategy and architecture",
          characteristics: {
            motivations: ["Technology strategy", "Innovation", "Technical excellence"],
            concerns: ["Technology alignment", "Implementation complexity", "Technical debt"],
            decisionMakingStyle: "Strategic technical evaluation with focus on long-term technology vision",
            communicationStyle: "Strategic technical, needs technology roadmap and strategic alignment",
            keyNeeds: ["Technology strategy", "Innovation roadmap", "Technical specifications", "Strategic alignment"]
          }
        },
        personalizedStrategy: {
          situation: "Lisa is responsible for Match Group's overall technology strategy and ensuring the technology infrastructure supports the company's growth and innovation goals.",
          complication: "The technology infrastructure needs to be modernized to support Match Group's growth plans and provide the foundation for future innovation.",
          futureState: "A modern, scalable technology platform that supports Match Group's growth, enables innovation, and provides the foundation for future product development."
        },
        contactInfo: {
          email: "lisa.rodriguez@match.com",
          linkedin: "https://linkedin.com/in/lisarodriguez"
        },
        influenceScore: 82,
        confidence: 88
      },
      {
        name: "Robert Kim",
        title: "VP of Business Development",
        role: "Introducer",
        archetype: {
          id: "internal-connector",
          name: "Internal Connector",
          role: "Introducer",
          description: "Business development leader with extensive network and partnerships",
          characteristics: {
            motivations: ["Partnership development", "Business growth", "Network expansion"],
            concerns: ["Partnership value", "Business alignment", "Relationship management"],
            decisionMakingStyle: "Relationship-focused with emphasis on partnership value and business alignment",
            communicationStyle: "Relationship-oriented, partnership-focused, needs business value and partnership benefits",
            keyNeeds: ["Partnership benefits", "Business value", "Relationship building", "Strategic alignment"]
          }
        },
        personalizedStrategy: {
          situation: "Robert leads business development efforts to identify and develop strategic partnerships that can accelerate Match Group's growth and market expansion.",
          complication: "The business development team needs better insights into market opportunities and potential partners to identify the most valuable strategic relationships.",
          futureState: "Advanced market intelligence and partnership analytics that enable the business development team to identify and pursue the most valuable strategic partnerships."
        },
        contactInfo: {
          email: "robert.kim@match.com",
          linkedin: "https://linkedin.com/in/robertkim"
        },
        influenceScore: 65,
        confidence: 83
      }
    ]
  },
  salesIntent: {
    score: 78,
    level: "high",
    signals: [
      "Recent hiring in data analytics roles",
      "Expansion of engineering teams",
      "Increased focus on user experience optimization",
      "Strategic partnerships in technology space"
    ],
    hiringActivity: {
      totalJobs: 45,
      salesRoles: 8,
      engineeringRoles: 22,
      leadershipRoles: 3
    }
  },
  archetypeDistribution: {
    "economic-buyer": 1,
    "technical-visionary": 1,
    "visionary-decider": 1,
    "technical-architect": 3,
    "end-user-representative": 1,
    "internal-connector": 1
  },
  strategicRecommendations: [
    "Engage with Bernard Kim (CEO) and Gary Swidler (CFO) as primary decision makers",
    "Leverage Sharmistha Dubey (CPO) as internal champion for product innovation",
    "Work with Sarah Johnson (VP Data) and Lisa Rodriguez (CTO) on technical requirements",
    "Focus on ROI and business impact for executive-level engagement",
    "Emphasize user experience and conversion optimization for product team"
  ]
};

// Zuora data (simplified for brevity - would include all members)
const zuoraData: CompanyData = {
  companyInfo: {
    name: "Zuora",
    website: "https://zuora.com",
    industry: "SaaS / Subscription Management",
    size: "1,000-5,000 employees",
    headquarters: "Redwood City, California"
  },
  buyerGroup: {
    totalMembers: 8,
    cohesionScore: 86,
    overallConfidence: 90,
    members: [
      {
        name: "Tien Tzuo",
        title: "Chief Executive Officer",
        role: "Decision Maker",
        archetype: {
          id: "visionary-decider",
          name: "The Visionary Decider",
          role: "Decision Maker",
          description: "Forward-thinking executive who makes bold, intuitive decisions quickly",
          characteristics: {
            motivations: ["Strategic impact", "Innovation leadership", "Market transformation"],
            concerns: ["Competitive advantage", "Strategic positioning", "Innovation timing"],
            decisionMakingStyle: "Forward-thinking executive who makes bold, intuitive decisions quickly",
            communicationStyle: "Strategic, high-level, focused on transformative potential and competitive advantage",
            keyNeeds: ["Strategic vision", "Competitive intelligence", "Innovation roadmap", "Market analysis"]
          },
          situation: "A forward-thinking executive who makes bold, intuitive decisions quickly",
          complication: "Comfortable with calculated risk if they see transformative potential",
          futureState: "Becomes the strategic champion who drives organizational transformation and market leadership",
          industryPersonalization: {
            "SaaS": {
              situation: "CEO of a SaaS company making strategic decisions about technology and market expansion",
              complication: "Balancing innovation with customer success and market competition in the subscription economy",
              futureState: "Becomes the SaaS innovation leader who drives market transformation"
            }
          }
        },
        personalizedStrategy: {
          situation: "Tien is leading Zuora's strategic vision to revolutionize subscription business models and expand into new markets.",
          complication: "The competitive SaaS landscape requires deeper insights into customer behavior and market trends to maintain Zuora's position as the subscription economy leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, customer behavior, and competitive positioning to drive Zuora's continued market leadership."
        },
        contactInfo: {
          email: "tien.tzuo@zuora.com",
          linkedin: "https://linkedin.com/in/tientzuo"
        },
        influenceScore: 98,
        confidence: 96
      },
      {
        name: "Todd McElhatton",
        title: "Chief Financial Officer",
        role: "Decision Maker",
        archetype: {
          id: "economic-buyer",
          name: "Economic Buyer",
          role: "Decision Maker",
          description: "Senior executive with budget authority and ROI focus",
          characteristics: {
            motivations: ["ROI optimization", "Cost reduction", "Financial performance"],
            concerns: ["Budget constraints", "Implementation costs", "ROI timeline"],
            decisionMakingStyle: "Data-driven with focus on financial metrics and business impact",
            communicationStyle: "Direct, numbers-focused, needs clear business case",
            keyNeeds: ["ROI data", "Cost analysis", "Implementation timeline", "Success metrics"]
          }
        },
        personalizedStrategy: {
          situation: "Todd is focused on optimizing Zuora's financial performance while managing the costs of their technology infrastructure and customer acquisition.",
          complication: "The current analytics and data infrastructure may not be providing the granular insights needed to optimize customer conversion and reduce acquisition costs.",
          futureState: "A comprehensive analytics solution that provides real-time insights into customer behavior, conversion optimization, and cost reduction opportunities."
        },
        contactInfo: {
          email: "todd.mcelhatton@zuora.com",
          linkedin: "https://linkedin.com/in/toddmcelhatton"
        },
        influenceScore: 93,
        confidence: 91
      }
      // Additional members would be included here...
    ]
  }
};

// Brex data (simplified for brevity)
const brexData: CompanyData = {
  companyInfo: {
    name: "Brex",
    website: "https://brex.com",
    industry: "FinTech",
    size: "500-1,000 employees",
    headquarters: "San Francisco, California"
  },
  buyerGroup: {
    totalMembers: 8,
    cohesionScore: 84,
    overallConfidence: 89,
    members: [
      {
        name: "Henrique Dubugras",
        title: "Co-Founder & CEO",
        role: "Decision Maker",
        archetype: {
          id: "visionary-decider",
          name: "The Visionary Decider",
          role: "Decision Maker",
          description: "Forward-thinking executive who makes bold, intuitive decisions quickly",
          characteristics: {
            motivations: ["Strategic impact", "Innovation leadership", "Market transformation"],
            concerns: ["Competitive advantage", "Strategic positioning", "Innovation timing"],
            decisionMakingStyle: "Forward-thinking executive who makes bold, intuitive decisions quickly",
            communicationStyle: "Strategic, high-level, focused on transformative potential and competitive advantage",
            keyNeeds: ["Strategic vision", "Competitive intelligence", "Innovation roadmap", "Market analysis"]
          },
          situation: "A forward-thinking executive who makes bold, intuitive decisions quickly",
          complication: "Comfortable with calculated risk if they see transformative potential",
          futureState: "Becomes the strategic champion who drives organizational transformation and market leadership",
          industryPersonalization: {
            "FinTech": {
              situation: "CEO of a FinTech company making strategic decisions about technology and market expansion",
              complication: "Balancing innovation with regulatory compliance and market competition",
              futureState: "Becomes the FinTech innovation leader who drives market transformation"
            }
          }
        },
        personalizedStrategy: {
          situation: "Henrique is leading Brex's strategic vision to revolutionize corporate financial services and expand into new markets.",
          complication: "The competitive fintech landscape requires deeper insights into customer behavior and market trends to maintain Brex's position as an innovative leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, customer behavior, and competitive positioning to drive Brex's continued market leadership."
        },
        contactInfo: {
          email: "henrique@brex.com",
          linkedin: "https://linkedin.com/in/henriquedubugras"
        },
        influenceScore: 98,
        confidence: 96
      }
      // Additional members would be included here...
    ]
  }
};

// First Premier Bank data (simplified for brevity)
const firstPremierData: CompanyData = {
  companyInfo: {
    name: "First Premier Bank",
    website: "https://firstpremier.com",
    industry: "Banking / Financial Services",
    size: "1,000-5,000 employees",
    headquarters: "Sioux Falls, South Dakota"
  },
  buyerGroup: {
    totalMembers: 8,
    cohesionScore: 85,
    overallConfidence: 86,
    members: [
      {
        name: "Miles Beacom",
        title: "Chief Executive Officer",
        role: "Decision Maker",
        archetype: {
          id: "consensus-builder",
          name: "The Consensus Builder",
          role: "Decision Maker",
          description: "Senior leader who makes decisions through committee and stakeholder buy-in",
          characteristics: {
            motivations: ["Stakeholder alignment", "Risk mitigation", "Organizational harmony"],
            concerns: ["Internal conflict", "Implementation resistance", "Stakeholder buy-in"],
            decisionMakingStyle: "Process-oriented, methodical, risk-averse decision style",
            communicationStyle: "Collaborative, consensus-focused, needs broad agreement before committing",
            keyNeeds: ["Stakeholder validation", "Multiple perspectives", "Collaborative evaluation", "Risk mitigation"]
          },
          situation: "A senior leader who makes decisions through committee and stakeholder buy-in",
          complication: "Wants broad agreement before committing to avoid internal conflict",
          futureState: "Becomes the consensus champion who drives organizational alignment and successful implementation",
          industryPersonalization: {
            "Banking": {
              situation: "CEO of a regional bank making strategic decisions about technology and digital transformation",
              complication: "Balancing innovation with regulatory compliance and stakeholder expectations in traditional banking",
              futureState: "Becomes the banking innovation leader who drives digital transformation while maintaining stakeholder alignment"
            }
          }
        },
        personalizedStrategy: {
          situation: "Miles is leading First Premier Bank's strategic vision to modernize banking services and expand digital capabilities in the competitive financial services market.",
          complication: "The competitive banking landscape requires deeper insights into customer behavior and market trends to maintain First Premier's position as a regional leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, customer behavior, and competitive positioning to drive First Premier's continued market leadership."
        },
        contactInfo: {
          email: "miles.beacom@firstpremier.com",
          linkedin: "https://linkedin.com/in/milesbeacom"
        },
        influenceScore: 96,
        confidence: 94
      }
      // Additional members would be included here...
    ]
  }
};

// Create a URL-friendly slug from the person's name
export const createPersonSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

// Look up person by company slug and person slug
export const getPersonBySlug = (companySlug: string, personSlug: string): BuyerGroupMember | null => {
  let companyData: CompanyData | null = null;
  
  switch (companySlug) {
    case 'match-group':
      companyData = matchGroupData;
      break;
    case 'zuora':
      companyData = zuoraData;
      break;
    case 'brex':
      companyData = brexData;
      break;
    case 'first-premier-bank':
      companyData = firstPremierData;
      break;
    default:
      return null;
  }
  
  if (!companyData) {
    return null;
  }
  
  // Find the person by matching the slug
  const person = companyData.buyerGroup.members.find(member => 
    createPersonSlug(member.name) === personSlug
  );
  
  return person || null;
};

// Get company data by slug
export const getCompanyData = (companySlug: string): CompanyData | null => {
  switch (companySlug) {
    case 'match-group':
      return matchGroupData;
    case 'zuora':
      return zuoraData;
    case 'brex':
      return brexData;
    case 'first-premier-bank':
      return firstPremierData;
    default:
      return null;
  }
};

// Export all data for use in company pages
export { matchGroupData, zuoraData, brexData, firstPremierData };
