/**
 * 🔔 ZOHO UPDATE NOTIFICATION SERVICE
 * 
 * Handles real-time notifications when Zoho CRM records are updated
 * Similar to Speedrun notifications but for general Zoho updates
 */

import { prisma } from '@/platform/database/prisma-client';
import { PusherServerService } from './pusher-real-time-service';
import { notificationService } from './notification-service';

export interface ZohoUpdateNotification {
  type: 'ZOHO_UPDATE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  module: 'leads' | 'contacts' | 'deals' | 'accounts' | 'notes' | 'tasks' | 'meetings';
  operation: 'create' | 'update' | 'delete';
  record: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    title?: string;
    amount?: number;
    stage?: string;
  };
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  note: {
    title: string;
    content: string;
    source: 'zoho_webhook';
  };
  action: 'NOTIFICATION_ONLY';
  timestamp: string;
  workspaceId: string;
}

export class ZohoNotificationService {
  private static instance: ZohoNotificationService;
  private pusherService: PusherServerService;

  public static getInstance(): ZohoNotificationService {
    if (!ZohoNotificationService.instance) {
      ZohoNotificationService.instance = new ZohoNotificationService();
    }
    return ZohoNotificationService.instance;
  }

  constructor() {
    this.pusherService = PusherServerService.getInstance();
  }

  /**
   * Send Zoho update notification
   */
  async sendZohoUpdateNotification(
    workspaceId: string,
    module: string,
    operation: string,
    recordData: any,
    changes?: Array<{ field: string; oldValue: string; newValue: string }>
  ): Promise<void> {
    try {
      console.log(`🔔 [ZOHO NOTIFICATION] Sending ${operation} notification for ${module}: ${recordData.name || recordData.id}`);

      // Determine priority based on module and operation
      const priority = this.determinePriority(module, operation, recordData);

      // Create notification payload
      const notification: ZohoUpdateNotification = {
        type: 'ZOHO_UPDATE',
        priority,
        module: module as any,
        operation: operation as any,
        record: {
          id: recordData.id || 'unknown',
          name: this.getRecordName(recordData, module),
          company: recordData.company || recordData.Company || recordData.Account_Name,
          email: recordData.email || recordData.Email,
          title: recordData.title || recordData.Title || recordData.jobTitle,
          amount: recordData.amount || recordData.Amount ? parseFloat(recordData.Amount) : undefined,
          stage: recordData.stage || recordData.Stage
        },
        changes: changes || [],
        note: {
          title: this.getNotificationTitle(module, operation, recordData),
          content: this.getNotificationContent(module, operation, recordData, changes),
          source: 'zoho_webhook'
        },
        action: 'NOTIFICATION_ONLY',
        timestamp: new Date().toISOString(),
        workspaceId
      };

      // Send via Pusher for real-time updates
      await this.sendPusherNotification(workspaceId, notification);

      // Send desktop notification if high priority
      if (priority === 'HIGH') {
        await this.sendDesktopNotification(notification);
      }

      // Store notification in database for history
      await this.storeNotification(workspaceId, notification);

      console.log(`✅ [ZOHO NOTIFICATION] Successfully sent ${operation} notification for ${module}`);

    } catch (error) {
      console.error('❌ [ZOHO NOTIFICATION] Error sending notification:', error);
    }
  }

