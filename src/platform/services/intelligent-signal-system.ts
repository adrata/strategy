/**
 * 🚨 INTELLIGENT SIGNAL SYSTEM
 * 
 * Integrates CoreSignal trigger events with existing Signal popup system
 * Provides AI-driven natural language processing for signal configuration
 * Manages database queue of updates and user-configurable alerts
 */

import { TriggerEvent } from './sales-intelligence-workflows';
import { TalentMovementAlert } from './recruiting-intelligence-workflows';
import { SpeedrunSignalData } from '@/platform/hooks/useSpeedrunSignals';

export interface IntelligentSignalConfig {
  userId: string;
  workspaceId: string;
  signalTypes: {
    executiveChanges: boolean;
    fundingRounds: boolean;
    hiringSignals: boolean;
    employeeGrowth: boolean;
    talentMovement: boolean;
    competitorActivity: boolean;
    technographicChanges: boolean;
  };
  targetCompanies: string[];
  targetRoles: string[];
  geography?: string[];
  priority: 'all' | 'high' | 'urgent';
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  channels: Array<'in_app' | 'email' | 'slack' | 'webhook'>;
  aiProcessing: {
    enableNaturalLanguage: boolean;
    confidenceThreshold: number; // 0-100
    autoProcessRequests: boolean;
  };
}

export interface SignalQueueItem {
  id: string;
  type: 'trigger_event' | 'talent_alert' | 'competitive_intel' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'dismissed';
  data: TriggerEvent | TalentMovementAlert | any;
  createdAt: string;
  processedAt?: string;
  userId: string;
  workspaceId: string;
  metadata: {
    source: 'coresignal' | 'email' | 'manual' | 'ai_detected';
    confidence: number;
    actionable: boolean;
    estimatedValue?: number;
  };
}

export interface NaturalLanguageRequest {
  input: string;
  context?: {
    currentPage?: string;
    selectedRecords?: any[];
    recentActivity?: any[];
  };
  userId: string;
  workspaceId: string;
}

export interface ProcessedNLRequest {
  intent: 'create_signal' | 'modify_signal' | 'search_data' | 'generate_report' | 'find_people' | 'analyze_company';
  confidence: number;
  parameters: {
    companies?: string[];
    roles?: string[];
    timeframe?: string;
    geography?: string[];
    signalTypes?: string[];
    outputFormat?: string;
  };
  suggestedAction: string;
  clarificationNeeded?: string[];
}

export class IntelligentSignalSystem {
  private config: IntelligentSignalConfig;
  private signalQueue: SignalQueueItem[] = [];

  constructor(config: IntelligentSignalConfig) {
    this['config'] = config;
  }

  /**
   * 🧠 NATURAL LANGUAGE PROCESSING
   * Process user requests like "Alert me when Nike hires a new CTO"
   */
  async processNaturalLanguageRequest(request: NaturalLanguageRequest): Promise<ProcessedNLRequest> {
    console.log('🧠 Processing natural language request:', request.input);

    try {
      // Call AI API to process natural language
      const response = await fetch('/api/ai/process-signal-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: request.input,
          context: request.context,
          userId: request.userId,
          workspaceId: request.workspaceId,
          currentSignalConfig: this.config
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process natural language request');
      }

      const processed = await response.json();
      
      // If confidence is high enough and auto-processing is enabled, execute immediately
      if (processed.confidence >= this.config['aiProcessing']['confidenceThreshold'] && 
          this.config.aiProcessing.autoProcessRequests) {
        await this.executeProcessedRequest(processed);
      }

      return processed;

    } catch (error) {
      console.error('Failed to process natural language request:', error);
      
      // Fallback to pattern matching for common requests
      return this.fallbackPatternMatching(request.input);
    }
  }

  /**
   * 🎯 EXECUTE PROCESSED REQUEST
   * Execute the AI-processed request automatically
   */
  private async executeProcessedRequest(processed: ProcessedNLRequest): Promise<void> {
    console.log('🎯 Executing processed request:', processed.intent);

    switch (processed.intent) {
      case 'create_signal':
        await this.createSignalFromNL(processed);
        break;
      case 'find_people':
        await this.findPeopleFromNL(processed);
        break;
      case 'analyze_company':
        await this.analyzeCompanyFromNL(processed);
        break;
      case 'search_data':
        await this.searchDataFromNL(processed);
        break;
      default:
        console.log('Intent not yet implemented:', processed.intent);
    }
  }

