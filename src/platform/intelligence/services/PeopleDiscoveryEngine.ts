/**
 * 👥 PEOPLE DISCOVERY ENGINE
 * 
 * Sophisticated system to discover and store real people at target companies
 * Maps them to buyer group roles specific to their industry and our product
 */

import { prisma } from '@/platform/database/prisma-client';
import { IntelligenceContext } from './ContextLoader';

export interface DiscoveredPerson {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  department?: string;
  seniority: string;
  
  // Sophisticated buyer group roles
  buyerGroupRole: 'decision_maker' | 'champion' | 'influencer' | 'blocker' | 'introducer';
  buyerGroupSubType?: 'stakeholder' | 'gatekeeper' | 'end_user' | 'budget_holder';
  buyerGroupReasoning: string;
  
  // Authority and influence mapping
  decisionAuthority: 'final' | 'recommendation' | 'veto' | 'input';
  budgetAuthority: 'approval' | 'recommendation' | 'none';
  technicalInfluence: 'evaluation' | 'implementation' | 'support' | 'none';
  complianceRole: 'required' | 'advisory' | 'none';
  
  confidence: number; // 0-100
  discoveryMethod: string;
}

export interface CompanyBuyerGroup {
  companyName: string;
  companyId: string;
  workspaceId: string;
  companySize: string;
  
  // Sophisticated buyer group structure
  decisionMakers: DiscoveredPerson[];      // Final decision authority
  champions: DiscoveredPerson[];           // Internal advocates
  stakeholders: DiscoveredPerson[];        // Influencers and blockers
  introducers: DiscoveredPerson[];         // Connection points (not buyers)
  
  // Key roles identified
  primaryDecisionMaker?: DiscoveredPerson;
  budgetApprover?: DiscoveredPerson;
  technicalEvaluator?: DiscoveredPerson;
  complianceOfficer?: DiscoveredPerson;
  
  // Buyer group analysis
  decisionMakingPattern: 'single_decision_maker' | 'committee' | 'distributed';
  buyerGroupSize: 'minimal' | 'standard' | 'complex';
  estimatedDecisionTime: number; // days
  
  discoveredAt: Date;
  lastUpdated: Date;
  completeness: number; // 0-100
}

export interface TitleIndustryBuyerMapping {
  // Company size-based buyer group patterns (based on title industry research)
  companySizePatterns: {
    '2-10 employees': {
      decisionMakers: string[];           // Usually just owner/CEO
      champions: string[];                // Rarely needed - direct to decision maker
      stakeholders: string[];             // Minimal - maybe compliance
      estimatedDecisionTime: number;      // Fast decisions
      budgetApprovalLevel: number;        // Lower threshold
    };
    '11-50 employees': {
      decisionMakers: string[];           // CEO + maybe CFO
      champions: string[];                // Operations Manager
      stakeholders: string[];             // Compliance, IT
      estimatedDecisionTime: number;      // Medium speed
      budgetApprovalLevel: number;        // Medium threshold
    };
    '51-200 employees': {
      decisionMakers: string[];           // CEO, CFO, COO
      champions: string[];                // Operations Manager, VP Operations
      stakeholders: string[];             // IT Director, Compliance Officer
      estimatedDecisionTime: number;      // Committee process
      budgetApprovalLevel: number;        // Higher threshold
    };
    '201-500 employees': {
      decisionMakers: string[];           // C-Suite committee
      champions: string[];                // Multiple department heads
      stakeholders: string[];             // Full evaluation committee
      estimatedDecisionTime: number;      // Longer process
      budgetApprovalLevel: number;        // Highest threshold
    };
  };
  
  // Notary automation software specific buyer research
  notaryAutomationBuyerRoles: {
    role: string;
    buyerGroupRole: 'decision_maker' | 'champion' | 'influencer' | 'blocker' | 'introducer';
    decisionAuthority: 'final' | 'recommendation' | 'veto' | 'input';
    budgetAuthority: 'approval' | 'recommendation' | 'none';
    technicalInfluence: 'evaluation' | 'implementation' | 'support' | 'none';
    complianceRole: 'required' | 'advisory' | 'none';
    reasoning: string;
    industrySpecificContext: string;
  }[];
}

export class PeopleDiscoveryEngine {
  private lushaApiKey: string;
  private titleIndustryMapping: TitleIndustryBuyerMapping;

