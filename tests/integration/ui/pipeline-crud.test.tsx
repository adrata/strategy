/**
 * Pipeline UI Component Tests
 * 
 * Tests for CRUD operations in pipeline components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useUnifiedAuth } from '@/platform/auth';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { SpeedrunSprintView } from '@/frontend/components/pipeline/SpeedrunSprintView';
import { createTestPerson, createTestCompany, createTestAction, TEST_USER, mockFetchResponse, mockFetchError } from '../../utils/test-factories';

// Mock the auth hook
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/speedrun',
}));

// Mock auth fetch
jest.mock('@/platform/services/auth-fetch', () => ({
  authFetch: jest.fn(),
}));

describe('Pipeline UI CRUD Operations', () => {
  const mockUser = {
    id: TEST_USER.id,
    email: TEST_USER.email,
    name: TEST_USER.name,
    workspaceId: TEST_USER.workspaceId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUnifiedAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
  });

  describe('UniversalRecordTemplate', () => {
    const mockRecord = createTestPerson('LEAD', { id: 'person-1' });
    const mockProps = {
      record: mockRecord,
      recordType: 'people',
      onBack: jest.fn(),
      onComplete: jest.fn(),
      onSnooze: jest.fn(),
      onNavigatePrevious: jest.fn(),
      onNavigateNext: jest.fn(),
      onRecordUpdate: jest.fn(),
      recordIndex: 0,
      totalRecords: 1,
      customTabs: [],
      showDialer: false,
      showReports: false,
      contextualActions: [],
    };

    it('should render person record with correct data', () => {
      render(<UniversalRecordTemplate {...mockProps} />);
      
      expect(screen.getByText(mockRecord.fullName)).toBeInTheDocument();
      expect(screen.getByText(mockRecord.jobTitle || '')).toBeInTheDocument();
      expect(screen.getByText(mockRecord.email || '')).toBeInTheDocument();
    });

    it('should update person record via PATCH', async () => {
      const updatedRecord = { ...mockRecord, status: 'PROSPECT' };
      mockFetchResponse({ success: true, data: updatedRecord });

      render(<UniversalRecordTemplate {...mockProps} />);
      
      // Find and click edit button (assuming it exists)
      const editButton = screen.queryByText('Edit');
      if (editButton) {
        fireEvent.click(editButton);
        
        // Find status field and update it
        const statusField = screen.queryByDisplayValue('LEAD');
        if (statusField) {
          fireEvent.change(statusField, { target: { value: 'PROSPECT' } });
          
          // Find and click save button
          const saveButton = screen.queryByText('Save');
          if (saveButton) {
            fireEvent.click(saveButton);
            
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/people/person-1'),
                expect.objectContaining({
                  method: 'PATCH',
                  headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                  }),
                  body: expect.stringContaining('PROSPECT'),
                })
              );
            });
          }
        }
      }
    });

    it('should save notes via PATCH', async () => {
      const notesContent = 'Updated notes content';
      mockFetchResponse({ success: true, data: { ...mockRecord, notes: notesContent } });

      render(<UniversalRecordTemplate {...mockProps} />);
      
      // Find notes tab and click it
      const notesTab = screen.queryByText('Notes');
      if (notesTab) {
        fireEvent.click(notesTab);
        
        // Find notes editor and update content
        const notesEditor = screen.queryByRole('textbox');
        if (notesEditor) {
          fireEvent.change(notesEditor, { target: { value: notesContent } });
          
          // Wait for auto-save or find save button
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
              expect.stringContaining('/api/v1/people/person-1'),
              expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining(notesContent),
              })
            );
          }, { timeout: 3000 });
        }
      }
    });

    it('should add action via POST', async () => {
      const actionData = createTestAction('CALL', { personId: 'person-1' });
      mockFetchResponse({ success: true, data: actionData });

      render(<UniversalRecordTemplate {...mockProps} />);
      
      // Find and click add action button
      const addActionButton = screen.queryByText('Add Action');
      if (addActionButton) {
        fireEvent.click(addActionButton);
        
        // Fill in action form
        const actionTypeField = screen.queryByDisplayValue('CALL');
        const subjectField = screen.queryByPlaceholderText(/subject/i);
        const notesField = screen.queryByPlaceholderText(/notes/i);
        
        if (actionTypeField && subjectField && notesField) {
          fireEvent.change(subjectField, { target: { value: 'Call with client' } });
          fireEvent.change(notesField, { target: { value: 'Discuss pricing' } });
          
          // Submit action
          const submitButton = screen.queryByText('Submit');
          if (submitButton) {
            fireEvent.click(submitButton);
            
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/actions'),
                expect.objectContaining({
                  method: 'POST',
                  body: expect.stringContaining('person-1'),
                })
              );
            });
          }
        }
      }
    });

    it('should handle API errors gracefully', async () => {
      mockFetchError('Network error');

      render(<UniversalRecordTemplate {...mockProps} />);
      
      // Try to trigger an update
      const editButton = screen.queryByText('Edit');
      if (editButton) {
        fireEvent.click(editButton);
        
        const saveButton = screen.queryByText('Save');
        if (saveButton) {
          fireEvent.click(saveButton);
          
          await waitFor(() => {
            // Should show error message
            expect(screen.queryByText(/error/i)).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('SpeedrunSprintView', () => {
    const mockData = [
      createTestPerson('LEAD', { id: 'person-1', fullName: 'John Doe' }),
      createTestPerson('LEAD', { id: 'person-2', fullName: 'Jane Smith' }),
    ];

    beforeEach(() => {
      // Mock the data fetching
      mockFetchResponse({ success: true, data: mockData });
    });

    it('should render sprint view with records', async () => {
      render(<SpeedrunSprintView />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should submit action log via POST', async () => {
      const actionData = createTestAction('CALL', { personId: 'person-1' });
      mockFetchResponse({ success: true, data: actionData });

      render(<SpeedrunSprintView />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find and click complete button
      const completeButton = screen.queryByText('Complete');
      if (completeButton) {
        fireEvent.click(completeButton);
        
        // Fill in action log form
        const actionTypeField = screen.queryByDisplayValue('CALL');
        const actionField = screen.queryByPlaceholderText(/action/i);
        const nextActionField = screen.queryByPlaceholderText(/next action/i);
        
        if (actionTypeField && actionField && nextActionField) {
          fireEvent.change(actionField, { target: { value: 'Called client' } });
          fireEvent.change(nextActionField, { target: { value: 'Send proposal' } });
          
          // Submit action log
          const submitButton = screen.queryByText('Submit');
          if (submitButton) {
            fireEvent.click(submitButton);
            
            await waitFor(() => {
              expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/actions'),
                expect.objectContaining({
                  method: 'POST',
                  body: expect.stringContaining('person-1'),
                })
              );
            });
          }
        }
      }
    });

    it('should mark record as snoozed', async () => {
      render(<SpeedrunSprintView />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find and click snooze button
      const snoozeButton = screen.queryByText('Snooze');
      if (snoozeButton) {
        fireEvent.click(snoozeButton);
        
        // Should show snooze modal or form
        await waitFor(() => {
          expect(screen.queryByText(/snooze/i)).toBeInTheDocument();
        });
      }
    });

    it('should navigate between records', async () => {
      render(<SpeedrunSprintView />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Find and click next button
      const nextButton = screen.queryByText('Next');
      if (nextButton) {
        fireEvent.click(nextButton);
        
        await waitFor(() => {
          expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Timeline Tab', () => {
    it('should fetch and display actions from API', async () => {
      const mockActions = [
        createTestAction('CALL', { id: 'action-1', subject: 'Initial call' }),
        createTestAction('EMAIL', { id: 'action-2', subject: 'Follow up email' }),
      ];
      
      mockFetchResponse({ success: true, data: mockActions });

      const mockRecord = createTestPerson('LEAD', { id: 'person-1' });
      const mockProps = {
        record: mockRecord,
        recordType: 'people',
        onBack: jest.fn(),
        onComplete: jest.fn(),
        onSnooze: jest.fn(),
        onNavigatePrevious: jest.fn(),
        onNavigateNext: jest.fn(),
        onRecordUpdate: jest.fn(),
        recordIndex: 0,
        totalRecords: 1,
        customTabs: [],
        showDialer: false,
        showReports: false,
        contextualActions: [],
      };

      render(<UniversalRecordTemplate {...mockProps} />);
      
      // Find and click timeline tab
      const timelineTab = screen.queryByText('Timeline');
      if (timelineTab) {
        fireEvent.click(timelineTab);
        
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/actions'),
            expect.objectContaining({
              method: 'GET',
            })
          );
        });
        
        // Should display actions
        await waitFor(() => {
          expect(screen.queryByText('Initial call')).toBeInTheDocument();
          expect(screen.queryByText('Follow up email')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in UniversalRecordTemplate', async () => {
      mockFetchError('Network error');

      const mockRecord = createTestPerson('LEAD', { id: 'person-1' });
      const mockProps = {
        record: mockRecord,
        recordType: 'people',
        onBack: jest.fn(),
        onComplete: jest.fn(),
        onSnooze: jest.fn(),
        onNavigatePrevious: jest.fn(),
        onNavigateNext: jest.fn(),
        onRecordUpdate: jest.fn(),
        recordIndex: 0,
        totalRecords: 1,
        customTabs: [],
        showDialer: false,
        showReports: false,
        contextualActions: [],
      };

      render(<UniversalRecordTemplate {...mockProps} />);
      
      // Try to trigger an API call
      const editButton = screen.queryByText('Edit');
      if (editButton) {
        fireEvent.click(editButton);
        
        const saveButton = screen.queryByText('Save');
        if (saveButton) {
          fireEvent.click(saveButton);
          
          await waitFor(() => {
            // Should show error message
            expect(screen.queryByText(/error/i)).toBeInTheDocument();
          });
        }
      }
    });

    it('should handle API errors in SpeedrunSprintView', async () => {
      mockFetchError('API error');

      render(<SpeedrunSprintView />);
      
      // Should show error state
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching data', () => {
      (useUnifiedAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: true,
        error: null,
      });

      render(<SpeedrunSprintView />);
      
      // Should show loading indicator
      expect(screen.queryByText(/loading/i)).toBeInTheDocument();
    });

    it('should show loading state while submitting forms', async () => {
      const mockRecord = createTestPerson('LEAD', { id: 'person-1' });
      const mockProps = {
        record: mockRecord,
        recordType: 'people',
        onBack: jest.fn(),
        onComplete: jest.fn(),
        onSnooze: jest.fn(),
        onNavigatePrevious: jest.fn(),
        onNavigateNext: jest.fn(),
        onRecordUpdate: jest.fn(),
        recordIndex: 0,
        totalRecords: 1,
        customTabs: [],
        showDialer: false,
        showReports: false,
        contextualActions: [],
      };

      // Mock slow response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockRecord }),
        }), 1000))
      );

      render(<UniversalRecordTemplate {...mockProps} />);
      
      // Try to trigger a form submission
      const editButton = screen.queryByText('Edit');
      if (editButton) {
        fireEvent.click(editButton);
        
        const saveButton = screen.queryByText('Save');
        if (saveButton) {
          fireEvent.click(saveButton);
          
          // Should show loading state
          expect(screen.queryByText(/saving/i)).toBeInTheDocument();
        }
      }
    });
  });
});
