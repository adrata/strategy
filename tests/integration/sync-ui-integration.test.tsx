/**
 * SYNC UI INTEGRATION TESTS
 * 
 * Tests for sync UI components and their interaction with the sync system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncStatusIndicator, OfflineBanner, SyncModal } from '@/frontend/components/sync';
import { unifiedApi } from '@/platform/unified-api-service';
import { isDesktop } from '@/platform/platform-detection';

// Mock the platform detection
vi.mock('@/platform/platform-detection', () => ({
  isDesktop: vi.fn(() => true),
}));

// Mock the unified API service
vi.mock('@/platform/unified-api-service', () => ({
  unifiedApi: {
    getSyncStatus: vi.fn(),
    pushChanges: vi.fn(),
    pullChanges: vi.fn(),
    resolveConflict: vi.fn(),
  },
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  CloudIcon: () => <div data-testid="cloud-icon" />,
  CloudArrowUpIcon: () => <div data-testid="cloud-arrow-up-icon" />,
  CloudArrowDownIcon: () => <div data-testid="cloud-arrow-down-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle-icon" />,
  CheckCircleIcon: () => <div data-testid="check-circle-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  WifiIcon: () => <div data-testid="wifi-icon" />,
  WifiSlashIcon: () => <div data-testid="wifi-slash-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  ArrowPathIcon: () => <div data-testid="arrow-path-icon" />,
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  BuildingOfficeIcon: () => <div data-testid="building-office-icon" />,
  UserGroupIcon: () => <div data-testid="user-group-icon" />,
  BoltIcon: () => <div data-testid="bolt-icon" />,
}));

describe('Sync UI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SyncStatusIndicator', () => {
    it('should render online status correctly', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'online',
          lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          conflicts: 0,
          pendingChanges: 0,
          isConnected: true,
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncStatusIndicator showDetails={true} />);

      await waitFor(() => {
        expect(screen.getByText('Synced')).toBeInTheDocument();
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
        expect(screen.getByText('Online')).toBeInTheDocument();
      });
    });

    it('should render offline status correctly', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'offline',
          lastSync: null,
          conflicts: 0,
          pendingChanges: 3,
          isConnected: false,
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncStatusIndicator showDetails={true} />);

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
        expect(screen.getByTestId('wifi-slash-icon')).toBeInTheDocument();
        expect(screen.getByText('3 pending')).toBeInTheDocument();
      });
    });

    it('should render syncing status correctly', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'syncing',
          lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          conflicts: 0,
          pendingChanges: 0,
          isConnected: true,
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncStatusIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
        expect(screen.getByTestId('cloud-arrow-up-icon')).toBeInTheDocument();
      });
    });

    it('should render conflict status correctly', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'conflict',
          lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          conflicts: 2,
          pendingChanges: 1,
          isConnected: true,
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncStatusIndicator showDetails={true} />);

      await waitFor(() => {
        expect(screen.getByText('Conflicts')).toBeInTheDocument();
        expect(screen.getByTestId('exclamation-triangle-icon')).toBeInTheDocument();
        expect(screen.getByText('2 conflicts')).toBeInTheDocument();
      });
    });

    it('should not render on web platform', () => {
      vi.mocked(isDesktop).mockReturnValue(false);

      const { container } = render(<SyncStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(unifiedApi.getSyncStatus).mockRejectedValue(new Error('API Error'));

      render(<SyncStatusIndicator />);

      await waitFor(() => {
        // Should still render with default state
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });
  });

  describe('OfflineBanner', () => {
    it('should not render when online', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'online',
          isConnected: true,
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      const { container } = render(<OfflineBanner />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should render when offline', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'offline',
          isConnected: false,
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<OfflineBanner />);

      await waitFor(() => {
        expect(screen.getByText("You're currently offline")).toBeInTheDocument();
        expect(screen.getByText('Changes will be synced when you\'re back online')).toBeInTheDocument();
        expect(screen.getByTestId('wifi-slash-icon')).toBeInTheDocument();
      });
    });

    it('should handle reconnect button click', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'offline',
          isConnected: false,
        },
      };

      const mockPullResponse = {
        success: true,
        data: { pulled: 5 },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);
      vi.mocked(unifiedApi.pullChanges).mockResolvedValue(mockPullResponse);

      render(<OfflineBanner />);

      await waitFor(() => {
        expect(screen.getByText('Reconnect')).toBeInTheDocument();
      });

      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);

      await waitFor(() => {
        expect(unifiedApi.pullChanges).toHaveBeenCalled();
      });
    });

    it('should show reconnecting state', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'offline',
          isConnected: false,
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);
      vi.mocked(unifiedApi.pullChanges).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      render(<OfflineBanner />);

      await waitFor(() => {
        expect(screen.getByText('Reconnect')).toBeInTheDocument();
      });

      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);

      await waitFor(() => {
        expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
        expect(screen.getByTestId('arrow-path-icon')).toBeInTheDocument();
      });
    });

    it('should not render on web platform', () => {
      vi.mocked(isDesktop).mockReturnValue(false);

      const { container } = render(<OfflineBanner />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('SyncModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
      mockOnClose.mockClear();
    });

    it('should render sync modal when open', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'idle',
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          conflicts: [],
          pendingChanges: 5,
          syncStats: {
            people: 150,
            companies: 45,
            actions: 89,
            total: 284,
          },
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Sync Status')).toBeInTheDocument();
        expect(screen.getByText('Ready to Sync')).toBeInTheDocument();
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument(); // People count
        expect(screen.getByText('45')).toBeInTheDocument(); // Companies count
        expect(screen.getByText('89')).toBeInTheDocument(); // Actions count
        expect(screen.getByText('5')).toBeInTheDocument(); // Pending count
      });
    });

    it('should not render when closed', () => {
      render(<SyncModal isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('Sync Status')).not.toBeInTheDocument();
    });

    it('should handle sync button click', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'idle',
          lastSync: null,
          conflicts: [],
          pendingChanges: 0,
          syncStats: { people: 0, companies: 0, actions: 0, total: 0 },
        },
      };

      const mockPullResponse = { success: true, data: { pulled: 10 } };
      const mockPushResponse = { success: true, data: { pushed: 5 } };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);
      vi.mocked(unifiedApi.pullChanges).mockResolvedValue(mockPullResponse);
      vi.mocked(unifiedApi.pushChanges).mockResolvedValue(mockPushResponse);

      render(<SyncModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync Now');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(unifiedApi.pullChanges).toHaveBeenCalled();
        expect(unifiedApi.pushChanges).toHaveBeenCalled();
      });
    });

    it('should show conflicts when present', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'conflict',
          lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          conflicts: [
            {
              id: 'conflict1',
              table: 'people',
              localValue: { name: 'John Doe' },
              remoteValue: { name: 'John Smith' },
              conflictType: 'field_update',
            },
          ],
          pendingChanges: 0,
          syncStats: { people: 0, companies: 0, actions: 0, total: 0 },
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Conflicts (1)')).toBeInTheDocument();
        expect(screen.getByText('people - field_update')).toBeInTheDocument();
        expect(screen.getByText('Keep Local')).toBeInTheDocument();
        expect(screen.getByText('Use Remote')).toBeInTheDocument();
      });
    });

    it('should handle conflict resolution', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'conflict',
          lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          conflicts: [
            {
              id: 'conflict1',
              table: 'people',
              localValue: { name: 'John Doe' },
              remoteValue: { name: 'John Smith' },
              conflictType: 'field_update',
            },
          ],
          pendingChanges: 0,
          syncStats: { people: 0, companies: 0, actions: 0, total: 0 },
        },
      };

      const mockResolveResponse = { success: true, data: { resolved: true } };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);
      vi.mocked(unifiedApi.resolveConflict).mockResolvedValue(mockResolveResponse);

      render(<SyncModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Keep Local')).toBeInTheDocument();
      });

      const keepLocalButton = screen.getByText('Keep Local');
      fireEvent.click(keepLocalButton);

      await waitFor(() => {
        expect(unifiedApi.resolveConflict).toHaveBeenCalledWith('conflict1', 'local');
      });
    });

    it('should show sync progress during sync', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'idle',
          lastSync: null,
          conflicts: [],
          pendingChanges: 0,
          syncStats: { people: 0, companies: 0, actions: 0, total: 0 },
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);
      vi.mocked(unifiedApi.pullChanges).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );
      vi.mocked(unifiedApi.pushChanges).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      render(<SyncModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Sync Now')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync Now');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
        expect(screen.getByTestId('arrow-path-icon')).toBeInTheDocument();
      });
    });

    it('should handle close button click', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'idle',
          lastSync: null,
          conflicts: [],
          pendingChanges: 0,
          syncStats: { people: 0, companies: 0, actions: 0, total: 0 },
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('x-mark-icon');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show everything up to date message', async () => {
      const mockSyncStatus = {
        success: true,
        data: {
          status: 'completed',
          lastSync: new Date().toISOString(),
          conflicts: [],
          pendingChanges: 0,
          syncStats: { people: 0, companies: 0, actions: 0, total: 0 },
        },
      };

      vi.mocked(unifiedApi.getSyncStatus).mockResolvedValue(mockSyncStatus);

      render(<SyncModal isOpen={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Everything is up to date!')).toBeInTheDocument();
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });
  });
});
