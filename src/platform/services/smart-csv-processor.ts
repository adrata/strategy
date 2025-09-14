/**
 * 🎯 SMART CSV PROCESSOR
 * 
 * Handles intelligent processing of CSV data with:
 * - Natural language parsing for user intent
 * - Smart company prioritization and sampling
 * - Configurable limits and filtering
 * - Role-based enrichment strategies
 */

import { NaturalLanguageParser, type ParsedRequest, type CompanyPrioritizationCriteria } from './natural-language-parser';

export interface CSVProcessingConfig {
  userIntent?: string;
  processingLimit?: number;
  prioritizationMethod?: string;
  roles?: string[];
  outputFormat?: 'csv' | 'excel' | 'json';
  enrichmentType?: 'people' | 'companies' | 'mixed';
}

export interface ProcessedCSVData {
  originalData: any[];
  processedData: any[];
  skippedData: any[];
  processingPlan: {
    totalRecords: number;
    recordsToProcess: number;
    recordsSkipped: number;
    prioritizationMethod: string;
    estimatedCredits: number;
    estimatedTime: string;
  };
  parsedRequest?: ParsedRequest;
}

export interface CompanyData {
  name: string;
  website?: string;
  industry?: string;
  employees?: number;
  revenue?: number;
  location?: string;
  originalIndex: number;
  [key: string]: any;
}

export class SmartCSVProcessor {
  
  /**
   * Main processing method - applies smart filtering and prioritization
   */
  static async processCSVData(
    csvData: string,
    headers: string[],
    data: any[],
    config: CSVProcessingConfig = {}
  ): Promise<ProcessedCSVData> {
    
    console.log('🎯 Smart CSV Processing Started');
    console.log(`📊 Input: ${data.length} records`);
    console.log(`🎯 Config:`, config);

    // Parse natural language intent if provided
    let parsedRequest: ParsedRequest | undefined;
    if (config.userIntent) {
      parsedRequest = NaturalLanguageParser.parseRequest(config.userIntent);
      console.log('🧠 Parsed Intent:', parsedRequest);
      
      // Override config with parsed values if they exist
      if (parsedRequest['limit'] && !config.processingLimit) {
        config['processingLimit'] = parsedRequest.limit;
      }
      if (parsedRequest['prioritization'] && !config.prioritizationMethod) {
        config['prioritizationMethod'] = parsedRequest.prioritization;
      }
      if (parsedRequest['roles'] && parsedRequest.roles.length > 0) {
        config['roles'] = parsedRequest.roles;
      }
    }

    // Convert raw data to structured company data
    const companies = this.parseCompanyData(data, headers);
    console.log(`🏢 Parsed ${companies.length} companies`);

    // Apply smart prioritization
    const prioritizationCriteria = NaturalLanguageParser.generatePrioritizationCriteria(
      config.prioritizationMethod as any,
      config.processingLimit
    );

    const prioritizedCompanies = NaturalLanguageParser.prioritizeCompanies(
      companies,
      prioritizationCriteria,
      config.processingLimit
    );

    console.log(`✅ Selected ${prioritizedCompanies.length} companies for processing`);

    // Calculate processing estimates
    const processingPlan = this.calculateProcessingPlan(
      companies.length,
      prioritizedCompanies.length,
      config
    );

    // Separate processed vs skipped data
    const processedIndices = new Set(prioritizedCompanies.map(c => c.originalIndex));
    const processedData = data.filter((_, index) => processedIndices.has(index));
    const skippedData = data.filter((_, index) => !processedIndices.has(index));

    return {
      originalData: data,
      processedData,
      skippedData,
      processingPlan,
      parsedRequest
    };
  }

  /**
   * Parse raw CSV data into structured company objects
   */
  private static parseCompanyData(data: any[], headers: string[]): CompanyData[] {
    return data.map((row, index) => {
      const company: CompanyData = {
        name: '',
        originalIndex: index
      };

      // Map common column variations to standard fields
      const columnMappings = {
        name: ['company', 'company_name', 'companyname', 'organization', 'business', 'firm'],
        website: ['website', 'domain', 'url', 'web', 'site'],
        industry: ['industry', 'sector', 'vertical', 'business_type', 'category'],
        employees: ['employees', 'employee_count', 'headcount', 'staff', 'workforce', 'team_size'],
        revenue: ['revenue', 'annual_revenue', 'sales', 'turnover', 'income'],
        location: ['location', 'city', 'address', 'headquarters', 'hq', 'country', 'region']
      };

      // Extract data based on column mappings
      for (const [field, variations] of Object.entries(columnMappings)) {
        for (const variation of variations) {
          const headerIndex = headers.findIndex(h => 
            h.toLowerCase().includes(variation.toLowerCase())
          );
          
          if (headerIndex !== -1 && row[headerIndex]) {
            let value = row[headerIndex];
            
            // Special processing for numeric fields
            if (field === 'employees' || field === 'revenue') {
              value = this.parseNumericValue(value);
            }
            
            company[field as keyof CompanyData] = value;
            break;
          }
        }
      }

      // If no company name found, use first non-empty cell
      if (!company.name) {
        company['name'] = row.find((cell: any) => cell && cell.toString().trim()) || `Company ${index + 1}`;
      }

      // Copy all original data
      headers.forEach((header, i) => {
        if (row[i] !== undefined) {
          company[header] = row[i];
        }
      });

      return company;
    });
  }

