/**
 * AI Context Test Factories
 * 
 * Factory functions for creating test data for AI context testing
 */

import { ListViewContext } from '@/platform/ai/services/AIContextService';

// Factory for creating test workspace context
export const createTestWorkspaceContext = (overrides?: Partial<any>) => ({
  workspace: {
    id: 'test-workspace-id',
    name: 'Test Workspace',
    businessModel: 'B2B SaaS',
    industryServed: ['Technology', 'Finance'],
    targetMarket: 'Mid-market companies',
    valueProposition: 'Streamline sales processes with AI-powered insights',
    competitiveAdvantages: ['AI-driven recommendations', 'Real-time analytics'],
    salesMethodology: 'Consultative selling',
    productPortfolio: ['CRM Platform', 'Analytics Dashboard', 'AI Assistant'],
    serviceOfferings: ['Implementation', 'Training', 'Support'],
    idealCustomerProfile: {
      companySize: '50-500 employees',
      industry: ['Technology', 'Finance', 'Healthcare'],
      revenue: '$10M-$100M',
      painPoints: ['Manual processes', 'Poor visibility', 'Inefficient workflows']
    },
    geographicCoverage: ['North America', 'Europe'],
    funnelDistribution: {
      leads: 150,
      prospects: 75,
      opportunities: 25,
      customers: 10
    }
  },
  company: {
    name: 'Test Company',
    industryServed: ['Technology', 'Finance'],
    businessModel: 'B2B SaaS',
    targetMarket: 'Mid-market companies',
    valueProposition: 'Streamline sales processes with AI-powered insights',
    competitiveAdvantages: ['AI-driven recommendations', 'Real-time analytics'],
    salesMethodology: 'Consultative selling',
    productPortfolio: ['CRM Platform', 'Analytics Dashboard', 'AI Assistant'],
    serviceOfferings: ['Implementation', 'Training', 'Support'],
    idealCustomerProfile: {
      companySize: '50-500 employees',
      industry: ['Technology', 'Finance', 'Healthcare'],
      revenue: '$10M-$100M',
      painPoints: ['Manual processes', 'Poor visibility', 'Inefficient workflows']
    }
  },
  data: {
    totalPeople: 150,
    totalCompanies: 50,
    activeProspects: 75,
    activeLeads: 150,
    activeOpportunities: 25,
    totalRevenue: 2500000,
    averageDealSize: 100000,
    conversionRate: 0.15,
    salesCycle: 90
  },
  ...overrides
});

// Factory for creating test list view context
export const createTestListViewContext = (overrides?: Partial<ListViewContext>): ListViewContext => ({
  visibleRecords: [
    { 
      id: '1', 
      name: 'John Doe', 
      fullName: 'John Doe',
      company: 'Acme Corp',
      companyName: 'Acme Corp',
      title: 'VP of Sales',
      jobTitle: 'VP of Sales',
      email: 'john.doe@acme.com',
      phone: '+1-555-0123',
      status: 'active',
      priority: 'high',
      industry: 'Technology',
      companySize: '100-500 employees',
      lastContactDate: '2024-01-15',
      nextAction: 'Follow up on proposal',
      source: 'LinkedIn',
      score: 85
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      fullName: 'Jane Smith',
      company: 'Tech Inc',
      companyName: 'Tech Inc',
      title: 'CTO',
      jobTitle: 'CTO',
      email: 'jane.smith@techinc.com',
      phone: '+1-555-0456',
      status: 'active',
      priority: 'medium',
      industry: 'Finance',
      companySize: '50-100 employees',
      lastContactDate: '2024-01-10',
      nextAction: 'Schedule demo',
      source: 'Referral',
      score: 72
    },
    { 
      id: '3', 
      name: 'Bob Johnson', 
      fullName: 'Bob Johnson',
      company: 'StartupXYZ',
      companyName: 'StartupXYZ',
      title: 'Founder',
      jobTitle: 'Founder',
      email: 'bob@startupxyz.com',
      phone: '+1-555-0789',
      status: 'qualified',
      priority: 'high',
      industry: 'Healthcare',
      companySize: '10-50 employees',
      lastContactDate: '2024-01-12',
      nextAction: 'Send pricing info',
      source: 'Website',
      score: 68
    }
  ],
  activeSection: 'leads',
  appliedFilters: {
    searchQuery: '',
    verticalFilter: 'all',
    statusFilter: 'active',
    priorityFilter: 'all',
    sortField: 'rank',
    sortDirection: 'asc'
  },
  totalCount: 25,
  lastUpdated: new Date(),
  ...overrides
});

