/**
 * Real-Time Data Manager
 * 
 * Comprehensive system for maintaining accurate, real-time data:
 * 1. Churn prediction-based refresh scheduling (Red/Orange/Green)
 * 2. Coresignal webhook integration for job changes
 * 3. Change tracking for AI notifications
 * 4. Automatic buyer group re-runs when people leave
 * 5. Data staleness detection and refresh
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

class RealTimeDataManager {
  constructor(options = {}) {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = options.workspaceId;
    
    // Refresh frequency by risk level
    this.refreshSchedule = {
      red: {
        frequency: 'daily',
        days: 1,
        description: 'High churn risk - leaving this month (predicted)'
      },
      orange: {
        frequency: 'weekly',
        days: 7,
        description: 'Medium churn risk - leaving this quarter (predicted)'
      },
      green: {
        frequency: 'monthly',
        days: 30,
        description: 'Low churn risk - stable role'
      }
    };
  }

  /**
   * Main refresh orchestrator
   * Runs on schedule (cron job) to refresh people based on churn risk
   */
  async runScheduledRefresh() {
    console.log('\n🔄 REAL-TIME DATA REFRESH');
    console.log('='.repeat(80));
    
    const stats = {
      red: { checked: 0, refreshed: 0, changes: 0 },
      orange: { checked: 0, refreshed: 0, changes: 0 },
      green: { checked: 0, refreshed: 0, changes: 0 }
    };
    
    // 1. Refresh RED priority (daily check)
    console.log('\n🔴 RED PRIORITY - Daily refresh (high churn risk)');
    const redPeople = await this.getPeopleByRefreshColor('red');
    console.log(`   Found ${redPeople.length} people needing daily refresh`);
    for (const person of redPeople) {
      const result = await this.refreshPersonData(person, 'red');
      stats.red.checked++;
      if (result.refreshed) stats.red.refreshed++;
      if (result.changes.length > 0) stats.red.changes++;
    }
    
    // 2. Refresh ORANGE priority (weekly check)
    console.log('\n🟠 ORANGE PRIORITY - Weekly refresh (medium churn risk)');
    const orangePeople = await this.getPeopleByRefreshColor('orange');
    console.log(`   Found ${orangePeople.length} people needing weekly refresh`);
    for (const person of orangePeople) {
      const result = await this.refreshPersonData(person, 'orange');
      stats.orange.checked++;
      if (result.refreshed) stats.orange.refreshed++;
      if (result.changes.length > 0) stats.orange.changes++;
    }
    
    // 3. Refresh GREEN priority (monthly check)
    console.log('\n🟢 GREEN PRIORITY - Monthly refresh (low churn risk)');
    const greenPeople = await this.getPeopleByRefreshColor('green');
    console.log(`   Found ${greenPeople.length} people needing monthly refresh`);
    for (const person of greenPeople) {
      const result = await this.refreshPersonData(person, 'green');
      stats.green.checked++;
      if (result.refreshed) stats.green.refreshed++;
      if (result.changes.length > 0) stats.green.changes++;
    }
    
    // Print summary
    console.log('\n📊 REFRESH SUMMARY');
    console.log('='.repeat(80));
    console.log(`🔴 Red: ${stats.red.checked} checked, ${stats.red.refreshed} refreshed, ${stats.red.changes} changes`);
    console.log(`🟠 Orange: ${stats.orange.checked} checked, ${stats.orange.refreshed} refreshed, ${stats.orange.changes} changes`);
    console.log(`🟢 Green: ${stats.green.checked} checked, ${stats.green.refreshed} refreshed, ${stats.green.changes} changes`);
    console.log('='.repeat(80) + '\n');
    
    return stats;
  }

  /**
   * Get people by refresh color who are past their refresh date
   */
  async getPeopleByRefreshColor(color) {
    const now = new Date();
    
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        isBuyerGroupMember: true, // Focus on buyer group members
        customFields: {
          not: null
        }
      },
      include: {
        company: {
          select: { id: true, name: true, linkedinUrl: true }
        }
      }
    });
    
    // Filter by color and check if refresh is due
    return allPeople.filter(person => {
      const churnPrediction = person.customFields?.churnPrediction;
      if (!churnPrediction) return false;
      
      const refreshColor = churnPrediction.refreshColor;
      if (refreshColor !== color) return false;
      
      const nextRefreshDate = churnPrediction.nextRefreshDate;
      if (!nextRefreshDate) return false;
      
      return new Date(nextRefreshDate) <= now;
    });
  }

  /**
   * Refresh a person's data from Coresignal
   */
  async refreshPersonData(person, priority) {
    const startTime = Date.now();
    
    try {
      console.log(`   🔄 ${person.fullName} (${priority})`);
      
      // Get fresh data from Coresignal
      const freshData = await this.getCoresignalPersonData(person);
      
      if (!freshData) {
        console.log(`      ⚠️ No fresh data available`);
        return { refreshed: false, changes: [] };
      }
      
      // Compare with existing data and detect changes
      const changes = this.detectChanges(person, freshData);
      
      if (changes.length > 0) {
        console.log(`      🔔 ${changes.length} changes detected!`);
        changes.forEach(change => {
          console.log(`         - ${change.field}: ${change.oldValue} → ${change.newValue}`);
        });
        
        // Store changes for AI notification
        await this.storeChanges(person.id, changes);
        
        // Check if critical change (job/company change)
        const criticalChange = changes.some(c => 
          c.field === 'company' || c.field === 'title' || c.field === 'active_experience'
        );
        
        if (criticalChange) {
          console.log(`      🚨 CRITICAL CHANGE - Triggering buyer group re-run`);
          await this.triggerBuyerGroupReRun(person.companyId, {
            reason: 'Person left buyer group',
            personId: person.id,
            changes: changes
          });
        }
      }
      
      // Update person with fresh data
      await this.updatePersonWithFreshData(person.id, freshData, changes, priority);
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`      ✅ Refreshed (${duration}s, ${changes.length} changes)`);
      
      return {
        refreshed: true,
        changes: changes,
        criticalChange: changes.some(c => c.field === 'company' || c.field === 'title')
      };
      
    } catch (error) {
      console.error(`      ❌ Refresh failed: ${error.message}`);
      return { refreshed: false, changes: [], error: error.message };
    }
  }

  /**
   * Get fresh person data from Coresignal
   */
  async getCoresignalPersonData(person) {
    // Try to get Coresignal ID from person
    const coresignalId = person.customFields?.coresignalId || person.coresignalData?.id;
    
    if (!coresignalId) {
      // Try to search by email or LinkedIn
      if (person.email) {
        const searchResult = await this.searchPersonByEmail(person.email);
        if (searchResult) {
          return await this.collectPersonProfile(searchResult);
        }
      }
      return null;
    }
    
    // Collect fresh profile
    return await this.collectPersonProfile(coresignalId);
  }

  async searchPersonByEmail(email) {
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "query": {
            "term": { "email": email.toLowerCase() }
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
      }
    } catch (error) {
      console.error(`   ⚠️ Search failed: ${error.message}`);
    }
    return null;
  }

  async collectPersonProfile(coresignalId) {
    try {
      const response = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${coresignalId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`   ⚠️ Collect failed: ${error.message}`);
    }
    return null;
  }

  /**
   * Detect changes between old and new data
   */
  detectChanges(person, freshData) {
    const changes = [];
    
    // Check current experience
    const oldExperience = person.customFields?.coresignalData?.experience?.[0];
    const newExperience = freshData.experience?.[0];
    
    if (!newExperience) return changes;
    
    // Company change (CRITICAL)
    if (oldExperience?.company_name !== newExperience.company_name) {
      changes.push({
        field: 'company',
        oldValue: oldExperience?.company_name || 'Unknown',
        newValue: newExperience.company_name,
        critical: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Title change (CRITICAL)
    if (oldExperience?.position_title !== newExperience.position_title) {
      changes.push({
        field: 'title',
        oldValue: oldExperience?.position_title || 'Unknown',
        newValue: newExperience.position_title,
        critical: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Active status change (CRITICAL)
    if (newExperience.active_experience === 0 && oldExperience?.active_experience === 1) {
      changes.push({
        field: 'active_experience',
        oldValue: 'Active',
        newValue: 'Inactive',
        critical: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Email change
    if (freshData.email && person.email !== freshData.email) {
      changes.push({
        field: 'email',
        oldValue: person.email,
        newValue: freshData.email,
        critical: false,
        timestamp: new Date().toISOString()
      });
    }
    
    // LinkedIn connections change (engagement signal)
    const oldConnections = person.customFields?.coresignalData?.connections_count;
    if (freshData.connections_count && oldConnections && 
        Math.abs(freshData.connections_count - oldConnections) > 100) {
      changes.push({
        field: 'connections',
        oldValue: oldConnections,
        newValue: freshData.connections_count,
        critical: false,
        timestamp: new Date().toISOString()
      });
    }
    
    return changes;
  }

  /**
   * Store changes for AI notification system
   */
  async storeChanges(personId, changes) {
    try {
      // Get existing changes
      const person = await prisma.people.findUnique({
        where: { id: personId },
        select: { customFields: true }
      });
      
      const customFields = person?.customFields || {};
      const existingChanges = customFields.changeHistory || [];
      
      // Add new changes with metadata
      const newChanges = changes.map(change => ({
        ...change,
        detectedAt: new Date().toISOString(),
        notifiedToAI: false, // AI hasn't been notified yet
        userNotified: false  // User hasn't been notified yet
      }));
      
      // Update database
      await prisma.people.update({
        where: { id: personId },
        data: {
          customFields: {
            ...customFields,
            changeHistory: [...existingChanges, ...newChanges],
            lastChangeDetected: new Date().toISOString(),
            hasUnnotifiedChanges: true
          }
        }
      });
      
      console.log(`      💾 Stored ${changes.length} changes for AI notification`);
      
    } catch (error) {
      console.error(`      ❌ Failed to store changes: ${error.message}`);
    }
  }

  /**
   * Trigger buyer group re-run when critical person leaves
   */
  async triggerBuyerGroupReRun(companyId, context) {
    try {
      console.log(`      🔄 Triggering buyer group re-run for company ${companyId}`);
      
      // Store re-run request
      await prisma.companies.update({
        where: { id: companyId },
        data: {
          customFields: {
            ...(await this.getCompanyCustomFields(companyId)),
            buyerGroupReRunNeeded: true,
            buyerGroupReRunReason: context.reason,
            buyerGroupReRunContext: context,
            buyerGroupReRunRequestedAt: new Date().toISOString()
          }
        }
      });
      
      // Queue re-run job (would trigger async job in production)
      console.log(`      📋 Buyer group re-run queued`);
      
    } catch (error) {
      console.error(`      ❌ Failed to trigger re-run: ${error.message}`);
    }
  }

  async getCompanyCustomFields(companyId) {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { customFields: true }
    });
    return company?.customFields || {};
  }

  /**
   * Update person with fresh data and recalculate next refresh
   */
  async updatePersonWithFreshData(personId, freshData, changes, priority) {
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: { customFields: true, aiIntelligence: true }
    });
    
    const customFields = person?.customFields || {};
    const churnPrediction = customFields.churnPrediction || {};
    
    // Calculate next refresh date
    const now = new Date();
    const nextRefresh = new Date(now);
    const schedule = this.refreshSchedule[priority];
    
    if (priority === 'red') {
      nextRefresh.setDate(nextRefresh.getDate() + 1); // Tomorrow
    } else if (priority === 'orange') {
      nextRefresh.setDate(nextRefresh.getDate() + 7); // Next week
    } else {
      nextRefresh.setMonth(nextRefresh.getMonth() + 1); // Next month
    }
    
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          ...customFields,
          coresignalData: freshData,
          churnPrediction: {
            ...churnPrediction,
            lastRefreshDate: now.toISOString(),
            nextRefreshDate: nextRefresh.toISOString()
          }
        },
        dataLastVerified: now,
        // Update key fields from fresh data
        linkedinConnections: freshData.connections_count || person.linkedinConnections,
        linkedinFollowers: freshData.followers_count || person.linkedinFollowers
      }
    });
  }

  /**
   * Get unnotified changes for AI panel
   * Returns changes that AI should proactively notify user about
   */
  async getUnnotifiedChangesForAI(workspaceId) {
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
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
    
    const notifications = [];
    
    for (const person of people) {
      const changeHistory = person.customFields?.changeHistory || [];
      const unnotified = changeHistory.filter(change => !change.userNotified && !change.notifiedToAI);
      
      if (unnotified.length > 0) {
        notifications.push({
          personId: person.id,
          personName: person.fullName,
          companyName: person.company?.name,
          changes: unnotified,
          priority: this.getNotificationPriority(unnotified)
        });
      }
    }
    
    return notifications;
  }

  getNotificationPriority(changes) {
    // Critical changes (job/company change) = high priority
    const hasCritical = changes.some(c => c.critical);
    if (hasCritical) return 'high';
    
    // Multiple changes = medium priority
    if (changes.length > 2) return 'medium';
    
    return 'low';
  }

  /**
   * Mark changes as notified to user (via AI panel)
   */
  async markChangesNotified(personId) {
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: { customFields: true }
    });
    
    const customFields = person?.customFields || {};
    const changeHistory = customFields.changeHistory || [];
    
    // Mark all changes as notified
    const updated = changeHistory.map(change => ({
      ...change,
      userNotified: true,
      notifiedToAI: true,
      notifiedAt: new Date().toISOString()
    }));
    
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          ...customFields,
          changeHistory: updated,
          hasUnnotifiedChanges: false
        }
      }
    });
  }

  /**
   * Process Coresignal webhook for job change
   */
  async processWebhookJobChange(webhookEvent) {
    console.log(`\n🔔 WEBHOOK: Person job change detected`);
    console.log(`   Person: ${webhookEvent.person.name}`);
    console.log(`   Old Company: ${webhookEvent.oldCompany}`);
    console.log(`   New Company: ${webhookEvent.newCompany}`);
    
    try {
      // Find person in our database
      const person = await prisma.people.findFirst({
        where: {
          OR: [
            { email: webhookEvent.person.email },
            { linkedinUrl: webhookEvent.person.linkedinUrl }
          ],
          deletedAt: null
        },
        include: {
          company: {
            select: { id: true, name: true }
          }
        }
      });
      
      if (!person) {
        console.log(`   ⚠️ Person not found in database`);
        return { processed: false, reason: 'Person not found' };
      }
      
      console.log(`   ✅ Found person: ${person.fullName}`);
      
      // Store the change
      const change = {
        field: 'company',
        oldValue: webhookEvent.oldCompany,
        newValue: webhookEvent.newCompany,
        critical: true,
        source: 'coresignal_webhook',
        timestamp: new Date().toISOString()
      };
      
      await this.storeChanges(person.id, [change]);
      
      // If person was in buyer group, trigger re-run
      if (person.isBuyerGroupMember && person.companyId) {
        console.log(`   🚨 Person was in buyer group - triggering re-run`);
        await this.triggerBuyerGroupReRun(person.companyId, {
          reason: 'Buyer group member left company',
          personId: person.id,
          personName: person.fullName,
          oldCompany: webhookEvent.oldCompany,
          newCompany: webhookEvent.newCompany,
          webhookId: webhookEvent.id
        });
      }
      
      // Immediate refresh to get latest data
      await this.refreshPersonData(person, 'red');
      
      console.log(`   ✅ Webhook processed successfully`);
      
      return {
        processed: true,
        personId: person.id,
        buyerGroupReRunTriggered: person.isBuyerGroupMember
      };
      
    } catch (error) {
      console.error(`   ❌ Webhook processing failed: ${error.message}`);
      return { processed: false, error: error.message };
    }
  }
}

module.exports = { RealTimeDataManager };

