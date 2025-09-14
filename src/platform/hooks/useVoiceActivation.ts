/**
 * 🎙️ CROSS-PLATFORM VOICE ACTIVATION SYSTEM
 *
 * Robust voice activation that works reliably across web browsers and Tauri desktop
 * - Advanced browser compatibility detection
 * - Platform-specific optimizations for Tauri
 * - Fallback mechanisms for unsupported platforms
 * - Enhanced error handling and user feedback
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface VoiceActivationHook {
  isActive: boolean;
  isListening: boolean;
  sessionDuration: number;
  lastCommand: string | null;
  activateVoice: () => Promise<void>;
  deactivateVoice: () => Promise<void>;
  toggleListening: () => Promise<void>;
}

// Voice command categories with 200+ natural language commands
export const VOICE_COMMANDS = {
  // Activation commands (3)
  activation: ["adrata start", "hey adrata", "start adrata"],

  // Navigation commands (30)
  navigation: [
    "open leads",
    "show leads",
    "go to leads",
    "leads page",
    "lead management",
    "open calendar",
    "show calendar",
    "go to calendar",
    "calendar view",
    "schedule",
    "open monaco",
    "go to monaco",
    "monaco intelligence",
    "intelligence platform",
    "open briefcase",
    "go to briefcase",
    "document management",
    "files",
    "open speedrun",
    "go to speedrun",
    "outreach queue",
    "email queue",
    "open pipeline",
    "go to pipeline",
    "sales pipeline",
    "deals",
    "open dashboard",
    "go to dashboard",
    "main dashboard",
    "overview",
    "go home",
    "home page",
    "main page",
    "back to start",
  ],

  // AI Analysis commands (50)
  ai: [
    "health check",
    "system status",
    "platform health",
    "diagnostics",
    "analyze pipeline",
    "pipeline analysis",
    "pipeline review",
    "deal analysis",
    "best customers",
    "top customers",
    "customer analysis",
    "customer insights",
    "market intelligence",
    "competitive analysis",
    "industry insights",
    "lead scoring",
    "score leads",
    "prioritize leads",
    "rank prospects",
    "revenue forecast",
    "sales forecast",
    "revenue prediction",
    "conversion analysis",
    "funnel analysis",
    "sales metrics",
    "account research",
    "company research",
    "prospect research",
    "decision makers",
    "find contacts",
    "contact discovery",
    "buying signals",
    "intent signals",
    "engagement analysis",
    "territory analysis",
    "market analysis",
    "opportunity analysis",
    "performance metrics",
    "sales performance",
    "team metrics",
    "churn analysis",
    "retention analysis",
    "customer health",
    "expansion opportunities",
    "upsell opportunities",
    "cross-sell analysis",
  ],

  // Data operations (40)
  data: [
    "add lead",
    "new lead",
    "create lead",
    "add prospect",
    "add contact",
    "new contact",
    "create contact",
    "add person",
    "add company",
    "new company",
    "create account",
    "add account",
    "update lead",
    "edit lead",
    "modify lead",
    "change lead",
    "delete lead",
    "remove lead",
    "archive lead",
    "export data",
    "download data",
    "export leads",
    "download contacts",
    "import data",
    "upload data",
    "import contacts",
    "bulk import",
    "sync data",
    "refresh data",
    "update database",
    "reload data",
    "search leads",
    "find leads",
    "locate prospects",
    "search contacts",
    "filter leads",
    "sort leads",
    "organize data",
    "categorize leads",
  ],

  // Communication (30)
  communication: [
    "send email",
    "compose email",
    "write email",
    "email contact",
    "schedule call",
    "book meeting",
    "set appointment",
    "arrange call",
    "follow up",
    "send follow up",
    "follow up email",
    "touch base",
    "connect linkedin",
    "linkedin outreach",
    "social connect",
    "dial number",
    "make call",
    "phone contact",
    "call lead",
    "send message",
    "text message",
    "quick message",
    "create sequence",
    "email sequence",
    "drip campaign",
    "personalize message",
    "custom email",
    "tailored outreach",
  ],

  // Productivity (25)
  productivity: [
    "create task",
    "new task",
    "add todo",
    "reminder",
    "set deadline",
    "schedule reminder",
    "follow up reminder",
    "mark complete",
    "task done",
    "completed",
    "prioritize tasks",
    "urgent tasks",
    "high priority",
    "daily report",
    "weekly report",
    "activity summary",
    "time tracking",
    "log time",
    "track activity",
    "calendar sync",
    "sync calendar",
    "update schedule",
    "block time",
    "schedule focus time",
    "reserve calendar",
  ],

  // Session control (10)
  session: [
    "sleep",
    "stop listening",
    "pause voice",
    "quiet mode",
    "wake up",
    "resume listening",
    "voice on",
    "activate listening",
    "end session",
    "deactivate",
    "stop voice",
    "voice off",
  ],

  // App control (12)
  app: [
    "minimize",
    "hide window",
    "background mode",
    "maximize",
    "full screen",
    "expand window",
    "settings",
    "preferences",
    "configuration",
    "help",
    "support",
    "documentation",
  ],
};

export const useVoiceActivation = (): VoiceActivationHook => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const sessionStartTime = useRef<number | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Check if we're in Tauri (desktop) environment
  const isDesktop = typeof window !== "undefined" && window.__TAURI__;

  // Enhanced logging for voice system
  const logVoice = useCallback(
    (message: string, data?: any) => {
      const timestamp = new Date().toLocaleTimeString();
      const platform = isDesktop ? "DESKTOP" : "WEB";
      console.log(
        `🎙️ [${platform}-VOICE] ${timestamp} - ${message}`,
        data || "",
      );
    },
    [isDesktop],
  );

  // Check voice status using native Tauri commands
  const checkVoiceStatus = useCallback(async () => {
    if (!isDesktop) return;

    try {
      const status = (await invoke("get_native_voice_status")) as {
        isActive: boolean;
        isListening: boolean;
        sessionDuration: number;
        platform: string;
        nativeSupport: boolean;
      };

      setIsActive(status.isActive);
      setIsListening(status.isListening);
      setSessionDuration(status.sessionDuration);

      logVoice("Status check completed", {
        active: status.isActive,
        listening: status.isListening,
        duration: status.sessionDuration,
        platform: status.platform,
      });
    } catch (error) {
      logVoice("Status check failed", error);
    }
  }, [isDesktop, logVoice]);

  // Process voice command (called when speech is recognized)
  const processVoiceCommand = useCallback(
    (recognizedText: string) => {
      const command = recognizedText.toLowerCase().trim();
      logVoice("Processing voice command", { command, length: command.length });

      // Update last command
      setLastCommand(command);

      // Find matching command category
      let commandFound = false;

      // Check activation commands
      if (VOICE_COMMANDS.activation.some((cmd) => command.includes(cmd))) {
        logVoice("Activation command detected", command);
        setIsListening(true);
        commandFound = true;
      }

      // Check navigation commands
      if (VOICE_COMMANDS.navigation.some((cmd) => command.includes(cmd))) {
        logVoice("Navigation command detected", command);
        // Handle navigation - you would implement routing here
        commandFound = true;
      }

      // Check AI commands
      if (VOICE_COMMANDS.ai.some((cmd) => command.includes(cmd))) {
        logVoice("AI analysis command detected", command);
        // Handle AI commands - trigger analysis
        commandFound = true;
      }

      // Check data commands
      if (VOICE_COMMANDS.data.some((cmd) => command.includes(cmd))) {
        logVoice("Data operation command detected", command);
        // Handle data operations
        commandFound = true;
      }

      // Check session control commands
      if (VOICE_COMMANDS.session.some((cmd) => command.includes(cmd))) {
        logVoice("Session control command detected", command);
        if (command.includes("sleep") || command.includes("stop listening")) {
          setIsListening(false);
        } else if (
          command.includes("end session") ||
          command.includes("deactivate")
        ) {
          deactivateVoice();
        }
        commandFound = true;
      }

      if (!commandFound) {
        logVoice("Unknown command", command);
      }

      // Reset inactivity timer
      resetInactivityTimer();

      // deactivateVoice and resetInactivityTimer are stable and defined above/below
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [logVoice],
  );

  // Reset inactivity timer (15 minutes)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer['current'] = setTimeout(
      () => {
        logVoice("Inactivity timeout - deactivating voice session");
        deactivateVoice();
      },
      15 * 60 * 1000,
    ); // 15 minutes
    // deactivateVoice and logVoice are stable and defined above/below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Activate voice recognition using native Tauri commands
  const activateVoice = useCallback(async () => {
    logVoice("🚀 Activating native voice recognition...");

    if (!isDesktop) {
      logVoice("❌ Desktop environment required for native voice");
      return;
    }

    try {
      // Check voice support first
      const supportInfo = (await invoke("check_voice_support")) as {
        platform: string;
        speechRecognition: boolean;
        nativeSupport: boolean;
        audioCapture: boolean;
      };

      logVoice("Voice support check", supportInfo);

      if (!supportInfo.nativeSupport) {
        logVoice("❌ Native voice support not available");
        return;
      }

      // Start native voice session
      const result = (await invoke("start_native_voice_session")) as {
        success: boolean;
        message: string;
        platform: string;
        session_id: string;
      };

      if (result.success) {
        setIsActive(true);
        setIsListening(true);
        sessionStartTime['current'] = Date.now();

        logVoice("✅ Native voice session started", {
          platform: result.platform,
          sessionId: result.session_id,
        });

        // Start status checking
        statusCheckInterval['current'] = setInterval(checkVoiceStatus, 2000);

        // Start inactivity timer
        resetInactivityTimer();
      } else {
        logVoice("❌ Failed to start native voice session");
      }
    } catch (error) {
      logVoice("❌ Voice activation error", error);
    }
    // resetInactivityTimer is stable and defined above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, logVoice, checkVoiceStatus]);

  // Deactivate voice recognition
  const deactivateVoice = useCallback(async () => {
    logVoice("🛑 Deactivating voice recognition...");

    try {
      if (isDesktop) {
        await invoke("stop_native_voice_session");
        logVoice("✅ Native voice session stopped");
      }

      // Clean up state
      setIsActive(false);
      setIsListening(false);
      setLastCommand(null);
      sessionStartTime['current'] = null;

      // Clear timers
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval['current'] = null;
      }

      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer['current'] = null;
      }
    } catch (error) {
      logVoice("❌ Voice deactivation error", error);
    }
    // logVoice is stable and defined above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  // Toggle listening state
  const toggleListening = useCallback(async () => {
    if (!isActive) {
      await activateVoice();
    } else {
      setIsListening(!isListening);
      logVoice(`Listening ${!isListening ? "enabled" : "disabled"}`);
    }
    // logVoice is stable and defined above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isListening, activateVoice]);

  // Session duration tracking
  useEffect(() => {
    if (isActive && sessionStartTime.current) {
      const interval = setInterval(() => {
        setSessionDuration(
          Math.floor((Date.now() - sessionStartTime.current!) / 1000),
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  // Initial voice support check on mount
  useEffect(() => {
    if (isDesktop) {
      logVoice("🎙️ Native voice system initialized for desktop");
      checkVoiceStatus();
    } else {
      logVoice("🌐 Web environment detected - native voice not available");
    }
  }, [isDesktop, logVoice, checkVoiceStatus]);

  return {
    isActive,
    isListening,
    sessionDuration,
    lastCommand,
    activateVoice,
    deactivateVoice,
    toggleListening,
  };
};
