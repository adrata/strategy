/**
 * AI Conversation Service
 * Handles AI-powered conversation naming and management
 */

import { openai } from '@/platform/ai/openai-client';

export interface ConversationSummary {
  title: string;
  summary: string;
  topics: string[];
  intent: string;
}

export class AIConversationService {
  private static instance: AIConversationService;

  static getInstance(): AIConversationService {
    if (!AIConversationService.instance) {
      AIConversationService['instance'] = new AIConversationService();
    }
    return AIConversationService.instance;
  }

  /**
   * Generate a concise conversation title based on the first few messages
   */
  async generateConversationTitle(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // Take first 3-4 messages to understand the conversation context
      const contextMessages = messages.slice(0, 4);
      
      if (contextMessages['length'] === 0) {
        return "New Chat";
      }

      // Create a prompt for title generation
      const conversationText = contextMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Based on this conversation, generate a concise 2-4 word title that captures the main topic or intent:

${conversationText}

Requirements:
- Maximum 4 words
- Capture the main topic or request
- Be specific and actionable
- Use title case
- No quotes or punctuation

Examples:
- "Pipeline Data Analysis"
- "Monaco Setup Help"
- "Speedrun Configuration"
- "Company Research Query"

Title:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
      });

      const title = response['choices'][0]?.message?.content?.trim() || "New Chat";
      
      // Ensure title is not too long
      return title.length > 25 ? title.substring(0, 22) + "..." : title;
      
    } catch (error) {
      console.error('Error generating conversation title:', error);
      return `Chat ${new Date().toLocaleTimeString()}`;
    }
  }

  /**
   * Generate a detailed conversation summary
   */
  async generateConversationSummary(messages: Array<{ role: string; content: string }>): Promise<ConversationSummary> {
    try {
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Analyze this conversation and provide a structured summary:

${conversationText}

Provide a JSON response with:
{
  "title": "2-4 word title",
  "summary": "1-2 sentence summary of what was discussed",
  "topics": ["topic1", "topic2", "topic3"],
  "intent": "user's main goal or request"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response['choices'][0]?.message?.content || '{}');
      
      return {
        title: result.title || "New Chat",
        summary: result.summary || "No summary available",
        topics: result.topics || [],
        intent: result.intent || "General conversation"
      };
      
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return {
        title: "New Chat",
        summary: "Error generating summary",
        topics: [],
        intent: "Unknown"
      };
    }
  }

  /**
   * Update conversation title when new messages are added
   */
  async updateConversationTitle(
    conversationId: string, 
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    // Only update title if we have enough context (2+ messages)
    if (messages.length < 2) {
      return "New Chat";
    }

    // Don't regenerate if conversation already has many messages (title is likely stable)
    if (messages.length > 10) {
      return ""; // Return empty to indicate no update needed
    }

    return this.generateConversationTitle(messages);
  }
}

export const aiConversationService = AIConversationService.getInstance();
