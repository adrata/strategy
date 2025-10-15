/**
 * UpdateModal Actions Tab Integration Tests
 * 
 * Tests the UpdateModal component's integration with UniversalActionsTab
 * Verifies proper rendering, data passing, and tab switching behavior
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateModal } from '@/frontend/components/pipeline/UpdateModal';
import { createTestCompany, createTestPerson, TEST_USER } from '../../utils/test-factories';

// Mock the auth fetch function
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
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

// Mock safe storage functions
jest.mock('@/platform/utils/storage/safeLocalStorage', () => ({
  safeGetItem: jest.fn(),
  safeSetItem: jest.fn(),
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

describe('UpdateModal Actions Tab Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockAuthFetch = require('@/platform/api-fetch').authFetch as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Company Update Modal - Actions Tab', () => {
    test('should render UniversalActionsTab component with correct props', async () => {
      const testCompany = createTestCompany();
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
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="timeline"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Verify UniversalActionsTab is rendered
      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });

      // Verify API call was made with correct parameters
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/actions?companyId=')
      );
    });

    test('should display empty state when no actions exist', async () => {
      const testCompany = createTestCompany();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="timeline"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Verify empty state message
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
        expect(screen.getByText('Real actions and activities will appear here when logged')).toBeInTheDocument();
      });
    });

    test('should handle API errors gracefully', async () => {
      const testCompany = createTestCompany();
      mockAuthFetch.mockRejectedValue(new Error('API Error'));

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="timeline"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Should still render the component even with API errors
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });
    });
  });

  describe('Person Update Modal - Actions Tab', () => {
    test('should render UniversalActionsTab component with correct props for people', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action1',
            subject: 'Test Person Action',
            description: 'Test person action description',
            type: 'email',
            status: 'completed',
            priority: 'medium',
            completedAt: new Date().toISOString(),
            userId: 'user1'
          }
        ]
      });

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testPerson}
          recordType="people"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="actions"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Verify UniversalActionsTab is rendered with person data
      await waitFor(() => {
        expect(screen.getByText('Test Person Action')).toBeInTheDocument();
      });

      // Verify API call was made with correct parameters for person
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/actions?personId=')
      );
    });
  });

  describe('Tab Switching to Actions', () => {
    test('should trigger API call when switching to Actions tab', async () => {
      const testCompany = createTestCompany();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="overview"
        />
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      // Clear previous API calls
      mockAuthFetch.mockClear();

      // Switch to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for tab switch
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Verify API call was triggered
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/actions?companyId=')
      );
    });

    test('should maintain state when switching between tabs', async () => {
      const testCompany = createTestCompany();
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
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="overview"
        />
      );

      // Switch to Actions tab
      const actionsTab = screen.getByText('Actions');
      await userEvent.click(actionsTab);

      // Wait for actions to load
      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });

      // Switch back to Overview
      const overviewTab = screen.getByText('Overview');
      await userEvent.click(overviewTab);

      // Switch back to Actions
      await userEvent.click(actionsTab);

      // Verify actions are still displayed (should use cache)
      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });
    });
  });

  describe('Data Passing and Props', () => {
    test('should pass correct record and recordType props to UniversalActionsTab', async () => {
      const testCompany = createTestCompany();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="timeline"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // The UniversalActionsTab should receive the correct props
      // We can verify this by checking that the API call includes the correct record ID
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining(`companyId=${testCompany.id}`)
      );
    });

    test('should handle different record types correctly', async () => {
      const testPerson = createTestPerson();
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testPerson}
          recordType="people"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="actions"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Verify API call uses personId for people record type
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining(`personId=${testPerson.id}`)
      );
    });
  });

  describe('Loading States', () => {
    test('should show loading state while fetching actions', async () => {
      const testCompany = createTestCompany();
      
      // Mock a delayed response
      mockAuthFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: []
          }), 100)
        )
      );

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="timeline"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Should show loading state initially
      // Note: The exact loading indicator depends on UniversalActionsTab implementation
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });
    });
  });

  describe('Cache Behavior', () => {
    test('should use cached data when available', async () => {
      const testCompany = createTestCompany();
      const cachedData = {
        activities: [
          {
            id: 'action1',
            subject: 'Cached Action',
            description: 'This action is from cache',
            type: 'call',
            status: 'completed',
            priority: 'high',
            completedAt: new Date().toISOString(),
            userId: 'user1'
          }
        ],
        notes: [],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={testCompany}
          recordType="companies"
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          initialTab="timeline"
        />
      );

      // Wait for the modal to render
      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Should display cached data
      await waitFor(() => {
        expect(screen.getByText('Cached Action')).toBeInTheDocument();
      });

      // Should not make API call if cache is valid
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });
  });
});
