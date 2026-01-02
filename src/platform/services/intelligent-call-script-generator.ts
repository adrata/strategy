/**
 * INTELLIGENT CALL SCRIPT GENERATOR
 *
 * Generates personalized call scripts using:
 * - User's voice profile and communication style
 * - Real Pipeline data and lead context
 * - Company intelligence and market insights
 * - Dynamic objection handling paths
 */

export interface CallScriptContext {
  leadName: string;
  leadTitle: string;
  leadCompany: string;
  leadIndustry?: string;
  leadPhone: string;
  leadEmail?: string;
  leadLinkedIn?: string;
  leadBio?: string;
  companySize?: string;
  recentActivity?: string;
  mutualConnections?: string[];
  companyNews?: string;
  callPurpose:
    | "discovery"
    | "demo"
    | "follow-up"
    | "closing"
    | "objection-handling";
}

export interface VoiceProfile {
  tone: string;
  style: string;
  vocabulary: string[];
  personalityTraits: string[];
  signatureElements: string[];
}

export interface CallScript {
  id: string;
  leadName: string;
  callPurpose: string;
  estimatedDuration: string;
  confidence: number;

  // Script sections
  opening: CallScriptSection;
  rapport: CallScriptSection;
  discovery: CallScriptSection;
  presentation: CallScriptSection;
  objections: CallScriptSection;
  closing: CallScriptSection;

  // Supporting materials
  talkingPoints: string[];
  objectionHandlers: ObjectionHandler[];
  nextSteps: string[];
  fallbackOptions: string[];

  generatedAt: Date;
}

export interface CallScriptSection {
  title: string;
  content: string;
  duration: string;
  keyPoints: string[];
  alternatives: string[];
}

export interface ObjectionHandler {
  objection: string;
  category: "price" | "timing" | "authority" | "need" | "trust";
  response: string;
  followUp: string;
}

export class IntelligentCallScriptGenerator {
  // ===== MAIN GENERATION METHOD =====
  static async generateCallScript(
    context: CallScriptContext,
    voiceProfile: VoiceProfile,
    userPreferences: any = {},
  ): Promise<CallScript> {
    // Simulate API delay for realistic experience
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const script: CallScript = {
      id: `call_${Date.now()}_${context.leadName.replace(/\s+/g, "_").toLowerCase()}`,
      leadName: context.leadName,
      callPurpose: context.callPurpose,
      estimatedDuration: this.calculateDuration(context.callPurpose),
      confidence: this.calculateConfidence(context, voiceProfile),

      opening: this.generateOpening(context, voiceProfile),
      rapport: this.generateRapport(context, voiceProfile),
      discovery: this.generateDiscovery(context, voiceProfile),
      presentation: this.generatePresentation(context, voiceProfile),
      objections: this.generateObjectionHandling(context, voiceProfile),
      closing: this.generateClosing(context, voiceProfile),

      talkingPoints: this.generateTalkingPoints(context),
      objectionHandlers: this.generateObjectionHandlers(context, voiceProfile),
      nextSteps: this.generateNextSteps(context.callPurpose),
      fallbackOptions: this.generateFallbackOptions(context),

      generatedAt: new Date(),
    };

    return script;
  }

  // ===== SCRIPT SECTION GENERATORS =====

  private static generateOpening(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): CallScriptSection {
    const greeting = this.getVoiceAppropriatGreeting(voice, context.leadName);
    const opener = this.getPersonalizedOpener(context, voice);

    return {
      title: "Opening & Introduction",
      content: `${greeting}

${opener}

The reason for my call is ${this.getCallReason(context.callPurpose, context.leadCompany)}.

I know you're busy, so I'll be respectful of your time. This should take about ${this.calculateDuration(context.callPurpose)}.

Does that work for you, or is there a better time to chat?`,
      duration: "1-2 minutes",
      keyPoints: [
        "Warm, professional greeting",
        "Clear reason for calling",
        "Respect their time",
        "Get permission to continue",
      ],
      alternatives: [
        `More casual: "Hey [Name], hope I'm not catching you at a bad time..."`,
        `More formal: "Good [morning/afternoon] [Name], I hope you're having a great day..."`,
      ],
    };
  }

