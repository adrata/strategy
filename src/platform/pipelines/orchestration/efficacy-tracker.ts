/**
 * EFFICACY TRACKER
 * 
 * Comprehensive tracking system for measuring performance of each discovery
 * and verification method across the entire pipeline.
 */

export interface DiscoveryMetrics {
  // Person Discovery
  coresignalKeyExecutives: { success: number; fail: number; };
  coresignalCompanyCollect: { success: number; fail: number; };
  coresignalElasticsearch: { success: number; fail: number; };
  leadershipPageScraping: { success: number; fail: number; };
  perplexityAIResearch: { success: number; fail: number; };
  
  // Email Discovery
  coresignalProfiles: { success: number; fail: number; };
  lushaAPI: { success: number; fail: number; };
  emailPatternGeneration: { success: number; fail: number; };
  prospeoEmailFinder: { success: number; fail: number; };
  
  // Phone Discovery
  coresignalPhoneData: { success: number; fail: number; };
  lushaPhoneAPI: { success: number; fail: number; };
  peopleDataLabs: { success: number; fail: number; };
  prospeoMobileFinder: { success: number; fail: number; };
  
  // Verification Success Rates
  personIdentityVerification: {
    lusha: { success: number; fail: number; confidence: number[]; };
    perplexity: { success: number; fail: number; confidence: number[]; };
  };
  emailValidation: {
    zerobounce: { success: number; fail: number; confidence: number[]; };
    myemailverifier: { success: number; fail: number; confidence: number[]; };
    prospeo: { success: number; fail: number; confidence: number[]; };
  };
  phoneValidation: {
    lusha: { success: number; fail: number; confidence: number[]; };
    pdl: { success: number; fail: number; confidence: number[]; };
    twilio: { success: number; fail: number; confidence: number[]; };
    prospeo: { success: number; fail: number; confidence: number[]; };
  };
  
  // Employment Status
  currentEmployees: number;
  formerEmployees: number;
  
  // Per-Company Data
  companyBreakdown: CompanyEfficacyData[];
}

export interface CompanyEfficacyData {
  companyName: string;
  cfo: {
    found: boolean;
    source: string;
    tier: number;
    email: {
      found: boolean;
      source: string;
      confidence: number;
    };
    phone: {
      found: boolean;
      source: string;
      confidence: number;
    };
    employmentStatus: {
      isCurrent: boolean;
      confidence: number;
    };
  };
  cro: {
    found: boolean;
    source: string;
    tier: number;
    email: {
      found: boolean;
      source: string;
      confidence: number;
    };
    phone: {
      found: boolean;
      source: string;
      confidence: number;
    };
    employmentStatus: {
      isCurrent: boolean;
      confidence: number;
    };
  };
  processingTime: number;
  creditsUsed: number;
}

export class EfficacyTracker {
  private metrics: DiscoveryMetrics;
  private startTime: number;

  constructor() {
    this.metrics = {
      // Person Discovery
      coresignalKeyExecutives: { success: 0, fail: 0 },
      coresignalCompanyCollect: { success: 0, fail: 0 },
      coresignalElasticsearch: { success: 0, fail: 0 },
      leadershipPageScraping: { success: 0, fail: 0 },
      perplexityAIResearch: { success: 0, fail: 0 },
      
      // Email Discovery
      coresignalProfiles: { success: 0, fail: 0 },
      lushaAPI: { success: 0, fail: 0 },
      emailPatternGeneration: { success: 0, fail: 0 },
      prospeoEmailFinder: { success: 0, fail: 0 },
      
      // Phone Discovery
      coresignalPhoneData: { success: 0, fail: 0 },
      lushaPhoneAPI: { success: 0, fail: 0 },
      peopleDataLabs: { success: 0, fail: 0 },
      prospeoMobileFinder: { success: 0, fail: 0 },
      
      // Verification Success Rates
      personIdentityVerification: {
        lusha: { success: 0, fail: 0, confidence: [] },
        perplexity: { success: 0, fail: 0, confidence: [] }
      },
      emailValidation: {
        zerobounce: { success: 0, fail: 0, confidence: [] },
        myemailverifier: { success: 0, fail: 0, confidence: [] },
        prospeo: { success: 0, fail: 0, confidence: [] }
      },
      phoneValidation: {
        lusha: { success: 0, fail: 0, confidence: [] },
        pdl: { success: 0, fail: 0, confidence: [] },
        twilio: { success: 0, fail: 0, confidence: [] },
        prospeo: { success: 0, fail: 0, confidence: [] }
      },
      
      // Employment Status
      currentEmployees: 0,
      formerEmployees: 0,
      
      // Per-Company Data
      companyBreakdown: []
    };
    
    this.startTime = Date.now();
  }

