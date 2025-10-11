/**
 * 🚨 ERROR REPORTER MODULE
 * 
 * Structured error reporting for debugging and monitoring pipeline issues.
 * Provides detailed error context, stack traces, and recovery suggestions.
 */

export interface ErrorContext {
  company?: string;
  stage: string;
  operation: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorReport {
  id: string;
  type: 'api_error' | 'validation_error' | 'timeout_error' | 'data_error' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: ErrorContext;
  stack?: string;
  recovery?: string[];
  metadata?: Record<string, any>;
}

export class ErrorReporter {
  private errorCounts: Map<string, number> = new Map();
  private recentErrors: ErrorReport[] = [];
  private maxRecentErrors = 100;

  /**
   * Report an error with structured context
   */
  reportError(
    error: Error,
    context: ErrorContext,
    type: ErrorReport['type'] = 'system_error',
    severity: ErrorReport['severity'] = 'medium'
  ): ErrorReport {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type,
      severity,
      message: error.message,
      context,
      stack: error.stack,
      recovery: this.generateRecoverySuggestions(error, context),
      metadata: {
        errorCount: this.getErrorCount(context.stage),
        timestamp: new Date().toISOString()
      }
    };

    // Track error counts
    const errorKey = `${context.stage}:${type}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Store recent errors
    this.recentErrors.unshift(errorReport);
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(0, this.maxRecentErrors);
    }

    // Log error
    this.logError(errorReport);

    return errorReport;
  }

  /**
   * Report API-specific errors
   */
  reportApiError(
    apiName: string,
    error: Error,
    context: ErrorContext,
    response?: { status: number; statusText: string }
  ): ErrorReport {
    const severity = this.determineApiErrorSeverity(response?.status);
    
    return this.reportError(
      new Error(`API Error (${apiName}): ${error.message}`),
      {
        ...context,
        operation: `${context.operation} (${apiName})`
      },
      'api_error',
      severity
    );
  }

  /**
   * Report validation errors
   */
  reportValidationError(
    field: string,
    value: any,
    rule: string,
    context: ErrorContext
  ): ErrorReport {
    return this.reportError(
      new Error(`Validation failed for ${field}: ${rule}`),
      context,
      'validation_error',
      'medium'
    );
  }

  /**
   * Report timeout errors
   */
  reportTimeoutError(
    operation: string,
    timeoutMs: number,
    context: ErrorContext
  ): ErrorReport {
    return this.reportError(
      new Error(`Operation timed out after ${timeoutMs}ms: ${operation}`),
      context,
      'timeout_error',
      'high'
    );
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByStage: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByStage: Record<string, number> = {};

    this.recentErrors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsByStage[error.context.stage] = (errorsByStage[error.context.stage] || 0) + 1;
    });

    return {
      totalErrors: this.recentErrors.length,
      errorsByType,
      errorsByStage,
      recentErrors: this.recentErrors.slice(0, 10) // Last 10 errors
    };
  }

  /**
   * Get errors for a specific company
   */
  getCompanyErrors(companyName: string): ErrorReport[] {
    return this.recentErrors.filter(error => 
      error.context.company === companyName
    );
  }

  /**
   * Clear old errors
   */
  clearOldErrors(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    this.recentErrors = this.recentErrors.filter(error => 
      new Date(error.context.timestamp) > cutoffTime
    );
  }

  /**
   * Generate recovery suggestions based on error type and context
   */
  private generateRecoverySuggestions(error: Error, context: ErrorContext): string[] {
    const suggestions: string[] = [];

    // API-specific suggestions
    if (error.message.includes('API')) {
      suggestions.push('Check API key configuration');
      suggestions.push('Verify API endpoint availability');
      suggestions.push('Check rate limiting and quotas');
    }

    // Timeout suggestions
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      suggestions.push('Increase timeout configuration');
      suggestions.push('Check network connectivity');
      suggestions.push('Consider retry with exponential backoff');
    }

    // Validation suggestions
    if (error.message.includes('validation') || error.message.includes('required')) {
      suggestions.push('Verify input data format');
      suggestions.push('Check required field values');
      suggestions.push('Validate data types and constraints');
    }

    // Stage-specific suggestions
    switch (context.stage) {
      case 'company_resolution':
        suggestions.push('Try alternative company name variations');
        suggestions.push('Check domain format and validity');
        break;
      case 'executive_discovery':
        suggestions.push('Try different role variations');
        suggestions.push('Use fallback discovery methods');
        break;
      case 'contact_enrichment':
        suggestions.push('Check email/phone validation services');
        suggestions.push('Verify contact enrichment APIs');
        break;
      case 'verification':
        suggestions.push('Check verification service availability');
        suggestions.push('Try alternative verification sources');
        break;
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Check system logs for more details');
      suggestions.push('Verify configuration and dependencies');
      suggestions.push('Consider retrying the operation');
    }

    return suggestions;
  }

  /**
   * Determine API error severity based on status code
   */
  private determineApiErrorSeverity(status?: number): ErrorReport['severity'] {
    if (!status) return 'medium';

    if (status >= 500) return 'high'; // Server errors
    if (status === 429) return 'high'; // Rate limiting
    if (status === 401 || status === 403) return 'high'; // Auth errors
    if (status === 404) return 'medium'; // Not found
    if (status === 400) return 'medium'; // Bad request
    if (status >= 200 && status < 300) return 'low'; // Success (shouldn't happen)

    return 'medium';
  }

  /**
   * Get error count for a specific stage
   */
  private getErrorCount(stage: string): number {
    return Array.from(this.errorCounts.entries())
      .filter(([key]) => key.startsWith(stage))
      .reduce((sum, [, count]) => sum + count, 0);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error with appropriate level
   */
  private logError(errorReport: ErrorReport): void {
    const logMessage = `[${errorReport.severity.toUpperCase()}] ${errorReport.type}: ${errorReport.message}`;
    const context = `Company: ${errorReport.context.company || 'N/A'}, Stage: ${errorReport.context.stage}`;

    switch (errorReport.severity) {
      case 'critical':
        console.error(`🚨 ${logMessage}`);
        console.error(`   Context: ${context}`);
        if (errorReport.stack) {
          console.error(`   Stack: ${errorReport.stack}`);
        }
        break;
      case 'high':
        console.error(`❌ ${logMessage}`);
        console.error(`   Context: ${context}`);
        break;
      case 'medium':
        console.warn(`⚠️ ${logMessage}`);
        console.warn(`   Context: ${context}`);
        break;
      case 'low':
        console.log(`ℹ️ ${logMessage}`);
        break;
    }

    // Log recovery suggestions
    if (errorReport.recovery && errorReport.recovery.length > 0) {
      console.log(`   💡 Recovery suggestions:`);
      errorReport.recovery.forEach(suggestion => {
        console.log(`      - ${suggestion}`);
      });
    }
  }
}

// Export singleton instance
export const errorReporter = new ErrorReporter();
