/**
 * Company Testing Utilities
 * 
 * Shared helpers and utilities for testing company creation and management
 */

import { Company } from '@/types/company';

// Test user for authentication
export const TEST_USER = {
  id: '01K1VBYZG41K9QA0D9CF06KNRG',
  email: 'ross@adrata.com',
  name: 'Ross',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
};

// Mock company data factory
export function createValidCompanyData(overrides: Partial<Company> = {}): Company {
  return {
    id: 'test-company-id',
    name: 'Test Company',
    website: 'https://testcompany.com',
    industry: 'Technology',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    workspaceId: TEST_USER.workspaceId,
    mainSellerId: TEST_USER.id,
    ...overrides,
  };
}

// Mock invalid company data for testing validation
export function createInvalidCompanyData(): Partial<Company> {
  return {
    name: '', // Empty name should fail validation
    website: 'invalid-url', // Invalid URL format
  };
}

// Mock company creation API response
export function mockCompanyCreationResponse(company: Company) {
  return {
    success: true,
    data: company,
    meta: {
      message: 'Company created successfully',
      timestamp: new Date().toISOString(),
    },
  };
}

// Mock company creation error response
export function mockCompanyCreationError(error: string) {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

// Mock company search response
export function mockCompanySearchResponse(companies: Company[]) {
  return {
    success: true,
    data: companies,
    meta: {
      pagination: {
        page: 1,
        limit: 10,
        totalCount: companies.length,
        totalPages: 1,
      },
    },
  };
}

// Setup function for company creation tests
export function setupCompanyCreationTest() {
  // Mock authFetch for company API calls
  const mockAuthFetch = jest.fn();
  
  // Default successful company creation
  mockAuthFetch.mockImplementation((url: string, options?: any) => {
    if (url.includes('/api/v1/companies') && options?.method === 'POST') {
      const companyData = options.body ? JSON.parse(options.body) : {};
      const company = createValidCompanyData(companyData);
      return Promise.resolve(mockCompanyCreationResponse(company));
    }
    
    if (url.includes('/api/v1/companies?search=')) {
      const companies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
        createValidCompanyData({ id: '2', name: 'Beta Inc' }),
      ];
      return Promise.resolve(mockCompanySearchResponse(companies));
    }
    
    return Promise.resolve({ success: true, data: [] });
  });

  return {
    mockAuthFetch,
    createValidCompanyData,
    createInvalidCompanyData,
    mockCompanyCreationResponse,
    mockCompanyCreationError,
    mockCompanySearchResponse,
  };
}

// Verify company was created correctly
export function verifyCompanyCreated(company: Company, expectedData: Partial<Company>) {
  expect(company).toBeDefined();
  expect(company.id).toBeDefined();
  expect(company.name).toBe(expectedData.name);
  expect(company.workspaceId).toBe(TEST_USER.workspaceId);
  expect(company.mainSellerId).toBe(TEST_USER.id);
  expect(company.createdAt).toBeDefined();
  expect(company.updatedAt).toBeDefined();
}

