/**
 * Record Page Test Data Factories
 * 
 * Generate test data specifically for record page testing
 */

import { createTestPerson, createTestCompany, TEST_USER } from './test-factories';

// Record page specific test data generators

/**
 * Generate test data for PipelineDetailPage component
 */
export function createTestRecordPageProps(recordType: string, overrides: any = {}) {
  const baseProps = {
    section: recordType as any,
    slug: 'test-record-id',
    standalone: false,
    ...overrides
  };
  
  return baseProps;
}

/**
 * Generate test data for UniversalRecordTemplate component
 */
export function createTestUniversalRecordTemplateProps(recordType: string, overrides: any = {}) {
  let record;
  
  switch (recordType) {
    case 'people':
      record = createTestPerson('LEAD', {
        id: 'test-person-id',
        fullName: 'John Doe',
        email: 'john@example.com',
        jobTitle: 'CEO',
        company: createTestCompany({ name: 'Test Company' })
      });
      break;
    case 'companies':
      record = createTestCompany({
        id: 'test-company-id',
        name: 'Test Company',
        website: 'https://test.com',
        industry: 'Technology'
      });
      break;
    case 'leads':
      record = createTestPerson('LEAD', {
        id: 'test-lead-id',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        status: 'LEAD'
      });
      break;
    case 'prospects':
      record = createTestPerson('PROSPECT', {
        id: 'test-prospect-id',
        fullName: 'Bob Johnson',
        email: 'bob@example.com',
        status: 'PROSPECT'
      });
      break;
    case 'opportunities':
      record = createTestPerson('OPPORTUNITY', {
        id: 'test-opportunity-id',
        fullName: 'Alice Brown',
        email: 'alice@example.com',
        status: 'OPPORTUNITY',
        opportunityStage: 'PROPOSAL',
        opportunityAmount: 50000
      });
      break;
    case 'clients':
      record = createTestPerson('CLIENT', {
        id: 'test-client-id',
        fullName: 'Charlie Wilson',
        email: 'charlie@example.com',
        status: 'CLIENT'
      });
      break;
    case 'speedrun':
      record = createTestPerson('LEAD', {
        id: 'test-speedrun-id',
        fullName: 'Speedrun User',
        email: 'speedrun@example.com',
        globalRank: 1,
        status: 'LEAD'
      });
      break;
    default:
      record = createTestPerson('LEAD', { id: 'test-default-id' });
  }
  
  const baseProps = {
    record,
    recordType: recordType as any,
    onBack: jest.fn(),
    onComplete: jest.fn(),
    onSnooze: jest.fn(),
    onNavigatePrevious: jest.fn(),
    onNavigateNext: jest.fn(),
    onRecordUpdate: jest.fn(),
    recordIndex: 0,
    totalRecords: 10,
    ...overrides
  };
  
  return baseProps;
}

/**
 * Generate test data for SpeedrunRecordTemplate component
 */
export function createTestSpeedrunRecordTemplateProps(overrides: any = {}) {
  const person = createTestPerson('LEAD', {
    id: 'test-speedrun-person-id',
    name: 'Speedrun Person',
    title: 'CEO',
    company: 'Test Company',
    email: 'speedrun@example.com',
    phone: '+1234567890',
    mobilePhone: '+1234567891',
    linkedin: 'https://linkedin.com/in/speedrun',
    photo: null,
    priority: 'HIGH',
    status: 'LEAD',
    lastContact: '2024-01-01',
    nextAction: 'Follow up call',
    relationship: 'New',
    bio: 'Test bio',
    interests: ['Technology', 'Sales'],
    recentActivity: 'Email sent',
    commission: '10%',
    stableIndex: 0
  });
  
  const baseProps = {
    person,
    personIndex: 0,
    totalPersons: 50,
    allPeople: [person],
    onBack: jest.fn(),
    onNavigatePrevious: jest.fn(),
    onNavigateNext: jest.fn(),
    onSnooze: jest.fn(),
    onRemove: jest.fn(),
    onComplete: jest.fn(),
    ...overrides
  };
  
  return baseProps;
}

/**
 * Generate mock API responses for record pages
 */
