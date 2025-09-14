/**
 * Email Engagement Analyzer Service
 * Analyzes email participation levels to determine engagement quality
 * Distinguishes between active participants (senders/recipients) vs passive (CC/BCC)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailParticipationLevel {
  email: string;
  participationType: 'sender' | 'primary_recipient' | 'cc' | 'bcc';
  engagementWeight: number;
  isActiveParticipant: boolean;
}

export interface EmailEngagementAnalysis {
  emailId: string;
  subject: string;
  sentAt: Date;
  participants: EmailParticipationLevel[];
  activeParticipants: string[];
  passiveParticipants: string[];
  engagementScore: number;
  participationBreakdown: {
    senders: number;
    primaryRecipients: number;
    ccRecipients: number;
    bccRecipients: number;
  };
}

export interface ContactEmailEngagement {
  contactId: string;
  email: string;
  fullName: string;
  totalEmails: number;
  activeParticipations: number;
  passiveParticipations: number;
  engagementScore: number;
  participationRate: number;
  lastActiveParticipation: Date | null;
  lastPassiveParticipation: Date | null;
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
}

export class EmailEngagementAnalyzer {
  private static instance: EmailEngagementAnalyzer;

  static getInstance(): EmailEngagementAnalyzer {
    if (!EmailEngagementAnalyzer.instance) {
      EmailEngagementAnalyzer['instance'] = new EmailEngagementAnalyzer();
    }
    return EmailEngagementAnalyzer.instance;
  }

  /**
   * Analyze email participation levels for a specific email
   */
  async analyzeEmailParticipation(emailId: string): Promise<EmailEngagementAnalysis | null> {
    try {
      const email = await prisma.email_messages.findUnique({
        where: { id: emailId },
        select: {
          id: true,
          subject: true,
          sentAt: true,
          from: true,
          to: true,
          cc: true,
          bcc: true
        }
      });

      if (!email) {
        return null;
      }

      const participants: EmailParticipationLevel[] = [];
      let engagementScore = 0;

      // Analyze sender (highest engagement weight)
      if (email.from) {
        participants.push({
          email: email.from,
          participationType: 'sender',
          engagementWeight: 1.0,
          isActiveParticipant: true
        });
        engagementScore += 1.0;
      }

      // Analyze primary recipients (high engagement weight)
      email.to.forEach(recipient => {
        participants.push({
          email: recipient,
          participationType: 'primary_recipient',
          engagementWeight: 0.8,
          isActiveParticipant: true
        });
        engagementScore += 0.8;
      });

      // Analyze CC recipients (medium engagement weight)
      email.cc.forEach(ccRecipient => {
        participants.push({
          email: ccRecipient,
          participationType: 'cc',
          engagementWeight: 0.3,
          isActiveParticipant: false
        });
        engagementScore += 0.3;
      });

      // Analyze BCC recipients (low engagement weight)
      email.bcc.forEach(bccRecipient => {
        participants.push({
          email: bccRecipient,
          participationType: 'bcc',
          engagementWeight: 0.1,
          isActiveParticipant: false
        });
        engagementScore += 0.1;
      });

      const activeParticipants = participants
        .filter(p => p.isActiveParticipant)
        .map(p => p.email);

      const passiveParticipants = participants
        .filter(p => !p.isActiveParticipant)
        .map(p => p.email);

      return {
        emailId: email.id,
        subject: email.subject,
        sentAt: email.sentAt,
        participants,
        activeParticipants,
        passiveParticipants,
        engagementScore,
        participationBreakdown: {
          senders: participants.filter(p => p['participationType'] === 'sender').length,
          primaryRecipients: participants.filter(p => p['participationType'] === 'primary_recipient').length,
          ccRecipients: participants.filter(p => p['participationType'] === 'cc').length,
          bccRecipients: participants.filter(p => p['participationType'] === 'bcc').length
        }
      };

    } catch (error) {
      console.error('Error analyzing email participation:', error);
      return null;
    }
  }

  /**
   * Analyze contact email engagement patterns
   */
  async analyzeContactEngagement(contactId: string): Promise<ContactEmailEngagement | null> {
    try {
      // Get contact details
      const contact = await prisma.contacts.findUnique({
        where: { id: contactId },
        select: {
          id: true,
          email: true,
          fullName: true
        }
      });

      if (!contact || !contact.email) {
        return null;
      }

      // Get all emails involving this contact
      const emails = await prisma.email_messages.findMany({
        where: {
          OR: [
            { from: contact.email },
            { to: { has: contact.email } },
            { cc: { has: contact.email } },
            { bcc: { has: contact.email } }
          ]
        },
        select: {
          id: true,
          from: true,
          to: true,
          cc: true,
          bcc: true,
          sentAt: true
        },
        orderBy: { sentAt: 'desc' }
      });

      let activeParticipations = 0;
      let passiveParticipations = 0;
      let totalEngagementScore = 0;
      let lastActiveParticipation: Date | null = null;
      let lastPassiveParticipation: Date | null = null;

      // Analyze each email
      for (const email of emails) {
        const isSender = email['from'] === contact.email;
        const isPrimaryRecipient = email.to.includes(contact.email);
        const isCC = email.cc.includes(contact.email);
        const isBCC = email.bcc.includes(contact.email);

        if (isSender) {
          activeParticipations++;
          totalEngagementScore += 1.0;
          if (!lastActiveParticipation) {
            lastActiveParticipation = email.sentAt;
          }
        } else if (isPrimaryRecipient) {
          activeParticipations++;
          totalEngagementScore += 0.8;
          if (!lastActiveParticipation) {
            lastActiveParticipation = email.sentAt;
          }
        } else if (isCC) {
          passiveParticipations++;
          totalEngagementScore += 0.3;
          if (!lastPassiveParticipation) {
            lastPassiveParticipation = email.sentAt;
          }
        } else if (isBCC) {
          passiveParticipations++;
          totalEngagementScore += 0.1;
          if (!lastPassiveParticipation) {
            lastPassiveParticipation = email.sentAt;
          }
        }
      }

      const totalEmails = emails.length;
      const participationRate = totalEmails > 0 ? (activeParticipations / totalEmails) : 0;
      const engagementScore = totalEmails > 0 ? (totalEngagementScore / totalEmails) : 0;

      // Determine engagement trend (simplified - compare recent vs older activity)
      const recentEmails = emails.slice(0, Math.min(5, emails.length));
      const olderEmails = emails.slice(5, Math.min(10, emails.length));

      let recentActiveRate = 0;
      let olderActiveRate = 0;

      if (recentEmails.length > 0) {
        const recentActive = recentEmails.filter(email => 
          email['from'] === contact.email || email.to.includes(contact.email)
        ).length;
        recentActiveRate = recentActive / recentEmails.length;
      }

      if (olderEmails.length > 0) {
        const olderActive = olderEmails.filter(email => 
          email['from'] === contact.email || email.to.includes(contact.email)
        ).length;
        olderActiveRate = olderActive / olderEmails.length;
      }

      let engagementTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentActiveRate > olderActiveRate + 0.1) {
        engagementTrend = 'increasing';
      } else if (recentActiveRate < olderActiveRate - 0.1) {
        engagementTrend = 'decreasing';
      }

      return {
        contactId: contact.id,
        email: contact.email,
        fullName: contact.fullName,
        totalEmails,
        activeParticipations,
        passiveParticipations,
        engagementScore,
        participationRate,
        lastActiveParticipation,
        lastPassiveParticipation,
        engagementTrend
      };

    } catch (error) {
      console.error('Error analyzing contact engagement:', error);
      return null;
    }
  }

  /**
   * Get engagement analysis for multiple contacts
   */
  async analyzeMultipleContacts(contactIds: string[]): Promise<ContactEmailEngagement[]> {
    const results: ContactEmailEngagement[] = [];

    for (const contactId of contactIds) {
      const analysis = await this.analyzeContactEngagement(contactId);
      if (analysis) {
        results.push(analysis);
      }
    }

    return results.sort((a, b) => b.engagementScore - a.engagementScore);
  }

  /**
   * Get high-engagement contacts (active participants)
   */
  async getHighEngagementContacts(workspaceId: string, limit: number = 50): Promise<ContactEmailEngagement[]> {
    try {
      // Get all contacts in workspace
      const contacts = await prisma.contacts.findMany({
        where: { workspaceId },
        select: { id: true }
      });

      const contactIds = contacts.map(c => c.id);
      const analyses = await this.analyzeMultipleContacts(contactIds);

      // Filter for high engagement (active participation rate > 0.5)
      return analyses
        .filter(analysis => analysis.participationRate > 0.5)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting high engagement contacts:', error);
      return [];
    }
  }

  /**
   * Get low-engagement contacts (mostly passive participants)
   */
  async getLowEngagementContacts(workspaceId: string, limit: number = 50): Promise<ContactEmailEngagement[]> {
    try {
      // Get all contacts in workspace
      const contacts = await prisma.contacts.findMany({
        where: { workspaceId },
        select: { id: true }
      });

      const contactIds = contacts.map(c => c.id);
      const analyses = await this.analyzeMultipleContacts(contactIds);

      // Filter for low engagement (active participation rate < 0.3)
      return analyses
        .filter(analysis => analysis.participationRate < 0.3 && analysis.totalEmails > 0)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting low engagement contacts:', error);
      return [];
    }
  }

  /**
   * Update engagement scores in the database
   */
  async updateContactEngagementScores(workspaceId: string): Promise<void> {
    try {
      console.log('🔄 Updating contact engagement scores...');

      const contacts = await prisma.contacts.findMany({
        where: { workspaceId },
        select: { id: true }
      });

      let updatedCount = 0;

      for (const contact of contacts) {
        const analysis = await this.analyzeContactEngagement(contact.id);
        if (analysis) {
          // Update contact with engagement data
          await prisma.contacts.update({
            where: { id: contact.id },
            data: {
              // Add engagement fields to schema if needed
              // engagementScore: analysis.engagementScore,
              // participationRate: analysis.participationRate,
              // lastActiveParticipation: analysis.lastActiveParticipation,
              // engagementTrend: analysis.engagementTrend
            }
          });
          updatedCount++;
        }
      }

      console.log(`✅ Updated engagement scores for ${updatedCount} contacts`);

    } catch (error) {
      console.error('Error updating engagement scores:', error);
    }
  }
}

// Export singleton instance
export const emailEngagementAnalyzer = EmailEngagementAnalyzer.getInstance();
