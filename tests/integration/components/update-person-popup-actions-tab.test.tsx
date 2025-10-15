/**
 * UpdatePersonPopup Actions Tab Integration Tests
 * 
 * Tests the UpdatePersonPopup component's Actions tab structure and behavior
 * Verifies form fields, UniversalActionsTab integration, and modal height management
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdatePersonPopup } from '@/products/speedrun/components/UpdatePersonPopup';
import { createTestPerson } from '../../utils/test-factories';

// Mock the auth fetch function
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

// Mock keyboard shortcuts
jest.mock('@/platform/utils/keyboard-shortcuts', () => ({
  getCommonShortcut: jest.fn(() => 'Ctrl+S'),
}));

// Mock workspace users hook
jest.mock('@/platform/hooks/useWorkspaceUsers', () => ({
  useWorkspaceUsers: () => ({
    users: [
      { id: 'user1', name: 'Test User', fullName: 'Test User' },
      { id: 'user2', name: 'Another User', fullName: 'Another User' }
    ]
  })
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('UpdatePersonPopup Actions Tab Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockAuthFetch = require('@/platform/api-fetch').authFetch as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Actions Tab Structure', () => {
    test('should render form fields and actions list sections', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Action Settings')).toBeInTheDocument();
      });

      // Verify form fields section
      expect(screen.getByText('Action Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Next Action')).toBeInTheDocument();

      // Verify actions list section
      expect(screen.getByText('Existing Actions')).toBeInTheDocument();
    });

    test('should render proper form field options', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Action Settings')).toBeInTheDocument();
      });

      // Check Status dropdown options
      const statusSelect = screen.getByLabelText('Status');
      expect(statusSelect).toBeInTheDocument();
      expect(statusSelect).toHaveValue(testPerson.status || 'Active');

      // Check Priority dropdown options
      const prioritySelect = screen.getByLabelText('Priority');
      expect(prioritySelect).toBeInTheDocument();
      expect(prioritySelect).toHaveValue(testPerson.priority || 'Medium');

      // Check Next Action input
      const nextActionInput = screen.getByLabelText('Next Action');
      expect(nextActionInput).toBeInTheDocument();
      expect(nextActionInput).toHaveValue(testPerson.nextAction || '');
    });
  });

  describe('Form Field Interaction', () => {
    test('should update form state when fields are changed', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Action Settings')).toBeInTheDocument();
      });

      // Update Status field
      const statusSelect = screen.getByLabelText('Status');
      await userEvent.selectOptions(statusSelect, 'Qualified');

      // Update Priority field
      const prioritySelect = screen.getByLabelText('Priority');
      await userEvent.selectOptions(prioritySelect, 'High');

      // Update Next Action field
      const nextActionInput = screen.getByLabelText('Next Action');
      await userEvent.clear(nextActionInput);
      await userEvent.type(nextActionInput, 'Follow up on proposal');

      // Verify form state updates
      expect(statusSelect).toHaveValue('Qualified');
      expect(prioritySelect).toHaveValue('High');
      expect(nextActionInput).toHaveValue('Follow up on proposal');
    });

    test('should maintain form state when actions list is present', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action1',
            subject: 'Test Action',
            description: 'Test action description',
            type: 'call',
            status: 'completed',
            priority: 'high',
            completedAt: new Date().toISOString(),
            userId: 'user1'
          }
        ]
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for actions to load
      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });

      // Update form fields
      const statusSelect = screen.getByLabelText('Status');
      await userEvent.selectOptions(statusSelect, 'Customer');

      // Verify form state is maintained
      expect(statusSelect).toHaveValue('Customer');

      // Verify actions list still displays
      expect(screen.getByText('Test Action')).toBeInTheDocument();
    });
  });

  describe('UniversalActionsTab Integration', () => {
    test('should render UniversalActionsTab with correct props', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action1',
            subject: 'Person Action',
            description: 'Action for person',
            type: 'email',
            status: 'completed',
            priority: 'medium',
            completedAt: new Date().toISOString(),
            userId: 'user1'
          }
        ]
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for actions to load
      await waitFor(() => {
        expect(screen.getByText('Person Action')).toBeInTheDocument();
      });

      // Verify API call was made with correct parameters
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/actions?personId=')
      );
    });

    test('should display empty state when no actions exist', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
        expect(screen.getByText('Real actions and activities will appear here when logged')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Height Management', () => {
    test('should apply max-height constraint to actions container', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Action Settings')).toBeInTheDocument();
      });

      // Check for max-height constraint
      const actionsContainer = screen.getByText('Action Settings').closest('.max-h-\\[600px\\]');
      expect(actionsContainer).toBeInTheDocument();
    });

    test('should apply overflow scrolling for long content', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Action Settings')).toBeInTheDocument();
      });

      // Check for overflow scrolling
      const actionsContainer = screen.getByText('Action Settings').closest('.overflow-y-auto');
      expect(actionsContainer).toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    test('should have proper spacing between sections', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Action Settings')).toBeInTheDocument();
      });

      // Check for divider between sections
      const divider = screen.getByText('Action Settings').closest('div')?.querySelector('.border-t');
      expect(divider).toBeInTheDocument();
    });

    test('should maintain proper layout with many actions', async () => {
      const testPerson = createTestPerson();
      // Create multiple actions
      const manyActions = Array.from({ length: 10 }, (_, i) => ({
        id: `action${i}`,
        subject: `Action ${i + 1}`,
        description: `Description for action ${i + 1}`,
        type: 'call',
        status: 'completed',
        priority: 'medium',
        completedAt: new Date().toISOString(),
        userId: 'user1'
      }));

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: manyActions
      });

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for actions to load
      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
      });

      // Verify form fields are still visible
      expect(screen.getByText('Action Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();

      // Verify actions are displayed
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 10')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockRejectedValue(new Error('API Error'));

      render(
        <UpdatePersonPopup
          isOpen={true}
          onClose={mockOnClose}
          person={testPerson}
          onSave={mockOnSave}
        />
      );

      // Navigate to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Action Settings')).toBeInTheDocument();
      });

      // Should still show form fields even with API error
      expect(screen.getByText('Action Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();

      // Should show empty state for actions
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });
    });
  });
});
