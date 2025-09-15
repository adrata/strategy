/**
 * 🤖 AI CHAT API ENDPOINT
 * 
 * Direct Claude AI integration for intelligent sales chat responses
 * Provides fast, context-aware responses using Anthropic's Claude API
 */

import { NextRequest, NextResponse } from 'next/server';
import { claudeAIService } from '@/platform/services/ClaudeAIService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract the message and other parameters
    const { 
      message, 
      appType, 
      workspaceId, 
      userId, 
      conversationHistory, 
      currentRecord, 
      recordType,
      enableVoiceResponse,
      selectedVoiceId 
    } = body;

    console.log('🤖 [AI CHAT] Processing request:', {
      message: message?.substring(0, 100) + '...',
      appType,
      workspaceId,
      userId,
      hasCurrentRecord: !!currentRecord,
      recordType
    });

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Message is required and must be a string'
      }, { status: 400 });
    }

    // Generate Claude AI response
    const claudeResponse = await claudeAIService.generateChatResponse({
      message,
      conversationHistory,
      currentRecord,
      recordType,
      appType,
      workspaceId,
      userId
    });

    console.log('🤖 [AI CHAT] Claude response generated:', {
      responseLength: claudeResponse.response.length,
      confidence: claudeResponse.confidence,
      model: claudeResponse.model,
      processingTime: claudeResponse.processingTime
    });

    // Return the response in the expected format
    return NextResponse.json({
      success: true,
      response: claudeResponse.response,
      todos: [], // Claude can generate actionable items in the response text
      navigation: null,
      voice: null,
      metadata: {
        model: claudeResponse.model,
        confidence: claudeResponse.confidence,
        processingTime: claudeResponse.processingTime,
        tokensUsed: claudeResponse.tokensUsed
      }
    });

  } catch (error) {
    console.error('❌ [AI CHAT] Error:', error);
    
    // Return a helpful error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      response: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment, or feel free to ask me about your sales strategy, pipeline optimization, or any other sales-related questions."
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for AI chat requests.'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for AI chat requests.'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for AI chat requests.'
  }, { status: 405 });
}