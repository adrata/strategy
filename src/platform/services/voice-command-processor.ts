"use client";

/**
 * Voice Command Processor
 * 
 * Intercepts voice transcripts and handles direct commands:
 * - Navigation commands (go to leads, open settings, etc.)
 * - Quick actions (search for, create new, etc.)
 * - Falls through to AI for complex queries
 */

export interface VoiceCommandResult {
  handled: boolean;
  action?: 'navigate' | 'search' | 'action' | 'ai';
  target?: string;
  params?: Record<string, string>;
  feedback?: string; // Audio feedback to speak
  originalTranscript: string;
}

// Navigation command patterns with their target routes
const NAVIGATION_PATTERNS: Array<{
  patterns: RegExp[];
  route: string;
  section: string;
  feedback: string;
}> = [
  // Pipeline sections
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?leads?/i,
      /^leads?\s*(?:page|section|view)?$/i,
    ],
    route: 'leads',
    section: 'leads',
    feedback: 'Opening leads'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?prospects?/i,
      /^prospects?\s*(?:page|section|view)?$/i,
    ],
    route: 'prospects',
    section: 'prospects',
    feedback: 'Opening prospects'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?opportunities/i,
      /^opportunities\s*(?:page|section|view)?$/i,
    ],
    route: 'opportunities',
    section: 'opportunities',
    feedback: 'Opening opportunities'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?people/i,
      /^people\s*(?:page|section|view)?$/i,
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?contacts?/i,
    ],
    route: 'people',
    section: 'people',
    feedback: 'Opening people'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?companies/i,
      /^companies\s*(?:page|section|view)?$/i,
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?accounts?/i,
    ],
    route: 'companies',
    section: 'companies',
    feedback: 'Opening companies'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?clients?/i,
      /^clients?\s*(?:page|section|view)?$/i,
    ],
    route: 'clients',
    section: 'clients',
    feedback: 'Opening clients'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?partners?/i,
      /^partners?\s*(?:page|section|view)?$/i,
    ],
    route: 'partners',
    section: 'partners',
    feedback: 'Opening partners'
  },
  
  // Special sections
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?speedrun/i,
      /^speedrun\s*(?:page|section|view)?$/i,
      /(?:start|open)\s*(?:the\s+)?dialer/i,
      /(?:start|open)\s*(?:the\s+)?calling/i,
    ],
    route: 'speedrun',
    section: 'speedrun',
    feedback: 'Opening Speedrun'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?settings?/i,
      /^settings?\s*(?:page)?$/i,
    ],
    route: 'grand-central/settings',
    section: 'settings',
    feedback: 'Opening settings'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?dashboard/i,
      /^dashboard\s*(?:page)?$/i,
      /(?:go|take me)\s*home/i,
    ],
    route: 'grand-central/dashboard',
    section: 'dashboard',
    feedback: 'Opening dashboard'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?integrations?/i,
      /^integrations?\s*(?:page)?$/i,
    ],
    route: 'grand-central/integrations',
    section: 'integrations',
    feedback: 'Opening integrations'
  },
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?profile/i,
      /^(?:my\s+)?profile\s*(?:page)?$/i,
    ],
    route: 'grand-central/profile',
    section: 'profile',
    feedback: 'Opening profile'
  },
  
  // Monaco / Intelligence
  {
    patterns: [
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?monaco/i,
      /(?:go to|open|show|take me to|navigate to)\s*(?:the\s+)?intelligence/i,
      /^monaco$/i,
    ],
    route: 'monaco',
    section: 'monaco',
    feedback: 'Opening Monaco Intelligence'
  },
];

// Quick action patterns
const QUICK_ACTION_PATTERNS: Array<{
  patterns: RegExp[];
  action: string;
  extractParam?: (match: RegExpMatchArray) => Record<string, string>;
  feedback: string;
}> = [
  {
    patterns: [
      /search\s+(?:for\s+)?(?:a\s+)?(?:person|contact|someone)\s+(?:named\s+)?["']?([^"']+)["']?/i,
      /find\s+(?:person|contact|someone)\s+(?:named\s+)?["']?([^"']+)["']?/i,
    ],
    action: 'search_person',
    extractParam: (match) => ({ query: match[1]?.trim() || '' }),
    feedback: 'Searching for person'
  },
  {
    patterns: [
      /search\s+(?:for\s+)?(?:a\s+)?company\s+(?:named\s+|called\s+)?["']?([^"']+)["']?/i,
      /find\s+(?:company|organization)\s+(?:named\s+|called\s+)?["']?([^"']+)["']?/i,
    ],
    action: 'search_company',
    extractParam: (match) => ({ query: match[1]?.trim() || '' }),
    feedback: 'Searching for company'
  },
  {
    patterns: [
      /(?:create|add|new)\s+(?:a\s+)?lead/i,
    ],
    action: 'create_lead',
    feedback: 'Creating new lead'
  },
  {
    patterns: [
      /(?:create|add|new)\s+(?:a\s+)?contact/i,
      /(?:create|add|new)\s+(?:a\s+)?person/i,
    ],
    action: 'create_contact',
    feedback: 'Creating new contact'
  },
  {
    patterns: [
      /refresh\s+(?:the\s+)?(?:page|view|data)/i,
      /reload\s+(?:the\s+)?(?:page|view|data)/i,
    ],
    action: 'refresh',
    feedback: 'Refreshing'
  },
  {
    patterns: [
      /go\s+back/i,
      /(?:navigate|go)\s+(?:to\s+)?previous/i,
    ],
    action: 'go_back',
    feedback: 'Going back'
  },
];

