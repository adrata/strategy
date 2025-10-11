"use client";

import React, { useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import {
  getDefaultUserSettings,
  getDailySpeedrunState,
  type SpeedrunUserSettings,
} from "../state";
import {
  getDailyProgress,
  getWeeklyProgress,
} from "../state";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useRecordContext } from "@/platform/ui/context/RecordContextProvider";

export interface SpeedrunPerson {
  id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  mobilePhone?: string;
  linkedin?: string;
  photo: string | null;
  priority: string;
  status: string;
  lastContact: string;
  nextAction: string;
  relationship: string;
  bio: string;
  interests: string[];
  recentActivity: string;
  commission: string;
  stableIndex?: number | undefined;
  customFields?: {
    monacoEnrichment?: {
      [key: string]: any;
    };
    [key: string]: any;
  };
  // 🏆 Dano's Winning Score (optional - only present after ranking)
  winningScore?: {
    totalScore: number;
    rank: string; // 1, 2, 3, 4, 5, etc. (simple 1-30 numbering)
    confidence: number;
    winFactors: string[];
    urgencyLevel: "Critical" | "High" | "Medium" | "Low";
    bestContactTime: string;
    dealPotential: number;
  };
}

interface SpeedrunContextType {
  isSpeedrunStarted: boolean;
  readyPeople: SpeedrunPerson[];
  completedPeople: SpeedrunPerson[];
  skippedPeople: SpeedrunPerson[];
  selectedPerson: SpeedrunPerson | null;
  readyCount: number;
  doneCount: number;
  powerHourMode: boolean;
  userSettings: SpeedrunUserSettings;
  dailyProgress: {
    completed: number;
    target: number;
    percentage: number;
    isComplete: boolean;
  };
  weeklyProgress: {
    completed: number;
    target: number;
    percentage: number;
    isComplete: boolean;
  };
  isDataLoaded: boolean;
  selectedFolder: string;
  setSelectedPerson: (person: SpeedrunPerson | null) => void;
  setPowerHourMode: (mode: boolean) => void;
  setSelectedFolder: (folder: string) => void;
  setReadyPeople: React.Dispatch<React.SetStateAction<SpeedrunPerson[]>>;
  setCompletedPeople: React.Dispatch<React.SetStateAction<SpeedrunPerson[]>>;
  setSkippedPeople: React.Dispatch<React.SetStateAction<SpeedrunPerson[]>>;
  setIsDataLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setDailyProgress: React.Dispatch<
    React.SetStateAction<{
      completed: number;
      target: number;
      percentage: number;
      isComplete: boolean;
    }>
  >;
  setWeeklyProgress: React.Dispatch<
    React.SetStateAction<{
      completed: number;
      target: number;
      percentage: number;
      isComplete: boolean;
    }>
  >;
  updateUserSettings: (settings: Partial<SpeedrunUserSettings>) => Promise<void>;
}

const SpeedrunContext = createContext<SpeedrunContextType | undefined>(undefined);

export function useSpeedrunContext() {
  const context = useContext(SpeedrunContext);
  if (context === undefined) {
    throw new Error("useSpeedrunContext must be used within an SpeedrunProvider");
  }
  return context;
}

interface SpeedrunProviderProps {
  children: React.ReactNode;
}

