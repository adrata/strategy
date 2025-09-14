/**
 * OpenAI Service for Monaco Pipeline
 * NOW WITH SMART MODEL ROUTING FOR 80% COST REDUCTION
 */

import { OpenAI } from "openai";
import {
  SmartModelRouter,
  ModelTask,
} from "@/platform/services/smartModelRouter";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  workspaceId?: string;
  optimizeForCost?: boolean;
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private isAvailable: boolean = false;

  // Smart model selection based on task complexity and cost optimization
  private models = {
    // Premium reasoning models for complex strategic analysis
    premium: "o1-pro", // $150/$600 - Ultimate reasoning
    strategic: "gpt-4.5-preview", // $75/$150 - Advanced strategic analysis
    reasoning: "o3-pro", // $20/$80 - Cost-optimized reasoning

    // Standard models for routine tasks
    standard: "gpt-4o", // $2.50/$10 - Balanced performance
    efficient: "gpt-4o-mini", // $0.15/$0.60 - Cost-optimized

    // Specialized models
    latest: "gpt-4.1", // $2/$8 - Latest capabilities with caching
    search: "gpt-4o-search-preview", // $2.50/$10 - Web search enabled
  };

  constructor() {
    // Only initialize OpenAI client in server environment
    if (typeof window === "undefined" && process['env']['OPENAI_API_KEY']) {
      this['client'] = new OpenAI({
        apiKey: process['env']['OPENAI_API_KEY'],
      });
      this['isAvailable'] = true;
    } else {
      this['isAvailable'] = false;
    }
  }

  /**
   * Select the optimal model based on task type and complexity
   */
  private selectModel(
    taskType: "reasoning" | "strategic" | "standard" | "efficient" | "premium",
  ): string {
    // Use premium models for intelligence that justifies the cost
    switch (taskType) {
      case "premium":
        return this.models.premium; // o1-pro for ultimate intelligence
      case "strategic":
        return this.models.strategic; // gpt-4.5-preview for strategic analysis
      case "reasoning":
        return this.models.reasoning; // o3-pro for cost-optimized reasoning
      case "standard":
        return this.models.standard; // gpt-4o for balanced performance
      case "efficient":
        return this.models.efficient; // gpt-4o-mini for routine tasks
      default:
        return this.models.standard;
    }
  }

  /**
   * Generate content with AI-FIRST approach using OpenAI models
   * Offline processing disabled for comprehensive AI responses
   */
  async generateContent(
    prompt: string,
    options: GenerationOptions = {},
  ): Promise<string> {
    // SECURITY FIRST: Sanitize input to prevent injection attacks
    const sanitizedPrompt = SmartModelRouter.sanitizeInput(prompt);

    // OFFLINE PROCESSING DISABLED: Use AI for nearly all requests
    // const offlineCheck =
    //   SmartModelRouter.checkOfflineCapability(sanitizedPrompt);
    // if (offlineCheck['canHandleOffline'] && !options.model) {
    //   // Only log offline handling in development mode to prevent spam
    //   if (process['env']['NODE_ENV'] === 'development') {
    //     console.log("ZERO COST: Handled offline");
    //   }
    //   return offlineCheck.response || "Task completed offline";
    // }

    if (!this.isAvailable || !this.client) {
      return "Content generation not available in client environment";
    }

    const {
      temperature = 0.7,
      maxTokens = 1000,
      optimizeForCost = true,
      workspaceId,
    } = options;

    let selectedModel = options.model || "gpt-4o";
    let actualCost = 0;

    // Use smart model routing for cost optimization
    if (optimizeForCost) {
      try {
        const task: ModelTask = {
          type: "chat-basic",
          complexity:
            sanitizedPrompt.length > 1000
              ? "high"
              : sanitizedPrompt.length > 500
                ? "medium"
                : "low",
          priority: "medium",
          contentLength: sanitizedPrompt.length,
        };

        const selection = SmartModelRouter.selectOptimalModel(task);
        selectedModel = selection.model;

        console.log(
          `🎯 Smart routing: ${selection.model} (${selection.reasoning})`,
        );
      } catch (error) {
        console.warn("Smart routing failed, using default model:", error);
      }
    }

    try {
      const client = this.client;
      if (!client) {
        throw new Error("OpenAI client not initialized");
      }

      const response = await client.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "user",
            content: sanitizedPrompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        presence_penalty: 0,
        frequency_penalty: 0,
      });

      // Calculate actual cost for tracking
      const inputTokens = Math.ceil(sanitizedPrompt.length / 3);
      const outputTokens = Math.ceil(
        (response['choices'][0]?.message?.content?.length || 0) / 3,
      );

      // Cost calculation based on model used
      const modelCosts = {
        "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
        "gpt-4o": { input: 0.0025, output: 0.01 },
        "gpt-4": { input: 0.006, output: 0.012 },
        "o1-pro": { input: 0.075, output: 0.15 },
      };

      const costs =
        modelCosts[selectedModel as keyof typeof modelCosts] ||
        modelCosts["gpt-4o"];
      actualCost =
        (inputTokens * costs.input + outputTokens * costs.output) / 1000;

      console.log(`💰 Cost: $${actualCost.toFixed(4)} with ${selectedModel}`);

      return response['choices'][0]?.message?.content || "";
    } catch (error) {
      console.error("Error generating content:", error);
      throw error;
    }
  }

  /**
   * Generate directional intelligence with PREMIUM MODEL ROUTING
   */
  async generateDirectionalIntelligence(
    lead: any,
    enrichmentData: any = {},
    options: {
      personaType?:
        | "executive"
        | "technical"
        | "sales"
        | "marketing"
        | "default";
      stage?: "new" | "contacted" | "qualified" | "decision";
      companyContext?: any;
      length?: "succinct" | "detailed";
      workspaceId?: string;
    } = {},
  ): Promise<string> {
    // Return fallback intelligence if OpenAI is not available
    if (!this.isAvailable || !this.client) {
      return this.getFallbackDirectionalIntelligence(
        lead,
        options.personaType || "default",
        options.stage || "new",
      );
    }

    const {
      personaType = "default",
      stage = "new",
      companyContext = {},
      length = "succinct",
    } = options;

    // Use premium model routing for strategic intelligence
    const task: ModelTask = {
      type: "email-strategic",
      complexity: "high",
      priority: "high",
      contentLength: 1500,
    };

    const selection = SmartModelRouter.selectOptimalModel(task);

    const strategicPrompt = `
You are an elite management consultant with 15+ years at McKinsey, BCG, and Bain specializing in B2B sales strategy and competitive intelligence. Your analysis rivals the most expensive consulting engagements and provides insider-level strategic insights.

**CONTEXT DATA:**
- Lead: ${lead.name}, ${lead.title} at ${lead.company}
- Status: ${stage}
- Persona Type: ${personaType}
- Company Industry: ${companyContext.industry || "Technology"}
- Company Size: ${companyContext.size || "Mid-market"}
- Recent Activity: ${enrichmentData.recentActivity || "Platform evaluation phase"}

Generate ${length === "succinct" ? "2-3 sentences" : "4-5 sentences"} of strategic intelligence that provides genuine insider perspective and actionable insights.

Focus on timing, positioning, and execution tactics that give unfair competitive advantage.`;

    try {
      const response = await this.client!.chat.completions.create({
        model: selection.model,
        messages: [
          {
            role: "user",
            content: strategicPrompt,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: length === "succinct" ? 200 : 400,
      });

      return (
        response['choices'][0]?.message?.content?.trim() ||
        "Strategic intelligence analysis in progress..."
      );
    } catch (error) {
      console.error("Error with premium model, falling back:", error);
      return this.getFallbackDirectionalIntelligence(lead, personaType, stage);
    }
  }

  /**
   * Generate dynamic Adrata reports based on lead stage and role
   */
  async generateDynamicReports(
    lead: any,
    stage: string,
    role: string,
    companyData: any = {},
  ): Promise<
    Array<{
      type: string;
      title: string;
      description: string;
      urgency: "high" | "medium" | "low";
    }>
  > {
    // Return fallback reports if OpenAI is not available
    if (!this.isAvailable || !this.client) {
      return this.getFallbackReports(role, stage);
    }

    const reportPrompt = `
You are a strategic intelligence analyst generating critical reports for a sales professional targeting ${lead.name} (${lead.title}) at ${lead.company}.

**CONTEXT:**
- Lead Stage: ${stage}
- Stakeholder Role: ${role}
- Company: ${lead.company}
- Industry: ${companyData.industry || "Technology"}

**MISSION:**
Generate 4 report types that are so valuable and relevant to this specific stakeholder that they MUST respond and take a meeting. Each report should address critical business challenges this person faces daily.

**REPORT FRAMEWORK:**
Think step-by-step about what keeps this person awake at night:

1. **Strategic Challenge Analysis**: What major business problems does this role typically face?
2. **Industry Context**: What market forces are affecting their company specifically?
3. **Role-Specific Pain Points**: What metrics and objectives drive this person's success?
4. **Competitive Intelligence**: What insights would give them significant advantage?

**OUTPUT FORMAT:**
Return exactly 4 reports as JSON array with this structure:
[
  {
    "type": "competitive-mini",
    "title": "Report title that creates urgency",
    "description": "1-2 sentence description of unique value",
    "urgency": "high|medium|low"
  }
]

**REPORT TYPES TO CHOOSE FROM:**
- competitive-analysis: Competitive positioning and threat assessment
- growth-opportunities: Market expansion and revenue acceleration
- risk-assessment: Operational and strategic risk analysis  
- technology-audit: Infrastructure and platform evaluation
- market-intelligence: Industry trends and disruption patterns
- financial-optimization: Cost reduction and efficiency gains
- compliance-readiness: Regulatory and security preparation
- innovation-roadmap: Future-proofing and transformation strategy

**REQUIREMENTS:**
- Titles must create genuine urgency and curiosity
- Each report must be highly relevant to the specific role and company
- Avoid generic business advice - provide insider intelligence
- Focus on reports that position you as having unique market insights
- Consider it's 2025 - reference current business climate

Generate the 4 most compelling reports for this stakeholder:`;

    try {
      const response = await this.client!.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a strategic business intelligence analyst who creates irresistible value propositions for executives.",
          },
          {
            role: "user",
            content: reportPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 600,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(
        response['choices'][0]?.message?.content || '{"reports": []}',
      );
      return result.reports || this.getFallbackReports(role, stage);
    } catch (error) {
      console.error("Error generating dynamic reports:", error);
      return this.getFallbackReports(role, stage);
    }
  }

  private getFallbackDirectionalIntelligence(
    lead: any,
    personaType: string,
    stage: string,
  ): string {
    const fallbacks = {
      executive: {
        new: `${lead.company} faces Q2 infrastructure decisions amid 2025 acceleration trends. Board pressure for productivity gains creates 90-day implementation window favoring established platform providers.`,
        contacted: `Technical due diligence phase suggests ${lead.company} prioritizing integration capabilities over feature depth. Decision timeline accelerated by competitive positioning concerns.`,
        qualified: `Procurement review focuses on scalability metrics and vendor stability. ${lead.name}'s influence on final decision depends on technical team validation and CFO approval process.`,
      },
      technical: {
        new: `${lead.company}'s legacy architecture creates switching costs favoring gradual migration approach. Platform evaluation likely includes security audit and integration complexity assessment.`,
        contacted: `Technical stakeholder alignment indicates ${lead.name} evaluating API capabilities and system reliability. Proof-of-concept success drives executive support and budget allocation.`,
        qualified: `Implementation roadmap development suggests 90-day pilot program approach. Technical champion influence maximized through security compliance and performance validation.`,
      },
      default: {
        new: `Market consolidation pressure and 2025 trends create strategic imperative for ${lead.company} platform modernization. Timing favors decisive action over extended evaluation.`,
        contacted: `Stakeholder engagement patterns suggest consensus-building phase requiring champion enablement and competitive differentiation messaging.`,
        qualified: `Decision process enters final phase with focus on implementation timeline and success metrics. Stakeholder alignment critical for closing within current budget cycle.`,
      },
    };

    const category =
      fallbacks[personaType as keyof typeof fallbacks] || fallbacks.default;
    return category[stage as keyof typeof category] || category.new;
  }

  private getFallbackReports(
    role: string,
    stage: string,
  ): Array<{
    type: string;
    title: string;
    description: string;
    urgency: "high" | "medium" | "low";
  }> {
    const reportMap = {
      "Decision Maker": [
        {
          type: "competitive-analysis",
          title: "Competitive Threat Assessment: Q2 2025",
          description:
            "Strategic positioning analysis revealing competitor vulnerabilities and market opportunities.",
          urgency: "high" as const,
        },
        {
          type: "growth-opportunities",
          title: "Revenue Acceleration Opportunities",
          description:
            "Untapped market segments and expansion strategies based on industry analysis.",
          urgency: "high" as const,
        },
        {
          type: "risk-assessment",
          title: "Platform Risk Mitigation Strategy",
          description:
            "Critical infrastructure vulnerabilities and strategic risk reduction framework.",
          urgency: "medium" as const,
        },
        {
          type: "financial-optimization",
          title: "Cost Optimization Analysis",
          description:
            "Efficiency gains and cost reduction opportunities through platform consolidation.",
          urgency: "medium" as const,
        },
      ],
      Champion: [
        {
          type: "technology-audit",
          title: "Technology Stack Modernization Roadmap",
          description:
            "Infrastructure assessment and platform upgrade strategy for 2025-2026.",
          urgency: "high" as const,
        },
        {
          type: "competitive-analysis",
          title: "Platform Vendor Comparison Matrix",
          description:
            "Detailed analysis of leading platforms with implementation and ROI projections.",
          urgency: "high" as const,
        },
        {
          type: "innovation-roadmap",
          title: "Digital Transformation Strategy",
          description:
            "Technology adoption framework aligned with business objectives and market trends.",
          urgency: "medium" as const,
        },
        {
          type: "compliance-readiness",
          title: "Security & Compliance Assessment",
          description:
            "Regulatory compliance analysis and security framework evaluation.",
          urgency: "medium" as const,
        },
      ],
      Stakeholder: [
        {
          type: "market-intelligence",
          title: "Industry Trends Impact Analysis",
          description:
            "Market disruption patterns and strategic response recommendations.",
          urgency: "medium" as const,
        },
        {
          type: "growth-opportunities",
          title: "Market Expansion Strategy",
          description:
            "Growth opportunity analysis and competitive positioning framework.",
          urgency: "medium" as const,
        },
        {
          type: "risk-assessment",
          title: "Strategic Risk Analysis",
          description:
            "Business risk assessment and mitigation strategy development.",
          urgency: "low" as const,
        },
        {
          type: "financial-optimization",
          title: "Operational Efficiency Report",
          description:
            "Process optimization and cost reduction opportunity analysis.",
          urgency: "low" as const,
        },
      ],
      Opener: [
        {
          type: "market-intelligence",
          title: "Market Landscape Overview",
          description: "Industry context and competitive environment analysis.",
          urgency: "low" as const,
        },
        {
          type: "technology-audit",
          title: "Technology Assessment Overview",
          description:
            "High-level technology evaluation and modernization considerations.",
          urgency: "low" as const,
        },
        {
          type: "compliance-readiness",
          title: "Compliance Readiness Check",
          description:
            "Regulatory requirements and compliance framework overview.",
          urgency: "low" as const,
        },
        {
          type: "innovation-roadmap",
          title: "Innovation Opportunity Scan",
          description: "Technology trends and adoption opportunity assessment.",
          urgency: "low" as const,
        },
      ],
    };

    return (
      reportMap[role as keyof typeof reportMap] || reportMap["Stakeholder"]
    );
  }

  /**
   * Generate intelligent opportunity details with cost optimization
   */
  async generateIntelligentOpportunity(data: {
    leadName: string;
    leadTitle?: string | null;
    leadEmail?: string | null;
    leadPhone?: string | null;
    company?: string | null;
    industry: string;
    companySize: string;
    leadSource?: string | null;
    leadNotes?: string | null;
    bestProduct?: {
      name: string;
      category: string;
      avgDealSize: number;
      avgSalesCycle: number;
      winRate: number;
    } | null;
    workspaceId?: string;
  }): Promise<{
    title: string;
    description: string;
    estimatedValue: number;
    expectedCloseDate: Date;
    expectedSalesCycle: number;
    initialProbability: number;
    confidence: number;
    reasoning: string;
  }> {
    // Use smart routing for cost optimization
    const task: ModelTask = {
      type: "email-advanced",
      complexity: "medium",
      priority: "medium",
      contentLength: 800,
    };

    const selection = SmartModelRouter.selectOptimalModel(task);

    const prompt = `You are an expert sales strategist. Generate intelligent opportunity details from this lead data:

Lead Information:
- Name: ${data.leadName}
- Title: ${data.leadTitle || "Unknown"}
- Company: ${data.company || "Unknown"}
- Industry: ${data.industry}
- Company Size: ${data.companySize}
- Source: ${data.leadSource || "Unknown"}
- Notes: ${data.leadNotes || "None"}

${
  data.bestProduct
    ? `Recommended Product Match:
- Product: ${data.bestProduct.name}
- Category: ${data.bestProduct.category}
- Average Deal Size: $${data.bestProduct.avgDealSize.toLocaleString()}
- Average Sales Cycle: ${data.bestProduct.avgSalesCycle} days
- Win Rate: ${Math.round(data.bestProduct.winRate * 100)}%`
    : "No specific product match available"
}

Generate a JSON response with opportunity details optimized for ${data.companySize} companies in ${data.industry}.`;

    try {
      const response = await this.client!.chat.completions.create({
        model: selection.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response['choices'][0]?.message?.content || "{}");

      // Calculate expected close date
      const expectedCloseDate = new Date();
      expectedCloseDate.setDate(
        expectedCloseDate.getDate() + (result.expectedSalesCycle || 90),
      );

      return {
        title:
          result.title ||
          `${data.company} - ${data.bestProduct?.name || "Business Opportunity"}`,
        description:
          result.description ||
          `Opportunity to engage ${data.company} for our solutions.`,
        estimatedValue:
          Number(result.estimatedValue) ||
          data.bestProduct?.avgDealSize ||
          50000,
        expectedCloseDate,
        expectedSalesCycle:
          Number(result.expectedSalesCycle) ||
          data.bestProduct?.avgSalesCycle ||
          90,
        initialProbability: Number(result.initialProbability) || 0.3,
        confidence: Number(result.confidence) || 0.7,
        reasoning:
          result.reasoning || "Based on industry standards and company profile",
      };
    } catch (error) {
      console.error("Error generating intelligent opportunity:", error);

      // Fallback to default values
      const expectedCloseDate = new Date();
      expectedCloseDate.setDate(
        expectedCloseDate.getDate() + (data.bestProduct?.avgSalesCycle || 90),
      );

      return {
        title: `${data.company} - ${data.bestProduct?.name || "Business Opportunity"}`,
        description: `Opportunity to engage ${data.company} (${data.companySize} ${data.industry} company) for our ${data.bestProduct?.name || "solutions"}. Contact: ${data.leadName}${data.leadTitle ? ` (${data.leadTitle})` : ""}.`,
        estimatedValue: data.bestProduct?.avgDealSize || 50000,
        expectedCloseDate,
        expectedSalesCycle: data.bestProduct?.avgSalesCycle || 90,
        initialProbability: 0.3,
        confidence: 0.5,
        reasoning:
          "Fallback estimates based on product data and industry averages",
      };
    }
  }

  getIsAvailable(): boolean {
    return this.isAvailable;
  }
}

// Create and export a singleton instance
let openaiServiceInstance: OpenAIService | null = null;

export const openaiService = (() => {
  if (!openaiServiceInstance) {
    openaiServiceInstance = new OpenAIService();
  }
  return openaiServiceInstance;
})();
