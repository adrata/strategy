/**
 * 🏢 BULK COMPANY PROCESSOR
 * 
 * Main service for processing multiple companies through the complete intelligence pipeline
 * with confidence scoring and database integration
 */

import { CompanyAnalyzer } from './company-analyzer';
import { DatabaseService } from './database-service';
import { 
  CompanyInput, 
  ProcessingOptions, 
  ProcessingResult, 
  CompanyAnalysisResult,
  ProcessingError 
} from './types';

export class BulkCompanyProcessor {
  private companyAnalyzer: CompanyAnalyzer;
  private databaseService: DatabaseService;
  
  constructor() {
    this.companyAnalyzer = new CompanyAnalyzer();
    this.databaseService = new DatabaseService();
  }
  
  /**
   * 🚀 PROCESS MULTIPLE COMPANIES
   * 
   * Main entry point for bulk company processing
   */
  async processCompanies(
    companies: CompanyInput[],
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const results: CompanyAnalysisResult[] = [];
    const errors: ProcessingError[] = [];
    
    console.log(`\n🏢 BULK COMPANY PROCESSOR STARTING`);
    console.log(`📊 Processing ${companies.length} companies`);
    console.log(`⚙️ Options:`, options);
    console.log('=' .repeat(60));
    
    // Process each company
    for (const [index, company] of companies.entries()) {
      console.log(`\n🏢 Processing company ${index + 1}/${companies.length}: ${company.name || company.domain}`);
      
      try {
        // Process single company through 4-step pipeline
        const result = await this.companyAnalyzer.processSingleCompany(company, options);
        results.push(result);
        
        // Save to database
        const saveResult = await this.databaseService.saveCompanyAnalysis(result);
        if (!saveResult.success) {
          console.warn(`⚠️ Database save warning for ${company.name}: ${saveResult.error}`);
        }
        
        console.log(`✅ Company ${company.name || company.domain} processed with ${result.overallConfidence}% confidence`);
        
      } catch (error) {
        console.error(`❌ Error processing ${company.name || company.domain}:`, error);
        
        errors.push({
          company,
          error: error instanceof Error ? error.message : 'Unknown error',
          step: 'processing',
          timestamp: new Date()
        });
      }
    }
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Calculate statistics
    const averageConfidence = this.calculateAverageConfidence(results);
    const confidenceDistribution = this.calculateConfidenceDistribution(results);
    
    console.log(`\n📊 BULK PROCESSING COMPLETE`);
    console.log(`⏱️ Total time: ${processingTime}ms`);
    console.log(`📈 Average confidence: ${averageConfidence.toFixed(1)}%`);
    console.log(`🎯 High confidence (90%+): ${confidenceDistribution.high} companies`);
    console.log(`📊 Medium confidence (70-89%): ${confidenceDistribution.medium} companies`);
    console.log(`⚠️ Low confidence (<70%): ${confidenceDistribution.low + confidenceDistribution.veryLow} companies`);
    
    return {
      totalProcessed: results.length,
      processingTimeMs: processingTime,
      averageConfidence,
      confidenceDistribution,
      results,
      errors
    };
  }
  
  /**
   * 📊 CALCULATE AVERAGE CONFIDENCE
   */
  private calculateAverageConfidence(results: CompanyAnalysisResult[]): number {
    if (results.length === 0) return 0;
    
    const totalConfidence = results.reduce((sum, result) => sum + result.overallConfidence, 0);
    return totalConfidence / results.length;
  }
  
  /**
   * 📈 CALCULATE CONFIDENCE DISTRIBUTION
   */
  private calculateConfidenceDistribution(results: CompanyAnalysisResult[]): {
    high: number;
    medium: number;
    low: number;
    veryLow: number;
  } {
    const distribution = {
      high: 0,    // 90-100%
      medium: 0,  // 70-89%
      low: 0,     // 50-69%
      veryLow: 0  // <50%
    };
    
    for (const result of results) {
      if (result.overallConfidence >= 90) {
        distribution.high++;
      } else if (result.overallConfidence >= 70) {
        distribution.medium++;
      } else if (result.overallConfidence >= 50) {
        distribution.low++;
      } else {
        distribution.veryLow++;
      }
    }
    
    return distribution;
  }
  
  /**
   * 🔄 RETRY LOW CONFIDENCE COMPANIES
   * 
   * Re-process companies with low confidence scores
   */
  async retryLowConfidenceCompanies(
    results: CompanyAnalysisResult[],
    threshold: number = 70,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const lowConfidenceResults = results.filter(result => result.overallConfidence < threshold);
    
    if (lowConfidenceResults.length === 0) {
      console.log('✅ No low confidence companies to retry');
      return {
        totalProcessed: 0,
        processingTimeMs: 0,
        averageConfidence: 0,
        confidenceDistribution: { high: 0, medium: 0, low: 0, veryLow: 0 },
        results: [],
        errors: []
      };
    }
    
    console.log(`🔄 Retrying ${lowConfidenceResults.length} low confidence companies`);
    
    const companiesToRetry = lowConfidenceResults.map(result => ({
      name: result.company.name,
      domain: result.company.domain,
      website: result.company.website
    }));
    
    return this.processCompanies(companiesToRetry, {
      ...options,
      maxRetries: (options.maxRetries || 1) + 1
    });
  }
  
  /**
   * 📋 GET PROCESSING SUMMARY
   */
  getProcessingSummary(result: ProcessingResult): string {
    const { totalProcessed, averageConfidence, confidenceDistribution } = result;
    
    return `
📊 BULK PROCESSING SUMMARY
========================
Total Companies: ${totalProcessed}
Average Confidence: ${averageConfidence.toFixed(1)}%
High Confidence (90%+): ${confidenceDistribution.high}
Medium Confidence (70-89%): ${confidenceDistribution.medium}
Low Confidence (50-69%): ${confidenceDistribution.low}
Very Low Confidence (<50%): ${confidenceDistribution.veryLow}
Processing Time: ${result.processingTimeMs}ms
    `.trim();
  }
}
