import {
  PipelineData,
  SalesPlaybook,
  EnablementAsset,
  BuyerCompany,
  BuyerGroup,
} from "../types";

interface HypermodernReport {
  id: string;
  companyId: string;
  companyName: string;
  timestamp: string;
  sections: {
    companySummary: {
      title: string;
      content: string;
      insights: string[];
      callouts: Array<{
        type: "insight" | "warning" | "opportunity";
        text: string;
      }>;
    };
    buyerGroup: {
      title: string;
      content: string;
      insights: string[];
      callouts: Array<{
        type: "insight" | "warning" | "opportunity";
        text: string;
      }>;
    };
    dealRouting: {
      title: string;
      content: string;
      insights: string[];
      callouts: Array<{
        type: "insight" | "warning" | "opportunity";
        text: string;
      }>;
    };
    enrichment: {
      title: string;
      content: string;
      insights: string[];
      callouts: Array<{
        type: "insight" | "warning" | "opportunity";
        text: string;
      }>;
    };
    enablement: {
      title: string;
      content: string;
      insights: string[];
      callouts: Array<{
        type: "insight" | "warning" | "opportunity";
        text: string;
      }>;
    };
  };
  visualizations: Array<{
    type: "chart" | "graph" | "table";
    title: string;
    data: Record<string, unknown>;
  }>;
  recommendations: Array<{
    category: string;
    description: string;
    priority: number;
    actionItems: string[];
  }>;
}

class HypermodernReportGenerator {
  private generateCompanySummary(
    company: BuyerCompany,
    salesPlaybook: SalesPlaybook,
  ): HypermodernReport["sections"]["companySummary"] {
    return {
      title: "Company Overview",
      content: `${company.name} is a ${company.industry} company with ${company.companySize} employees.`,
      insights: [
        `Market Position: ${company.g2Data?.marketPosition.category || "Not available"}`,
        `Tech Stack: ${company.techStack.join(", ")}`,
        `Revenue: ${company.revenue}`,
      ],
      callouts: [
        {
          type: "opportunity",
          text: `Strong potential for ${salesPlaybook.salesStrategy.approach}`,
        },
        {
          type: "warning",
          text: `Competitive landscape includes ${company.competitors.length} direct competitors`,
        },
      ],
    };
  }

  private generateBuyerGroupSection(
    buyerGroup: BuyerGroup,
  ): HypermodernReport["sections"]["buyerGroup"] {
    return {
      title: "Buyer Group Analysis",
      content: `Key stakeholders at ${buyerGroup.companyName} include ${buyerGroup.decisionMakers.length} decision makers and ${buyerGroup.champions.length} champions.`,
      insights: [
        `Power Distribution: ${buyerGroup.dynamics.powerDistribution}`,
        `Consensus Level: ${buyerGroup.dynamics.consensusLevel}`,
        `Risk Level: ${buyerGroup.dynamics.riskLevel}`,
      ],
      callouts: [
        {
          type: "insight",
          text: `Primary champion: ${buyerGroup['champions'][0] || "Not identified"}`,
        },
        {
          type: "warning",
          text: `Potential blockers: ${buyerGroup.blockers.length} identified`,
        },
      ],
    };
  }

  private generateDealRoutingSection(
    salesPlaybook: SalesPlaybook,
  ): HypermodernReport["sections"]["dealRouting"] {
    return {
      title: "Deal Strategy",
      content: salesPlaybook.salesStrategy.approach,
      insights: [
        `Value Proposition: ${salesPlaybook.salesStrategy.valueProposition}`,
        `Key Messages: ${salesPlaybook.salesStrategy.keyMessages.join(", ")}`,
        `Timeline: ${salesPlaybook['salesProcess'][0].phase}`,
      ],
      callouts: [
        {
          type: "opportunity",
          text: `Primary differentiator: ${salesPlaybook.salesStrategy['keyMessages'][0]}`,
        },
        {
          type: "warning",
          text: `Key objection: ${salesPlaybook.salesStrategy['objections'][0].objection}`,
        },
      ],
    };
  }

  private generateEnrichmentSection(
    enablementAssets: EnablementAsset[],
  ): HypermodernReport["sections"]["enrichment"] {
    const companyAsset = enablementAssets.find((a) => a['type'] === "company");
    const personAssets = enablementAssets.filter((a) => a['type'] === "person");

    return {
      title: "Enrichment Insights",
      content: companyAsset?.content || "No company enrichment available",
      insights: [
        `Lead Magnets: ${companyAsset?.leadMagnets.join(", ") || "Not available"}`,
        `Rapport Hooks: ${companyAsset?.rapportHook || "Not available"}`,
        `Personality Insights: ${personAssets.length} profiles analyzed`,
      ],
      callouts: [
        {
          type: "insight",
          text: `Top value add: ${companyAsset?.leadMagnets[0] || "Not available"}`,
        },
        {
          type: "opportunity",
          text: `Suggested content: ${companyAsset?.suggestedContent || "Not available"}`,
        },
      ],
    };
  }

