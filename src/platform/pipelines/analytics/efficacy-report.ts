/**
 * EFFICACY REPORT GENERATOR
 * 
 * Generates comprehensive reports from efficacy tracking data
 */

import { DiscoveryMetrics, CompanyEfficacyData } from '../orchestration/efficacy-tracker';
import * as fs from 'fs';
import * as path from 'path';

export interface EfficacyReport {
  summary: {
    totalCompanies: number;
    totalCFOs: number;
    totalCROs: number;
    totalEmails: number;
    totalPhones: number;
    processingTime: number;
    creditsUsed: number;
  };
  discoveryRates: {
    personDiscovery: {
      coresignalKeyExecutives: number;
      coresignalElasticsearch: number;
      leadershipScraping: number;
      overall: number;
    };
    emailDiscovery: {
      coresignalProfiles: number;
      lushaAPI: number;
      patternGeneration: number;
      prospeoEmail: number;
      overall: number;
    };
    phoneDiscovery: {
      coresignalProfiles: number;
      lushaAPI: number;
      peopleDataLabs: number;
      prospeoMobile: number;
      overall: number;
    };
  };
  verificationRates: {
    personIdentity: {
      lusha: number;
      perplexity: number;
    };
    emailValidation: {
      zerobounce: number;
      myemailverifier: number;
      prospeo: number;
    };
    phoneValidation: {
      lusha: number;
      pdl: number;
      twilio: number;
      prospeo: number;
    };
  };
  employmentStatus: {
    currentEmployees: number;
    formerEmployees: number;
    currentEmployeeRate: number;
  };
  apiPerformance: {
    ranking: Array<{
      api: string;
      successRate: number;
      averageConfidence: number;
      totalCalls: number;
    }>;
  };
  companyBreakdown: CompanyEfficacyData[];
}

export class EfficacyReportGenerator {
  private metrics: DiscoveryMetrics;

  constructor(metrics: DiscoveryMetrics) {
    this.metrics = metrics;
  }

  generateReport(): EfficacyReport {
    const totalCompanies = this.metrics.companyBreakdown.length;
    const totalCFOs = this.metrics.companyBreakdown.filter(c => c.cfo.found).length;
    const totalCROs = this.metrics.companyBreakdown.filter(c => c.cro.found).length;
    const totalEmails = this.metrics.companyBreakdown.filter(c => c.cfo.email.found || c.cro.email.found).length;
    const totalPhones = this.metrics.companyBreakdown.filter(c => c.cfo.phone.found || c.cro.phone.found).length;
    const totalCreditsUsed = this.metrics.companyBreakdown.reduce((sum, c) => sum + c.creditsUsed, 0);

    return {
      summary: {
        totalCompanies,
        totalCFOs,
        totalCROs,
        totalEmails,
        totalPhones,
        processingTime: 0, // Will be set by caller
        creditsUsed: totalCreditsUsed
      },
      discoveryRates: {
        personDiscovery: {
          coresignalKeyExecutives: this.calculateRate(this.metrics.coresignalKeyExecutives.success, totalCompanies),
          coresignalElasticsearch: this.calculateRate(this.metrics.coresignalElasticsearch.success, totalCompanies),
          leadershipScraping: this.calculateRate(this.metrics.leadershipPageScraping.success, totalCompanies),
          overall: this.calculateRate(totalCFOs + totalCROs, totalCompanies * 2)
        },
        emailDiscovery: {
          coresignalProfiles: this.calculateRate(this.metrics.coresignalProfiles.success, totalCompanies),
          lushaAPI: this.calculateRate(this.metrics.lushaAPI.success, totalCompanies),
          patternGeneration: this.calculateRate(this.metrics.emailPatternGeneration.success, totalCompanies),
          prospeoEmail: this.calculateRate(this.metrics.prospeoEmailFinder.success, totalCompanies),
          overall: this.calculateRate(totalEmails, totalCompanies)
        },
        phoneDiscovery: {
          coresignalProfiles: this.calculateRate(this.metrics.coresignalPhoneData.success, totalCompanies),
          lushaAPI: this.calculateRate(this.metrics.lushaPhoneAPI.success, totalCompanies),
          peopleDataLabs: this.calculateRate(this.metrics.peopleDataLabs.success, totalCompanies),
          prospeoMobile: this.calculateRate(this.metrics.prospeoMobileFinder.success, totalCompanies),
          overall: this.calculateRate(totalPhones, totalCompanies)
        }
      },
      verificationRates: {
        personIdentity: {
          lusha: this.calculateVerificationRate(this.metrics.personIdentityVerification.lusha),
          perplexity: this.calculateVerificationRate(this.metrics.personIdentityVerification.perplexity)
        },
        emailValidation: {
          zerobounce: this.calculateVerificationRate(this.metrics.emailValidation.zerobounce),
          myemailverifier: this.calculateVerificationRate(this.metrics.emailValidation.myemailverifier),
          prospeo: this.calculateVerificationRate(this.metrics.emailValidation.prospeo)
        },
        phoneValidation: {
          lusha: this.calculateVerificationRate(this.metrics.phoneValidation.lusha),
          pdl: this.calculateVerificationRate(this.metrics.phoneValidation.pdl),
          twilio: this.calculateVerificationRate(this.metrics.phoneValidation.twilio),
          prospeo: this.calculateVerificationRate(this.metrics.phoneValidation.prospeo)
        }
      },
      employmentStatus: {
        currentEmployees: this.metrics.currentEmployees,
        formerEmployees: this.metrics.formerEmployees,
        currentEmployeeRate: this.calculateRate(this.metrics.currentEmployees, this.metrics.currentEmployees + this.metrics.formerEmployees)
      },
      apiPerformance: {
        ranking: this.generateAPIRanking()
      },
      companyBreakdown: this.metrics.companyBreakdown
    };
  }