export class VoiceCommandProcessor {
  private currentWorkspace: string | null = null;
  private router: { push: (path: string) => void } | null = null;
  
  /**
   * Set the router for navigation
   */
  setRouter(router: { push: (path: string) => void }): void {
    this.router = router;
  }
  
  /**
   * Set the current workspace for workspace-aware navigation
   */
  setCurrentWorkspace(workspace: string | null): void {
    this.currentWorkspace = workspace;
  }
  
  /**
   * Get current workspace from URL if not set
   */
  private getWorkspace(): string | null {
    if (this.currentWorkspace) return this.currentWorkspace;
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/^\/([^\/]+)\//);
      if (match && !['sign-in', 'sign-up', 'api', '_next'].includes(match[1])) {
        return match[1];
      }
    }
    
    return null;
  }
  
  /**
   * Process a voice transcript and determine if it's a command
   */
  processCommand(transcript: string): VoiceCommandResult {
    const cleanedTranscript = transcript.trim().toLowerCase();
    
    // Check navigation patterns first
    for (const nav of NAVIGATION_PATTERNS) {
      for (const pattern of nav.patterns) {
        if (pattern.test(cleanedTranscript)) {
          return {
            handled: true,
            action: 'navigate',
            target: nav.route,
            feedback: nav.feedback,
            originalTranscript: transcript
          };
        }
      }
    }
    
    // Check quick action patterns
    for (const action of QUICK_ACTION_PATTERNS) {
      for (const pattern of action.patterns) {
        const match = cleanedTranscript.match(pattern);
        if (match) {
          return {
            handled: true,
            action: 'action',
            target: action.action,
            params: action.extractParam?.(match),
            feedback: action.feedback,
            originalTranscript: transcript
          };
        }
      }
    }
    
    // Not a direct command - pass to AI
    return {
      handled: false,
      action: 'ai',
      originalTranscript: transcript
    };
  }
  
  /**
   * Execute a navigation command
   */
  executeNavigation(route: string): boolean {
    const workspace = this.getWorkspace();
    
    if (!workspace) {
      console.warn('[VoiceCommandProcessor] No workspace context for navigation');
      return false;
    }
    
    // Build the full path
    const fullPath = `/${workspace}/${route}`;
    
    console.log('[VoiceCommandProcessor] Navigating to:', fullPath);
    
    // Use router if available
    if (this.router) {
      this.router.push(fullPath);
      return true;
    }
    
    // Fallback to window.location
    if (typeof window !== 'undefined') {
      window.location.href = fullPath;
      return true;
    }
    
    return false;
  }
  
  /**
   * Execute a quick action
   */
  executeAction(action: string, params?: Record<string, string>): boolean {
    console.log('[VoiceCommandProcessor] Executing action:', action, params);
    
    switch (action) {
      case 'refresh':
        if (typeof window !== 'undefined') {
          window.location.reload();
          return true;
        }
        break;
        
      case 'go_back':
        if (typeof window !== 'undefined' && window.history.length > 1) {
          window.history.back();
          return true;
        }
        break;
        
      case 'search_person':
      case 'search_company':
        // These would trigger a search in the UI
        // For now, navigate to the relevant section
        const section = action === 'search_person' ? 'people' : 'companies';
        return this.executeNavigation(section);
        
      case 'create_lead':
        // Navigate to leads with create mode
        return this.executeNavigation('leads');
        
      case 'create_contact':
        // Navigate to people with create mode
        return this.executeNavigation('people');
        
      default:
        console.warn('[VoiceCommandProcessor] Unknown action:', action);
        return false;
    }
    
    return false;
  }
  
  /**
   * Process and execute a voice command
   * Returns true if command was handled, false if should be passed to AI
   */
  processAndExecute(transcript: string): VoiceCommandResult {
    const result = this.processCommand(transcript);
    
    if (result.handled) {
      if (result.action === 'navigate' && result.target) {
        this.executeNavigation(result.target);
      } else if (result.action === 'action' && result.target) {
        this.executeAction(result.target, result.params);
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const voiceCommandProcessor = new VoiceCommandProcessor();

