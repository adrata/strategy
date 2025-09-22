/**
 * 🎯 ACCURATE TARGET CALCULATOR
 * 
 * Calculates realistic daily and weekly targets based on:
 * - Historical performance data
 * - Current pipeline activity 
 * - Real outreach metrics
 * - Qualification scores from actual activities
 */

import { TodayActivityTracker } from "./TodayActivityTracker";

export interface AccurateTargets {
  completedToday: number; // Number of contacts completed today (0-50)
  people: number; // Current active prospects
  dailyTarget: number; // Realistic daily target based on performance
  weeklyTarget: number; // Realistic weekly target 
  dailyProgress: number; // Current daily progress
  weeklyProgress: number; // Current weekly progress
}

export interface PerformanceMetrics {
  emailsSentToday: number;
  callsMadeToday: number;
  meetingsScheduledToday: number;
  repliesReceivedToday: number;
  emailsSentThisWeek: number;
  callsMadeThisWeek: number;
  meetingsScheduledThisWeek: number;
  repliesReceivedThisWeek: number;
  totalProspectsContacted: number;
  averageDailyActivity: number;
  conversionRate: number; // percentage of outreach that gets responses
}

export class AccurateTargetCalculator {
  
  /**
   * 🎯 Calculate accurate targets based on real performance data
   */
  static async calculateAccurateTargets(): Promise<AccurateTargets> {
    const performanceMetrics = this.getPerformanceMetrics();
    const completedToday = TodayActivityTracker.getCompletedContactsToday(); // Track completed contacts
    const { dailyTarget, weeklyTarget } = this.calculateSmartTargets(performanceMetrics);
    const { dailyProgress, weeklyProgress } = this.calculateProgress(performanceMetrics, dailyTarget, weeklyTarget);
    
    return {
      completedToday,
      people: 30, // Fixed to match daily target
      dailyTarget: 30, // Fixed daily target
      weeklyTarget: 0, // Removed weekly target
      dailyProgress,
      weeklyProgress: 0 // Removed weekly progress
    };
  }

  /**
   * 📊 Get real performance metrics from activity tracking
   */
  private static getPerformanceMetrics(): PerformanceMetrics {
    const todayActivities = TodayActivityTracker.getTodayActivities();
    const weekActivities = this.getThisWeekActivities();
    
    // Count today's activities
    const emailsSentToday = todayActivities.filter(a => a['activityType'] === 'email').length;
    const callsMadeToday = todayActivities.filter(a => a['activityType'] === 'call').length;
    const meetingsScheduledToday = todayActivities.filter(a => a['activityType'] === 'meeting').length;
    const repliesReceivedToday = todayActivities.filter(a => a.outcome?.includes('reply')).length;
    
    // Count this week's activities
    const emailsSentThisWeek = weekActivities.filter(a => a['activityType'] === 'email').length;
    const callsMadeThisWeek = weekActivities.filter(a => a['activityType'] === 'call').length;
    const meetingsScheduledThisWeek = weekActivities.filter(a => a['activityType'] === 'meeting').length;
    const repliesReceivedThisWeek = weekActivities.filter(a => a.outcome?.includes('reply')).length;
    
    // Calculate totals and averages
    const totalProspectsContacted = new Set(weekActivities.map(a => a.leadId)).size;
    const daysThisWeek = this.getWorkingDaysThisWeek();
    const averageDailyActivity = emailsSentThisWeek / Math.max(daysThisWeek, 1);
    const conversionRate = emailsSentThisWeek > 0 ? (repliesReceivedThisWeek / emailsSentThisWeek) * 100 : 0;
    
    return {
      emailsSentToday,
      callsMadeToday,
      meetingsScheduledToday,
      repliesReceivedToday,
      emailsSentThisWeek,
      callsMadeThisWeek,
      meetingsScheduledThisWeek,
      repliesReceivedThisWeek,
      totalProspectsContacted,
      averageDailyActivity,
      conversionRate
    };
  }

