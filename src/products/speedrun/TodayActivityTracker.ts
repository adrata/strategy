/**
 * 🚨 TODAY ACTIVITY TRACKER
 * 
 * Tracks all outreach activities for today to ensure Smart Ranking
 * properly deprioritizes prospects and companies already contacted.
 * 
 * Critical for preventing duplicate outreach on the same day.
 */

export interface TodayActivity {
  leadId: string;
  prospectName: string;
  company: string;
  activityType: "email" | "call" | "message" | "meeting";
  timestamp: Date;
  outcome?: string;
}

export class TodayActivityTracker {
  private static STORAGE_KEY_PREFIX = "today-activities";
  
  /**
   * Record that a prospect was contacted today
   */
  static recordActivity(activity: TodayActivity): void {
    const today = new Date().toDateString();
    const key = `${this.STORAGE_KEY_PREFIX}-${today}`;
    
    try {
      const stored = localStorage.getItem(key);
      const activities: TodayActivity[] = stored ? JSON.parse(stored) : [];
      
      // Add new activity
      activities.push({
        ...activity,
        timestamp: new Date()
      });
      
      localStorage.setItem(key, JSON.stringify(activities));
      
      console.log(`🚨 TodayActivityTracker: Recorded ${activity.activityType} to ${activity.prospectName} at ${activity.company}`);
      
      // Also add to legacy smartrank-completed for backward compatibility
      const legacyKey = `smartrank-completed-${today}`;
      const legacyStored = localStorage.getItem(legacyKey);
      const completed = new Set(legacyStored ? JSON.parse(legacyStored) : []);
      completed.add(activity.leadId);
      localStorage.setItem(legacyKey, JSON.stringify([...completed]));
      
    } catch (error) {
      console.error("❌ TodayActivityTracker: Error recording activity:", error);
    }
  }
  
  /**
   * Check if a prospect was contacted today
   */
  static wasContactedToday(leadId: string): boolean {
    const today = new Date().toDateString();
    const key = `${this.STORAGE_KEY_PREFIX}-${today}`;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return false;
      
      const activities: TodayActivity[] = JSON.parse(stored);
      return activities.some(activity => activity['leadId'] === leadId);
    } catch {
      return false;
    }
  }
  
  /**
   * Get all companies contacted today
   */
  static getCompaniesContactedToday(): Set<string> {
    const today = new Date().toDateString();
    const key = `${this.STORAGE_KEY_PREFIX}-${today}`;
    const companies = new Set<string>();
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return companies;
      
      const activities: TodayActivity[] = JSON.parse(stored);
      activities.forEach(activity => {
        companies.add(activity.company);
      });
      
      return companies;
    } catch {
      return companies;
    }
  }
  
  /**
   * Get all activities for today
   */
  static getTodayActivities(): TodayActivity[] {
    const today = new Date().toDateString();
    const key = `${this.STORAGE_KEY_PREFIX}-${today}`;
    
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Get count of activities by type for today
   */
  static getTodayActivityCounts(): Record<string, number> {
    const activities = this.getTodayActivities();
    const counts: Record<string, number> = {
      email: 0,
      call: 0,
      message: 0,
      meeting: 0,
      total: 0
    };
    
    activities.forEach(activity => {
      counts[activity.activityType] = (counts[activity.activityType] || 0) + 1;
      counts.total++;
    });
    
    return counts;
  }
  
  /**
   * Get number of completed contacts today (for daily target tracking)
   */
  static getCompletedContactsToday(): number {
    const activities = this.getTodayActivities();
    // Count unique prospects contacted today (not activities)
    const uniqueContacts = new Set(activities.map(activity => activity.leadId));
    return uniqueContacts.size;
  }
  
  /**
   * Record email sent
   */
  static recordEmailSent(leadId: string, prospectName: string, company: string, outcome?: string): void {
    this.recordActivity({
      leadId,
      prospectName,
      company,
      activityType: "email",
      timestamp: new Date(),
      outcome
    });
  }
  
  /**
   * Record call made
   */
  static recordCallMade(leadId: string, prospectName: string, company: string, outcome?: string): void {
    this.recordActivity({
      leadId,
      prospectName,
      company,
      activityType: "call",
      timestamp: new Date(),
      outcome
    });
  }
  
  /**
   * Record message sent (LinkedIn, etc.)
   */
  static recordMessageSent(leadId: string, prospectName: string, company: string, outcome?: string): void {
    this.recordActivity({
      leadId,
      prospectName,
      company,
      activityType: "message",
      timestamp: new Date(),
      outcome
    });
  }
  
  /**
   * Clear today's data (for testing/reset)
   */
  static clearTodayData(): void {
    const today = new Date().toDateString();
    const key = `${this.STORAGE_KEY_PREFIX}-${today}`;
    const legacyKey = `smartrank-completed-${today}`;
    
    localStorage.removeItem(key);
    localStorage.removeItem(legacyKey);
    
    console.log("🧹 TodayActivityTracker: Cleared today's activity data");
  }
  
  /**
   * Get activity summary for display
   */
  static getTodayActivitySummary(): string {
    const counts = this.getTodayActivityCounts();
    const companies = this.getCompaniesContactedToday();
    
    return `📊 Today: ${counts.total} activities (${counts.email} emails, ${counts.call} calls) across ${companies.size} companies`;
  }
}
