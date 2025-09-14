"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { demoScenarioService } from "@/platform/services/DemoScenarioService";
import { useUnifiedAuth } from "@/platform/auth-unified";

interface MonacoContextType {
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
  refreshUserData: () => Promise<void>;
  
  // Demo Scenario Support
  currentDemoScenario: string | null;
  onDemoScenarioChange?: (scenarioSlug: string) => void;
  refreshDemoData: () => Promise<void>;
}

const MonacoContext = createContext<MonacoContextType | undefined>(undefined);

interface MonacoProviderProps {
  children: ReactNode;
}

export function MonacoProvider({ children }: MonacoProviderProps) {
  // Get authenticated user first
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Debug authentication state
  React.useEffect(() => {
    console.log('🔍 Monaco Context: Auth state update:', {
      authUser: authUser ? { id: authUser.id, name: authUser.name, email: authUser.email } : null,
      isAuthenticated,
      authLoading
    });
  }, [authUser, isAuthenticated, authLoading]);

  // UI State
  const [activeSpace, setActiveSpace] = useState("search");
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  
  // Debug profile state changes
  React.useEffect(() => {
    console.log('🔍 Monaco Context: Profile state changed:', { isProfileOpen, profileAnchor: !!profileAnchor });
  }, [isProfileOpen, profileAnchor]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      type: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");

  // Dynamic User Data - prioritize real user, fallback to demo
  const [user, setUser] = useState({ name: "Demo User", initial: "D" });
  const [company, setCompany] = useState("ZeroPoint");
  const [workspace, setWorkspace] = useState("ZeroPoint Workspace");
  const [currentDemoScenario, setCurrentDemoScenario] = useState<string | null>(null);

  // Load user data - prioritize real authenticated user, fallback to demo
  const loadUserData = async () => {
    console.log('🔄 Monaco Context: Loading user data...');
    console.log('🔍 Monaco Context: Auth status:', { isAuthenticated, authUser: authUser ? { name: authUser.name, email: authUser.email } : null });
    console.log('🔍 Monaco Context: Current user state:', { name: user.name, initial: user.initial });
    
    try {
      // PRIORITY 1: Use real authenticated user if available
      if (isAuthenticated && authUser) {
        console.log('👤 Monaco Context: Using real authenticated user:', authUser.name);
        
        // Get workspace info from authenticated user
        const activeWorkspace = authUser.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId) || authUser.workspaces?.[0];
        const workspaceName = activeWorkspace?.name || "Adrata";
        
        setUser({ 
          name: authUser.name, 
          initial: authUser.name.charAt(0).toUpperCase() 
        });
        setCompany(workspaceName);
        setWorkspace(workspaceName);
        
        console.log(`✅ Monaco Context: Real user set - ${authUser.name} at ${workspaceName}`);
        return;
      }

      // Check if we have auth data but not isAuthenticated yet
      if (authUser && !isAuthenticated) {
        console.log('🔄 Monaco Context: Auth user exists but not authenticated yet, using auth user anyway');
        
        const activeWorkspace = authUser.workspaces?.find(w => w['id'] === authUser.activeWorkspaceId) || authUser.workspaces?.[0];
        const workspaceName = activeWorkspace?.name || "Adrata";
        
        setUser({ 
          name: authUser.name, 
          initial: authUser.name.charAt(0).toUpperCase() 
        });
        setCompany(workspaceName);
        setWorkspace(workspaceName);
        
        console.log(`✅ Monaco Context: Auth user set - ${authUser.name} at ${workspaceName}`);
        return;
      }

      // PRIORITY 2: Use demo mode if no real user is authenticated
      if (demoScenarioService.isDemoMode()) {
        console.log('🎭 Monaco Context: No real user, using demo mode');
        const currentScenarioSlug = demoScenarioService.getCurrentScenario();
        console.log(`📊 Monaco Context: Current scenario slug: ${currentScenarioSlug}`);
        
        if (currentScenarioSlug) {
          setCurrentDemoScenario(currentScenarioSlug);
          
          // Load scenario data from API with cache busting
          const cacheParam = `?t=${Date.now()}`;
          console.log(`🌐 Monaco Context: Fetching scenario data from API: /api/demo-scenarios/${currentScenarioSlug}${cacheParam}`);
          const response = await fetch(`/api/demo-scenarios/${currentScenarioSlug}${cacheParam}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          const data = await response.json();
          console.log(`📦 Monaco Context: API response:`, data);
          
          if (data['success'] && data.scenario) {
            const scenario = data.scenario;
            console.log(`✅ Monaco Context: Successfully loaded scenario:`, scenario.name);
            
            // Set user data from scenario config
            if (scenario.config?.demoUser) {
              const demoUser = scenario.config.demoUser;
              const userData = { 
                name: demoUser.fullName || "James Gold",
                initial: (demoUser.fullName || demoUser.firstName || "J").charAt(0).toUpperCase()
              };
              console.log(`👤 Monaco Context: Setting demo user data:`, userData);
              setUser(userData);
            }
            
            // Set branding data
            if (scenario.branding) {
              const companyName = scenario.branding.companyName || "ZeroPoint";
              const workspaceName = scenario.branding.workspaceName || "ZeroPoint Workspace";
              console.log(`🏢 Monaco Context: Setting branding - Company: ${companyName}, Workspace: ${workspaceName}`);
              setCompany(companyName);
              setWorkspace(workspaceName);
            }
          } else {
            console.error('❌ Monaco Context: API returned failure:', data);
            throw new Error('Failed to load scenario data');
          }
        } else {
          console.warn('⚠️ Monaco Context: No current scenario slug available');
        }
      } else {
              // PRIORITY 3: Fallback to default production values
      console.log('🏢 Monaco Context: No user, no demo mode - using defaults');
      // TEMPORARY OVERRIDE: Force Dano for testing
      setUser({ name: "Dano", initial: "D" });
      setCompany("Adrata");
      setWorkspace("Adrata");
      }
    } catch (error) {
      console.error('❌ Monaco Context: Error loading user data:', error);
      // Fallback to demo defaults
      console.log('🔄 Monaco Context: Using fallback demo defaults');
      setUser({ name: "Demo User", initial: "D" });
      setCompany("ZeroPoint");
      setWorkspace("ZeroPoint Workspace");
    }
  };

  // Handle demo scenario changes
  const handleDemoScenarioChange = async (scenarioSlug: string) => {
    console.log(`🎭 Monaco: Switching to scenario: ${scenarioSlug}`);
    try {
      // Update the demo scenario service
      demoScenarioService.setCurrentScenario(scenarioSlug);
      
      // Update local state immediately
      setCurrentDemoScenario(scenarioSlug);
      
      // Load the new user data
      await loadUserData();
      
      // REMOVED: Speedrun data refresh - prevents default workspace pollution
      console.log(`🔄 Monaco: Speedrun data refresh disabled for scenario: ${scenarioSlug}`);
      
      console.log(`✅ Monaco: Successfully switched to scenario ${scenarioSlug}`);
      
      // Force a re-render by updating a dummy state
      setUser(prev => ({ ...prev }));
      
    } catch (error) {
      console.error(`❌ Monaco: Error switching to scenario ${scenarioSlug}:`, error);
    }
  };

  // Refresh demo data function
  const refreshDemoData = async () => {
    await loadUserData();
    // REMOVED: Speedrun data refresh - prevents default workspace pollution
    // Trigger a re-render by updating the scenario state
    const current = demoScenarioService.getCurrentScenario();
    setCurrentDemoScenario(current || null);
  };

  useEffect(() => {
    // Load user data immediately and when auth state changes
    const initializeUserData = async () => {
      console.log('🚀 Monaco Context: Initializing user data...');
      console.log('🔍 Monaco Context: Dependencies changed - isAuthenticated:', isAuthenticated, 'authUser:', authUser ? authUser.name : 'null', 'authLoading:', authLoading);
      
      // Wait for auth to finish loading before making decisions
      if (authLoading) {
        console.log('⏳ Monaco Context: Auth still loading, waiting...');
        return;
      }
      
      await loadUserData();
      // Initialize current scenario state
      const current = demoScenarioService.getCurrentScenario();
      setCurrentDemoScenario(current || null);
      console.log(`🎯 Monaco Context: Initialization complete, current scenario: ${current}`);
    };
    
    initializeUserData();
  }, [isAuthenticated, authUser?.id, authUser?.name, authLoading]);
  
  // Force refresh user data when needed
  const refreshUserData = async () => {
    console.log('🔄 Monaco Context: Force refreshing user data...');
    await loadUserData();
  };

  // Listen for scenario changes and reload user data
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const current = demoScenarioService.getCurrentScenario();
      if (current !== currentDemoScenario) {
        console.log(`🔄 Monaco Context: Scenario changed from ${currentDemoScenario} to ${current} - reloading all data`);
        setCurrentDemoScenario(current || null);
        await loadUserData();
        // REMOVED: Speedrun data refresh - prevents default workspace pollution
      }
    }, 1000); // Check every second

    return () => clearInterval(intervalId);
  }, [currentDemoScenario]);

  const value = {
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
    refreshUserData,
    
    // Demo Scenario Support
    currentDemoScenario,
    onDemoScenarioChange: handleDemoScenarioChange,
    refreshDemoData,
  };

  return (
    <MonacoContext.Provider value={value}>{children}</MonacoContext.Provider>
  );
}

export function useMonaco() {
  const context = useContext(MonacoContext);
  if (context === undefined) {
    throw new Error("useMonaco must be used within a MonacoProvider");
  }
  return context;
}
