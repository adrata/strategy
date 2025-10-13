/**
 * Unit Tests for ValueTab Component
 * 
 * Tests the Value tab component that displays auto-generated deep value reports
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ValueTab } from '@/frontend/components/pipeline/tabs/ValueTab';
import { 
  createTestPersonWithCoreSignal,
  createTestCompanyWithDetails,
  createTestDeepValueReport,
  TEST_USER
} from '../../utils/test-factories';

// Mock the deep value report service
jest.mock('@/platform/services/deep-value-report-service', () => ({
  generateDeepValueReport: jest.fn(),
}));

// Mock the Atrium API
jest.mock('@/platform/api/atrium-api', () => ({
  getAtriumDocuments: jest.fn(),
}));

import { generateDeepValueReport } from '@/platform/services/deep-value-report-service';
import { getAtriumDocuments } from '@/platform/api/atrium-api';

const mockGenerateDeepValueReport = generateDeepValueReport as jest.MockedFunction<typeof generateDeepValueReport>;
const mockGetAtriumDocuments = getAtriumDocuments as jest.MockedFunction<typeof getAtriumDocuments>;

describe('ValueTab Component', () => {
  const mockOnReportClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Person Record', () => {
    const person = createTestPersonWithCoreSignal();
    const company = createTestCompanyWithDetails();

    it('should render all report types for person record', () => {
      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      // Check that all report types are displayed
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Competitive Analysis')).toBeInTheDocument();
      expect(screen.getByText('Value Proposition')).toBeInTheDocument();
      expect(screen.getByText('Engagement Strategy')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('should show generate buttons for all report types', () => {
      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButtons = screen.getAllByText('Generate');
      expect(generateButtons).toHaveLength(5); // 5 report types
    });

    it('should handle report generation when generate button is clicked', async () => {
      const mockReport = createTestDeepValueReport('executive_summary', {
        recordId: person.id,
        recordName: person.fullName
      });

      mockGenerateDeepValueReport.mockResolvedValue(mockReport);

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateDeepValueReport).toHaveBeenCalledWith(
          'executive_summary',
          person,
          'people',
          null, // No company data in this test
          expect.objectContaining({
            id: TEST_USER.id,
            name: TEST_USER.name,
            email: TEST_USER.email
          }),
          TEST_USER.workspaceId
        );
      });
    });

    it('should show loading state during report generation', async () => {
      // Mock a delayed response
      mockGenerateDeepValueReport.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createTestDeepValueReport('executive_summary')), 100))
      );

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      // Should show loading state
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      });
    });

    it('should handle report generation errors', async () => {
      mockGenerateDeepValueReport.mockRejectedValue(new Error('Generation failed'));

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Error generating report')).toBeInTheDocument();
      });
    });

    it('should display existing reports from Atrium', async () => {
      const existingReports = [
        createTestDeepValueReport('executive_summary', {
          recordId: person.id,
          recordName: person.fullName,
          status: 'completed'
        }),
        createTestDeepValueReport('competitive_analysis', {
          recordId: person.id,
          recordName: person.fullName,
          status: 'completed'
        })
      ];

      mockGetAtriumDocuments.mockResolvedValue(existingReports);

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument();
        expect(screen.getByText('Regenerate')).toBeInTheDocument();
      });
    });

    it('should call onReportClick when report is clicked', async () => {
      const mockReport = createTestDeepValueReport('executive_summary', {
        recordId: person.id,
        recordName: person.fullName,
        status: 'completed'
      });

      mockGetAtriumDocuments.mockResolvedValue([mockReport]);

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      await waitFor(() => {
        const viewButton = screen.getByText('View Report');
        fireEvent.click(viewButton);
        expect(mockOnReportClick).toHaveBeenCalledWith(mockReport);
      });
    });
  });

  describe('Company Record', () => {
    const company = createTestCompanyWithDetails();

    it('should render all report types for company record', () => {
      render(
        <ValueTab
          record={company}
          recordType="companies"
          onReportClick={mockOnReportClick}
        />
      );

      // Check that all report types are displayed
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Competitive Analysis')).toBeInTheDocument();
      expect(screen.getByText('Value Proposition')).toBeInTheDocument();
      expect(screen.getByText('Engagement Strategy')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('should handle report generation for company record', async () => {
      const mockReport = createTestDeepValueReport('executive_summary', {
        recordId: company.id,
        recordName: company.name,
        recordType: 'companies'
      });

      mockGenerateDeepValueReport.mockResolvedValue(mockReport);

      render(
        <ValueTab
          record={company}
          recordType="companies"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateDeepValueReport).toHaveBeenCalledWith(
          'executive_summary',
          company,
          'companies',
          null,
          expect.objectContaining({
            id: TEST_USER.id,
            name: TEST_USER.name,
            email: TEST_USER.email
          }),
          TEST_USER.workspaceId
        );
      });
    });
  });

  describe('Report Status Display', () => {
    const person = createTestPersonWithCoreSignal();

    it('should show completed status for existing reports', async () => {
      const completedReport = createTestDeepValueReport('executive_summary', {
        recordId: person.id,
        recordName: person.fullName,
        status: 'completed'
      });

      mockGetAtriumDocuments.mockResolvedValue([completedReport]);

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('View Report')).toBeInTheDocument();
      });
    });

    it('should show generating status during report generation', async () => {
      // Mock a delayed response
      mockGenerateDeepValueReport.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createTestDeepValueReport('executive_summary')), 100))
      );

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should show error status for failed reports', async () => {
      mockGenerateDeepValueReport.mockRejectedValue(new Error('Generation failed'));

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButton = screen.getByText('Generate');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Error generating report')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    const person = createTestPersonWithCoreSignal();

    it('should have proper ARIA labels', () => {
      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButtons = screen.getAllByRole('button', { name: /generate/i });
      expect(generateButtons).toHaveLength(5);

      generateButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should be keyboard navigable', () => {
      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      const generateButton = screen.getByText('Generate');
      generateButton.focus();
      expect(generateButton).toHaveFocus();

      // Test keyboard navigation
      fireEvent.keyDown(generateButton, { key: 'Enter' });
      // Should trigger the same action as clicking
    });
  });

  describe('Error Handling', () => {
    const person = createTestPersonWithCoreSignal();

    it('should handle missing record data gracefully', () => {
      render(
        <ValueTab
          record={null}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      expect(screen.getByText('No record data available')).toBeInTheDocument();
    });

    it('should handle Atrium API errors', async () => {
      mockGetAtriumDocuments.mockRejectedValue(new Error('Atrium API error'));

      render(
        <ValueTab
          record={person}
          recordType="people"
          onReportClick={mockOnReportClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error loading reports')).toBeInTheDocument();
      });
    });
  });
});
