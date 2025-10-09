/**
 * 🎯 VOICE NAVIGATION INTELLIGENCE SERVICE
 * 
 * Advanced voice command processing for natural language navigation
 * Based on 2025 best practices for conversational AI interfaces
 */

export interface NavigationCommand {
  intent: string;
  route: string;
  params?: Record<string, string>;
  confidence: number;
  entityType?: 'person' | 'company' | 'opportunity' | 'account' | 'lead' | 'contact';
  entityName?: string;
  view?: 'calendar' | 'list' | 'kanban' | 'table' | 'details';
}

export interface NavigationPattern {
  patterns: RegExp[];
  intent: string;
  route: string;
  entityType?: 'person' | 'company' | 'opportunity' | 'account' | 'lead' | 'contact';
  view?: 'calendar' | 'list' | 'kanban' | 'table' | 'details';
  confidence: number;
}

export class VoiceNavigationIntelligence {
  private static readonly NAVIGATION_PATTERNS: NavigationPattern[] = [
    // CALENDAR VIEWS
    {
      patterns: [
        /(?:show|see|view|open|go to|take me to)\s+(?:my\s+)?calendar/i,
        /(?:let me see|show me)\s+(?:my\s+)?calendar/i,
        /(?:calendar\s+view|calendar\s+mode)/i,
        /(?:what's\s+on\s+my\s+calendar|calendar\s+today)/i
      ],
      intent: 'view_calendar',
      route: '/speedrun?view=calendar',
      view: 'calendar',
      confidence: 0.95
    },

    // LEADS & PROSPECTS
    {
      patterns: [
        /(?:show|see|view|open|display)\s+(?:me\s+)?(?:my\s+)?leads?/i,
        /(?:go to|take me to|navigate to)\s+leads?/i,
        /(?:leads?\s+(?:page|section|area))/i,
        /(?:all\s+(?:my\s+)?leads?)/i
      ],
      intent: 'view_leads',
      route: '/leads',
      entityType: 'lead',
      confidence: 0.9
    },

    // PROSPECTS
    {
      patterns: [
        /(?:show|see|view|open|display)\s+(?:me\s+)?(?:my\s+)?prospects?/i,
        /(?:go to|take me to|navigate to)\s+prospects?/i,
        /(?:prospects?\s+(?:page|section|area))/i,
        /(?:speedrun\s+(?:prospects?|items?))/i
      ],
      intent: 'view_prospects',
      route: '/speedrun',
      entityType: 'person',
      confidence: 0.9
    },

    // OPPORTUNITIES
    {
      patterns: [
        /(?:show|see|view|open|display)\s+(?:me\s+)?(?:my\s+)?(?:opportunities|opps?)/i,
        /(?:go to|take me to|navigate to)\s+(?:opportunities|opps?)/i,
        /(?:deals?|opportunities)\s+(?:page|section|pipeline)/i
      ],
      intent: 'view_opportunities',
      route: '/opportunities',
      entityType: 'opportunity',
      confidence: 0.9
    },

    // ACCOUNTS & COMPANIES
    {
      patterns: [
        /(?:show|see|view|open|display)\s+(?:me\s+)?(?:my\s+)?accounts?/i,
        /(?:show|see|view|open|display)\s+(?:me\s+)?(?:my\s+)?companies/i,
        /(?:go to|take me to|navigate to)\s+(?:accounts?|companies)/i,
        /(?:accounts?\s+(?:page|section|area))/i
      ],
      intent: 'view_accounts',
      route: '/companies',
      entityType: 'company',
      confidence: 0.9
    },

    // CONTACTS
    {
      patterns: [
        /(?:show|see|view|open|display)\s+(?:me\s+)?(?:my\s+)?contacts?/i,
        /(?:go to|take me to|navigate to)\s+contacts?/i,
        /(?:contacts?\s+(?:page|section|area))/i
      ],
      intent: 'view_contacts',
      route: '/people',
      entityType: 'contact',
      confidence: 0.9
    },

    // SPECIFIC PERSON/ENTITY LOOKUP
    {
      patterns: [
        /(?:show|see|view|open|find|lookup)\s+(?:me\s+)?(.+?)(?:\s+(?:profile|details?|record|info|information))?$/i,
        /(?:go to|take me to|navigate to)\s+(.+?)(?:\s+(?:profile|page))?$/i,
        /(?:let me see|show me)\s+(.+?)(?:\s+(?:details?|info))?$/i
      ],
      intent: 'view_entity',
      route: '/speedrun/{entity}', // Will be resolved dynamically
      entityType: 'person',
      confidence: 0.7
    },

    // DASHBOARD/HOME
    {
      patterns: [
        /(?:go\s+)?(?:home|dashboard|main\s+page)/i,
        /(?:take me\s+)?(?:home|to\s+dashboard)/i,
        /(?:main\s+dashboard|overview)/i
      ],
      intent: 'view_dashboard',
      route: '/speedrun',
      confidence: 0.85
    },

    // PIPELINE VIEWS
    {
      patterns: [
        /(?:show|see|view|open)\s+(?:my\s+)?dashboard/i,
        /(?:go to|take me to)\s+(?:the\s+)?dashboard/i,
        /(?:pipeline\s+(?:view|page|overview))/i
      ],
      intent: 'view_pipeline',
      route: '/speedrun',
      confidence: 0.85
    }
  ];

  /**
   * Parse voice command and extract navigation intent
   */
  static parseVoiceCommand(command: string): NavigationCommand | null {
    const normalizedCommand = command.trim().toLowerCase();
    
    // Try each pattern
    for (const pattern of this.NAVIGATION_PATTERNS) {
      for (const regex of pattern.patterns) {
        const match = normalizedCommand.match(regex);
        if (match) {
          let route = pattern.route;
          let entityName: string | undefined;
          
          // Handle entity-specific commands
          if (pattern['intent'] === 'view_entity' && match[1]) {
            entityName = match[1].trim();
            // Clean up common words
            entityName = entityName.replace(/\b(?:the|a|an|my|their|his|her)\b/g, '').trim();
            
            // Convert to URL-friendly format
            const urlEntity = entityName.toLowerCase().replace(/\s+/g, '-');
            route = route.replace('{entity}', urlEntity);
          }
          
          return {
            intent: pattern.intent,
            route,
            confidence: pattern.confidence,
            entityType: pattern.entityType || undefined,
            entityName,
            view: pattern.view
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Enhanced entity search with fuzzy matching
   */
  static async findEntityByName(entityName: string, entityType?: string, workspaceId?: string): Promise<any | null> {
    try {
      // CRITICAL FIX: Include workspace ID to prevent default workspace pollution
      if (!workspaceId) {
        console.warn("⚠️ VoiceNavigationIntelligence: No workspace ID provided, skipping entity search");
        return null;
      }
      
      // This would integrate with your existing data service
      const { authFetch } = await import('@/platform/api-fetch');
      const response = await authFetch(`/api/data/unified?includeSpeedrun=false`);
      const data = await response.json();
      
      if (!data.success) return null;
      
      const searchTerm = entityName.toLowerCase();
      let entities: any[] = [];
      
      // Collect entities based on type
      if (!entityType || entityType === 'person') {
        entities.push(...(data.data.speedrunItems || []));
        entities.push(...(data.data.contacts || []));
      }
      
      if (!entityType || entityType === 'company') {
        entities.push(...(data.data.accounts || []));
      }
      
      if (!entityType || entityType === 'opportunity') {
        entities.push(...(data.data.opportunities || []));
      }
      
      // Fuzzy search
      const matches = entities.filter(entity => {
        const name = (entity.fullName || entity.name || '').toLowerCase();
        const company = (entity.company || entity.companyName || '').toLowerCase();
        const email = (entity.email || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               company.includes(searchTerm) ||
               email.includes(searchTerm) ||
               this.calculateSimilarity(name, searchTerm) > 0.7;
      });
      
      // Return best match
      return matches.length > 0 ? matches[0] : null;
      
    } catch (error) {
      console.error('Entity search failed:', error);
      return null;
    }
  }

  /**
   * Generate clickable link for a record
   */
  static generateRecordLink(record: any, recordType: string): string {
    if (!record || !record.id) return '';
    
    const recordName = record.fullName || record.name || record.companyName || 'Record';
    const slug = recordName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    let section = 'leads';
    switch (recordType) {
      case 'person':
      case 'contact':
      case 'lead':
        section = 'leads';
        break;
      case 'prospect':
        section = 'prospects';
        break;
      case 'company':
      case 'account':
        section = 'accounts';
        break;
      case 'opportunity':
        section = 'opportunities';
        break;
      default:
        section = 'leads';
    }
    
    return `[${recordName}](/${section}/${slug}-${record.id})`;
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer['length'] === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Generate contextual response for navigation
   */
  static generateNavigationResponse(command: NavigationCommand): string {
    const responses = {
      view_calendar: [
        "Opening your calendar view now.",
        "Switching to calendar mode.",
        "Here's your calendar view."
      ],
      view_leads: [
        "Showing your leads.",
        "Taking you to the leads section.",
        "Here are your current leads."
      ],
      view_prospects: [
        "Opening your prospects list.",
        "Switching to speedrun prospects.",
        "Here are your prospects to contact."
      ],
      view_opportunities: [
        "Showing your opportunities.",
        "Opening the deals pipeline.",
        "Here are your active opportunities."
      ],
      view_accounts: [
        "Displaying your accounts.",
        "Opening the companies view.",
        "Here are your account records."
      ],
      view_contacts: [
        "Showing your contacts.",
        "Opening the contacts directory.",
        "Here are your contact records."
      ],
      view_entity: [
        `Looking up ${command.entityName || 'that record'}.`,
        `Opening ${command.entityName || 'the record'} details.`,
        `Here's the information for ${command.entityName || 'that contact'}.`
      ],
      view_dashboard: [
        "Taking you to the main dashboard.",
        "Opening your home view.",
        "Here's your dashboard overview."
      ],
      view_pipeline: [
        "Opening your sales pipeline.",
        "Showing the pipeline overview.",
        "Here's your current pipeline."
      ]
    };
    
    const responseList = responses[command.intent as keyof typeof responses] || ["Navigating to your requested page."];
    return responseList[Math.floor(Math.random() * responseList.length)];
  }

  /**
   * Check if command is a navigation request
   */
  static isNavigationCommand(command: string): boolean {
    return this.parseVoiceCommand(command) !== null;
  }
}