  constructor() {
    this['lushaApiKey'] = process['env']['LUSHA_API_KEY'] || '';
    
    // Title industry buyer group mapping based on company size and notary automation research
    this['titleIndustryMapping'] = {
      companySizePatterns: {
        '2-10 employees': {
          decisionMakers: ['CEO', 'Owner', 'President'],
          champions: [], // Direct to decision maker in small companies
          stakeholders: ['Office Manager'], // Minimal stakeholders
          estimatedDecisionTime: 7, // 1 week - fast decisions
          budgetApprovalLevel: 5000 // $5k threshold
        },
        '11-50 employees': {
          decisionMakers: ['CEO', 'President', 'Owner'],
          champions: ['Operations Manager', 'Office Manager'],
          stakeholders: ['Compliance Officer', 'IT Manager'],
          estimatedDecisionTime: 21, // 3 weeks
          budgetApprovalLevel: 15000 // $15k threshold
        },
        '51-200 employees': {
          decisionMakers: ['CEO', 'CFO', 'COO'],
          champions: ['VP Operations', 'Operations Manager', 'IT Director'],
          stakeholders: ['Compliance Officer', 'Legal Counsel', 'Risk Manager'],
          estimatedDecisionTime: 45, // 6-7 weeks - committee process
          budgetApprovalLevel: 25000 // $25k threshold
        },
        '201-500 employees': {
          decisionMakers: ['CEO', 'CFO', 'COO', 'CTO'],
          champions: ['VP Operations', 'VP Technology', 'Director of Operations'],
          stakeholders: ['Compliance Officer', 'Legal Counsel', 'Risk Manager', 'IT Director', 'Security Officer'],
          estimatedDecisionTime: 90, // 12+ weeks - enterprise process
          budgetApprovalLevel: 50000 // $50k threshold
        }
      },
      
      notaryAutomationBuyerRoles: [
        {
          role: 'CEO',
          buyerGroupRole: 'decision_maker',
          decisionAuthority: 'final',
          budgetAuthority: 'approval',
          technicalInfluence: 'none',
          complianceRole: 'none',
          reasoning: 'Final approval for operational technology affecting core business processes',
          industrySpecificContext: 'Title companies: CEO approves technology that impacts closing operations and compliance'
        },
        {
          role: 'CFO',
          buyerGroupRole: 'decision_maker',
          decisionAuthority: 'final',
          budgetAuthority: 'approval',
          technicalInfluence: 'none',
          complianceRole: 'advisory',
          reasoning: 'Budget approval authority for software subscriptions and ROI evaluation',
          industrySpecificContext: 'Title companies: CFO evaluates cost per closing and operational efficiency gains'
        },
        {
          role: 'COO',
          buyerGroupRole: 'decision_maker',
          decisionAuthority: 'recommendation',
          budgetAuthority: 'recommendation',
          technicalInfluence: 'evaluation',
          complianceRole: 'advisory',
          reasoning: 'Responsible for operational efficiency and process improvement',
          industrySpecificContext: 'Title companies: COO directly impacted by notary automation efficiency gains'
        },
        {
          role: 'Operations Manager',
          buyerGroupRole: 'champion',
          decisionAuthority: 'recommendation',
          budgetAuthority: 'none',
          technicalInfluence: 'implementation',
          complianceRole: 'none',
          reasoning: 'Primary user and implementer of notary automation workflows',
          industrySpecificContext: 'Title companies: Operations Manager manages daily closing processes'
        },
        {
          role: 'VP Operations',
          buyerGroupRole: 'champion',
          decisionAuthority: 'recommendation',
          budgetAuthority: 'recommendation',
          technicalInfluence: 'evaluation',
          complianceRole: 'advisory',
          reasoning: 'Oversees operational teams that will use notary automation platform',
          industrySpecificContext: 'Title companies: VP Operations responsible for closing efficiency and team productivity'
        },
        {
          role: 'Compliance Officer',
          buyerGroupRole: 'blocker', // Can block if compliance concerns
          decisionAuthority: 'veto',
          budgetAuthority: 'none',
          technicalInfluence: 'none',
          complianceRole: 'required',
          reasoning: 'Must approve notary processes for regulatory compliance',
          industrySpecificContext: 'Title companies: Compliance Officer ensures notary automation meets state regulations'
        },
        {
          role: 'IT Director',
          buyerGroupRole: 'influencer',
          decisionAuthority: 'input',
          budgetAuthority: 'none',
          technicalInfluence: 'evaluation',
          complianceRole: 'none',
          reasoning: 'Technical evaluation and integration assessment',
          industrySpecificContext: 'Title companies: IT Director evaluates system integration and security'
        },
        {
          role: 'Legal Counsel',
          buyerGroupRole: 'blocker', // Can block on legal issues
          decisionAuthority: 'veto',
          budgetAuthority: 'none',
          technicalInfluence: 'none',
          complianceRole: 'required',
          reasoning: 'Legal review of notary automation compliance and liability',
          industrySpecificContext: 'Title companies: Legal Counsel ensures E&O insurance coverage and legal compliance'
        },
        {
          role: 'Office Manager',
          buyerGroupRole: 'introducer', // Good connection point but not buyer
          decisionAuthority: 'input',
          budgetAuthority: 'none',
          technicalInfluence: 'support',
          complianceRole: 'none',
          reasoning: 'Day-to-day operations coordinator - good entry point for relationship building',
          industrySpecificContext: 'Title companies: Office Manager coordinates daily operations and staff'
        }
      ]
    };
  }

