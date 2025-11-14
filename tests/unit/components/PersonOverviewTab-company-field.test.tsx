/**
 * PersonOverviewTab - Company Field Tests
 * 
 * Tests to verify that PersonOverviewTab correctly displays company names
 * even when company relation is null but companyId exists
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PersonOverviewTab } from '@/frontend/components/pipeline/tabs/PersonOverviewTab';

// Mock the InlineEditField component
jest.mock('@/frontend/components/pipeline/InlineEditField', () => ({
  InlineEditField: ({ value, field, className }: { value: any; field: string; className?: string }) => (
    <span data-testid={`inline-edit-${field}`} className={className}>
      {value || 'No data available'}
    </span>
  )
}));

// Mock the CompanyDetailSkeleton
jest.mock('@/platform/ui/components/Loader', () => ({
  CompanyDetailSkeleton: ({ message }: { message: string }) => (
    <div data-testid="person-skeleton">{message}</div>
  )
}));

// Mock authFetch
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

// Mock RecordContext
jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: jest.fn(() => ({
    currentRecord: null,
  })),
}));

describe('PersonOverviewTab - Company Field Display', () => {
  const mockOnSave = jest.fn();
  let mockAuthFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { authFetch } = require('@/platform/api-fetch');
    mockAuthFetch = authFetch;
  });

  describe('Company Field with Null Relation', () => {
    it('should display company name when companyId exists but company relation is null', async () => {
      const companyId = 'test-company-id';
      const companyName = 'Test Company';
      
      const record = {
        id: 'test-person-id',
        fullName: 'Test Person',
        companyId: companyId,
        company: null, // Company relation is null
        email: 'test@example.com',
        customFields: {},
      };

      // Mock successful company fetch
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: {
          id: companyId,
          name: companyName,
        },
      });

      render(
        <PersonOverviewTab
          recordType="people"
          record={record}
          onSave={mockOnSave}
        />
      );

      // Wait for company name to be fetched and displayed
      await waitFor(() => {
        const companyField = screen.getByTestId('inline-edit-company');
        expect(companyField).toBeInTheDocument();
        expect(companyField.textContent).toContain(companyName);
      });

      // Verify company was fetched
      expect(mockAuthFetch).toHaveBeenCalledWith(`/api/v1/companies/${companyId}`);
    });

    it('should not fetch company when company relation already exists', async () => {
      const companyId = 'test-company-id';
      const companyName = 'Existing Company';
      
      const record = {
        id: 'test-person-id',
        fullName: 'Test Person',
        companyId: companyId,
        company: {
          id: companyId,
          name: companyName,
        },
        email: 'test@example.com',
        customFields: {},
      };

      render(
        <PersonOverviewTab
          recordType="people"
          record={record}
          onSave={mockOnSave}
        />
      );

      // Wait a bit to ensure no fetch happens
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify company name is displayed from relation
      const companyField = screen.getByTestId('inline-edit-company');
      expect(companyField).toBeInTheDocument();
      expect(companyField.textContent).toContain(companyName);

      // Should NOT fetch company since relation exists
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });

    it('should handle company fetch failure gracefully', async () => {
      const companyId = 'test-company-id';
      
      const record = {
        id: 'test-person-id',
        fullName: 'Test Person',
        companyId: companyId,
        company: null,
        email: 'test@example.com',
        customFields: {},
      };

      // Mock failed company fetch
      mockAuthFetch.mockRejectedValue(new Error('Company not found'));

      render(
        <PersonOverviewTab
          recordType="people"
          record={record}
          onSave={mockOnSave}
        />
      );

      // Wait for component to handle the error
      await waitFor(() => {
        const companyField = screen.getByTestId('inline-edit-company');
        expect(companyField).toBeInTheDocument();
      });

      // Should still attempt to fetch
      expect(mockAuthFetch).toHaveBeenCalledWith(`/api/v1/companies/${companyId}`);
      
      // Company field should show "No data available" or null
      const companyField = screen.getByTestId('inline-edit-company');
      expect(companyField.textContent).toBe('No data available');
    });

    it('should use CoreSignal company name as fallback', () => {
      const coresignalCompanyName = 'CoreSignal Company';
      
      const record = {
        id: 'test-person-id',
        fullName: 'Test Person',
        companyId: null,
        company: null,
        email: 'test@example.com',
        customFields: {
          coresignal: {
            experience: [
              {
                active_experience: 1,
                company_name: coresignalCompanyName,
              },
            ],
          },
        },
      };

      render(
        <PersonOverviewTab
          recordType="people"
          record={record}
          onSave={mockOnSave}
        />
      );

      const companyField = screen.getByTestId('inline-edit-company');
      expect(companyField).toBeInTheDocument();
      expect(companyField.textContent).toContain(coresignalCompanyName);
    });

    it('should reset fetched company name when record changes', async () => {
      const companyId1 = 'company-1';
      const companyId2 = 'company-2';
      const companyName1 = 'Company 1';
      const companyName2 = 'Company 2';
      
      const record1 = {
        id: 'person-1',
        fullName: 'Person 1',
        companyId: companyId1,
        company: null,
        email: 'person1@example.com',
        customFields: {},
      };

      const record2 = {
        id: 'person-2',
        fullName: 'Person 2',
        companyId: companyId2,
        company: null,
        email: 'person2@example.com',
        customFields: {},
      };

      mockAuthFetch
        .mockResolvedValueOnce({
          success: true,
          data: { id: companyId1, name: companyName1 },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { id: companyId2, name: companyName2 },
        });

      const { rerender } = render(
        <PersonOverviewTab
          recordType="people"
          record={record1}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith(`/api/v1/companies/${companyId1}`);
      });

      // Change record
      rerender(
        <PersonOverviewTab
          recordType="people"
          record={record2}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith(`/api/v1/companies/${companyId2}`);
      });

      const companyField = screen.getByTestId('inline-edit-company');
      expect(companyField.textContent).toContain(companyName2);
    });
  });
});

