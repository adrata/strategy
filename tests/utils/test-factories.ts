/**
 * Test Data Factories
 * 
 * Generate test data for companies, people, and actions
 */

// Simple test data generators without external dependencies

// Test user and workspace constants
export const TEST_USER = {
  id: '01K1VBYZG41K9QA0D9CF06KNRG', // ross user ID
  email: 'ross@adrata.com',
  name: 'Ross',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // adrata workspace ID
};

// Test data cleanup tracking
const createdTestIds = {
  companies: new Set<string>(),
  people: new Set<string>(),
  actions: new Set<string>(),
  reports: new Set<string>(),
  atriumDocuments: new Set<string>(),
};

/**
 * Generate test company data
 */
export function createTestCompany(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  const company = {
    name: `Test Company ${timestamp}`,
    legalName: `Test Company Legal ${timestamp}`,
    email: `test${timestamp}@example.com`,
    website: `https://testcompany${timestamp}.com`,
    phone: `+1-555-${timestamp.toString().slice(-4)}`,
    address: `${timestamp} Test Street`,
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    industry: 'Technology',
    status: 'ACTIVE' as const,
    priority: 'MEDIUM' as const,
    workspaceId: TEST_USER.workspaceId,
    mainSellerId: TEST_USER.id,
    // Opportunity fields
    opportunityStage: null,
    opportunityAmount: null,
    opportunityProbability: null,
    expectedCloseDate: null,
    actualCloseDate: null,
    notes: null,
    ...overrides,
  };

  return company;
}

/**
 * Generate test person data (lead/prospect/opportunity)
 */
export function createTestPerson(
  status: 'LEAD' | 'PROSPECT' | 'OPPORTUNITY' | 'CLIENT' | 'SUPERFAN' = 'LEAD',
  overrides: Partial<any> = {}
) {
  const timestamp = Date.now();
  const firstName = `Test${timestamp}`;
  const lastName = `User${timestamp}`;
  
  const person = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    displayName: `${firstName} ${lastName}`,
    salutation: 'Mr.',
    suffix: '',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    seniority: 'Senior',
    email: `test${timestamp}@example.com`,
    workEmail: `test${timestamp}@company.com`,
    personalEmail: `test${timestamp}@gmail.com`,
    phone: `+1-555-${timestamp.toString().slice(-4)}`,
    mobilePhone: `+1-555-${timestamp.toString().slice(-4)}`,
    workPhone: `+1-555-${timestamp.toString().slice(-4)}`,
    linkedinUrl: `https://linkedin.com/in/test${timestamp}`,
    address: `${timestamp} Test Street`,
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Male',
    bio: 'Test person bio',
    profilePictureUrl: `https://example.com/avatar${timestamp}.jpg`,
    status,
    priority: 'MEDIUM' as const,
    source: 'Website',
    tags: ['VIP', 'Hot Lead'],
    customFields: null,
    notes: null,
    vertical: 'Technology',
    preferredLanguage: 'en',
    timezone: 'America/New_York',
    emailVerified: true,
    phoneVerified: false,
    lastAction: null,
    lastActionDate: null,
    nextAction: null,
    nextActionDate: null,
    actionStatus: null,
    engagementScore: 75.5,
    globalRank: 100,
    companyRank: 10,
    workspaceId: TEST_USER.workspaceId,
    companyId: null,
    mainSellerId: TEST_USER.id,
    ...overrides,
  };

  return person;
}

/**
 * Generate test action data
 */
export function createTestAction(
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' = 'CALL',
  overrides: Partial<any> = {}
) {
  const timestamp = Date.now();
  const action = {
    type,
    subject: `Test ${type} Action ${timestamp}`,
    description: `This is a test ${type.toLowerCase()} action description.`,
    outcome: `Test outcome for ${type.toLowerCase()} action.`,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    completedAt: null,
    status: 'PLANNED' as const,
    priority: 'NORMAL' as const,
    workspaceId: TEST_USER.workspaceId,
    userId: TEST_USER.id,
    companyId: null,
    personId: null,
    ...overrides,
  };

  return action;
}

/**
 * Create a complete test scenario with company, person, and action
 */
export function createTestScenario() {
  const company = createTestCompany();
  const person = createTestPerson('LEAD', { companyId: null }); // Will be set after company creation
  const action = createTestAction('CALL', { 
    companyId: null, 
    personId: null 
  }); // Will be set after person creation

  return {
    company,
    person,
    action,
  };
}

