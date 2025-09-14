/**
 * 🎯 MINIMAL BUYER GROUP FINDER
 * 
 * ABSOLUTE MINIMAL approach to find buyer group people
 * Just search by role using Lusha API - that's it.
 */

import { IntelligenceContext } from './ContextLoader';

export interface BuyerGroupPerson {
  name: string;
  role: string; // Their actual title (CEO, CFO, etc.)
  buyerGroupRole: 'primary' | 'influencer' | 'user' | 'blocker';
  email?: string;
  phone?: string;
  confidence: number; // 0-100
}

export interface AccountBuyerGroup {
  accountName: string;
  people: BuyerGroupPerson[];
  searchTime: number; // milliseconds
  successRate: number; // 0-100 (percentage of roles found)
}

export interface BulkBuyerGroupResult {
  buyerGroups: AccountBuyerGroup[];
  totalPeople: number;
  totalSearchTime: number;
  overallSuccessRate: number;
  apiCallsUsed: number;
}

export class MinimalBuyerGroupFinder {
  private lushaApiKey: string;
  private apiCallsUsed = 0;

  constructor() {
    this['lushaApiKey'] = process['env']['LUSHA_API_KEY'] || '';
    if (!this.lushaApiKey) {
      throw new Error('LUSHA_API_KEY environment variable is required');
    }
  }

  /**
   * 🎯 MAIN ENTRY POINT - Find buyer groups for multiple accounts
   */
  static async findBuyerGroups(
    accountNames: string[],
    context: IntelligenceContext,
    targetRoles?: string[]
  ): Promise<BulkBuyerGroupResult> {
    
    const finder = new MinimalBuyerGroupFinder();
    const startTime = Date.now();
    
    console.log(`🎯 [BUYER GROUP] Starting search for ${accountNames.length} accounts`);
    
    // Step 1: Determine target roles from context
    const rolesToSearch = targetRoles || finder.determineTargetRoles(context);
    console.log(`🔍 [BUYER GROUP] Target roles: ${rolesToSearch.join(', ')}`);
    
    // Step 2: Search each account (can be parallelized later)
    const buyerGroups: AccountBuyerGroup[] = [];
    
    for (const accountName of accountNames) {
      const accountResult = await finder.findAccountBuyerGroup(
        accountName, 
        rolesToSearch, 
        context
      );
      buyerGroups.push(accountResult);
      
      // Small delay to respect rate limits
      await finder.delay(100);
    }
    
    // Step 3: Calculate totals
    const totalSearchTime = Date.now() - startTime;
    const totalPeople = buyerGroups.reduce((sum, bg) => sum + bg.people.length, 0);
    const overallSuccessRate = buyerGroups.length > 0 
      ? buyerGroups.reduce((sum, bg) => sum + bg.successRate, 0) / buyerGroups.length 
      : 0;
    
    const result: BulkBuyerGroupResult = {
      buyerGroups,
      totalPeople,
      totalSearchTime,
      overallSuccessRate,
      apiCallsUsed: finder.apiCallsUsed
    };
    
    console.log(`✅ [BUYER GROUP] Bulk search complete: ${totalPeople} people found across ${accountNames.length} accounts in ${totalSearchTime}ms`);
    
    return result;
  }

  /**
   * 🏢 Find buyer group for single account
   */
  private async findAccountBuyerGroup(
    accountName: string,
    targetRoles: string[],
    context: IntelligenceContext
  ): Promise<AccountBuyerGroup> {
    
    const startTime = Date.now();
    console.log(`🏢 [${accountName}] Searching for buyer group...`);
    
    const people: BuyerGroupPerson[] = [];
    
    // Search for each target role
    for (const role of targetRoles) {
      try {
        const person = await this.searchPersonByRole(accountName, role, context);
        if (person) {
          people.push(person);
          console.log(`   ✅ Found: ${person.name} (${person.role})`);
        } else {
          console.log(`   ❌ Not found: ${role} at ${accountName}`);
        }
      } catch (error) {
        console.error(`   ❌ Error searching ${role} at ${accountName}:`, error);
      }
      
      // Small delay between searches
      await this.delay(50);
    }
    
    const searchTime = Date.now() - startTime;
    const successRate = targetRoles.length > 0 ? (people.length / targetRoles.length) * 100 : 0;
    
    return {
      accountName,
      people,
      searchTime,
      successRate
    };
  }

  /**
   * 🔍 Search for specific person by role at company
   */
  private async searchPersonByRole(
    companyName: string, 
    role: string, 
    context: IntelligenceContext
  ): Promise<BuyerGroupPerson | null> {
    
    try {
      const response = await fetch('https://api.lusha.com/person', {
        method: 'POST',
        headers: {
          'api_key': this.lushaApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: companyName,
          title: role
        })
      });

      this.apiCallsUsed++;

      if (!response.ok) {
        console.log(`   ⚠️ Lusha API error: ${response.status} for ${role} at ${companyName}`);
        return null;
      }

      const data = await response.json();
      
      if (data['data'] && data['data']['firstName'] && data.data.lastName) {
        const person: BuyerGroupPerson = {
          name: `${data.data.firstName} ${data.data.lastName}`,
          role: data.data.title || role,
          buyerGroupRole: this.mapToBuyerGroupRole(role, context),
          email: data.data.email || undefined,
          phone: data.data.phoneNumbers?.[0] || undefined,
          confidence: this.calculateConfidence(data.data)
        };

        return person;
      }

      return null;

    } catch (error) {
      console.error(`   ❌ Lusha search error for ${role} at ${companyName}:`, error);
      return null;
    }
  }

  /**
   * 🎯 Determine target roles from user's product context
   */
  private determineTargetRoles(context: IntelligenceContext): string[] {
    // Get roles from user's product portfolio
    const buyingCommitteeRoles = context.seller.productPortfolio
      .flatMap(product => product.buyingCommitteeRoles);

    if (buyingCommitteeRoles.length > 0) {
      // Remove duplicates and return
      return [...new Set(buyingCommitteeRoles)];
    }

    // Fallback to common buyer group roles
    return ['CEO', 'CFO', 'CTO'];
  }

  /**
   * 🏷️ Map role to buyer group importance
   */
  private mapToBuyerGroupRole(
    role: string, 
    context: IntelligenceContext
  ): 'primary' | 'influencer' | 'user' | 'blocker' {
    
    const roleUpper = role.toUpperCase();
    
    // Primary decision makers
    if (['CEO', 'CFO', 'CTO', 'CRO'].includes(roleUpper)) {
      return 'primary';
    }
    
    // VP level - usually influencers
    if (roleUpper.includes('VP') || roleUpper.includes('VICE PRESIDENT')) {
      return 'influencer';
    }
    
    // Director level - usually users
    if (roleUpper.includes('DIRECTOR') || roleUpper.includes('DIR')) {
      return 'user';
    }
    
    // Security/Legal - potential blockers
    if (roleUpper.includes('CISO') || roleUpper.includes('LEGAL') || roleUpper.includes('PROCUREMENT')) {
      return 'blocker';
    }
    
    // Default to influencer
    return 'influencer';
  }

  /**
   * 📊 Calculate confidence based on data completeness
   */
  private calculateConfidence(lushaData: any): number {
    let confidence = 50; // Base confidence
    
    if (lushaData.email) confidence += 30;
    if (lushaData.phoneNumbers?.length > 0) confidence += 20;
    if (lushaData.title) confidence += 10;
    if (lushaData.linkedinUrl) confidence += 10;
    
    return Math.min(confidence, 100);
  }

  /**
   * ⏱️ Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
