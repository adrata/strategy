/**
 * 🏆 UNIFIED RANKING SYSTEM
 * 
 * Event-driven ranking system that updates system-wide ranks based on user activities.
 * Uses Redis sorted sets for high-performance ranking storage and database triggers
 * for immediate event detection.
 * 
 * Architecture:
 * Database Triggers → Event Queue → Ranking Engine → Redis Storage → UI Updates
 * 
 * Key Features:
 * - Event-driven updates (only when activities occur)
 * - High-performance ranking with Redis sorted sets
 * - System-wide ranking across all entities (contacts, leads, opportunities, accounts)
 * - Real-time updates via WebSocket
 * - Scalable message queue processing
 * - Single source of truth for all rankings
 */

export { RankingSystem } from './ranking-system';
export { RankingEventProcessor } from './event-processor';
export { 
  RANKING_EVENT_TYPES,
  EVENT_IMPACT_WEIGHTS,
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_PRIORITY_MAP
} from './event-types';
export { RankingStorage } from './ranking-storage';
export { RankingCalculator } from './ranking-calculator';

// Re-export types for external use
export type {
  RankingEvent,
  RankingUpdate,
  RankingScore,
  SystemRanking,
  RankingConfig
} from './types';
