import { IntegrationProvider, IntegrationOperation } from '../types/integration';

/**
 * Nango Service
 * Wraps Nango SDK for managing 500+ API integrations
 */
export class NangoService {
  private static instance: NangoService;
  private readonly baseUrl = '/api/grand-central/nango';

  private constructor() {}

  static getInstance(): NangoService {
    if (!NangoService.instance) {
      NangoService.instance = new NangoService();
    }
    return NangoService.instance;
  }

  /**
   * Get all available integration providers from Nango
   */
  async getAvailableProviders(): Promise<IntegrationProvider[]> {
    try {
      const response = await fetch(`${this.baseUrl}/providers`);
      if (!response.ok) throw new Error('Failed to fetch providers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  }

  /**
   * Get connected integrations for the workspace
   */
  async getConnectedIntegrations(workspaceId: string): Promise<IntegrationProvider[]> {
    try {
      const response = await fetch(`${this.baseUrl}/connections?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error('Failed to fetch connections');
      return await response.json();
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  }

  /**
   * Initiate OAuth flow for a provider
   */
  async connectProvider(
    provider: string,
    workspaceId: string,
    redirectUrl?: string
  ): Promise<{ authUrl: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, workspaceId, redirectUrl }),
      });
      if (!response.ok) throw new Error('Failed to initiate connection');
      return await response.json();
    } catch (error) {
      console.error('Error connecting provider:', error);
      throw error;
    }
  }

  /**
   * Disconnect a provider
   */
  async disconnectProvider(connectionId: string, workspaceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, workspaceId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error disconnecting provider:', error);
      return false;
    }
  }

  /**
   * Execute an API operation via Nango proxy
   */
  async executeOperation(
    connectionId: string,
    operation: string,
    data?: any
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, operation, data }),
      });
      if (!response.ok) throw new Error('Operation failed');
      return await response.json();
    } catch (error) {
      console.error('Error executing operation:', error);
      throw error;
    }
  }

  /**
   * Get operations available for a provider
   */
  async getProviderOperations(provider: string): Promise<IntegrationOperation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/operations?provider=${provider}`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching operations:', error);
      return [];
    }
  }

  /**
   * Test a connection
   */
  async testConnection(connectionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, message: 'Connection test failed' };
    }
  }

  /**
   * Get integration categories with providers
   */
  getIntegrationCategories(): { category: string; color: string; providers: string[] }[] {
    return [
      {
        category: 'CRM',
        color: 'blue',
        providers: ['salesforce', 'hubspot', 'pipedrive', 'zoho-crm', 'close'],
      },
      {
        category: 'Communication',
        color: 'purple',
        providers: ['slack', 'microsoft-teams', 'discord', 'twilio', 'sendgrid'],
      },
      {
        category: 'Marketing',
        color: 'pink',
        providers: ['mailchimp', 'constant-contact', 'activecamp aign', 'marketo'],
      },
      {
        category: 'Productivity',
        color: 'green',
        providers: ['google-workspace', 'microsoft-365', 'notion', 'asana', 'trello'],
      },
      {
        category: 'Finance',
        color: 'yellow',
        providers: ['stripe', 'quickbooks', 'xero', 'paypal', 'square'],
      },
      {
        category: 'E-commerce',
        color: 'orange',
        providers: ['shopify', 'woocommerce', 'bigcommerce', 'magento'],
      },
      {
        category: 'Support',
        color: 'red',
        providers: ['zendesk', 'intercom', 'freshdesk', 'help-scout'],
      },
      {
        category: 'Analytics',
        color: 'indigo',
        providers: ['google-analytics', 'mixpanel', 'amplitude', 'segment'],
      },
    ];
  }
}

export const nangoService = NangoService.getInstance();