  /**
   * Determine notification priority
   */
  private determinePriority(module: string, operation: string, recordData: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    // High priority for deals and high-value records
    if (module === 'deals' || module === 'opportunities') {
      const amount = recordData.Amount || recordData.amount;
      if (amount && parseFloat(amount) > 10000) {
        return 'HIGH';
      }
      return 'MEDIUM';
    }

    // High priority for leads with buying signals
    if (module === 'leads') {
      const description = (recordData.Description || recordData.description || '').toLowerCase();
      const buyingKeywords = ['urgent', 'budget', 'purchase', 'decision', 'approved', 'asap'];
      if (buyingKeywords.some(keyword => description.includes(keyword))) {
        return 'HIGH';
      }
    }

    // Medium priority for contacts and accounts
    if (module === 'contacts' || module === 'accounts') {
      return 'MEDIUM';
    }

    // Low priority for notes, tasks, meetings
    if (module === 'notes' || module === 'tasks' || module === 'meetings') {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  /**
   * Get record name for display
   */
  private getRecordName(recordData: any, module: string): string {
    switch (module) {
      case 'leads':
        return `${recordData.First_Name || ''} ${recordData.Last_Name || ''}`.trim() || recordData.fullName || 'Unknown Lead';
      case 'contacts':
        return `${recordData.First_Name || ''} ${recordData.Last_Name || ''}`.trim() || recordData.fullName || 'Unknown Contact';
      case 'deals':
        return recordData.Deal_Name || recordData.name || 'Unknown Deal';
      case 'accounts':
        return recordData.Account_Name || recordData.name || 'Unknown Account';
      case 'notes':
        return recordData.Note_Title || recordData.title || 'Note';
      case 'tasks':
        return recordData.Task_Title || recordData.title || 'Task';
      case 'meetings':
        return recordData.Subject || recordData.title || 'Meeting';
      default:
        return recordData.name || recordData.id || 'Unknown Record';
    }
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(module: string, operation: string, recordData: any): string {
    const recordName = this.getRecordName(recordData, module);
    const operationText = operation === 'create' ? 'Created' : operation === 'update' ? 'Updated' : 'Deleted';
    
    switch (module) {
      case 'leads':
        return `Lead ${operationText}: ${recordName}`;
      case 'contacts':
        return `Contact ${operationText}: ${recordName}`;
      case 'deals':
        return `Deal ${operationText}: ${recordName}`;
      case 'accounts':
        return `Account ${operationText}: ${recordName}`;
      case 'notes':
        return `Note ${operationText}: ${recordName}`;
      case 'tasks':
        return `Task ${operationText}: ${recordName}`;
      case 'meetings':
        return `Meeting ${operationText}: ${recordName}`;
      default:
        return `${module} ${operationText}: ${recordName}`;
    }
  }

  /**
   * Get notification content
   */
  private getNotificationContent(
    module: string, 
    operation: string, 
    recordData: any, 
    changes?: Array<{ field: string; oldValue: string; newValue: string }>
  ): string {
    const recordName = this.getRecordName(recordData, module);
    const company = recordData.Company || recordData.Account_Name || recordData.company;
    
    let content = `${recordName}`;
    if (company) {
      content += ` at ${company}`;
    }

    // Add specific details based on module
    switch (module) {
      case 'leads':
        const leadStatus = recordData.Lead_Status || recordData.status;
        if (leadStatus) {
          content += ` - Status: ${leadStatus}`;
        }
        break;
      case 'deals':
        const amount = recordData.Amount || recordData.amount;
        const stage = recordData.Stage || recordData.stage;
        if (amount) {
          content += ` - Amount: $${parseFloat(amount).toLocaleString()}`;
        }
        if (stage) {
          content += ` - Stage: ${stage}`;
        }
        break;
      case 'contacts':
        const title = recordData.Title || recordData.title || recordData.jobTitle;
        if (title) {
          content += ` - ${title}`;
        }
        break;
    }

    // Add change details if available
    if (changes && changes.length > 0) {
      content += `\n\nChanges:`;
      changes.slice(0, 3).forEach(change => {
        content += `\n• ${change.field}: ${change.oldValue} → ${change.newValue}`;
      });
      if (changes.length > 3) {
        content += `\n• ... and ${changes.length - 3} more changes`;
      }
    }

    return content;
  }

  /**
   * Send notification via Pusher
   */
  private async sendPusherNotification(workspaceId: string, notification: ZohoUpdateNotification): Promise<void> {
    try {
      const channel = `workspace-${workspaceId}`;
      const payload = {
        type: 'zoho_update',
        payload: notification,
        timestamp: new Date().toISOString(),
        source: 'zoho_webhook',
        workspaceId
      };

      await this.pusherService.trigger(channel, 'zoho_update', payload);
      console.log(`📡 [ZOHO NOTIFICATION] Pusher notification sent to channel: ${channel}`);

    } catch (error) {
      console.error('❌ [ZOHO NOTIFICATION] Error sending Pusher notification:', error);
    }
  }

  /**
   * Send desktop notification
   */
  private async sendDesktopNotification(notification: ZohoUpdateNotification): Promise<void> {
    try {
      await notificationService.showNotification(
        notification.note.title,
        notification.note.content,
        {
          icon: '/adrata-icon.png',
          channelId: 'zoho-updates'
        }
      );
      console.log(`🖥️ [ZOHO NOTIFICATION] Desktop notification sent: ${notification.note.title}`);

    } catch (error) {
      console.error('❌ [ZOHO NOTIFICATION] Error sending desktop notification:', error);
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotification(workspaceId: string, notification: ZohoUpdateNotification): Promise<void> {
    try {
      // Store in a notifications table or activity log
      // For now, we'll use the existing signal storage system
      await prisma.signals.create({
        data: {
          id: `zoho_notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workspaceId,
          type: notification.type,
          priority: notification.priority,
          status: 'active',
          data: {
            module: notification.module,
            operation: notification.operation,
            record: notification.record,
            changes: notification.changes,
            note: notification.note,
            action: notification.action,
            timestamp: notification.timestamp
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`💾 [ZOHO NOTIFICATION] Notification stored in database`);

    } catch (error) {
      console.error('❌ [ZOHO NOTIFICATION] Error storing notification:', error);
    }
  }

  /**
   * Get recent Zoho notifications for a workspace
   */
  async getRecentNotifications(workspaceId: string, limit: number = 10): Promise<ZohoUpdateNotification[]> {
    try {
      const signals = await prisma.signals.findMany({
        where: {
          workspaceId,
          type: 'ZOHO_UPDATE',
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return signals.map(signal => ({
        type: signal.type as 'ZOHO_UPDATE',
        priority: signal.priority as 'LOW' | 'MEDIUM' | 'HIGH',
        module: signal.data.module,
        operation: signal.data.operation,
        record: signal.data.record,
        changes: signal.data.changes || [],
        note: signal.data.note,
        action: signal.data.action,
        timestamp: signal.data.timestamp,
        workspaceId: signal.workspaceId
      }));

    } catch (error) {
      console.error('❌ [ZOHO NOTIFICATION] Error fetching notifications:', error);
      return [];
    }
  }
}

// Export singleton instance
export const zohoNotificationService = ZohoNotificationService.getInstance();
