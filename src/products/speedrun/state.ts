// Speedrun State Management - Extracted from 1,958-line monolithic SpeedrunRanking.ts

import type {
  RankedContact,
  SpeedrunUserSettings,
  DailySpeedrunState,
  LeadState,
  DailyProgress,
  WeeklyProgress,
  SmartDailyTarget,
  SmartAddMoreCount,
} from "./types";
import { DEFAULT_WEEKLY_TARGETS, DEFAULT_DAILY_TARGETS } from "./constants";

/**
 * Get default user settings based on role
 */
export function getDefaultUserSettings(
  role: string = "other",
): SpeedrunUserSettings {
  return {
    weeklyTarget:
      DEFAULT_WEEKLY_TARGETS[role as keyof typeof DEFAULT_WEEKLY_TARGETS] || 20,
    dailyTarget:
      DEFAULT_DAILY_TARGETS[role as keyof typeof DEFAULT_DAILY_TARGETS] || 4,
    strategy: "optimal",
    role: role as SpeedrunUserSettings["role"],
    quota: 1000000, // Default yearly quota
    pipelineHealth: "healthy",
  };
}

/**
 * Get or create daily mark I state from localStorage
 */
export function getDailySpeedrunState(): DailySpeedrunState {
  const today = new Date().toDateString();
  
  // Check if we're on the client-side
  if (typeof window === 'undefined') {
    // Return default state for server-side rendering
    return {
      date: today,
      viewedLeads: [],
      completedLeads: [],
      skippedLeads: [],
      snoozedLeads: [],
      removedLeads: [],
      totalLeadsGenerated: 0,
      currentBatch: 1,
      dailyTargetMet: false,
      weeklyTargetMet: false,
    };
  }
  
  const stored = localStorage.getItem(`speedrun-state-${today}`);

  if (stored) {
    const state = JSON.parse(stored);
    // Ensure it's for today
    if (state['date'] === today) {
      return state;
    }
  }

  // Create fresh state for today
  const newState: DailySpeedrunState = {
    date: today,
    viewedLeads: [],
    completedLeads: [],
    skippedLeads: [], // Deprecated but kept for backwards compatibility
    snoozedLeads: [],
    removedLeads: [],
    totalLeadsGenerated: 0,
    currentBatch: 1,
    dailyTargetMet: false,
    weeklyTargetMet: false,
  };

  saveDailySpeedrunState(newState);
  return newState;
}

/**
 * Save daily mark I state to localStorage
 */
export function saveDailySpeedrunState(state: DailySpeedrunState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`speedrun-state-${state.date}`, JSON.stringify(state));
  }
}

/**
 * Get lead states from localStorage
 */
export function getLeadStates(): Record<string, LeadState> {
  if (typeof window === 'undefined') {
    return {};
  }
  const stored = localStorage.getItem("speedrun-lead-states");
  return stored ? JSON.parse(stored) : {};
}

/**
 * Save lead states to localStorage
 */
export function saveLeadStates(states: Record<string, LeadState>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem("speedrun-lead-states", JSON.stringify(states));
  }
}

/**
 * Mark leads as viewed for today
 */
export function markLeadsAsViewed(leadIds: string[]): void {
  const state = getDailySpeedrunState();

  // Add new lead IDs that haven't been viewed yet
  const newViewedIds = leadIds.filter((id) => !state.viewedLeads.includes(id));
  state.viewedLeads.push(...newViewedIds);

  saveDailySpeedrunState(state);
  console.log(
    `📋 Marked ${newViewedIds.length} new leads as viewed today. Total viewed: ${state.viewedLeads.length}`,
  );
}

/**
 * Mark lead as completed for today
 */
export function markLeadAsCompleted(leadId: string): void {
  const state = getDailySpeedrunState();

  if (!state.completedLeads.includes(leadId)) {
    state.completedLeads.push(leadId);

    // Get current user settings for target checking
    const userSettings = getDefaultUserSettings();
    const completedCount = state.completedLeads.length;
    
    // Check if daily target is met
    state['dailyTargetMet'] = completedCount >= userSettings.dailyTarget;

    saveDailySpeedrunState(state);
    console.log(
      `✅ Lead ${leadId} completed. Daily progress: ${completedCount}/${userSettings.dailyTarget}`,
    );

    // Trigger auto-progression check if daily target is met
    if (state.dailyTargetMet) {
      console.log(`🎯 Daily target of ${userSettings.dailyTarget} achieved! Checking auto-progression...`);
      
      // Import and use the settings service
      if (typeof window !== 'undefined') {
        // Dynamic import to avoid circular dependencies
        import('@/platform/services/speedrun-engine-settings-service').then(({ SpeedrunEngineSettingsService }) => {
          SpeedrunEngineSettingsService.checkDailyTargetAndTriggerNextBatch();
        }).catch(error => {
          console.warn('Could not load settings service for auto-progression:', error);
        });
      }
    }
  }
}

