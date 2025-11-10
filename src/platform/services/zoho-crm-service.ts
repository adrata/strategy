/**
 * 🎯 ZOHO CRM INTEGRATION SERVICE
 * 
 * Comprehensive bidirectional sync between Adrata and Zoho CRM
 * Handles real-time updates, data mapping, and conflict resolution
 */

import { prisma } from '@/platform/prisma';
import { IDManagementService } from './id-management-service';

export interface ZohoCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  clientId: string;
  clientSecret: string;
  organizationId: string;
}

export interface ZohoRecord {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: string;
  lead_source?: string;
  industry?: string;
  annual_revenue?: number;
  description?: string;
  created_time?: string;
  modified_time?: string;
  [key: string]: any; // Allow additional Zoho fields
}

export interface ZohoSyncConfig {
  workspaceId: string;
  credentials: ZohoCredentials;
  syncSettings: {
    leads: boolean;
    contacts: boolean;
    accounts: boolean;
    opportunities: boolean;
    realTimeSync: boolean;
    conflictResolution: 'adrata_wins' | 'zoho_wins' | 'manual';
  };
}

export interface SyncResult {
  success: boolean;
  syncedRecords: number;
  errors: string[];
  conflicts: Array<{
    recordId: string;
    tableName: string;
    conflictType: 'field_mismatch' | 'deletion_conflict' | 'creation_conflict';
    adrataData: any;
    zohoData: any;
  }>;
}

export class ZohoCRMService {
  private static instance: ZohoCRMService;
  private config: ZohoSyncConfig | null = null;
  private idService: IDManagementService;

  private constructor() {
    this['idService'] = new IDManagementService();
  }

  static getInstance(): ZohoCRMService {
    if (!ZohoCRMService.instance) {
      ZohoCRMService['instance'] = new ZohoCRMService();
    }
    return ZohoCRMService.instance;
  }

  /**
   * Initialize Zoho CRM integration
   */
  async initialize(config: ZohoSyncConfig): Promise<void> {
    console.log('🎯 Initializing Zoho CRM integration...');
    
    // Validate credentials
    await this.validateCredentials(config.credentials);
    
    this['config'] = config;
    
    // Set up webhook for real-time sync
    if (config.syncSettings.realTimeSync) {
      await this.setupWebhook();
    }
    
    console.log('✅ Zoho CRM integration initialized');
  }

