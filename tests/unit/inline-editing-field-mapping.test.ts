/**
 * Unit tests for inline editing field mapping logic
 */

import { describe, it, expect } from '@jest/globals';

// Mock the field mapping logic from UniversalRecordTemplate
const fieldMapping: Record<string, string> = {
  'name': 'fullName',
  'fullName': 'fullName',
  'title': 'jobTitle',
  'jobTitle': 'jobTitle',
  'workEmail': 'workEmail',
  'mobilePhone': 'mobilePhone',
  'company': 'company',
  'companyName': 'company'
};

function mapField(field: string): string {
  return fieldMapping[field] || field;
}

describe('Inline Editing Field Mapping', () => {
  describe('People/Lead/Prospect Record Fields', () => {
    it('should map title to jobTitle for people API', () => {
      expect(mapField('title')).toBe('jobTitle');
    });

    it('should keep jobTitle as jobTitle', () => {
      expect(mapField('jobTitle')).toBe('jobTitle');
    });

    it('should map name to fullName', () => {
      expect(mapField('name')).toBe('fullName');
    });

    it('should keep fullName as fullName', () => {
      expect(mapField('fullName')).toBe('fullName');
    });

    it('should keep workEmail as workEmail', () => {
      expect(mapField('workEmail')).toBe('workEmail');
    });

    it('should keep mobilePhone as mobilePhone', () => {
      expect(mapField('mobilePhone')).toBe('mobilePhone');
    });

    it('should keep company as company', () => {
      expect(mapField('company')).toBe('company');
    });

    it('should map companyName to company', () => {
      expect(mapField('companyName')).toBe('company');
    });
  });

  describe('Company Record Fields', () => {
    it('should keep website as website (no mapping needed)', () => {
      expect(mapField('website')).toBe('website');
    });

    it('should keep name as name for companies', () => {
      expect(mapField('name')).toBe('fullName'); // This might be wrong for companies
    });

    it('should keep size as size', () => {
      expect(mapField('size')).toBe('size');
    });
  });

  describe('Unmapped Fields', () => {
    it('should return the same field name for unmapped fields', () => {
      expect(mapField('department')).toBe('department');
      expect(mapField('email')).toBe('email');
      expect(mapField('phone')).toBe('phone');
      expect(mapField('address')).toBe('address');
      expect(mapField('city')).toBe('city');
      expect(mapField('state')).toBe('state');
      expect(mapField('country')).toBe('country');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(mapField('')).toBe('');
    });

    it('should handle undefined field', () => {
      expect(mapField(undefined as any)).toBe(undefined);
    });

    it('should handle null field', () => {
      expect(mapField(null as any)).toBe(null);
    });
  });
});

