/**
 * TestDriveResults Component Tests
 * 
 * Tests for the results display component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestDriveResults } from '../components/TestDriveResults';
import type { BuyerGroupResult } from '../types';

// Mock clipboard API
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

const mockSuccessResult: BuyerGroupResult = {
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
      {
        name: 'Bob Johnson',
        title: 'Director of Operations',
        role: 'stakeholder',
        confidence: 75,
      },
    ],
  },
  qualityMetrics: {
    overallScore: 92.5,
    averageConfidence: 86,
  },
  processingTime: 5000,
};

const mockFailureResult: BuyerGroupResult = {
  success: false,
  error: 'Failed to discover buyer group',
};

describe('TestDriveResults', () => {
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockClear();
  });

  it('should render success result with company name', () => {
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    expect(screen.getByText(/buyer group intelligence results/i)).toBeInTheDocument();
    expect(screen.getAllByText(/salesforce/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/3 members discovered/i)).toBeInTheDocument();
  });

  it('should display summary statistics', () => {
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    expect(screen.getAllByText(/3/i).length).toBeGreaterThan(0); // Total members
    expect(screen.getByText(/92.5%/i)).toBeInTheDocument(); // Quality score
    expect(screen.getByText(/86%/i)).toBeInTheDocument(); // Average confidence
  });

  it('should group members by role', () => {
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    expect(screen.getByText(/decision makers/i)).toBeInTheDocument();
    expect(screen.getByText(/champions/i)).toBeInTheDocument();
    expect(screen.getByText(/stakeholders/i)).toBeInTheDocument();
  });

  it('should display member details', () => {
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('CFO')).toBeInTheDocument();
    expect(screen.getByText(/john.doe@salesforce.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1-555-0100/i)).toBeInTheDocument();
  });

  it('should display confidence scores', () => {
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('should copy formatted text to clipboard', async () => {
    const user = userEvent.setup();
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });

    // Check that copied text contains expected content
    const copiedText = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0];
    expect(copiedText).toContain('Buyer Group Intelligence for Salesforce');
    expect(copiedText).toContain('Decision Makers:');
    expect(copiedText).toContain('John Doe');
    expect(copiedText).toContain('john.doe@salesforce.com');
  });

  it('should show copied confirmation', async () => {
    const user = userEvent.setup();
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText(/copied!/i)).toBeInTheDocument();
    });
  });

  it('should call onReset when New Search is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    const resetButton = screen.getByRole('button', { name: /new search/i });
    await user.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should display error message for failed results', () => {
    render(<TestDriveResults result={mockFailureResult} onReset={mockOnReset} />);

    expect(screen.getByText(/discovery failed/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to discover buyer group/i)).toBeInTheDocument();
  });

  it('should show try again button for failed results', async () => {
    const user = userEvent.setup();
    render(<TestDriveResults result={mockFailureResult} onReset={mockOnReset} />);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should format plain text output correctly', async () => {
    const user = userEvent.setup();
    render(<TestDriveResults result={mockSuccessResult} onReset={mockOnReset} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
      const copiedText = mockWriteText.mock.calls[0][0];
      
      // Check structure
      expect(copiedText).toContain('Buyer Group Intelligence for Salesforce');
      expect(copiedText).toContain('Decision Makers:');
      expect(copiedText).toContain('Champions:');
      expect(copiedText).toContain('Summary:');
      expect(copiedText).toContain('Total Members: 3');
      
      // Check member format
      expect(copiedText).toContain('- John Doe, CFO');
      expect(copiedText).toContain('  Email: john.doe@salesforce.com');
      expect(copiedText).toContain('  Phone: +1-555-0100');
    });
  });

  it('should handle members without contact information', () => {
    const resultWithoutContacts: BuyerGroupResult = {
      ...mockSuccessResult,
      buyerGroup: {
        ...mockSuccessResult.buyerGroup!,
        members: [
          {
            name: 'John Doe',
            title: 'CFO',
            role: 'decision_maker',
            confidence: 95,
          },
        ],
      },
    };

    render(<TestDriveResults result={resultWithoutContacts} onReset={mockOnReset} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('CFO')).toBeInTheDocument();
  });
});