  private static generateRapport(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): CallScriptSection {
    const rapportTopics = this.getRapportTopics(context);

    return {
      title: "Building Rapport",
      content: `Before we dive in, ${rapportTopics[0]}

${context.companyNews ? `I saw that ${context.leadCompany} ${context.companyNews}. That must be exciting for the team.` : ""}

${context.mutualConnections?.length ? `By the way, I believe you know ${context['mutualConnections'][0]} - they speak very highly of you.` : ""}

How are things going on your end?`,
      duration: "2-3 minutes",
      keyPoints: [
        "Find common ground",
        "Show genuine interest",
        "Reference recent company activity",
        "Keep it conversational",
      ],
      alternatives: [
        "Skip if time is limited",
        "Extend if they seem engaged",
        "Pivot to business if they seem rushed",
      ],
    };
  }

  private static generateDiscovery(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): CallScriptSection {
    const discoveryQuestions = this.getDiscoveryQuestions(context);

    return {
      title: "PULL Discovery Framework",
      content: `## THE GOAL: Fill out their PULL framework

PULL = Blocked Demand = Unavoidable Project meets Unworkable Options

**START HERE - Ask why they took the call:**
"Before we dive in, I'm curious - what made you take this call today? What were you hoping to get out of it?"

[Their answer often reveals P (Project) and sometimes U (Urgency)]

**FILL OUT THE PULL FRAMEWORK:**

P = PROJECT: What's on their to-do list being prioritized NOW?
${discoveryQuestions[0]}

U = URGENCY: Why must they act NOW vs. later?
${discoveryQuestions[1]}

L = LIST: What options are they considering?
${discoveryQuestions[2]}

L = LIMITATIONS: Why aren't current options good enough?
${discoveryQuestions[3]}

[PUT QUESTION MARKS NEXT TO THINGS YOU DON'T FULLY UNDERSTAND]
[IF THEY ANSWER VAGUELY: "Tell me more about that..." / "Help me understand..."]
[IF YOU CAN'T FIND PULL: "Huh, seems like you're all set then?"]

**WHEN PULL IS IDENTIFIED: Only pitch what fits their PULL - nothing more!**`,
      duration: "5-8 minutes",
      keyPoints: [
        "Start with 'Why did you take this call?'",
        "Fill out P-U-L-L through questions",
        "Put ? next to unclear answers",
        "Only pitch what fits their PULL",
      ],
      alternatives: [
        "If no PULL found: They won't buy right now - that's OK",
        "If partial PULL: Dig deeper on missing components",
        "If clear PULL: Move to pitch that fits their specific need",
      ],
    };
  }

  private static generatePresentation(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): CallScriptSection {
    const valueProps = this.getValuePropositions(context);

    return {
      title: "Solution Presentation",
      content: `Based on what you've shared, I think there's a really strong fit here.

Let me share how we've helped other ${context.leadIndustry || "companies like yours"}:

${valueProps.map((prop) => `• ${prop}`).join("\n")}

Specifically for ${context.leadCompany}, I could see this helping with:
• [Reference their specific pain points from discovery]
• [Connect to their stated priorities]
• [Quantify the potential impact]

Does this resonate with what you're trying to achieve?`,
      duration: "3-5 minutes",
      keyPoints: [
        "Tie back to their needs",
        "Use specific examples",
        "Quantify the value",
        "Check for understanding",
      ],
      alternatives: [
        "Keep it high-level if early conversation",
        "Get detailed if they show strong interest",
        "Pivot if you misread their needs",
      ],
    };
  }

  private static generateObjectionHandling(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): CallScriptSection {
    return {
      title: "Objection Handling",
      content: `[BE PREPARED FOR COMMON OBJECTIONS]

"We're not ready..." 
→ "I understand timing is important. What would need to change for this to become a priority?"

"We don't have budget..."
→ "I get it - budget planning is crucial. Help me understand your process for evaluating new investments like this."

"I need to think about it..."
→ "Of course - this is an important decision. What specific areas would you like to think through? Maybe I can help clarify those."

"We're happy with our current solution..."
→ "That's great to hear! What's working well with your current approach? And where do you see room for improvement?"

[ALWAYS ACKNOWLEDGE, CLARIFY, AND REDIRECT]`,
      duration: "2-4 minutes",
      keyPoints: [
        "Listen to the full objection",
        "Acknowledge their concern",
        "Ask clarifying questions",
        "Provide thoughtful response",
      ],
      alternatives: [
        "If price objection: Focus on ROI",
        "If timing objection: Explore urgency",
        "If authority objection: Identify decision maker",
      ],
    };
  }

