/**
 * 🎯 ROLE FINDER PIPELINE
 * 
 * Standardized pipeline for finding specific roles at companies using CoreSignal
 * Supports single company, bulk company lists, and multiple role types
 * 
 * Usage Examples:
 * - "Find me a VP of Sales at Nike"
 * - "Find me CFO and CEO from this list of 1,235 companies"
 * - "Find me a Director of Engineering at these 50 companies"
 */

import { CoreSignalClient } from './buyer-group/coresignal-client';
import { QueryBuilder } from './buyer-group/query-builder';
import { ProfileAnalyzer } from './buyer-group/profile-analyzer';
import { parseCSV } from './csv-import-service';
import { AdvancedCompanyMatcher, CompanyMatchRequest } from './company-matching/advanced-company-matcher';
import { PrismaClient } from '@prisma/client';

export interface RoleFinderConfig {
  coreSignal: {
    apiKey: string;
    baseUrl: string;
    maxCollects: number;
    batchSize: number;
    useCache: boolean;
    cacheTTL: number;
  };
  output: {
    format: 'json' | 'csv' | 'excel' | 'google-sheets';
    includeContactInfo: boolean;
    includeCompanyInfo: boolean;
    includeConfidenceScores: boolean;
  };
  search: {
    maxResultsPerCompany: number;
    minConfidenceScore: number;
    includeRecentlyLeft: boolean; // Include people who left in last 6 months
  };
}

export interface RoleSearchRequest {
  // Single company or list of companies
  companies: string[] | { name: string; website?: string; domain?: string }[];
  
  // Roles to find
  roles: RoleDefinition[];
  
  // Optional company IDs for precision (if known)
  companyIds?: number[];
  
  // Geographic filters
  geography?: string[];
  
  // Additional filters
  filters?: {
    excludeConsultants?: boolean;
    excludeContractors?: boolean;
    minTenure?: number; // months
    maxTenure?: number; // months
  };
}

export interface RoleDefinition {
  name: string; // "CFO", "VP of Sales", "Director of Engineering"
  titles: string[]; // Alternative title variations
  departments?: string[]; // Target departments
  seniorityLevel: 'c_suite' | 'vp' | 'director' | 'manager' | 'ic';
  priority: 'high' | 'medium' | 'low';
}

export interface RoleFinderResult {
  company: {
    name: string;
    website?: string;
    domain?: string;
    coreSignalId?: number;
    employeeCount?: number;
    industry?: string;
  };
  role: {
    name: string;
    seniorityLevel: string;
  };
  person: {
    name: string;
    title: string;
    department?: string;
    email?: string;
    linkedinUrl?: string;
    tenure?: string;
    previousRoles?: string[];
  };
  confidence: {
    overall: number;
    titleMatch: number;
    companyMatch: number;
    recency: number;
  };
  metadata: {
    foundAt: string;
    source: 'coresignal';
    searchQuery: string;
    creditsUsed: number;
  };
}

export interface RoleFinderReport {
  summary: {
    totalCompaniesSearched: number;
    totalRolesFound: number;
    successRate: number;
    averageConfidence: number;
    creditsUsed: number;
    processingTime: number;
  };
  results: RoleFinderResult[];
  errors: Array<{
    company: string;
    role: string;
    error: string;
  }>;
  exportUrls?: {
    csv?: string;
    excel?: string;
    googleSheets?: string;
  };
}

export class RoleFinderPipeline {
  private config: RoleFinderConfig;
  private coreSignalClient: CoreSignalClient;
  private queryBuilder: QueryBuilder;
  private profileAnalyzer: ProfileAnalyzer;
  private companyMatcher: AdvancedCompanyMatcher;
  private prisma: PrismaClient;

  constructor(config: RoleFinderConfig) {
    this['config'] = config;
    this['coreSignalClient'] = new CoreSignalClient(this.config.coreSignal);
    this['queryBuilder'] = new QueryBuilder();
    this['profileAnalyzer'] = new ProfileAnalyzer();
    this['prisma'] = new PrismaClient();
    this['companyMatcher'] = new AdvancedCompanyMatcher(this.prisma, config.coreSignal.apiKey);
  }

