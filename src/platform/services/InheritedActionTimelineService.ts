import { PrismaClient } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

const prisma = new PrismaClient();

export interface TimelineEvent {
  id: string;
  type: string;
  date: Date;
  title: string;
  description?: string;
  user?: string;
  metadata?: any;
  source: 'action' | 'email' | 'note';
  // Core record relationships
  personId?: string;
  companyId?: string;
  // Derived record relationships (for context)
  leadId?: string;
  opportunityId?: string;
  prospectId?: string;
}

export interface TimelineFilters {
  startDate?: Date;
  endDate?: Date;
  types?: string[];
  sources?: ('action' | 'email' | 'note')[];
  limit?: number;
}

export class InheritedActionTimelineService {
  private config: { workspaceId: string; userId: string };

  constructor(config: { workspaceId: string; userId: string }) {
    this.config = config;
  }

  /**
   * Get unified timeline for any entity type using inheritance model
   * 
   * @param entityId - ID of the entity (person, company, lead, prospect, opportunity)
   * @param entityType - Type of entity
   * @param filters - Optional filters
   */
  public async getUnifiedTimeline(
    entityId: string,
    entityType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity',
    filters?: TimelineFilters
  ): Promise<TimelineEvent[]> {
    console.log(`🔍 Fetching inherited timeline for ${entityType} ${entityId}...`);

    // STEP 1: Get core record relationships
    const coreRelationships = await this.getCoreRecordRelationships(entityId, entityType);
    
    if (!coreRelationships.personId && !coreRelationships.companyId) {
      console.log(`  ⚠️ No core record relationships found for ${entityType} ${entityId}`);
      return [];
    }

    // STEP 2: Fetch all timeline events from core records
    const events: TimelineEvent[] = [];

    // Get actions from core records
    if (coreRelationships.personId || coreRelationships.companyId) {
      const actions = await this.getActionsFromCoreRecords(coreRelationships, filters);
      events.push(...actions);
    }

    // Get emails from core records
    if (coreRelationships.personId || coreRelationships.companyId) {
      const emails = await this.getEmailsFromCoreRecords(coreRelationships, filters);
      events.push(...emails);
    }

    // Get notes from core records
    if (coreRelationships.personId || coreRelationships.companyId) {
      const notes = await this.getNotesFromCoreRecords(coreRelationships, filters);
      events.push(...notes);
    }

    // STEP 3: Sort by date and apply filters
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply limit
    const limit = filters?.limit || 100;
    const limitedEvents = events.slice(0, limit);

    console.log(`✅ Fetched ${limitedEvents.length} timeline events for ${entityType} ${entityId}`);
    return limitedEvents;
  }

  /**
   * Get core record relationships for any entity type
   */
  private async getCoreRecordRelationships(
    entityId: string, 
    entityType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity'
  ): Promise<{ personId?: string; companyId?: string }> {
    const relationships: { personId?: string; companyId?: string } = {};

    switch (entityType) {
      case 'person':
        relationships.personId = entityId;
        // Get company from person
        const person = await prisma.people.findUnique({
          where: { id: entityId },
          select: { companyId: true }
        });
        if (person?.companyId) {
          relationships.companyId = person.companyId;
        }
        break;

      case 'company':
        relationships.companyId = entityId;
        break;

      case 'lead':
        const lead = await prisma.leads.findUnique({
          where: { id: entityId },
          select: { personId: true, companyId: true }
        });
        if (lead) {
          relationships.personId = lead.personId || undefined;
          relationships.companyId = lead.companyId || undefined;
        }
        break;

      case 'prospect':
        const prospect = await prisma.prospects.findUnique({
          where: { id: entityId },
          select: { personId: true, companyId: true }
        });
        if (prospect) {
          relationships.personId = prospect.personId || undefined;
          relationships.companyId = prospect.companyId || undefined;
        }
        break;

      case 'opportunity':
        const opportunity = await prisma.opportunities.findUnique({
          where: { id: entityId },
          select: { leadId: true, accountId: true }
        });
        if (opportunity) {
          // Get person/company from lead
          if (opportunity.leadId) {
            const lead = await prisma.leads.findUnique({
              where: { id: opportunity.leadId },
              select: { personId: true, companyId: true }
            });
            if (lead) {
              relationships.personId = lead.personId || undefined;
              relationships.companyId = lead.companyId || undefined;
            }
          }
          // Get company from account
          if (opportunity.accountId) {
            relationships.companyId = opportunity.accountId;
          }
        }
        break;
    }

    return relationships;
  }

  /**
   * Get actions from core records
   */
  private async getActionsFromCoreRecords(
    relationships: { personId?: string; companyId?: string },
    filters?: TimelineFilters
  ): Promise<TimelineEvent[]> {
    const whereClause: any = {
      workspaceId: this.config.workspaceId,
      OR: []
    };

    if (relationships.personId) {
      whereClause.OR.push({ personId: relationships.personId });
    }
    if (relationships.companyId) {
      whereClause.OR.push({ companyId: relationships.companyId });
    }

    if (filters?.startDate) {
      whereClause.createdAt = { gte: filters.startDate };
    }
    if (filters?.endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: filters.endDate };
    }
    if (filters?.types && filters.types.length > 0) {
      whereClause.type = { in: filters.types };
    }