  /**
   * Parse numeric values from various formats
   */
  private static parseNumericValue(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    const str = value.toString().replace(/[,$\s]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Calculate processing estimates and costs
   */
  private static calculateProcessingPlan(
    totalRecords: number,
    recordsToProcess: number,
    config: CSVProcessingConfig
  ) {
    const recordsSkipped = totalRecords - recordsToProcess;
    
    // Estimate credits based on enrichment type
    let creditsPerRecord = 1; // Base CoreSignal credit
    if (config['roles'] && config.roles.length > 0) {
      creditsPerRecord += config.roles.length * 0.5; // Additional for role searches
    }
    if (config['enrichmentType'] === 'people') {
      creditsPerRecord += 1; // Additional for person enrichment
    }
    
    const estimatedCredits = Math.ceil(recordsToProcess * creditsPerRecord);
    
    // Estimate processing time (rough calculation)
    const secondsPerRecord = 2; // Average processing time
    const totalSeconds = recordsToProcess * secondsPerRecord;
    const estimatedTime = this.formatDuration(totalSeconds);

    return {
      totalRecords,
      recordsToProcess,
      recordsSkipped,
      prioritizationMethod: config.prioritizationMethod || 'first',
      estimatedCredits,
      estimatedTime
    };
  }

  /**
   * Format duration in human-readable format
   */
  private static formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`;
  }

  /**
   * Generate processing summary for user confirmation
   */
  static generateProcessingSummary(processed: ProcessedCSVData): string {
    const { processingPlan, parsedRequest } = processed;
    
    let summary = `📊 Processing Summary:\n`;
    summary += `• Total companies: ${processingPlan.totalRecords}\n`;
    summary += `• Will process: ${processingPlan.recordsToProcess}\n`;
    summary += `• Will skip: ${processingPlan.recordsSkipped}\n`;
    summary += `• Method: ${processingPlan.prioritizationMethod}\n`;
    summary += `• Estimated credits: ${processingPlan.estimatedCredits}\n`;
    summary += `• Estimated time: ${processingPlan.estimatedTime}\n`;
    
    if (parsedRequest) {
      summary += `\n🧠 Understood from your request:\n`;
      if (parsedRequest.limit) summary += `• Limit: ${parsedRequest.limit} companies\n`;
      if (parsedRequest.roles?.length) summary += `• Roles: ${parsedRequest.roles.join(', ')}\n`;
      if (parsedRequest.prioritization) summary += `• Priority: ${parsedRequest.prioritization}\n`;
      summary += `• Confidence: ${Math.round(parsedRequest.confidence * 100)}%\n`;
    }
    
    return summary;
  }

  /**
   * Validate processing configuration
   */
  static validateConfig(config: CSVProcessingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (config['processingLimit'] && (config.processingLimit < 1 || config.processingLimit > 10000)) {
      errors.push('Processing limit must be between 1 and 10,000');
    }
    
    if (config['roles'] && config.roles.length > 10) {
      errors.push('Maximum 10 roles can be specified');
    }
    
    return {
      valid: errors['length'] === 0,
      errors
    };
  }

  /**
   * Apply role-based filtering to companies
   */
  static filterCompaniesByRoles(companies: CompanyData[], roles: string[]): CompanyData[] {
    if (!roles || roles['length'] === 0) return companies;
    
    // For now, return all companies - role filtering happens during enrichment
    // In the future, we could pre-filter based on industry or company size
    // that correlates with having specific roles
    
    return companies;
  }

  /**
   * Generate export filename based on processing config
   */
  static generateExportFilename(config: CSVProcessingConfig): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const parts = ['enriched-data', timestamp];
    
    if (config['roles'] && config.roles.length > 0) {
      parts.push(config.roles.join('-').toLowerCase());
    }
    
    if (config.processingLimit) {
      parts.push(`top-${config.processingLimit}`);
    }
    
    return parts.join('-');
  }
}
