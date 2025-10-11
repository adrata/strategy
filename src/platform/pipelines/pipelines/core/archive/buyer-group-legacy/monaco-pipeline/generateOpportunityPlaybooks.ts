import {
  PipelineData,
  OpportunityPlaybook,
  BuyerGroup,
  OpportunitySignal,
} from "../types";

export async function generateOpportunityPlaybooks(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const { buyerGroups, opportunitySignals, enrichedProfiles } = data;

  if (!buyerGroups || !opportunitySignals || !enrichedProfiles) {
    throw new Error(
      "Required data missing for opportunity playbook generation",
    );
  }

  const opportunityPlaybooks: OpportunityPlaybook[] = [];

  // Generate playbooks for each buyer group
  for (const group of buyerGroups) {
    // Find relevant signals for this group
    const groupSignals = opportunitySignals.filter((signal: any) =>
      signal.dataSources.some((source: any) =>
        source.includes(group.companyId),
      ),
    );

    // Find key stakeholders from the group
    const keyStakeholders = enrichedProfiles.filter(
      (profile) =>
        group.members.includes(profile.personId) ||
        group.decisionMakers.includes(profile.personId) ||
        group.champions.includes(profile.personId),
    );

    // Create playbook
    const playbook: OpportunityPlaybook = {
      id: `playbook-${group.id}`,
      name: `Opportunity Playbook for ${group.companyName}`,
      companyId: group.companyId,
      companyName: group.companyName,
      opportunitySignals: groupSignals,
      targetBuyerGroup: group.id,
      keyStakeholders,
      strategy: {
        approach: determineApproach(group),
        valueProposition: generateValueProposition(group, groupSignals),
        keyMessages: generateKeyMessages(group, groupSignals),
        objections: generateObjections(group, groupSignals),
      },
      timeline: generateTimeline(),
      successMetrics: generateSuccessMetrics(),
      lastUpdated: new Date().toISOString(),
      strategies: [determineApproach(group)],
      tactics: generateKeyMessages(group, groupSignals),
      success_metrics: generateSuccessMetrics().map(
        (m) => `${m.metric}: ${m.target} in ${m.timeframe}`,
      ),
    };

    opportunityPlaybooks.push(playbook);
  }

  return { opportunityPlaybooks };
}

function determineApproach(group: BuyerGroup): string {
  // Analyze group dynamics and signals to determine the best approach
  if (group.dynamics.consensusLevel > 0.7) {
    return "Consensus-driven approach focusing on group alignment and shared benefits";
  } else if (group.dynamics.powerDistribution > 0.7) {
    return "Power-based approach targeting key decision makers and influencers";
  } else {
    return "Balanced approach addressing both individual and group needs";
  }
}

function generateValueProposition(
  group: BuyerGroup,
  signals: OpportunitySignal[],
): string {
  // Generate value proposition based on group needs and opportunity signals
  const keySignals = signals.filter((s) => s.confidence > 0.7);
  const needs = keySignals.map((s) => s.insight).join(", ");

  return (
    `Our solution addresses ${group.companyName}'s critical needs: ${needs}. ` +
    `We deliver measurable results through our proven approach and industry expertise.`
  );
}

function generateKeyMessages(
  group: BuyerGroup,
  signals: OpportunitySignal[],
): string[] {
  const messages: string[] = [];

  // Add messages based on group dynamics
  if (group.dynamics.consensusLevel > 0.7) {
    messages.push(
      "Our solution enables better collaboration and alignment across teams",
    );
  }

  if (group.dynamics.powerDistribution > 0.7) {
    messages.push(
      "Enterprise-grade features with proven ROI for key stakeholders",
    );
  }

  // Add messages based on opportunity signals
  signals
    .filter((s) => s.confidence > 0.7)
    .forEach((signal) => {
      messages.push(
        `Addressing ${signal.insight} with our innovative solution`,
      );
    });

  return messages;
}

function generateObjections(
  group: BuyerGroup,
  signals: OpportunitySignal[],
): Array<{ objection: string; response: string }> {
  const objections: Array<{ objection: string; response: string }> = [];

  // Add common objections based on group dynamics
  if (group.dynamics.riskLevel > 0.7) {
    objections.push({
      objection: "The implementation seems too risky",
      response:
        "Our phased approach minimizes risk and ensures successful adoption",
    });
  }

  if (group.dynamics.consensusLevel < 0.3) {
    objections.push({
      objection: "We need more stakeholder buy-in",
      response:
        "We can help facilitate stakeholder alignment through our proven process",
    });
  }

  // Add objections based on opportunity signals
  signals
    .filter((s) => s.confidence > 0.7)
    .forEach((signal) => {
      objections.push({
        objection: `How do you address ${signal.insight}?`,
        response: `Our solution specifically targets this through ${signal['actionableItems'][0]}`,
      });
    });

  return objections;
}

function generateTimeline(): Array<{
  phase: string;
  duration: string;
  activities: Array<{
    activity: string;
    owner: string;
    timeline: string;
    successCriteria: string[];
  }>;
}> {
  return [
    {
      phase: "Discovery",
      duration: "2 weeks",
      activities: [
        {
          activity: "Initial stakeholder meetings",
          owner: "Sales Representative",
          timeline: "Week 1",
          successCriteria: [
            "Key stakeholders identified",
            "Initial requirements gathered",
            "Decision process mapped",
          ],
        },
        {
          activity: "Solution presentation",
          owner: "Solution Architect",
          timeline: "Week 2",
          successCriteria: [
            "Solution fit confirmed",
            "Technical requirements validated",
            "Implementation approach agreed",
          ],
        },
      ],
    },
    {
      phase: "Evaluation",
      duration: "3 weeks",
      activities: [
        {
          activity: "Proof of concept",
          owner: "Technical Team",
          timeline: "Weeks 3-4",
          successCriteria: [
            "Technical requirements met",
            "Performance validated",
            "Integration tested",
          ],
        },
        {
          activity: "Business case development",
          owner: "Sales Representative",
          timeline: "Week 5",
          successCriteria: [
            "ROI calculated",
            "Implementation plan created",
            "Budget approved",
          ],
        },
      ],
    },
    {
      phase: "Decision",
      duration: "2 weeks",
      activities: [
        {
          activity: "Final presentation",
          owner: "Sales Representative",
          timeline: "Week 6",
          successCriteria: [
            "All stakeholders aligned",
            "Final requirements confirmed",
            "Implementation timeline agreed",
          ],
        },
        {
          activity: "Contract negotiation",
          owner: "Sales Representative",
          timeline: "Week 7",
          successCriteria: [
            "Terms agreed",
            "Contract signed",
            "Implementation scheduled",
          ],
        },
      ],
    },
  ];
}

function generateSuccessMetrics(): Array<{
  metric: string;
  target: string;
  timeframe: string;
}> {
  return [
    {
      metric: "Revenue Impact",
      target: "20% increase",
      timeframe: "12 months",
    },
    {
      metric: "Cost Reduction",
      target: "15% reduction",
      timeframe: "6 months",
    },
    {
      metric: "User Adoption",
      target: "90% adoption",
      timeframe: "3 months",
    },
    {
      metric: "ROI",
      target: "200%",
      timeframe: "12 months",
    },
  ];
}
