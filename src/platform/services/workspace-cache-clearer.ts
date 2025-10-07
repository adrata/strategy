/**
 * 🧹 WORKSPACE CACHE CLEARER - COMPREHENSIVE CACHE INVALIDATION
 * 
 * Clears all caches when workspace switches to prevent data leakage
 * Handles multiple cache layers: browser, Next.js, API, and React state
 */

import { cache } from 'react';

export class WorkspaceCacheClearer {
  /**
   * Clear all workspace-related caches
   */
  static async clearAllWorkspaceCaches(previousWorkspaceId: string, newWorkspaceId: string): Promise<void> {
    console.log(`🧹 [CACHE CLEARER] Clearing all caches for workspace switch: ${previousWorkspaceId} -> ${newWorkspaceId}`);
    
    try {
      // 1. Clear Next.js data cache
      await this.clearNextJSCache();
      
      // 2. Clear browser cache (if possible)
      await this.clearBrowserCache();
      
      // 3. Clear API route caches
      await this.clearAPICaches();
      
      // 4. Clear React state caches
      await this.clearReactStateCaches();
      
      console.log(`✅ [CACHE CLEARER] Successfully cleared all caches for workspace switch`);
    } catch (error) {
      console.error(`❌ [CACHE CLEARER] Failed to clear caches:`, error);
    }
  }

  /**
   * Clear Next.js data cache using revalidateTag
   */
  private static async clearNextJSCache(): Promise<void> {
    try {
      // Import revalidateTag from Next.js cache
      const { revalidateTag } = await import('next/cache');
      
      // Clear all workspace-related tags
      const tags = [
        'workspace-data',
        'section-data',
        'dashboard-data',
        'pipeline-data',
        'acquisition-data',
        'speedrun-data',
        'leads-data',
        'prospects-data',
        'people-data',
        'companies-data'
      ];
      
      for (const tag of tags) {
        revalidateTag(tag);
        console.log(`🧹 [CACHE CLEARER] Cleared Next.js cache tag: ${tag}`);
      }
    } catch (error) {
      console.warn(`⚠️ [CACHE CLEARER] Failed to clear Next.js cache:`, error);
    }
  }

  /**
   * Clear browser cache using service worker or cache API
   */
  private static async clearBrowserCache(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        
        for (const cacheName of cacheNames) {
          if (cacheName.includes('workspace') || cacheName.includes('section') || cacheName.includes('data')) {
            await caches.delete(cacheName);
            console.log(`🧹 [CACHE CLEARER] Cleared browser cache: ${cacheName}`);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ [CACHE CLEARER] Failed to clear browser cache:`, error);
    }
  }

  /**
   * Clear API route memory caches
   */
  private static async clearAPICaches(): Promise<void> {
    try {
      // Clear section cache
      const { sectionCache } = await import('@/app/api/data/section/route');
      if (sectionCache && typeof sectionCache.clear === 'function') {
        sectionCache.clear();
        console.log(`🧹 [CACHE CLEARER] Cleared section cache`);
      }
      
      // Clear unified data cache
      const { unifiedDataMemoryCache } = await import('@/app/api/data/unified/route');
      if (unifiedDataMemoryCache && typeof unifiedDataMemoryCache.clear === 'function') {
        unifiedDataMemoryCache.clear();
        console.log(`🧹 [CACHE CLEARER] Cleared unified data cache`);
      }
      
      // Clear dashboard cache
      const { dashboardMemoryCache } = await import('@/app/api/pipeline/dashboard/route');
      if (dashboardMemoryCache && typeof dashboardMemoryCache.clear === 'function') {
        dashboardMemoryCache.clear();
        console.log(`🧹 [CACHE CLEARER] Cleared dashboard cache`);
      }
    } catch (error) {
      console.warn(`⚠️ [CACHE CLEARER] Failed to clear API caches:`, error);
    }
  }

  /**
   * Clear React state caches
   */
  private static async clearReactStateCaches(): Promise<void> {
    try {
      // Dispatch custom event to clear all React state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adrata-clear-all-caches', {
          detail: { timestamp: Date.now() }
        }));
        console.log(`🧹 [CACHE CLEARER] Dispatched clear all caches event`);
      }
    } catch (error) {
      console.warn(`⚠️ [CACHE CLEARER] Failed to clear React state caches:`, error);
    }
  }

  /**
   * Force refresh all data after workspace switch
   */
  static async forceRefreshAllData(): Promise<void> {
    try {
      // Force refresh all components by dispatching refresh events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('adrata-force-refresh-all', {
          detail: { timestamp: Date.now() }
        }));
        console.log(`🔄 [CACHE CLEARER] Dispatched force refresh all event`);
      }
    } catch (error) {
      console.warn(`⚠️ [CACHE CLEARER] Failed to force refresh data:`, error);
    }
  }
}
