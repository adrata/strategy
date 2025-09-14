/**
 * 🏦 ADRATA CREDIT SYSTEM
 * 
 * Manages user credits with premium pricing over CoreSignal costs:
 * - Tracks user credit balances and usage
 * - Applies premium pricing (2x-3x markup over CoreSignal)
 * - Provides credit estimation and validation
 * - Handles credit deduction and refunds
 */

export interface CreditTransaction {
  id: string;
  userId: string;
  workspaceId: string;
  type: 'debit' | 'credit' | 'refund';
  amount: number;
  description: string;
  metadata?: {
    coreSignalCost?: number;
    markup?: number;
    apiEndpoint?: string;
    requestId?: string;
  };
  createdAt: string;
}

export interface UserCreditBalance {
  userId: string;
  workspaceId: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  lastUpdated: string;
}

export interface CreditEstimate {
  estimatedCredits: number;
  coreSignalCost: number;
  adrataMarkup: number;
  breakdown: {
    baseApiCalls: number;
    roleSearches: number;
    enrichmentCalls: number;
    premiumFeatures: number;
  };
}

export class AdrataCreditSystem {
  
  // Premium pricing multipliers over CoreSignal costs
  private static readonly PRICING_MULTIPLIERS = {
    PERSON_SEARCH: 2.5,        // 2.5x markup on person searches
    COMPANY_SEARCH: 2.0,       // 2x markup on company searches  
    ROLE_FINDER: 3.0,          // 3x markup on role-specific searches
    BULK_ENRICHMENT: 2.2,      // 2.2x markup on bulk operations
    PREMIUM_DATA: 3.5,         // 3.5x markup on premium data (emails, phones)
    AI_PROCESSING: 4.0         // 4x markup on AI-powered features
  };

  // Base CoreSignal costs (in credits)
  private static readonly CORESIGNAL_BASE_COSTS = {
    PERSON_SEARCH: 1,
    COMPANY_SEARCH: 1,
    ROLE_FINDER: 2,
    BULK_ENRICHMENT: 1,
    PREMIUM_DATA: 3,
    AI_PROCESSING: 1
  };

  /**
   * Calculate Adrata credits needed for a request
   */
  static calculateCredits(
    requestType: keyof typeof AdrataCreditSystem.PRICING_MULTIPLIERS,
    quantity: number = 1,
    includeAI: boolean = false
  ): CreditEstimate {
    
    const baseCost = this['CORESIGNAL_BASE_COSTS'][requestType] || 1;
    const multiplier = this['PRICING_MULTIPLIERS'][requestType] || 2.0;
    
    let totalCoreSignalCost = baseCost * quantity;
    let totalAdrataCredits = Math.ceil(totalCoreSignalCost * multiplier);
    
    // Add AI processing costs if enabled
    if (includeAI) {
      const aiCost = this.CORESIGNAL_BASE_COSTS.AI_PROCESSING * quantity;
      const aiCredits = Math.ceil(aiCost * this.PRICING_MULTIPLIERS.AI_PROCESSING);
      totalCoreSignalCost += aiCost;
      totalAdrataCredits += aiCredits;
    }
    
    return {
      estimatedCredits: totalAdrataCredits,
      coreSignalCost: totalCoreSignalCost,
      adrataMarkup: totalAdrataCredits - totalCoreSignalCost,
      breakdown: {
        baseApiCalls: Math.ceil(baseCost * multiplier * quantity),
        roleSearches: requestType === 'ROLE_FINDER' ? Math.ceil(baseCost * multiplier * quantity) : 0,
        enrichmentCalls: requestType === 'BULK_ENRICHMENT' ? Math.ceil(baseCost * multiplier * quantity) : 0,
        premiumFeatures: requestType === 'PREMIUM_DATA' ? Math.ceil(baseCost * multiplier * quantity) : 0
      }
    };
  }

  /**
   * Estimate credits for CSV enrichment
   */
  static estimateCSVEnrichmentCredits(
    recordCount: number,
    roles: string[] = [],
    includeContactInfo: boolean = false,
    useAI: boolean = false
  ): CreditEstimate {
    
    let totalCredits = 0;
    let totalCoreSignalCost = 0;
    
    // Base company/person searches
    const baseEstimate = this.calculateCredits('PERSON_SEARCH', recordCount);
    totalCredits += baseEstimate.estimatedCredits;
    totalCoreSignalCost += baseEstimate.coreSignalCost;
    
    // Role-specific searches
    if (roles.length > 0) {
      const roleEstimate = this.calculateCredits('ROLE_FINDER', recordCount * roles.length);
      totalCredits += roleEstimate.estimatedCredits;
      totalCoreSignalCost += roleEstimate.coreSignalCost;
    }
    
    // Premium contact information
    if (includeContactInfo) {
      const contactEstimate = this.calculateCredits('PREMIUM_DATA', recordCount);
      totalCredits += contactEstimate.estimatedCredits;
      totalCoreSignalCost += contactEstimate.coreSignalCost;
    }
    
    // AI processing
    if (useAI) {
      const aiEstimate = this.calculateCredits('AI_PROCESSING', recordCount);
      totalCredits += aiEstimate.estimatedCredits;
      totalCoreSignalCost += aiEstimate.coreSignalCost;
    }
    
    return {
      estimatedCredits: totalCredits,
      coreSignalCost: totalCoreSignalCost,
      adrataMarkup: totalCredits - totalCoreSignalCost,
      breakdown: {
        baseApiCalls: baseEstimate.estimatedCredits,
        roleSearches: roles.length > 0 ? Math.ceil(recordCount * roles.length * this.PRICING_MULTIPLIERS.ROLE_FINDER) : 0,
        enrichmentCalls: Math.ceil(recordCount * this.PRICING_MULTIPLIERS.BULK_ENRICHMENT),
        premiumFeatures: includeContactInfo ? Math.ceil(recordCount * this.PRICING_MULTIPLIERS.PREMIUM_DATA) : 0
      }
    };
  }