  /**
   * 🏆 Calculate qualification score based on activity quality
   */
  private static calculateQualificationScore(metrics: PerformanceMetrics): number {
    let score = 0;
    
    // Base score from activity volume (0-40 points)
    const activityScore = Math.min((metrics.emailsSentToday + metrics.callsMadeToday * 2) * 4, 40);
    score += activityScore;
    
    // Quality score from conversions (0-30 points)
    const qualityScore = Math.min(metrics.conversionRate * 3, 30);
    score += qualityScore;
    
    // Engagement score from meetings/calls (0-20 points)
    const engagementScore = Math.min((metrics.meetingsScheduledToday * 10) + (metrics.callsMadeToday * 5), 20);
    score += engagementScore;
    
    // Consistency score from weekly performance (0-10 points)
    const consistencyScore = metrics.averageDailyActivity >= 5 ? 10 : metrics.averageDailyActivity * 2;
    score += consistencyScore;
    
    return Math.round(Math.min(score, 100));
  }

  /**
   * 🎯 Use fixed targets for consistent goal tracking
   */
  private static calculateSmartTargets(metrics: PerformanceMetrics): { dailyTarget: number; weeklyTarget: number } {
    // Use fixed targets for Speedrun - these are the actual goals
    return {
      dailyTarget: 40,  // 40 people per day target
      weeklyTarget: 200 // 200 people per week target
    };
  }

  /**
   * 📈 Calculate current progress against targets (actual counts, not percentages)
   */
  private static calculateProgress(
    metrics: PerformanceMetrics, 
    dailyTarget: number, 
    weeklyTarget: number
  ): { dailyProgress: number; weeklyProgress: number } {
    const totalDailyActivity = metrics.emailsSentToday + metrics.callsMadeToday + metrics.meetingsScheduledToday;
    const totalWeeklyActivity = metrics.emailsSentThisWeek + metrics.callsMadeThisWeek + metrics.meetingsScheduledThisWeek;
    
    // Return actual counts, not percentages
    return {
      dailyProgress: totalDailyActivity,     // Actual outreach today (0 for Dano)
      weeklyProgress: totalWeeklyActivity    // Actual outreach this week (0 for Dano)
    };
  }

  /**
   * 📅 Get activities from this week
   */
  private static getThisWeekActivities(): Array<{
    leadId: string;
    activityType: "email" | "call" | "message" | "meeting";
    timestamp: Date;
    outcome?: string;
  }> {
    const activities: any[] = [];
    const today = new Date();
    
    // Get Monday of this week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() - 1));
    
    // Check each day this week
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const checkDate = new Date(monday);
      checkDate.setDate(monday.getDate() + i);
      const dateString = checkDate.toDateString();
      
      try {
        const stored = localStorage.getItem(`today-activities-${dateString}`);
        if (stored) {
          const dayActivities = JSON.parse(stored);
          activities.push(...dayActivities);
        }
      } catch (error) {
        console.warn(`Could not load activities for ${dateString}:`, error);
      }
    }
    
    return activities;
  }

  /**
   * 📊 Get number of working days elapsed this week
   */
  private static getWorkingDaysThisWeek(): number {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // If it's weekend, return 5 (full work week)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 5;
    }
    
    // Return number of weekdays including today
    return dayOfWeek; // Monday = 1, Tuesday = 2, etc.
  }

  /**
   * 🔄 Update targets based on real-time performance
   */
  static async updateTargetsWithRealTimeData(): Promise<AccurateTargets> {
    const targets = await this.calculateAccurateTargets();
    
    // Store updated targets for persistence
    try {
      localStorage.setItem('accurate-targets', JSON.stringify({
        ...targets,
        lastUpdated: new Date().toISOString()
      }));
      
      console.log('🎯 AccurateTargetCalculator: Updated targets with real-time data:', targets);
    } catch (error) {
      console.error('❌ AccurateTargetCalculator: Failed to store updated targets:', error);
    }
    
    return targets;
  }

  /**
   * 📱 Get cached targets or calculate fresh ones
   */
  static async getCachedOrFreshTargets(): Promise<AccurateTargets> {
    try {
      const cached = localStorage.getItem('accurate-targets');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const lastUpdated = new Date(parsedCache.lastUpdated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // Use cached data if less than 1 hour old
        if (lastUpdated > oneHourAgo) {
          console.log('🎯 AccurateTargetCalculator: Using cached targets');
          return parsedCache;
        }
      }
    } catch (error) {
      console.warn('⚠️ AccurateTargetCalculator: Could not load cached targets:', error);
    }
    
    // Calculate fresh targets
    console.log('🎯 AccurateTargetCalculator: Calculating fresh targets');
    return await this.updateTargetsWithRealTimeData();
  }
}
