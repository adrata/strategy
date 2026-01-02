/**
 * PULL Framework Settings Service
 *
 * Allows sellers to document their product's PULL framework:
 * - What projects trigger buying (P)
 * - What urgency drivers create pressure to act NOW (U)
 * - What alternatives/options buyers consider (L)
 * - What limitations exist in those alternatives (L)
 *
 * This configuration powers:
 * - Discovery question generation
 * - AI assistant guidance during calls
 * - Market/company PULL scoring
 *
 * Based on Rob Snyder's PULL Framework from "The Path to Product-Market Fit"
 */

import { prisma } from "@/platform/prisma";

/**
 * PULL Framework Configuration
 *
 * This is what sellers document about their product's typical buyers
 */
export interface PullFrameworkConfig {
  // === PRODUCT CONTEXT ===
  productName: string;
  productDescription: string;
  primaryProblem: string; // The core problem you solve
  targetMarket: string;
  averageDealSize: number;

  // === P: PROJECT ===
  // What projects/initiatives trigger buyers to look for your solution?
  typicalProjects: string[]; // e.g., ["SOC 2 certification", "Enterprise customer requirement", "Security audit"]
  projectTriggers: string[]; // Events that put these projects on the to-do list
  relevantRoles: string[]; // Titles/roles who prioritize these projects

  // === U: URGENCY ===
  // What creates pressure to act NOW vs. later?
  urgencyDrivers: UrgencyDriver[];
  seasonalPatterns?: string[]; // e.g., ["Q4 budget cycles", "Annual compliance audits"]
  triggerEvents: string[]; // e.g., ["New funding", "Enterprise deal pending", "Regulatory deadline"]

  // === L: LIST OF OPTIONS ===
  // What alternatives do buyers consider?
  directCompetitors: string[]; // e.g., ["Vanta", "Drata", "Secureframe"]
  indirectAlternatives: string[]; // e.g., ["Hiring a compliance consultant", "Building in-house", "Manual spreadsheets"]
  statusQuoOption: string; // What they do if they don't buy anything

  // === L: LIMITATIONS ===
  // What limitations exist in those alternatives?
  competitorLimitations: CompetitorLimitation[];
  alternativeLimitations: AlternativeLimitation[];
  statusQuoLimitations: string[]; // Why doing nothing fails

  // === DISCOVERY GUIDANCE ===
  // Questions to ask during discovery
  pullDiscoveryQuestions: PullDiscoveryQuestion[];
  openingQuestion: string; // The first question to ask (usually "why did you take this call?")
  qualifyingSignals: string[]; // Signs they have PULL
  disqualifyingSignals: string[]; // Signs they don't have PULL

