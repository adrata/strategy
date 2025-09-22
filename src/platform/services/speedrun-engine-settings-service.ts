import { SpeedrunOptimizationSettings } from '@/platform/ui/components/SpeedrunEngineOptimizer';
import { SpeedrunUserSettings } from '@/products/speedrun/types';

export class SpeedrunEngineSettingsService {
  private static readonly SETTINGS_KEY = 'speedrun-engine-settings';
  private static readonly USER_SETTINGS_KEY = 'speedrun-user-settings';

  /**
   * Apply optimizer settings to the speedrun engine
   */
  static async applyOptimizationSettings(settings: SpeedrunOptimizationSettings): Promise<void> {
    try {
      console.log('🎯 SpeedrunEngineSettingsService: Applying optimization settings', settings);
      
      // 1. Save optimization settings to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      }

      // 2. Convert to speedrun user settings format
      const userSettings: Partial<SpeedrunUserSettings> = {
        dailyTarget: settings.dailyTarget,
        weeklyTarget: settings.weeklyTarget,
        strategy: this.mapMethodologyToStrategy(settings.methodology),
      };

      // 3. Save user settings
      if (typeof window !== 'undefined') {
        const existingUserSettings = this.getUserSettings();
        const updatedUserSettings = { ...existingUserSettings, ...userSettings };
        localStorage.setItem(this.USER_SETTINGS_KEY, JSON.stringify(updatedUserSettings));
      }

      // 4. Update daily progress targets
      await this.updateDailyProgressTargets(settings.dailyTarget, settings.weeklyTarget);

      // 5. Apply auto-progression settings
      await this.updateAutoProgressionSettings(settings.autoProgressToNextBatch, settings.batchSize);

      console.log('✅ SpeedrunEngineSettingsService: Settings applied successfully');
      
      // 6. Trigger a refresh of the speedrun data to apply new rankings
      this.triggerSpeedrunRefresh();
      
    } catch (error) {
      console.error('❌ SpeedrunEngineSettingsService: Failed to apply settings', error);
      throw error;
    }
  }

