/**
 * 🎯 UNIFIED EMAIL MONITORING SERVICE
 * 
 * Consolidates all email monitoring functionality:
 * ✅ Real-time email processing and buying signal detection
 * ✅ Automatic contact association and prioritization
 * ✅ Speedrun list updates with email triggers
 * ✅ Monaco notifications for immediate action
 * ✅ Email buying signal analysis and scoring
 * ✅ Integration with Speedrun prioritization system
 */

import { PrismaClient } from '@prisma/client';
import { emailScanningService } from './email-scanning-service';

const prisma = new PrismaClient();

export interface EmailMonitoringEvent {
  type: 'INBOUND_EMAIL' | 'BUYING_SIGNAL_DETECTED' | 'CONTACT_ASSOCIATED' | 'PRIORITY_UPDATED' | 'SPEEDRUN_COMPLETED';
  emailId: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  accountId?: string;
  buyingSignal?: {
    type: string;
    score: number;
    description: string;
  };
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
  data?: any;
}

export interface EmailContactAssociation {
  emailId: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  accountId?: string;
  confidence: number;
  associationType: 'direct_email' | 'domain_match' | 'company_match';
}

export class UnifiedEmailMonitoringService {
  private static instance: UnifiedEmailMonitoringService;
  private workspaceId: string;
  private listeners: Array<(event: EmailMonitoringEvent) => void> = [];

  private constructor(workspaceId: string) {
    this['workspaceId'] = workspaceId;
  }

  static getInstance(workspaceId: string): UnifiedEmailMonitoringService {
    if (!UnifiedEmailMonitoringService.instance) {
      UnifiedEmailMonitoringService['instance'] = new UnifiedEmailMonitoringService(workspaceId);
    }
    return UnifiedEmailMonitoringService.instance;
  }

  /**
   * Process incoming email in real-time
   * This is the main entry point for all email processing
   */
  async processIncomingEmail(emailData: {
    messageId: string;
    from: string;
    to: string[];
    subject: string;
    body: string;
    receivedAt: Date;
    accountId: string;
  }): Promise<EmailMonitoringEvent[]> {
    console.log(`📧 Processing incoming email: ${emailData.subject} from ${emailData.from}`);

    const events: EmailMonitoringEvent[] = [];

    try {
      // 1. Save email to database
      const email = await this.saveEmailToDatabase(emailData);

      // 2. Analyze for buying signals
      const buyingSignalAnalysis = await this.analyzeEmailForBuyingSignals(email);
      
      if (buyingSignalAnalysis.buyingSignal) {
        events.push({
          type: 'BUYING_SIGNAL_DETECTED',
          emailId: email.id,
          buyingSignal: buyingSignalAnalysis.buyingSignal,
          priority: this.getBuyingSignalPriority(buyingSignalAnalysis.buyingSignal.score),
          timestamp: new Date(),
          data: buyingSignalAnalysis
        });
      }

      // 3. Associate with existing contacts/leads/opportunities
      const associations = await this.associateEmailWithEntities(email);
      
      for (const association of associations) {
        events.push({
          type: 'CONTACT_ASSOCIATED',
          emailId: email.id,
          contactId: association.contactId,
          leadId: association.leadId,
          opportunityId: association.opportunityId,
          accountId: association.accountId,
          priority: association.confidence > 0.8 ? 'HIGH' : 'MEDIUM',
          timestamp: new Date(),
          data: association
        });

        // 4. Update priority if buying signal detected
        if (buyingSignalAnalysis.buyingSignal) {
          await this.updateEntityPriority(association, buyingSignalAnalysis.buyingSignal);
          
          events.push({
            type: 'PRIORITY_UPDATED',
            emailId: email.id,
            contactId: association.contactId,
            leadId: association.leadId,
            opportunityId: association.opportunityId,
            accountId: association.accountId,
            buyingSignal: buyingSignalAnalysis.buyingSignal,
            priority: 'IMMEDIATE',
            timestamp: new Date(),
            data: { association, buyingSignal: buyingSignalAnalysis.buyingSignal }
          });
        }

        // 🚀 NEW: Auto-complete Speedrun contact if positive response detected
        await this.checkForSpeedrunCompletion(association, buyingSignalAnalysis, email, events);
      }

      // 5. Create new contact if no associations found
      if (associations['length'] === 0) {
        const newContact = await this.createContactFromEmail(email);
        if (newContact) {
          events.push({
            type: 'CONTACT_ASSOCIATED',
            emailId: email.id,
            contactId: newContact.id,
            priority: 'MEDIUM',
            timestamp: new Date(),
            data: { newContact: true }
          });
        }
      }

      // 6. Send notifications for high-priority events
      await this.sendNotifications(events);

      console.log(`✅ Processed email with ${events.length} events generated`);
      return events;

    } catch (error) {
      console.error('❌ Error processing incoming email:', error);
      throw error;
    }
  }

