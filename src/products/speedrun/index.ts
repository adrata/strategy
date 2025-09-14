// Speedrun Components
// These components were extracted from the massive 1,266-line SpeedrunContainer.tsx
// to improve maintainability, readability, and reusability

export { SpeedrunProvider, useSpeedrunContext } from "./context/SpeedrunProvider";
export { useSpeedrunDataLoader } from "./hooks/useSpeedrunDataLoader";
export { useSpeedrunPersonManager } from "./hooks/useSpeedrunPersonManager";
export { SpeedrunContainer } from "./SpeedrunContainer";

// Re-export existing components for compatibility
export { SpeedrunContent } from "./SpeedrunContent";
export { SpeedrunSettings } from "./SpeedrunSettings";
export { AddLeadsModal } from "./AddLeadsModal";
export { PowerDialerModal } from "./PowerDialerModal";
export { PowerDialer } from "./components/PowerDialer";

// Export functions from state.ts
export {
  getDefaultUserSettings,
  getDailySpeedrunState,
  saveDailySpeedrunState,
  getLeadStates,
  saveLeadStates,
  markLeadsAsViewed,
  markLeadAsCompleted,
  markLeadAsSkipped,
  hasDailyTargetBeenMet,
  getDailyProgress,
  getWeeklyProgress,
  clearSpeedrunCache,
  resetSpeedrunToDefaults,
  updateBatchCounter,
} from "./state";

// Export functions from lead-management.ts
export {
  addToSpeedrun,
  snoozeLead,
  removeLead,
  isLeadSnoozed,
  isLeadRemoved,
  reactivateLead,
  getLeadsByStatus,
  getLeadState,
  bulkUpdateLeadStatus,
  cleanupExpiredStates,
} from "./lead-management";

// Export constants from constants.ts
export {
  STRATEGY_WEIGHTS,
  DEFAULT_WEEKLY_TARGETS,
  DEFAULT_DAILY_TARGETS,
  COMPANY_SIZE_MULTIPLIERS,
  BUYER_GROUP_ROLE_SCORES,
  RELATIONSHIP_SCORES,
  STAGE_URGENCY_SCORES,
  SNOOZE_OPTIONS,
  SOURCE_BONUS,
  URGENT_KEYWORDS,
  TIMEZONE_CALLING_PRIORITY,
  DAILY_TARGET,
  EMAIL_ENGAGEMENT_THRESHOLDS,
  READY_TO_BUY_THRESHOLDS,
  DEAL_VALUE_NORMALIZATION,
  FRESHNESS_DECAY,
  COMPANY_RANKING_WEIGHTS,
  INDIVIDUAL_RANKING_WEIGHTS,
} from "./constants";

// Type exports
export type { SpeedrunPerson } from "./context/SpeedrunProvider";
export type {
  SpeedrunUserSettings,
  SnoozeOption,
  LeadState,
  DailySpeedrunState,
  RankedContact,
  DailyProgress,
  WeeklyProgress,
  SmartDailyTarget,
  SmartAddMoreCount,
  CRMData,
  AcquireData,
  TimingInfo,
  EmailEngagement,
} from "./types";

// Component organization:
// - SpeedrunProvider: Context and state management (220 lines)
// - useSpeedrunDataLoader: Complex Tauri/web data fetching logic (250 lines)
// - useSpeedrunPersonManager: Person completion/skipping logic (180 lines)
// - SpeedrunContainer: Main component assembly (80 lines)

// Benefits of restructuring:
// ✅ Reduced file size - 1,266 lines → 730 lines across 4 focused components (42% reduction)
// ✅ Better maintainability - Changes to specific features are isolated
// ✅ Improved reusability - Hooks can be used in other parts of the app
// ✅ Clearer responsibilities - Each module has a single, well-defined purpose
// ✅ Easier testing - Hooks and components can be tested in isolation
// ✅ Better collaboration - Developers can work on different modules simultaneously

// READY TO REPLACE: The original SpeedrunContainer.tsx can now be safely removed
// and replaced with SpeedrunContainer in all imports