  /**
   * Main entry point: Find roles at companies
   */
  async findRoles(request: RoleSearchRequest): Promise<RoleFinderReport> {
    console.log(`🎯 Starting role finder for ${request.companies.length} companies, ${request.roles.length} roles`);
    
    const startTime = Date.now();
    const results: RoleFinderResult[] = [];
    const errors: Array<{ company: string; role: string; error: string }> = [];
    let totalCreditsUsed = 0;

    // Process each company
    for (const company of request.companies) {
      const companyName = typeof company === 'string' ? company : company.name;
      const companyWebsite = typeof company === 'string' ? undefined : company.website;
      
      console.log(`🏢 Processing company: ${companyName}`);

      // Process each role for this company
      for (const role of request.roles) {
        try {
          console.log(`🔍 Searching for ${role.name} at ${companyName}`);
          
          const roleResults = await this.findRoleAtCompany(
            companyName,
            role,
            companyWebsite,
            request.companyIds,
            request.geography,
            request.filters
          );

          results.push(...roleResults.results);
          totalCreditsUsed += roleResults.creditsUsed;

          // Rate limiting between searches
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.error(`❌ Error finding ${role.name} at ${companyName}:`, error);
          errors.push({
            company: companyName,
            role: role.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Rate limiting between companies
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const processingTime = Date.now() - startTime;
    const successRate = results.length / (request.companies.length * request.roles.length) * 100;
    const averageConfidence = results.length > 0 
      ? results.reduce((sum, r) => sum + r.confidence.overall, 0) / results.length 
      : 0;

    console.log(`✅ Role finder completed: ${results.length} roles found, ${successRate.toFixed(1)}% success rate`);

    const report: RoleFinderReport = {
      summary: {
        totalCompaniesSearched: request.companies.length,
        totalRolesFound: results.length,
        successRate,
        averageConfidence,
        creditsUsed: totalCreditsUsed,
        processingTime
      },
      results,
      errors
    };

    // Generate exports if requested
    if (this.config.output.format !== 'json') {
      report['exportUrls'] = await this.generateExports(report);
    }

    return report;
  }

  /**
   * Find a specific role at a specific company
   */
  private async findRoleAtCompany(
    companyName: string,
    role: RoleDefinition,
    companyWebsite?: string,
    companyIds?: number[],
    geography?: string[],
    filters?: RoleSearchRequest['filters']
  ): Promise<{ results: RoleFinderResult[]; creditsUsed: number }> {
    
    // Build role-specific search query
    const searchQuery = this.buildRoleSearchQuery(
      companyName,
      role,
      companyIds,
      geography,
      filters
    );

    // Execute search
    const candidateIds = await this.coreSignalClient.searchCandidates(
      searchQuery,
      this.config.search.maxResultsPerCompany
    );

    console.log(`🔍 Found ${candidateIds.length} candidates for ${role.name} at ${companyName}`);

    // Collect detailed profiles
    const profiles = [];
    for (const candidateId of candidateIds.slice(0, this.config.search.maxResultsPerCompany)) {
      try {
        const profile = await this.coreSignalClient.collectSingleProfile(candidateId);
        if (profile) {
          profiles.push(profile);
        }
      } catch (error) {
        console.warn(`Failed to collect profile ${candidateId}:`, error);
      }
    }

    // Transform to results
    const results: RoleFinderResult[] = profiles
      .map(profile => this.transformProfileToResult(profile, companyName, role, companyWebsite))
      .filter(result => result.confidence.overall >= this.config.search.minConfidenceScore)
      .sort((a, b) => b.confidence.overall - a.confidence.overall);

    const creditsUsed = 2 + profiles.length; // 2 for search, 1 per profile collected

    return { results, creditsUsed };
  }

  /**
   * Build CoreSignal search query for specific role
   */
  private buildRoleSearchQuery(
    companyName: string,
    role: RoleDefinition,
    companyIds?: number[],
    geography?: string[],
    filters?: RoleSearchRequest['filters']
  ): any {
    
    // Company targeting
    const companyFilter = companyIds && companyIds.length > 0
      ? { terms: { 'active_experience_company_id': companyIds } }
      : {
          nested: {
            path: 'experience',
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      should: [
                        { match_phrase: { 'experience.company_name': companyName } },
                        { match_phrase: { 'experience.company_name': `${companyName} Inc` } },
                        { match_phrase: { 'experience.company_name': `${companyName} Corporation` } },
                        { match_phrase: { 'experience.company_name': `${companyName} LLC` } }
                      ]
                    }
                  },
                  { term: { 'experience.active_experience': 1 } }
                ]
              }
            }
          }
        };

    // Role/title targeting
    const titleQueries = role.titles.map(title => ({
      match_phrase: { 'experience.title': title }
    }));

    // Department targeting (if specified)
    const departmentQueries = role.departments ? role.departments.map(dept => ({
      match: { 'experience.department': dept }
    })) : [];

    const query = {
      query: {
        bool: {
          must: [
            companyFilter,
            {
              bool: {
                should: [...titleQueries, ...departmentQueries],
                minimum_should_match: 1
              }
            }
          ],
          must_not: [
            { match: { headline: 'former' } },
            { match: { headline: 'ex-' } },
            { match: { headline: 'retired' } }
          ]
        }
      }
    };

    // Add geography filter if specified
    if (geography && geography.length > 0) {
      query.query.bool.must.push({
        bool: {
          should: geography.map(geo => ({ match: { location: geo } })),
          minimum_should_match: 1
        }
      });
    }

    // Add consultant/contractor filters
    if (filters?.excludeConsultants) {
      query.query.bool.must_not.push(
        { match: { headline: 'consultant' } },
        { match: { headline: 'freelance' } },
        { match: { headline: 'independent' } }
      );
    }

    if (filters?.excludeContractors) {
      query.query.bool.must_not.push(
        { match: { headline: 'contractor' } },
        { match: { headline: 'contract' } },
        { match: { headline: 'temp' } }
      );
    }

    return query;
  }

