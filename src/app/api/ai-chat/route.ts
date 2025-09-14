/**
 * 🤖 AI CHAT API ENDPOINT
 * 
 * Forwards AI chat requests to the unified intelligence endpoint
 * Provides a simple interface for the AI right panel
 */

import { NextRequest, NextResponse } from 'next/server';

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

    // Forward to the unified intelligence endpoint
    const intelligenceRequest = {
      depth: 'quick',
      type: 'chat',
      target: {
        query: message,
        company: currentRecord?.company || currentRecord?.companyName,
        accountId: currentRecord?.id
      },
      options: {
        includeBuyerGroups: true,
        includeIndustryAnalysis: true,
        urgencyLevel: 'realtime',
        conversationHistory,
        appType,
        currentRecord,
        recordType,
        enableVoiceResponse,
        selectedVoiceId
      }
    };

    // Make internal request to intelligence endpoint
    const intelligenceUrl = new URL(`${request.nextUrl.origin}/api/intelligence/unified`);
    intelligenceUrl.searchParams.set('workspaceId', workspaceId);
    intelligenceUrl.searchParams.set('userId', userId);
    
    const intelligenceResponse = await fetch(intelligenceUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify(intelligenceRequest)
    });

    if (!intelligenceResponse.ok) {
      // If intelligence API fails, provide a fallback response
      console.warn(`Intelligence API error: ${intelligenceResponse.status}`);
      
      // Generate a contextual fallback response based on the message
      let fallbackResponse = "I'm here to help you with your sales activities. ";
      
      if (currentRecord && recordType) {
        const recordName = currentRecord.name || currentRecord.fullName || 'this contact';
        const company = currentRecord.company || currentRecord.companyName || 'their company';
        
        if (message.toLowerCase().includes('challenge') || message.toLowerCase().includes('problem')) {
          fallbackResponse += `For ${recordName} at ${company}, I'd recommend researching their industry challenges and recent company news to identify pain points.`;
        } else if (message.toLowerCase().includes('call') || message.toLowerCase().includes('reach')) {
          fallbackResponse += `To reach ${recordName} effectively, consider their role and company context. LinkedIn and email are usually the best starting points.`;
        } else if (message.toLowerCase().includes('draft') || message.toLowerCase().includes('message')) {
          fallbackResponse += `For messaging ${recordName}, focus on their specific role and company challenges. Keep it concise and value-focused.`;
        } else {
          fallbackResponse += `I can help you with research, messaging, and strategy for ${recordName} at ${company}. What specific aspect would you like to focus on?`;
        }
      } else {
        fallbackResponse += "What would you like to know about your prospects or sales strategy?";
      }
      
      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        todos: [],
        navigation: null,
        voice: null
      });
    }

    const intelligenceData = await intelligenceResponse.json();

    // Transform the response to match what the AI panel expects
    return NextResponse.json({
      success: true,
      response: intelligenceData.intelligence?.intelligence?.result?.response || 'I apologize, but I encountered an issue processing your request. Please try again.',
      todos: intelligenceData.intelligence?.intelligence?.result?.todos || [],
      navigation: intelligenceData.intelligence?.intelligence?.result?.navigation || null,
      voice: intelligenceData.intelligence?.intelligence?.result?.voice || null
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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
