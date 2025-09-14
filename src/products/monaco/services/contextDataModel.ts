/**
 * 🎯 CONTEXT DATA MODEL - JANE SUMMER & ADP DEAL
 * 
 * Smart, data-driven context for AI responses about Jane Summer and the ADP deal.
 * This model provides the LLM with specific, actionable intelligence for prospect questions.
 * Jane Summer is NOT part of the buyer group - demonstrates buyer group identification.
 */

export interface ContextPerson {
  name: string;
  role: string;
  company: string;
  keyInsights: string[];
  dealContext: string;
  engagementHistory: string[];
  painPoints: string[];
  businessPriorities: string[];
  decisionInfluence: number; // 1-100
  relationshipLevel: 'cold' | 'warm' | 'hot';
  nextBestAction: string;
}

export interface ContextDeal {
  dealName: string;
  company: string;
  dealSize: string;
  stage: string;
  timeline: string;
  keyStakeholders: string[];
  businessValue: string[];
  technicalRequirements: string[];
  competitiveLandscape: string[];
  riskFactors: string[];
  successMetrics: string[];
  closingStrategy: string;
}

export const JANE_SUMMER_CONTEXT: ContextPerson = {
  name: "Jane Summer",
  role: "Senior Marketing Manager",
  company: "ADP",
  keyInsights: [
    "Works in ADP's Marketing Communications department focusing on brand campaigns",
    "Not involved in technology procurement or sales intelligence initiatives",
    "Reports to Marketing Director, not part of technology decision-making hierarchy",
    "Has no budget authority or influence over enterprise technology purchases",
    "Outside the buyer group for sales intelligence platform evaluation"
  ],
  dealContext: "Jane Summer is not part of the ADP sales intelligence platform evaluation. She works in marketing communications and is not involved in technology procurement decisions.",
  engagementHistory: [
    "No direct engagement with sales intelligence platform evaluation",
    "Not included in technology vendor meetings or demos",
    "Focus remains on marketing campaigns and brand initiatives",
    "No involvement in Q4 technology budget allocation process"
  ],
  painPoints: [
    "Focused on marketing campaign effectiveness and brand awareness",
    "Not dealing with CRM or sales intelligence technology challenges",
    "Different priorities from the technology procurement team",
    "No visibility into sales team's technology needs"
  ],
  businessPriorities: [
    "Marketing campaign optimization",
    "Brand awareness and positioning",
    "Content marketing initiatives",
    "Marketing ROI measurement"
  ],
  decisionInfluence: 5,
  relationshipLevel: 'cold',
  nextBestAction: "Focus on actual buyer group members like Michael Chen (CTO) and Sarah Rodriguez (VP Engineering) who have decision-making authority"
};

export const ADP_DEAL_CONTEXT: ContextDeal = {
  dealName: "ADP Enterprise Sales Intelligence Platform",
  company: "ADP",
  dealSize: "$2.3M annually (3-year contract)",
  stage: "Discovery/Demo",
  timeline: "Q4 2024 decision timeline",
  keyStakeholders: [
    "Michael Chen (Decision Maker) - Chief Technology Officer",
    "Sarah Rodriguez (Champion) - VP Engineering", 
    "Jennifer Martinez (Champion) - VP Product Engineering",
    "James Wilson (Champion) - Director Platform Architecture",
    "Patricia Kim (Champion) - Senior Director Technology Procurement"
  ],
  businessValue: [
    "40% reduction in manual sales processes",
    "Unified intelligence platform across 50,000+ users",
    "Enhanced client experience through better insights",
    "Accelerated deal velocity with AI-powered recommendations"
  ],
  technicalRequirements: [
    "Multi-platform deployment (web, desktop, mobile)",
    "Enterprise-grade security and compliance",
    "Salesforce and HubSpot integration",
    "Real-time intelligence and analytics"
  ],
  competitiveLandscape: [
    "Outreach.io (primary competitor - lacks multi-platform approach)",
    "Salesforce Einstein (incumbent - limited intelligence depth)",
    "ZoomInfo (data provider - no platform integration)"
  ],
  riskFactors: [
    "Budget approval required by December 15th",
    "Integration complexity with legacy systems",
    "Change management across large organization",
    "Competitive evaluation process underway"
  ],
  successMetrics: [
    "User adoption rate >85% within 6 months",
    "Sales productivity increase of 35%",
    "Customer satisfaction score improvement",
    "Platform integration completed within 90 days"
  ],
  closingStrategy: "Technical validation → Executive buy-in → Legal/Procurement → Contract signature"
};

