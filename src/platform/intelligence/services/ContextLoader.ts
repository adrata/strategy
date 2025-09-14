/**
 * 🧠 CONTEXT LOADER SERVICE
 * 
 * Loads comprehensive seller and business context for intelligence analysis
 * Step 1: Understand seller context (UserProfile + SellerProductPortfolio)
 */

import { prisma } from '@/platform/database/prisma-client';

export interface SellerContext {
  userId: string;
  workspaceId: string;
  
  // User Profile Context
  userProfile: {
    title?: string;
    department?: string;
    seniorityLevel?: string;
    territory?: string;
    quota?: number;
    currentQuotaAttainment?: number;
    ytdRevenue?: number;
    avgDealSize?: number;
    winRate?: number;
  } | null;
  
  // Product Portfolio Context
  productPortfolio: {
    productName: string;
    productCategory: string;
    description?: string;
    targetIndustries: string[];
    targetCompanySize: string[];
    primaryUseCases: string[];
    startingPrice?: number;
    averageDealSize?: number;
    maxDealSize?: number;
    typicalSalesCycle?: number;
    keyValueProps: string[];
    commonObjections: string[];
    competitorLandscape: string[];
    idealCustomerProfile?: string;
    buyingCommitteeRoles: string[];
    successMetrics: string[];
    winRateByIndustry?: any;
    winRateByCompanySize?: any;
  }[];
  
  // Context Status
  hasUserProfile: boolean;
  hasProductPortfolio: boolean;
  contextCompleteness: number; // 0-100
}

export interface AccountContext {
  existingAccounts: {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    totalValue: number;
    relationshipStage: string;
    lastActivity?: Date;
  }[];
  
  activeOpportunities: {
    id: string;
    accountId: string;
    accountName: string;
    amount?: number;
    stage: string;
    closeDate?: Date;
    contactCount: number;
  }[];
  
  // Discovery Status
  hasAccounts: boolean;
  needsAccountDiscovery: boolean;
  accountCount: number;
}

export interface IntelligenceContext {
  seller: SellerContext;
  accounts: AccountContext;
  loadedAt: Date;
  isComplete: boolean;
}

export class ContextLoader {
  
  /**
   * 🎯 MAIN ENTRY POINT - Load comprehensive context
   */
  static async loadIntelligenceContext(
    userId: string, 
    workspaceId: string
  ): Promise<IntelligenceContext> {
    
    console.log(`🧠 [CONTEXT] Loading intelligence context for user ${userId} in workspace ${workspaceId}`);
    
    // Step 1: Load seller context (UserProfile + SellerProductPortfolio)
    const sellerContext = await this.loadSellerContext(userId, workspaceId);
    
    // Step 2: Load account context (existing accounts + opportunities)
    const accountContext = await this.loadAccountContext(userId, workspaceId);
    
    // Step 3: Assess completeness
    const isComplete = sellerContext['hasUserProfile'] && 
                      sellerContext['hasProductPortfolio'] && 
                      accountContext.hasAccounts;
    
    const context: IntelligenceContext = {
      seller: sellerContext,
      accounts: accountContext,
      loadedAt: new Date(),
      isComplete
    };
    
    console.log(`✅ [CONTEXT] Context loaded - Complete: ${isComplete}, Products: ${sellerContext.productPortfolio.length}, Accounts: ${accountContext.accountCount}`);
    
    return context;
  }
  
