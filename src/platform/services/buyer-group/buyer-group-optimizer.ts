/**
 * 🎯 BUYER GROUP OPTIMIZER
 * 
 * Smart buyer group composition based on company size and B2B sales research.
 * Ensures optimal role distribution for client launch.
 */

export interface BuyerGroupMember {
  id: string;
  fullName: string;
  title: string;
  email: string;
  phone?: string;
  role: 'Decision Maker' | 'Champion' | 'Stakeholder' | 'Blocker' | 'Introducer';
  influence: 'high' | 'medium' | 'low';
  isPrimary: boolean;
  company: string;
  companyId: string;
  rank: number;
  lastActivity?: string;
  contactQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CompanySize {
  category: 'small' | 'medium' | 'large';
  employeeCount: number;
  targetBuyerGroupSize: number;
  roleDistribution: {
    decisionMakers: number;
    champions: number;
    stakeholders: number;
    blockers: number;
    introducers: number;
  };
}

export class BuyerGroupOptimizer {
  
  /**
   * 🎯 MAIN FUNCTION: Optimize buyer group for company
   */
  static optimizeBuyerGroup(
    allPeople: any[],
    companyName: string,
    companyId: string
  ): BuyerGroupMember[] {
    
    console.log(`🎯 [BUYER GROUP OPTIMIZER] Optimizing for ${companyName} (${allPeople.length} people)`);
    
    // Step 1: Determine company size category
    const companySize = this.determineCompanySize(allPeople.length);
    console.log(`📊 [BUYER GROUP] Company size: ${companySize.category} (${companySize.employeeCount} people, target: ${companySize.targetBuyerGroupSize})`);
    
    // Step 2: Assign roles to all people
    const peopleWithRoles = allPeople.map(person => ({
      ...person,
      role: this.assignRole(person.title || person.jobTitle || ''),
      influence: this.calculateInfluence(person),
      contactQuality: this.assessContactQuality(person),
      rank: person.rank || 999
    }));
    
    // Step 3: Select optimal buyer group based on size and role distribution
    const buyerGroup = this.selectOptimalBuyerGroup(peopleWithRoles, companySize);
    
    // Step 4: Ensure we have at least one Decision Maker
    const finalBuyerGroup = this.ensureDecisionMaker(buyerGroup, peopleWithRoles);
    
    console.log(`✅ [BUYER GROUP] Final buyer group: ${finalBuyerGroup.length} people for ${companyName}`);
    console.log(`📊 [BUYER GROUP] Role distribution:`, this.getRoleDistribution(finalBuyerGroup));
    
    return finalBuyerGroup;
  }
  
  /**
   * 📏 Determine company size category based on research
   */
  private static determineCompanySize(peopleCount: number): CompanySize {
    if (peopleCount <= 10) {
      return {
        category: 'small',
        employeeCount: peopleCount,
        targetBuyerGroupSize: Math.min(peopleCount, 2), // Max 2 for small companies
        roleDistribution: {
          decisionMakers: 1,
          champions: Math.min(1, peopleCount - 1),
          stakeholders: 0,
          blockers: 0,
          introducers: 0
        }
      };
    } else if (peopleCount <= 50) {
      return {
        category: 'medium',
        employeeCount: peopleCount,
        targetBuyerGroupSize: Math.min(peopleCount, 6), // Max 6 for medium companies
        roleDistribution: {
          decisionMakers: 1,
          champions: 1,
          stakeholders: 2,
          blockers: 1,
          introducers: 1
        }
      };
    } else {
      return {
        category: 'large',
        employeeCount: peopleCount,
        targetBuyerGroupSize: Math.min(peopleCount, 12), // Max 12 for large companies
        roleDistribution: {
          decisionMakers: 2,
          champions: 2,
          stakeholders: 3,
          blockers: 2,
          introducers: 3
        }
      };
    }
  }
  
  /**
   * 🎭 Assign buyer group role based on job title
   */
  private static assignRole(title: string): BuyerGroupMember['role'] {
    if (!title) return 'Stakeholder';
    
    const titleLower = title.toLowerCase();
    
    // Decision Makers (C-level, VPs, Directors)
    if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('founder')) {
      return 'Decision Maker';
    }
    if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('director')) {
      return 'Decision Maker';
    }
    if (titleLower.includes('cfo') || titleLower.includes('cto') || titleLower.includes('cmo') || titleLower.includes('coo')) {
      return 'Decision Maker';
    }
    
