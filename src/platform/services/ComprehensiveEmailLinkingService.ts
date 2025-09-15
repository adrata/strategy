import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailLinkingResult {
  emailId: string;
  linkedToPerson: boolean;
  linkedToCompany: boolean;
  linkedToAction: boolean;
  personId?: string;
  companyId?: string;
  actionId?: string;
  confidence: number;
}

export interface EmailEntityAssociation {
  type: 'person' | 'company' | 'action';
  entityId: string;
  confidence: number;
  source: 'email_address' | 'domain' | 'name_match' | 'existing_action';
}

export class ComprehensiveEmailLinkingService {
  private static instance: ComprehensiveEmailLinkingService;

  public static getInstance(): ComprehensiveEmailLinkingService {
    if (!ComprehensiveEmailLinkingService.instance) {
      ComprehensiveEmailLinkingService.instance = new ComprehensiveEmailLinkingService();
    }
    return ComprehensiveEmailLinkingService.instance;
  }

  /**
   * Link a single email to person, company, and action
   */
  async linkEmailToEntities(emailId: string, workspaceId: string): Promise<EmailLinkingResult> {
    try {
      // Get the email
      const email = await prisma.email_messages.findUnique({
        where: { id: emailId }
      });

      if (!email) {
        throw new Error(`Email with ID ${emailId} not found`);
      }

      // Find associations
      const associations = await this.findEmailAssociations(email, workspaceId);
      
      let linkedToPerson = false;
      let linkedToCompany = false;
      let linkedToAction = false;
      let personId: string | undefined;
      let companyId: string | undefined;
      let actionId: string | undefined;
      let confidence = 0;

      // Process associations
      for (const association of associations) {
        try {
          switch (association.type) {
            case 'person':
              if (!linkedToPerson) {
                await this.createEmailToPersonLink(emailId, association.entityId);
                linkedToPerson = true;
                personId = association.entityId;
                confidence = Math.max(confidence, association.confidence);
              }
              break;
              
            case 'company':
              if (!linkedToCompany) {
                await this.createEmailToCompanyLink(emailId, association.entityId);
                linkedToCompany = true;
                companyId = association.entityId;
                confidence = Math.max(confidence, association.confidence);
              }
              break;
              
            case 'action':
              if (!linkedToAction) {
                await this.createEmailToActionLink(emailId, association.entityId);
                linkedToAction = true;
                actionId = association.entityId;
                confidence = Math.max(confidence, association.confidence);
              }
              break;
          }
        } catch (error) {
          // Ignore duplicate key errors
          if (!error.message?.includes('Unique constraint')) {
            console.warn(`⚠️ Failed to create ${association.type} link for email ${emailId}:`, error);
          }
        }
      }

      // If no action found, create one
      if (!linkedToAction) {
        const createdAction = await this.createActionForEmail(email, workspaceId, personId, companyId);
        if (createdAction) {
          await this.createEmailToActionLink(emailId, createdAction.id);
          linkedToAction = true;
          actionId = createdAction.id;
          confidence = Math.max(confidence, 0.8); // High confidence for created actions
        }
      }

      return {
        emailId,
        linkedToPerson,
        linkedToCompany,
        linkedToAction,
        personId,
        companyId,
        actionId,
        confidence
      };

    } catch (error) {
      console.error(`❌ Error linking email ${emailId}:`, error);
      throw error;
    }
  }

  /**
   * Find all possible associations for an email
   * Simplified to only link to Person, Company, and Action
   * Leverages existing relationships: Person → Company, Person → Lead/Prospect/Opportunity
   */
  private async findEmailAssociations(email: any, workspaceId: string): Promise<EmailEntityAssociation[]> {
    const associations: EmailEntityAssociation[] = [];
    
    // Extract email addresses and domains
    const allEmails = [
      email.from,
      ...email.to,
      ...email.cc,
      ...email.bcc
    ].filter(Boolean);

    const emailDomains = allEmails
      .map(e => e?.split('@')[1])
      .filter(Boolean);

    // 1. Find existing actions for this email
    const existingAction = await prisma.actions.findFirst({
      where: {
        workspaceId,
        externalId: `email_${email.id}`
      }
    });

    if (existingAction) {
      associations.push({
        type: 'action',
        entityId: existingAction.id,
        confidence: 1.0,
        source: 'existing_action'
      });
    }

    // 2. Find people by email addresses
    const people = await prisma.people.findMany({
      where: {
        workspaceId,
        OR: [
          { email: { in: allEmails } },
          { workEmail: { in: allEmails } },
          { personalEmail: { in: allEmails } },
          { secondaryEmail: { in: allEmails } }
        ]
      }
    });

    for (const person of people) {
      associations.push({
        type: 'person',
        entityId: person.id,
        confidence: 0.9,
        source: 'email_address'
      });
    }

    // 3. Find companies through people relationships (primary method)
    for (const person of people) {
      if (person.companyId) {
        const company = await prisma.companies.findUnique({
          where: { id: person.companyId }
        });
        
        if (company && !associations.some(a => a.type === 'company' && a.entityId === company.id)) {
          associations.push({
            type: 'company',
            entityId: company.id,
            confidence: 0.8,
            source: 'name_match'
          });
        }
      }
    }

    // 4. Find companies by direct email matches (fallback)
    const directCompanies = await prisma.companies.findMany({
      where: {
        workspaceId,
        email: { in: allEmails }
      }
    });

    for (const company of directCompanies) {
      if (!associations.some(a => a.type === 'company' && a.entityId === company.id)) {
        associations.push({
          type: 'company',
          entityId: company.id,
          confidence: 0.7,
          source: 'domain'
        });
      }
    }

    return associations;
  }