// Factory for creating test AI context config
export const createTestAIContextConfig = (overrides?: Partial<any>) => ({
  userId: 'test-user-id',
  workspaceId: 'test-workspace-id',
  appType: 'pipeline',
  currentRecord: null,
  recordType: null,
  listViewContext: null,
  conversationHistory: [],
  documentContext: null,
  ...overrides
});

// Factory for creating test current record
export const createTestCurrentRecord = (overrides?: Partial<any>) => ({
  id: '1',
  name: 'John Doe',
  fullName: 'John Doe',
  company: 'Acme Corp',
  companyName: 'Acme Corp',
  title: 'VP of Sales',
  jobTitle: 'VP of Sales',
  email: 'john.doe@acme.com',
  phone: '+1-555-0123',
  status: 'active',
  priority: 'high',
  industry: 'Technology',
  companySize: '100-500 employees',
  lastContactDate: '2024-01-15',
  nextAction: 'Follow up on proposal',
  source: 'LinkedIn',
  score: 85,
  companyDetails: {
    website: 'https://acme.com',
    linkedin: 'https://linkedin.com/company/acme-corp',
    description: 'Leading technology company specializing in enterprise solutions',
    industry: 'Technology',
    size: '100-500 employees',
    revenue: '$50M-$100M',
    location: 'San Francisco, CA'
  },
  recentActivities: [
    {
      type: 'email',
      description: 'Sent proposal',
      date: '2024-01-15',
      outcome: 'sent'
    },
    {
      type: 'call',
      description: 'Discovery call',
      date: '2024-01-10',
      outcome: 'completed'
    }
  ],
  ...overrides
});

// Factory for creating test conversation history
export const createTestConversationHistory = (overrides?: Partial<any>[]) => [
  {
    role: 'user',
    content: 'Who are my top prospects this week?',
    timestamp: '2024-01-15T10:00:00Z'
  },
  {
    role: 'assistant',
    content: 'Based on your current pipeline, your top prospects are John Doe at Acme Corp and Jane Smith at Tech Inc. Both have high scores and are in active status.',
    timestamp: '2024-01-15T10:01:00Z'
  },
  ...(overrides || [])
];

// Factory for creating test document context
export const createTestDocumentContext = (overrides?: Partial<any>) => ({
  fileName: 'prospect-list.csv',
  parsedDoc: {
    type: 'csv',
    data: [
      { name: 'John Doe', company: 'Acme Corp', email: 'john@acme.com' },
      { name: 'Jane Smith', company: 'Tech Inc', email: 'jane@techinc.com' }
    ],
    metadata: {
      rowCount: 2,
      columns: ['name', 'company', 'email'],
      uploadedAt: '2024-01-15T09:00:00Z'
    }
  },
  ...overrides
});

// Factory for creating test workspace metrics
export const createTestWorkspaceMetrics = (overrides?: Partial<any>) => ({
  people: 150,
  companies: 50,
  prospects: 75,
  leads: 150,
  opportunities: 25,
  totalRevenue: 2500000,
  averageDealSize: 100000,
  conversionRate: 0.15,
  salesCycle: 90,
  ...overrides
});

// Factory for creating test recent activities
export const createTestRecentActivities = (overrides?: Partial<any>[]) => [
  {
    type: 'email',
    description: 'Sent follow-up email to John Doe',
    person: 'John Doe',
    company: 'Acme Corp',
    date: '2024-01-15T14:30:00Z',
    outcome: 'sent'
  },
  {
    type: 'call',
    description: 'Discovery call with Jane Smith',
    person: 'Jane Smith',
    company: 'Tech Inc',
    date: '2024-01-15T11:00:00Z',
    outcome: 'completed'
  },
  {
    type: 'meeting',
    description: 'Demo presentation to Bob Johnson',
    person: 'Bob Johnson',
    company: 'StartupXYZ',
    date: '2024-01-14T15:00:00Z',
    outcome: 'scheduled'
  },
  ...(overrides || [])
];

