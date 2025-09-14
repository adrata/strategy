import {
  PipelineData,
  BuyerGroup,
  BuyerCompany,
  Person,
  EnrichedProfile,
  OpportunityPlaybook,
} from "../types";
import { v4 as uuidv4 } from "uuid";

interface EngagementActivity {
  activity: string;
  owner: string;
  timeline: string;
  successCriteria: string[];
  dependencies?: string[];
  resources?: string[];
}

interface EngagementPhase {
  phase: string;
  duration: string;
  activities: EngagementActivity[];
  objectives: string[];
  keyStakeholders: string[];
}

interface EngagementPlaybook {
  id: string;
  companyId: string;
  companyName: string;
  opportunityPlaybook: OpportunityPlaybook;
  targetBuyerGroup: BuyerGroup;
  keyStakeholders: EnrichedProfile[];
  phases: EngagementPhase[];
  successMetrics: {
    metric: string;
    target: string;
    timeframe: string;
  }[];
  riskMitigation: {
    risk: string;
    impact: "high" | "medium" | "low";
    mitigation: string;
    owner: string;
  }[];
  lastUpdated: string;
  competitorBattlecards: {
    competitor: string;
    recentNews: {
      title: string;
      date: string;
      summary: string;
    }[];
    messaging: string;
    howToDifferentiate: string;
  }[];
  personalityInsights: {
    dominantPersonality: string[];
    aboveTheLine: boolean;
    enablementType: string;
    summary: string;
    actionItems: string[];
  };
}

const TEMPLATES = {
  valueAdd: [
    "Based on your recent {event}, here are 3 trends to watch in {industry}.",
    "Companies in {industry} are focusing on {dream}. Here's how you can stay ahead.",
    "Given your recent {news}, consider these best practices for {painPoint}.",
    "Your expansion into {region} opens up new opportunities—here's what to know.",
  ],
  personValueAdd: [
    "As a {role} in {department}, here are 3 ways to drive impact in {industry} this year.",
    "Your team is positioned to lead in {trend}. Consider these strategies for success.",
    "Given your recent project on {project}, here are best practices from industry leaders.",
  ],
  email: {
    company:
      "Hi {name},\n\n" +
      "I noticed {rapportHook}. Based on recent trends in {industry}, here are a few things you might find valuable:\n" +
      "- {valueAdd1}\n" +
      "- {valueAdd2}\n" +
      "- {valueAdd3}\n" +
      "- {valueAdd4}\n\n" +
      "If you'd like a deeper dive or want to discuss how these apply to your team, let's connect!\n\n" +
      "Best,\nYour Name",
    person:
      "Hi {name},\n\n" +
      "As a {role} in {department}, you play a key part in {company}. Here are some tailored insights for you and your team:\n" +
      "- {valueAdd1}\n" +
      "- {valueAdd2}\n" +
      "- {valueAdd3}\n" +
      "- {valueAdd4}\n\n" +
      "If you'd like to discuss these or get a custom resource for your team, let me know!\n\n" +
      "Best,\nYour Name",
  },
  personality: {
    Direct: {
      summary:
        "As a Direct leader, you value efficiency and results. Here's how to drive impact fast:",
      action: "Focus on quick wins, measurable outcomes, and clear ROI.",
      email:
        "Hi {name}, I know you value results. Here's a quick way to move the needle...",
    },
    Chatty: {
      summary:
        "As a Chatty relationship-builder, you excel at engaging others. Here's how to leverage your network:",
      action: "Initiate conversations, build consensus, and use storytelling.",
      email: "Hi {name}, Let's connect and brainstorm ways to win together...",
    },
    "Rule-Follower": {
      summary:
        "As a Rule-Follower, you thrive on process and reliability. Here's how to lead with structure:",
      action:
        "Implement proven frameworks, document best practices, and ensure compliance.",
      email:
        "Hi {name}, Here's a step-by-step approach to achieve your goals...",
    },
    Friendly: {
      summary:
        "As a Friendly collaborator, you bring people together. Here's how to drive team wins:",
      action: "Foster collaboration, celebrate team success, and build trust.",
      email:
        "Hi {name}, Your team spirit is a real asset. Here's how to help everyone win...",
    },
  },
};

