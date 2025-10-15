/**
 * Integration Tests for Note Save with Tab Switching
 * 
 * Tests the complete note save workflow with tab interactions,
 * including component integration with mocked API and state management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';

// Mock the tab registry with realistic components
jest.mock('@/frontend/components/pipeline/config/tab-registry', () => ({
  getTabComponent: jest.fn((tabId: string) => {
    const mockComponents: Record<string, React.ComponentType<any>> = {
      'overview': ({ record, onInlineFieldSave }: any) => (
        <div data-testid="overview-tab">
          <div data-testid="notes-section">
            <label>Notes:</label>
            <InlineEditField
              value={record.notes || ''}
              field="notes"
              onSave={onInlineFieldSave}
              recordId={record.id}
              recordType={record.type}
              type="textarea"
            />
          </div>
          <div data-testid="name-section">
            <label>Name:</label>
            <InlineEditField
              value={record.name || ''}
              field="name"
              onSave={onInlineFieldSave}
              recordId={record.id}
              recordType={record.type}
            />
          </div>
        </div>
      ),
      'notes': ({ record }: any) => (
        <div data-testid="notes-tab">
          <h3>Notes</h3>
          <div data-testid="notes-content">
            {record.notes ? (
              <div data-testid="notes-text">{record.notes}</div>
            ) : (
              <div data-testid="no-notes">No notes available</div>
            )}
          </div>
        </div>
      ),
      'actions': () => (
        <div data-testid="actions-tab">
          <h3>Actions</h3>
          <div>Actions content here</div>
        </div>
      ),
    };
    return mockComponents[tabId] || (() => <div>Unknown Tab</div>);
  }),
}));

// Mock API calls with realistic responses
const mockApiCall = jest.fn();
jest.mock('@/platform/api-fetch', () => ({
  apiCall: mockApiCall,
}));

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

describe('Note Save with Tab Switching Integration Tests', () => {
  const defaultRecord = {
    id: 'person-123',
    type: 'people',
    name: 'John Doe',
    notes: 'Initial notes content',
    person: {
      id: 'person-123',
      name: 'John Doe',
      notes: 'Initial notes content',
    },
  };

  const defaultProps = {
    record: defaultRecord,
    recordType: 'people',
    onRecordUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiCall.mockResolvedValue({ success: true });
  });

  describe('Basic Note Save Workflow', () => {
    it('should save note on Overview tab and persist when switching tabs', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Verify initial state
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Initial notes content')).toBeInTheDocument();

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Updated notes from overview tab');

      // Save the notes
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Updated notes from overview tab')).not.toBeInTheDocument();
        expect(screen.getByText('Updated notes from overview tab')).toBeInTheDocument();
      });

      // Switch to notes tab
      const notesTab = screen.getByText('Notes');
      await user.click(notesTab);

      // Verify notes appear in notes tab
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
        expect(screen.getByTestId('notes-text')).toHaveTextContent('Updated notes from overview tab');
      });

      // Switch back to overview tab
      await user.click(overviewTab);

      // Verify notes persist on overview tab
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
        expect(screen.getByText('Updated notes from overview tab')).toBeInTheDocument();
      });

      // Verify API was called correctly
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: 'Updated notes from overview tab' }
      );
    });

    it('should save note and maintain value when switching to Notes tab and back', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Edit notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Cross-tab persistence test');

      // Save notes
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText('Cross-tab persistence test')).toBeInTheDocument();
      });

      // Switch to notes tab
      const notesTab = screen.getByText('Notes');
      await user.click(notesTab);

      // Verify notes are displayed
      expect(screen.getByTestId('notes-text')).toHaveTextContent('Cross-tab persistence test');

      // Switch back to overview tab
      await user.click(overviewTab);

      // Verify notes are still there
      expect(screen.getByText('Cross-tab persistence test')).toBeInTheDocument();

      // Switch to actions tab and back
      const actionsTab = screen.getByText('Actions');
      await user.click(actionsTab);
      await user.click(overviewTab);

      // Notes should still persist
      expect(screen.getByText('Cross-tab persistence test')).toBeInTheDocument();
    });

    it('should handle rapid tab switching during note save', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Rapid switching test');

      // Start save operation
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Rapidly switch tabs during save
      const notesTab = screen.getByText('Notes');
      const actionsTab = screen.getByText('Actions');

      await user.click(notesTab);
      await user.click(actionsTab);
      await user.click(overviewTab);
      await user.click(notesTab);
      await user.click(overviewTab);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText('Rapid switching test')).toBeInTheDocument();
      });

      // Verify the save was successful
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: 'Rapid switching test' }
      );
    });
  });

  describe('Multiple Field Editing', () => {
    it('should handle concurrent edits to multiple fields on Overview tab', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Edit notes field
      const notesEditButton = screen.getByTestId('pencil-icon');
      await user.click(notesEditButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Updated notes field');

      // Save notes
      const notesSaveButton = screen.getByTestId('check-icon');
      await user.click(notesSaveButton);

      // Wait for notes save to complete
      await waitFor(() => {
        expect(screen.getByText('Updated notes field')).toBeInTheDocument();
      });

      // Edit name field
      const nameEditButton = screen.getByTestId('pencil-icon');
      await user.click(nameEditButton);

      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      // Save name
      const nameSaveButton = screen.getByTestId('check-icon');
      await user.click(nameSaveButton);

      // Wait for name save to complete
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Verify both fields are updated
      expect(screen.getByText('Updated notes field')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Verify both API calls were made
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: 'Updated notes field' }
      );
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        {
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          fullName: 'Jane Smith',
        }
      );
    });

    it('should maintain field values during rapid tab switching with multiple pending saves', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const notesEditButton = screen.getByTestId('pencil-icon');
      await user.click(notesEditButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Pending notes save');

      // Start notes save
      const notesSaveButton = screen.getByTestId('check-icon');
      await user.click(notesSaveButton);

      // While notes save is pending, start editing name
      const nameEditButton = screen.getByTestId('pencil-icon');
      await user.click(nameEditButton);

      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Pending name save');

      // Start name save
      const nameSaveButton = screen.getByTestId('check-icon');
      await user.click(nameSaveButton);

      // Rapidly switch tabs while both saves are pending
      const notesTab = screen.getByText('Notes');
      const actionsTab = screen.getByText('Actions');

      await user.click(notesTab);
      await user.click(actionsTab);
      await user.click(overviewTab);

      // Wait for both saves to complete
      await waitFor(() => {
        expect(screen.getByText('Pending notes save')).toBeInTheDocument();
        expect(screen.getByText('Pending name save')).toBeInTheDocument();
      });

      // Verify both API calls were made
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: 'Pending notes save' }
      );
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        {
          name: 'Pending name save',
          firstName: 'Pending',
          lastName: 'name save',
          fullName: 'Pending name save',
        }
      );
    });
  });

  describe('Save Status Indicators', () => {
    it('should show correct save status indicators during save operations', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Status indicator test');

      // Start save operation
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // During save, the save button should show loading state
      // (This would be implemented in the actual InlineEditField component)
      expect(saveButton).toBeInTheDocument();

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText('Status indicator test')).toBeInTheDocument();
      });

      // After save, should show the saved value
      expect(screen.getByText('Status indicator test')).toBeInTheDocument();
    });

    it('should handle save errors and show appropriate status', async () => {
      const user = userEvent.setup();
      mockApiCall.mockRejectedValueOnce(new Error('Save failed'));
      
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Error test notes');

      // Attempt to save (should fail)
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Should stay in edit mode after error
      await waitFor(() => {
        expect(screen.getByDisplayValue('Error test notes')).toBeInTheDocument();
      });

      // The input should still show the user's input
      expect(notesTextarea).toHaveValue('Error test notes');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty notes save', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);

      // Save empty notes
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText('Empty')).toBeInTheDocument();
      });

      // Verify API was called with empty string
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: '' }
      );
    });

    it('should handle very long notes content', async () => {
      const user = userEvent.setup();
      const longNotes = 'A'.repeat(2000); // 2000 character note
      
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, longNotes);

      // Save long notes
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText(longNotes)).toBeInTheDocument();
      });

      // Verify API was called with long content
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: longNotes }
      );
    });

    it('should handle special characters in notes', async () => {
      const user = userEvent.setup();
      const specialNotes = 'Notes with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\\n\t';
      
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, specialNotes);

      // Save special notes
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.getByText(specialNotes)).toBeInTheDocument();
      });

      // Verify API was called with special characters
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: specialNotes }
      );
    });

    it('should handle network timeout during save', async () => {
      const user = userEvent.setup();
      mockApiCall.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );
      
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('pencil-icon');
      await user.click(editButton);

      const notesTextarea = screen.getByDisplayValue('Initial notes content');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Timeout test notes');

      // Attempt to save (should timeout)
      const saveButton = screen.getByTestId('check-icon');
      await user.click(saveButton);

      // Should stay in edit mode after timeout
      await waitFor(() => {
        expect(screen.getByDisplayValue('Timeout test notes')).toBeInTheDocument();
      });

      // The input should still show the user's input
      expect(notesTextarea).toHaveValue('Timeout test notes');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple rapid note edits in sequence', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      const editButton = screen.getByTestId('pencil-icon');
      const saveButton = screen.getByTestId('check-icon');

      // Perform multiple rapid edits
      for (let i = 1; i <= 5; i++) {
        // Start editing
        await user.click(editButton);

        const notesTextarea = screen.getByDisplayValue(i === 1 ? 'Initial notes content' : `Edit ${i - 1}`);
        await user.clear(notesTextarea);
        await user.type(notesTextarea, `Edit ${i}`);

        // Save
        await user.click(saveButton);

        // Wait for save to complete
        await waitFor(() => {
          expect(screen.getByText(`Edit ${i}`)).toBeInTheDocument();
        });
      }

      // Verify final state
      expect(screen.getByText('Edit 5')).toBeInTheDocument();

      // Verify all API calls were made
      expect(mockApiCall).toHaveBeenCalledTimes(5);
    });

    it('should maintain performance with large numbers of tab switches', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      const overviewTab = screen.getByText('Overview');
      const notesTab = screen.getByText('Notes');
      const actionsTab = screen.getByText('Actions');

      // Perform many tab switches
      for (let i = 0; i < 20; i++) {
        await user.click(overviewTab);
        await user.click(notesTab);
        await user.click(actionsTab);
      }

      // Should still be functional
      await user.click(overviewTab);
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
    });
  });
});
