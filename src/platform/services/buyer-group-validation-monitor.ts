/**
 * Buyer Group Validation Monitor
 * 
 * This service monitors buyer group data for domain mismatches and other
 * validation issues. It provides:
 * - Real-time domain validation during sync operations
 * - Logging and alerting for mismatches
 * - Metrics tracking for validation success/failure rates
 * - Integration with buyer group sync service
 */

import { prisma } from '@/platform/database/prisma-client';

interface DomainMismatch {
  personId: string;
  personName: string;
  personEmail: string;
  emailDomain: string;
  companyId: string;
  companyName: string;
  companyDomain: string;
  mismatchType: 'SAME_NAME_DIFFERENT_TLD' | 'DIFFERENT_DOMAINS' | 'SUBDOMAIN_VARIATION';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

interface ValidationMetrics {
  totalChecked: number;
  mismatches: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  validationErrors: number;
}

export class BuyerGroupValidationMonitor {
  private static metrics: ValidationMetrics = {
    totalChecked: 0,
    mismatches: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0,
    validationErrors: 0
  };

  private static recentMismatches: DomainMismatch[] = [];
  private static readonly MAX_RECENT_MISMATCHES = 100;

  /**
   * Extract domain from email or URL
   */
  private static extractDomain(input: string | null | undefined): string | null {
    if (!input) return null;
    const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return url.toLowerCase();
  }

  /**
   * Check if domains match (strict TLD checking)
   */
  private static domainsMatchStrict(emailDomain: string, companyDomain: string): boolean {
    if (!emailDomain || !companyDomain) return false;
    
    const emailRoot = emailDomain.split('.').slice(-2).join('.');
    const companyRoot = companyDomain.split('.').slice(-2).join('.');
    
    return emailRoot === companyRoot;
  }

  /**
   * Categorize the type and severity of domain mismatch
   */
  private static categorizeMismatch(emailDomain: string, companyDomain: string): {
    type: 'SAME_NAME_DIFFERENT_TLD' | 'DIFFERENT_DOMAINS' | 'SUBDOMAIN_VARIATION';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  } {
    const emailRoot = emailDomain.split('.').slice(-2).join('.');
    const companyRoot = companyDomain.split('.').slice(-2).join('.');
    
    const emailBase = emailRoot.split('.')[0];
    const companyBase = companyRoot.split('.')[0];
    
    // Same base name but different TLD (most critical)
    if (emailBase === companyBase && emailRoot !== companyRoot) {
      return {
        type: 'SAME_NAME_DIFFERENT_TLD',
        severity: 'HIGH'
      };
    }
    
    // Completely different domains
    if (emailBase !== companyBase) {
      return {
        type: 'DIFFERENT_DOMAINS',
        severity: 'MEDIUM'
      };
    }
    
    // Subdomain variation (likely same company)
    return {
      type: 'SUBDOMAIN_VARIATION',
      severity: 'LOW'
    };
  }

  /**
   * Validate a single person's buyer group membership
   */
  static async validatePerson(personId: string): Promise<{
    valid: boolean;
    mismatch?: DomainMismatch;
  }> {
    try {
      this.metrics.totalChecked++;

      const person = await prisma.people.findUnique({
        where: { id: personId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              domain: true
            }
          }
        }
      });

      if (!person || !person.isBuyerGroupMember) {
        return { valid: true };
      }

      const personEmail = person.email || person.workEmail;
      const company = person.company;

      if (!personEmail || !company) {
        return { valid: true };
      }

      const emailDomain = this.extractDomain(personEmail.split('@')[1]);
      const companyDomain = this.extractDomain(company.website || company.domain);

      if (!emailDomain || !companyDomain) {
        return { valid: true };
      }

      const domainsMatch = this.domainsMatchStrict(emailDomain, companyDomain);

      if (!domainsMatch) {
        this.metrics.mismatches++;
        
        const mismatchInfo = this.categorizeMismatch(emailDomain, companyDomain);
        
        if (mismatchInfo.severity === 'HIGH') this.metrics.highSeverity++;
        else if (mismatchInfo.severity === 'MEDIUM') this.metrics.mediumSeverity++;
        else if (mismatchInfo.severity === 'LOW') this.metrics.lowSeverity++;

        const mismatch: DomainMismatch = {
          personId: person.id,
          personName: person.fullName,
          personEmail,
          emailDomain,
          companyId: company.id,
          companyName: company.name,
          companyDomain,
          mismatchType: mismatchInfo.type,
          severity: mismatchInfo.severity,
          timestamp: new Date()
        };

        this.logMismatch(mismatch);
        this.trackRecentMismatch(mismatch);

        return { valid: false, mismatch };
      }

