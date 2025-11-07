"use client";

/**
 * Voice Interruption Handler
 * 
 * Handles mobile interruptions like:
 * - Phone calls
 * - App backgrounding
 * - Screen lock
 * - Notifications
 * - Page visibility changes
 */

export type InterruptionCallback = () => void;

export class VoiceInterruptionHandler {
  private onInterruption: InterruptionCallback | null = null;
  private onResume: InterruptionCallback | null = null;
  private visibilityListener: (() => void) | null = null;
  private beforeUnloadListener: ((e: BeforeUnloadEvent) => void) | null = null;

  /**
   * Start monitoring for interruptions
   */
  startMonitoring(onInterruption: InterruptionCallback, onResume?: InterruptionCallback): void {
    this.onInterruption = onInterruption;
    this.onResume = onResume || null;

    // Handle page visibility (mobile backgrounding, tab switching)
    this.visibilityListener = () => {
      if (document.hidden) {
        console.log('📱 Page hidden - pausing voice');
        if (this.onInterruption) {
          this.onInterruption();
        }
      } else {
        console.log('📱 Page visible - can resume voice');
        if (this.onResume) {
          this.onResume();
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityListener);

    // Handle page unload (navigation away)
    this.beforeUnloadListener = (e: BeforeUnloadEvent) => {
      if (this.onInterruption) {
        this.onInterruption();
      }
    };

    window.addEventListener('beforeunload', this.beforeUnloadListener);

    // Handle iOS-specific interruptions
    if (typeof window !== 'undefined') {
      // Handle phone calls on iOS
      window.addEventListener('pagehide', () => {
        console.log('📱 iOS pagehide - stopping voice');
        if (this.onInterruption) {
          this.onInterruption();
        }
      });

      // Handle resume on iOS
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          console.log('📱 iOS pageshow (from cache) - can resume');
          if (this.onResume) {
            this.onResume();
          }
        }
      });

      // Handle focus loss (iOS Safari)
      window.addEventListener('blur', () => {
        console.log('📱 Window blur - pausing voice');
        if (this.onInterruption) {
          this.onInterruption();
        }
      });

      // Handle focus gain
      window.addEventListener('focus', () => {
        console.log('📱 Window focus - can resume');
        if (this.onResume) {
          this.onResume();
        }
      });
    }

    console.log('👂 Voice interruption monitoring started');
  }

  /**
   * Stop monitoring for interruptions
   */
  stopMonitoring(): void {
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }

    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }

    // Clean up iOS listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.onInterruption || (() => {}));
      window.removeEventListener('pageshow', this.onResume || (() => {}));
      window.removeEventListener('blur', this.onInterruption || (() => {}));
      window.removeEventListener('focus', this.onResume || (() => {}));
    }

    this.onInterruption = null;
    this.onResume = null;

    console.log('👂 Voice interruption monitoring stopped');
  }

  /**
   * Check if page is currently visible
   */
  isPageVisible(): boolean {
    return typeof document !== 'undefined' && !document.hidden;
  }

  /**
   * Check if running on iOS
   */
  static isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }

  /**
   * Check if running on mobile
   */
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}

// Export singleton
export const voiceInterruptionHandler = new VoiceInterruptionHandler();

