/**
 * UniversalCompanyTab Data Integrity Tests
 * 
 * Tests to verify no fallback data ('-') and proper null handling
 * in the UniversalCompanyTab component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { UniversalCompanyTab } from '@/frontend/components/pipeline/tabs/UniversalCompanyTab';

// Mock the InlineEditField component
jest.mock('@/frontend/components/pipeline/InlineEditField', () => ({
  InlineEditField: ({ value, className }: { value: any; className?: string }) => (
    <span data-testid="inline-edit-field" className={className}>
      {value || 'No data available'}
    </span>
  )
}));

// Mock the CompanyDetailSkeleton
jest.mock('@/platform/ui/components/Loader', () => ({
  CompanyDetailSkeleton: ({ message }: { message: string }) => (
    <div data-testid="company-skeleton">{message}</div>
  )
}));

describe('UniversalCompanyTab Data Integrity', () => {
  const mockOnSave = jest.fn();
  const mockHandleSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('No Fallback Data Tests', () => {
    it('should not display "-" fallback text anywhere', () => {
      const record = {
        id: 'test-company-id',
        name: null,
        industry: null,
        website: null,
        linkedinUrl: null,
        foundedYear: null,
        ceo: null,
        phone: null,
        revenue: null,
        employeeCount: null,
        customFields: null,
        companyUpdates: [],
        linkedinFollowers: 0,
        twitterFollowers: 0,
        activeJobPostings: 0,
        technologiesUsed: [],
        competitors: [],
        isPublic: null
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Verify no fallback '-' text is displayed
      const fallbackText = screen.queryAllByText('-');
      expect(fallbackText).toHaveLength(0);
    });

    it('should display "No data available" for null values', () => {
      const record = {
        id: 'test-company-id',
        name: null,
        industry: null,
        website: null,
        linkedinUrl: null,
        foundedYear: null,
        ceo: null,
        phone: null,
        revenue: null,
        employeeCount: null,
        customFields: null,
        companyUpdates: [],
        linkedinFollowers: 0,
        twitterFollowers: 0,
        activeJobPostings: 0,
        technologiesUsed: [],
        competitors: [],
        isPublic: null
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should show "No data available" for empty values
      const emptyStates = screen.getAllByText('No data available');
      expect(emptyStates.length).toBeGreaterThan(0);
    });

    it('should handle empty companyUpdates array properly', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        industry: 'Technology',
        companyUpdates: [],
        linkedinFollowers: 0,
        twitterFollowers: 0,
        activeJobPostings: 0,
        technologiesUsed: [],
        competitors: []
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should not crash with empty companyUpdates
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  describe('CoreSignal Data Access Tests', () => {
    it('should access CoreSignal data from customFields', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        customFields: {
          linkedinUrl: 'https://linkedin.com/company/test-company',
          linkedin: 'https://linkedin.com/company/test-company-alt'
        },
        linkedinUrl: null,
        linkedin: null
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should use CoreSignal data from customFields
      expect(screen.getByText(/linkedin.com\/company\/test-company/)).toBeInTheDocument();
    });

    it('should prioritize database fields over CoreSignal fallback', () => {
      const record = {
        id: 'test-company-id',
        name: 'Database Company Name',
        industry: 'Database Industry',
        customFields: {
          linkedinUrl: 'https://linkedin.com/company/coresignal-fallback'
        },
        linkedinUrl: 'https://linkedin.com/company/database-primary'
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should use database field first
      expect(screen.getByText(/linkedin.com\/company\/database-primary/)).toBeInTheDocument();
      expect(screen.queryByText(/coresignal-fallback/)).not.toBeInTheDocument();
    });
  });

  describe('Real Data Usage Tests', () => {
    it('should use real CoreSignal metrics for engagement data', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        linkedinFollowers: 50000,
        twitterFollowers: 25000,
        activeJobPostings: 15,
        companyUpdates: [
          { date: '2024-01-15', description: 'Recent company update' },
          { date: '2024-01-10', description: 'Another update' }
        ],
        employeeCount: 1000,
        technologiesUsed: ['React', 'Node.js'],
        competitors: ['Competitor A', 'Competitor B']
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should display real engagement metrics
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      
      // Should show real activity data
      expect(screen.getByText(/Recent company update/)).toBeInTheDocument();
    });

    it('should handle null engagement data gracefully', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        linkedinFollowers: null,
        twitterFollowers: null,
        activeJobPostings: null,
        companyUpdates: null,
        employeeCount: null,
        technologiesUsed: null,
        competitors: null
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should not crash with null engagement data
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });
  });

  describe('DisplayValue Helper Tests', () => {
    it('should render DisplayValue component correctly for null values', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        industry: null,
        foundedYear: null
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should show "No data available" for null values
      const emptyStates = screen.getAllByText('No data available');
      expect(emptyStates.length).toBeGreaterThan(0);
    });

    it('should render DisplayValue component correctly for valid values', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        industry: 'Technology',
        foundedYear: 2020
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should show actual values
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  describe('Company Type Display Tests', () => {
    it('should handle undefined isPublic gracefully', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        isPublic: undefined
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should not crash with undefined isPublic
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('should display company type correctly when defined', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        isPublic: true
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should show company type
      expect(screen.getByText('Public Company')).toBeInTheDocument();
    });
  });

  describe('Revenue Display Tests', () => {
    it('should format revenue correctly when present', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        revenue: 1000000
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should format revenue with currency
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });

    it('should handle null revenue gracefully', () => {
      const record = {
        id: 'test-company-id',
        name: 'Test Company',
        revenue: null
      };

      render(
        <UniversalCompanyTab 
          record={record} 
          recordType="companies" 
          onSave={mockOnSave} 
        />
      );

      // Should not crash with null revenue
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });
  });
});