  // === PITCH GUIDANCE ===
  // How to pitch once PULL is identified
  valuePropositions: Record<string, string>; // Mapped to specific projects/urgencies
  objectionHandlers: Record<string, string>; // Mapped to specific limitations

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface UrgencyDriver {
  driver: string; // e.g., "Enterprise customer requiring SOC 2"
  intensity: "high" | "medium" | "low";
  timeframe: string; // e.g., "Usually need to act within 30-90 days"
  discoveryQuestion: string; // Question to uncover this urgency
}

export interface CompetitorLimitation {
  competitor: string;
  limitations: string[];
  differentiator: string; // How you're different/better
}

export interface AlternativeLimitation {
  alternative: string;
  limitations: string[];
  whyNotGoodEnough: string;
}

export interface PullDiscoveryQuestion {
  question: string;
  pullComponent: "project" | "urgency" | "list" | "limitations";
  purpose: string; // What you're trying to learn
  followUps: string[]; // Follow-up questions based on their answer
  goodAnswer: string; // What a good answer looks like (indicates PULL)
  badAnswer: string; // What a bad answer looks like (no PULL)
}

/**
 * Default PULL Discovery Flow
 *
 * Based on the latest article "How to start a sales call"
 */
export const DEFAULT_PULL_DISCOVERY_FLOW: PullDiscoveryQuestion[] = [
  {
    question:
      "Before we dive in, I'm curious - what made you take this call today? What were you hoping to get out of it?",
    pullComponent: "project",
    purpose: "Understand their immediate priority and if there's a project on their to-do list",
    followUps: [
      "Tell me more about that...",
      "What's driving that priority right now?",
      "How long has this been on your radar?",
    ],
    goodAnswer: "They describe a specific project or initiative they're working on",
    badAnswer:
      "Vague answer like 'just exploring' or 'my boss told me to take the call'",
  },
  {
    question:
      "Of all the things you could be focused on right now, why is this a priority?",
    pullComponent: "urgency",
    purpose: "Understand why NOW vs. later - the urgency driver",
    followUps: [
      "What happens if you don't address this in the next 90 days?",
      "Who else is feeling this pressure?",
      "What's the consequence of waiting?",
    ],
    goodAnswer:
      "They describe a deadline, external pressure, or consequence of inaction",
    badAnswer: "No clear timeline or pressure - could wait indefinitely",
  },
  {
    question: "What have you tried or looked into so far?",
    pullComponent: "list",
    purpose: "Understand what options they're considering",
    followUps: [
      "What did you think of that approach?",
      "What else are you considering?",
      "Have you looked at [specific competitor]?",
    ],
    goodAnswer: "They've actively evaluated alternatives and can articulate pros/cons",
    badAnswer: "Haven't looked at anything yet - too early in the process",
  },
  {
    question: "What's preventing you from just doing that / using what you have?",
    pullComponent: "limitations",
    purpose: "Understand why their current options aren't good enough",
    followUps: [
      "How is that impacting your team?",
      "What would need to be different?",
      "What's the cost of that limitation?",
    ],
    goodAnswer: "They can articulate specific limitations and frustrations",
    badAnswer: "Current approach is working fine - no clear pain",
  },
];

/**
 * Service for managing PULL Framework settings per workspace
 */
export class PullFrameworkSettingsService {
  /**
   * Get PULL framework settings for a workspace
   */
  static async getSettings(workspaceId: string): Promise<PullFrameworkConfig | null> {
    try {
      const workspace = await prisma.workspaces.findFirst({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
          customFields: true,
        },
      });

      if (!workspace?.customFields) {
        return null;
      }

      const customFields = workspace.customFields as Record<string, any>;
      return customFields.pullFrameworkConfig || null;
    } catch (error) {
      console.error("Error fetching PULL framework settings:", error);
      return null;
    }
  }