  private static generateClosing(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): CallScriptSection {
    const nextSteps = this.getNextStepOptions(context.callPurpose);

    return {
      title: "Call Closing",
      content: `${context.leadName}, this has been a great conversation. I'm excited about the potential to work together.

Based on what we've discussed, I think the logical next step would be to ${nextSteps[0]}.

Are you available ${this.getSuggestedTimeframe(context.callPurpose)}? I can send you a calendar invite right after our call.

Is there anything else you'd like to know before we wrap up?

Perfect! I'll follow up with ${this.getFollowUpCommitment(context.callPurpose)} and we'll get that meeting scheduled.

Thanks for your time today, ${context.leadName}. Looking forward to continuing the conversation!`,
      duration: "2-3 minutes",
      keyPoints: [
        "Summarize the value",
        "Propose clear next steps",
        "Get specific commitment",
        "End on positive note",
      ],
      alternatives: [
        'If not ready: "What would make sense as a first step?"',
        'If very interested: "Should we move quickly on this?"',
        'If hesitant: "What concerns can I address?"',
      ],
    };
  }

  // ===== HELPER METHODS =====

  private static getVoiceAppropriatGreeting(
    voice: VoiceProfile,
    leadName: string,
  ): string {
    if (
      voice.tone.toLowerCase().includes("casual") ||
      voice.tone.toLowerCase().includes("friendly")
    ) {
      return `Hi ${leadName}!`;
    } else if (voice.tone.toLowerCase().includes("professional")) {
      return `Hello ${leadName},`;
    } else {
      return `Hi ${leadName},`;
    }
  }

  private static getPersonalizedOpener(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): string {
    const openers = [
      `I've been researching ${context.leadCompany} and I'm really impressed with your growth in the ${context.leadIndustry || "industry"}.`,
      `I came across your profile on LinkedIn and your background in ${context.leadTitle} caught my attention.`,
      `A colleague mentioned ${context.leadCompany} as an innovative leader in ${context.leadIndustry || "your space"}.`,
    ];

    return openers[0] || "Hello, how are you today?"; // Fallback opening line
  }

  private static getCallReason(purpose: string, company: string): string {
    const reasons = {
      discovery: `to learn more about ${company}'s current challenges and see if there's a fit for how we help similar organizations`,
      demo: `to show you a quick demo of how we've helped companies like ${company} achieve similar results`,
      "follow-up": `to follow up on our previous conversation and answer any questions you might have`,
      closing: `to discuss moving forward with the proposal we sent over`,
      "objection-handling": `to address the concerns you raised and make sure you have all the information you need`,
    };

    return reasons[purpose as keyof typeof reasons] || reasons.discovery;
  }

  private static getRapportTopics(context: CallScriptContext): string[] {
    const topics = [];

    if (context.companyNews) {
      topics.push(`I saw the news about ${context.companyNews}.`);
    }

    if (context.leadLinkedIn) {
      topics.push(
        `I noticed on LinkedIn that you've been with ${context.leadCompany} for a while now.`,
      );
    }

    topics.push(`I'm curious about your experience as ${context.leadTitle}.`);

    return topics;
  }

  private static getDiscoveryQuestions(context: CallScriptContext): string[] {
    // PULL Framework Discovery Questions
    // Each question targets a specific PULL component
    const pullQuestions = [
      // P = PROJECT: What's on their to-do list being prioritized NOW?
      `"What specific initiative or project is driving this conversation? What are you trying to accomplish?"`,

      // U = URGENCY: Why must they act NOW vs. later?
      `"Of all the things you could focus on, why is this a priority right now? What's creating the pressure to act?"`,

      // L = LIST: What options are they considering?
      `"What have you tried or looked into so far? What other approaches are you considering?"`,

      // L = LIMITATIONS: Why aren't current options good enough?
      `"What's preventing you from just using what you have? What's missing or not working?"`,
    ];

    return pullQuestions;
  }

