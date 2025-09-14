/**
 * 🌐 WEB EXTENSION MANAGER
 * Manages extension downloads and installations for web applications
 */

export interface WebExtension {
  id: string;
  name: string;
  version: string;
  platform: "web";
  fileSize: number; // MB
  installDate: Date;
  lastUsed: Date;
  licenseKey?: string;
  isEnabled: boolean;
  storageKey: string;
  manifestUrl: string;
  bundleUrl: string;
}

export interface WebStorageInfo {
  totalUsed: number; // MB
  totalAvailable: number; // MB (browser storage limit)
  extensions: number; // MB
  cache: number; // MB
  data: number; // MB
  quota: number; // MB (IndexedDB quota)
  quotaUsed: number; // MB (IndexedDB used)
}

export interface WebExtensionBundle {
  manifest: {
    id: string;
    name: string;
    version: string;
    description: string;
    permissions: string[];
    files: string[];
  };
  files: { [filename: string]: string }; // Base64 encoded content
}

export class WebExpansionManager {
  private dbName = "AdratiaExtensions";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private installedExtensions: Map<string, WebExtension> = new Map();

  constructor() {
    this.initializeDatabase();
    this.loadInstalledExtensions();
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request['onerror'] = () => reject(request.error);
      request['onsuccess'] = () => {
        this['db'] = request.result;
        resolve();
      };

      request['onupgradeneeded'] = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains("extensions")) {
          const extensionStore = db.createObjectStore("extensions", {
            keyPath: "id",
          });
          extensionStore.createIndex("name", "name", { unique: false });
          extensionStore.createIndex("installDate", "installDate", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("extensionData")) {
          db.createObjectStore("extensionData", { keyPath: "extensionId" });
        }

        if (!db.objectStoreNames.contains("extensionFiles")) {
          db.createObjectStore("extensionFiles", { keyPath: "id" });
        }
      };
    });
  }

  private async loadInstalledExtensions(): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["extensions"], "readonly");
      const store = transaction.objectStore("extensions");
      const request = store.getAll();

      request['onsuccess'] = () => {
        request.result.forEach((ext: WebExtension) => {
          // Convert date strings back to Date objects
          ext['installDate'] = new Date(ext.installDate);
          ext['lastUsed'] = new Date(ext.lastUsed);
          this.installedExtensions.set(ext.id, ext);
        });
        resolve();
      };

      request['onerror'] = () => reject(request.error);
    });
  }

  // Check if extension is installed
  isExtensionInstalled(extensionId: string): boolean {
    return this.installedExtensions.has(extensionId);
  }

  // Get installed extension info
  getInstalledExtension(extensionId: string): WebExtension | null {
    return this.installedExtensions.get(extensionId) || null;
  }

  // Get all installed extensions
  getAllInstalledExtensions(): WebExtension[] {
    return Array.from(this.installedExtensions.values());
  }

  // Download and install extension
  async downloadAndInstallExtension(
    extensionId: string,
    downloadUrl: string,
    metadata: {
      name: string;
      version: string;
      fileSize: number;
      licenseKey?: string;
    },
    onProgress?: (progress: number) => void,
  ): Promise<WebExtension> {
    try {
      // Check if already installed
      if (this.isExtensionInstalled(extensionId)) {
        throw new Error("Extension is already installed");
      }

      // Check available storage
      const storageInfo = await this.getStorageInfo();
      if (
        storageInfo.totalUsed + metadata.fileSize >
        storageInfo.totalAvailable
      ) {
        throw new Error("Insufficient storage space");
      }

      // Download extension bundle
      onProgress?.(10);
      const bundle = await this.downloadExtensionBundle(
        downloadUrl,
        onProgress,
      );

      // Validate bundle
      if (bundle.manifest.id !== extensionId) {
        throw new Error("Extension ID mismatch");
      }

      // Store extension files
      onProgress?.(70);
      await this.storeExtensionFiles(extensionId, bundle);

      // Create extension record
      const installedExtension: WebExtension = {
        id: extensionId,
        name: metadata.name,
        version: metadata.version,
        platform: "web",
        fileSize: metadata.fileSize,
        installDate: new Date(),
        lastUsed: new Date(),
        licenseKey: metadata.licenseKey,
        isEnabled: true,
        storageKey: `ext_${extensionId}`,
        manifestUrl: downloadUrl,
        bundleUrl: downloadUrl,
      };

      // Store in IndexedDB and memory
      await this.storeExtension(installedExtension);
      this.installedExtensions.set(extensionId, installedExtension);

      onProgress?.(100);
      return installedExtension;
    } catch (error) {
      console.error("Failed to download and install extension:", error);
      throw error;
    }
  }

  // Uninstall extension
  async uninstallExtension(extensionId: string): Promise<void> {
    try {
      const extension = this.installedExtensions.get(extensionId);
      if (!extension) {
        throw new Error("Extension not found");
      }

      // Remove from IndexedDB
      await this.removeExtensionFromDB(extensionId);

      // Clear localStorage data
      const storageKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`${extension.storageKey}_`),
      );
      storageKeys.forEach((key) => localStorage.removeItem(key));

      // Clear sessionStorage data
      const sessionKeys = Object.keys(sessionStorage).filter((key) =>
        key.startsWith(`${extension.storageKey}_`),
      );
      sessionKeys.forEach((key) => sessionStorage.removeItem(key));

      // Remove from memory
      this.installedExtensions.delete(extensionId);
    } catch (error) {
      console.error("Failed to uninstall extension:", error);
      throw error;
    }
  }

  // Enable/disable extension
  async toggleExtension(extensionId: string, enabled: boolean): Promise<void> {
    const extension = this.installedExtensions.get(extensionId);
    if (extension) {
      extension['isEnabled'] = enabled;
      extension['lastUsed'] = new Date();

      await this.updateExtension(extension);

      // Reload extension if enabling
      if (enabled) {
        await this.loadExtension(extensionId);
      } else {
        await this.unloadExtension(extensionId);
      }
    }
  }

  // Load extension into runtime
  async loadExtension(extensionId: string): Promise<void> {
    const extension = this.installedExtensions.get(extensionId);
    if (!extension || !extension.isEnabled) return;

    try {
      // Get extension files from IndexedDB
      const files = await this.getExtensionFiles(extensionId);

      // Load main script
      if (files["main.js"]) {
        const script = document.createElement("script");
        script['textContent'] = atob(files["main.js"]);
        script.setAttribute("data-extension-id", extensionId);
        document.head.appendChild(script);
      }

      // Load CSS
      if (files["styles.css"]) {
        const style = document.createElement("style");
        style['textContent'] = atob(files["styles.css"]);
        style.setAttribute("data-extension-id", extensionId);
        document.head.appendChild(style);
      }

      // Update last used
      extension['lastUsed'] = new Date();
      await this.updateExtension(extension);
    } catch (error) {
      console.error("Failed to load extension:", error);
    }
  }

  // Unload extension from runtime
  async unloadExtension(extensionId: string): Promise<void> {
    // Remove scripts and styles
    const scripts = document.querySelectorAll(
      `script[data-extension-id="${extensionId}"]`,
    );
    const styles = document.querySelectorAll(
      `style[data-extension-id="${extensionId}"]`,
    );

    scripts.forEach((script) => script.remove());
    styles.forEach((style) => style.remove());

    // Trigger cleanup event
    window.dispatchEvent(
      new CustomEvent("extensionUnload", { detail: { extensionId } }),
    );
  }

  // Get storage information
  async getStorageInfo(): Promise<WebStorageInfo> {
    try {
      // Get quota information
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 50 * 1024 * 1024; // Default 50MB
      const quotaUsed = estimate.usage || 0;

      // Calculate extension storage
      const extensions = await this.calculateExtensionStorage();

      // Calculate cache storage
      const cache = await this.calculateCacheStorage();

      // Calculate localStorage + sessionStorage
      const data = this.calculateLocalStorageSize();

      const totalUsed = Math.round((extensions + cache + data) * 100) / 100;
      const totalAvailable = Math.round((quota / (1024 * 1024)) * 100) / 100;

      return {
        totalUsed,
        totalAvailable,
        extensions: Math.round(extensions * 100) / 100,
        cache: Math.round(cache * 100) / 100,
        data: Math.round(data * 100) / 100,
        quota: Math.round((quota / (1024 * 1024)) * 100) / 100,
        quotaUsed: Math.round((quotaUsed / (1024 * 1024)) * 100) / 100,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        totalUsed: 0,
        totalAvailable: 50,
        extensions: 0,
        cache: 0,
        data: 0,
        quota: 50,
        quotaUsed: 0,
      };
    }
  }

  // Clean up cache and temporary data
  async cleanupCache(): Promise<number> {
    try {
      let cleanedSize = 0;

      // Clear extension caches
      for (const [extensionId, extension] of this.installedExtensions) {
        const cacheKeys = Object.keys(localStorage).filter((key) =>
          key.startsWith(`${extension.storageKey}_cache_`),
        );

        cacheKeys.forEach((key) => {
          const size = new Blob([localStorage.getItem(key) || ""]).size;
          cleanedSize += size;
          localStorage.removeItem(key);
        });
      }

      // Clear browser cache storage
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes("adrata-extension")) {
            await caches.delete(cacheName);
            cleanedSize += 1024 * 1024; // Estimate 1MB per cache
          }
        }
      }

      return Math.round((cleanedSize / (1024 * 1024)) * 100) / 100; // Convert to MB
    } catch (error) {
      console.error("Failed to cleanup cache:", error);
      return 0;
    }
  }

  // Export extension list for backup
  exportExtensionList(): string {
    const exportData = {
      extensions: Array.from(this.installedExtensions.values()),
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      platform: "web",
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import extension list from backup
  async importExtensionList(importData: string): Promise<void> {
    try {
      const data = JSON.parse(importData);

      if (data.platform !== "web") {
        throw new Error("Import data is not compatible with web platform");
      }

      // TODO: Implement import logic
      console.log("Import extension list:", data);
    } catch (error) {
      console.error("Failed to import extension list:", error);
      throw error;
    }
  }

  // Private helper methods
  private async downloadExtensionBundle(
    url: string,
    onProgress?: (progress: number) => void,
  ): Promise<WebExtensionBundle> {
    // Simulate download for demo purposes
    // In production, implement actual HTTP download with progress tracking
    return new Promise((resolve) => {
      let progress = 10;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 70) {
          progress = 70;
          clearInterval(interval);

          // Mock bundle
          const bundle: WebExtensionBundle = {
            manifest: {
              id: "mock-extension",
              name: "Mock Extension",
              version: "1.0.0",
              description: "Mock extension for demo",
              permissions: ["storage", "activeTab"],
              files: ["main.js", "styles.css", "manifest.json"],
            },
            files: {
              "main.js": btoa('console.log("Extension loaded");'),
              "styles.css": btoa(".extension-style { color: blue; }"),
              "manifest.json": btoa(
                JSON.stringify({
                  id: "mock-extension",
                  name: "Mock Extension",
                  version: "1.0.0",
                }),
              ),
            },
          };

          resolve(bundle);
        }
        onProgress?.(Math.round(progress));
      }, 100);
    });
  }

  private async storeExtensionFiles(
    extensionId: string,
    bundle: WebExtensionBundle,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["extensionFiles"], "readwrite");
      const store = transaction.objectStore("extensionFiles");

      const fileData = {
        id: extensionId,
        manifest: bundle.manifest,
        files: bundle.files,
        storedAt: new Date(),
      };

      const request = store.put(fileData);
      request['onsuccess'] = () => resolve();
      request['onerror'] = () => reject(request.error);
    });
  }

  private async storeExtension(extension: WebExtension): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["extensions"], "readwrite");
      const store = transaction.objectStore("extensions");
      const request = store.put(extension);

      request['onsuccess'] = () => resolve();
      request['onerror'] = () => reject(request.error);
    });
  }

  private async updateExtension(extension: WebExtension): Promise<void> {
    return this.storeExtension(extension);
  }

  private async removeExtensionFromDB(extensionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["extensions", "extensionFiles"],
        "readwrite",
      );

      // Remove from extensions store
      const extensionStore = transaction.objectStore("extensions");
      extensionStore.delete(extensionId);

      // Remove from files store
      const filesStore = transaction.objectStore("extensionFiles");
      filesStore.delete(extensionId);

      transaction['oncomplete'] = () => resolve();
      transaction['onerror'] = () => reject(transaction.error);
    });
  }

  private async getExtensionFiles(
    extensionId: string,
  ): Promise<{ [filename: string]: string }> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["extensionFiles"], "readonly");
      const store = transaction.objectStore("extensionFiles");
      const request = store.get(extensionId);

      request['onsuccess'] = () => {
        const result = request.result;
        resolve(result ? result.files : {});
      };
      request['onerror'] = () => reject(request.error);
    });
  }

  private async calculateExtensionStorage(): Promise<number> {
    const extensions = Array.from(this.installedExtensions.values());
    return extensions.reduce((total, ext) => total + ext.fileSize, 0);
  }

  private async calculateCacheStorage(): Promise<number> {
    if (!("caches" in window)) return 0;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        if (cacheName.includes("adrata-extension")) {
          // Estimate cache size (actual calculation would require iterating through all entries)
          totalSize += 1; // 1MB estimate per cache
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  private calculateLocalStorageSize(): number {
    let totalSize = 0;

    // Calculate localStorage size
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += new Blob([key + localStorage.getItem(key)]).size;
      }
    }

    // Calculate sessionStorage size
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        totalSize += new Blob([key + sessionStorage.getItem(key)]).size;
      }
    }

    return totalSize / (1024 * 1024); // Convert to MB
  }
}

// Export singleton instance
export const webExpansionManager = new WebExpansionManager();
