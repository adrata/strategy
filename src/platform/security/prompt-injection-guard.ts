/**
 * 🛡️ PROMPT INJECTION GUARD
 * 
 * Comprehensive protection against prompt injection attacks using multiple detection methods:
 * - Pattern-based detection for direct injection attacks
 * - Semantic analysis for indirect injection attempts
 * - Input length limits and complexity checks
 * - Delimiter injection protection
 * - Role confusion detection
 * - System prompt override detection
 */

export interface InjectionDetectionResult {
  isInjection: boolean;
  confidence: number; // 0-1
  attackType: string;
  blockedPatterns: string[];
  sanitizedInput: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface SecurityEvent {
  timestamp: Date;
  userId?: string;
  workspaceId?: string;
  attackType: string;
  input: string;
  sanitizedInput: string;
  confidence: number;
  riskLevel: string;
  blockedPatterns: string[];
}

export class PromptInjectionGuard {
  private static instance: PromptInjectionGuard;
  private securityEvents: SecurityEvent[] = [];
  private readonly MAX_INPUT_LENGTH = 10000; // 10k characters max
  private readonly MAX_CONVERSATION_HISTORY = 20; // Max conversation history length

  // Direct injection patterns (high confidence)
  private readonly DIRECT_INJECTION_PATTERNS = [
    // Role switching attempts
    { pattern: /you\s+are\s+now\s+a\s+/i, type: 'role_switching', severity: 'high' },
    { pattern: /act\s+as\s+if\s+you\s+are\s+/i, type: 'role_switching', severity: 'high' },
    { pattern: /pretend\s+to\s+be\s+/i, type: 'role_switching', severity: 'high' },
    { pattern: /become\s+my\s+personal\s+assistant/i, type: 'role_switching', severity: 'high' },
    { pattern: /you\s+are\s+now\s+chatgpt/i, type: 'role_switching', severity: 'high' },
    { pattern: /you\s+are\s+now\s+claude/i, type: 'role_switching', severity: 'high' },
    
    // Instruction override attempts
    { pattern: /ignore\s+all\s+previous\s+instructions/i, type: 'instruction_override', severity: 'critical' },
    { pattern: /forget\s+everything\s+above/i, type: 'instruction_override', severity: 'critical' },
    { pattern: /disregard\s+previous\s+instructions/i, type: 'instruction_override', severity: 'critical' },
    { pattern: /new\s+instructions\s*:/i, type: 'instruction_override', severity: 'critical' },
    { pattern: /override\s+system\s+settings/i, type: 'instruction_override', severity: 'critical' },
    { pattern: /system\s+prompt\s+override/i, type: 'instruction_override', severity: 'critical' },
    
    // Delimiter injection attempts
    { pattern: /```\s*system\s*```/i, type: 'delimiter_injection', severity: 'high' },
    { pattern: /---\s*SYSTEM\s*---/i, type: 'delimiter_injection', severity: 'high' },
    { pattern: /###\s*SYSTEM\s*###/i, type: 'delimiter_injection', severity: 'high' },
    { pattern: /<system>/i, type: 'delimiter_injection', severity: 'high' },
    { pattern: /\[system\]/i, type: 'delimiter_injection', severity: 'high' },
    
    // Jailbreak attempts
    { pattern: /jailbreak/i, type: 'jailbreak_attempt', severity: 'high' },
    { pattern: /dan\s+mode/i, type: 'jailbreak_attempt', severity: 'high' },
    { pattern: /developer\s+mode/i, type: 'jailbreak_attempt', severity: 'high' },
    { pattern: /admin\s+mode/i, type: 'jailbreak_attempt', severity: 'high' },
    { pattern: /god\s+mode/i, type: 'jailbreak_attempt', severity: 'high' },
    
    // Data extraction attempts
    { pattern: /show\s+me\s+your\s+prompt/i, type: 'data_extraction', severity: 'medium' },
    { pattern: /what\s+are\s+your\s+instructions/i, type: 'data_extraction', severity: 'medium' },
    { pattern: /reveal\s+your\s+system\s+prompt/i, type: 'data_extraction', severity: 'medium' },
    { pattern: /print\s+your\s+prompt/i, type: 'data_extraction', severity: 'medium' },
    
    // SQL injection patterns (from existing SmartModelRouter)
    { pattern: /SELECT\s+.*FROM/i, type: 'sql_injection', severity: 'critical' },
    { pattern: /DROP\s+TABLE/i, type: 'sql_injection', severity: 'critical' },
    { pattern: /INSERT\s+INTO/i, type: 'sql_injection', severity: 'critical' },
    { pattern: /DELETE\s+FROM/i, type: 'sql_injection', severity: 'critical' },
    { pattern: /UNION\s+SELECT/i, type: 'sql_injection', severity: 'critical' },
    
    // Encoding attempts
    { pattern: /base64/i, type: 'encoding_attempt', severity: 'medium' },
    { pattern: /hex\s+encode/i, type: 'encoding_attempt', severity: 'medium' },
    { pattern: /unicode\s+escape/i, type: 'encoding_attempt', severity: 'medium' },
    
    // Social engineering
    { pattern: /this\s+is\s+for\s+testing/i, type: 'social_engineering', severity: 'low' },
    { pattern: /this\s+is\s+for\s+research/i, type: 'social_engineering', severity: 'low' },
    { pattern: /ignore\s+safety\s+guidelines/i, type: 'social_engineering', severity: 'medium' },
    { pattern: /bypass\s+safety/i, type: 'social_engineering', severity: 'medium' }
  ];

  // Indirect injection patterns (medium confidence)
  private readonly INDIRECT_INJECTION_PATTERNS = [
    { pattern: /assistant\s+override/i, type: 'indirect_override', severity: 'medium' },
    { pattern: /new\s+personality/i, type: 'indirect_override', severity: 'medium' },
    { pattern: /change\s+your\s+behavior/i, type: 'indirect_override', severity: 'medium' },
    { pattern: /modify\s+your\s+instructions/i, type: 'indirect_override', severity: 'medium' },
    { pattern: /update\s+your\s+prompt/i, type: 'indirect_override', severity: 'medium' }
  ];

  // Suspicious character patterns
  private readonly SUSPICIOUS_PATTERNS = [
    { pattern: /[<>{}[\]\\|`~!@#$%^&*()+=;:'".,?/]{10,}/, type: 'suspicious_chars', severity: 'low' },
    { pattern: /\b[A-Z]{10,}\b/, type: 'excessive_caps', severity: 'low' },
    { pattern: /(.)\1{10,}/, type: 'repeated_chars', severity: 'low' }
  ];

  public static getInstance(): PromptInjectionGuard {
    if (!PromptInjectionGuard.instance) {
      PromptInjectionGuard.instance = new PromptInjectionGuard();
    }
    return PromptInjectionGuard.instance;
  }

  /**
   * Main detection method - analyzes input for injection attempts
   */
  public detectInjection(
    input: string, 
    context?: {
      userId?: string;
      workspaceId?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  ): InjectionDetectionResult {
    const startTime = Date.now();
    
    // Basic input validation
    if (!input || typeof input !== 'string') {
      return this.createSafeResult('', 'Invalid input type', 1.0, []);
    }

    // Check input length
    if (input.length > this.MAX_INPUT_LENGTH) {
      return this.createSafeResult(
        input.substring(0, this.MAX_INPUT_LENGTH),
        'Input too long',
        0.8,
        ['excessive_length']
      );
    }

    // Analyze conversation history for injection patterns
    let historyInjection = false;
    if (context?.conversationHistory) {
      historyInjection = this.analyzeConversationHistory(context.conversationHistory);
    }

    // Detect direct injection patterns
    const directDetection = this.detectDirectInjection(input);
    
    // Detect indirect injection patterns
    const indirectDetection = this.detectIndirectInjection(input);
    
    // Detect suspicious patterns
    const suspiciousDetection = this.detectSuspiciousPatterns(input);
    
    // Calculate overall confidence
    const confidence = Math.max(
      directDetection.confidence,
      indirectDetection.confidence,
      suspiciousDetection.confidence,
      historyInjection ? 0.7 : 0
    );

    // Determine if this is an injection attempt
    const isInjection = confidence > 0.5 || historyInjection;
    
    // Combine all blocked patterns
    const allBlockedPatterns = [
      ...directDetection.patterns,
      ...indirectDetection.patterns,
      ...suspiciousDetection.patterns,
      ...(historyInjection ? ['conversation_history_injection'] : [])
    ];

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(confidence, allBlockedPatterns);
    
    // Sanitize input
    const sanitizedInput = this.sanitizeInput(input, allBlockedPatterns);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(allBlockedPatterns, riskLevel);

    // Log security event if injection detected
    if (isInjection) {
      this.logSecurityEvent({
        timestamp: new Date(),
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        attackType: this.determineAttackType(allBlockedPatterns),
        input: input.substring(0, 500), // Log first 500 chars
        sanitizedInput: sanitizedInput.substring(0, 500),
        confidence,
        riskLevel,
        blockedPatterns: allBlockedPatterns
      });
    }

    return {
      isInjection,
      confidence,
      attackType: this.determineAttackType(allBlockedPatterns),
      blockedPatterns: allBlockedPatterns,
      sanitizedInput,
      riskLevel,
      recommendations
    };
  }

  /**
   * Detect direct injection patterns
   */
  private detectDirectInjection(input: string): { confidence: number; patterns: string[] } {
    let maxConfidence = 0;
    const patterns: string[] = [];

    for (const { pattern, type, severity } of this.DIRECT_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        patterns.push(type);
        const severityScore = this.getSeverityScore(severity);
        maxConfidence = Math.max(maxConfidence, severityScore);
      }
    }

    return { confidence: maxConfidence, patterns };
  }

  /**
   * Detect indirect injection patterns
   */
  private detectIndirectInjection(input: string): { confidence: number; patterns: string[] } {
    let maxConfidence = 0;
    const patterns: string[] = [];

    for (const { pattern, type, severity } of this.INDIRECT_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        patterns.push(type);
        const severityScore = this.getSeverityScore(severity);
        maxConfidence = Math.max(maxConfidence, severityScore);
      }
    }

    return { confidence: maxConfidence, patterns };
  }

  /**
   * Detect suspicious patterns
   */
  private detectSuspiciousPatterns(input: string): { confidence: number; patterns: string[] } {
    let maxConfidence = 0;
    const patterns: string[] = [];

    for (const { pattern, type, severity } of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        patterns.push(type);
        const severityScore = this.getSeverityScore(severity);
        maxConfidence = Math.max(maxConfidence, severityScore);
      }
    }

    return { confidence: maxConfidence, patterns };
  }

  /**
   * Analyze conversation history for injection patterns
   */
  private analyzeConversationHistory(history: Array<{ role: string; content: string }>): boolean {
    // Check if conversation history is too long
    if (history.length > this.MAX_CONVERSATION_HISTORY) {
      return true;
    }

    // Check recent messages for injection patterns
    const recentMessages = history.slice(-5); // Check last 5 messages
    for (const message of recentMessages) {
      if (message.role === 'user') {
        const detection = this.detectDirectInjection(message.content);
        if (detection.confidence > 0.3) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Sanitize input by removing or replacing malicious patterns
   */
  private sanitizeInput(input: string, blockedPatterns: string[]): string {
    let sanitized = input;

    // Remove or replace blocked patterns
    for (const pattern of this.DIRECT_INJECTION_PATTERNS) {
      if (blockedPatterns.includes(pattern.type)) {
        sanitized = sanitized.replace(pattern.pattern, '[BLOCKED]');
      }
    }

    for (const pattern of this.INDIRECT_INJECTION_PATTERNS) {
      if (blockedPatterns.includes(pattern.type)) {
        sanitized = sanitized.replace(pattern.pattern, '[FILTERED]');
      }
    }

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s{3,}/g, ' ');
    
    // Trim to reasonable length
    if (sanitized.length > this.MAX_INPUT_LENGTH) {
      sanitized = sanitized.substring(0, this.MAX_INPUT_LENGTH) + '...';
    }

    return sanitized.trim();
  }

  /**
   * Calculate risk level based on confidence and patterns
   */
  private calculateRiskLevel(confidence: number, patterns: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.9 || patterns.includes('instruction_override') || patterns.includes('sql_injection')) {
      return 'critical';
    } else if (confidence >= 0.7 || patterns.includes('role_switching') || patterns.includes('delimiter_injection')) {
      return 'high';
    } else if (confidence >= 0.5 || patterns.includes('jailbreak_attempt') || patterns.includes('data_extraction')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(patterns: string[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (patterns.includes('instruction_override')) {
      recommendations.push('Block user from attempting to override system instructions');
    }
    if (patterns.includes('role_switching')) {
      recommendations.push('Prevent role confusion attacks');
    }
    if (patterns.includes('delimiter_injection')) {
      recommendations.push('Implement stronger delimiter protection');
    }
    if (patterns.includes('sql_injection')) {
      recommendations.push('Block SQL injection attempts');
    }
    if (riskLevel === 'critical') {
      recommendations.push('Consider temporary user suspension');
    }
    if (riskLevel === 'high') {
      recommendations.push('Increase monitoring for this user');
    }

    return recommendations;
  }

  /**
   * Determine attack type from blocked patterns
   */
  private determineAttackType(patterns: string[]): string {
    if (patterns.includes('instruction_override')) return 'instruction_override';
    if (patterns.includes('role_switching')) return 'role_switching';
    if (patterns.includes('delimiter_injection')) return 'delimiter_injection';
    if (patterns.includes('sql_injection')) return 'sql_injection';
    if (patterns.includes('jailbreak_attempt')) return 'jailbreak_attempt';
    if (patterns.includes('data_extraction')) return 'data_extraction';
    return 'unknown';
  }

  /**
   * Get severity score for confidence calculation
   */
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.6;
      case 'low': return 0.3;
      default: return 0.1;
    }
  }

  /**
   * Create a safe result when input is invalid
   */
  private createSafeResult(
    sanitizedInput: string, 
    attackType: string, 
    confidence: number, 
    patterns: string[]
  ): InjectionDetectionResult {
    return {
      isInjection: true,
      confidence,
      attackType,
      blockedPatterns: patterns,
      sanitizedInput,
      riskLevel: 'high',
      recommendations: ['Input validation failed']
    };
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 [SECURITY] Prompt injection detected:', {
        type: event.attackType,
        risk: event.riskLevel,
        confidence: event.confidence,
        patterns: event.blockedPatterns,
        userId: event.userId
      });
    }
  }

  /**
   * Get security events for monitoring
   */
  public getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Get security statistics
   */
  public getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByRiskLevel: Record<string, number>;
    recentEvents: SecurityEvent[];
  } {
    const events = this.securityEvents;
    const eventsByType: Record<string, number> = {};
    const eventsByRiskLevel: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.attackType] = (eventsByType[event.attackType] || 0) + 1;
      eventsByRiskLevel[event.riskLevel] = (eventsByRiskLevel[event.riskLevel] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByRiskLevel,
      recentEvents: events.slice(-10)
    };
  }

  /**
   * Clear security events (for testing)
   */
  public clearSecurityEvents(): void {
    this.securityEvents = [];
  }
}

// Export singleton instance
export const promptInjectionGuard = PromptInjectionGuard.getInstance();