  private calculateRate(success: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((success / total) * 100);
  }

  private calculateVerificationRate(verification: { success: number; fail: number; confidence: number[] }): number {
    const total = verification.success + verification.fail;
    return this.calculateRate(verification.success, total);
  }

  private generateAPIRanking(): Array<{ api: string; successRate: number; averageConfidence: number; totalCalls: number }> {
    const apis = [
      {
        api: 'CoreSignal Key Executives',
        successRate: this.calculateRate(this.metrics.coresignalKeyExecutives.success, this.metrics.coresignalKeyExecutives.success + this.metrics.coresignalKeyExecutives.fail),
        averageConfidence: 0, // CoreSignal doesn't provide confidence scores
        totalCalls: this.metrics.coresignalKeyExecutives.success + this.metrics.coresignalKeyExecutives.fail
      },
      {
        api: 'Lusha API',
        successRate: this.calculateRate(this.metrics.lushaAPI.success, this.metrics.lushaAPI.success + this.metrics.lushaAPI.fail),
        averageConfidence: this.calculateAverageConfidence(this.metrics.personIdentityVerification.lusha.confidence),
        totalCalls: this.metrics.lushaAPI.success + this.metrics.lushaAPI.fail
      },
      {
        api: 'Perplexity AI',
        successRate: this.calculateRate(this.metrics.perplexityAIResearch.success, this.metrics.perplexityAIResearch.success + this.metrics.perplexityAIResearch.fail),
        averageConfidence: this.calculateAverageConfidence(this.metrics.personIdentityVerification.perplexity.confidence),
        totalCalls: this.metrics.perplexityAIResearch.success + this.metrics.perplexityAIResearch.fail
      },
      {
        api: 'Prospeo Email',
        successRate: this.calculateRate(this.metrics.prospeoEmailFinder.success, this.metrics.prospeoEmailFinder.success + this.metrics.prospeoEmailFinder.fail),
        averageConfidence: this.calculateAverageConfidence(this.metrics.emailValidation.prospeo.confidence),
        totalCalls: this.metrics.prospeoEmailFinder.success + this.metrics.prospeoEmailFinder.fail
      },
      {
        api: 'ZeroBounce',
        successRate: this.calculateRate(this.metrics.emailValidation.zerobounce.success, this.metrics.emailValidation.zerobounce.success + this.metrics.emailValidation.zerobounce.fail),
        averageConfidence: this.calculateAverageConfidence(this.metrics.emailValidation.zerobounce.confidence),
        totalCalls: this.metrics.emailValidation.zerobounce.success + this.metrics.emailValidation.zerobounce.fail
      }
    ];

    return apis
      .filter(api => api.totalCalls > 0)
      .sort((a, b) => b.successRate - a.successRate);
  }

  private calculateAverageConfidence(confidences: number[]): number {
    if (confidences.length === 0) return 0;
    return Math.round(confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length);
  }

