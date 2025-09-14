import { useEffect, useCallback } from "react";
import { EngagementTracker } from "@/platform/shared/components/ui/EngagementGrid";

// Activity types for consistent tracking
export const ACTIVITY_TYPES = {
  // Core Actions
  LOGIN: "login",
  LOGOUT: "logout",

  // Action Platform
  MARK_I_SEND: "speedrun_send",
  MARK_I_SCHEDULE: "speedrun_schedule",
  ACQUIRE_LEAD: "acquire_lead",
  EXPAND_OPPORTUNITY: "expand_opportunity",
  MONACO_SEARCH: "monaco_search",
  NOTES_CREATE: "notes_create",
  CAL_SCHEDULE: "cal_schedule",

  // AI Interactions
  AI_QUERY: "ai_query",
  AI_GENERATE: "ai_generate",
  AI_OPTIMIZE: "ai_optimize",

  // Data Actions
  DATA_IMPORT: "data_import",
  DATA_EXPORT: "data_export",
  DATA_ENRICH: "data_enrich",

  // Collaboration
  SHARE_CONTENT: "share_content",
  COMMENT_CREATE: "comment_create",
  TEAM_INVITE: "team_invite",

  // Settings & Configuration
  THEME_CHANGE: "theme_change",
  INTEGRATION_SETUP: "integration_setup",
  PROFILE_UPDATE: "profile_update",

  // Navigation
  APP_SWITCH: "app_switch",
  PAGE_VIEW: "page_view",

  // Achievements
  MILESTONE_REACHED: "milestone_reached",
  GOAL_COMPLETED: "goal_completed",

  // Browser (for Olympus)
  BROWSER_NAVIGATE: "browser_navigate",
  BROWSER_BOOKMARK: "browser_bookmark",
  BROWSER_AI_ANALYZE: "browser_ai_analyze",

  // 🚀 Chrome Extension Activities
  EXTENSION_OPEN: "extension_open",
  EXTENSION_CLOSE: "extension_close",
  EXTENSION_LINKEDIN_ANALYZE: "extension_linkedin_analyze",
  EXTENSION_AI_QUERY: "extension_ai_query",
  EXTENSION_PROFILE_VIEW: "extension_profile_view",
  EXTENSION_COMPANY_RESEARCH: "extension_company_research",
  EXTENSION_DECISION_MAKERS: "extension_decision_makers",
  EXTENSION_OUTREACH_STRATEGY: "extension_outreach_strategy",
  EXTENSION_PROFILE_DETECTED: "extension_profile_detected",
  EXTENSION_KEYBOARD_SHORTCUT: "extension_keyboard_shortcut",
  EXTENSION_QUICK_ACTION: "extension_quick_action",
  EXTENSION_AUTH_SUCCESS: "extension_auth_success",

  // 📧 Notary Everyday Activities
  NOTARY_EMAIL_OUTREACH: "notary_email_outreach",
  NOTARY_EMAIL_FOLLOWUP: "notary_email_followup",
  NOTARY_EMAIL_INITIAL: "notary_email_initial",
  NOTARY_SALES_NAVIGATOR: "notary_sales_navigator",
  NOTARY_COMPANY_RESEARCH: "notary_company_research",
} as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[keyof typeof ACTIVITY_TYPES];

export interface ActivityDetails {
  app?: string;
  feature?: string;
  value?: string | number;
  metadata?: Record<string, any>;
}

export function useEngagementTracking() {
  // Track activity with consistent format
  const trackActivity = useCallback(
    (type: ActivityType, details?: ActivityDetails) => {
      try {
        EngagementTracker.trackActivity(type, {
          ...details,
          timestamp: new Date().toISOString(),
          userAgent:
            typeof window !== "undefined"
              ? window.navigator.userAgent
              : "unknown",
          url:
            typeof window !== "undefined"
              ? window.location.pathname
              : "unknown",
        });

        // Dispatch event for real-time UI updates
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("engagement-updated", {
              detail: { type, details },
            }),
          );
        }
      } catch (error) {
        console.warn("Failed to track engagement:", error);
      }
    },
    [],
  );

  // Track page views automatically
  useEffect(() => {
    if (typeof window !== "undefined") {
      trackActivity(ACTIVITY_TYPES.PAGE_VIEW, {
        app: window.location.pathname.split("/")[1] || "home",
        feature: "page_view",
      });
    }
  }, [trackActivity]);

  // Convenience methods for common activities
  const trackLogin = useCallback(() => {
    trackActivity(ACTIVITY_TYPES.LOGIN, { feature: "authentication" });
  }, [trackActivity]);

  const trackLogout = useCallback(() => {
    trackActivity(ACTIVITY_TYPES.LOGOUT, { feature: "authentication" });
  }, [trackActivity]);

  const trackAppSwitch = useCallback(
    (fromApp: string, toApp: string) => {
      trackActivity(ACTIVITY_TYPES.APP_SWITCH, {
        feature: "navigation",
        metadata: { fromApp, toApp },
      });
    },
    [trackActivity],
  );

  const trackAIInteraction = useCallback(
    (type: "query" | "generate" | "optimize", details?: ActivityDetails) => {
      const activityType =
        type === "query"
          ? ACTIVITY_TYPES.AI_QUERY
          : type === "generate"
            ? ACTIVITY_TYPES.AI_GENERATE
            : ACTIVITY_TYPES.AI_OPTIMIZE;

      trackActivity(activityType, {
        ...details,
        feature: "ai_interaction",
      });
    },
    [trackActivity],
  );

  const trackMilestone = useCallback(
    (milestone: string, value?: number) => {
      const details: ActivityDetails = {
        feature: "achievement",
        metadata: { milestone },
      };

      if (value !== undefined) {
        details['value'] = value;
      }

      trackActivity(ACTIVITY_TYPES.MILESTONE_REACHED, details);
    },
    [trackActivity],
  );

  return {
    trackActivity,
    trackLogin,
    trackLogout,
    trackAppSwitch,
    trackAIInteraction,
    trackMilestone,
    ACTIVITY_TYPES,
  };
}
