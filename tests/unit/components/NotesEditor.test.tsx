/**
 * NotesEditor Component Unit Tests
 * 
 * Tests the NotesEditor component in isolation, focusing on save logic,
 * debouncing, state management, and cleanup behavior.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesEditor } from '@/platform/ui/components/NotesEditor';

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className}>✓</div>
  ),
  ClockIcon: ({ className }: { className?: string }) => (
    <div data-testid="clock-icon" className={className}>🕐</div>
  ),
  ExclamationTriangleIcon: ({ className }: { className?: string }) => (
    <div data-testid="warning-icon" className={className}>⚠️</div>
  )
}));

describe('NotesEditor Unit Tests', () => {
  const defaultProps = {
    value: 'Initial notes content',
    onChange: jest.fn(),
    onSave: jest.fn(),
    placeholder: 'Add your notes here...',
    autoSave: true,
    debounceMs: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('should render with initial value', () => {
      render(<NotesEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Initial notes content');
    });

    it('should render with placeholder when value is empty', () => {
      render(<NotesEditor {...defaultProps} value="" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Add your notes here...');
    });

    it('should apply custom className', () => {
      render(<NotesEditor {...defaultProps} className="custom-class" />);
      
      const editor = screen.getByTestId('notes-editor');
      expect(editor).toHaveClass('custom-class');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<NotesEditor {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });
  });

  describe('Text Input and onChange', () => {
    it('should call onChange when text is typed', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<NotesEditor {...defaultProps} onChange={mockOnChange} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'New content');
      
      expect(mockOnChange).toHaveBeenCalledWith('New content');
    });

    it('should update local value when typing', async () => {
      const user = userEvent.setup();
      
      render(<NotesEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Local value test');
      
      expect(textarea).toHaveValue('Local value test');
    });

    it('should auto-resize textarea when content changes', async () => {
      const user = userEvent.setup();
      
      render(<NotesEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const initialHeight = textarea.style.height;
      
      // Add multiline content
      await user.clear(textarea);
      await user.type(textarea, 'Line 1\nLine 2\nLine 3');
      
      // Height should have changed due to auto-resize
      expect(textarea.style.height).not.toBe(initialHeight);
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should trigger auto-save after debounce period', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Auto-save test');
      
      // Advance timers by debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('Auto-save test');
      });
    });

    it('should not auto-save when autoSave is disabled', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSave = jest.fn();
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} autoSave={false} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'No auto-save test');
      
      // Advance timers by debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should not have called onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not auto-save if content is unchanged', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSave = jest.fn();
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textarea');
      
      // Focus and blur without changing content
      await user.click(textarea);
      await user.tab();
      
      // Advance timers
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear previous timeout when new changes are made', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Type first change
      await user.clear(textarea);
      await user.type(textarea, 'First change');
      
      // Advance timers partially
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Type second change (should clear previous timeout)
      await user.clear(textarea);
      await user.type(textarea, 'Second change');
      
      // Advance timers by full debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should only save the second change
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith('Second change');
      });
    });
  });

  describe('Save on Blur', () => {
    it('should save immediately when textarea loses focus', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Blur save test');
      
      // Blur the textarea
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('Blur save test');
      });
    });

    it('should not save on blur if content is unchanged', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Focus and blur without changing content
      await user.click(textarea);
      await user.tab();
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear debounce timeout on blur', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Blur timeout test');
      
      // Blur before debounce period
      await user.tab();
      
      // Advance timers by debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should only have been called once (on blur), not twice
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Save on Unmount', () => {
    it('should save pending changes when component unmounts', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      const { unmount } = render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Unmount save test');
      
      // Unmount component
      unmount();
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('Unmount save test');
      });
    });

    it('should not save on unmount if content is unchanged', async () => {
      const mockOnSave = jest.fn();
      
      const { unmount } = render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      // Unmount without making changes
      unmount();
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear timeout on unmount', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      const { unmount } = render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Unmount timeout test');
      
      // Unmount before debounce period
      unmount();
      
      // Advance timers by debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should only have been called once (on unmount), not twice
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Save Status Management', () => {
    it('should show saving status during save operation', async () => {
      const user = userEvent.setup();
      
      // Mock slow save operation
      let resolveSave: (value: any) => void;
      const savePromise = new Promise(resolve => {
        resolveSave = resolve;
      });
      const mockOnSave = jest.fn().mockReturnValue(savePromise);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Saving status test');
      await user.tab();
      
      // Should show saving status
      expect(screen.getByTestId('save-status')).toHaveTextContent('saving');
      
      // Resolve save operation
      resolveSave!(undefined);
      
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent('saved');
      });
    });

    it('should show saved status after successful save', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Saved status test');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent('saved');
      });
    });

    it('should show error status after failed save', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Error status test');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent('error');
      });
    });

    it('should show last saved time when provided', () => {
      const lastSavedAt = new Date('2024-01-01T12:00:00Z');
      
      render(<NotesEditor {...defaultProps} lastSavedAt={lastSavedAt} />);
      
      expect(screen.getByTestId('last-saved-time')).toHaveTextContent('Last saved');
    });
  });

  describe('Value Synchronization', () => {
    it('should sync with external value changes when not focused', () => {
      const { rerender } = render(<NotesEditor {...defaultProps} value="Initial value" />);
      
      expect(screen.getByRole('textbox')).toHaveValue('Initial value');
      
      // Update external value
      rerender(<NotesEditor {...defaultProps} value="Updated value" />);
      
      expect(screen.getByRole('textbox')).toHaveValue('Updated value');
    });

    it('should not sync with external value changes when focused', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<NotesEditor {...defaultProps} value="Initial value" />);
      
      const textarea = screen.getByRole('textbox');
      
      // Focus the textarea
      await user.click(textarea);
      
      // Update external value while focused
      rerender(<NotesEditor {...defaultProps} value="External update" />);
      
      // Should preserve local value, not sync external update
      expect(textarea).toHaveValue('Initial value');
    });

    it('should sync with external value changes after blur', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<NotesEditor {...defaultProps} value="Initial value" />);
      
      const textarea = screen.getByRole('textbox');
      
      // Focus and blur
      await user.click(textarea);
      await user.tab();
      
      // Update external value after blur
      rerender(<NotesEditor {...defaultProps} value="External update after blur" />);
      
      // Should sync external update
      expect(textarea).toHaveValue('External update after blur');
    });
  });

  describe('Focus and Blur Handling', () => {
    it('should call onFocus when textarea is focused', async () => {
      const user = userEvent.setup();
      const mockOnFocus = jest.fn();
      
      render(<NotesEditor {...defaultProps} onFocus={mockOnFocus} />);
      
      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      
      expect(mockOnFocus).toHaveBeenCalled();
    });

    it('should call onBlur when textarea loses focus', async () => {
      const user = userEvent.setup();
      const mockOnBlur = jest.fn();
      
      render(<NotesEditor {...defaultProps} onBlur={mockOnBlur} />);
      
      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.tab();
      
      expect(mockOnBlur).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text content', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      const longText = 'A'.repeat(1000);
      
      await user.clear(textarea);
      await user.type(textarea, longText);
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(longText);
      });
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      const specialText = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      
      await user.clear(textarea);
      await user.type(textarea, specialText);
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(specialText);
      });
    });

    it('should handle unicode characters', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      const unicodeText = 'Unicode: 中文, العربية, русский, 日本語';
      
      await user.clear(textarea);
      await user.type(textarea, unicodeText);
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(unicodeText);
      });
    });

    it('should handle empty content', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Clear all content
      await user.clear(textarea);
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('');
      });
    });

    it('should handle rapid successive changes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      
      render(<NotesEditor {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByRole('textbox');
      
      // Make rapid changes
      await user.clear(textarea);
      await user.type(textarea, 'Change 1');
      
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      await user.clear(textarea);
      await user.type(textarea, 'Change 2');
      
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      await user.clear(textarea);
      await user.type(textarea, 'Change 3');
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Should only save the final change
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnSave).toHaveBeenCalledWith('Change 3');
      });
    });
  });
});
