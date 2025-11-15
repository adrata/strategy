/**
 * Intelligent Opportunity Stage Detection Service
 * 
 * Determines what stage/gate an opportunity is in based on:
 * - Recent actions (emails, calls, meetings, proposals)
 * - Engagement level (replies, business discussion)
 * - Meeting history
 * - Proposal/demo status
 * - Stakeholder engagement
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type OpportunityStage = 
  | 'QUALIFICATION'    // Initial qualification - determining fit
  | 'DISCOVERY'        // Understanding needs and pain points
  | 'PROPOSAL'         // Proposal/demo delivered
  | 'NEGOTIATION'      // Negotiating terms and pricing
  | 'CLOSING'          // Final decision stage
  | 'CLOSED_WON'       // Deal won
  | 'CLOSED_LOST';     // Deal lost

export interface StageDetectionResult {
  stage: OpportunityStage;
  confidence: number; // 0-100
  reasoning: string;
  nextGate: string;
  recommendedActions: string[];
}

export class OpportunityStageDetectionService {
  /**
   * Detect opportunity stage based on engagement history
   */
  static async detectStage(
    personId: string,
    workspaceId: string
  ): Promise<StageDetectionResult> {
    // Get all actions for this person
    const actions = await prisma.actions.findMany({
      where: {
        personId,
        workspaceId,
        deletedAt: null
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 50
    });

    // Get email engagement
    const emails = await prisma.email_messages.findMany({
      where: {
        personId,
        workspaceId
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 20
    });

    // Get meeting history
    const meetings = await prisma.events.findMany({
      where: {
        personId,
        workspaceId
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 20
    });

    // Get person details
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: {
        status: true,
        lastAction: true,
        lastActionDate: true,
        companyId: true
      }
    });

    // Analyze actions to determine stage
    return this.analyzeStage(actions, emails, meetings, person);
  }

  /**
   * Analyze actions, emails, and meetings to determine stage
   */
  private static analyzeStage(
    actions: any[],
    emails: any[],
    meetings: any[],
    person: any
  ): StageDetectionResult {
    const completedActions = actions.filter(a => a.status === 'COMPLETED');
    const actionTypes = completedActions.map(a => a.type?.toUpperCase() || '');

    // Check for closed stages first
    if (person?.status === 'CLIENT' || actionTypes.includes('CLOSED_WON')) {
      return {
        stage: 'CLOSED_WON',
        confidence: 95,
        reasoning: 'Person is marked as CLIENT or has CLOSED_WON action',
        nextGate: 'Onboarding',
        recommendedActions: ['Schedule onboarding call', 'Set up account access']
      };
    }

    if (actionTypes.includes('CLOSED_LOST')) {
      return {
        stage: 'CLOSED_LOST',
        confidence: 95,
        reasoning: 'Deal marked as CLOSED_LOST',
        nextGate: 'Post-mortem',
        recommendedActions: ['Document loss reason', 'Update CRM']
      };
    }

    // Check for proposal/demo actions
    const hasProposal = actionTypes.some(t => 
      t.includes('PROPOSAL') || t.includes('QUOTE') || t.includes('PRICING')
    );
    const hasDemo = actionTypes.some(t => 
      t.includes('DEMO') || t.includes('DEMONSTRATION')
    );

    if (hasProposal || hasDemo) {
      // Check if there's follow-up after proposal
      const proposalIndex = completedActions.findIndex(a => 
        a.type?.toUpperCase().includes('PROPOSAL') || 
        a.type?.toUpperCase().includes('QUOTE')
      );
      
      if (proposalIndex >= 0) {
        const actionsAfterProposal = completedActions.slice(0, proposalIndex);
        const hasNegotiation = actionsAfterProposal.some(a => 
          a.type?.toUpperCase().includes('NEGOTIATION') ||
          a.type?.toUpperCase().includes('CONTRACT') ||
          a.type?.toUpperCase().includes('TERMS')
        );

        if (hasNegotiation) {
          return {
            stage: 'NEGOTIATION',
            confidence: 85,
            reasoning: 'Proposal sent and negotiation activities detected',
            nextGate: 'Contract finalization',
            recommendedActions: [
              'Follow up on proposal feedback',
              'Address any concerns or objections',
              'Schedule decision meeting'
            ]
          };
        }

        return {
          stage: 'PROPOSAL',
          confidence: 80,
          reasoning: 'Proposal or demo delivered, awaiting response',
          nextGate: 'Proposal acceptance',
          recommendedActions: [
            'Follow up on proposal',
            'Address questions or concerns',
            'Schedule proposal review meeting'
          ]
        };
      }
    }

    // Check for discovery activities
    const hasDiscoveryCall = actionTypes.some(t => 
      t.includes('DISCOVERY') || t.includes('QUALIFICATION')
    );
    const hasMeeting = meetings.length > 0;
    const hasBusinessDiscussion = this.hasBusinessKeywords(emails);

    if (hasDiscoveryCall || (hasMeeting && hasBusinessDiscussion)) {
      return {
        stage: 'DISCOVERY',
        confidence: 75,
        reasoning: 'Discovery call completed or business discussion detected in meetings/emails',
        nextGate: 'Needs validation',
        recommendedActions: [
          'Schedule demo or product walkthrough',
          'Send case studies or references',
          'Prepare proposal based on discovered needs'
        ]
      };
    }

    // Check for initial engagement
    const hasReply = emails.some(e => 
      e.subject?.match(/^(Re|RE|Fwd|FWD):\s*/i) || e.threadId
    );
    const hasInitialContact = completedActions.some(a => 
      a.type?.toUpperCase().includes('EMAIL') ||
      a.type?.toUpperCase().includes('CALL') ||
      a.type?.toUpperCase().includes('LINKEDIN')
    );

    if (hasReply || hasInitialContact) {
      return {
        stage: 'QUALIFICATION',
        confidence: 70,
        reasoning: 'Initial contact made, prospect has engaged',
        nextGate: 'BANT qualification',
        recommendedActions: [
          'Schedule discovery call',
          'Qualify budget, authority, need, timeline',
          'Map stakeholder structure'
        ]
      };
    }

    // Default: Qualification stage
    return {
      stage: 'QUALIFICATION',
      confidence: 50,
      reasoning: 'No clear stage indicators found, defaulting to qualification',
      nextGate: 'Initial engagement',
      recommendedActions: [
        'Send initial outreach email',
        'Research company and identify key contacts',
        'Schedule introduction call'
      ]
    };
  }

  /**
   * Check if emails contain business discussion keywords
   */
  private static hasBusinessKeywords(emails: any[]): boolean {
    const businessKeywords = [
      'proposal', 'quote', 'pricing', 'contract', 'deal',
      'project', 'scope', 'budget', 'investment', 'purchase',
      'demo', 'meeting', 'requirements', 'solution', 'opportunity'
    ];

    for (const email of emails) {
      const text = `${email.subject || ''} ${email.body || ''}`.toLowerCase();
      const matches = businessKeywords.filter(kw => text.includes(kw)).length;
      if (matches >= 2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate smart next action based on stage
   */
  static async generateSmartNextAction(
    personId: string,
    workspaceId: string
  ): Promise<string> {
    const stageResult = await this.detectStage(personId, workspaceId);
    
    // Get last action to avoid repetition
    const lastAction = await prisma.actions.findFirst({
      where: {
        personId,
        workspaceId,
        deletedAt: null,
        status: 'COMPLETED'
      },
      orderBy: {
        completedAt: 'desc'
      },
      select: {
        type: true,
        subject: true
      }
    });

    // If last action matches recommended, use next recommendation
    const lastActionType = lastAction?.type?.toUpperCase() || '';
    const recommendedActions = stageResult.recommendedActions.filter(action => {
      const actionLower = action.toLowerCase();
      if (lastActionType.includes('EMAIL') && actionLower.includes('email')) {
        return false; // Don't repeat email actions
      }
      if (lastActionType.includes('CALL') && actionLower.includes('call')) {
        return false; // Don't repeat call actions
      }
      return true;
    });

    return recommendedActions[0] || stageResult.recommendedActions[0];
  }
}

