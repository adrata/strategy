import {
  PipelineData,
  BuyerCompany,
  Person,
  EnrichedProfile,
  EnablementAsset,
} from "../types";

// Simple UUID generation to avoid import issues
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const CONFIG = {
  templates: {
    valueAdd: [
      "Based on your recent {event}, here are 3 trends to watch in {industry}.",
      "Companies in {industry} are focusing on {dream}. Here's how you can stay ahead.",
      "Given your recent {news}, consider these best practices for {pain_point}.",
      "Your expansion into {region} opens up new opportunities—here's what to know.",
    ],
    personValueAdd: [
      "As a {role} in {department}, here are 3 ways to drive impact in {industry} this year.",
      "Your team is positioned to lead in {trend}. Consider these strategies for success.",
      "Given your recent project on {project}, here are best practices from industry leaders.",
    ],
    email: `Hi {name},\n\n
I noticed {rapport_hook}. Based on recent trends in {industry}, here are a few things you might find valuable:\n
- {value_add_1}\n
- {value_add_2}\n
- {value_add_3}\n\n
If you'd like a deeper dive or want to discuss how these apply to your team, let's connect!\n\n
Best,\nYour Name`,
    personEmail: `Hi {name},\n\n
As a {role} in {department}, you play a key part in {company}. Here are some tailored insights for you and your team:\n
- {value_add_1}\n
- {value_add_2}\n
- {value_add_3}\n\n
If you'd like to discuss these or get a custom resource for your team, let me know!\n\n
Best,\nYour Name`,
    suggestedContent:
      "Webinar: '{topic}'\nBlog: '{topic}'\nLinkedIn Post: '3 Lessons for {industry} Leaders in {year}'",
  },
  personalityTemplates: {
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
} as const;

export class EnablementGenerator {
  private extractRapportHook(
    enrichedProfile: Partial<EnrichedProfile>,
  ): string {
    // Use recent activity as rapport hook
    const recentActivity = enrichedProfile.recentActivity;
    if (recentActivity && recentActivity.length > 0) {
      const activity = recentActivity[0];
      return `recently ${activity.description.toLowerCase()}`;
    }

    // Use motivations as fallback
    const motivations = enrichedProfile.motivations;
    if (motivations && motivations.length > 0) {
      const motivation = motivations[0];
      return `focused on ${motivation.description.toLowerCase()}`;
    }

    return "your recent activity in the industry";
  }

  private extractValueAdds(
    company: BuyerCompany,
    enrichedProfile?: EnrichedProfile,
  ): string[] {
    const industry = company.industry;
    const event =
      enrichedProfile?.recentActivity?.[0]?.description ||
      "industry developments";
    const dream = "innovation"; // This would come from enriched data
    const painPoint =
      enrichedProfile?.painPoints?.[0]?.description || "growth challenges";
    const region =
      typeof company['location'] === "object"
        ? company.location.country
        : company.location || "your region";
    const news = "recent developments";

    return [
      CONFIG.templates['valueAdd'][0]
        .replace("{event}", event)
        .replace("{industry}", industry),
      CONFIG.templates['valueAdd'][1]
        .replace("{industry}", industry)
        .replace("{dream}", dream),
      CONFIG.templates['valueAdd'][2]
        .replace("{news}", news)
        .replace("{pain_point}", painPoint),
      CONFIG.templates['valueAdd'][3]
        .replace("{region}", region)
        .replace("{industry}", industry),
    ];
  }

  private extractPersonValueAdds(
    person: Person,
    company: BuyerCompany,
    enrichedProfile?: EnrichedProfile,
  ): string[] {
    const industry = company.industry;
    const role = person.title;
    const department = person.department;
    const trend = "innovation"; // This would come from enriched data
    const project =
      enrichedProfile?.recentActivity?.[0]?.description || "a recent project";

    return [
      CONFIG.templates['personValueAdd'][0]
        .replace("{role}", role || "Professional")
        .replace("{department}", department || "Team")
        .replace("{industry}", industry),
      CONFIG.templates['personValueAdd'][1].replace("{trend}", trend),
      CONFIG.templates['personValueAdd'][2].replace("{project}", project),
    ];
  }

  private extractSuggestedContent(company: BuyerCompany): string {
    const year = new Date().getFullYear();
    const topic = `Scaling Success in ${company.industry} (${year})`;
    return CONFIG.templates.suggestedContent
      .replace("{topic}", topic)
      .replace("{industry}", company.industry)
      .replace("{year}", year.toString());
  }

  private blendPersonalityTemplates(personality: string[]): {
    summary: string;
    action: string;
    email: string;
  } {
    if (personality['length'] === 2) {
      const s1 =
        CONFIG['personalityTemplates'][
          personality[0] as keyof typeof CONFIG.personalityTemplates
        ].summary;
      const s2 =
        CONFIG['personalityTemplates'][
          personality[1] as keyof typeof CONFIG.personalityTemplates
        ].summary;
      const a1 =
        CONFIG['personalityTemplates'][
          personality[0] as keyof typeof CONFIG.personalityTemplates
        ].action;
      const a2 =
        CONFIG['personalityTemplates'][
          personality[1] as keyof typeof CONFIG.personalityTemplates
        ].action;
      return {
        summary: `${s1} ${s2}`,
        action: `${a1} ${a2}`,
        email:
          CONFIG['personalityTemplates'][
            personality[0] as keyof typeof CONFIG.personalityTemplates
          ].email,
      };
    }
    return CONFIG['personalityTemplates'][
      personality[0] as keyof typeof CONFIG.personalityTemplates
    ];
  }

  private generatePlaybook(
    company: BuyerCompany,
    enrichedProfile?: Partial<EnrichedProfile>,
  ): EnablementAsset {
    const event =
      enrichedProfile?.recentActivity?.[0]?.description ||
      "industry developments";
    const rapportHook = this.extractRapportHook(
      enrichedProfile || { recentActivity: [] },
    );
    const painPoint =
      enrichedProfile?.painPoints?.[0]?.description || "growth challenges";

    const content = `# Sales Playbook for ${company.name}
    
## Company Overview
${company.name} is a ${company.companySize} company in the ${company.industry} industry with revenue of ${company.revenue}.

## Situation Awareness
This prospect recently engaged with ${event}. They're facing challenges with ${painPoint}.

## Approach Strategy
${rapportHook}

## Key Value Propositions
- Address ${painPoint} with our proven solutions
- Leverage our ${company.industry} expertise
- Drive ROI through proven methodologies

## Discovery Questions
1. How are you currently handling ${painPoint}?
2. What's driving your interest in ${event}?
3. Who else would be involved in evaluating solutions like ours?

## Next Steps
- Schedule discovery call
- Understand current state and desired outcomes
- Present tailored solution approach`;

    return {
      id: generateId(),
      name: `Sales Playbook: ${company.name}`,
      type: "playbook",
      targetId: company.id,
      targetName: company.name,
      title: `Sales Playbook: ${company.name}`,
      content,
      targetAudience: `Sales team targeting ${company.name}`,
      keyPoints: [
        `Company size: ${company.companySize}`,
        `Industry: ${company.industry}`,
        `Revenue: ${company.revenue}`,
        `Recent activity: ${event}`,
        `Key challenge: ${painPoint}`,
      ],
      attachments: [],
      leadMagnets: [
        `Industry Report: ${company.industry} Trends`,
        `Case Study: Similar ${company.companySize} Company`,
      ],
      emailDraft: `Hi [Name], I noticed your recent activity around ${event}. Many ${company.industry} companies like ${company.name} are facing similar challenges with ${painPoint}. Would you be open to a brief conversation about how we've helped similar organizations?`,
      suggestedContent: `Article: "Best Practices for ${company.industry} in 2024"`,
      targetBuyerGroup: company.id,
      effectiveness: 0.85,
      rapportHook,
      recommendedArticles: [
        {
          title: `${company.industry} Industry Outlook 2024`,
          url: `https://example.com/${company.industry.toLowerCase()}-outlook`,
        },
      ],
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateBattlecard(
    company: BuyerCompany,
    enrichedProfile?: Partial<EnrichedProfile>,
  ): EnablementAsset {
    const rapportHook = this.extractRapportHook(
      enrichedProfile || { recentActivity: [] },
    );
    const project =
      enrichedProfile?.recentActivity?.[0]?.description || "a recent project";

    const content = `# Competitive Battlecard: ${company.name}
    
## Company Profile
- Name: ${company.name}
- Industry: ${company.industry}
- Size: ${company.companySize}
- Revenue: ${company.revenue}

## Current Situation
${rapportHook}
Recently working on: ${project}

## Our Advantages
- Proven track record in ${company.industry}
- Solutions designed for ${company.companySize} companies
- Strong ROI for similar revenue profiles

## Competitive Threats
- Incumbent vendors
- "Do nothing" option
- Budget constraints

## Key Messages
1. We understand ${company.industry} challenges
2. Our solution scales with ${company.companySize} companies
3. Proven ROI for similar revenue profiles`;

    return {
      id: generateId(),
      name: `Battlecard: ${company.name}`,
      type: "battlecard",
      targetId: company.id,
      targetName: company.name,
      title: `Battlecard: ${company.name}`,
      content,
      targetAudience: `Sales team and SEs engaging ${company.name}`,
      keyPoints: [
        `Industry expertise: ${company.industry}`,
        `Company size fit: ${company.companySize}`,
        `Revenue tier: ${company.revenue}`,
        `Current project: ${project}`,
      ],
      attachments: [`${company.industry}_competitive_analysis.pdf`],
      leadMagnets: [
        `Competitive Analysis: ${company.industry}`,
        `ROI Calculator for ${company.companySize} Companies`,
      ],
      emailDraft: `Hi [Name], I saw you're working on ${project}. We've helped many ${company.industry} companies optimize similar initiatives. Would you like to see some relevant case studies?`,
      suggestedContent: `Whitepaper: "${company.industry} Competitive Landscape 2024"`,
      targetBuyerGroup: company.id,
      effectiveness: 0.78,
      rapportHook,
      recommendedArticles: [
        {
          title: `Competitive Analysis: ${company.industry}`,
          url: `https://example.com/${company.industry.toLowerCase()}-competitive-analysis`,
        },
      ],
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private generatePresentation(company: BuyerCompany): EnablementAsset {
    const content = `# Executive Presentation: ${company.name}
    
## Agenda
1. Understanding ${company.name}'s challenges
2. Our proven approach for ${company.industry}
3. Success stories from similar companies
4. Proposed solution and next steps

## Company Context
- ${company.name} in ${company.industry}
- ${company.companySize} company with ${company.revenue} revenue
- Technology stack includes: ${company.techStack.join(", ")}

## Value Proposition
Tailored solutions for ${company.industry} companies of your size and scale.

## Case Studies
- Similar ${company.companySize} company in ${company.industry}
- Achieved 30% efficiency improvement
- ROI realized within 6 months

## Next Steps
1. Discovery workshop
2. Detailed assessment
3. Customized proposal
4. Pilot program`;

    return {
      id: generateId(),
      name: `Executive Presentation: ${company.name}`,
      type: "presentation",
      targetId: company.id,
      targetName: company.name,
      title: `Executive Presentation: ${company.name}`,
      content,
      targetAudience: `Executive team and decision makers at ${company.name}`,
      keyPoints: [
        `Tailored for ${company.industry}`,
        `Designed for ${company.companySize} companies`,
        `Addresses revenue tier: ${company.revenue}`,
        `Technology integration ready`,
      ],
      attachments: [`${company.name}_executive_presentation.pptx`],
      leadMagnets: [
        `Executive Brief: ${company.industry} Transformation`,
        `ROI Model for ${company.companySize} Companies`,
      ],
      emailDraft: `Hi [Name], I'd like to share some insights on how ${company.industry} companies like ${company.name} are driving transformation. Would you be interested in a brief executive overview?`,
      suggestedContent: `Executive Brief: "${company.industry} Digital Transformation Guide"`,
      targetBuyerGroup: company.id,
      effectiveness: 0.92,
      rapportHook: `Based on your company's position in ${company.industry} and focus on growth`,
      recommendedArticles: [
        {
          title: `Executive Guide: ${company.industry} Transformation`,
          url: `https://example.com/${company.industry.toLowerCase()}-transformation-guide`,
        },
      ],
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  generateCompanyEnablement(
    company: BuyerCompany,
    enrichedProfile?: EnrichedProfile,
  ): EnablementAsset {
    const rapportHook = this.extractRapportHook(
      enrichedProfile || { recentActivity: [] },
    );
    const valueAdds = this.extractValueAdds(company, enrichedProfile);
    const suggestedContent = this.extractSuggestedContent(company);
    const emailDraft = CONFIG.templates.email
      .replace("{name}", company.name)
      .replace("{rapport_hook}", rapportHook)
      .replace("{industry}", company.industry)
      .replace("{value_add_1}", valueAdds[0] || "industry expertise")
      .replace("{value_add_2}", valueAdds[1] || "proven solutions")
      .replace("{value_add_3}", valueAdds[2] || "growth opportunities");

    return {
      id: generateId(),
      name: `${company.name} Engagement Playbook`,
      type: "company",
      targetId: company.id,
      targetName: company.name,
      title: `${company.name} Engagement Playbook`,
      content: emailDraft,
      targetAudience: "Sales Team",
      keyPoints: valueAdds,
      attachments: [suggestedContent],
      leadMagnets: [
        `${company.industry} Industry Report`,
        `${company.companySize} Company Case Studies`,
      ],
      emailDraft,
      suggestedContent,
      targetBuyerGroup: company.id,
      effectiveness: 0.8,
      rapportHook,
      recommendedArticles: [
        {
          title: `${company.industry} Best Practices 2024`,
          url: `https://example.com/${company.industry.toLowerCase()}-best-practices`,
        },
      ],
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  generatePersonEnablement(
    person: Person,
    company: BuyerCompany,
    enrichedProfile?: EnrichedProfile,
  ): EnablementAsset {
    const rapportHook = this.extractRapportHook(
      enrichedProfile || { recentActivity: [] },
    );
    const valueAdds = this.extractPersonValueAdds(
      person,
      company,
      enrichedProfile,
    );
    const suggestedContent = this.extractSuggestedContent(company);

    // Determine personality type based on role and department
    const personality = person.title.toLowerCase().includes("chief")
      ? ["Direct"]
      : ["Friendly"];
    const personalityBlend = this.blendPersonalityTemplates(personality);

    // Adjust summary/action based on seniority
    const isAboveTheLine =
      person.title.toLowerCase().includes("chief") ||
      person.title.toLowerCase().includes("vp");
    const summary = isAboveTheLine
      ? `(Strategic) ${personalityBlend.summary}`
      : `(Tactical) ${personalityBlend.summary}`;
    const action = isAboveTheLine
      ? `Focus on business impact and cross-functional wins. ${personalityBlend.action}`
      : `Focus on team wins and personal growth. ${personalityBlend.action}`;

    const emailDraft = personalityBlend.email.replace("{name}", person.name);

    return {
      id: generateId(),
      name: `${person.name} Engagement Strategy`,
      type: "person",
      targetId: person.id,
      targetName: person.name,
      title: `${person.name} Engagement Strategy`,
      content: emailDraft,
      targetAudience: "Sales Team",
      keyPoints: [summary, action, ...valueAdds],
      attachments: [suggestedContent],
      leadMagnets: [
        `${person.department} Executive Guide`,
        `${person.title} Success Framework`,
      ],
      emailDraft,
      suggestedContent,
      targetBuyerGroup: person.companyId,
      effectiveness: 0.75,
      rapportHook,
      recommendedArticles: [
        {
          title: `${person.department} Leadership Best Practices`,
          url: `https://example.com/${(person.department ?? "general").toLowerCase()}-leadership`,
        },
      ],
      personalityInsights: {
        dominantPersonality: personality,
        aboveTheLine: isAboveTheLine,
        enablementType: isAboveTheLine ? "strategic" : "tactical",
        summary,
        actionItems: [action],
      },
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  generateTeamEnablement(
    people: Person[],
    company: BuyerCompany,
    enrichedProfiles: EnrichedProfile[],
  ): EnablementAsset {
    const teamName = people[0]?.department || "Team";

    // Get team insights from enriched profiles
    const teamInsights = enrichedProfiles.map((profile) => ({
      activity: profile['recentActivity']?.[0]?.description || "team initiatives",
      painPoint: profile['painPoints']?.[0]?.description || "team challenges",
      motivation: profile['motivations']?.[0]?.description || "team success",
    }));

    const valueAdds = [
      `Your team (${teamName}) is positioned to lead in ${company.industry} this year.`,
      `Recent focus on ${teamInsights[0]?.activity} shows your commitment to excellence.`,
      `Addressing ${teamInsights[0]?.painPoint} will drive ${teamInsights[0]?.motivation}.`,
    ];

    const emailDraft = CONFIG.templates.personEmail
      .replace("{name}", teamName)
      .replace("{role}", "team")
      .replace("{department}", teamName)
      .replace("{company}", company.name)
      .replace("{value_add_1}", valueAdds[0] || "strategic value")
      .replace("{value_add_2}", valueAdds[1] || "operational efficiency")
      .replace("{value_add_3}", valueAdds[2] || "competitive advantage");

    return {
      id: generateId(),
      name: `${teamName} Enablement Strategy`,
      type: "presentation",
      targetId: teamName,
      targetName: `${teamName} Team`,
      title: `${teamName} Enablement Strategy`,
      content: emailDraft,
      targetAudience: "Sales Team",
      keyPoints: valueAdds,
      attachments: [this.extractSuggestedContent(company)],
      leadMagnets: [
        `${teamName} Team Success Guide`,
        `${company.industry} Department Best Practices`,
      ],
      emailDraft,
      suggestedContent: this.extractSuggestedContent(company),
      targetBuyerGroup: company.id,
      effectiveness: 0.7,
      rapportHook: `focused on ${teamName} excellence`,
      recommendedArticles: [
        {
          title: `${teamName} Team Excellence Guide`,
          url: `https://example.com/${teamName.toLowerCase()}-team-guide`,
        },
      ],
      competitorBattlecards: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function generateEnablementAssets(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (!data.buyerCompanies?.length) {
    throw new Error(
      "Buyer companies are required for enablement asset generation",
    );
  }

  const generator = new EnablementGenerator();
  const assets: EnablementAsset[] = [];

  // Generate company-level assets
  for (const company of data.buyerCompanies) {
    const enrichedProfile = data.enrichedProfiles?.find(
      (p) => p['companyId'] === company.id,
    );
    assets.push(generator.generateCompanyEnablement(company, enrichedProfile));
  }

  // Generate person-level assets
  if (data.peopleData?.length) {
    for (const person of data.peopleData) {
      const company = data.buyerCompanies.find(
        (c) => c['id'] === person.companyId,
      );
      if (!company) continue;

      const enrichedProfile = data.enrichedProfiles?.find(
        (p) => p['personId'] === person.id,
      );
      assets.push(
        generator.generatePersonEnablement(person, company, enrichedProfile),
      );
    }
  }

  // Generate team-level assets
  if (data.buyerGroups?.length) {
    for (const group of data.buyerGroups) {
      const company = data.buyerCompanies.find((c) => c['id'] === group.companyId);
      if (!company) continue;

      const groupPeople = data.peopleData.filter((p) =>
        group.members.includes(p.id),
      );
      const groupProfiles =
        data.enrichedProfiles?.filter((p) =>
          group.members.includes(p.personId),
        ) || [];
      assets.push(
        generator.generateTeamEnablement(groupPeople, company, groupProfiles),
      );
    }
  }

  return {
    enablementAssets: assets,
  };
}
