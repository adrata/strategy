/**
 * 🏢 WORKSPACE PROFILE SERVICE
 * 
 * Manages workspace selling profiles for dynamic buyer group intelligence
 */

import { prisma } from "@/platform/prisma";

export interface WorkspaceSellingProfile {
  workspaceId: string;
  companyName: string;
  
  // Product/Service Information
  productName: string;
  productCategory: string;
  businessModel: string;
  
  // Target Market
  targetIndustries: string[];
  targetCompanySizes: string[];
  averageDealSize: number;
  salesCycleLength: number; // days
  
  // Buyer Group Intelligence
  primaryTargetRoles: string[];
  secondaryTargetRoles: string[];
  championRoles: string[];
  blockerRoles: string[];
  introducerRoles: string[];
  
  // Sales Context
  keyValueProps: string[];
  primaryPainPoints: string[];
  competitiveThreats: string[];
  decisionFactors: string[];
  
  // Seller Information
  sellerSkillLevel: 'junior' | 'mid' | 'senior' | 'expert';
  sellingStyle: string;
  territory: string;
  
  // Metadata
  lastUpdated: Date;
  confidence: number;
  source: 'manual' | 'auto_detected' | 'ai_generated';
}

export class WorkspaceProfileService {
  
  /**
   * 🎯 GET WORKSPACE SELLING PROFILE (MULTI-WORKSPACE AWARE)
   */
  async getWorkspaceProfile(workspaceId: string, userId: string): Promise<WorkspaceSellingProfile> {
    console.log(`🏢 [WORKSPACE PROFILE] Getting profile for workspace: ${workspaceId}, user: ${userId}`);
    
    try {
      // Check if this is a multi-workspace seller (like Dano)
      const userWorkspaces = await this.getUserWorkspaces(userId);
      console.log(`   👤 User has ${userWorkspaces.length} workspaces`);
      
      if (userWorkspaces.length > 1) {
        console.log(`   🔄 Multi-workspace seller detected: ${userWorkspaces.map(w => w.name).join(', ')}`);
      }
      
      // Try to get existing profile for this specific workspace
      const existingProfile = await this.getStoredProfile(workspaceId);
      if (existingProfile) {
        console.log(`   ✅ Found existing profile: ${existingProfile.productName}`);
        return existingProfile;
      }
      
      // Auto-detect profile from workspace data with multi-workspace intelligence
      const detectedProfile = await this.autoDetectProfile(workspaceId, userId, userWorkspaces);
      
      // Save the detected profile
      await this.saveProfile(detectedProfile);
      
      console.log(`   ✅ Auto-detected profile: ${detectedProfile.productName}`);
      return detectedProfile;
      
    } catch (error) {
      console.error(`❌ [WORKSPACE PROFILE] Error:`, error);
      return this.getDefaultProfile(workspaceId);
    }
  }

  /**
   * 👤 GET USER WORKSPACES
   */
  private async getUserWorkspaces(userId: string): Promise<any[]> {
    try {
      const workspaceUsers = await prisma.workspace_users.findMany({
        where: { userId },
        include: {
          workspace: {
            include: { company: true }
          }
        }
      });

      return workspaceUsers.map(wu => ({
        id: wu.workspace.id,
        name: wu.workspace.name,
        slug: wu.workspace.slug,
        company: wu.workspace.company?.name
      }));
    } catch (error) {
      console.error(`   ❌ Failed to get user workspaces:`, error);
      return [];
    }
  }

