/**
 * Daily Reset Service for Speedrun
 * 
 * Handles midnight reset functionality in user's timezone
 * - Clears completed records from state
 * - Resets daily progress counters
 * - Fetches fresh 50 records with updated rankings
 * - Preserves user settings and preferences
 */

import { prisma } from '@/lib/prisma';

export class DailyResetService {
  private static instance: DailyResetService;
  private resetCheckInterval: NodeJS.Timeout | null = null;
  private lastResetDate: string | null = null;

  private constructor() {
    this.initializeResetCheck();
  }

  public static getInstance(): DailyResetService {
    if (!DailyResetService.instance) {
      DailyResetService.instance = new DailyResetService();
    }
    return DailyResetService.instance;
  }

  /**
   * Initialize the reset check interval
   */
  private initializeResetCheck(): void {
    if (typeof window === 'undefined') {
      // Server-side, don't start interval
      return;
    }

    // Check every minute for midnight reset
    this.resetCheckInterval = setInterval(() => {
      this.checkForMidnightReset();
    }, 60000); // 60 seconds

    // Also check immediately on initialization
    this.checkForMidnightReset();
  }

  /**
   * Check if midnight has passed and reset is needed
   */
  private async checkForMidnightReset(): Promise<void> {
    try {
      // Get user's timezone from localStorage or default to UTC
      const userTimezone = localStorage.getItem('user-timezone') || 'UTC';
      const lastResetDate = localStorage.getItem('last-speedrun-reset');
      
      const now = new Date();
      const today = this.getDateInTimezone(now, userTimezone);
      const todayString = today.toDateString();

      // Check if we've already reset today
      if (lastResetDate === todayString) {
        return;
      }

      // Check if it's past midnight in user's timezone
      const currentHour = this.getHourInTimezone(now, userTimezone);
      if (currentHour >= 0 && currentHour < 1) {
        // It's between midnight and 1 AM, trigger reset
        await this.performDailyReset(userTimezone);
      }
    } catch (error) {
      console.error('❌ Error checking for midnight reset:', error);
    }
  }

  /**
   * Perform the daily reset
   */
  private async performDailyReset(userTimezone: string): Promise<void> {
    try {
      console.log(`🔄 Performing daily speedrun reset for timezone: ${userTimezone}`);
      
      const today = this.getDateInTimezone(new Date(), userTimezone);
      const todayString = today.toDateString();

      // Clear completed records from localStorage
      this.clearCompletedRecords();

      // Reset daily progress counters
      this.resetDailyProgress();

      // Update last reset date
      localStorage.setItem('last-speedrun-reset', todayString);
      this.lastResetDate = todayString;

      // Trigger fresh data fetch
      await this.fetchFreshSpeedrunData();

      console.log(`✅ Daily speedrun reset completed for ${todayString}`);
    } catch (error) {
      console.error('❌ Error performing daily reset:', error);
    }
  }

  /**
   * Clear completed records from localStorage
   */
  private clearCompletedRecords(): void {
    const today = new Date().toDateString();
    const keysToRemove = [
      `speedrun-completed-${today}`,
      `speedrun-skipped-${today}`,
      `speedrun-state-${today}`
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`🧹 Cleared completed records for ${today}`);
  }

  /**
   * Reset daily progress counters
   */
  private resetDailyProgress(): void {
    const today = new Date().toDateString();
    
    // Create fresh daily state
    const freshState = {
      date: today,
      viewedLeads: [],
      completedLeads: [],
      skippedLeads: [],
      snoozedLeads: [],
      removedLeads: [],
      totalLeadsGenerated: 0,
      currentBatch: 1,
      dailyTargetMet: false,
      weeklyTargetMet: false,
      // Reset bonus round state
      bonusRoundActive: false,
      bonusRoundCompleted: 0,
      bonusRoundTotal: 10,
      bonusRoundDeclined: false,
    };

    localStorage.setItem(`speedrun-state-${today}`, JSON.stringify(freshState));
    console.log(`📊 Reset daily progress counters for ${today}`);
  }

  /**
   * Fetch fresh speedrun data with updated rankings
   */
  private async fetchFreshSpeedrunData(): Promise<void> {
    try {
      // Get user context from localStorage or default values
      const userId = localStorage.getItem('user-id') || '';
      const workspaceId = localStorage.getItem('workspace-id') || '';

      // Trigger a re-ranking to get fresh data
      const response = await fetch('/api/v1/speedrun/re-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          completedCount: 0,
          triggerAutoFetch: true,
          isDailyReset: true
        }),
      });

      if (response.ok) {
        console.log(`✅ Successfully fetched fresh speedrun data after daily reset`);
        
        // Dispatch event to notify components of reset
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('speedrun-daily-reset'));
        }
      } else {
        console.error(`❌ Failed to fetch fresh speedrun data: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching fresh speedrun data:', error);
    }
  }

  /**
   * Get date in specific timezone
   */
  private getDateInTimezone(date: Date, timezone: string): Date {
    try {
      return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    } catch (error) {
      console.warn(`⚠️ Invalid timezone ${timezone}, using UTC`);
      return new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    }
  }

  /**
   * Get hour in specific timezone
   */
  private getHourInTimezone(date: Date, timezone: string): number {
    try {
      return new Date(date.toLocaleString('en-US', { timeZone: timezone })).getHours();
    } catch (error) {
      console.warn(`⚠️ Invalid timezone ${timezone}, using UTC`);
      return new Date(date.toLocaleString('en-US', { timeZone: 'UTC' })).getHours();
    }
  }

  /**
   * Set user timezone
   */
  public setUserTimezone(timezone: string): void {
    localStorage.setItem('user-timezone', timezone);
    console.log(`🌍 User timezone set to: ${timezone}`);
  }

  /**
   * Get user timezone
   */
  public getUserTimezone(): string {
    return localStorage.getItem('user-timezone') || 'UTC';
  }

  /**
   * Manually trigger reset (for testing or admin use)
   */
  public async manualReset(): Promise<void> {
    const timezone = this.getUserTimezone();
    await this.performDailyReset(timezone);
  }

  /**
   * Cleanup interval on component unmount
   */
  public destroy(): void {
    if (this.resetCheckInterval) {
      clearInterval(this.resetCheckInterval);
      this.resetCheckInterval = null;
    }
  }
}

// Export singleton instance
export const dailyResetService = DailyResetService.getInstance();
