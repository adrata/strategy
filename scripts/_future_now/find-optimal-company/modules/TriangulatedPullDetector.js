/**
 * Triangulated PULL Detector
 *
 * Implements the NexusLogistics pattern for detecting blocked demand:
 * 1. Champion Detection - New leaders who KNOW the right answer from their past
 * 2. Bad Option Detection - Hiring patterns that indicate wrong approach
 * 3. Pain Trigger Detection - Public admissions of problems
 * 4. Timeline Pressure - Deadlines that force action
 *
 * PULL = Champion who knows better + Pain being addressed wrong + Timeline pressure
 */

const Anthropic = require('@anthropic-ai/sdk');

class TriangulatedPullDetector {
  constructor(config) {
    this.productContext = config.productContext;
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    this.anthropic = new Anthropic({ apiKey: this.anthropicApiKey });

    // Configure what "advanced" competitors look like for this product
    this.advancedCompetitors = config.advancedCompetitors || [];

    // Configure what "manual labor" roles look like for this problem
    this.manualRolePatterns = config.manualRolePatterns || [
      'data entry', 'clerk', 'manual', 'processor', 'administrator'
    ];

    // Configure relevant leadership titles
    this.relevantLeadershipTitles = config.relevantLeadershipTitles || [
      'VP', 'Director', 'Head of', 'Chief', 'SVP'
    ];
  }

  /**
   * Main entry point - detect PULL signals for a company
   */
  async detectPull(companyInput) {
    console.log(`\n   Analyzing ${companyInput.name || companyInput.domain} for PULL signals...`);

    // Step 1: Get company data from Coresignal
    const companyData = await this.getCompanyData(companyInput);
    if (!companyData) {
      return { error: 'Could not find company data' };
    }

    // Step 2: Detect champions (new leaders with relevant background)
    const championSignals = await this.detectChampions(companyData);

    // Step 3: Detect bad options (hiring patterns indicating wrong approach)
    const badOptionSignals = await this.detectBadOptions(companyData);

    // Step 4: Research pain triggers (public admissions of problems)
    const painTriggers = await this.researchPainTriggers(companyData);

    // Step 5: Detect timeline pressure
    const timelinePressure = await this.detectTimelinePressure(companyData, painTriggers);

    // Step 6: Synthesize with Claude
    const pullAnalysis = await this.synthesizePullAnalysis({
      company: companyData,
      champions: championSignals,
      badOptions: badOptionSignals,
      painTriggers,
      timeline: timelinePressure
    });

    return pullAnalysis;
  }

  /**
   * Get company data from Coresignal
   */
  async getCompanyData(input) {
    if (!this.coresignalApiKey) {
      console.log('   [MOCK] No Coresignal API key - using mock data');
      return this.getMockCompanyData(input);
    }

    try {
      // Search for company
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v1/company/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.coresignalApiKey}`
        },
        body: JSON.stringify({
          website_url: input.domain,
          name: input.name
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Coresignal search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      if (!searchData.id) {
        console.log('   Company not found in Coresignal');
        return null;
      }

      // Get full company data
      const companyResponse = await fetch(
        `https://api.coresignal.com/cdapi/v1/company/${searchData.id}`,
        {
          headers: { 'Authorization': `Bearer ${this.coresignalApiKey}` }
        }
      );

      const companyData = await companyResponse.json();

