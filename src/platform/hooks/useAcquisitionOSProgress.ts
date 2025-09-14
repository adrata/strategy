import { useState, useEffect, useCallback } from "react";

interface UseAcquisitionOSProgressReturn {
  // Progress State
  completedLeads: Set<string>;
  viewedRecords: { [section: string]: Set<string> };

  // Actions
  markLeadAsCompleted: (leadId: string) => void;
  unmarkLeadAsCompleted: (leadId: string) => void;
  getProgressiveIndex: (
    recordId: string,
    section: string,
    allRecords: any[],
  ) => number;
  getProgressStats: (
    section: string,
    allRecords: any[],
  ) => {
    viewed: number;
    total: number;
    remaining: number;
  };
  resetDailyProgress: () => void;
}

/**
 * 📈 ACQUISITION OS PROGRESS HOOK
 * Handles all progress tracking for AcquisitionOS
 */
export function useAcquisitionOSProgress(): UseAcquisitionOSProgressReturn {
  const isClient = typeof window !== "undefined";

  // Debug helper
  const debug = (phase: string, details: any) => {
    console.log(`📈 [PROGRESS HOOK] ${phase}:`, details);
  };

  // Progress State
  const [completedLeads, setCompletedLeads] = useState<Set<string>>(new Set());
  const [viewedRecords, setViewedRecords] = useState<{
    [section: string]: Set<string>;
  }>({});

  // Load viewed records from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    debug("LOADING_PROGRESS_STATE", {});

    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(`viewed-records-${today}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert arrays back to Sets
        const result: { [section: string]: Set<string> } = {};
        for (const [section, recordIds] of Object.entries(parsed)) {
          result[section] = new Set(recordIds as string[]);
        }
        setViewedRecords(result);
        debug("RESTORED_VIEWED_RECORDS", {
          sections: Object.keys(result),
          totalViewed: Object.values(result).reduce(
            (sum, set) => sum + set.size,
            0,
          ),
        });
      }
    } catch (error) {
      debug("ERROR_LOADING_PROGRESS", { error });
    }
  }, [isClient]);

  // Auto-cleanup old viewed records (keep only last 7 days)
  useEffect(() => {
    if (!isClient) return;

    try {
      const today = new Date();
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("viewed-records-"),
      );

      let cleanedCount = 0;
      keys.forEach((key) => {
        const dateStr = key.replace("viewed-records-", "");
        const recordDate = new Date(dateStr);
        const daysDiff =
          (today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff > 7) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        debug("CLEANED_OLD_RECORDS", { removedDays: cleanedCount });
      }
    } catch (error) {
      debug("ERROR_CLEANING_OLD_RECORDS", { error });
    }
  }, [isClient]);

  // Mark lead as completed
  const markLeadAsCompleted = useCallback((leadId: string) => {
    debug("MARK_LEAD_COMPLETED", { leadId });

    setCompletedLeads((prev) => {
      const newSet = new Set([...prev, leadId]);
      debug("LEAD_COMPLETION_UPDATED", {
        leadId,
        totalCompleted: newSet.size,
      });
      return newSet;
    });
  }, []);

  // Unmark lead as completed (for undo)
  const unmarkLeadAsCompleted = useCallback((leadId: string) => {
    debug("UNMARK_LEAD_COMPLETED", { leadId });

    setCompletedLeads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(leadId);
      debug("LEAD_COMPLETION_REMOVED", {
        leadId,
        totalCompleted: newSet.size,
      });
      return newSet;
    });
  }, []);

  // Get progressive index for a record
  const getProgressiveIndex = useCallback(
    (recordId: string, section: string, allRecords: any[]) => {
      const sectionViewed = viewedRecords[section] || new Set();
      const viewedArray = Array.from(sectionViewed);

      debug("GET_PROGRESSIVE_INDEX", {
        recordId,
        section,
        currentlyViewed: sectionViewed.size,
        totalRecords: allRecords.length,
      });

      // If this record hasn't been viewed, add it to viewed list
      if (!sectionViewed.has(recordId)) {
        const newViewed = new Set(sectionViewed);
        newViewed.add(recordId);

        setViewedRecords((prev) => {
          const updated = { ...prev, [section]: newViewed };

          // Persist to localStorage with daily key
          if (isClient) {
            try {
              const today = new Date().toDateString();
              const toStore: { [section: string]: string[] } = {};
              for (const [sec, ids] of Object.entries(updated)) {
                toStore[sec] = Array.from(ids);
              }
              localStorage.setItem(
                `viewed-records-${today}`,
                JSON.stringify(toStore),
              );

              debug("PERSISTED_VIEWED_RECORDS", {
                section,
                viewedCount: newViewed.size,
                totalSections: Object.keys(updated).length,
              });
            } catch (error) {
              debug("ERROR_PERSISTING_VIEWED_RECORDS", { error });
            }
          }

          return updated;
        });

        const newIndex = viewedArray.length + 1;
        debug("ASSIGNED_PROGRESSIVE_INDEX", { recordId, index: newIndex });
        return newIndex;
      }

      // Return existing position in viewed sequence
      const existingIndex = viewedArray.indexOf(recordId) + 1;
      debug("EXISTING_PROGRESSIVE_INDEX", { recordId, index: existingIndex });
      return existingIndex;
    },
    [viewedRecords, isClient],
  );

  // Get total progress stats
  const getProgressStats = useCallback(
    (section: string, allRecords: any[]) => {
      const sectionViewed = viewedRecords[section] || new Set();
      const stats = {
        viewed: sectionViewed.size,
        total: allRecords.length,
        remaining: allRecords.length - sectionViewed.size,
      };

      debug("GET_PROGRESS_STATS", { section, stats });
      return stats;
    },
    [viewedRecords],
  );

  // Reset daily progress (can be called manually or automatically)
  const resetDailyProgress = useCallback(() => {
    debug("RESET_DAILY_PROGRESS", {});

    setViewedRecords({});
    setCompletedLeads(new Set());

    if (isClient) {
      try {
        const today = new Date().toDateString();
        localStorage.removeItem(`viewed-records-${today}`);
        debug("CLEARED_DAILY_STORAGE", { date: today });
      } catch (error) {
        debug("ERROR_CLEARING_DAILY_STORAGE", { error });
      }
    }
  }, [isClient]);

  return {
    // State
    completedLeads,
    viewedRecords,

    // Actions
    markLeadAsCompleted,
    unmarkLeadAsCompleted,
    getProgressiveIndex,
    getProgressStats,
    resetDailyProgress,
  };
}

// Legacy alias for backwards compatibility
export const useActionPlatformProgress = useAcquisitionOSProgress;
