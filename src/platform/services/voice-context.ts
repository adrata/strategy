"use client";

/**
 * Voice Context Service
 * 
 * Tracks the current application context for contextual voice commands:
 * - Current page/route
 * - Current record being viewed (person, company, lead, etc.)
 * - Current tab within a record
 * - Recent actions for context-aware suggestions
 * 
 * This enables commands like "show notes" to know which record's notes to show.
 */

export interface RecordContext {
  id: string;
  type: 'person' | 'company' | 'lead' | 'opportunity' | 'contact';
  name: string;
  data?: Record<string, unknown>;
}

export interface VoiceContext {
  currentPage: string;
  currentSection: string | null;
  currentRecord: RecordContext | null;
  currentTab: string | null;
  recentActions: RecentAction[];
  workspaceId: string | null;
}

export interface RecentAction {
  action: string;
  target?: string;
  timestamp: Date;
  success: boolean;
}

type ContextListener = (context: VoiceContext) => void;

class VoiceContextService {
  private context: VoiceContext = {
    currentPage: '/',
    currentSection: null,
    currentRecord: null,
    currentTab: null,
    recentActions: [],
    workspaceId: null,
  };
  
  private listeners: Set<ContextListener> = new Set();
  private maxRecentActions = 10;

  constructor() {
    // Initialize from URL on client side
    if (typeof window !== 'undefined') {
      this.updateFromUrl(window.location.pathname);
      
      // Listen for navigation events
      this.setupNavigationListener();
    }
  }

  /**
   * Get the current voice context
   */
  getContext(): VoiceContext {
    return { ...this.context };
  }

  /**
   * Update context when navigating to a new page
   */
  setCurrentPage(page: string): void {
    this.context.currentPage = page;
    this.updateFromUrl(page);
    this.notifyListeners();
  }

  /**
   * Update context when viewing a specific record
   */
  setCurrentRecord(record: RecordContext | null): void {
    this.context.currentRecord = record;
    this.notifyListeners();
    
    if (process.env.NODE_ENV === 'development' && record) {
      console.log(`📍 Voice context: Now viewing ${record.type} "${record.name}"`);
    }
  }

  /**
   * Update context when switching tabs within a record
   */
  setCurrentTab(tab: string | null): void {
    this.context.currentTab = tab;
    this.notifyListeners();
    
    if (process.env.NODE_ENV === 'development' && tab) {
      console.log(`📍 Voice context: Tab switched to "${tab}"`);
    }
  }

  /**
   * Set the current workspace ID
   */
  setWorkspaceId(workspaceId: string | null): void {
    this.context.workspaceId = workspaceId;
    this.notifyListeners();
  }

  /**
   * Record a recent action for context-aware suggestions
   */
  recordAction(action: string, target?: string, success: boolean = true): void {
    const recentAction: RecentAction = {
      action,
      target,
      timestamp: new Date(),
      success,
    };
    
    this.context.recentActions.unshift(recentAction);
    
    // Keep only recent actions
    if (this.context.recentActions.length > this.maxRecentActions) {
      this.context.recentActions = this.context.recentActions.slice(0, this.maxRecentActions);
    }
    
    this.notifyListeners();
  }

  /**
   * Check if we have a current record context
   */
  hasRecordContext(): boolean {
    return this.context.currentRecord !== null;
  }

  /**
   * Get the current record type (for contextual commands)
   */
  getRecordType(): string | null {
    return this.context.currentRecord?.type || null;
  }

  /**
   * Get the current record name (for voice feedback)
   */
  getRecordName(): string | null {
    return this.context.currentRecord?.name || null;
  }

