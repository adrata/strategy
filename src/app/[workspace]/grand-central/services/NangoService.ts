import { Nango } from '@nangohq/node';
import { IntegrationProvider, IntegrationOperation } from '../types/integration';

/**
 * Nango Service
 * Wraps Nango SDK for managing 500+ API integrations
 */
export class NangoService {
  private static instance: NangoService;
  private readonly baseUrl = '/api/grand-central/nango';
  private nango: Nango;

  private constructor() {
    // Initialize Nango client with environment variables
    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY!,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
  }

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
      // Get providers from Nango API
      const providers = await this.nango.listProviders();
      
      // Transform to our IntegrationProvider format
      return providers.map(provider => ({
        id: provider.provider,
        name: provider.provider,
        description: `Connect to ${provider.provider}`,
        category: this.getProviderCategory(provider.provider),
        authType: 'oauth2' as const,
        isConnected: false,
        operations: []
      }));
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  }

  /**
   * Get provider category based on provider name
   */
  private getProviderCategory(provider: string): string {
    const categories = {
      'salesforce': 'CRM',
      'hubspot': 'CRM',
      'pipedrive': 'CRM',
      'slack': 'Communication',
      'microsoft-teams': 'Communication',
      'discord': 'Communication',
      'mailchimp': 'Marketing',
      'sendgrid': 'Marketing',
      'google-workspace': 'Productivity',
      'notion': 'Productivity',
      'asana': 'Productivity',
      'stripe': 'Finance',
      'quickbooks': 'Finance',
      'shopify': 'E-commerce',
      'zendesk': 'Support',
      'intercom': 'Support',
      'google-analytics': 'Analytics',
      'mixpanel': 'Analytics'
    };
    
    return categories[provider as keyof typeof categories] || 'Other';
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
   * Get connections from Nango for a specific provider
   */
  async getNangoConnections(providerConfigKey: string): Promise<any[]> {
    try {
      const connections = await this.nango.listConnections(providerConfigKey);
      return connections;
    } catch (error) {
      console.error('Error fetching Nango connections:', error);
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
   * Generate OAuth URL for a provider
   */
  async generateAuthUrl(
    providerConfigKey: string,
    connectionId: string,
    scopes?: string[]
  ): Promise<string> {
    try {
      const authUrl = await this.nango.getAuthorizationURL(providerConfigKey, connectionId, scopes);
      return authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
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
   * Delete connection from Nango
   */
  async deleteNangoConnection(providerConfigKey: string, connectionId: string): Promise<boolean> {
    try {
      await this.nango.deleteConnection(providerConfigKey, connectionId);
      return true;
    } catch (error) {
      console.error('Error deleting Nango connection:', error);
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
   * Execute API call via Nango proxy
   */
  async executeNangoRequest(
    providerConfigKey: string,
    connectionId: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    try {
      const response = await this.nango.proxy({
        providerConfigKey,
        connectionId,
        endpoint,
        method,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Error executing Nango request:', error);
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
   * Test Nango connection
   */
  async testNangoConnection(providerConfigKey: string, connectionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Try to make a simple API call to test the connection
      const response = await this.nango.proxy({
        providerConfigKey,
        connectionId,
        endpoint: '/', // Simple endpoint to test connection
        method: 'GET'
      });
      return { success: true, message: 'Connection is active' };
    } catch (error) {
      console.error('Error testing Nango connection:', error);
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