  private static getValuePropositions(context: CallScriptContext): string[] {
    return [
      `${context.leadIndustry || "Companies like yours"} typically see 25-40% improvement in [relevant metric]`,
      `We reduce the time spent on [relevant task] by an average of 3-4 hours per week`,
      `Our clients often tell us this was the best investment they made last year`,
      `The ROI typically pays for itself within the first quarter`,
    ];
  }

  private static generateObjectionHandlers(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): ObjectionHandler[] {
    return [
      {
        objection: "We don't have budget for this right now",
        category: "price",
        response:
          "I understand budget considerations. Help me understand your process for evaluating investments like this.",
        followUp:
          "What would the ROI need to look like for this to make sense?",
      },
      {
        objection: "We're not ready to make a change",
        category: "timing",
        response:
          "Timing is crucial. What would need to happen for this to become a priority?",
        followUp: "Is this something you'd want to revisit in 3-6 months?",
      },
      {
        objection: "I need to discuss this with my team",
        category: "authority",
        response:
          "Absolutely - team buy-in is important. Who else would be involved in this decision?",
        followUp: "Would it make sense for me to present to the broader team?",
      },
    ];
  }

  private static getNextStepOptions(purpose: string): string[] {
    const options = {
      discovery: [
        "schedule a more detailed demo",
        "send you some relevant case studies",
        "arrange a call with our technical team",
      ],
      demo: [
        "prepare a customized proposal",
        "schedule a trial period",
        "connect you with a current client reference",
      ],
      "follow-up": [
        "address any remaining questions",
        "move forward with next steps",
        "schedule implementation planning",
      ],
      closing: [
        "finalize the agreement",
        "begin the onboarding process",
        "set up the kick-off meeting",
      ],
    };

    return options[purpose as keyof typeof options] || options.discovery;
  }

  private static calculateDuration(purpose: string): string {
    const durations = {
      discovery: "15-20 minutes",
      demo: "20-30 minutes",
      "follow-up": "10-15 minutes",
      closing: "15-25 minutes",
      "objection-handling": "10-20 minutes",
    };

    return durations[purpose as keyof typeof durations] || "15-20 minutes";
  }

  private static calculateConfidence(
    context: CallScriptContext,
    voice: VoiceProfile,
  ): number {
    let confidence = 0.7; // Base confidence

    if (context.leadBio) confidence += 0.1;
    if (context.companyNews) confidence += 0.1;
    if (context.mutualConnections?.length) confidence += 0.1;
    if (voice.vocabulary.length > 5) confidence += 0.05;

    return Math.min(confidence, 0.95);
  }

  private static generateTalkingPoints(context: CallScriptContext): string[] {
    return [
      `${context.leadCompany} operates in ${context.leadIndustry || "a competitive market"}`,
      `As ${context.leadTitle}, ${context.leadName} likely cares about [relevant business outcomes]`,
      `Company size: ${context.companySize || "Mid-market"} - typical challenges include [specific issues]`,
      "Reference similar success stories during the conversation",
      "Keep the focus on their specific needs and outcomes",
    ];
  }

  private static generateNextSteps(purpose: string): string[] {
    return [
      "Send follow-up email with call summary",
      "Provide relevant case studies or resources",
      "Schedule next meeting if appropriate",
      "Connect with other stakeholders if needed",
      "Update Pipeline with call notes and next actions",
    ];
  }

  private static generateFallbackOptions(context: CallScriptContext): string[] {
    return [
      'If they\'re not available: "When would be a better time to connect?"',
      'If they\'re not interested: "What would need to change for this to be relevant?"',
      'If they need to think: "What specific areas should we explore further?"',
      'If wrong person: "Who would be the right person to speak with about this?"',
    ];
  }

  private static getSuggestedTimeframe(purpose: string): string {
    const timeframes = {
      discovery: "sometime this week",
      demo: "early next week",
      "follow-up": "in the next few days",
      closing: "this week to keep momentum",
    };

    return timeframes[purpose as keyof typeof timeframes] || "this week";
  }

  private static getFollowUpCommitment(purpose: string): string {
    return "a summary of our conversation and next steps";
  }
}