  /**
   * Get available tabs for the current record type
   */
  getAvailableTabs(): string[] {
    const recordType = this.context.currentRecord?.type;
    
    // Return tabs based on record type
    switch (recordType) {
      case 'person':
      case 'contact':
        return ['Overview', 'Timeline', 'Notes', 'Intelligence', 'Reports', 'History'];
      case 'company':
        return ['Overview', 'Technology', 'People', 'Intelligence', 'Engagement', 'Intent Signals'];
      case 'lead':
        return ['Overview', 'Timeline', 'Notes', 'Intelligence'];
      case 'opportunity':
        return ['Overview', 'Timeline', 'Notes', 'Stakeholders'];
      default:
        return ['Overview'];
    }
  }

  /**
   * Subscribe to context changes
   */
  subscribe(listener: ContextListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Parse URL to extract context information
   */
  private updateFromUrl(pathname: string): void {
    // Extract workspace from URL: /[workspace]/...
    const parts = pathname.split('/').filter(Boolean);
    
    if (parts.length > 0) {
      // First part is usually the workspace
      const potentialWorkspace = parts[0];
      if (!['sign-in', 'sign-up', 'api', '_next', 'auth'].includes(potentialWorkspace)) {
        this.context.workspaceId = potentialWorkspace;
      }
    }
    
    // Extract section from URL
    if (parts.length > 1) {
      const section = parts[1];
      this.context.currentSection = section;
      
      // Detect if we're viewing a specific record
      if (parts.length > 2) {
        const recordId = parts[2];
        
        // Determine record type from section
        let recordType: RecordContext['type'] | null = null;
        switch (section) {
          case 'people':
          case 'contacts':
            recordType = 'person';
            break;
          case 'companies':
          case 'accounts':
            recordType = 'company';
            break;
          case 'leads':
            recordType = 'lead';
            break;
          case 'opportunities':
            recordType = 'opportunity';
            break;
        }
        
        if (recordType && recordId) {
          // Note: Record name will be updated separately when the record is loaded
          this.context.currentRecord = {
            id: recordId,
            type: recordType,
            name: '', // Will be updated when record loads
          };
        }
      } else {
        this.context.currentRecord = null;
      }
    }
  }

  /**
   * Set up listener for navigation events
   */
  private setupNavigationListener(): void {
    if (typeof window === 'undefined') return;
    
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.updateFromUrl(window.location.pathname);
      this.notifyListeners();
    });
    
    // Listen for pushstate events via a custom event
    // Components should dispatch this when navigating
    window.addEventListener('voice-navigation', ((event: CustomEvent) => {
      if (event.detail?.pathname) {
        this.updateFromUrl(event.detail.pathname);
        this.notifyListeners();
      }
    }) as EventListener);
  }

  /**
   * Notify all listeners of context change
   */
  private notifyListeners(): void {
    const contextSnapshot = this.getContext();
    this.listeners.forEach(listener => {
      try {
        listener(contextSnapshot);
      } catch (error) {
        console.error('Voice context listener error:', error);
      }
    });
  }

  /**
   * Clear all context (e.g., on logout)
   */
  clear(): void {
    this.context = {
      currentPage: '/',
      currentSection: null,
      currentRecord: null,
      currentTab: null,
      recentActions: [],
      workspaceId: null,
    };
    this.notifyListeners();
  }

  /**
   * Get context summary for debugging
   */
  getDebugSummary(): string {
    const ctx = this.context;
    const parts = [
      `Page: ${ctx.currentPage}`,
      ctx.currentSection ? `Section: ${ctx.currentSection}` : null,
      ctx.currentRecord ? `Record: ${ctx.currentRecord.type} "${ctx.currentRecord.name}"` : null,
      ctx.currentTab ? `Tab: ${ctx.currentTab}` : null,
    ].filter(Boolean);
    
    return parts.join(' | ');
  }
}

// Export singleton instance
export const voiceContext = new VoiceContextService();

// Export for testing
export function createVoiceContext(): VoiceContextService {
  return new VoiceContextService();
}

// Custom event type for navigation
declare global {
  interface WindowEventMap {
    'voice-navigation': CustomEvent<{ pathname: string }>;
  }
}

