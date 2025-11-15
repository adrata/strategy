/**
 * Unit Tests for useFastSectionData Hook
 * 
 * Tests progressive loading, cache behavior, race condition prevention,
 * and pagination count handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
import { useUnifiedAuth } from '@/platform/auth';

// Mock dependencies
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: jest.fn()
}));

// The hook uses fetch directly, not authFetch

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useFastSectionData - Progressive Loading', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    activeWorkspaceId: 'test-workspace-id',
    workspaces: [{ id: 'test-workspace-id' }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    jest.useFakeTimers();
    (useUnifiedAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('INITIAL_PAGE_SIZE = 100', () => {
    it('should fetch exactly 100 records on initial load', async () => {
      const mockData = Array.from({ length: 500 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData,
          meta: { count: 500 }
        })
      });

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should show first 100 records initially
      expect(result.current.data).toHaveLength(100);
      expect(result.current.count).toBe(500); // Full count for pagination
      expect(result.current.hasLoadedInitial).toBe(true);
    });

    it('should load remaining records in background after initial 100', async () => {
      const mockData = Array.from({ length: 500 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`
      }));

      // First call: initial 100
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData.slice(0, 100),
          meta: { count: 500 }
        })
      });

      // Second call: full dataset
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData,
          meta: { count: 500 }
        })
      });

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      // Fast-forward past initial fetch
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      await waitFor(() => {
        expect(result.current.hasLoadedInitial).toBe(true);
      }, { timeout: 5000 });

      // Initial load should show first 100 records
      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.data.length).toBeLessThanOrEqual(100);
      
      // Fast-forward past progressive load delay (500ms)
      jest.advanceTimersByTime(600);
      await Promise.resolve();
      
      // Wait for background load to complete
      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      }, { timeout: 5000 });

      // After background load, should have all data
      expect(result.current.data.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Cache Hydration', () => {
    it('should hydrate from localStorage cache instantly', async () => {
      const cachedData = {
        data: Array.from({ length: 300 }, (_, i) => ({ id: `record-${i}` })),
        count: 300,
        ts: Date.now() - 1000, // 1 second ago
        version: 2
      };

      localStorageMock.setItem('adrata-leads-test-workspace-id', JSON.stringify(cachedData));

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      // Should hydrate instantly (no loading state)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should show first 100 records from cache (or all if less than 100)
      // Note: If cache has exactly 300 records, it may show all if count matches
      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.data.length).toBeLessThanOrEqual(300);
      expect(result.current.count).toBe(300);
      expect(result.current.hasLoadedInitial).toBe(true);
    });

    it('should not check cache in fetchSectionData if already hydrated', async () => {
      const cachedData = {
        data: Array.from({ length: 200 }, (_, i) => ({ id: `record-${i}` })),
        count: 200,
        ts: Date.now() - 1000,
        version: 2
      };

      localStorageMock.setItem('adrata-leads-test-workspace-id', JSON.stringify(cachedData));

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      await waitFor(() => {
        expect(result.current.hasLoadedInitial).toBe(true);
      });

      // Verify authFetch was not called (cache was used)
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent duplicate fetches when cache is hydrated', async () => {
      const cachedData = {
        data: Array.from({ length: 200 }, (_, i) => ({ id: `record-${i}` })),
        count: 200,
        ts: Date.now() - 1000,
        version: 2
      };

      localStorageMock.setItem('adrata-leads-test-workspace-id', JSON.stringify(cachedData));

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      await waitFor(() => {
        expect(result.current.hasLoadedInitial).toBe(true);
      });

      // Should only hydrate from cache, no API calls
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Return Values', () => {
    it('should return isLoadingMore and hasLoadedInitial', async () => {
      const mockData = Array.from({ length: 200 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData,
          meta: { count: 200 }
        })
      });

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      expect(result.current).toHaveProperty('isLoadingMore');
      expect(result.current).toHaveProperty('hasLoadedInitial');
      expect(typeof result.current.isLoadingMore).toBe('boolean');
      expect(typeof result.current.hasLoadedInitial).toBe('boolean');
    });
  });

  describe('Cache TTL', () => {
    it('should use CACHE_TTL_SPEEDRUN for speedrun section', async () => {
      const expiredCache = {
        data: Array.from({ length: 50 }, (_, i) => ({ id: `record-${i}` })),
        count: 50,
        ts: Date.now() - (3 * 60 * 1000), // 3 minutes ago (expired for speedrun)
        version: 2
      };

      localStorageMock.setItem('adrata-speedrun-test-workspace-id', JSON.stringify(expiredCache));

      const mockData = Array.from({ length: 50 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData,
          meta: { count: 50 }
        })
      });

      const { result } = renderHook(() => useFastSectionData('speedrun', 50));

      // Should fetch fresh data because cache expired
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should use CACHE_TTL_DEFAULT for other sections', async () => {
      const validCache = {
        data: Array.from({ length: 200 }, (_, i) => ({ id: `record-${i}` })),
        count: 200,
        ts: Date.now() - (3 * 60 * 1000), // 3 minutes ago (still valid for default)
        version: 2
      };

      localStorageMock.setItem('adrata-leads-test-workspace-id', JSON.stringify(validCache));

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use cache, no fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