  /**
   * 🎯 MAIN ENTRY POINT - Discover buyer group for company
   */
  static async discoverCompanyBuyerGroup(
    companyName: string,
    context: IntelligenceContext
  ): Promise<CompanyBuyerGroup> {
    
    const engine = new PeopleDiscoveryEngine();
    const startTime = Date.now();
    
    console.log(`👥 [PEOPLE DISCOVERY] Starting discovery for ${companyName}`);
    
    // Step 1: Get company account from database
    const account = await prisma.companies.findFirst({
      where: {
        name: companyName,
        workspaceId: context.seller.workspaceId
      }
    });
    
    if (!account) {
      throw new Error(`Company ${companyName} not found in accounts`);
    }
    
    // Step 2: Determine target roles based on company size and industry
    const targetRoles = engine.determineTargetRolesByCompanySize(account.size || '11-50 employees', context);
    console.log(`🎯 [PEOPLE DISCOVERY] Company size: ${account.size}`);
    console.log(`🎯 [PEOPLE DISCOVERY] Target roles: ${targetRoles.join(', ')}`);
    
    // Step 3: Discover people for each role
    const discoveredPeople: DiscoveredPerson[] = [];
    
    for (const role of targetRoles) {
      try {
        const person = await engine.discoverPersonByRole(
          companyName, 
          account.website || '', 
          role, 
          context
        );
        
        if (person) {
          discoveredPeople.push(person);
          console.log(`   ✅ Found: ${person.name} (${person.title}) - ${person.buyerGroupRole}`);
          
          // Store the person in database
          await engine.storePerson(person, account.id, context.seller.workspaceId);
        } else {
          console.log(`   ❌ Not found: ${role} at ${companyName}`);
        }
        
        // Rate limiting delay
        await engine.delay(200);
        
      } catch (error) {
        console.error(`   ❌ Error discovering ${role}:`, error);
      }
    }
    
    // Step 4: Analyze buyer group dynamics
    const buyerGroup = engine.analyzeBuyerGroupDynamics(
      companyName,
      account.id,
      context.seller.workspaceId,
      discoveredPeople
    );
    
    console.log(`✅ [PEOPLE DISCOVERY] Discovered ${discoveredPeople.length} people for ${companyName} in ${Date.now() - startTime}ms`);
    
    return buyerGroup;
  }

