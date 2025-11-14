/**
 * UniversalPeopleTab - CompanyId Extraction Tests
 * 
 * Tests to verify that UniversalPeopleTab correctly extracts companyId
 * even when company relation is null
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UniversalPeopleTab } from '@/frontend/components/pipeline/tabs/UniversalPeopleTab';

// Mock authFetch
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock storage
jest.mock('@/platform/utils/storage/safeLocalStorage', () => ({
  safeGetItem: jest.fn(() => null),
  safeSetItem: jest.fn(),
}));

describe('UniversalPeopleTab - CompanyId Extraction', () => {
  const mockOnSave = jest.fn();
  let mockAuthFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { authFetch } = require('@/platform/api-fetch');
    mockAuthFetch = authFetch;
  });

  describe('CompanyId Extraction for People Records', () => {
    it('should extract companyId from record even when company relation is null', async () => {
      const companyId = 'test-company-id';
      
      const record = {
        id: 'test-person-id',
        fullName: 'Test Person',
        companyId: companyId,
        company: null, // Company relation is null
        email: 'test@example.com',
      };

      // Mock people API response
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [],
        meta: { pagination: { totalCount: 0 } },
      });

      render(
        <UniversalPeopleTab
          recordType="people"
          record={record}
          onSave={mockOnSave}
        />
      );

      // Wait for component to extract companyId and fetch people
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });

      // Verify the API was called with the correct companyId
      const calls = mockAuthFetch.mock.calls;
      const peopleCall = calls.find((call: any[]) => 
        call[0]?.includes('/api/v1/people') && call[0]?.includes(`companyId=${companyId}`)
      );
      
      expect(peopleCall).toBeDefined();
    });

    it('should extract companyId when company relation exists', async () => {
      const companyId = 'test-company-id';
      
      const record = {
        id: 'test-person-id',
        fullName: 'Test Person',
        companyId: companyId,
        company: {
          id: companyId,
          name: 'Test Company',
        },
        email: 'test@example.com',
      };

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [],
        meta: { pagination: { totalCount: 0 } },
      });

      render(
        <UniversalPeopleTab
          recordType="people"
          record={record}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });

      // Should still use companyId from record
      const calls = mockAuthFetch.mock.calls;
      const peopleCall = calls.find((call: any[]) => 
        call[0]?.includes('/api/v1/people') && call[0]?.includes(`companyId=${companyId}`)
      );
      
      expect(peopleCall).toBeDefined();
    });

    it('should handle missing companyId gracefully', async () => {
      const record = {
        id: 'test-person-id',
        fullName: 'Test Person',
        companyId: null,
        company: null,
        email: 'test@example.com',
      };

      render(
        <UniversalPeopleTab
          recordType="people"
          record={record}
          onSave={mockOnSave}
        />
      );

      // Should not fetch people when companyId is missing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show error or loading state
      expect(screen.getByText(/unable to load people|invalid company/i)).toBeInTheDocument();
    });

    it('should extract companyId for company records using record.id', async () => {
      const companyId = 'test-company-id';
      
      const record = {
        id: companyId, // For company records, id is the companyId
        name: 'Test Company',
        email: 'company@example.com',
      };

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [],
        meta: { pagination: { totalCount: 0 } },
      });

      render(
        <UniversalPeopleTab
          recordType="companies"
          record={record}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });

      // Should use record.id as companyId for company records
      const calls = mockAuthFetch.mock.calls;
      const peopleCall = calls.find((call: any[]) => 
        call[0]?.includes('/api/v1/people') && call[0]?.includes(`companyId=${companyId}`)
      );
      
      expect(peopleCall).toBeDefined();
    });
  });
});

