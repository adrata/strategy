/**
 * Unit Tests for Record Page Utilities
 * 
 * Tests utility functions and helpers used across record pages
 */

import { 
  createTestRecordPageProps,
  createTestUniversalRecordTemplateProps,
  createTestSpeedrunRecordTemplateProps,
  createTestNavigationData,
  createTestTabConfig,
  createTestActionData,
  createTestContextData
} from '../../utils/record-page-factories';

describe('Record Page Utilities', () => {
  describe('Test Data Factories', () => {
    it('should create valid record page props', () => {
      const props = createTestRecordPageProps('people');
      
      expect(props).toMatchObject({
        section: 'people',
        slug: 'test-record-id',
        standalone: false
      });
    });

    it('should create valid universal record template props', () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      expect(props).toMatchObject({
        recordType: 'people',
        recordIndex: 0,
        totalRecords: 10
      });
      expect(props.record).toBeDefined();
      expect(props.onBack).toBeDefined();
      expect(props.onNavigatePrevious).toBeDefined();
      expect(props.onNavigateNext).toBeDefined();
    });

    it('should create valid speedrun record template props', () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      expect(props).toMatchObject({
        personIndex: 0,
        totalPersons: 50
      });
      expect(props.person).toBeDefined();
      expect(props.allPeople).toBeDefined();
      expect(props.onBack).toBeDefined();
    });

    it('should create valid navigation data', () => {
      const navigationData = createTestNavigationData('people', 1);
      
      expect(navigationData).toMatchObject({
        currentIndex: 1,
        totalRecords: 10
      });
      expect(navigationData.currentRecord).toBeDefined();
      expect(navigationData.allRecords).toBeDefined();
      expect(navigationData.allRecords).toHaveLength(10);
    });

    it('should create valid tab configuration', () => {
      const tabConfig = createTestTabConfig('people');
      
      expect(tabConfig).toBeDefined();
      expect(tabConfig.length).toBeGreaterThan(0);
      expect(tabConfig[0]).toMatchObject({
        id: expect.any(String),
        label: expect.any(String),
        component: expect.any(String)
      });
    });

    it('should create valid action data', () => {
      const actionData = createTestActionData('people', 'complete');
      
      expect(actionData).toMatchObject({
        id: expect.any(String),
        type: 'complete',
        recordId: expect.any(String),
        recordType: 'people'
      });
    });

    it('should create valid context data', () => {
      const contextData = createTestContextData('people');
      
      expect(contextData).toMatchObject({
        user: expect.any(Object),
        workspace: expect.any(Object),
        record: expect.any(Object),
        navigation: expect.any(Object),
        tabs: expect.any(Array)
      });
    });
  });

  describe('Record Type Specific Factories', () => {
    it('should create people-specific record data', () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      expect(props.record).toMatchObject({
        fullName: expect.any(String),
        email: expect.any(String),
        jobTitle: expect.any(String)
      });
    });

    it('should create company-specific record data', () => {
      const props = createTestUniversalRecordTemplateProps('companies');
      
      expect(props.record).toMatchObject({
        name: expect.any(String),
        website: expect.any(String),
        industry: expect.any(String)
      });
    });

    it('should create lead-specific record data', () => {
      const props = createTestUniversalRecordTemplateProps('leads');
      
      expect(props.record).toMatchObject({
        status: 'LEAD'
      });
    });

    it('should create prospect-specific record data', () => {
      const props = createTestUniversalRecordTemplateProps('prospects');
      
      expect(props.record).toMatchObject({
        status: 'PROSPECT'
      });
    });

    it('should create opportunity-specific record data', () => {
      const props = createTestUniversalRecordTemplateProps('opportunities');
      
      expect(props.record).toMatchObject({
        status: 'OPPORTUNITY',
        opportunityStage: expect.any(String),
        opportunityAmount: expect.any(Number)
      });
    });

    it('should create client-specific record data', () => {
      const props = createTestUniversalRecordTemplateProps('clients');
      
      expect(props.record).toMatchObject({
        status: 'CLIENT'
      });
    });

    it('should create speedrun-specific record data', () => {
      const props = createTestUniversalRecordTemplateProps('speedrun');
      
      expect(props.record).toMatchObject({
        globalRank: expect.any(Number),
        status: 'LEAD'
      });
    });
  });

  describe('Navigation Data Validation', () => {
    it('should create valid navigation data for first record', () => {
      const navigationData = createTestNavigationData('people', 0);
      
      expect(navigationData.currentIndex).toBe(0);
      expect(navigationData.previousRecord).toBeNull();
      expect(navigationData.nextRecord).toBeDefined();
    });

    it('should create valid navigation data for last record', () => {
      const navigationData = createTestNavigationData('people', 9);
      
      expect(navigationData.currentIndex).toBe(9);
      expect(navigationData.previousRecord).toBeDefined();
      expect(navigationData.nextRecord).toBeNull();
    });

    it('should create valid navigation data for middle record', () => {
      const navigationData = createTestNavigationData('people', 5);
      
      expect(navigationData.currentIndex).toBe(5);
      expect(navigationData.previousRecord).toBeDefined();
      expect(navigationData.nextRecord).toBeDefined();
    });
  });

  describe('Tab Configuration Validation', () => {
    it('should create valid tab config for people', () => {
      const tabConfig = createTestTabConfig('people');
      
      expect(tabConfig).toContainEqual(
        expect.objectContaining({
          id: 'profile',
          label: 'Profile',
          component: 'ProfileTab'
        })
      );
      expect(tabConfig).toContainEqual(
        expect.objectContaining({
          id: 'career',
          label: 'Career',
          component: 'CareerTab'
        })
      );
    });

    it('should create valid tab config for companies', () => {
      const tabConfig = createTestTabConfig('companies');
      
      expect(tabConfig).toContainEqual(
        expect.objectContaining({
          id: 'company',
          label: 'Company',
          component: 'CompanyTab'
        })
      );
      expect(tabConfig).toContainEqual(
        expect.objectContaining({
          id: 'contacts',
          label: 'Contacts',
          component: 'ContactsTab'
        })
      );
    });

    it('should create valid tab config for speedrun', () => {
      const tabConfig = createTestTabConfig('speedrun');
      
      expect(tabConfig).toContainEqual(
        expect.objectContaining({
          id: 'overview',
          label: 'Overview',
          component: 'SpeedrunOverviewTab'
        })
      );
      expect(tabConfig).toContainEqual(
        expect.objectContaining({
          id: 'notes',
          label: 'Notes',
          component: 'NotesTab'
        })
      );
    });
  });

  describe('Action Data Validation', () => {
    it('should create valid complete action data', () => {
      const actionData = createTestActionData('people', 'complete');
      
      expect(actionData).toMatchObject({
        type: 'complete',
        status: 'completed',
        notes: expect.any(String),
        outcome: 'positive'
      });
    });

    it('should create valid update action data', () => {
      const actionData = createTestActionData('people', 'update');
      
      expect(actionData).toMatchObject({
        type: 'update',
        status: 'updated',
        field: expect.any(String),
        oldValue: expect.any(String),
        newValue: expect.any(String)
      });
    });

    it('should create valid delete action data', () => {
      const actionData = createTestActionData('people', 'delete');
      
      expect(actionData).toMatchObject({
        type: 'delete',
        status: 'deleted',
        notes: expect.any(String)
      });
    });
  });

  describe('Context Data Validation', () => {
    it('should create valid context data with user info', () => {
      const contextData = createTestContextData('people');
      
      expect(contextData.user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        name: expect.any(String)
      });
    });

    it('should create valid context data with workspace info', () => {
      const contextData = createTestContextData('people');
      
      expect(contextData.workspace).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        settings: expect.any(Object)
      });
    });

    it('should create valid context data with record info', () => {
      const contextData = createTestContextData('people');
      
      expect(contextData.record).toBeDefined();
      expect(contextData.navigation).toBeDefined();
      expect(contextData.tabs).toBeDefined();
    });
  });

  describe('Factory Override Functionality', () => {
    it('should allow overriding record page props', () => {
      const props = createTestRecordPageProps('people', {
        slug: 'custom-slug',
        standalone: true
      });
      
      expect(props).toMatchObject({
        section: 'people',
        slug: 'custom-slug',
        standalone: true
      });
    });

    it('should allow overriding universal record template props', () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 5,
        totalRecords: 20
      });
      
      expect(props).toMatchObject({
        recordType: 'people',
        recordIndex: 5,
        totalRecords: 20
      });
    });

    it('should allow overriding speedrun record template props', () => {
      const props = createTestSpeedrunRecordTemplateProps({
        personIndex: 10,
        totalPersons: 100
      });
      
      expect(props).toMatchObject({
        personIndex: 10,
        totalPersons: 100
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent record IDs across related data', () => {
      const recordId = 'test-record-123';
      const props = createTestUniversalRecordTemplateProps('people', {
        record: { id: recordId }
      });
      
      expect(props.record.id).toBe(recordId);
    });

    it('should maintain consistent user IDs across related data', () => {
      const userId = 'test-user-123';
      const contextData = createTestContextData('people');
      
      expect(contextData.user.id).toBeDefined();
      expect(typeof contextData.user.id).toBe('string');
    });

    it('should maintain consistent workspace IDs across related data', () => {
      const contextData = createTestContextData('people');
      
      expect(contextData.workspace.id).toBeDefined();
      expect(typeof contextData.workspace.id).toBe('string');
    });
  });
});