  private generateEnablementSection(
    enablementAssets: EnablementAsset[],
  ): HypermodernReport["sections"]["enablement"] {
    const assets = enablementAssets.filter(
      (a) => a['type'] === "playbook" || a['type'] === "battlecard",
    );

    return {
      title: "Enablement Strategy",
      content: `Generated ${assets.length} enablement assets for sales team`,
      insights: [
        `Playbooks: ${assets.filter((a) => a['type'] === "playbook").length}`,
        `Battlecards: ${assets.filter((a) => a['type'] === "battlecard").length}`,
        `Presentations: ${assets.filter((a) => a['type'] === "presentation").length}`,
      ],
      callouts: [
        {
          type: "insight",
          text: `Primary enablement focus: ${assets[0]?.title || "Not available"}`,
        },
        {
          type: "opportunity",
          text: `Key points: ${assets[0]?.keyPoints.join(", ") || "Not available"}`,
        },
      ],
    };
  }

  private generateVisualizations(
    salesPlaybook: SalesPlaybook,
    buyerGroup: BuyerGroup,
  ): HypermodernReport["visualizations"] {
    return [
      {
        type: "chart",
        title: "Sales Process Timeline",
        data: {
          phases: salesPlaybook.salesProcess.map((phase: any) => ({
            phase: phase.phase,
            activities: phase.activities.length,
          })),
        },
      },
      {
        type: "graph",
        title: "Buyer Group Dynamics",
        data: {
          powerDistribution: buyerGroup.dynamics.powerDistribution,
          consensusLevel: buyerGroup.dynamics.consensusLevel,
          riskLevel: buyerGroup.dynamics.riskLevel,
        },
      },
    ];
  }

  private generateRecommendations(
    salesPlaybook: SalesPlaybook,
    buyerGroup: BuyerGroup,
  ): HypermodernReport["recommendations"] {
    return [
      {
        category: "Strategy",
        description: salesPlaybook.salesStrategy.approach,
        priority: 1,
        actionItems: salesPlaybook['salesProcess'][0].activities.map(
          (a: any) => a.activity,
        ),
      },
      {
        category: "Stakeholder Engagement",
        description: `Engage with ${buyerGroup.champions.length} champions and ${buyerGroup.decisionMakers.length} decision makers`,
        priority: 2,
        actionItems: [
          `Schedule meetings with champions: ${buyerGroup.champions.join(", ")}`,
          `Prepare presentations for decision makers: ${buyerGroup.decisionMakers.join(", ")}`,
        ],
      },
    ];
  }

  public generateReport(
    company: BuyerCompany,
    salesPlaybook: SalesPlaybook,
    buyerGroup: BuyerGroup,
    enablementAssets: EnablementAsset[],
  ): HypermodernReport {
    return {
      id: `report-${company.id}`,
      companyId: company.id,
      companyName: company.name,
      timestamp: new Date().toISOString(),
      sections: {
        companySummary: this.generateCompanySummary(company, salesPlaybook),
        buyerGroup: this.generateBuyerGroupSection(buyerGroup),
        dealRouting: this.generateDealRoutingSection(salesPlaybook),
        enrichment: this.generateEnrichmentSection(enablementAssets),
        enablement: this.generateEnablementSection(enablementAssets),
      },
      visualizations: this.generateVisualizations(salesPlaybook, buyerGroup),
      recommendations: this.generateRecommendations(salesPlaybook, buyerGroup),
    };
  }
}

export async function generateHypermodernReports(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const { buyerCompanies, salesPlaybooks, buyerGroups, enablementAssets } =
    data;

  if (!buyerCompanies || !salesPlaybooks || !buyerGroups || !enablementAssets) {
    throw new Error("Required data missing for hypermodern report generation");
  }

  const generator = new HypermodernReportGenerator();
  const reports = buyerCompanies.map((company: BuyerCompany) => {
    const salesPlaybook = salesPlaybooks.find(
      (p: any) => p['companyId'] === company.id,
    );
    const buyerGroup = buyerGroups.find((g) => g['companyId'] === company.id);
    const companyAssets = enablementAssets.filter(
      (a) => a['targetId'] === company.id,
    );

    if (!salesPlaybook || !buyerGroup) {
      throw new Error(`Missing required data for company ${company.id}`);
    }

    return generator.generateReport(
      company,
      salesPlaybook,
      buyerGroup,
      companyAssets,
    );
  });

  return { hypermodernReports: reports };
}