  // Person Discovery Tracking
  trackPersonDiscovery(method: string, success: boolean, companyName?: string) {
    switch (method) {
      case 'coresignal-keyexecutives':
        if (success) this.metrics.coresignalKeyExecutives.success++;
        else this.metrics.coresignalKeyExecutives.fail++;
        break;
      case 'coresignal-companycollect':
        if (success) this.metrics.coresignalCompanyCollect.success++;
        else this.metrics.coresignalCompanyCollect.fail++;
        break;
      case 'coresignal-elasticsearch':
        if (success) this.metrics.coresignalElasticsearch.success++;
        else this.metrics.coresignalElasticsearch.fail++;
        break;
      case 'leadership-scraping':
        if (success) this.metrics.leadershipPageScraping.success++;
        else this.metrics.leadershipPageScraping.fail++;
        break;
      case 'perplexity-ai':
        if (success) this.metrics.perplexityAIResearch.success++;
        else this.metrics.perplexityAIResearch.fail++;
        break;
    }
  }

  // Email Discovery Tracking
  trackEmailDiscovery(method: string, success: boolean, confidence?: number) {
    switch (method) {
      case 'coresignal-profiles':
        if (success) this.metrics.coresignalProfiles.success++;
        else this.metrics.coresignalProfiles.fail++;
        break;
      case 'lusha-api':
        if (success) this.metrics.lushaAPI.success++;
        else this.metrics.lushaAPI.fail++;
        break;
      case 'pattern-generation':
        if (success) this.metrics.emailPatternGeneration.success++;
        else this.metrics.emailPatternGeneration.fail++;
        break;
      case 'prospeo-email':
        if (success) this.metrics.prospeoEmailFinder.success++;
        else this.metrics.prospeoEmailFinder.fail++;
        break;
    }
  }

  // Phone Discovery Tracking
  trackPhoneDiscovery(method: string, success: boolean, confidence?: number) {
    switch (method) {
      case 'coresignal-profiles':
        if (success) this.metrics.coresignalPhoneData.success++;
        else this.metrics.coresignalPhoneData.fail++;
        break;
      case 'lusha-api':
        if (success) this.metrics.lushaPhoneAPI.success++;
        else this.metrics.lushaPhoneAPI.fail++;
        break;
      case 'people-data-labs':
        if (success) this.metrics.peopleDataLabs.success++;
        else this.metrics.peopleDataLabs.fail++;
        break;
      case 'prospeo-mobile':
        if (success) this.metrics.prospeoMobileFinder.success++;
        else this.metrics.prospeoMobileFinder.fail++;
        break;
    }
  }

  // Verification Tracking
  trackPersonVerification(source: 'lusha' | 'perplexity', success: boolean, confidence: number) {
    if (success) {
      this.metrics.personIdentityVerification[source].success++;
    } else {
      this.metrics.personIdentityVerification[source].fail++;
    }
    this.metrics.personIdentityVerification[source].confidence.push(confidence);
  }

  trackEmailValidation(source: 'zerobounce' | 'myemailverifier' | 'prospeo', success: boolean, confidence: number) {
    if (success) {
      this.metrics.emailValidation[source].success++;
    } else {
      this.metrics.emailValidation[source].fail++;
    }
    this.metrics.emailValidation[source].confidence.push(confidence);
  }

  trackPhoneValidation(source: 'lusha' | 'pdl' | 'twilio' | 'prospeo', success: boolean, confidence: number) {
    if (success) {
      this.metrics.phoneValidation[source].success++;
    } else {
      this.metrics.phoneValidation[source].fail++;
    }
    this.metrics.phoneValidation[source].confidence.push(confidence);
  }

  // Employment Status Tracking
  trackEmploymentStatus(isCurrent: boolean) {
    if (isCurrent) {
      this.metrics.currentEmployees++;
    } else {
      this.metrics.formerEmployees++;
    }
  }

  // Per-Company Data
  addCompanyData(data: CompanyEfficacyData) {
    this.metrics.companyBreakdown.push(data);
  }

  // Get Current Metrics
  getMetrics(): DiscoveryMetrics {
    return { ...this.metrics };
  }

