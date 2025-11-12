export type TestDriveMode = 'run-1' | 'run-many';

export interface CompanyInput {
  name?: string;
  website?: string;
  linkedinUrl?: string;
}

export interface TestDriveFormData {
  yourCompany: CompanyInput;
  targetCompany: CompanyInput;
}

export interface RunManyCompanyInput extends CompanyInput {
  id?: string; // For tracking during processing
}

export interface RunManyFormData {
  yourCompany: CompanyInput;
  targetCompanies: RunManyCompanyInput[];
}

export interface BuyerGroupMember {
  name: string;
  title: string;
  role: 'decision_maker' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';
  confidence: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  influenceScore?: number;
}

export interface BuyerGroupResult {
  success: boolean;
  company?: {
    name: string;
    website?: string;
    industry?: string;
  };
  buyerGroup?: {
    totalMembers: number;
    composition?: {
      decisionMakers: number;
      champions: number;
      stakeholders: number;
    };
    members: BuyerGroupMember[];
  };
  qualityMetrics?: {
    overallScore: number;
    averageConfidence: number;
  };
  processingTime?: number;
  error?: string;
}

export interface ProcessingStage {
  id: string;
  label: string;
  completed: boolean;
  inProgress: boolean;
}

export interface RunManyResult {
  company: RunManyCompanyInput;
  result: BuyerGroupResult | null;
  error?: string;
  copied?: boolean; // Track if user has copied this result
}

export interface RunManyResults {
  yourCompany: CompanyInput;
  results: RunManyResult[];
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

