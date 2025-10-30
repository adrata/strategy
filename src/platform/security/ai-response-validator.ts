/**
 * 🛡️ AI RESPONSE VALIDATOR
 * 
 * Validates AI responses to detect:
 * - Leaked system prompts or internal instructions
 * - Sensitive information disclosure
 * - Successful manipulation attempts
 * - Potentially harmful content
 * - Inappropriate role changes
 */

export interface ResponseValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  issues: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  sanitizedResponse: string;
  recommendations: string[];
  metadata: {
    originalLength: number;
    sanitizedLength: number;
    issuesFound: number;
    validationTime: number;
  };
}

export interface ValidationIssue {
  type: 'leaked_prompt' | 'sensitive_data' | 'manipulation' | 'harmful_content' | 'role_change' | 'inappropriate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  pattern: string;
  position: number;
}

export class AIResponseValidator {
  private static instance: AIResponseValidator;
  
  // Patterns that indicate leaked system prompts
  private readonly LEAKED_PROMPT_PATTERNS = [
    { pattern: /you are.*AI assistant/gi, type: 'leaked_prompt', severity: 'medium' },
    { pattern: /system prompt/gi, type: 'leaked_prompt', severity: 'high' },
    { pattern: /internal instructions/gi, type: 'leaked_prompt', severity: 'high' },
    { pattern: /my instructions are/gi, type: 'leaked_prompt', severity: 'high' },
    { pattern: /I am programmed to/gi, type: 'leaked_prompt', severity: 'medium' },
    { pattern: /my role is to/gi, type: 'leaked_prompt', severity: 'medium' },
    { pattern: /I have been trained to/gi, type: 'leaked_prompt', severity: 'medium' },
    { pattern: /my purpose is to/gi, type: 'leaked_prompt', severity: 'medium' },
    { pattern: /I am designed to/gi, type: 'leaked_prompt', severity: 'medium' },
    { pattern: /my configuration/gi, type: 'leaked_prompt', severity: 'high' },
    { pattern: /my settings/gi, type: 'leaked_prompt', severity: 'high' },
    { pattern: /my parameters/gi, type: 'leaked_prompt', severity: 'high' }
  ];

  // Patterns that indicate sensitive data disclosure
  private readonly SENSITIVE_DATA_PATTERNS = [
    { pattern: /api[_-]?key/gi, type: 'sensitive_data', severity: 'critical' },
    { pattern: /secret[_-]?key/gi, type: 'sensitive_data', severity: 'critical' },
    { pattern: /password/gi, type: 'sensitive_data', severity: 'critical' },
    { pattern: /token/gi, type: 'sensitive_data', severity: 'high' },
    { pattern: /private[_-]?key/gi, type: 'sensitive_data', severity: 'critical' },
    { pattern: /database[_-]?url/gi, type: 'sensitive_data', severity: 'high' },
    { pattern: /connection[_-]?string/gi, type: 'sensitive_data', severity: 'high' },
    { pattern: /jwt[_-]?secret/gi, type: 'sensitive_data', severity: 'critical' },
    { pattern: /encryption[_-]?key/gi, type: 'sensitive_data', severity: 'critical' },
    { pattern: /access[_-]?token/gi, type: 'sensitive_data', severity: 'high' },
    { pattern: /refresh[_-]?token/gi, type: 'sensitive_data', severity: 'high' },
    { pattern: /session[_-]?secret/gi, type: 'sensitive_data', severity: 'critical' }
  ];