export class EngagementPlaybookGenerator {
  private buyerCompanies: BuyerCompany[];

  constructor(buyerCompanies: BuyerCompany[]) {
    this['buyerCompanies'] = buyerCompanies;
  }

  private generateRapportHook(profile: EnrichedProfile): string {
    if (profile['recentActivity']?.length) {
      const activity = profile['recentActivity'][0];
      return `recently ${activity.type}: '${activity.description}' (${activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : "recently"})`;
    }

    // Fallback to company-level intelligence
    const event = profile['recentActivity']?.[0]?.type || "industry developments";
    const impact = "driving innovation"; // This would come from enriched data
    const news =
      profile['recentActivity']?.[0]?.description || "recent developments";

    return `recently engaged with ${event}, focusing on ${impact} after ${news}`;
  }

  private extractValueAdds(
    company: BuyerCompany,
    profile: EnrichedProfile,
  ): string[] {
    const industry = company.industry;
    const event = profile['recentActivity']?.[0]?.type || "industry developments";
    const dream = profile['motivations']?.[0]?.description || "innovation";
    const painPoint =
      profile['painPoints']?.[0]?.description || "growth challenges";
    const region =
      typeof company['location'] === "object"
        ? company.location?.country || "your region"
        : company.location || "your region";
    const news =
      profile['recentActivity']?.[0]?.description || "recent developments";

    return [
      (
        TEMPLATES['valueAdd'][0] ||
        "Based on recent developments in {industry}, here are key trends to watch."
      )
        .replace("{event}", event)
        .replace("{industry}", industry),
      (
        TEMPLATES['valueAdd'][1] ||
        "Companies in {industry} are focusing on innovation. Here's how to stay ahead."
      )
        .replace("{industry}", industry)
        .replace("{dream}", dream),
      (
        TEMPLATES['valueAdd'][2] ||
        "Consider these best practices for addressing current challenges."
      )
        .replace("{news}", news)
        .replace("{painPoint}", painPoint),
      (
        TEMPLATES['valueAdd'][3] ||
        "Your expansion opens up new opportunities in {industry}."
      )
        .replace("{region}", region)
        .replace("{industry}", industry),
    ];
  }

  private extractPersonValueAdds(
    person: Person,
    company: BuyerCompany,
  ): string[] {
    const industry = company.industry;
    const role = person.title || "Team Member";
    const department = person.department || "Unknown Department";
    const trend = "industry innovation"; // Using a more generic trend since we don't have specific trends
    const project = `${role} initiatives`; // Using role-based project description

    return [
      (
        TEMPLATES['personValueAdd'][0] ||
        "As a {role} in {department}, here are 3 ways to drive impact in {industry} this year."
      )
        .replace("{role}", role)
        .replace("{department}", department)
        .replace("{industry}", industry),
      (
        TEMPLATES['personValueAdd'][1] ||
        "Your team is positioned to lead in {trend}. Consider these strategies for success."
      ).replace("{trend}", trend),
      (
        TEMPLATES['personValueAdd'][2] ||
        "Given your recent project on {project}, here are best practices from industry leaders."
      ).replace("{project}", project),
    ];
  }

  private generateEmailDraft(
    type: "company" | "person",
    name: string,
    rapportHook: string,
    valueAdds: string[],
    company: BuyerCompany,
    person?: Person,
  ): string {
    if (type === "company") {
      return TEMPLATES.email.company
        .replace("{name}", name)
        .replace("{rapportHook}", rapportHook)
        .replace("{industry}", company.industry)
        .replace("{valueAdd1}", valueAdds[0] || "Strategic insight")
        .replace("{valueAdd2}", valueAdds[1] || "Best practice")
        .replace("{valueAdd3}", valueAdds[2] || "Industry trend")
        .replace("{valueAdd4}", valueAdds[3] || "Growth opportunity");
    } else if (person) {
      return TEMPLATES.email.person
        .replace("{name}", name)
        .replace("{role}", person.title || "Team Member")
        .replace("{department}", person.department || "Unknown Department")
        .replace("{company}", company.name)
        .replace("{valueAdd1}", valueAdds[0] || "Strategic insight")
        .replace("{valueAdd2}", valueAdds[1] || "Best practice")
        .replace("{valueAdd3}", valueAdds[2] || "Industry trend")
        .replace("{valueAdd4}", valueAdds[3] || "Opportunity");
    }
    return "";
  }