  /**
   * Create action for email if none exists
   */
  private async createActionForEmail(
    email: any, 
    workspaceId: string, 
    personId?: string, 
    companyId?: string
  ): Promise<any> {
    try {
      const actionType = this.determineEmailActionType(email);
      
      const actionData = {
        workspaceId,
        userId: 'system', // You might want to determine this differently
        type: actionType,
        subject: email.subject || 'Email',
        description: `Email: ${email.subject}`,
        outcome: null,
        scheduledAt: email.sentAt,
        completedAt: email.sentAt,
        status: 'completed',
        priority: 'normal',
        attachments: email.attachments || null,
        metadata: {
          emailId: email.id,
          messageId: email.messageId,
          threadId: email.threadId,
          from: email.from,
          to: email.to,
          cc: email.cc,
          bcc: email.bcc
        },
        externalId: `email_${email.id}`,
        personId: personId || null,
        companyId: companyId || null
      };

      return await prisma.actions.create({
        data: actionData
      });

    } catch (error) {
      console.error(`❌ Error creating action for email ${email.id}:`, error);
      return null;
    }
  }

  /**
   * Determine email action type
   */
  private determineEmailActionType(email: any): string {
    // You can enhance this logic based on your business rules
    if (email.subject?.toLowerCase().includes('meeting')) {
      return 'meeting';
    } else if (email.subject?.toLowerCase().includes('call')) {
      return 'call';
    } else if (email.subject?.toLowerCase().includes('proposal') || 
               email.subject?.toLowerCase().includes('quote')) {
      return 'proposal';
    } else {
      return 'email';
    }
  }

  /**
   * Create email-to-person link
   */
  private async createEmailToPersonLink(emailId: string, personId: string): Promise<void> {
    await prisma.emailToPerson.create({
      data: { A: emailId, B: personId }
    });
  }

  /**
   * Create email-to-company link
   */
  private async createEmailToCompanyLink(emailId: string, companyId: string): Promise<void> {
    await prisma.emailToCompany.create({
      data: { A: emailId, B: companyId }
    });
  }

  /**
   * Create email-to-action link
   */
  private async createEmailToActionLink(emailId: string, actionId: string): Promise<void> {
    await prisma.emailToAction.create({
      data: { A: emailId, B: actionId }
    });
  }

  /**
   * Link multiple emails in batch
   */
  async linkEmailsInBatch(emailIds: string[], workspaceId: string): Promise<EmailLinkingResult[]> {
    const results: EmailLinkingResult[] = [];
    
    for (const emailId of emailIds) {
      try {
        const result = await this.linkEmailToEntities(emailId, workspaceId);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error linking email ${emailId}:`, error);
        results.push({
          emailId,
          linkedToPerson: false,
          linkedToCompany: false,
          linkedToAction: false,
          confidence: 0
        });
      }
    }

    return results;
  }

  /**
   * Get linking statistics for a workspace
   */
  async getLinkingStatistics(workspaceId: string): Promise<{
    totalEmails: number;
    emailsLinkedToPerson: number;
    emailsLinkedToCompany: number;
    emailsLinkedToAction: number;
    fullyLinkedEmails: number;
  }> {
    const totalEmails = await prisma.email_messages.count();
    const emailsLinkedToPerson = await prisma.emailToPerson.count();
    const emailsLinkedToCompany = await prisma.emailToCompany.count();
    const emailsLinkedToAction = await prisma.emailToAction.count();

    // Count emails that are linked to all three entities
    const fullyLinkedEmails = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages e
      WHERE EXISTS (SELECT 1 FROM "_EmailToPerson" etp WHERE etp.A = e.id)
        AND EXISTS (SELECT 1 FROM "_EmailToCompany" etc WHERE etc.A = e.id)
        AND EXISTS (SELECT 1 FROM "_EmailToAction" eta WHERE eta.A = e.id)
    ` as any[];

    return {
      totalEmails,
      emailsLinkedToPerson,
      emailsLinkedToCompany,
      emailsLinkedToAction,
      fullyLinkedEmails: Number(fullyLinkedEmails[0]?.count || 0)
    };
  }
}

export default ComprehensiveEmailLinkingService;
