import {
  PipelineData,
  BuyerCompany,
  Person,
  EnrichedProfile,
  EnablementAsset,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import { SalesPlaybook, BuyerGroup } from "../types";

const CONFIG = {
  templates: {
    initial: {
      subject: "Quick thought on {topic}",
      body: `Hi {name},

I noticed {rapport_hook}. Based on recent trends in {industry}, here are a few things you might find valuable:
- {value_add_1}
- {value_add_2}
- {value_add_3}

If you'd like a deeper dive or want to discuss how these apply to your team, let's connect!

Best,
Your Name`,
    },
    followUp: {
      subject: "Following up on {topic}",
      body: `Hi {name},

I wanted to follow up on my previous message about {topic}. I've been thinking about how {value_add_1} could specifically help {company} achieve {goal}.

Would you be open to a quick chat about this?

Best,
Your Name`,
    },
    valueAdd: {
      subject: "Quick value-add on {topic}",
      body: `Hi {name},

I came across this insight about {topic} and thought of you:
{value_add}

This could be particularly relevant given {context}.

Let me know if you'd like to explore this further!

Best,
Your Name`,
    },
    final: {
      subject: "Last thought on {topic}",
      body: `Hi {name},

I understand you're busy, so I'll keep this brief. I wanted to share one final thought about {topic}:
{value_add}

If you're interested in learning more, I'm happy to share additional insights. If not, I'll respect your time and won't follow up again.

Best,
Your Name`,
    },
  },
  sequence: {
    maxFollowUps: 2,
    delayBetweenMessages: 3, // days
  },
} as const;

interface OutreachMessage {
  id: string;
  type: "email" | "linkedin" | "call";
  channel: string;
  subject?: string;
  content: string;
  timing: {
    day: number;
    timeOfDay: "morning" | "afternoon" | "evening";
    delay: number; // hours
  };
  target: {
    personId: string;
    name: string;
    title: string;
    department: string;
  };
  followUp?: {
    trigger: "no_response" | "positive_response" | "negative_response";
    delay: number; // hours
    message: string;
  };
}

interface OutreachSequence {
  id: string;
  companyId: string;
  companyName: string;
  targetBuyerGroup: BuyerGroup;
  messages: OutreachMessage[];
  timeline: {
    startDate: string;
    endDate: string;
    totalDuration: number; // days
  };
  successMetrics: {
    metric: string;
    target: string;
    timeframe: string;
  }[];
  lastUpdated: string;
}

export class OutreachSequenceGenerator {
  private extractRapportHook(profile: Partial<EnrichedProfile>): string {
    if (profile.motivations?.length) {
      return `your focus on ${profile['motivations'][0].description}`;
    }
    if (profile.insights?.length) {
      return `your recent insights on ${profile['insights'][0].description}`;
    }
    return "your recent activity in the industry";
  }

  private extractValueAdds(profile: Partial<EnrichedProfile>): string[] {
    const valueAdds: string[] = [];

    if (profile.insights?.length) {
      valueAdds.push(profile['insights'][0].description);
    }
    if (profile.painPoints?.length) {
      valueAdds.push(`addressing ${profile['painPoints'][0].description}`);
    }
    if (profile.motivations?.length) {
      valueAdds.push(`achieving ${profile['motivations'][0].description}`);
    }

    return valueAdds.length
      ? valueAdds
      : ["driving innovation in your industry"];
  }

  private generateInitialOutreach(
    person: Person,
    company: BuyerCompany,
    profile: Partial<EnrichedProfile>,
  ): EnablementAsset {
    const rapportHook = this.extractRapportHook(profile);
    const valueAdds = this.extractValueAdds(profile);
    const topic = company.industry || "your industry";

    return {
      id: uuidv4(),
      name: `Initial Outreach to ${person.name}`,
      type: "outreach",
      targetId: person.id,
      targetName: person.name || "",
      title: `Initial Outreach to ${person.name || "Contact"}`,
      content: CONFIG.templates.initial.body
        .replace("{name}", person.name || "there")
        .replace("{rapport_hook}", rapportHook)
        .replace("{industry}", topic)
        .replace("{value_add_1}", valueAdds[0] || "strategic insights")
        .replace(
          "{value_add_2}",
          valueAdds[1] || valueAdds[0] || "best practices",
        )
        .replace(
          "{value_add_3}",
          valueAdds[2] || valueAdds[0] || "industry trends",
        ),
      targetAudience: "Sales Team",
      keyPoints: [
        `Personalized outreach to ${person.name} based on their role as ${person.title}`,
        `References recent activity and industry trends`,
        `Includes three value-add points tailored to ${company.name}`,
      ],
      attachments: [],
      leadMagnets: [`${topic} insights and trends`],
      emailDraft: CONFIG.templates.initial.body
        .replace("{name}", person.name || "there")
        .replace("{rapport_hook}", rapportHook)
        .replace("{industry}", topic)
        .replace("{value_add_1}", valueAdds[0] || "strategic insights")
        .replace(
          "{value_add_2}",
          valueAdds[1] || valueAdds[0] || "best practices",
        )
        .replace(
          "{value_add_3}",
          valueAdds[2] || valueAdds[0] || "industry trends",
        ),
      suggestedContent: `Industry insights for ${company.industry}`,
      targetBuyerGroup: company.id,
      effectiveness: 0.7,
      rapportHook: rapportHook,
      recommendedArticles: [
        {
          title: `Latest trends in ${topic}`,
          url: `https://example.com/${topic.replace(/\s+/g, "-").toLowerCase()}`,
        },
      ],
      personalityInsights: {
        dominantPersonality: [profile.personality || "Professional"],
        aboveTheLine: true,
        enablementType: "outreach",
        summary: `Outreach strategy for ${person.name}`,
        actionItems: [
          `Connect via LinkedIn`,
          `Schedule follow-up call`,
          `Send industry insights`,
        ],
      },
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateFollowUpOutreach(
    person: Person,
    company: BuyerCompany,
    profile: Partial<EnrichedProfile>,
    sequence: number,
  ): EnablementAsset {
    const valueAdds = this.extractValueAdds(profile);
    const topic = company.industry || "your industry";
    const goal = profile.motivations?.[0]?.description || "your goals";

    return {
      id: uuidv4(),
      name: `Follow-up ${sequence} to ${person.name}`,
      type: "outreach",
      targetId: person.id,
      targetName: person.name || "",
      title: `Follow-up ${sequence} to ${person.name}`,
      content: CONFIG.templates.followUp.body
        .replace("{name}", person.name || "there")
        .replace("{topic}", topic)
        .replace("{value_add_1}", valueAdds[0] || "strategic insights")
        .replace("{company}", company.name || "your company")
        .replace("{goal}", goal),
      targetAudience: "Sales Team",
      keyPoints: [
        `Follow-up ${sequence} to ${person.name}`,
        `References previous outreach and adds new value`,
        `Focuses on specific company goals and value proposition`,
      ],
      attachments: [],
      leadMagnets: [`${topic} insights and trends`],
      emailDraft: CONFIG.templates.followUp.body
        .replace("{name}", person.name || "there")
        .replace("{topic}", topic)
        .replace("{value_add_1}", valueAdds[0] || "strategic insights")
        .replace("{company}", company.name || "your company")
        .replace("{goal}", goal),
      suggestedContent: `Follow-up insights for ${company.industry}`,
      targetBuyerGroup: company.id,
      effectiveness: 0.65,
      rapportHook: `your previous interest in ${topic}`,
      recommendedArticles: [
        {
          title: `Advanced strategies in ${topic}`,
          url: `https://example.com/${topic.replace(/\s+/g, "-").toLowerCase()}-advanced`,
        },
      ],
      personalityInsights: {
        dominantPersonality: [profile.personality || "Professional"],
        aboveTheLine: true,
        enablementType: "outreach",
        summary: `Follow-up strategy for ${person.name}`,
        actionItems: [
          `Reference previous conversation`,
          `Provide additional value`,
          `Request meeting`,
        ],
      },
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateValueAddOutreach(
    person: Person,
    company: BuyerCompany,
    profile: Partial<EnrichedProfile>,
  ): EnablementAsset {
    const valueAdds = this.extractValueAdds(profile);
    const topic = company.industry || "your industry";
    const context =
      profile.insights?.[0]?.description || "your current initiatives";

    return {
      id: uuidv4(),
      name: `Value-add Outreach to ${person.name}`,
      type: "outreach",
      targetId: person.id,
      targetName: person.name || "",
      title: `Value-add Outreach to ${person.name}`,
      content: CONFIG.templates.valueAdd.body
        .replace("{name}", person.name || "there")
        .replace("{topic}", topic)
        .replace("{value_add}", valueAdds[0] || "strategic insights")
        .replace("{context}", context),
      targetAudience: "Sales Team",
      keyPoints: [
        `Value-add outreach to ${person.name}`,
        `Shares specific insight relevant to their role`,
        `References recent activity for context`,
      ],
      attachments: [],
      leadMagnets: [`${topic} insights and trends`],
      emailDraft: CONFIG.templates.valueAdd.body
        .replace("{name}", person.name || "there")
        .replace("{topic}", topic)
        .replace("{value_add}", valueAdds[0] || "strategic insights")
        .replace("{context}", context),
      suggestedContent: `Value-add insights for ${company.industry}`,
      targetBuyerGroup: company.id,
      effectiveness: 0.75,
      rapportHook: `your expertise in ${context}`,
      recommendedArticles: [
        {
          title: `Expert insights on ${topic}`,
          url: `https://example.com/${topic.replace(/\s+/g, "-").toLowerCase()}-insights`,
        },
      ],
      personalityInsights: {
        dominantPersonality: [profile.personality || "Professional"],
        aboveTheLine: true,
        enablementType: "outreach",
        summary: `Value-add strategy for ${person.name}`,
        actionItems: [
          `Share relevant insights`,
          `Connect with expertise`,
          `Build relationship`,
        ],
      },
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateFinalOutreach(
    person: Person,
    company: BuyerCompany,
    profile: Partial<EnrichedProfile>,
  ): EnablementAsset {
    const valueAdds = this.extractValueAdds(profile);
    const topic = company.industry || "your industry";

    return {
      id: uuidv4(),
      name: `Final Outreach to ${person.name}`,
      type: "outreach",
      targetId: person.id,
      targetName: person.name || "",
      title: `Final Outreach to ${person.name}`,
      content: CONFIG.templates.final.body
        .replace("{name}", person.name || "there")
        .replace("{topic}", topic)
        .replace("{value_add}", valueAdds[0] || "strategic insights"),
      targetAudience: "Sales Team",
      keyPoints: [
        `Final outreach to ${person.name}`,
        `Respects their time and decision`,
        `Offers one last value-add point`,
      ],
      attachments: [],
      leadMagnets: [`${topic} insights and trends`],
      emailDraft: CONFIG.templates.final.body
        .replace("{name}", person.name || "there")
        .replace("{topic}", topic)
        .replace("{value_add}", valueAdds[0] || "strategic insights"),
      suggestedContent: `Final insights for ${company.industry}`,
      targetBuyerGroup: company.id,
      effectiveness: 0.6,
      rapportHook: `your consideration of our previous discussions`,
      recommendedArticles: [
        {
          title: `Final thoughts on ${topic}`,
          url: `https://example.com/${topic.replace(/\s+/g, "-").toLowerCase()}-final`,
        },
      ],
      personalityInsights: {
        dominantPersonality: [profile.personality || "Professional"],
        aboveTheLine: true,
        enablementType: "outreach",
        summary: `Final strategy for ${person.name}`,
        actionItems: [
          `Respect their decision`,
          `Leave door open`,
          `End gracefully`,
        ],
      },
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  generateOutreachSequence(
    person: Person,
    company: BuyerCompany,
    profile: Partial<EnrichedProfile>,
  ): EnablementAsset[] {
    const sequence: EnablementAsset[] = [];

    // Initial outreach
    sequence.push(this.generateInitialOutreach(person, company, profile));

    // Follow-ups
    for (let i = 1; i <= CONFIG.sequence.maxFollowUps; i++) {
      sequence.push(this.generateFollowUpOutreach(person, company, profile, i));
    }

    // Value-add outreach
    sequence.push(this.generateValueAddOutreach(person, company, profile));

    // Final outreach
    sequence.push(this.generateFinalOutreach(person, company, profile));

    return sequence;
  }

  private generateLinkedInMessage(
    person: EnrichedProfile,
    salesPlaybook: SalesPlaybook,
    enablementAsset: EnablementAsset,
  ): OutreachMessage {
    const insights = person.insights || [];
    const valueAdd = enablementAsset.leadMagnets?.[0] || "";

    return {
      id: `linkedin-${person.id}`,
      type: "linkedin",
      channel: "LinkedIn",
      content: `Hi ${person.personName},\n\n${
        insights.length > 0
          ? `Based on your experience in ${person.skills?.[0] || "your field"}, `
          : ""
      }I thought you might be interested in ${valueAdd}.\n\n${
        salesPlaybook.salesStrategy['keyMessages'][0]
      }\n\nWould you be open to a brief conversation about how we could help ${person.companyName}?`,
      timing: {
        day: 1,
        timeOfDay: "morning",
        delay: 0,
      },
      target: {
        personId: person.id,
        name: person.personName,
        title: person.title,
        department: person.title.split(" ")[0] || "Unknown",
      },
    };
  }

  private generateCallScript(
    person: EnrichedProfile,
    salesPlaybook: SalesPlaybook,
    enablementAsset: EnablementAsset,
  ): OutreachMessage {
    const insights = person.insights || [];
    const valueAdd = enablementAsset.leadMagnets?.[0] || "";

    return {
      id: `call-${person.id}`,
      type: "call",
      channel: "Phone",
      content: `Opening:
"Hi ${person.personName}, this is [Your Name] from [Your Company]. I'm reaching out because ${
        insights.length > 0
          ? `based on your experience in ${person.skills?.[0] || "your field"}, `
          : ""
      }I thought you might be interested in ${valueAdd}."

Value Proposition:
"${salesPlaybook.salesStrategy['keyMessages'][0]}"

Key Points:
${salesPlaybook.salesStrategy.keyMessages
  .slice(1, 3)
  .map((msg: any, i: number) => `${i + 1}. ${msg}`)
  .join("\n")}

Objection Handling:
"${salesPlaybook.salesStrategy['objections'][0]?.response || ""}"

Closing:
"Would you be open to a more detailed discussion about how we could help ${person.companyName}?"`,
      timing: {
        day: 3,
        timeOfDay: "afternoon",
        delay: 0,
      },
      target: {
        personId: person.id,
        name: person.personName,
        title: person.title,
        department: person.title.split(" ")[0] || "Unknown",
      },
    };
  }

  private generateSequence(
    company: BuyerCompany,
    buyerGroup: BuyerGroup,
    salesPlaybook: SalesPlaybook,
    enablementAsset: EnablementAsset,
  ): OutreachSequence {
    const messages: OutreachMessage[] = [];
    let currentDay = 1;

    // Generate messages for champions
    for (const championId of buyerGroup.champions) {
      const champion = salesPlaybook.keyStakeholders.find(
        (p: any) => p['id'] === championId,
      );
      if (champion) {
        // Start with LinkedIn connection
        messages.push(
          this.generateLinkedInMessage(
            champion,
            salesPlaybook,
            enablementAsset,
          ),
        );
        currentDay += 2;

        // Schedule a call
        messages.push(
          this.generateCallScript(champion, salesPlaybook, enablementAsset),
        );
        currentDay += 2;
      }
    }

    // Generate messages for decision makers
    for (const decisionMakerId of buyerGroup.decisionMakers) {
      const decisionMaker = salesPlaybook.keyStakeholders.find(
        (p: any) => p['id'] === decisionMakerId,
      );
      if (decisionMaker) {
        // Follow up with LinkedIn
        messages.push(
          this.generateLinkedInMessage(
            decisionMaker,
            salesPlaybook,
            enablementAsset,
          ),
        );
        currentDay += 2;

        // Schedule a call
        messages.push(
          this.generateCallScript(
            decisionMaker,
            salesPlaybook,
            enablementAsset,
          ),
        );
        currentDay += 2;
      }
    }

    return {
      id: `sequence-${company.id}`,
      companyId: company.id,
      companyName: company.name,
      targetBuyerGroup: buyerGroup,
      messages,
      timeline: {
        startDate: new Date().toISOString(),
        endDate: new Date(
          Date.now() + currentDay * 24 * 60 * 60 * 1000,
        ).toISOString(),
        totalDuration: currentDay,
      },
      successMetrics: [
        {
          metric: "Response Rate",
          target: "30%",
          timeframe: "Within 2 weeks",
        },
        {
          metric: "Meeting Booked",
          target: "2",
          timeframe: "Within 1 month",
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  public async generateOutreachSequences(
    data: PipelineData,
  ): Promise<Partial<PipelineData>> {
    if (!data.salesPlaybooks || !data.buyerGroups || !data.enablementAssets) {
      throw new Error(
        "Missing required data for generating outreach sequences",
      );
    }

    const sequences: OutreachSequence[] = [];

    for (const salesPlaybook of data.salesPlaybooks) {
      const buyerGroup = data.buyerGroups.find(
        (g) => g['companyId'] === salesPlaybook.companyId,
      );
      const enablementAsset = data.enablementAssets.find(
        (a) => a['targetId'] === salesPlaybook['companyId'] && a['type'] === "company",
      );

      if (buyerGroup && enablementAsset) {
        const company = data.buyerCompanies.find(
          (c) => c['id'] === salesPlaybook.companyId,
        );
        if (company) {
          sequences.push(
            this.generateSequence(
              company,
              buyerGroup,
              salesPlaybook,
              enablementAsset,
            ),
          );
        }
      }
    }

    return {
      outreachSequences: sequences,
    };
  }
}

export async function generateOutreachSequences(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const generator = new OutreachSequenceGenerator();
  return generator.generateOutreachSequences(data);
}
