/**
 * ☁️ CLOUD EMAIL PROCESSOR SERVICE
 * 
 * Runs email processing in the cloud with priority on recent emails
 * Can be triggered via API or run on a schedule
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CloudProcessingConfig {
  workspaceId: string;
  priority: 'recent' | 'unlinked' | 'all';
  batchSize: number;
  maxProcessingTime: number;
  continuousMode: boolean;
  intervalMs: number;
}

export interface CloudProcessingResult {
  success: boolean;
  processedCount: number;
  linkedCount: number;
  errors: number;
  successRate: number;
  processingTimeMs: number;
  timestamp: string;
}

export class CloudEmailProcessor {
  private static instance: CloudEmailProcessor;
  private isRunning = false;
  private currentProcess: Promise<void> | null = null;

  static getInstance(): CloudEmailProcessor {
    if (!CloudEmailProcessor.instance) {
      CloudEmailProcessor['instance'] = new CloudEmailProcessor();
    }
    return CloudEmailProcessor.instance;
  }

  /**
   * Start continuous cloud processing
   */
  async startContinuousProcessing(config: CloudProcessingConfig): Promise<void> {
    if (this.isRunning) {
      console.log('☁️ Cloud email processor is already running');
      return;
    }

    console.log('☁️ Starting continuous cloud email processing...');
    console.log(`   Workspace: ${config.workspaceId}`);
    console.log(`   Priority: ${config.priority}`);
    console.log(`   Batch size: ${config.batchSize}`);
    console.log(`   Interval: ${config.intervalMs}ms`);

    this['isRunning'] = true;

    // Start the processing loop
    this['currentProcess'] = this.runProcessingLoop(config);
  }

  /**
   * Stop continuous processing
   */
  async stopContinuousProcessing(): Promise<void> {
    if (!this.isRunning) {
      console.log('☁️ Cloud email processor is not running');
      return;
    }

    console.log('☁️ Stopping continuous cloud email processing...');
    this['isRunning'] = false;

    if (this.currentProcess) {
      await this.currentProcess;
      this['currentProcess'] = null;
    }

    console.log('✅ Cloud email processor stopped');
  }

  /**
   * Run a single processing batch
   */
  async runSingleBatch(config: CloudProcessingConfig): Promise<CloudProcessingResult> {
    console.log(`☁️ Running single batch processing for workspace ${config.workspaceId}`);

    const startTime = Date.now();
    let processedCount = 0;
    let linkedCount = 0;
    let errors = 0;

    try {
      // Get emails to process
      const emailsToProcess = await this.getEmailsToProcess(config);
      console.log(`📧 Found ${emailsToProcess.length} emails to process`);

      // Get entities for linking
      const entities = await this.getEntitiesForLinking(config.workspaceId);

      // Process emails
      for (const email of emailsToProcess) {
        // Check if we've exceeded max processing time
        if (Date.now() - startTime > config.maxProcessingTime) {
          console.log(`⏰ Max processing time reached (${config.maxProcessingTime}ms)`);
          break;
        }

        try {
          processedCount++;
          
          if (processedCount % 10 === 0) {
            console.log(`   Processed ${processedCount}/${emailsToProcess.length} emails...`);
          }

          // Link email to entities
          const linksCreated = await this.linkEmailToEntities(email, entities);

          if (linksCreated > 0) {
            linkedCount++;
          }

        } catch (error) {
          console.error(`❌ Error processing email ${email.id}:`, error);
          errors++;
        }
      }

      const processingTime = Date.now() - startTime;
      const successRate = processedCount > 0 ? ((processedCount - errors) / processedCount * 100) : 0;

      console.log(`✅ Batch processing completed in ${processingTime}ms`);
      console.log(`   Processed: ${processedCount} emails`);
      console.log(`   Linked: ${linkedCount} emails`);
      console.log(`   Errors: ${errors}`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);

      return {
        success: true,
        processedCount,
        linkedCount,
        errors,
        successRate,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Batch processing error:', error);
      return {
        success: false,
        processedCount,
        linkedCount,
        errors: errors + 1,
        successRate: 0,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run the continuous processing loop
   */
  private async runProcessingLoop(config: CloudProcessingConfig): Promise<void> {
    while (this.isRunning) {
      try {
        console.log('☁️ Running cloud processing batch...');
        
        const result = await this.runSingleBatch(config);
        
        if (result.success) {
          console.log(`✅ Batch completed: ${result.processedCount} processed, ${result.linkedCount} linked`);
        } else {
          console.log(`❌ Batch failed: ${result.errors} errors`);
        }

        // Wait for the next interval
        if (this.isRunning) {
          console.log(`⏳ Waiting ${config.intervalMs}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, config.intervalMs));
        }

      } catch (error) {
        console.error('❌ Error in processing loop:', error);
        
        // Wait before retrying
        if (this.isRunning) {
          await new Promise(resolve => setTimeout(resolve, config.intervalMs));
        }
      }
    }
  }

  /**
   * Get emails to process based on priority
   */
  private async getEmailsToProcess(config: CloudProcessingConfig): Promise<any[]> {
    if (config['priority'] === 'recent') {
      // Process most recent emails first (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return await prisma.email_messages.findMany({
        where: {
          sentAt: { gte: thirtyDaysAgo }
        },
        orderBy: { sentAt: 'desc' },
        take: config.batchSize * 2, // Get more to account for already linked ones
        select: {
          id: true,
          subject: true,
          from: true,
          to: true,
          cc: true,
          bcc: true,
          sentAt: true
        }
      });
    } else if (config['priority'] === 'unlinked') {
      // Process unlinked emails
      const allEmails = await prisma.email_messages.findMany({
        orderBy: { sentAt: 'desc' },
        take: config.batchSize * 3, // Get more to find unlinked ones
        select: {
          id: true,
          subject: true,
          from: true,
          to: true,
          cc: true,
          bcc: true,
          sentAt: true
        }
      });

      // Filter for unlinked emails
      const unlinkedEmails = [];
      for (const email of allEmails) {
        const hasLinks = await prisma.emailToContact.findFirst({ where: { A: email.id } }) ||
                        await prisma.emailToAccount.findFirst({ where: { A: email.id } }) ||
                        await prisma.emailToLead.findFirst({ where: { A: email.id } }) ||
                        await prisma.emailToOpportunity.findFirst({ where: { A: email.id } }) ||
                        await prisma.emailToProspect.findFirst({ where: { A: email.id } }) ||
                        await prisma.emailToPerson.findFirst({ where: { A: email.id } }) ||
                        await prisma.emailToCompany.findFirst({ where: { A: email.id } });
        
        if (!hasLinks) {
          unlinkedEmails.push(email);
          if (unlinkedEmails.length >= config.batchSize) break;
        }
      }

      return unlinkedEmails;
    } else {
      // Process all emails
      return await prisma.email_messages.findMany({
        orderBy: { sentAt: 'desc' },
        take: config.batchSize,
        select: {
          id: true,
          subject: true,
          from: true,
          to: true,
          cc: true,
          bcc: true,
          sentAt: true
        }
      });
    }
  }

  /**
   * Get entities for linking
   */
  private async getEntitiesForLinking(workspaceId: string): Promise<any> {
    const [contacts, accounts, leads, opportunities, prospects, persons, companies] = await Promise.all([
      prisma.contacts.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.accounts.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, name: true } 
      }),
      prisma.leads.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.opportunities.findMany({ 
        where: { workspaceId },
        select: { id: true, name: true } 
      }),
      prisma.prospects.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.people.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.companies.findMany({ 
        where: { workspaceId },
        select: { id: true, name: true } 
      })
    ]);

    return { contacts, accounts, leads, opportunities, prospects, persons, companies };
  }

  /**
   * Link email to entities
   */
  private async linkEmailToEntities(email: any, entities: any): Promise<number> {
    let linksCreated = 0;
    
    try {
      const { contacts, accounts, leads, opportunities, prospects, persons, companies } = entities;
      
      // Link based on email addresses
      const allEmails = [
        email.from,
        ...email.to,
        ...email.cc,
        ...email.bcc
      ].filter(Boolean);

      for (const emailAddress of allEmails) {
        if (!emailAddress) continue;

        // Link to contacts
        const matchingContacts = contacts.filter((c: any) => c.email?.toLowerCase() === emailAddress.toLowerCase());
        for (const contact of matchingContacts) {
          await prisma.emailToContact.upsert({
            where: { A_B: { A: email.id, B: contact.id } },
            create: { A: email.id, B: contact.id },
            update: {}
          });
          linksCreated++;
        }

        // Link to leads
        const matchingLeads = leads.filter((l: any) => l.email?.toLowerCase() === emailAddress.toLowerCase());
        for (const lead of matchingLeads) {
          await prisma.emailToLead.upsert({
            where: { A_B: { A: email.id, B: lead.id } },
            create: { A: email.id, B: lead.id },
            update: {}
          });
          linksCreated++;
        }

        // Link to prospects
        const matchingProspects = prospects.filter((p: any) => p.email?.toLowerCase() === emailAddress.toLowerCase());
        for (const prospect of matchingProspects) {
          await prisma.emailToProspect.upsert({
            where: { A_B: { A: email.id, B: prospect.id } },
            create: { A: email.id, B: prospect.id },
            update: {}
          });
          linksCreated++;
        }

        // Link to persons
        const matchingPersons = persons.filter((p: any) => p.email?.toLowerCase() === emailAddress.toLowerCase());
        for (const person of matchingPersons) {
          await prisma.emailToPerson.upsert({
            where: { A_B: { A: email.id, B: person.id } },
            create: { A: email.id, B: person.id },
            update: {}
          });
          linksCreated++;
        }
      }

      // Link based on content analysis
      const content = `${email.subject} ${email.from}`.toLowerCase();

      // Link to companies by name
      for (const company of companies) {
        if (company['name'] && content.includes(company.name.toLowerCase())) {
          await prisma.emailToCompany.upsert({
            where: { A_B: { A: email.id, B: company.id } },
            create: { A: email.id, B: company.id },
            update: {}
          });
          linksCreated++;
        }
      }

      // Link to accounts by name
      for (const account of accounts) {
        if (account['name'] && content.includes(account.name.toLowerCase())) {
          await prisma.emailToAccount.upsert({
            where: { A_B: { A: email.id, B: account.id } },
            create: { A: email.id, B: account.id },
            update: {}
          });
          linksCreated++;
        }
      }

      // Link to opportunities by name
      for (const opportunity of opportunities) {
        if (opportunity['name'] && content.includes(opportunity.name.toLowerCase())) {
          await prisma.emailToOpportunity.upsert({
            where: { A_B: { A: email.id, B: opportunity.id } },
            create: { A: email.id, B: opportunity.id },
            update: {}
          });
          linksCreated++;
        }
      }

    } catch (error) {
      console.error(`Error linking email ${email.id}:`, error);
    }

    return linksCreated;
  }

  /**
   * Get processing status
   */
  getStatus(): { isRunning: boolean; currentProcess: boolean } {
    return {
      isRunning: this.isRunning,
      currentProcess: this.currentProcess !== null
    };
  }
}

// Export singleton instance
export const cloudEmailProcessor = CloudEmailProcessor.getInstance();
