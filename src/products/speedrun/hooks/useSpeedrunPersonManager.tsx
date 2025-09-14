"use client";

import { useCallback } from "react";
import {
  markLeadAsCompleted,
  markLeadAsSkipped,
} from "../lead-management";
import {
  getDailyProgress,
  getWeeklyProgress,
  hasDailyTargetBeenMet,
} from "../state";
import { useSpeedrunContext } from "@/products/speedrun/context/SpeedrunProvider";

// SpeedrunWinsService - TODO: Implement real tracking service
const SpeedrunWinsService = {
  trackDailyTarget: async (...args: any[]) => {
    console.log("📊 Tracking daily target achievement", ...args);
  },
  trackWeeklyTarget: async (...args: any[]) => {
    console.log("📊 Tracking weekly target achievement", ...args);
  },
  trackAddMore: async (...args: any[]) => {
    console.log("📊 Tracking add more leads", ...args);
  },
  trackMilestone: async (...args: any[]) => {
    console.log("📊 Tracking milestone achievement", ...args);
  },
};

export function useSpeedrunPersonManager() {
  const {
    readyPeople,
    completedPeople,
    skippedPeople,
    selectedPerson,
    userSettings,
    setReadyPeople,
    setCompletedPeople,
    setSkippedPeople,
    setSelectedPerson,
    setDailyProgress,
    setWeeklyProgress,
  } = useSpeedrunContext();

  // Update progress function
  const updateProgress = useCallback(async () => {
    try {
      console.log("📊 Updating progress after person action...");

      // Get fresh progress data
      const freshDailyProgress = getDailyProgress();
      const freshWeeklyProgress = getWeeklyProgress();

      console.log("📊 Fresh progress data:", {
        daily: freshDailyProgress,
        weekly: freshWeeklyProgress,
      });

      // Update state with fresh data
      setDailyProgress(freshDailyProgress);
      setWeeklyProgress(freshWeeklyProgress);

      // Check for target achievements and trigger celebrations
      if (freshDailyProgress.isComplete) {
        console.log("🎉 DAILY TARGET ACHIEVED!");

        // Track achievement
        try {
          await SpeedrunWinsService.trackDailyTarget({
            target: freshDailyProgress.target,
            completed: freshDailyProgress.completed,
            percentage: freshDailyProgress.percentage,
          });
        } catch (error) {
          console.warn("⚠️ Failed to track daily target achievement:", error);
        }

        // Store achievement for persistence
        localStorage.setItem("speedrun-previous-target-met", "true");
        localStorage.setItem(
          "speedrun-daily-achievement-date",
          new Date().toDateString(),
        );
      }

      if (freshWeeklyProgress.isComplete) {
        console.log("🎉 WEEKLY TARGET ACHIEVED!");

        // Track achievement
        try {
          await SpeedrunWinsService.trackWeeklyTarget({
            target: freshWeeklyProgress.target,
            completed: freshWeeklyProgress.completed,
            percentage: freshWeeklyProgress.percentage,
          });
        } catch (error) {
          console.warn("⚠️ Failed to track weekly target achievement:", error);
        }
      }
    } catch (error) {
      console.error("❌ Failed to update progress:", error);
    }
  }, [setDailyProgress, setWeeklyProgress]);

  // Handle person completion
  const handlePersonComplete = useCallback(
    async (personId: number) => {
      console.log(`✅ Completing person: ${personId}`);

      try {
        // Find the person in ready list
        const person = readyPeople.find((p) => p['id'] === personId);
        if (!person) {
          console.warn(`⚠️ Person with ID ${personId} not found in ready list`);
          return;
        }

        // Mark as completed in the ranking system
        markLeadAsCompleted(personId.toString());

        // Update local state - move from ready to completed
        setReadyPeople((prev) => prev.filter((p) => p.id !== personId));
        setCompletedPeople((prev) => [...prev, person]);

        // Auto-select next person
        const remainingPeople = readyPeople.filter((p) => p.id !== personId);
        const nextPerson =
          remainingPeople.length > 0 ? remainingPeople[0] : null;
        setSelectedPerson(nextPerson || null);

        console.log(`✅ Person ${person.name} marked as completed`);
        console.log(`📋 Remaining ready people: ${remainingPeople.length}`);

        // Update progress
        await updateProgress();

        // Persist completion to localStorage for session recovery
        const today = new Date().toDateString();
        const currentCompleted = [...completedPeople, person];
        localStorage.setItem(
          `speedrun-completed-${today}`,
          JSON.stringify(currentCompleted),
        );
      } catch (error) {
        console.error(`❌ Failed to complete person ${personId}:`, error);

        // Fallback: still update local state even if ranking system fails
        const person = readyPeople.find((p) => p['id'] === personId);
        if (person) {
          setReadyPeople((prev) => prev.filter((p) => p.id !== personId));
          setCompletedPeople((prev) => [...prev, person]);

          const remainingPeople = readyPeople.filter((p) => p.id !== personId);
          setSelectedPerson(
            remainingPeople.length > 0 ? remainingPeople[0] || null : null,
          );
        }
      }
    },
    [
      readyPeople,
      completedPeople,
      setReadyPeople,
      setCompletedPeople,
      setSelectedPerson,
      updateProgress,
    ],
  );

  // Handle person skip
  const handlePersonSkip = useCallback(
    (personId: number) => {
      console.log(`⏭️ Skipping person: ${personId}`);

      try {
        // Find the person in ready list
        const person = readyPeople.find((p) => p['id'] === personId);
        if (!person) {
          console.warn(`⚠️ Person with ID ${personId} not found in ready list`);
          return;
        }

        // Mark as skipped in the ranking system
        try {
          markLeadAsSkipped(personId.toString());
        } catch (error) {
          console.warn(
            `⚠️ Failed to mark person ${personId} as skipped in ranking system:`,
            error,
          );
        }

        // Update local state immediately - move from ready to skipped
        setReadyPeople((prev) => prev.filter((p) => p.id !== personId));
        setSkippedPeople((prev) => [...prev, person]);

        // Auto-select next person
        const remainingPeople = readyPeople.filter((p) => p.id !== personId);
        const nextPerson =
          remainingPeople.length > 0 ? remainingPeople[0] : null;
        setSelectedPerson(nextPerson || null);

        console.log(`⏭️ Person ${person.name} skipped`);
        console.log(`📋 Remaining ready people: ${remainingPeople.length}`);

        // Persist skip to localStorage for session recovery
        const today = new Date().toDateString();
        const currentSkipped = [...skippedPeople, person];
        localStorage.setItem(
          `speedrun-skipped-${today}`,
          JSON.stringify(currentSkipped),
        );
      } catch (error) {
        console.error(`❌ Failed to skip person ${personId}:`, error);
      }
    },
    [
      readyPeople,
      skippedPeople,
      setReadyPeople,
      setSkippedPeople,
      setSelectedPerson,
    ],
  );

  // Handle adding more leads
  const handleAddMore = useCallback(async () => {
    console.log("🔄 Adding more leads to speedrun...");

    try {
      // Track the add more action
      await SpeedrunWinsService.trackAddMore({
        currentReady: readyPeople.length,
        currentCompleted: completedPeople.length,
        timestamp: new Date().toISOString(),
      });

      // For now, this would trigger a reload of data
      // In a real implementation, this would fetch additional leads
      console.log("📈 Add more leads functionality would be implemented here");

      // Could trigger data reload
      window.location.reload();
    } catch (error) {
      console.error("❌ Failed to add more leads:", error);
    }
  }, [readyPeople.length, completedPeople.length]);

  // Handle starting speedrun (if needed)
  const handleStartSpeedrun = useCallback(() => {
    console.log("🚀 Starting speedrun...");
    // Since speedrun is always started in our new design, this is mainly for legacy support
  }, []);

  return {
    handlePersonComplete,
    handlePersonSkip,
    handleAddMore,
    handleStartSpeedrun,
    updateProgress,
  };
}
