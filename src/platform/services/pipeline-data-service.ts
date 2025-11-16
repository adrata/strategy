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
          company: {
            select: {
              id: true,
              name: true,
              lastAction: true,
              lastActionDate: true,
              nextAction: true,
              nextActionDate: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
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
        company: opportunity.company?.name || '-',
        probability: (opportunity.probability || 0) * 100, // Convert to percentage
        closeDate: opportunity.expectedCloseDate?.toISOString() || '',
        source: '-', // Not in opportunities table, can be added later if needed
        contact: '-', // Not in opportunities table, can be added later if needed
        lastAction: opportunity.company?.lastAction || '-',
        nextAction: opportunity.company?.nextAction || '-',
        lastActionDate: opportunity.company?.lastActionDate?.toISOString() || '',
        nextActionDate: opportunity.company?.nextActionDate?.toISOString() || '',
        notes: opportunity.description || '',
        tags: [], // Not in opportunities table, can be added later if needed
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
        where: { 
          workspaceId,
          deletedAt: null
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              lastAction: true,
              lastActionDate: true,
              nextAction: true,
              nextActionDate: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return opportunities.map(opp => ({
        id: opp.id,
        name: opp.name,
        value: opp.amount?.toString() || '0',
        stage: opp.stage,
        status: 'active',
        company: opp.company?.name || '-',
        probability: (opp.probability || 0) * 100, // Convert to percentage
        closeDate: opp.expectedCloseDate?.toISOString() || '',
        source: '-', // Not in opportunities table, can be added later if needed
        contact: '-', // Not in opportunities table, can be added later if needed
        lastAction: opp.company?.lastAction || '-',
        nextAction: opp.company?.nextAction || '-',
        lastActionDate: opp.company?.lastActionDate?.toISOString() || '',
        nextActionDate: opp.company?.nextActionDate?.toISOString() || '',
        notes: opp.description || '',
        tags: [], // Not in opportunities table, can be added later if needed
        createdAt: opp.createdAt.toISOString(),
        updatedAt: opp.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }
}
