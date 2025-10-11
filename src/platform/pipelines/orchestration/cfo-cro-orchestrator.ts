/**
 * CFO/CRO ORCHESTRATOR
 * 
 * Function-based orchestrator for CFO/CRO discovery pipeline
 * with cost tracking, progress monitoring, and parallel execution
 */

import { FunctionOrchestrator, PipelineContext, PipelineResult } from '../../../intelligence/shared/orchestration';

// Import all pure functions
import { resolveCompanyFunction } from '../functions/company/resolve-company';
import { discoverExecutivesFunction } from '../functions/executives/discover-executives';
import { verifyPersonFunction } from '../functions/verification/verify-person';
import { verifyEmailFunction } from '../functions/verification/verify-email';
import { verifyPhoneFunction } from '../functions/verification/verify-phone';
import { verifyEmploymentFunction } from '../functions/verification/verify-employment';
import { saveExecutiveFunction } from '../functions/database/save-executive';
import { generateCSVFunction } from '../functions/output/generate-csv';
import { generateJSONFunction } from '../functions/output/generate-json';

// ============================================================================
// TYPES
// ============================================================================

interface CostTracker {
  coresignal: { calls: number; credits: number };
  lusha: { calls: number; cost: number };
  prospeo: { calls: number; cost: number };
  twilio: { calls: number; cost: number };
  perplexity: { calls: number; cost: number };
  zerobounce: { calls: number; cost: number };
  myemailverifier: { calls: number; cost: number };
  peopledatalabs: { calls: number; cost: number };
}

