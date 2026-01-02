/**
 * PULL Signal Detector
 *
 * Implements the PULL framework from Rob Snyder's "Path to Product-Market Fit":
 *
 * PULL = Blocked Demand = Unavoidable Project meets Unworkable Options
 *
 * P - Project on their to-do list being prioritized NOW
 * U - Urgency - reason it's urgent/unavoidable now
 * L - List of options they're considering
 * L - Limitations of existing options (severe, preventing progress)
 *
 * Companies with PULL will "rip your product out of your hands"
 * Only ~5% of companies have PULL at any given time
 */

class PullSignalDetector {
  constructor(config) {
    this.productContext = config.productContext;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
    this.model = config.model || 'claude-sonnet-4-5-20250514'; // Cost-effective for classification

    // PULL signal weights - these determine final classification
    this.weights = {
      project: 0.30,      // Evidence of prioritized project
      urgency: 0.35,      // Strongest signal - why NOW?
      list: 0.15,         // Are they evaluating options?
      limitations: 0.20   // Are current solutions failing?
    };

    // Thresholds for classification
    this.thresholds = {
      pull: 75,           // Above this = PULL (5%)
      consideration: 50,  // 50-75 = consideration set (15%)
      notInMarket: 0      // Below 50 = not in market (80%)
    };
  }

