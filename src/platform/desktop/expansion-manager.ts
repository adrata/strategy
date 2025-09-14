/**
 * 🖥️ DESKTOP EXPANSION MANAGER
 * Manages expansion downloads and installations for desktop app
 */

import fs from "fs";
import path from "path";
import os from "os";

export interface InstalledExpansion {
  id: string;
  name: string;
  version: string;
  platform: "desktop";
  installPath: string;
  fileSize: number; // MB
  installDate: Date;
  lastUsed: Date;
  licenseKey?: string;
  isEnabled: boolean;
}

export interface DesktopStorageInfo {
  totalUsed: number; // MB
  totalAvailable: number; // MB
  expansionsPath: string;
  applicationsPath: string;
  cacheSize: number; // MB
}

export class DesktopExpansionManager {
  private expansionsPath: string;
  private applicationsPath: string;
  private configPath: string;
  private installedExpansions: Map<string, InstalledExpansion> = new Map();

  constructor() {
    // Set up paths based on OS
    const appDataPath = this.getAppDataPath();
    this['expansionsPath'] = path.join(appDataPath, "expansions");
    this['applicationsPath'] = path.join(appDataPath, "applications");
    this['configPath'] = path.join(appDataPath, "config.json");

    this.initializeDirectories();
    this.loadInstalledExpansions();
  }

