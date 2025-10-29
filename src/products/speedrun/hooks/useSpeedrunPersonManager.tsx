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
  getDailySpeedrunState,
} from "../state";
import { useSpeedrunContext } from "@/products/speedrun/context/SpeedrunProvider";
import { useUnifiedAuth } from "@/platform/auth";

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
    // Bonus round state
    bonusRoundActive,
    bonusRoundCompleted,
    bonusRoundTotal,
    bonusRoundDeclined,
    setBonusRoundActive,
    setBonusRoundCompleted,
    setBonusRoundDeclined,
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
        setReadyPeople((prev) => {
          const filtered = prev.filter((p) => p.id !== personId);
          
          // Auto-select next person using the filtered array
          const nextPerson = filtered.length > 0 ? filtered[0] : null;
          setSelectedPerson(nextPerson);
          
          return filtered;
        });
        setCompletedPeople((prev) => [...prev, person]);

        // Track bonus round completion if active
        if (bonusRoundActive) {
          setBonusRoundCompleted(prev => {
            const newCount = prev + 1;
            console.log(`🎯 Bonus round progress: ${newCount}/${bonusRoundTotal}`);
            return newCount;
          });
        }

        console.log(`✅ Person ${person.name} marked as completed`);
        console.log(`📋 Remaining ready people: ${readyPeople.length - 1}`);

        // Update progress
        await updateProgress();

        // Persist completion to localStorage for session recovery
        const today = new Date().toDateString();
        const currentCompleted = [...completedPeople, person];
        localStorage.setItem(
          `speedrun-completed-${today}`,
          JSON.stringify(currentCompleted),
        );

        // Check if we've completed 50 records and show bonus popup
        const newCompletedCount = completedPeople.length + 1;
        if (newCompletedCount === 50 && !bonusRoundActive && !bonusRoundDeclined) {
          console.log(`🎯 Completed 50 records! Showing bonus round popup...`);
          // This will be handled by the parent component that uses this hook
          // The popup will be triggered by checking completedPeople.length === 50
        }
        
        // Check if we've completed 50 records and trigger auto-fetch (legacy logic)
        if (newCompletedCount >= 50) {
          console.log(`🎯 Completed 50 records! Triggering auto-fetch of next batch...`);
          
          try {
            // Get workspace and user context for API call
            const { user } = useUnifiedAuth();
            const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
            const userId = user?.id;

            // Trigger re-ranking and fetch next batch
            const response = await fetch('/api/v1/speedrun/re-rank', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-workspace-id': workspaceId || '',
                'x-user-id': userId || '',
              },
              body: JSON.stringify({
                completedCount: newCompletedCount,
                triggerAutoFetch: true
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log(`✅ Successfully fetched next batch of 50 records`);
              
              // Dispatch event to show congratulations modal
              window.dispatchEvent(new CustomEvent('speedrun-batch-complete', {
                detail: {
                  batchNumber: result.data?.batchNumber || 1,
                  completedCount: newCompletedCount,
                  message: result.data?.message || `Amazing work! You've finished your first batch and we're fetching your next 50 records to keep the momentum going.`
                }
              }));
              
              // Reload the speedrun data to get the new batch after a short delay
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            } else {
              console.error(`❌ Failed to fetch next batch: ${response.status}`);
            }
          } catch (error) {
            console.error(`❌ Error fetching next batch:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to complete person ${personId}:`, error);

        // Fallback: still update local state even if ranking system fails
        const person = readyPeople.find((p) => p['id'] === personId);
        if (person) {
          setReadyPeople((prev) => {
            const filtered = prev.filter((p) => p.id !== personId);
            const nextPerson = filtered.length > 0 ? filtered[0] : null;
            setSelectedPerson(nextPerson);
            return filtered;
          });
          setCompletedPeople((prev) => [...prev, person]);
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
        setReadyPeople((prev) => {
          const filtered = prev.filter((p) => p.id !== personId);
          
          // Auto-select next person using the filtered array
          const nextPerson = filtered.length > 0 ? filtered[0] : null;
          setSelectedPerson(nextPerson);
          
          return filtered;
        });
        setSkippedPeople((prev) => [...prev, person]);

        console.log(`⏭️ Person ${person.name} skipped`);
        console.log(`📋 Remaining ready people: ${readyPeople.length - 1}`);

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

  // Load bonus people (ranks 51-60)
  const loadBonusPeople = useCallback(async () => {
    try {
      console.log("🎯 Loading bonus people (ranks 51-60)...");
      
      const { user } = useUnifiedAuth();
      const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
      const userId = user?.id;

      if (!workspaceId || !userId) {
        console.error("❌ Missing workspace or user context for bonus people");
        return;
      }

      // Fetch bonus people from speedrun API with offset
      const response = await fetch(`/api/v1/speedrun?offset=50&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bonus people: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const bonusPeople = data.data.map((person: any) => ({
          ...person,
          id: person.id,
          name: person.name,
          title: person.title,
          company: person.company,
          email: person.email,
          phone: person.phone,
          mobilePhone: person.mobilePhone,
          linkedin: person.linkedin,
          photo: person.photo,
          priority: person.priority,
          status: person.status,
          lastContact: person.lastAction || 'Never',
          nextAction: person.nextAction || 'No action set',
          relationship: person.relationship || 'Unknown',
          bio: person.bio || '',
          interests: person.interests || [],
          recentActivity: person.recentActivity || '',
          commission: person.commission || '',
          globalRank: person.globalRank,
          notes: person.notes || '',
          customFields: person.customFields || {},
        }));

        // Add bonus people to ready list
        setReadyPeople(prev => [...prev, ...bonusPeople]);
        setBonusRoundActive(true);
        setBonusRoundCompleted(0);
        
        console.log(`✅ Loaded ${bonusPeople.length} bonus people`);
      }
    } catch (error) {
      console.error("❌ Failed to load bonus people:", error);
    }
  }, [setReadyPeople, setBonusRoundActive, setBonusRoundCompleted]);

  // Handle bonus round completion
  const handleBonusRoundComplete = useCallback((personId: number) => {
    console.log(`🎯 Bonus round completion: ${personId}`);
    
    // Update bonus round completed count
    setBonusRoundCompleted(prev => {
      const newCount = prev + 1;
      
      // Check if bonus round is complete
      if (newCount >= bonusRoundTotal) {
        console.log(`🎉 Bonus round complete! ${newCount}/${bonusRoundTotal}`);
        // Could show another celebration or just mark as complete
      }
      
      return newCount;
    });
  }, [bonusRoundTotal, setBonusRoundCompleted]);

  // Handle declining bonus round
  const handleDeclineBonus = useCallback(() => {
    console.log("🚫 User declined bonus round");
    setBonusRoundDeclined(true);
    
    // Persist to daily state
    const today = new Date().toDateString();
    const dailyState = getDailySpeedrunState();
    dailyState.bonusRoundDeclined = true;
    localStorage.setItem(`speedrun-state-${today}`, JSON.stringify(dailyState));
  }, [setBonusRoundDeclined]);

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
    // Bonus round functions
    loadBonusPeople,
    handleBonusRoundComplete,
    handleDeclineBonus,
  };
}
