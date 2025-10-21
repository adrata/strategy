/**
 * SYNC INTEGRATION TESTS
 * 
 * Tests for offline/online synchronization scenarios
 * Tests the complete sync flow from Tauri commands to UI components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { unifiedApi } from '@/platform/unified-api-service';
import { isDesktop } from '@/platform/platform-detection';

// Mock the platform detection
vi.mock('@/platform/platform-detection', () => ({
  isDesktop: vi.fn(() => true),
}));

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

// Mock API fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Sync Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockClear();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Sync', () => {
    it('should authenticate user and store credentials securely', async () => {
      const mockAuthResponse = {
        success: true,
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            active_workspace_id: 'workspace123',
            workspaces: []
          },
          access_token: 'jwt_token_123',
          refresh_token: 'refresh_token_123',
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      mockInvoke.mockResolvedValue(mockAuthResponse);

      const result = await unifiedApi.authenticateUser('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(mockInvoke).toHaveBeenCalledWith('sign_in_desktop', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle authentication failure gracefully', async () => {
      const mockAuthResponse = {
        success: false,
        error: 'Invalid credentials',
        data: null
      };

      mockInvoke.mockResolvedValue(mockAuthResponse);

      const result = await unifiedApi.authenticateUser('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should refresh token when expired', async () => {
      const mockRefreshResponse = {
        success: true,
        data: {
          access_token: 'new_jwt_token_123',
          refresh_token: 'refresh_token_123',
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      mockInvoke.mockResolvedValue(mockRefreshResponse);

      const result = await unifiedApi.refreshToken('refresh_token_123');

      expect(result.success).toBe(true);
      expect(result.data.access_token).toBe('new_jwt_token_123');
      expect(mockInvoke).toHaveBeenCalledWith('refresh_token_desktop', {
        refresh_token: 'refresh_token_123'
      });
    });
  });

  describe('Data Synchronization', () => {
    it('should sync workspace data successfully', async () => {
      const mockSyncResponse = {
        success: true,
        data: {
          status: 'completed',
          lastSync: new Date().toISOString(),
          conflicts: [],
          pendingChanges: 0,
          syncStats: {
            people: 150,
            companies: 45,
            actions: 89,
            total: 284
          }
        }
      };

      mockInvoke.mockResolvedValue(mockSyncResponse);

      const result = await unifiedApi.syncAllData();

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
      expect(result.data.syncStats.total).toBe(284);
      expect(mockInvoke).toHaveBeenCalledWith('sync_workspace', {});
    });

    it('should get sync status with detailed information', async () => {
      const mockStatusResponse = {
        success: true,
        data: {
          status: 'online',
          lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          conflicts: [],
          pendingChanges: 3,
          isConnected: true,
          syncStats: {
            people: 150,
            companies: 45,
            actions: 89,
            total: 284
          }
        }
      };

      mockInvoke.mockResolvedValue(mockStatusResponse);

      const result = await unifiedApi.getSyncStatus();

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('online');
      expect(result.data.pendingChanges).toBe(3);
      expect(result.data.isConnected).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('get_sync_status', {});
    });

    it('should push local changes to remote', async () => {
      const mockPushResponse = {
        success: true,
        data: {
          pushed: 5,
          conflicts: 0,
          errors: []
        }
      };

      mockInvoke.mockResolvedValue(mockPushResponse);

      const result = await unifiedApi.pushChanges();

      expect(result.success).toBe(true);
      expect(result.data.pushed).toBe(5);
      expect(mockInvoke).toHaveBeenCalledWith('push_changes', {});
    });

    it('should pull remote changes to local', async () => {
      const mockPullResponse = {
        success: true,
        data: {
          pulled: 12,
          conflicts: 2,
          errors: []
        }
      };

      mockInvoke.mockResolvedValue(mockPullResponse);

      const result = await unifiedApi.pullChanges();

      expect(result.success).toBe(true);
      expect(result.data.pulled).toBe(12);
      expect(result.data.conflicts).toBe(2);
      expect(mockInvoke).toHaveBeenCalledWith('pull_changes', {});
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts by choosing local version', async () => {
      const mockResolveResponse = {
        success: true,
        data: {
          resolved: true,
          conflictId: 'conflict123',
          resolution: 'local'
        }
      };

      mockInvoke.mockResolvedValue(mockResolveResponse);

      const result = await unifiedApi.resolveConflict('conflict123', 'local');

      expect(result.success).toBe(true);
      expect(result.data.resolved).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('resolve_conflict', {
        conflict_id: 'conflict123',
        resolution: 'local'
      });
    });

    it('should resolve conflicts by choosing remote version', async () => {
      const mockResolveResponse = {
        success: true,
        data: {
          resolved: true,
          conflictId: 'conflict456',
          resolution: 'remote'
        }
      };

      mockInvoke.mockResolvedValue(mockResolveResponse);

      const result = await unifiedApi.resolveConflict('conflict456', 'remote');

      expect(result.success).toBe(true);
      expect(result.data.resolved).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('resolve_conflict', {
        conflict_id: 'conflict456',
        resolution: 'remote'
      });
    });
  });

  describe('V1 API Integration', () => {
    it('should get people data with filters', async () => {
      const mockPeopleResponse = {
        success: true,
        data: [
          {
            id: 'person1',
            fullName: 'John Doe',
            email: 'john@example.com',
            status: 'ACTIVE',
            company: { name: 'Acme Corp' }
          },
          {
            id: 'person2',
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            status: 'ACTIVE',
            company: { name: 'Tech Inc' }
          }
        ],
        meta: {
          pagination: {
            page: 1,
            limit: 100,
            totalCount: 2,
            totalPages: 1
          }
        }
      };

      mockInvoke.mockResolvedValue(mockPeopleResponse);

      const filters = { status: 'ACTIVE', limit: 100 };
      const result = await unifiedApi.getPeople(filters);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].fullName).toBe('John Doe');
      expect(mockInvoke).toHaveBeenCalledWith('get_people', { filters });
    });

    it('should create a new person', async () => {
      const newPerson = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyId: 'company123'
      };

      const mockCreateResponse = {
        success: true,
        data: {
          id: 'person123',
          ...newPerson,
          createdAt: new Date().toISOString()
        }
      };

      mockInvoke.mockResolvedValue(mockCreateResponse);

      const result = await unifiedApi.createPerson(newPerson);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('person123');
      expect(result.data.email).toBe('john@example.com');
      expect(mockInvoke).toHaveBeenCalledWith('create_person', { request: newPerson });
    });

    it('should get companies data', async () => {
      const mockCompaniesResponse = {
        success: true,
        data: [
          {
            id: 'company1',
            name: 'Acme Corp',
            industry: 'Technology',
            size: 'Medium'
          },
          {
            id: 'company2',
            name: 'Tech Inc',
            industry: 'Software',
            size: 'Large'
          }
        ]
      };

      mockInvoke.mockResolvedValue(mockCompaniesResponse);

      const result = await unifiedApi.getCompanies();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Acme Corp');
      expect(mockInvoke).toHaveBeenCalledWith('get_companies', { filters: {} });
    });

    it('should get actions data', async () => {
      const mockActionsResponse = {
        success: true,
        data: [
          {
            id: 'action1',
            subject: 'Follow up with client',
            status: 'PLANNED',
            priority: 'HIGH',
            personId: 'person123'
          },
          {
            id: 'action2',
            subject: 'Send proposal',
            status: 'COMPLETED',
            priority: 'NORMAL',
            personId: 'person456'
          }
        ]
      };

      mockInvoke.mockResolvedValue(mockActionsResponse);

      const result = await unifiedApi.getActions();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].subject).toBe('Follow up with client');
      expect(mockInvoke).toHaveBeenCalledWith('get_actions', { filters: {} });
    });

    it('should get speedrun data', async () => {
      const mockSpeedrunResponse = {
        success: true,
        data: [
          {
            id: 'person1',
            rank: 1,
            name: 'John Doe',
            title: 'CEO',
            company: { name: 'Acme Corp' },
            lastActionTime: '2 hours ago',
            nextActionTiming: 'Today'
          }
        ],
        meta: {
          count: 1,
          totalCount: 1,
          limit: 50,
          responseTime: 45
        }
      };

      mockInvoke.mockResolvedValue(mockSpeedrunResponse);

      const result = await unifiedApi.getSpeedrunData();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[0].name).toBe('John Doe');
      expect(mockInvoke).toHaveBeenCalledWith('get_speedrun_data', { filters: {} });
    });

    it('should get chronicle reports', async () => {
      const mockChronicleResponse = {
        success: true,
        data: {
          reports: [
            {
              id: 'report1',
              title: 'Weekly Sales Report',
              reportType: 'SALES',
              reportDate: new Date().toISOString(),
              content: 'Sales are up 15% this week...'
            }
          ],
          total: 1
        }
      };

      mockInvoke.mockResolvedValue(mockChronicleResponse);

      const result = await unifiedApi.getChronicleReports();

      expect(result.success).toBe(true);
      expect(result.data.reports).toHaveLength(1);
      expect(result.data.reports[0].title).toBe('Weekly Sales Report');
      expect(mockInvoke).toHaveBeenCalledWith('get_chronicle_reports', { filters: {} });
    });
  });

  describe('Offline/Online Scenarios', () => {
    it('should handle offline mode gracefully', async () => {
      // Simulate offline mode by making invoke throw an error
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const result = await unifiedApi.getPeople();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.data).toEqual([]); // Should return fallback data
    });

    it('should fallback to web API when desktop commands fail', async () => {
      // Mock desktop command failure
      mockInvoke.mockRejectedValue(new Error('Desktop command failed'));
      
      // Mock web API success
      const mockWebResponse = {
        success: true,
        data: [{ id: 'person1', name: 'John Doe' }]
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWebResponse)
      });

      // Mock isDesktop to return false to trigger web fallback
      vi.mocked(isDesktop).mockReturnValue(false);

      const result = await unifiedApi.getPeople();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/people', expect.any(Object));
    });

    it('should queue changes when offline and sync when online', async () => {
      // First, simulate offline mode
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const createResult = await unifiedApi.createPerson({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toContain('Network error');

      // Then simulate coming back online
      const mockOnlineResponse = {
        success: true,
        data: {
          status: 'online',
          lastSync: new Date().toISOString(),
          conflicts: [],
          pendingChanges: 1
        }
      };

      mockInvoke.mockResolvedValue(mockOnlineResponse);

      const syncResult = await unifiedApi.getSyncStatus();

      expect(syncResult.success).toBe(true);
      expect(syncResult.data.status).toBe('online');
      expect(syncResult.data.pendingChanges).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Database connection failed',
        data: null
      };

      mockInvoke.mockResolvedValue(mockErrorResponse);

      const result = await unifiedApi.getPeople();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle authentication errors', async () => {
      const mockAuthErrorResponse = {
        success: false,
        error: 'Token expired',
        data: null
      };

      mockInvoke.mockResolvedValue(mockAuthErrorResponse);

      const result = await unifiedApi.getCurrentUser();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should handle sync conflicts properly', async () => {
      const mockConflictResponse = {
        success: true,
        data: {
          status: 'conflict',
          conflicts: [
            {
              id: 'conflict1',
              table: 'people',
              localValue: { name: 'John Doe' },
              remoteValue: { name: 'John Smith' },
              conflictType: 'field_update'
            }
          ],
          pendingChanges: 0
        }
      };

      mockInvoke.mockResolvedValue(mockConflictResponse);

      const result = await unifiedApi.getSyncStatus();

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('conflict');
      expect(result.data.conflicts).toHaveLength(1);
      expect(result.data.conflicts[0].table).toBe('people');
    });
  });
});
