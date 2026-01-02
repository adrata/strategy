/**
 * Organizational Behavioral Physics Pipeline
 *
 * End-to-end orchestrator for the OBP system.
 * Takes a company and produces actionable PULL intelligence.
 *
 * Pipeline:
 * 1. Fetch org data from Coresignal
 * 2. Calculate organizational tensions
 * 3. Model behavioral physics
 * 4. Simulate internal dialogue
 * 5. Generate final PULL report
 */

const { OrganizationalTensionCalculator } = require('./OrganizationalTensionCalculator');
const { BehavioralPhysicsEngine } = require('./BehavioralPhysicsEngine');
const { InternalDialogueSimulator } = require('./InternalDialogueSimulator');

class OBPPipeline {
  constructor(options = {}) {
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;

    this.productContext = options.productContext || {
      productName: 'Compliance Automation Platform',
      primaryProblem: 'Manual compliance processes that don\'t scale',
      quickWinMetric: 'SOC 2 in 4 months vs. 12-18 months manually',
      targetDepartments: ['security', 'compliance']
    };

    // Initialize modules
    this.tensionCalculator = new OrganizationalTensionCalculator({
      productContext: this.productContext
    });

    this.physicsEngine = new BehavioralPhysicsEngine({
      productContext: this.productContext
    });

    this.dialogueSimulator = new InternalDialogueSimulator({
      productContext: this.productContext
    });
  }

  /**
   * Run full OBP analysis on a company
   * @param {object} companyInput - { name, domain, linkedinUrl, or coresignalId }
   * @returns {object} Complete PULL intelligence report
   */
  async analyze(companyInput) {
    console.log('\n' + '═'.repeat(70));
    console.log('  ORGANIZATIONAL BEHAVIORAL PHYSICS ANALYSIS');
    console.log('═'.repeat(70));

    const startTime = Date.now();

    try {
      // Step 1: Get org data
      console.log('\n📊 Step 1: Fetching organizational data...');
      const orgData = await this.fetchOrgData(companyInput);

      if (!orgData) {
        return {
          success: false,
          error: 'Could not fetch company data',
          company: companyInput.name || companyInput.domain
        };
      }

      console.log(`   Company: ${orgData.name || orgData.company_name}`);
      console.log(`   Employees: ${orgData.employees_count || orgData.employees?.length || 'Unknown'}`);
      console.log(`   Industry: ${orgData.industry || 'Unknown'}`);

      // Step 2: Calculate tensions
      console.log('\n⚡ Step 2: Calculating organizational tensions...');
      const tensionAnalysis = await this.tensionCalculator.calculateTensions(orgData);

      // Step 3: Model behavioral physics
      console.log('\n🔮 Step 3: Modeling behavioral physics...');
      const behaviorPredictions = await this.physicsEngine.predictBehavior(tensionAnalysis);

      // Step 4: Simulate internal dialogue
      console.log('\n💭 Step 4: Simulating internal dialogue...');
      const dialogueSimulation = await this.dialogueSimulator.generateDialogue(
        orgData,
        tensionAnalysis,
        behaviorPredictions
      );

      // Step 5: Compile final report
      console.log('\n📋 Step 5: Compiling PULL report...');
      const report = this.compileReport(
        orgData,
        tensionAnalysis,
        behaviorPredictions,
        dialogueSimulation
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ Analysis complete in ${duration}s`);

      return {
        success: true,
        ...report
      };

    } catch (error) {
      console.error(`\n❌ Pipeline error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        company: companyInput.name || companyInput.domain
      };
    }
  }

