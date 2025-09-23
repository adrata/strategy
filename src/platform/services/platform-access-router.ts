/**
 * 🎯 PLATFORM ACCESS ROUTER
 * Routes users to appropriate interfaces based on their platform access level
 * - Demo users → Monaco standalone
 * - Production users → Full AOS with all apps
 */

import WorkspaceDataRouter, { type WorkspaceContext } from "./workspace-data-router";

export interface PlatformRoute {
  path: string;
  component: string;
  title: string;
  description: string;
}

export class PlatformAccessRouter {
  
  /**
   * Get the appropriate route for the current user
   */
  static async getDefaultRoute(): Promise<PlatformRoute> {
    try {
      const context = await WorkspaceDataRouter.getWorkspaceContext();
      return this.getRouteForContext(context);
    } catch (error) {
      console.error("❌ PlatformAccessRouter: Error getting route:", error);
      // Fallback to demo route
      return this.getDemoRoute();
    }
  }

  /**
   * Get route based on workspace context
   */
  static getRouteForContext(context: WorkspaceContext): PlatformRoute {
    if (context['platformAccess'] === "monaco-standalone") {
      return this.getDemoRoute();
    } 
    // Route based on workspace context, not hardcoded emails
    // Users in specific workspaces get appropriate interfaces
    else if (context['workspaceId'] === "cmezxb1ez0001pc94yry3ntjk") {
      // Notary Everyday workspace - route to AOS (full platform)
      return this.getAOSRoute();
    }
    else if (context['workspaceId'] === "01K1VBYV8ETM2RCQA4GNN9EG72") {
      // Retail Product Solutions workspace - route to Pipeline
      return this.getPipelineRoute();
    }
    else if (context['workspaceId'] === "workspace_1756920650136_mzbnmnh9q") {
      // TOPS Engineering Talent Management workspace - route to AOS (full platform)
      return this.getAOSRoute();
    }
    // Handle users with no active workspace (like dan@adrata.com)
    else if (!context.workspaceId) {
      // Users without active workspace get default AOS route
      return this.getAOSRoute();
    }
    // Default: All other users go to AOS
    else {
      return this.getAOSRoute();
    }
  }

  /**
   * Demo user route - Monaco standalone
   */
  static getDemoRoute(): PlatformRoute {
    return {
      path: "/monaco",
      component: "MonacoStandalone",
      title: "Monaco - Buyer Group Intelligence",
      description: "Find and analyze your buyer groups with AI-powered intelligence"
    };
  }

  /**
   * Production user route - Speedrun (Default)
   */
  static getAOSRoute(): PlatformRoute {
    return {
      path: "/speedrun",
      component: "SpeedrunDashboard",
      title: "Adrata Action Platform",
      description: "Complete business platform with Monaco, Pipeline, and more"
    };
  }

  /**
   * Pipeline-focused route for Dano
   */
  static getPipelineRoute(): PlatformRoute {
    return {
      path: "/speedrun",
      component: "SpeedrunDashboard",
      title: "Retail Product Solutions - Speedrun Dashboard",
      description: "Speedrun dashboard management for retail product solutions"
    };
  }

  /**
   * Get available apps for current user
   */
  static async getAvailableApps(): Promise<string[]> {
    try {
      const context = await WorkspaceDataRouter.getWorkspaceContext();
      return context.availableApps;
    } catch (error) {
      console.error("❌ PlatformAccessRouter: Error getting apps:", error);
      return ["monaco"]; // Fallback to demo apps
    }
  }

  /**
   * Check if user has access to specific app
   */
  static async hasAppAccess(appName: string): Promise<boolean> {
    try {
      const availableApps = await this.getAvailableApps();
      return availableApps.includes(appName);
    } catch (error) {
      console.error("❌ PlatformAccessRouter: Error checking app access:", error);
      return appName === "monaco"; // Fallback - everyone has Monaco access
    }
  }

  /**
   * Get app configuration for current user
   */
  static async getAppConfig() {
    const context = await WorkspaceDataRouter.getWorkspaceContext();
    await WorkspaceDataRouter.logContext("PlatformAccessRouter");

    if (context['platformAccess'] === "monaco-standalone") {
      return {
        layout: "standalone",
        apps: ["monaco"],
        navigation: "minimal",
        theme: "monaco",
        features: {
          buyerGroupIntelligence: true,
          rtpEngine: true,
          aiChat: true,
          multipleApps: false,
          appSwitcher: false,
          globalNavigation: false
        }
      };
    } else {
      return {
        layout: "aos-full",
        apps: ["monaco", "rtp", "pipeline", "oasis", "tower", "garage"],
        navigation: "full",
        theme: "aos",
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
    }
  }

  /**
   * Redirect user to appropriate interface
   */
  static async redirectToUserInterface(): Promise<string> {
    const route = await this.getDefaultRoute();
    console.log("🎯 PlatformAccessRouter: Redirecting to:", route.path);
    return route.path;
  }

  /**
   * Log current access configuration for debugging
   */
  static async logAccessConfig(source: string = "Unknown") {
    try {
      const context = await WorkspaceDataRouter.getWorkspaceContext();
      const config = await this.getAppConfig();
      
      console.log(`🎯 [${source}] Platform Access Configuration:`, {
        userEmail: context.userEmail,
        platformAccess: context.platformAccess,
        availableApps: context.availableApps,
        layout: config.layout,
        features: config.features
      });
    } catch (error) {
      console.error("❌ PlatformAccessRouter: Error logging config:", error);
    }
  }
}

export default PlatformAccessRouter; 