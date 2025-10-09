/**
 * 🧮 RANKING CALCULATOR
 * 
 * Calculates ranking scores based on events and activities
 */

import type { RankingEvent, RankingConfig } from './types';
import { DEFAULT_EVENT_WEIGHTS } from './types';

export class RankingCalculator {
  
  /**
   * 🎯 Calculate event impact score
   */
  calculateEventImpact(event: RankingEvent, config: RankingConfig): number {
    const baseWeight = config.eventWeights[event.eventType] || DEFAULT_EVENT_WEIGHTS[event.eventType] || 1;
    
    // Apply time decay (newer events have higher impact)
    const timeDecay = this.calculateTimeDecay(event.timestamp, config.decayFactor);
    
    // Apply entity-specific multipliers
    const entityMultiplier = this.getEntityMultiplier(event.entityType);
    
    // Apply event data multipliers
    const dataMultiplier = this.getDataMultiplier(event.eventData);
    
    const impactScore = baseWeight * timeDecay * entityMultiplier * dataMultiplier;
    
    // Ensure score is within bounds
    return Math.max(config.minScore, Math.min(config.maxScore, impactScore));
  }

  /**
   * 📈 Calculate new ranking score
   */
  calculateNewScore(currentScore: number, impactScore: number, event: RankingEvent): number {
    // Different calculation strategies based on event type
    switch (event.eventType) {
      case 'email_replied':
      case 'meeting_scheduled':
      case 'opportunity_won':
        // Additive scoring for positive events
        return currentScore + impactScore;
        
      case 'email_opened':
      case 'email_clicked':
      case 'contact_viewed':
        // Moderate additive scoring for engagement
        return currentScore + (impactScore * 0.5);
        
      case 'email_sent':
      case 'contact_created':
        // Small additive scoring for basic activities
        return currentScore + (impactScore * 0.1);
        
      case 'opportunity_lost':
        // Subtractive scoring for negative events
        return Math.max(0, currentScore - impactScore);
        
      default:
        // Default additive scoring
        return currentScore + impactScore;
    }
  }

  /**
   * ⏰ Calculate time decay factor
   */
  private calculateTimeDecay(timestamp: Date, decayFactor: number): number {
    const now = new Date();
    const hoursSinceEvent = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    const daysSinceEvent = hoursSinceEvent / 24;
    
    // Exponential decay: newer events have higher impact
    return Math.pow(decayFactor, daysSinceEvent);
  }

  /**
   * 🎯 Get entity type multiplier
   */
  private getEntityMultiplier(entityType: string): number {
    const multipliers: Record<string, number> = {
      'opportunity': 1.5, // Opportunities are most important
      'lead': 1.2,       // Leads are important
      'contact': 1.0,     // Contacts are baseline
      'account': 0.8,     // Accounts are less directly actionable
      'company': 0.6      // Companies are least directly actionable
    };
    
    return multipliers[entityType] || 1.0;
  }

  /**
   * 📊 Get event data multiplier
   */
  private getDataMultiplier(eventData: Record<string, any>): number {
    let multiplier = 1.0;
    
    // Opportunity amount multiplier
    if (eventData.amount) {
      const amount = parseFloat(eventData.amount) || 0;
      if (amount > 100000) multiplier *= 1.5;
      else if (amount > 50000) multiplier *= 1.3;
      else if (amount > 10000) multiplier *= 1.1;
    }
    
    // Email engagement multiplier
    if (eventData.emailType) {
      switch (eventData.emailType) {
        case 'reply':
          multiplier *= 2.0;
          break;
        case 'click':
          multiplier *= 1.5;
          break;
        case 'open':
          multiplier *= 1.2;
          break;
      }
    }
    
    // Meeting type multiplier
    if (eventData.meetingType) {
      switch (eventData.meetingType) {
        case 'demo':
          multiplier *= 1.8;
          break;
        case 'discovery':
          multiplier *= 1.5;
          break;
        case 'follow_up':
          multiplier *= 1.2;
          break;
      }
    }
    
    // Stage progression multiplier
    if (eventData.stage) {
      const stageMultipliers: Record<string, number> = {
        'closed-won': 2.0,
        'proposal': 1.8,
        'negotiation': 1.6,
        'discovery': 1.4,
        'qualification': 1.2,
        'lead': 1.0
      };
      
      multiplier *= stageMultipliers[eventData.stage] || 1.0;
    }
    
    return multiplier;
  }

  /**
   * 🎯 Calculate composite ranking score
   */
  calculateCompositeScore(scores: number[], weights: number[] = []): number {
    if (scores.length === 0) return 0;
    
    // If no weights provided, use equal weighting
    const normalizedWeights = weights.length === scores.length 
      ? weights.map(w => w / weights.reduce((sum, w) => sum + w, 0))
      : scores.map(() => 1 / scores.length);
    
    // Calculate weighted average
    const weightedSum = scores.reduce((sum, score, index) => 
      sum + (score * normalizedWeights[index]), 0);
    
    return Math.round(weightedSum);
  }

  /**
   * 📊 Calculate ranking percentile
   */
  calculatePercentile(score: number, allScores: number[]): number {
    if (allScores.length === 0) return 0;
    
    const sortedScores = [...allScores].sort((a, b) => a - b);
    const rank = sortedScores.findIndex(s => s >= score);
    
    if (rank === -1) return 100; // Score is higher than all others
    if (rank === 0) return 0;    // Score is lower than all others
    
    return Math.round((rank / sortedScores.length) * 100);
  }
}
