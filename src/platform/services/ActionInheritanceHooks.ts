import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ActionHookConfig {
  workspaceId: string;
  userId: string;
}

export class ActionInheritanceHooks {
  private config: ActionHookConfig;

  constructor(config: ActionHookConfig) {
    this.config = config;
    this.registerPrismaMiddleware();
  }

  /**
   * Register Prisma middleware to automatically create actions for CRUD operations
   */
  private registerPrismaMiddleware() {
    prisma.$use(async (params, next) => {
      const result = await next(params);

      // Only process successful operations
      if (result) {
        await this.processCrudOperation(params, result);
      }

      return result;
    });
  }

  /**
   * Process CRUD operations and create corresponding actions
   */
  private async processCrudOperation(params: any, result: any) {
    const { model, action, args } = params;
    const { workspaceId, userId } = this.config;

    // Only process core entities that should have actions
    if (!['people', 'companies', 'leads', 'prospects', 'opportunities'].includes(model)) {
      return;
    }

    // Only process create/update operations
    if (!['create', 'update', 'updateMany'].includes(action)) {
      return;
    }

    try {
      await this.createActionForEntity(model, action, result, workspaceId, userId);
    } catch (error) {
      console.error(`❌ Failed to create action for ${model} ${action}:`, error);
    }
  }

