/**
 * 🔗 ACTION HOOKS SYSTEM - AUTOMATIC CRUD ACTION TRACKING
 * 
 * This system automatically creates actions for all CRUD operations across the platform:
 * - Record creation, updates, deletions
 * - Field changes and status updates
 * - User assignments and priority changes
 * - Integration with existing action model
 */

import { PrismaClient } from '@prisma/client';
import { completeActionModel, ActionType } from './CompleteActionModel';

export interface ActionHookContext {
  workspaceId: string;
  userId: string;
  entityType: 'person' | 'company' | 'lead' | 'prospect' | 'opportunity' | 'note' | 'email';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  changes?: Record<string, { from: any; to: any }>;
  metadata?: any;
}

export class ActionHooksSystem {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Hook for record creation
   */
  async onRecordCreated(context: ActionHookContext): Promise<void> {
    const actionType = this.getCreationActionType(context.entityType);
    
    await completeActionModel.createAction(context.workspaceId, context.userId, {
      type: actionType,
      subject: `${this.getEntityDisplayName(context.entityType)} created`,
      description: `New ${context.entityType} record added to system`,
      status: 'completed',
      priority: 'medium',
      completedAt: new Date(),
      ...this.getEntityRelationships(context),
      metadata: {
        operation: 'create',
        entityType: context.entityType,
        entityId: context.entityId,
        ...context.metadata
      }
    });
  }

  /**
   * Hook for record updates
   */
  async onRecordUpdated(context: ActionHookContext): Promise<void> {
    if (!context.changes || Object.keys(context.changes).length === 0) {
      return;
    }

    // Create action for significant field changes
    const significantChanges = this.filterSignificantChanges(context.changes);
    
    if (significantChanges.length > 0) {
      const actionType = this.getUpdateActionType(context.entityType, significantChanges);
      const subject = this.generateUpdateSubject(context.entityType, significantChanges);
      const description = this.generateUpdateDescription(significantChanges);

      await completeActionModel.createAction(context.workspaceId, context.userId, {
        type: actionType,
        subject,
        description,
        status: 'completed',
        priority: this.getUpdatePriority(significantChanges),
        completedAt: new Date(),
        ...this.getEntityRelationships(context),
        metadata: {
          operation: 'update',
          entityType: context.entityType,
          entityId: context.entityId,
          changes: significantChanges,
          ...context.metadata
        }
      });
    }
  }

  /**
   * Hook for record deletion
   */
  async onRecordDeleted(context: ActionHookContext): Promise<void> {
    const actionType = this.getDeletionActionType(context.entityType);
    
    await completeActionModel.createAction(context.workspaceId, context.userId, {
      type: actionType,
      subject: `${this.getEntityDisplayName(context.entityType)} deleted`,
      description: `${context.entityType} record removed from system`,
      status: 'completed',
      priority: 'high',
      completedAt: new Date(),
      ...this.getEntityRelationships(context),
      metadata: {
        operation: 'delete',
        entityType: context.entityType,
        entityId: context.entityId,
        ...context.metadata
      }
    });
  }

  /**
   * Hook for email operations
   */
  async onEmailOperation(
    workspaceId: string,
    userId: string,
    emailData: any,
    operation: 'sent' | 'received' | 'replied'
  ): Promise<void> {
    const actionType = this.getEmailActionType(operation);
    const relationships = await this.findEmailRelationships(emailData, workspaceId);

    if (relationships.personId || relationships.companyId) {
      await completeActionModel.createAction(workspaceId, userId, {
        type: actionType,
        subject: emailData.subject || 'Email Communication',
        description: this.truncateText(emailData.body || '', 200),
        status: 'completed',
        priority: 'medium',
        completedAt: emailData.sentAt || emailData.receivedAt || new Date(),
        ...relationships,
        externalId: emailData.id,
        metadata: {
          operation,
          emailId: emailData.id,
          messageId: emailData.messageId,
          threadId: emailData.threadId,
          direction: emailData.direction
        }
      });
    }
  }

