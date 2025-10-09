/**
 * 🏢 SBI BULK COMPANY PROCESSOR TYPES
 * 
 * TypeScript interfaces for the SBI bulk company analysis system
 */

export interface CompanyInput {
  name?: string;
  domain?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
}

export interface ProcessingOptions {
  includeContacts?: boolean;
  includeAcquisition?: boolean;
  validateEmails?: boolean;
  validatePhones?: boolean;
  confidenceThreshold?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface CompanyResolution {
  name: string;
  domain: string;
  website: string;
  industry?: string;
  size?: string;
  location?: string;
  status: 'active' | 'acquired' | 'merged' | 'inactive';
  parentCompany?: {
    name: string;
    domain: string;
  };
  acquisitionDate?: Date;
  confidence: number;
  sources: string[];
  lastVerified: Date;
}

export interface RoleDetection {
  cfo?: ExecutiveContact;
  cro?: ExecutiveContact;
  ceo?: ExecutiveContact;
  confidence: number;
  sources: string[];
  lastVerified: Date;
}

export interface ExecutiveContact {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  confidence: number;
  sources: string[];
  lastVerified: Date;
}

export interface EmailDiscovery {
  emails: EmailContact[];
  confidence: number;
  sources: string[];
  lastVerified: Date;
}

export interface EmailContact {
  address: string;
  type: 'professional' | 'personal' | 'role_based' | 'disposable';
  isValid: boolean;
  isVerified: boolean;
  confidence: number;
  sources: string[];
  lastVerified: Date;
}

export interface PhoneDiscovery {
  phones: PhoneContact[];
  confidence: number;
  sources: string[];
  lastVerified: Date;
}

export interface PhoneContact {
  number: string;
  type: 'mobile' | 'landline' | 'voip' | 'toll_free';
  context: 'professional' | 'personal';
  isValid: boolean;
  isVerified: boolean;
  confidence: number;
  sources: string[];
  lastVerified: Date;
}

export interface CompanyAnalysisResult {
  company: CompanyResolution;
  roles: RoleDetection;
  emails: EmailDiscovery;
  phones: PhoneDiscovery;
  overallConfidence: number;
  recommendations: string[];
  warnings: string[];
  processingTime: number;
  timestamp: Date;
}

export interface ProcessingResult {
  totalProcessed: number;
  processingTimeMs: number;
  averageConfidence: number;
  confidenceDistribution: {
    high: number;    // 90-100%
    medium: number;  // 70-89%
    low: number;     // 50-69%
    veryLow: number; // <50%
  };
  results: CompanyAnalysisResult[];
  errors: ProcessingError[];
}

export interface ProcessingError {
  company: CompanyInput;
  error: string;
  step: string;
  timestamp: Date;
}

export interface ConfidenceScore {
  step: string;
  score: number;
  factors: ConfidenceFactor[];
  recommendations: string[];
}

export interface ConfidenceFactor {
  factor: string;
  weight: number;
  score: number;
  description: string;
}

export interface DatabaseSaveResult {
  success: boolean;
  companyId?: string;
  peopleIds?: string[];
  opportunitiesIds?: string[];
  error?: string;
}

export interface VerificationResult {
  executive: ExecutiveContact;
  company: any;
  verified: boolean;
  confidence: number;
  verificationScore: number;
  sources: VerificationSource[];
  recommendations: string[];
  timestamp: Date;
}

export interface VerificationSource {
  source: string;
  confidence: number;
  verified: boolean;
  details: string;
  url: string | null;
}
