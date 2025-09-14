/**
 * UNIVERSAL SAFE STORAGE - 2025 Multi-Platform
 * Prevents localStorage SSR errors across Vercel, Tauri, and Capacitor
 */

export interface SafeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  length: number;
  key: (index: number) => string | null;
}

class UniversalStorage implements SafeStorage {
  private isClient: boolean;
  private fallbackStorage: Map<string, string>;

  constructor() {
    this['isClient'] =
      typeof window !== "undefined" && typeof localStorage !== "undefined";
    this['fallbackStorage'] = new Map();
  }

  getItem(key: string): string | null {
    if (this.isClient) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn(`Failed to read from localStorage:`, error);
        return this.fallbackStorage.get(key) || null;
      }
    }
    return this.fallbackStorage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (this.isClient) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (error) {
        console.warn(`Failed to write to localStorage:`, error);
      }
    }
    this.fallbackStorage.set(key, value);
  }

  removeItem(key: string): void {
    if (this.isClient) {
      try {
        localStorage.removeItem(key);
        return;
      } catch (error) {
        console.warn(`Failed to remove from localStorage:`, error);
      }
    }
    this.fallbackStorage.delete(key);
  }

  clear(): void {
    if (this.isClient) {
      try {
        localStorage.clear();
        return;
      } catch (error) {
        console.warn(`Failed to clear localStorage:`, error);
      }
    }
    this.fallbackStorage.clear();
  }

  get length(): number {
    if (this.isClient) {
      try {
        return localStorage.length;
      } catch (error) {
        console.warn(`Failed to get localStorage length:`, error);
      }
    }
    return this.fallbackStorage.size;
  }

  key(index: number): string | null {
    if (this.isClient) {
      try {
        return localStorage.key(index);
      } catch (error) {
        console.warn(`Failed to get localStorage key:`, error);
      }
    }
    const keys = Array.from(this.fallbackStorage.keys());
    return keys[index] || null;
  }
}

// Export singleton instance
export const safeStorage: SafeStorage = new UniversalStorage();

// Convenience functions
export const safeLocalStorage = {
  getItem: (key: string): string | null => safeStorage.getItem(key),
  setItem: (key: string, value: string): void =>
    safeStorage.setItem(key, value),
  removeItem: (key: string): void => safeStorage.removeItem(key),
  clear: (): void => safeStorage.clear(),
};

// Platform-specific enhancements
export const platformStorage = {
  // Store data with platform prefix
  setItemWithPlatform: (key: string, value: string): void => {
    const platform =
      typeof window !== "undefined" && (window as any).Capacitor
        ? "mobile"
        : typeof window !== "undefined" && (window as any).__TAURI__
          ? "desktop"
          : "web";
    safeStorage.setItem(`${platform}_${key}`, value);
  },

  getItemWithPlatform: (key: string): string | null => {
    const platform =
      typeof window !== "undefined" && (window as any).Capacitor
        ? "mobile"
        : typeof window !== "undefined" && (window as any).__TAURI__
          ? "desktop"
          : "web";
    return safeStorage.getItem(`${platform}_${key}`);
  },
};