export function createMockApiResponse(recordType: string, recordId: string, overrides: any = {}) {
  let record;
  
  switch (recordType) {
    case 'people':
      record = createTestPerson('LEAD', {
        id: recordId,
        fullName: 'John Doe',
        email: 'john@example.com',
        jobTitle: 'CEO',
        company: createTestCompany({ name: 'Test Company' })
      });
      break;
    case 'companies':
      record = createTestCompany({
        id: recordId,
        name: 'Test Company',
        website: 'https://test.com',
        industry: 'Technology'
      });
      break;
    default:
      record = createTestPerson('LEAD', { id: recordId });
  }
  
  return {
    success: true,
    data: record,
    meta: {
      total: 1,
      page: 1,
      limit: 1
    },
    ...overrides
  };
}

/**
 * Generate mock error responses
 */
export function createMockErrorResponse(status: number, message: string = 'Test error') {
  return {
    success: false,
    error: message,
    code: status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
    status
  };
}

/**
 * Generate test navigation data
 */
export function createTestNavigationData(recordType: string, currentIndex: number = 0) {
  const records = Array.from({ length: 10 }, (_, i) => {
    const id = `test-${recordType}-${i}`;
    if (recordType === 'people' || recordType === 'leads' || recordType === 'prospects' || recordType === 'opportunities' || recordType === 'clients') {
      return createTestPerson('LEAD', { id, fullName: `Test ${recordType} ${i}` });
    } else if (recordType === 'companies') {
      return createTestCompany({ id, name: `Test Company ${i}` });
    }
    return { id, name: `Test ${recordType} ${i}` };
  });
  
  return {
    currentRecord: records[currentIndex],
    previousRecord: currentIndex > 0 ? records[currentIndex - 1] : null,
    nextRecord: currentIndex < records.length - 1 ? records[currentIndex + 1] : null,
    allRecords: records,
    currentIndex,
    totalRecords: records.length
  };
}

/**
 * Generate test tab configuration
 */
export function createTestTabConfig(recordType: string) {
  const baseTabs = [
    { id: 'overview', label: 'Overview', component: 'OverviewTab' },
    { id: 'insights', label: 'Insights', component: 'InsightsTab' },
    { id: 'timeline', label: 'Timeline', component: 'TimelineTab' }
  ];
  
  const recordTypeSpecificTabs = {
    people: [
      { id: 'profile', label: 'Profile', component: 'ProfileTab' },
      { id: 'career', label: 'Career', component: 'CareerTab' }
    ],
    companies: [
      { id: 'company', label: 'Company', component: 'CompanyTab' },
      { id: 'contacts', label: 'Contacts', component: 'ContactsTab' }
    ],
    speedrun: [
      { id: 'overview', label: 'Overview', component: 'SpeedrunOverviewTab' },
      { id: 'insights', label: 'Insights', component: 'SpeedrunInsightsTab' },
      { id: 'notes', label: 'Notes', component: 'NotesTab' }
    ]
  };
  
  return [
    ...baseTabs,
    ...(recordTypeSpecificTabs[recordType as keyof typeof recordTypeSpecificTabs] || [])
  ];
}

/**
 * Generate test action data
 */
export function createTestActionData(recordType: string, actionType: string) {
  const baseAction = {
    id: `test-action-${Date.now()}`,
    type: actionType,
    recordId: `test-${recordType}-id`,
    recordType,
    userId: TEST_USER.id,
    workspaceId: TEST_USER.workspaceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  switch (actionType) {
    case 'complete':
      return {
        ...baseAction,
        status: 'completed',
        notes: 'Action completed successfully',
        outcome: 'positive'
      };
    case 'update':
      return {
        ...baseAction,
        status: 'updated',
        field: 'status',
        oldValue: 'LEAD',
        newValue: 'PROSPECT'
      };
    case 'delete':
      return {
        ...baseAction,
        status: 'deleted',
        notes: 'Record deleted'
      };
    default:
      return baseAction;
  }
}

/**
 * Generate test context data
 */
export function createTestContextData(recordType: string) {
  return {
    user: TEST_USER,
    workspace: {
      id: TEST_USER.workspaceId,
      name: 'Test Workspace',
      settings: {}
    },
    record: createMockApiResponse(recordType, 'test-record-id').data,
    navigation: createTestNavigationData(recordType),
    tabs: createTestTabConfig(recordType)
  };
}