interface CompanyResult {
  companyName: string;
  cfo: {
    found: boolean;
    name?: string;
    confidence?: number;
  };
  cro: {
    found: boolean;
    name?: string;
    confidence?: number;
  };
  totalCost: number;
  executionTime: number;
}

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class CFOCROOrchestrator extends FunctionOrchestrator {
  private costTracker: CostTracker = {
    coresignal: { calls: 0, credits: 0 },
    lusha: { calls: 0, cost: 0 },
    prospeo: { calls: 0, cost: 0 },
    twilio: { calls: 0, cost: 0 },
    perplexity: { calls: 0, cost: 0 },
    zerobounce: { calls: 0, cost: 0 },
    myemailverifier: { calls: 0, cost: 0 },
    peopledatalabs: { calls: 0, cost: 0 }
  };

  private executedSteps: string[] = [];
  private startTime: number = 0;

  constructor(context: PipelineContext) {
    super(context);
    this.registerAllSteps();
    this.setupEventHandlers();
  }

  private registerAllSteps(): void {
    this
      .registerStep(resolveCompanyFunction)
      .registerStep(discoverExecutivesFunction)
      .registerStep(verifyPersonFunction)
      .registerStep(verifyEmailFunction)
      .registerStep(verifyPhoneFunction)
      .registerStep(verifyEmploymentFunction)
      .registerStep(saveExecutiveFunction)
      .registerStep(generateCSVFunction)
      .registerStep(generateJSONFunction);
  }

  private setupEventHandlers(): void {
    // Progress tracking
    this.on('stepStart', (step: string) => {
      console.log(`   ⏳ Starting: ${step}...`);
    });

    this.on('stepComplete', (step: string, result: any) => {
      console.log(`   ✅ Complete: ${step} (${result.executionTime || 0}ms)`);
      this.executedSteps.push(step);
      
      // Track costs
      if (result.creditsUsed) {
        this.trackCost(step, result.creditsUsed);
      }
    });

    this.on('stepFailed', (step: string, error: Error) => {
      console.log(`   ❌ Failed: ${step} - ${error.message}`);
    });
  }

  private trackCost(stepName: string, credits: number): void {
    // Map step to API service
    const apiMapping: Record<string, keyof CostTracker> = {
      'resolveCompany': 'coresignal',
      'discoverExecutives': 'coresignal',
      'verifyPerson': 'lusha',
      'verifyEmail': 'zerobounce',
      'verifyPhone': 'twilio',
      'verifyEmployment': 'perplexity'
    };

    const api = apiMapping[stepName];
    if (api && this.costTracker[api]) {
      this.costTracker[api].calls++;
      this.costTracker[api].credits += credits;
    }
  }

  /**
   * Execute CFO/CRO discovery pipeline
   */
  async execute(companies: string[]): Promise<PipelineResult<CompanyResult[]>> {
    this.startTime = Date.now();
    const results: CompanyResult[] = [];

    try {
      console.log('🚀 Starting CFO/CRO Pipeline (Function-Based Orchestration)');
      console.log(`📊 Companies to process: ${companies.length}`);
      console.log('=' .repeat(60));

      for (const companyUrl of companies) {
        console.log(`\n🎯 Processing: ${companyUrl}`);
        const companyStartTime = Date.now();
        
        try {
          // Step 1: Resolve company
          const company = await this.executeStep('resolveCompany', { companyUrl });
          
          // Step 2: Discover executives
          const executives = await this.executeStep('discoverExecutives', company);
          
          const companyResult: CompanyResult = {
            companyName: company.companyName,
            cfo: { found: false },
            cro: { found: false },
            totalCost: 0,
            executionTime: 0
          };
          
          // Step 3-8: Process CFO (if found)
          if (executives.cfo) {
            console.log(`   💰 Processing CFO: ${executives.cfo.name}`);
            await this.processExecutive(executives.cfo, company, 'CFO');
            companyResult.cfo = {
              found: true,
              name: executives.cfo.name,
              confidence: executives.cfo.confidence
            };
          }
          
          // Step 3-8: Process CRO (if found)
          if (executives.cro) {
            console.log(`   📈 Processing CRO: ${executives.cro.name}`);
            await this.processExecutive(executives.cro, company, 'CRO');
            companyResult.cro = {
              found: true,
              name: executives.cro.name,
              confidence: executives.cro.confidence
            };
          }
          
          companyResult.executionTime = Date.now() - companyStartTime;
          companyResult.totalCost = this.calculateCompanyCost();
          
          results.push(companyResult);
          
          console.log(`   ✅ Company complete: ${companyResult.cfo.found ? 'CFO ✅' : 'CFO ❌'}, ${companyResult.cro.found ? 'CRO ✅' : 'CRO ❌'}`);
          
        } catch (error) {
          console.log(`   ❌ Company failed: ${error.message}`);
          results.push({
            companyName: companyUrl,
            cfo: { found: false },
            cro: { found: false },
            totalCost: 0,
            executionTime: Date.now() - companyStartTime
          });
        }
      }

      const totalExecutionTime = Date.now() - this.startTime;
      
      console.log('\n' + '=' .repeat(60));
      console.log('📊 Pipeline Complete!');
      console.log(`⏱️ Total Time: ${totalExecutionTime}ms`);
      console.log(`💰 Total Cost: $${this.calculateTotalCost().toFixed(2)}`);
      console.log(`📞 API Calls: ${JSON.stringify(this.getCostSummary())}`);

      return {
        success: true,
        data: results,
        metadata: {
          executionTime: totalExecutionTime,
          stepsExecuted: this.executedSteps,
          cacheHits: 0,
          apiCalls: this.getCostSummary(),
          costEstimate: this.calculateTotalCost()
        }
      };
    } catch (error) {
      const totalExecutionTime = Date.now() - this.startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executionTime: totalExecutionTime,
          stepsExecuted: this.executedSteps,
          cacheHits: 0,
          apiCalls: {},
          costEstimate: 0
        }
      };
    }
  }

  /**
   * Process single executive (CFO or CRO)
   * Steps run in parallel where possible
   */
  private async processExecutive(executive: any, company: any, role: 'CFO' | 'CRO'): Promise<void> {
    // Step 3: Verify person identity
    const personVerification = await this.executeStep('verifyPerson', {
      personName: executive.name,
      companyName: company.companyName,
      domain: company.domain,
      linkedinUrl: executive.linkedinUrl
    });

    // Step 4-6: Run verification steps in PARALLEL
    const [emailVerification, phoneVerification, employmentVerification] = await Promise.all([
      this.executeStep('verifyEmail', {
        email: executive.email,
        personName: executive.name,
        companyName: company.companyName
      }),
      this.executeStep('verifyPhone', {
        phone: executive.phone,
        personName: executive.name,
        companyName: company.companyName,
        linkedinUrl: executive.linkedinUrl
      }),
      this.executeStep('verifyEmployment', {
        personName: executive.name,
        companyName: company.companyName,
        title: executive.title
      })
    ]);

    // Step 7: Save to database (idempotent)
    const dbResult = await this.executeStep('saveExecutive', {
      companyId: company.companyId,
      companyName: company.companyName,
      role,
      name: executive.name,
      title: executive.title,
      email: executive.email,
      phone: executive.phone,
      linkedinUrl: executive.linkedinUrl,
      confidence: personVerification.confidence,
      verificationDetails: {
        person: personVerification,
        email: emailVerification,
        phone: phoneVerification,
        employment: employmentVerification
      }
    });

    // Step 8-9: Generate outputs in PARALLEL
    await Promise.all([
      this.executeStep('generateCSV', {
        outputPath: './output/executives.csv',
        record: {
          companyName: company.companyName,
          role,
          name: executive.name,
          title: executive.title,
          email: executive.email,
          phone: executive.phone,
          linkedinUrl: executive.linkedinUrl,
          confidence: personVerification.confidence,
          personVerified: personVerification.verified,
          emailValid: emailVerification.valid,
          phoneValid: phoneVerification.valid,
          employmentCurrent: employmentVerification.isCurrent,
          verificationDetails: JSON.stringify({
            person: personVerification,
            email: emailVerification,
            phone: phoneVerification,
            employment: employmentVerification
          }),
          timestamp: new Date().toISOString()
        }
      }),
      this.executeStep('generateJSON', {
        outputPath: './output/executives.json',
        record: {
          company: {
            name: company.companyName,
            domain: company.domain,
            companyId: company.companyId
          },
          executive: {
            role,
            name: executive.name,
            title: executive.title,
            email: executive.email,
            phone: executive.phone,
            linkedinUrl: executive.linkedinUrl
          },
          verification: {
            overall: {
              confidence: personVerification.confidence,
              verified: personVerification.verified
            },
            person: personVerification,
            email: emailVerification,
            phone: phoneVerification,
            employment: employmentVerification
          },
          metadata: {
            timestamp: new Date().toISOString(),
            pipelineVersion: '2.0.0-function-based',
            executionTime: Date.now() - this.startTime
          }
        }
      })
    ]);
  }

  private getCostSummary(): Record<string, number> {
    return Object.fromEntries(
      Object.entries(this.costTracker).map(([api, data]) => [api, data.calls])
    );
  }

  private calculateCompanyCost(): number {
    const pricing: Record<string, number> = {
      coresignal: 1.0,
      lusha: 0.5,
      prospeo: 0.2,
      twilio: 0.01,
      perplexity: 0.002,
      zerobounce: 0.001,
      myemailverifier: 0.001,
      peopledatalabs: 0.1
    };

    return Object.entries(this.costTracker).reduce((total, [api, data]) => {
      return total + (data.calls * (pricing[api] || 0));
    }, 0);
  }

  private calculateTotalCost(): number {
    return this.calculateCompanyCost();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CFOCROOrchestrator;
