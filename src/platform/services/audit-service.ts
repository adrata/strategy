/**
 * AUDIT SERVICE - COMPREHENSIVE CHANGE TRACKING
 * 
 * Provides comprehensive audit logging for all data operations
 * with context tracking, performance metrics, and analytics
 */

import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

export interface AuditContext {
  workspaceId: string;
  userId: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AuditLogData {
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'view';
  fieldChanges?: Record<string, { old: any; new: any }>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changeReason?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Log a create action
   */
  static async logCreate(
    context: AuditContext,
    data: Omit<AuditLogData, 'action' | 'oldValues'>
  ): Promise<void> {
    await this.logAction(context, {
      ...data,
      action: 'create',
      oldValues: undefined,
    });
  }

  /**
   * Log an update action
   */
  static async logUpdate(
    context: AuditContext,
    data: AuditLogData
  ): Promise<void> {
    await this.logAction(context, data);
  }

  /**
   * Log a delete action
   */
  static async logDelete(
    context: AuditContext,
    data: Omit<AuditLogData, 'action' | 'newValues'>
  ): Promise<void> {
    await this.logAction(context, {
      ...data,
      action: 'delete',
      newValues: undefined,
    });
  }

  /**
   * Log a view action
   */
  static async logView(
    context: AuditContext,
    data: Omit<AuditLogData, 'action' | 'oldValues' | 'newValues' | 'fieldChanges'>
  ): Promise<void> {
    await this.logAction(context, {
      ...data,
      action: 'view',
      oldValues: undefined,
      newValues: undefined,
      fieldChanges: undefined,
    });
  }

  /**
   * Log an error
   */
  static async logError(
    context: AuditContext,
    error: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logAction(context, {
      entityType: 'system',
      entityId: 'error',
      action: 'error',
      changeReason: error.message,
      metadata: {
        ...metadata,
        errorStack: error.stack,
        errorName: error.name,
      },
    });
  }

  /**
   * Core logging method
   */
  private static async logAction(
    context: AuditContext,
    data: AuditLogData
  ): Promise<void> {
    try {
      const auditLog = {
        id: ulid(),
        workspaceId: context.workspaceId,
        userId: context.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        fieldChanges: data.fieldChanges || null,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        changeReason: data.changeReason || null,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        sessionId: context.sessionId || null,
        requestId: context.requestId || null,
        metadata: data.metadata || null,
        createdAt: new Date(),
      };

      await prisma.$executeRaw`
        INSERT INTO audit_logs (
          id, workspace_id, user_id, entity_type, entity_id, action,
          field_changes, old_values, new_values, change_reason,
          ip_address, user_agent, session_id, request_id, metadata, created_at
        ) VALUES (
          ${auditLog.id}, ${auditLog.workspaceId}, ${auditLog.userId}, 
          ${auditLog.entityType}, ${auditLog.entityId}, ${auditLog.action},
          ${JSON.stringify(auditLog.fieldChanges)}, 
          ${JSON.stringify(auditLog.oldValues)}, 
          ${JSON.stringify(auditLog.newValues)}, 
          ${auditLog.changeReason},
          ${auditLog.ipAddress}, ${auditLog.userAgent}, ${auditLog.sessionId}, 
          ${auditLog.requestId}, ${JSON.stringify(auditLog.metadata)}, ${auditLog.createdAt}
        )
      `;

      // Update analytics
      await this.updateAnalytics(context, data);

    } catch (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Update analytics counters
   */
  private static async updateAnalytics(
    context: AuditContext,
    data: AuditLogData
  ): Promise<void> {
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const hour = now.getHours();

      await prisma.$executeRaw`
        INSERT INTO audit_analytics (
          id, workspace_id, user_id, entity_type, action, date, hour, count
        ) VALUES (
          ${ulid()}, ${context.workspaceId}, ${context.userId}, 
          ${data.entityType}, ${data.action}, ${date}, ${hour}, 1
        )
        ON CONFLICT (workspace_id, user_id, entity_type, action, date, hour)
        DO UPDATE SET count = audit_analytics.count + 1
      `;
    } catch (error) {
      console.error('Failed to update audit analytics:', error);
    }
  }

  /**
   * Get audit stats for a workspace
   */
  static async getAuditStats(
    workspaceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalActions: number;
    uniqueUsers: number;
    entityTypes: Record<string, number>;
    actions: Record<string, number>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const [totalActions, uniqueUsers, entityTypes, actions, dailyActivity] = await Promise.all([
      // Total actions
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM audit_logs
        WHERE workspace_id = ${workspaceId}
        AND created_at >= ${start}
        AND created_at <= ${end}
      `,

      // Unique users
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT user_id) as count
        FROM audit_logs
        WHERE workspace_id = ${workspaceId}
        AND created_at >= ${start}
        AND created_at <= ${end}
      `,

      // Entity types
      prisma.$queryRaw<Array<{ entity_type: string; count: bigint }>>`
        SELECT entity_type, COUNT(*) as count
        FROM audit_logs
        WHERE workspace_id = ${workspaceId}
        AND created_at >= ${start}
        AND created_at <= ${end}
        GROUP BY entity_type
        ORDER BY count DESC
      `,

      // Actions
      prisma.$queryRaw<Array<{ action: string; count: bigint }>>`
        SELECT action, COUNT(*) as count
        FROM audit_logs
        WHERE workspace_id = ${workspaceId}
        AND created_at >= ${start}
        AND created_at <= ${end}
        GROUP BY action
        ORDER BY count DESC
      `,

      // Daily activity
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM audit_logs
        WHERE workspace_id = ${workspaceId}
        AND created_at >= ${start}
        AND created_at <= ${end}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ]);

    return {
      totalActions: Number(totalActions[0].count),
      uniqueUsers: Number(uniqueUsers[0].count),
      entityTypes: entityTypes.reduce((acc, row) => {
        acc[row.entity_type] = Number(row.count);
        return acc;
      }, {} as Record<string, number>),
      actions: actions.reduce((acc, row) => {
        acc[row.action] = Number(row.count);
        return acc;
      }, {} as Record<string, number>),
      dailyActivity: dailyActivity.map(row => ({
        date: row.date,
        count: Number(row.count),
      })),
    };
  }

  /**
   * Get audit trail for a specific entity
   */
  static async getEntityAuditTrail(
    workspaceId: string,
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    action: string;
    userId: string;
    fieldChanges?: Record<string, any>;
    changeReason?: string;
    createdAt: Date;
  }>> {
    const results = await prisma.$queryRaw<Array<{
      id: string;
      action: string;
      user_id: string;
      field_changes: string | null;
      change_reason: string | null;
      created_at: Date;
    }>>`
      SELECT id, action, user_id, field_changes, change_reason, created_at
      FROM audit_logs
      WHERE workspace_id = ${workspaceId}
      AND entity_type = ${entityType}
      AND entity_id = ${entityId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return results.map(row => ({
      id: row.id,
      action: row.action,
      userId: row.user_id,
      fieldChanges: row.field_changes ? JSON.parse(row.field_changes) : undefined,
      changeReason: row.change_reason || undefined,
      createdAt: row.created_at,
    }));
  }
}

/**
 * Extract audit context from NextRequest
 */
export function extractAuditContext(request: NextRequest, workspaceId: string, userId: string, userEmail: string): AuditContext {
  const ipAddress = request.ip || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId = request.headers.get('x-session-id') || undefined;
  const requestId = request.headers.get('x-request-id') || undefined;

  return {
    workspaceId,
    userId,
    userEmail,
    ipAddress,
    userAgent,
    sessionId,
    requestId,
  };
}