  // Generate Summary Report
  generateSummaryReport(): string {
    const totalCompanies = this.metrics.companyBreakdown.length;
    const totalCFOs = this.metrics.companyBreakdown.filter(c => c.cfo.found).length;
    const totalCROs = this.metrics.companyBreakdown.filter(c => c.cro.found).length;
    
    let report = `\nEFFICACY REPORT - ${totalCompanies} Companies Processed\n`;
    report += '='.repeat(50) + '\n\n';
    
    // Person Discovery Summary
    report += 'PERSON DISCOVERY:\n';
    report += `- CoreSignal Key Executives: ${this.metrics.coresignalKeyExecutives.success}/${totalCompanies} (${Math.round((this.metrics.coresignalKeyExecutives.success / totalCompanies) * 100)}%)\n`;
    report += `- CoreSignal Elasticsearch: ${this.metrics.coresignalElasticsearch.success}/${totalCompanies} (${Math.round((this.metrics.coresignalElasticsearch.success / totalCompanies) * 100)}%)\n`;
    report += `- Leadership Page Scraping: ${this.metrics.leadershipPageScraping.success}/${totalCompanies} (${Math.round((this.metrics.leadershipPageScraping.success / totalCompanies) * 100)}%)\n`;
    report += `- Total Found: ${totalCFOs + totalCROs}/${totalCompanies * 2} (${Math.round(((totalCFOs + totalCROs) / (totalCompanies * 2)) * 100)}%)\n\n`;
    
    // Email Discovery Summary
    const totalEmails = this.metrics.companyBreakdown.filter(c => c.cfo.email.found || c.cro.email.found).length;
    report += 'EMAIL DISCOVERY:\n';
    report += `- CoreSignal Profiles: ${this.metrics.coresignalProfiles.success}/${totalCompanies} (${Math.round((this.metrics.coresignalProfiles.success / totalCompanies) * 100)}%)\n`;
    report += `- Lusha API: ${this.metrics.lushaAPI.success}/${totalCompanies} (${Math.round((this.metrics.lushaAPI.success / totalCompanies) * 100)}%)\n`;
    report += `- Pattern Generation: ${this.metrics.emailPatternGeneration.success}/${totalCompanies} (${Math.round((this.metrics.emailPatternGeneration.success / totalCompanies) * 100)}%)\n`;
    report += `- Prospeo Email Finder: ${this.metrics.prospeoEmailFinder.success}/${totalCompanies} (${Math.round((this.metrics.prospeoEmailFinder.success / totalCompanies) * 100)}%)\n`;
    report += `- Total Found: ${totalEmails}/${totalCompanies} (${Math.round((totalEmails / totalCompanies) * 100)}%)\n\n`;
    
    // Phone Discovery Summary
    const totalPhones = this.metrics.companyBreakdown.filter(c => c.cfo.phone.found || c.cro.phone.found).length;
    report += 'PHONE DISCOVERY:\n';
    report += `- CoreSignal Profiles: ${this.metrics.coresignalPhoneData.success}/${totalCompanies} (${Math.round((this.metrics.coresignalPhoneData.success / totalCompanies) * 100)}%)\n`;
    report += `- Lusha API: ${this.metrics.lushaPhoneAPI.success}/${totalCompanies} (${Math.round((this.metrics.lushaPhoneAPI.success / totalCompanies) * 100)}%)\n`;
    report += `- People Data Labs: ${this.metrics.peopleDataLabs.success}/${totalCompanies} (${Math.round((this.metrics.peopleDataLabs.success / totalCompanies) * 100)}%)\n`;
    report += `- Prospeo Mobile: ${this.metrics.prospeoMobileFinder.success}/${totalCompanies} (${Math.round((this.metrics.prospeoMobileFinder.success / totalCompanies) * 100)}%)\n`;
    report += `- Total Found: ${totalPhones}/${totalCompanies} (${Math.round((totalPhones / totalCompanies) * 100)}%)\n\n`;
    
    // Employment Status
    report += 'EMPLOYMENT STATUS:\n';
    report += `- Current Employees: ${this.metrics.currentEmployees}\n`;
    report += `- Former Employees: ${this.metrics.formerEmployees}\n\n`;
    
    // Per-Company Breakdown
    report += 'PER-COMPANY BREAKDOWN:\n';
    this.metrics.companyBreakdown.forEach((company, index) => {
      report += `${index + 1}. ${company.companyName}\n`;
      if (company.cfo.found) {
        report += `   - CFO: ${company.cfo.source} (Tier ${company.cfo.tier})\n`;
        report += `   - Email: ${company.cfo.email.found ? company.cfo.email.source : 'Not found'}\n`;
        report += `   - Phone: ${company.cfo.phone.found ? company.cfo.phone.source : 'Not found'}\n`;
      } else {
        report += `   - CFO: Not found\n`;
      }
      if (company.cro.found) {
        report += `   - CRO: ${company.cro.source} (Tier ${company.cro.tier})\n`;
        report += `   - Email: ${company.cro.email.found ? company.cro.email.source : 'Not found'}\n`;
        report += `   - Phone: ${company.cro.phone.found ? company.cro.phone.source : 'Not found'}\n`;
      } else {
        report += `   - CRO: Not found\n`;
      }
      report += '\n';
    });
    
    return report;
  }

  // Get Processing Time
  getProcessingTime(): number {
    return Date.now() - this.startTime;
  }
}