/**
 * Generate test deep value report data
 */
export function createTestDeepValueReport(
  reportType: 'executive_summary' | 'competitive_analysis' | 'value_proposition' | 'engagement_strategy' | 'risk_assessment' = 'executive_summary',
  overrides: Partial<any> = {}
) {
  const timestamp = Date.now();
  const report = {
    id: `report_${timestamp}`,
    type: reportType,
    title: `Test ${reportType.replace('_', ' ')} Report ${timestamp}`,
    content: `# Test ${reportType.replace('_', ' ')} Report\n\nThis is a test report content for ${reportType}.\n\n## Key Insights\n- Insight 1\n- Insight 2\n- Insight 3\n\n## Recommendations\n1. Recommendation 1\n2. Recommendation 2\n3. Recommendation 3`,
    status: 'completed' as const,
    recordType: 'people' as const,
    recordId: `person_${timestamp}`,
    recordName: `Test Person ${timestamp}`,
    workspaceId: TEST_USER.workspaceId,
    userId: TEST_USER.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return report;
}

/**
 * Generate test Atrium document data
 */
export function createTestAtriumDocument(
  documentType: 'PAPER' | 'FOLDER' | 'TEMPLATE' = 'PAPER',
  overrides: Partial<any> = {}
) {
  const timestamp = Date.now();
  const document = {
    id: `atrium_doc_${timestamp}`,
    title: `Test ${documentType} Document ${timestamp}`,
    content: documentType === 'PAPER' ? `# Test Paper Document\n\nThis is test content for an Atrium paper document.` : null,
    type: documentType,
    status: 'ACTIVE' as const,
    workspaceId: TEST_USER.workspaceId,
    createdById: TEST_USER.id,
    updatedById: TEST_USER.id,
    parentId: null,
    metadata: {
      reportType: 'executive_summary',
      recordType: 'people',
      recordId: `person_${timestamp}`,
      recordName: `Test Person ${timestamp}`,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  return document;
}

/**
 * Generate test person with CoreSignal data for reports
 */
export function createTestPersonWithCoreSignal(overrides: Partial<any> = {}) {
  const person = createTestPerson('PROSPECT', overrides);
  
  // Add CoreSignal-like data
  const coreSignalData = {
    recentActivity: [
      {
        type: 'job_change',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: 'Started new role as Senior Software Engineer at TechCorp',
        source: 'LinkedIn'
      },
      {
        type: 'company_news',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        description: 'Company announced $50M Series B funding round',
        source: 'TechCrunch'
      }
    ],
    companyInfo: {
      industry: 'Technology',
      size: '201-500 employees',
      funding: '$50M Series B',
      recentNews: [
        'Raised $50M in Series B funding',
        'Expanded to European markets',
        'Launched new AI product line'
      ]
    },
    personalInfo: {
      education: 'Stanford University, Computer Science',
      previousRoles: [
        'Software Engineer at Google',
        'Senior Developer at Microsoft'
      ],
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS'],
      interests: ['AI/ML', 'Open Source', 'Startups']
    }
  };

  return {
    ...person,
    coreSignalData,
  };
}

/**
 * Generate test company with detailed info for reports
 */
export function createTestCompanyWithDetails(overrides: Partial<any> = {}) {
  const company = createTestCompany(overrides);
  
  const companyDetails = {
    industry: 'Technology',
    size: '201-500 employees',
    revenue: '$10M - $50M',
    funding: '$50M Series B',
    founded: 2018,
    headquarters: 'San Francisco, CA',
    website: company.website,
    linkedinUrl: `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
    recentNews: [
      'Raised $50M in Series B funding led by Sequoia Capital',
      'Expanded to European markets with new London office',
      'Launched new AI-powered analytics platform',
      'Hired former Google VP as Chief Technology Officer'
    ],
    keyPeople: [
      {
        name: 'John Smith',
        title: 'CEO',
        linkedinUrl: 'https://linkedin.com/in/johnsmith'
      },
      {
        name: 'Jane Doe',
        title: 'CTO',
        linkedinUrl: 'https://linkedin.com/in/janedoe'
      }
    ],
    competitors: [
      'Competitor A',
      'Competitor B',
      'Competitor C'
    ],
    technologies: [
      'React',
      'Node.js',
      'AWS',
      'MongoDB',
      'Docker'
    ]
  };

  return {
    ...company,
    ...companyDetails,
  };
}

/**
 * Track created test data for cleanup
 */
export function trackTestData(type: 'companies' | 'people' | 'actions' | 'reports' | 'atriumDocuments', id: string) {
  createdTestIds[type].add(id);
}

/**
 * Get all tracked test data IDs
 */
export function getTrackedTestData() {
  return {
    companies: Array.from(createdTestIds.companies),
    people: Array.from(createdTestIds.people),
    actions: Array.from(createdTestIds.actions),
    reports: Array.from(createdTestIds.reports),
    atriumDocuments: Array.from(createdTestIds.atriumDocuments),
  };
}

/**
 * Clear tracked test data
 */
export function clearTrackedTestData() {
  createdTestIds.companies.clear();
  createdTestIds.people.clear();
  createdTestIds.actions.clear();
  createdTestIds.reports.clear();
  createdTestIds.atriumDocuments.clear();
}

/**
 * Generate authentication headers for test requests
 */
export function getTestAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cookie': 'auth-token=test-token', // This will be mocked in tests
  };
}

/**
 * Generate test API base URL
 */
export function getTestApiUrl(endpoint: string) {
  return `http://localhost:3000/api/v1${endpoint}`;
}

/**
 * Wait for async operations in tests
 */
export function waitForAsync(ms: number = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test data for different pipeline stages
 */
export const TEST_PIPELINE_DATA = {
  // Lead data
  lead: () => createTestPerson('LEAD'),
  
  // Prospect data
  prospect: () => createTestPerson('PROSPECT'),
  
  // Opportunity data
  opportunity: () => createTestPerson('OPPORTUNITY'),
  
  // Company with opportunity fields
  opportunityCompany: () => createTestCompany({
    status: 'OPPORTUNITY',
    opportunityStage: 'Proposal',
    opportunityAmount: 50000,
    opportunityProbability: 75,
    expectedCloseDate: new Date('2024-12-31'),
  }),
  
  // Completed action
  completedAction: () => createTestAction('CALL', {
    status: 'COMPLETED',
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  }),
  
  // Planned action
  plannedAction: () => createTestAction('TASK', {
    status: 'PLANNED',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
  }),
  
  // Report data
  executiveSummary: () => createTestDeepValueReport('executive_summary'),
  competitiveAnalysis: () => createTestDeepValueReport('competitive_analysis'),
  valueProposition: () => createTestDeepValueReport('value_proposition'),
  engagementStrategy: () => createTestDeepValueReport('engagement_strategy'),
  riskAssessment: () => createTestDeepValueReport('risk_assessment'),
  
  // Atrium documents
  atriumPaper: () => createTestAtriumDocument('PAPER'),
  atriumFolder: () => createTestAtriumDocument('FOLDER'),
  atriumTemplate: () => createTestAtriumDocument('TEMPLATE'),
  
  // Person with CoreSignal data
  personWithCoreSignal: () => createTestPersonWithCoreSignal(),
  
  // Company with detailed info
  companyWithDetails: () => createTestCompanyWithDetails(),
};

/**
 * Test data validation helpers
 */
export const validateTestData = {
  company: (data: any) => {
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('workspaceId');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('priority');
  },
  
  person: (data: any) => {
    expect(data).toHaveProperty('firstName');
    expect(data).toHaveProperty('lastName');
    expect(data).toHaveProperty('fullName');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('workspaceId');
  },
  
  action: (data: any) => {
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('subject');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('workspaceId');
    expect(data).toHaveProperty('userId');
  },
  
  report: (data: any) => {
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('recordType');
    expect(data).toHaveProperty('recordId');
    expect(data).toHaveProperty('workspaceId');
    expect(data).toHaveProperty('userId');
  },
  
  atriumDocument: (data: any) => {
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('workspaceId');
    expect(data).toHaveProperty('createdById');
    expect(data).toHaveProperty('metadata');
  },
};

/**
 * Test response validation helpers
 */
export const validateApiResponse = {
  success: (response: any) => {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('meta');
  },
  
  error: (response: any, expectedStatus?: number) => {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    if (expectedStatus) {
      expect(response.status).toBe(expectedStatus);
    }
  },
  
  pagination: (response: any) => {
    expect(response.meta).toHaveProperty('pagination');
    expect(response.meta.pagination).toHaveProperty('page');
    expect(response.meta.pagination).toHaveProperty('limit');
    expect(response.meta.pagination).toHaveProperty('totalCount');
    expect(response.meta.pagination).toHaveProperty('totalPages');
  },
};
