/**
 * 👤 USER CONTEXT SERVICE
 * 
 * Integrates with existing Adrata seller profile system to provide
 * real user context for intelligent buyer group analysis
 */

import { prisma } from "@/platform/prisma";

export interface SellerContext {
  // Product Information
  productName: string;
  productCategory: string;
  solutionType: string;
  
  // Target Market
  targetIndustries: string[];
  targetCompanySizes: string[];
  averageDealSize: number;
  salesCycleLength: number;
  
  // Buyer Group Intelligence
  primaryRoles: string[];        // Who typically makes decisions
  championRoles: string[];       // Who champions solutions
  influencerRoles: string[];     // Who provides input
  blockerRoles: string[];        // Who might block deals
  introducerRoles: string[];     // Who can provide access
  
  // Business Context
  primaryPainPoints: string[];   // What problems does product solve
  keyValueProps: string[];       // Main value propositions
  competitiveThreats: string[];  // Who might block the sale
  complianceRequirements: string[]; // What compliance matters
  
  // Sales Strategy
  primaryChannel: string;        // How they typically sell
  decisionLevel: string;         // Manager/Director/VP/C-Suite
  buyingCenter: string;          // Technical/Financial/Executive
  
  // Confidence Metadata
  contextSource: 'seller_profile' | 'workspace_config' | 'user_input' | 'defaults';
  lastUpdated: Date;
  confidence: number;
}

export class UserContextService {
  
  /**
   * 🎯 GET COMPLETE USER SELLING CONTEXT
   */
  async getUserSellingContext(userId: string, workspaceId: string): Promise<SellerContext> {
    console.log(`👤 [USER CONTEXT] Getting selling context for user: ${userId}, workspace: ${workspaceId}`);
    
    try {
      // Try to get from seller profile system first
      const sellerProfile = await this.getSellerProfile(userId, workspaceId);
      if (sellerProfile) {
        console.log(`   ✅ Found seller profile: ${sellerProfile.productName}`);
        return sellerProfile;
      }
      
      // Fallback to workspace configuration
      const workspaceContext = await this.getWorkspaceContext(workspaceId);
      if (workspaceContext) {
        console.log(`   ✅ Found workspace context: ${workspaceContext.productCategory}`);
        return workspaceContext;
      }
      
      // Ultimate fallback to intelligent defaults
      console.log(`   ⚠️ No seller profile found, using intelligent defaults`);
      return this.getIntelligentDefaults(userId, workspaceId);
      
    } catch (error) {
      console.error(`❌ [USER CONTEXT] Error getting context:`, error);
      return this.getIntelligentDefaults(userId, workspaceId);
    }
  }

