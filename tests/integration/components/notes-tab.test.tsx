/**
 * NotesTab Component Integration Tests
 * 
 * Tests the NotesTab component interactions with API, state management,
 * and tab switching behavior to ensure notes are properly saved and preserved.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesTab } from '@/frontend/components/pipeline/UniversalRecordTemplate';

// Mock the NotesEditor component
jest.mock('@/platform/ui/components/NotesEditor', () => ({
  NotesEditor: ({ 
    value, 
    onChange, 
    onFocus, 
    onBlur, 
    onSave, 
    saveStatus, 
    lastSavedAt,
    placeholder,
    className 
  }: any) => (
    <div data-testid="notes-editor" className={className}>
      <textarea
        data-testid="notes-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      <div data-testid="save-status">{saveStatus}</div>
      {lastSavedAt && (
        <div data-testid="last-saved">Last saved {lastSavedAt.toISOString()}</div>
      )}
      <button 
        data-testid="manual-save-button"
        onClick={() => onSave && onSave(value)}
      >
        Save
      </button>
    </div>
  )
}));

// Mock the useRecordContext hook
const mockUpdateCurrentRecord = jest.fn();
jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    updateCurrentRecord: mockUpdateCurrentRecord
  })
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NotesTab Integration Tests', () => {
  const defaultProps = {
    record: {
      id: 'test-record-123',
      notes: 'Initial notes content',
      updatedAt: '2024-01-01T12:00:00Z'
    },
    recordType: 'people'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Default successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'test-record-123',
          notes: 'Updated notes content',
          updatedAt: '2024-01-01T12:01:00Z'
        }
      })
    });
  });

  describe('Component Rendering', () => {
    it('should render NotesTab with initial notes from record', () => {
      render(<NotesTab {...defaultProps} />);
      
      expect(screen.getByTestId('notes-editor')).toBeInTheDocument();
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Initial notes content');
    });

    it('should render with empty notes when record has no notes', () => {
      const propsWithoutNotes = {
        ...defaultProps,
        record: { ...defaultProps.record, notes: null }
      };
      
      render(<NotesTab {...propsWithoutNotes} />);
      
      expect(screen.getByTestId('notes-textarea')).toHaveValue('');
    });

    it('should render with notes from object format', () => {
      const propsWithObjectNotes = {
        ...defaultProps,
        record: { 
          ...defaultProps.record, 
          notes: { content: 'Notes from object format' }
        }
      };
      
      render(<NotesTab {...propsWithObjectNotes} />);
      
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Notes from object format');
    });

    it('should show word and character count', () => {
      render(<NotesTab {...defaultProps} />);
      
      expect(screen.getByText('2 words')).toBeInTheDocument();
      expect(screen.getByText('20 characters')).toBeInTheDocument();
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save notes after debounce period', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Type new notes
      await user.clear(textarea);
      await user.type(textarea, 'New auto-saved notes');
      
      // Wait for debounce period (1000ms) + API call
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/people/test-record-123',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'New auto-saved notes' })
        })
      );
    });

    it('should save immediately on blur', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Type new notes
      await user.clear(textarea);
      await user.type(textarea, 'Blur save test');
      
      // Blur the textarea
      await user.tab();
      
      // Wait for immediate save
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ notes: 'Blur save test' })
          })
        );
      });
    });

    it('should not save if content is unchanged', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Focus and blur without changing content
      await user.click(textarea);
      await user.tab();
      
      // Wait a bit to ensure no save was triggered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error'
      });
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Type new notes
      await user.clear(textarea);
      await user.type(textarea, 'Error test notes');
      
      // Blur to trigger save
      await user.tab();
      
      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent('error');
      });
      
      // Verify notes are still in the textarea
      expect(textarea).toHaveValue('Error test notes');
    });
  });

  describe('State Synchronization', () => {
    it('should sync notes when record prop changes', () => {
      const { rerender } = render(<NotesTab {...defaultProps} />);
      
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Initial notes content');
      
      // Update record with new notes
      const updatedProps = {
        ...defaultProps,
        record: { ...defaultProps.record, notes: 'Updated notes from prop' }
      };
      
      rerender(<NotesTab {...updatedProps} />);
      
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Updated notes from prop');
    });

    it('should not sync notes when user is actively editing', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Start editing
      await user.click(textarea);
      await user.type(textarea, ' - user is typing');
      
      // Update record prop while user is editing
      const updatedProps = {
        ...defaultProps,
        record: { ...defaultProps.record, notes: 'External update' }
      };
      
      rerender(<NotesTab {...updatedProps} />);
      
      // Should preserve user's changes, not sync external update
      expect(textarea).toHaveValue('Initial notes content - user is typing');
    });

    it('should sync notes after user stops editing', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Start and stop editing
      await user.click(textarea);
      await user.type(textarea, ' - user typed this');
      await user.tab(); // Blur to stop editing
      
      // Update record prop after user stopped editing
      const updatedProps = {
        ...defaultProps,
        record: { ...defaultProps.record, notes: 'External update after edit' }
      };
      
      rerender(<NotesTab {...updatedProps} />);
      
      // Should sync external update
      expect(textarea).toHaveValue('External update after edit');
    });
  });

  describe('Record Type Handling', () => {
    it('should use correct API endpoint for people records', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} recordType="people" />);
      
      const textarea = screen.getByTestId('notes-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'People notes');
      await user.tab();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.any(Object)
        );
      });
    });

    it('should use correct API endpoint for company records', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} recordType="companies" />);
      
      const textarea = screen.getByTestId('notes-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Company notes');
      await user.tab();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/companies/test-record-123',
          expect.any(Object)
        );
      });
    });
  });

  describe('Background Refresh', () => {
    it('should silently refresh notes from API on mount', async () => {
      render(<NotesTab {...defaultProps} />);
      
      // Wait for background refresh
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({
            method: 'GET'
          })
        );
      });
    });

    it('should update notes from background refresh when not editing', async () => {
      render(<NotesTab {...defaultProps} />);
      
      // Wait for background refresh to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({ method: 'GET' })
        );
      });
      
      // Verify notes were updated from API response
      expect(screen.getByTestId('notes-textarea')).toHaveValue('Updated notes content');
    });

    it('should not update notes from background refresh when user is editing', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Start editing before background refresh completes
      await user.click(textarea);
      await user.type(textarea, ' - editing');
      
      // Wait for background refresh
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({ method: 'GET' })
        );
      });
      
      // Should preserve user's changes, not update from API
      expect(textarea).toHaveValue('Initial notes content - editing');
    });
  });

  describe('Save Status Management', () => {
    it('should show saving status during API call', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      let resolveApiCall: (value: any) => void;
      const apiPromise = new Promise(resolve => {
        resolveApiCall = resolve;
      });
      mockFetch.mockReturnValueOnce(apiPromise);
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Saving test');
      await user.tab();
      
      // Should show saving status
      expect(screen.getByTestId('save-status')).toHaveTextContent('saving');
      
      // Resolve API call
      resolveApiCall!({
        ok: true,
        json: async () => ({ success: true, data: { notes: 'Saving test' } })
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent('saved');
      });
    });

    it('should show saved status after successful save', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Saved test');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent('saved');
      });
    });

    it('should show error status after failed save', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error'
      });
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Error test');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toHaveTextContent('error');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty notes correctly', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      
      // Clear all notes
      await user.clear(textarea);
      await user.tab();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({
            body: JSON.stringify({ notes: '' })
          })
        );
      });
    });

    it('should handle very long notes', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      const longNotes = 'A'.repeat(1000);
      
      await user.clear(textarea);
      await user.type(textarea, longNotes);
      await user.tab();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({
            body: JSON.stringify({ notes: longNotes })
          })
        );
      });
    });

    it('should handle special characters in notes', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      const specialNotes = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      
      await user.clear(textarea);
      await user.type(textarea, specialNotes);
      await user.tab();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({
            body: JSON.stringify({ notes: specialNotes })
          })
        );
      });
    });

    it('should handle unicode characters in notes', async () => {
      const user = userEvent.setup();
      
      render(<NotesTab {...defaultProps} />);
      
      const textarea = screen.getByTestId('notes-textarea');
      const unicodeNotes = 'Unicode: 中文, العربية, русский, 日本語';
      
      await user.clear(textarea);
      await user.type(textarea, unicodeNotes);
      await user.tab();
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/people/test-record-123',
          expect.objectContaining({
            body: JSON.stringify({ notes: unicodeNotes })
          })
        );
      });
    });
  });
});
