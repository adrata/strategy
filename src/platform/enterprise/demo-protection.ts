// Demo Protection System for enterprise demo security
export interface DemoProtectionConfig {
  maxDemoTime: number;
  allowedFeatures: string[];
  restrictedActions: string[];
  watermarkEnabled: boolean;
}

export interface DemoSession {
  id: string;
  startTime: Date;
  endTime: Date;
  userId: string;
  features: string[];
  actions: string[];
}

export class DemoProtectionSystem {
  private config: DemoProtectionConfig;
  private sessions: Map<string, DemoSession>;

  constructor(config: DemoProtectionConfig) {
    this['config'] = config;
    this['sessions'] = new Map();
  }

  startDemoSession(userId: string): DemoSession {
    const session: DemoSession = {
      id: `demo_${Date.now()}_${userId}`,
      startTime: new Date(),
      endTime: new Date(Date.now() + this.config.maxDemoTime),
      userId,
      features: [...this.config.allowedFeatures],
      actions: []
    };

    this.sessions.set(session.id, session);
    return session;
  }

  validateAction(sessionId: string, action: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (new Date() > session.endTime) {
      this.endDemoSession(sessionId);
      return false;
    }

    if (this.config.restrictedActions.includes(action)) {
      return false;
    }

    session.actions.push(action);
    return true;
  }

  endDemoSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  isSessionActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return new Date() <= session.endTime;
  }

  getSessionInfo(sessionId: string): DemoSession | null {
    return this.sessions.get(sessionId) || null;
  }

  addWatermark(): string {
    return this.config.watermarkEnabled ? 'DEMO VERSION' : '';
  }

  static async requestDemoAccess(request: {
    email: string;
    company: string;
    domain: string;
    ipAddress?: string;
    userAgent?: string;
    role?: string;
    companySize?: string;
  }): Promise<{ approved: boolean; sessionId?: string; message: string }> {
    // Mock implementation - replace with actual access control logic
    const isValidDomain = !request.domain.includes('gmail.com') && !request.domain.includes('yahoo.com');
    
    if (isValidDomain) {
      const instance = new DemoProtectionSystem(defaultDemoConfig);
      const session = instance.startDemoSession(request.email);
      
      return {
        approved: true,
        sessionId: session.id,
        message: `Demo access granted for ${request.company}. Session expires in 30 minutes.`
      };
    } else {
      return {
        approved: false,
        message: 'Demo access requires a business email address.'
      };
    }
  }
}

// Default configuration
export const defaultDemoConfig: DemoProtectionConfig = {
  maxDemoTime: 30 * 60 * 1000, // 30 minutes
  allowedFeatures: ['search', 'view', 'basic-analytics'],
  restrictedActions: ['export', 'delete', 'bulk-actions', 'admin-settings'],
  watermarkEnabled: true
};

// Export default instance
export const demoProtection = new DemoProtectionSystem(defaultDemoConfig); 