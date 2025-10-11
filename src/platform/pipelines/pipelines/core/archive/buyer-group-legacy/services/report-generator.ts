/**
 * 📋 REPORT GENERATOR
 * 
 * Generates comprehensive intelligence reports with pain intelligence integration
 */

import { BuyerGroup, PersonProfile, CoreSignalProfile, IntelligenceReport, SellerProfile, LLMConfig } from './types';
import { PainIntelligenceEngine } from './pain-intelligence';

export class ReportGenerator {
  private painEngine: PainIntelligenceEngine;

  constructor() {
    this['painEngine'] = new PainIntelligenceEngine();
  }

  /**
   * Generate comprehensive intelligence report
   */
  async generateIntelligenceReport(
    buyerGroup: BuyerGroup, 
    personProfiles: PersonProfile[], 
    coreSignalProfiles: CoreSignalProfile[],
    sellerProfile: SellerProfile
  ): Promise<IntelligenceReport> {
    
    const engagementStrategy = this.generateEngagementStrategy(buyerGroup, personProfiles, sellerProfile);
    const enablementAssets = this.generateEnablementAssets(buyerGroup, personProfiles, sellerProfile);
    const recommendations = this.generateRecommendations(buyerGroup, personProfiles);
    
    // Aggregate pain intelligence across the buyer group
    const roleWeights = this.calculateRoleWeights(buyerGroup);
    const painIntelligence = this.painEngine.aggregatePainIntelligence(coreSignalProfiles, roleWeights);
    
    return {
      companyName: buyerGroup.companyName,
      sellerProfile,
      query: {}, // Will be populated by the main pipeline
      buyerGroup,
      opportunitySignals: [],
      painIntelligence: {
        aggregatedChallenges: (painIntelligence.topChallenges || []).map(c => ({
          challenge: c.category,
          frequency: 1,
          urgency: 8,
          impact: 7
        })),
        companyWideTrends: [],
        strategicInitiatives: []
      },
      engagementStrategy,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        creditsUsed: { search: 0, collect: 0 },
        processingTime: 0
      }
    };
  }

  /**
   * Optional: Augment report with LLM-generated defensibility narrative
   */
  async augmentWithLLMDefensibility(
    report: IntelligenceReport,
    llm: LLMConfig
  ): Promise<IntelligenceReport> {
    if (!llm.enabled) return report;
    // Soft dependency: avoid importing SDKs; use fetch if env var present
    const apiKey = process['env']['OPENAI_API_KEY'];
    if (!apiKey || llm.provider !== 'openai') return report;

    // Use global fetch if available with a narrow type to avoid any
    type HttpFetch = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ json(): Promise<unknown> }>;
    const httpFetch: HttpFetch | undefined = (globalThis as unknown as { fetch?: HttpFetch }).fetch;
    if (!httpFetch) return report;

    const prompt = this.buildDefensibilityPrompt(report);
    try {
      const res = await httpFetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: llm.model,
          temperature: llm.temperature ?? 0.2,
          max_tokens: llm.maxTokens ?? 700,
          messages: [
            { role: 'system', content: 'You are an enterprise sales intelligence analyst. Be precise, concise, defensible.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content: string = json?.choices?.[0]?.message?.content ?? '';

      // Minimal parsing: keep narrative and attach rationales by personId if present in brackets
      const roleRationales: Record<string, string[]> = {};
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const match = line.match(/^\[(.+?)\]\s*:\s*(.*)$/); // [personId]: rationale
        const personId = match?.[1] || '';
        const rationale = match?.[2] || '';
        if (!personId || !rationale) continue;
        if (!roleRationales[personId]) roleRationales[personId] = [];
        roleRationales[personId].push(rationale);
      }

      return {
        ...report,
        defensibility: {
          summary: content,
          llmModel: llm.model,
          roleRationales: Object.keys(roleRationales).length ? roleRationales : undefined
        }
      };
    } catch {
      return report;
    }
  }

  private buildDefensibilityPrompt(report: IntelligenceReport): string {
    const { buyerGroup, painIntelligence } = report;
    const totalMembers = Object.values(buyerGroup.roles).flat().length;
    const roleLines: string[] = [];
    for (const [role, members] of Object.entries(buyerGroup.roles)) {
      for (const m of members) {
        // Note: Profile details would need to be passed separately for full defensibility
        roleLines.push(`${m.personId}\t${role}\t${m.confidence.toFixed(2)}`);
      }
    }
    const pains = (painIntelligence?.aggregatedChallenges || []).map(c => `- ${c.challenge}`);
    return [
      "Goal: Provide a concise, defensible justification for buyer group selection (8-12 ideal, adapt if org small/large).",
      `Company: ${buyerGroup.companyName}`,
      `Members (${totalMembers}):`,
      roleLines.join('\n'),
      "Pain Summary:",
      pains.join('\n'),
      "Instructions:",
      "1) Explain role coverage sufficiency, tradeoffs, and alternatives.",
      "2) Call out ambiguous roles and justify selections.",
      "3) Provide crisp rationale lines prefixed by [personId]:",
      "4) Keep under 300 words.",
      `${sellerProfile.productName} value proposition`,
      'ROI and efficiency gains',
      'Competitive differentiation',
      'Implementation timeline and support'
    ];
    
    const riskMitigation = [];
    if (roles.blocker.length > 0) {
      riskMitigation.push('Early blocker engagement and education');
    }
    if (dynamics.consensusLevel < 1) {
      riskMitigation.push('Champion development and enablement');
    }
    if (buyerGroup.flightRisk.some(risk => risk['riskLevel'] === 'CRITICAL')) {
      riskMitigation.push('Accelerated timeline due to flight risk');
    }
    
    return {
      primaryApproach,
      sequencing,
      messaging: keyMessages.reduce((acc, msg, i) => ({ ...acc, [`message_${i}`]: msg }), {}),
      riskMitigation
    };
  }

  /**
   * Generate enablement assets based on buyer group composition
   */
  private generateEnablementAssets(
    buyerGroup: BuyerGroup, 
    profiles: PersonProfile[],
    sellerProfile: SellerProfile
  ): IntelligenceReport['enablementAssets'] {
    
    const playbooks = [`${buyerGroup.companyName} Engagement Playbook`];
    const battlecards = ['Competitive Positioning Guide'];
    const emailTemplates = ['Executive Outreach Template', 'Champion Nurture Sequence'];
    const callScripts = ['Discovery Call Script', 'Demo Presentation Script'];
    
    return [
      ...playbooks.map(p => ({ type: 'playbook', title: p, description: `${p} for ${buyerGroup.companyName}`, priority: 'high' as const })),
      ...battlecards.map(b => ({ type: 'battlecard', title: b, description: `${b} for competitive positioning`, priority: 'medium' as const })),
      ...emailTemplates.map(e => ({ type: 'email_template', title: e, description: `${e} for outreach`, priority: 'high' as const })),
      ...callScripts.map(c => ({ type: 'call_script', title: c, description: `${c} for conversations`, priority: 'medium' as const }))
    ];
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    buyerGroup: BuyerGroup, 
    profiles: PersonProfile[]
  ): IntelligenceReport['recommendations'] {
    const recommendations: IntelligenceReport['recommendations'] = [];
    
    // Add high-pain profile recommendations
    const highPainProfiles = profiles.filter(p => p.painIntelligence?.overallPainScore && p.painIntelligence.overallPainScore > 70);
    if (highPainProfiles.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        description: `Prioritize engagement with ${highPainProfiles.length} high-pain contacts identified`,
        rationale: 'High pain score profiles identified for targeted engagement',
        action: `Prioritize engagement with ${highPainProfiles.length} high-pain contacts identified`,
        timeline: '1 week',
        confidence: 0.85
      });
    }
    
    return recommendations;
  }

  /**
   * Generate engagement strategy summary
   */
  private generateEngagementStrategy(
    buyerGroup: BuyerGroup,
    report: IntelligenceReport
  ): string[] {
    const painIntelligence = report.painIntelligence;
    
    return [
      `Identified ${Object.values(buyerGroup.roles).flat().length} key stakeholders across buyer group`,
      `${buyerGroup.roles.decision.length} decision maker(s) with ${buyerGroup.dynamics.riskLevel} complexity risk`,
      `Overall pain score: ${painIntelligence?.overallPainScore || 0}/100`,
      `Initiate ${report.engagementStrategy.primaryApproach.toLowerCase()}`,
      `Target timeline: ${report.engagementStrategy.timeline}`,
      ...(report.recommendations || []).filter(r => r['priority'] === 'critical' || r['priority'] === 'high')
                               .map(r => r.action).filter((action): action is string => action !== undefined)
    ];
  }
}
