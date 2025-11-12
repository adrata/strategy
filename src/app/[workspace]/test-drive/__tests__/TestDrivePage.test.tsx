/**
 * TestDrivePage Component Tests
 * 
 * Integration tests for the main Test Drive page component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestDrivePage from '../page';
import type { TestDriveFormData, BuyerGroupResult } from '../types';

// Mock the hooks
jest.mock('@/frontend/components/stacks/utils/workspaceId', () => ({
  useWorkspaceId: jest.fn(() => 'test-workspace-id'),
}));

// Mock fetch
global.fetch = jest.fn();

const mockBuyerGroupResponse = {
  success: true,
  company: {
    name: 'Salesforce',
    website: 'https://salesforce.com',
  },
  buyerGroup: {
    totalMembers: 2,
    composition: {
      decisionMakers: 1,
      champions: 1,
    },
    members: [
      {
        name: 'John Doe',
        title: 'CFO',
        role: 'decision_maker',
        confidence: 95,
        email: 'john.doe@salesforce.com',
      },
    ],
  },
  quality: {
    overallScore: 92.5,
    averageConfidence: 91.5,
  },
  processingTime: 5000,
};

describe('TestDrivePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render the page with step indicator', () => {
    render(<TestDrivePage />);

    expect(screen.getByText(/test drive: buyer group intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/input/i)).toBeInTheDocument();
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    expect(screen.getByText(/results/i)).toBeInTheDocument();
  });

  it('should start on step 1 (input)', () => {
    render(<TestDrivePage />);

    expect(screen.getByText(/company information/i)).toBeInTheDocument();
    expect(screen.getAllByText(/your company/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/target company/i).length).toBeGreaterThan(0);
  });

  it('should transition to step 2 after form submission', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TestDrivePage />);

    // Fill in form - use getAllByLabelText since there are two "Company Name" labels
    const companyNameInputs = screen.getAllByLabelText(/company name/i);
    await user.type(companyNameInputs[0], 'Adrata');
    await user.type(companyNameInputs[1], 'Salesforce');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    // Should transition to processing step
    await waitFor(() => {
      expect(screen.getByText(/processing buyer group intelligence/i)).toBeInTheDocument();
    });
  });

  it('should transition to step 3 after processing completes', async () => {
    const user = userEvent.setup({ delay: null });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuyerGroupResponse,
    });

    render(<TestDrivePage />);

    // Fill and submit form - use getAllByLabelText since there are two "Company Name" labels
    const companyNameInputs = screen.getAllByLabelText(/company name/i);
    await user.type(companyNameInputs[0], 'Adrata');
    await user.type(companyNameInputs[1], 'Salesforce');

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    // Wait for processing to start
    await waitFor(() => {
      expect(screen.getByText(/processing buyer group intelligence/i)).toBeInTheDocument();
    });

    // Fast-forward through processing stages
    jest.advanceTimersByTime(10000);
    
    // Run pending promises
    await Promise.resolve();

    // Should transition to results step
    await waitFor(
      () => {
        expect(screen.getByText(/buyer group intelligence results/i)).toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  });

  it('should display error message on processing failure', async () => {
    const user = userEvent.setup({ delay: null });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'API error' }),
    });

    render(<TestDrivePage />);

    // Fill and submit form - use getAllByLabelText since there are two "Company Name" labels
    const companyNameInputs = screen.getAllByLabelText(/company name/i);
    await user.type(companyNameInputs[0], 'Adrata');
    await user.type(companyNameInputs[1], 'Salesforce');

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    // Fast-forward through processing
    jest.advanceTimersByTime(10000);
    
    // Run pending promises
    await Promise.resolve();

    // Should show error and return to step 1
    await waitFor(
      () => {
        expect(screen.getByText(/api error/i)).toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  });

  it('should reset to step 1 when New Search is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuyerGroupResponse,
    });

    render(<TestDrivePage />);

    // Complete full flow
    const yourCompanyName = screen.getAllByLabelText(/company name/i)[0];
    await user.type(yourCompanyName, 'Adrata');

    const targetCompanyName = screen.getAllByLabelText(/company name/i)[1];
    await user.type(targetCompanyName, 'Salesforce');

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    jest.advanceTimersByTime(10000);

    await waitFor(
      () => {
        expect(screen.getByText(/buyer group intelligence results/i)).toBeInTheDocument();
      },
      { timeout: 15000 }
    );

    // Click New Search
    const newSearchButton = screen.getByRole('button', { name: /new search/i });
    await user.click(newSearchButton);

    // Should return to step 1
    await waitFor(() => {
      expect(screen.getByText(/company information/i)).toBeInTheDocument();
    });
  });

  it('should show loading state when workspaceId is not available', () => {
    const { useWorkspaceId } = require('@/frontend/components/stacks/utils/workspaceId');
    (useWorkspaceId as jest.Mock).mockReturnValueOnce(null);

    render(<TestDrivePage />);

    expect(screen.getByText(/loading workspace/i)).toBeInTheDocument();
  });

  it('should update step indicator as user progresses', async () => {
    const user = userEvent.setup({ delay: null });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuyerGroupResponse,
    });

    render(<TestDrivePage />);

    // Step 1 should be active
    const step1Indicator = screen.getByText('1').closest('div');
    expect(step1Indicator).toHaveClass('bg-primary');

    // Submit form
    const yourCompanyName = screen.getAllByLabelText(/company name/i)[0];
    await user.type(yourCompanyName, 'Adrata');

    const targetCompanyName = screen.getAllByLabelText(/company name/i)[1];
    await user.type(targetCompanyName, 'Salesforce');

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    // Step 2 should be active
    await waitFor(() => {
      const step2Indicator = screen.getByText('2').closest('div');
      expect(step2Indicator).toHaveClass('bg-primary');
    });

    // Fast-forward through processing
    jest.advanceTimersByTime(10000);
    
    // Run pending promises
    await Promise.resolve();

    // Step 3 should be active
    await waitFor(
      () => {
        const step3Indicators = screen.getAllByText('3');
        const step3Indicator = step3Indicators[step3Indicators.length - 1].closest('div');
        expect(step3Indicator).toHaveClass('bg-primary');
      },
      { timeout: 15000 }
    );
  });
});