  /**
   * Transform CoreSignal profile to RoleFinderResult
   */
  private transformProfileToResult(
    profile: any,
    companyName: string,
    role: RoleDefinition,
    companyWebsite?: string
  ): RoleFinderResult {
    
    // Calculate confidence scores
    const titleMatch = this.calculateTitleMatchScore(profile.title || '', role.titles);
    const companyMatch = this.calculateCompanyMatchScore(profile.company || '', companyName);
    const recency = this.calculateRecencyScore(profile.start_date);
    const overall = (titleMatch * 0.5 + companyMatch * 0.3 + recency * 0.2);

    return {
      company: {
        name: companyName,
        website: companyWebsite,
        domain: companyWebsite ? new URL(companyWebsite).hostname : undefined,
        coreSignalId: profile.company_id,
        employeeCount: profile.company_size,
        industry: profile.industry
      },
      role: {
        name: role.name,
        seniorityLevel: role.seniorityLevel
      },
      person: {
        name: profile.name || 'Unknown',
        title: profile.title || 'Unknown',
        department: profile.department,
        email: profile.email,
        linkedinUrl: profile.linkedin_url,
        tenure: this.calculateTenure(profile.start_date),
        previousRoles: profile.previous_titles?.slice(0, 3)
      },
      confidence: {
        overall: Math.round(overall),
        titleMatch: Math.round(titleMatch),
        companyMatch: Math.round(companyMatch),
        recency: Math.round(recency)
      },
      metadata: {
        foundAt: new Date().toISOString(),
        source: 'coresignal',
        searchQuery: `${role.name} at ${companyName}`,
        creditsUsed: 1
      }
    };
  }

  /**
   * Generate export files (CSV, Excel, Google Sheets)
   */
  private async generateExports(report: RoleFinderReport): Promise<{ csv?: string; excel?: string; googleSheets?: string }> {
    const { exportToCSV, exportToExcel, exportToGoogleSheets, ensureExportDirectory, formatDataForExport } = await import('@/platform/utils/csv-export');
    
    const exports: { csv?: string; excel?: string; googleSheets?: string } = {};
    const exportDir = ensureExportDirectory('./exports');
    
    // Format data for export
    const exportData = formatDataForExport(
      report.results.map(result => ({
        'Company Name': result.company.name,
        'Company Website': result.company.website || '',
        'Company Industry': result.company.industry || '',
        'Company Size': result.company.employeeCount || '',
        'Role Searched': result.role.name,
        'Person Name': result.person.name,
        'Person Title': result.person.title,
        'Person Department': result.person.department || '',
        'Person Email': result.person.email || '',
        'Person LinkedIn': result.person.linkedinUrl || '',
        'Person Tenure': result.person.tenure || '',
        'Confidence Score': result.confidence.overall,
        'Title Match Score': result.confidence.titleMatch,
        'Company Match Score': result.confidence.companyMatch,
        'Found Date': result.metadata.foundAt
      })),
      {
        dateFormat: 'us',
        numberFormat: 'us',
        booleanFormat: 'yes-no',
        nullFormat: 'empty'
      }
    );

    if (this.config['output']['format'] === 'csv') {
      const csvResult = exportToCSV(exportData, {
        filename: 'role-finder-results',
        includeTimestamp: true,
        outputDir: exportDir
      });
      exports['csv'] = csvResult.path;
      console.log(`📄 CSV exported to: ${csvResult.path}`);
    }

    if (this.config['output']['format'] === 'excel') {
      const excelResult = await exportToExcel(exportData, {
        filename: 'role-finder-results',
        sheetName: 'Role Finder Results',
        includeTimestamp: true,
        outputDir: exportDir
      });
      exports['excel'] = excelResult.path;
      console.log(`📊 Excel exported to: ${excelResult.path}`);
    }

    if (this.config['output']['format'] === 'google-sheets') {
      const sheetsResult = await exportToGoogleSheets(exportData, {
        spreadsheetName: `Role Finder Results - ${new Date().toLocaleDateString()}`,
        sheetName: 'Results'
      });
      exports['googleSheets'] = sheetsResult.url;
      console.log(`📊 Google Sheets created: ${sheetsResult.url}`);
    }

    return exports;
  }



