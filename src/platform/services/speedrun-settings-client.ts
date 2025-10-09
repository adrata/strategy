import type { SpeedrunUserSettings } from "@/products/speedrun/types";
import { safeApiFetch } from "@/platform/api-fetch";

export class SpeedrunSettingsClientService {
  /**
   * Get user speedrun settings from API
   */
  static async getUserSettings(
    userId: string,
    workspaceId?: string,
  ): Promise<SpeedrunUserSettings | null> {
    try {
      const params = new URLSearchParams({ userId });
      if (workspaceId) params['append']("workspaceId", workspaceId);

      const fallbackSettings = {
        dailyTarget: 20,
        weeklyTarget: 100,
        strategy: "optimal" as const,
        role: "AE" as const,
        quota: 1000,
        pipelineHealth: "healthy" as const,
      };

      const response = await safeApiFetch(
        `/api/speedrun-settings?${params}`,
        {},
        {
          success: false,
          settings: fallbackSettings,
          providers: [],
        },
      );

      // Return fallback settings if API call fails
      if (!response.success) {
        console.log(
          "📋 SpeedrunSettings: API call failed, using fallback settings",
        );
        return fallbackSettings;
      }

      return response.settings || fallbackSettings;
    } catch (error) {
      console.error("Error fetching user speedrun settings:", error);
      // Return fallback settings instead of null
      return {
        dailyTarget: 20,
        weeklyTarget: 100,
        strategy: "optimal" as const,
        role: "AE" as const,
        quota: 1000,
        pipelineHealth: "healthy" as const,
      };
    }
  }

  /**
   * Save user speedrun settings via API
   */
  static async saveUserSettings(
    userId: string,
    settings: SpeedrunUserSettings,
    workspaceId?: string,
  ): Promise<boolean> {
    try {
      const response = await safeApiFetch(
        "/api/speedrun-settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            workspaceId,
            settings,
          }),
        },
        {
          success: false,
          message: "Failed to update settings",
        },
      );

      if (!response.success) {
        console.log(
          "📋 SpeedrunSettings: Failed to save settings, continuing with local state",
        );
        return false;
      }

      return response.success;
    } catch (error) {
      console.error("Error saving user speedrun settings:", error);
      return false;
    }
  }

  /**
   * Delete user speedrun settings via API
   */
  static async deleteUserSettings(
    userId: string,
    workspaceId?: string,
  ): Promise<boolean> {
    try {
      const params = new URLSearchParams({ userId });
      if (workspaceId) params['append']("workspaceId", workspaceId);

      const response = await safeApiFetch(
        `/api/speedrun-settings?${params}`,
        {
          method: "DELETE",
        },
        {
          success: false,
          message: "Failed to delete provider",
        },
      );

      if (!response.success) {
        console.log("📋 SpeedrunSettings: Failed to delete settings");
        return false;
      }

      return response.success;
    } catch (error) {
      console.error("Error deleting user speedrun settings:", error);
      return false;
    }
  }
}
