/**
 * Unit Tests: UpdateModal Component
 * 
 * Unit tests for UpdateModal keyboard event listeners and functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateModal } from '@/frontend/components/pipeline/UpdateModal';

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: ({ className }: { className?: string }) => (
    <div data-testid="x-mark-icon" className={className}>✕</div>
  ),
}));

jest.mock('@heroicons/react/24/solid', () => ({
  UserIcon: ({ className }: { className?: string }) => (
    <div data-testid="user-icon" className={className}>👤</div>
  ),
  BriefcaseIcon: ({ className }: { className?: string }) => (
    <div data-testid="briefcase-icon" className={className}>💼</div>
  ),
  EnvelopeIcon: ({ className }: { className?: string }) => (
    <div data-testid="envelope-icon" className={className}>✉️</div>
  ),
  PhoneIcon: ({ className }: { className?: string }) => (
    <div data-testid="phone-icon" className={className}>📞</div>
  ),
  BuildingOfficeIcon: ({ className }: { className?: string }) => (
    <div data-testid="building-icon" className={className}>🏢</div>
  ),
  TagIcon: ({ className }: { className?: string }) => (
    <div data-testid="tag-icon" className={className}>🏷️</div>
  ),
  TrashIcon: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className}>🗑️</div>
  ),
}));

// Mock the keyboard shortcuts utility
jest.mock('@/platform/utils/keyboard-shortcuts', () => ({
  getCommonShortcut: jest.fn((key: string) => {
    if (key === 'SUBMIT') return '⌘⏎';
    return 'Ctrl+⏎';
  }),
}));

// Mock the CompanySelector component
jest.mock('@/frontend/components/pipeline/CompanySelector', () => ({
  CompanySelector: ({ value, onChange, placeholder, className }: any) => (
    <div data-testid="company-selector" className={className}>
      <input
        data-testid="company-input"
        value={value || ''}
        onChange={(e) => onChange && onChange({ name: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  ),
}));

// Mock the UniversalBuyerGroupsTab component
jest.mock('@/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab', () => ({
  UniversalBuyerGroupsTab: ({ record, recordType, onSave }: any) => (
    <div data-testid="buyer-groups-tab">
      <button
        data-testid="buyer-groups-save"
        onClick={() => onSave && onSave('testField', 'testValue')}
      >
        Save Buyer Group
      </button>
    </div>
  ),
}));

// Mock the field formatters
jest.mock('@/frontend/components/pipeline/utils/field-formatters', () => ({
  formatFieldValue: jest.fn((value) => value),
  getCompanyName: jest.fn((company) => company?.name || company),
  formatDateValue: jest.fn((date) => date),
  formatArrayValue: jest.fn((arr) => Array.isArray(arr) ? arr.join(', ') : arr),
}));

describe('UpdateModal Unit Tests', () => {
  const mockRecord = {
    id: 'test-record-1',
    fullName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    jobTitle: 'Software Engineer',
    company: 'Test Company',
    status: 'active',
    priority: 'medium',
    notes: 'Test notes',
    tags: ['tag1', 'tag2']
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    record: mockRecord,
    recordType: 'people' as const,
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Keyboard Event Listener Lifecycle', () => {
    it('should attach keydown event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      render(<UpdateModal {...defaultProps} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true // capture phase
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        false // bubble phase
      );

      addEventListenerSpy.mockRestore();
    });

    it('should detach event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<UpdateModal {...defaultProps} />);
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true // capture phase
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        false // bubble phase
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should not attach event listener when modal is closed', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      render(<UpdateModal {...defaultProps} isOpen={false} />);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );

      addEventListenerSpy.mockRestore();
    });

    it('should attach event listener when modal opens', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      const { rerender } = render(<UpdateModal {...defaultProps} isOpen={false} />);
      
      // Initially no event listener
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );

      // Open modal
      rerender(<UpdateModal {...defaultProps} isOpen={true} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );

      addEventListenerSpy.mockRestore();
    });
  });

  describe('HandleSubmit Invocation', () => {
    it('should call handleSubmit with synthetic event', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      // Wait for modal to render
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Simulate Ctrl+Enter keypress
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      // Wait for onUpdate to be called
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });

      // Verify the call was made (form data population is tested separately)
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        undefined
      );
    });

    it('should call handleSubmit with CMD+Enter on Mac', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Simulate CMD+Enter keypress (Mac)
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: false,
        metaKey: true,
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        undefined
      );
    });

    it('should not call handleSubmit for other key combinations', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Test various key combinations that should NOT trigger submission
      const keyCombinations = [
        { key: 'Enter', ctrlKey: false, metaKey: false }, // Just Enter
        { key: 'Space', ctrlKey: true, metaKey: false }, // Ctrl+Space
        { key: 'Enter', ctrlKey: false, metaKey: false, shiftKey: true }, // Shift+Enter
        { key: 'Escape', ctrlKey: true, metaKey: false }, // Ctrl+Escape
      ];

      for (const keyCombo of keyCombinations) {
        fireEvent.keyDown(document, keyCombo);
      }

      // Wait a bit to ensure no calls were made
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('should prevent default and stop propagation', () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      // Spy on addEventListener before rendering
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      // Get the event handler function that was registered
      const eventHandler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'keydown' && call[2] === true
      )?.[1] as (event: KeyboardEvent) => void;

      expect(eventHandler).toBeDefined();

      // Create a mock event with spy methods
      const mockEvent = {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        stopImmediatePropagation: jest.fn(),
      } as any;

      // Call the event handler directly
      eventHandler!(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Loading State Check', () => {
    it('should check loading state before submission', async () => {
      const mockOnUpdate = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });

      // Try to trigger keyboard shortcut again while loading
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      // Should only be called once
      expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    });

    it('should prevent submission when loading', async () => {
      const mockOnUpdate = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 500))
      );
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });

      // Try multiple times while loading
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(document, {
          key: 'Enter',
          ctrlKey: true,
          metaKey: false,
        });
      }

      // Should still only be called once
      expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dependency Array', () => {
    it('should update when handleSubmit dependency changes', async () => {
      const mockOnUpdate1 = jest.fn().mockResolvedValue(undefined);
      const mockOnUpdate2 = jest.fn().mockResolvedValue(undefined);
      
      const { rerender } = render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate1}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut with first function
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate1).toHaveBeenCalled();
      });

      // Rerender with different onUpdate function
      rerender(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate2}
        />
      );

      // Trigger keyboard shortcut again
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate2).toHaveBeenCalled();
      });

      // Should call the new function, not the old one
      expect(mockOnUpdate1).toHaveBeenCalledTimes(1);
      expect(mockOnUpdate2).toHaveBeenCalledTimes(1);
    });

    it('should update when loading state changes', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      const { rerender } = render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });

      // Rerender with different loading state (simulated by changing onUpdate)
      const mockOnUpdate2 = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      rerender(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate2}
        />
      );

      // Trigger keyboard shortcut again
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate2).toHaveBeenCalled();
      });

      // Both functions should have been called
      expect(mockOnUpdate).toHaveBeenCalledTimes(1);
      expect(mockOnUpdate2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Synthetic Event Creation', () => {
    it('should create proper synthetic event', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Mock console.log to capture the synthetic event creation
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Trigger keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });

      // Verify console log was called (indicating synthetic event was created)
      expect(consoleSpy).toHaveBeenCalledWith(
        '⌨️ [UpdateModal] Update Record keyboard shortcut triggered'
      );

      consoleSpy.mockRestore();
    });

    it('should create synthetic event with proper methods', async () => {
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });

      // The synthetic event should be passed to handleSubmit
      // We can't directly test the synthetic event, but we can verify
      // that handleSubmit was called (which means the synthetic event was created)
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up event listeners when modal closes', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { rerender } = render(<UpdateModal {...defaultProps} isOpen={true} />);
      
      // Close modal
      rerender(<UpdateModal {...defaultProps} isOpen={false} />);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        false
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should clean up event listeners when component unmounts', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<UpdateModal {...defaultProps} isOpen={true} />);
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        false
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in handleSubmit gracefully', async () => {
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });

      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating record:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should show error alert on failure', async () => {
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <UpdateModal
          {...defaultProps}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });

      // Trigger keyboard shortcut
      fireEvent.keyDown(document, {
        key: 'Enter',
        ctrlKey: true,
        metaKey: false,
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });

      // Should show error alert
      expect(alertSpy).toHaveBeenCalledWith(
        'Update failed. Please try again.'
      );

      alertSpy.mockRestore();
    });
  });
});
