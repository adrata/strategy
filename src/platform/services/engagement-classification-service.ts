/**
 * Engagement Classification Service
 * 
 * Classifies leads and prospects into engagement categories:
 * - ENGAGED: Active responses, high interaction, recent activity
 * - COLD: No recent responses, low engagement, minimal interaction
 * - NON_RESPONSIVE: Multiple attempts with no response
 * - NURTURING: Moderate engagement, periodic responses
 * - HOT: Very high engagement, ready to buy signals
 */

export interface EngagementClassification {
  category: 'HOT' | 'ENGAGED' | 'NURTURING' | 'COLD' | 'NON_RESPONSIVE';
  score: number; // 0-100
  confidence: number; // 0-1
  reason: string;
  lastActivityDate?: Date;
  daysSinceLastActivity: number;
  responseRate: number; // 0-1
  signals: EngagementSignal[];
}

export interface EngagementSignal {
  type: 'email_open' | 'email_click' | 'email_reply' | 'call_answered' | 'meeting_attended' | 'website_visit' | 'document_download' | 'demo_request' | 'pricing_inquiry' | 'referral_given';
  weight: number; // 1-10
  timestamp: Date;
  description: string;
}

export interface ContactData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  priority?: string;
  source?: string;
  activities?: ActivityData[];
  emailTracking?: EmailTrackingData[];
  createdAt: Date;
  lastContactDate?: Date;
  estimatedValue?: number;
  notes?: string;
  engagementLevel?: string; // existing field
}

export interface ActivityData {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  status: 'completed' | 'scheduled' | 'cancelled';
  createdAt: Date;
  description?: string;
  outcome?: 'positive' | 'negative' | 'neutral';
}

export interface EmailTrackingData {
  id: string;
  sentAt: Date;
  opened?: boolean;
  openedAt?: Date;
  clicked?: boolean;
  clickedAt?: Date;
  replied?: boolean;
  repliedAt?: Date;
  bounced?: boolean;
}

export class EngagementClassificationService {
  private static instance: EngagementClassificationService;

  public static getInstance(): EngagementClassificationService {
    if (!this.instance) {
      this['instance'] = new EngagementClassificationService();
    }
    return this.instance;
  }

  /**
   * Classify a contact's engagement level
   */
  public classifyEngagement(contact: ContactData): EngagementClassification {
    const signals = this.extractEngagementSignals(contact);
    const responseRate = this.calculateResponseRate(contact);
    const daysSinceLastActivity = this.calculateDaysSinceLastActivity(contact);
    const activityScore = this.calculateActivityScore(contact);
    const recentEngagementScore = this.calculateRecentEngagementScore(signals);
    
    // Calculate overall engagement score (0-100)
    const score = this.calculateOverallScore({
      activityScore,
      recentEngagementScore,
      responseRate,
      daysSinceLastActivity,
      signalStrength: this.calculateSignalStrength(signals),
      priorityBoost: this.getPriorityBoost(contact),
      valueBoost: this.getValueBoost(contact)
    });

    // Determine category based on score and specific criteria
    const category = this.determineCategory(score, signals, daysSinceLastActivity, responseRate);
    const confidence = this.calculateConfidence(signals, contact);
    const reason = this.generateReason(category, score, signals, daysSinceLastActivity, responseRate);

    return {
      category,
      score,
      confidence,
      reason,
      lastActivityDate: this.getLastActivityDate(contact),
      daysSinceLastActivity,
      responseRate,
      signals
    };
  }

