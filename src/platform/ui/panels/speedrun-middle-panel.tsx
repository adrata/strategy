"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// CRITICAL FIX: Remove duplicate data loading from SpeedrunDataProvider
// import { useSpeedrunDataContext } from "@/platform/services/speedrun-data-context";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { 
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { SpeedrunLeadDetails } from "@/products/speedrun/components/SpeedrunLeadDetails";
import { SpeedrunInsightsTable } from "@/platform/ui/components/SpeedrunInsightsTable";
import { SpeedrunSalesActionsService, SalesAction } from "@/platform/services/speedrun-sales-actions";
import { SpeedrunCalendarService, DailySchedule } from "@/platform/services/speedrun-calendar";

type SpeedrunView = 'now' | 'week' | 'month' | 'prospects' | 'insights';

interface SpeedrunMiddlePanelProps {
  selectedFolder?: string;
}

export function SpeedrunMiddlePanel({ selectedFolder: propSelectedFolder }: SpeedrunMiddlePanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    ui: { selectedRecord, setSelectedRecord },
    data
  } = useAcquisitionOS();

  // View state for dropdown - start with now as the main speedrun feature
  const [currentView, setCurrentView] = useState<SpeedrunView>('now');
  const [salesActions, setSalesActions] = useState<SalesAction[]>([]);
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Services
  const salesActionsService = SpeedrunSalesActionsService.getInstance();
  const calendarService = SpeedrunCalendarService.getInstance();

  // Get speedrun prospects from the unified data system (where the actual data is)
  const speedrunProspects = data.acquireData?.speedrunItems || [];
  
  // CRITICAL FIX: Remove duplicate data loading from SpeedrunDataProvider
  // const { prospects: contextProspects } = useSpeedrunDataContext();
  
  // Use speedrun prospects directly without fallback
  const readyPeople = speedrunProspects;

  // Use selectedRecord from Action Platform context (set by left panel)
  const selectedPerson = selectedRecord;
  
  // Debug data loading - let left panel handle auto-selection
  useEffect(() => {
    console.log("🔥 SpeedrunMiddlePanel: Data sources:", {
      speedrunProspects: speedrunProspects.length,
      // contextProspects: contextProspects.length, 
      readyPeople: readyPeople.length,
      selectedPerson: selectedPerson?.name,
      firstPerson: readyPeople[0]?.name,
      dataKeys: Object.keys(data.acquireData || {}),
      acquireDataSpeedrun: data.acquireData?.speedrunItems?.length || 0,
      allAcquireDataKeys: data.acquireData ? Object.keys(data.acquireData) : []
    });

    // Only auto-select if we're in prospects view and no one is selected
    if (readyPeople.length > 0 && !selectedPerson && currentView === 'prospects') {
      console.log("🔥 SpeedrunMiddlePanel: Auto-selecting first person for prospects view:", readyPeople[0]?.name);
      setSelectedRecord(readyPeople[0]);
    }
  }, [speedrunProspects, readyPeople, selectedPerson, data, setSelectedRecord, currentView]);

  // Initialize with sales_actions and load data immediately
  useEffect(() => {
    if (currentView === 'sales_actions' && salesActions['length'] === 0) {
      loadSalesActions();
    }
    
    // Clear selected record when switching to timeframe views to show the actions list
    if ((currentView === 'now' || currentView === 'week' || currentView === 'month') && selectedPerson) {
      setSelectedRecord(null);
    }
  }, [currentView, selectedPerson, setSelectedRecord]); // Load actions and clear selection based on view

  // Load actions on mount
  useEffect(() => {
    loadSalesActions();
  }, []); // Run once on mount

  // Listen for view change events from header dropdown
  useEffect(() => {
    const handleViewChange = (event: CustomEvent) => {
      const { view } = event.detail;
      setCurrentView(view);
      
      // Load data based on view
      if ((view === 'now' || view === 'week' || view === 'month') && salesActions['length'] === 0) {
        loadSalesActions();
      } else if (view === 'calendar' && !dailySchedule) {
        loadDailySchedule();
      }
    };

    window.addEventListener('speedrun-view-change', handleViewChange as EventListener);
    return () => window.removeEventListener('speedrun-view-change', handleViewChange as EventListener);
  }, [salesActions.length, dailySchedule]);

  // Sync with URL parameters - watch for URL changes
  useEffect(() => {
    const updateViewFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get('view');
      
      if (urlView === 'now' || urlView === 'actions' || urlView === 'sales_actions') {
        setCurrentView('now');
        // Load sales actions data if not already loaded
        if (salesActions['length'] === 0) {
          loadSalesActions();
        }
      } else if (urlView === 'week') {
        setCurrentView('week');
        if (salesActions['length'] === 0) {
          loadSalesActions();
        }
      } else if (urlView === 'month') {
        setCurrentView('month');
        if (salesActions['length'] === 0) {
          loadSalesActions();
        }
      } else if (urlView === 'targets' || urlView === 'prospects') {
        setCurrentView('prospects');
      } else if (urlView === 'calendar' || urlView === 'time') {
        setCurrentView('insights'); // Map calendar to insights for now
      } else if (urlView === 'insights') {
        setCurrentView('insights');
      } else if (!urlView) {
        // Default to now when no URL parameter is present
        setCurrentView('now');
        if (salesActions['length'] === 0) {
          loadSalesActions();
        }
      }
    };

    // Update on mount
    updateViewFromURL();

    // Listen for URL changes (browser back/forward, direct URL changes)
    const handlePopState = () => {
      updateViewFromURL();
    };

    window.addEventListener('popstate', handlePopState);
    
    // Also listen for pushState/replaceState (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history['pushState'] = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(updateViewFromURL, 0);
    };
    
    history['replaceState'] = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(updateViewFromURL, 0);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history['pushState'] = originalPushState;
      history['replaceState'] = originalReplaceState;
    };
  }, [salesActions.length, dailySchedule]); // Add dependencies for data loading checks

  // Additional Next.js-based URL parameter watching
  useEffect(() => {
    const urlView = searchParams.get('view');
    
    if (urlView === 'now' || urlView === 'actions' || urlView === 'sales_actions') {
      setCurrentView('now');
      if (salesActions['length'] === 0) {
        loadSalesActions();
      }
    } else if (urlView === 'week') {
      setCurrentView('week');
      if (salesActions['length'] === 0) {
        loadSalesActions();
      }
    } else if (urlView === 'month') {
      setCurrentView('month');
      if (salesActions['length'] === 0) {
        loadSalesActions();
      }
    } else if (urlView === 'targets' || urlView === 'prospects') {
      setCurrentView('prospects');
    } else if (urlView === 'calendar' || urlView === 'time') {
      setCurrentView('insights'); // Map calendar to insights for now
    } else if (urlView === 'insights') {
      setCurrentView('insights');
    }
  }, [searchParams, salesActions.length, dailySchedule]);

  const loadSalesActions = async () => {
    setLoadingActions(true);
    try {
      const upcomingMeetings = dailySchedule?.events.filter(e => 
        e['isSpeedrunRelated'] && (e['type'] === 'meeting' || e['type'] === 'demo')
      ) || [];
      
      const currentProgress = {
        meetings: dailySchedule?.events.filter(e => e['type'] === 'meeting').length || 0,
        emails: 0, // TODO: Get from tracking
        calls: 0, // TODO: Get from tracking
        demos: dailySchedule?.events.filter(e => e['type'] === 'demo').length || 0
      };

      const actions = await salesActionsService.generateDailySalesActions(
        readyPeople.slice(0, 20), // Top 20 prospects
        upcomingMeetings,
        currentProgress,
(data.acquireData as any)?.workspaceId || 'default'
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
(data.acquireData as any)?.workspaceId
      );
      setDailySchedule(schedule);
    } catch (error) {
      console.error('Failed to load daily schedule:', error);
      setDailySchedule(null);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleActionComplete = (actionId: string) => {
    salesActionsService.markActionCompleted(actionId);
    setSalesActions(prev => prev.map(action => 
      action['id'] === actionId ? { ...action, isCompleted: true } : action
    ));
  };

  // Convert SpeedrunProspect to SpeedrunPerson format for the component
  const convertToSpeedrunPerson = (prospect: any) => {
    return {
      id: prospect.id,
      name: prospect.name,
      title: prospect.title,
      company: prospect.company,
      email: prospect.email,
      phone: prospect.phone,
      linkedin: prospect.linkedin,
      photo: null,
      priority: prospect.priority,
      status: prospect.status || 'prospect',
      lastContact: '',
      nextAction: prospect.nextAction,
      relationship: prospect.buyerRole || 'Stakeholder',
      bio: '',
      interests: [],
      recentActivity: '',
      commission: '',
      customFields: {
        monacoEnrichment: {
          buyerGroupAnalysis: {
            role: prospect.buyerRole || 'Stakeholder',
            confidence: 0.8,
            rationale: 'Based on title and company analysis'
          }
        }
      }
    };
  };

  // Always use consistent container structure to prevent hydration errors
  const isEmpty = readyPeople['length'] === 0;

  // Show lead details when a person is selected
  if (selectedPerson) {
    const currentIndex = readyPeople.findIndex(p => p['id'] === selectedPerson.id);
    const convertedPerson = convertToSpeedrunPerson(selectedPerson);
    
    const handleNavigatePrevious = () => {
      if (currentIndex > 0) {
        const prevPerson = readyPeople[currentIndex - 1];
        setSelectedRecord(prevPerson);
      }
    };

    const handleNavigateNext = () => {
      if (currentIndex < readyPeople.length - 1) {
        const nextPerson = readyPeople[currentIndex + 1];
        setSelectedRecord(nextPerson);
      }
    };

    const handleComplete = (personId: number) => {
      if (currentIndex < readyPeople.length - 1) {
        const nextPerson = readyPeople[currentIndex + 1];
        setSelectedRecord(nextPerson);
      } else {
        setSelectedRecord(null);
      }
    };

    const handleSnooze = (personId: number) => {
      if (currentIndex < readyPeople.length - 1) {
        const nextPerson = readyPeople[currentIndex + 1];
        setSelectedRecord(nextPerson);
      } else {
        setSelectedRecord(null);
      }
    };

    const handleRemove = (personId: number) => {
      if (currentIndex < readyPeople.length - 1) {
        const nextPerson = readyPeople[currentIndex + 1];
        setSelectedRecord(nextPerson);
      } else {
        setSelectedRecord(null);
      }
    };

    return (
      <div className="h-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <SpeedrunLeadDetails
          key={`lead-${convertedPerson.id}`}
          person={convertedPerson}
          personIndex={currentIndex + 1}
          totalPersons={readyPeople.length}
          allPeople={readyPeople.map(convertToSpeedrunPerson)}
          onBack={() => {
            setSelectedRecord(null);
          }}
          onNavigatePrevious={handleNavigatePrevious}
          onNavigateNext={handleNavigateNext}
          onSnooze={handleSnooze}
          onRemove={handleRemove}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-full">
      {(currentView === 'now' || currentView === 'week' || currentView === 'month') && (
        <div className="space-y-4">
          {!loadingActions ? (
            <>
              {/* Daily Goals Summary */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Today's Goals</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--foreground)]">50</div>
                    <div className="text-sm text-[var(--muted)]">Contacts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--foreground)]">4</div>
                    <div className="text-sm text-[var(--muted)]">Meetings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--foreground)]">25</div>
                    <div className="text-sm text-[var(--muted)]">Emails</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--foreground)]">15</div>
                    <div className="text-sm text-[var(--muted)]">Calls</div>
                  </div>
                </div>
              </div>

              {salesActions.map((action) => (
                <div
                  key={action.id}
                  className={`bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 transition-all ${
                    action.isCompleted ? "border-green-200 bg-green-50" : "hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleActionComplete(action.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          action.isCompleted
                            ? "border-green-500 bg-green-500"
                            : "border-[var(--border)] hover:border-gray-400"
                        }`}
                      >
                        {action['isCompleted'] && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        action['priority'] === 'critical' ? 'bg-red-100 text-red-800' :
                        action['priority'] === 'high' ? 'bg-orange-100 text-orange-800' :
                        action['priority'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-[var(--hover)] text-gray-800'
                          }`}>
                            {action.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
                          <ClockIcon className="w-4 h-4" />
                          {action.estimatedTime}m
                        </div>
                      </div>
                      
                      <h4 className={`text-lg font-semibold mb-2 ${
                        action.isCompleted ? 'text-green-800 line-through' : 'text-[var(--foreground)]'
                      }`}>
                        {action.title}
                      </h4>
                      <p className="text-[var(--muted)] mb-3">{action.description}</p>
                      
                      {action['relatedCompany'] && (
                        <div className="text-sm text-[var(--muted)] mb-2">
                          Company: {action.relatedCompany}
                        </div>
                      )}
                      
                      <div className="text-sm text-[var(--muted)]">
                        Expected: {action.expectedOutcome}
                      </div>
                    </div>
                  ))}

                  {salesActions['length'] === 0 && (
                    <div className="text-center py-12">
                      <CheckCircleIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                      <p className="text-[var(--muted)]">No actions available</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-[var(--muted)] mt-4">Loading actions...</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'prospects' && (
            <div className="space-y-4">
              {isEmpty ? (
                <div className="text-center max-w-2xl mx-auto p-8">
                  <div className="w-24 h-24 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <FlagIcon className="w-12 h-12 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold mb-4">Ready for Speedrun</h1>
                  <p className="text-xl text-[var(--muted)] mb-8">
                    No prospects ready for outreach. Add leads or import data to get started.
                  </p>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Import Prospects
                  </button>
                </div>
              ) : (
                readyPeople.map((prospect, index) => (
                  <div
                    key={prospect.id}
                    onClick={() => setSelectedRecord(prospect)}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">{prospect.name}</h3>
                        </div>
                        <p className="text-sm text-[var(--muted)] mb-1">{prospect.title}</p>
                        <p className="text-sm text-[var(--muted)] mb-3">{prospect.company}</p>
                        
                        {/* Pain Point */}
                        {prospect['pain'] && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">PAIN:</span>
                            </div>
                        <p className="text-sm text-gray-700 bg-orange-50 p-3 rounded-md">
                          {prospect.pain}
                        </p>
                      </div>
                    )}

                    {/* Value Driver */}
                    {prospect['valueDriver'] && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-green-600 uppercase tracking-wide">VALUE DRIVER:</span>
                        </div>
                        <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-md">
                          {prospect.valueDriver}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prospect['priority'] === 'High' ? 'bg-red-100 text-red-800' :
                      prospect['priority'] === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {prospect.priority || 'Medium'}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {prospect.buyerRole || 'Stakeholder'}
                    </span>
                  </div>
                </div>
              </div>
                ))
              )}
            </div>
          )}

          {currentView === 'insights' && (
            <div className="space-y-4">
              <SpeedrunInsightsTable />
            </div>
          )}


        {false && ( // Removed time view - replaced with timeframe-based views
          <div className="space-y-4">
            {!loadingSchedule && dailySchedule ? (
              <>
                {/* Schedule Summary */}
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Today's Schedule</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--foreground)]">{dailySchedule.events.length}</div>
                      <div className="text-sm text-[var(--muted)]">Meetings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--foreground)]">{Math.round(dailySchedule.availableTime / 60)}h</div>
                      <div className="text-sm text-[var(--muted)]">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--foreground)]">{dailySchedule.focusBlocks.length}</div>
                      <div className="text-sm text-[var(--muted)]">Focus Blocks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[var(--foreground)]">{Math.round(dailySchedule.totalMeetingTime / 60)}h</div>
                      <div className="text-sm text-[var(--muted)]">In Meetings</div>
                    </div>
                  </div>
                </div>

                {/* Time Blocks */}
                <div className="space-y-3">
                  {dailySchedule.timeBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 ${
                        block['type'] === 'focus' && block.isAvailable
                          ? 'border-blue-200 bg-blue-50'
                          : block['type'] === 'work'
                          ? 'border-[var(--border)] bg-[var(--panel-background)]'
                          : 'border-[var(--border)] bg-[var(--background)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[var(--foreground)]">
                          {block.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {block.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          block['type'] === 'focus' ? 'bg-blue-100 text-blue-800' :
                          block['type'] === 'work' ? 'bg-[var(--hover)] text-gray-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {block.type}
                        </span>
                      </div>
                      <div className="text-gray-700">{block.title}</div>
                    </div>
                  ))}
                </div>

                {/* Events */}
                {dailySchedule.events.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-[var(--foreground)] mb-4">Meetings</h4>
                    <div className="space-y-3">
                      {dailySchedule.events.map((event) => (
                        <div
                          key={event.id}
                          className={`bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 ${
                            event.isSpeedrunRelated
                              ? 'border-red-200 bg-red-50'
                              : 'border-[var(--border)] bg-[var(--background)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-[var(--foreground)]">
                              {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event['type'] === 'demo' ? 'bg-purple-100 text-purple-800' :
                              event['type'] === 'call' ? 'bg-green-100 text-green-800' :
                              'bg-[var(--hover)] text-gray-800'
                            }`}>
                              {event.type}
                            </span>
                          </div>
                          <div className="text-gray-700">{event.title}</div>
                          {event['relatedCompany'] && (
                            <div className="text-[var(--muted)] text-sm mt-1">{event.relatedCompany}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p className="text-[var(--muted)]">No schedule data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}