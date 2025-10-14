/**
 * InlineEditField Component Integration Tests
 * 
 * Tests for the InlineEditField component behavior including edit mode,
 * save/cancel functionality, keyboard shortcuts, and error handling
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

describe('InlineEditField Component', () => {
  const defaultProps = {
    value: 'Test Value',
    field: 'testField',
    onSave: jest.fn(),
    recordId: 'record-123',
    recordType: 'people',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Display Mode', () => {
    it('should render value in display mode', () => {
      render(<InlineEditField {...defaultProps} />);
      
      expect(screen.getByText('Test Value')).toBeInTheDocument();
      expect(screen.getByTestId('pencil-icon')).toBeInTheDocument();
    });

    it('should show placeholder when value is empty', () => {
      render(<InlineEditField {...defaultProps} value="" />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should show placeholder when value is null', () => {
      render(<InlineEditField {...defaultProps} value={null as any} />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should show placeholder when value is undefined', () => {
      render(<InlineEditField {...defaultProps} value={undefined as any} />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should show placeholder when value is whitespace only', () => {
      render(<InlineEditField {...defaultProps} value="   " />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<InlineEditField {...defaultProps} className="custom-class" />);
      
      const displayElement = screen.getByText('Test Value');
      expect(displayElement).toHaveClass('custom-class');
    });

    it('should show muted text for empty values', () => {
      render(<InlineEditField {...defaultProps} value="" />);
      
      const displayElement = screen.getByText('-');
      expect(displayElement).toHaveClass('text-[var(--muted)]');
    });
  });

  describe('Edit Mode Activation', () => {
    it('should activate edit mode when pencil icon is clicked', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
    });

    it('should show input field with current value when edit mode is activated', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} value="Current Value" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Current Value');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('should auto-focus input field when edit mode is activated', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      expect(input).toHaveFocus();
    });
  });

  describe('Text Input Fields', () => {
    it('should render text input for default type', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input for email type', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} inputType="email" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render number input for number type', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} type="number" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render tel input for tel type', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} inputType="tel" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should show placeholder in input field', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} placeholder="Enter value" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByPlaceholderText('Enter value');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Textarea Fields', () => {
    it('should render textarea for textarea type', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} type="textarea" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const textarea = screen.getByDisplayValue('Test Value');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('should handle multiline text in textarea', async () => {
      const user = userEvent.setup();
      const multilineValue = 'Line 1\nLine 2\nLine 3';
      render(<InlineEditField {...defaultProps} type="textarea" value={multilineValue} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const textarea = screen.getByDisplayValue(multilineValue);
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Select Fields', () => {
    const selectOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    it('should render select dropdown for select type with options', async () => {
      const user = userEvent.setup();
      render(
        <InlineEditField 
          {...defaultProps} 
          inputType="select" 
          options={selectOptions}
          value="option2"
        />
      );
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const select = screen.getByDisplayValue('Option 2');
      expect(select.tagName).toBe('SELECT');
      
      // Check that all options are present
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should show option label in display mode for select fields', () => {
      render(
        <InlineEditField 
          {...defaultProps} 
          inputType="select" 
          options={selectOptions}
          value="option2"
        />
      );
      
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should show value if option not found in display mode', () => {
      render(
        <InlineEditField 
          {...defaultProps} 
          inputType="select" 
          options={selectOptions}
          value="unknown-option"
        />
      );
      
      expect(screen.getByText('unknown-option')).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'testField',
        'Updated Value',
        'record-123',
        'people'
      );
    });

    it('should call onSave when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      await user.keyboard('{Enter}');
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'testField',
        'Updated Value',
        'record-123',
        'people'
      );
    });

    it('should not call onSave when Enter+Shift is pressed in textarea', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} type="textarea" onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const textarea = screen.getByDisplayValue('Test Value');
      await user.clear(textarea);
      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should exit edit mode after successful save', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Updated Value')).not.toBeInTheDocument();
        expect(screen.getByText('Updated Value')).toBeInTheDocument();
      });
    });

    it('should show loading state during save', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      // Check that save button is disabled during loading
      expect(saveButton.closest('button')).toBeDisabled();
    });

    it('should not call onSave if value is unchanged', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      expect(mockOnSave).not.toHaveBeenCalled();
      
      // Should exit edit mode without calling onSave
      await waitFor(() => {
        expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
      });
    });

    it('should call onSuccess callback after successful save', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const mockOnSuccess = jest.fn();
      render(
        <InlineEditField 
          {...defaultProps} 
          onSave={mockOnSave} 
          onSuccess={mockOnSuccess}
        />
      );
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('Testfield updated successfully!');
      });
    });

    it('should call onSuccess with custom success message', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const mockOnSuccess = jest.fn();
      render(
        <InlineEditField 
          {...defaultProps} 
          onSave={mockOnSave} 
          onSuccess={mockOnSuccess}
          successMessage="Custom success message"
        />
      );
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('Custom success message');
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should cancel edit when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Changed Value');
      
      const cancelButton = screen.getByTestId('x-mark-icon');
      await user.click(cancelButton);
      
      expect(mockOnSave).not.toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Changed Value')).not.toBeInTheDocument();
        expect(screen.getByText('Test Value')).toBeInTheDocument();
      });
    });

    it('should cancel edit when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Changed Value');
      await user.keyboard('{Escape}');
      
      expect(mockOnSave).not.toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Changed Value')).not.toBeInTheDocument();
        expect(screen.getByText('Test Value')).toBeInTheDocument();
      });
    });

    it('should revert to original value when cancelled', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} value="Original Value" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Original Value');
      await user.clear(input);
      await user.type(input, 'Modified Value');
      
      const cancelButton = screen.getByTestId('x-mark-icon');
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByText('Original Value')).toBeInTheDocument();
        expect(screen.queryByText('Modified Value')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      const mockOnSuccess = jest.fn();
      render(
        <InlineEditField 
          {...defaultProps} 
          onSave={mockOnSave} 
          onSuccess={mockOnSuccess}
        />
      );
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('Failed to update. Please try again.');
      });
      
      // Should stay in edit mode on error
      expect(screen.getByDisplayValue('Updated Value')).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn()
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      await user.clear(input);
      await user.type(input, 'Updated Value');
      
      // First save attempt - should fail
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Updated Value')).toBeInTheDocument();
      });
      
      // Second save attempt - should succeed
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Updated Value')).not.toBeInTheDocument();
        expect(screen.getByText('Updated Value')).toBeInTheDocument();
      });
    });
  });

  describe('Value Synchronization', () => {
    it('should update display value when prop value changes', () => {
      const { rerender } = render(<InlineEditField {...defaultProps} value="Initial Value" />);
      
      expect(screen.getByText('Initial Value')).toBeInTheDocument();
      
      rerender(<InlineEditField {...defaultProps} value="Updated Value" />);
      
      expect(screen.getByText('Updated Value')).toBeInTheDocument();
    });

    it('should update edit value when prop value changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<InlineEditField {...defaultProps} value="Initial Value" />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      expect(screen.getByDisplayValue('Initial Value')).toBeInTheDocument();
      
      rerender(<InlineEditField {...defaultProps} value="Updated Value" />);
      
      expect(screen.getByDisplayValue('Updated Value')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      render(<InlineEditField {...defaultProps} />);
      
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      expect(editButton).toHaveAttribute('title', 'Click to edit');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} />);
      
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      editButton?.focus();
      
      await user.keyboard('{Enter}');
      
      expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
    });

    it('should support tab navigation', async () => {
      const user = userEvent.setup();
      render(<InlineEditField {...defaultProps} />);
      
      const editButton = screen.getByTestId('pencil-icon').closest('button');
      editButton?.focus();
      
      await user.tab();
      
      // Should be able to tab away from the component
      expect(document.activeElement).not.toBe(editButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long values', async () => {
      const user = userEvent.setup();
      const longValue = 'A'.repeat(1000);
      render(<InlineEditField {...defaultProps} value={longValue} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue(longValue);
      expect(input).toBeInTheDocument();
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      const specialValue = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      render(<InlineEditField {...defaultProps} value={specialValue} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue(specialValue);
      expect(input).toBeInTheDocument();
    });

    it('should handle unicode characters', async () => {
      const user = userEvent.setup();
      const unicodeValue = 'Unicode: 中文, العربية, русский, 日本語';
      render(<InlineEditField {...defaultProps} value={unicodeValue} />);
      
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue(unicodeValue);
      expect(input).toBeInTheDocument();
    });

    it('should handle rapid successive edits', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);
      
      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);
      
      const input = screen.getByDisplayValue('Test Value');
      
      // Make rapid changes
      await user.clear(input);
      await user.type(input, 'Value 1');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Value 1')).not.toBeInTheDocument();
      });
      
      // Enter edit mode again
      const pencilIcon2 = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon2);
      
      const input2 = screen.getByDisplayValue('Value 1');
      await user.clear(input2);
      await user.type(input2, 'Value 2');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Value 2')).not.toBeInTheDocument();
        expect(screen.getByText('Value 2')).toBeInTheDocument();
      });
    });
  });
});
