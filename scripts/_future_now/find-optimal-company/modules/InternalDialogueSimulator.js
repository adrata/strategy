/**
 * Internal Dialogue Simulator
 *
 * Uses Claude to generate realistic simulations of internal conversations
 * happening within target companies. This is the "magic" that transforms
 * structural data into human insight.
 *
 * The simulation shows:
 * 1. What pressure the champion is feeling
 * 2. How different stakeholders interact
 * 3. Where objections will come from
 * 4. What framing will resonate
 * 5. The moment where our solution becomes relevant
 */

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../obp-config.json');

class InternalDialogueSimulator {
  constructor(options = {}) {
    this.config = options.config || config;
    this.productContext = options.productContext || {
      productName: 'Compliance Automation Platform',
      primaryProblem: 'Manual compliance processes that don\'t scale',
      quickWinMetric: 'SOC 2 in 4 months vs. 12-18 months manually'
    };

    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (this.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: this.anthropicApiKey });
    }

    this.model = options.model || 'claude-sonnet-4-20250514';
  }

  /**
   * Generate internal dialogue simulation
   * @param {object} orgData - Company data
   * @param {object} tensionAnalysis - From OrganizationalTensionCalculator
   * @param {object} behaviorPredictions - From BehavioralPhysicsEngine
   * @returns {object} Simulated dialogue and strategic recommendations
   */
  async generateDialogue(orgData, tensionAnalysis, behaviorPredictions) {
    console.log(`\n   Simulating internal dialogue for ${orgData.name || orgData.company_name}...`);

    if (!this.anthropic) {
      console.log('   [MOCK] No Anthropic API key - returning template dialogue');
      return this.generateMockDialogue(orgData, tensionAnalysis, behaviorPredictions);
    }

    try {
      const prompt = this.buildSimulationPrompt(orgData, tensionAnalysis, behaviorPredictions);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].text;

      // Parse the response
      return this.parseSimulationResponse(content, orgData, tensionAnalysis, behaviorPredictions);

    } catch (error) {
      console.error(`   Dialogue simulation error: ${error.message}`);
      return this.generateMockDialogue(orgData, tensionAnalysis, behaviorPredictions);
    }
  }

  /**
   * Build the prompt for dialogue simulation
   */
  buildSimulationPrompt(orgData, tensionAnalysis, behaviorPredictions) {
    const champion = behaviorPredictions.champion;
    const decisionPath = behaviorPredictions.decisionPath;
    const tensions = tensionAnalysis.tensions;

    return `You are an expert at simulating realistic internal corporate conversations. Your task is to create a vivid, realistic scene showing the internal dynamics at a target company.

## COMPANY CONTEXT

**Company:** ${orgData.name || orgData.company_name}
**Industry:** ${orgData.industry || 'B2B SaaS'}
**Size:** ${orgData.employees_count || 'Unknown'} employees
**Funding Stage:** ${tensions.resource.fundingStage || 'Unknown'}
**Growth Rate:** ${orgData.employees_count_change_yearly_percentage || 0}% YoY

## ORGANIZATIONAL TENSIONS (What's creating pressure)

**Ratio Tension (${tensions.ratio.score}/100):**
${tensions.ratio.implication}
${tensions.ratio.deviations?.map(d => `- ${d.evidence}`).join('\n') || ''}

**Leadership Tension (${tensions.leadership.score}/100):**
${tensions.leadership.implication}

**Growth Tension (${tensions.growth.score}/100):**
${tensions.growth.implication}

**Resource Tension (${tensions.resource.score}/100):**
${tensions.resource.implication}

**Reporting Tension (${tensions.reporting.score}/100):**
${tensions.reporting.implication}

## THE CHAMPION

${champion.identified ? `
**Name:** ${champion.name}
**Title:** ${champion.title}
**Tenure:** ${champion.tenureDays} days (${champion.windowRemaining} days left in 90-day window)
**Previous Company:** ${champion.previousCompany || 'Unknown'}
**Previous Title:** ${champion.previousTitle || 'Unknown'}
**Urgency Level:** ${champion.urgencyLevel}/100
**Knowledge Level:** ${champion.knowledgeLevel?.level || 'Unknown'}

**Key Dynamic:** ${champion.previousCompany ?
  `Came from ${champion.previousCompany} where security was likely more mature. Now experiencing "ratio shock" - the gap between what they know is possible and what exists here.` :
  `New leader looking for quick wins to prove value.`}
` : 'No clear champion identified - dialogue should explore who might emerge as owner.'}

## DECISION PATH

**Champion reports to:** ${decisionPath?.reportsTo || 'Unknown'}
**Budget authority:** ${decisionPath?.budgetAuthority || 'Unknown'}
**Approval speed:** ${decisionPath?.approvalSpeed || 'Unknown'}
**Key stakeholders:** ${decisionPath?.stakeholders?.map(s => `${s.role}: ${s.person}`).join(', ') || 'Unknown'}

## PRODUCT WE'RE SELLING

**Product:** ${this.productContext.productName}
**Problem we solve:** ${this.productContext.primaryProblem}
**Quick win metric:** ${this.productContext.quickWinMetric}

## YOUR TASK

Create a realistic scene (like a screenplay) showing an internal meeting or conversation at this company. The scene should:

1. **Show the pressure** the champion is feeling (from their background, tenure window, and organizational tensions)

2. **Show the internal dialogue** - include [bracketed internal thoughts] showing what characters are really thinking but not saying

3. **Show the objection** - have the budget authority raise a realistic objection based on their role

4. **Show the champion's response** - how they advocate for a solution based on their background

5. **Land on a moment** where our type of solution would naturally be discussed or sought

6. **Be specific** - use real details from the context (previous company, ratios, timelines)

After the scene, provide:

**PITCH ANGLE:**
- DO: [Specific framing that would resonate based on the scene]
- AVOID: [What NOT to say]

**OPENING LINE:**
A specific first sentence for outreach to the champion.

**KEY INSIGHT:**
The single most important thing this simulation reveals about how to sell to this company.

Format the scene with character names in CAPS followed by their dialogue. Use [brackets] for internal thoughts.`;
  }

  /**
   * Parse the simulation response
   */
  parseSimulationResponse(content, orgData, tensionAnalysis, behaviorPredictions) {
    // Extract the scene
    const sceneMatch = content.match(/^([\s\S]*?)(?=\*\*PITCH ANGLE|PITCH ANGLE:|---)/m);
    const scene = sceneMatch ? sceneMatch[1].trim() : content;

    // Extract pitch angle
    const pitchAngleMatch = content.match(/\*\*PITCH ANGLE[\s\S]*?DO:([^\n]+)[\s\S]*?AVOID:([^\n]+)/i);
    const pitchAngle = pitchAngleMatch ? {
      do: pitchAngleMatch[1].trim(),
      avoid: pitchAngleMatch[2].trim()
    } : null;

    // Extract opening line
    const openingMatch = content.match(/\*\*OPENING LINE[:\s]*\*?\*?([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    const openingLine = openingMatch ? openingMatch[1].trim().replace(/^\*+|\*+$/g, '').trim() : null;

    // Extract key insight
    const insightMatch = content.match(/\*\*KEY INSIGHT[:\s]*\*?\*?([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    const keyInsight = insightMatch ? insightMatch[1].trim().replace(/^\*+|\*+$/g, '').trim() : null;

    return {
      company: orgData.name || orgData.company_name,
      scene,
      pitchAngle,
      openingLine,
      keyInsight,

      // Include context for reference
      context: {
        champion: behaviorPredictions.champion.identified ? {
          name: behaviorPredictions.champion.name,
          title: behaviorPredictions.champion.title,
          windowRemaining: behaviorPredictions.champion.windowRemaining
        } : null,
        compositeTension: tensionAnalysis.compositeTension,
        classification: tensionAnalysis.classification
      },

      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate mock dialogue for when API is unavailable
   */
  generateMockDialogue(orgData, tensionAnalysis, behaviorPredictions) {
    const champion = behaviorPredictions.champion;
    const tensions = tensionAnalysis.tensions;
    const companyName = orgData.name || orgData.company_name || 'Target Company';

    let scene;

    if (champion.identified) {
      scene = `
Scene: Weekly executive meeting at ${companyName}, ${champion.tenureDays} days after ${champion.name} joined as ${champion.title}

${tensions.reporting.reportingLines?.[0]?.reportsTo?.toUpperCase() || 'CEO'}: ${champion.name}, the board is asking about our security compliance timeline. Where are we?

${champion.name.split(' ')[0].toUpperCase()} [internal]: At ${champion.previousCompany || 'my last company'} we had ${tensions.ratio.ratios?.security_to_company?.healthyLabel || '1:50'} security ratio. Here it's ${tensions.ratio.ratios?.security_to_company?.actualLabel || '1:100'}. There's no way we hit our goals with this team size.

${champion.name.split(' ')[0].toUpperCase()}: We're making progress, but I have to be honest - my team is stretched thin. We're supporting ${orgData.employees_count || 500} people with ${tensions.ratio.ratios?.security_to_company ? Math.round(orgData.employees_count * tensions.ratio.ratios.security_to_company.actual) : 5} security engineers. At ${champion.previousCompany || 'my previous company'}, that ratio was ${champion.previousCompany ? '3x better' : 'much healthier'}.

${tensions.reporting.reportingLines?.[0]?.reportsTo?.toUpperCase() || 'CFO'}: We can't hire more headcount right now - we committed to 18-month runway.

${champion.name.split(' ')[0].toUpperCase()} [internal]: This is the moment. I either fight for tools or drown in manual work. I've seen this work before - I know what's possible.

${champion.name.split(' ')[0].toUpperCase()}: I'm not asking for headcount. At ${champion.previousCompany || 'my previous company'}, we used automation to do 80% of compliance evidence collection. One platform replaced what would have been 2-3 full-time people. The math works out to significant savings versus hiring.

${tensions.reporting.reportingLines?.[0]?.reportsTo?.toUpperCase() || 'CFO'}: What's the platform cost?

${champion.name.split(' ')[0].toUpperCase()}: About $50K annually. Net savings of $100K+, plus we actually hit our deadline.

CEO: And this worked at ${champion.previousCompany || 'your previous company'}?

${champion.name.split(' ')[0].toUpperCase()}: We got SOC 2 Type II in 4 months. Companies doing it manually take 12-18 months.

${tensions.reporting.reportingLines?.[0]?.reportsTo?.toUpperCase() || 'CFO'}: Put together a proposal. I want to see the ROI breakdown.
`;
    } else {
      scene = `
Scene: Quarterly planning meeting at ${companyName}

CEO: Our enterprise pipeline is growing, but deals are stalling. What's blocking them?

SALES LEADER: Security questionnaires. Every enterprise prospect asks about SOC 2. We don't have it.

CTO: We've been meaning to get to that, but engineering is focused on product.

CEO: How long would it take?

CTO: Doing it manually? 12-18 months. We'd need to hire someone to own it.

CFO: We don't have headcount budget for that.

SALES LEADER [internal]: Every month we delay is another enterprise deal we can't close.

SALES LEADER: What if we could do it faster without hiring? I've heard there are platforms that automate most of it.

CTO: I'd want to see how it integrates with our stack.

CEO: Look into it. If we can get SOC 2 in Q2 without adding headcount, that unlocks our enterprise motion.
`;
    }

    return {
      company: companyName,
      scene: scene.trim(),
      pitchAngle: {
        do: champion.identified
          ? `"${Math.round((orgData.employees_count || 500) * 0.02)} FTE savings + hit your deadline" (${tensions.reporting.reportingLines?.[0]?.reportsTo || 'CFO'} language)`
          : '"SOC 2 in Q2 without adding headcount" (ties to enterprise revenue)',
        avoid: 'Digital transformation (too long), Best-in-class security (not CFO concern)'
      },
      openingLine: champion.identified
        ? `"Coming from ${champion.previousCompany || 'a company with mature security'}, you've seen what good looks like. How are you finding the gap at ${companyName}?"`
        : `"I noticed you're growing fast but don't have SOC 2 yet. Is that slowing down your enterprise deals?"`,
      keyInsight: champion.identified
        ? `${champion.name} is in a ${champion.windowRemaining}-day window to prove value, came from a mature security program, and is experiencing ratio shock. They KNOW the solution exists and will champion it internally.`
        : `No clear security champion yet - this is an opportunity to help identify/create one. Enterprise sales pressure will force the conversation.`,

      context: {
        champion: champion.identified ? {
          name: champion.name,
          title: champion.title,
          windowRemaining: champion.windowRemaining
        } : null,
        compositeTension: tensionAnalysis.compositeTension,
        classification: tensionAnalysis.classification
      },

      generatedAt: new Date().toISOString(),
      isMock: true
    };
  }
}

module.exports = { InternalDialogueSimulator };
