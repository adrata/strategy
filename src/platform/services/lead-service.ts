/**
 * Lead Service for Real-Time Lead Management
 *
 * Provides methods for updating leads with automatic real-time synchronization
 * across all platforms (desktop, web, mobile).
 */

import { authFetch } from "@/platform/auth-fetch";

export interface LeadUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: string;
  source?: string;
  notes?: string;
  buyerGroupRole?: string;
  relationship?: string;
  nextAction?: string;
  nextActionDate?: string;
  lastActionDate?: string;
  value?: string;
  probability?: number;
}

export interface LeadUpdateResponse {
  success: boolean;
  lead: any;
  changes: string[];
  message: string;
}

export class LeadService {
  /**
   * Update a lead with real-time sync across all platforms
   */
  static async updateLead(
    leadId: string,
    updates: LeadUpdateData,
    updatedBy?: string,
  ): Promise<LeadUpdateResponse> {
    try {
      if (process['env']['NODE_ENV'] === "development") {
        console.log("🔄 [LEAD_SERVICE] Updating lead:", { leadId, updates });
      }

      // Use the unified API endpoint for comprehensive updates
      const response = await fetch("/api/data/unified", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "leads",
          action: "update",
          id: leadId,
          data: {
            ...updates,
            updatedBy,
          },
          workspaceId: "01K1VBYXHD0J895XAN0HGFBKJP", // Dan's workspace ID as fallback
          userId: "01K1VBYZG41K9QA0D9CF06KNRG" // Dan's user ID as fallback
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (process['env']['NODE_ENV'] === "development") {
          console.log(
            "✅ [LEAD_SERVICE] Lead updated successfully with stage persistence",
          );
        }
        return {
          success: true,
          lead: data.lead,
          message: data.message || "Lead updated successfully",
          changes: Object.keys(updates).filter(
            (key) => updates[key as keyof LeadUpdateData] !== undefined,
          ),
        };
      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (error) {
      console.error("❌ [LEAD_SERVICE] Update failed:", error);
      // Return error by throwing it to match expected interface
      throw error;
    }
  }

  /**
   * Update lead status with contextual next actions
   */
  static async updateLeadStatus(
    leadId: string,
    newStatus:
      | "New"
      | "Contacted"
      | "Qualified"
      | "Opportunity"
      | "Customer"
      | "Lost",
    updatedBy?: string,
  ): Promise<LeadUpdateResponse> {
    // Generate contextual next action based on new status
    const getNextActionForStatus = (status: string): string => {
      const actionMap: Record<string, string> = {
        New: "Initial outreach and qualification call",
        Contacted: "Follow up and assess interest level",
        Qualified: "Present solution and gather requirements",
        Opportunity: "Prepare proposal and timeline",
        Customer: "Onboarding and success planning",
        Lost: "Follow up in 6 months",
      };
      return actionMap[status] || "Follow up";
    };

    const updates: LeadUpdateData = {
      status: newStatus,
      nextAction: getNextActionForStatus(newStatus),
      lastActionDate: new Date().toISOString().split("T")[0] || "",
    };

    // Set next action date based on status
    const getDaysToNextAction = (status: string): number => {
      const daysMap: Record<string, number> = {
        New: 1, // Follow up next day
        Contacted: 3, // Follow up in 3 days
        Qualified: 7, // Follow up in a week
        Opportunity: 14, // Follow up in 2 weeks
        Customer: 30, // Check in after 30 days
        Lost: 180, // Follow up in 6 months
      };
      return daysMap[status] || 7;
    };

    const daysToNext = getDaysToNextAction(newStatus);
    updates['nextActionDate'] =
      new Date(Date.now() + daysToNext * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0] || "";

    return this.updateLead(leadId, updates, updatedBy);
  }

  /**
   * Get a specific lead
   */
  static async getLead(leadId: string): Promise<any> {
    try {
      const response = await authFetch(`/api/leads/${leadId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch lead: ${response.statusText}`);
      }

      const data = await response.json();
      return data.lead;
    } catch (error) {
      console.error("❌ LeadService: Error fetching lead:", error);
      throw error;
    }
  }

  /**
   * Delete a lead with real-time sync
   */
  static async deleteLead(
    leadId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (process['env']['NODE_ENV'] === "development") {
        console.log(`🗑️ LeadService: Deleting lead ${leadId}`);
      }

      const response = await authFetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      if (process['env']['NODE_ENV'] === "development") {
        console.log(`✅ LeadService: Lead ${leadId} deleted successfully`);
      }

      return data;
    } catch (error) {
      console.error("❌ LeadService: Error deleting lead:", error);
      throw error;
    }
  }

  /**
   * Bulk update multiple leads (useful for status changes)
   */
  static async bulkUpdateLeads(
    leadIds: string[],
    updates: LeadUpdateData,
    updatedBy?: string,
  ): Promise<LeadUpdateResponse[]> {
    try {
      if (process['env']['NODE_ENV'] === "development") {
        console.log(
          `🔄 LeadService: Bulk updating ${leadIds.length} leads:`,
          updates,
        );
      }

      const promises = leadIds.map((leadId) =>
        this.updateLead(leadId, updates, updatedBy),
      );

      const results = await Promise.allSettled(promises);

      const successful = results
        .filter((result) => result['status'] === "fulfilled")
        .map(
          (result) =>
            (result as PromiseFulfilledResult<LeadUpdateResponse>).value,
        );

      const failed = results
        .filter((result) => result['status'] === "rejected")
        .map((result) => (result as PromiseRejectedResult).reason);

      console.log(
        `✅ LeadService: Bulk update completed. ${successful.length} successful, ${failed.length} failed`,
      );

      if (failed.length > 0) {
        console.error("❌ LeadService: Some bulk updates failed:", failed);
      }

      return successful;
    } catch (error) {
      console.error("❌ LeadService: Error in bulk update:", error);
      throw error;
    }
  }

  /**
   * Quick status change helper methods
   */
  static async markAsContacted(leadId: string, updatedBy?: string) {
    return this.updateLeadStatus(leadId, "Contacted", updatedBy);
  }

  static async markAsQualified(leadId: string, updatedBy?: string) {
    return this.updateLeadStatus(leadId, "Qualified", updatedBy);
  }

  static async convertToOpportunity(leadId: string, updatedBy?: string) {
    return this.updateLeadStatus(leadId, "Opportunity", updatedBy);
  }

  static async markAsCustomer(leadId: string, updatedBy?: string) {
    return this.updateLeadStatus(leadId, "Customer", updatedBy);
  }

  static async markAsLost(leadId: string, reason?: string, updatedBy?: string) {
    const updates: LeadUpdateData = {
      status: "Lost",
      notes: reason ? `Marked as lost: ${reason}` : "Marked as lost",
      nextAction: "Follow up in 6 months",
      nextActionDate:
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] || "",
    };

    return this.updateLead(leadId, updates, updatedBy);
  }
}
