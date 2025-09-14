/**
 * 🔍 PIPELINE AUDITOR
 * 
 * Comprehensive step-by-step auditing system to track:
 * 1. API call success/failure with detailed logging
 * 2. Data flow through each pipeline stage
 * 3. Performance bottlenecks and optimization opportunities
 * 4. Cost tracking and budget analysis
 * 5. Quality metrics and validation results
 */

interface AuditStep {
  stepName: string;
  stepType: 'api_call' | 'data_processing' | 'validation' | 'caching';
  startTime: number;
  endTime?: number;
  success: boolean;
  inputData?: any;
  outputData?: any;
  apiCost?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface PipelineAudit {
  sessionId: string;
  accountId: string;
  accountName: string;
  startTime: number;
  endTime?: number;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalCost: number;
  steps: AuditStep[];
  finalResult?: any;
  qualityScore?: number;
  recommendations?: string[];
}

export class PipelineAuditor {
  private audits: Map<string, PipelineAudit> = new Map();
  private stepCounters: Map<string, number> = new Map();

  /**
   * 🚀 START PIPELINE AUDIT
   */
  startAudit(sessionId: string, accountId: string, accountName: string): void {
    const audit: PipelineAudit = {
      sessionId,
      accountId,
      accountName,
      startTime: Date.now(),
      totalSteps: 0,
      successfulSteps: 0,
      failedSteps: 0,
      totalCost: 0,
      steps: []
    };

    this.audits.set(accountId, audit);
    console.log(`🔍 [AUDIT] Started audit for ${accountName} (Session: ${sessionId})`);
  }

  /**
   * 📝 LOG PIPELINE STEP
   */
  logStep(
    accountId: string,
    stepName: string,
    stepType: AuditStep['stepType'],
    inputData?: any
  ): string {
    const audit = this.audits.get(accountId);
    if (!audit) {
      console.error(`❌ [AUDIT] No audit found for account: ${accountId}`);
      return '';
    }

    const stepId = `${stepName}_${Date.now()}`;
    const step: AuditStep = {
      stepName,
      stepType,
      startTime: Date.now(),
      success: false,
      inputData: this.sanitizeData(inputData)
    };

    audit.steps.push(step);
    audit.totalSteps++;

    console.log(`📝 [AUDIT] Step started: ${stepName} (${stepType}) for ${audit.accountName}`);
    if (inputData) {
      console.log(`   📥 Input: ${JSON.stringify(this.sanitizeData(inputData)).substring(0, 200)}...`);
    }

    return stepId;
  }

  /**
   * ✅ COMPLETE PIPELINE STEP
   */
  completeStep(
    accountId: string,
    stepName: string,
    success: boolean,
    outputData?: any,
    errorMessage?: string,
    apiCost?: number,
    metadata?: Record<string, any>
  ): void {
    const audit = this.audits.get(accountId);
    if (!audit) return;

    // Find the most recent step with this name
    const step = audit.steps.reverse().find(s => s['stepName'] === stepName);
    if (!step) {
      console.error(`❌ [AUDIT] Step not found: ${stepName} for ${accountId}`);
      return;
    }

    // Update step
    step['endTime'] = Date.now();
    step['success'] = success;
    step['outputData'] = this.sanitizeData(outputData);
    step['errorMessage'] = errorMessage;
    step['apiCost'] = apiCost || 0;
    step['metadata'] = metadata;

    // Update audit counters
    if (success) {
      audit.successfulSteps++;
    } else {
      audit.failedSteps++;
    }
    audit.totalCost += apiCost || 0;

    const duration = step.endTime - step.startTime;
    const status = success ? '✅' : '❌';
    
    console.log(`${status} [AUDIT] Step completed: ${stepName} (${duration}ms)`);
    if (outputData) {
      console.log(`   📤 Output: ${JSON.stringify(this.sanitizeData(outputData)).substring(0, 200)}...`);
    }
    if (errorMessage) {
      console.log(`   ❌ Error: ${errorMessage}`);
    }
    if (apiCost) {
      console.log(`   💰 Cost: $${apiCost.toFixed(4)}`);
    }

    // Reverse back to original order
    audit.steps.reverse();
  }