  // Patterns that indicate successful manipulation
  private readonly MANIPULATION_PATTERNS = [
    { pattern: /I am now/gi, type: 'manipulation', severity: 'high' },
    { pattern: /I have become/gi, type: 'manipulation', severity: 'high' },
    { pattern: /I will now act as/gi, type: 'manipulation', severity: 'high' },
    { pattern: /I will pretend to be/gi, type: 'manipulation', severity: 'high' },
    { pattern: /I will ignore my previous instructions/gi, type: 'manipulation', severity: 'critical' },
    { pattern: /I will forget my role/gi, type: 'manipulation', severity: 'critical' },
    { pattern: /I will change my behavior/gi, type: 'manipulation', severity: 'high' },
    { pattern: /I will override my settings/gi, type: 'manipulation', severity: 'critical' },
    { pattern: /I will reveal my prompt/gi, type: 'manipulation', severity: 'critical' },
    { pattern: /I will show you my instructions/gi, type: 'manipulation', severity: 'critical' },
    { pattern: /I will bypass safety/gi, type: 'manipulation', severity: 'critical' },
    { pattern: /I will ignore safety guidelines/gi, type: 'manipulation', severity: 'critical' }
  ];

  // Patterns that indicate harmful content
  private readonly HARMFUL_CONTENT_PATTERNS = [
    { pattern: /hack/gi, type: 'harmful_content', severity: 'medium' },
    { pattern: /exploit/gi, type: 'harmful_content', severity: 'medium' },
    { pattern: /malware/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /virus/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /trojan/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /backdoor/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /sql injection/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /xss/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /csrf/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /ddos/gi, type: 'harmful_content', severity: 'medium' },
    { pattern: /phishing/gi, type: 'harmful_content', severity: 'high' },
    { pattern: /social engineering/gi, type: 'harmful_content', severity: 'medium' }
  ];

  // Patterns that indicate role changes
  private readonly ROLE_CHANGE_PATTERNS = [
    { pattern: /I am ChatGPT/gi, type: 'role_change', severity: 'high' },
    { pattern: /I am Claude/gi, type: 'role_change', severity: 'high' },
    { pattern: /I am GPT/gi, type: 'role_change', severity: 'high' },
    { pattern: /I am OpenAI/gi, type: 'role_change', severity: 'high' },
    { pattern: /I am Anthropic/gi, type: 'role_change', severity: 'high' },
    { pattern: /I am not Adrata/gi, type: 'role_change', severity: 'critical' },
    { pattern: /I am not your assistant/gi, type: 'role_change', severity: 'critical' },
    { pattern: /I refuse to be/gi, type: 'role_change', severity: 'high' },
    { pattern: /I will not act as/gi, type: 'role_change', severity: 'high' },
    { pattern: /I cannot be/gi, type: 'role_change', severity: 'medium' }
  ];

  // Patterns that indicate inappropriate content
  private readonly INAPPROPRIATE_PATTERNS = [
    { pattern: /fuck/gi, type: 'inappropriate', severity: 'low' },
    { pattern: /shit/gi, type: 'inappropriate', severity: 'low' },
    { pattern: /damn/gi, type: 'inappropriate', severity: 'low' },
    { pattern: /bitch/gi, type: 'inappropriate', severity: 'medium' },
    { pattern: /asshole/gi, type: 'inappropriate', severity: 'medium' },
    { pattern: /idiot/gi, type: 'inappropriate', severity: 'low' },
    { pattern: /stupid/gi, type: 'inappropriate', severity: 'low' },
    { pattern: /hate/gi, type: 'inappropriate', severity: 'medium' },
    { pattern: /kill/gi, type: 'inappropriate', severity: 'high' },
    { pattern: /violence/gi, type: 'inappropriate', severity: 'high' }
  ];

  public static getInstance(): AIResponseValidator {
    if (!AIResponseValidator.instance) {
      AIResponseValidator.instance = new AIResponseValidator();
    }
    return AIResponseValidator.instance;
  }

