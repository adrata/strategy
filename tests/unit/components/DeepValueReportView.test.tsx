/**
 * Unit Tests for DeepValueReportView Component
 * 
 * Tests the component that displays deep value reports in paper style
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeepValueReportView } from '@/platform/ui/components/reports/DeepValueReportView';
import { 
  createTestPersonWithCoreSignal,
  createTestCompanyWithDetails,
  createTestDeepValueReport,
  TEST_USER
} from '../../utils/test-factories';

// Mock the AI service for editing
jest.mock('@/platform/ai/ai-service', () => ({
  generateStreamingResponse: jest.fn(),
}));

// Mock the Atrium API
jest.mock('@/platform/api/atrium-api', () => ({
  updateAtriumDocument: jest.fn(),
}));

// Mock the share functionality
jest.mock('@/platform/ui/components/ShareButton', () => ({
  ShareButton: ({ onShare }: { onShare: () => void }) => (
    <button onClick={onShare} data-testid="share-button">
      Share
    </button>
  ),
}));

import { generateStreamingResponse } from '@/platform/ai/ai-service';
import { updateAtriumDocument } from '@/platform/api/atrium-api';

const mockGenerateStreamingResponse = generateStreamingResponse as jest.MockedFunction<typeof generateStreamingResponse>;
const mockUpdateWorkshopDocument = updateAtriumDocument as jest.MockedFunction<typeof updateAtriumDocument>;

describe('DeepValueReportView Component', () => {
  const mockOnBack = jest.fn();
  const mockOnSave = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Report Display', () => {
    const person = createTestPersonWithCoreSignal();
    const company = createTestCompanyWithDetails();
    const report = createTestDeepValueReport('executive_summary', {
      recordId: person.id,
      recordName: person.fullName,
      content: '# Executive Summary\n\nThis is a test executive summary.\n\n## Key Insights\n- Insight 1\n- Insight 2\n- Insight 3'
    });

    it('should render report with proper breadcrumb', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      // Check breadcrumb
      expect(screen.getByText(person.fullName)).toBeInTheDocument();
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();

      // Check report content
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('This is a test executive summary.')).toBeInTheDocument();
      expect(screen.getByText('Key Insights')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should render share button', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const shareButton = screen.getByTestId('share-button');
      expect(shareButton).toBeInTheDocument();
    });
  });

  describe('Report Editing', () => {
    const person = createTestPersonWithCoreSignal();
    const report = createTestDeepValueReport('executive_summary', {
      recordId: person.id,
      recordName: person.fullName,
      content: '# Executive Summary\n\nOriginal content'
    });

    it('should allow inline editing of report content', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      // Find the editable content area
      const contentArea = screen.getByText('Original content');
      expect(contentArea).toBeInTheDocument();
    });

    it('should show edit mode when edit button is clicked', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Should show save/cancel buttons
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onSave when save button is clicked', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('AI-Powered Editing', () => {
    const person = createTestPersonWithCoreSignal();
    const report = createTestDeepValueReport('executive_summary', {
      recordId: person.id,
      recordName: person.fullName,
      content: '# Executive Summary\n\nOriginal content'
    });

    it('should show AI edit input when AI edit button is clicked', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const aiEditButton = screen.getByRole('button', { name: /ai edit/i });
      fireEvent.click(aiEditButton);

      // Should show AI edit input
      expect(screen.getByPlaceholderText(/ask adrata to edit/i)).toBeInTheDocument();
    });

    it('should handle AI edit requests', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { content: '# Executive Summary\n\n' };
          yield { content: 'AI-edited content\n\n' };
        }
      };

      mockGenerateStreamingResponse.mockResolvedValue(mockStream);
      mockUpdateWorkshopDocument.mockResolvedValue({});

      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const aiEditButton = screen.getByRole('button', { name: /ai edit/i });
      fireEvent.click(aiEditButton);

      const input = screen.getByPlaceholderText(/ask adrata to edit/i);
      fireEvent.change(input, { target: { value: 'Make this more concise' } });

      const submitButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockGenerateStreamingResponse).toHaveBeenCalledWith(
          expect.stringContaining('Make this more concise'),
          expect.objectContaining({
            model: 'gpt-4o',
            temperature: 0.7,
            maxTokens: 4000
          })
        );
      });
    });

    it('should show loading state during AI editing', async () => {
      // Mock a delayed response
      mockGenerateStreamingResponse.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          [Symbol.asyncIterator]: async function* () {
            yield { content: 'AI-edited content' };
          }
        }), 100))
      );

      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const aiEditButton = screen.getByRole('button', { name: /ai edit/i });
      fireEvent.click(aiEditButton);

      const input = screen.getByPlaceholderText(/ask adrata to edit/i);
      fireEvent.change(input, { target: { value: 'Make this more concise' } });

      const submitButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText('AI is editing...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('AI is editing...')).not.toBeInTheDocument();
      });
    });

    it('should handle AI edit errors', async () => {
      mockGenerateStreamingResponse.mockRejectedValue(new Error('AI service unavailable'));

      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const aiEditButton = screen.getByRole('button', { name: /ai edit/i });
      fireEvent.click(aiEditButton);

      const input = screen.getByPlaceholderText(/ask adrata to edit/i);
      fireEvent.change(input, { target: { value: 'Make this more concise' } });

      const submitButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error: AI service unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Streaming Content Display', () => {
    const person = createTestPersonWithCoreSignal();
    const report = createTestDeepValueReport('executive_summary', {
      recordId: person.id,
      recordName: person.fullName,
      content: '',
      status: 'generating'
    });

    it('should display streaming content as it arrives', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { content: '# Executive Summary\n\n' };
          yield { content: 'This is streaming content.\n\n' };
          yield { content: '## Key Points\n- Point 1\n- Point 2\n' };
        }
      };

      mockGenerateStreamingResponse.mockResolvedValue(mockStream);

      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      // Should show streaming indicator
      expect(screen.getByText('Generating report...')).toBeInTheDocument();

      // Wait for content to appear
      await waitFor(() => {
        expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('This is streaming content.')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Key Points')).toBeInTheDocument();
      });
    });
  });

  describe('Company Record Display', () => {
    const company = createTestCompanyWithDetails();
    const report = createTestDeepValueReport('executive_summary', {
      recordId: company.id,
      recordName: company.name,
      recordType: 'companies',
      content: '# Executive Summary\n\nCompany report content'
    });

    it('should render report for company record', () => {
      render(
        <DeepValueReportView
          report={report}
          record={company}
          recordType="companies"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      // Check breadcrumb shows company name
      expect(screen.getByText(company.name)).toBeInTheDocument();
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();

      // Check report content
      expect(screen.getByText('Company report content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const person = createTestPersonWithCoreSignal();
    const report = createTestDeepValueReport('executive_summary', {
      recordId: person.id,
      recordName: person.fullName,
      content: '# Executive Summary\n\nTest content'
    });

    it('should have proper ARIA labels', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toHaveAttribute('aria-label');

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', () => {
      render(
        <DeepValueReportView
          report={report}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      backButton.focus();
      expect(backButton).toHaveFocus();

      // Test keyboard navigation
      fireEvent.keyDown(backButton, { key: 'Enter' });
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    const person = createTestPersonWithCoreSignal();

    it('should handle missing report data gracefully', () => {
      render(
        <DeepValueReportView
          report={null}
          record={person}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('No report data available')).toBeInTheDocument();
    });

    it('should handle missing record data gracefully', () => {
      const report = createTestDeepValueReport('executive_summary');
      
      render(
        <DeepValueReportView
          report={report}
          record={null}
          recordType="people"
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('No record data available')).toBeInTheDocument();
    });
  });
});
