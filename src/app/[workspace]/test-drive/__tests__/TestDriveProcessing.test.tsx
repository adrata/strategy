/**
 * TestDriveProcessing Component Tests
 * 
 * Tests for the processing checklist component functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TestDriveProcessing } from '../components/TestDriveProcessing';
import type { TestDriveFormData, BuyerGroupResult } from '../types';

// Mock fetch
global.fetch = jest.fn();

const mockFormData: TestDriveFormData = {
  yourCompany: {
    name: 'Adrata',
  },
  targetCompany: {
    name: 'Salesforce',
    website: 'https://salesforce.com',
  },
};

const mockBuyerGroupResponse = {
  success: true,
  company: {
    name: 'Salesforce',
    website: 'https://salesforce.com',
  },
  buyerGroup: {
    totalMembers: 3,
    composition: {
      decisionMakers: 1,
      champions: 1,
      stakeholders: 1,
    },
    members: [
      {
        name: 'John Doe',
        title: 'CFO',
        role: 'decision_maker',
        confidence: 95,
        email: 'john.doe@salesforce.com',
        phone: '+1-555-0100',
        linkedin: 'https://linkedin.com/in/johndoe',
      },
      {
        name: 'Jane Smith',
        title: 'VP Sales',
        role: 'champion',
        confidence: 88,
        email: 'jane.smith@salesforce.com',
      },
    ],
  },
  quality: {
    overallScore: 92.5,
    averageConfidence: 91.5,
  },
  processingTime: 5000,
};

describe('TestDriveProcessing', () => {
  const mockOnComplete = jest.fn();
  const mockOnError = jest.fn();
  const workspaceId = 'test-workspace-id';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render all processing stages', () => {
    render(
      <TestDriveProcessing
        formData={mockFormData}
        workspaceId={workspaceId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/resolving company information/i)).toBeInTheDocument();
    expect(screen.getByText(/determining company size/i)).toBeInTheDocument();
    expect(screen.getByText(/discovering employees/i)).toBeInTheDocument();
    expect(screen.getByText(/classifying roles/i)).toBeInTheDocument();
    expect(screen.getByText(/filtering by relevance/i)).toBeInTheDocument();
    expect(screen.getByText(/selecting optimal buyer group/i)).toBeInTheDocument();
    expect(screen.getByText(/enriching contact data/i)).toBeInTheDocument();
    expect(screen.getByText(/validating accuracy/i)).toBeInTheDocument();
  });

  it('should call API with correct parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuyerGroupResponse,
    });

    render(
      <TestDriveProcessing
        formData={mockFormData}
        workspaceId={workspaceId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Fast-forward through all stages to reach API call
    jest.advanceTimersByTime(6000);

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/intelligence/buyer-group-v2',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyName: 'Salesforce',
              website: 'https://salesforce.com',
              workspaceId,
              enrichmentLevel: 'enrich',
              saveToDatabase: false,
            }),
          })
        );
      },
      { timeout: 10000 }
    );
  });

  it('should update stages progressively', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuyerGroupResponse,
    });

    render(
      <TestDriveProcessing
        formData={mockFormData}
        workspaceId={workspaceId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Fast-forward through stages
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      const completedStage = screen.getByText(/resolving company information/i).closest('div');
      expect(completedStage).toHaveClass('bg-green-50');
    }, { timeout: 5000 });
  });

  it('should call onComplete with transformed result', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuyerGroupResponse,
    });

    render(
      <TestDriveProcessing
        formData={mockFormData}
        workspaceId={workspaceId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Fast-forward through all timers and API call
    jest.advanceTimersByTime(6000);
    
    // Wait for API call
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // Fast-forward through remaining stages
    jest.advanceTimersByTime(1000);
    
    // Run pending promises
    await Promise.resolve();

    await waitFor(
      () => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            company: mockBuyerGroupResponse.company,
            buyerGroup: mockBuyerGroupResponse.buyerGroup,
            qualityMetrics: mockBuyerGroupResponse.quality,
            processingTime: mockBuyerGroupResponse.processingTime,
          })
        );
      },
      { timeout: 10000 }
    );
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    render(
      <TestDriveProcessing
        formData={mockFormData}
        workspaceId={workspaceId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Fast-forward through stages to reach API call (stage 7 - enriching contacts)
    jest.advanceTimersByTime(6000);
    
    // Wait for API call and error handling
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );

    // Fast-forward a bit more for error handling
    jest.advanceTimersByTime(1000);

    await waitFor(
      () => {
        expect(mockOnError).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestDriveProcessing
        formData={mockFormData}
        workspaceId={workspaceId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    // Fast-forward through stages to reach API call
    jest.advanceTimersByTime(6000);
    
    // Wait for API call
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );

    // Fast-forward a bit more for error handling
    jest.advanceTimersByTime(1000);

    await waitFor(
      () => {
        expect(mockOnError).toHaveBeenCalled();
        const errorCall = mockOnError.mock.calls[0]?.[0];
        expect(errorCall).toContain('Network error');
      },
      { timeout: 5000 }
    );
  });

  it('should handle missing target company data', async () => {
    const invalidFormData: TestDriveFormData = {
      yourCompany: { name: 'Adrata' },
      targetCompany: {},
    };

    render(
      <TestDriveProcessing
        formData={invalidFormData}
        workspaceId={workspaceId}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    await waitFor(
      () => {
        expect(mockOnError).toHaveBeenCalledWith('Target company information is required');
      },
      { timeout: 1000 }
    );
  });
});

