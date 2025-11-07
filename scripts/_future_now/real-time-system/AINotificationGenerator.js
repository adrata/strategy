/**
 * AI Notification Generator
 * 
 * Generates proactive notifications for the AI panel when:
 * - People change jobs
 * - People change titles
 * - People are predicted to leave soon
 * - Buyer groups need updates
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AINotificationGenerator {
  /**
   * Generate AI notifications for unnotified changes
   * @param {string} workspaceId - Workspace ID
   * @returns {Array} Array of notification messages for AI
   */
  async generateNotifications(workspaceId) {
    const notifications = [];
    
    // 1. Critical changes (people left companies)
    const criticalChanges = await this.getCriticalChanges(workspaceId);
    for (const change of criticalChanges) {
      notifications.push(this.formatCriticalChangeNotification(change));
    }
    
    // 2. High churn risk (people likely to leave this month)
    const highRiskPeople = await this.getHighChurnRiskPeople(workspaceId);
    for (const person of highRiskPeople) {
      notifications.push(this.formatChurnRiskNotification(person));
    }
    
    // 3. Buyer groups needing re-run
    const buyerGroupUpdates = await this.getBuyerGroupsNeedingUpdate(workspaceId);
    for (const update of buyerGroupUpdates) {
      notifications.push(this.formatBuyerGroupUpdateNotification(update));
    }
    
    // 4. Stale data warnings
    const staleContacts = await this.getStaleContacts(workspaceId);
    if (staleContacts.length > 5) {
      notifications.push(this.formatStaleDataNotification(staleContacts));
    }
    
    return notifications;
  }

  async getCriticalChanges(workspaceId) {
    const people = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        customFields: {
          path: ['hasUnnotifiedChanges'],
          equals: true
        }
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    });
    
    const criticalChanges = [];
    
    for (const person of people) {
      const changeHistory = person.customFields?.changeHistory || [];
      const unnotified = changeHistory.filter(c => 
        c.critical && !c.notifiedToAI && !c.userNotified
      );
      
      if (unnotified.length > 0) {
        criticalChanges.push({
          personId: person.id,
          personName: person.fullName,
          companyName: person.company?.name,
          wasBuyerGroupMember: person.isBuyerGroupMember,
          changes: unnotified
        });
      }
    }
    
    return criticalChanges;
  }

  async getHighChurnRiskPeople(workspaceId) {
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        isBuyerGroupMember: true
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    });
    
    // Filter for high churn risk (red zone)
    return allPeople.filter(person => {
      const churnPrediction = person.customFields?.churnPrediction;
      if (!churnPrediction) return false;
      
      const refreshColor = churnPrediction.refreshColor;
      const churnRiskScore = churnPrediction.churnRiskScore;
      const predictedDepartureMonths = churnPrediction.predictedDepartureMonths;
      
      // Red zone: leaving this month or risk score >= 60
      return refreshColor === 'red' || 
             churnRiskScore >= 60 || 
             (predictedDepartureMonths !== null && predictedDepartureMonths <= 1);
    });
  }

  async getBuyerGroupsNeedingUpdate(workspaceId) {
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        customFields: {
          path: ['buyerGroupReRunNeeded'],
          equals: true
        }
      }
    });
    
    return companies.map(company => ({
      companyId: company.id,
      companyName: company.name,
      reason: company.customFields?.buyerGroupReRunReason || 'Update needed',
      context: company.customFields?.buyerGroupReRunContext || {},
      requestedAt: company.customFields?.buyerGroupReRunRequestedAt
    }));
  }

  async getStaleContacts(workspaceId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        isBuyerGroupMember: true,
        OR: [
          { dataLastVerified: { lt: thirtyDaysAgo } },
          { dataLastVerified: null }
        ]
      },
      take: 20
    });
  }

  /**
   * Format notifications for AI panel
   */
  formatCriticalChangeNotification(change) {
    const companyChange = change.changes.find(c => c.field === 'company');
    
    if (companyChange) {
      return {
        type: 'critical',
        priority: 'high',
        title: `🚨 ${change.personName} Left ${companyChange.oldValue}`,
        message: `${change.personName} has moved from ${companyChange.oldValue} to ${companyChange.newValue}.${
          change.wasBuyerGroupMember 
            ? ` They were in the buyer group - consider re-running buyer group discovery.`
            : ''
        }`,
        actionable: true,
        actions: change.wasBuyerGroupMember ? [
          {
            label: 'Re-run Buyer Group',
            action: 'trigger_buyer_group',
            companyName: companyChange.oldValue
          },
          {
            label: 'Find Replacement',
            action: 'find_role',
            role: 'similar to departed person'
          }
        ] : [
          {
            label: 'Update Record',
            action: 'update_person',
            personId: change.personId
          }
        ],
        timestamp: change.changes[0].timestamp,
        personId: change.personId
      };
    }
    
    return null;
  }

  formatChurnRiskNotification(person) {
    const churnPrediction = person.customFields?.churnPrediction || {};
    
    return {
      type: 'warning',
      priority: 'medium',
      title: `⚠️ ${person.fullName} May Leave Soon`,
      message: `${person.fullName} at ${person.company?.name} has a ${churnPrediction.churnRiskLevel} churn risk (${churnPrediction.churnRiskScore}/100). ${
        churnPrediction.predictedDepartureMonths !== null 
          ? `Predicted to leave in ${churnPrediction.predictedDepartureMonths} month(s).`
          : 'May leave soon based on tenure patterns.'
      } Consider prioritizing outreach.`,
      actionable: true,
      actions: [
        {
          label: 'Prioritize Outreach',
          action: 'create_task',
          personId: person.id
        },
        {
          label: 'Find Backup Contact',
          action: 'find_similar_role',
          companyId: person.companyId
        }
      ],
      timestamp: new Date().toISOString(),
      personId: person.id
    };
  }

  formatBuyerGroupUpdateNotification(update) {
    return {
      type: 'action_required',
      priority: 'high',
      title: `🔄 Buyer Group Update Needed: ${update.companyName}`,
      message: `The buyer group at ${update.companyName} needs to be updated. ${update.reason}. Last buyer group was created on ${new Date(update.requestedAt).toLocaleDateString()}.`,
      actionable: true,
      actions: [
        {
          label: 'Re-run Buyer Group',
          action: 'trigger_buyer_group',
          companyId: update.companyId
        },
        {
          label: 'View Company',
          action: 'navigate_to_company',
          companyId: update.companyId
        }
      ],
      timestamp: update.requestedAt,
      companyId: update.companyId
    };
  }

  formatStaleDataNotification(staleContacts) {
    return {
      type: 'info',
      priority: 'low',
      title: `📊 ${staleContacts.length} Contacts Have Stale Data`,
      message: `${staleContacts.length} buyer group members haven't been verified in 30+ days. Consider refreshing their data to ensure accuracy.`,
      actionable: true,
      actions: [
        {
          label: 'Refresh All',
          action: 'batch_refresh',
          peopleIds: staleContacts.map(p => p.id).slice(0, 20)
        },
        {
          label: 'View List',
          action: 'show_stale_contacts'
        }
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get formatted notifications for AI panel display
   */
  async getNotificationsForDisplay(workspaceId) {
    const notifications = await this.generateNotifications(workspaceId);
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 3;
      const bPriority = priorityOrder[b.priority] || 3;
      return aPriority - bPriority;
    });
    
    return notifications;
  }

  /**
   * Mark notification as shown to user
   */
  async markNotificationShown(personId, changeIndex) {
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: { customFields: true }
    });
    
    const customFields = person?.customFields as any || {};
    const changeHistory = customFields.changeHistory || [];
    
    if (changeHistory[changeIndex]) {
      changeHistory[changeIndex].userNotified = true;
      changeHistory[changeIndex].notifiedToAI = true;
      changeHistory[changeIndex].notifiedAt = new Date().toISOString();
    }
    
    // Check if all changes are now notified
    const hasUnnotified = changeHistory.some(c => !c.userNotified);
    
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          ...customFields,
          changeHistory,
          hasUnnotifiedChanges: hasUnnotified
        }
      }
    });
  }
}

module.exports = { AINotificationGenerator };