  private getAppDataPath(): string {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case "win32":
        return path.join(homeDir, "AppData", "Local", "Adrata");
      case "darwin":
        return path.join(homeDir, "Library", "Application Support", "Adrata");
      case "linux":
        return path.join(homeDir, ".local", "share", "adrata");
      default:
        return path.join(homeDir, ".adrata");
    }
  }

  private initializeDirectories(): void {
    try {
      if (!fs.existsSync(this.expansionsPath)) {
        fs.mkdirSync(this.expansionsPath, { recursive: true });
      }
      if (!fs.existsSync(this.applicationsPath)) {
        fs.mkdirSync(this.applicationsPath, { recursive: true });
      }
    } catch (error) {
      console.error("Failed to initialize directories:", error);
    }
  }

  private loadInstalledExpansions(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
        if (config.installedExpansions) {
          config.installedExpansions.forEach((exp: any) => {
            this.installedExpansions.set(exp.id, {
              ...exp,
              installDate: new Date(exp.installDate),
              lastUsed: new Date(exp.lastUsed),
            });
          });
        }
      }
    } catch (error) {
      console.error("Failed to load installed expansions:", error);
    }
  }

  private saveConfig(): void {
    try {
      const config = {
        installedExpansions: Array.from(this.installedExpansions.values()).map(
          (exp) => ({
            ...exp,
            installDate: exp.installDate.toISOString(),
            lastUsed: exp.lastUsed.toISOString(),
          }),
        ),
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }

  // Check if expansion is installed
  isExpansionInstalled(expansionId: string): boolean {
    return this.installedExpansions.has(expansionId);
  }

  // Get installed expansion info
  getInstalledExpansion(expansionId: string): InstalledExpansion | null {
    return this.installedExpansions.get(expansionId) || null;
  }

  // Get all installed expansions
  getAllInstalledExpansions(): InstalledExpansion[] {
    return Array.from(this.installedExpansions.values());
  }

  // Download and install expansion
  async downloadAndInstallExpansion(
    expansionId: string,
    downloadUrl: string,
    metadata: {
      name: string;
      version: string;
      fileSize: number;
      licenseKey?: string;
    },
    onProgress?: (progress: number) => void,
  ): Promise<InstalledExpansion> {
    try {
      // Check if already installed
      if (this.isExpansionInstalled(expansionId)) {
        throw new Error("Expansion is already installed");
      }

      // Check available space
      const storageInfo = this.getStorageInfo();
      if (
        storageInfo.totalUsed + metadata.fileSize >
        storageInfo.totalAvailable
      ) {
        throw new Error("Insufficient storage space");
      }

      // Create expansion directory
      const expansionDir = path.join(this.expansionsPath, expansionId);
      if (!fs.existsSync(expansionDir)) {
        fs.mkdirSync(expansionDir, { recursive: true });
      }

      // Download file
      onProgress?.(0);
      const downloadPath = path.join(
        expansionDir,
        `${expansionId}-${metadata.version}.zip`,
      );
      await this.downloadFile(downloadUrl, downloadPath, onProgress);

      // Extract if it's a zip file
      if (downloadPath.endsWith(".zip")) {
        await this.extractZip(downloadPath, expansionDir);
        // Remove zip file after extraction
        fs.unlinkSync(downloadPath);
      }

      // Create expansion record
      const installedExpansion: InstalledExpansion = {
        id: expansionId,
        name: metadata.name,
        version: metadata.version,
        platform: "desktop",
        installPath: expansionDir,
        fileSize: metadata.fileSize,
        installDate: new Date(),
        lastUsed: new Date(),
        ...(metadata['licenseKey'] && { licenseKey: metadata.licenseKey }),
        isEnabled: true,
      };

      // Store in memory and save to config
      this.installedExpansions.set(expansionId, installedExpansion);
      this.saveConfig();

      onProgress?.(100);
      return installedExpansion;
    } catch (error) {
      console.error("Failed to download and install expansion:", error);
      throw error;
    }
  }

  // Uninstall expansion
  async uninstallExpansion(expansionId: string): Promise<void> {
    try {
      const expansion = this.installedExpansions.get(expansionId);
      if (!expansion) {
        throw new Error("Expansion not found");
      }

      // Remove files
      if (fs.existsSync(expansion.installPath)) {
        fs.rmSync(expansion.installPath, { recursive: true, force: true });
      }

      // Remove from memory and save config
      this.installedExpansions.delete(expansionId);
      this.saveConfig();
    } catch (error) {
      console.error("Failed to uninstall expansion:", error);
      throw error;
    }
  }

  // Enable/disable expansion
  toggleExpansion(expansionId: string, enabled: boolean): void {
    const expansion = this.installedExpansions.get(expansionId);
    if (expansion) {
      expansion['isEnabled'] = enabled;
      this.saveConfig();
    }
  }

  // Update last used timestamp
  updateLastUsed(expansionId: string): void {
    const expansion = this.installedExpansions.get(expansionId);
    if (expansion) {
      expansion['lastUsed'] = new Date();
      this.saveConfig();
    }
  }

  // Get storage information
  getStorageInfo(): DesktopStorageInfo {
    try {
      const totalUsed =
        this.calculateDirectorySize(this.expansionsPath) +
        this.calculateDirectorySize(this.applicationsPath);
      const cacheSize = this.calculateCacheSize();

      // Get available disk space
      const stats = fs.statSync(this.expansionsPath);
      const totalAvailable = 1000; // Simplified - in reality, you'd get actual available space

      return {
        totalUsed: Math.round(totalUsed * 100) / 100, // Round to 2 decimal places
        totalAvailable,
        expansionsPath: this.expansionsPath,
        applicationsPath: this.applicationsPath,
        cacheSize: Math.round(cacheSize * 100) / 100,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        totalUsed: 0,
        totalAvailable: 1000,
        expansionsPath: this.expansionsPath,
        applicationsPath: this.applicationsPath,
        cacheSize: 0,
      };
    }
  }

  // Clean up cache and temporary files
  async cleanupCache(): Promise<number> {
    try {
      const cacheDir = path.join(this.getAppDataPath(), "cache");
      let cleanedSize = 0;

      if (fs.existsSync(cacheDir)) {
        cleanedSize = this.calculateDirectorySize(cacheDir);
        fs.rmSync(cacheDir, { recursive: true, force: true });
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      return cleanedSize;
    } catch (error) {
      console.error("Failed to cleanup cache:", error);
      return 0;
    }
  }

  // Export expansion list for backup
  exportExpansionList(): string {
    const exportData = {
      expansions: Array.from(this.installedExpansions.values()),
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import expansion list from backup
  async importExpansionList(importData: string): Promise<void> {
    try {
      const data = JSON.parse(importData);
      // TODO: Implement import logic
      console.log("Import expansion list:", data);
    } catch (error) {
      console.error("Failed to import expansion list:", error);
      throw error;
    }
  }

  // Private helper methods
  private async downloadFile(
    url: string,
    filePath: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    // Simulate download for demo purposes
    // In production, use actual HTTP client with progress tracking
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // Create mock file
          fs.writeFileSync(filePath, "Mock expansion file content");
          resolve();
        }
        onProgress?.(Math.round(progress));
      }, 100);
    });
  }

  private async extractZip(
    zipPath: string,
    extractPath: string,
  ): Promise<void> {
    // Simulate zip extraction
    // In production, use a proper zip library like node-stream-zip
    const extractedFiles = [
      "manifest.json",
      "index.js",
      "style.css",
      "icon.png",
    ];

    extractedFiles.forEach((fileName) => {
      const filePath = path.join(extractPath, fileName);
      fs.writeFileSync(filePath, `Mock content for ${fileName}`);
    });
  }

  private calculateDirectorySize(dirPath: string): number {
    if (!fs.existsSync(dirPath)) return 0;

    let totalSize = 0;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += this.calculateDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });

    // Convert bytes to MB
    return totalSize / (1024 * 1024);
  }

  private calculateCacheSize(): number {
    const cacheDir = path.join(this.getAppDataPath(), "cache");
    return this.calculateDirectorySize(cacheDir);
  }
}

// Singleton instance
export const desktopExpansionManager = new DesktopExpansionManager();