  /**
   * Extract engagement signals from contact data
   */
  private extractEngagementSignals(contact: ContactData): EngagementSignal[] {
    const signals: EngagementSignal[] = [];

    // Process activities
    if (contact.activities) {
      for (const activity of contact.activities) {
        if (activity['type'] === 'email' && activity['outcome'] === 'positive') {
          signals.push({
            type: 'email_reply',
            weight: 8,
            timestamp: activity.createdAt,
            description: 'Replied to email'
          });
        } else if (activity['type'] === 'call' && activity['status'] === 'completed') {
          signals.push({
            type: 'call_answered',
            weight: 9,
            timestamp: activity.createdAt,
            description: 'Answered phone call'
          });
        } else if (activity['type'] === 'meeting' && activity['status'] === 'completed') {
          signals.push({
            type: 'meeting_attended',
            weight: 10,
            timestamp: activity.createdAt,
            description: 'Attended scheduled meeting'
          });
        }
      }
    }

    // Process email tracking
    if (contact.emailTracking) {
      for (const tracking of contact.emailTracking) {
        if (tracking.replied) {
          signals.push({
            type: 'email_reply',
            weight: 8,
            timestamp: tracking.repliedAt!,
            description: 'Replied to email'
          });
        } else if (tracking.clicked) {
          signals.push({
            type: 'email_click',
            weight: 6,
            timestamp: tracking.clickedAt!,
            description: 'Clicked email link'
          });
        } else if (tracking.opened) {
          signals.push({
            type: 'email_open',
            weight: 3,
            timestamp: tracking.openedAt!,
            description: 'Opened email'
          });
        }
      }
    }

    // Check for high-value signals in notes or status
    if (contact.notes) {
      const notes = contact.notes.toLowerCase();
      if (notes.includes('demo') || notes.includes('demonstration')) {
        signals.push({
          type: 'demo_request',
          weight: 9,
          timestamp: new Date(),
          description: 'Requested demo'
        });
      }
      if (notes.includes('pricing') || notes.includes('quote') || notes.includes('proposal')) {
        signals.push({
          type: 'pricing_inquiry',
          weight: 8,
          timestamp: new Date(),
          description: 'Inquired about pricing'
        });
      }
      if (notes.includes('referral') || notes.includes('referred')) {
        signals.push({
          type: 'referral_given',
          weight: 7,
          timestamp: new Date(),
          description: 'Provided referral'
        });
      }
    }

    return signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Calculate response rate based on activities
   */
  private calculateResponseRate(contact: ContactData): number {
    if (!contact.activities || contact['activities']['length'] === 0) {
      return 0;
    }

    const outboundAttempts = contact.activities.filter(a => 
      (a['type'] === 'email' || a['type'] === 'call') && a['status'] === 'completed'
    ).length;

    const responses = contact.activities.filter(a => 
      a['outcome'] === 'positive'
    ).length;

    if (outboundAttempts === 0) return 0;
    return responses / outboundAttempts;
  }

  /**
   * Calculate days since last activity
   */
  private calculateDaysSinceLastActivity(contact: ContactData): number {
    const lastActivityDate = this.getLastActivityDate(contact);
    if (!lastActivityDate) {
      return Math.floor((Date.now() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    }
    return Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get the most recent activity date
   */
  private getLastActivityDate(contact: ContactData): Date | undefined {
    let lastDate: Date | undefined;

    if (contact.lastContactDate) {
      lastDate = new Date(contact.lastContactDate);
    }

    if (contact['activities'] && contact.activities.length > 0) {
      const activityDate = new Date(Math.max(...contact.activities.map(a => a.createdAt.getTime())));
      if (!lastDate || activityDate > lastDate) {
        lastDate = activityDate;
      }
    }

    if (contact['emailTracking'] && contact.emailTracking.length > 0) {
      const emailDate = new Date(Math.max(...contact.emailTracking.map(e => e.sentAt.getTime())));
      if (!lastDate || emailDate > lastDate) {
        lastDate = emailDate;
      }
    }

    return lastDate;
  }

  /**
   * Calculate activity score based on frequency and recency
   */
  private calculateActivityScore(contact: ContactData): number {
    if (!contact.activities || contact['activities']['length'] === 0) {
      return 0;
    }

    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    let score = 0;

    // Recent activity boost
    const recentActivities = contact.activities.filter(a => a.createdAt.getTime() > sevenDaysAgo);
    score += recentActivities.length * 10;

    // Monthly activity consistency
    const monthlyActivities = contact.activities.filter(a => a.createdAt.getTime() > thirtyDaysAgo);
    score += monthlyActivities.length * 5;

    // Positive outcome boost
    const positiveActivities = contact.activities.filter(a => a['outcome'] === 'positive');
    score += positiveActivities.length * 15;

    return Math.min(score, 100);
  }

  /**
   * Calculate recent engagement score from signals
   */
  private calculateRecentEngagementScore(signals: EngagementSignal[]): number {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentSignals = signals.filter(s => s.timestamp.getTime() > sevenDaysAgo);

    if (recentSignals['length'] === 0) return 0;

    return Math.min(
      recentSignals.reduce((sum, signal) => sum + signal.weight, 0),
      50
    );
  }

  /**
   * Calculate signal strength
   */
  private calculateSignalStrength(signals: EngagementSignal[]): number {
    if (signals['length'] === 0) return 0;

    const highValueSignals = signals.filter(s => s.weight >= 7);
    const mediumValueSignals = signals.filter(s => s.weight >= 4 && s.weight < 7);
    
    return Math.min(
      (highValueSignals.length * 15) + (mediumValueSignals.length * 8) + (signals.length * 2),
      50
    );
  }

  /**
   * Get priority boost
   */
  private getPriorityBoost(contact: ContactData): number {
    if (contact['priority'] === 'high') return 15;
    if (contact['priority'] === 'medium') return 5;
    return 0;
  }

  /**
   * Get value boost based on estimated value
   */
  private getValueBoost(contact: ContactData): number {
    if (!contact.estimatedValue) return 0;
    
    if (contact.estimatedValue > 100000) return 15;
    if (contact.estimatedValue > 50000) return 10;
    if (contact.estimatedValue > 20000) return 5;
    return 0;
  }

  /**
   * Calculate overall engagement score
   */
  private calculateOverallScore(params: {
    activityScore: number;
    recentEngagementScore: number;
    responseRate: number;
    daysSinceLastActivity: number;
    signalStrength: number;
    priorityBoost: number;
    valueBoost: number;
  }): number {
    let score = 0;

    // Activity and engagement
    score += params['activityScore'] * 0.3;
    score += params['recentEngagementScore'] * 0.25;
    score += params['signalStrength'] * 0.2;

    // Response rate boost
    score += params['responseRate'] * 20;

    // Recency penalty
    if (params['daysSinceLastActivity'] > 30) {
      score -= Math.min(params['daysSinceLastActivity'] - 30, 30);
    }

    // Boosts
    score += params['priorityBoost'];
    score += params['valueBoost'];

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine engagement category
   */
  private determineCategory(
    score: number,
    signals: EngagementSignal[],
    daysSinceLastActivity: number,
    responseRate: number
  ): EngagementClassification['category'] {
    
    // HOT: Very high engagement, ready to buy signals
    if (score >= 80 || 
        signals.some(s => s['type'] === 'demo_request' || s['type'] === 'pricing_inquiry') ||
        (responseRate > 0.7 && daysSinceLastActivity < 7)) {
      return 'HOT';
    }

    // ENGAGED: Active responses, good interaction
    if (score >= 60 || 
        (responseRate > 0.4 && daysSinceLastActivity < 14) ||
        signals.some(s => s['type'] === 'email_reply' || s['type'] === 'call_answered')) {
      return 'ENGAGED';
    }

    // NURTURING: Moderate engagement, periodic responses
    if (score >= 40 || 
        (responseRate > 0.2 && daysSinceLastActivity < 30) ||
        signals.some(s => s['type'] === 'email_open' || s['type'] === 'email_click')) {
      return 'NURTURING';
    }

    // NON_RESPONSIVE: Multiple attempts with no response
    if (daysSinceLastActivity > 30 && responseRate === 0 && signals['length'] === 0) {
      return 'NON_RESPONSIVE';
    }

    // COLD: Low engagement, minimal interaction
    return 'COLD';
  }

  /**
   * Calculate confidence in the classification
   */
  private calculateConfidence(signals: EngagementSignal[], contact: ContactData): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (contact['activities'] && contact.activities.length > 5) confidence += 0.2;
    if (signals.length > 3) confidence += 0.15;
    if (contact['emailTracking'] && contact.emailTracking.length > 2) confidence += 0.1;

    // Recent data = higher confidence
    const daysSinceLastActivity = this.calculateDaysSinceLastActivity(contact);
    if (daysSinceLastActivity < 7) confidence += 0.1;
    else if (daysSinceLastActivity < 30) confidence += 0.05;

    return Math.min(1, confidence);
  }

  /**
   * Generate human-readable reason for classification
   */
  private generateReason(
    category: EngagementClassification['category'],
    score: number,
    signals: EngagementSignal[],
    daysSinceLastActivity: number,
    responseRate: number
  ): string {
    const responsePercent = Math.round(responseRate * 100);

    switch (category) {
      case 'HOT':
        if (signals.some(s => s['type'] === 'demo_request')) {
          return 'Requested demo - high buying intent';
        }
        if (signals.some(s => s['type'] === 'pricing_inquiry')) {
          return 'Inquired about pricing - ready to purchase';
        }
        return `Very high engagement (${score}/100) with ${responsePercent}% response rate`;

      case 'ENGAGED':
        if (responseRate > 0.5) {
          return `Actively responding (${responsePercent}% response rate) with recent interaction`;
        }
        return `Strong engagement (${score}/100) with recent activity`;

      case 'NURTURING':
        return `Moderate engagement (${score}/100) - suitable for nurturing campaigns`;

      case 'NON_RESPONSIVE':
        return `No response to multiple attempts over ${daysSinceLastActivity} days`;

      case 'COLD':
        if (daysSinceLastActivity > 60) {
          return `No recent activity (${daysSinceLastActivity} days) - needs re-engagement`;
        }
        return `Low engagement (${score}/100) with ${responsePercent}% response rate`;

      default:
        return `Engagement score: ${score}/100`;
    }
  }

  /**
   * Batch classify multiple contacts
   */
  public batchClassifyEngagement(contacts: ContactData[]): Map<string, EngagementClassification> {
    const results = new Map<string, EngagementClassification>();

    for (const contact of contacts) {
      try {
        const classification = this.classifyEngagement(contact);
        results.set(contact.id, classification);
      } catch (error) {
        console.error(`Error classifying engagement for contact ${contact.id}:`, error);
        // Provide default classification on error
        results.set(contact.id, {
          category: 'COLD',
          score: 0,
          confidence: 0.1,
          reason: 'Classification error',
          daysSinceLastActivity: 999,
          responseRate: 0,
          signals: []
        });
      }
    }

    return results;
  }

  /**
   * Filter contacts by engagement category
   */
  public filterByEngagement(
    contacts: ContactData[],
    targetCategories: EngagementClassification['category'][]
  ): ContactData[] {
    const classifications = this.batchClassifyEngagement(contacts);
    
    return contacts.filter(contact => {
      const classification = classifications.get(contact.id);
      return classification && targetCategories.includes(classification.category);
    });
  }

  /**
   * Get engagement statistics for a set of contacts
   */
  public getEngagementStats(contacts: ContactData[]): {
    total: number;
    hot: number;
    engaged: number;
    nurturing: number;
    cold: number;
    nonResponsive: number;
    averageScore: number;
  } {
    const classifications = this.batchClassifyEngagement(contacts);
    
    const stats = {
      total: contacts.length,
      hot: 0,
      engaged: 0,
      nurturing: 0,
      cold: 0,
      nonResponsive: 0,
      averageScore: 0
    };

    let totalScore = 0;

    for (const classification of classifications.values()) {
      totalScore += classification.score;
      
      switch (classification.category) {
        case 'HOT':
          stats.hot++;
          break;
        case 'ENGAGED':
          stats.engaged++;
          break;
        case 'NURTURING':
          stats.nurturing++;
          break;
        case 'COLD':
          stats.cold++;
          break;
        case 'NON_RESPONSIVE':
          stats.nonResponsive++;
          break;
      }
    }

    stats['averageScore'] = contacts.length > 0 ? totalScore / contacts.length : 0;

    return stats;
  }
}

// Export singleton instance
export const engagementClassifier = EngagementClassificationService.getInstance();