      return { valid: true };

    } catch (error) {
      this.metrics.validationErrors++;
      console.error('❌ [BUYER GROUP MONITOR] Validation error:', error);
      return { valid: true }; // Fail open - don't block on validation errors
    }
  }

  /**
   * Validate all buyer group members for a company
   */
  static async validateCompany(companyId: string): Promise<{
    valid: boolean;
    mismatches: DomainMismatch[];
  }> {
    const people = await prisma.people.findMany({
      where: {
        companyId,
        isBuyerGroupMember: true,
        deletedAt: null
      }
    });

    const mismatches: DomainMismatch[] = [];

    for (const person of people) {
      const result = await this.validatePerson(person.id);
      if (!result.valid && result.mismatch) {
        mismatches.push(result.mismatch);
      }
    }

    return {
      valid: mismatches.length === 0,
      mismatches
    };
  }

  /**
   * Log a domain mismatch
   */
  private static logMismatch(mismatch: DomainMismatch): void {
    const severityEmoji = mismatch.severity === 'HIGH' ? '🔴' : 
                         mismatch.severity === 'MEDIUM' ? '🟡' : '🟢';
    
    console.warn(`${severityEmoji} [BUYER GROUP MONITOR] Domain mismatch detected [${mismatch.severity}]`);
    console.warn(`   Type: ${mismatch.mismatchType}`);
    console.warn(`   Person: ${mismatch.personName} (${mismatch.personEmail})`);
    console.warn(`   Email Domain: ${mismatch.emailDomain}`);
    console.warn(`   Company: ${mismatch.companyName} (${mismatch.companyDomain})`);
    console.warn(`   Person ID: ${mismatch.personId}`);
    console.warn(`   Company ID: ${mismatch.companyId}`);

    // For high severity mismatches, create more visible alerts
    if (mismatch.severity === 'HIGH') {
      console.error(`🚨 [BUYER GROUP MONITOR] HIGH SEVERITY MISMATCH - Same company name with different TLD!`);
      console.error(`   This likely indicates a person from a different regional company was incorrectly added`);
      console.error(`   Example: underline.cz (Czech) vs underline.com (US)`);
    }
  }

  /**
   * Track recent mismatches for reporting
   */
  private static trackRecentMismatch(mismatch: DomainMismatch): void {
    this.recentMismatches.unshift(mismatch);
    
    // Keep only the most recent mismatches
    if (this.recentMismatches.length > this.MAX_RECENT_MISMATCHES) {
      this.recentMismatches = this.recentMismatches.slice(0, this.MAX_RECENT_MISMATCHES);
    }
  }

  /**
   * Get current validation metrics
   */
  static getMetrics(): ValidationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent mismatches
   */
  static getRecentMismatches(limit: number = 10): DomainMismatch[] {
    return this.recentMismatches.slice(0, limit);
  }

  /**
   * Reset metrics (useful for testing or periodic reset)
   */
  static resetMetrics(): void {
    this.metrics = {
      totalChecked: 0,
      mismatches: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      validationErrors: 0
    };
  }

  /**
   * Generate a summary report
   */
  static generateReport(): string {
    const metrics = this.getMetrics();
    const mismatchRate = metrics.totalChecked > 0 
      ? ((metrics.mismatches / metrics.totalChecked) * 100).toFixed(2)
      : '0.00';

    let report = '\n📊 BUYER GROUP VALIDATION REPORT\n';
    report += '='.repeat(60) + '\n';
    report += `Total Validations: ${metrics.totalChecked}\n`;
    report += `Total Mismatches: ${metrics.mismatches} (${mismatchRate}%)\n`;
    report += `\nBy Severity:\n`;
    report += `  🔴 High:   ${metrics.highSeverity}\n`;
    report += `  🟡 Medium: ${metrics.mediumSeverity}\n`;
    report += `  🟢 Low:    ${metrics.lowSeverity}\n`;
    report += `\nValidation Errors: ${metrics.validationErrors}\n`;

    if (this.recentMismatches.length > 0) {
      report += `\nRecent Mismatches (last ${Math.min(5, this.recentMismatches.length)}):\n`;
      this.recentMismatches.slice(0, 5).forEach((m, i) => {
        const severityEmoji = m.severity === 'HIGH' ? '🔴' : m.severity === 'MEDIUM' ? '🟡' : '🟢';
        report += `  ${i + 1}. ${severityEmoji} ${m.personName} - ${m.emailDomain} vs ${m.companyDomain}\n`;
      });
    }

    report += '='.repeat(60) + '\n';
    return report;
  }

  /**
   * Check if monitoring should trigger an alert
   */
  static shouldAlert(): boolean {
    const metrics = this.getMetrics();
    
    // Alert if high severity mismatches exceed threshold
    if (metrics.highSeverity >= 5) {
      return true;
    }

    // Alert if mismatch rate is too high (>10%)
    if (metrics.totalChecked > 100) {
      const mismatchRate = (metrics.mismatches / metrics.totalChecked) * 100;
      if (mismatchRate > 10) {
        return true;
      }
    }

    return false;
  }

  /**
   * Send alert (placeholder - integrate with actual alerting system)
   */
  static async sendAlert(message: string): Promise<void> {
    console.error('🚨 [BUYER GROUP MONITOR] ALERT:', message);
    
    // TODO: Integrate with actual alerting system
    // - Send email to admins
    // - Post to Slack channel
    // - Create incident ticket
    // - etc.
  }
}

