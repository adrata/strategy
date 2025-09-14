// Lead Management - Extracted from 1,958-line monolithic SpeedrunRanking.ts

import type { CRMRecord } from "../types";
import type { LeadState } from "./types";
import {
  getDailySpeedrunState,
  saveDailySpeedrunState,
  getLeadStates,
  saveLeadStates,
} from "./state";
import { SOURCE_BONUS, URGENT_KEYWORDS } from "./constants";

/**
 * Calculate intelligent positioning score for adding to speedrun
 * Higher score = higher in queue
 */
function calculateAddToSpeedrunScore(contact: CRMRecord, source: string): number {
  let score = 50; // Base score (middle of queue)

  // Source-based bonuses
  score += SOURCE_BONUS[source as keyof typeof SOURCE_BONUS] || 0;

  // Urgency indicators
  const contactText = [
    contact.notes,
    contact.nextAction,
    contact.recentActivity,
  ]
    .join(" ")
    .toLowerCase();

  if (URGENT_KEYWORDS.some((keyword) => contactText.includes(keyword))) {
    score += 20;
  }

  // Relationship warmth
  if (contact['relationship'] === "Hot") score += 15;
  else if (contact['relationship'] === "Warm") score += 10;
  else if (contact['relationship'] === "Building") score += 5;

  // Deal stage
  if (contact['dealStage'] === "Negotiate") score += 15;
  else if (contact['dealStage'] === "Proposal") score += 12;
  else if (contact['dealStage'] === "Demo") score += 8;

  // Buyer group role
  if (contact['buyerGroupRole'] === "Decision Maker") score += 10;
  else if (contact['buyerGroupRole'] === "Champion") score += 8;

  // Recent activity bonus
  if (contact.lastActionDate) {
    const daysSince = Math.floor(
      (new Date().getTime() - new Date(contact.lastActionDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSince <= 1) score += 10;
    else if (daysSince <= 3) score += 5;
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Add a lead to speedrun with intelligent positioning
 */
export function addToSpeedrun(
  contact: CRMRecord,
  source: string = "manual",
): number {
  const leadStates = getLeadStates();

  // Calculate intelligent positioning score
  const positionScore = calculateAddToSpeedrunScore(contact, source);

  leadStates[contact.id] = {
    id: contact.id,
    status: "active",
    addedToSpeedrunAt: new Date(),
    lastActionDate: new Date().toISOString(),
  };

  saveLeadStates(leadStates);

  console.log(
    `➕ Added ${contact.name} to speedrun with position score: ${positionScore} (source: ${source})`,
  );

  return positionScore;
}

/**
 * Snooze a lead until specified time
 */
export function snoozeLead(
  leadId: string,
  snoozeUntil: Date,
  reason?: string,
): void {
  const leadStates = getLeadStates();
  const state = getDailySpeedrunState();

  leadStates[leadId] = {
    ...leadStates[leadId],
    id: leadId,
    status: "snoozed",
    snoozeUntil,
    lastActionDate: new Date().toISOString(),
    addedToSpeedrunAt: leadStates[leadId]?.addedToSpeedrunAt || new Date(),
  };

  // Add to today's snoozed list
  if (!state.snoozedLeads.includes(leadId)) {
    state.snoozedLeads.push(leadId);
  }

  saveLeadStates(leadStates);
  saveDailySpeedrunState(state);

  console.log(
    `⏰ Lead ${leadId} snoozed until ${snoozeUntil.toLocaleString()}`,
  );
}

/**
 * Remove a lead from speedrun (soft delete in database)
 */
export async function removeLead(
  leadId: string,
  reason?: string,
): Promise<void> {
  const leadStates = getLeadStates();
  const state = getDailySpeedrunState();

  try {
    // Import and use the delete service
    const { SpeedrunDeleteService } = await import('@/platform/services/speedrun-delete-service');
    
    // Perform soft delete in database
    const result = await SpeedrunDeleteService.deleteLead(leadId, {
      reason: reason || 'Removed from Speedrun'
    });
    
    if (result.success) {
      // Update local state after successful database deletion
      leadStates[leadId] = {
        ...leadStates[leadId],
        id: leadId,
        status: "removed-soft",
        removalReason: reason,
        lastActionDate: new Date().toISOString(),
        addedToSpeedrunAt: leadStates[leadId]?.addedToSpeedrunAt || new Date(),
      };

      // Add to today's removed list
      if (!state.removedLeads.includes(leadId)) {
        state.removedLeads.push(leadId);
      }

      saveLeadStates(leadStates);
      saveDailySpeedrunState(state);

      console.log(`✅ Lead ${leadId} soft deleted from database and removed from speedrun: ${reason || "No reason provided"}`);
      
      // Show success message
      SpeedrunDeleteService.showSuccessMessage(result.message);
    } else {
      console.error(`❌ Failed to delete lead ${leadId}:`, result.error);
      SpeedrunDeleteService.showErrorMessage(result.message);
    }
    
  } catch (error) {
    console.error(`❌ Error removing lead ${leadId}:`, error);
    
    // Fallback to local removal only
    leadStates[leadId] = {
      ...leadStates[leadId],
      id: leadId,
      status: "removed-local-only",
      removalReason: reason,
      lastActionDate: new Date().toISOString(),
      addedToSpeedrunAt: leadStates[leadId]?.addedToSpeedrunAt || new Date(),
    };

    if (!state.removedLeads.includes(leadId)) {
      state.removedLeads.push(leadId);
    }

    saveLeadStates(leadStates);
    saveDailySpeedrunState(state);

    console.log(`⚠️ Lead ${leadId} removed locally only (database delete failed): ${reason || "No reason provided"}`);
  }
}

/**
 * Check if a lead is currently snoozed
 */
export function isLeadSnoozed(leadId: string): boolean {
  const leadStates = getLeadStates();
  const leadState = leadStates[leadId];

  if (!leadState || leadState.status !== "snoozed" || !leadState.snoozeUntil) {
    return false;
  }

  // Check if snooze period has ended
  const now = new Date();
  const snoozeUntil = new Date(leadState.snoozeUntil);

  if (now >= snoozeUntil) {
    // Snooze period ended, reactivate lead
    leadState['status'] = "active";
    leadState['snoozeUntil'] = undefined;

    const allStates = getLeadStates();
    allStates[leadId] = leadState;
    saveLeadStates(allStates);

    return false;
  }

  return true;
}

/**
 * Check if a lead is removed
 */
export function isLeadRemoved(leadId: string): boolean {
  const leadStates = getLeadStates();
  const leadState = leadStates[leadId];

  return (
    leadState?.status === "removed-temp" ||
    leadState?.status === "removed-permanent"
  );
}

/**
 * Reactivate a temporarily removed lead
 */
export function reactivateLead(leadId: string): boolean {
  const leadStates = getLeadStates();
  const leadState = leadStates[leadId];

  if (!leadState || leadState.status !== "removed-temp") {
    return false;
  }

  leadState['status'] = "active";
  leadState['removalReason'] = undefined;
  leadState['lastActionDate'] = new Date().toISOString();

  saveLeadStates(leadStates);

  console.log(`🔄 Lead ${leadId} reactivated`);
  return true;
}

/**
 * Get all leads with a specific status
 */
export function getLeadsByStatus(status: LeadState["status"]): string[] {
  const leadStates = getLeadStates();

  return Object.keys(leadStates).filter((leadId) => {
    const leadState = leadStates[leadId];

    // For snoozed leads, check if snooze period is still active
    if (status === "snoozed") {
      return isLeadSnoozed(leadId);
    }

    return leadState?.status === status;
  });
}

/**
 * Get lead state for a specific lead
 */
export function getLeadState(leadId: string): LeadState | null {
  const leadStates = getLeadStates();
  return leadStates[leadId] || null;
}

/**
 * Bulk update lead statuses
 */
export function bulkUpdateLeadStatus(
  leadIds: string[],
  status: LeadState["status"],
  reason?: string,
): void {
  const leadStates = getLeadStates();
  const state = getDailySpeedrunState();

  leadIds.forEach((leadId) => {
    const leadState = leadStates[leadId];
    if (leadState) {
      leadState['status'] = status;
      leadState['lastActionDate'] = new Date().toISOString();

      if (reason) {
        leadState['removalReason'] = reason;
      }

      // Update daily state lists
      if (status === "removed-temp" || status === "removed-permanent") {
        if (!state.removedLeads.includes(leadId)) {
          state.removedLeads.push(leadId);
        }
      } else if (status === "snoozed") {
        if (!state.snoozedLeads.includes(leadId)) {
          state.snoozedLeads.push(leadId);
        }
      }
    }
  });

  saveLeadStates(leadStates);
  saveDailySpeedrunState(state);

  console.log(`📦 Bulk updated ${leadIds.length} leads to status: ${status}`);
}

/**
 * Clean up expired snoozes and temporary removals
 */
export function cleanupExpiredStates(): void {
  const leadStates = getLeadStates();
  let cleanupCount = 0;

  Object.keys(leadStates).forEach((leadId) => {
    const leadState = leadStates[leadId];

    if (!leadState) return;

    // Check expired snoozes
    if (leadState['status'] === "snoozed" && leadState.snoozeUntil) {
      const now = new Date();
      const snoozeUntil = new Date(leadState.snoozeUntil);

      if (now >= snoozeUntil) {
        leadState['status'] = "active";
        leadState['snoozeUntil'] = undefined;
        cleanupCount++;
      }
    }

    // Clean up very old temporary removals (older than 30 days)
    if (leadState['status'] === "removed-temp" && leadState.lastActionDate) {
      const lastAction = new Date(leadState.lastActionDate);
      const daysSinceRemoval = Math.floor(
        (Date.now() - lastAction.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceRemoval > 30) {
        leadState['status'] = "active";
        leadState['removalReason'] = undefined;
        cleanupCount++;
      }
    }
  });

  if (cleanupCount > 0) {
    saveLeadStates(leadStates);
    console.log(`🧹 Cleaned up ${cleanupCount} expired lead states`);
  }
}