  /**
   * 🛍️ Load seller context (UserProfile + SellerProductPortfolio)
   */
  private static async loadSellerContext(
    userId: string, 
    workspaceId: string
  ): Promise<SellerContext> {
    
    console.log(`🔍 [CONTEXT] Loading seller context - prisma available: ${!!prisma}`);
    
    if (!prisma) {
      throw new Error('Prisma client not available');
    }
    
    // Load UserProfile
    console.log(`🔍 [CONTEXT] Querying UserProfile for userId: ${userId}, workspaceId: ${workspaceId}`);
    const userProfile = await prisma.users.findFirst({
      where: {
        userId: userId,
        workspaceId
      }
    });
    
    // Load SellerProductPortfolio
    const productPortfolio = await prisma.sellerProductPortfolio.findMany({
      where: {
        sellerId: userId,
        workspaceId,
        isActive: true
      }
    });
    
    // Calculate context completeness
    let completeness = 0;
    if (userProfile) completeness += 50;
    if (productPortfolio.length > 0) completeness += 50;
    
    const context: SellerContext = {
      userId,
      workspaceId,
      userProfile: userProfile ? {
        title: userProfile.title || undefined,
        department: userProfile.department || undefined,
        seniorityLevel: userProfile.seniorityLevel || undefined,
        territory: userProfile.territory || undefined,
        quota: userProfile.quota ? Number(userProfile.quota) : undefined,
        currentQuotaAttainment: userProfile.currentQuotaAttainment ? Number(userProfile.currentQuotaAttainment) : undefined,
        ytdRevenue: userProfile.ytdRevenue ? Number(userProfile.ytdRevenue) : undefined,
        avgDealSize: userProfile.avgDealSize ? Number(userProfile.avgDealSize) : undefined,
        winRate: userProfile.winRate ? Number(userProfile.winRate) : undefined,
      } : null,
      productPortfolio: productPortfolio.map(product => ({
        productName: product.productName,
        productCategory: product.productCategory,
        description: product.description || undefined,
        targetIndustries: product.targetIndustries,
        targetCompanySize: product.targetCompanySize,
        primaryUseCases: product.primaryUseCases,
        startingPrice: product.startingPrice ? Number(product.startingPrice) : undefined,
        averageDealSize: product.averageDealSize ? Number(product.averageDealSize) : undefined,
        maxDealSize: product.maxDealSize ? Number(product.maxDealSize) : undefined,
        typicalSalesCycle: product.typicalSalesCycle || undefined,
        keyValueProps: product.keyValueProps,
        commonObjections: product.commonObjections,
        competitorLandscape: product.competitorLandscape,
        idealCustomerProfile: product.idealCustomerProfile || undefined,
        buyingCommitteeRoles: product.buyingCommitteeRoles,
        successMetrics: product.successMetrics,
        winRateByIndustry: product.winRateByIndustry || undefined,
        winRateByCompanySize: product.winRateByCompanySize || undefined,
      })),
      hasUserProfile: !!userProfile,
      hasProductPortfolio: productPortfolio.length > 0,
      contextCompleteness: completeness
    };
    
    console.log(`📊 [SELLER CONTEXT] Profile: ${!!userProfile}, Products: ${productPortfolio.length}, Completeness: ${completeness}%`);
    
    return context;
  }
  
  /**
   * 🏢 Load account context (existing accounts + opportunities)
   */
  private static async loadAccountContext(
    userId: string, 
    workspaceId: string
  ): Promise<AccountContext> {
    
    console.log(`🔍 [CONTEXT] Loading account context for userId: ${userId}, workspaceId: ${workspaceId}`);
    
    // Load existing accounts assigned to this user
    const accounts = await prisma.accounts.findMany({
      where: {
        workspaceId,
        assignedUserId: userId
      },
      orderBy: { updatedAt: 'desc' },
      take: 100 // Limit for performance
    });
    
    // Load active opportunities  
    const opportunities = await prisma.opportunities.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        stage: { notIn: ['closed-won', 'closed-lost'] }
      },
      orderBy: { amount: 'desc' }
    });
    
    const context: AccountContext = {
      existingAccounts: accounts.map(account => ({
        id: account.id,
        name: account.name,
        industry: undefined, // Add if field exists
        website: undefined, // Add if field exists
        totalValue: 0, // Simplified for now - would need to join with opportunities
        relationshipStage: 'prospect', // Simplified for now
        lastActivity: account.updatedAt
      })),
      activeOpportunities: opportunities.map(opp => ({
        id: opp.id,
        accountId: opp.accountId || '',
        accountName: 'Unknown', // We'll need to join with accounts later
        amount: opp.amount ? Number(opp.amount) : undefined,
        stage: opp.stage,
        closeDate: opp.expectedCloseDate || undefined,
        contactCount: 0 // Simplified for now
      })),
      hasAccounts: accounts.length > 0,
      needsAccountDiscovery: accounts['length'] === 0,
      accountCount: accounts.length
    };
    
    console.log(`🏢 [ACCOUNT CONTEXT] Accounts: ${accounts.length}, Opportunities: ${opportunities.length}, Needs Discovery: ${context.needsAccountDiscovery}`);
    
    return context;
  }
  
  /**
   * 🔍 Quick context validation
   */
  static validateContext(context: IntelligenceContext): {
    isValid: boolean;
    missingElements: string[];
    recommendations: string[];
  } {
    const missing: string[] = [];
    const recommendations: string[] = [];
    
    // Check seller context
    if (!context.seller.hasUserProfile) {
      missing.push('User Profile');
      recommendations.push('Complete user profile with territory and quota information');
    }
    
    if (!context.seller.hasProductPortfolio) {
      missing.push('Product Portfolio');
      recommendations.push('Add product/service portfolio with buyer committee roles');
    }
    
    // Check account context
    if (context.accounts.needsAccountDiscovery) {
      missing.push('Target Accounts');
      recommendations.push('Import or discover target accounts for intelligence analysis');
    }
    
    return {
      isValid: missing['length'] === 0,
      missingElements: missing,
      recommendations
    };
  }
}
