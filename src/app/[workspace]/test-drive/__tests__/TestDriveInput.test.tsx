/**
 * TestDriveInput Component Tests
 * 
 * Tests for the input form component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestDriveInput } from '../components/TestDriveInput';
import type { TestDriveFormData } from '../types';

describe('TestDriveInput', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all input fields', () => {
    render(<TestDriveInput onSubmit={mockOnSubmit} />);

    // Your Company fields - use getAllByLabelText since there are multiple fields with same labels
    expect(screen.getAllByLabelText(/company name/i).length).toBe(2);
    expect(screen.getAllByLabelText(/website/i).length).toBe(2);
    expect(screen.getAllByLabelText(/linkedin url/i).length).toBe(2);

    // Target Company section
    const targetCompanyLabels = screen.getAllByText(/target company/i);
    expect(targetCompanyLabels.length).toBeGreaterThan(0);
  });

  it('should display initial data when provided', () => {
    const initialData: TestDriveFormData = {
      yourCompany: {
        name: 'Adrata',
        website: 'https://adrata.com',
      },
      targetCompany: {
        name: 'Salesforce',
        linkedinUrl: 'https://linkedin.com/company/salesforce',
      },
    };

    render(<TestDriveInput onSubmit={mockOnSubmit} initialData={initialData} />);

    expect(screen.getByDisplayValue('Adrata')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://adrata.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Salesforce')).toBeInTheDocument();
  });

  it('should show validation errors when submitting with empty fields', async () => {
    const user = userEvent.setup();
    render(<TestDriveInput onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/please provide at least one identifier/i).length).toBeGreaterThan(0);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<TestDriveInput onSubmit={mockOnSubmit} />);

    // Fill in Your Company - use getAllByLabelText since there are two "Company Name" labels
    const companyNameInputs = screen.getAllByLabelText(/company name/i);
    await user.type(companyNameInputs[0], 'Adrata');

    // Fill in Target Company
    await user.type(companyNameInputs[1], 'Salesforce');

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        yourCompany: {
          name: 'Adrata',
          website: undefined,
          linkedinUrl: undefined,
        },
        targetCompany: {
          name: 'Salesforce',
          website: undefined,
          linkedinUrl: undefined,
        },
      });
    });
  });

  it('should submit with website only', async () => {
    const user = userEvent.setup();
    render(<TestDriveInput onSubmit={mockOnSubmit} />);

    // Fill in websites only
    const yourCompanyWebsite = screen.getAllByLabelText(/website/i)[0];
    await user.type(yourCompanyWebsite, 'https://adrata.com');

    const targetCompanyWebsite = screen.getAllByLabelText(/website/i)[1];
    await user.type(targetCompanyWebsite, 'https://salesforce.com');

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        yourCompany: {
          name: undefined,
          website: 'https://adrata.com',
          linkedinUrl: undefined,
        },
        targetCompany: {
          name: undefined,
          website: 'https://salesforce.com',
          linkedinUrl: undefined,
        },
      });
    });
  });

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup();
    render(<TestDriveInput onSubmit={mockOnSubmit} />);

    const yourCompanyName = screen.getAllByLabelText(/company name/i)[0];
    await user.type(yourCompanyName, '  Adrata  ');

    const targetCompanyName = screen.getAllByLabelText(/company name/i)[1];
    await user.type(targetCompanyName, '  Salesforce  ');

    const submitButton = screen.getByRole('button', { name: /start buyer group discovery/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          yourCompany: expect.objectContaining({
            name: 'Adrata',
          }),
          targetCompany: expect.objectContaining({
            name: 'Salesforce',
          }),
        })
      );
    });
  });
});