  /**
   * Check if user has unlimited credits (Ross, Dan, Tony)
   */
  private static hasUnlimitedCredits(userId: string, userEmail?: string): boolean {
    const unlimitedUsers = [
      'ross@adrata.com',
      'dan@adrata.com', 
      'tony@adrata.com',
      'dano@adrata.com',
      // Also check by common user IDs if email not available
      '01K1VBYZG41K9QA0D9CF06KNRG', // Ross's user ID from logs
    ];
    
    return unlimitedUsers.some(identifier => 
      userId.toLowerCase().includes(identifier.toLowerCase()) ||
      userEmail?.toLowerCase() === identifier.toLowerCase()
    );
  }

  /**
   * Check if user has sufficient credits
   */
  static async checkCreditBalance(
    userId: string, 
    workspaceId: string, 
    requiredCredits: number,
    userEmail?: string
  ): Promise<{ hasCredits: boolean; balance: UserCreditBalance; isUnlimited?: boolean }> {
    
    // Check for unlimited credits first
    if (this.hasUnlimitedCredits(userId, userEmail)) {
      console.log(`💎 [CREDITS] Unlimited credits for user: ${userEmail || userId}`);
      return {
        hasCredits: true,
        isUnlimited: true,
        balance: {
          userId,
          workspaceId,
          totalCredits: 999999,
          usedCredits: 0,
          availableCredits: 999999,
          lastUpdated: new Date().toISOString()
        }
      };
    }
    
    try {
      // Get current balance from database
      const response = await fetch(`/api/credits/balance?userId=${userId}&workspaceId=${workspaceId}`);
      const balance: UserCreditBalance = await response.json();
      
      return {
        hasCredits: balance.availableCredits >= requiredCredits,
        balance
      };
    } catch (error) {
      console.error('Error checking credit balance:', error);
      // Return conservative estimate in case of error
      return {
        hasCredits: false,
        balance: {
          userId,
          workspaceId,
          totalCredits: 0,
          usedCredits: 0,
          availableCredits: 0,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Deduct credits for a completed operation
   */
  static async deductCredits(
    userId: string,
    workspaceId: string,
    creditsUsed: number,
    description: string,
    metadata?: CreditTransaction['metadata'],
    userEmail?: string
  ): Promise<{ success: boolean; newBalance: number; transactionId?: string }> {
    
    // For unlimited users, still track usage but don't deduct
    if (this.hasUnlimitedCredits(userId, userEmail)) {
      console.log(`💎 [CREDITS] Tracking ${creditsUsed} credits for unlimited user: ${userEmail || userId} - ${description}`);
      
      // Still create transaction record for tracking
      try {
        await fetch('/api/credits/track-unlimited', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            workspaceId,
            amount: creditsUsed,
            description,
            metadata
          })
        });
      } catch (error) {
        console.warn('Failed to track unlimited user credits:', error);
      }
      
      return { 
        success: true, 
        newBalance: 999999,
        transactionId: `unlimited-${Date.now()}`
      };
    }
    
    try {
      const response = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workspaceId,
          amount: creditsUsed,
          description,
          metadata
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`💳 [CREDITS] Deducted ${creditsUsed} Adrata credits for ${description}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return { success: false, newBalance: 0 };
    }
  }

  /**
   * Add credits to user account (for purchases, refunds, etc.)
   */
  static async addCredits(
    userId: string,
    workspaceId: string,
    creditsToAdd: number,
    description: string,
    metadata?: CreditTransaction['metadata']
  ): Promise<{ success: boolean; newBalance: number; transactionId?: string }> {
    
    try {
      const response = await fetch('/api/credits/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workspaceId,
          amount: creditsToAdd,
          description,
          metadata
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`💳 [CREDITS] Added ${creditsToAdd} Adrata credits: ${description}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error adding credits:', error);
      return { success: false, newBalance: 0 };
    }
  }

  /**
   * Get user's credit transaction history
   */
  static async getCreditHistory(
    userId: string,
    workspaceId: string,
    limit: number = 50
  ): Promise<CreditTransaction[]> {
    
    try {
      const response = await fetch(
        `/api/credits/history?userId=${userId}&workspaceId=${workspaceId}&limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching credit history:', error);
      return [];
    }
  }

  /**
   * Format credit amounts for display
   */
  static formatCredits(amount: number): string {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  }

  /**
   * Generate user-friendly credit usage description
   */
  static generateUsageDescription(
    requestType: string,
    quantity: number,
    roles?: string[]
  ): string {
    
    const baseDescription = `${requestType.toLowerCase().replace('_', ' ')} for ${quantity} record${quantity > 1 ? 's' : ''}`;
    
    if (roles && roles.length > 0) {
      return `${baseDescription} (${roles.join(', ')} search)`;
    }
    
    return baseDescription;
  }

  /**
   * Calculate cost savings compared to direct CoreSignal usage
   */
  static calculateSavingsMessage(estimate: CreditEstimate): string {
    const directCost = estimate.coreSignalCost * 5; // Assume 5x if using CoreSignal directly
    const savings = directCost - estimate.estimatedCredits;
    
    if (savings > 0) {
      return `Save ${this.formatCredits(savings)} credits vs. direct API usage`;
    }
    
    return `Premium Adrata intelligence with ${this.formatCredits(estimate.adrataMarkup)} credit markup`;
  }
}