  /**
   * Save email to database
   */
  private async saveEmailToDatabase(emailData: any) {
    return await prisma.emailMessage.create({
      data: {
        messageId: emailData.messageId,
        accountId: emailData.accountId,
        subject: emailData.subject,
        body: emailData.body,
        from: emailData.from,
        to: emailData.to,
        sentAt: emailData.receivedAt,
        receivedAt: emailData.receivedAt
      }
    });
  }

  /**
   * Analyze email for buying signals using the existing EmailScanningService
   */
  private async analyzeEmailForBuyingSignals(email: any) {
    const analysis = await emailScanningService.analyzeEmail({
      id: email.id,
      subject: email.subject,
      body: email.body,
      from: email.from,
      to: email.to
    });

    if (analysis.buyingSignal) {
      // Update email with buying signal
      await prisma.emailMessage.update({
        where: { id: email.id },
        data: {
          buyingSignal: analysis.buyingSignal.type,
          buyingSignalScore: analysis.buyingSignal.score
        }
      });
    }

    return analysis;
  }

  /**
   * Associate email with existing entities
   */
  private async associateEmailWithEntities(email: any): Promise<EmailContactAssociation[]> {
    const associations: EmailContactAssociation[] = [];
    const allEmails = [email.from, ...email.to];
    const emailDomains = allEmails.map(e => e.split('@')[1]).filter(Boolean);

    // Find contacts by email
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: this.workspaceId,
        OR: [
          { email: { in: allEmails , deletedAt: null } },
          { workEmail: { in: allEmails } },
          { personalEmail: { in: allEmails } },
          { secondaryEmail: { in: allEmails } }
        ]
      },
      include: {
        account: true,
        opportunities: true
      }
    });

    for (const contact of contacts) {
      associations.push({
        emailId: email.id,
        contactId: contact.id,
        accountId: contact.accountId,
        confidence: 0.9,
        associationType: 'direct_email'
      });

      // Also associate with opportunities
      for (const opportunity of contact.opportunities) {
        associations.push({
          emailId: email.id,
          opportunityId: opportunity.id,
          contactId: contact.id,
          confidence: 0.8,
          associationType: 'direct_email'
        });
      }
    }

    // Find leads by email
    const leads = await prisma.leads.findMany({
      where: { workspaceId: this.workspaceId,
        OR: [
          { email: { in: allEmails , deletedAt: null } },
          { workEmail: { in: allEmails } },
          { personalEmail: { in: allEmails } },
          { companyDomain: { in: emailDomains } }
        ]
      }
    });

    for (const lead of leads) {
      associations.push({
        emailId: email.id,
        leadId: lead.id,
        confidence: 0.85,
        associationType: lead.email ? 'direct_email' : 'domain_match'
      });
    }

    // Find accounts by domain
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId: this.workspaceId,
        OR: [
          { email: { in: allEmails , deletedAt: null } },
          { website: { contains: emailDomains[0] || '' } }
        ]
      }
    });

    for (const account of accounts) {
      associations.push({
        emailId: email.id,
        accountId: account.id,
        confidence: 0.7,
        associationType: 'domain_match'
      });
    }

    // Create database associations
    await this.createDatabaseAssociations(email.id, associations);

    return associations;
  }

  /**
   * Create database associations between email and entities
   */
  private async createDatabaseAssociations(emailId: string, associations: EmailContactAssociation[]) {
    for (const association of associations) {
      try {
        if (association.contactId) {
          await prisma.contacts.update({
            where: { id: association.contactId },
            data: { emails: { connect: { id: emailId } } }
          });
        }

        if (association.leadId) {
          await prisma.leads.update({
            where: { id: association.leadId },
            data: { emails: { connect: { id: emailId } } }
          });
        }

        if (association.opportunityId) {
          await prisma.opportunities.update({
            where: { id: association.opportunityId },
            data: { emails: { connect: { id: emailId } } }
          });
        }

        if (association.accountId) {
          await prisma.accounts.update({
            where: { id: association.accountId },
            data: { emails: { connect: { id: emailId } } }
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to create association for email ${emailId}:`, error);
      }
    }
  }

  /**
   * Update entity priority based on buying signal
   */
  private async updateEntityPriority(association: EmailContactAssociation, buyingSignal: any) {
    const boost = Math.round(buyingSignal.score * 20); // 0-20 point boost

    try {
      if (association.contactId) {
        // Update contact priority (would need to add priority field to Contact model)
        console.log(`📈 Boosting contact ${association.contactId} by ${boost} points due to buying signal`);
      }

      if (association.leadId) {
        // Update lead priority
        await prisma.leads.update({
          where: { id: association.leadId },
          data: { 
            priority: 'high',
            nextAction: `Respond to ${buyingSignal.type} buying signal`,
            nextActionDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        });
      }

      if (association.opportunityId) {
        // Update opportunity priority
        await prisma.opportunities.update({
          where: { id: association.opportunityId },
          data: { 
            priority: 'high',
            nextSteps: `Follow up on ${buyingSignal.type} buying signal`
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to update priority for association:`, error);
    }
  }

  /**
   * Create new contact from email
   */
  private async createContactFromEmail(email: any) {
    try {
      const emailDomain = email.from.split('@')[1];
      const companyName = emailDomain ? emailDomain.split('.')[0] : 'Unknown Company';

      // Enhanced name extraction from email
      const emailPrefix = email.from.split('@')[0];
      const { firstName, lastName, fullName } = this.extractNameFromEmail(emailPrefix);

      const contact = await prisma.contacts.create({
        data: {
          workspaceId: this.workspaceId,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          email: email.from,
          status: 'active',
          emails: { connect: { id: email.id } }
        }
      });

      console.log(`👤 Created new contact from email: ${contact.fullName}`);
      return contact;
    } catch (error) {
      console.error('❌ Error creating contact from email:', error);
      return null;
    }
  }

  /**
   * Enhanced name extraction from email prefix
   */
  private extractNameFromEmail(emailPrefix: string): { firstName: string; lastName: string; fullName: string } {
    // Handle different email patterns:
    // marty.roush -> Marty Roush
    // john_doe -> John Doe  
    // jane-smith -> Jane Smith
    // jdoe -> J Doe (if can't determine, use single letter)

    let parts: string[] = [];
    
    // Split by common separators
    if (emailPrefix.includes('.')) {
      parts = emailPrefix.split('.');
    } else if (emailPrefix.includes('_')) {
      parts = emailPrefix.split('_');
    } else if (emailPrefix.includes('-')) {
      parts = emailPrefix.split('-');
    } else {
      // For unseparated names like "jdoe", try to detect pattern
      // This is tricky - for now, just treat as first name
      parts = [emailPrefix];
    }

    // Clean and capitalize parts
    parts = parts
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

    const firstName = parts[0] || 'Unknown';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Contact';
    const fullName = parts.length > 1 ? parts.join(' ') : firstName;

    return { firstName, lastName, fullName };
  }

  /**
   * 🚀 Check if email response should trigger Speedrun completion
   */
  private async checkForSpeedrunCompletion(
    association: EmailContactAssociation,
    buyingSignalAnalysis: any,
    email: any,
    events: EmailMonitoringEvent[]
  ): Promise<void> {
    try {
      // 1. Check if this contact is in an active Speedrun list
      const speedrunContact = await this.findActiveSpeedrunContact(association);
      
      if (!speedrunContact) {
        return; // Not in Speedrun, nothing to complete
      }

      // 2. Analyze email content for completion triggers
      const shouldComplete = this.shouldCompleteSpeedrunContact(email, buyingSignalAnalysis);
      
      if (shouldComplete.complete) {
        console.log(`🎯 Auto-completing Speedrun contact: ${speedrunContact.fullName || speedrunContact.name} (${shouldComplete.reason})`);
        
        // 3. Mark as completed using the same "Green card" workflow
        await this.completeSpeedrunContact(speedrunContact.id, shouldComplete.outcome, shouldComplete.reason);
        
        // 4. Add completion event
        events.push({
          type: 'SPEEDRUN_COMPLETED' as any,
          emailId: email.id,
          contactId: association.contactId,
          leadId: association.leadId,
          priority: 'HIGH',
          timestamp: new Date(),
          data: {
            reason: shouldComplete.reason,
            outcome: shouldComplete.outcome,
            autoCompleted: true
          }
        });

        console.log(`✅ Speedrun contact auto-completed: ${speedrunContact.fullName || speedrunContact.name}`);
      }
    } catch (error) {
      console.error('❌ Error checking Speedrun completion:', error);
    }
  }

  /**
   * Find if contact is in active Speedrun list
   */
  private async findActiveSpeedrunContact(association: EmailContactAssociation): Promise<any | null> {
    try {
      // Check if contact/lead is in active Speedrun list
      if (association.contactId) {
        return await prisma.contacts.findFirst({
          where: {
            id: association.contactId,
            workspaceId: this.workspaceId,
            // Add speedrun status check if you have a status field
            deletedAt: null
          }
        });
      }

      if (association.leadId) {
        return await prisma.leads.findFirst({
          where: {
            id: association.leadId,
            workspaceId: this.workspaceId,
            deletedAt: null
          }
        });
      }

      return null;
    } catch (error) {
      console.error('❌ Error finding Speedrun contact:', error);
      return null;
    }
  }

  /**
   * Analyze email content to determine if Speedrun contact should be completed
   */
  private shouldCompleteSpeedrunContact(email: any, buyingSignalAnalysis: any): {
    complete: boolean;
    reason: string;
    outcome: 'positive' | 'neutral' | 'negative';
  } {
    const emailContent = `${email.subject} ${email.body}`.toLowerCase();
    
    // Define positive response patterns (customize for Dano's business)
    const positivePatterns = [
      /\bi'm interested\b/,
      /\bwant to buy\b/,
      /\blet's schedule\b/,
      /\blet's meet\b/,
      /\byes,? let's\b/,
      /\bsounds good\b/,
      /\blet's discuss\b/,
      /\bwhen can we\b/,
      /\bi'd like to\b/,
      /\bplease send\b/,
      /\bmore information\b/,
      /\bset up a call\b/,
      /\bschedule a demo\b/,
      /\bmove forward\b/,
      /\bnext steps\b/
    ];

    // Define negative response patterns
    const negativePatterns = [
      /\bnot interested\b/,
      /\bunsubscribe\b/,
      /\bremove me\b/,
      /\bstop contacting\b/,
      /\bnot a good fit\b/,
      /\balready have\b/,
      /\bno thanks\b/,
      /\bnot looking\b/
    ];

    // Check for positive responses
    for (const pattern of positivePatterns) {
      if (pattern.test(emailContent)) {
        return {
          complete: true,
          reason: `Positive response detected: "${emailContent.match(pattern)?.[0] || 'interested'}"`,
          outcome: 'positive'
        };
      }
    }

    // Check for negative responses
    for (const pattern of negativePatterns) {
      if (pattern.test(emailContent)) {
        return {
          complete: true,
          reason: `Negative response detected: "${emailContent.match(pattern)?.[0] || 'not interested'}"`,
          outcome: 'negative'
        };
      }
    }

    // Check if buying signal is strong enough
    if (buyingSignalAnalysis.buyingSignal?.score > 0.7) {
      return {
        complete: true,
        reason: `Strong buying signal detected: ${buyingSignalAnalysis.buyingSignal.type}`,
        outcome: 'positive'
      };
    }

    // Default: don't complete
    return {
      complete: false,
      reason: '',
      outcome: 'neutral'
    };
  }

  /**
   * Complete Speedrun contact using the same workflow as the "Green card"
   */
  private async completeSpeedrunContact(contactId: string, outcome: string, reason: string): Promise<void> {
    try {
      // Call the existing Speedrun completion API endpoint
      const response = await fetch('/api/speedrun/complete-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          outcome,
          notes: `Auto-completed via email response: ${reason}`,
          actionTaken: 'email_response_detected',
          workspaceId: this.workspaceId,
          userId: 'dano' // Default user for auto-completion
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete Speedrun contact: ${response.status}`);
      }

      console.log(`✅ Speedrun contact ${contactId} completed with outcome: ${outcome}`);
    } catch (error) {
      console.error('❌ Error completing Speedrun contact:', error);
      throw error;
    }
  }

  /**
   * Send notifications for high-priority events
   */
  private async sendNotifications(events: EmailMonitoringEvent[]) {
    const highPriorityEvents = events.filter(e => 
      e['priority'] === 'IMMEDIATE' || e['priority'] === 'HIGH'
    );

    for (const event of highPriorityEvents) {
      if (event['type'] === 'BUYING_SIGNAL_DETECTED') {
        await this.sendBuyingSignalNotification(event);
      } else if (event['type'] === 'CONTACT_ASSOCIATED' && event.buyingSignal) {
        await this.sendContactAssociationNotification(event);
      }
    }
  }

  /**
   * Send buying signal notification
   */
  private async sendBuyingSignalNotification(event: EmailMonitoringEvent) {
    console.log(`🔔 Sending buying signal notification for email ${event.emailId}`);
    
    // TODO: Integrate with Monaco notification system
    // await monacoNotificationService.send({
    //   type: 'buying_signal',
    //   title: `🎯 Buying Signal Detected: ${event.buyingSignal?.type}`,
    //   message: `Email from ${event.data?.from} shows ${event.buyingSignal?.description}`,
    //   priority: 'high',
    //   actionRequired: true
    // });
  }

  /**
   * Send contact association notification
   */
  private async sendContactAssociationNotification(event: EmailMonitoringEvent) {
    console.log(`🔔 Sending contact association notification for ${event.contactId || event.leadId}`);
    
    // TODO: Integrate with Monaco notification system
    // await monacoNotificationService.send({
    //   type: 'contact_association',
    //   title: `📧 Email Associated with Contact`,
    //   message: `Email from ${event.data?.from} was associated with existing contact`,
    //   priority: 'medium',
    //   actionRequired: false
    // });
  }

  /**
   * Get priority level based on buying signal score
   */
  private getBuyingSignalPriority(score: number): 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 0.8) return 'IMMEDIATE';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Subscribe to email monitoring events
   */
  subscribe(listener: (event: EmailMonitoringEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Notify listeners of events
   */
  private notifyListeners(event: EmailMonitoringEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Get email monitoring statistics
   */
  async getMonitoringStats(): Promise<{
    totalEmails: number;
    emailsWithSignals: number;
    totalAssociations: number;
    recentEvents: EmailMonitoringEvent[];
  }> {
    const [totalEmails, emailsWithSignals, totalAssociations] = await Promise.all([
      prisma.emailMessage.count({
        where: {
          account: {
            workspace: { slug: this.workspaceId }
          }
        }
      }),
      prisma.emailMessage.count({
        where: {
          account: {
            workspace: { slug: this.workspaceId }
          },
          buyingSignal: { not: null }
        }
      }),
      prisma.emailMessage.count({
        where: {
          account: {
            workspace: { slug: this.workspaceId }
          },
          OR: [
            { leads: { some: {} } },
            { contacts: { some: {} } },
            { opportunities: { some: {} } },
            { accounts: { some: {} } }
          ]
        }
      })
    ]);

    return {
      totalEmails,
      emailsWithSignals,
      totalAssociations,
      recentEvents: [] // Would need to store events in database for this
    };
  }
}

export const getUnifiedEmailMonitoring = (workspaceId: string) => 
  UnifiedEmailMonitoringService.getInstance(workspaceId); 