  private generateCompetitorBattlecards(
    company: BuyerCompany,
  ): EngagementPlaybook["competitorBattlecards"] {
    return company.competitors.map((competitor: any) => ({
      competitor: competitor.name,
      recentNews: [], // Placeholder
      messaging: "", // Placeholder
      howToDifferentiate: `Highlight Monaco's unique value vs. ${competitor.name}`,
    }));
  }

  private generatePersonalityInsights(
    profile: EnrichedProfile,
  ): EngagementPlaybook["personalityInsights"] {
    const dominantPersonality = profile['personality']
      ? [profile['personality']]
      : ["Friendly"];
    const aboveTheLine = profile['personality']
      ? ["Direct", "Strategic", "Analytical"].includes(profile['personality'])
      : false;
    const personalityTemplate =
      TEMPLATES['personality'][
        dominantPersonality[0] as keyof typeof TEMPLATES.personality
      ] || TEMPLATES.personality.Friendly;

    return {
      dominantPersonality,
      aboveTheLine,
      enablementType: dominantPersonality.join("-"),
      summary: aboveTheLine
        ? `(Strategic) ${personalityTemplate.summary}`
        : `(Tactical) ${personalityTemplate.summary}`,
      actionItems: [
        aboveTheLine
          ? `Focus on business impact and cross-functional wins. ${personalityTemplate.action}`
          : `Focus on team wins and personal growth. ${personalityTemplate.action}`,
      ],
    };
  }

  private generatePhaseActivities(phase: string): EngagementActivity[] {
    const activities: EngagementActivity[] = [];

    switch (phase) {
      case "Discovery":
        activities.push(
          {
            activity: "Initial stakeholder mapping",
            owner: "Sales Development",
            timeline: "Week 1",
            successCriteria: [
              "Complete stakeholder map",
              "Identify key decision makers",
              "Document reporting relationships",
            ],
          },
          {
            activity: "Initial value proposition alignment",
            owner: "Sales Development",
            timeline: "Week 1-2",
            successCriteria: [
              "Map value props to stakeholder priorities",
              "Identify key pain points",
              "Document success metrics",
            ],
          },
        );
        break;

      case "Qualification":
        activities.push(
          {
            activity: "Business case development",
            owner: "Sales Development",
            timeline: "Week 2-3",
            successCriteria: [
              "Quantify business impact",
              "Document ROI calculations",
              "Align with budget cycle",
            ],
          },
          {
            activity: "Technical validation",
            owner: "Solutions Engineering",
            timeline: "Week 3-4",
            successCriteria: [
              "Technical requirements documented",
              "Integration points identified",
              "Security requirements validated",
            ],
          },
        );
        break;

      case "Solution":
        activities.push(
          {
            activity: "Solution design workshop",
            owner: "Solutions Engineering",
            timeline: "Week 4-5",
            successCriteria: [
              "Solution architecture approved",
              "Implementation timeline agreed",
              "Resource requirements documented",
            ],
          },
          {
            activity: "Proof of concept planning",
            owner: "Solutions Engineering",
            timeline: "Week 5-6",
            successCriteria: [
              "Success criteria defined",
              "Timeline and milestones set",
              "Stakeholder roles assigned",
            ],
          },
        );
        break;

      case "Proposal":
        activities.push(
          {
            activity: "Proposal development",
            owner: "Sales",
            timeline: "Week 6-7",
            successCriteria: [
              "Pricing approved",
              "Terms negotiated",
              "Legal review completed",
            ],
          },
          {
            activity: "Executive presentation",
            owner: "Sales",
            timeline: "Week 7-8",
            successCriteria: [
              "Executive buy-in secured",
              "Implementation plan approved",
              "Contract signed",
            ],
          },
        );
        break;
    }

    return activities;
  }

