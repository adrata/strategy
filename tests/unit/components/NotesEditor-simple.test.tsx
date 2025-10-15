/**
 * NotesEditor Component Simple Unit Tests
 * 
 * Simplified tests that focus on the core functionality and match the actual component structure.
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

describe('NotesEditor Simple Unit Tests', () => {
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

    it('should show Notes title', () => {
      render(<NotesEditor {...defaultProps} />);
      
      expect(screen.getByText('Notes')).toBeInTheDocument();
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
  });

  describe('Save Status Display', () => {
    it('should show unsaved changes when content is modified', async () => {
      const user = userEvent.setup();
      
      render(<NotesEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Modified content');
      
      // Should show unsaved changes indicator
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
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
        expect(screen.getByText(/Last saved/)).toBeInTheDocument();
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
        expect(screen.getByText('Error saving')).toBeInTheDocument();
      });
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
  });
});