    // Champions (Technical, Engineering, Operations)
    if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('architect')) {
      return 'Champion';
    }
    if (titleLower.includes('consultant') || titleLower.includes('advisor') || titleLower.includes('expert')) {
      return 'Champion';
    }
    if (titleLower.includes('project') && titleLower.includes('director')) {
      return 'Champion';
    }
    
    // Blockers (Legal, Compliance, Security, Procurement)
    if (titleLower.includes('legal') || titleLower.includes('compliance') || titleLower.includes('security')) {
      return 'Blocker';
    }
    if (titleLower.includes('procurement') || titleLower.includes('purchasing') || titleLower.includes('procurement')) {
      return 'Blocker';
    }
    
    // Introducers (Sales, Marketing, Business Development)
    if (titleLower.includes('sales') || titleLower.includes('marketing') || titleLower.includes('business development')) {
      return 'Introducer';
    }
    if (titleLower.includes('account') || titleLower.includes('relationship') || titleLower.includes('partnership')) {
      return 'Introducer';
    }
    
    // Default to Stakeholder
    return 'Stakeholder';
  }
  
  /**
   * 📊 Calculate influence score
   */
  private static calculateInfluence(person: any): 'high' | 'medium' | 'low' {
    const title = (person.title || person.jobTitle || '').toLowerCase();
    
    // High influence: C-level, VPs, Directors
    if (title.includes('ceo') || title.includes('president') || title.includes('vp') || title.includes('director')) {
      return 'high';
    }
    
    // Medium influence: Managers, Leads, Senior roles
    if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
      return 'medium';
    }
    
    // Low influence: Others
    return 'low';
  }
  
  /**
   * 📞 Assess contact quality
   */
  private static assessContactQuality(person: any): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;
    
    if (person.email) score += 2;
    if (person.phone) score += 1;
    if (person.linkedin) score += 1;
    if (person.lastActivity) score += 1;
    
    if (score >= 4) return 'excellent';
    if (score >= 3) return 'good';
    if (score >= 2) return 'fair';
    return 'poor';
  }
  
  /**
   * 🎯 Select optimal buyer group based on company size
   */
  private static selectOptimalBuyerGroup(
    peopleWithRoles: any[],
    companySize: CompanySize
  ): BuyerGroupMember[] {
    
    const selected: BuyerGroupMember[] = [];
    const roleCounts = {
      decisionMakers: 0,
      champions: 0,
      stakeholders: 0,
      blockers: 0,
      introducers: 0
    };
    
    // Sort people by priority (influence + contact quality + rank)
    const sortedPeople = peopleWithRoles.sort((a, b) => {
      const scoreA = this.calculateSelectionScore(a);
      const scoreB = this.calculateSelectionScore(b);
      return scoreB - scoreA;
    });
    
    // Select people based on role distribution
    for (const person of sortedPeople) {
      if (selected.length >= companySize.targetBuyerGroupSize) break;
      
      const role = person.role;
      const maxForRole = companySize.roleDistribution[role.toLowerCase().replace(' ', '') + 's' as keyof typeof companySize.roleDistribution];
      const currentCount = roleCounts[role.toLowerCase().replace(' ', '') + 's' as keyof typeof roleCounts];
      
      if (currentCount < maxForRole) {
        selected.push({
          id: person.id,
          fullName: person.fullName || person.name,
          title: person.title || person.jobTitle || '',
          email: person.email || '',
          phone: person.phone,
          role: person.role,
          influence: person.influence,
          isPrimary: selected.length === 0, // First person is primary
          company: person.company?.name || person.company || '',
          companyId: person.companyId || '',
          rank: person.rank,
          lastActivity: person.lastActivity,
          contactQuality: person.contactQuality
        });
        
        roleCounts[role.toLowerCase().replace(' ', '') + 's' as keyof typeof roleCounts]++;
      }
    }
    
    return selected;
  }
  
  /**
   * 🏆 Calculate selection score for prioritization
   */
  private static calculateSelectionScore(person: any): number {
    let score = 0;
    
    // Influence score
    if (person.influence === 'high') score += 10;
    else if (person.influence === 'medium') score += 5;
    else score += 1;
    
    // Contact quality
    if (person.contactQuality === 'excellent') score += 8;
    else if (person.contactQuality === 'good') score += 5;
    else if (person.contactQuality === 'fair') score += 2;
    
    // Rank (lower is better)
    score += (100 - (person.rank || 999));
    
    // Recent activity bonus
    if (person.lastActivity) score += 3;
    
    return score;
  }
  
  /**
   * 🎯 Ensure at least one Decision Maker
   */
  private static ensureDecisionMaker(
    buyerGroup: BuyerGroupMember[],
    allPeople: any[]
  ): BuyerGroupMember[] {
    
    const hasDecisionMaker = buyerGroup.some(person => person.role === 'Decision Maker');
    
    if (!hasDecisionMaker && allPeople.length > 0) {
      // Find the highest-ranking person and make them Decision Maker
      const sortedPeople = allPeople.sort((a, b) => (a.rank || 999) - (b.rank || 999));
      const topPerson = sortedPeople[0];
      
      if (topPerson) {
        // Replace the lowest-priority person in buyer group
        const lowestPriority = buyerGroup.sort((a, b) => a.rank - b.rank)[buyerGroup.length - 1];
        const index = buyerGroup.findIndex(p => p.id === lowestPriority.id);
        
        if (index !== -1) {
          buyerGroup[index] = {
            id: topPerson.id,
            fullName: topPerson.fullName || topPerson.name,
            title: topPerson.title || topPerson.jobTitle || '',
            email: topPerson.email || '',
            phone: topPerson.phone,
            role: 'Decision Maker',
            influence: 'high',
            isPrimary: true,
            company: topPerson.company?.name || topPerson.company || '',
            companyId: topPerson.companyId || '',
            rank: topPerson.rank || 1,
            lastActivity: topPerson.lastActivity,
            contactQuality: this.assessContactQuality(topPerson)
          };
        }
      }
    }
    
    return buyerGroup;
  }
  
  /**
   * 📊 Get role distribution for logging
   */
  private static getRoleDistribution(buyerGroup: BuyerGroupMember[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    buyerGroup.forEach(person => {
      distribution[person.role] = (distribution[person.role] || 0) + 1;
    });
    
    return distribution;
  }
}
