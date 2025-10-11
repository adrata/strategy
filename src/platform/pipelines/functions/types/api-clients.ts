/**
 * API CLIENT INTERFACES
 * 
 * Properly typed interfaces for all external API clients
 * Following 2025 best practices for type safety
 */

// ============================================================================
// CORE SIGNAL API
// ============================================================================

export interface SearchCriteria {
  roles: string[];
  companies: string[];
  filters?: Record<string, any>;
}

export interface Person {
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
}

export interface CompanyData {
  name: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  revenue?: number;
}

export interface CoreSignalAPI {
  searchPeople(criteria: SearchCriteria): Promise<Person[]>;
  getCompanyData(companyName: string): Promise<CompanyData>;
  searchCompanies(criteria: CompanySearchCriteria): Promise<CompanyData[]>;
}

// ============================================================================
// LUSHA API
// ============================================================================

export interface LushaContactData {
  email?: string;
  phone?: string;
  linkedIn?: string;
  confidence: number;
}

export interface LushaAPI {
  enrichContact(name: string, company: string): Promise<LushaContactData>;
  verifyEmail(email: string): Promise<{ valid: boolean; confidence: number }>;
  verifyPhone(phone: string): Promise<{ valid: boolean; confidence: number }>;
}

// ============================================================================
// ZERO BOUNCE API
// ============================================================================

export interface ZeroBounceResult {
  valid: boolean;
  confidence: number;
  reason?: string;
}

export interface ZeroBounceAPI {
  verifyEmail(email: string): Promise<ZeroBounceResult>;
  bulkVerifyEmails(emails: string[]): Promise<ZeroBounceResult[]>;
}

// ============================================================================
// PEOPLE DATA LABS API
// ============================================================================

export interface PDLPerson {
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  confidence: number;
}

export interface PDLAPI {
  searchPeople(criteria: SearchCriteria): Promise<PDLPerson[]>;
  enrichPerson(name: string, company: string): Promise<PDLPerson>;
  verifyContact(email: string, phone: string): Promise<{ email: boolean; phone: boolean }>;
}

// ============================================================================
// PERPLEXITY API
// ============================================================================

export interface PerplexityResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

export interface PerplexityAPI {
  query(question: string): Promise<PerplexityResponse>;
  analyzePerson(name: string, company: string): Promise<PerplexityResponse>;
  analyzeCompany(companyName: string): Promise<PerplexityResponse>;
}

// ============================================================================
// DATABASE API
// ============================================================================

export interface DatabaseAPI {
  savePerson(person: Person): Promise<{ id: string; success: boolean }>;
  getPerson(id: string): Promise<Person | null>;
  updatePerson(id: string, data: Partial<Person>): Promise<{ success: boolean }>;
  deletePerson(id: string): Promise<{ success: boolean }>;
}

export interface ClaudeAPI {
  generateContent: (prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }) => Promise<string>;
}

// ============================================================================
// UNIFIED API CLIENTS INTERFACE
// ============================================================================

export interface APIClients {
  coreSignal?: CoreSignalAPI;
  lusha?: LushaAPI;
  zeroBounce?: ZeroBounceAPI;
  pdl?: PDLAPI;
  perplexity?: PerplexityAPI;
  database?: DatabaseAPI;
  claude?: ClaudeAPI;
}

// ============================================================================
// COMPANY SEARCH CRITERIA
// ============================================================================

export interface CompanySearchCriteria {
  firmographics?: {
    industry?: string[];
    employeeRange?: { min?: number; max?: number };
    revenueRange?: { min?: number; max?: number };
  };
  innovationProfile?: {
    segment?: 'innovators' | 'early_adopters' | 'early_majority' | 'late_majority' | 'laggards';
  };
  painSignals?: string[];
}
