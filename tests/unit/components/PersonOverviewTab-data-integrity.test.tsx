/**
 * PersonOverviewTab Data Integrity Tests
 * 
 * Tests to verify no fallback data ('-') and proper CoreSignal data access
 * in the PersonOverviewTab component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PersonOverviewTab } from '@/frontend/components/pipeline/tabs/PersonOverviewTab';

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
    <div data-testid="person-skeleton">{message}</div>
  )
}));

describe('PersonOverviewTab Data Integrity', () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('No Fallback Data Tests', () => {
    it('should not display "-" fallback text anywhere', () => {
      const record = {
        id: 'test-person-id',
        fullName: null,
        name: null,
        jobTitle: null,
        title: null,
        email: null,
        phone: null,
        linkedin: null,
        linkedinNavigatorUrl: null,
        company: null,
        companyName: null,
        industry: null,
        department: null,
        location: null,
        customFields: {
          coresignal: null,
          coresignalData: null,
          coresignalProfile: null,
          enrichedData: null,
          influenceLevel: null,
          engagementStrategy: null,
          isBuyerGroupMember: false,
          buyerGroupOptimized: false
        },
        coresignalData: null,
        enrichedData: null,
        lastActionDate: null,
        lastAction: null,
        nextAction: null,
        nextActionDate: null,
        notes: null,
        status: null,
        source: null,
        seniority: null
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Verify no fallback '-' text is displayed
      const fallbackText = screen.queryAllByText('-');
      expect(fallbackText).toHaveLength(0);
    });

    it('should display "No data available" for null values', () => {
      const record = {
        id: 'test-person-id',
        fullName: null,
        name: null,
        jobTitle: null,
        title: null,
        email: null,
        phone: null,
        linkedin: null,
        company: null,
        customFields: {
          coresignal: null,
          coresignalData: null,
          coresignalProfile: null,
          enrichedData: null
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should show "No data available" for empty values
      const emptyStates = screen.getAllByText('No data available');
      expect(emptyStates.length).toBeGreaterThan(0);
    });
  });

  describe('CoreSignal Data Access Tests', () => {
    it('should access CoreSignal data from customFields.coresignal', () => {
      const record = {
        id: 'test-person-id',
        fullName: null,
        name: null,
        customFields: {
          coresignal: {
            full_name: 'John Doe',
            active_experience_title: 'Senior Engineer',
            primary_professional_email: 'john@example.com',
            phone: '+1234567890',
            linkedin_url: 'https://linkedin.com/in/johndoe',
            experience: [
              {
                active_experience: 1,
                company_name: 'Tech Corp',
                position_title: 'Senior Engineer',
                company_industry: 'Technology',
                department: 'Engineering'
              }
            ]
          }
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should use CoreSignal data from customFields.coresignal
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should access CoreSignal data from customFields.coresignalData', () => {
      const record = {
        id: 'test-person-id',
        fullName: null,
        name: null,
        customFields: {
          coresignalData: {
            full_name: 'Jane Smith',
            active_experience_title: 'Product Manager',
            primary_professional_email: 'jane@example.com'
          }
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should use CoreSignal data from customFields.coresignalData
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should prioritize database fields over CoreSignal fallback', () => {
      const record = {
        id: 'test-person-id',
        fullName: 'Database Name',
        name: 'Database Name Alt',
        jobTitle: 'Database Title',
        title: 'Database Title Alt',
        email: 'database@example.com',
        customFields: {
          coresignal: {
            full_name: 'CoreSignal Name',
            active_experience_title: 'CoreSignal Title',
            primary_professional_email: 'coresignal@example.com'
          }
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should use database fields first
      expect(screen.getByText('Database Name')).toBeInTheDocument();
      expect(screen.getByText('Database Title')).toBeInTheDocument();
      expect(screen.getByText('database@example.com')).toBeInTheDocument();
    });
  });

  describe('Company Data Access Tests', () => {
    it('should handle string company format', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        company: 'Tech Corp',
        customFields: {
          coresignal: {
            experience: [
              {
                active_experience: 1,
                company_name: 'CoreSignal Company'
              }
            ]
          }
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should use string company from database
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });

    it('should handle object company format', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        company: { name: 'Object Company' },
        companyName: 'Company Name Field',
        customFields: {
          coresignal: {
            experience: [
              {
                active_experience: 1,
                company_name: 'CoreSignal Company'
              }
            ]
          }
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should use object company name
      expect(screen.getByText('Object Company')).toBeInTheDocument();
    });

    it('should fallback to CoreSignal company data', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        company: null,
        companyName: null,
        customFields: {
          coresignal: {
            experience: [
              {
                active_experience: 1,
                company_name: 'CoreSignal Company'
              }
            ]
          }
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should use CoreSignal company data
      expect(screen.getByText('CoreSignal Company')).toBeInTheDocument();
    });
  });

  describe('Experience Data Tests', () => {
    it('should extract experience data from CoreSignal', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        customFields: {
          coresignal: {
            experience: [
              {
                active_experience: 1,
                position_title: 'Senior Engineer',
                company_name: 'Tech Corp',
                company_industry: 'Technology',
                department: 'Engineering',
                start_date: '2020-01-01',
                end_date: null
              },
              {
                active_experience: 0,
                position_title: 'Engineer',
                company_name: 'Previous Corp',
                company_industry: 'Technology',
                department: 'Engineering',
                start_date: '2018-01-01',
                end_date: '2019-12-31'
              }
            ],
            total_experience_duration_months: 60,
            inferred_skills: ['JavaScript', 'React', 'Node.js'],
            education: [
              {
                institution: 'University of Technology',
                degree: 'Bachelor of Science',
                field_of_study: 'Computer Science'
              }
            ]
          }
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should display current role
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  describe('Intelligence Data Tests', () => {
    it('should access intelligence data from customFields', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        customFields: {
          influenceLevel: 'High',
          engagementStrategy: 'Direct Outreach',
          isBuyerGroupMember: true,
          buyerGroupOptimized: true,
          decisionPower: 8,
          engagementLevel: 'Active'
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should display intelligence data
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Direct Outreach')).toBeInTheDocument();
    });

    it('should handle null intelligence data gracefully', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        customFields: {
          influenceLevel: null,
          engagementStrategy: null,
          isBuyerGroupMember: false,
          buyerGroupOptimized: false
        }
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should not crash with null intelligence data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Contact History Tests', () => {
    it('should handle null contact history gracefully', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        lastActionDate: null,
        lastAction: null,
        nextAction: null,
        nextActionDate: null,
        notes: null
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should not crash with null contact history
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display contact history when available', () => {
      const record = {
        id: 'test-person-id',
        name: 'John Doe',
        lastActionDate: '2024-01-15T10:00:00Z',
        lastAction: 'Email sent',
        nextAction: 'Follow up call',
        nextActionDate: '2024-01-20T14:00:00Z',
        notes: 'Interested in our product'
      };

      render(
        <PersonOverviewTab 
          record={record} 
          recordType="people" 
          onSave={mockOnSave} 
        />
      );

      // Should display contact history
      expect(screen.getByText('Email sent')).toBeInTheDocument();
      expect(screen.getByText('Follow up call')).toBeInTheDocument();
      expect(screen.getByText('Interested in our product')).toBeInTheDocument();
    });
  });
});
