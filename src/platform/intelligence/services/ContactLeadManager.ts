#!/usr/bin/env node

/**
 * 📝 CONTACT & LEAD MANAGER
 * 
 * Handles adding discovered executives as contacts and leads in the database
 * Ensures no duplicates and maintains data integrity
 */

import { prisma } from '@/platform/database/prisma-client';
import type { ExecutiveContact, BuyerGroupInsight } from '../types/intelligence';

export interface ContactLeadData {
  workspaceId: string;
  userId: string;
  accountId?: string;
  source: string;
  priority: 'low' | 'medium' | 'high';
}

export class ContactLeadManager {
  
  /**
   * 📝 ADD BUYER GROUP AS CONTACTS & LEADS
   */
  async addBuyerGroupToDatabase(
    executives: ExecutiveContact[],
    buyerGroup: BuyerGroupInsight,
    data: ContactLeadData
  ): Promise<{
    contactsAdded: number;
    leadsAdded: number;
    duplicatesSkipped: number;
    results: any[];
  }> {
    
    console.log(`📝 [CONTACT MANAGER] Adding ${executives.length} executives to database`);
    console.log(`   Workspace: ${data.workspaceId}, User: ${data.userId}`);
    
    let contactsAdded = 0;
    let leadsAdded = 0;
    let duplicatesSkipped = 0;
    const results: any[] = [];
    
    for (const executive of executives) {
      try {
        // Determine priority based on buyer group role
        const priority = this.determinePriority(executive, buyerGroup);
        
        // Add as contact first
        const contact = await this.addExecutiveAsContact(executive, {
          ...data,
          priority
        });
        
        if (contact.wasCreated) {
          contactsAdded++;
        } else {
          duplicatesSkipped++;
        }
        
        // Add as lead if has good contact info
        if (executive.email || executive.phone) {
          const lead = await this.addExecutiveAsLead(executive, {
            ...data,
            priority
          });
          
          if (lead.wasCreated) {
            leadsAdded++;
          }
          
          results.push({
            executive: executive.name,
            role: executive.role,
            buyerGroupRole: this.getBuyerGroupRole(executive, buyerGroup),
            contact: contact.record,
            lead: lead.record,
            priority
          });
        } else {
          results.push({
            executive: executive.name,
            role: executive.role,
            buyerGroupRole: this.getBuyerGroupRole(executive, buyerGroup),
            contact: contact.record,
            lead: null,
            priority,
            note: 'No contact info - added as contact only'
          });
        }
        
      } catch (error) {
        console.error(`❌ [CONTACT MANAGER] Error adding ${executive.name}:`, error);
        results.push({
          executive: executive.name,
          error: error.message
        });
      }
    }
    
    console.log(`✅ [CONTACT MANAGER] Summary:`);
    console.log(`   Contacts Added: ${contactsAdded}`);
    console.log(`   Leads Added: ${leadsAdded}`);
    console.log(`   Duplicates Skipped: ${duplicatesSkipped}`);
    
    return {
      contactsAdded,
      leadsAdded,
      duplicatesSkipped,
      results
    };
  }
  
  /**
   * 👤 ADD EXECUTIVE AS CONTACT
   */
  private async addExecutiveAsContact(
    executive: ExecutiveContact,
    data: ContactLeadData
  ): Promise<{ record: any; wasCreated: boolean }> {
    
    // Check for existing contact
    const existingContact = await prisma.people.findFirst({
      where: {
        workspaceId: data.workspaceId,
        OR: [
          { email: executive.email , deletedAt: null},
          { 
            firstName: executive.name.split(' ')[0],
            lastName: executive.name.split(' ').slice(1).join(' '),
            company: executive.company
          }
        ]
      }
    });
    
    if (existingContact) {
      console.log(`   👤 Contact exists: ${executive.name}`);
      return { record: existingContact, wasCreated: false };
    }
    
    // Create new contact
    const nameParts = executive.name.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const newContact = await prisma.people.create({
      data: {
        workspaceId: data.workspaceId,
        firstName,
        lastName,
        fullName: executive.name,
        email: executive.email || null,
        workEmail: executive.email || null,
        phone: executive.phone || null,
        mobilePhone: executive.phone || null,
        company: executive.company,
        jobTitle: executive.title,
        department: executive.department || null,
        linkedinUrl: executive.linkedin || null,
        source: `Intelligence Platform - ${data.source}`,
        status: 'active',
        assignedUserId: data.userId,
        accountId: data.accountId || null,
        notes: `Role: ${executive.role}\nConfidence: ${executive.confidence}%\nSource: ${executive.source}`
      }
    });
    
    console.log(`   ✅ Contact created: ${executive.name}`);
    return { record: newContact, wasCreated: true };
  }
  