  /**
   * Hook for note operations
   */
  async onNoteOperation(
    workspaceId: string,
    userId: string,
    noteData: any,
    operation: 'created' | 'updated' | 'deleted'
  ): Promise<void> {
    const actionType = operation === 'created' ? 'note_added' : 
                      operation === 'updated' ? 'note_updated' : 'record_deleted';
    
    const relationships = this.getNoteRelationships(noteData);

    if (relationships.personId || relationships.companyId) {
      await completeActionModel.createAction(workspaceId, userId, {
        type: actionType as ActionType,
        subject: noteData.title || 'Note Updated',
        description: this.truncateText(noteData.content || '', 200),
        status: 'completed',
        priority: 'low',
        completedAt: new Date(),
        ...relationships,
        externalId: noteData.id,
        metadata: {
          operation,
          noteId: noteData.id,
          noteType: noteData.type
        }
      });
    }
  }

  /**
   * Get creation action type for entity
   */
  private getCreationActionType(entityType: string): ActionType {
    switch (entityType) {
      case 'person': return 'record_created';
      case 'company': return 'record_created';
      case 'lead': return 'record_created';
      case 'prospect': return 'record_created';
      case 'opportunity': return 'record_created';
      case 'note': return 'note_added';
      case 'email': return 'email_sent';
      default: return 'record_created';
    }
  }

  /**
   * Get update action type based on changes
   */
  private getUpdateActionType(entityType: string, changes: any[]): ActionType {
    // Check for status changes
    const statusChange = changes.find(c => c.field === 'status');
    if (statusChange) return 'status_changed';

    // Check for stage changes
    const stageChange = changes.find(c => c.field === 'stage' || c.field === 'currentStage');
    if (stageChange) return 'stage_advanced';

    // Check for priority changes
    const priorityChange = changes.find(c => c.field === 'priority');
    if (priorityChange) return 'priority_changed';

    // Check for assignment changes
    const assignmentChange = changes.find(c => 
      c.field === 'assignedUserId' || c.field === 'assignedTo'
    );
    if (assignmentChange) return 'assigned_user_changed';

    // Default to field update
    return 'field_updated';
  }

  /**
   * Get deletion action type
   */
  private getDeletionActionType(entityType: string): ActionType {
    return 'record_deleted';
  }

  /**
   * Get email action type
   */
  private getEmailActionType(operation: string): ActionType {
    switch (operation) {
      case 'sent': return 'email_sent';
      case 'received': return 'email_received';
      case 'replied': return 'email_replied';
      default: return 'email_sent';
    }
  }

  /**
   * Filter significant changes from all changes
   */
  private filterSignificantChanges(changes: Record<string, { from: any; to: any }>): any[] {
    const significantFields = [
      'status', 'stage', 'currentStage', 'priority', 'assignedUserId', 'assignedTo',
      'amount', 'value', 'closeDate', 'probability', 'source', 'type'
    ];

    return Object.entries(changes)
      .filter(([field, change]) => {
        // Include significant fields
        if (significantFields.includes(field)) return true;
        
        // Include non-empty changes
        if (change.from !== change.to) return true;
        
        return false;
      })
      .map(([field, change]) => ({
        field,
        from: change.from,
        to: change.to
      }));
  }

  /**
   * Generate update subject
   */
  private generateUpdateSubject(entityType: string, changes: any[]): string {
    const entityName = this.getEntityDisplayName(entityType);
    
    if (changes.length === 1) {
      const change = changes[0];
      return `${entityName} ${change.field} updated from "${change.from}" to "${change.to}"`;
    } else {
      return `${entityName} updated (${changes.length} fields changed)`;
    }
  }

  /**
   * Generate update description
   */
  private generateUpdateDescription(changes: any[]): string {
    return changes.map(change => 
      `${change.field}: "${change.from}" → "${change.to}"`
    ).join(', ');
  }