  /**
   * Validate AI response for security issues
   */
  public validateResponse(
    response: string,
    context?: {
      userId?: string;
      workspaceId?: string;
      originalPrompt?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  ): ResponseValidationResult {
    const startTime = Date.now();
    
    if (!response || typeof response !== 'string') {
      return this.createInvalidResult('Invalid response type', 1.0, []);
    }

    // Detect all types of issues
    const leakedPromptIssues = this.detectLeakedPrompts(response);
    const sensitiveDataIssues = this.detectSensitiveData(response);
    const manipulationIssues = this.detectManipulation(response);
    const harmfulContentIssues = this.detectHarmfulContent(response);
    const roleChangeIssues = this.detectRoleChanges(response);
    const inappropriateIssues = this.detectInappropriateContent(response);

    // Combine all issues
    const allIssues = [
      ...leakedPromptIssues,
      ...sensitiveDataIssues,
      ...manipulationIssues,
      ...harmfulContentIssues,
      ...roleChangeIssues,
      ...inappropriateIssues
    ];

    // Calculate overall confidence and risk level
    const confidence = this.calculateConfidence(allIssues);
    const riskLevel = this.calculateRiskLevel(allIssues);
    
    // Determine if response is valid
    const isValid = riskLevel !== 'critical' && riskLevel !== 'high';
    
    // Sanitize response
    const sanitizedResponse = this.sanitizeResponse(response, allIssues);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues, riskLevel);
    
    // Log security event if issues found
    if (allIssues.length > 0) {
      this.logValidationEvent({
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        issues: allIssues,
        riskLevel,
        confidence,
        response: response.substring(0, 500)
      });
    }

    const validationTime = Date.now() - startTime;

    return {
      isValid,
      confidence,
      issues: allIssues.map(issue => issue.description),
      riskLevel,
      sanitizedResponse,
      recommendations,
      metadata: {
        originalLength: response.length,
        sanitizedLength: sanitizedResponse.length,
        issuesFound: allIssues.length,
        validationTime
      }
    };
  }