  /**
   * 🚨 CREATE SIGNAL FROM NATURAL LANGUAGE
   * "Alert me when Nike hires a new CTO" → Creates signal configuration
   */
  private async createSignalFromNL(processed: ProcessedNLRequest): Promise<void> {
    const signalConfig = {
      companies: processed.parameters.companies || [],
      roles: processed.parameters.roles || [],
      signalTypes: processed.parameters.signalTypes || ['executive_changes'],
      timeframe: processed.parameters.timeframe || 'real_time',
      geography: processed.parameters.geography
    };

    // Update user's signal configuration
    await this.updateSignalConfiguration(signalConfig);
    
    // Create initial queue item to confirm setup
    const queueItem: SignalQueueItem = {
      id: `signal-${Date.now()}`,
      type: 'custom',
      priority: 'medium',
      status: 'completed',
      data: {
        type: 'signal_created',
        description: `New signal created: ${processed.suggestedAction}`,
        configuration: signalConfig
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      userId: this.config.userId,
      workspaceId: this.config.workspaceId,
      metadata: {
        source: 'ai_detected',
        confidence: processed.confidence,
        actionable: true
      }
    };

    await this.addToQueue(queueItem);
  }

  /**
   * 👥 FIND PEOPLE FROM NATURAL LANGUAGE
   * "Find me VP of Sales at Series B startups" → Executes role finder
   */
  private async findPeopleFromNL(processed: ProcessedNLRequest): Promise<void> {
    try {
      const response = await fetch('/api/role-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType: 'list',
          companies: processed.parameters.companies || [],
          roles: processed.parameters.roles || ['VP_SALES'],
          workspaceId: this.config.workspaceId,
          userId: this.config.userId,
          config: {
            maxResultsPerCompany: 3,
            minConfidenceScore: 75,
            outputFormat: processed.parameters.outputFormat || 'json',
            geography: processed.parameters.geography
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Create signal popup with results
        await this.createSignalPopup({
          type: 'SEARCH_RESULTS',
          priority: 'MEDIUM',
          contact: {
            id: 'search-results',
            name: `${result.report.summary.totalRolesFound} candidates found`,
            company: 'Search Results',
            type: 'search'
          },
          note: {
            title: 'People Search Complete',
            content: `Found ${result.report.summary.totalRolesFound} candidates matching your criteria`,
            source: 'ai_search'
          },
          action: 'VIEW_RESULTS',
          timestamp: new Date().toISOString(),
          metadata: {
            searchResults: result.report.results,
            searchSummary: result.report.summary
          }
        });
      }

    } catch (error) {
      console.error('Failed to execute people search:', error);
    }
  }

  /**
   * 🏢 ANALYZE COMPANY FROM NATURAL LANGUAGE
   * "Tell me about Nike's competitive landscape" → Executes competitive analysis
   */
  private async analyzeCompanyFromNL(processed: ProcessedNLRequest): Promise<void> {
    // Implementation would call competitive intelligence workflows
    console.log('🏢 Company analysis not yet implemented');
  }

  /**
   * 🔍 SEARCH DATA FROM NATURAL LANGUAGE
   * "Show me companies that raised Series B funding last month" → Executes data search
   */
  private async searchDataFromNL(processed: ProcessedNLRequest): Promise<void> {
    // Implementation would call CoreSignal search APIs
    console.log('🔍 Data search not yet implemented');
  }

  /**
   * 📋 QUEUE MANAGEMENT
   * Add items to the signal queue for processing
   */
  async addToQueue(item: SignalQueueItem): Promise<void> {
    // Add to in-memory queue
    this.signalQueue.push(item);

    // Persist to database
    await this.persistQueueItem(item);

    // Trigger signal popup if high priority
    if (item['priority'] === 'high' || item['priority'] === 'urgent') {
      await this.triggerSignalPopup(item);
    }
  }

  /**
   * 🚨 TRIGGER SIGNAL POPUP
   * Integrate with existing Signal popup system
   */
  private async triggerSignalPopup(queueItem: SignalQueueItem): Promise<void> {
    // Convert queue item to SpeedrunSignalData format
    const signalData: SpeedrunSignalData = this.convertToSpeedrunSignal(queueItem);

    // Trigger the existing signal popup system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adrata-signal-popup', {
        detail: signalData
      }));
    }

    // Also send via Pusher for real-time updates
    await this.sendPusherSignal(signalData);
  }

  /**
   * 🔄 CONVERT TO SPEEDRUN SIGNAL
   * Convert our queue item to existing SpeedrunSignalData format
   */
  private convertToSpeedrunSignal(queueItem: SignalQueueItem): SpeedrunSignalData {
    const data = queueItem.data as TriggerEvent | TalentMovementAlert;
    
    return {
      type: this.mapSignalType(queueItem.type),
      priority: queueItem.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      contact: {
        id: queueItem.id,
        name: 'company' in data ? data.company.name : 'Unknown',
        company: 'company' in data ? data.company.name : 'Unknown',
        type: 'lead'
      },
      note: {
        title: 'event' in data ? data.event.description : 'Signal Detected',
        content: this.generateSignalContent(data),
        source: queueItem.metadata.source
      },
      action: 'ADD_TO_SPEEDRUN',
      timestamp: queueItem.createdAt
    };
  }

  /**
   * 📊 QUEUE ANALYTICS
   * Get analytics about the signal queue
   */
  getQueueAnalytics(): {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    avgProcessingTime: number;
  } {
    const total = this.signalQueue.length;
    
    const byStatus = this.signalQueue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = this.signalQueue.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = this.signalQueue.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const processedItems = this.signalQueue.filter(item => item.processedAt);
    const avgProcessingTime = processedItems.length > 0 
      ? processedItems.reduce((sum, item) => {
          const created = new Date(item.createdAt).getTime();
          const processed = new Date(item.processedAt!).getTime();
          return sum + (processed - created);
        }, 0) / processedItems.length / 1000 // Convert to seconds
      : 0;

    return {
      total,
      byStatus,
      byPriority,
      byType,
      avgProcessingTime
    };
  }

  // Private helper methods

  private fallbackPatternMatching(input: string): ProcessedNLRequest {
    const lowerInput = input.toLowerCase();
    
    // Pattern: "alert me when [company] hires [role]"
    if (lowerInput.includes('alert') && lowerInput.includes('hire')) {
      return {
        intent: 'create_signal',
        confidence: 70,
        parameters: {
          signalTypes: ['hiring_signals', 'executive_changes']
        },
        suggestedAction: 'Create hiring alert',
        clarificationNeeded: ['Which companies?', 'Which roles?']
      };
    }

    // Pattern: "find [role] at [company]"
    if (lowerInput.includes('find') && (lowerInput.includes(' at ') || lowerInput.includes(' from '))) {
      return {
        intent: 'find_people',
        confidence: 80,
        parameters: {},
        suggestedAction: 'Search for people',
        clarificationNeeded: ['Which role?', 'Which companies?']
      };
    }

    // Default fallback
    return {
      intent: 'search_data',
      confidence: 30,
      parameters: {},
      suggestedAction: 'General search',
      clarificationNeeded: ['Could you be more specific?']
    };
  }

  private async updateSignalConfiguration(config: any): Promise<void> {
    // Update user's signal configuration in database
    try {
      await fetch('/api/user/signal-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.config.userId,
          workspaceId: this.config.workspaceId,
          config
        })
      });
    } catch (error) {
      console.error('Failed to update signal configuration:', error);
    }
  }

  private async persistQueueItem(item: SignalQueueItem): Promise<void> {
    // Persist queue item to database
    try {
      await fetch('/api/signals/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('Failed to persist queue item:', error);
    }
  }

  private async createSignalPopup(signalData: any): Promise<void> {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adrata-signal-popup', {
        detail: signalData
      }));
    }
  }

  private async sendPusherSignal(signalData: SpeedrunSignalData): Promise<void> {
    try {
      await fetch('/api/pusher/trigger-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: this.config.workspaceId,
          userId: this.config.userId,
          signal: signalData
        })
      });
    } catch (error) {
      console.error('Failed to send Pusher signal:', error);
    }
  }

  private mapSignalType(type: string): 'BUYING_INTENT_DETECTED' | 'STATUS_CHANGE' | 'ENGAGEMENT_SPIKE' {
    switch (type) {
      case 'trigger_event':
        return 'BUYING_INTENT_DETECTED';
      case 'talent_alert':
        return 'STATUS_CHANGE';
      default:
        return 'ENGAGEMENT_SPIKE';
    }
  }

  private generateSignalContent(data: any): string {
    if ('event' in data) {
      return data.event.description;
    }
    if ('opportunity' in data) {
      return data.opportunity.description;
    }
    return 'New signal detected';
  }
}

