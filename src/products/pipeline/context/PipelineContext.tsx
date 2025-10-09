"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
// CRITICAL FIX: Remove demo scenario service to eliminate demo data loading
// import { demoScenarioService } from "@/platform/services/DemoScenarioService";
import { getSpeedrunDataService } from "@/platform/services/speedrun-data-service";
import { useUnifiedAuth } from "@/platform/auth";

interface PipelineContextType {
  // UI State
  activeSpace: string;
  setActiveSpace: React.Dispatch<React.SetStateAction<string>>;
  isRightPanelVisible: boolean;
  setIsRightPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isProfileOpen: boolean;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileAnchor: HTMLElement | null;
  setProfileAnchor: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Chat State
  chatMessages: Array<{
    id: string;
    type: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  setChatMessages: React.Dispatch<
    React.SetStateAction<
      Array<{
        id: string;
        type: "user" | "assistant";
        content: string;
        timestamp: Date;
      }>
    >
  >;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;

  // User Data
  user: { name: string; initial: string };
  company: string;
  workspace: string;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

interface PipelineProviderProps {
  children: ReactNode;
}

export function PipelineProvider({ children }: PipelineProviderProps) {
  // Get user context from unified auth
  const { user: authUser } = useUnifiedAuth();
  
  // UI State
  const [activeSpace, setActiveSpace] = useState("speedrun");
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState("");

  // User Data - use actual auth context
  const user = { 
    name: authUser?.name || "", 
    initial: authUser?.name ? authUser.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 3) : ""
  };
  
  // Get workspace name from auth context ONLY (no generic fallbacks)
  const activeWorkspace = authUser?.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId);
  const company = "Adrata"; // Always display Adrata as the company name
  
  // Use the actual workspace name from the user's account
  let workspace = activeWorkspace?.name || "";
  
  // Update workspace when activeWorkspaceId changes
  useEffect(() => {
    if (authUser?.activeWorkspaceId) {
      const newActiveWorkspace = authUser.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId);
      console.log(`🏢 Pipeline Context: Workspace updated to: ${newActiveWorkspace?.name || 'Unknown'} (${authUser.activeWorkspaceId})`);
    }
  }, [authUser?.activeWorkspaceId, authUser?.workspaces]);
  
  console.log(`🏢 Pipeline Context: User: ${user.name}, Company: ${company}, Workspace: ${workspace}`);


  // 🚨 CRITICAL FIX: Memoize context value to prevent unnecessary re-renders
  const value: PipelineContextType = useMemo(() => ({
    // UI State
    activeSpace,
    setActiveSpace,
    isRightPanelVisible,
    setIsRightPanelVisible,
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor,
    isThemeModalOpen,
    setIsThemeModalOpen,

    // Chat State
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,

    // User Data
    user,
    company,
    workspace,
  }), [
    activeSpace,
    isRightPanelVisible,
    isProfileOpen,
    profileAnchor,
    isThemeModalOpen,
    chatMessages,
    chatInput,
    user,
    company,
    workspace
  ]);

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error("usePipeline must be used within a PipelineProvider");
  }
  return context;
}