export const CONTEXT_FAQ = {
  janeSummer: {
    "Who is Jane Summer?": `Jane Summer is ADP's Senior Marketing Manager in the Marketing Communications department. She focuses on brand campaigns and marketing initiatives, but is NOT part of the buyer group for sales intelligence platform evaluation.`,
    
    "What's her role in the ADP deal?": `Jane Summer is NOT involved in the ADP sales intelligence platform deal. She works in marketing communications and has no decision-making authority for technology procurement. Her influence score is only 5/100 for this type of purchase.`,
    
    "What are her pain points?": `Jane's pain points are focused on marketing campaign effectiveness and brand awareness - completely different from the technology procurement team's challenges. She's not dealing with CRM or sales intelligence issues.`,
    
    "Why isn't she in the buyer group?": `Jane Summer is outside the buyer group because: 1) She's in Marketing, not Technology/Sales, 2) No budget authority for enterprise software, 3) Different reporting structure - reports to Marketing Director, not CTO, 4) No involvement in technology procurement decisions, 5) Focus on brand campaigns, not sales intelligence.`
  },
  
  adpDeal: {
    "What's the ADP deal about?": `ADP is evaluating next-generation sales intelligence platforms for their 50,000+ users. It's a $2.3M annually deal (3-year contract) with Q4 2024 decision timeline. The goal is platform consolidation and 40% productivity improvement.`,
    
    "What's the timeline?": `Q4 2024 decision timeline with budget approval required by December 15th. Technical demo is scheduled for next week, followed by executive buy-in and legal/procurement processes.`,
    
    "Who are the key stakeholders?": `Michael Chen (CTO - Decision Maker), Sarah Rodriguez (VP Engineering - Champion), James Wilson (Director Platform Architecture - Champion), and Patricia Kim (Senior Director Technology Procurement - Champion). Michael Chen has the highest influence at 95/100.`,
    
    "What are the technical requirements?": `Multi-platform deployment (web, desktop, mobile), enterprise-grade security, Salesforce and HubSpot integration, and real-time intelligence analytics. They need to integrate with legacy systems.`,
    
    "What's the competitive landscape?": `Primary competitors are Outreach.io (lacks multi-platform), Salesforce Einstein (limited intelligence depth), and ZoomInfo (no platform integration). Our multi-platform approach is the key differentiator.`
  }
};

// Enhanced AI Response Generator with LLM Integration
export class EnhancedAIResponseGenerator {
  
  /**
   * Generate smart, data-driven responses about Jane Summer and ADP deal
   */
  static generateContextualResponse(query: string): string | null {
    const lowerQuery = query.toLowerCase();
    
    // Jane Summer specific queries
    if (lowerQuery.includes('jane') || lowerQuery.includes('summer')) {
      if (lowerQuery.includes('who is') || lowerQuery.includes('about')) {
        return this.formatResponse(CONTEXT_FAQ['janeSummer']["Who is Jane Summer?"], 'person');
      }
      if (lowerQuery.includes('role') || lowerQuery.includes('responsibility')) {
        return this.formatResponse(CONTEXT_FAQ['janeSummer']["What's her role in the ADP deal?"], 'role');
      }
      if (lowerQuery.includes('pain') || lowerQuery.includes('challenge')) {
        return this.formatResponse(CONTEXT_FAQ['janeSummer']["What are her pain points?"], 'pain');
      }
      if (lowerQuery.includes('buyer group') || lowerQuery.includes('not in')) {
        return this.formatResponse(CONTEXT_FAQ['janeSummer']["Why isn't she in the buyer group?"], 'background');
      }
      
      // Default Jane response
      return this.formatResponse(
        `Jane Summer is ADP's Senior Marketing Manager, but she's NOT part of the buyer group for sales intelligence platform evaluation. She works in marketing communications with only 5/100 influence score for technology procurement decisions.`,
        'person'
      );
    }
    
    // ADP deal specific queries
    if (lowerQuery.includes('adp') && (lowerQuery.includes('deal') || lowerQuery.includes('opportunity'))) {
      if (lowerQuery.includes('timeline') || lowerQuery.includes('when')) {
        return this.formatResponse(CONTEXT_FAQ['adpDeal']["What's the timeline?"], 'timeline');
      }
      if (lowerQuery.includes('stakeholder') || lowerQuery.includes('decision maker')) {
        return this.formatResponse(CONTEXT_FAQ['adpDeal']["Who are the key stakeholders?"], 'stakeholders');
      }
      if (lowerQuery.includes('competitor') || lowerQuery.includes('competition')) {
        return this.formatResponse(CONTEXT_FAQ['adpDeal']["What's the competitive landscape?"], 'competitive');
      }
      if (lowerQuery.includes('requirement') || lowerQuery.includes('technical')) {
        return this.formatResponse(CONTEXT_FAQ['adpDeal']["What are the technical requirements?"], 'technical');
      }
      
      // Default ADP response
      return this.formatResponse(CONTEXT_FAQ['adpDeal']["What's the ADP deal about?"], 'deal');
    }
    
    // General queries about either topic
    if (lowerQuery.includes('adp') || lowerQuery.includes('jane')) {
      return this.formatResponse(
        `ADP Deal Summary: $2.3M annually (3-year) sales intelligence platform with Q4 2024 decision timeline. Jane Summer (Marketing Manager) is NOT part of the buyer group - she has no decision-making authority for technology procurement. The actual buyer group includes Michael Chen (CTO), Sarah Rodriguez (VP Engineering), James Wilson (Director Platform Architecture), and Patricia Kim (Senior Director Technology Procurement). Key focus: platform consolidation and 40% productivity improvement.`,
        'summary'
      );
    }
    
    return null; // Let other AI systems handle non-context queries
  }
  
  /**
   * Format response with appropriate structure
   */
  private static formatResponse(content: string, type: string): string {
    return `Smart Context Response\n\n${content}\n\nAsk me more: "What about the timeline?" or "Who are the competitors?" for deeper insights.`;
  }
} 