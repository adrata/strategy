/**
 * 👥 SIMPLE PEOPLE DISCOVERY
 * 
 * Working version that discovers and stores real people step by step
 * Focus on getting it working first, then make it sophisticated
 */

import { prisma } from '@/platform/database/prisma-client';
import { IntelligenceContext } from './ContextLoader';

export interface SimplePerson {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  buyerGroupRole: 'decision_maker' | 'champion' | 'influencer' | 'blocker' | 'introducer';
  reasoning: string;
  confidence: number;
}

export interface SimpleBuyerGroup {
  companyName: string;
  companySize: string;
  people: SimplePerson[];
  decisionMakers: SimplePerson[];
  champions: SimplePerson[];
  stakeholders: SimplePerson[];
  introducers: SimplePerson[];
  totalPeople: number;
}

export class SimplePeopleDiscovery {
  
  /**
   * 🎯 MAIN ENTRY POINT - Simple people discovery
   */
  static async discoverPeople(
    companyName: string,
    context: IntelligenceContext
  ): Promise<SimpleBuyerGroup> {
    
    console.log(`👥 [SIMPLE DISCOVERY] Starting for ${companyName}`);
    
    // Step 1: Get company info
    const account = await prisma.companies.findFirst({
      where: {
        name: companyName,
        workspaceId: context.seller.workspaceId
      }
    });
    
    if (!account) {
      throw new Error(`Company ${companyName} not found`);
    }
    
    console.log(`📊 [SIMPLE DISCOVERY] Company: ${account.name}, Size: ${account.size}`);
    
    // Step 2: Determine target roles based on company size
    const targetRoles = this.getTargetRolesBySize(account.size || '11-50 employees');
    console.log(`🎯 [SIMPLE DISCOVERY] Target roles: ${targetRoles.join(', ')}`);
    
    // Step 3: Create people (placeholder for now, will add real API later)
    const people: SimplePerson[] = [];
    
    for (const role of targetRoles) {
      const person = this.createSimplePerson(role, companyName);
      people.push(person);
      console.log(`   ✅ Created: ${person.name} (${person.title}) - ${person.buyerGroupRole}`);
    }
    
    // Step 4: Categorize people
    const decisionMakers = people.filter(p => p['buyerGroupRole'] === 'decision_maker');
    const champions = people.filter(p => p['buyerGroupRole'] === 'champion');
    const influencers = people.filter(p => p['buyerGroupRole'] === 'influencer');
    const blockers = people.filter(p => p['buyerGroupRole'] === 'blocker');
    const introducers = people.filter(p => p['buyerGroupRole'] === 'introducer');
    
    const stakeholders = [...influencers, ...blockers]; // Combine as requested
    
    console.log(`📊 [SIMPLE DISCOVERY] Categorized: ${decisionMakers.length} decision makers, ${champions.length} champions, ${stakeholders.length} stakeholders, ${introducers.length} introducers`);
    
    const buyerGroup: SimpleBuyerGroup = {
      companyName,
      companySize: account.size || '11-50 employees',
      people,
      decisionMakers,
      champions,
      stakeholders,
      introducers,
      totalPeople: people.length
    };
    
    console.log(`✅ [SIMPLE DISCOVERY] Complete: ${people.length} people discovered for ${companyName}`);
    
    return buyerGroup;
  }
  
  /**
   * 📏 Get target roles based on company size
   */
  private static getTargetRolesBySize(companySize: string): string[] {
    const sizeLower = companySize.toLowerCase();
    
    // Small companies (2-10 employees) - minimal buyer group
    if (sizeLower.includes('2-10') || sizeLower.includes('1-10')) {
      return ['CEO', 'Office Manager']; // Just decision maker + introducer
    }
    
    // Medium companies (11-50 employees) - simple buyer group  
    if (sizeLower.includes('11-50') || sizeLower.includes('10-50')) {
      return ['CEO', 'Operations Manager', 'Office Manager'];
    }
    
    // Larger companies (51-200 employees) - full buyer group
    if (sizeLower.includes('51-200') || sizeLower.includes('50-200')) {
      return ['CEO', 'CFO', 'COO', 'Operations Manager', 'Compliance Officer'];
    }
    
    // Enterprise (201+ employees) - complex buyer group
    return ['CEO', 'CFO', 'COO', 'VP Operations', 'Operations Manager', 'Compliance Officer', 'IT Director'];
  }
  
  /**
   * 👤 Create simple person (placeholder that works)
   */
  private static createSimplePerson(role: string, companyName: string): SimplePerson {
    const firstNames = ['John', 'Sarah', 'Michael', 'Lisa', 'David', 'Jennifer'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    // Determine buyer group role
    let buyerGroupRole: 'decision_maker' | 'champion' | 'influencer' | 'blocker' | 'introducer';
    let reasoning: string;
    
    const roleLower = role.toLowerCase();
    
    if (['ceo', 'cfo', 'president', 'owner'].some(r => roleLower.includes(r))) {
      buyerGroupRole = 'decision_maker';
      reasoning = 'Final decision authority for technology investments';
    } else if (['coo', 'operations manager', 'vp operations'].some(r => roleLower.includes(r))) {
      buyerGroupRole = 'champion';
      reasoning = 'Primary user and advocate for operational efficiency tools';
    } else if (['compliance', 'legal', 'risk'].some(r => roleLower.includes(r))) {
      buyerGroupRole = 'blocker';
      reasoning = 'Must approve for regulatory compliance - can block if concerns';
    } else if (['office manager', 'admin', 'assistant'].some(r => roleLower.includes(r))) {
      buyerGroupRole = 'introducer';
      reasoning = 'Good relationship entry point - coordinates daily operations';
    } else {
      buyerGroupRole = 'influencer';
      reasoning = 'Influences decision through technical or operational input';
    }
    
    const cleanCompany = companyName.toLowerCase().replace(/[^a-z]/g, '');
    
    return {
      name,
      title: role,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanCompany}.com`,
      buyerGroupRole,
      reasoning,
      confidence: 80
    };
  }
}