  // Helper methods for confidence scoring
  private calculateTitleMatchScore(actualTitle: string, targetTitles: string[]): number {
    const actual = actualTitle.toLowerCase();
    for (const target of targetTitles) {
      const targetLower = target.toLowerCase();
      if (actual === targetLower) return 100;
      if (actual.includes(targetLower) || targetLower.includes(actual)) return 80;
    }
    return 0;
  }

  private calculateCompanyMatchScore(actualCompany: string, targetCompany: string): number {
    const actual = actualCompany.toLowerCase();
    const target = targetCompany.toLowerCase();
    if (actual === target) return 100;
    if (actual.includes(target) || target.includes(actual)) return 90;
    return 0;
  }

  private calculateRecencyScore(startDate?: string): number {
    if (!startDate) return 50;
    const start = new Date(startDate);
    const now = new Date();
    const monthsAgo = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsAgo < 6) return 100;
    if (monthsAgo < 12) return 90;
    if (monthsAgo < 24) return 80;
    return 70;
  }

  private calculateTenure(startDate?: string): string {
    if (!startDate) return 'Unknown';
    const start = new Date(startDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  }
}

// Predefined role definitions for common searches
export const COMMON_ROLES: Record<string, RoleDefinition> = {
  CEO: {
    name: 'Chief Executive Officer',
    titles: ['Chief Executive Officer', 'CEO', 'Chief Executive', 'President & CEO', 'President and CEO'],
    departments: ['executive', 'leadership', 'c-suite'],
    seniorityLevel: 'c_suite',
    priority: 'high'
  },
  CFO: {
    name: 'Chief Financial Officer',
    titles: ['Chief Financial Officer', 'CFO', 'Chief Financial', 'VP Finance', 'Vice President Finance'],
    departments: ['finance', 'accounting', 'financial planning'],
    seniorityLevel: 'c_suite',
    priority: 'high'
  },
  CRO: {
    name: 'Chief Revenue Officer',
    titles: ['Chief Revenue Officer', 'CRO', 'Chief Revenue', 'VP Revenue', 'Vice President Revenue'],
    departments: ['revenue', 'sales', 'revenue operations'],
    seniorityLevel: 'c_suite',
    priority: 'high'
  },
  VP_SALES: {
    name: 'VP of Sales',
    titles: ['Vice President Sales', 'VP Sales', 'Vice President of Sales', 'SVP Sales', 'Senior Vice President Sales'],
    departments: ['sales', 'business development', 'revenue'],
    seniorityLevel: 'vp',
    priority: 'high'
  },
  VP_MARKETING: {
    name: 'VP of Marketing',
    titles: ['Vice President Marketing', 'VP Marketing', 'Vice President of Marketing', 'SVP Marketing'],
    departments: ['marketing', 'demand generation', 'growth'],
    seniorityLevel: 'vp',
    priority: 'medium'
  },
  CTO: {
    name: 'Chief Technology Officer',
    titles: ['Chief Technology Officer', 'CTO', 'Chief Technical Officer', 'VP Engineering', 'Vice President Engineering'],
    departments: ['engineering', 'technology', 'product', 'development'],
    seniorityLevel: 'c_suite',
    priority: 'medium'
  }
};