  /**
   * Fetch org data from Coresignal or use provided data
   */
  async fetchOrgData(input) {
    // If full data is provided, use it
    if (input.employees && input.employees.length > 0) {
      return input;
    }

    // If no API key, return mock data
    if (!this.coresignalApiKey) {
      console.log('   [MOCK] No Coresignal API key - using example data');
      return this.getMockOrgData(input);
    }

    try {
      // Search for company
      let companyId = input.coresignalId;

      if (!companyId) {
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
          throw new Error(`Company search failed: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        companyId = searchData.id;

        if (!companyId) {
          console.log('   Company not found in Coresignal');
          return this.getMockOrgData(input);
        }
      }

      // Get company details
      const companyResponse = await fetch(
        `https://api.coresignal.com/cdapi/v1/company/${companyId}`,
        {
          headers: { 'Authorization': `Bearer ${this.coresignalApiKey}` }
        }
      );

      const companyData = await companyResponse.json();

      // Get employees
      const employeesResponse = await fetch(
        `https://api.coresignal.com/cdapi/v1/company/${companyId}/employees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.coresignalApiKey}`
          },
          body: JSON.stringify({
            filters: {
              current_employee: true
            },
            limit: 200
          })
        }
      );

      const employeesData = await employeesResponse.json();

      return {
        ...companyData,
        employees: employeesData.employees || []
      };

    } catch (error) {
      console.error(`   Coresignal error: ${error.message}`);
      return this.getMockOrgData(input);
    }
  }

  /**
   * Compile final PULL report
   */
  compileReport(orgData, tensionAnalysis, behaviorPredictions, dialogueSimulation) {
    const report = {
      // Header
      company: orgData.name || orgData.company_name,
      pullScore: tensionAnalysis.compositeTension,
      classification: tensionAnalysis.classification,

      // Executive Summary
      executiveSummary: this.generateExecutiveSummary(
        tensionAnalysis,
        behaviorPredictions,
        dialogueSimulation
      ),

      // Champion Profile
      champion: behaviorPredictions.champion.identified ? {
        name: behaviorPredictions.champion.name,
        title: behaviorPredictions.champion.title,
        tenure: `${behaviorPredictions.champion.tenureDays} days`,
        windowRemaining: `${behaviorPredictions.champion.windowRemaining} days`,
        previousCompany: behaviorPredictions.champion.previousCompany,
        previousTitle: behaviorPredictions.champion.previousTitle,
        urgencyLevel: behaviorPredictions.champion.urgencyLevel,
        knowledgeLevel: behaviorPredictions.champion.knowledgeLevel?.level,
        insight: behaviorPredictions.champion.previousCompany
          ? `Came from ${behaviorPredictions.champion.previousCompany} - experiencing ratio shock, knows the right solution`
          : 'New leader looking for quick wins'
      } : null,

      // Tension Breakdown
      tensions: {
        ratio: {
          score: tensionAnalysis.tensions.ratio.score,
          implication: tensionAnalysis.tensions.ratio.implication,
          data: tensionAnalysis.tensions.ratio.ratios
        },
        leadership: {
          score: tensionAnalysis.tensions.leadership.score,
          implication: tensionAnalysis.tensions.leadership.implication,
          champions: tensionAnalysis.tensions.leadership.champions?.length || 0
        },
        growth: {
          score: tensionAnalysis.tensions.growth.score,
          implication: tensionAnalysis.tensions.growth.implication,
          companyGrowth: tensionAnalysis.tensions.growth.companyGrowth
        },
        resource: {
          score: tensionAnalysis.tensions.resource.score,
          implication: tensionAnalysis.tensions.resource.implication,
          fundingStage: tensionAnalysis.tensions.resource.fundingStage
        },
        reporting: {
          score: tensionAnalysis.tensions.reporting.score,
          implication: tensionAnalysis.tensions.reporting.implication
        }
      },

      // Behavioral Predictions
      predictions: {
        buyingProbability: Math.round(behaviorPredictions.buyingProbability * 100),
        actionWindow: behaviorPredictions.actionWindow,
        decisionPath: behaviorPredictions.decisionPath,
        behavioralPatterns: behaviorPredictions.behavioralPatterns.slice(0, 3)
      },

      // Strategy
      strategy: {
        pitchAngle: dialogueSimulation.pitchAngle || behaviorPredictions.pitchFraming,
        openingLine: dialogueSimulation.openingLine,
        keyInsight: dialogueSimulation.keyInsight,
        objections: behaviorPredictions.objectionPredictions.slice(0, 3),
        timing: behaviorPredictions.timingRecommendation
      },

      // The Scene
      internalDialogue: dialogueSimulation.scene,

      // Metadata
      analyzedAt: new Date().toISOString(),
      orgDataSource: this.coresignalApiKey ? 'coresignal' : 'mock'
    };

    return report;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(tensionAnalysis, behaviorPredictions, dialogueSimulation) {
    const champion = behaviorPredictions.champion;
    const classification = tensionAnalysis.classification;
    const score = tensionAnalysis.compositeTension;

    let summary = `**PULL Score: ${score}/100 (${classification.category})**\n\n`;

    if (classification.category === 'PULL' || classification.category === 'HIGH_CONSIDERATION') {
      if (champion.identified) {
        summary += `${champion.name} (${champion.title}) joined ${champion.tenureDays} days ago`;

        if (champion.previousCompany) {
          summary += ` from ${champion.previousCompany}`;
        }

        summary += `. They have ${champion.windowRemaining} days left in their "prove myself" window`;

        if (champion.previousCompany) {
          summary += ` and are likely experiencing "ratio shock" - the gap between ${champion.previousCompany}'s mature security program and what exists here`;
        }

        summary += '.\n\n';

        summary += `**The Dynamic:** ${champion.name} knows what good looks like. `;
        summary += `They're in a ${behaviorPredictions.timingRecommendation?.daysToAct || 30}-day window to demonstrate value. `;
        summary += `${dialogueSimulation.keyInsight || 'They will champion a solution that helps them show quick progress.'}`;
      } else {
        summary += `High organizational tension detected but no clear champion identified yet. `;
        summary += `Enterprise sales pressure or a new hire could create the catalyst for action.`;
      }
    } else if (classification.category === 'CONSIDERATION') {
      summary += `Moderate tensions present - company may be receptive but no urgent driver detected. `;
      summary += `Monitor for trigger events (new leadership hire, funding, enterprise deal pressure).`;
    } else {
      summary += `Low organizational tension - company is not currently in market. `;
      summary += `Check back when leadership changes or funding occurs.`;
    }

    return summary;
  }

  /**
   * Get mock org data for testing
   */
  getMockOrgData(input) {
    const name = input.name || 'Example Company';

    return {
      name,
      company_name: name,
      industry: 'Computer Software',
      employees_count: 350,
      employees_count_change_yearly_percentage: 35,
      founded_year: 2019,
      last_funding_round_type: 'Series B',
      last_funding_round_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      last_funding_round_amount_raised: '$45M',

      employees: [
        // Security leadership - new hire from mature company
        {
          name: 'Sarah Chen',
          first_name: 'Sarah',
          last_name: 'Chen',
          title: 'Head of Security',
          start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          employment_history: [
            { company_name: 'Stripe', title: 'Security Engineering Manager', start_date: '2020-01-01', end_date: '2024-10-01' },
            { company_name: 'Google', title: 'Security Engineer', start_date: '2017-01-01', end_date: '2020-01-01' }
          ]
        },
        // Security team members
        { name: 'Alex Kumar', title: 'Security Engineer', start_date: '2023-03-01' },
        { name: 'Jordan Lee', title: 'Security Engineer', start_date: '2023-08-01' },
        { name: 'Casey Smith', title: 'Security Analyst', start_date: '2024-01-01' },
        // Engineering team (large)
        ...Array.from({ length: 80 }, (_, i) => ({
          name: `Engineer ${i + 1}`,
          title: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Engineering Manager'][i % 4],
          start_date: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString()
        })),
        // Executives
        { name: 'Michael Torres', title: 'CEO', start_date: '2019-01-01' },
        { name: 'Jennifer Park', title: 'CFO', start_date: '2022-06-01' },
        { name: 'David Kim', title: 'CTO', start_date: '2019-01-01' },
        // Other departments
        ...Array.from({ length: 30 }, (_, i) => ({
          name: `Sales ${i + 1}`,
          title: ['Account Executive', 'SDR', 'Sales Manager'][i % 3],
          start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        })),
        ...Array.from({ length: 20 }, (_, i) => ({
          name: `Product ${i + 1}`,
          title: ['Product Manager', 'Product Designer', 'UX Researcher'][i % 3],
          start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        }))
      ]
    };
  }

  /**
   * Print formatted report to console
   */
  printReport(report) {
    console.log('\n' + '═'.repeat(70));
    console.log('  PULL INTELLIGENCE REPORT');
    console.log('═'.repeat(70));

    console.log(`
  Company: ${report.company}
  PULL Score: ${report.pullScore}/100
  Classification: ${report.classification.category}
  Buying Probability: ${report.predictions.buyingProbability}%
`);

    if (report.champion) {
      console.log('─'.repeat(70));
      console.log('  CHAMPION PROFILE');
      console.log('─'.repeat(70));
      console.log(`
  Name: ${report.champion.name}
  Title: ${report.champion.title}
  Tenure: ${report.champion.tenure}
  Window Remaining: ${report.champion.windowRemaining}
  Previous: ${report.champion.previousTitle} at ${report.champion.previousCompany}
  Insight: ${report.champion.insight}
`);
    }

    console.log('─'.repeat(70));
    console.log('  ORGANIZATIONAL TENSIONS');
    console.log('─'.repeat(70));
    console.log(`
  Ratio Tension: ${report.tensions.ratio.score}/100
    ${report.tensions.ratio.implication}

  Leadership Tension: ${report.tensions.leadership.score}/100
    ${report.tensions.leadership.implication}

  Growth Tension: ${report.tensions.growth.score}/100
    ${report.tensions.growth.implication}

  Resource Tension: ${report.tensions.resource.score}/100
    ${report.tensions.resource.implication}
`);

    console.log('─'.repeat(70));
    console.log('  STRATEGY');
    console.log('─'.repeat(70));
    console.log(`
  Pitch Angle:
    DO: ${report.strategy.pitchAngle?.do || report.strategy.pitchAngle?.primary?.message || 'N/A'}
    AVOID: ${report.strategy.pitchAngle?.avoid || 'N/A'}

  Opening Line:
    "${report.strategy.openingLine || 'N/A'}"

  Key Insight:
    ${report.strategy.keyInsight || 'N/A'}

  Timing:
    ${report.strategy.timing?.urgency || 'standard'} - Act within ${report.strategy.timing?.daysToAct || 30} days
`);

    console.log('─'.repeat(70));
    console.log('  SIMULATED INTERNAL DIALOGUE');
    console.log('─'.repeat(70));
    console.log(report.internalDialogue);

    console.log('\n' + '═'.repeat(70) + '\n');
  }
}

module.exports = { OBPPipeline };
