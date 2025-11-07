"use client";

/**
 * Voice Recognition Monitoring Service
 * 
 * Tracks and reports voice recognition performance metrics:
 * - Recognition accuracy (confidence scores)
 * - Latency (speech-to-text time)
 * - Error rates
 * - Audio quality
 * - User corrections (implicit feedback)
 */

export interface VoiceMetric {
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metric: 'recognition' | 'latency' | 'error' | 'quality' | 'correction';
  value: number;
  metadata?: Record<string, any>;
}

export interface VoiceSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  recognitionEngine: 'deepgram' | 'web-speech';
  audioQualityAvg: number;
  confidenceAvg: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorCount: number;
  transcriptCount: number;
  correctionCount: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0, percentage of events to track
  batchSize: number;
  flushInterval: number; // milliseconds
  endpoint?: string; // API endpoint to send metrics
}

class VoiceMonitoringService {
  private config: MonitoringConfig = {
    enabled: true,
    sampleRate: 1.0, // Track 100% in development, can reduce in production
    batchSize: 50,
    flushInterval: 30000, // 30 seconds
  };

  private metrics: VoiceMetric[] = [];
  private currentSession: VoiceSession | null = null;
  private sessionMetrics: Map<string, VoiceMetric[]> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Set up periodic flushing
    if (typeof window !== 'undefined') {
      this.startFlushTimer();
    }
  }

  /**
   * Configure monitoring service
   */
  configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart flush timer with new interval
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Start a new voice recognition session
   */
  startSession(userId?: string, engine: 'deepgram' | 'web-speech' = 'deepgram'): string {
    const sessionId = this.generateSessionId();
    
    this.currentSession = {
      sessionId,
      userId,
      startTime: new Date(),
      recognitionEngine: engine,
      audioQualityAvg: 0,
      confidenceAvg: 0,
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      errorCount: 0,
      transcriptCount: 0,
      correctionCount: 0
    };

    this.sessionMetrics.set(sessionId, []);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Voice session started: ${sessionId} (${engine})`);
    }

    return sessionId;
  }

  /**
   * End current voice recognition session
   */
  endSession(): VoiceSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    
    // Calculate session statistics
    const sessionId = this.currentSession.sessionId;
    const metrics = this.sessionMetrics.get(sessionId) || [];
    
    if (metrics.length > 0) {
      // Calculate averages and percentiles
      const confidenceMetrics = metrics.filter(m => m.metric === 'recognition');
      const latencyMetrics = metrics.filter(m => m.metric === 'latency');
      const qualityMetrics = metrics.filter(m => m.metric === 'quality');
      
      if (confidenceMetrics.length > 0) {
        this.currentSession.confidenceAvg = 
          confidenceMetrics.reduce((sum, m) => sum + m.value, 0) / confidenceMetrics.length;
      }
      
      if (latencyMetrics.length > 0) {
        const latencies = latencyMetrics.map(m => m.value).sort((a, b) => a - b);
        this.currentSession.latencyP50 = this.percentile(latencies, 50);
        this.currentSession.latencyP95 = this.percentile(latencies, 95);
        this.currentSession.latencyP99 = this.percentile(latencies, 99);
      }
      
      if (qualityMetrics.length > 0) {
        this.currentSession.audioQualityAvg = 
          qualityMetrics.reduce((sum, m) => sum + m.value, 0) / qualityMetrics.length;
      }
    }

    const session = { ...this.currentSession };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Voice session ended:', {
        sessionId: session.sessionId,
        duration: session.endTime && session.startTime 
          ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 
          : 0,
        transcripts: session.transcriptCount,
        avgConfidence: session.confidenceAvg.toFixed(2),
        latencyP95: session.latencyP95.toFixed(0) + 'ms',
        errors: session.errorCount
      });
    }

    // Send session data
    this.sendSessionData(session);
    
    // Clean up
    this.sessionMetrics.delete(sessionId);
    this.currentSession = null;
    
    return session;
  }

  /**
   * Track recognition accuracy
   */
  trackRecognition(confidence: number, metadata?: Record<string, any>): void {
    if (!this.shouldSample()) return;

    this.addMetric({
      timestamp: new Date(),
      sessionId: this.currentSession?.sessionId || 'unknown',
      userId: this.currentSession?.userId,
      metric: 'recognition',
      value: confidence,
      metadata
    });

    if (this.currentSession) {
      this.currentSession.transcriptCount++;
    }
  }

  /**
   * Track recognition latency
   */
  trackLatency(latencyMs: number, metadata?: Record<string, any>): void {
    if (!this.shouldSample()) return;

    this.addMetric({
      timestamp: new Date(),
      sessionId: this.currentSession?.sessionId || 'unknown',
      userId: this.currentSession?.userId,
      metric: 'latency',
      value: latencyMs,
      metadata
    });
  }

  /**
   * Track recognition error
   */
  trackError(errorType: string, metadata?: Record<string, any>): void {
    this.addMetric({
      timestamp: new Date(),
      sessionId: this.currentSession?.sessionId || 'unknown',
      userId: this.currentSession?.userId,
      metric: 'error',
      value: 1,
      metadata: { ...metadata, errorType }
    });

    if (this.currentSession) {
      this.currentSession.errorCount++;
    }
  }

  /**
   * Track audio quality
   */
  trackAudioQuality(qualityScore: number, metadata?: Record<string, any>): void {
    if (!this.shouldSample()) return;

    this.addMetric({
      timestamp: new Date(),
      sessionId: this.currentSession?.sessionId || 'unknown',
      userId: this.currentSession?.userId,
      metric: 'quality',
      value: qualityScore,
      metadata
    });
  }

  /**
   * Track user correction (implicit feedback)
   */
  trackCorrection(originalText: string, correctedText: string): void {
    this.addMetric({
      timestamp: new Date(),
      sessionId: this.currentSession?.sessionId || 'unknown',
      userId: this.currentSession?.userId,
      metric: 'correction',
      value: this.calculateEditDistance(originalText, correctedText),
      metadata: { originalText, correctedText }
    });

    if (this.currentSession) {
      this.currentSession.correctionCount++;
    }
  }

  /**
   * Get current session statistics
   */
  getCurrentSessionStats(): Partial<VoiceSession> | null {
    if (!this.currentSession) return null;

    const sessionId = this.currentSession.sessionId;
    const metrics = this.sessionMetrics.get(sessionId) || [];
    
    const confidenceMetrics = metrics.filter(m => m.metric === 'recognition');
    const latencyMetrics = metrics.filter(m => m.metric === 'latency');
    
    return {
      sessionId,
      recognitionEngine: this.currentSession.recognitionEngine,
      transcriptCount: this.currentSession.transcriptCount,
      errorCount: this.currentSession.errorCount,
      confidenceAvg: confidenceMetrics.length > 0
        ? confidenceMetrics.reduce((sum, m) => sum + m.value, 0) / confidenceMetrics.length
        : 0,
      latencyP95: latencyMetrics.length > 0
        ? this.percentile(latencyMetrics.map(m => m.value).sort((a, b) => a - b), 95)
        : 0
    };
  }

  /**
   * Add metric to buffer
   */
  private addMetric(metric: VoiceMetric): void {
    if (!this.config.enabled) return;

    this.metrics.push(metric);
    
    // Add to session metrics
    const sessionMetrics = this.sessionMetrics.get(metric.sessionId);
    if (sessionMetrics) {
      sessionMetrics.push(metric);
    }

    // Flush if batch size reached
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Check if metric should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Calculate edit distance (Levenshtein distance)
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // deletion
            dp[i][j - 1] + 1,    // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Flush metrics to storage/endpoint
   */
  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      // Send to endpoint if configured
      if (this.config.endpoint) {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metrics: metricsToSend,
            timestamp: new Date().toISOString()
          })
        });
      } else {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Voice metrics (${metricsToSend.length}):`, {
            avgConfidence: this.calculateAverage(metricsToSend, 'recognition'),
            avgLatency: this.calculateAverage(metricsToSend, 'latency'),
            errorCount: metricsToSend.filter(m => m.metric === 'error').length
          });
        }
        
        // Store locally for development/debugging
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('voice_metrics') || '[]';
          const allMetrics = JSON.parse(stored);
          allMetrics.push(...metricsToSend);
          
          // Keep only last 1000 metrics
          if (allMetrics.length > 1000) {
            allMetrics.splice(0, allMetrics.length - 1000);
          }
          
          localStorage.setItem('voice_metrics', JSON.stringify(allMetrics));
        }
      }
    } catch (error) {
      console.error('Failed to flush voice metrics:', error);
      // Re-add metrics to buffer for retry
      this.metrics.unshift(...metricsToSend);
    }
  }

  /**
   * Send session data
   */
  private async sendSessionData(session: VoiceSession): Promise<void> {
    try {
      if (this.config.endpoint) {
        await fetch(`${this.config.endpoint}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(session)
        });
      } else if (typeof window !== 'undefined') {
        // Store session data locally
        const stored = localStorage.getItem('voice_sessions') || '[]';
        const sessions = JSON.parse(stored);
        sessions.push(session);
        
        // Keep only last 100 sessions
        if (sessions.length > 100) {
          sessions.splice(0, sessions.length - 100);
        }
        
        localStorage.setItem('voice_sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Failed to send session data:', error);
    }
  }

  /**
   * Calculate average for specific metric type
   */
  private calculateAverage(metrics: VoiceMetric[], type: VoiceMetric['metric']): number {
    const filtered = metrics.filter(m => m.metric === type);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
  }

  /**
   * Get stored metrics for analysis
   */
  getStoredMetrics(): VoiceMetric[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('voice_metrics') || '[]';
    return JSON.parse(stored);
  }

  /**
   * Get stored sessions for analysis
   */
  getStoredSessions(): VoiceSession[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('voice_sessions') || '[]';
    return JSON.parse(stored);
  }

  /**
   * Clear stored data
   */
  clearStoredData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('voice_metrics');
    localStorage.removeItem('voice_sessions');
  }
}

// Export singleton
export const voiceMonitoring = new VoiceMonitoringService();

