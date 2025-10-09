/**
 * 🎯 PLATFORM ACCESS MANAGER
 * Manages platform access configuration for users and workspaces
 * - Monaco standalone vs Full AOS
 * - User-level and workspace-level overrides
 * - Admin configuration interface
 */

import { PrismaClient } from "@prisma/client";
import { DemoAccessValidator } from '@/platform/services/demo-access-validator';

const prisma = new PrismaClient();

export type PlatformAccessLevel = "monaco-standalone" | "aos-full";

export interface PlatformAccessConfig {
  id: string;
  userId?: string;
  workspaceId?: string;
  platformAccess: PlatformAccessLevel;
  availableApps: string[];
  features: {
    buyerGroupIntelligence: boolean;
    rtpEngine: boolean;
    aiChat: boolean;
    multipleApps: boolean;
    appSwitcher: boolean;
    globalNavigation: boolean;
    rtp?: boolean;
    pipeline?: boolean;
    crossAppIntegration?: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class PlatformAccessManager {

  /**
   * Create platform access configuration for a user
   */
  static async createUserAccess(
    userId: string,
    platformAccess: PlatformAccessLevel,
    createdBy: string,
    workspaceId?: string
  ): Promise<PlatformAccessConfig> {
    const config = this.getAccessConfig(platformAccess);

    try {
      // For now, we'll store this in localStorage or a simple config
      // In production, this would be stored in the database
      const accessConfig: PlatformAccessConfig = {
        id: `user-access-${userId}-${Date.now()}`,
        userId,
        workspaceId,
        platformAccess,
        availableApps: config.apps,
        features: config.features,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy
      };

      // Store in localStorage for now (in production, use database)
      const existingConfigs = this.getStoredConfigs();
      existingConfigs.push(accessConfig);
      localStorage.setItem('platform_access_configs', JSON.stringify(existingConfigs));

      console.log("✅ Platform access created for user:", userId, "Access level:", platformAccess);
      return accessConfig;

    } catch (error) {
      console.error("❌ Failed to create user platform access:", error);
      throw error;
    }
  }

  /**
   * Update platform access for a user
   */
  static async updateUserAccess(
    userId: string,
    platformAccess: PlatformAccessLevel,
    updatedBy: string
  ): Promise<PlatformAccessConfig> {
    try {
      const existingConfigs = this.getStoredConfigs();
      const configIndex = existingConfigs.findIndex(c => c['userId'] === userId && c.isActive);

      if (configIndex === -1) {
        // Create new config if none exists
        return this.createUserAccess(userId, platformAccess, updatedBy);
      }

             // Update existing config
       const config = this.getAccessConfig(platformAccess);
       const existingConfig = existingConfigs[configIndex]!; // We know it exists from the find check
       const updatedConfig: PlatformAccessConfig = {
         id: existingConfig.id,
         userId: existingConfig.userId,
         workspaceId: existingConfig.workspaceId,
         platformAccess,
         availableApps: config.apps,
         features: config.features,
         isActive: existingConfig.isActive,
         createdAt: existingConfig.createdAt,
         updatedAt: new Date(),
         createdBy: existingConfig.createdBy
       };
       
       existingConfigs[configIndex] = updatedConfig;
       localStorage.setItem('platform_access_configs', JSON.stringify(existingConfigs));

       console.log("✅ Platform access updated for user:", userId, "New access level:", platformAccess);
       return updatedConfig;

    } catch (error) {
      console.error("❌ Failed to update user platform access:", error);
      throw error;
    }
  }

  /**
   * Get platform access for a user
   */
  static async getUserAccess(userId: string, userEmail?: string): Promise<PlatformAccessConfig | null> {
    try {
      const existingConfigs = this.getStoredConfigs();
      
      // Find by user ID first
      let config = existingConfigs.find(c => c['userId'] === userId && c.isActive);
      
      // Fallback to hardcoded logic for known users
      if (!config) {
        // Demo access is ONLY allowed for Dan and Ross users
        const demoAccessResult = DemoAccessValidator.validateDemoAccess(userId, userEmail);
        
        // STRICT: Only grant demo access if user is Dan or Ross AND has demo credentials
        if ((userEmail === "demo@adrata.com" || userId === "demo-user-2025") && demoAccessResult.hasAccess && demoAccessResult.isDanOrRoss) {
          return {
            id: `hardcoded-demo-${Date.now()}`,
            userId,
            platformAccess: "monaco-standalone",
            availableApps: ["monaco"],
            features: {
              buyerGroupIntelligence: true,
              rtpEngine: true,
              aiChat: true,
              multipleApps: false,
              appSwitcher: false,
              globalNavigation: false
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: "system"
          };
        } else {
          // Default to full AOS for production users
          return {
            id: `hardcoded-production-${Date.now()}`,
            userId,
            platformAccess: "aos-full",
            availableApps: ["monaco", "rtp", "pipeline", "oasis", "tower", "garage"],
            features: {
              buyerGroupIntelligence: true,
              rtpEngine: true,
              aiChat: true,
              multipleApps: true,
              appSwitcher: true,
              globalNavigation: true,
              rtp: true,
              pipeline: true,
              crossAppIntegration: true
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: "system"
          };
        }
      }

      return config;

    } catch (error) {
      console.error("❌ Failed to get user platform access:", error);
      return null;
    }
  }

  /**
   * Get all platform access configurations
   */
  static async getAllConfigs(): Promise<PlatformAccessConfig[]> {
    try {
      return this.getStoredConfigs();
    } catch (error) {
      console.error("❌ Failed to get platform access configs:", error);
      return [];
    }
  }

  /**
   * Delete platform access configuration
   */
  static async deleteUserAccess(userId: string): Promise<boolean> {
    try {
      const existingConfigs = this.getStoredConfigs();
      const filteredConfigs = existingConfigs.filter(c => c.userId !== userId);
      
      localStorage.setItem('platform_access_configs', JSON.stringify(filteredConfigs));
      
      console.log("✅ Platform access deleted for user:", userId);
      return true;

    } catch (error) {
      console.error("❌ Failed to delete user platform access:", error);
      return false;
    }
  }

  /**
   * Get platform access configuration template
   */
  private static getAccessConfig(platformAccess: PlatformAccessLevel) {
    switch (platformAccess) {
      case "monaco-standalone":
        return {
          apps: ["monaco"],
          features: {
            buyerGroupIntelligence: true,
            rtpEngine: true,
            aiChat: true,
            multipleApps: false,
            appSwitcher: false,
            globalNavigation: false
          }
        };
      
      case "aos-full":
        return {
          apps: ["monaco", "rtp", "pipeline", "oasis", "tower", "garage"],
          features: {
            buyerGroupIntelligence: true,
            rtpEngine: true,
            aiChat: true,
            multipleApps: true,
            appSwitcher: true,
            globalNavigation: true,
            rtp: true,
            pipeline: true,
            crossAppIntegration: true
          }
        };
      
      default:
        throw new Error(`Unknown platform access level: ${platformAccess}`);
    }
  }

  /**
   * Get stored configurations from localStorage
   */
  private static getStoredConfigs(): PlatformAccessConfig[] {
    try {
      if (typeof window === "undefined") return [];
      
      const stored = localStorage.getItem('platform_access_configs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("❌ Failed to parse stored configs:", error);
      return [];
    }
  }

  /**
   * Reset all configurations (for testing)
   */
  static async resetConfigs(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem('platform_access_configs');
      console.log("🧹 Platform access configurations reset");
    }
  }

  /**
   * Export configurations (for backup)
   */
  static async exportConfigs(): Promise<string> {
    const configs = this.getStoredConfigs();
    return JSON.stringify(configs, null, 2);
  }

  /**
   * Import configurations (from backup)
   */
  static async importConfigs(configsJson: string): Promise<boolean> {
    try {
      const configs = JSON.parse(configsJson);
      if (typeof window !== "undefined") {
        localStorage.setItem('platform_access_configs', JSON.stringify(configs));
        console.log("✅ Platform access configurations imported");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to import configs:", error);
      return false;
    }
  }
}

export default PlatformAccessManager; 