  /**
   * Get current optimization settings
   */
  static getOptimizationSettings(): SpeedrunOptimizationSettings | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to parse optimization settings:', error);
      return null;
    }
  }

  /**
   * Get current user settings
   */
  static getUserSettings(): SpeedrunUserSettings {
    if (typeof window === 'undefined') {
      return {
        weeklyTarget: 250,
        dailyTarget: 30,
        strategy: 'optimal',
        role: 'AE',
        quota: 1000000,
        pipelineHealth: 'healthy',
      };
    }
    
    try {
      const stored = localStorage.getItem(this.USER_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse user settings:', error);
    }
    
    // Return defaults
    return {
      weeklyTarget: 250,
      dailyTarget: 30,
      strategy: 'optimal',
      role: 'AE',
      quota: 1000000,
      pipelineHealth: 'healthy',
    };
  }

  /**
   * Update daily progress targets
   */
  private static async updateDailyProgressTargets(dailyTarget: number, weeklyTarget: number): Promise<void> {
    try {
      // Update the daily speedrun state with new targets
      const today = new Date().toDateString();
      const stateKey = `speedrun-state-${today}`;
      
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(stateKey);
        if (stored) {
          const state = JSON.parse(stored);
          // Don't override existing progress, just update targets
          const updatedState = {
            ...state,
            dailyTarget,
            weeklyTarget,
            dailyTargetMet: state.completedLeads?.length >= dailyTarget,
            weeklyTargetMet: false, // Would need weekly calculation
          };
          localStorage.setItem(stateKey, JSON.stringify(updatedState));
        }
      }

      console.log(`📊 Updated daily target to ${dailyTarget}, weekly target to ${weeklyTarget}`);
    } catch (error) {
      console.error('Failed to update daily progress targets:', error);
    }
  }

  /**
   * Update auto-progression settings
   */
  private static async updateAutoProgressionSettings(autoProgress: boolean, batchSize: number): Promise<void> {
    try {
      const progressionSettings = {
        autoProgressToNextBatch: autoProgress,
        batchSize,
        lastUpdated: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('speedrun-auto-progression', JSON.stringify(progressionSettings));
      }

      console.log(`🔄 Updated auto-progression: ${autoProgress ? 'enabled' : 'disabled'}, batch size: ${batchSize}`);
    } catch (error) {
      console.error('Failed to update auto-progression settings:', error);
    }
  }

  /**
   * Check if next batch should be auto-loaded
   */
  static shouldAutoLoadNextBatch(): { enabled: boolean; batchSize: number } {
    if (typeof window === 'undefined') {
      return { enabled: true, batchSize: 50 };
    }

    try {
      const stored = localStorage.getItem('speedrun-auto-progression');
      if (stored) {
        const settings = JSON.parse(stored);
        return {
          enabled: settings.autoProgressToNextBatch || true,
          batchSize: settings.batchSize || 50,
        };
      }
    } catch (error) {
      console.warn('Failed to parse auto-progression settings:', error);
    }

    return { enabled: true, batchSize: 50 };
  }

  /**
   * Map methodology to strategy
   */
  private static mapMethodologyToStrategy(methodology: string): 'optimal' | 'speed' | 'revenue' {
    switch (methodology) {
      case 'proactive':
        return 'speed';
      case 'meddpicc':
        return 'revenue';
      case 'sandler':
      case 'adaptive':
      default:
        return 'optimal';
    }
  }

  /**
   * Trigger speedrun refresh to apply new settings
   */
  private static triggerSpeedrunRefresh(): void {
    try {
      // Set a flag that the data loader can check
      if (typeof window !== 'undefined') {
        localStorage.setItem('speedrun-settings-changed', Date.now().toString());
        
        // Dispatch a custom event for components to listen to
        window.dispatchEvent(new CustomEvent('speedrunSettingsChanged', {
          detail: { timestamp: Date.now() }
        }));
      }
    } catch (error) {
      console.error('Failed to trigger speedrun refresh:', error);
    }
  }

  /**
   * Check if daily target is met and should trigger next batch
   */
  static checkDailyTargetAndTriggerNextBatch(): boolean {
    try {
      const today = new Date().toDateString();
      const stateKey = `speedrun-state-${today}`;
      const userSettings = this.getUserSettings();
      const autoSettings = this.shouldAutoLoadNextBatch();

      if (!autoSettings.enabled) {
        return false;
      }

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(stateKey);
        if (stored) {
          const state = JSON.parse(stored);
          const completedCount = state.completedLeads?.length || 0;
          
          if (completedCount >= userSettings.dailyTarget) {
            console.log(`🎯 Daily target of ${userSettings.dailyTarget} met! Triggering next batch of ${autoSettings.batchSize} leads...`);
            
            // Set flag for next batch loading
            localStorage.setItem('speedrun-load-next-batch', JSON.stringify({
              triggered: true,
              batchSize: autoSettings.batchSize,
              timestamp: Date.now(),
            }));

            // Dispatch event
            window.dispatchEvent(new CustomEvent('speedrunLoadNextBatch', {
              detail: { 
                batchSize: autoSettings.batchSize,
                dailyTarget: userSettings.dailyTarget,
                completedCount,
              }
            }));

            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check daily target:', error);
      return false;
    }
  }

  /**
   * Clear next batch loading flag
   */
  static clearNextBatchFlag(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('speedrun-load-next-batch');
    }
  }

  /**
   * Check if next batch should be loaded
   */
  static shouldLoadNextBatch(): { shouldLoad: boolean; batchSize: number } {
    if (typeof window === 'undefined') {
      return { shouldLoad: false, batchSize: 50 };
    }

    try {
      const stored = localStorage.getItem('speedrun-load-next-batch');
      if (stored) {
        const flag = JSON.parse(stored);
        const isRecent = Date.now() - flag.timestamp < 60000; // 1 minute
        
        return {
          shouldLoad: flag['triggered'] && isRecent,
          batchSize: flag.batchSize || 50,
        };
      }
    } catch (error) {
      console.warn('Failed to check next batch flag:', error);
    }

    return { shouldLoad: false, batchSize: 50 };
  }
}