// Factory for creating test person search results
export const createTestPersonSearchResults = (overrides?: Partial<any>) => ({
  query: 'John',
  results: [
    {
      id: '1',
      fullName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'VP of Sales',
      email: 'john.doe@acme.com',
      phone: '+1-555-0123',
      company: {
        name: 'Acme Corp',
        industry: 'Technology'
      },
      actions: [
        {
          type: 'email',
          description: 'Sent proposal',
          createdAt: '2024-01-15T10:00:00Z'
        }
      ]
    }
  ],
  count: 1,
  ...overrides
});

// Factory for mock AI responses with context
export const createMockAIResponse = (includesContext: boolean, overrides?: Partial<any>) => ({
  success: true,
  response: includesContext 
    ? "Based on the lead you're viewing, John Doe at Acme Corp, I recommend following up on the proposal you sent yesterday. Given his high score of 85 and active status, he's a strong prospect for closing this quarter."
    : "I don't have specific context about which record you're viewing. Could you please select a specific lead or prospect so I can provide more targeted advice?",
  confidence: 0.9,
  model: 'claude-3-sonnet',
  tokensUsed: 1500,
  responseTime: 1200,
  cost: 0.0025,
  ...overrides
});

// Factory for creating test Speedrun context
export const createTestSpeedrunContext = (overrides?: Partial<any>) => ({
  isSpeedrunProspect: true,
  currentApp: 'Speedrun',
  prospectIndex: 1,
  winningScore: 85,
  ...overrides
});

// Factory for creating test enhanced AI context
export const createTestEnhancedAIContext = (overrides?: Partial<any>) => ({
  userContext: 'USER CONTEXT: Test User (test@adrata.com) is a sales professional at Test Company...',
  applicationContext: 'APPLICATION CONTEXT: You are in the Pipeline application, specifically viewing the leads section...',
  dataContext: 'DATA CONTEXT: Your workspace has 150 people, 50 companies, 75 active prospects...',
  recordContext: 'CURRENT RECORD CONTEXT: You are viewing John Doe at Acme Corp...',
  listViewContext: 'LIST VIEW CONTEXT: You are viewing a list of 25 leads...',
  systemContext: 'SYSTEM CONTEXT: Previous conversation about top prospects...',
  documentContext: 'DOCUMENT CONTEXT: No documents uploaded',
  ...overrides
});

// Factory for creating test validation warnings
export const createTestValidationWarnings = (overrides?: string[]) => [
  'Workspace business context not available - AI may not know what you sell or your target market',
  'No current record or list view context - AI cannot provide specific advice about visible records',
  ...(overrides || [])
];

// Factory for creating test context validation result
export const createTestContextValidation = (isValid: boolean, warnings?: string[]) => ({
  isValid,
  warnings: warnings || (isValid ? [] : createTestValidationWarnings())
});

// Helper to create test data with realistic relationships
export const createTestDataWithRelationships = () => {
  const workspace = createTestWorkspaceContext();
  const listContext = createTestListViewContext();
  const currentRecord = createTestCurrentRecord();
  const conversationHistory = createTestConversationHistory();
  const documentContext = createTestDocumentContext();
  const workspaceMetrics = createTestWorkspaceMetrics();
  const recentActivities = createTestRecentActivities();
  const personSearchResults = createTestPersonSearchResults();
  
  return {
    workspace,
    listContext,
    currentRecord,
    conversationHistory,
    documentContext,
    workspaceMetrics,
    recentActivities,
    personSearchResults,
    aiContextConfig: createTestAIContextConfig({
      currentRecord,
      recordType: 'lead',
      listViewContext: listContext,
      conversationHistory,
      documentContext
    })
  };
};
