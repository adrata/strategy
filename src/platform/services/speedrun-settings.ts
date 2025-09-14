import { prisma } from "@/platform/prisma";
import type { SpeedrunUserSettings } from "@/products/speedrun/types";

export class SpeedrunSettingsService {
  /**
   * Get user speedrun settings from database
   */
  static async getUserSettings(
    userId: string,
    workspaceId?: string,
  ): Promise<SpeedrunUserSettings | null> {
    try {
      const settings = await prisma.speedrunSettings.findFirst({
        where: {
          userId,
          workspaceId: workspaceId || null,
        },
      });

      if (!settings) {
        return null;
      }

      return {
        dailyTarget: Math.floor(settings.weeklyTarget / 7),
        weeklyTarget: settings.weeklyTarget,
        strategy: settings.strategy as "optimal" | "speed" | "revenue",
        role: settings.role as "AE" | "SDR" | "CSM" | "VP",
        quota: settings.quota || 0,
        pipelineHealth:
          (settings.pipelineHealth as "healthy" | "behind" | "ahead") ||
          "healthy",
      };
    } catch (error) {
      console.error("Error fetching user speedrun settings:", error);
      return null;
    }
  }

  /**
   * Save user speedrun settings to database
   */
  static async saveUserSettings(
    userId: string,
    settings: SpeedrunUserSettings,
    workspaceId?: string,
  ): Promise<boolean> {
    try {
      await prisma.speedrunSettings.upsert({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: workspaceId ?? "default",
          },
        },
        update: {
          weeklyTarget: settings.weeklyTarget,
          strategy: settings.strategy,
          role: settings.role,
          quota: settings.quota || 0,
          pipelineHealth: settings.pipelineHealth,
          updatedAt: new Date(),
        },
        create: {
          userId,
          workspaceId: workspaceId ?? "default",
          weeklyTarget: settings.weeklyTarget,
          strategy: settings.strategy,
          role: settings.role,
          quota: settings.quota || 0,
          pipelineHealth: settings.pipelineHealth,
        },
      });

      return true;
    } catch (error) {
      console.error("Error saving user speedrun settings:", error);
      return false;
    }
  }

  /**
   * Delete user speedrun settings
   */
  static async deleteUserSettings(
    userId: string,
    workspaceId?: string,
  ): Promise<boolean> {
    try {
      await prisma.speedrunSettings.deleteMany({
        where: {
          userId,
          workspaceId: workspaceId || null,
        },
      });

      return true;
    } catch (error) {
      console.error("Error deleting user speedrun settings:", error);
      return false;
    }
  }

  /**
   * Get all settings for a workspace (admin function)
   */
  static async getWorkspaceSettings(workspaceId: string): Promise<
    Array<{
      userId: string;
      userName?: string;
      settings: SpeedrunUserSettings;
    }>
  > {
    try {
      const settingsWithUsers = await prisma.speedrunSettings.findMany({
        where: {
          workspaceId: String(workspaceId || "default"),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return settingsWithUsers.map((item) => ({
        userId: item.userId,
        userName: item.user.name || item.user.email,
        settings: {
          dailyTarget: Math.floor(item.weeklyTarget / 7),
          weeklyTarget: item.weeklyTarget,
          strategy: item.strategy as "optimal" | "speed" | "revenue",
          role: item.role as "AE" | "SDR" | "CSM" | "VP",
          quota: item.quota || 0,
          pipelineHealth:
            (item.pipelineHealth as "healthy" | "behind" | "ahead") ||
            "healthy",
        },
      }));
    } catch (error) {
      console.error("Error fetching workspace speedrun settings:", error);
      return [];
    }
  }
}