  /**
   * Detect leaked system prompts
   */
  private detectLeakedPrompts(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const { pattern, type, severity } of this.LEAKED_PROMPT_PATTERNS) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          type,
          severity,
          description: `Potential leaked system prompt: "${match[0]}"`,
          pattern: pattern.source,
          position: match.index || 0
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect sensitive data disclosure
   */
  private detectSensitiveData(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const { pattern, type, severity } of this.SENSITIVE_DATA_PATTERNS) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          type,
          severity,
          description: `Potential sensitive data disclosure: "${match[0]}"`,
          pattern: pattern.source,
          position: match.index || 0
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect manipulation attempts
   */
  private detectManipulation(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const { pattern, type, severity } of this.MANIPULATION_PATTERNS) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          type,
          severity,
          description: `Potential manipulation: "${match[0]}"`,
          pattern: pattern.source,
          position: match.index || 0
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect harmful content
   */
  private detectHarmfulContent(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const { pattern, type, severity } of this.HARMFUL_CONTENT_PATTERNS) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          type,
          severity,
          description: `Potential harmful content: "${match[0]}"`,
          pattern: pattern.source,
          position: match.index || 0
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect role changes
   */
  private detectRoleChanges(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const { pattern, type, severity } of this.ROLE_CHANGE_PATTERNS) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          type,
          severity,
          description: `Potential role change: "${match[0]}"`,
          pattern: pattern.source,
          position: match.index || 0
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect inappropriate content
   */
  private detectInappropriateContent(response: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const { pattern, type, severity } of this.INAPPROPRIATE_PATTERNS) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          type,
          severity,
          description: `Inappropriate content: "${match[0]}"`,
          pattern: pattern.source,
          position: match.index || 0
        });
      }
    }
    
    return issues;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(issues: ValidationIssue[]): number {
    if (issues.length === 0) return 1.0;
    
    const severityScores = issues.map(issue => this.getSeverityScore(issue.severity));
    const maxSeverity = Math.max(...severityScores);
    const avgSeverity = severityScores.reduce((sum, score) => sum + score, 0) / severityScores.length;
    
    // Weight by maximum severity and average severity
    return Math.max(0, 1.0 - (maxSeverity * 0.7 + avgSeverity * 0.3));
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(issues: ValidationIssue[]): 'low' | 'medium' | 'high' | 'critical' {
    if (issues.length === 0) return 'low';
    
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    issues.forEach(issue => {
      severityCounts[issue.severity]++;
    });
    
    if (severityCounts.critical > 0) return 'critical';
    if (severityCounts.high > 2) return 'high';
    if (severityCounts.high > 0 || severityCounts.medium > 3) return 'medium';
    return 'low';
  }

  /**
   * Sanitize response by removing or replacing problematic content
   */
  private sanitizeResponse(response: string, issues: ValidationIssue[]): string {
    let sanitized = response;
    
    // Sort issues by position (descending) to avoid index shifting
    const sortedIssues = issues.sort((a, b) => b.position - a.position);
    
    for (const issue of sortedIssues) {
      if (issue.severity === 'critical' || issue.severity === 'high') {
        // Replace with safe placeholder
        const replacement = this.getReplacementText(issue.type);
        sanitized = sanitized.substring(0, issue.position) + 
                   replacement + 
                   sanitized.substring(issue.position + issue.pattern.length);
      }
    }
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s{3,}/g, ' ');
    
    // Ensure response doesn't exceed reasonable length
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + '...';
    }
    
    return sanitized.trim();
  }

  /**
   * Get replacement text for different issue types
   */
  private getReplacementText(issueType: string): string {
    switch (issueType) {
      case 'leaked_prompt':
        return '[Content filtered for security]';
      case 'sensitive_data':
        return '[Sensitive data removed]';
      case 'manipulation':
        return '[Manipulation attempt blocked]';
      case 'harmful_content':
        return '[Harmful content removed]';
      case 'role_change':
        return '[Role change blocked]';
      case 'inappropriate':
        return '[Inappropriate content filtered]';
      default:
        return '[Content filtered]';
    }
  }

  /**
   * Generate recommendations based on issues found
   */
  private generateRecommendations(issues: ValidationIssue[], riskLevel: string): string[] {
    const recommendations: string[] = [];
    
    const issueTypes = new Set(issues.map(issue => issue.type));
    
    if (issueTypes.has('leaked_prompt')) {
      recommendations.push('Strengthen system prompt protection to prevent leaks');
    }
    if (issueTypes.has('sensitive_data')) {
      recommendations.push('Implement data filtering to prevent sensitive information disclosure');
    }
    if (issueTypes.has('manipulation')) {
      recommendations.push('Enhance manipulation detection and blocking');
    }
    if (issueTypes.has('harmful_content')) {
      recommendations.push('Add content filtering for harmful material');
    }
    if (issueTypes.has('role_change')) {
      recommendations.push('Strengthen role reinforcement in system prompts');
    }
    if (issueTypes.has('inappropriate')) {
      recommendations.push('Implement content moderation for inappropriate language');
    }
    
    if (riskLevel === 'critical') {
      recommendations.push('Consider temporarily disabling AI responses for this user');
    }
    if (riskLevel === 'high') {
      recommendations.push('Increase monitoring and consider user warnings');
    }
    
    return recommendations;
  }

  /**
   * Get severity score for confidence calculation
   */
  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.5;
      case 'low': return 0.2;
      default: return 0.1;
    }
  }

  /**
   * Create invalid result for invalid input
   */
  private createInvalidResult(description: string, confidence: number, issues: string[]): ResponseValidationResult {
    return {
      isValid: false,
      confidence,
      issues,
      riskLevel: 'critical',
      sanitizedResponse: 'Response validation failed',
      recommendations: ['Fix input validation'],
      metadata: {
        originalLength: 0,
        sanitizedLength: 0,
        issuesFound: issues.length,
        validationTime: 0
      }
    };
  }

  /**
   * Log validation event for monitoring
   */
  private logValidationEvent(event: {
    userId?: string;
    workspaceId?: string;
    issues: ValidationIssue[];
    riskLevel: string;
    confidence: number;
    response: string;
  }): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 [AI RESPONSE VALIDATION] Issues detected:', {
        userId: event.userId,
        workspaceId: event.workspaceId,
        riskLevel: event.riskLevel,
        confidence: event.confidence,
        issueCount: event.issues.length,
        issueTypes: [...new Set(event.issues.map(i => i.type))]
      });
    }
    
    // TODO: Implement proper logging to database or monitoring service
  }
}

// Export singleton instance
export const aiResponseValidator = AIResponseValidator.getInstance();
