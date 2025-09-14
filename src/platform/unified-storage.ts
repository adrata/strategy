// Simplified Unified Storage Service for cross-platform data synchronization
// Uses aggressive polling and direct localStorage access for reliable sync

import { isDesktop } from "./platform-detection";
import React from "react";

class UnifiedStorageService {
  private static instance: UnifiedStorageService;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Array<(value: any) => void>> = new Map();
  private lastValues: Map<string, any> = new Map();

  constructor() {
    if (UnifiedStorageService.instance) {
      return UnifiedStorageService.instance;
    }
    UnifiedStorageService['instance'] = this;
    this.initializeSync();
  }

  private initializeSync() {
    if (typeof window === "undefined") return;

    // Very aggressive polling - check every 500ms for changes
    this['syncInterval'] = setInterval(() => {
      this.checkForChanges();
    }, 500);

    // Also check on page focus
    window.addEventListener("focus", () => {
      this.checkForChanges();
    });

    // Listen for storage events (for same-browser sync)
    window.addEventListener("storage", (e) => {
      if (e['key'] && this.listeners.has(e.key)) {
        const newValue = e.newValue ? JSON.parse(e.newValue) : null;
        this.notifyListeners(e.key, newValue);
      }
    });

    console.log("🔄 UnifiedStorage: Initialized with aggressive sync");
  }

  private checkForChanges() {
    // Check all keys we're listening to for changes
    for (const key of this.listeners.keys()) {
      const currentValue = this.getFromStorage(key);
      const lastValue = this.lastValues.get(key);

      // If value changed, notify listeners
      if (JSON.stringify(currentValue) !== JSON.stringify(lastValue)) {
        console.log(
          `🔄 UnifiedStorage: Detected change in ${key}:`,
          currentValue,
        );
        this.lastValues.set(key, currentValue);
        this.notifyListeners(key, currentValue);
      }
    }
  }

  private getFromStorage(key: string): any {
    if (typeof window === "undefined") return null;

    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn("⚠️ UnifiedStorage: Failed to parse stored value for", key);
      return localStorage.getItem(key);
    }
  }

  private setToStorage(key: string, value: any): void {
    if (typeof window === "undefined") return;

    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      this.lastValues.set(key, value);
      console.log(`💾 UnifiedStorage: Stored ${key}:`, value);
    } catch (error) {
      console.warn("⚠️ UnifiedStorage: Failed to store data for", key, error);
    }
  }

  private notifyListeners(key: string, value: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(value);
        } catch (error) {
          console.warn("⚠️ UnifiedStorage: Listener error for", key, error);
        }
      });
    }
  }

  // Public API
  public set(key: string, value: any): void {
    this.setToStorage(key, value);
    this.notifyListeners(key, value);
  }

  public get(key: string): any {
    const value = this.getFromStorage(key);
    this.lastValues.set(key, value); // Track this key for changes
    return value;
  }

  public remove(key: string): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
      this.lastValues.delete(key);
      this.notifyListeners(key, null);
    }
  }

  public subscribe(key: string, listener: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(listener);

    // Initialize tracking for this key
    const currentValue = this.getFromStorage(key);
    this.lastValues.set(key, currentValue);

    console.log(`👂 UnifiedStorage: Subscribed to ${key}`);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        const index = keyListeners.indexOf(listener);
        if (index > -1) {
          keyListeners.splice(index, 1);
        }
      }
    };
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this['syncInterval'] = null;
    }

    this.listeners.clear();
    this.lastValues.clear();
  }

  // Force immediate sync check
  public forceSync(): void {
    this.checkForChanges();
  }
}

// Global instance
export const unifiedStorage = new UnifiedStorageService();

// Hook for React components
export function useUnifiedStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [value, setValue] = React.useState<T>(() => {
    // Always use default value on server-side for SSR compatibility
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const stored = unifiedStorage.get(key);
      return stored !== null ? stored : defaultValue;
    } catch (error) {
      console.warn(`⚠️ Failed to get stored value for ${key}:`, error);
      return defaultValue;
    }
  });

  const [isClient, setIsClient] = React.useState(false);

  // Ensure we're on the client side
  React.useEffect(() => {
    setIsClient(true);

    // Re-sync with stored value once we're on client
    try {
      const stored = unifiedStorage.get(key);
      if (stored !== null && stored !== value) {
        setValue(stored);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to sync stored value for ${key}:`, error);
    }
  }, [key, value]);

  React.useEffect(() => {
    if (!isClient) return;

    const unsubscribe = unifiedStorage.subscribe(key, (newValue) => {
      const finalValue = newValue !== null ? newValue : defaultValue;
      console.log(`🔔 UnifiedStorage Hook: ${key} changed to:`, finalValue);
      setValue(finalValue);
    });

    return unsubscribe;
  }, [key, defaultValue, isClient]);

  const setStoredValue = React.useCallback(
    (newValue: T | ((prevValue: T) => T)) => {
      // Only update storage if we're on the client
      if (!isClient) {
        setValue(newValue);
        return;
      }

      try {
        if (typeof newValue === "function") {
          setValue((prevValue) => {
            const updatedValue = (newValue as (prevValue: T) => T)(prevValue);
            unifiedStorage.set(key, updatedValue);
            return updatedValue;
          });
        } else {
          unifiedStorage.set(key, newValue);
          setValue(newValue);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to set stored value for ${key}:`, error);
        // Still update local state even if storage fails
        setValue(newValue);
      }
    },
    [key, isClient],
  );

  return [value, setStoredValue];
}
