/**
 * Deal Value Estimation Service
 * 
 * Estimates deal value for opportunities based on TOP Engineering Plus business model
 * Uses company size, industry, engagement level, and project type indicators
 */

import { prisma } from '@/platform/database/prisma-client';

export interface DealValueEstimationInput {
  companyName: string;
  industry?: string | null;
  employeeCount?: number | null;
  revenue?: number | null;
  description?: string | null;
  descriptionEnriched?: string | null;
  businessChallenges?: string[];
  businessPriorities?: string[];
  lastAction?: string | null;
  engagementLevel?: 'low' | 'medium' | 'high';
}

export class DealValueEstimationService {
  /**
   * Estimate deal value for TOP Engineering Plus opportunities
   * 
   * TOP Engineering Plus provides:
   * - Strategic Plan Review: $25K-$75K
   * - Gap Analysis: $50K-$150K
   * - Process Mapping: $75K-$200K
   * - Technology Deployment: $100K-$500K
   * - Infrastructure Modernization: $250K-$2M+
   * - Broadband Infrastructure Design: $150K-$1M+
   * - Change Management Consulting: $100K-$400K
   * - Project Execution & Fulfillment: $200K-$1M+
   */
  static async estimateDealValue(
    input: DealValueEstimationInput,
    workspaceId: string
  ): Promise<number> {
    try {
      // Get workspace context
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: {
          businessModel: true,
          serviceOfferings: true,
          idealCustomerProfile: true
        }
      });

      // Base estimation factors
      let baseValue = 0;
      let multiplier = 1.0;

      // Factor 1: Company Size (employee count)
      const employeeCount = input.employeeCount || 0;
      if (employeeCount >= 5000) {
        baseValue = 500000; // Large enterprise: $500K base
        multiplier = 1.5;
      } else if (employeeCount >= 1000) {
        baseValue = 250000; // Large company: $250K base
        multiplier = 1.2;
      } else if (employeeCount >= 500) {
        baseValue = 150000; // Mid-large: $150K base
        multiplier = 1.0;
      } else if (employeeCount >= 100) {
        baseValue = 100000; // Mid-size: $100K base
        multiplier = 0.9;
      } else if (employeeCount >= 50) {
        baseValue = 75000; // Small-mid: $75K base
        multiplier = 0.8;
      } else {
        baseValue = 50000; // Small: $50K base
        multiplier = 0.7;
      }

      // Factor 2: Industry (utilities and infrastructure get higher values)
      const industry = (input.industry || '').toLowerCase();
      if (industry.includes('utility') || industry.includes('infrastructure') || 
          industry.includes('telecommunications') || industry.includes('energy')) {
        multiplier *= 1.3; // Infrastructure/utility projects are typically larger
      } else if (industry.includes('municipal') || industry.includes('government') || 
                 industry.includes('public sector')) {
        multiplier *= 1.2; // Public sector projects are substantial
      } else if (industry.includes('manufacturing') || industry.includes('construction')) {
        multiplier *= 1.1; // Industrial projects are moderate-large
      }

      // Factor 3: Revenue (if available, use as indicator)
      if (input.revenue) {
        const revenue = Number(input.revenue);
        if (revenue >= 100000000) { // $100M+
          multiplier *= 1.2;
        } else if (revenue >= 10000000) { // $10M+
          multiplier *= 1.1;
        } else if (revenue < 1000000) { // <$1M
          multiplier *= 0.9;
        }
      }

      // Factor 4: Engagement Level
      const engagementLevel = input.engagementLevel || this.inferEngagementLevel(input);
      if (engagementLevel === 'high') {
        multiplier *= 1.2; // High engagement suggests serious opportunity
      } else if (engagementLevel === 'low') {
        multiplier *= 0.8; // Low engagement suggests early stage
      }

      // Factor 5: Project Type Indicators (from description/challenges/priorities)
      const projectTypeMultiplier = this.detectProjectType(input);
      multiplier *= projectTypeMultiplier;

      // Calculate final estimate
      let estimatedValue = baseValue * multiplier;

      // Round to nearest $5K for cleaner numbers
      estimatedValue = Math.round(estimatedValue / 5000) * 5000;

      // For TOP Engineering Plus, contracts are typically $150k-$500k
      // Ensure estimates fall within this range
      estimatedValue = Math.max(150000, Math.min(500000, estimatedValue));

      console.log(`💰 [DEAL VALUE] Estimated for ${input.companyName}:`, {
        baseValue,
        multiplier,
        estimatedValue,
        factors: {
          employeeCount,
          industry,
          engagementLevel,
          projectTypeMultiplier
        }
      });

      return estimatedValue;
    } catch (error) {
      console.error('Error estimating deal value:', error);
      // Default fallback: $75K for mid-size opportunities
      return 75000;
    }
  }

  /**
   * Infer engagement level from available data
   */
  private static inferEngagementLevel(input: DealValueEstimationInput): 'low' | 'medium' | 'high' {
    // High engagement indicators
    if (input.lastAction) {
      const lastAction = input.lastAction.toLowerCase();
      if (lastAction.includes('meeting') || lastAction.includes('call') || 
          lastAction.includes('proposal') || lastAction.includes('quote')) {
        return 'high';
      }
    }

    // Medium engagement indicators
    if (input.businessChallenges && input.businessChallenges.length > 0) {
      return 'medium';
    }

    // Default to medium for opportunities
    return 'medium';
  }

  /**
   * Detect project type from company data and apply appropriate multiplier
   */
  private static detectProjectType(input: DealValueEstimationInput): number {
    const text = [
      input.description || '',
      input.descriptionEnriched || '',
      ...(input.businessChallenges || []),
      ...(input.businessPriorities || [])
    ].join(' ').toLowerCase();

    // Infrastructure Modernization (highest value)
    if (text.includes('infrastructure') && (text.includes('modernization') || text.includes('upgrade') || text.includes('update'))) {
      return 1.5; // $250K-$2M+ range
    }

    // Broadband Deployment
    if (text.includes('broadband') || text.includes('fiber') || text.includes('network deployment')) {
      return 1.4; // $150K-$1M+ range
    }

    // Technology Deployment
    if (text.includes('technology deployment') || text.includes('system implementation') || text.includes('digital transformation')) {
      return 1.3; // $100K-$500K range
    }

    // Change Management / Process Optimization
    if (text.includes('change management') || text.includes('process optimization') || text.includes('operational excellence')) {
      return 1.2; // $100K-$400K range
    }

    // Strategic Planning
    if (text.includes('strategic planning') || text.includes('strategic plan') || text.includes('roadmap')) {
      return 1.1; // $50K-$200K range
    }

    // Gap Analysis
    if (text.includes('gap analysis') || text.includes('assessment') || text.includes('evaluation')) {
      return 1.0; // $50K-$150K range
    }

    // Default multiplier
    return 1.0;
  }
}

