/**
 * 📱 MOBILE PRODUCTION AUTHENTICATION SERVICE
 * Capacitor-specific authentication against production database
 */

import { Capacitor } from "@capacitor/core";

// Conditional imports for Capacitor plugins (only available in mobile environment)
let Preferences: any;
let Network: any;

// Dynamically import Capacitor plugins only when needed
const initCapacitorPlugins = async () => {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const preferencesModule = await import("@capacitor/preferences");
      const networkModule = await import("@capacitor/network");
      Preferences = preferencesModule.Preferences;
      Network = networkModule.Network;
    } catch (error) {
      console.warn("Capacitor plugins not available:", error);
    }
  }
};
import type { Workspace } from "../auth-unified";
import { AUTH_API_ROUTES } from "../auth/routes";

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isActive: boolean;
  lastSeen: string;
}

export interface MobileAuthResult {
  success: boolean;
  error?: string;
  user?: MobileUser;
  accessToken?: string;
}

export interface MobileSession {
  user: MobileUser;
  accessToken: string | undefined;
  expires: string;
  lastActivity: string;
  platform: "mobile";
  deviceId: string;
  syncEnabled: boolean;
}

export class MobileAuthService {
  private static readonly SESSION_KEY = "adrata_mobile_session_v1";
  private static readonly API_BASE_URL = typeof window !== "undefined" && window['location']['hostname'] === "localhost" 
    ? "http://localhost:3000" 
    : "https://action.adrata.com";

  /**
   * Authenticate against production database
   */
  static async signIn(
    email: string,
    password: string,
  ): Promise<MobileAuthResult> {
    console.log("📱 Mobile: Attempting production authentication for:", email);
    console.log("📱 Mobile: Current URL:", typeof window !== "undefined" ? window.location.href : "server");
    console.log("📱 Mobile: Is Capacitor:", typeof window !== "undefined" ? !!(window as any).Capacitor : false);
    console.log("📱 Mobile: Is native platform:", typeof window !== "undefined" && (window as any).Capacitor ? (window as any).Capacitor.isNativePlatform() : false);

    try {
      // Initialize Capacitor plugins
      await initCapacitorPlugins();
      
      // Check network connectivity (only if Network is available)
      if (Network) {
        const networkStatus = await Network.getStatus();
        if (!networkStatus.connected) {
          return {
            success: false,
            error:
              "No internet connection. Please check your network and try again.",
          };
        }
      } else {
        console.warn("Network plugin not available, skipping connectivity check");
      }

      // Get device ID
      const deviceId = await this.getDeviceId();

      // Authenticate against production API
      const authResult = await this.authenticateWithProduction(
        email,
        password,
        deviceId,
      );

      if (authResult['success'] && authResult.user) {
        // Create mobile session
        const session: MobileSession = {
          user: authResult.user,
          accessToken: authResult.accessToken,
          expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date().toISOString(),
          platform: "mobile",
          deviceId,
          syncEnabled: true, // Production sync enabled
        };

        // Store session securely
        await this.storeSession(session);

        console.log(
          "✅ Mobile production authentication successful for:",
          authResult.user.name,
        );
        return authResult;
      }

      return authResult;
    } catch (error) {
      console.error("❌ Mobile authentication error:", error);
      return {
        success: false,
        error: "Authentication failed. Please try again.",
      };
    }
  }

