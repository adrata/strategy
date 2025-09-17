/**
 * 🚀 AI ACTIONS SERVICE EXTENDED
 * 
 * Extended CRUD operations for all object types
 * Provides complete Create, Read, Update, Delete functionality for:
 * - Contacts, Accounts, Prospects, Opportunities, Customers, Partners
 */

import type { ActionRequest, ActionResult } from './types';

export class AIActionsServiceExtended {
  
  /**
   * Create contact
   */
  static async createContact(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch('/api/data/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          contactData: {
            firstName: parameters.firstName,
            lastName: parameters.lastName,
            fullName: parameters.fullName || `${parameters.firstName} ${parameters.lastName}`,
            email: parameters.email,
            phone: parameters.phone,
            jobTitle: parameters.jobTitle,
            company: parameters.company,
            status: parameters.status || 'active',
            source: parameters.source || 'ai_created',
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully created contact: ${parameters.fullName || parameters.firstName + ' ' + parameters.lastName}`,
          nextSteps: ['Add to relevant opportunities', 'Plan engagement strategy']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to create contact: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  }

  /**
   * Update contact
   */
  static async updateContact(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch(`/api/data/contacts/${parameters.contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          updateData: {
            firstName: parameters.firstName,
            lastName: parameters.lastName,
            fullName: parameters.fullName,
            email: parameters.email,
            phone: parameters.phone,
            jobTitle: parameters.jobTitle,
            status: parameters.status,
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully updated contact: ${parameters.fullName || 'Contact'}`,
          nextSteps: ['Review updated information', 'Continue relationship building']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to update contact: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Delete contact
   */
  static async deleteContact(request: ActionRequest): Promise<ActionResult> {
    const { parameters } = request;
    
    try {
      const response = await fetch(`/api/data/contacts/${parameters.contactId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully deleted contact',
          nextSteps: ['Review affected opportunities and accounts']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to delete contact: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  /**
   * Create account
   */
  static async createAccount(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch('/api/data/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          accountData: {
            name: parameters.name,
            industry: parameters.industry,
            size: parameters.size,
            website: parameters.website,
            email: parameters.email,
            phone: parameters.phone,
            city: parameters.city,
            state: parameters.state,
            country: parameters.country,
            status: parameters.status || 'active',
            tier: parameters.tier || 'standard',
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully created account: ${parameters.name}`,
          nextSteps: ['Add key contacts', 'Identify opportunities', 'Plan account strategy']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to create account: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  }

  /**
   * Update account
   */
  static async updateAccount(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch(`/api/data/accounts/${parameters.accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          updateData: {
            name: parameters.name,
            industry: parameters.industry,
            size: parameters.size,
            website: parameters.website,
            email: parameters.email,
            phone: parameters.phone,
            status: parameters.status,
            tier: parameters.tier,
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully updated account: ${parameters.name || 'Account'}`,
          nextSteps: ['Review account changes', 'Update related contacts and opportunities']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to update account: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Delete account
   */
  static async deleteAccount(request: ActionRequest): Promise<ActionResult> {
    const { parameters } = request;
    
    try {
      const response = await fetch(`/api/data/accounts/${parameters.accountId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully deleted account',
          nextSteps: ['Review affected contacts and opportunities', 'Update pipeline metrics']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to delete account: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  /**
   * Create prospect
   */
  static async createProspect(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch('/api/data/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          prospectData: {
            firstName: parameters.firstName,
            lastName: parameters.lastName,
            fullName: parameters.fullName || `${parameters.firstName} ${parameters.lastName}`,
            email: parameters.email,
            phone: parameters.phone,
            company: parameters.company,
            jobTitle: parameters.jobTitle,
            status: parameters.status || 'new',
            priority: parameters.priority || 'medium',
            source: parameters.source || 'ai_created',
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully created prospect: ${parameters.fullName || parameters.firstName + ' ' + parameters.lastName}`,
          nextSteps: ['Research prospect background', 'Plan initial outreach', 'Set follow-up schedule']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to create prospect: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  }

  /**
   * Update prospect
   */
  static async updateProspect(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch(`/api/data/prospects/${parameters.prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          updateData: {
            firstName: parameters.firstName,
            lastName: parameters.lastName,
            fullName: parameters.fullName,
            email: parameters.email,
            phone: parameters.phone,
            company: parameters.company,
            jobTitle: parameters.jobTitle,
            status: parameters.status,
            priority: parameters.priority,
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully updated prospect: ${parameters.fullName || 'Prospect'}`,
          nextSteps: ['Review updated information', 'Adjust engagement strategy']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to update prospect: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Delete prospect
   */
  static async deleteProspect(request: ActionRequest): Promise<ActionResult> {
    const { parameters } = request;
    
    try {
      const response = await fetch(`/api/data/prospects/${parameters.prospectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully deleted prospect',
          nextSteps: ['Review pipeline for any affected opportunities']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to delete prospect: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  /**
   * Update opportunity (full record update)
   */
  static async updateOpportunity(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch(`/api/data/opportunities/${parameters.opportunityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          updateData: {
            name: parameters.name,
            description: parameters.description,
            stage: parameters.stage,
            amount: parameters.amount,
            expectedCloseDate: parameters.expectedCloseDate,
            probability: parameters.probability,
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully updated opportunity: ${parameters.name || 'Opportunity'}`,
          nextSteps: ['Review opportunity progress', 'Update stakeholders', 'Plan next actions']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to update opportunity: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Delete opportunity
   */
  static async deleteOpportunity(request: ActionRequest): Promise<ActionResult> {
    const { parameters } = request;
    
    try {
      const response = await fetch(`/api/data/opportunities/${parameters.opportunityId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully deleted opportunity',
          nextSteps: ['Update pipeline metrics', 'Review related accounts and contacts']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to delete opportunity: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  /**
   * Create customer
   */
  static async createCustomer(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch('/api/data/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          customerData: {
            accountId: parameters.accountId,
            status: parameters.status || 'active',
            tier: parameters.tier || 'standard',
            healthScore: parameters.healthScore || 75,
            contractValue: parameters.contractValue,
            contractStartDate: parameters.contractStartDate,
            contractEndDate: parameters.contractEndDate,
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully created customer record',
          nextSteps: ['Set up success metrics', 'Plan onboarding', 'Schedule check-ins']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to create customer: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch(`/api/data/clients/${parameters.customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          updateData: {
            status: parameters.status,
            tier: parameters.tier,
            healthScore: parameters.healthScore,
            contractValue: parameters.contractValue,
            contractEndDate: parameters.contractEndDate,
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully updated customer record',
          nextSteps: ['Monitor customer health', 'Update success metrics']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to update customer: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(request: ActionRequest): Promise<ActionResult> {
    const { parameters } = request;
    
    try {
      const response = await fetch(`/api/data/clients/${parameters.customerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully deleted customer record',
          nextSteps: ['Update account status', 'Review revenue impact']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to delete customer: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  /**
   * Create partner
   */
  static async createPartner(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch('/api/data/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          partnerData: {
            name: parameters.name,
            type: parameters.type || 'strategic',
            industry: parameters.industry,
            website: parameters.website,
            contactName: parameters.contactName,
            contactEmail: parameters.contactEmail,
            contactPhone: parameters.contactPhone,
            status: parameters.status || 'active',
            partnershipLevel: parameters.partnershipLevel || 'standard',
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully created partner: ${parameters.name}`,
          nextSteps: ['Define partnership terms', 'Set up collaboration channels', 'Plan joint initiatives']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to create partner: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  }

  /**
   * Update partner
   */
  static async updatePartner(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch(`/api/data/partners/${parameters.partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          updateData: {
            name: parameters.name,
            type: parameters.type,
            status: parameters.status,
            partnershipLevel: parameters.partnershipLevel,
            contactName: parameters.contactName,
            contactEmail: parameters.contactEmail,
            contactPhone: parameters.contactPhone,
            notes: parameters.notes
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully updated partner: ${parameters.name || 'Partner'}`,
          nextSteps: ['Review partnership status', 'Update collaboration plans']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to update partner: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Delete partner
   */
  static async deletePartner(request: ActionRequest): Promise<ActionResult> {
    const { parameters } = request;
    
    try {
      const response = await fetch(`/api/data/partners/${parameters.partnerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully deleted partner',
          nextSteps: ['Update partnership metrics', 'Review affected opportunities']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to delete partner: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }
}