  /**
   * 🎯 ADD EXECUTIVE AS LEAD
   */
  private async addExecutiveAsLead(
    executive: ExecutiveContact,
    data: ContactLeadData
  ): Promise<{ record: any; wasCreated: boolean }> {
    
    // Check for existing lead
    const existingLead = await prisma.leads.findFirst({
      where: {
        workspaceId: data.workspaceId,
        OR: [
          { email: executive.email , deletedAt: null},
          { 
            firstName: executive.name.split(' ')[0],
            lastName: executive.name.split(' ').slice(1).join(' '),
            company: executive.company
          }
        ]
      }
    });
    
    if (existingLead) {
      console.log(`   🎯 Lead exists: ${executive.name}`);
      return { record: existingLead, wasCreated: false };
    }
    
    // Create new lead
    const nameParts = executive.name.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const newLead = await prisma.leads.create({
      data: {
        workspaceId: data.workspaceId,
        firstName,
        lastName,
        fullName: executive.name,
        email: executive.email || null,
        workEmail: executive.email || null,
        phone: executive.phone || null,
        mobilePhone: executive.phone || null,
        company: executive.company,
        jobTitle: executive.title,
        source: `Intelligence Platform - ${data.source}`,
        status: 'new',
        priority: data.priority,
        assignedUserId: data.userId,
        notes: `Role: ${executive.role}\nConfidence: ${executive.confidence}%\nBuyer Group Analysis Available`
      }
    });
    
    console.log(`   ✅ Lead created: ${executive.name}`);
    return { record: newLead, wasCreated: true };
  }
  
  /**
   * 🎯 DETERMINE PRIORITY BASED ON BUYER GROUP ROLE
   */
  private determinePriority(
    executive: ExecutiveContact,
    buyerGroup: BuyerGroupInsight
  ): 'low' | 'medium' | 'high' {
    
    // Decision makers get highest priority
    if (buyerGroup.decisionMaker?.name === executive.name) {
      return 'high';
    }
    
    // Champions get high priority
    if (buyerGroup.champions?.some(c => c['name'] === executive.name)) {
      return 'high';
    }
    
    // Influencers get medium priority
    if (buyerGroup.influencers?.some(i => i['name'] === executive.name)) {
      return 'medium';
    }
    
    // Introducers get medium priority
    if (buyerGroup.introducers?.some(i => i['name'] === executive.name)) {
      return 'medium';
    }
    
    // Everyone else gets low priority
    return 'low';
  }
  
  /**
   * 🎭 GET BUYER GROUP ROLE
   */
  private getBuyerGroupRole(
    executive: ExecutiveContact,
    buyerGroup: BuyerGroupInsight
  ): string {
    
    if (buyerGroup.decisionMaker?.name === executive.name) {
      return 'Decision Maker';
    }
    
    if (buyerGroup.champions?.some(c => c['name'] === executive.name)) {
      return 'Champion';
    }
    
    if (buyerGroup.influencers?.some(i => i['name'] === executive.name)) {
      return 'Influencer';
    }
    
    if (buyerGroup.stakeholders?.some(s => s['name'] === executive.name)) {
      return 'Stakeholder';
    }
    
    if (buyerGroup.introducers?.some(i => i['name'] === executive.name)) {
      return 'Introducer';
    }
    
    if (buyerGroup.blockers?.some(b => b['name'] === executive.name)) {
      return 'Blocker';
    }
    
    return 'Identified Executive';
  }
}