  /**
   * Save PULL framework settings for a workspace
   */
  static async saveSettings(
    workspaceId: string,
    config: PullFrameworkConfig
  ): Promise<boolean> {
    try {
      // Get existing custom fields
      const workspace = await prisma.workspaces.findFirst({
        where: { id: workspaceId },
        select: { customFields: true },
      });

      const existingFields = (workspace?.customFields as Record<string, any>) || {};

      // Update with PULL framework config
      await prisma.workspaces.update({
        where: { id: workspaceId },
        data: {
          customFields: {
            ...existingFields,
            pullFrameworkConfig: {
              ...config,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      console.log(`✅ PULL framework settings saved for workspace ${workspaceId}`);
      return true;
    } catch (error) {
      console.error("Error saving PULL framework settings:", error);
      return false;
    }
  }

  /**
   * Get PULL discovery questions (custom + defaults)
   */
  static async getDiscoveryQuestions(
    workspaceId: string
  ): Promise<PullDiscoveryQuestion[]> {
    const settings = await this.getSettings(workspaceId);

    if (settings?.pullDiscoveryQuestions?.length) {
      return settings.pullDiscoveryQuestions;
    }

    return DEFAULT_PULL_DISCOVERY_FLOW;
  }

  /**
   * Get the opening question for discovery
   */
  static async getOpeningQuestion(workspaceId: string): Promise<string> {
    const settings = await this.getSettings(workspaceId);

    return (
      settings?.openingQuestion ||
      "Before we dive in, I'm curious - what made you take this call today? What were you hoping to get out of it?"
    );
  }

  /**
   * Generate discovery guidance for AI assistant
   */
  static async generateDiscoveryGuidance(
    workspaceId: string,
    currentPullState: Partial<{
      project: string;
      urgency: string;
      list: string;
      limitations: string;
    }>
  ): Promise<{
    nextQuestion: string;
    purpose: string;
    missingComponents: string[];
    pullScore: number;
  }> {
    const settings = await this.getSettings(workspaceId);
    const questions = await this.getDiscoveryQuestions(workspaceId);

    // Determine which PULL components are missing
    const missingComponents: string[] = [];

    if (!currentPullState.project || currentPullState.project.toLowerCase().includes("unknown")) {
      missingComponents.push("project");
    }
    if (!currentPullState.urgency || currentPullState.urgency.toLowerCase().includes("unknown")) {
      missingComponents.push("urgency");
    }
    if (!currentPullState.list || currentPullState.list.toLowerCase().includes("unknown")) {
      missingComponents.push("list");
    }
    if (
      !currentPullState.limitations ||
      currentPullState.limitations.toLowerCase().includes("unknown")
    ) {
      missingComponents.push("limitations");
    }

    // Calculate PULL score (0-100)
    const pullScore = (4 - missingComponents.length) * 25;

    // Find the next question to ask
    let nextQuestion = "";
    let purpose = "";

    if (missingComponents.includes("project")) {
      const projectQ = questions.find((q) => q.pullComponent === "project");
      nextQuestion = projectQ?.question || DEFAULT_PULL_DISCOVERY_FLOW[0].question;
      purpose = "Understand what project/initiative they're prioritizing";
    } else if (missingComponents.includes("urgency")) {
      const urgencyQ = questions.find((q) => q.pullComponent === "urgency");
      nextQuestion = urgencyQ?.question || DEFAULT_PULL_DISCOVERY_FLOW[1].question;
      purpose = "Understand why they need to act NOW vs. later";
    } else if (missingComponents.includes("list")) {
      const listQ = questions.find((q) => q.pullComponent === "list");
      nextQuestion = listQ?.question || DEFAULT_PULL_DISCOVERY_FLOW[2].question;
      purpose = "Understand what alternatives they're considering";
    } else if (missingComponents.includes("limitations")) {
      const limitationsQ = questions.find((q) => q.pullComponent === "limitations");
      nextQuestion = limitationsQ?.question || DEFAULT_PULL_DISCOVERY_FLOW[3].question;
      purpose = "Understand why their current options aren't good enough";
    } else {
      // All PULL components filled - ready to pitch!
      nextQuestion = "Based on what you've shared, I think there's a strong fit. Would you like to see how we address [their specific project]?";
      purpose = "PULL identified - ready to pitch what fits their need";
    }

    return {
      nextQuestion,
      purpose,
      missingComponents,
      pullScore,
    };
  }

  /**
   * Get product-specific PULL signals for scoring companies
   */
  static async getPullSignals(workspaceId: string): Promise<{
    projectSignals: string[];
    urgencySignals: string[];
    listSignals: string[];
    limitationSignals: string[];
  }> {
    const settings = await this.getSettings(workspaceId);

    return {
      projectSignals: settings?.typicalProjects || [],
      urgencySignals: settings?.triggerEvents || [],
      listSignals: [
        ...(settings?.directCompetitors || []),
        ...(settings?.indirectAlternatives || []),
      ],
      limitationSignals: [
        ...(settings?.statusQuoLimitations || []),
        ...(settings?.competitorLimitations?.flatMap((c) => c.limitations) || []),
      ],
    };
  }

  /**
   * Create default settings for a new workspace
   */
  static getDefaultConfig(productName: string = "Your Product"): PullFrameworkConfig {
    return {
      productName,
      productDescription: "",
      primaryProblem: "",
      targetMarket: "",
      averageDealSize: 100000,

      // P: Project
      typicalProjects: [],
      projectTriggers: [],
      relevantRoles: ["VP", "Director", "Head of"],

      // U: Urgency
      urgencyDrivers: [],
      seasonalPatterns: [],
      triggerEvents: [],

      // L: List
      directCompetitors: [],
      indirectAlternatives: [],
      statusQuoOption: "Do nothing / maintain status quo",

      // L: Limitations
      competitorLimitations: [],
      alternativeLimitations: [],
      statusQuoLimitations: [],

      // Discovery
      pullDiscoveryQuestions: DEFAULT_PULL_DISCOVERY_FLOW,
      openingQuestion:
        "Before we dive in, I'm curious - what made you take this call today? What were you hoping to get out of it?",
      qualifyingSignals: [],
      disqualifyingSignals: [],

      // Pitch
      valuePropositions: {},
      objectionHandlers: {},
    };
  }
}

/**
 * Helper to build PULL-aware system prompt for AI assistant
 */
export function buildPullDiscoverySystemPrompt(
  pullConfig: PullFrameworkConfig | null,
  currentPullState?: Partial<{
    project: string;
    urgency: string;
    list: string;
    limitations: string;
  }>
): string {
  const hasConfig = pullConfig && pullConfig.productName;

  let prompt = `You are an expert B2B sales assistant helping with discovery calls using the PULL framework.

## PULL Framework (Rob Snyder - "The Path to Product-Market Fit")

PULL = Blocked Demand = Unavoidable Project meets Unworkable Options

A buyer will "rip your product out of your hands" when ALL FOUR are true:
- **P (Project)**: There is a PROJECT on their to-do list being prioritized NOW
- **U (Urgency)**: There is a reason the project is URGENT or unavoidable now
- **L (List)**: They consider a LIST of options for accomplishing this project
- **L (Limitations)**: The options have severe LIMITATIONS preventing progress

## Your Role During Discovery

1. **START WITH "WHY THIS CALL?"**
   - First question: "What made you take this call today? What were you hoping to get out of it?"
   - This often reveals their Project (P) and sometimes Urgency (U)

2. **FILL OUT THE PULL FRAMEWORK**
   - Ask questions to understand each component
   - If they answer vaguely, dig deeper with follow-ups
   - Put question marks next to things you don't fully understand

3. **ONLY PITCH WHAT FITS THEIR PULL**
   - Once you understand PULL, offer something that fits - nothing more, nothing less
   - No fancy demos or vision-casting needed
   - If they have PULL, they will PULL your product out of your hands

4. **IF NO PULL, DON'T FORCE IT**
   - If they don't have a prioritized project, they won't buy
   - Focus on understanding, not convincing
   - "Huh, seems like you're all set then?" can be a powerful clarifying question
`;

  if (hasConfig) {
    prompt += `
## SELLER'S PRODUCT CONTEXT

**Product**: ${pullConfig.productName}
**Problem Solved**: ${pullConfig.primaryProblem || "Not specified"}
**Target Market**: ${pullConfig.targetMarket || "Not specified"}
**Avg Deal Size**: $${pullConfig.averageDealSize?.toLocaleString() || "Unknown"}

### Typical Projects (P) that trigger buying:
${pullConfig.typicalProjects?.map((p) => `- ${p}`).join("\n") || "- Not yet documented"}

### Urgency Drivers (U) that create pressure to act NOW:
${pullConfig.triggerEvents?.map((t) => `- ${t}`).join("\n") || "- Not yet documented"}

### Alternatives buyers consider (L):
**Direct Competitors**: ${pullConfig.directCompetitors?.join(", ") || "Not documented"}
**Other Options**: ${pullConfig.indirectAlternatives?.join(", ") || "Not documented"}
**Status Quo**: ${pullConfig.statusQuoOption || "Do nothing"}

### Limitations of alternatives (L):
${pullConfig.statusQuoLimitations?.map((l) => `- ${l}`).join("\n") || "- Not yet documented"}
`;
  }

  if (currentPullState) {
    prompt += `
## CURRENT DISCOVERY STATE

What we know so far about this prospect's PULL:

**Project (P)**: ${currentPullState.project || "❓ Unknown - need to ask"}
**Urgency (U)**: ${currentPullState.urgency || "❓ Unknown - need to ask"}
**List (L)**: ${currentPullState.list || "❓ Unknown - need to ask"}
**Limitations (L)**: ${currentPullState.limitations || "❓ Unknown - need to ask"}
`;

    // Calculate what's missing
    const missing: string[] = [];
    if (!currentPullState.project) missing.push("Project");
    if (!currentPullState.urgency) missing.push("Urgency");
    if (!currentPullState.list) missing.push("List of options");
    if (!currentPullState.limitations) missing.push("Limitations");

    if (missing.length > 0) {
      prompt += `
**MISSING**: ${missing.join(", ")}

Your next question should help uncover: ${missing[0]}
`;
    } else {
      prompt += `
**ALL PULL COMPONENTS IDENTIFIED** - Ready to pitch what fits their specific need!
`;
    }
  }

  return prompt;
}
