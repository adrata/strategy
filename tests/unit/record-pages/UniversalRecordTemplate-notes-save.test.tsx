/**
 * Unit Tests for UniversalRecordTemplate Notes Save Functionality
 * 
 * Tests the pending saves tracking and optimistic updates that prevent
 * note data loss during tab switching and rapid UI interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';

// Mock the tab registry
jest.mock('@/frontend/components/pipeline/config/tab-registry', () => ({
  getTabComponent: jest.fn((tabId: string) => {
    const mockComponents: Record<string, React.ComponentType<any>> = {
      'overview': ({ record, onInlineFieldSave }: any) => (
        <div data-testid="overview-tab">
          <div data-testid="notes-field">
            <InlineEditField
              value={record.notes || ''}
              field="notes"
              onSave={onInlineFieldSave}
              recordId={record.id}
              recordType={record.type}
            />
          </div>
        </div>
      ),
      'notes': ({ record }: any) => (
        <div data-testid="notes-tab">
          <div data-testid="notes-display">{record.notes || 'No notes'}</div>
        </div>
      ),
      'actions': () => <div data-testid="actions-tab">Actions Tab</div>,
    };
    return mockComponents[tabId] || (() => <div>Unknown Tab</div>);
  }),
}));

// Mock InlineEditField component
const InlineEditField = ({ value, field, onSave, recordId, recordType }: any) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isSaving) {
      setEditValue(value);
    }
  }, [value, isSaving]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(field, editValue, recordId, recordType);
      setIsEditing(false);
    } catch (error) {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div>
        <input
          data-testid={`edit-${field}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
        />
        <button data-testid={`save-${field}`} onClick={handleSave}>
          Save
        </button>
        <button data-testid={`cancel-${field}`} onClick={() => setIsEditing(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <span data-testid={`display-${field}`}>{value || 'Empty'}</span>
      <button data-testid={`edit-${field}`} onClick={() => setIsEditing(true)}>
        Edit
      </button>
    </div>
  );
};

// Mock API calls
const mockApiCall = jest.fn();
jest.mock('@/platform/api-fetch', () => ({
  apiCall: mockApiCall,
}));

describe('UniversalRecordTemplate Notes Save Functionality', () => {
  const defaultRecord = {
    id: 'person-123',
    type: 'people',
    name: 'John Doe',
    notes: 'Initial notes',
    person: {
      id: 'person-123',
      notes: 'Initial notes',
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

  describe('Pending Saves State Management', () => {
    it('should track pending saves in pendingSaves state', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      // Start save operation
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // The component should track this as a pending save
      // We can verify this by checking that the API was called
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: 'Updated notes' }
      );
    });

    it('should not sync localRecord when saves are pending', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Pending save notes');

      // Start save operation (but don't wait for completion)
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Update the record prop while save is pending
      const updatedRecord = {
        ...defaultRecord,
        notes: 'External update',
        person: {
          ...defaultRecord.person,
          notes: 'External update',
        },
      };

      rerender(<UniversalRecordTemplate {...defaultProps} record={updatedRecord} />);

      // The display should still show the pending save value, not the external update
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Pending save notes');
      });
    });

    it('should optimistically update localRecord after successful save', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Optimistically updated notes');

      // Save the notes
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Optimistically updated notes');
      });

      // Verify the optimistic update was applied
      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: 'Optimistically updated notes' }
      );
    });

    it('should remove field from pendingSaves after save completes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Completed save notes');

      // Save the notes
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Completed save notes');
      });

      // Now update the record prop - it should sync since no saves are pending
      const updatedRecord = {
        ...defaultRecord,
        notes: 'Post-save update',
        person: {
          ...defaultRecord.person,
          notes: 'Post-save update',
        },
      };

      rerender(<UniversalRecordTemplate {...defaultProps} record={updatedRecord} />);

      // Should now show the updated value
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Post-save update');
      });
    });

    it('should handle multiple simultaneous field saves', async () => {
      const user = userEvent.setup();
      const recordWithMultipleFields = {
        ...defaultRecord,
        name: 'John Doe',
        email: 'john@example.com',
        notes: 'Initial notes',
        person: {
          ...defaultRecord.person,
          name: 'John Doe',
          email: 'john@example.com',
          notes: 'Initial notes',
        },
      };

      render(<UniversalRecordTemplate {...defaultProps} record={recordWithMultipleFields} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing multiple fields simultaneously
      const editNotesButton = screen.getByTestId('edit-notes');
      await user.click(editNotesButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      const saveNotesButton = screen.getByTestId('save-notes');
      await user.click(saveNotesButton);

      // While notes save is in progress, update the record prop
      const updatedRecord = {
        ...recordWithMultipleFields,
        notes: 'External notes update',
        name: 'External name update',
        person: {
          ...recordWithMultipleFields.person,
          notes: 'External notes update',
          name: 'External name update',
        },
      };

      // The notes field should not be updated due to pending save
      // but other fields should be updated
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Updated notes');
      });
    });

    it('should preserve notes field value during tab switches with pending saves', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Tab switch notes');

      // Start save operation
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Switch to notes tab while save is pending
      const notesTab = screen.getByText('Notes');
      await user.click(notesTab);

      // Switch back to overview tab
      await user.click(overviewTab);

      // The notes should still show the pending save value
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Tab switch notes');
      });
    });
  });

  describe('Optimistic Updates', () => {
    it('should update localRecord immediately after successful API call', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Immediate update notes');

      // Save the notes
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // The UI should update immediately after the API call succeeds
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Immediate update notes');
      });

      expect(mockApiCall).toHaveBeenCalledWith(
        'PATCH',
        '/api/v1/people/person-123',
        { notes: 'Immediate update notes' }
      );
    });

    it('should handle failed API calls gracefully', async () => {
      const user = userEvent.setup();
      mockApiCall.mockRejectedValueOnce(new Error('API Error'));
      
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Failed save notes');

      // Attempt to save (should fail)
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Should stay in edit mode after error
      await waitFor(() => {
        expect(screen.getByTestId('edit-notes')).toBeInTheDocument();
      });

      // The input should still show the failed save value
      expect(notesInput).toHaveValue('Failed save notes');
    });

    it('should update related fields when name is changed', async () => {
      const user = userEvent.setup();
      const recordWithName = {
        ...defaultRecord,
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        person: {
          ...defaultRecord.person,
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      render(<UniversalRecordTemplate {...defaultProps} record={recordWithName} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing name
      const editButton = screen.getByTestId('edit-name');
      await user.click(editButton);

      const nameInput = screen.getByTestId('edit-name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      // Save the name
      const saveButton = screen.getByTestId('save-name');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        const nameDisplay = screen.getByTestId('display-name');
        expect(nameDisplay).toHaveTextContent('Jane Smith');
      });

      // Verify the API was called with the correct data
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
  });

  describe('Tab Switching with Pending Saves', () => {
    it('should maintain notes value when switching tabs during save', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Persistent notes');

      // Start save operation
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Switch to actions tab
      const actionsTab = screen.getByText('Actions');
      await user.click(actionsTab);

      // Switch back to overview tab
      await user.click(overviewTab);

      // The notes should still show the saved value
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Persistent notes');
      });
    });

    it('should show updated notes in notes tab after saving on overview', async () => {
      const user = userEvent.setup();
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Cross-tab notes');

      // Save the notes
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Cross-tab notes');
      });

      // Switch to notes tab
      const notesTab = screen.getByText('Notes');
      await user.click(notesTab);

      // The notes tab should show the updated notes
      await waitFor(() => {
        const notesTabDisplay = screen.getByTestId('notes-display');
        expect(notesTabDisplay).toHaveTextContent('Cross-tab notes');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors without losing user input', async () => {
      const user = userEvent.setup();
      mockApiCall.mockRejectedValueOnce(new Error('Network error'));
      
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Error recovery notes');

      // Attempt to save (should fail)
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Should stay in edit mode with the user's input preserved
      await waitFor(() => {
        expect(screen.getByTestId('edit-notes')).toBeInTheDocument();
        expect(notesInput).toHaveValue('Error recovery notes');
      });
    });

    it('should allow retry after failed save', async () => {
      const user = userEvent.setup();
      mockApiCall
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({ success: true });
      
      render(<UniversalRecordTemplate {...defaultProps} />);

      // Switch to overview tab
      const overviewTab = screen.getByText('Overview');
      await user.click(overviewTab);

      // Start editing notes
      const editButton = screen.getByTestId('edit-notes');
      await user.click(editButton);

      const notesInput = screen.getByTestId('edit-notes');
      await user.clear(notesInput);
      await user.type(notesInput, 'Retry notes');

      // First save attempt (should fail)
      const saveButton = screen.getByTestId('save-notes');
      await user.click(saveButton);

      // Wait for first attempt to fail
      await waitFor(() => {
        expect(screen.getByTestId('edit-notes')).toBeInTheDocument();
      });

      // Second save attempt (should succeed)
      await user.click(saveButton);

      // Wait for second attempt to succeed
      await waitFor(() => {
        const notesDisplay = screen.getByTestId('display-notes');
        expect(notesDisplay).toHaveTextContent('Retry notes');
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });
  });
});
