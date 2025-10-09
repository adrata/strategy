/**
 * SpeedrunDeleteService - Handles soft deletion for Speedrun records
 * 
 * This service provides:
 * - Soft Delete: Sets deletedAt timestamp (recoverable, audit trail)
 * - Success messages and feedback
 * - Integration with existing API endpoints
 * 
 * 2025 Best Practice: Soft delete with clear user feedback
 */

import { safeApiFetch } from '@/platform/api-fetch';

export interface DeleteOptions {
  /** Reason for deletion (for audit trail) */
  reason?: string;
  /** User ID performing the deletion */
  userId?: string;
  /** Workspace ID for the deletion */
  workspaceId?: string;
}

export interface DeleteResult {
  success: boolean;
  message: string;
  recordId: string;
  deletedAt?: string;
  recoverable: boolean;
  error?: string;
}

export class SpeedrunDeleteService {
  
  /**
   * Delete a lead from Speedrun (soft delete)
   */
  static async deleteLead(leadId: string, options: DeleteOptions = {}): Promise<DeleteResult> {
    const { reason, userId, workspaceId } = options;
    
    console.log(`🗑️ [Speedrun Delete] Soft deleting lead: ${leadId}`);
    
    try {
      const response = await safeApiFetch(`/api/data/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.success) {
        console.log(`✅ [Speedrun Delete] Lead soft deleted: ${leadId}`);
        return {
          success: true,
          message: 'Lead deleted successfully (can be recovered from trash)',
          recordId: leadId,
          deletedAt: response.deletedAt,
          recoverable: true
        };
      } else {
        throw new Error(response.error || 'Delete failed');
      }
      
    } catch (error) {
      console.error(`❌ [Speedrun Delete] Error deleting lead:`, error);
      return {
        success: false,
        message: `Failed to delete lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recordId: leadId,
        recoverable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Delete a prospect from Speedrun (soft delete)
   */
  static async deleteProspect(prospectId: string, options: DeleteOptions = {}): Promise<DeleteResult> {
    const { reason, userId, workspaceId } = options;
    
    console.log(`🗑️ [Speedrun Delete] Soft deleting prospect: ${prospectId}`);
    
    try {
      const response = await safeApiFetch(`/api/data/prospects/${prospectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.success) {
        console.log(`✅ [Speedrun Delete] Prospect soft deleted: ${prospectId}`);
        return {
          success: true,
          message: 'Prospect deleted successfully (can be recovered from trash)',
          recordId: prospectId,
          deletedAt: response.deletedAt,
          recoverable: true
        };
      } else {
        throw new Error(response.error || 'Delete failed');
      }
      
    } catch (error) {
      console.error(`❌ [Speedrun Delete] Error deleting prospect:`, error);
      return {
        success: false,
        message: `Failed to delete prospect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recordId: prospectId,
        recoverable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Delete a contact from Speedrun (soft delete)
   */
  static async deleteContact(contactId: string, options: DeleteOptions = {}): Promise<DeleteResult> {
    const { reason, userId, workspaceId } = options;
    
    console.log(`🗑️ [Speedrun Delete] Soft deleting contact: ${contactId}`);
    
    try {
      const response = await safeApiFetch(`/api/data/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.success) {
        console.log(`✅ [Speedrun Delete] Contact soft deleted: ${contactId}`);
        return {
          success: true,
          message: 'Contact deleted successfully (can be recovered from trash)',
          recordId: contactId,
          deletedAt: response.deletedAt,
          recoverable: true
        };
      } else {
        throw new Error(response.error || 'Delete failed');
      }
      
    } catch (error) {
      console.error(`❌ [Speedrun Delete] Error deleting contact:`, error);
      return {
        success: false,
        message: `Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recordId: contactId,
        recoverable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Delete any record type from Speedrun with unified interface
   */
  static async deleteRecord(
    recordType: 'lead' | 'prospect' | 'contact',
    recordId: string,
    options: DeleteOptions = {}
  ): Promise<DeleteResult> {
    switch (recordType) {
      case 'lead':
        return this.deleteLead(recordId, options);
      case 'prospect':
        return this.deleteProspect(recordId, options);
      case 'contact':
        return this.deleteContact(recordId, options);
      default:
        throw new Error(`Unsupported record type: ${recordType}`);
    }
  }
  
  /**
   * Show success message to user
   */
  static showSuccessMessage(message: string): void {
    // You can customize this to use your preferred notification system
    if (typeof window !== 'undefined') {
      // For now, use a simple alert - you can replace with toast notifications
      console.log(`✅ ${message}`);
      
      // If you have a toast notification system, use it here instead
      // Example: toast.success(message);
      
      // Temporary alert for immediate feedback
      alert(`✅ ${message}`);
    }
  }
  
  /**
   * Show error message to user
   */
  static showErrorMessage(message: string): void {
    // You can customize this to use your preferred notification system
    if (typeof window !== 'undefined') {
      console.error(`❌ ${message}`);
      
      // If you have a toast notification system, use it here instead
      // Example: toast.error(message);
      
      // Temporary alert for immediate feedback
      alert(`❌ ${message}`);
    }
  }
}
