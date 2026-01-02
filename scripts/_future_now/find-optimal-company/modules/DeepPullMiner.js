/**
 * Deep PULL Miner
 *
 * Extracts maximum PULL signals from existing data sources without
 * needing Bombora/G2 intent data.
 *
 * Key insight: We have rich data, we just need to mine it smarter.
 *
 * Signals we extract:
 * 1. Job description keyword mining (not just titles)
 * 2. First-time role detection (greenfield opportunities)
 * 3. Compliance gap analysis (do they have it vs. should they)
 * 4. Career path intelligence (champion knows the answer)
 * 5. Customer base inference (enterprise = compliance needed)
 * 6. Competitor compliance gap (competitive pressure)
 * 7. "Would be weird NOT to buy" scoring
 */

const Anthropic = require('@anthropic-ai/sdk');

class DeepPullMiner {
  constructor(config) {
    this.productContext = config.productContext;
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (this.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: this.anthropicApiKey });
    }

    // Keywords that indicate compliance buying intent (from job descriptions)
    this.intentKeywords = {
      critical: {
        keywords: ['SOC 2', 'SOC2', 'ISO 27001', 'ISO27001', 'HIPAA compliance', 'compliance automation', 'Vanta', 'Drata', 'Secureframe'],
        score: 40,
        meaning: 'Actively working on or evaluating compliance solutions'
      },
      high: {
        keywords: ['compliance program', 'security certification', 'audit preparation', 'evidence collection', 'GRC platform', 'security audit'],
        score: 30,
        meaning: 'Building compliance capabilities'
      },
      medium: {
        keywords: ['enterprise ready', 'enterprise customers', 'security policies', 'risk management', 'compliance requirements', 'security controls'],
        score: 20,
        meaning: 'Enterprise motion creating compliance need'
      },
      low: {
        keywords: ['security awareness', 'access management', 'data protection', 'privacy program'],
        score: 10,
        meaning: 'Security awareness but not active compliance project'
      }
    };

    // Companies known to have mature compliance programs
    this.matureComplianceCompanies = [
      'stripe', 'square', 'plaid', 'gusto', 'rippling', 'brex', 'ramp',
      'datadog', 'snowflake', 'twilio', 'segment', 'amplitude',
      'okta', 'crowdstrike', 'palo alto', 'zscaler',
      'salesforce', 'workday', 'servicenow'
    ];

    // Title patterns for first-time role detection
    this.greenFieldRoles = [
      { pattern: /^(first|founding)\s/i, score: 40, meaning: 'Explicitly first hire' },
      { pattern: /head of (security|compliance|infosec)/i, score: 35, meaning: 'Senior security leadership' },
      { pattern: /^ciso$/i, score: 35, meaning: 'First CISO' },
      { pattern: /director.*(security|compliance)/i, score: 30, meaning: 'Security director' },
      { pattern: /security (lead|manager)/i, score: 25, meaning: 'Security management' },
      { pattern: /compliance (manager|lead|analyst)/i, score: 20, meaning: 'Compliance role' }
    ];
  }

  /**
   * Main entry: Deep mine a company for PULL signals
   */
  async minePullSignals(companyData) {
    console.log(`\n   Deep mining PULL signals for ${companyData.name || companyData.company_name}...`);

    const signals = {
      jobDescriptionIntent: await this.mineJobDescriptions(companyData),
      firstTimeRoles: await this.detectFirstTimeRoles(companyData),
      complianceGap: await this.analyzeComplianceGap(companyData),
      championIntelligence: await this.analyzeChampionBackground(companyData),
      customerInference: await this.inferCustomerRequirements(companyData),
      competitorGap: await this.analyzeCompetitorGap(companyData),
      wouldBeWeird: this.calculateWouldBeWeirdScore(companyData)
    };

    // Calculate composite PULL score
    const pullScore = this.calculateCompositePullScore(signals);

    // Generate narrative with Claude
    const analysis = await this.generatePullNarrative(companyData, signals, pullScore);

    return {
      company: companyData.name || companyData.company_name,
      pullScore,
      classification: pullScore >= 75 ? 'PULL' : pullScore >= 50 ? 'CONSIDERATION' : 'NOT_IN_MARKET',
      signals,
      ...analysis,
      minedAt: new Date().toISOString()
    };
  }

  /**
   * Signal 1: Mine job descriptions for intent keywords
   */
  async mineJobDescriptions(companyData) {
    const result = {
      score: 0,
      findings: [],
      keywordMatches: {}
    };

    const jobPostings = companyData.jobPostings || [];
    if (jobPostings.length === 0) {
      result.findings.push({ type: 'no_data', message: 'No job postings to analyze' });
      return result;
    }

    // Analyze each job posting
    for (const job of jobPostings) {
      const title = (job.title || '').toLowerCase();
      const description = (job.description || '').toLowerCase();
      const fullText = `${title} ${description}`;

      // Check each keyword category
      for (const [level, config] of Object.entries(this.intentKeywords)) {
        for (const keyword of config.keywords) {
          if (fullText.includes(keyword.toLowerCase())) {
            if (!result.keywordMatches[keyword]) {
              result.keywordMatches[keyword] = {
                level,
                score: config.score,
                meaning: config.meaning,
                jobs: []
              };
            }
            result.keywordMatches[keyword].jobs.push(job.title);
          }
        }
      }
    }

    // Calculate score (use highest level found + diminishing returns for multiples)
    const matchedKeywords = Object.values(result.keywordMatches);
    if (matchedKeywords.length > 0) {
      // Sort by score descending
      matchedKeywords.sort((a, b) => b.score - a.score);

      // Highest score + diminishing returns
      result.score = matchedKeywords[0].score;
      for (let i = 1; i < Math.min(matchedKeywords.length, 5); i++) {
        result.score += matchedKeywords[i].score * Math.pow(0.4, i);
      }
      result.score = Math.min(100, Math.round(result.score));

      // Generate findings
      const criticalMatches = matchedKeywords.filter(m => m.level === 'critical');
      if (criticalMatches.length > 0) {
        result.findings.push({
          type: 'critical_intent',
          message: `Job descriptions mention: ${criticalMatches.map(m => Object.keys(result.keywordMatches).find(k => result.keywordMatches[k] === m)).join(', ')}`,
          implication: 'Company is actively working on or evaluating compliance'
        });
      }
    }

    console.log(`   Job description mining: ${Object.keys(result.keywordMatches).length} intent keywords found`);
    return result;
  }

  /**
   * Signal 2: Detect first-time roles (greenfield opportunities)
   */
  async detectFirstTimeRoles(companyData) {
    const result = {
      score: 0,
      findings: [],
      firstTimeRoles: []
    };

    const employees = companyData.employees || [];
    const recentHires = employees.filter(e => {
      const startDate = new Date(e.start_date || e.employment_start_date);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return startDate > ninetyDaysAgo;
    });

    for (const hire of recentHires) {
      const title = hire.title || '';

      // Check if title matches greenfield patterns
      for (const pattern of this.greenFieldRoles) {
        if (pattern.pattern.test(title)) {
          // Check if this is truly first of its kind
          const similarRoles = employees.filter(e =>
            e.id !== hire.id &&
            pattern.pattern.test(e.title || '') &&
            new Date(e.start_date || e.employment_start_date) < new Date(hire.start_date || hire.employment_start_date)
          );

          if (similarRoles.length === 0) {
            result.firstTimeRoles.push({
              name: hire.name || `${hire.first_name} ${hire.last_name}`,
              title: title,
              startDate: hire.start_date || hire.employment_start_date,
              pattern: pattern.meaning,
              score: pattern.score
            });
            break;
          }
        }
      }
    }

    if (result.firstTimeRoles.length > 0) {
      // Use highest scoring first-time role
      result.firstTimeRoles.sort((a, b) => b.score - a.score);
      result.score = result.firstTimeRoles[0].score;

      result.findings.push({
        type: 'greenfield_opportunity',
        message: `First-ever ${result.firstTimeRoles[0].title} hired`,
        implication: 'Greenfield mandate - new leader will build from scratch and select tools'
      });
    }

    console.log(`   First-time role detection: ${result.firstTimeRoles.length} greenfield roles found`);
    return result;
  }

  /**
   * Signal 3: Analyze compliance gap (do they have it vs. should they)
   */
  async analyzeComplianceGap(companyData) {
    const result = {
      score: 0,
      findings: [],
      hasCompliance: null,
      shouldHaveCompliance: false,
      gap: null
    };

    const companyName = companyData.name || companyData.company_name;
    const domain = companyData.website || companyData.domain;

    if (!this.perplexityApiKey) {
      console.log('   [SKIP] No Perplexity API - skipping compliance gap analysis');
      return result;
    }

    try {
      // Query 1: Do they have SOC 2 / compliance certifications?
      const hasComplianceQuery = await this.perplexitySearch(
        `Does "${companyName}" have SOC 2 certification? Check their website, trust page, security page. Look for any compliance certifications like SOC 2, ISO 27001, HIPAA.`
      );

      // Query 2: Should they have compliance based on their business?
      const shouldHaveQuery = await this.perplexitySearch(
        `What does "${companyName}" do? Who are their customers? Are they B2B SaaS? Do they handle sensitive data? Would their customers typically require SOC 2 or security compliance?`
      );

      // Parse results (Claude will help interpret)
      const gapAnalysis = await this.interpretComplianceGap(
        companyName,
        hasComplianceQuery,
        shouldHaveQuery,
        companyData
      );

      result.hasCompliance = gapAnalysis.hasCompliance;
      result.shouldHaveCompliance = gapAnalysis.shouldHave;
      result.gap = gapAnalysis.gap;
      result.score = gapAnalysis.score;
      result.findings = gapAnalysis.findings;

    } catch (error) {
      console.error(`   Compliance gap analysis error: ${error.message}`);
    }

    console.log(`   Compliance gap analysis: ${result.gap || 'unknown'}`);
    return result;
  }

  /**
   * Signal 4: Analyze champion's background for "been there, done that"
   */
  async analyzeChampionBackground(companyData) {
    const result = {
      score: 0,
      findings: [],
      champions: []
    };

    const employees = companyData.employees || [];

    // Find recent senior hires
    const recentSeniorHires = employees.filter(e => {
      const startDate = new Date(e.start_date || e.employment_start_date);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const isRecent = startDate > ninetyDaysAgo;

      const title = (e.title || '').toLowerCase();
      const isSenior = /vp|director|head|chief|ciso|cto|coo/i.test(title);

      return isRecent && isSenior;
    });

    for (const hire of recentSeniorHires) {
      const careerHistory = hire.employment_history || [];
      const championSignals = [];

      // Check if they came from a company with mature compliance
      for (const prevJob of careerHistory) {
        const prevCompany = (prevJob.company_name || '').toLowerCase();
        const cameFromMature = this.matureComplianceCompanies.some(c =>
          prevCompany.includes(c)
        );

        if (cameFromMature) {
          championSignals.push({
            type: 'mature_company_background',
            score: 35,
            evidence: `Previously at ${prevJob.company_name} (mature compliance program)`
          });
        }

        // Check if previous role was compliance-related
        const prevTitle = (prevJob.title || '').toLowerCase();
        if (/security|compliance|risk|audit|grc/i.test(prevTitle)) {
          championSignals.push({
            type: 'compliance_experience',
            score: 30,
            evidence: `Was ${prevJob.title} at ${prevJob.company_name}`
          });
        }
      }

      if (championSignals.length > 0) {
        const totalScore = championSignals.reduce((sum, s) => sum + s.score, 0);
        result.champions.push({
          name: hire.name || `${hire.first_name} ${hire.last_name}`,
          title: hire.title,
          signals: championSignals,
          score: Math.min(100, totalScore)
        });
      }
    }

    if (result.champions.length > 0) {
      result.champions.sort((a, b) => b.score - a.score);
      result.score = result.champions[0].score;

      const topChampion = result.champions[0];
      result.findings.push({
        type: 'champion_knows_answer',
        message: `${topChampion.name} (${topChampion.title}) has compliance background`,
        implication: 'Champion knows how to do this - will drive purchase decision'
      });
    }

    console.log(`   Champion background analysis: ${result.champions.length} champions with relevant experience`);
    return result;
  }

  /**
   * Signal 5: Infer customer requirements
   */
  async inferCustomerRequirements(companyData) {
    const result = {
      score: 0,
      findings: [],
      customerTypes: []
    };

    const companyName = companyData.name || companyData.company_name;

    if (!this.perplexityApiKey) {
      // Infer from company description
      const description = (companyData.description || '').toLowerCase();

      if (description.includes('enterprise') || description.includes('fortune')) {
        result.score = 25;
        result.customerTypes.push('enterprise');
        result.findings.push({
          type: 'enterprise_customers',
          message: 'Company description mentions enterprise customers',
          implication: 'Enterprise customers require compliance certifications'
        });
      }

      return result;
    }

    try {
      const customerQuery = await this.perplexitySearch(
        `Who are "${companyName}" customers? List their notable customers, case studies, or customer segments. Are they B2B? Do they sell to enterprises, banks, healthcare, or government?`
      );

      // Parse for enterprise/regulated customer signals
      const customerText = customerQuery.toLowerCase();

      const enterpriseSignals = [
        { pattern: /enterprise|fortune\s*\d+|large\s*compan/i, type: 'enterprise', score: 25 },
        { pattern: /bank|financial|fintech/i, type: 'financial', score: 30 },
        { pattern: /health|hipaa|medical|hospital/i, type: 'healthcare', score: 30 },
        { pattern: /government|federal|public sector/i, type: 'government', score: 30 }
      ];

      for (const signal of enterpriseSignals) {
        if (signal.pattern.test(customerText)) {
          result.customerTypes.push(signal.type);
          result.score = Math.max(result.score, signal.score);
        }
      }

      if (result.customerTypes.length > 0) {
        result.findings.push({
          type: 'customer_requirements',
          message: `Sells to ${result.customerTypes.join(', ')} customers`,
          implication: 'These customer segments require security compliance'
        });
      }

    } catch (error) {
      console.error(`   Customer inference error: ${error.message}`);
    }

    console.log(`   Customer inference: ${result.customerTypes.length > 0 ? result.customerTypes.join(', ') : 'none detected'}`);
    return result;
  }

  /**
   * Signal 6: Analyze competitor compliance gap
   */
  async analyzeCompetitorGap(companyData) {
    const result = {
      score: 0,
      findings: [],
      competitorsWithCompliance: [],
      gap: false
    };

    const companyName = companyData.name || companyData.company_name;

    if (!this.perplexityApiKey) {
      console.log('   [SKIP] No Perplexity API - skipping competitor gap analysis');
      return result;
    }

    try {
      const competitorQuery = await this.perplexitySearch(
        `Who are "${companyName}" main competitors? Do those competitors have SOC 2 or security certifications? Compare their security compliance status.`
      );

      // This would be parsed by Claude to determine if competitors have compliance
      // For now, we'll return the raw data
      result.rawResearch = competitorQuery;

    } catch (error) {
      console.error(`   Competitor gap analysis error: ${error.message}`);
    }

    return result;
  }

  /**
   * Signal 7: "Would Be Weird NOT to Buy" score
   */
  calculateWouldBeWeirdScore(companyData) {
    const result = {
      score: 0,
      factors: []
    };

    const employees = companyData.employees_count || 0;
    const fundingRound = companyData.last_funding_round_type || '';
    const description = (companyData.description || '').toLowerCase();

    // Factor 1: Company size
    if (employees >= 200) {
      result.factors.push({ factor: 'large_company', score: 20, reason: '200+ employees typically need formal compliance' });
      result.score += 20;
    } else if (employees >= 100) {
      result.factors.push({ factor: 'mid_size_company', score: 15, reason: '100+ employees often face compliance requirements' });
      result.score += 15;
    }

    // Factor 2: Funding stage
    const lateStageFunding = ['series_b', 'series_c', 'series_d', 'series_e'].some(
      stage => fundingRound.toLowerCase().includes(stage.replace('_', ' '))
    );
    if (lateStageFunding) {
      result.factors.push({ factor: 'late_stage', score: 20, reason: 'Series B+ companies should have compliance' });
      result.score += 20;
    }

    // Factor 3: B2B SaaS signals
    const isB2BSaaS = /b2b|saas|software|platform|enterprise/i.test(description);
    if (isB2BSaaS) {
      result.factors.push({ factor: 'b2b_saas', score: 15, reason: 'B2B SaaS companies need compliance for enterprise sales' });
      result.score += 15;
    }

    // Factor 4: Regulated industry
    const isRegulated = /health|financial|fintech|insurance|banking/i.test(
      companyData.industry || description
    );
    if (isRegulated) {
      result.factors.push({ factor: 'regulated_industry', score: 25, reason: 'Regulated industries have compliance requirements' });
      result.score += 25;
    }

    // Factor 5: Rapid growth
    const growthRate = companyData.employees_count_change_yearly_percentage || 0;
    if (growthRate > 30) {
      result.factors.push({ factor: 'hypergrowth', score: 15, reason: 'Fast growth creates compliance urgency' });
      result.score += 15;
    }

    result.score = Math.min(100, result.score);

    console.log(`   "Would be weird" score: ${result.score}/100`);
    return result;
  }

  /**
   * Calculate composite PULL score from all signals
   */
  calculateCompositePullScore(signals) {
    const weights = {
      jobDescriptionIntent: 0.25,  // What they're hiring for
      firstTimeRoles: 0.15,        // Greenfield opportunity
      complianceGap: 0.20,         // Gap between have/need
      championIntelligence: 0.15,  // Champion knows answer
      customerInference: 0.10,     // Customer requirements
      competitorGap: 0.05,         // Competitive pressure
      wouldBeWeird: 0.10           // Size/stage fit
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [signal, weight] of Object.entries(weights)) {
      if (signals[signal] && typeof signals[signal].score === 'number') {
        weightedSum += signals[signal].score * weight;
        totalWeight += weight;
      }
    }

    // Normalize if we didn't get all signals
    const normalizedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return Math.round(normalizedScore);
  }

  /**
   * Generate narrative with Claude
   */
  async generatePullNarrative(companyData, signals, pullScore) {
    if (!this.anthropic || pullScore < 40) {
      return {
        narrative: null,
        pitchAngle: null,
        confidence: pullScore
      };
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `You are an expert sales strategist analyzing PULL signals for ${this.productContext.productName}.

COMPANY: ${companyData.name || companyData.company_name}
INDUSTRY: ${companyData.industry}
SIZE: ${companyData.employees_count} employees
PULL SCORE: ${pullScore}/100

MINED SIGNALS:
${JSON.stringify(signals, null, 2)}

PRODUCT CONTEXT:
${JSON.stringify(this.productContext, null, 2)}

Based on these signals, generate:

1. A compelling 2-3 paragraph narrative explaining WHY this company likely has PULL (blocked demand) for compliance automation. Be specific - name names, cite signals, explain the tension.

2. The pitch angle to use (quick win) and what to avoid (transformation language).

3. A specific opening line for outreach.

Return as JSON:
{
  "narrative": "...",
  "pitchAngle": { "do": "...", "avoid": "..." },
  "openingLine": "...",
  "topSignal": "The single most important signal",
  "confidence": 0-100
}`
        }]
      });

      const content = response.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error(`   Narrative generation error: ${error.message}`);
    }

    return { narrative: null, pitchAngle: null, confidence: pullScore };
  }

  /**
   * Helper: Search Perplexity
   */
  async perplexitySearch(query) {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: query }]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Helper: Interpret compliance gap with Claude
   */
  async interpretComplianceGap(companyName, hasComplianceData, shouldHaveData, companyData) {
    if (!this.anthropic) {
      return { hasCompliance: null, shouldHave: null, gap: null, score: 0, findings: [] };
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze this compliance gap for ${companyName}:

RESEARCH ON WHETHER THEY HAVE COMPLIANCE:
${hasComplianceData}

RESEARCH ON WHETHER THEY SHOULD HAVE COMPLIANCE:
${shouldHaveData}

COMPANY SIZE: ${companyData.employees_count} employees
FUNDING: ${companyData.last_funding_round_type}

Return JSON:
{
  "hasCompliance": true/false/null,
  "shouldHave": true/false,
  "gap": "none" | "small" | "significant" | "critical",
  "score": 0-40 (40 = critical gap, 0 = no gap),
  "findings": [{ "type": "...", "message": "...", "implication": "..." }]
}`
        }]
      });

      const content = response.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error(`   Gap interpretation error: ${error.message}`);
    }

    return { hasCompliance: null, shouldHave: null, gap: null, score: 0, findings: [] };
  }
}

module.exports = { DeepPullMiner };