// Mock company API for integration tests
export function mockCompanyAPI() {
  const companies: Company[] = [];
  
  return {
    // Mock GET /api/v1/companies
    getCompanies: jest.fn().mockImplementation((params: any) => {
      const { search, page = 1, limit = 10 } = params;
      let filteredCompanies = companies;
      
      if (search) {
        filteredCompanies = companies.filter(company =>
          company.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);
      
      return Promise.resolve({
        success: true,
        data: paginatedCompanies,
        meta: {
          pagination: {
            page,
            limit,
            totalCount: filteredCompanies.length,
            totalPages: Math.ceil(filteredCompanies.length / limit),
          },
        },
      });
    }),
    
    // Mock POST /api/v1/companies
    createCompany: jest.fn().mockImplementation((companyData: Partial<Company>) => {
      if (!companyData.name || companyData.name.trim() === '') {
        return Promise.reject({
          success: false,
          error: 'Company name is required and must be a non-empty string',
        });
      }
      
      const newCompany = createValidCompanyData({
        ...companyData,
        id: `company-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      companies.push(newCompany);
      
      return Promise.resolve(mockCompanyCreationResponse(newCompany));
    }),
    
    // Mock GET /api/v1/companies/[id]
    getCompany: jest.fn().mockImplementation((id: string) => {
      const company = companies.find(c => c.id === id);
      if (!company) {
        return Promise.reject({
          success: false,
          error: 'Company not found',
        });
      }
      
      return Promise.resolve({
        success: true,
        data: company,
      });
    }),
    
    // Mock PATCH /api/v1/companies/[id]
    updateCompany: jest.fn().mockImplementation((id: string, updateData: Partial<Company>) => {
      const companyIndex = companies.findIndex(c => c.id === id);
      if (companyIndex === -1) {
        return Promise.reject({
          success: false,
          error: 'Company not found',
        });
      }
      
      companies[companyIndex] = {
        ...companies[companyIndex],
        ...updateData,
        updatedAt: new Date(),
      };
      
      return Promise.resolve({
        success: true,
        data: companies[companyIndex],
        meta: {
          message: 'Company updated successfully',
        },
      });
    }),
    
    // Mock DELETE /api/v1/companies/[id]
    deleteCompany: jest.fn().mockImplementation((id: string, mode: 'soft' | 'hard' = 'soft') => {
      const companyIndex = companies.findIndex(c => c.id === id);
      if (companyIndex === -1) {
        return Promise.reject({
          success: false,
          error: 'Company not found',
        });
      }
      
      if (mode === 'hard') {
        companies.splice(companyIndex, 1);
      } else {
        companies[companyIndex] = {
          ...companies[companyIndex],
          deletedAt: new Date(),
        };
      }
      
      return Promise.resolve({
        success: true,
        meta: {
          message: `Company ${mode === 'hard' ? 'permanently ' : ''}deleted successfully`,
          mode,
        },
      });
    }),
    
    // Helper to get all companies (for testing)
    getAllCompanies: () => companies,
    
    // Helper to clear companies (for test cleanup)
    clearCompanies: () => {
      companies.length = 0;
    },
  };
}

// Test data for different company creation scenarios
export const COMPANY_TEST_SCENARIOS = {
  minimal: {
    name: 'Minimal Company',
    description: 'Company with only required fields',
    data: { name: 'Minimal Company' },
  },
  
  full: {
    name: 'Full Company',
    description: 'Company with all optional fields',
    data: {
      name: 'Full Company',
      website: 'https://fullcompany.com',
      industry: 'Technology',
      status: 'ACTIVE',
    },
  },
  
  withWebsite: {
    name: 'Company with Website',
    description: 'Company with website field',
    data: {
      name: 'Website Company',
      website: 'https://websitecompany.com',
    },
  },
  
  invalidName: {
    name: 'Invalid Name',
    description: 'Company with empty name (should fail)',
    data: { name: '' },
    shouldFail: true,
  },
  
  invalidWebsite: {
    name: 'Invalid Website',
    description: 'Company with invalid website format',
    data: {
      name: 'Invalid Website Company',
      website: 'not-a-valid-url',
    },
  },
  
  specialCharacters: {
    name: 'Special Characters',
    description: 'Company name with special characters',
    data: { name: 'Company & Associates, LLC' },
  },
  
  longName: {
    name: 'Long Name',
    description: 'Company with very long name',
    data: { name: 'A'.repeat(200) },
  },
};

// Mock error scenarios for testing
export const COMPANY_ERROR_SCENARIOS = {
  networkError: {
    name: 'Network Error',
    error: 'Network request failed',
    type: 'network',
  },
  
  validationError: {
    name: 'Validation Error',
    error: 'Company name is required and must be a non-empty string',
    type: 'validation',
  },
  
  duplicateError: {
    name: 'Duplicate Error',
    error: 'A company with this name already exists',
    type: 'duplicate',
  },
  
  serverError: {
    name: 'Server Error',
    error: 'Internal server error',
    type: 'server',
  },
  
  unauthorizedError: {
    name: 'Unauthorized Error',
    error: 'Authentication required',
    type: 'auth',
  },
};

// Helper to create test companies for different contexts
export function createTestCompaniesForContext(context: 'modal' | 'selector' | 'inline') {
  const baseCompanies = [
    createValidCompanyData({ id: '1', name: 'Acme Corporation' }),
    createValidCompanyData({ id: '2', name: 'Beta Industries' }),
    createValidCompanyData({ id: '3', name: 'Gamma Solutions' }),
  ];
  
  switch (context) {
    case 'modal':
      return baseCompanies.map(company => ({
        ...company,
        // Modal might need additional fields
        notes: 'Test company for modal context',
      }));
      
    case 'selector':
      return baseCompanies.map(company => ({
        ...company,
        // Selector might need search-friendly data
        domain: company.website?.replace('https://', '').replace('http://', ''),
      }));
      
    case 'inline':
      return baseCompanies.map(company => ({
        ...company,
        // Inline editing might need different structure
        displayName: company.name,
      }));
      
    default:
      return baseCompanies;
  }
}

// Performance testing helpers
export function createLargeCompanyDataset(count: number = 1000): Company[] {
  const companies: Company[] = [];
  
  for (let i = 0; i < count; i++) {
    companies.push(createValidCompanyData({
      id: `company-${i}`,
      name: `Test Company ${i}`,
      website: `https://testcompany${i}.com`,
    }));
  }
  
  return companies;
}

// Test cleanup helper
export function cleanupCompanyTests() {
  // Clear any global state
  jest.clearAllMocks();
  
  // Reset any cached data
  if (typeof window !== 'undefined') {
    // Clear localStorage if needed
    localStorage.clear();
  }
}

// Export all helpers
export default {
  TEST_USER,
  createValidCompanyData,
  createInvalidCompanyData,
  mockCompanyCreationResponse,
  mockCompanyCreationError,
  mockCompanySearchResponse,
  setupCompanyCreationTest,
  verifyCompanyCreated,
  mockCompanyAPI,
  COMPANY_TEST_SCENARIOS,
  COMPANY_ERROR_SCENARIOS,
  createTestCompaniesForContext,
  createLargeCompanyDataset,
  cleanupCompanyTests,
};
