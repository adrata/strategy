/**
 * 🧹 UNIFIED CACHE CLEANER - 2025 ENTERPRISE GRADE
 * 
 * Uses the unified cache system for optimal cache management
 */

import { cache } from '@/platform/services';

// Theme keys that should be preserved to prevent theme flash
const THEME_KEYS_TO_PRESERVE = [
  'adrata-theme-preferences',
  'adrata-theme-mode',
  'adrata-light-theme',
  'adrata-dark-theme',
];

// Clear all caches using unified system
export async function clearAllCaches() {
  console.log('🧹 [UNIFIED CACHE CLEANER] Clearing all caches for security...');
  
  try {
    // Clear unified cache
    await cache.clear();
    console.log('✅ [UNIFIED CACHE CLEANER] Cleared unified cache');
  } catch (error) {
    console.warn('⚠️ [UNIFIED CACHE CLEANER] Could not clear unified cache:', error);
  }
  
  // Clear browser caches if available
  if (typeof window !== 'undefined') {
    // Clear localStorage (preserve theme preferences to prevent flash)
    try {
      // Save theme preferences before clearing
      const themeData: Record<string, string | null> = {};
      THEME_KEYS_TO_PRESERVE.forEach(key => {
        themeData[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      
      // Restore theme preferences
      Object.entries(themeData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
      
      console.log('✅ [UNIFIED CACHE CLEANER] Cleared localStorage (theme preserved)');
    } catch (error) {
      console.warn('⚠️ [UNIFIED CACHE CLEANER] Could not clear localStorage:', error);
    }
    
    // Clear sessionStorage
    try {
      sessionStorage.clear();
      console.log('✅ [UNIFIED CACHE CLEANER] Cleared sessionStorage');
    } catch (error) {
      console.warn('⚠️ [UNIFIED CACHE CLEANER] Could not clear sessionStorage:', error);
    }
    
    // Clear service worker caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
        console.log('✅ [CACHE CLEANER] Cleared service worker caches');
      });
    }
  }
  
  console.log('🧹 [CACHE CLEANER] All caches cleared successfully');
}

// Force reload without cache
export function forceReloadWithoutCache() {
  if (typeof window !== 'undefined') {
    console.log('🔄 [CACHE CLEANER] Force reloading without cache...');
    window.location.reload();
  }
}