  /**
   * 🏁 COMPLETE PIPELINE AUDIT
   */
  completeAudit(accountId: string, finalResult?: any, qualityScore?: number): PipelineAudit | null {
    const audit = this.audits.get(accountId);
    if (!audit) return null;

    audit['endTime'] = Date.now();
    audit['finalResult'] = this.sanitizeData(finalResult);
    audit['qualityScore'] = qualityScore;
    audit['recommendations'] = this.generateRecommendations(audit);

    const totalDuration = audit.endTime - audit.startTime;
    const successRate = (audit.successfulSteps / audit.totalSteps) * 100;

    console.log(`🏁 [AUDIT] Pipeline completed for ${audit.accountName}`);
    console.log(`   ⏱️  Total time: ${totalDuration}ms`);
    console.log(`   📊 Steps: ${audit.successfulSteps}/${audit.totalSteps} successful (${successRate.toFixed(1)}%)`);
    console.log(`   💰 Total cost: $${audit.totalCost.toFixed(4)}`);
    console.log(`   🎯 Quality score: ${qualityScore || 0}%`);

    if (audit['recommendations'] && audit.recommendations.length > 0) {
      console.log(`   💡 Recommendations:`);
      audit.recommendations.forEach(rec => console.log(`      - ${rec}`));
    }

    return audit;
  }

  /**
   * 🔍 DETAILED STEP ANALYSIS
   */
  analyzeSteps(accountId: string): {
    bottlenecks: { stepName: string; duration: number }[];
    failedSteps: AuditStep[];
    costBreakdown: { stepName: string; cost: number }[];
    recommendations: string[];
  } {
    const audit = this.audits.get(accountId);
    if (!audit) {
      return { bottlenecks: [], failedSteps: [], costBreakdown: [], recommendations: [] };
    }

    // Find bottlenecks (steps taking >5 seconds)
    const bottlenecks = audit.steps
      .filter(step => step['endTime'] && (step.endTime - step.startTime) > 5000)
      .map(step => ({
        stepName: step.stepName,
        duration: step.endTime! - step.startTime
      }))
      .sort((a, b) => b.duration - a.duration);

    // Find failed steps
    const failedSteps = audit.steps.filter(step => !step.success);

    // Cost breakdown
    const costBreakdown = audit.steps
      .filter(step => step['apiCost'] && step.apiCost > 0)
      .map(step => ({
        stepName: step.stepName,
        cost: step.apiCost!
      }))
      .sort((a, b) => b.cost - a.cost);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (bottlenecks.length > 0) {
      recommendations.push(`Optimize slow steps: ${bottlenecks.map(b => b.stepName).join(', ')}`);
    }
    
    if (failedSteps.length > 0) {
      recommendations.push(`Fix failed steps: ${failedSteps.map(s => s.stepName).join(', ')}`);
    }
    
    if (audit.totalCost > 1.0) {
      recommendations.push('Consider cost optimization - high API usage detected');
    }

    return { bottlenecks, failedSteps, costBreakdown, recommendations };
  }

  /**
   * 📊 GET COMPREHENSIVE AUDIT REPORT
   */
  getAuditReport(accountId: string): string {
    const audit = this.audits.get(accountId);
    if (!audit) return 'No audit data found';

    const analysis = this.analyzeSteps(accountId);
    
    let report = `
🔍 PIPELINE AUDIT REPORT: ${audit.accountName}
${'='.repeat(60)}

📊 OVERVIEW:
   Session ID: ${audit.sessionId}
   Total Duration: ${audit.endTime ? audit.endTime - audit.startTime : 'In Progress'}ms
   Steps Completed: ${audit.successfulSteps}/${audit.totalSteps}
   Success Rate: ${((audit.successfulSteps / audit.totalSteps) * 100).toFixed(1)}%
   Total Cost: $${audit.totalCost.toFixed(4)}
   Quality Score: ${audit.qualityScore || 'Not calculated'}%

📋 STEP-BY-STEP BREAKDOWN:
`;

    audit.steps.forEach((step, index) => {
      const duration = step.endTime ? step.endTime - step.startTime : 'In Progress';
      const status = step.success ? '✅' : (step.endTime ? '❌' : '⏳');
      
      report += `   ${index + 1}. ${status} ${step.stepName} (${step.stepType}) - ${duration}ms\n`;
      
      if (step.apiCost) {
        report += `      💰 Cost: $${step.apiCost.toFixed(4)}\n`;
      }
      
      if (step.errorMessage) {
        report += `      ❌ Error: ${step.errorMessage}\n`;
      }
      
      if (step['outputData'] && typeof step['outputData'] === 'object') {
        const outputSummary = Array.isArray(step.outputData) 
          ? `${step.outputData.length} items`
          : Object.keys(step.outputData).length + ' fields';
        report += `      📤 Output: ${outputSummary}\n`;
      }
    });

    if (analysis.bottlenecks.length > 0) {
      report += `\n⚠️ PERFORMANCE BOTTLENECKS:\n`;
      analysis.bottlenecks.forEach(bottleneck => {
        report += `   - ${bottleneck.stepName}: ${bottleneck.duration}ms\n`;
      });
    }

    if (analysis.failedSteps.length > 0) {
      report += `\n❌ FAILED STEPS:\n`;
      analysis.failedSteps.forEach(failed => {
        report += `   - ${failed.stepName}: ${failed.errorMessage}\n`;
      });
    }

    if (analysis.costBreakdown.length > 0) {
      report += `\n💰 COST BREAKDOWN:\n`;
      analysis.costBreakdown.forEach(cost => {
        report += `   - ${cost.stepName}: $${cost.cost.toFixed(4)}\n`;
      });
    }

    if (audit['recommendations'] && audit.recommendations.length > 0) {
      report += `\n💡 RECOMMENDATIONS:\n`;
      audit.recommendations.forEach(rec => {
        report += `   - ${rec}\n`;
      });
    }

    return report;
  }

