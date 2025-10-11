import {
  PipelineData,
  BuyerGroup,
  BuyerCompany,
  Person,
  EnrichedProfile,
  IntelligenceReport,
} from "../types";

export class IntelligenceReportGenerator {
  private calculateGroupMetrics(
    group: BuyerGroup,
    people: Person[],
  ): {
    influenceScore: number;
    coverageScore: number;
    engagementScore: number;
  } {
    const groupMembers = people.filter((p) => group.members.includes(p.id));

    // Calculate influence score based on member influence and decision power
    const influenceScore =
      groupMembers.reduce(
        (sum, member) =>
          sum + (member.influence * 0.6 + member.decisionPower * 0.4),
        0,
      ) / groupMembers.length;

    // Calculate coverage score based on department diversity
    const departments = new Set(groupMembers.map((m) => m.department));
    const coverageScore = departments.size / 10; // Assuming max 10 departments

    // Calculate engagement score based on group dynamics
    const engagementScore =
      group.dynamics.powerDistribution * 0.3 +
      group.dynamics.consensusLevel * 0.4 +
      (1 - group.dynamics.riskLevel) * 0.3;

    return {
      influenceScore,
      coverageScore,
      engagementScore,
    };
  }

  private generateCompanyInsights(company: BuyerCompany): string[] {
    const insights: string[] = [];

    // Market position insights
    insights.push(
      `Company operates in ${company.industry} industry with ${company.companySize} size`,
    );
    insights.push(`Annual revenue: ${company.revenue}`);

    // Tech stack insights
    if (company.techStack.length > 0) {
      insights.push(
        `Uses modern tech stack including ${company.techStack.slice(0, 3).join(", ")}`,
      );
    }

    // Competitor insights
    if (company.competitors.length > 0) {
      insights.push(
        `Faces competition from ${company.competitors.length} direct competitors`,
      );
    }

    return insights;
  }

  private generatePersonInsights(
    person: Person,
    enrichedProfile?: EnrichedProfile,
  ): string[] {
    const insights: string[] = [];

    // Role and influence insights
    insights.push(
      `${person.name} holds ${person.title || "Unknown Position"} position with ${(person.influence * 100).toFixed(0)}% influence`,
    );

    // Department insights
    insights.push(`Key member of ${person.department} department`);

    // Enriched profile insights
    if (enrichedProfile) {
      // Add motivation insights
      if (
        enrichedProfile['motivations'] &&
        enrichedProfile.motivations.length > 0
      ) {
        insights.push(
          `Primary motivations: ${enrichedProfile['motivations'][0].description}`,
        );
      }

      // Add pain point insights
      if (enrichedProfile['painPoints'] && enrichedProfile.painPoints.length > 0) {
        insights.push(
          `Key challenges: ${enrichedProfile['painPoints'][0].description}`,
        );
      }

      // Add recent activity insights
      if (
        enrichedProfile['recentActivity'] &&
        enrichedProfile.recentActivity.length > 0
      ) {
        const recentActivity = enrichedProfile['recentActivity'][0];
        insights.push(`Recently: ${recentActivity.description}`);
      }
    }

    return insights;
  }

  private generateRecommendations(
    group: BuyerGroup,
    company: BuyerCompany,
    people: Person[],
  ): Array<{
    category: string;
    description: string;
    priority: number;
    actionItems: string[];
  }> {
    const recommendations: Array<{
      category: string;
      description: string;
      priority: number;
      actionItems: string[];
    }> = [];

    // Engagement strategy recommendations
    if (group.dynamics.riskLevel > 0.7) {
      recommendations.push({
        category: "Risk Mitigation",
        description: "High risk level detected in buyer group dynamics",
        priority: 1,
        actionItems: [
          "Engage champions early to build support",
          "Address blockers' concerns proactively",
          "Develop strong business case with ROI focus",
        ],
      });
    }

    // Decision-making recommendations
    if (group.dynamics.consensusLevel < 0.5) {
      recommendations.push({
        category: "Decision Process",
        description:
          "Low consensus level indicates potential decision challenges",
        priority: 2,
        actionItems: [
          "Focus on building consensus among decision makers",
          "Identify and address potential objections early",
          "Create clear decision criteria and timeline",
        ],
      });
    }

    // Relationship building recommendations
    const champions = people.filter((p) => group.champions.includes(p.id));
    if (champions['length'] === 0) {
      recommendations.push({
        category: "Relationship Building",
        description: "No clear champions identified in buyer group",
        priority: 3,
        actionItems: [
          "Identify potential champions among decision makers",
          "Develop personalized engagement strategy for each champion",
          "Create value proposition aligned with champions' goals",
        ],
      });
    }

    return recommendations;
  }