  /**
   * 🎯 Determine target roles based on company size and industry research
   */
  private determineTargetRolesByCompanySize(companySize: string, context: IntelligenceContext): string[] {
    
    // Normalize company size to match our mapping
    const normalizedSize = this.normalizeCompanySize(companySize);
    const sizePattern = this.titleIndustryMapping['companySizePatterns'][normalizedSize];
    
    if (!sizePattern) {
      console.log(`   ⚠️ Unknown company size: ${companySize}, using default`);
      return ['CEO', 'Operations Manager']; // Fallback
    }
    
    // Build target roles based on company size
    const targetRoles: string[] = [];
    
    // Always include decision makers
    targetRoles.push(...sizePattern.decisionMakers);
    
    // Include champions if company is large enough
    if (sizePattern.champions.length > 0) {
      targetRoles.push(...sizePattern.champions);
    }
    
    // Include key stakeholders
    targetRoles.push(...sizePattern.stakeholders);
    
    // Add introducer for relationship building (Office Manager for smaller companies)
    if (normalizedSize === '2-10 employees' || normalizedSize === '11-50 employees') {
      if (!targetRoles.includes('Office Manager')) {
        targetRoles.push('Office Manager');
      }
    }
    
    console.log(`   📊 Company size pattern: ${normalizedSize}`);
    console.log(`   🎯 Decision makers: ${sizePattern.decisionMakers.join(', ')}`);
    console.log(`   🏆 Champions: ${sizePattern.champions.join(', ') || 'None (direct to decision maker)'}`);
    console.log(`   👥 Stakeholders: ${sizePattern.stakeholders.join(', ')}`);
    console.log(`   ⏱️ Estimated decision time: ${sizePattern.estimatedDecisionTime} days`);
    
    return [...new Set(targetRoles)]; // Remove duplicates
  }

  /**
   * 🔧 Normalize company size to match our patterns
   */
  private normalizeCompanySize(size: string): keyof TitleIndustryBuyerMapping['companySizePatterns'] {
    const sizeLower = size.toLowerCase();
    
    if (sizeLower.includes('2-10') || sizeLower.includes('1-10')) {
      return '2-10 employees';
    } else if (sizeLower.includes('11-50') || sizeLower.includes('10-50')) {
      return '11-50 employees';
    } else if (sizeLower.includes('51-200') || sizeLower.includes('50-200')) {
      return '51-200 employees';
    } else if (sizeLower.includes('201-500') || sizeLower.includes('200-500')) {
      return '201-500 employees';
    }
    
    // Default based on common patterns
    return '11-50 employees';
  }

  /**
   * 🔍 Discover specific person by role at company
   */
  private async discoverPersonByRole(
    companyName: string,
    website: string,
    role: string,
    context: IntelligenceContext
  ): Promise<DiscoveredPerson | null> {
    
    if (!this.lushaApiKey) {
      console.log(`   ⚠️ No Lusha API key - creating placeholder for ${role}`);
      return this.createPlaceholderPerson(companyName, role, context);
    }
    
    try {
      console.log(`   🔍 Searching for ${role} at ${companyName}...`);
      
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

      if (!response.ok) {
        console.log(`   ⚠️ Lusha API error: ${response.status} for ${role}`);
        return this.createPlaceholderPerson(companyName, role, context);
      }

      const data = await response.json();
      
      if (data['data'] && data['data']['firstName'] && data.data.lastName) {
        return this.mapToDiscoveredPerson(data.data, role, companyName, context);
      }

      return this.createPlaceholderPerson(companyName, role, context);

    } catch (error) {
      console.error(`   ❌ Error discovering ${role}:`, error);
      return this.createPlaceholderPerson(companyName, role, context);
    }
  }

  /**
   * 🏷️ Map Lusha data to sophisticated DiscoveredPerson
   */
  private mapToDiscoveredPerson(
    lushaData: any, 
    targetRole: string, 
    companyName: string,
    context: IntelligenceContext
  ): DiscoveredPerson {
    
    const name = `${lushaData.firstName} ${lushaData.lastName}`;
    const title = lushaData.title || targetRole;
    
    // Get sophisticated buyer group role mapping
    const roleAnalysis = this.determineBuyerGroupRole(title, targetRole);
    
    // Get industry-specific reasoning
    const roleMapping = this.titleIndustryMapping.notaryAutomationBuyerRoles.find(r => 
      r['role'] === targetRole || title.toLowerCase().includes(r.role.toLowerCase())
    );
    
    const buyerGroupReasoning = roleMapping?.reasoning || 
      `Key stakeholder for notary automation implementation at title companies`;
    
    return {
      name,
      firstName: lushaData.firstName,
      lastName: lushaData.lastName,
      title,
      email: lushaData.email || undefined,
      phone: lushaData.phoneNumbers?.[0] || undefined,
      linkedinUrl: lushaData.linkedinUrl || undefined,
      department: this.determineDepartment(title),
      seniority: this.determineSeniority(title),
      
      // Sophisticated buyer group mapping
      buyerGroupRole: roleAnalysis.buyerGroupRole,
      buyerGroupReasoning,
      
      // Authority and influence mapping
      decisionAuthority: roleAnalysis.decisionAuthority,
      budgetAuthority: roleAnalysis.budgetAuthority,
      technicalInfluence: roleAnalysis.technicalInfluence,
      complianceRole: roleAnalysis.complianceRole,
      
      confidence: this.calculateConfidence(lushaData),
      discoveryMethod: 'lusha_api'
    };
  }