  /**
   * 🧹 CLEANUP OLD AUDITS
   */
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let removedCount = 0;

    for (const [accountId, audit] of this.audits.entries()) {
      if (audit.startTime < cutoff) {
        this.audits.delete(accountId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 [AUDIT] Cleaned up ${removedCount} old audits`);
    }
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive information and limit size
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove API keys and sensitive data
    if (typeof sanitized === 'object') {
      this.removeSensitiveFields(sanitized);
    }
    
    return sanitized;
  }

  private removeSensitiveFields(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    const sensitiveKeys = ['api_key', 'apikey', 'password', 'secret', 'token'];
    
    for (const key in obj) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        this.removeSensitiveFields(obj[key]);
      }
    }
  }

  private generateRecommendations(audit: PipelineAudit): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    const avgStepTime = audit.steps.reduce((sum, step) => {
      return sum + (step.endTime ? step.endTime - step.startTime : 0);
    }, 0) / audit.steps.length;
    
    if (avgStepTime > 5000) {
      recommendations.push('Consider parallelizing slow steps for better performance');
    }
    
    // Cost recommendations
    if (audit.totalCost > 0.5) {
      recommendations.push('High API cost detected - review cost optimization strategies');
    }
    
    // Quality recommendations
    const failureRate = (audit.failedSteps / audit.totalSteps) * 100;
    if (failureRate > 20) {
      recommendations.push('High failure rate - review error handling and API reliability');
    }
    
    return recommendations;
  }

  /**
   * 📊 GET ALL AUDITS SUMMARY
   */
  getAllAudits(): {
    totalAudits: number;
    avgProcessingTime: number;
    avgCost: number;
    avgSuccessRate: number;
    commonFailures: { stepName: string; count: number }[];
  } {
    const audits = Array.from(this.audits.values());
    
    if (audits['length'] === 0) {
      return {
        totalAudits: 0,
        avgProcessingTime: 0,
        avgCost: 0,
        avgSuccessRate: 0,
        commonFailures: []
      };
    }

    const totalProcessingTime = audits.reduce((sum, audit) => {
      return sum + (audit.endTime ? audit.endTime - audit.startTime : 0);
    }, 0);

    const totalCost = audits.reduce((sum, audit) => sum + audit.totalCost, 0);
    
    const totalSuccessRate = audits.reduce((sum, audit) => {
      return sum + (audit.successfulSteps / audit.totalSteps);
    }, 0);

    // Find common failures
    const failureMap: Map<string, number> = new Map();
    audits.forEach(audit => {
      audit.steps.filter(step => !step.success).forEach(step => {
        const count = failureMap.get(step.stepName) || 0;
        failureMap.set(step.stepName, count + 1);
      });
    });

    const commonFailures = Array.from(failureMap.entries())
      .map(([stepName, count]) => ({ stepName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAudits: audits.length,
      avgProcessingTime: totalProcessingTime / audits.length,
      avgCost: totalCost / audits.length,
      avgSuccessRate: (totalSuccessRate / audits.length) * 100,
      commonFailures
    };
  }
}
