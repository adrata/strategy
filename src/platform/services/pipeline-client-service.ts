import type { PipelineData, Lead, OpportunityWithDetails, AccountWithDetails, ContactWithDetails } from './pipeline-data-service';

/**
 * Client-side service for Pipeline data - calls API routes instead of Prisma
 */
export class PipelineClientService {
  /**
   * Get complete pipeline data for a workspace
   */
  static async getPipelineData(workspaceId: string, userId?: string): Promise<PipelineData> {
    try {
      const params = new URLSearchParams({
        workspaceId,
        ...(userId && { userId })
      });

      const response = await fetch(`/api/pipeline?${params}`);
      
      if (!response.ok) {
        throw new Error(`Pipeline API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      throw error;
    }
  }

  /**
   * Get leads for a workspace
   */
  static async getLeads(workspaceId: string, userId?: string): Promise<Lead[]> {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getLeads',
          workspaceId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Pipeline API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get opportunities for a workspace
   */
  static async getOpportunities(workspaceId: string, userId?: string): Promise<OpportunityWithDetails[]> {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getOpportunities',
          workspaceId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Pipeline API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  }

  /**
   * Get accounts for a workspace
   */
  static async getAccounts(workspaceId: string, userId?: string): Promise<AccountWithDetails[]> {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getAccounts',
          workspaceId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Pipeline API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  /**
   * Get contacts for a workspace
   */
  static async getContacts(workspaceId: string, userId?: string): Promise<ContactWithDetails[]> {
    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getContacts',
          workspaceId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Pipeline API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Get lead by ID
   */
  static async getLeadById(leadId: string): Promise<Lead | null> {
    try {
      const response = await fetch('/api/data/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'leads',
          action: 'get',
          id: leadId,
          workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace ID as fallback
          userId: '01K1VBYZG41K9QA0D9CF06KNRG' // Dan's user ID as fallback
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to fetch lead:', response.statusText);
        return null;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('API returned error:', result.error);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching lead by ID:', error);
      return null;
    }
  }

  /**
   * Get account by ID
   */
  static async getAccountById(accountId: string): Promise<AccountWithDetails | null> {
    try {
      const response = await fetch(`/api/data/accounts/${accountId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch account:', response.statusText);
        return null;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('API returned error:', result.error);
        return null;
      }

      return result.account;
    } catch (error) {
      console.error('Error fetching account by ID:', error);
      return null;
    }
  }

  /**
   * Get opportunity by ID
   */
  static async getOpportunityById(opportunityId: string): Promise<OpportunityWithDetails | null> {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch opportunity:', response.statusText);
        return null;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('API returned error:', result.error);
        return null;
      }

      return result.opportunity;
    } catch (error) {
      console.error('Error fetching opportunity by ID:', error);
      return null;
    }
  }

  /**
   * Update opportunity
   */
  static async updateOpportunity(opportunityId: string, updates: Partial<OpportunityWithDetails>): Promise<OpportunityWithDetails | null> {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        console.error('Failed to update opportunity:', response.statusText);
        return null;
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('API returned error:', result.error);
        return null;
      }

      return result.opportunity;
    } catch (error) {
      console.error('Error updating opportunity:', error);
      return null;
    }
  }
} 