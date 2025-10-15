/**
 * Unit Tests for InlineEditField Save State Functionality
 * 
 * Tests the enhanced isSaving state that prevents value resets during save operations
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

describe('InlineEditField Save State Functionality', () => {
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

  describe('isSaving State Management', () => {
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

    it('should resume syncing value prop after save completes', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode and save
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Saved Value');

      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Saved Value')).not.toBeInTheDocument();
      });

      // Now change the value prop - it should sync
      rerender(
        <InlineEditField {...defaultProps} value="New External Value" onSave={mockOnSave} />
      );

      expect(screen.getByText('New External Value')).toBeInTheDocument();
    });

    it('should handle successful saves without value resets', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Success Value');

      // Save the value
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete and exit edit mode
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Success Value')).not.toBeInTheDocument();
        expect(screen.getByText('Success Value')).toBeInTheDocument();
      });

      expect(mockOnSave).toHaveBeenCalledWith(
        'testField',
        'Success Value',
        'record-123',
        'people'
      );
    });

    it('should handle failed saves and allow retry', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn()
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce(undefined);
      
      render(<InlineEditField {...defaultProps} onSave={mockOnSave} />);

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Retry Value');

      // First save attempt - should fail
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Should stay in edit mode after error
      await waitFor(() => {
        expect(screen.getByDisplayValue('Retry Value')).toBeInTheDocument();
      });

      // Second save attempt - should succeed
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Retry Value')).not.toBeInTheDocument();
        expect(screen.getByText('Retry Value')).toBeInTheDocument();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(2);
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
  });

  describe('Save State with Value Prop Changes', () => {
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

    it('should sync value prop changes after save completes successfully', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode and save
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Saved Input');

      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Saved Input')).not.toBeInTheDocument();
      });

      // Now change value prop - should sync
      rerender(
        <InlineEditField {...defaultProps} value="Post Save Change" onSave={mockOnSave} />
      );

      expect(screen.getByText('Post Save Change')).toBeInTheDocument();
    });

    it('should sync value prop changes after save fails', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode and attempt save
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Failed Save Input');

      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to fail
      await waitFor(() => {
        expect(screen.getByDisplayValue('Failed Save Input')).toBeInTheDocument();
      });

      // Change value prop - should sync even after failed save
      rerender(
        <InlineEditField {...defaultProps} value="After Failed Save" onSave={mockOnSave} />
      );

      expect(screen.getByText('After Failed Save')).toBeInTheDocument();
    });
  });

  describe('Save State with Textarea Fields', () => {
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

  describe('Edge Cases', () => {
    it('should handle rapid value prop changes during save', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );
      
      const { rerender } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Stable Value');

      // Start save
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Rapidly change value prop
      for (let i = 0; i < 10; i++) {
        rerender(
          <InlineEditField {...defaultProps} value={`Rapid Change ${i}`} onSave={mockOnSave} />
        );
      }

      // Input should still show stable value
      expect(input).toHaveValue('Stable Value');

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
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

    it('should handle component unmount during save operation', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { unmount } = render(
        <InlineEditField {...defaultProps} onSave={mockOnSave} />
      );

      // Enter edit mode
      const pencilIcon = screen.getByTestId('pencil-icon');
      await user.click(pencilIcon);

      const input = screen.getByDisplayValue('Initial Value');
      await user.clear(input);
      await user.type(input, 'Unmount Value');

      // Start save
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Unmount component during save
      unmount();

      // Should not throw any errors
      expect(() => unmount()).not.toThrow();
    });
  });
});
