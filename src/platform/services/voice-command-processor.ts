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

// Quick action patterns - organized by user persona
const QUICK_ACTION_PATTERNS: Array<{
  patterns: RegExp[];
  action: string;
  extractParam?: (match: RegExpMatchArray) => Record<string, string>;
  feedback: string;
  category: 'novice' | 'power' | 'expert' | 'universal';
}> = [
  // ============================================
  // NOVICE USER COMMANDS (explicit, simple)
  // ============================================
  {
    patterns: [
      /^help$/i,
      /what can (?:i|you) do/i,
      /show\s+(?:me\s+)?commands/i,
      /what (?:are|can) (?:the\s+)?voice commands/i,
    ],
    action: 'show_help',
    feedback: 'Here are some things you can say...',
    category: 'novice'
  },
  {
    patterns: [
      /^cancel$/i,
      /^stop$/i,
      /^never\s*mind$/i,
    ],
    action: 'cancel',
    feedback: 'Cancelled',
    category: 'novice'
  },
  {
    patterns: [
      /go\s+back/i,
      /(?:navigate|go)\s+(?:to\s+)?previous/i,
      /^back$/i,
    ],
    action: 'go_back',
    feedback: 'Going back',
    category: 'novice'
  },
  {
    patterns: [
      /call\s+["']?([^"']+)["']?/i,
      /dial\s+["']?([^"']+)["']?/i,
      /phone\s+["']?([^"']+)["']?/i,
    ],
    action: 'call_contact',
    extractParam: (match) => ({ name: match[1]?.trim() || '' }),
    feedback: 'Initiating call',
    category: 'novice'
  },
  {
    patterns: [
      /email\s+["']?([^"']+)["']?/i,
      /send\s+(?:an?\s+)?email\s+to\s+["']?([^"']+)["']?/i,
      /compose\s+(?:an?\s+)?email\s+(?:to\s+)?["']?([^"']+)["']?/i,
    ],
    action: 'email_contact',
    extractParam: (match) => ({ name: match[1]?.trim() || match[2]?.trim() || '' }),
    feedback: 'Opening email',
    category: 'novice'
  },

  // ============================================
  // POWER USER COMMANDS (shortcuts)
  // ============================================
  {
    patterns: [
      /^next$/i,
      /next\s+(?:record|person|contact|company)/i,
      /go\s+(?:to\s+)?next/i,
    ],
    action: 'next_record',
    feedback: 'Next record',
    category: 'power'
  },
  {
    patterns: [
      /^previous$/i,
      /previous\s+(?:record|person|contact|company)/i,
      /go\s+(?:to\s+)?previous/i,
      /^prev$/i,
    ],
    action: 'previous_record',
    feedback: 'Previous record',
    category: 'power'
  },
  {
    patterns: [
      /mark\s+(?:as\s+)?(?:done|complete|completed)/i,
      /complete\s+(?:this\s+)?task/i,
      /^done$/i,
      /finish\s+(?:this\s+)?task/i,
    ],
    action: 'mark_complete',
    feedback: 'Marked complete',
    category: 'power'
  },
  {
    patterns: [
      /schedule\s+(?:a\s+)?call\s+(?:with\s+)?["']?([^"']+)["']?/i,
      /set\s+up\s+(?:a\s+)?call\s+(?:with\s+)?["']?([^"']+)["']?/i,
      /book\s+(?:a\s+)?(?:call|meeting)\s+(?:with\s+)?["']?([^"']+)["']?/i,
    ],
    action: 'schedule_call',
    extractParam: (match) => ({ name: match[1]?.trim() || '' }),
    feedback: 'Scheduling call',
    category: 'power'
  },
  {
    patterns: [
      /add\s+(?:a\s+)?note\s+["']?(.+)["']?/i,
      /note\s*:\s*["']?(.+)["']?/i,
      /make\s+(?:a\s+)?note\s+["']?(.+)["']?/i,
    ],
    action: 'add_note',
    extractParam: (match) => ({ content: match[1]?.trim() || '' }),
    feedback: 'Adding note',
    category: 'power'
  },
  {
    patterns: [
      /snooze\s+(?:for\s+)?(\d+)\s*(?:day|days|hour|hours|week|weeks)/i,
      /remind\s+me\s+(?:in\s+)?(\d+)\s*(?:day|days|hour|hours|week|weeks)/i,
    ],
    action: 'snooze',
    extractParam: (match) => ({ duration: match[1]?.trim() || '1' }),
    feedback: 'Snoozed',
    category: 'power'
  },
  {
    patterns: [
      /search\s+(?:for\s+)?(?:a\s+)?(?:person|contact|someone)\s+(?:named\s+)?["']?([^"']+)["']?/i,
      /find\s+(?:person|contact|someone)\s+(?:named\s+)?["']?([^"']+)["']?/i,
    ],
    action: 'search_person',
    extractParam: (match) => ({ query: match[1]?.trim() || '' }),
    feedback: 'Searching for person',
    category: 'power'
  },
  {
    patterns: [
      /search\s+(?:for\s+)?(?:a\s+)?company\s+(?:named\s+|called\s+)?["']?([^"']+)["']?/i,
      /find\s+(?:company|organization)\s+(?:named\s+|called\s+)?["']?([^"']+)["']?/i,
    ],
    action: 'search_company',
    extractParam: (match) => ({ query: match[1]?.trim() || '' }),
    feedback: 'Searching for company',
    category: 'power'
  },
  {
    patterns: [
      /(?:create|add|new)\s+(?:a\s+)?lead/i,
    ],
    action: 'create_lead',
    feedback: 'Creating new lead',
    category: 'power'
  },
  {
    patterns: [
      /(?:create|add|new)\s+(?:a\s+)?contact/i,
      /(?:create|add|new)\s+(?:a\s+)?person/i,
    ],
    action: 'create_contact',
    feedback: 'Creating new contact',
    category: 'power'
  },

  // ============================================
  // EXPERT USER COMMANDS (complex, AI-assisted)
  // These pass to AI but with special handling
  // ============================================
  {
    patterns: [
      /analyze\s+(?:this\s+)?(?:pipeline|funnel)/i,
      /how\s+(?:is|are)\s+(?:my|the)\s+pipeline/i,
      /pipeline\s+(?:health|status|analysis)/i,
    ],
    action: 'analyze_pipeline',
    feedback: 'Analyzing pipeline',
    category: 'expert'
  },
  {
    patterns: [
      /summarize\s+(?:this\s+)?(?:record|contact|person|company)/i,
      /give\s+me\s+(?:a\s+)?summary/i,
      /what\s+(?:do\s+)?(?:i|we)\s+know\s+about\s+(?:this|them)/i,
    ],
    action: 'summarize_record',
    feedback: 'Summarizing',
    category: 'expert'
  },
  {
    patterns: [
      /draft\s+(?:an?\s+)?email\s+(?:to\s+)?["']?([^"']+)["']?\s+about\s+["']?(.+)["']?/i,
      /write\s+(?:an?\s+)?email\s+(?:to\s+)?["']?([^"']+)["']?\s+about\s+["']?(.+)["']?/i,
    ],
    action: 'draft_email',
    extractParam: (match) => ({ recipient: match[1]?.trim() || '', topic: match[2]?.trim() || '' }),
    feedback: 'Drafting email',
    category: 'expert'
  },
  {
    patterns: [
      /find\s+(?:all\s+)?(?:CFO|CEO|CTO|VP|director)s?\s+(?:at\s+)?(?:companies?\s+)?(?:that\s+are\s+)?(.+)/i,
      /show\s+me\s+(?:all\s+)?(?:CFO|CEO|CTO|VP|director)s?\s+(?:at\s+)?(?:companies?\s+)?(?:that\s+are\s+)?(.+)/i,
    ],
    action: 'advanced_search',
    extractParam: (match) => ({ criteria: match[0] }),
    feedback: 'Searching',
    category: 'expert'
  },
  {
    patterns: [
      /what\s+(?:should|can)\s+i\s+do\s+(?:next|now)/i,
      /suggest\s+(?:next\s+)?(?:steps|actions)/i,
      /recommend\s+(?:next\s+)?(?:steps|actions)/i,
    ],
    action: 'suggest_actions',
    feedback: 'Getting suggestions',
    category: 'expert'
  },

  // ============================================
  // UNIVERSAL COMMANDS (all users)
  // ============================================
  {
    patterns: [
      /refresh\s+(?:the\s+)?(?:page|view|data)/i,
      /reload\s+(?:the\s+)?(?:page|view|data)/i,
      /^refresh$/i,
      /^reload$/i,
    ],
    action: 'refresh',
    feedback: 'Refreshing',
    category: 'universal'
  },
  {
    patterns: [
      /scroll\s+(?:down|up)/i,
      /page\s+(?:down|up)/i,
    ],
    action: 'scroll',
    extractParam: (match) => ({ direction: match[0].includes('down') ? 'down' : 'up' }),
    feedback: 'Scrolling',
    category: 'universal'
  },
  {
    patterns: [
      /^close$/i,
      /dismiss/i,
      /close\s+(?:this|the)\s+(?:panel|modal|popup|dialog)/i,
    ],
    action: 'close',
    feedback: 'Closing',
    category: 'universal'
  },
  {
    patterns: [
      /^save$/i,
      /save\s+(?:this|changes)/i,
      /^submit$/i,
    ],
    action: 'save',
    feedback: 'Saving',
    category: 'universal'
  },
  {
    patterns: [
      /^undo$/i,
      /undo\s+(?:that|last)/i,
    ],
    action: 'undo',
    feedback: 'Undoing',
    category: 'universal'
  },
  {
    patterns: [
      /^redo$/i,
      /redo\s+(?:that|last)/i,
    ],
    action: 'redo',
    feedback: 'Redoing',
    category: 'universal'
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
      // Universal actions
      case 'refresh':
        if (typeof window !== 'undefined') {
          window.location.reload();
          return true;
        }
        break;
        
      case 'go_back':
      case 'cancel':
        if (typeof window !== 'undefined' && window.history.length > 1) {
          window.history.back();
          return true;
        }
        break;
        
      case 'scroll':
        if (typeof window !== 'undefined') {
          const direction = params?.direction === 'up' ? -1 : 1;
          window.scrollBy({ top: direction * 400, behavior: 'smooth' });
          return true;
        }
        break;
        
      case 'close':
        // Try to close any open modal or panel
        if (typeof document !== 'undefined') {
          const closeButton = document.querySelector('[aria-label="Close"]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
            return true;
          }
        }
        break;
        
      case 'save':
      case 'submit':
        // Try to trigger save/submit
        if (typeof document !== 'undefined') {
          const submitButton = document.querySelector('button[type="submit"]') as HTMLElement;
          if (submitButton) {
            submitButton.click();
            return true;
          }
        }
        break;
        
      case 'undo':
        if (typeof document !== 'undefined') {
          document.execCommand('undo');
          return true;
        }
        break;
        
      case 'redo':
        if (typeof document !== 'undefined') {
          document.execCommand('redo');
          return true;
        }
        break;
        
      // Navigation actions
      case 'search_person':
        return this.executeNavigation('people');
        
      case 'search_company':
        return this.executeNavigation('companies');
        
      case 'create_lead':
        return this.executeNavigation('leads');
        
      case 'create_contact':
        return this.executeNavigation('people');
        
      case 'next_record':
        // Try to click next button
        if (typeof document !== 'undefined') {
          const nextButton = document.querySelector('[aria-label*="Next"], [aria-label*="next"], button:has(svg[class*="right"])') as HTMLElement;
          if (nextButton) {
            nextButton.click();
            return true;
          }
        }
        break;
        
      case 'previous_record':
        // Try to click previous button
        if (typeof document !== 'undefined') {
          const prevButton = document.querySelector('[aria-label*="Previous"], [aria-label*="previous"], button:has(svg[class*="left"])') as HTMLElement;
          if (prevButton) {
            prevButton.click();
            return true;
          }
        }
        break;
        
      case 'mark_complete':
        // Try to find and click a complete/done button
        if (typeof document !== 'undefined') {
          const completeButton = document.querySelector('[aria-label*="Complete"], [aria-label*="Done"], button:contains("Complete")') as HTMLElement;
          if (completeButton) {
            completeButton.click();
            return true;
          }
        }
        break;
      
      // Actions that pass through to AI (return false to let AI handle)
      case 'show_help':
      case 'analyze_pipeline':
      case 'summarize_record':
      case 'draft_email':
      case 'advanced_search':
      case 'suggest_actions':
      case 'call_contact':
      case 'email_contact':
      case 'schedule_call':
      case 'add_note':
      case 'snooze':
        // These are complex actions that should be handled by AI
        // Return false to pass through
        return false;
        
      default:
        console.warn('[VoiceCommandProcessor] Unknown action:', action);
        return false;
    }
    
    return false;
  }
  
  /**
   * Process and execute a voice command
   * Returns result with handled=true if command was executed directly,
   * handled=false if should be passed to AI
   */
  processAndExecute(transcript: string): VoiceCommandResult {
    const result = this.processCommand(transcript);
    
    if (result.handled) {
      if (result.action === 'navigate' && result.target) {
        const success = this.executeNavigation(result.target);
        if (!success) {
          // Navigation failed, let AI handle it
          return { ...result, handled: false };
        }
      } else if (result.action === 'action' && result.target) {
        const success = this.executeAction(result.target, result.params);
        if (!success) {
          // Action couldn't be executed directly, let AI handle it
          // Keep the feedback but mark as not handled
          return { ...result, handled: false, action: 'ai' };
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get help text for available voice commands
   */
  getHelpText(): string {
    return `You can say things like:
    
**Navigation:**
- "Go to leads" / "Open prospects" / "Show people"
- "Go to settings" / "Open dashboard"
- "Go back" / "Next" / "Previous"

**Actions:**
- "Call [name]" / "Email [name]"
- "Create new lead" / "Add contact"
- "Mark done" / "Save" / "Refresh"

**Search:**
- "Find person [name]" / "Search for company [name]"

**Smart Commands:**
- "Analyze pipeline" / "Summarize this record"
- "Draft email to [name] about [topic]"
- "What should I do next?"`;
  }
}

// Export singleton instance
export const voiceCommandProcessor = new VoiceCommandProcessor();

