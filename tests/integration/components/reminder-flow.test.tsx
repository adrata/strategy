/**
 * Integration Tests: Reminder Flow
 * 
 * Tests for the complete reminder workflow from UI to API
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetReminderModal } from '@/frontend/components/pipeline/SetReminderModal';

// Mock authFetch
const mockAuthFetch = jest.fn();
jest.mock('@/platform/api-fetch', () => ({
  authFetch: (...args: any[]) => mockAuthFetch(...args),
}));

// Mock icons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => (
    <div data-testid="x-mark-icon" className={className}>✕</div>
  ),
  ClockIcon: ({ className }: { className?: string }) => (
    <div data-testid="clock-icon" className={className}>🕐</div>
  ),
}));

describe('Reminder Flow Integration', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    mockAuthFetch.mockResolvedValue({
      success: true,
      data: {
        id: 'reminder-1',
        reminderAt: new Date('2024-01-16T14:30:00Z').toISOString(),
        note: 'Test note',
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should complete full reminder creation flow', async () => {
    render(
      <SetReminderModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        recordName="John Doe"
        recordType="people"
      />
    );

    // Select quick option
    const inAnHourButton = screen.getByText('In an hour').closest('button');
    fireEvent.click(inAnHourButton!);

    // Add note
    const noteTextarea = screen.getByPlaceholderText('Add a note about this reminder...');
    fireEvent.change(noteTextarea, { target: { value: 'Follow up on proposal' } });

    // Save
    const saveButton = screen.getByText('Set Reminder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      const [reminderAt, note] = mockOnSave.mock.calls[0];
      expect(reminderAt).toBeInstanceOf(Date);
      expect(note).toBe('Follow up on proposal');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockOnSave.mockRejectedValue(new Error('API Error'));

    render(
      <SetReminderModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        recordName="John Doe"
        recordType="people"
      />
    );

    const inAnHourButton = screen.getByText('In an hour').closest('button');
    fireEvent.click(inAnHourButton!);

    const saveButton = screen.getByText('Set Reminder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save reminder')
      );
    });

    alertSpy.mockRestore();
  });

  it('should validate custom date/time before saving', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <SetReminderModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        recordName="John Doe"
        recordType="people"
      />
    );

    const dateInput = screen.getByLabelText('Date');
    const timeInput = screen.getByLabelText('Time');

    // Set invalid date (past)
    fireEvent.change(dateInput, { target: { value: '2024-01-14' } });
    fireEvent.change(timeInput, { target: { value: '09:00' } });

    const saveButton = screen.getByText('Set Reminder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Please select a date and time in the future'
      );
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });
});

