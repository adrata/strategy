/**
 * Integration Tests for Progressive Loading
 * 
 * Tests the full flow: prefetch → cache → hydration → pagination
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useFastSectionData } from '@/platform/hooks/useFastSectionData';
import { prefetchAllSections } from '@/platform/services/section-prefetch';
import { useUnifiedAuth } from '@/platform/auth';

// Mock dependencies
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: jest.fn()
}));

// The hook uses fetch directly

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

// Use real timers for integration tests to allow async operations to complete
// jest.useFakeTimers();

describe('Progressive Loading Integration', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    activeWorkspaceId: 'test-workspace-id',
    workspaces: [{ id: 'test-workspace-id' }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // jest.clearAllTimers(); // Using real timers
    (global.fetch as jest.Mock).mockClear();
    (useUnifiedAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false
    });
  });

  afterEach(() => {
    // Don't run pending timers automatically - let tests control timing
    // jest.runOnlyPendingTimers();
  });

  describe('Prefetch → Hydration Flow', () => {
    it('should prefetch leads, then hydrate instantly when navigating to leads', async () => {
      const mockLeadsData = Array.from({ length: 300 }, (_, i) => ({
        id: `lead-${i}`,
        name: `Lead ${i}`,
        globalRank: 300 - i
      }));

      // Simulate prefetch writing to cache
      const prefetchCache = {
        data: mockLeadsData,
        count: 300,
        ts: Date.now(),
        version: 2
      };
      localStorageMock.setItem('adrata-leads-test-workspace-id', JSON.stringify(prefetchCache));

      // Now simulate navigating to leads section
      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      // Should hydrate instantly from prefetched cache
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should hydrate instantly from prefetched cache
      // If cache has all data (300 records = count), it shows all data
      // If cache has partial data, it shows first 100
      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.data.length).toBeLessThanOrEqual(300);
      expect(result.current.count).toBe(300);
      expect(result.current.hasLoadedInitial).toBe(true);

      // Should not make API call (using prefetched cache)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should prefetch in priority order when landing on speedrun', async () => {
      const fetchOrder: string[] = [];

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('section=leads')) fetchOrder.push('leads');
        if (url.includes('section=prospects')) fetchOrder.push('prospects');
        if (url.includes('section=opportunities')) fetchOrder.push('opportunities');
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
            meta: { count: 0 }
          })
        });
      });

      prefetchAllSections('test-workspace-id', 'test-user-id', 'speedrun', 'test');

      // Wait for debounce (1000ms) and initial delays (leads: 0ms, prospects: 100ms)
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Leads should be first (or at least in the order)
      expect(fetchOrder.length).toBeGreaterThan(0);
      if (fetchOrder.length >= 2) {
        // Leads should come before prospects
        const leadsIndex = fetchOrder.indexOf('leads');
        const prospectsIndex = fetchOrder.indexOf('prospects');
        expect(leadsIndex).toBeLessThan(prospectsIndex);
      } else {
        // If only one fetched so far, it should be leads
        expect(fetchOrder[0]).toBe('leads');
      }
    });
  });

  describe('Pagination Count Accuracy', () => {
    it('should show correct pagination count (1-100 of 3000)', async () => {
      // Simulate cache with partial data but full count
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        id: `record-${i}`,
        name: `Record ${i}`
      }));

      const cachedData = {
        data: mockData,
        count: 3000, // Full count from API
        ts: Date.now() - 1000, // 1 second ago
        version: 2
      };

      localStorageMock.setItem('adrata-leads-test-workspace-id', JSON.stringify(cachedData));

      const { result } = renderHook(() => useFastSectionData('leads', 1000));

      // Wait for hydration from cache
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 5000 });

      // Should show 100 records but count should be 3000
      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.data.length).toBeLessThanOrEqual(100);
      expect(result.current.count).toBe(3000); // Full count for pagination
    });
  });

  describe('Cache TTL Consistency', () => {
    it('should respect TTL when prefetch tries to overwrite', async () => {
      const freshCache = {
        data: Array.from({ length: 200 }, (_, i) => ({ id: `record-${i}` })),
        count: 200,
        ts: Date.now() - 1000, // 1 second ago (fresh)
        version: 2
      };

      localStorageMock.setItem('adrata-leads-test-workspace-id', JSON.stringify(freshCache));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: Array.from({ length: 50 }, (_, i) => ({ id: `new-record-${i}` })),
          meta: { count: 50 }
        })
      });

      // Simulate prefetch trying to overwrite
      await prefetchAllSections('test-workspace-id', 'test-user-id', 'speedrun', 'test');
      jest.advanceTimersByTime(1100);
      await Promise.resolve();

      // Cache should not be overwritten (fresher cache exists)
      const cached = localStorageMock.getItem('adrata-leads-test-workspace-id');
      const parsed = JSON.parse(cached || '{}');
      expect(parsed.data).toHaveLength(200); // Original cache preserved
    });
  });
});

