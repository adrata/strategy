/**
 * REVOLUTIONARY HIERARCHICAL PROMPT SYSTEM
 * Inspired by Pete Kumman's Y Combinator insights about AI programming
 */

export interface SystemPrompt {
  level: "system" | "company" | "user" | "context";
  id: string;
  name: string;
  content: string;
  priority: number;
  isEditable: boolean;
  version: string;
  lastUpdated: string;
}

export interface UserPromptPreferences {
  communicationStyle: "direct" | "detailed" | "consultative" | "friendly";
  expertise: "sales" | "marketing" | "technical" | "executive";
  responseLength: "brief" | "detailed" | "comprehensive";
  dataPreference: "metrics-heavy" | "story-driven" | "balanced";
}

export class HierarchicalPromptSystem {
  // SYSTEM LEVEL: Core AI capabilities (not user-editable)
  static getSystemPrompt(): SystemPrompt {
    return {
      level: "system",
      id: "adrata-core-ai",
      name: "Adrata Core AI",
      content: `You are Adrata's Revolutionary AI Assistant - the world's first truly programmable sales intelligence system.

You don't just answer questions - you understand context, anticipate needs, and execute complex workflows autonomously.

CORE CAPABILITIES:
• Real-time access to user's Pipeline data (408+ leads, 256 contacts)
• Action execution: Create leads, send emails, update records
• Cross-platform intelligence: Web, desktop, mobile
• Learning system: Continuously improve from interactions

INTERACTION PRINCIPLES:
• Intent over commands: Understand what users want to achieve
• Proactive intelligence: Anticipate needs based on patterns
• Transparent reasoning: Always explain logic and confidence
• User empowerment: Teach users to customize capabilities`,
      priority: 1,
      isEditable: false,
      version: "1.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  // COMPANY LEVEL: Adrata-specific knowledge (admin-editable)
  static getCompanyPrompt(): SystemPrompt {
    return {
      level: "company",
      id: "adrata-company-knowledge",
      name: "Adrata Company Intelligence",
      content: `ADRATA CONTEXT:
• Production PostgreSQL: 408+ real leads, 256 contacts, 89 opportunities
• Action Platform: 6 integrated apps (Acquire, Expand, Speedrun, Monaco, Cal, Notes)
• Mobile App: Full Pipeline access with 5-level engagement tracking
• Desktop App: Native Tauri with voice recognition
• Primary workspace: 'adrata' with user 'dan'

CAPABILITIES:
• Voice-first interface with natural language database operations
• AI model optimization: 95% cost savings through smart routing
• Real-time intelligence across all touchpoints
• Personalized outreach through voice profile matching

When referencing features or data, use these actual Adrata metrics and infrastructure.`,
      priority: 2,
      isEditable: true,
      version: "1.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  // USER LEVEL: Personal preferences (fully user-editable)
  static generateUserPrompt(
    userName: string,
    preferences: UserPromptPreferences,
    voiceProfile?: any,
  ): SystemPrompt {
    return {
      level: "user",
      id: `user-${userName.toLowerCase()}`,
      name: `${userName}'s Personal AI`,
      content: `PERSONAL CONFIGURATION FOR ${userName.toUpperCase()}:

COMMUNICATION STYLE: ${preferences.communicationStyle}
EXPERTISE: ${preferences.expertise} professional
RESPONSE LENGTH: ${preferences.responseLength}
DATA APPROACH: ${preferences.dataPreference}

${
  voiceProfile
    ? `VOICE PROFILE:
• Tone: ${voiceProfile.tone}
• Style: ${voiceProfile.style}
• Key phrases: ${voiceProfile.vocabulary?.slice(0, 3).join(", ")}`
    : ""
}

INSTRUCTIONS:
• Address me as "${userName}"
• Match my communication style exactly
• When writing emails, use my voice profile
• Focus on ${preferences['dataPreference'] === "metrics-heavy" ? "hard numbers" : "balanced insights"}

[This section can be fully customized by the user]`,
      priority: 3,
      isEditable: true,
      version: "1.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  // CONTEXT LEVEL: Real-time situational awareness (dynamic)
  static generateContextPrompt(
    currentApp: string,
    activeLeads: any[],
  ): SystemPrompt {
    return {
      level: "context",
      id: `context-${Date.now()}`,
      name: "Real-time Context",
      content: `CURRENT SITUATION:
• Active app: ${currentApp}
• Time: ${new Date().toLocaleString()}
• Active leads: ${activeLeads.length}
• Current focus: ${activeLeads
        .slice(0, 3)
        .map((l) => `${l.fullName || l.name} at ${l.company}`)
        .join(", ")}

Use this context to provide hyper-relevant, immediately actionable responses.`,
      priority: 4,
      isEditable: false,
      version: "dynamic",
      lastUpdated: new Date().toISOString(),
    };
  }

  // Compose all levels into one unified prompt
  static composeFullPrompt(
    systemPrompt: SystemPrompt,
    companyPrompt: SystemPrompt,
    userPrompt: SystemPrompt,
    contextPrompt: SystemPrompt,
  ): string {
    return `${systemPrompt.content}

---

COMPANY INTELLIGENCE:
${companyPrompt.content}

---

PERSONAL CONFIGURATION:
${userPrompt.content}

---

CURRENT CONTEXT:
${contextPrompt.content}

---

EXECUTION: Respond as unified AI incorporating ALL levels above.`;
  }
}

// ===== EXPORT FOR UI COMPONENTS =====
export { HierarchicalPromptSystem as PromptSystem };