    const actions = await prisma.actions.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100
    });

    return actions.map(action => ({
      id: action.id,
      type: action.type,
      date: action.completedAt || action.createdAt,
      title: action.subject,
      description: action.description,
      user: action.assignedUserId || action.userId,
      metadata: action.metadata,
      source: 'action' as const,
      personId: action.personId || undefined,
      companyId: action.companyId || undefined,
      leadId: action.leadId || undefined,
      opportunityId: action.opportunityId || undefined,
      prospectId: action.prospectId || undefined
    }));
  }

  /**
   * Get emails from core records
   */
  private async getEmailsFromCoreRecords(
    relationships: { personId?: string; companyId?: string },
    filters?: TimelineFilters
  ): Promise<TimelineEvent[]> {
    // Get email accounts for workspace
    const emailAccounts = await prisma.email_accounts.findMany({
      where: { workspaceId: this.config.workspaceId },
      select: { id: true }
    });

    const accountIds = emailAccounts.map(account => account.id);
    if (accountIds.length === 0) return [];

    // Get people/companies to find their email addresses
    const emailAddresses: string[] = [];
    
    if (relationships.personId) {
      const person = await prisma.people.findUnique({
        where: { id: relationships.personId },
        select: { email: true, workEmail: true, personalEmail: true }
      });
      if (person) {
        if (person.email) emailAddresses.push(person.email);
        if (person.workEmail) emailAddresses.push(person.workEmail);
        if (person.personalEmail) emailAddresses.push(person.personalEmail);
      }
    }

    if (relationships.companyId) {
      const company = await prisma.companies.findUnique({
        where: { id: relationships.companyId },
        select: { email: true }
      });
      if (company?.email) {
        emailAddresses.push(company.email);
      }
    }

    if (emailAddresses.length === 0) return [];

    const whereClause: any = {
      accountId: { in: accountIds },
      OR: [
        { from: { in: emailAddresses } },
        { to: { hasSome: emailAddresses } },
        { cc: { hasSome: emailAddresses } }
      ]
    };

    if (filters?.startDate) {
      whereClause.createdAt = { gte: filters.startDate };
    }
    if (filters?.endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: filters.endDate };
    }

    const emails = await prisma.email_messages.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100
    });

    return emails.map(email => ({
      id: `email_${email.id}`,
      type: 'email_conversation',
      date: email.sentAt || email.receivedAt || email.createdAt,
      title: email.subject,
      description: email.body?.substring(0, 200),
      user: email.from,
      metadata: {
        messageId: email.messageId,
        threadId: email.threadId,
        from: email.from,
        to: email.to
      },
      source: 'email' as const,
      personId: relationships.personId,
      companyId: relationships.companyId
    }));
  }

  /**
   * Get notes from core records
   */
  private async getNotesFromCoreRecords(
    relationships: { personId?: string; companyId?: string },
    filters?: TimelineFilters
  ): Promise<TimelineEvent[]> {
    const whereClause: any = {
      workspaceId: this.config.workspaceId,
      OR: []
    };

    if (relationships.personId) {
      whereClause.OR.push({ personId: relationships.personId });
    }
    if (relationships.companyId) {
      whereClause.OR.push({ companyId: relationships.companyId });
    }

    if (filters?.startDate) {
      whereClause.createdAt = { gte: filters.startDate };
    }
    if (filters?.endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: filters.endDate };
    }

    const notes = await prisma.notes.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100
    });

    return notes.map(note => ({
      id: `note_${note.id}`,
      type: 'note_added',
      date: note.createdAt,
      title: note.title || 'Note Added',
      description: note.content?.substring(0, 200),
      user: note.authorId,
      metadata: {
        noteType: note.type,
        isPrivate: note.isPrivate,
        isPinned: note.isPinned
      },
      source: 'note' as const,
      personId: note.personId || undefined,
      companyId: note.companyId || undefined,
      leadId: note.leadId || undefined,
      opportunityId: note.opportunityId || undefined,
      prospectId: note.prospectId || undefined
    }));
  }

  /**
   * Get last action for any entity type (inherited from core records)
   */
  public async getLastAction(
    entityId: string,
    entityType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity'
  ): Promise<{ action: string; date: Date; status: string } | null> {
    const relationships = await this.getCoreRecordRelationships(entityId, entityType);
    
    if (!relationships.personId && !relationships.companyId) {
      return null;
    }

    const whereClause: any = {
      workspaceId: this.config.workspaceId,
      OR: []
    };

    if (relationships.personId) {
      whereClause.OR.push({ personId: relationships.personId });
    }
    if (relationships.companyId) {
      whereClause.OR.push({ companyId: relationships.companyId });
    }

    const lastAction = await prisma.actions.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        subject: true,
        createdAt: true,
        status: true
      }
    });

    if (lastAction) {
      return {
        action: lastAction.subject,
        date: lastAction.createdAt,
        status: lastAction.status
      };
    }

    return null;
  }

  /**
   * Render timeline event for display
   */
  public renderTimelineEvent(event: TimelineEvent): string {
    const timeAgo = formatDistanceToNow(event.date, { addSuffix: true });
    const sourceIcon = event.source === 'action' ? '🎯' : event.source === 'email' ? '📧' : '📝';
    
    let output = `${sourceIcon} [${timeAgo}] ${event.title} (${event.type})`;
    
    if (event.description) {
      output += `\n  Description: ${event.description}`;
    }
    if (event.user) {
      output += `\n  By: ${event.user}`;
    }
    
    return output;
  }
}