  /**
   * Get update priority based on changes
   */
  private getUpdatePriority(changes: any[]): 'critical' | 'high' | 'medium' | 'low' {
    const criticalFields = ['status', 'stage', 'amount', 'closeDate'];
    const highFields = ['priority', 'assignedUserId', 'probability'];
    
    if (changes.some(c => criticalFields.includes(c.field))) {
      return 'critical';
    } else if (changes.some(c => highFields.includes(c.field))) {
      return 'high';
    } else {
      return 'medium';
    }
  }

  /**
   * Get entity display name
   */
  private getEntityDisplayName(entityType: string): string {
    switch (entityType) {
      case 'person': return 'Contact';
      case 'company': return 'Company';
      case 'lead': return 'Lead';
      case 'prospect': return 'Prospect';
      case 'opportunity': return 'Opportunity';
      case 'note': return 'Note';
      case 'email': return 'Email';
      default: return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    }
  }

  /**
   * Get entity relationships
   */
  private getEntityRelationships(context: ActionHookContext): any {
    const relationships: any = {};
    
    switch (context.entityType) {
      case 'person':
        relationships.personId = context.entityId;
        break;
      case 'company':
        relationships.companyId = context.entityId;
        break;
      case 'lead':
        relationships.leadId = context.entityId;
        break;
      case 'prospect':
        relationships.prospectId = context.entityId;
        break;
      case 'opportunity':
        relationships.opportunityId = context.entityId;
        break;
    }
    
    return relationships;
  }

  /**
   * Find email relationships
   */
  private async findEmailRelationships(emailData: any, workspaceId: string): Promise<any> {
    const relationships: any = {};

    // Try to find person by email addresses
    const emailAddresses = [
      ...(emailData.to || []),
      ...(emailData.cc || []),
      emailData.from
    ].filter(Boolean);

    for (const email of emailAddresses) {
      const person = await this.prisma.people.findFirst({
        where: {
          email: email,
          workspaceId: workspaceId
        }
      });
      
      if (person) {
        relationships.personId = person.id;
        relationships.companyId = person.companyId;
        break;
      }
    }

    return relationships;
  }