  /**
   * 📊 AUTO-DETECT PROFILE FROM WORKSPACE DATA (MULTI-WORKSPACE INTELLIGENT)
   */
  private async autoDetectProfile(workspaceId: string, userId: string, userWorkspaces: any[] = []): Promise<WorkspaceSellingProfile> {
    // Get workspace and user data
    const workspace = await prisma.workspaces.findFirst({
      where: { id: workspaceId },
      include: { company: true }
    });

    const user = await prisma.users.findFirst({
      where: { id: userId }
    });

    // Get opportunity data to understand what they sell
    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId, assignedUserId: userId , deletedAt: null},
      take: 50
    });

    // Get account data to understand target market
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId, assignedUserId: userId , deletedAt: null},
      take: 100
    });

    // MULTI-WORKSPACE INTELLIGENCE: Detect specific workspace context
    const workspaceName = workspace?.name?.toLowerCase() || '';
    const companyName = workspace?.company?.name?.toLowerCase() || '';
    const workspaceSlug = workspace?.slug?.toLowerCase() || '';
    
    // Dano's Notary Everyday profile
    if (userId === 'dano' && (
        companyName.includes('notary') || 
        workspaceName.includes('notary') ||
        workspaceSlug.includes('notary')
      )) {
      
      console.log(`   🏢 Detected Dano's Notary Everyday workspace: ${workspace?.name}`);
      
      return {
        workspaceId,
        companyName: 'Notary Everyday',
        
        productName: 'Notary Management Platform',
        productCategory: 'Legal Technology',
        businessModel: 'SaaS Platform for Legal Services',
        
        targetIndustries: ['Title Companies', 'Legal Services', 'Real Estate', 'Financial Services', 'Mortgage Lenders'],
        targetCompanySizes: ['small', 'mid-market', 'enterprise'],
        averageDealSize: 75000,
        salesCycleLength: 120, // 4 months
        
        primaryTargetRoles: [
          'COO',              // Operations leaders (primary decision makers for process tools)
          'General_Counsel',  // Legal compliance (critical for legal tech)
          'VP_Operations',    // Day-to-day operations management
          'Operations_Director' // Process improvement leaders
        ],
        secondaryTargetRoles: [
          'CFO',              // Budget authority for $75K deals
          'President',        // Small company decision makers
          'Managing_Partner'  // Law firm structure
        ],
        championRoles: [
          'Operations_Manager',
          'Compliance_Manager', 
          'Process_Manager',
          'Quality_Manager'
        ],
        blockerRoles: [
          'IT_Director',      // Technology integration concerns
          'Compliance_Officer', // Regulatory requirements
          'Legal_Counsel',    // Contract and liability concerns
          'Risk_Manager'      // Operational risk assessment
        ],
        introducerRoles: [
          'Business_Development',
          'Account_Manager',
          'Relationship_Manager'
        ],
        
        keyValueProps: [
          'Streamlined notary scheduling and management',
          'Compliance automation and audit trails',
          'Cost reduction through process efficiency',
          'Risk mitigation and accuracy improvement',
          'Real-time visibility into signing operations'
        ],
        primaryPainPoints: [
          'Manual notary scheduling processes',
          'Compliance tracking and audit challenges', 
          'Inefficient communication between parties',
          'Quality control and error reduction needs',
          'Scaling operations without adding overhead'
        ],
        competitiveThreats: [
          'Manual processes and status quo',
          'In-house developed solutions',
          'Larger legal technology platforms',
          'Cost concerns and budget constraints'
        ],
        decisionFactors: [
          'ROI and cost savings demonstration',
          'Compliance and regulatory adherence',
          'Integration with existing systems',
          'Training and adoption requirements',
          'Security and data protection'
        ],
        
        sellerSkillLevel: 'expert',
        sellingStyle: 'Consultative relationship-building',
        territory: 'National (US focus)',
        
        lastUpdated: new Date(),
        confidence: 95,
        source: 'ai_generated'
      };
    }

    // Dano's Retail Product Solutions profile  
    if (userId === 'dano' && (
        companyName.includes('retail') || 
        workspaceName.includes('retail') ||
        workspaceSlug.includes('retail') ||
        companyName.includes('product') ||
        workspaceName.includes('fixtures')
      )) {
      
      console.log(`   🏪 Detected Dano's Retail Product Solutions workspace: ${workspace?.name}`);
      
      return {
        workspaceId,
        companyName: 'Retail Product Solutions',
        
        productName: 'Store Fixtures & Equipment',
        productCategory: 'Retail Equipment',
        businessModel: 'Capital Equipment Sales',
        
        targetIndustries: ['Retail', 'Convenience Stores', 'Grocery', 'Gas Stations', 'Restaurant'],
        targetCompanySizes: ['small', 'mid-market', 'enterprise'],
        averageDealSize: 500000,
        salesCycleLength: 180, // 6 months
        
        primaryTargetRoles: [
          'COO',                    // Operations leaders (primary for store equipment)
          'VP_Operations',          // Store operations management
          'Director_Operations',    // Day-to-day store operations
          'Facilities_Manager'      // Store development and maintenance
        ],
        secondaryTargetRoles: [
          'CFO',                    // Budget authority for capital equipment
          'President',              // Small company decision makers
          'VP_Real_Estate',         // Store development
          'Construction_Manager'    // Store buildouts
        ],
        championRoles: [
          'Store_Development_Manager',
          'Real_Estate_Director',
          'Construction_Manager',
          'Facilities_Director'
        ],
        blockerRoles: [
          'Procurement',            // Vendor management
          'Legal',                  // Contract terms
          'Finance_Director',       // Budget constraints
          'Regional_Manager'        // Regional approval
        ],
        introducerRoles: [
          'Account_Manager',
          'Business_Development',
          'Regional_Sales_Manager'
        ],
        
        keyValueProps: [
          'Store efficiency and customer flow optimization',
          'Reduced maintenance costs and downtime',
          'Enhanced customer experience and sales',
          'Energy efficiency and cost savings',
          'Faster store rollouts and renovations'
        ],
        primaryPainPoints: [
          'Outdated store fixtures reducing efficiency',
          'High maintenance costs on old equipment',
          'Poor customer flow and shopping experience',
          'Energy inefficiency driving up costs',
          'Slow store renovation and rollout processes'
        ],
        competitiveThreats: [
          'Existing fixture suppliers and relationships',
          'In-house maintenance and construction teams',
          'Budget constraints and capital allocation',
          'Status quo and resistance to change'
        ],
        decisionFactors: [
          'ROI and payback period demonstration',
          'Total cost of ownership analysis',
          'Installation timeline and disruption',
          'Maintenance and support capabilities',
          'References from similar retailers'
        ],
        
        sellerSkillLevel: 'expert',
        sellingStyle: 'Relationship-building with technical expertise',
        territory: 'Midwest US (Wisconsin, Illinois, Minnesota)',
        
        lastUpdated: new Date(),
        confidence: 95,
        source: 'ai_generated'
      };
    }

    // Auto-detect from workspace data
    const workspaceNameLower = workspace?.name?.toLowerCase() || '';
    const companyNameFromWS = workspace?.company?.name || '';
    
    // Analyze opportunities to understand product
    const productAnalysis = this.analyzeOpportunityData(opportunities);
    const targetMarketAnalysis = this.analyzeAccountData(accounts);
    
    return {
      workspaceId,
      companyName: companyName || 'Unknown Company',
      
      productName: productAnalysis.productName || 'Business Solution',
      productCategory: productAnalysis.category || 'Business Software',
      businessModel: productAnalysis.businessModel || 'SaaS Platform',
      
      targetIndustries: targetMarketAnalysis.industries || ['Technology'],
      targetCompanySizes: targetMarketAnalysis.companySizes || ['enterprise'],
      averageDealSize: productAnalysis.averageDealSize || 250000,
      salesCycleLength: 180,
      
      primaryTargetRoles: ['CFO', 'CTO'],
      secondaryTargetRoles: ['CEO', 'COO'],
      championRoles: ['VP_Engineering', 'VP_Operations'],
      blockerRoles: ['CISO', 'Procurement'],
      introducerRoles: ['CRO', 'VP_Sales'],
      
      keyValueProps: ['Efficiency improvement', 'Cost reduction', 'Process automation'],
      primaryPainPoints: ['Manual processes', 'Operational inefficiency'],
      competitiveThreats: ['Status quo', 'Competitor solutions'],
      decisionFactors: ['ROI', 'Technical fit', 'Security'],
      
      sellerSkillLevel: 'senior',
      sellingStyle: 'Consultative',
      territory: 'Unknown',
      
      lastUpdated: new Date(),
      confidence: 70,
      source: 'auto_detected'
    };
  }

  /**
   * 💾 SAVE PROFILE TO DATABASE
   */
  private async saveProfile(profile: WorkspaceSellingProfile): Promise<void> {
    try {
      // For now, save to workspace notes field
      // TODO: Create proper workspace_profile table
      await prisma.workspace.update({
        where: { id: profile.workspaceId },
        data: {
          notes: JSON.stringify({
            sellingProfile: profile,
            lastUpdated: new Date().toISOString()
          })
        }
      });
      
      console.log(`   💾 Saved profile for workspace: ${profile.workspaceId}`);
    } catch (error) {
      console.error(`   ❌ Failed to save profile:`, error);
    }
  }

  /**
   * 📖 GET STORED PROFILE
   */
  private async getStoredProfile(workspaceId: string): Promise<WorkspaceSellingProfile | null> {
    try {
      const workspace = await prisma.workspaces.findFirst({
        where: { id: workspaceId }
      });

      if (workspace?.notes) {
        try {
          const parsed = JSON.parse(workspace.notes);
          if (parsed.sellingProfile) {
            return {
              ...parsed.sellingProfile,
              lastUpdated: new Date(parsed.sellingProfile.lastUpdated)
            };
          }
        } catch (parseError) {
          console.log(`   ⚠️ Failed to parse workspace notes as profile`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Failed to get stored profile:`, error);
    }
    
    return null;
  }

  /**
   * 📊 ANALYZE OPPORTUNITY DATA
   */
  private analyzeOpportunityData(opportunities: any[]): {
    productName: string;
    category: string;
    businessModel: string;
    averageDealSize: number;
  } {
    if (opportunities['length'] === 0) {
      return {
        productName: 'Business Solution',
        category: 'Business Software',
        businessModel: 'SaaS Platform',
        averageDealSize: 100000
      };
    }

    // Analyze opportunity names and descriptions
    const oppText = opportunities
      .map(opp => `${opp.name || ''} ${opp.description || ''}`)
      .join(' ')
      .toLowerCase();

    let category = 'Business Software';
    let businessModel = 'SaaS Platform';
    
    if (oppText.includes('notary') || oppText.includes('signing') || oppText.includes('legal')) {
      category = 'Legal Technology';
      businessModel = 'Legal Services Platform';
    } else if (oppText.includes('software') || oppText.includes('platform')) {
      category = 'Software';
      businessModel = 'SaaS Platform';
    }

    // Calculate average deal size
    const dealSizes = opportunities
      .map(opp => opp.amount || 0)
      .filter(amount => amount > 0);
    
    const averageDealSize = dealSizes.length > 0 
      ? dealSizes.reduce((sum, amount) => sum + amount, 0) / dealSizes.length
      : 100000;

    return {
      productName: category === 'Legal Technology' ? 'Notary Management Platform' : 'Business Platform',
      category,
      businessModel,
      averageDealSize
    };
  }

  /**
   * 🎯 ANALYZE ACCOUNT DATA
   */
  private analyzeAccountData(accounts: any[]): {
    industries: string[];
    companySizes: string[];
  } {
    const industries = new Set<string>();
    const companySizes = new Set<string>();

    accounts.forEach(account => {
      if (account.industry) industries.add(account.industry);
      if (account.size) companySizes.add(account.size);
    });

    return {
      industries: Array.from(industries),
      companySizes: Array.from(companySizes)
    };
  }

  /**
   * 🔧 GET DEFAULT PROFILE
   */
  private getDefaultProfile(workspaceId: string): WorkspaceSellingProfile {
    return {
      workspaceId,
      companyName: 'Unknown Company',
      
      productName: 'Business Solution',
      productCategory: 'Business Software',
      businessModel: 'SaaS Platform',
      
      targetIndustries: ['Technology'],
      targetCompanySizes: ['enterprise'],
      averageDealSize: 250000,
      salesCycleLength: 180,
      
      primaryTargetRoles: ['CFO', 'CTO'],
      secondaryTargetRoles: ['CEO', 'COO'],
      championRoles: ['VP_Operations'],
      blockerRoles: ['CISO'],
      introducerRoles: ['CRO'],
      
      keyValueProps: ['Efficiency', 'Cost savings'],
      primaryPainPoints: ['Manual processes'],
      competitiveThreats: ['Status quo'],
      decisionFactors: ['ROI', 'Technical fit'],
      
      sellerSkillLevel: 'senior',
      sellingStyle: 'Consultative',
      territory: 'Unknown',
      
      lastUpdated: new Date(),
      confidence: 50,
      source: 'manual'
    };
  }
}
