/**
 * Unit Tests: SetReminderModal Component
 * 
 * Tests for the Set Reminder modal component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetReminderModal } from '@/frontend/components/pipeline/SetReminderModal';

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => (
    <div data-testid="x-mark-icon" className={className}>✕</div>
  ),
  ClockIcon: ({ className }: { className?: string }) => (
    <div data-testid="clock-icon" className={className}>🕐</div>
  ),
}));

describe('SetReminderModal', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    recordName: 'John Doe',
    recordType: 'people',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    render(<SetReminderModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Set Reminder')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<SetReminderModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Set Reminder' })).toBeInTheDocument();
    expect(screen.getByText(/Person: John Doe/)).toBeInTheDocument();
  });

  it('should display quick options', () => {
    render(<SetReminderModal {...defaultProps} />);
    expect(screen.getByText('In an hour')).toBeInTheDocument();
    expect(screen.getByText('End of day')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('should allow selecting quick options', async () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const inAnHourButton = screen.getByText('In an hour').closest('button');
    expect(inAnHourButton).toBeInTheDocument();
    
    fireEvent.click(inAnHourButton!);
    
    // Button should be highlighted
    expect(inAnHourButton).toHaveClass('bg-primary/10');
  });

  it('should allow entering custom date and time', async () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const dateInputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
    const dateInput = dateInputs.find(input => input.type === 'date')!;
    const timeInput = dateInputs.find(input => input.type === 'time')!;
    
    fireEvent.change(dateInput, { target: { value: '2024-01-16' } });
    fireEvent.change(timeInput, { target: { value: '14:30' } });
    
    expect(dateInput).toHaveValue('2024-01-16');
    expect(timeInput).toHaveValue('14:30');
  });

  it('should allow entering a note', async () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const noteTextarea = screen.getByPlaceholderText('Add a note about this reminder...');
    fireEvent.change(noteTextarea, { target: { value: 'Follow up on proposal' } });
    
    expect(noteTextarea).toHaveValue('Follow up on proposal');
  });

  it('should call onSave with correct date when quick option is selected', async () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const inAnHourButton = screen.getByText('In an hour').closest('button');
    fireEvent.click(inAnHourButton!);
    
    const saveButton = screen.getByRole('button', { name: /^Set Reminder$/ });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      const [reminderAt, note] = mockOnSave.mock.calls[0];
      expect(reminderAt).toBeInstanceOf(Date);
      expect(reminderAt.getTime()).toBeGreaterThan(Date.now());
      expect(note).toBeUndefined();
    });
  });

  it('should call onSave with custom date/time and note', async () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const dateInputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
    const dateInput = dateInputs.find(input => input.type === 'date')!;
    const timeInput = dateInputs.find(input => input.type === 'time')!;
    const noteTextarea = screen.getByPlaceholderText('Add a note about this reminder...');
    
    fireEvent.change(dateInput, { target: { value: '2024-01-16' } });
    fireEvent.change(timeInput, { target: { value: '14:30' } });
    fireEvent.change(noteTextarea, { target: { value: 'Test note' } });
    
    const saveButton = screen.getByRole('button', { name: /^Set Reminder$/ });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      const [reminderAt, note] = mockOnSave.mock.calls[0];
      expect(reminderAt).toBeInstanceOf(Date);
      expect(note).toBe('Test note');
    });
  });

  it('should not allow saving without selecting an option or entering date/time', async () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /^Set Reminder$/ });
    expect(saveButton).toBeDisabled();
  });

  it('should validate that reminder is in the future', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<SetReminderModal {...defaultProps} />);
    
    const dateInputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
    const dateInput = dateInputs.find(input => input.type === 'date')!;
    const timeInput = dateInputs.find(input => input.type === 'time')!;
    
    // Set a date in the past
    fireEvent.change(dateInput, { target: { value: '2024-01-14' } });
    fireEvent.change(timeInput, { target: { value: '09:00' } });
    
    const saveButton = screen.getByRole('button', { name: /^Set Reminder$/ });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Please select a date and time in the future');
      expect(mockOnSave).not.toHaveBeenCalled();
    });
    
    alertSpy.mockRestore();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when X button is clicked', () => {
    render(<SetReminderModal {...defaultProps} />);
    
    const closeButton = screen.getByTestId('x-mark-icon').closest('button');
    fireEvent.click(closeButton!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should reset form after successful save', async () => {
    mockOnSave.mockResolvedValue(undefined);
    render(<SetReminderModal {...defaultProps} />);
    
    const inAnHourButton = screen.getByText('In an hour').closest('button');
    fireEvent.click(inAnHourButton!);
    
    const noteTextarea = screen.getByPlaceholderText('Add a note about this reminder...');
    fireEvent.change(noteTextarea, { target: { value: 'Test note' } });
    
    const saveButton = screen.getByRole('button', { name: /^Set Reminder$/ });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should display correct record type for companies', () => {
    render(<SetReminderModal {...defaultProps} recordType="companies" recordName="Acme Corp" />);
    expect(screen.getByText(/Company: Acme Corp/)).toBeInTheDocument();
  });
});

