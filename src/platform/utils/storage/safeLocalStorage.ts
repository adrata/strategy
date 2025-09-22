/**
 * Safe localStorage utilities that handle quota exceeded errors gracefully
 */

interface CacheData {
  data: any;
  timestamp: number;
}

/**
 * Safely set an item in localStorage with quota management
 */
export function safeSetItem(key: string, data: any, maxRetries: number = 2): boolean {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError' && maxRetries > 0) {
      console.warn(`localStorage quota exceeded for key: ${key}, attempting cleanup`);
      
      // Clear old cache entries
      clearOldCacheEntries();
      
      // Try again with reduced data size
      try {
        const reducedData = reduceDataSize(data);
        const cacheData: CacheData = {
          data: reducedData,
          timestamp: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(cacheData));
        return true;
      } catch (retryError) {
        console.warn(`Still unable to cache data for key: ${key}`);
        return false;
      }
    } else {
      console.error(`localStorage error for key: ${key}:`, error);
      return false;
    }
  }
}

/**
 * Safely get an item from localStorage
 */
export function safeGetItem<T>(key: string, ttl: number = 5 * 60 * 1000): T | null {
  try {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    
    const parsed: CacheData = JSON.parse(cachedData);
    const cacheAge = Date.now() - parsed.timestamp;
    
    if (cacheAge > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.warn(`Error reading cache for key: ${key}:`, error);
    localStorage.removeItem(key); // Remove corrupted cache
    return null;
  }
}

/**
 * Clear old cache entries to free up space
 */
function clearOldCacheEntries(): void {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  Object.keys(localStorage).forEach(key => {
    try {
      const cachedData = localStorage.getItem(key);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // Remove corrupted entries
      localStorage.removeItem(key);
    }
  });
}

/**
 * Reduce data size by keeping only essential fields
 */
function reduceDataSize(data: any): any {
  if (Array.isArray(data)) {
    return data.slice(0, 100).map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          id: item.id,
          name: item.name || item.fullName,
          company: item.company,
          title: item.title || item.jobTitle
        };
      }
      return item;
    });
  }
  
  if (typeof data === 'object' && data !== null) {
    return {
      id: data.id,
      name: data.name || data.fullName,
      company: data.company,
      title: data.title || data.jobTitle
    };
  }
  
  return data;
}

/**
 * Get localStorage usage information
 */
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  let used = 0;
  let total = 0;
  
  try {
    // Calculate used space
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Estimate total available (most browsers have 5-10MB limit)
    total = 5 * 1024 * 1024; // 5MB estimate
    
    return {
      used,
      available: total - used,
      percentage: (used / total) * 100
    };
  } catch (error) {
    return { used: 0, available: 0, percentage: 0 };
  }
}