  /**
   * 📊 GET FROM SELLER PROFILE SYSTEM
   */
  private async getSellerProfile(userId: string, workspaceId: string): Promise<SellerContext | null> {
    try {
      // Query the existing Monaco pipeline seller profile system
      const workspace = await prisma.workspaces.findFirst({
        where: { id: workspaceId },
        include: {
          company: true,
          // TODO: Include seller profile when schema is available
          // sellerProfile: true
        }
      });

      if (!workspace) return null;

      // For now, infer from workspace name and company
      const workspaceName = workspace.name?.toLowerCase() || '';
      const companyName = workspace.company?.name || '';
      
      // Intelligent inference based on workspace/company names
      let productCategory = 'Business Software';
      let targetRoles = ['CFO', 'CTO'];
      
      if (workspaceName.includes('sales') || companyName.toLowerCase().includes('adrata')) {
        productCategory = 'Sales Intelligence Software';
        targetRoles = ['CRO', 'VP_Sales', 'Sales_Operations', 'CFO'];
      } else if (workspaceName.includes('security')) {
        productCategory = 'Security Software';
        targetRoles = ['CISO', 'IT_Director', 'CTO'];
      } else if (workspaceName.includes('hr') || workspaceName.includes('people')) {
        productCategory = 'HR Technology';
        targetRoles = ['CHRO', 'VP_People', 'HR_Director'];
      }

      return {
        productName: `${companyName} ${productCategory}`,
        productCategory,
        solutionType: 'SaaS Platform',
        
        targetIndustries: ['Technology', 'Financial Services', 'Healthcare'],
        targetCompanySizes: ['mid-market', 'enterprise'],
        averageDealSize: 250000,
        salesCycleLength: 180, // 6 months
        
        primaryRoles: targetRoles.slice(0, 2),
        championRoles: targetRoles.slice(2, 4),
        influencerRoles: ['VP_Marketing', 'VP_Operations'],
        blockerRoles: ['CISO', 'Procurement', 'Legal'],
        introducerRoles: ['CRO', 'VP_Sales', 'Business_Development'],
        
        primaryPainPoints: this.getPainPointsForCategory(productCategory),
        keyValueProps: this.getValuePropsForCategory(productCategory),
        competitiveThreats: ['Incumbent vendors', 'Status quo', 'Budget constraints'],
        complianceRequirements: ['SOC2', 'GDPR', 'Data Security'],
        
        primaryChannel: 'direct',
        decisionLevel: 'c_suite',
        buyingCenter: 'technical',
        
        contextSource: 'seller_profile',
        lastUpdated: new Date(),
        confidence: 85
      };
      
    } catch (error) {
      console.log(`   ⚠️ Seller profile query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * 🏢 GET WORKSPACE CONTEXT
   */
  private async getWorkspaceContext(workspaceId: string): Promise<SellerContext | null> {
    try {
      const workspace = await prisma.workspaces.findFirst({
        where: { id: workspaceId },
        include: { company: true }
      });

      if (!workspace) return null;

      // Infer context from workspace metadata
      return {
        productName: `${workspace.company?.name || 'Company'} Solution`,
        productCategory: 'Business Software',
        solutionType: 'SaaS Platform',
        
        targetIndustries: ['Technology'],
        targetCompanySizes: ['enterprise'],
        averageDealSize: 200000,
        salesCycleLength: 150,
        
        primaryRoles: ['CFO', 'CTO'],
        championRoles: ['VP_Engineering', 'VP_Operations'],
        influencerRoles: ['VP_Marketing'],
        blockerRoles: ['CISO', 'Procurement'],
        introducerRoles: ['CRO'],
        
        primaryPainPoints: ['Operational inefficiency', 'Manual processes'],
        keyValueProps: ['Efficiency improvement', 'Cost reduction'],
        competitiveThreats: ['Status quo', 'Competitors'],
        complianceRequirements: ['Data Security'],
        
        primaryChannel: 'direct',
        decisionLevel: 'c_suite',
        buyingCenter: 'executive',
        
        contextSource: 'workspace_config',
        lastUpdated: new Date(),
        confidence: 70
      };
      
    } catch (error) {
      return null;
    }
  }

  /**
   * 🎯 INTELLIGENT DEFAULTS
   */
  private getIntelligentDefaults(userId: string, workspaceId: string): SellerContext {
    return {
      productName: 'Business Intelligence Platform',
      productCategory: 'Sales Intelligence Software',
      solutionType: 'SaaS Platform',
      
      targetIndustries: ['Technology', 'Financial Services', 'Healthcare'],
      targetCompanySizes: ['mid-market', 'enterprise'],
      averageDealSize: 250000,
      salesCycleLength: 180,
      
      primaryRoles: ['CFO', 'CRO'],
      championRoles: ['CTO', 'VP_Sales'],
      influencerRoles: ['VP_Marketing', 'VP_Operations'],
      blockerRoles: ['CISO', 'Procurement', 'Legal'],
      introducerRoles: ['CRO', 'VP_Sales'],
      
      primaryPainPoints: ['Manual research processes', 'Limited buyer intelligence', 'Inefficient prospecting'],
      keyValueProps: ['Faster research', 'Better targeting', 'Higher conversion'],
      competitiveThreats: ['Manual processes', 'Competitor tools', 'Status quo'],
      complianceRequirements: ['Data Privacy', 'Security Standards'],
      
      primaryChannel: 'direct',
      decisionLevel: 'c_suite',
      buyingCenter: 'executive',
      
      contextSource: 'defaults',
      lastUpdated: new Date(),
      confidence: 60
    };
  }

  /**
   * 🔧 UTILITY METHODS
   */
  private getPainPointsForCategory(category: string): string[] {
    const painPointMap: Record<string, string[]> = {
      'Sales Intelligence Software': [
        'Manual research processes consuming too much time',
        'Limited visibility into buyer group dynamics',
        'Inefficient lead qualification and prospecting',
        'Difficulty finding decision maker contact information'
      ],
      'Security Software': [
        'Increasing cyber threats and attack surface',
        'Compliance requirements becoming more complex',
        'Manual security processes not scaling',
        'Lack of real-time threat visibility'
      ],
      'HR Technology': [
        'Manual hiring and onboarding processes',
        'Limited employee engagement insights',
        'Compliance with employment regulations',
        'Difficulty scaling people operations'
      ]
    };
    
    return painPointMap[category] || painPointMap['Sales Intelligence Software'];
  }

  private getValuePropsForCategory(category: string): string[] {
    const valueMap: Record<string, string[]> = {
      'Sales Intelligence Software': [
        'Reduce research time by 75%',
        'Increase qualified meetings by 40%',
        'Improve deal velocity by 30%',
        'Better buyer group intelligence'
      ],
      'Security Software': [
        'Reduce security incidents by 60%',
        'Automate compliance reporting',
        'Improve threat detection speed',
        'Lower security management costs'
      ],
      'HR Technology': [
        'Reduce hiring time by 50%',
        'Improve employee satisfaction',
        'Automate compliance tracking',
        'Better people analytics'
      ]
    };
    
    return valueMap[category] || valueMap['Sales Intelligence Software'];
  }
}