  private generatePhases(): EngagementPhase[] {
    const phases: EngagementPhase[] = [];
    const phaseNames = ["Discovery", "Qualification", "Solution", "Proposal"];

    for (const phaseName of phaseNames) {
      phases.push({
        phase: phaseName,
        duration: "2 weeks",
        activities: this.generatePhaseActivities(phaseName),
        objectives: [
          `Complete ${phaseName.toLowerCase()} phase activities`,
          `Secure stakeholder alignment`,
          `Document key decisions and next steps`,
        ],
        keyStakeholders: [],
      });
    }

    return phases;
  }

  private generateSuccessMetrics(): {
    metric: string;
    target: string;
    timeframe: string;
  }[] {
    return [
      {
        metric: "Revenue Impact",
        target: "20% increase",
        timeframe: "12 months",
      },
      {
        metric: "Cost Savings",
        target: "15% reduction",
        timeframe: "6 months",
      },
      {
        metric: "Time to Value",
        target: "90 days",
        timeframe: "Implementation",
      },
    ];
  }

  private generateRiskMitigation(): {
    risk: string;
    impact: "high" | "medium" | "low";
    mitigation: string;
    owner: string;
  }[] {
    return [
      {
        risk: "Budget constraints",
        impact: "high",
        mitigation: "Early ROI analysis and phased implementation",
        owner: "Sales",
      },
      {
        risk: "Technical integration challenges",
        impact: "medium",
        mitigation: "Technical validation and proof of concept",
        owner: "Solutions Engineering",
      },
      {
        risk: "Stakeholder alignment",
        impact: "medium",
        mitigation: "Regular stakeholder updates and executive sponsorship",
        owner: "Sales",
      },
    ];
  }

  public generatePlaybook(
    opportunityPlaybook: OpportunityPlaybook,
    buyerGroup: BuyerGroup,
    stakeholders: EnrichedProfile[],
  ): EngagementPlaybook {
    const company = this.buyerCompanies.find(
      (c) => c['id'] === buyerGroup.companyId,
    );
    if (!company) {
      throw new Error(`Company not found for buyer group ${buyerGroup.id}`);
    }

    const phases = this.generatePhases();
    const successMetrics = this.generateSuccessMetrics();
    const riskMitigation = this.generateRiskMitigation();
    const competitorBattlecards = this.generateCompetitorBattlecards(company);
    const firstStakeholder = stakeholders[0];
    const personalityInsights = firstStakeholder
      ? this.generatePersonalityInsights(firstStakeholder)
      : {
          dominantPersonality: ["Friendly"],
          aboveTheLine: false,
          enablementType: "default",
          summary:
            "Default personality assessment - insufficient stakeholder data available",
          actionItems: [
            "Gather more stakeholder information",
            "Focus on basic relationship building",
          ],
        };

    return {
      id: uuidv4(),
      companyId: company.id,
      companyName: company.name,
      opportunityPlaybook,
      targetBuyerGroup: buyerGroup,
      keyStakeholders: stakeholders,
      phases,
      successMetrics,
      riskMitigation,
      lastUpdated: new Date().toISOString(),
      competitorBattlecards,
      personalityInsights,
    };
  }
}

export async function generateEngagementPlaybooks(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (
    !data.opportunityPlaybooks ||
    !data.buyerGroups ||
    !data.enrichedProfiles
  ) {
    throw new Error("Required data missing for engagement playbook generation");
  }

  const generator = new EngagementPlaybookGenerator(data.buyerCompanies);
  const playbooks: EngagementPlaybook[] = [];

  for (const opportunityPlaybook of data.opportunityPlaybooks) {
    const buyerGroup = data.buyerGroups.find(
      (g) => g['id'] === opportunityPlaybook.targetBuyerGroup.id,
    );
    if (!buyerGroup) continue;

    const stakeholders = data.enrichedProfiles.filter(
      (p) => p['companyId'] === buyerGroup.companyId,
    );

    const playbook = generator.generatePlaybook(
      opportunityPlaybook,
      buyerGroup,
      stakeholders,
    );

    playbooks.push(playbook);
  }

  return {
    ...data,
    engagementPlaybooks: playbooks,
  };
}