  /**
   * Detect PULL signals for a company
   * @param {object} company - Company data from Coresignal or database
   * @param {object} enrichmentData - Additional enrichment data (hiring, funding, etc.)
   * @returns {object} PULL analysis with scores and classification
   */
  async detectPullSignals(company, enrichmentData = {}) {
    console.log(`   Analyzing PULL signals for ${company.name || company.company_name}...`);

    // 1. Detect each PULL component
    const projectSignals = await this.detectProjectSignals(company, enrichmentData);
    const urgencySignals = await this.detectUrgencySignals(company, enrichmentData);
    const listSignals = await this.detectListSignals(company, enrichmentData);
    const limitationSignals = await this.detectLimitationSignals(company, enrichmentData);

    // 2. Calculate component scores
    const scores = {
      project: this.calculateComponentScore(projectSignals),
      urgency: this.calculateComponentScore(urgencySignals),
      list: this.calculateComponentScore(listSignals),
      limitations: this.calculateComponentScore(limitationSignals)
    };

    // 3. Calculate weighted PULL score
    const pullScore = Math.round(
      scores.project * this.weights.project +
      scores.urgency * this.weights.urgency +
      scores.list * this.weights.list +
      scores.limitations * this.weights.limitations
    );

    // 4. Classify company
    const classification = this.classifyCompany(pullScore, scores);

    // 5. Generate defensible rationale
    const rationale = this.generateRationale(scores, {
      project: projectSignals,
      urgency: urgencySignals,
      list: listSignals,
      limitations: limitationSignals
    }, classification);

    return {
      company: company.name || company.company_name,
      pullScore,
      classification,
      scores,
      signals: {
        project: projectSignals,
        urgency: urgencySignals,
        list: listSignals,
        limitations: limitationSignals
      },
      rationale,
      confidence: this.calculateConfidence(scores, enrichmentData),
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Detect PROJECT signals - Is there a project on their to-do list?
   * Evidence: Hiring, initiatives, job postings, strategic priorities
   */
  async detectProjectSignals(company, enrichmentData) {
    const signals = [];
    const productConfig = this.productContext;

    // 1. Hiring signals - strongest project indicator
    const hiringSignals = this.analyzeHiringPatterns(company, enrichmentData);
    signals.push(...hiringSignals);

    // 2. Strategic initiative signals
    const initiativeSignals = this.analyzeStrategicInitiatives(company, enrichmentData);
    signals.push(...initiativeSignals);

    // 3. Job posting analysis for relevant roles
    if (enrichmentData.jobPostings) {
      const relevantPostings = this.analyzeJobPostings(enrichmentData.jobPostings, productConfig);
      signals.push(...relevantPostings);
    }

    // 4. New leadership in relevant areas
    if (enrichmentData.recentHires) {
      const leadershipSignals = this.analyzeLeadershipChanges(enrichmentData.recentHires, productConfig);
      signals.push(...leadershipSignals);
    }

    return signals;
  }

  /**
   * Detect URGENCY signals - Why is this project prioritized NOW?
   * Evidence: Funding, growth, compliance deadlines, market pressure
   */
  async detectUrgencySignals(company, enrichmentData) {
    const signals = [];

    // 1. Recent funding - strongest urgency signal
    if (company.last_funding_round_date || enrichmentData.fundingData) {
      const fundingSignal = this.analyzeFundingUrgency(company, enrichmentData);
      if (fundingSignal) signals.push(fundingSignal);
    }

    // 2. Rapid growth - creates operational urgency
    const growthRate = company.employees_count_change_yearly_percentage ||
                       company.employee_growth_rate || 0;
    if (growthRate > 20) {
      signals.push({
        type: 'urgency',
        signal: 'rapid_growth',
        strength: Math.min(100, 50 + growthRate),
        evidence: `${growthRate}% YoY employee growth - scaling pains create urgency`,
        reasoning: 'Rapid growth companies face immediate operational challenges that can\'t wait'
      });
    }

    // 3. Enterprise customer requirements (for compliance products)
    if (this.productContext.category === 'compliance' ||
        this.productContext.category === 'security') {
      const enterpriseSignals = this.analyzeEnterpriseRequirements(company, enrichmentData);
      signals.push(...enterpriseSignals);
    }

    // 4. Regulatory/compliance deadlines
    const regulatorySignals = this.analyzeRegulatoryPressure(company, enrichmentData);
    signals.push(...regulatorySignals);

    // 5. Market pressure signals
    const marketSignals = this.analyzeMarketPressure(company, enrichmentData);
    signals.push(...marketSignals);

    return signals;
  }

  /**
   * Detect LIST signals - Are they evaluating options?
   * Evidence: Vendor evaluations, RFPs, technology exploration
   */
  async detectListSignals(company, enrichmentData) {
    const signals = [];

    // 1. Technology stack changes
    if (enrichmentData.techStack) {
      const techSignals = this.analyzeTechStackChanges(enrichmentData.techStack);
      signals.push(...techSignals);
    }

    // 2. Vendor review activity (G2, Capterra, etc.)
    if (enrichmentData.reviewActivity) {
      signals.push({
        type: 'list',
        signal: 'active_evaluation',
        strength: 80,
        evidence: 'Active on review platforms researching solutions',
        reasoning: 'Companies actively reading reviews are in evaluation mode'
      });
    }

    // 3. RFP/procurement signals
    if (enrichmentData.procurementActivity) {
      signals.push({
        type: 'list',
        signal: 'rfp_activity',
        strength: 90,
        evidence: 'Active RFP or procurement process detected',
        reasoning: 'Formal procurement indicates imminent purchase decision'
      });
    }

    // 4. Inbound signals (if available)
    if (enrichmentData.websiteVisits || enrichmentData.contentEngagement) {
      signals.push({
        type: 'list',
        signal: 'inbound_engagement',
        strength: 70,
        evidence: 'Engaged with content or visited website',
        reasoning: 'Inbound engagement indicates active interest'
      });
    }

    return signals;
  }

  /**
   * Detect LIMITATION signals - Are existing options failing?
   * Evidence: Manual processes, outdated tools, scaling problems, audit failures
   */
  async detectLimitationSignals(company, enrichmentData) {
    const signals = [];
    const productConfig = this.productContext;

    // 1. Analyze current tool stack for limitations
    if (enrichmentData.techStack) {
      const limitationSignals = this.analyzeTechLimitations(
        enrichmentData.techStack,
        productConfig
      );
      signals.push(...limitationSignals);
    }

    // 2. Company size vs. tool maturity mismatch
    const maturityMismatch = this.analyzeMaturityMismatch(company, enrichmentData);
    if (maturityMismatch) signals.push(maturityMismatch);

    // 3. Hiring signals that indicate process gaps
    const processGapSignals = this.analyzeProcessGaps(company, enrichmentData);
    signals.push(...processGapSignals);

    // 4. Industry-specific limitation patterns
    const industrySignals = this.analyzeIndustryLimitations(company, productConfig);
    signals.push(...industrySignals);

    return signals;
  }

  /**
   * Analyze hiring patterns for project signals
   */
  analyzeHiringPatterns(company, enrichmentData) {
    const signals = [];
    const productConfig = this.productContext;
    const activeJobCount = company.active_job_postings_count ||
                          enrichmentData.activeJobCount || 0;

    // General hiring velocity
    if (activeJobCount > 20) {
      signals.push({
        type: 'project',
        signal: 'high_hiring_velocity',
        strength: Math.min(80, 50 + activeJobCount),
        evidence: `${activeJobCount} active job postings indicate major initiatives`,
        reasoning: 'High hiring velocity means projects are being prioritized and resourced'
      });
    }

    // Role-specific hiring (based on product category)
    if (productConfig.relevantRoles && enrichmentData.jobPostings) {
      const relevantHiring = enrichmentData.jobPostings.filter(job =>
        productConfig.relevantRoles.some(role =>
          job.title?.toLowerCase().includes(role.toLowerCase())
        )
      );

      if (relevantHiring.length > 0) {
        signals.push({
          type: 'project',
          signal: 'relevant_hiring',
          strength: Math.min(95, 70 + relevantHiring.length * 5),
          evidence: `Hiring ${relevantHiring.length} roles directly relevant to ${productConfig.productName}`,
          reasoning: `Hiring for ${relevantHiring.map(j => j.title).join(', ')} indicates active project`
        });
      }
    }

    return signals;
  }

  /**
   * Analyze strategic initiatives
   */
  analyzeStrategicInitiatives(company, enrichmentData) {
    const signals = [];
    const productConfig = this.productContext;

    // Look for keywords in company description, news, or updates
    const companyDescription = (company.description || company.company_description || '').toLowerCase();
    const relevantKeywords = productConfig.projectKeywords || [];

    const matchedKeywords = relevantKeywords.filter(kw =>
      companyDescription.includes(kw.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      signals.push({
        type: 'project',
        signal: 'strategic_initiative',
        strength: Math.min(85, 50 + matchedKeywords.length * 10),
        evidence: `Company mentions: ${matchedKeywords.join(', ')}`,
        reasoning: 'Company is publicly prioritizing initiatives related to your product'
      });
    }

    // Recent news or announcements
    if (enrichmentData.recentNews) {
      const relevantNews = enrichmentData.recentNews.filter(news =>
        relevantKeywords.some(kw => news.title?.toLowerCase().includes(kw.toLowerCase()))
      );

      if (relevantNews.length > 0) {
        signals.push({
          type: 'project',
          signal: 'announced_initiative',
          strength: 90,
          evidence: `Recent announcement: "${relevantNews[0].title}"`,
          reasoning: 'Public announcement indicates committed, prioritized project'
        });
      }
    }

    return signals;
  }

  /**
   * Analyze job postings for project signals
   */
  analyzeJobPostings(jobPostings, productConfig) {
    const signals = [];

    if (!jobPostings || jobPostings.length === 0) return signals;

    // Count jobs by relevance
    const relevantJobs = jobPostings.filter(job => {
      const title = (job.title || '').toLowerCase();
      const description = (job.description || '').toLowerCase();

      return productConfig.projectKeywords?.some(kw =>
        title.includes(kw.toLowerCase()) || description.includes(kw.toLowerCase())
      );
    });

    if (relevantJobs.length > 0) {
      signals.push({
        type: 'project',
        signal: 'job_posting_match',
        strength: Math.min(90, 60 + relevantJobs.length * 10),
        evidence: `${relevantJobs.length} job postings mention ${productConfig.productName} keywords`,
        reasoning: 'Job postings with product keywords indicate budget and prioritization'
      });
    }

    return signals;
  }

  /**
   * Analyze leadership changes
   */
  analyzeLeadershipChanges(recentHires, productConfig) {
    const signals = [];

    const relevantLeaders = recentHires.filter(hire => {
      const title = (hire.title || '').toLowerCase();
      return productConfig.relevantLeadershipTitles?.some(lt =>
        title.includes(lt.toLowerCase())
      );
    });

    if (relevantLeaders.length > 0) {
      const leader = relevantLeaders[0];
      signals.push({
        type: 'project',
        signal: 'new_leadership',
        strength: 85,
        evidence: `New ${leader.title} hired - likely driving new initiatives`,
        reasoning: 'New leaders in relevant areas often bring new projects and vendor evaluations'
      });
    }

    return signals;
  }

  /**
   * Analyze funding urgency
   */
  analyzeFundingUrgency(company, enrichmentData) {
    const fundingDate = company.last_funding_round_date ||
                        enrichmentData.fundingData?.date;

    if (!fundingDate) return null;

    const daysSinceFunding = Math.floor(
      (new Date() - new Date(fundingDate)) / (1000 * 60 * 60 * 24)
    );

    // Recent funding (< 180 days) is strongest urgency signal
    if (daysSinceFunding < 180) {
      const amount = company.last_funding_round_amount_raised ||
                     enrichmentData.fundingData?.amount || 'undisclosed';

      return {
        type: 'urgency',
        signal: 'recent_funding',
        strength: daysSinceFunding < 90 ? 95 : 80,
        evidence: `Raised ${amount} ${daysSinceFunding} days ago`,
        reasoning: 'Post-funding companies have capital and pressure to scale rapidly - they\'re buying now'
      };
    }

    return null;
  }

  /**
   * Analyze enterprise customer requirements
   */
  analyzeEnterpriseRequirements(company, enrichmentData) {
    const signals = [];
    const description = (company.description || '').toLowerCase();

    // Enterprise customers require compliance
    const enterpriseIndicators = [
      'enterprise customers',
      'fortune 500',
      'large enterprise',
      'b2b saas',
      'regulated industry'
    ];

    const hasEnterprise = enterpriseIndicators.some(ind => description.includes(ind));

    if (hasEnterprise || company.employees_count > 100) {
      signals.push({
        type: 'urgency',
        signal: 'enterprise_requirements',
        strength: 75,
        evidence: 'Enterprise customers require compliance/security certifications',
        reasoning: 'Can\'t close enterprise deals without SOC 2/ISO - creates immediate urgency'
      });
    }

    return signals;
  }

  /**
   * Analyze regulatory pressure
   */
  analyzeRegulatoryPressure(company, enrichmentData) {
    const signals = [];
    const industry = (company.industry || '').toLowerCase();

    // Industries with heavy regulation
    const regulatedIndustries = {
      'financial services': { urgency: 90, reason: 'Financial regulations require compliance' },
      'healthcare': { urgency: 90, reason: 'HIPAA and healthcare regulations' },
      'fintech': { urgency: 85, reason: 'Financial technology regulations' },
      'insurance': { urgency: 80, reason: 'Insurance industry regulations' },
      'legal': { urgency: 75, reason: 'Legal industry data requirements' }
    };

    for (const [ind, config] of Object.entries(regulatedIndustries)) {
      if (industry.includes(ind)) {
        signals.push({
          type: 'urgency',
          signal: 'regulatory_pressure',
          strength: config.urgency,
          evidence: config.reason,
          reasoning: `${ind} companies face regulatory deadlines that create buying urgency`
        });
        break;
      }
    }

    return signals;
  }

  /**
   * Analyze market pressure
   */
  analyzeMarketPressure(company, enrichmentData) {
    const signals = [];

    // Competitive pressure - if competitors are ahead
    if (enrichmentData.competitorData) {
      signals.push({
        type: 'urgency',
        signal: 'competitive_pressure',
        strength: 70,
        evidence: 'Competitors have already adopted similar solutions',
        reasoning: 'Falling behind competitors creates urgency to catch up'
      });
    }

    return signals;
  }

  /**
   * Analyze tech stack changes
   */
  analyzeTechStackChanges(techStack) {
    const signals = [];

    // Recent technology additions
    if (techStack.recentAdditions && techStack.recentAdditions.length > 0) {
      signals.push({
        type: 'list',
        signal: 'tech_modernization',
        strength: 65,
        evidence: `Recently added: ${techStack.recentAdditions.join(', ')}`,
        reasoning: 'Active technology changes indicate openness to new solutions'
      });
    }

    return signals;
  }

  /**
   * Analyze tech stack limitations
   */
  analyzeTechLimitations(techStack, productConfig) {
    const signals = [];

    // Look for outdated or limited tools in the problem space
    const limitedTools = productConfig.limitedCompetitors || [];
    const hasLimitedTools = limitedTools.some(tool =>
      techStack.tools?.includes(tool)
    );

    if (hasLimitedTools) {
      signals.push({
        type: 'limitations',
        signal: 'outgrown_current_tools',
        strength: 80,
        evidence: 'Using tools with known scaling limitations',
        reasoning: 'Current tools can\'t support growth - creates demand for better solution'
      });
    }

    // No tool in the space = using spreadsheets/manual
    if (!productConfig.competitorTools?.some(tool => techStack.tools?.includes(tool))) {
      signals.push({
        type: 'limitations',
        signal: 'manual_processes',
        strength: 75,
        evidence: 'No dedicated solution detected - likely using manual processes',
        reasoning: 'Manual processes break at scale - creates pain and demand'
      });
    }

    return signals;
  }

  /**
   * Analyze maturity mismatch
   */
  analyzeMaturityMismatch(company, enrichmentData) {
    const employees = company.employees_count || 0;
    const founded = company.founded_year || 2020;
    const age = new Date().getFullYear() - founded;

    // Large company without mature tools
    if (employees > 200 && age < 5) {
      return {
        type: 'limitations',
        signal: 'maturity_mismatch',
        strength: 70,
        evidence: `${employees} employees but only ${age} years old - likely outgrowing early tools`,
        reasoning: 'Fast-growing companies outpace their tooling - creates immediate pain'
      };
    }

    return null;
  }

  /**
   * Analyze process gaps
   */
  analyzeProcessGaps(company, enrichmentData) {
    const signals = [];

    // Hiring for roles that indicate process gaps
    if (enrichmentData.jobPostings) {
      const gapIndicators = ['first', 'build', 'establish', 'create', 'implement'];
      const gapJobs = enrichmentData.jobPostings.filter(job =>
        gapIndicators.some(ind => job.title?.toLowerCase().includes(ind))
      );

      if (gapJobs.length > 0) {
        signals.push({
          type: 'limitations',
          signal: 'building_from_scratch',
          strength: 85,
          evidence: `Hiring to build new capabilities: ${gapJobs[0].title}`,
          reasoning: 'Building new functions = greenfield opportunity, high urgency'
        });
      }
    }

    return signals;
  }

  /**
   * Analyze industry-specific limitations
   */
  analyzeIndustryLimitations(company, productConfig) {
    const signals = [];
    const industry = (company.industry || '').toLowerCase();

    // Industry-specific pain patterns
    const industryPains = productConfig.industryPainPatterns || {};

    for (const [ind, pain] of Object.entries(industryPains)) {
      if (industry.includes(ind.toLowerCase())) {
        signals.push({
          type: 'limitations',
          signal: 'industry_pain',
          strength: pain.strength || 70,
          evidence: pain.evidence,
          reasoning: pain.reasoning
        });
        break;
      }
    }

    return signals;
  }

  /**
   * Calculate component score from signals
   */
  calculateComponentScore(signals) {
    if (!signals || signals.length === 0) return 0;

    // Use max signal + diminishing returns for additional signals
    const sortedSignals = signals.sort((a, b) => b.strength - a.strength);

    let score = sortedSignals[0].strength;

    // Each additional signal adds diminishing value
    for (let i = 1; i < sortedSignals.length; i++) {
      score += sortedSignals[i].strength * Math.pow(0.3, i);
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Classify company based on PULL score
   */
  classifyCompany(pullScore, componentScores) {
    // PULL = top 5% with strong signals across all components
    const hasStrongUrgency = componentScores.urgency >= 70;
    const hasProject = componentScores.project >= 50;
    const hasLimitations = componentScores.limitations >= 50;

    if (pullScore >= this.thresholds.pull && hasStrongUrgency && hasProject) {
      return {
        category: 'PULL',
        percentile: 5,
        description: 'Actively blocked demand - would be weird NOT to buy',
        priority: 'immediate',
        color: 'green'
      };
    }

    if (pullScore >= this.thresholds.consideration) {
      return {
        category: 'CONSIDERATION',
        percentile: 20,
        description: 'Project exists but urgency is moderate',
        priority: 'nurture',
        color: 'yellow'
      };
    }

    return {
      category: 'NOT_IN_MARKET',
      percentile: 75,
      description: 'No evidence of prioritized project right now',
      priority: 'long-term',
      color: 'gray'
    };
  }

  /**
   * Calculate confidence in analysis
   */
  calculateConfidence(scores, enrichmentData) {
    let confidence = 50; // Base confidence

    // More data = higher confidence
    const dataPoints = [
      enrichmentData.jobPostings?.length > 0,
      enrichmentData.fundingData,
      enrichmentData.techStack,
      enrichmentData.recentNews?.length > 0,
      enrichmentData.recentHires?.length > 0
    ].filter(Boolean).length;

    confidence += dataPoints * 10;

    // Strong signals = higher confidence
    const avgScore = (scores.project + scores.urgency + scores.list + scores.limitations) / 4;
    if (avgScore > 70) confidence += 15;
    if (avgScore > 50) confidence += 10;

    return Math.min(95, Math.round(confidence));
  }

  /**
   * Generate defensible rationale
   */
  generateRationale(scores, signals, classification) {
    const parts = [];

    // Urgency rationale (most important)
    if (signals.urgency.length > 0) {
      const topUrgency = signals.urgency[0];
      parts.push(`URGENCY: ${topUrgency.evidence}`);
    }

    // Project rationale
    if (signals.project.length > 0) {
      const topProject = signals.project[0];
      parts.push(`PROJECT: ${topProject.evidence}`);
    }

    // Limitations rationale
    if (signals.limitations.length > 0) {
      const topLimitation = signals.limitations[0];
      parts.push(`PAIN: ${topLimitation.evidence}`);
    }

    // List rationale
    if (signals.list.length > 0) {
      const topList = signals.list[0];
      parts.push(`EVALUATION: ${topList.evidence}`);
    }

    // Overall conclusion
    parts.push(`CLASSIFICATION: ${classification.category} - ${classification.description}`);

    return {
      summary: parts.join(' | '),
      detailed: {
        project: signals.project.map(s => s.reasoning).join('; '),
        urgency: signals.urgency.map(s => s.reasoning).join('; '),
        list: signals.list.map(s => s.reasoning).join('; '),
        limitations: signals.limitations.map(s => s.reasoning).join('; ')
      }
    };
  }

  /**
   * Use AI for enhanced PULL analysis (cost-effective batch processing)
   */
  async enhancedPullAnalysis(company, enrichmentData) {
    if (!this.claudeApiKey) {
      console.log('   AI not available, using rule-based analysis');
      return this.detectPullSignals(company, enrichmentData);
    }

    const prompt = this.buildPullAnalysisPrompt(company, enrichmentData);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error(`   AI analysis failed: ${error.message}, using fallback`);
      return this.detectPullSignals(company, enrichmentData);
    }
  }

  /**
   * Build AI prompt for PULL analysis
   */
  buildPullAnalysisPrompt(company, enrichmentData) {
    return `You are an expert at identifying companies with PULL (blocked demand) for ${this.productContext.productName}.

PULL Framework:
- P: Project on their to-do list being prioritized NOW
- U: Urgency - reason it's unavoidable now (funding, growth, compliance, competitive pressure)
- L: List - they're considering options
- L: Limitations - existing options have severe limitations

COMPANY DATA:
Name: ${company.name || company.company_name}
Industry: ${company.industry}
Size: ${company.employees_count} employees
Growth: ${company.employees_count_change_yearly_percentage}% YoY
Founded: ${company.founded_year}
Description: ${company.description?.substring(0, 500) || 'N/A'}
Recent Funding: ${company.last_funding_round_date || 'N/A'}
Active Job Postings: ${company.active_job_postings_count || 0}

ENRICHMENT DATA:
${JSON.stringify(enrichmentData, null, 2)}

PRODUCT CONTEXT:
${JSON.stringify(this.productContext, null, 2)}

Analyze for PULL signals and return JSON:
{
  "pullScore": 0-100,
  "classification": "PULL|CONSIDERATION|NOT_IN_MARKET",
  "scores": {
    "project": 0-100,
    "urgency": 0-100,
    "list": 0-100,
    "limitations": 0-100
  },
  "topSignals": [
    {"type": "urgency|project|list|limitations", "signal": "...", "strength": 0-100, "evidence": "..."}
  ],
  "rationale": "2-3 sentence explanation of why this company does/doesn't have PULL",
  "confidence": 0-100
}`;
  }
}

module.exports = { PullSignalDetector };