/**
 * Mark lead as skipped for today
 */
export function markLeadAsSkipped(leadId: string): void {
  const state = getDailySpeedrunState();

  if (!state.skippedLeads.includes(leadId)) {
    state.skippedLeads.push(leadId);
    saveDailySpeedrunState(state);
    console.log(`⏭️ Lead ${leadId} skipped.`);
  }
}

/**
 * Check if user has met daily target
 */
export function hasDailyTargetBeenMet(): boolean {
  const state = getDailySpeedrunState();
  const settings = getDefaultUserSettings();
  return state.completedLeads.length >= settings.dailyTarget;
}

/**
 * Get daily progress stats
 */
export function getDailyProgress(): DailyProgress {
  const state = getDailySpeedrunState();
  const settings = getDefaultUserSettings();

  return {
    completed: state.completedLeads.length,
    target: settings.dailyTarget,
    percentage: Math.min(
      (state.completedLeads.length / settings.dailyTarget) * 100,
      100,
    ),
    isComplete: state.completedLeads.length >= settings.dailyTarget,
  };
}

/**
 * Calculate weekly progress from all days this week
 */
export function getWeeklyProgress(): WeeklyProgress {
  const settings = getDefaultUserSettings();
  let totalCompleted = 0;

  // Check if we're on the client-side
  if (typeof window !== 'undefined') {
    // Get all days from this week (Monday to Friday)
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() - 1));

    for (let i = 0; i < 5; i++) {
      // Monday to Friday
      const checkDate = new Date(monday);
      checkDate.setDate(monday.getDate() + i);
      const dateString = checkDate.toDateString();

      const stored = localStorage.getItem(`speedrun-state-${dateString}`);
      if (stored) {
        const state = JSON.parse(stored) as DailySpeedrunState;
        totalCompleted += state.completedLeads.length;
      }
    }
  }

  return {
    completed: totalCompleted,
    target: settings.weeklyTarget,
    percentage: Math.min((totalCompleted / settings.weeklyTarget) * 100, 100),
    isComplete: totalCompleted >= settings.weeklyTarget,
  };
}

/**
 * Clear all speedrun cache and state
 */
export function clearSpeedrunCache(): void {
  console.log("🧹 Clearing speedrun cache...");

  if (typeof window !== 'undefined') {
    // Clear all localStorage items related to speedrun
    const keysToRemove = Object.keys(localStorage).filter(
      (key) =>
        key.startsWith("speedrun-") ||
        key.startsWith("speedrun_") ||
        key.includes("Speedrun"),
    );

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed cache key: ${key}`);
    });

    console.log(`✅ Cleared ${keysToRemove.length} speedrun cache entries`);
  } else {
    console.log("⚠️ Cannot clear cache on server-side");
  }
}

/**
 * Reset speedrun to defaults for a specific role
 */
export function resetSpeedrunToDefaults(role: string = "AE"): void {
  console.log(`🔄 Resetting speedrun to defaults for role: ${role}`);

  // Clear existing data
  clearSpeedrunCache();

  // Create fresh daily state
  const defaultSettings = getDefaultUserSettings(role);
  const freshState = getDailySpeedrunState();

  console.log(
    `✅ Speedrun reset complete for ${role}: Daily target = ${defaultSettings.dailyTarget}, Weekly target = ${defaultSettings.weeklyTarget}`,
  );
}

/**
 * Update batch counter and total leads generated
 */
export function updateBatchCounter(additionalLeads: number): void {
  const state = getDailySpeedrunState();
  state.currentBatch += 1;
  state.totalLeadsGenerated += additionalLeads;
  saveDailySpeedrunState(state);

  console.log(
    `🚀 Updated batch counter: Batch #${state.currentBatch}, Total leads today: ${state.totalLeadsGenerated}`,
  );
}
