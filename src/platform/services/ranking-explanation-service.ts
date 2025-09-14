/**
 * RANKING EXPLANATION SERVICE
 * 
 * Generates human-readable explanations for ranking decisions.
 * Can optionally use LLM for more sophisticated explanations.
 */

interface RankingContext {
  name: string;
  title?: string;
  company: string;
  sourceType: 'lead' | 'prospect' | 'customer' | 'opportunity' | 'contact';
  score: number;
  factors: {
    relationship?: string;
    decisionPower?: string;
    timing?: string;
    value?: number;
    engagement?: string;
    strategic?: string;
  };
  recentActivity?: {
    type: string;
    daysAgo: number;
  };
}

export class RankingExplanationService {
  
  /**
   * Generate human-readable ranking explanation using LLM
   */
  static async generateExplanation(context: RankingContext): Promise<string> {
    try {
      return await this.generateLLMExplanation(context);
    } catch (error) {
      console.warn('LLM explanation failed, falling back to standard:', error);
      return this.generateStandardExplanation(context);
    }
  }
  
  /**
   * Standard rule-based explanation (no LLM required)
   */
  private static generateStandardExplanation(context: RankingContext): string {
    const reasons = [];
    const descriptors = [];
    
    // Determine priority level
    let priorityLevel = "Medium priority";
    if (context.score >= 90) {
      priorityLevel = "Critical priority";
    } else if (context.score >= 70) {
      priorityLevel = "High priority";
    }
    
    // Add context about contact type and relationship
    if (context['sourceType'] === 'customer') {
      descriptors.push('existing customer');
    } else if (context.factors.relationship?.toLowerCase().includes('hot')) {
      descriptors.push('hot prospect');
    } else if (context.factors.relationship?.toLowerCase().includes('warm')) {
      descriptors.push('warm prospect');
    } else {
      descriptors.push('prospect');
    }
    
    // Add executive level context
    const title = (context.title || '').toLowerCase();
    if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
      descriptors.push('C-level executive');
    } else if (title.includes('vp') || title.includes('director')) {
      descriptors.push('senior executive');
    }
    
    // Add specific reasons
    if (context['factors']['value'] && context.factors.value > 100000) {
      reasons.push('high-value opportunity');
    }
    
    if (context['recentActivity'] && context.recentActivity.daysAgo <= 3) {
      reasons.push('responded recently');
    } else if (context['recentActivity'] && context.recentActivity.daysAgo <= 7) {
      reasons.push('engaged this week');
    }
    
    if (context.factors.decisionPower?.includes('Decision Maker')) {
      reasons.push('decision maker');
    } else if (context.factors.decisionPower?.includes('Champion')) {
      reasons.push('internal champion');
    }
    
    // Build explanation
    const contextText = descriptors.length > 0 ? descriptors.join(', ') : 'contact';
    const reasonText = reasons.length > 0 ? reasons.slice(0, 2).join(', ') : 'standard priority';
    
    return `${priorityLevel}: ${contextText}${reasons.length > 0 ? ', ' + reasonText : ''}`;
  }
  
  /**
   * LLM-powered explanation using OpenAI
   */
  private static async generateLLMExplanation(context: RankingContext): Promise<string> {
    // Import OpenAI service (assuming you have one)
    const { generateText } = await import('../utils/openaiService');
    
    const prompt = `Generate a concise, professional explanation for why this sales contact is prioritized.

Contact Details:
- Name: ${context.name}
- Title: ${context.title || 'Unknown'}
- Company: ${context.company}
- Type: ${context.sourceType}
- Score: ${context.score}/100
- Relationship: ${context.factors.relationship || 'Unknown'}
- Decision Power: ${context.factors.decisionPower || 'Unknown'}
- Deal Value: $${context.factors.value?.toLocaleString() || 'Unknown'}
- Recent Activity: ${context.recentActivity ? `${context.recentActivity.type} ${context.recentActivity.daysAgo} days ago` : 'None'}

Format: "[Priority Level]: [Context], [Key Reasons]"
Example: "High priority: existing customer, C-level executive, responded 2 days ago"

Keep it under 100 characters, professional tone, no emojis:`;

    const explanation = await generateText({
      prompt,
      maxTokens: 50,
      temperature: 0.3 // Lower temperature for consistent, professional output
    });
    
    return explanation.trim();
  }
  
  /**
   * Generate explanation for account ranking using LLM
   */
  static async generateAccountExplanation(account: {
    name: string;
    contactCount: number;
    opportunityCount: number;
    isCustomer: boolean;
    revenue?: number;
    lastActivity?: string;
  }): Promise<string> {
    try {
      return await this.generateLLMAccountExplanation(account);
    } catch (error) {
      console.warn('LLM account explanation failed, falling back to standard:', error);
      return this.generateStandardAccountExplanation(account);
    }
  }
  
  /**
   * LLM-powered account explanation
   */
  private static async generateLLMAccountExplanation(account: {
    name: string;
    contactCount: number;
    opportunityCount: number;
    isCustomer: boolean;
    revenue?: number;
    lastActivity?: string;
  }): Promise<string> {
    const { generateText } = await import('../utils/openaiService');
    
    const prompt = `Generate a concise explanation for why this account is prioritized for sales outreach.

Account Details:
- Company: ${account.name}
- Contact Count: ${account.contactCount}
- Active Opportunities: ${account.opportunityCount}
- Customer Status: ${account.isCustomer ? 'Existing Customer' : 'Prospect'}
- Revenue: $${account.revenue?.toLocaleString() || 'Unknown'}
- Last Activity: ${account.lastActivity || 'None'}

Format: "[Priority Level]: [Account Type], [Key Factors]"
Example: "High priority: existing customer account, 3 active opportunities, high-value account"

Keep it under 80 characters, professional tone:`;

    const explanation = await generateText({
      prompt,
      maxTokens: 40,
      temperature: 0.3
    });
    
    return explanation.trim();
  }
  
  /**
   * Fallback standard account explanation
   */
  private static generateStandardAccountExplanation(account: {
    name: string;
    contactCount: number;
    opportunityCount: number;
    isCustomer: boolean;
    revenue?: number;
    lastActivity?: string;
  }): string {
    const reasons = [];
    
    if (account.isCustomer) {
      reasons.push('existing customer account');
    }
    
    if (account.opportunityCount > 0) {
      reasons.push(`${account.opportunityCount} active opportunities`);
    }
    
    if (account.contactCount > 3) {
      reasons.push('multiple contacts established');
    }
    
    if (account['revenue'] && account.revenue > 500000) {
      reasons.push('high-value account');
    }
    
    const priorityLevel = account['isCustomer'] && account.opportunityCount > 0 ? 
      'High priority' : 'Medium priority';
    
    const reasonText = reasons.length > 0 ? reasons.join(', ') : 'standard account';
    
    return `${priorityLevel}: ${reasonText}`;
  }
}