      // Get recent employees (for champion detection)
      const employeesResponse = await fetch(
        `https://api.coresignal.com/cdapi/v1/company/${searchData.id}/employees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.coresignalApiKey}`
          },
          body: JSON.stringify({
            filters: {
              current_employee: true,
              seniority: ['VP', 'Director', 'C-Suite', 'Manager']
            },
            limit: 50
          })
        }
      );

      const employeesData = await employeesResponse.json();

      // Get job postings (for bad option detection)
      const jobsResponse = await fetch(
        'https://api.coresignal.com/cdapi/v1/job/search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.coresignalApiKey}`
          },
          body: JSON.stringify({
            company_id: searchData.id,
            filters: { active: true },
            limit: 100
          })
        }
      );

      const jobsData = await jobsResponse.json();

      return {
        ...companyData,
        employees: employeesData.employees || [],
        jobPostings: jobsData.jobs || []
      };

    } catch (error) {
      console.error(`   Coresignal error: ${error.message}`);
      return this.getMockCompanyData(input);
    }
  }

  /**
   * Detect champions - new leaders who know the right answer
   */
  async detectChampions(companyData) {
    const champions = [];
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    for (const employee of companyData.employees || []) {
      // Check if this is a recent hire
      const startDate = new Date(employee.start_date || employee.employment_start_date);
      const isRecent = startDate > ninetyDaysAgo;

      // Check if this is a leadership role
      const title = (employee.title || '').toLowerCase();
      const isLeadership = this.relevantLeadershipTitles.some(lt =>
        title.includes(lt.toLowerCase())
      );

      if (!isRecent || !isLeadership) continue;

      // Calculate tenure in days
      const tenureDays = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));

      // Analyze their career history
      const careerHistory = employee.employment_history || [];

      // Check if they came from an "advanced" company
      const advancedBackground = careerHistory.find(job =>
        this.advancedCompetitors.some(comp =>
          (job.company_name || '').toLowerCase().includes(comp.toLowerCase())
        )
      );

      // Check if they have relevant experience
      const relevantExperience = careerHistory.filter(job => {
        const jobTitle = (job.title || '').toLowerCase();
        return this.productContext.relevantRoles?.some(role =>
          jobTitle.includes(role.toLowerCase())
        );
      });

      const champion = {
        name: employee.name || `${employee.first_name} ${employee.last_name}`,
        title: employee.title,
        tenureDays,
        startDate: startDate.toISOString(),
        previousCompany: careerHistory[0]?.company_name || 'Unknown',
        previousTitle: careerHistory[0]?.title || 'Unknown',

        // Scoring signals
        signals: [],
        score: 0
      };

      // Score: New leader (< 90 days)
      if (tenureDays < 30) {
        champion.signals.push({
          type: 'very_new_leader',
          strength: 95,
          evidence: `Just joined ${tenureDays} days ago - in "prove myself" phase`
        });
        champion.score += 30;
      } else if (tenureDays < 90) {
        champion.signals.push({
          type: 'new_leader',
          strength: 85,
          evidence: `Joined ${tenureDays} days ago - still establishing agenda`
        });
        champion.score += 25;
      }

      // Score: Came from advanced competitor
      if (advancedBackground) {
        champion.signals.push({
          type: 'advanced_background',
          strength: 95,
          evidence: `Previously at ${advancedBackground.company_name} - knows the right way`,
          previousRole: advancedBackground.title
        });
        champion.advancedCompanyExperience = advancedBackground;
        champion.score += 35;
      }

      // Score: Has built this before
      if (relevantExperience.length > 0) {
        champion.signals.push({
          type: 'relevant_experience',
          strength: 90,
          evidence: `Built similar capabilities at ${relevantExperience[0].company_name}`
        });
        champion.score += 25;
      }

      champions.push(champion);
    }

    // Sort by score
    champions.sort((a, b) => b.score - a.score);

    console.log(`   Found ${champions.length} potential champions`);
    if (champions.length > 0) {
      console.log(`   Top champion: ${champions[0].name} (score: ${champions[0].score})`);
    }

    return champions;
  }

  /**
   * Detect bad options - hiring patterns indicating wrong approach
   */
  async detectBadOptions(companyData) {
    const badOptions = {
      manualRoleCount: 0,
      urgentPostings: 0,
      postings: [],
      signals: [],
      score: 0
    };

    for (const job of companyData.jobPostings || []) {
      const title = (job.title || '').toLowerCase();
      const description = (job.description || '').toLowerCase();

      // Check if this is a "manual labor" role
      const isManualRole = this.manualRolePatterns.some(pattern =>
        title.includes(pattern) || description.includes(pattern)
      );

      // Check for urgency markers
      const urgencyMarkers = ['urgent', 'asap', 'immediate', 'immediately', 'start now'];
      const isUrgent = urgencyMarkers.some(marker =>
        title.includes(marker) || description.includes(marker)
      );

      if (isManualRole) {
        badOptions.manualRoleCount++;
        badOptions.postings.push({
          title: job.title,
          isUrgent,
          postedDate: job.posted_date,
          location: job.location
        });
      }

      if (isUrgent) {
        badOptions.urgentPostings++;
      }
    }

    // Score: High volume of manual roles
    if (badOptions.manualRoleCount >= 10) {
      badOptions.signals.push({
        type: 'mass_manual_hiring',
        strength: 95,
        evidence: `${badOptions.manualRoleCount} manual roles being hired - systemic problem`
      });
      badOptions.score += 35;
    } else if (badOptions.manualRoleCount >= 5) {
      badOptions.signals.push({
        type: 'significant_manual_hiring',
        strength: 85,
        evidence: `${badOptions.manualRoleCount} manual roles being hired`
      });
      badOptions.score += 25;
    }

    // Score: Urgency markers
    if (badOptions.urgentPostings >= 5) {
      badOptions.signals.push({
        type: 'urgent_hiring',
        strength: 90,
        evidence: `${badOptions.urgentPostings} "urgent" job postings - pain is acute`
      });
      badOptions.score += 30;
    }

    console.log(`   Bad option signals: ${badOptions.manualRoleCount} manual roles, ${badOptions.urgentPostings} urgent`);

    return badOptions;
  }

  /**
   * Research pain triggers using Perplexity
   */
  async researchPainTriggers(companyData) {
    const companyName = companyData.name || companyData.company_name;

    if (!this.perplexityApiKey) {
      console.log('   [MOCK] No Perplexity API key - using mock data');
      return this.getMockPainTriggers(companyName);
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{
            role: 'user',
            content: `Research ${companyName} for the following:

1. Recent earnings calls or financial reports - extract any mentions of:
   - Operational challenges or issues
   - Margin problems or cost pressures
   - Efficiency or error rate concerns

2. Executive quotes about challenges they're solving

3. Analyst concerns or industry commentary

4. Any deadlines, board meetings, or timeline pressures mentioned

5. Recent news about layoffs, restructuring, or strategic changes

Return structured findings with specific quotes and sources where available.
Format as JSON with keys: earningsPain, executiveQuotes, analystConcerns, timelinePressures, recentChanges`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Try to parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return {
            ...JSON.parse(jsonMatch[0]),
            rawResponse: content,
            sources: data.citations || []
          };
        }
      } catch (e) {
        // Fallback to raw text
      }

      return {
        rawResponse: content,
        sources: data.citations || [],
        earningsPain: null,
        executiveQuotes: null,
        analystConcerns: null,
        timelinePressures: null
      };

    } catch (error) {
      console.error(`   Perplexity error: ${error.message}`);
      return this.getMockPainTriggers(companyName);
    }
  }

  /**
   * Detect timeline pressure
   */
  async detectTimelinePressure(companyData, painTriggers) {
    const timeline = {
      signals: [],
      score: 0
    };

    // Check funding recency
    if (companyData.last_funding_round_date) {
      const fundingDate = new Date(companyData.last_funding_round_date);
      const daysSinceFunding = Math.floor((new Date() - fundingDate) / (1000 * 60 * 60 * 24));

      if (daysSinceFunding < 90) {
        timeline.signals.push({
          type: 'recent_funding',
          strength: 95,
          evidence: `Raised funding ${daysSinceFunding} days ago - investors expect rapid progress`,
          fundingAmount: companyData.last_funding_round_amount_raised
        });
        timeline.score += 30;
      } else if (daysSinceFunding < 180) {
        timeline.signals.push({
          type: 'post_funding',
          strength: 80,
          evidence: `Raised funding ${daysSinceFunding} days ago - still in deployment phase`
        });
        timeline.score += 20;
      }
    }

    // Check rapid growth (creates operational urgency)
    const growthRate = companyData.employees_count_change_yearly_percentage || 0;
    if (growthRate > 30) {
      timeline.signals.push({
        type: 'hypergrowth',
        strength: 90,
        evidence: `${growthRate}% YoY growth - processes breaking at scale`
      });
      timeline.score += 25;
    } else if (growthRate > 15) {
      timeline.signals.push({
        type: 'rapid_growth',
        strength: 75,
        evidence: `${growthRate}% YoY growth - scaling challenges`
      });
      timeline.score += 15;
    }

    // Check for timeline pressures from Perplexity research
    if (painTriggers.timelinePressures) {
      timeline.signals.push({
        type: 'public_deadline',
        strength: 95,
        evidence: painTriggers.timelinePressures,
        source: 'Perplexity research'
      });
      timeline.score += 30;
    }

    // Fiscal year pressure (Q4 = budget flush, Q1 = new initiatives)
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 9 && currentMonth <= 11) { // Oct-Dec
      timeline.signals.push({
        type: 'fiscal_year_end',
        strength: 70,
        evidence: 'Q4 - budget must be spent or lost'
      });
      timeline.score += 15;
    } else if (currentMonth >= 0 && currentMonth <= 2) { // Jan-Mar
      timeline.signals.push({
        type: 'new_fiscal_year',
        strength: 70,
        evidence: 'Q1 - new budgets and initiatives launching'
      });
      timeline.score += 15;
    }

    console.log(`   Timeline pressure score: ${timeline.score}`);

    return timeline;
  }

  /**
   * Synthesize all signals with Claude
   */
  async synthesizePullAnalysis(data) {
    const { company, champions, badOptions, painTriggers, timeline } = data;

    // Calculate raw scores
    const championScore = champions.length > 0 ? champions[0].score : 0;
    const badOptionScore = badOptions.score;
    const painScore = painTriggers.earningsPain ? 30 : 0;
    const timelineScore = timeline.score;

    // Weighted PULL score
    const pullScore = Math.min(100, Math.round(
      championScore * 0.30 +
      badOptionScore * 0.25 +
      painScore * 0.20 +
      timelineScore * 0.25
    ));

    // Determine classification
    let classification;
    if (pullScore >= 75 && champions.length > 0 && (badOptions.score > 0 || timelineScore > 0)) {
      classification = 'PULL';
    } else if (pullScore >= 50) {
      classification = 'CONSIDERATION';
    } else {
      classification = 'NOT_IN_MARKET';
    }

    // Use Claude to generate narrative and pitch angle
    let narrative = null;
    let pitchAngle = null;

    if (this.anthropicApiKey && pullScore >= 50) {
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `You are an expert sales strategist. Analyze this PULL intelligence and generate a narrative.

COMPANY: ${company.name || company.company_name}
INDUSTRY: ${company.industry}
SIZE: ${company.employees_count} employees

CHAMPION DATA:
${JSON.stringify(champions.slice(0, 3), null, 2)}

BAD OPTION DATA (hiring patterns):
${JSON.stringify(badOptions, null, 2)}

PAIN TRIGGER RESEARCH:
${JSON.stringify(painTriggers, null, 2)}

TIMELINE PRESSURE:
${JSON.stringify(timeline, null, 2)}

PRODUCT WE'RE SELLING:
${this.productContext.productName}
Problem we solve: ${this.productContext.primaryProblem}

Generate a response in this EXACT JSON format:
{
  "narrative": "A 2-3 paragraph story like the NexusLogistics example - explain the PULL situation with specific names, evidence, and the conflict the champion faces",
  "pitchAngle": {
    "do": "The specific, quick-win pitch angle to use",
    "avoid": "What NOT to pitch (e.g., 'digital transformation')"
  },
  "openingLine": "A compelling first sentence for outreach to the champion",
  "confidence": 0-100
}`
          }]
        });

        const content = response.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          narrative = parsed.narrative;
          pitchAngle = parsed.pitchAngle;
        }
      } catch (error) {
        console.error(`   Claude synthesis error: ${error.message}`);
      }
    }

    return {
      company: company.name || company.company_name,
      pullScore,
      classification,

      scores: {
        champion: championScore,
        badOptions: badOptionScore,
        pain: painScore,
        timeline: timelineScore
      },

      champion: champions.length > 0 ? {
        name: champions[0].name,
        title: champions[0].title,
        tenure: `${champions[0].tenureDays} days`,
        previousCompany: champions[0].previousCompany,
        previousTitle: champions[0].previousTitle,
        insight: champions[0].advancedCompanyExperience
          ? `Knows the right approach from ${champions[0].advancedCompanyExperience.company_name}`
          : null,
        signals: champions[0].signals
      } : null,

      badOption: badOptions.manualRoleCount > 0 ? {
        hiring: `${badOptions.manualRoleCount} ${badOptions.postings[0]?.title || 'manual'} roles`,
        urgentCount: badOptions.urgentPostings,
        limitation: "Bodies don't scale - unit economics will suffer",
        signals: badOptions.signals
      } : null,

      painTrigger: painTriggers.earningsPain ? {
        source: 'Public filings/research',
        pain: painTriggers.earningsPain,
        executiveQuotes: painTriggers.executiveQuotes
      } : null,

      timeline: timeline.signals.length > 0 ? {
        pressures: timeline.signals.map(s => s.evidence),
        urgency: timeline.signals[0]?.evidence
      } : null,

      narrative,
      pitchAngle,

      evidence: {
        champions: champions.slice(0, 3),
        jobPostings: badOptions.postings.slice(0, 5),
        perplexityResearch: painTriggers.rawResponse?.substring(0, 500),
        sources: painTriggers.sources
      },

      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Mock data for testing without API keys
   */
  getMockCompanyData(input) {
    return {
      name: input.name || 'Test Company',
      industry: 'Computer Software',
      employees_count: 250,
      employees_count_change_yearly_percentage: 25,
      last_funding_round_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      last_funding_round_amount_raised: '$15M',
      employees: [
        {
          name: 'Sarah Chen',
          title: 'VP of Operations',
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          employment_history: [
            { company_name: 'Stripe', title: 'Director of Operations' },
            { company_name: 'Square', title: 'Operations Manager' }
          ]
        }
      ],
      jobPostings: [
        { title: 'Data Entry Clerk - URGENT', description: 'Immediate start needed', posted_date: new Date().toISOString() },
        { title: 'Data Entry Specialist', description: 'Manual data processing', posted_date: new Date().toISOString() },
        { title: 'Operations Clerk', description: 'Manual verification needed ASAP', posted_date: new Date().toISOString() }
      ]
    };
  }

  getMockPainTriggers(companyName) {
    return {
      earningsPain: 'Operational inefficiencies cited as concern',
      executiveQuotes: null,
      analystConcerns: null,
      timelinePressures: null,
      rawResponse: `[Mock] Research for ${companyName} - no API key configured`,
      sources: []
    };
  }
}

module.exports = { TriangulatedPullDetector };
