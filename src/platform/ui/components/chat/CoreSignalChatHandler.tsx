/**
 * CORESIGNAL CHAT HANDLER
 * 
 * Intelligent chat handler that detects CoreSignal-related queries and provides
 * contextually aware responses using CoreSignal data and buyer group intelligence.
 */

import { AIContext } from '@/platform/services/coresignal-ai-integration';

export interface CoreSignalChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  suggestedActions?: Array<{
    type: string;
    label: string;
    action: string;
    data?: any;
  }>;
}

export class CoreSignalChatHandler {
  /**
   * Detect if a query should be handled by CoreSignal AI
   */
  static shouldHandleQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    const coreSignalTriggers = [
      // Person enrichment
      'enrich', 'update contact', 'find email', 'get contact info',
      'enrich contact', 'update email', 'find linkedin',
      
      // Company intelligence
      'tell me about', 'analyze company', 'company data', 'company info',
      'how many employees', 'revenue', 'growth rate', 'hiring',
      'company intelligence', 'company analysis',
      
      // Buyer committee
      'buying committee', 'stakeholder', 'decision maker', 'buyer group',
      'who should i contact', 'key contacts', 'map stakeholders',
      
      // Competitive intelligence
      'competitor', 'competitive', 'vs ', 'against ', 'market share',
      
      // Executive movements
      'who left', 'new hire', 'executive', 'leadership change',
      'job change', 'moved to', 'joined',
      
      // CSV/batch operations
      'csv', 'upload', 'enrich this list', 'batch', 'import',
      'enrich csv', 'process csv', 'analyze csv',
      
      // Market analysis
      'market', 'industry', 'segment', 'trends',
      
      // Intelligence queries
      'intelligence', 'coresignal', 'data enrichment'
    ];
    
