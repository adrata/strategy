/**
 * InlineEditField Null Handling Tests
 * 
 * Tests to verify InlineEditField properly handles null values
 * and displays "No data available" instead of fallback text
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  PencilIcon: ({ className }: { className?: string }) => (
    <div data-testid="pencil-icon" className={className}>✏️</div>
  ),
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className}>✓</div>
  ),
  XMarkIcon: ({ className }: { className?: string }) => (
    <div data-testid="x-mark-icon" className={className}>✕</div>
  ),
}));

describe('InlineEditField Null Handling', () => {
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Null Value Display Tests', () => {
    it('should display "No data available" for null values', () => {
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should display "No data available" for undefined values', () => {
      render(
        <InlineEditField
          value={undefined}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should display "No data available" for empty string values', () => {
      render(
        <InlineEditField
          value=""
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should display "No data available" for whitespace-only values', () => {
      render(
        <InlineEditField
          value="   "
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should display actual value for valid non-empty strings', () => {
      render(
        <InlineEditField
          value="Valid Value"
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      expect(screen.getByText('Valid Value')).toBeInTheDocument();
      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });
  });

  describe('Styling Tests', () => {
    it('should apply italic styling to empty state text', () => {
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      const emptyStateText = screen.getByText('No data available');
      expect(emptyStateText).toHaveClass('italic');
    });

    it('should apply muted color to empty state text', () => {
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      const emptyStateText = screen.getByText('No data available');
      expect(emptyStateText).toHaveClass('text-[var(--muted)]');
    });

    it('should not apply italic styling to valid values', () => {
      render(
        <InlineEditField
          value="Valid Value"
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      const valueText = screen.getByText('Valid Value');
      expect(valueText).not.toHaveClass('italic');
    });
  });

  describe('Edit Mode Tests', () => {
    it('should allow editing null values', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      // Click edit button
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      await user.click(editButton!);

      // Should show input field
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });

    it('should save new value when editing from null', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      // Enter edit mode
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      await user.click(editButton!);

      // Type new value
      const input = screen.getByRole('textbox');
      await user.type(input, 'New Value');

      // Save
      const saveButton = screen.getByTestId('check-icon').closest('button');
      await user.click(saveButton!);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('testField', 'New Value', 'test-id', 'test-type');
      });
    });

    it('should cancel editing and return to null display', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      // Enter edit mode
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      await user.click(editButton!);

      // Type something
      const input = screen.getByRole('textbox');
      await user.type(input, 'Some Value');

      // Cancel
      const cancelButton = screen.getByTestId('x-mark-icon').closest('button');
      await user.click(cancelButton!);

      // Should return to null display
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Select Field Tests', () => {
    const selectOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: '', label: 'No Selection' }
    ];

    it('should display "No data available" for null values in select fields', () => {
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
          inputType="select"
          options={selectOptions}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should display option label for valid select values', () => {
      render(
        <InlineEditField
          value="option1"
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
          inputType="select"
          options={selectOptions}
        />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should display "No data available" for empty string select values', () => {
      render(
        <InlineEditField
          value=""
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
          inputType="select"
          options={selectOptions}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Textarea Tests', () => {
    it('should display "No data available" for null values in textarea fields', () => {
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
          type="textarea"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should allow editing null values in textarea', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
          type="textarea"
        />
      );

      // Enter edit mode
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      await user.click(editButton!);

      // Should show textarea
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveValue('');
    });
  });

  describe('Success Message Tests', () => {
    it('should show success message after saving null to value', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
          successMessage="Field updated successfully"
        />
      );

      // Enter edit mode and save
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      await user.click(editButton!);

      const input = screen.getByRole('textbox');
      await user.type(input, 'New Value');

      const saveButton = screen.getByTestId('check-icon').closest('button');
      await user.click(saveButton!);

      await waitFor(() => {
        expect(screen.getByText('Field updated successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation Tests', () => {
    it('should handle Enter key to save null value', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      // Enter edit mode
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      await user.click(editButton!);

      // Type and press Enter
      const input = screen.getByRole('textbox');
      await user.type(input, 'New Value');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('testField', 'New Value', 'test-id', 'test-type');
      });
    });

    it('should handle Escape key to cancel editing null value', async () => {
      const user = userEvent.setup();
      
      render(
        <InlineEditField
          value={null}
          field="testField"
          onSave={mockOnSave}
          recordId="test-id"
          recordType="test-type"
        />
      );

      // Enter edit mode
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      await user.click(editButton!);

      // Type something and press Escape
      const input = screen.getByRole('textbox');
      await user.type(input, 'Some Value');
      await user.keyboard('{Escape}');

      // Should return to null display
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});