export function SpeedrunProvider({ children }: SpeedrunProviderProps) {
  console.log("🚀 SpeedrunProvider: Starting initialization...");

  const pathname = usePathname();
  const { setCurrentRecord, clearCurrentRecord } = useRecordContext();

  // Get authenticated user and action platform data with error handling
  let user: any = null;
  let acquireData: any = null;

  try {
    const authResult = useUnifiedAuth();
    user = authResult.user;
    console.log("✅ SpeedrunProvider: useUnifiedAuth successful", user?.id);
  } catch (error) {
    console.error("❌ SpeedrunProvider: useUnifiedAuth failed:", error);
    user = null;
  }

  try {
    const actionPlatformResult = useAcquisitionOS();
    acquireData = actionPlatformResult?.data?.acquireData;
    console.log(
      "✅ SpeedrunProvider: useActionPlatform successful",
      acquireData ? `has ${acquireData.leads?.length || 0} leads` : "no data",
    );
  } catch (error) {
    console.warn(
      "⚠️ SpeedrunProvider: useActionPlatform failed (using fallback):",
      error,
    );
    acquireData = null;
  }

  // User settings for ranking and targeting
  const [userSettings, setUserSettings] = useState<SpeedrunUserSettings>(() => {
    try {
      console.log("🔧 SpeedrunProvider: Initializing user settings...");
      const settings = getDefaultUserSettings("AE");
      console.log("✅ SpeedrunProvider: User settings initialized:", settings);
      return settings;
    } catch (error) {
      console.warn(
        "⚠️ SpeedrunProvider: Failed to initialize user settings (using defaults):",
        error,
      );
      return {
        weeklyTarget: 400,
        dailyTarget: 100,
        strategy: "optimal" as const,
        role: "AE" as const,
        quota: 1000000,
        pipelineHealth: "healthy" as const,
      };
    }
  });

  // Core state
  const [isSpeedrunStarted] = useState(true); // Always start Speedrun immediately
  const [readyPeople, setReadyPeople] = useState<SpeedrunPerson[]>([]);
  const [selectedPerson, setSelectedPersonState] = useState<SpeedrunPerson | null>(
    null,
  );

  // Enhanced setSelectedPerson that also updates record context for AI
  const setSelectedPerson = React.useCallback((person: SpeedrunPerson | null) => {
    console.log('🎯 SpeedrunProvider: Setting selected person for AI context:', person?.name || 'null');
    setSelectedPersonState(person);
    
    if (person) {
      // Set current record context for AI chat system
      setCurrentRecord({
        id: person.id,
        name: person.name,
        fullName: person.name,
        company: person.company,
        title: person.title,
        email: person.email,
        phone: person.phone,
        linkedin: person.linkedin,
        bio: person.bio,
        interests: person.interests,
        recentActivity: person.recentActivity,
        priority: person.priority,
        status: person.status,
        lastContact: person.lastContact,
        nextAction: person.nextAction,
        relationship: person.relationship,
        commission: person.commission,
        // Include Monaco enrichment data if available
        monacoEnrichment: person.customFields?.monacoEnrichment,
        // Add speedrun-specific context
        speedrunContext: {
          isSpeedrunProspect: true,
          currentApp: 'Speedrun',
          prospectIndex: person.stableIndex,
          winningScore: person.winningScore
        }
      }, 'speedrun-prospect');
    } else {
      // Clear record context when no person selected
      clearCurrentRecord();
    }
  }, [setCurrentRecord, clearCurrentRecord]);
  const [powerHourMode, setPowerHourMode] = useState(() => {
    // Auto-enable Power Hour mode when on the power-hour route
    return pathname?.includes('/Speedrun/power-hour') || false;
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const savedFolder = localStorage.getItem('Speedrun_selected_folder');
      if (savedFolder && ['inbox', 'drafts', 'scheduled', 'templates', 'outbox', 'power-hour'].includes(savedFolder)) {
        console.log(`🔄 [Speedrun Context] Restored folder from localStorage: ${savedFolder}`);
        return savedFolder;
      }
    }
    return "inbox";
  });

  // Watch for URL changes and update Power Hour mode
  React.useEffect(() => {
    const shouldBePowerHour = pathname?.includes('/Speedrun/power-hour') || false;
    if (powerHourMode !== shouldBePowerHour) {
      console.log(`🔥 SpeedrunProvider: URL changed - setting Power Hour mode to: ${shouldBePowerHour}`);
      setPowerHourMode(shouldBePowerHour);
    }
  }, [pathname, powerHourMode]);

  // Watch for localStorage changes and update selected folder
  React.useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const savedFolder = localStorage.getItem('Speedrun_selected_folder');
        if (savedFolder && ['inbox', 'drafts', 'scheduled', 'templates', 'outbox', 'power-hour'].includes(savedFolder)) {
          if (savedFolder !== selectedFolder) {
            console.log(`🔄 [Speedrun Context] Folder changed via localStorage: ${savedFolder}`);
            setSelectedFolder(savedFolder);
          }
        }
      }
    };

    // Listen for storage events (when localStorage changes in other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount and when the component becomes visible
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedFolder]);

  // Watch for speedrun engine settings changes
  React.useEffect(() => {
    const handleSpeedrunSettingsChange = () => {
      console.log('🎯 [Speedrun Context] Speedrun engine settings changed - triggering data refresh');
      // Force a refresh of the speedrun data by clearing the current state
      // This will cause the data loader to re-fetch and re-rank with new settings
      setIsDataLoaded(false);
    };

    // Listen for speedrun settings changes
    window.addEventListener('speedrunSettingsChanged', handleSpeedrunSettingsChange);

    return () => {
      window.removeEventListener('speedrunSettingsChanged', handleSpeedrunSettingsChange);
    };
  }, []);

  // CRITICAL: Auto-select first person whenever readyPeople changes and no person is selected
  React.useEffect(() => {
    console.log("🔥 [PROVIDER AUTO-SELECT] Checking auto-selection:", {
      readyPeopleCount: readyPeople.length,
      hasSelectedPerson: !!selectedPerson,
      isSpeedrunStarted,
      shouldAutoSelect: readyPeople.length > 0 && !selectedPerson && isSpeedrunStarted,
    });

    if (readyPeople.length > 0 && !selectedPerson && isSpeedrunStarted) {
      const firstPerson = readyPeople[0];
      console.log("🔥 [PROVIDER AUTO-SELECT] Auto-selecting first person:", firstPerson?.name);
      setSelectedPerson(firstPerson || null);
    }
  }, [readyPeople, isSpeedrunStarted]); // Remove selectedPerson from dependencies to prevent infinite loop

  // Restore completed people from storage
  const [completedPeople, setCompletedPeople] = useState<SpeedrunPerson[]>(() => {
    console.log(
      "🔧 SpeedrunProvider: Restoring completed people from storage...",
    );

    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        console.log("✅ SpeedrunProvider: Server-side rendering, starting fresh");
        return [];
      }

      const dailyState = getDailySpeedrunState();
      const storedCompleted = localStorage.getItem(
        `speedrun-completed-${dailyState.date}`,
      );

      if (storedCompleted) {
        const completedData = JSON.parse(storedCompleted);
        console.log(
          `✅ SpeedrunProvider: Restored ${completedData.length} completed people from storage`,
        );
        return completedData;
      }
    } catch (error) {
      console.warn(
        "⚠️ SpeedrunProvider: Failed to restore completed people:",
        error,
      );
    }

    console.log(
      "✅ SpeedrunProvider: No completed people in storage, starting fresh",
    );
    return [];
  });

  const [skippedPeople, setSkippedPeople] = useState<SpeedrunPerson[]>([]);

  // Progress tracking - restore from persistent storage
  const [dailyProgress, setDailyProgress] = useState(() => {
    console.log("🔧 SpeedrunProvider: Initializing daily progress...");

    try {
      const dailyProgressData = getDailyProgress();
      console.log(
        "✅ SpeedrunProvider: Daily progress restored from storage:",
        dailyProgressData,
      );
      return dailyProgressData;
    } catch (error) {
      console.warn(
        "⚠️ SpeedrunProvider: Failed to restore daily progress, using defaults:",
        error,
      );
      return {
        completed: 0,
        target: 100,
        percentage: 0,
        isComplete: false,
      };
    }
  });

  const [weeklyProgress, setWeeklyProgress] = useState(() => {
    console.log("🔧 SpeedrunProvider: Initializing weekly progress...");

    try {
      const weeklyProgressData = getWeeklyProgress();
      console.log(
        "✅ SpeedrunProvider: Weekly progress restored from storage:",
        weeklyProgressData,
      );
      return weeklyProgressData;
    } catch (error) {
      console.warn(
        "⚠️ SpeedrunProvider: Failed to restore weekly progress, using defaults:",
        error,
      );
      return {
        completed: 0,
        target: 400,
        percentage: 0,
        isComplete: false,
      };
    }
  });

  // Calculated values
  const readyCount = readyPeople.length;
  const doneCount = completedPeople.length + skippedPeople.length;

  // Update user settings
  const updateUserSettings = async (
    newSettings: Partial<SpeedrunUserSettings>,
  ) => {
    try {
      console.log("⚙️ Updating user settings:", newSettings);

      const updatedSettings = { ...userSettings, ...newSettings };
      setUserSettings(updatedSettings);

      // Update progress targets based on new settings
      if (newSettings.dailyTarget !== undefined) {
        setDailyProgress((prev) => ({
          ...prev,
          target: newSettings.dailyTarget!,
          percentage: Math.round(
            (prev.completed / newSettings.dailyTarget!) * 100,
          ),
          isComplete: prev.completed >= newSettings.dailyTarget!,
        }));
      }

      if (newSettings.weeklyTarget !== undefined) {
        setWeeklyProgress((prev) => ({
          ...prev,
          target: newSettings.weeklyTarget!,
          percentage: Math.round(
            (prev.completed / newSettings.weeklyTarget!) * 100,
          ),
          isComplete: prev.completed >= newSettings.weeklyTarget!,
        }));
      }

      console.log("✅ User settings updated successfully");
    } catch (error) {
      console.error("❌ Failed to update user settings:", error);
      throw error;
    }
  };

  const contextValue: SpeedrunContextType = {
    isSpeedrunStarted,
    readyPeople,
    completedPeople,
    skippedPeople,
    selectedPerson,
    readyCount,
    doneCount,
    powerHourMode,
    userSettings,
    dailyProgress,
    weeklyProgress,
    isDataLoaded,
    selectedFolder,
    setSelectedPerson,
    setPowerHourMode,
    setSelectedFolder,
    setReadyPeople,
    setCompletedPeople,
    setSkippedPeople,
    setIsDataLoaded,
    setDailyProgress,
    setWeeklyProgress,
    updateUserSettings,
  };

  return (
    <SpeedrunContext.Provider value={contextValue}>
      {children}
    </SpeedrunContext.Provider>
  );
}