  /**
   * Get note relationships
   */
  private getNoteRelationships(noteData: any): any {
    const relationships: any = {};
    
    if (noteData.personId) relationships.personId = noteData.personId;
    if (noteData.companyId) relationships.companyId = noteData.companyId;
    if (noteData.leadId) relationships.leadId = noteData.leadId;
    if (noteData.prospectId) relationships.prospectId = noteData.prospectId;
    if (noteData.opportunityId) relationships.opportunityId = noteData.opportunityId;
    
    return relationships;
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Setup Prisma middleware for automatic action creation
   */
  setupPrismaMiddleware(): void {
    // Person middleware
    this.prisma.$use(async (params, next) => {
      const result = await next(params);
      
      if (params.model === 'people') {
        await this.handlePersonOperation(params, result);
      } else if (params.model === 'companies') {
        await this.handleCompanyOperation(params, result);
      } else if (params.model === 'leads') {
        await this.handleLeadOperation(params, result);
      } else if (params.model === 'prospects') {
        await this.handleProspectOperation(params, result);
      } else if (params.model === 'opportunities') {
        await this.handleOpportunityOperation(params, result);
      } else if (params.model === 'notes') {
        await this.handleNoteOperation(params, result);
      } else if (params.model === 'email_messages') {
        await this.handleEmailOperation(params, result);
      }
      
      return result;
    });
  }

  /**
   * Handle person operations
   */
  private async handlePersonOperation(params: any, result: any): Promise<void> {
    const context: ActionHookContext = {
      workspaceId: params.args.data?.workspaceId || 'unknown',
      userId: params.args.data?.createdBy || 'system',
      entityType: 'person',
      entityId: result?.id || 'unknown',
      operation: params.action
    };

    if (params.action === 'create') {
      await this.onRecordCreated(context);
    } else if (params.action === 'update') {
      context.changes = this.extractChanges(params.args.data, params.args.where);
      await this.onRecordUpdated(context);
    } else if (params.action === 'delete') {
      await this.onRecordDeleted(context);
    }
  }

  /**
   * Handle company operations
   */
  private async handleCompanyOperation(params: any, result: any): Promise<void> {
    const context: ActionHookContext = {
      workspaceId: params.args.data?.workspaceId || 'unknown',
      userId: params.args.data?.createdBy || 'system',
      entityType: 'company',
      entityId: result?.id || 'unknown',
      operation: params.action
    };

    if (params.action === 'create') {
      await this.onRecordCreated(context);
    } else if (params.action === 'update') {
      context.changes = this.extractChanges(params.args.data, params.args.where);
      await this.onRecordUpdated(context);
    } else if (params.action === 'delete') {
      await this.onRecordDeleted(context);
    }
  }

  /**
   * Handle lead operations
   */
  private async handleLeadOperation(params: any, result: any): Promise<void> {
    const context: ActionHookContext = {
      workspaceId: params.args.data?.workspaceId || 'unknown',
      userId: params.args.data?.createdBy || 'system',
      entityType: 'lead',
      entityId: result?.id || 'unknown',
      operation: params.action
    };

    if (params.action === 'create') {
      await this.onRecordCreated(context);
    } else if (params.action === 'update') {
      context.changes = this.extractChanges(params.args.data, params.args.where);
      await this.onRecordUpdated(context);
    } else if (params.action === 'delete') {
      await this.onRecordDeleted(context);
    }
  }

  /**
   * Handle prospect operations
   */
  private async handleProspectOperation(params: any, result: any): Promise<void> {
    const context: ActionHookContext = {
      workspaceId: params.args.data?.workspaceId || 'unknown',
      userId: params.args.data?.createdBy || 'system',
      entityType: 'prospect',
      entityId: result?.id || 'unknown',
      operation: params.action
    };

    if (params.action === 'create') {
      await this.onRecordCreated(context);
    } else if (params.action === 'update') {
      context.changes = this.extractChanges(params.args.data, params.args.where);
      await this.onRecordUpdated(context);
    } else if (params.action === 'delete') {
      await this.onRecordDeleted(context);
    }
  }

  /**
   * Handle opportunity operations
   */
  private async handleOpportunityOperation(params: any, result: any): Promise<void> {
    const context: ActionHookContext = {
      workspaceId: params.args.data?.workspaceId || 'unknown',
      userId: params.args.data?.createdBy || 'system',
      entityType: 'opportunity',
      entityId: result?.id || 'unknown',
      operation: params.action
    };

    if (params.action === 'create') {
      await this.onRecordCreated(context);
    } else if (params.action === 'update') {
      context.changes = this.extractChanges(params.args.data, params.args.where);
      await this.onRecordUpdated(context);
    } else if (params.action === 'delete') {
      await this.onRecordDeleted(context);
    }
  }

  /**
   * Handle note operations
   */
  private async handleNoteOperation(params: any, result: any): Promise<void> {
    const operation = params.action === 'create' ? 'created' :
                     params.action === 'update' ? 'updated' : 'deleted';
    
    await this.onNoteOperation(
      params.args.data?.workspaceId || 'unknown',
      params.args.data?.userId || 'system',
      result || params.args.data,
      operation
    );
  }

  /**
   * Handle email operations
   */
  private async handleEmailOperation(params: any, result: any): Promise<void> {
    const operation = result?.direction === 'sent' ? 'sent' : 'received';
    
    await this.onEmailOperation(
      params.args.data?.workspaceId || 'unknown',
      params.args.data?.userId || 'system',
      result || params.args.data,
      operation
    );
  }

  /**
   * Extract changes from update operation
   */
  private extractChanges(newData: any, whereClause: any): Record<string, { from: any; to: any }> {
    // This is a simplified implementation
    // In production, you'd need to fetch the original record to compare
    const changes: Record<string, { from: any; to: any }> = {};
    
    Object.entries(newData).forEach(([key, value]) => {
      if (key !== 'updatedAt' && key !== 'id') {
        changes[key] = { from: null, to: value };
      }
    });
    
    return changes;
  }
}

// Export singleton instance
export const actionHooksSystem = new ActionHooksSystem();
