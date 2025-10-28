/**
 * CORESIGNAL WEBHOOK HANDLER
 * 
 * Handles real-time webhook events from Coresignal to keep buyer group data live
 */

import { prisma } from '@/platform/database/prisma-client';
import crypto from 'crypto';

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  subscription_id: string;
}

export interface WebhookSubscription {
  id: string;
  webhook_url: string;
  event_types: string[];
  criteria: any;
  active: boolean;
  created_at: string;
}

export class CoresignalWebhookHandler {
  private webhookSecret: string;
  private subscriptions: Map<string, WebhookSubscription> = new Map();

  constructor() {
    this.webhookSecret = process.env.CORESIGNAL_WEBHOOK_SECRET || '';
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('⚠️ No webhook secret configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process incoming webhook event
   */
  async processWebhookEvent(event: WebhookEvent): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log(`🔔 [WEBHOOK] Processing event: ${event.type} (${event.id})`);

      switch (event.type) {
        case 'employee.added':
          await this.handleEmployeeAdded(event.data);
          break;
        case 'employee.updated':
          await this.handleEmployeeUpdated(event.data);
          break;
        case 'employee.deleted':
          await this.handleEmployeeDeleted(event.data);
          break;
        case 'company.updated':
          await this.handleCompanyUpdated(event.data);
          break;
        case 'company.merged':
          await this.handleCompanyMerged(event.data);
          break;
        default:
          console.log(`⚠️ [WEBHOOK] Unknown event type: ${event.type}`);
          return { success: false, message: `Unknown event type: ${event.type}` };
      }

      return { success: true, message: 'Event processed successfully' };

    } catch (error: any) {
      console.error(`❌ [WEBHOOK] Failed to process event ${event.id}:`, error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle employee added event
   */
  private async handleEmployeeAdded(employeeData: any): Promise<void> {
    console.log(`   👤 Employee added: ${employeeData.name} at ${employeeData.company_name}`);

    // Check if this employee is part of any tracked buyer groups
    const buyerGroups = await this.findRelevantBuyerGroups(employeeData);
    
    for (const buyerGroup of buyerGroups) {
      // Check if employee should be added to buyer group
      const shouldAdd = await this.shouldAddToBuyerGroup(employeeData, buyerGroup);
      
      if (shouldAdd) {
        await this.addEmployeeToBuyerGroup(employeeData, buyerGroup);
        console.log(`   ✅ Added ${employeeData.name} to buyer group ${buyerGroup.id}`);
      }
    }
  }

  /**
   * Handle employee updated event
   */
  private async handleEmployeeUpdated(employeeData: any): Promise<void> {
    console.log(`   👤 Employee updated: ${employeeData.name} at ${employeeData.company_name}`);

    // Find existing buyer group memberships
    const memberships = await prisma.buyerGroupMembers.findMany({
      where: {
        coresignalId: employeeData.id
      },
      include: {
        buyerGroup: true
      }
    });

    for (const membership of memberships) {
      // Update member data
      await prisma.buyerGroupMembers.update({
        where: { id: membership.id },
        data: {
          name: employeeData.name,
          title: employeeData.job_title,
          department: employeeData.department,
          seniorityLevel: employeeData.seniority_level,
          location: employeeData.location,
          profilePicture: employeeData.profile_picture_url,
          summary: employeeData.summary,
          experience: employeeData.experience || [],
          skills: employeeData.skills || [],
          customFields: {
            ...(membership.customFields as any),
            lastUpdatedAt: new Date().toISOString(),
            coresignalData: employeeData
          }
        }
      });

      // Re-evaluate role and priority
      const newRole = await this.classifyEmployeeRole(employeeData, membership.buyerGroup);
      const newPriority = this.calculatePriority(employeeData, newRole);

      await prisma.buyerGroupMembers.update({
        where: { id: membership.id },
        data: {
          role: newRole,
          priority: newPriority,
          updatedAt: new Date()
        }
      });

      console.log(`   ✅ Updated ${employeeData.name} in buyer group ${membership.buyerGroup.id}`);
    }
  }

  /**
   * Handle employee deleted event
   */
  private async handleEmployeeDeleted(employeeData: any): Promise<void> {
    console.log(`   👤 Employee deleted: ${employeeData.name} at ${employeeData.company_name}`);

    // Remove from all buyer groups
    const deleted = await prisma.buyerGroupMembers.deleteMany({
      where: {
        coresignalId: employeeData.id
      }
    });

    console.log(`   ✅ Removed ${deleted.count} buyer group memberships for ${employeeData.name}`);
  }

  /**
   * Handle company updated event
   */
  private async handleCompanyUpdated(companyData: any): Promise<void> {
    console.log(`   🏢 Company updated: ${companyData.name}`);

    // Update company information in database
    await prisma.companies.updateMany({
      where: {
        customFields: {
          path: ['coresignalId'],
          equals: companyData.id
        }
      },
      data: {
        name: companyData.name,
        website: companyData.website,
        industry: companyData.industry,
        size: companyData.employee_count?.toString(),
        location: companyData.location,
        description: companyData.description,
        foundedYear: companyData.founded_year,
        revenue: companyData.revenue,
        linkedinUrl: companyData.linkedin_url,
        customFields: {
          coresignalId: companyData.id,
          lastUpdatedAt: new Date().toISOString(),
          coresignalData: companyData
        }
      }
    });

    console.log(`   ✅ Updated company data for ${companyData.name}`);
  }

  /**
   * Handle company merged event
   */
  private async handleCompanyMerged(mergeData: any): Promise<void> {
    console.log(`   🏢 Company merged: ${mergeData.source_company.name} → ${mergeData.target_company.name}`);

    // Update all references to the merged company
    await prisma.companies.updateMany({
      where: {
        customFields: {
          path: ['coresignalId'],
          equals: mergeData.source_company.id
        }
      },
      data: {
        customFields: {
          coresignalId: mergeData.target_company.id,
          mergedFrom: mergeData.source_company.id,
          lastUpdatedAt: new Date().toISOString()
        }
      }
    });

    console.log(`   ✅ Updated company references for merge`);
  }

  /**
   * Find buyer groups that might be relevant to this employee
   */
  private async findRelevantBuyerGroups(employeeData: any): Promise<any[]> {
    return await prisma.buyerGroups.findMany({
      where: {
        company: {
          OR: [
            { name: { contains: employeeData.company_name, mode: 'insensitive' } },
            { customFields: { path: ['coresignalId'], equals: employeeData.company_id } }
          ]
        },
        status: 'active'
      }
    });
  }

  /**
   * Determine if employee should be added to buyer group
   */
  private async shouldAddToBuyerGroup(employeeData: any, buyerGroup: any): Promise<boolean> {
    // Check if employee meets buyer group criteria
    const criteria = buyerGroup.criteria as any;
    
    if (criteria?.departments && criteria.departments.length > 0) {
      const department = employeeData.department?.toLowerCase();
      const targetDepartments = criteria.departments.map((d: string) => d.toLowerCase());
      if (!targetDepartments.some((d: string) => department?.includes(d))) {
        return false;
      }
    }

    if (criteria?.jobTitles && criteria.jobTitles.length > 0) {
      const jobTitle = employeeData.job_title?.toLowerCase();
      const targetTitles = criteria.jobTitles.map((t: string) => t.toLowerCase());
      if (!targetTitles.some((t: string) => jobTitle?.includes(t))) {
        return false;
      }
    }

    if (criteria?.seniorityLevels && criteria.seniorityLevels.length > 0) {
      const seniority = employeeData.seniority_level?.toLowerCase();
      const targetSeniority = criteria.seniorityLevels.map((s: string) => s.toLowerCase());
      if (!targetSeniority.includes(seniority)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add employee to buyer group
   */
  private async addEmployeeToBuyerGroup(employeeData: any, buyerGroup: any): Promise<void> {
    const role = await this.classifyEmployeeRole(employeeData, buyerGroup);
    const priority = this.calculatePriority(employeeData, role);

    await prisma.buyerGroupMembers.create({
      data: {
        buyerGroupId: buyerGroup.id,
        coresignalId: employeeData.id,
        name: employeeData.name,
        title: employeeData.job_title,
        department: employeeData.department,
        seniorityLevel: employeeData.seniority_level,
        location: employeeData.location,
        profilePicture: employeeData.profile_picture_url,
        summary: employeeData.summary,
        experience: employeeData.experience || [],
        skills: employeeData.skills || [],
        role,
        priority,
        customFields: {
          coresignalData: employeeData,
          addedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Classify employee role for buyer group
   */
  private async classifyEmployeeRole(employeeData: any, buyerGroup: any): Promise<string> {
    const title = (employeeData.job_title || '').toLowerCase();
    const department = (employeeData.department || '').toLowerCase();
    const seniority = (employeeData.seniority_level || '').toLowerCase();

    // Decision Maker patterns
    if (title.includes('ceo') || title.includes('cfo') || title.includes('cto') || 
        title.includes('cmo') || title.includes('cro') || title.includes('coo') ||
        title.includes('president') || title.includes('vp') || title.includes('vice president')) {
      return 'decision_maker';
    }

    // Champion patterns
    if (title.includes('director') || title.includes('head of') || 
        (seniority.includes('senior') && title.includes('manager'))) {
      return 'champion';
    }

    // Stakeholder patterns
    if (title.includes('manager') || title.includes('lead') || title.includes('specialist')) {
      return 'stakeholder';
    }

    // Blocker patterns
    if (department.includes('procurement') || department.includes('legal') || 
        department.includes('compliance') || title.includes('procurement')) {
      return 'blocker';
    }

    // Introducer patterns
    if (department.includes('sales') || department.includes('account') || 
        title.includes('account manager') || title.includes('sales')) {
      return 'introducer';
    }

    return 'stakeholder'; // Default fallback
  }

  /**
   * Calculate priority for employee
   */
  private calculatePriority(employeeData: any, role: string): number {
    let priority = 5; // Base priority

    // Role-based priority
    const rolePriority = {
      'decision_maker': 10,
      'champion': 8,
      'stakeholder': 6,
      'blocker': 4,
      'introducer': 7
    };
    priority = rolePriority[role as keyof typeof rolePriority] || priority;

    // Seniority boost
    const seniority = employeeData.seniority_level?.toLowerCase();
    if (seniority?.includes('senior')) priority += 1;
    if (seniority?.includes('lead')) priority += 1;
    if (seniority?.includes('principal')) priority += 2;

    // Experience boost
    const experience = employeeData.experience || [];
    if (experience.length > 5) priority += 1;
    if (experience.length > 10) priority += 1;

    return Math.min(priority, 10);
  }

  /**
   * Create webhook subscription
   */
  async createSubscription(options: {
    webhookUrl: string;
    eventTypes: string[];
    criteria: any;
  }): Promise<WebhookSubscription> {
    const { webhookUrl, eventTypes, criteria } = options;

    // This would typically call Coresignal's API to create a subscription
    // For now, we'll simulate it
    const subscription: WebhookSubscription = {
      id: `sub_${Date.now()}`,
      webhook_url: webhookUrl,
      event_types: eventTypes,
      criteria,
      active: true,
      created_at: new Date().toISOString()
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): WebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<boolean> {
    return this.subscriptions.delete(subscriptionId);
  }
}