    return coreSignalTriggers.some(trigger => lowerQuery.includes(trigger));
  }

  /**
   * Build AI context from current application state
   */
  static buildAIContext(
    userId: string,
    workspaceId: string,
    currentRecord: any,
    recordType: string,
    activeSubApp: string,
    recentActivity: any[]
  ): AIContext {
    // Determine user role (can be enhanced with actual role data)
    const userRole = this.determineUserRole(activeSubApp);
    
    // Map current view
    const currentView = this.mapCurrentView(activeSubApp);
    
    // Build current record context
    let currentRecordContext = undefined;
    if (currentRecord) {
      currentRecordContext = {
        type: this.mapRecordType(recordType),
        id: currentRecord.id,
        name: currentRecord.name || currentRecord.fullName || currentRecord.companyName,
        company: currentRecord.company || currentRecord.companyName,
        linkedinUrl: currentRecord.linkedinUrl,
        email: currentRecord.email || currentRecord.workEmail,
        title: currentRecord.title || currentRecord.jobTitle,
        website: currentRecord.website || currentRecord.companyWebsite
      };
    }
    
    return {
      userId,
      workspaceId,
      userRole,
      currentRecord: currentRecordContext,
      currentView,
      recentSearches: this.extractRecentSearches(recentActivity),
      recentlyViewed: this.extractRecentlyViewed(recentActivity)
    };
  }

  /**
   * Process CoreSignal query and return enhanced response
   */
  static async processCoreSignalQuery(
    query: string,
    context: AIContext
  ): Promise<{
    success: boolean;
    response: string;
    data?: any;
    suggestedActions?: any[];
    followUpQuestions?: string[];
  }> {
    try {
      const response = await fetch('/api/ai/coresignal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          context
        }),
      });

      if (!response.ok) {
        throw new Error(`CoreSignal AI API failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          response: data.response.message,
          data: data.response.data,
          suggestedActions: data.response.suggestedActions,
          followUpQuestions: data.response.followUpQuestions
        };
      } else {
        throw new Error(data.error || 'CoreSignal AI processing failed');
      }

    } catch (error) {
      console.error('CoreSignal chat handler error:', error);
      return {
        success: false,
        response: "I encountered an issue accessing CoreSignal data. Let me try a different approach or you can rephrase your question."
      };
    }
  }

  /**
   * Generate suggested actions UI components
   */
  static generateActionButtons(actions: any[]): React['ReactNode'][] {
    return actions.map((action, index) => (
      <button
        key={index}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors mr-2 mb-2"
        onClick={() => this.handleAction(action)}
      >
        {action.label}
      </button>
    ));
  }

  /**
   * Handle suggested action clicks
   */
  static async handleAction(action: any) {
    switch (action.type) {
      case 'update_crm':
        // Update CRM record with enriched data
        if (process.env.NODE_ENV === 'development') {
          console.log('Updating CRM record:', action.data);
        }
        break;
        
      case 'add_to_speedrun':
        // Add contact to Speedrun queue
        if (process.env.NODE_ENV === 'development') {
          console.log('Adding to Speedrun:', action.data);
        }
        break;
        
      case 'add_to_pipeline':
        // Add to sales pipeline
        if (process.env.NODE_ENV === 'development') {
          console.log('Adding to pipeline:', action.data);
        }
        break;
        
      case 'map_buying_committee':
        // Generate buyer committee mapping
        if (process.env.NODE_ENV === 'development') {
          console.log('Mapping buying committee:', action.data);
        }
        break;
        
      case 'find_people':
        // Search for additional contacts
        if (process.env.NODE_ENV === 'development') {
          console.log('Finding contacts:', action.data);
        }
        break;
        
      default:
        if (process.env.NODE_ENV === 'development') {
          console.log('Unknown action type:', action.type);
        }
    }
  }

  /**
   * Determine user role from active sub-app
   */
  private static determineUserRole(activeSubApp: string): 'sdr' | 'ae' | 'cro' | 'marketing' | 'admin' {
    // Map sub-apps to likely user roles
    const roleMapping: Record<string, 'sdr' | 'ae' | 'cro' | 'marketing' | 'admin'> = {
      'speedrun': 'sdr',
      'pipeline': 'ae',
      'monaco': 'ae',
      'dashboard': 'cro',
      'analytics': 'cro'
    };
    
    return roleMapping[activeSubApp] || 'ae'; // Default to AE
  }

  /**
   * Map active sub-app to current view
   */
  private static mapCurrentView(activeSubApp: string): AIContext['currentView'] {
    const viewMapping: Record<string, AIContext['currentView']> = {
      'pipeline': 'pipeline',
      'monaco': 'monaco',
      'speedrun': 'speedrun',
      'company-profile': 'company-profile',
      'person-profile': 'person-profile'
    };
    
    return viewMapping[activeSubApp] || 'pipeline';
  }

  /**
   * Map record type to AI context type
   */
  private static mapRecordType(recordType: string): AIContext['currentRecord']['type'] {
    const typeMapping: Record<string, AIContext['currentRecord']['type']> = {
      'person': 'person',
      'contact': 'person',
      'lead': 'person',
      'company': 'company',
      'account': 'company',
      'opportunity': 'opportunity'
    };
    
    return typeMapping[recordType] || 'person';
  }

  /**
   * Extract recent searches from activity
   */
  private static extractRecentSearches(recentActivity: any[]): string[] {
    return recentActivity
      .filter(activity => activity['type'] === 'search')
      .map(activity => activity.query)
      .slice(0, 5);
  }

  /**
   * Extract recently viewed items from activity
   */
  private static extractRecentlyViewed(recentActivity: any[]): Array<{
    type: string;
    name: string;
    id: string;
    timestamp: Date;
  }> {
    return recentActivity
      .filter(activity => activity['type'] === 'view')
      .map(activity => ({
        type: activity.recordType,
        name: activity.recordName,
        id: activity.recordId,
        timestamp: new Date(activity.timestamp)
      }))
      .slice(0, 10);
  }

  /**
   * Format CoreSignal response for display
   */
  static formatResponse(response: string, data?: any): string {
    // Add formatting for better readability
    let formatted = response;
    
    // Add line breaks for better structure
    formatted = formatted.replace(/\n\n/g, '\n\n');
    
    // Format lists
    formatted = formatted.replace(/•/g, '•');
    
    return formatted;
  }

  /**
   * Detect if response contains actionable data
   */
  static hasActionableData(data: any): boolean {
    return data && (
      data.suggestedActions?.length > 0 ||
      data.missingStakeholders?.length > 0 ||
      data.enrichmentData
    );
  }
}