  /**
   * Create action for entity operation
   */
  private async createActionForEntity(
    model: string,
    action: string,
    result: any,
    workspaceId: string,
    userId: string
  ) {
    let actionData: any = {
      workspaceId,
      userId,
      status: 'completed',
      priority: 'normal',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    switch (model) {
      case 'people':
        actionData.personId = result.id;
        actionData.companyId = result.companyId;
        actionData.type = action === 'create' ? 'person_created' : 'person_updated';
        actionData.subject = `Person ${result.fullName || result.name} ${action === 'create' ? 'created' : 'updated'}`;
        actionData.description = `Person record ${action === 'create' ? 'created' : 'updated'} by ${userId}`;
        break;

      case 'companies':
        actionData.companyId = result.id;
        actionData.type = action === 'create' ? 'company_created' : 'company_updated';
        actionData.subject = `Company ${result.name} ${action === 'create' ? 'created' : 'updated'}`;
        actionData.description = `Company record ${action === 'create' ? 'created' : 'updated'} by ${userId}`;
        break;

      case 'leads':
        actionData.leadId = result.id;
        actionData.personId = result.personId;
        actionData.companyId = result.companyId;
        actionData.type = action === 'create' ? 'lead_created' : 'lead_updated';
        actionData.subject = `Lead ${result.fullName || result.name} ${action === 'create' ? 'created' : 'updated'}`;
        actionData.description = `Lead record ${action === 'create' ? 'created' : 'updated'} by ${userId}`;
        break;

      case 'prospects':
        actionData.prospectId = result.id;
        actionData.personId = result.personId;
        actionData.companyId = result.companyId;
        actionData.type = action === 'create' ? 'prospect_created' : 'prospect_updated';
        actionData.subject = `Prospect ${result.fullName || result.name} ${action === 'create' ? 'created' : 'updated'}`;
        actionData.description = `Prospect record ${action === 'create' ? 'created' : 'updated'} by ${userId}`;
        break;

      case 'opportunities':
        actionData.opportunityId = result.id;
        actionData.leadId = result.leadId;
        actionData.companyId = result.accountId;
        actionData.type = action === 'create' ? 'opportunity_created' : 'opportunity_updated';
        actionData.subject = `Opportunity ${result.name} ${action === 'create' ? 'created' : 'updated'}`;
        actionData.description = `Opportunity record ${action === 'create' ? 'created' : 'updated'} by ${userId}`;
        break;

      default:
        return; // Skip unknown models
    }

    // Create the action
    await prisma.actions.create({ data: actionData });

    // Update lastAction on core records
    await this.updateLastActionOnCoreRecords(actionData);
  }

  /**
   * Update lastAction fields on core records (people/companies)
   */
  private async updateLastActionOnCoreRecords(actionData: any) {
    try {
      // Update person's lastAction if personId exists
      if (actionData.personId) {
        await prisma.people.update({
          where: { id: actionData.personId },
          data: {
            lastAction: actionData.subject,
            lastActionDate: actionData.completedAt,
            actionStatus: actionData.status
          }
        });
      }

      // Update company's lastAction if companyId exists
      if (actionData.companyId) {
        await prisma.companies.update({
          where: { id: actionData.companyId },
          data: {
            lastAction: actionData.subject,
            lastActionDate: actionData.completedAt,
            actionStatus: actionData.status
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to update lastAction on core records:', error);
    }
  }

  /**
   * Create action for email message
   */
  public async createActionForEmail(emailData: any): Promise<void> {
    try {
      const { workspaceId, userId } = this.config;

      // Find relationships
      const relationships = await this.findEmailRelationships(emailData);

      if (relationships.personId || relationships.companyId) {
        const actionData = {
          workspaceId,
          userId,
          type: 'email_conversation',
          subject: emailData.subject || 'Email Communication',
          description: emailData.body?.substring(0, 500) || '',
          status: 'completed',
          priority: 'medium',
          completedAt: emailData.sentAt || emailData.receivedAt || new Date(),
          personId: relationships.personId,
          companyId: relationships.companyId,
          externalId: `email_${emailData.id}`,
          metadata: {
            originalEmailId: emailData.id,
            messageId: emailData.messageId,
            threadId: emailData.threadId,
            from: emailData.from,
            to: emailData.to
          },
          createdAt: emailData.createdAt || new Date(),
          updatedAt: new Date()
        };

        await prisma.actions.create({ data: actionData });
        await this.updateLastActionOnCoreRecords(actionData);
      }
    } catch (error) {
      console.error('❌ Failed to create action for email:', error);
    }
  }

  /**
   * Create action for note
   */
  public async createActionForNote(noteData: any): Promise<void> {
    try {
      const { workspaceId, userId } = this.config;

      const actionData = {
        workspaceId,
        userId: noteData.authorId || userId,
        type: 'note_added',
        subject: noteData.title || 'Note Added',
        description: noteData.content?.substring(0, 500) || '',
        status: 'completed',
        priority: 'low',
        completedAt: noteData.createdAt || new Date(),
        personId: noteData.personId,
        companyId: noteData.companyId,
        leadId: noteData.leadId,
        opportunityId: noteData.opportunityId,
        prospectId: noteData.prospectId,
        externalId: `note_${noteData.id}`,
        metadata: {
          originalNoteId: noteData.id,
          noteType: noteData.type
        },
        createdAt: noteData.createdAt || new Date(),
        updatedAt: new Date()
      };

      await prisma.actions.create({ data: actionData });
      await this.updateLastActionOnCoreRecords(actionData);
    } catch (error) {
      console.error('❌ Failed to create action for note:', error);
    }
  }

  /**
   * Find email relationships to people/companies
   */
  private async findEmailRelationships(emailData: any): Promise<{ personId?: string; companyId?: string }> {
    const relationships: { personId?: string; companyId?: string } = {};

    try {
      // Get workspaceId from email account
      const emailAccount = await prisma.email_accounts.findFirst({
        where: { id: emailData.accountId },
        select: { workspaceId: true }
      });

      if (!emailAccount) return relationships;

      // Try to find person by email addresses
      const emailAddresses = [
        ...(emailData.to || []),
        ...(emailData.cc || []),
        emailData.from
      ].filter(Boolean);

      for (const emailAddr of emailAddresses) {
        const person = await prisma.people.findFirst({
          where: {
            OR: [
              { email: emailAddr },
              { workEmail: emailAddr },
              { personalEmail: emailAddr }
            ],
            workspaceId: emailAccount.workspaceId
          }
        });

        if (person) {
          relationships.personId = person.id;
          relationships.companyId = person.companyId || undefined;
          break;
        }
      }
    } catch (error) {
      console.error('❌ Failed to find email relationships:', error);
    }

    return relationships;
  }

  /**
   * Initialize the action inheritance hooks system
   */
  public static initialize(config: ActionHookConfig) {
    new ActionInheritanceHooks(config);
    console.log('✅ Action Inheritance Hooks System initialized');
  }
}
