/**
 * 🏆 RANKING SYSTEM TYPES
 * 
 * Type definitions for the unified event-driven ranking system
 */

export interface RankingEvent {
  id: string;
  workspaceId: string;
  userId: string;
  eventType: string;
  entityType: 'people' | 'leads' | 'opportunities' | 'companies' | 'prospects';
  entityId: string;
  eventData: Record<string, any>;
  impactScore: number;
  timestamp: Date;
  processed: boolean;
}

export interface RankingUpdate {
  entityId: string;
  entityType: string;
  oldRank: number;
  newRank: number;
  score: number;
  reason: string;
  timestamp: Date;
}

export interface RankingScore {
  entityId: string;
  entityType: string;
  score: number;
  rank: number;
  factors: RankingFactor[];
  lastUpdated: Date;
}

export interface RankingFactor {
  type: string;
  weight: number;
  value: number;
  description: string;
}

export interface SystemRanking {
  workspaceId: string;
  entityType: string;
  rankings: RankingScore[];
  lastCalculated: Date;
  totalEntities: number;
}

export interface RankingConfig {
  // Event weights for different activity types
  eventWeights: Record<string, number>;
  
  // Ranking calculation settings
  decayFactor: number; // How quickly scores decay over time
  maxScore: number; // Maximum possible score
  minScore: number; // Minimum possible score
  
  // Performance settings
  batchSize: number; // Number of events to process in one batch
  processingInterval: number; // Milliseconds between processing cycles
  
  // Redis settings
  redisKeyPrefix: string;
  rankingTtl: number; // Time to live for ranking data in seconds
}

export interface RankingMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  lastProcessedAt: Date;
  queueSize: number;
}

// Event types that trigger ranking updates
export const RANKING_EVENT_TYPES = {
  // Contact Activities
  CONTACT_CREATED: 'contact_created',
  CONTACT_UPDATED: 'contact_updated',
  CONTACT_VIEWED: 'contact_viewed',
  CONTACT_EMAILED: 'contact_emailed',
  CONTACT_CALLED: 'contact_called',
  CONTACT_MEETING_SCHEDULED: 'contact_meeting_scheduled',
  
  // Lead Activities
  LEAD_CREATED: 'lead_created',
  LEAD_QUALIFIED: 'lead_qualified',
  LEAD_CONVERTED: 'lead_converted',
  LEAD_COMPLETED: 'lead_completed',
  
  // Opportunity Activities
  OPPORTUNITY_CREATED: 'opportunity_created',
  OPPORTUNITY_STAGE_CHANGED: 'opportunity_stage_changed',
  OPPORTUNITY_AMOUNT_CHANGED: 'opportunity_amount_changed',
  OPPORTUNITY_WON: 'opportunity_won',
  OPPORTUNITY_LOST: 'opportunity_lost',
  
  // Account Activities
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  ACCOUNT_ENGAGED: 'account_engaged',
  
  // Email Engagement
  EMAIL_SENT: 'email_sent',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  EMAIL_REPLIED: 'email_replied',
  
  // External Signals
  BUYING_SIGNAL: 'buying_signal',
  COMPANY_NEWS: 'company_news',
  EXECUTIVE_CHANGE: 'executive_change',
  FUNDING_ROUND: 'funding_round'
} as const;

// Default event impact weights
export const DEFAULT_EVENT_WEIGHTS: Record<string, number> = {
  // High Impact Events (Major rank changes)
  [RANKING_EVENT_TYPES.OPPORTUNITY_WON]: 100,
  [RANKING_EVENT_TYPES.OPPORTUNITY_STAGE_CHANGED]: 50,
  [RANKING_EVENT_TYPES.EMAIL_REPLIED]: 40,
  [RANKING_EVENT_TYPES.CONTACT_MEETING_SCHEDULED]: 35,
  [RANKING_EVENT_TYPES.LEAD_CONVERTED]: 30,
  
  // Medium Impact Events (Moderate rank changes)
  [RANKING_EVENT_TYPES.EMAIL_OPENED]: 20,
  [RANKING_EVENT_TYPES.EMAIL_CLICKED]: 25,
  [RANKING_EVENT_TYPES.LEAD_QUALIFIED]: 30,
  [RANKING_EVENT_TYPES.CONTACT_VIEWED]: 10,
  [RANKING_EVENT_TYPES.CONTACT_EMAILED]: 15,
  [RANKING_EVENT_TYPES.CONTACT_CALLED]: 20,
  
  // Low Impact Events (Minor rank changes)
  [RANKING_EVENT_TYPES.EMAIL_SENT]: 5,
  [RANKING_EVENT_TYPES.CONTACT_CREATED]: 3,
  [RANKING_EVENT_TYPES.ACCOUNT_UPDATED]: 2,
  [RANKING_EVENT_TYPES.LEAD_CREATED]: 5,
  [RANKING_EVENT_TYPES.OPPORTUNITY_CREATED]: 8
};