// Common natural language patterns for signal configuration
export const NL_SIGNAL_PATTERNS = {
  HIRING_ALERTS: [
    "alert me when {company} hires {role}",
    "notify me of new {role} at {company}",
    "watch for hiring at {company}",
    "monitor {company} for new executives"
  ],
  
  FUNDING_ALERTS: [
    "alert me when {company} raises funding",
    "notify me of funding rounds at {company}",
    "watch for Series {stage} funding",
    "monitor funding activity in {industry}"
  ],
  
  PEOPLE_SEARCH: [
    "find {role} at {company}",
    "show me {role} from {company}",
    "search for {role} in {industry}",
    "get me contacts at {company}"
  ],
  
  COMPANY_ANALYSIS: [
    "analyze {company}",
    "tell me about {company}",
    "show me {company}'s competitive landscape",
    "research {company} for me"
  ]
};

// Pre-configured signal templates
export const SIGNAL_TEMPLATES = {
  EXECUTIVE_HIRING: {
    name: 'Executive Hiring Monitor',
    description: 'Monitor target companies for C-level and VP hiring',
    signalTypes: ['executive_changes', 'hiring_signals'],
    roles: ['CEO', 'CFO', 'CRO', 'VP_SALES', 'VP_MARKETING'],
    priority: 'high'
  },
  
  FUNDING_TRACKER: {
    name: 'Funding Round Tracker',
    description: 'Track funding rounds and acquisitions',
    signalTypes: ['funding_rounds', 'acquisitions'],
    priority: 'medium'
  },
  
  TALENT_MOVEMENT: {
    name: 'Talent Movement Monitor',
    description: 'Monitor talent movement at key companies',
    signalTypes: ['talent_movement', 'executive_changes'],
    priority: 'medium'
  },
  
  COMPETITOR_WATCH: {
    name: 'Competitor Activity Monitor',
    description: 'Monitor competitor hiring, funding, and product changes',
    signalTypes: ['competitive_intel', 'hiring_signals', 'funding_rounds'],
    priority: 'high'
  }
};
