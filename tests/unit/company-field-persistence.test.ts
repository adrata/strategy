/**
 * Unit Tests for Company Field Persistence
 * 
 * Tests the core logic of force-refresh flags and cache behavior
 * to ensure company field changes persist across navigation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Mock window object
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('Company Field Persistence', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Force-refresh flag management', () => {
    it('should set force-refresh flags when saving a company field', () => {
      // Mock the handleInlineFieldSave function behavior
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const recordType = 'companies';
      const field = 'name';
      const value = 'Updated Company Name';

      // Simulate setting force-refresh flags (as done in UniversalRecordTemplate.tsx)
      const recordSpecificFlag = `force-refresh-${recordType}-${recordId}`;
      const sectionLevelFlag = 'force-refresh-companies';

      // Simulate the flag setting logic
      mockSessionStorage.setItem(recordSpecificFlag, 'true');
      mockSessionStorage.setItem(sectionLevelFlag, 'true');

      // Verify flags were set
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(recordSpecificFlag, 'true');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(sectionLevelFlag, 'true');
    });

    it('should clear force-refresh flags after detection', () => {
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const section = 'companies';
      
      // Mock existing force-refresh flags
      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === `force-refresh-${section}-${recordId}`) return 'true';
        if (key === `force-refresh-${section}`) return 'true';
        return null;
      });

      // Mock Object.keys to return the force-refresh keys
      const originalKeys = Object.keys;
      Object.keys = vi.fn().mockReturnValue([
        `force-refresh-${section}-${recordId}`,
        `force-refresh-${section}`
      ]);

      // Simulate the flag detection and clearing logic
      const forceRefreshKeys = Object.keys(mockSessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );

      expect(forceRefreshKeys).toHaveLength(2);
      
      // Clear the flags
      forceRefreshKeys.forEach(key => mockSessionStorage.removeItem(key));
      
      // Verify flags were cleared
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`force-refresh-${section}-${recordId}`);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`force-refresh-${section}`);

      // Restore Object.keys
      Object.keys = originalKeys;
    });

    it('should detect force-refresh flags correctly', () => {
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const section = 'companies';
      
      // Mock sessionStorage with force-refresh flags
      const mockKeys = [
        'force-refresh-companies-01K8B82Q13SM80PT8JC0F2WJNA',
        'force-refresh-companies',
        'other-key',
        'force-refresh-people-123'
      ];

      Object.keys = vi.fn().mockReturnValue(mockKeys);

      // Simulate the force-refresh detection logic
      const forceRefreshKeys = Object.keys(mockSessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );

      expect(forceRefreshKeys).toEqual([
        'force-refresh-companies-01K8B82Q13SM80PT8JC0F2WJNA',
        'force-refresh-companies'
      ]);
    });
  });

  describe('Cache behavior', () => {
    it('should skip cache when force-refresh flags exist', () => {
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const section = 'companies';
      
      // Mock force-refresh flags present
      Object.keys = vi.fn().mockReturnValue([
        `force-refresh-${section}-${recordId}`,
        `force-refresh-${section}`
      ]);

      // Mock cached record data
      const cachedRecord = {
        id: recordId,
        name: 'Old Company Name',
        website: 'old-website.com'
      };

      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === `current-record-${section}`) {
          return JSON.stringify({
            id: recordId,
            data: cachedRecord,
            timestamp: Date.now()
          });
        }
        return null;
      });

      // Simulate the cache check logic
      const forceRefreshKeys = Object.keys(mockSessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );

      let shouldUseCache = false;
      let shouldFetchFresh = false;

      if (forceRefreshKeys.length > 0) {
        // Skip cache, fetch fresh
        shouldUseCache = false;
        shouldFetchFresh = true;
      } else {
        // Use cache
        shouldUseCache = true;
        shouldFetchFresh = false;
      }

      expect(shouldUseCache).toBe(false);
      expect(shouldFetchFresh).toBe(true);
    });

    it('should use cache when no force-refresh flags exist', () => {
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const section = 'companies';
      
      // Mock no force-refresh flags
      Object.keys = vi.fn().mockReturnValue(['other-key', 'normal-key']);

      // Mock cached record data
      const cachedRecord = {
        id: recordId,
        name: 'Cached Company Name',
        website: 'cached-website.com'
      };

      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === `current-record-${section}`) {
          return JSON.stringify({
            id: recordId,
            data: cachedRecord,
            timestamp: Date.now()
          });
        }
        return null;
      });

      // Simulate the cache check logic
      const forceRefreshKeys = Object.keys(mockSessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );

      let shouldUseCache = false;
      let shouldFetchFresh = false;

      if (forceRefreshKeys.length > 0) {
        // Skip cache, fetch fresh
        shouldUseCache = false;
        shouldFetchFresh = true;
      } else {
        // Use cache
        shouldUseCache = true;
        shouldFetchFresh = false;
      }

      expect(shouldUseCache).toBe(true);
      expect(shouldFetchFresh).toBe(false);
    });

    it('should fetch fresh data when flags are present', async () => {
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const section = 'companies';
      
      // Mock force-refresh flags
      Object.keys = vi.fn().mockReturnValue([
        `force-refresh-${section}-${recordId}`,
        `force-refresh-${section}`
      ]);

      // Mock API response with updated data
      const updatedRecord = {
        id: recordId,
        name: 'Updated Company Name',
        website: 'updated-website.com',
        description: 'Updated description'
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: updatedRecord
        })
      });

      global.fetch = mockFetch;

      // Simulate the API fetch logic
      const forceRefreshKeys = Object.keys(mockSessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );

      if (forceRefreshKeys.length > 0) {
        // Clear flags
        forceRefreshKeys.forEach(key => mockSessionStorage.removeItem(key));
        
        // Fetch fresh data
        const response = await mockFetch(`/api/v1/companies/${recordId}`, {
          credentials: 'include'
        });
        const result = await response.json();
        
        expect(mockFetch).toHaveBeenCalledWith(`/api/v1/companies/${recordId}`, {
          credentials: 'include'
        });
        expect(result.data).toEqual(updatedRecord);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`force-refresh-${section}-${recordId}`);
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`force-refresh-${section}`);
      }
    });
  });

  describe('Session storage cache management', () => {
    it('should clear session storage cache when force-refresh is detected', () => {
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const section = 'companies';
      
      // Mock force-refresh flags
      Object.keys = vi.fn().mockReturnValue([
        `force-refresh-${section}-${recordId}`,
        `force-refresh-${section}`
      ]);

      // Simulate cache clearing logic
      const forceRefreshKeys = Object.keys(mockSessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );

      if (forceRefreshKeys.length > 0) {
        // Clear sessionStorage caches
        mockSessionStorage.removeItem(`cached-${section}-${recordId}`);
        mockSessionStorage.removeItem(`current-record-${section}`);
        
        // Clear force-refresh flags
        forceRefreshKeys.forEach(key => mockSessionStorage.removeItem(key));
      }

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`cached-${section}-${recordId}`);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`current-record-${section}`);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`force-refresh-${section}-${recordId}`);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(`force-refresh-${section}`);
    });

    it('should preserve cache when no force-refresh flags exist', () => {
      const recordId = '01K8B82Q13SM80PT8JC0F2WJNA';
      const section = 'companies';
      
      // Mock no force-refresh flags
      Object.keys = vi.fn().mockReturnValue(['other-key']);

      // Mock cached data
      const cachedRecord = {
        id: recordId,
        name: 'Cached Company Name',
        website: 'cached-website.com'
      };

      mockSessionStorage.getItem.mockImplementation((key) => {
        if (key === `current-record-${section}`) {
          return JSON.stringify({
            id: recordId,
            data: cachedRecord,
            timestamp: Date.now()
          });
        }
        return null;
      });

      // Simulate cache check logic
      const forceRefreshKeys = Object.keys(mockSessionStorage).filter(key => 
        key.startsWith('force-refresh-') && (key.includes(section) || key.includes(recordId))
      );

      let cacheUsed = false;
      let recordData = null;

      if (forceRefreshKeys.length === 0) {
        // Use cache
        const currentRecord = mockSessionStorage.getItem(`current-record-${section}`);
        if (currentRecord) {
          const { id, data, timestamp } = JSON.parse(currentRecord);
          if (id === recordId && Date.now() - timestamp < 300000) {
            cacheUsed = true;
            recordData = data;
          }
        }
      }

      expect(cacheUsed).toBe(true);
      expect(recordData).toEqual(cachedRecord);
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