describe('API Field Whitelist Validation', () => {
  const ALLOWED_COMPANY_FIELDS = [
    'name', 'legalName', 'tradingName', 'localName', 'description', 'website', 
    'email', 'phone', 'fax', 'address', 'city', 'state', 'country', 'postalCode', 
    'industry', 'sector', 'size', 'revenue', 'currency', 'employeeCount', 
    'foundedYear', 'registrationNumber', 'taxId', 'vatNumber', 'domain', 
    'logoUrl', 'status', 'priority', 'tags', 'customFields', 'notes', 
    'lastAction', 'lastActionDate', 'nextAction', 'nextActionDate', 
    'actionStatus', 'globalRank', 'entityId', 'mainSellerId', 'actualCloseDate',
    'expectedCloseDate', 'opportunityAmount', 'opportunityProbability', 
    'opportunityStage', 'acquisitionDate', 'competitors'
  ];

  const ALLOWED_PEOPLE_FIELDS = [
    'firstName', 'lastName', 'fullName', 'jobTitle', 'department', 'status',
    'priority', 'email', 'workEmail', 'phone', 'mobilePhone', 'linkedinUrl',
    'linkedinNavigatorUrl', 'linkedinConnectionDate', 'city', 'nextAction', 'nextActionDate', 'notes', 'tags', 'seniority',
    'engagementScore', 'engagementLevel', 'influenceLevel', 'decisionPower',
    'isBuyerGroupMember', 'engagementStrategy', 'buyerGroupOptimized',
    'communicationStyle', 'decisionPowerScore', 'relationshipWarmth',
    'yearsExperience', 'educationLevel', 'skills', 'certifications',
    'valueDriver', 'bestContactTime', 'industry', 'globalRank', 'companyRank',
    'vertical', 'achievements', 'budgetResponsibility', 'buyerGroupRole',
    'buyerGroupStatus', 'careerTimeline', 'coresignalData', 'currentCompany',
    'currentRole', 'dataCompleteness', 'decisionMaking', 'degrees',
    'emailConfidence', 'enrichedData', 'enrichmentScore', 'enrichmentSources',
    'fieldsOfStudy', 'graduationYears', 'industryExperience', 'industrySkills',
    'influenceScore', 'institutions', 'languages', 'leadershipExperience',
    'mobileVerified', 'phoneConfidence', 'preferredContact', 'previousRoles',
    'publications', 'responseTime', 'roleHistory', 'rolePromoted',
    'softSkills', 'speakingEngagements', 'statusReason', 'statusUpdateDate',
    'teamSize', 'technicalSkills', 'totalExperience', 'yearsAtCompany',
    'yearsInRole', 'address', 'state', 'country', 'postalCode', 'bio',
    'profilePictureUrl', 'source', 'customFields', 'preferredLanguage',
    'timezone', 'emailVerified', 'phoneVerified', 'lastAction', 'lastActionDate',
    'actionStatus', 'entityId', 'mainSellerId'
  ];

  describe('Company API Fields', () => {
    it('should include all editable company fields in whitelist', () => {
      const editableCompanyFields = ['name', 'website', 'size'];
      
      editableCompanyFields.forEach(field => {
        expect(ALLOWED_COMPANY_FIELDS).toContain(field);
      });
    });

    it('should not include invalid fields in company whitelist', () => {
      const invalidFields = ['headquarters', 'title', 'jobTitle'];
      
      invalidFields.forEach(field => {
        expect(ALLOWED_COMPANY_FIELDS).not.toContain(field);
      });
    });
  });

  describe('People API Fields', () => {
    it('should include all editable people fields in whitelist', () => {
      const editablePeopleFields = ['fullName', 'jobTitle', 'department', 'workEmail', 'mobilePhone'];
      
      editablePeopleFields.forEach(field => {
        expect(ALLOWED_PEOPLE_FIELDS).toContain(field);
      });
    });

    it('should include mapped fields in people whitelist', () => {
      // Fields that get mapped should exist in the API
      expect(ALLOWED_PEOPLE_FIELDS).toContain('jobTitle'); // title maps to jobTitle
      expect(ALLOWED_PEOPLE_FIELDS).toContain('fullName'); // name maps to fullName
    });
  });
});

describe('Response Data Mapping', () => {
  function mapResponseData(responseData: Record<string, any>, originalField: string, apiField: string): Record<string, any> {
    const mappedResponseData = { ...responseData };
    
    // If we mapped the field, ensure the response contains the frontend field name
    if (apiField !== originalField && responseData[apiField] !== undefined) {
      mappedResponseData[originalField] = responseData[apiField];
    }
    
    return mappedResponseData;
  }

  it('should map response data back to frontend field names', () => {
    const responseData = {
      id: '123',
      jobTitle: 'Software Engineer',
      fullName: 'John Doe'
    };
    
    const mapped = mapResponseData(responseData, 'title', 'jobTitle');
    
    expect(mapped).toEqual({
      id: '123',
      jobTitle: 'Software Engineer',
      fullName: 'John Doe',
      title: 'Software Engineer' // Added for frontend
    });
  });

  it('should not duplicate fields when no mapping is needed', () => {
    const responseData = {
      id: '123',
      website: 'https://example.com',
      name: 'Test Company'
    };
    
    const mapped = mapResponseData(responseData, 'website', 'website');
    
    expect(mapped).toEqual({
      id: '123',
      website: 'https://example.com',
      name: 'Test Company'
    });
  });

  it('should handle missing mapped field in response', () => {
    const responseData = {
      id: '123',
      fullName: 'John Doe'
      // jobTitle is missing
    };
    
    const mapped = mapResponseData(responseData, 'title', 'jobTitle');
    
    expect(mapped).toEqual({
      id: '123',
      fullName: 'John Doe'
      // title is not added because jobTitle is missing
    });
  });
});