  /**
   * Validate Zoho credentials
   */
  private async validateCredentials(credentials: ZohoCredentials): Promise<void> {
    try {
      const response = await fetch(`https://www.zohoapis.com/crm/v3/org`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Invalid credentials: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Zoho credentials validated');
    } catch (error) {
      console.error('❌ Zoho credentials validation failed:', error);
      throw new Error('Invalid Zoho credentials');
    }
  }

  /**
   * Set up webhook for real-time updates from Zoho
   */
  private async setupWebhook(): Promise<void> {
    if (!this.config) return;

    try {
      const { getWebhookUrl } = await import('@/lib/env-urls');
      const webhookUrl = getWebhookUrl('/api/webhooks/zoho');
      
      const webhookData = {
        webhook_url: webhookUrl,
        channel_id: 1000000127, // Default channel ID
        events: {
          leads: ['create', 'edit', 'delete'],
          contacts: ['create', 'edit', 'delete'],
          accounts: ['create', 'edit', 'delete'],
          deals: ['create', 'edit', 'delete']
        },
        channel_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      const response = await fetch(`https://www.zohoapis.com/crm/v3/webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.config.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Failed to setup webhook: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Zoho webhook setup successfully:', result.webhook_id);
    } catch (error) {
      console.error('❌ Failed to setup Zoho webhook:', error);
    }
  }

  /**
   * Sync data from Adrata to Zoho CRM
   */
  async syncToZoho(tableName: 'lead' | 'contact' | 'account' | 'opportunity'): Promise<SyncResult> {
    if (!this.config) {
      throw new Error('Zoho CRM not initialized');
    }

    console.log(`🔄 Syncing ${tableName} data to Zoho CRM...`);

    const result: SyncResult = {
      success: true,
      syncedRecords: 0,
      errors: [],
      conflicts: []
    };

    try {
      // Get records that need syncing
      const records = await this.getRecordsForSync(tableName);
      
      for (const record of records) {
        try {
          const zohoData = this.mapToZohoFormat(record, tableName);
          const zohoId = await this.createOrUpdateZohoRecord(tableName, zohoData, record.zohoId);
          
          // Update local record with Zoho ID
          await this.updateLocalRecord(tableName, record.id, zohoId);
          
          result.syncedRecords++;
        } catch (error) {
          result.errors.push(`Failed to sync ${record.id}: ${error}`);
        }
      }

      console.log(`✅ Synced ${result.syncedRecords} ${tableName} records to Zoho`);
    } catch (error) {
      result['success'] = false;
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  /**
   * Sync data from Zoho CRM to Adrata
   */
  async syncFromZoho(tableName: 'lead' | 'contact' | 'account' | 'opportunity'): Promise<SyncResult> {
    if (!this.config) {
      throw new Error('Zoho CRM not initialized');
    }

    console.log(`🔄 Syncing ${tableName} data from Zoho CRM...`);

    const result: SyncResult = {
      success: true,
      syncedRecords: 0,
      errors: [],
      conflicts: []
    };

    try {
      // Get records from Zoho
      const zohoRecords = await this.fetchZohoRecords(tableName);
      
      for (const zohoRecord of zohoRecords) {
        try {
          const adrataData = this.mapFromZohoFormat(zohoRecord, tableName);
          const localRecord = await this.findLocalRecordByZohoId(tableName, zohoRecord.id);
          
          if (localRecord) {
            // Update existing record
            await this.updateLocalRecordFromZoho(tableName, localRecord.id, adrataData);
          } else {
            // Create new record
            await this.createLocalRecordFromZoho(tableName, adrataData, zohoRecord.id);
          }
          
          result.syncedRecords++;
        } catch (error) {
          result.errors.push(`Failed to sync Zoho record ${zohoRecord.id}: ${error}`);
        }
      }

      console.log(`✅ Synced ${result.syncedRecords} ${tableName} records from Zoho`);
    } catch (error) {
      result['success'] = false;
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  /**
   * Handle webhook notification from Zoho
   */
  async handleZohoWebhook(webhookData: any): Promise<void> {
    console.log('🔔 Received Zoho webhook:', webhookData);

    try {
      const { channel_id, token, resource_uri, resource_id, channel_expiry, resource_name, operation } = webhookData;

      // Validate webhook
      if (!this.validateWebhook(webhookData)) {
        console.error('❌ Invalid webhook signature');
        return;
      }

      // Get the updated record from Zoho
      const zohoRecord = await this.fetchZohoRecord(resource_name, resource_id);
      
      if (!zohoRecord) {
        console.error('❌ Failed to fetch Zoho record');
        return;
      }

      // Map to Adrata format and update
      const tableName = this.mapZohoModuleToTable(resource_name);
      const adrataData = this.mapFromZohoFormat(zohoRecord, tableName);

      switch (operation) {
        case 'create':
          await this.createLocalRecordFromZoho(tableName, adrataData, resource_id);
          break;
        case 'edit':
          const localRecord = await this.findLocalRecordByZohoId(tableName, resource_id);
          if (localRecord) {
            await this.updateLocalRecordFromZoho(tableName, localRecord.id, adrataData);
          }
          break;
        case 'delete':
          const recordToDelete = await this.findLocalRecordByZohoId(tableName, resource_id);
          if (recordToDelete) {
            await this.deleteLocalRecord(tableName, recordToDelete.id);
          }
          break;
      }

      console.log('✅ Zoho webhook processed successfully');
    } catch (error) {
      console.error('❌ Failed to process Zoho webhook:', error);
    }
  }

  /**
   * Get records that need syncing to Zoho
   */
  private async getRecordsForSync(tableName: string): Promise<any[]> {
    const whereClause = {
      workspaceId: this.config!.workspaceId,
      OR: [
        { zohoId: null },
        { zohoId: { startsWith: 'PENDING_' } }
      ]
    };

    switch (tableName) {
      case 'lead':
        return await prisma.leads.findMany({ where: { ...whereClause, deletedAt: null } });
      case 'contact':
        return await prisma.contacts.findMany({ where: { ...whereClause, deletedAt: null } });
      case 'account':
        return await prisma.accounts.findMany({ where: { ...whereClause, deletedAt: null } });
      case 'opportunity':
        return await prisma.opportunities.findMany({ where: { ...whereClause, deletedAt: null } });
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Map Adrata record to Zoho format
   */
  private mapToZohoFormat(record: any, tableName: string): ZohoRecord {
    const baseMapping = {
      name: record.fullName || record.name,
      email: record.email,
      phone: record.phone,
      description: record.description || record.notes
    };

    switch (tableName) {
      case 'lead':
        return {
          ...baseMapping,
          company: record.company,
          lead_source: record.source || 'Adrata',
          industry: record.industry,
          annual_revenue: record.estimatedValue,
          status: this.mapLeadStatus(record.status)
        };
      case 'contact':
        return {
          ...baseMapping,
          account_name: record.account?.name,
          title: record.title || record.jobTitle,
          department: record.department
        };
      case 'account':
        return {
          ...baseMapping,
          name: record.name,
          industry: record.industry,
          annual_revenue: record.revenue,
          website: record.website,
          billing_city: record.city,
          billing_state: record.state
        };
      case 'opportunity':
        return {
          ...baseMapping,
          name: record.name,
          account_name: record.account?.name,
          amount: record.amount,
          stage: this.mapOpportunityStage(record.stage),
          probability: record.probability,
          expected_revenue: record.amount,
          closing_date: record.expectedCloseDate?.toISOString()
        };
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Map Zoho record to Adrata format
   */
  private mapFromZohoFormat(zohoRecord: ZohoRecord, tableName: string): any {
    const baseMapping = {
      fullName: zohoRecord.name,
      email: zohoRecord.email,
      phone: zohoRecord.phone,
      notes: zohoRecord.description
    };

    switch (tableName) {
      case 'lead':
        return {
          ...baseMapping,
          company: zohoRecord.company,
          source: zohoRecord.lead_source,
          industry: zohoRecord.industry,
          estimatedValue: zohoRecord.annual_revenue,
          status: this.mapZohoLeadStatus(zohoRecord.status)
        };
      case 'contact':
        return {
          ...baseMapping,
          title: zohoRecord.title,
          department: zohoRecord.department
        };
      case 'account':
        return {
          ...baseMapping,
          name: zohoRecord.name,
          industry: zohoRecord.industry,
          revenue: zohoRecord.annual_revenue,
          website: zohoRecord.website,
          city: zohoRecord.billing_city,
          state: zohoRecord.billing_state
        };
      case 'opportunity':
        return {
          ...baseMapping,
          name: zohoRecord.name,
          amount: zohoRecord.amount,
          stage: this.mapZohoOpportunityStage(zohoRecord.stage),
          probability: zohoRecord.probability,
          expectedCloseDate: zohoRecord.closing_date ? new Date(zohoRecord.closing_date) : null
        };
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Create or update record in Zoho
   */
  private async createOrUpdateZohoRecord(tableName: string, data: ZohoRecord, existingZohoId?: string): Promise<string> {
    const moduleName = this.mapTableToZohoModule(tableName);
    
    if (existingZohoId && !this.idService.isZohoIDPlaceholder(existingZohoId)) {
      // Update existing record
      const response = await fetch(`https://www.zohoapis.com/crm/v3/${moduleName}/${existingZohoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.config!.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [data] })
      });

      if (!response.ok) {
        throw new Error(`Failed to update Zoho record: ${response.status}`);
      }

      return existingZohoId;
    } else {
      // Create new record
      const response = await fetch(`https://www.zohoapis.com/crm/v3/${moduleName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.config!.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [data] })
      });

      if (!response.ok) {
        throw new Error(`Failed to create Zoho record: ${response.status}`);
      }

      const result = await response.json();
      return result['data'][0].details.id;
    }
  }

  /**
   * Fetch records from Zoho
   */
  private async fetchZohoRecords(tableName: string): Promise<ZohoRecord[]> {
    const moduleName = this.mapTableToZohoModule(tableName);
    
    const response = await fetch(`https://www.zohoapis.com/crm/v3/${moduleName}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.config!.credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho records: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Fetch single record from Zoho
   */
  private async fetchZohoRecord(moduleName: string, recordId: string): Promise<ZohoRecord | null> {
    const response = await fetch(`https://www.zohoapis.com/crm/v3/${moduleName}/${recordId}`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.config!.credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result['data'][0] || null;
  }

  /**
   * Find local record by Zoho ID
   */
  private async findLocalRecordByZohoId(tableName: string, zohoId: string): Promise<any | null> {
    const whereClause = {
      workspaceId: this.config!.workspaceId,
      zohoId: zohoId
    };

    switch (tableName) {
      case 'lead':
        return await prisma.leads.findFirst({ where: { ...whereClause, deletedAt: null } });
      case 'contact':
        return await prisma.contacts.findFirst({ where: { ...whereClause, deletedAt: null } });
      case 'account':
        return await prisma.accounts.findFirst({ where: { ...whereClause, deletedAt: null } });
      case 'opportunity':
        return await prisma.opportunities.findFirst({ where: { ...whereClause, deletedAt: null } });
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Update local record with Zoho ID
   */
  private async updateLocalRecord(tableName: string, recordId: string, zohoId: string): Promise<void> {
    const data = { zohoId };

    switch (tableName) {
      case 'lead':
        await prisma.leads.update({ where: { id: recordId }, data });
        break;
      case 'contact':
        await prisma.contacts.update({ where: { id: recordId }, data });
        break;
      case 'account':
        await prisma.accounts.update({ where: { id: recordId }, data });
        break;
      case 'opportunity':
        await prisma.opportunities.update({ where: { id: recordId }, data });
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Create local record from Zoho data
   */
  private async createLocalRecordFromZoho(tableName: string, data: any, zohoId: string): Promise<void> {
    const recordData = {
      ...data,
      workspaceId: this.config!.workspaceId,
      zohoId
    };

    switch (tableName) {
      case 'lead':
        await prisma.leads.create({ data: recordData });
        break;
      case 'contact':
        await prisma.contacts.create({ data: recordData });
        break;
      case 'account':
        await prisma.accounts.create({ data: recordData });
        break;
      case 'opportunity':
        await prisma.opportunities.create({ data: recordData });
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Update local record from Zoho data
   */
  private async updateLocalRecordFromZoho(tableName: string, recordId: string, data: any): Promise<void> {
    switch (tableName) {
      case 'lead':
        await prisma.leads.update({ where: { id: recordId }, data });
        break;
      case 'contact':
        await prisma.contacts.update({ where: { id: recordId }, data });
        break;
      case 'account':
        await prisma.accounts.update({ where: { id: recordId }, data });
        break;
      case 'opportunity':
        await prisma.opportunities.update({ where: { id: recordId }, data });
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Delete local record
   */
  private async deleteLocalRecord(tableName: string, recordId: string): Promise<void> {
    switch (tableName) {
      case 'lead':
        await prisma.leads.delete({ where: { id: recordId } });
        break;
      case 'contact':
        await prisma.contacts.delete({ where: { id: recordId } });
        break;
      case 'account':
        await prisma.accounts.delete({ where: { id: recordId } });
        break;
      case 'opportunity':
        await prisma.opportunities.delete({ where: { id: recordId } });
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  /**
   * Utility mapping functions
   */
  private mapTableToZohoModule(tableName: string): string {
    const mapping = {
      'lead': 'Leads',
      'contact': 'Contacts',
      'account': 'Accounts',
      'opportunity': 'Deals'
    };
    return mapping[tableName as keyof typeof mapping] || tableName;
  }

  private mapZohoModuleToTable(moduleName: string): string {
    const mapping = {
      'Leads': 'lead',
      'Contacts': 'contact',
      'Accounts': 'account',
      'Deals': 'opportunity'
    };
    return mapping[moduleName as keyof typeof mapping] || moduleName;
  }

  private mapLeadStatus(status: string): string {
    const mapping: Record<string, string> = {
      'new': 'New',
      'contacted': 'Contacted',
      'qualified': 'Qualified',
      'unqualified': 'Unqualified'
    };
    return mapping[status] || 'New';
  }

  private mapZohoLeadStatus(status: string): string {
    const mapping: Record<string, string> = {
      'New': 'new',
      'Contacted': 'contacted',
      'Qualified': 'qualified',
      'Unqualified': 'unqualified'
    };
    return mapping[status] || 'new';
  }

  private mapOpportunityStage(stage: string): string {
    const mapping: Record<string, string> = {
      'prospecting': 'Prospecting',
      'qualification': 'Qualification',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed_won': 'Closed Won',
      'closed_lost': 'Closed Lost'
    };
    return mapping[stage] || 'Prospecting';
  }

  private mapZohoOpportunityStage(stage: string): string {
    const mapping: Record<string, string> = {
      'Prospecting': 'prospecting',
      'Qualification': 'qualification',
      'Proposal': 'proposal',
      'Negotiation': 'negotiation',
      'Closed Won': 'closed_won',
      'Closed Lost': 'closed_lost'
    };
    return mapping[stage] || 'prospecting';
  }

  /**
   * Validate webhook signature
   */
  private validateWebhook(webhookData: any): boolean {
    // Implement webhook validation logic
    // This would typically involve checking a signature or token
    return true; // Placeholder
  }

  /**
   * Get sync status for a workspace
   */
  async getSyncStatus(workspaceId: string): Promise<{
    lastSync: Date | null;
    syncErrors: string[];
    recordCounts: Record<string, number>;
  }> {
    // Implementation for getting sync status
    return {
      lastSync: new Date(),
      syncErrors: [],
      recordCounts: {
        lead: 0,
        contact: 0,
        account: 0,
        opportunity: 0
      }
    };
  }
}

export const zohoCRMService = ZohoCRMService.getInstance(); 