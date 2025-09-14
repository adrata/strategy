/**
 * Email Linking Service
 * Links existing emails to contacts, leads, accounts, and prospects
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EmailLinkingService {
  private static instance: EmailLinkingService;
  
  private constructor() {}
  
  static getInstance(): EmailLinkingService {
    if (!EmailLinkingService.instance) {
      EmailLinkingService['instance'] = new EmailLinkingService();
    }
    return EmailLinkingService.instance;
  }
  
  /**
   * Link all unlinked emails for a workspace
   */
  async linkAllUnlinkedEmails(workspaceId: string): Promise<{
    totalEmails: number;
    linkedEmails: number;
    contactsLinked: number;
    leadsLinked: number;
    accountsLinked: number;
  }> {
    try {
      console.log(`🔗 Linking all unlinked emails for workspace: ${workspaceId}`);
      
      // Get all email accounts for the workspace
      const accountIds = await this.getAccountIdsForWorkspace(workspaceId);
      
      if (accountIds['length'] === 0) {
        console.log('❌ No email accounts found for workspace');
        return { totalEmails: 0, linkedEmails: 0, contactsLinked: 0, leadsLinked: 0, accountsLinked: 0 };
      }
      
      // Get all unlinked emails
      const unlinkedEmails = await this.getUnlinkedEmails(accountIds);
      
      console.log(`📧 Found ${unlinkedEmails.length} unlinked emails`);
      
      let linkedEmails = 0;
      let contactsLinked = 0;
      let leadsLinked = 0;
      let accountsLinked = 0;
      
      // Process emails in batches
      const batchSize = 50;
      for (let i = 0; i < unlinkedEmails.length; i += batchSize) {
        const batch = unlinkedEmails.slice(i, i + batchSize);
        
        for (const email of batch) {
          try {
            const result = await this.linkEmailToEntities(email, workspaceId);
            
            if (result.linked) {
              linkedEmails++;
              contactsLinked += result.contactsLinked;
              leadsLinked += result.leadsLinked;
              accountsLinked += result.accountsLinked;
            }
          } catch (error) {
            console.error(`❌ Error linking email ${email.id}:`, error);
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Linking completed:`);
      console.log(`   Total emails: ${unlinkedEmails.length}`);
      console.log(`   Linked emails: ${linkedEmails}`);
      console.log(`   Contacts linked: ${contactsLinked}`);
      console.log(`   Leads linked: ${leadsLinked}`);
      console.log(`   Accounts linked: ${accountsLinked}`);
      
      return {
        totalEmails: unlinkedEmails.length,
        linkedEmails,
        contactsLinked,
        leadsLinked,
        accountsLinked
      };
      
    } catch (error) {
      console.error('❌ Error in linkAllUnlinkedEmails:', error);
      throw error;
    }
  }
  
  /**
   * Link emails for a specific date range
   */
  async linkEmailsInDateRange(
    workspaceId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
    totalEmails: number;
    linkedEmails: number;
    contactsLinked: number;
    leadsLinked: number;
    accountsLinked: number;
  }> {
    try {
      console.log(`🔗 Linking emails in date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
      
      const accountIds = await this.getAccountIdsForWorkspace(workspaceId);
      
      if (accountIds['length'] === 0) {
        return { totalEmails: 0, linkedEmails: 0, contactsLinked: 0, leadsLinked: 0, accountsLinked: 0 };
      }
      
      // Get emails in date range
      const emails = await prisma.email_messages.findMany({
        where: {
          accountId: { in: accountIds },
          receivedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          from: true,
          to: true,
          subject: true,
          receivedAt: true
        }
      });
      
      console.log(`📧 Found ${emails.length} emails in date range`);
      
      let linkedEmails = 0;
      let contactsLinked = 0;
      let leadsLinked = 0;
      let accountsLinked = 0;
      
      for (const email of emails) {
        try {
          const result = await this.linkEmailToEntities(email, workspaceId);
          
          if (result.linked) {
            linkedEmails++;
            contactsLinked += result.contactsLinked;
            leadsLinked += result.leadsLinked;
            accountsLinked += result.accountsLinked;
          }
        } catch (error) {
          console.error(`❌ Error linking email ${email.id}:`, error);
        }
      }
      
      return {
        totalEmails: emails.length,
        linkedEmails,
        contactsLinked,
        leadsLinked,
        accountsLinked
      };
      
    } catch (error) {
      console.error('❌ Error in linkEmailsInDateRange:', error);
      throw error;
    }
  }
  
  /**
   * Get account IDs for a workspace
   */
  private async getAccountIdsForWorkspace(workspaceId: string): Promise<string[]> {
    const accounts = await prisma.email_accounts.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    return accounts.map(a => a.id);
  }
  
  /**
   * Get unlinked emails
   */
  private async getUnlinkedEmails(accountIds: string[]): Promise<any[]> {
    // Get all emails for the accounts
    const allEmails = await prisma.email_messages.findMany({
      where: { accountId: { in: accountIds } },
      select: { id: true }
    });
    
    const allEmailIds = allEmails.map(e => e.id);
    
    // Get linked email IDs
    const linkedEmailIds = new Set<string>();
    
    const [contactLinks, leadLinks, accountLinks] = await Promise.all([
      prisma.emailToContact.findMany({
        where: { A: { in: allEmailIds } },
        select: { A: true }
      }),
      prisma.emailToLead.findMany({
        where: { A: { in: allEmailIds } },
        select: { A: true }
      }),
      prisma.emailToAccount.findMany({
        where: { A: { in: allEmailIds } },
        select: { A: true }
      })
    ]);
    
    contactLinks.forEach(link => linkedEmailIds.add(link.A));
    leadLinks.forEach(link => linkedEmailIds.add(link.A));
    accountLinks.forEach(link => linkedEmailIds.add(link.A));
    
    // Get unlinked emails
    const unlinkedEmailIds = allEmailIds.filter(id => !linkedEmailIds.has(id));
    
    return await prisma.email_messages.findMany({
      where: { id: { in: unlinkedEmailIds } },
      select: {
        id: true,
        from: true,
        to: true,
        subject: true,
        receivedAt: true
      },
      orderBy: { receivedAt: 'desc' }
    });
  }
  
  /**
   * Link a single email to entities
   */
  private async linkEmailToEntities(email: any, workspaceId: string): Promise<{
    linked: boolean;
    contactsLinked: number;
    leadsLinked: number;
    accountsLinked: number;
  }> {
    const associations = await this.findEmailAssociations(email, workspaceId);
    
    if (associations['length'] === 0) {
      return { linked: false, contactsLinked: 0, leadsLinked: 0, accountsLinked: 0 };
    }
    
    let contactsLinked = 0;
    let leadsLinked = 0;
    let accountsLinked = 0;
    
    for (const association of associations) {
      try {
        switch (association.type) {
          case 'contact':
            await prisma.emailToContact.create({
              data: { A: email.id, B: association.entityId }
            });
            contactsLinked++;
            break;
          case 'lead':
            await prisma.emailToLead.create({
              data: { A: email.id, B: association.entityId }
            });
            leadsLinked++;
            break;
          case 'account':
            await prisma.emailToAccount.create({
              data: { A: email.id, B: association.entityId }
            });
            accountsLinked++;
            break;
        }
      } catch (error) {
        // Ignore duplicate key errors
        if (!error.message.includes('Unique constraint')) {
          console.error(`❌ Error creating association:`, error);
        }
      }
    }
    
    return {
      linked: true,
      contactsLinked,
      leadsLinked,
      accountsLinked
    };
  }
  
  /**
   * Find associations for an email
   */
  private async findEmailAssociations(email: any, workspaceId: string): Promise<any[]> {
    const associations: any[] = [];
    const allEmails = [email.from, ...email.to];
    const emailDomains = allEmails.map(e => e.split('@')[1]).filter(Boolean);
    
    // Find contacts by email
    const contacts = await prisma.contacts.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: allEmails } },
          { workEmail: { in: allEmails } },
          { personalEmail: { in: allEmails } },
          { secondaryEmail: { in: allEmails } }
        ]
      },
      select: { id: true, accountId: true }
    });
    
    for (const contact of contacts) {
      associations.push({
        type: 'contact',
        entityId: contact.id,
        confidence: 0.9
      });
      
      if (contact.accountId) {
        associations.push({
          type: 'account',
          entityId: contact.accountId,
          confidence: 0.8
        });
      }
    }
    
    // Find leads by email
    const leads = await prisma.leads.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: allEmails } },
          { workEmail: { in: allEmails } },
          { personalEmail: { in: allEmails } },
          { companyDomain: { in: emailDomains } }
        ]
      },
      select: { id: true }
    });
    
    for (const lead of leads) {
      associations.push({
        type: 'lead',
        entityId: lead.id,
        confidence: 0.85
      });
    }
    
    // Find accounts by domain
    const accounts = await prisma.accounts.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: allEmails } },
          { website: { contains: emailDomains[0] } }
        ]
      },
      select: { id: true }
    });
    
    for (const account of accounts) {
      associations.push({
        type: 'account',
        entityId: account.id,
        confidence: 0.7
      });
    }
    
    return associations;
  }
}

// Export singleton instance
export const emailLinkingService = EmailLinkingService.getInstance();