  /**
   * Authenticate with production API
   */
  private static async authenticateWithProduction(
    email: string,
    password: string,
    deviceId: string,
  ): Promise<MobileAuthResult> {
    try {
      console.log("📱 Mobile: Making API request to:", `${this.API_BASE_URL}${AUTH_API_ROUTES.SIGN_IN}`);
      
      const response = await fetch(`${this.API_BASE_URL}${AUTH_API_ROUTES.SIGN_IN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          platform: "mobile",
          deviceId,
        }),
      });

      console.log("📱 Mobile: Response status:", response.status);
      console.log("📱 Mobile: Response headers:", Object.fromEntries(response.headers.entries()));

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.error("📱 Mobile: API request failed with status:", response.status);
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
        };
      }

      // Check if response has content
      const responseText = await response.text();
      console.log("📱 Mobile: Raw response:", responseText);

      if (!responseText || responseText.trim() === "") {
        console.error("📱 Mobile: Empty response received");
        return {
          success: false,
          error: "Empty response from server",
        };
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("📱 Mobile: JSON parsing failed:", parseError);
        console.error("📱 Mobile: Response text:", responseText);
        return {
          success: false,
          error: "Invalid response format from server",
        };
      }

      if (data['success'] && data.user) {
        // Map production user to mobile user format
        const userWorkspaces = data.user?.workspaces || [];
        // 🆕 CRITICAL FIX: Use actual active workspace, not first workspace
        const activeWorkspace = userWorkspaces.find(w => w['id'] === data.user.activeWorkspaceId) || userWorkspaces[0];

        const mobileUser: MobileUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          workspaces: userWorkspaces,
          activeWorkspaceId: activeWorkspace ? activeWorkspace.id : null,
          isActive: true,
          lastSeen: new Date().toISOString(),
        };

        return {
          success: true,
          user: mobileUser,
          accessToken: data.accessToken,
        };
      } else {
        return {
          success: false,
          error: data.error || "Invalid credentials",
        };
      }
    } catch (error) {
      console.error("❌ Production API authentication failed:", error);
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    }
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<MobileSession | null> {
    try {
      // Initialize Capacitor plugins
      await initCapacitorPlugins();
      
      if (!Preferences) {
        console.warn("Preferences plugin not available");
        return null;
      }
      
      const stored = await Preferences.get({ key: this.SESSION_KEY });
      if (!stored.value) return null;

      const session: MobileSession = JSON.parse(stored.value);

      // Check expiry
      if (new Date(session.expires) < new Date()) {
        await this.clearSession();
        return null;
      }

      // Update last activity
      session['lastActivity'] = new Date().toISOString();
      await this.storeSession(session);

      return session;
    } catch (error) {
      console.error("❌ Mobile: Error getting session:", error);
      return null;
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      console.log("📱 Mobile: Signing out...");
      await this.clearSession();
      console.log("✅ Mobile: Signed out successfully");
    } catch (error) {
      console.error("❌ Mobile: Sign out error:", error);
    }
  }

  /**
   * Store session securely
   */
  private static async storeSession(session: MobileSession): Promise<void> {
    await initCapacitorPlugins();
    
    if (!Preferences) {
      console.warn("Preferences plugin not available, cannot store session");
      return;
    }
    
    await Preferences.set({
      key: this.SESSION_KEY,
      value: JSON.stringify(session),
    });
  }

  /**
   * Clear session
   */
  private static async clearSession(): Promise<void> {
    await initCapacitorPlugins();
    
    if (!Preferences) {
      console.warn("Preferences plugin not available, cannot clear session");
      return;
    }
    
    await Preferences.remove({ key: this.SESSION_KEY });
  }

  /**
   * Get device ID
   */
  private static async getDeviceId(): Promise<string> {
    try {
      await initCapacitorPlugins();
      
      if (!Preferences) {
        console.warn("Preferences plugin not available, generating temporary device ID");
        return `mobile-${Date.now()}`;
      }
      
      const stored = await Preferences.get({ key: "adrata_device_id" });
      if (stored.value) {
        return stored.value;
      }

      // Generate new device ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      const deviceId = `mobile-${timestamp}-${random}`;

      await Preferences.set({
        key: "adrata_device_id",
        value: deviceId,
      });

      return deviceId;
    } catch (error) {
      console.error("❌ Mobile: Error getting device ID:", error);
      return `mobile-${Date.now()}`;
    }
  }

  /**
   * Check if running in Capacitor environment
   */
  static isCapacitor(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get platform info
   */
  static getPlatformInfo() {
    return {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      isIOS: Capacitor.getPlatform() === "ios",
      isAndroid: Capacitor.getPlatform() === "android",
    };
  }
}
