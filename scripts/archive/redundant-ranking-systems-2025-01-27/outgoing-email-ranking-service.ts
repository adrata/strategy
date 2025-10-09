/**
 * Outgoing Email Ranking Service
 * Analyzes outgoing email engagement to enhance ranking system
 * Focuses on emails sent FROM our accounts to determine engagement quality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OutgoingEmailEngagement {
  contactId: string;
  email: string;
  fullName: string;
  company: string;
  
  // Outgoing email metrics
  emailsSentTo: number;
  emailsReceivedFrom: number;
  responseRate: number;
  avgResponseTime: number; // in hours
  
  // Engagement quality
  activeConversations: number;
  lastOutgoingEmail: Date | null;
  lastResponseReceived: Date | null;
  daysSinceLastOutgoing: number | null;
  daysSinceLastResponse: number | null;
  
  // Ranking factors
  engagementScore: number;
  responseQuality: 'high' | 'medium' | 'low';
  conversationMomentum: 'increasing' | 'stable' | 'decreasing';
  
  // Integration with ranking system
  rankingBoost: number;
  priorityLevel: 'urgent' | 'high' | 'medium' | 'low';
}

export interface OutgoingEmailRankingUpdate {
  contactId: string;
  rankingBoost: number;
  priorityLevel: string;
  engagementScore: number;
  lastOutgoingEmail: Date | null;
  responseRate: number;
  reason: string;
}

export class OutgoingEmailRankingService {
  private static instance: OutgoingEmailRankingService;

  static getInstance(): OutgoingEmailRankingService {
    if (!OutgoingEmailRankingService.instance) {
      OutgoingEmailRankingService['instance'] = new OutgoingEmailRankingService();
    }
    return OutgoingEmailRankingService.instance;
  }

  /**
   * Analyze outgoing email engagement for a specific contact
   */
  async analyzeOutgoingEngagement(contactId: string, workspaceId: string): Promise<OutgoingEmailEngagement | null> {
    try {
      // Get contact details
      const contact = await prisma.contacts.findUnique({
        where: { id: contactId },
        select: {
          id: true,
          email: true,
          fullName: true,
          company: true
        }
      });

      if (!contact || !contact.email) {
        return null;
      }

      // Get our email accounts in this workspace
      const ourAccounts = await prisma.email_accounts.findMany({
        where: { workspaceId },
        select: { email: true }
      });

      const ourEmails = ourAccounts.map(account => account.email);

      // Get all emails involving this contact
      const allEmails = await prisma.email_messages.findMany({
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
          sentAt: true,
          receivedAt: true,
          subject: true
        },
        orderBy: { sentAt: 'desc' }
      });

      // Separate outgoing vs incoming emails
      const outgoingEmails = allEmails.filter(email => 
        ourEmails.includes(email.from) && 
        (email.to.includes(contact.email) || email.cc.includes(contact.email))
      );

      const incomingEmails = allEmails.filter(email => 
        email['from'] === contact['email'] && 
        ourEmails.some(ourEmail => email.to.includes(ourEmail) || email.cc.includes(ourEmail))
      );

      // Calculate metrics
      const emailsSentTo = outgoingEmails.length;
      const emailsReceivedFrom = incomingEmails.length;
      const responseRate = emailsSentTo > 0 ? (emailsReceivedFrom / emailsSentTo) : 0;

      // Calculate response times
      let totalResponseTime = 0;
      let responseCount = 0;

      for (const outgoing of outgoingEmails) {
        // Find the next incoming email from this contact
        const nextIncoming = incomingEmails.find(incoming => 
          incoming.sentAt > outgoing.sentAt
        );
        
        if (nextIncoming) {
          const responseTime = (nextIncoming.sentAt.getTime() - outgoing.sentAt.getTime()) / (1000 * 60 * 60); // hours
          totalResponseTime += responseTime;
          responseCount++;
        }
      }

      const avgResponseTime = responseCount > 0 ? (totalResponseTime / responseCount) : 0;

      // Determine conversation momentum
      const recentOutgoing = outgoingEmails.slice(0, 5);
      const olderOutgoing = outgoingEmails.slice(5, 10);
      
      let conversationMomentum: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (recentOutgoing.length > 0 && olderOutgoing.length > 0) {
        const recentAvg = recentOutgoing.length / 5;
        const olderAvg = olderOutgoing.length / 5;
        
        if (recentAvg > olderAvg * 1.2) {
          conversationMomentum = 'increasing';
        } else if (recentAvg < olderAvg * 0.8) {
          conversationMomentum = 'decreasing';
        }
      }

      // Calculate engagement score
      let engagementScore = 0;
      
      // Base score from response rate
      engagementScore += responseRate * 40; // 0-40 points
      
      // Response time bonus (faster responses = higher score)
      if (avgResponseTime > 0) {
        if (avgResponseTime <= 24) engagementScore += 30; // Same day response
        else if (avgResponseTime <= 72) engagementScore += 20; // Within 3 days
        else if (avgResponseTime <= 168) engagementScore += 10; // Within a week
      }
      
      // Conversation momentum bonus
      if (conversationMomentum === 'increasing') engagementScore += 20;
      else if (conversationMomentum === 'stable') engagementScore += 10;
      
      // Recent activity bonus
      const lastOutgoingEmail = outgoingEmails[0]?.sentAt || null;
      const lastResponseReceived = incomingEmails[0]?.sentAt || null;
      
      const daysSinceLastOutgoing = lastOutgoingEmail ? 
        Math.floor((Date.now() - lastOutgoingEmail.getTime()) / (1000 * 60 * 60 * 24)) : null;
      
      const daysSinceLastResponse = lastResponseReceived ? 
        Math.floor((Date.now() - lastResponseReceived.getTime()) / (1000 * 60 * 60 * 24)) : null;

      if (daysSinceLastOutgoing !== null) {
        if (daysSinceLastOutgoing <= 1) engagementScore += 15;
        else if (daysSinceLastOutgoing <= 3) engagementScore += 10;
        else if (daysSinceLastOutgoing <= 7) engagementScore += 5;
      }

      // Determine response quality
      let responseQuality: 'high' | 'medium' | 'low' = 'low';
      if (responseRate >= 0.7 && avgResponseTime <= 48) {
        responseQuality = 'high';
      } else if (responseRate >= 0.4 || avgResponseTime <= 168) {
        responseQuality = 'medium';
      }

      // Calculate ranking boost
      let rankingBoost = 0;
      if (responseQuality === 'high') rankingBoost += 50;
      else if (responseQuality === 'medium') rankingBoost += 25;
      
      if (conversationMomentum === 'increasing') rankingBoost += 30;
      else if (conversationMomentum === 'stable') rankingBoost += 15;
      
      if (daysSinceLastOutgoing !== null && daysSinceLastOutgoing <= 3) rankingBoost += 20;
      else if (daysSinceLastOutgoing !== null && daysSinceLastOutgoing <= 7) rankingBoost += 10;

      // Determine priority level
      let priorityLevel: 'urgent' | 'high' | 'medium' | 'low' = 'low';
      if (rankingBoost >= 80) priorityLevel = 'urgent';
      else if (rankingBoost >= 50) priorityLevel = 'high';
      else if (rankingBoost >= 25) priorityLevel = 'medium';

      return {
        contactId: contact.id,
        email: contact.email,
        fullName: contact.fullName,
        company: contact.company || 'Unknown Company',
        emailsSentTo,
        emailsReceivedFrom,
        responseRate,
        avgResponseTime,
        activeConversations: Math.min(emailsSentTo, emailsReceivedFrom),
        lastOutgoingEmail,
        lastResponseReceived,
        daysSinceLastOutgoing,
        daysSinceLastResponse,
        engagementScore: Math.min(engagementScore, 100),
        responseQuality,
        conversationMomentum,
        rankingBoost,
        priorityLevel
      };

    } catch (error) {
      console.error('Error analyzing outgoing engagement:', error);
      return null;
    }
  }

  /**
   * Update ranking system with outgoing email engagement data
   */
  async updateRankingWithOutgoingEngagement(workspaceId: string): Promise<OutgoingEmailRankingUpdate[]> {
    try {
      console.log('🔄 Updating ranking system with outgoing email engagement...');

      const contacts = await prisma.contacts.findMany({
        where: { workspaceId },
        select: { id: true }
      });

      const updates: OutgoingEmailRankingUpdate[] = [];

      for (const contact of contacts) {
        const engagement = await this.analyzeOutgoingEngagement(contact.id, workspaceId);
        
        if (engagement && engagement.emailsSentTo > 0) {
          const reason = this.generateRankingReason(engagement);
          
          updates.push({
            contactId: contact.id,
            rankingBoost: engagement.rankingBoost,
            priorityLevel: engagement.priorityLevel,
            engagementScore: engagement.engagementScore,
            lastOutgoingEmail: engagement.lastOutgoingEmail,
            responseRate: engagement.responseRate,
            reason
          });

          // Update contact record with engagement data
          await prisma.contacts.update({
            where: { id: contact.id },
            data: {
              // Add these fields to schema if needed
              // outgoingEngagementScore: engagement.engagementScore,
              // responseRate: engagement.responseRate,
              // lastOutgoingEmail: engagement.lastOutgoingEmail,
              // priorityLevel: engagement.priorityLevel
            }
          });
        }
      }

      console.log(`✅ Updated ${updates.length} contacts with outgoing email engagement data`);
      return updates.sort((a, b) => b.rankingBoost - a.rankingBoost);

    } catch (error) {
      console.error('Error updating ranking with outgoing engagement:', error);
      return [];
    }
  }

  /**
   * Get high-priority contacts based on outgoing email engagement
   */
  async getHighPriorityContacts(workspaceId: string, limit: number = 50): Promise<OutgoingEmailEngagement[]> {
    try {
      const contacts = await prisma.contacts.findMany({
        where: { workspaceId },
        select: { id: true }
      });

      const engagements: OutgoingEmailEngagement[] = [];

      for (const contact of contacts) {
        const engagement = await this.analyzeOutgoingEngagement(contact.id, workspaceId);
        if (engagement && engagement.emailsSentTo > 0) {
          engagements.push(engagement);
        }
      }

      return engagements
        .filter(e => e['priorityLevel'] === 'urgent' || e['priorityLevel'] === 'high')
        .sort((a, b) => b.rankingBoost - a.rankingBoost)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting high priority contacts:', error);
      return [];
    }
  }

  /**
   * Generate ranking reason for display
   */
  private generateRankingReason(engagement: OutgoingEmailEngagement): string {
    const reasons: string[] = [];

    if (engagement.responseRate >= 0.7) {
      reasons.push('High response rate');
    }
    
    if (engagement.avgResponseTime <= 24) {
      reasons.push('Fast responses');
    }
    
    if (engagement['conversationMomentum'] === 'increasing') {
      reasons.push('Increasing engagement');
    }
    
    if (engagement.daysSinceLastOutgoing !== null && engagement.daysSinceLastOutgoing <= 3) {
      reasons.push('Recent activity');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Email engagement';
  }

  /**
   * Get dashboard metrics for outgoing email engagement
   */
  async getDashboardMetrics(workspaceId: string): Promise<{
    totalOutgoingEmails: number;
    highEngagementContacts: number;
    avgResponseRate: number;
    avgResponseTime: number;
    urgentContacts: number;
    recentActivity: number;
  }> {
    try {
      const updates = await this.updateRankingWithOutgoingEngagement(workspaceId);
      
      const totalOutgoingEmails = updates.reduce((sum, update) => sum + (update.lastOutgoingEmail ? 1 : 0), 0);
      const highEngagementContacts = updates.filter(u => u.engagementScore >= 70).length;
      const avgResponseRate = updates.length > 0 ? 
        updates.reduce((sum, update) => sum + update.responseRate, 0) / updates.length : 0;
      const urgentContacts = updates.filter(u => u['priorityLevel'] === 'urgent').length;
      
      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = updates.filter(u => 
        u['lastOutgoingEmail'] && u.lastOutgoingEmail >= sevenDaysAgo
      ).length;

      return {
        totalOutgoingEmails,
        highEngagementContacts,
        avgResponseRate: Math.round(avgResponseRate * 100) / 100,
        avgResponseTime: 0, // Calculate if needed
        urgentContacts,
        recentActivity
      };

    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        totalOutgoingEmails: 0,
        highEngagementContacts: 0,
        avgResponseRate: 0,
        avgResponseTime: 0,
        urgentContacts: 0,
        recentActivity: 0
      };
    }
  }
}

// Export singleton instance
export const outgoingEmailRankingService = OutgoingEmailRankingService.getInstance();
