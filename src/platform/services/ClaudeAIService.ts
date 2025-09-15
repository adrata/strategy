/**
 * 🤖 CLAUDE AI SERVICE
 * 
 * Direct integration with Anthropic's Claude API for intelligent chat responses
 * Replaces the complex chain of API calls with direct Claude integration
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  currentRecord?: any;
  recordType?: string;
  appType?: string;
  workspaceId?: string;
  userId?: string;
}

export interface ClaudeChatResponse {
  response: string;
  confidence: number;
  model: string;
  tokensUsed: number;
  processingTime: number;
}

export class ClaudeAIService {
  private anthropic: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Generate intelligent chat response using Claude
   */
  async generateChatResponse(request: ClaudeChatRequest): Promise<ClaudeChatResponse> {
    const startTime = Date.now();
    
    try {
      // Build the system prompt with context
      const systemPrompt = this.buildSystemPrompt(request);
      
      // Build conversation messages
      const messages = this.buildConversationMessages(request);
      
      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages,
        temperature: 0.7, // Balanced creativity and consistency
      });

      const processingTime = Date.now() - startTime;
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        response: responseText,
        confidence: 0.95, // Claude responses are generally high confidence
        model: this.model,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        processingTime: processingTime
      };

    } catch (error) {
      console.error('❌ Claude AI Service Error:', error);
      
      // Return a fallback response
      return {
        response: this.generateFallbackResponse(request),
        confidence: 0.3,
        model: 'fallback',
        tokensUsed: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Build comprehensive system prompt with sales context
   */
  private buildSystemPrompt(request: ClaudeChatRequest): string {
    const currentRecord = request.currentRecord;
    const recordType = request.recordType;
    const appType = request.appType;

    let contextInfo = '';
    
    if (currentRecord) {
      const recordName = currentRecord.fullName || currentRecord.name || 'Unknown';
      const company = currentRecord.company?.name || currentRecord.company || 'Unknown Company';
      const title = currentRecord.title || currentRecord.jobTitle || 'Unknown Title';
      
      contextInfo = `
CURRENT RECORD CONTEXT:
- Name: ${recordName}
- Company: ${company}
- Title: ${title}
- Record Type: ${recordType || 'Unknown'}
- App Context: ${appType || 'General'}
`;
    }

    return `You are Adrata, an intelligent sales acceleration AI assistant. You help sales professionals with:

🎯 CORE CAPABILITIES:
- Sales strategy and prospecting advice
- Buyer group intelligence and stakeholder mapping
- Pipeline analysis and optimization
- Next action recommendations
- Competitive intelligence
- Industry insights and trends

📊 SALES EXPERTISE:
- B2B sales methodologies (Challenger Sale, SPIN Selling, MEDDIC)
- CRM and pipeline management
- Lead qualification and nurturing
- Account-based selling strategies
- Revenue forecasting and analytics

${contextInfo}

💡 RESPONSE GUIDELINES:
- Be specific and actionable in your advice
- Reference the current record context when relevant
- Provide concrete next steps and recommendations
- Use sales terminology appropriately
- Be concise but comprehensive
- Focus on revenue-generating activities
- Consider the user's role and company context

🚀 SALES ACCELERATION FOCUS:
Always aim to help the user:
1. Close more deals faster
2. Build stronger relationships
3. Identify and engage key stakeholders
4. Optimize their sales process
5. Make data-driven decisions

Respond as a knowledgeable sales consultant who understands modern B2B sales challenges and opportunities.`;
  }

  /**
   * Build conversation messages from history and current message
   */
  private buildConversationMessages(request: ClaudeChatRequest): Anthropic.Messages.MessageParam[] {
    const messages: Anthropic.Messages.MessageParam[] = [];
    
    // Add conversation history (last 10 messages to stay within token limits)
    if (request.conversationHistory) {
      const recentHistory = request.conversationHistory.slice(-10);
      
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: request.message
    });
    
    return messages;
  }

  /**
   * Generate fallback response when Claude API fails
   */
  private generateFallbackResponse(request: ClaudeChatRequest): string {
    const currentRecord = request.currentRecord;
    
    if (currentRecord) {
      const recordName = currentRecord.fullName || currentRecord.name || 'this contact';
      const company = currentRecord.company?.name || currentRecord.company || 'their company';
      
      return `I'm here to help you with ${recordName} at ${company}. While I'm experiencing some technical difficulties, I can still assist you with:

• Sales strategy and next steps
• Buyer group analysis
• Pipeline optimization
• Competitive intelligence

What specific aspect of your sales process would you like to focus on?`;
    }
    
    return `I'm here to help you accelerate your sales process. While I'm experiencing some technical difficulties, I can still assist you with:

• Sales strategy and prospecting
• Pipeline analysis and optimization
• Buyer group intelligence
• Next action recommendations

What would you like to work on today?`;
  }

  /**
   * Test Claude API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      });
      
      return response.content[0].type === 'text';
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const claudeAIService = new ClaudeAIService();