  // Generate Console Report
  generateConsoleReport(): string {
    const report = this.generateReport();
    
    let output = `\n📊 EFFICACY REPORT - ${report.summary.totalCompanies} Companies Processed\n`;
    output += '='.repeat(60) + '\n\n';
    
    // Summary
    output += '📈 SUMMARY:\n';
    output += `   Companies: ${report.summary.totalCompanies}\n`;
    output += `   CFOs Found: ${report.summary.totalCFOs} (${Math.round((report.summary.totalCFOs / report.summary.totalCompanies) * 100)}%)\n`;
    output += `   CROs Found: ${report.summary.totalCROs} (${Math.round((report.summary.totalCROs / report.summary.totalCompanies) * 100)}%)\n`;
    output += `   Emails Found: ${report.summary.totalEmails} (${Math.round((report.summary.totalEmails / report.summary.totalCompanies) * 100)}%)\n`;
    output += `   Phones Found: ${report.summary.totalPhones} (${Math.round((report.summary.totalPhones / report.summary.totalCompanies) * 100)}%)\n`;
    output += `   Credits Used: ${report.summary.creditsUsed}\n\n`;
    
    // Discovery Rates
    output += '🔍 DISCOVERY RATES:\n';
    output += `   Person Discovery: ${report.discoveryRates.personDiscovery.overall}%\n`;
    output += `     - CoreSignal Key Exec: ${report.discoveryRates.personDiscovery.coresignalKeyExecutives}%\n`;
    output += `     - CoreSignal Elasticsearch: ${report.discoveryRates.personDiscovery.coresignalElasticsearch}%\n`;
    output += `     - Leadership Scraping: ${report.discoveryRates.personDiscovery.leadershipScraping}%\n\n`;
    
    output += `   Email Discovery: ${report.discoveryRates.emailDiscovery.overall}%\n`;
    output += `     - CoreSignal Profiles: ${report.discoveryRates.emailDiscovery.coresignalProfiles}%\n`;
    output += `     - Lusha API: ${report.discoveryRates.emailDiscovery.lushaAPI}%\n`;
    output += `     - Pattern Generation: ${report.discoveryRates.emailDiscovery.patternGeneration}%\n`;
    output += `     - Prospeo Email: ${report.discoveryRates.emailDiscovery.prospeoEmail}%\n\n`;
    
    output += `   Phone Discovery: ${report.discoveryRates.phoneDiscovery.overall}%\n`;
    output += `     - CoreSignal Profiles: ${report.discoveryRates.phoneDiscovery.coresignalProfiles}%\n`;
    output += `     - Lusha API: ${report.discoveryRates.phoneDiscovery.lushaAPI}%\n`;
    output += `     - People Data Labs: ${report.discoveryRates.phoneDiscovery.peopleDataLabs}%\n`;
    output += `     - Prospeo Mobile: ${report.discoveryRates.phoneDiscovery.prospeoMobile}%\n\n`;
    
    // API Performance Ranking
    output += '🏆 API PERFORMANCE RANKING:\n';
    report.apiPerformance.ranking.forEach((api, index) => {
      output += `   ${index + 1}. ${api.api}: ${api.successRate}% (${api.averageConfidence}% avg confidence, ${api.totalCalls} calls)\n`;
    });
    output += '\n';
    
    // Employment Status
    output += '👥 EMPLOYMENT STATUS:\n';
    output += `   Current Employees: ${report.employmentStatus.currentEmployees}\n`;
    output += `   Former Employees: ${report.employmentStatus.formerEmployees}\n`;
    output += `   Current Rate: ${report.employmentStatus.currentEmployeeRate}%\n\n`;
    
    return output;
  }

  // Save JSON Report
  async saveJSONReport(filePath: string, processingTime: number): Promise<void> {
    const report = this.generateReport();
    report.summary.processingTime = processingTime;
    
    const outputDir = path.dirname(filePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
  }

  // Save CSV Report
  async saveCSVReport(filePath: string): Promise<void> {
    const report = this.generateReport();
    
    const outputDir = path.dirname(filePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create CSV headers
    const headers = [
      'Company Name',
      'CFO Found',
      'CFO Source',
      'CFO Tier',
      'CFO Email Found',
      'CFO Email Source',
      'CFO Email Confidence',
      'CFO Phone Found',
      'CFO Phone Source',
      'CFO Phone Confidence',
      'CFO Employment Status',
      'CRO Found',
      'CRO Source',
      'CRO Tier',
      'CRO Email Found',
      'CRO Email Source',
      'CRO Email Confidence',
      'CRO Phone Found',
      'CRO Phone Source',
      'CRO Phone Confidence',
      'CRO Employment Status',
      'Processing Time (ms)',
      'Credits Used'
    ];
    
    // Create CSV rows
    const rows = report.companyBreakdown.map(company => [
      company.companyName,
      company.cfo.found,
      company.cfo.source,
      company.cfo.tier,
      company.cfo.email.found,
      company.cfo.email.source,
      company.cfo.email.confidence,
      company.cfo.phone.found,
      company.cfo.phone.source,
      company.cfo.phone.confidence,
      company.cfo.employmentStatus.isCurrent,
      company.cro.found,
      company.cro.source,
      company.cro.tier,
      company.cro.email.found,
      company.cro.email.source,
      company.cro.email.confidence,
      company.cro.phone.found,
      company.cro.phone.source,
      company.cro.phone.confidence,
      company.cro.employmentStatus.isCurrent,
      company.processingTime,
      company.creditsUsed
    ]);
    
    // Write CSV
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    fs.writeFileSync(filePath, csvContent, 'utf8');
  }
}