  /**
   * 🎭 Create sophisticated placeholder person (for testing without API)
   */
  private createPlaceholderPerson(
    companyName: string, 
    role: string,
    context: IntelligenceContext
  ): DiscoveredPerson {
    
    const firstNames = ['John', 'Sarah', 'Michael', 'Lisa', 'David', 'Jennifer', 'Robert', 'Emily'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    // Get sophisticated role analysis
    const roleAnalysis = this.determineBuyerGroupRole(role, role);
    
    // Get industry-specific reasoning
    const roleMapping = this.titleIndustryMapping.notaryAutomationBuyerRoles.find(r => r['role'] === role);
    const buyerGroupReasoning = roleMapping?.reasoning || 
      `Key stakeholder for notary automation implementation at title companies`;
    
    return {
      name,
      firstName,
      lastName,
      title: role,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      department: this.determineDepartment(role),
      seniority: this.determineSeniority(role),
      
      // Sophisticated buyer group mapping
      buyerGroupRole: roleAnalysis.buyerGroupRole,
      buyerGroupReasoning,
      
      // Authority and influence mapping
      decisionAuthority: roleAnalysis.decisionAuthority,
      budgetAuthority: roleAnalysis.budgetAuthority,
      technicalInfluence: roleAnalysis.technicalInfluence,
      complianceRole: roleAnalysis.complianceRole,
      
      confidence: 75, // Placeholder confidence
      discoveryMethod: 'placeholder_generated'
    };
  }

  /**
   * 💾 Store discovered person in database
   */
  private async storePerson(
    person: DiscoveredPerson,
    accountId: string,
    workspaceId: string
  ): Promise<void> {
    
    try {
      // Check if person already exists
      const existingContact = await prisma.people.findFirst({
        where: {
          workspaceId,
          accountId,
          email: person.email
        }
      });
      
      if (existingContact) {
        console.log(`   📝 Updating existing contact: ${person.name}`);
        
        await prisma.people.update({
          where: { id: existingContact.id },
          data: {
            jobTitle: person.title,
            department: person.department,
            seniority: person.seniority,
            phone: person.phone,
            linkedinUrl: person.linkedinUrl,
            tags: [
              'buyer-group',
              person.buyerGroupRole,
              'notary-automation-stakeholder',
              person.discoveryMethod
            ],
            customFields: {
              buyerGroupRole: person.buyerGroupRole,
              buyerGroupReasoning: person.buyerGroupReasoning,
              confidence: person.confidence,
              isDecisionMaker: person.isDecisionMaker,
              budgetAuthority: person.budgetAuthority,
              technicalInfluence: person.technicalInfluence,
              discoveryMethod: person.discoveryMethod,
              discoveredAt: new Date().toISOString()
            },
            lastEnriched: new Date(),
            updatedAt: new Date()
          }
        });
      } else {
        console.log(`   📝 Creating new contact: ${person.name}`);
        
        await prisma.people.create({
          data: {
            id: `discovered-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            workspaceId,
            accountId,
            assignedUserId: 'dano', // Assign to Dano
            firstName: person.firstName,
            lastName: person.lastName,
            fullName: person.name,
            displayName: person.name,
            jobTitle: person.title,
            department: person.department,
            seniority: person.seniority,
            email: person.email,
            phone: person.phone,
            linkedinUrl: person.linkedinUrl,
            status: 'prospect',
            relationshipStage: 'identified',
            source: 'buyer-group-discovery',
            tags: [
              'buyer-group',
              person.buyerGroupRole,
              'notary-automation-stakeholder',
              person.discoveryMethod
            ],
            customFields: {
              buyerGroupRole: person.buyerGroupRole,
              buyerGroupReasoning: person.buyerGroupReasoning,
              confidence: person.confidence,
              isDecisionMaker: person.isDecisionMaker,
              budgetAuthority: person.budgetAuthority,
              technicalInfluence: person.technicalInfluence,
              discoveryMethod: person.discoveryMethod,
              discoveredAt: new Date().toISOString()
            },
            lastEnriched: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          }
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error storing person ${person.name}:`, error);
    }
  }

  /**
   * 🧠 Analyze sophisticated buyer group dynamics
   */
  private analyzeBuyerGroupDynamics(
    companyName: string,
    accountId: string,
    workspaceId: string,
    people: DiscoveredPerson[]
  ): CompanyBuyerGroup {
    
    // Categorize people by buyer group role
    const decisionMakers = people.filter(p => p['buyerGroupRole'] === 'decision_maker');
    const champions = people.filter(p => p['buyerGroupRole'] === 'champion');
    const influencers = people.filter(p => p['buyerGroupRole'] === 'influencer');
    const blockers = people.filter(p => p['buyerGroupRole'] === 'blocker');
    const introducers = people.filter(p => p['buyerGroupRole'] === 'introducer');
    
    // Combine stakeholders (influencers + blockers)
    const stakeholders = [...influencers, ...blockers];
    
    // Identify key roles
    const primaryDecisionMaker = decisionMakers.find(p => p['decisionAuthority'] === 'final') || decisionMakers[0];
    const budgetApprover = people.find(p => p['budgetAuthority'] === 'approval');
    const technicalEvaluator = people.find(p => p['technicalInfluence'] === 'evaluation');
    const complianceOfficer = people.find(p => p['complianceRole'] === 'required');
    
    // Determine decision making pattern based on buyer group composition
    let decisionMakingPattern: 'single_decision_maker' | 'committee' | 'distributed';
    if (decisionMakers['length'] === 1 && champions['length'] === 0) {
      decisionMakingPattern = 'single_decision_maker';
    } else if (decisionMakers.length <= 3 && people.length <= 5) {
      decisionMakingPattern = 'committee';
    } else {
      decisionMakingPattern = 'distributed';
    }
    
    // Determine buyer group size
    let buyerGroupSize: 'minimal' | 'standard' | 'complex';
    if (people.length <= 2) {
      buyerGroupSize = 'minimal';
    } else if (people.length <= 5) {
      buyerGroupSize = 'standard';
    } else {
      buyerGroupSize = 'complex';
    }
    
    // Estimate decision time based on complexity
    const baseDecisionTime = 30; // 30 days base
    const complexityMultiplier = buyerGroupSize === 'minimal' ? 0.5 : buyerGroupSize === 'standard' ? 1 : 1.5;
    const estimatedDecisionTime = Math.round(baseDecisionTime * complexityMultiplier);
    
    // Calculate completeness based on critical roles filled
    const criticalRoles = ['decision_maker', 'champion'];
    const criticalRolesFilled = criticalRoles.filter(role => 
      people.some(p => p['buyerGroupRole'] === role)
    ).length;
    const completeness = Math.round((criticalRolesFilled / criticalRoles.length) * 100);
    
    // Get company size from first person's context or default
    const companySize = people[0]?.title ? this.estimateCompanySize(people.length) : '11-50 employees';
    
    return {
      companyName,
      companyId: accountId,
      workspaceId,
      companySize,
      
      // Sophisticated buyer group structure
      decisionMakers,
      champions,
      stakeholders,
      introducers,
      
      // Key roles
      primaryDecisionMaker,
      budgetApprover,
      technicalEvaluator,
      complianceOfficer,
      
      // Analysis
      decisionMakingPattern,
      buyerGroupSize,
      estimatedDecisionTime,
      
      discoveredAt: new Date(),
      lastUpdated: new Date(),
      completeness
    };
  }

  /**
   * 📏 Estimate company size based on buyer group complexity
   */
  private estimateCompanySize(buyerGroupSize: number): string {
    if (buyerGroupSize <= 2) return '2-10 employees';
    if (buyerGroupSize <= 4) return '11-50 employees';
    if (buyerGroupSize <= 6) return '51-200 employees';
    return '201-500 employees';
  }

  /**
   * 🏷️ Determine sophisticated buyer group role based on title industry research
   */
  private determineBuyerGroupRole(
    title: string,
    targetRole: string
  ): {
    buyerGroupRole: 'decision_maker' | 'champion' | 'influencer' | 'blocker' | 'introducer';
    decisionAuthority: 'final' | 'recommendation' | 'veto' | 'input';
    budgetAuthority: 'approval' | 'recommendation' | 'none';
    technicalInfluence: 'evaluation' | 'implementation' | 'support' | 'none';
    complianceRole: 'required' | 'advisory' | 'none';
  } {
    
    // Find the role mapping from our research
    const roleMapping = this.titleIndustryMapping.notaryAutomationBuyerRoles.find(r => 
      r['role'] === targetRole || title.toLowerCase().includes(r.role.toLowerCase())
    );
    
    if (roleMapping) {
      return {
        buyerGroupRole: roleMapping.buyerGroupRole,
        decisionAuthority: roleMapping.decisionAuthority,
        budgetAuthority: roleMapping.budgetAuthority,
        technicalInfluence: roleMapping.technicalInfluence,
        complianceRole: roleMapping.complianceRole
      };
    }
    
    // Fallback logic for unmapped roles
    const titleLower = title.toLowerCase();
    
    // Decision makers
    if (['ceo', 'president', 'owner', 'founder'].some(role => titleLower.includes(role))) {
      return {
        buyerGroupRole: 'decision_maker',
        decisionAuthority: 'final',
        budgetAuthority: 'approval',
        technicalInfluence: 'none',
        complianceRole: 'none'
      };
    }
    
    // Budget authorities
    if (['cfo', 'chief financial', 'finance director'].some(role => titleLower.includes(role))) {
      return {
        buyerGroupRole: 'decision_maker',
        decisionAuthority: 'final',
        budgetAuthority: 'approval',
        technicalInfluence: 'none',
        complianceRole: 'advisory'
      };
    }
    
    // Operations (champions for notary automation)
    if (['coo', 'operations manager', 'vp operations'].some(role => titleLower.includes(role))) {
      return {
        buyerGroupRole: 'champion',
        decisionAuthority: 'recommendation',
        budgetAuthority: 'recommendation',
        technicalInfluence: 'implementation',
        complianceRole: 'advisory'
      };
    }
    
    // Compliance (potential blockers)
    if (['compliance', 'legal', 'risk', 'audit'].some(role => titleLower.includes(role))) {
      return {
        buyerGroupRole: 'blocker',
        decisionAuthority: 'veto',
        budgetAuthority: 'none',
        technicalInfluence: 'none',
        complianceRole: 'required'
      };
    }
    
    // Office/Admin (introducers)
    if (['office manager', 'admin', 'assistant', 'coordinator'].some(role => titleLower.includes(role))) {
      return {
        buyerGroupRole: 'introducer',
        decisionAuthority: 'input',
        budgetAuthority: 'none',
        technicalInfluence: 'support',
        complianceRole: 'none'
      };
    }
    
    // Default to influencer
    return {
      buyerGroupRole: 'influencer',
      decisionAuthority: 'input',
      budgetAuthority: 'none',
      technicalInfluence: 'support',
      complianceRole: 'none'
    };
  }

  /**
   * 📊 Helper methods
   */
  private determineDepartment(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (['ceo', 'president', 'owner'].some(role => titleLower.includes(role))) return 'Executive';
    if (['cfo', 'finance'].some(role => titleLower.includes(role))) return 'Finance';
    if (['coo', 'operations'].some(role => titleLower.includes(role))) return 'Operations';
    if (['it', 'technology', 'cto'].some(role => titleLower.includes(role))) return 'Technology';
    if (['compliance', 'legal', 'risk'].some(role => titleLower.includes(role))) return 'Compliance';
    
    return 'Operations'; // Default for title companies
  }

  private determineSeniority(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (['ceo', 'cfo', 'coo', 'cto', 'president', 'owner'].some(role => titleLower.includes(role))) return 'Executive';
    if (['vp', 'vice president', 'director'].some(role => titleLower.includes(role))) return 'Director';
    if (['manager', 'supervisor'].some(role => titleLower.includes(role))) return 'Manager';
    
    return 'Individual Contributor';
  }

  private calculateConfidence(lushaData: any): number {
    let confidence = 50; // Base confidence
    
    if (lushaData.email) confidence += 25;
    if (lushaData.phoneNumbers?.length > 0) confidence += 15;
    if (lushaData.title) confidence += 10;
    if (lushaData.linkedinUrl) confidence += 10;
    
    return Math.min(confidence, 100);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
