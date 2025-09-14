/**
 * 🚀 PIPELINE DATA SERVICE
 * Unified service for pipeline data operations
 */

import { prisma } from '@/platform/database/prisma-client';

export interface OpportunityWithDetails {
  id: string;
  name: string;
  value: string;
  stage: string;
  status: string;
  company: string;
  probability: number;
  closeDate: string;
  source: string;
  contact: string;
  lastAction: string;
  nextAction: string;
  lastActionDate: string;
  nextActionDate: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class PipelineDataService {
  static async getOpportunity(id: string): Promise<OpportunityWithDetails | null> {
    try {
      const opportunity = await prisma.opportunities.findUnique({
        where: { id },
        include: {
          accounts: true,
          leads: true,
        }
      });

      if (!opportunity) {
        return null;
      }

      return {
        id: opportunity.id,
        name: opportunity.name,
        value: opportunity.amount?.toString() || '0',
        stage: opportunity.stage,
        status: 'active',
        company: opportunity.accounts?.name || 'Unknown',
        probability: opportunity.probability || 0,
        closeDate: opportunity.expectedCloseDate?.toISOString() || '',
        source: opportunity.source || 'Unknown',
        contact: opportunity.leads?.fullName || 'Unknown',
        lastAction: opportunity.lastActivityDate?.toISOString() || '',
        nextAction: opportunity.nextSteps || '',
        lastActionDate: opportunity.lastActivityDate?.toISOString() || '',
        nextActionDate: opportunity.nextActivityDate?.toISOString() || '',
        notes: opportunity.notes || '',
        tags: opportunity.tags || [],
        createdAt: opportunity.createdAt.toISOString(),
        updatedAt: opportunity.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      return null;
    }
  }

  static async getOpportunities(workspaceId: string): Promise<OpportunityWithDetails[]> {
    try {
      const opportunities = await prisma.opportunities.findMany({
        where: { workspaceId },
        include: {
          accounts: true,
          leads: true,
        },
        orderBy: { updatedAt: 'desc' }
      });

      return opportunities.map(opp => ({
        id: opp.id,
        name: opp.name,
        value: opp.amount?.toString() || '0',
        stage: opp.stage,
        status: 'active',
        company: opp.accounts?.name || 'Unknown',
        probability: opp.probability || 0,
        closeDate: opp.expectedCloseDate?.toISOString() || '',
        source: opp.source || 'Unknown',
        contact: opp.leads?.fullName || 'Unknown',
        lastAction: opp.lastActivityDate?.toISOString() || '',
        nextAction: opp.nextSteps || '',
        lastActionDate: opp.lastActivityDate?.toISOString() || '',
        nextActionDate: opp.nextActivityDate?.toISOString() || '',
        notes: opp.notes || '',
        tags: opp.tags || [],
        createdAt: opp.createdAt.toISOString(),
        updatedAt: opp.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }
}
