/**
 * Batch OBP Processor Module
 *
 * Handles parallel OBP analysis with:
 * - Concurrency control (avoid rate limits)
 * - Progress tracking
 * - Resume capability
 * - Error handling with partial results
 * - Memory-efficient streaming
 */

class BatchOBPProcessor {
  constructor(config = {}) {
    this.coresignalApiKey = config.coresignalApiKey || process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = config.claudeApiKey || process.env.ANTHROPIC_API_KEY;
    this.productContext = config.productContext || {};
    this.verbose = config.verbose !== false;

    // Concurrency settings
    this.maxConcurrency = config.maxConcurrency || 3;    // Parallel OBP analyses
    this.delayBetweenBatches = config.delayBetweenBatches || 2000;
    this.retryAttempts = config.retryAttempts || 2;
    this.retryDelayMs = config.retryDelayMs || 3000;
  }

  /**
   * Process multiple companies with OBP analysis
   * @param {Array} companies - Array of company objects
   * @param {object} options - Processing options
   * @returns {object} Results with rankings and statistics
   */
  async processCompanies(companies, options = {}) {
    const {
      onProgress,
      onCompanyComplete,
      skipDialogue = false,     // Skip dialogue generation for faster processing
      resumeFromId = null       // Resume from a specific company ID
    } = options;

    const startTime = Date.now();
    const results = [];
    const errors = [];

    // Track progress
    const progress = {
      total: companies.length,
      completed: 0,
      succeeded: 0,
      failed: 0,
      currentBatch: 0,
      currentCompany: null
    };

    const emitProgress = () => {
      if (onProgress) onProgress({ ...progress });
    };

    this.log(`\n${'═'.repeat(60)}`);
    this.log(`  BATCH OBP PROCESSOR`);
    this.log(`${'═'.repeat(60)}`);
    this.log(`Companies to process: ${companies.length}`);
    this.log(`Concurrency: ${this.maxConcurrency}`);
    this.log(`Skip dialogue: ${skipDialogue}`);

    // Find resume point if specified
    let startIndex = 0;
    if (resumeFromId) {
      startIndex = companies.findIndex(c => c.id === resumeFromId || c.coresignalId === resumeFromId);
      if (startIndex === -1) startIndex = 0;
      this.log(`Resuming from index ${startIndex}`);
    }

    // Process in batches for concurrency control
    const totalBatches = Math.ceil((companies.length - startIndex) / this.maxConcurrency);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = startIndex + (batchIndex * this.maxConcurrency);
      const batchEnd = Math.min(batchStart + this.maxConcurrency, companies.length);
      const batch = companies.slice(batchStart, batchEnd);

      progress.currentBatch = batchIndex + 1;
      emitProgress();

      this.log(`\n📦 Batch ${batchIndex + 1}/${totalBatches}: Processing ${batch.length} companies`);

      // Process batch in parallel
      const batchPromises = batch.map(async (company, i) => {
        const companyName = company.name || company.company_name;
        progress.currentCompany = companyName;
        emitProgress();

        try {
          const result = await this.processCompanyWithRetry(company, {
            skipDialogue,
            attempt: 1
          });

          progress.completed++;
          progress.succeeded++;
          emitProgress();

          if (onCompanyComplete) {
            onCompanyComplete(company, result, null);
          }

          return {
            success: true,
            company: companyName,
            result
          };

        } catch (error) {
          progress.completed++;
          progress.failed++;
          emitProgress();

          errors.push({
            company: companyName,
            error: error.message
          });

          if (onCompanyComplete) {
            onCompanyComplete(company, null, error);
          }

          return {
            success: false,
            company: companyName,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches (except for last batch)
      if (batchIndex < totalBatches - 1) {
        this.log(`   Waiting ${this.delayBetweenBatches}ms before next batch...`);
        await this.delay(this.delayBetweenBatches);
      }
    }

    const processingTime = Date.now() - startTime;

    this.log(`\n${'═'.repeat(60)}`);
    this.log(`  BATCH PROCESSING COMPLETE`);
    this.log(`${'═'.repeat(60)}`);
    this.log(`Total processed: ${progress.completed}`);
    this.log(`Succeeded: ${progress.succeeded}`);
    this.log(`Failed: ${progress.failed}`);
    this.log(`Time: ${(processingTime / 1000).toFixed(1)}s`);

    // Compile and rank results
    const successfulResults = results
      .filter(r => r.success)
      .map(r => ({
        ...r.result,
        company: r.company
      }))
      .sort((a, b) => (b.pullScore || 0) - (a.pullScore || 0));

    // Add ranks
    successfulResults.forEach((r, i) => {
      r.rank = i + 1;
    });

    return {
      success: true,
      results: successfulResults,
      errors,
      statistics: {
        total: companies.length,
        processed: progress.completed,
        succeeded: progress.succeeded,
        failed: progress.failed,
        processingTimeMs: processingTime,
        avgTimePerCompany: processingTime / progress.completed
      }
    };
  }

  /**
   * Process a single company with retry logic
   */
  async processCompanyWithRetry(company, options = {}) {
    const { skipDialogue, attempt = 1 } = options;
    const companyName = company.name || company.company_name;

    try {
      this.log(`   [${attempt}] Analyzing ${companyName}...`);

      // Fetch employees if not already present
      let employees = company.employees;
      if (!employees || employees.length === 0) {
        employees = await this.fetchEmployees(company.id || company.coresignalId);
      }

      // Run OBP analysis
      const result = await this.runOBPAnalysis({
        ...company,
        employees
      }, { skipDialogue });

      return result;

    } catch (error) {
      if (attempt < this.retryAttempts) {
        this.log(`   ⚠️ Attempt ${attempt} failed for ${companyName}: ${error.message}`);
        this.log(`   Retrying in ${this.retryDelayMs}ms...`);
        await this.delay(this.retryDelayMs);

        return this.processCompanyWithRetry(company, {
          skipDialogue,
          attempt: attempt + 1
        });
      }

      throw error;
    }
  }

  /**
   * Fetch employees from Coresignal
   */
  async fetchEmployees(companyId) {
    if (!this.coresignalApiKey || !companyId) {
      return [];
    }

    try {
      const fetch = require('node-fetch');
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v1/company/${companyId}/employees`,
        {
          method: 'POST',
          headers: {
            'apikey': this.coresignalApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            filters: { current_employee: true },
            limit: 200
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Employee fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data.employees || data || [];

    } catch (error) {
      this.log(`   ⚠️ Could not fetch employees: ${error.message}`);
      return [];
    }
  }

  /**
   * Run OBP analysis
   */
  async runOBPAnalysis(companyData, options = {}) {
    const { skipDialogue } = options;

    try {
      const { OBPPipeline } = require('./OBPPipeline');

      const pipeline = new OBPPipeline({
        productContext: this.productContext,
        verbose: false
      });

      // If skipping dialogue, we'll use a simplified version
      if (skipDialogue) {
        return await this.runSimplifiedOBP(companyData, pipeline);
      }

      return await pipeline.analyze(companyData);

    } catch (error) {
      // Return basic scoring on failure
      return {
        success: false,
        company: companyData.name || companyData.company_name,
        pullScore: this.calculateBasicScore(companyData),
        classification: { category: 'CONSIDERATION', description: 'Analysis incomplete' },
        error: error.message
      };
    }
  }

  /**
   * Run simplified OBP (skip dialogue for speed)
   */
  async runSimplifiedOBP(companyData, pipeline) {
    // Use the tension calculator and physics engine, but skip dialogue
    const { OrganizationalTensionCalculator } = require('./OrganizationalTensionCalculator');
    const { BehavioralPhysicsEngine } = require('./BehavioralPhysicsEngine');

    const tensionCalculator = new OrganizationalTensionCalculator({
      productContext: this.productContext
    });

    const physicsEngine = new BehavioralPhysicsEngine({
      productContext: this.productContext
    });

    // Calculate tensions
    const tensionAnalysis = await tensionCalculator.calculateTensions(companyData);

    // Model behavior
    const behaviorPredictions = await physicsEngine.predictBehavior(tensionAnalysis);

    // Return simplified result
    return {
      success: true,
      company: companyData.name || companyData.company_name,
      pullScore: tensionAnalysis.compositeTension,
      classification: tensionAnalysis.classification,
      champion: behaviorPredictions.champion?.identified ? {
        name: behaviorPredictions.champion.name,
        title: behaviorPredictions.champion.title,
        tenure: `${behaviorPredictions.champion.tenureDays} days`,
        windowRemaining: `${behaviorPredictions.champion.windowRemaining} days`,
        previousCompany: behaviorPredictions.champion.previousCompany
      } : null,
      tensions: {
        ratio: tensionAnalysis.tensions.ratio,
        leadership: tensionAnalysis.tensions.leadership,
        growth: tensionAnalysis.tensions.growth,
        resource: tensionAnalysis.tensions.resource,
        reporting: tensionAnalysis.tensions.reporting
      },
      predictions: {
        buyingProbability: Math.round(behaviorPredictions.buyingProbability * 100),
        actionWindow: behaviorPredictions.actionWindow
      },
      // No dialogue in simplified mode
      internalDialogue: null,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate basic score from profile data (fallback)
   */
  calculateBasicScore(company) {
    let score = 50;

    const growthRate = company.employees_count_change_yearly_percentage || 0;
    if (growthRate >= 30) score += 20;
    else if (growthRate >= 15) score += 10;

    const funding = company.last_funding_round_type?.toLowerCase() || '';
    if (funding.includes('series c') || funding.includes('series d')) score += 10;
    else if (funding.includes('series b')) score += 8;
    else if (funding.includes('series a')) score += 5;

    const fundingDate = company.last_funding_round_date;
    if (fundingDate) {
      const daysSince = Math.floor(
        (Date.now() - new Date(fundingDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 180) score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Stream results as they complete (for real-time UI updates)
   */
  async *streamProcess(companies, options = {}) {
    const { skipDialogue = false } = options;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const companyName = company.name || company.company_name;

      yield {
        type: 'progress',
        index: i,
        total: companies.length,
        company: companyName,
        status: 'processing'
      };

      try {
        const result = await this.processCompanyWithRetry(company, {
          skipDialogue,
          attempt: 1
        });

        yield {
          type: 'result',
          index: i,
          total: companies.length,
          company: companyName,
          status: 'complete',
          result
        };

      } catch (error) {
        yield {
          type: 'error',
          index: i,
          total: companies.length,
          company: companyName,
          status: 'failed',
          error: error.message
        };
      }

      // Small delay between companies
      if (i < companies.length - 1) {
        await this.delay(500);
      }
    }

    yield { type: 'complete' };
  }

  // =============================================================================
  // Utilities
  // =============================================================================

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { BatchOBPProcessor };