  generateIntelligenceReport(
    group: BuyerGroup,
    company: BuyerCompany,
    people: Person[],
    enrichedProfiles: EnrichedProfile[],
  ): IntelligenceReport {
    const companyInsights = this.generateCompanyInsights(company);

    group.members.forEach((memberId) => {
      const person = people.find((p) => p['id'] === memberId);
      const enrichedProfile = enrichedProfiles.find(
        (p) => p['personId'] === memberId,
      );
      if (person) {
        this.generatePersonInsights(person, enrichedProfile);
      }
    });

    const recommendations = this.generateRecommendations(
      group,
      company,
      people,
    );

    const content = `# Intelligence Report for ${company.name}

## Market Analysis
- Market Size: ${company.companySize}
- Industry: ${company.industry}
- Tech Stack: ${company.techStack.join(", ")}

## Competitive Landscape
${company.competitors.map((c: any) => `- ${c.name} in ${c.industry}`).join("\n")}

## Buyer Group Analysis
- Members: ${group.members.length}
- Decision makers: ${group.decisionMakers.length}
- Champions: ${group.champions.length}

## Key Insights
${companyInsights.map((insight) => `- ${insight}`).join("\n")}

## Recommendations
${recommendations.map((rec) => `- ${rec.description} (Priority: ${rec.priority})`).join("\n")}`;

    return {
      id: `intel-report-${company.id}-${group.id}`,
      title: `Intelligence Report: ${company.name}`,
      content,
      insights: companyInsights,
      recommendations,
      confidence: 0.85,
      companyId: company.id,
      buyerGroups: [group],
      marketAnalysis: {
        marketSize: company.companySize,
        growthRate: "To be determined",
        trends: companyInsights,
        opportunities: [
          `Strong presence in ${company.industry}`,
          `Modern tech stack adoption`,
          `Growing company size`,
        ],
        threats: company.competitors.map(
          (c: any) => `Competition from ${c.name} in ${c.industry}`,
        ),
      },
      competitorAnalysis: {
        directCompetitors: company.competitors,
        indirectCompetitors: [],
        competitiveAdvantages: [
          "Modern tech stack",
          "Strong market presence",
          "Growing company size",
        ],
        competitiveDisadvantages: company.competitors.map(
          (c: any) => `Competition from ${c.name} in ${c.industry}`,
        ),
      },
    };
  }
}

export async function generateIntelligenceReports(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (
    !data.buyerGroups ||
    !data.buyerCompanies ||
    !data.peopleData ||
    !data.enrichedProfiles
  ) {
    throw new Error("Required data missing for intelligence report generation");
  }

  const generator = new IntelligenceReportGenerator();
  const reports: IntelligenceReport[] = [];

  for (const group of data.buyerGroups) {
    const company = data.buyerCompanies.find((c) => c['id'] === group.companyId);
    if (!company) continue;

    const people = data.peopleData.filter((p) => group.members.includes(p.id));
    const enrichedProfiles = data.enrichedProfiles.filter((p) =>
      group.members.includes(p.personId),
    );

    const report = generator.generateIntelligenceReport(
      group,
      company,
      people,
      enrichedProfiles,
    );

    reports.push(report);
  }

  return {
    ...data,
    intelligenceReports: reports,
  };
}
