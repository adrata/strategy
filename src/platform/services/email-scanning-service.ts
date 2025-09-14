import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BuyingSignal {
  type: string;
  score: number;
  keywords: string[];
  description: string;
}

export interface EmailAnalysisResult {
  emailId: string;
  buyingSignal: BuyingSignal | null;
  associatedEntities: {
    leads: string[];
    opportunities: string[];
    accounts: string[];
    contacts: string[];
  };
}

export class EmailScanningService {
  private buyingSignalPatterns: BuyingSignal[] = [
    {
      type: 'explicit_purchase_intent',
      score: 0.9,
      keywords: ['want to buy', 'ready to purchase', 'looking to buy', 'need to buy', 'interested in buying'],
      description: 'Explicit statement of purchase intent'
    },
    {
      type: 'pricing_inquiry',
      score: 0.8,
      keywords: ['pricing', 'cost', 'price', 'quote', 'estimate', 'how much'],
      description: 'Inquiry about pricing or costs'
    },
    {
      type: 'demo_request',
      score: 0.85,
      keywords: ['demo', 'demonstration', 'show me', 'walk through', 'presentation'],
      description: 'Request for product demonstration'
    },
    {
      type: 'trial_request',
      score: 0.8,
      keywords: ['trial', 'test', 'evaluate', 'try out', 'pilot'],
      description: 'Request for trial or evaluation'
    },
    {
      type: 'implementation_inquiry',
      score: 0.7,
      keywords: ['implementation', 'setup', 'deployment', 'installation', 'onboarding'],
      description: 'Inquiry about implementation process'
    },
    {
      type: 'contract_discussion',
      score: 0.75,
      keywords: ['contract', 'agreement', 'terms', 'legal', 'sign'],
      description: 'Discussion about contracts or agreements'
    },
    {
      type: 'budget_confirmation',
      score: 0.6,
      keywords: ['budget', 'approved', 'funding', 'allocation', 'authorized'],
      description: 'Confirmation of budget or funding'
    },
    {
      type: 'timeline_discussion',
      score: 0.5,
      keywords: ['timeline', 'schedule', 'when', 'deadline', 'timeline'],
      description: 'Discussion about purchase timeline'
    }
  ];

  /**
   * Scan emails for buying signals and update the database
   */
  async scanEmailsForBuyingSignals(workspaceId: string): Promise<EmailAnalysisResult[]> {
    try {
      console.log(`🔍 Scanning emails for buying signals in workspace: ${workspaceId}`);

      // Get all emails in the workspace
      const emails = await prisma.emailMessage.findMany({
        where: {
          account: {
            workspaceId: workspaceId
          },
          buyingSignal: null // Only scan emails that haven't been analyzed yet
        },
        select: {
          id: true,
          subject: true,
          body: true,
          from: true,
          to: true,
          receivedAt: true
        }
      });

      console.log(`📧 Found ${emails.length} emails to analyze`);

      const results: EmailAnalysisResult[] = [];

      for (const email of emails) {
        const analysis = await this.analyzeEmail(email);
        
        if (analysis.buyingSignal) {
          // Update the email with buying signal information
          await prisma.emailMessage.update({
            where: { id: email.id },
            data: {
              buyingSignal: analysis.buyingSignal.type,
              buyingSignalScore: analysis.buyingSignal.score
            }
          });

          // Associate email with relevant entities
          await this.associateEmailWithEntities(email.id, analysis.associatedEntities);
        }

        results.push(analysis);
      }

      console.log(`✅ Completed email analysis. Found ${results.filter(r => r.buyingSignal).length} emails with buying signals`);

      return results;
    } catch (error) {
      console.error('❌ Error scanning emails for buying signals:', error);
      throw error;
    }
  }

  /**
   * Analyze a single email for buying signals
   */
  private async analyzeEmail(email: { id: string; subject: string; body: string; from: string; to: string[] }): Promise<EmailAnalysisResult> {
    // Strip HTML tags from email body for analysis
    const plainTextBody = this.stripHtmlTags(email.body);
    const content = `${email.subject} ${plainTextBody}`.toLowerCase();
    let bestSignal: BuyingSignal | null = null;
    let bestScore = 0;

    // Check each buying signal pattern
    for (const pattern of this.buyingSignalPatterns) {
      for (const keyword of pattern.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          if (pattern.score > bestScore) {
            bestSignal = pattern;
            bestScore = pattern.score;
          }
          break; // Found a match for this pattern, move to next pattern
        }
      }
    }

    // Find associated entities based on email addresses
    const associatedEntities = await this.findAssociatedEntities(email.from, email.to);

