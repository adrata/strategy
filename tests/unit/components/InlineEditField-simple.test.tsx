/**
 * Simple Unit Tests for InlineEditField Save State Functionality
 * 
 * Tests the core isSaving state functionality with minimal mocking
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

describe('InlineEditField Simple Save State Tests', () => {
  const defaultProps = {
    value: 'Initial Value',
    field: 'testField',
    onSave: jest.fn(),
    recordId: 'record-123',
    recordType: 'people',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Save State Functionality', () => {
    it('should not sync value prop while isSaving is true', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Modified Value');

      // Start save operation
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // While saving, change the value prop
      rerender(
        <InlineEditField {...defaultProps} value="External Change" onSave={mockOnSave} />
      );

      // The input should still show the modified value, not the external change
      expect(input).toHaveValue('Modified Value');

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should maintain edit value during save operation', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );
      
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Persistent Value');

      // Start save operation
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // During save, the input should still show the value
      expect(input).toHaveValue('Persistent Value');

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should prevent multiple simultaneous saves', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Single Save Value');

      const saveButton = screen.getByTestId('check-icon');
      
      // Click save multiple times rapidly
      await user.click(saveButton);
      await user.click(saveButton);
      await user.click(saveButton);

      // Should only call onSave once
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle save operation with empty value', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);

      // Start save with empty value
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Change value prop during save
      rerender(
        <InlineEditField {...defaultProps} value="Non-empty Value" onSave={mockOnSave} />
      );

      // Input should still be empty
      expect(input).toHaveValue('');

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle failed saves and stay in edit mode', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Failed Save Value');

      // Attempt to save (should fail)
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Should stay in edit mode after error, but with original value
      await waitFor(() => {
        expect(screen.getByDisplayValue('Initial Value')).toBeInTheDocument();
      });

      // The input should show the original value after failed save
      expect(input).toHaveValue('Initial Value');
    });
  });

  describe('Value Prop Synchronization', () => {
    it('should sync value prop changes when not saving', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Change value prop when not editing
      rerender(
        <InlineEditField {...defaultProps} value="Updated Value" onSave={mockOnSave} />
      );

      // Should show updated value
      expect(screen.getByText('Updated Value')).toBeInTheDocument();
    });

    it('should ignore value prop changes during save operation', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 150))
      );
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'User Input');

      // Start save
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Change value prop multiple times during save
      rerender(
        <InlineEditField {...defaultProps} value="Change 1" onSave={mockOnSave} />
      );
      rerender(
        <InlineEditField {...defaultProps} value="Change 2" onSave={mockOnSave} />
      );
      rerender(
        <InlineEditField {...defaultProps} value="Change 3" onSave={mockOnSave} />
      );

      // Input should still show user input
      expect(input).toHaveValue('User Input');

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Textarea Fields', () => {
    it('should maintain textarea value during save operation', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} type="textarea" onSave={mockOnSave} />
      );

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const textarea = screen.getByDisplayValue('Initial Value');
      await user.clear(textarea);
      await user.type(textarea, 'Multi-line\nTextarea\nContent');

      // Start save
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Change value prop during save
      rerender(
        <InlineEditField {...defaultProps} type="textarea" value="External Change" onSave={mockOnSave} />
      );

      // Textarea should still show user input
      expect(textarea).toHaveValue('Multi-line\nTextarea\nContent');

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });
});
