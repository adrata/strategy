"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useSpeedrunDataContext } from "@/platform/services/speedrun-data-context";
import { useWorkspaceSpeedrunSettings } from "@/platform/hooks/useWorkspaceSpeedrunSettings";
import { 
  FireIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { PanelLoader } from "@/platform/ui/components/Loader";
import { SpeedrunCompletionModal } from "@/platform/ui/components/SpeedrunCompletionModal";
import { SpeedrunEmptyState } from "@/platform/ui/components/SpeedrunEmptyState";
import { SpeedrunSalesActionsService, SalesAction } from "@/platform/services/speedrun-sales-actions";
import { SpeedrunCalendarService, DailySchedule } from "@/platform/services/speedrun-calendar";

// Preload function for instant navigation (disabled to prevent multiple API calls)
const preloadSprintPage = () => {
  // Data is now preloaded by the service constructor
  console.log("🚀 Sprint page data preloaded by service");
};

interface SpeedrunLeftPanelProps {
  // Add any props needed
}

type SpeedrunView = 'prospects' | 'sales_actions' | 'time';

// Generate today's priority contacts from real data source
const generateTodayContacts = () => {
  // Use real data from Speedrun data service instead of hardcoded demo data
  return [];
};

export function SpeedrunLeftPanel({}: SpeedrunLeftPanelProps) {
  const router = useRouter();
  const { navigateToPipeline } = useWorkspaceNavigation();
  const pathname = usePathname();
  const { settings: workspaceSettings } = useWorkspaceSpeedrunSettings();
  
  // Use RevenueOS context for proper sync with middle panel
  const {
    ui: { selectedRecord, setSelectedRecord },
    data: { acquireData }
  } = useRevenueOS();

  // Use selectedRecord as selectedPerson for consistency
  const selectedPerson = selectedRecord;
  const setSelectedPerson = setSelectedRecord;

  // Detect if Speedrun is running in embedded mode (within AOS) or standalone mode
  const isEmbeddedInAOS = pathname?.includes('/aos/');
  const isStandaloneMode = !isEmbeddedInAOS;
  
  // Track pipeline context to avoid hydration issues - Initialize properly to prevent flash
  const getInitialPipelineContext = () => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('from') === 'pipeline';
  };
  
  const [isPipelineContext, setIsPipelineContext] = useState(getInitialPipelineContext);
  
  useEffect(() => {
    const checkPipelineContext = () => {
      const fromPipeline = getInitialPipelineContext();
      console.log("🔄 SpeedrunLeftPanel: Checking pipeline context:", {
        pathname: window.location.pathname,
        fromParam: new URLSearchParams(window.location.search).get('from'),
        fromPipeline
      });
      
      // Only update if different to prevent unnecessary re-render
      if (fromPipeline !== isPipelineContext) {
        setIsPipelineContext(fromPipeline);
      }
    };
    
    checkPipelineContext();
  }, [isPipelineContext]);

  // Use unified API speedrun data from AOS context (primary) with fallback to context
  const { prospects: contextProspects } = useSpeedrunDataContext();
  const unifiedSpeedrunData = acquireData?.speedrun?.intelligentProspects || [];
  
  // Use unified API data if available, otherwise fallback to context
  const dynamicRtpProspects = unifiedSpeedrunData.length > 0 ? unifiedSpeedrunData : contextProspects;
  
  console.log(`🔥 SpeedrunLeftPanel: Using data source - Unified: ${unifiedSpeedrunData.length}, Context: ${contextProspects.length}, Selected: ${dynamicRtpProspects.length}`);

  const [activeContacts, setActiveContacts] = useState<any[]>([]);
  
  // Persist done contacts to localStorage to prevent reset on CMD+i
  const [doneContacts, setDoneContacts] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(`speedrun-done-contacts-${today}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to restore done contacts:', error);
      return [];
    }
  });
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // New state for dropdown views
  const [currentView, setCurrentView] = useState<SpeedrunView>('prospects');
  const [showDropdown, setShowDropdown] = useState(false);
  const [salesActions, setSalesActions] = useState<SalesAction[]>([]);
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  
  // Real-time timestamp refresh state
  const [timestampRefresh, setTimestampRefresh] = useState(0);

  // Services
  const salesActionsService = SpeedrunSalesActionsService.getInstance();
  const calendarService = SpeedrunCalendarService.getInstance();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Auto-refresh timestamps every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Sync activeContacts with dynamic speedrun data and handle carryover
  useEffect(() => {
    // Always use dynamic data - context always provides an array
    const doneIds = new Set(doneContacts.map(c => c.id));
    let availableContacts = dynamicRtpProspects.filter(contact => !doneIds.has(contact.id));
    
    // 🔄 CARRYOVER: Check for incomplete records from previous day and prioritize them
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      // Get yesterday's completed records from speedrun state
      const yesterdayStateKey = `speedrun-state-${yesterdayString}`;
      const yesterdayState = localStorage.getItem(yesterdayStateKey);
      
      if (yesterdayState) {
        const parsedState = JSON.parse(yesterdayState);
        const yesterdayCompleted = parsedState.completedLeads || [];
        
        // Get yesterday's fetched records
        const yesterdayFetchedKey = `speedrun-fetched-${yesterdayString}`;
        const yesterdayFetched = JSON.parse(localStorage.getItem(yesterdayFetchedKey) || '[]');
        
        // Find incomplete records from yesterday
        const yesterdayIncomplete = yesterdayFetched.filter((recordId: string) => 
          !yesterdayCompleted.includes(recordId)
        );
        
        if (yesterdayIncomplete.length > 0) {
          console.log(`🔄 [SPEEDRUN LEFT PANEL] Found ${yesterdayIncomplete.length} incomplete records from yesterday, prioritizing them`);
          
          // Filter today's data to get incomplete records from yesterday
          const incompleteRecords = availableContacts.filter(contact => 
            yesterdayIncomplete.includes(contact.id)
          );
          
          // Filter today's data to get new records (not from yesterday)
          const newRecords = availableContacts.filter(contact => 
            !yesterdayIncomplete.includes(contact.id)
          );
          
          // Prioritize incomplete records first, then new records
          availableContacts = [...incompleteRecords, ...newRecords];
          
          console.log(`✅ [SPEEDRUN LEFT PANEL] Reordered data: ${incompleteRecords.length} incomplete + ${newRecords.length} new = ${availableContacts.length} total`);
        }
      }
      
      // Store today's fetched records for tomorrow's carryover
      const todayString = new Date().toDateString();
      const todayFetchedKey = `speedrun-fetched-${todayString}`;
      localStorage.setItem(todayFetchedKey, JSON.stringify(dynamicRtpProspects.map(r => r.id)));
      
    } catch (carryoverError) {
      console.warn('⚠️ [SPEEDRUN LEFT PANEL] Carryover logic failed, using original data:', carryoverError);
      // Continue with original data if carryover fails
    }
    
    setActiveContacts(availableContacts);
    console.log(`🔥 Speedrun Left Panel: Using dynamic data - ${availableContacts.length} contacts for current workspace`);
  }, [dynamicRtpProspects, doneContacts, unifiedSpeedrunData, contextProspects]);

  // Auto-select first contact when contacts are loaded and no contact is selected
  useEffect(() => {
    if (activeContacts.length > 0 && !selectedPerson) {
      const firstContact = activeContacts[0];
      console.log('🎯 Speedrun Left Panel: Auto-selecting first contact:', firstContact.name);
      setSelectedPerson(firstContact);
      // Update the Action Platform context immediately
      if (setSelectedRecord) {
        setSelectedRecord(firstContact);
      }
    }
  }, [activeContacts, selectedPerson, setSelectedRecord]);

  // Load sales actions when view changes to sales_actions
  useEffect(() => {
    if (currentView === 'sales_actions' && salesActions['length'] === 0) {
      loadSalesActions();
    }
  }, [currentView]);

  // Load calendar data when view changes to time
  useEffect(() => {
    if (currentView === 'time' && !dailySchedule) {
      loadDailySchedule();
    }
  }, [currentView]);

  // Listen for speedrun action completion events
  useEffect(() => {
    const handleSpeedrunActionLogged = (event: CustomEvent) => {
      const { currentRecord } = event.detail;
      console.log('🎯 [SPEEDRUN LEFT PANEL] Action logged for:', currentRecord.name);
      
      // Add to done contacts
      const newDoneContacts = [...doneContacts, currentRecord];
      setDoneContacts(newDoneContacts);
      
      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        const today = new Date().toDateString();
        localStorage.setItem(`speedrun-done-contacts-${today}`, JSON.stringify(newDoneContacts));
        
        // Update speedrun state for weekly tracking
        try {
          const { getDailySpeedrunState, saveDailySpeedrunState } = require('@/products/speedrun/state');
          const speedrunState = getDailySpeedrunState();
          if (!speedrunState.completedLeads.includes(currentRecord.id)) {
            speedrunState.completedLeads.push(currentRecord.id);
            saveDailySpeedrunState(speedrunState);
            console.log('✅ [SPEEDRUN LEFT PANEL] Updated speedrun state for weekly tracking');
          }
        } catch (error) {
          console.warn('⚠️ [SPEEDRUN LEFT PANEL] Failed to update speedrun state:', error);
        }
      }
      
      // Remove from active contacts
      setActiveContacts(prev => prev.filter(contact => contact.id !== currentRecord.id));
      
      // If this was the selected person, move to next
      if (selectedPerson && selectedPerson.id === currentRecord.id) {
        const remainingContacts = activeContacts.filter(contact => contact.id !== currentRecord.id);
        if (remainingContacts.length > 0) {
          setSelectedPerson(remainingContacts[0]);
          if (setSelectedRecord) {
            setSelectedRecord(remainingContacts[0]);
          }
        }
      }
    };

    document.addEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
    
    return () => {
      document.removeEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
    };
  }, [doneContacts, activeContacts, selectedPerson, setSelectedPerson, setSelectedRecord]);

  const loadSalesActions = async () => {
    setLoadingActions(true);
    try {
      const upcomingMeetings = dailySchedule?.events.filter(e => 
        e['isSpeedrunRelated'] && e['type'] === 'meeting' || e['type'] === 'demo'
      ) || [];
      
      const currentProgress = {
        meetings: dailySchedule?.events.filter(e => e['type'] === 'meeting').length || 0,
        emails: 0, // TODO: Get from tracking
        calls: 0, // TODO: Get from tracking
        demos: dailySchedule?.events.filter(e => e['type'] === 'demo').length || 0
      };

      const actions = await salesActionsService.generateDailySalesActions(
        dynamicRtpProspects.slice(0, 20), // Top 20 prospects
        upcomingMeetings,
        currentProgress,
        acquireData?.workspaceId || 'default'
      );

      // Mark completed actions
      const actionsWithCompletionStatus = actions.map(action => ({
        ...action,
        isCompleted: salesActionsService.isActionCompleted(action.id)
      }));

      setSalesActions(actionsWithCompletionStatus);
    } catch (error) {
      console.error('Failed to load sales actions:', error);
      setSalesActions([]);
    } finally {
      setLoadingActions(false);
    }
  };

  const loadDailySchedule = async () => {
    setLoadingSchedule(true);
    try {
      const schedule = await calendarService.getDailySchedule(
        new Date(),
        acquireData?.workspaceId
      );
      setDailySchedule(schedule);
    } catch (error) {
      console.error('Failed to load daily schedule:', error);
      setDailySchedule(null);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Command+Enter functionality to move current contact to done
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event['key'] === 'Enter') {
        // Only handle if we're in speedrun mode and have a selected person
        if (selectedPerson && activeContacts.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          markCurrentContactAsDone();
          console.log('⌘+Enter pressed in SpeedrunLeftPanel - Marked current contact as done');
        }
      }
    };

    // Use capture phase to ensure we get the event first
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedPerson, activeContacts]);

  // 🎯 SPEEDRUN ACTION LOGGED: Listen for action logged events to move records
  useEffect(() => {
    const handleSpeedrunActionLogged = (event: CustomEvent) => {
      const { currentRecord, actionData, timestamp } = event.detail;
      console.log('🎯 [SPEEDRUN LEFT PANEL] Action logged event received:', {
        currentRecord: currentRecord?.name,
        actionType: actionData?.actionType,
        timestamp
      });
      
      // Move the current record to done list and gray it out
      if (currentRecord && selectedPerson?.id === currentRecord.id) {
        markCurrentContactAsDone();
        console.log('🎯 [SPEEDRUN LEFT PANEL] Moved current record to done list and grayed out');
      }
    };

    document.addEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
    return () => document.removeEventListener('speedrunActionLogged', handleSpeedrunActionLogged as EventListener);
  }, [selectedPerson]);

  const handleAddMoreProspects = () => {
    setShowCompletionModal(false);
    // TODO: Add logic to load 20 more prospects
    console.log('🔄 Adding 20 more prospects...');
  };

  const handleDoneForDay = () => {
    setShowCompletionModal(false);
    console.log('✅ Done for the day!');
  };

  const markCurrentContactAsDone = () => {
    if (!selectedPerson) {
      console.warn('⚠️ No selected person to mark as done');
      return;
    }

    const contactToMove = selectedPerson;
    
    // Check if contact is already in done list to prevent duplicates
    // Use both ID and company to ensure uniqueness for people with same names
    const contactKey = `${contactToMove.id}-${contactToMove.company}`;
    const isAlreadyDone = doneContacts.some(contact => 
      `${contact.id}-${contact.company}` === contactKey
    );
    if (isAlreadyDone) {
      console.warn(`⚠️ Contact ${contactToMove.name} at ${contactToMove.company} is already marked as done`);
      return;
    }
    
    // Find current index BEFORE removing from active list
    // Use compound key to handle same names at different companies
    const currentIndex = activeContacts.findIndex(contact => 
      `${contact.id}-${contact.company}` === contactKey
    );
    
    if (currentIndex === -1) {
      console.warn(`⚠️ Contact ${contactToMove.name} at ${contactToMove.company} not found in active contacts`);
      return;
    }
    
    // Remove from active list using compound key comparison
    const newActiveContacts = activeContacts.filter(contact => 
      `${contact.id}-${contact.company}` !== contactKey
    );
    
    // Add to done list with unique check
    const newDoneContacts = [...doneContacts, contactToMove];
    
    // Persist done contacts to localStorage
    if (typeof window !== 'undefined') {
      try {
        const today = new Date().toDateString();
        localStorage.setItem(`speedrun-done-contacts-${today}`, JSON.stringify(newDoneContacts));
      } catch (error) {
        console.warn('Failed to save done contacts:', error);
      }
    }
    
    // Move to next contact intelligently
    let nextContact = null;
    if (newActiveContacts.length > 0) {
      // If there's a contact at the same index position, use it
      if (currentIndex < newActiveContacts.length) {
        nextContact = newActiveContacts[currentIndex];
      } else {
        // Otherwise use the last contact in the list
        nextContact = newActiveContacts[newActiveContacts.length - 1];
      }
    }
    
    console.log(`✅ Moving ${contactToMove.name} at ${contactToMove.company} to DONE list. Next contact: ${nextContact?.name} at ${nextContact?.company || 'None'}`);
    
    // Update all state at once to prevent race conditions
    setActiveContacts(newActiveContacts);
    setDoneContacts(newDoneContacts);
    setSelectedPerson(nextContact);
    
    // Update the AOS context
    if (setSelectedRecord) {
      if (nextContact) {
        setSelectedRecord(nextContact);
      } else {
        setSelectedRecord(null);
      }
    }
    
    // Check if all contacts are done (trigger completion modal)
    if (newActiveContacts['length'] === 0 && newDoneContacts.length > 0) {
      setTimeout(() => setShowCompletionModal(true), 500); // Small delay for smooth transition
    }
  };

  // Navigation functions moved to middle panel - these are now just for internal use
  const navigateToPrevious = () => {
    if (selectedPerson) {
      const currentIndex = activeContacts.findIndex(contact => contact['id'] === selectedPerson.id);
      if (currentIndex > 0) {
        setSelectedPerson(activeContacts[currentIndex - 1] || null);
      }
    }
  };

  const navigateToNext = () => {
    if (selectedPerson) {
      const currentIndex = activeContacts.findIndex(contact => contact['id'] === selectedPerson.id);
      if (currentIndex < activeContacts.length - 1) {
        setSelectedPerson(activeContacts[currentIndex + 1] || null);
      }
    }
  };

  // Listen for navigation events from middle panel
  useEffect(() => {
    const handleSpeedrunNavigate = (event: CustomEvent) => {
      const { direction } = event.detail;
      if (direction === 'previous') {
        navigateToPrevious();
      } else if (direction === 'next') {
        navigateToNext();
      } else if (direction === 'markDone') {
        markCurrentContactAsDone();
      }
    };

    window.addEventListener('speedrun-navigate', handleSpeedrunNavigate as EventListener);
    return () => window.removeEventListener('speedrun-navigate', handleSpeedrunNavigate as EventListener);
  }, [selectedPerson, activeContacts]);

  const handleContactClick = (contact: any) => {
    setSelectedPerson(contact);
    if (setSelectedRecord) {
      setSelectedRecord(contact);
    }
  };

  const handleViewChange = (view: SpeedrunView) => {
    setCurrentView(view);
    setShowDropdown(false);
  };

  const handleActionComplete = (actionId: string) => {
    salesActionsService.markActionCompleted(actionId);
    setSalesActions(prev => prev.map(action => 
      action['id'] === actionId ? { ...action, isCompleted: true } : action
    ));
  };

  // Helper functions for view icons and labels
  const getViewIcon = (view: SpeedrunView) => {
    switch (view) {
      case 'prospects':
        return FireIcon;
      case 'sales_actions':
        return CheckCircleIcon;
      case 'time':
        return ClockIcon;
      default:
        return FireIcon;
    }
  };

  const getViewLabel = (view: SpeedrunView) => {
    switch (view) {
      case 'prospects':
        return 'Targets';
      case 'sales_actions':
        return 'Actions';
      case 'time':
        return 'Calendar';
      default:
        return 'Targets';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-loading-bg text-foreground border border-border";
      case "medium": return "bg-hover text-gray-800 border border-border";
      case "low": return "bg-background text-gray-700 border border-border";
      default: return "bg-hover text-gray-800 border border-border";
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    
    // Match theme colors from color-palette.ts
    if (statusLower === 'lead' || statusLower === 'new') {
      return "bg-[#FFF7ED] text-[#9A3412] border border-[#FDBA74]"; // Orange theme (leads)
    }
    if (statusLower === 'prospect' || statusLower === 'contacted' || statusLower === 'qualified') {
      return "bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]"; // Blue theme (prospects)
    }
    if (statusLower === 'opportunity') {
      return "bg-[#EEF2FF] text-[#3730A3] border border-[#A5B4FC]"; // Indigo theme (opportunities)
    }
    if (statusLower === 'person' || statusLower === 'people') {
      return "bg-[#F5F3FF] text-[#5B21B6] border border-[#C4B5FD]"; // Violet theme (people)
    }
    if (statusLower === 'company' || statusLower === 'companies') {
      return "bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1]"; // Slate theme (companies)
    }
    
    // Default fallback
    return "bg-hover text-gray-800 border border-border";
  };

  const getStateColor = (state: string) => {
    if (!state) return 'bg-hover text-gray-800';
    return 'bg-purple-100 text-purple-800 border border-purple-200';
  };

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-background border-r border-border flex flex-col h-full">
      

      {/* Stats Header */}
      <div className="flex-shrink-0 p-3 border-b border-border bg-panel-background">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-red-600">{doneContacts.length}</span>
            <span className="text-muted">/</span>
            <span className="text-lg font-bold text-foreground">{activeContacts.length + doneContacts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* View Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 px-2 py-1 bg-background border border-border text-xs font-medium rounded hover:bg-panel-background transition-colors"
              >
                {React.createElement(getViewIcon(currentView), { className: "w-3 h-3" })}
                <span>{getViewLabel(currentView)}</span>
                <ChevronDownIcon className="w-3 h-3" />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-background border border-border rounded-md shadow-lg z-50">
                  {(['prospects', 'sales_actions', 'time'] as SpeedrunView[]).map((view) => {
                    const Icon = getViewIcon(view);
                    return (
                      <button
                        key={view}
                        onClick={() => handleViewChange(view)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-panel-background transition-colors ${
                          currentView === view ? 'bg-hover font-medium' : ''
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {getViewLabel(view)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Start Button */}
            <button className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
              Start Speedrun
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Daily Target</span>
          <span>{currentView === 'prospects' ? 'People' : currentView === 'sales_actions' ? 'Actions' : 'Time'}</span>
        </div>
      </div>

      {/* Header Section - Conditional Back Navigation Button */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        {isStandaloneMode && (
          <button
            onClick={() => {
              // Use state-based navigation to avoid hydration issues
              if (isPipelineContext) {
                console.log("🔄 Back button clicked - navigating to Pipeline Speedrun");
                navigateToPipeline('speedrun');
              } else {
                console.log("🔄 Back button clicked - navigating to Monaco");
                router.push('/monaco');
              }
            }}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm mb-3"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            {isPipelineContext ? 'Back to Pipeline' : 'Back to Monaco'}
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-border rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">A</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Adrata</h2>
            <p className="text-xs text-muted">Pro Sales Acceleration</p>
          </div>
        </div>
      </div>

      {/* Today Section */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide">Today's Priority</h3>
          <span className="text-xs text-muted">
            {activeContacts.length >= workspaceSettings.dailyTarget ? `${workspaceSettings.dailyTarget} of ${activeContacts.length}` : `${activeContacts.length}`} contacts
          </span>
        </div>
        
        {/* Dynamic Company Breakdown */}
        <div className="space-y-1 mb-3">
          {(() => {
            // Count contacts by company from active contacts
            const companyCounts = activeContacts.reduce((acc: Record<string, number>, contact: any) => {
              const company = contact.company || 'Unknown';
              acc[company] = (acc[company] || 0) + 1;
              return acc;
            }, {});
            
            // Sort by count and show top 3
            return Object.entries(companyCounts)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([company, count]) => (
                <div key={company} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{company}</span>
                  <span className="font-medium text-foreground">{count} people</span>
                </div>
              ));
          })()}
        </div>

        {/* Pipeline Indicator */}
        <div className="text-xs text-muted bg-panel-background rounded px-2 py-1">
          {Math.max(0, (dynamicRtpProspects?.length || 0) - activeContacts.length)} more contacts in pipeline
        </div>

      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentView === 'prospects' && (
          <div className="space-y-2">
            {/* Progress Bar for Speedrun Goal */}
            <div className="mb-4 p-3 bg-panel-background rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Daily Progress</span>
                <span className="text-xs text-muted">{doneContacts.length}/{workspaceSettings.dailyTarget}</span>
              </div>
              <div className="w-full bg-loading-bg rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (doneContacts.length / workspaceSettings.dailyTarget) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted mt-1">
                {workspaceSettings.dailyTarget - doneContacts.length} contacts remaining
              </div>
            </div>

            {(() => {
              // Dynamic display logic: show daily target contacts when user has that many+, otherwise show all
              const displayLimit = activeContacts.length >= workspaceSettings.dailyTarget ? workspaceSettings.dailyTarget : activeContacts.length;
              const contactsToShow = activeContacts.slice(0, displayLimit);
              
              return contactsToShow.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedPerson?.id === contact.id 
                    ? "border-gray-400 bg-hover shadow-sm" 
                    : "border-border bg-background hover:bg-panel-background hover:border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-semibold text-xs">
                    {contact.rank}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(contact.priority)}`}>
                    {contact.priority}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-foreground leading-tight">{contact.name}</h4>
                  <p className="text-xs text-muted">{contact.title}</p>
                  <p className="text-xs text-muted">{contact.company}</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(contact.status || 'prospect')}`}>
                      {contact.status || 'prospect'}
                    </span>
                    <span className="text-xs font-medium text-gray-700">{contact.score}</span>
                  </div>
                </div>
              </div>
              ));
            })()}
            
            {/* Show "more contacts" indicator when displaying limited view */}
            {activeContacts.length > workspaceSettings.dailyTarget && (
              <div className="mt-3 p-2 text-center text-xs text-muted bg-panel-background rounded">
                Showing {workspaceSettings.dailyTarget} of {activeContacts.length} contacts
                <br />
                <span className="text-xs font-medium">Complete contacts to see more in your daily queue</span>
              </div>
            )}
          </div>
        )}

        {currentView === 'sales_actions' && (
          <div className="space-y-2">
            {loadingActions ? (
              <div className="text-center py-8">
                <PanelLoader message="Loading sales actions..." />
              </div>
            ) : (
              <>
                {/* Daily Goals Summary */}
                <div className="mb-4 p-3 bg-panel-background rounded-lg">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Today's Goals</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-foreground">{workspaceSettings.dailyTarget}</div>
                      <div className="text-muted">Contacts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">4</div>
                      <div className="text-muted">Meetings</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">25</div>
                      <div className="text-muted">Emails</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">15</div>
                      <div className="text-muted">Calls</div>
                    </div>
                  </div>
                </div>

                {salesActions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-3 rounded-lg border transition-all ${
                      action.isCompleted 
                        ? "border-green-200 bg-green-50" 
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleActionComplete(action.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            action.isCompleted
                              ? "border-green-500 bg-green-500"
                              : "border-border hover:border-gray-400"
                          }`}
                        >
                          {action['isCompleted'] && (
                            <CheckCircleIcon className="w-3 h-3 text-white" />
                          )}
                        </button>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          action['priority'] === 'critical' ? 'bg-red-100 text-red-800' :
                          action['priority'] === 'high' ? 'bg-orange-100 text-orange-800' :
                          action['priority'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-hover text-gray-800'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <ClockIcon className="w-3 h-3" />
                        {action.estimatedTime}m
                      </div>
                    </div>
                    
                    <h4 className={`text-sm font-medium mb-1 ${
                      action.isCompleted ? 'text-green-800 line-through' : 'text-foreground'
                    }`}>
                      {action.title}
                    </h4>
                    <p className="text-xs text-muted mb-2">{action.description}</p>
                    
                    {action['relatedCompany'] && (
                      <div className="text-xs text-muted">
                        Company: {action.relatedCompany}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted mt-1">
                      Expected: {action.expectedOutcome}
                    </div>
                  </div>
                ))}

                {salesActions['length'] === 0 && (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="w-8 h-8 text-muted mx-auto mb-2" />
                    <p className="text-xs text-muted">No actions available</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentView === 'time' && (
          <div className="space-y-2">
            {loadingSchedule ? (
              <div className="text-center py-8">
                <PanelLoader message="Loading schedule..." />
              </div>
            ) : dailySchedule ? (
              <>
                {/* Schedule Summary */}
                <div className="bg-background border border-border rounded-lg p-4 mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Today's Schedule</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{dailySchedule.events.length}</div>
                      <div className="text-muted">Meetings</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{Math.round(dailySchedule.availableTime / 60)}h</div>
                      <div className="text-muted">Available</div>
                    </div>
                  </div>
                </div>

                {/* Events */}
                {dailySchedule.events.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Meetings</h4>
                    <div className="space-y-1">
                      {dailySchedule.events.map((event) => (
                        <div
                          key={event.id}
                          className={`p-2 rounded border text-xs ${
                            event.isSpeedrunRelated
                              ? 'border-red-200 bg-red-50'
                              : 'border-border bg-background'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">
                              {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              event['type'] === 'demo' ? 'bg-purple-100 text-purple-800' :
                              event['type'] === 'call' ? 'bg-green-100 text-green-800' :
                              'bg-hover text-gray-800'
                            }`}>
                              {event.type}
                            </span>
                          </div>
                          <div className="text-gray-700">{event.title}</div>
                          {event['relatedCompany'] && (
                            <div className="text-muted mt-1">{event.relatedCompany}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-xs text-muted">No schedule data available</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* DONE Section */}
      {doneContacts.length > 0 && (
        <div className="flex-shrink-0 border-t border-border p-4 bg-gray-25">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
            DONE ({doneContacts.length})
          </h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {doneContacts.map((contact) => (
              <div
                key={`done-${contact.id}`}
                className="p-2 rounded border border-green-200 bg-green-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-green-800">{contact.name}</span>
                  <span className="text-xs text-green-600">✓</span>
                </div>
                <p className="text-xs text-green-600">{contact.company}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when all done */}
      {activeContacts['length'] === 0 && doneContacts.length > 0 && (
        <div className="flex-1 flex items-center justify-center">
          <SpeedrunEmptyState type="left" completedCount={doneContacts.length} />
        </div>
      )}

      {/* Completion Modal */}
      <SpeedrunCompletionModal
        isOpen={showCompletionModal}
        onClose={handleDoneForDay}
        onAddMore={handleAddMoreProspects}
        completedCount={doneContacts.length}
      />
    </div>
  );
}

// Export navigation functions for use in middle panel
export const useSpeedrunNavigation = () => {
  return {
    navigateToPrevious: () => {
      // This will be handled by the parent component
      const event = new CustomEvent('speedrun-navigate', { detail: { direction: 'previous' } });
      window.dispatchEvent(event);
    },
    navigateToNext: () => {
      // This will be handled by the parent component
      const event = new CustomEvent('speedrun-navigate', { detail: { direction: 'next' } });
      window.dispatchEvent(event);
    }
  };
}; 