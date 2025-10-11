import { v4 as uuidv4 } from "uuid";
import {
  PipelineData,
  OpportunityPlaybook,
  EngagementPlaybook,
  CompetitorBattlecard,
  EnrichedProfile,
} from "../types";

interface SalesPlaybook {
  id: string;
  companyId: string;
  companyName: string;
  opportunityPlaybook: OpportunityPlaybook;
  engagementPlaybook: EngagementPlaybook;
  competitorBattlecards: CompetitorBattlecard[];
  keyStakeholders: EnrichedProfile[];
  salesStrategy: {
    approach: string;
    valueProposition: string;
    keyMessages: string[];
    objections: Array<{
      objection: string;
      response: string;
    }>;
  };
  salesProcess: {
    phase: string;
    activities: Array<{
      activity: string;
      owner: string;
      timeline: string;
      successCriteria: string[];
      resources: string[];
    }>;
  }[];
  successMetrics: {
    metric: string;
    target: string;
    timeframe: string;
  }[];
  lastUpdated: string;
}

class SalesPlaybookGenerator {
  private generateSalesStrategy(
    opportunityPlaybook: OpportunityPlaybook,
  ): SalesPlaybook["salesStrategy"] {
    return {
      approach: opportunityPlaybook.strategy.approach,
      valueProposition: opportunityPlaybook.strategy.valueProposition,
      keyMessages: opportunityPlaybook.strategy.keyMessages,
      objections: opportunityPlaybook.strategy.objections,
    };
  }

  private generateSalesProcess(
    engagementPlaybook: EngagementPlaybook,
  ): SalesPlaybook["salesProcess"] {
    return engagementPlaybook.phases.map((phase: any) => ({
      phase: phase.phase,
      activities: phase.activities.map((activity: any) => ({
        activity: activity.activity,
        owner: activity.owner,
        timeline: activity.timeline,
        successCriteria: activity.successCriteria,
        resources: activity.resources || [],
      })),
    }));
  }

  private generateSuccessMetrics(
    opportunityPlaybook: OpportunityPlaybook,
    engagementPlaybook: EngagementPlaybook,
  ): SalesPlaybook["successMetrics"] {
    return [
      ...opportunityPlaybook.successMetrics,
      ...engagementPlaybook.successMetrics,
    ];
  }

  public generatePlaybook(
    opportunityPlaybook: OpportunityPlaybook,
    engagementPlaybook: EngagementPlaybook,
    competitorBattlecards: CompetitorBattlecard[],
    keyStakeholders: EnrichedProfile[],
  ): SalesPlaybook {
    return {
      id: uuidv4(),
      companyId: opportunityPlaybook.companyId,
      companyName: opportunityPlaybook.companyName,
      opportunityPlaybook,
      engagementPlaybook,
      competitorBattlecards,
      keyStakeholders,
      salesStrategy: this.generateSalesStrategy(opportunityPlaybook),
      salesProcess: this.generateSalesProcess(engagementPlaybook),
      successMetrics: this.generateSuccessMetrics(
        opportunityPlaybook,
        engagementPlaybook,
      ),
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function generateSalesPlaybooks(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (
    !data.opportunityPlaybooks ||
    !data.engagementPlaybooks ||
    !data.competitorBattlecards
  ) {
    throw new Error("Missing required data for sales playbook generation");
  }

  const generator = new SalesPlaybookGenerator();
  const salesPlaybooks = data.opportunityPlaybooks.map(
    (opportunityPlaybook: any) => {
      const engagementPlaybook = data.engagementPlaybooks!.find(
        (ep: any) => ep['companyId'] === opportunityPlaybook.companyId,
      );
      if (!engagementPlaybook) {
        throw new Error(
          `No engagement playbook found for company ${opportunityPlaybook.companyId}`,
        );
      }

      const competitorBattlecards = data.competitorBattlecards!.filter(
        (cb: any) => cb['companyId'] === opportunityPlaybook.companyId,
      );

      return generator.generatePlaybook(
        opportunityPlaybook,
        engagementPlaybook,
        competitorBattlecards,
        opportunityPlaybook.keyStakeholders,
      );
    },
  );

  return {
    salesPlaybooks,
  };
}