    return {
      emailId: email.id,
      buyingSignal: bestSignal,
      associatedEntities
    };
  }

  /**
   * Find leads, opportunities, accounts, and contacts associated with email addresses
   */
  private async findAssociatedEntities(fromEmail: string, toEmails: string[]): Promise<{
    leads: string[];
    opportunities: string[];
    accounts: string[];
    contacts: string[];
  }> {
    const allEmails = [fromEmail, ...toEmails];
    const emailDomains = allEmails.map(email => email.split('@')[1]).filter(Boolean);

    const [leads, contacts, accounts] = await Promise.all([
      // Find leads by email
      prisma.leads.findMany({
        where: {
          OR: [
            { email: { in: allEmails } },
            { workEmail: { in: allEmails } },
            { personalEmail: { in: allEmails } },
            { companyDomain: { in: emailDomains } }
          ]
        },
        select: { id: true }
      }),

      // Find contacts by email
      prisma.contacts.findMany({
        where: {
          OR: [
            { email: { in: allEmails } },
            { workEmail: { in: allEmails } },
            { personalEmail: { in: allEmails } },
            { secondaryEmail: { in: allEmails } }
          ]
        },
        select: { id: true }
      }),

      // Find accounts by email domain
      prisma.accounts.findMany({
        where: {
          OR: [
            { email: { in: allEmails } },
            { website: { contains: emailDomains[0] || '' } }
          ]
        },
        select: { id: true }
      })
    ]);

    // Find opportunities associated with these leads and contacts
    const leadIds = leads.map(l => l.id);
    const contactIds = contacts.map(c => c.id);
    const accountIds = accounts.map(a => a.id);

    const opportunities = await prisma.opportunities.findMany({
      where: {
        OR: [
          { leadId: { in: leadIds } },
          { accountId: { in: accountIds } },
          { contacts: { some: { id: { in: contactIds } } } }
        ]
      },
      select: { id: true }
    });

    return {
      leads: leadIds,
      contacts: contactIds,
      accounts: accountIds,
      opportunities: opportunities.map(o => o.id)
    };
  }

  /**
   * Associate an email with relevant entities
   */
  private async associateEmailWithEntities(
    emailId: string,
    entities: { leads: string[]; opportunities: string[]; accounts: string[]; contacts: string[] }
  ): Promise<void> {
    const { leads, opportunities, accounts, contacts } = entities;

    // Create associations
    await Promise.all([
      // Associate with leads
      ...leads.map(leadId =>
        prisma.leads.update({
          where: { id: leadId },
          data: { emails: { connect: { id: emailId } } }
        })
      ),

      // Associate with opportunities
      ...opportunities.map(oppId =>
        prisma.opportunities.update({
          where: { id: oppId },
          data: { emails: { connect: { id: emailId } } }
        })
      ),

      // Associate with accounts
      ...accounts.map(accountId =>
        prisma.accounts.update({
          where: { id: accountId },
          data: { emails: { connect: { id: emailId } } }
        })
      ),

      // Associate with contacts
      ...contacts.map(contactId =>
        prisma.contacts.update({
          where: { id: contactId },
          data: { emails: { connect: { id: emailId } } }
        })
      )
    ]);
  }

  /**
   * Get emails with buying signals for a specific entity
   */
  async getEmailsWithBuyingSignals(entityType: 'lead' | 'opportunity' | 'account' | 'contact', entityId: string): Promise<any[]> {
    const emails = await prisma.emailMessage.findMany({
      where: {
        buyingSignal: { not: null },
        [entityType + 's']: {
          some: { id: entityId }
        }
      },
      select: {
        id: true,
        subject: true,
        from: true,
        to: true,
        receivedAt: true,
        buyingSignal: true,
        buyingSignalScore: true,
        body: true
      },
      orderBy: { receivedAt: 'desc' }
    });

    return emails;
  }

  /**
   * Get buying signal statistics for a workspace
   */
  async getBuyingSignalStats(workspaceId: string): Promise<{
    totalEmails: number;
    emailsWithSignals: number;
    signalTypes: Record<string, number>;
    topSignals: Array<{ type: string; count: number; avgScore: number }>;
  }> {
    const [totalEmails, emailsWithSignals, signalTypes] = await Promise.all([
      prisma.emailMessage.count({
        where: {
          account: {
            workspace: { slug: workspaceId }
          }
        }
      }),

      prisma.emailMessage.count({
        where: {
          account: {
            workspace: { slug: workspaceId }
          },
          buyingSignal: { not: null }
        }
      }),

      prisma.emailMessage.groupBy({
        by: ['buyingSignal'],
        where: {
          account: {
            workspace: { slug: workspaceId }
          },
          buyingSignal: { not: null }
        },
        _count: { buyingSignal: true },
        _avg: { buyingSignalScore: true }
      })
    ]);

    const topSignals = signalTypes
      .map(signal => ({
        type: signal.buyingSignal!,
        count: signal._count.buyingSignal,
        avgScore: signal._avg.buyingSignalScore || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const signalTypeCounts = signalTypes.reduce((acc, signal) => {
      acc[signal.buyingSignal!] = signal._count.buyingSignal;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEmails,
      emailsWithSignals,
      signalTypes: signalTypeCounts,
      topSignals
    };
  }

  /**
   * Strip HTML tags from email content to get plain text for analysis
   */
  private stripHtmlTags(html: string): string {
    if (!html) return '';
    
    // Replace HTML tags with spaces to preserve word boundaries
    const withoutTags = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags and content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove style tags and content
      .replace(/<[^>]+>/g, ' ')                          // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')                           // Replace &nbsp; with space
      .replace(/&amp;/g, '&')                            // Replace &amp; with &
      .replace(/&lt;/g, '<')                             // Replace &lt; with <
      .replace(/&gt;/g, '>')                             // Replace &gt; with >
      .replace(/&quot;/g, '"')                           // Replace &quot; with "
      .replace(/&#39;/g, "'")                            // Replace &#39; with '
      .replace(/\s+/g, ' ')                              // Replace multiple spaces with single space
      .trim();                                           // Trim whitespace
    
    return withoutTags;
  }
}

export const emailScanningService = new EmailScanningService(); 