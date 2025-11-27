/**
 * 🎯 AI Content Quality Evaluation API
 * 
 * POST /api/v1/ai-evaluate
 * 
 * Evaluates AI-generated content quality and returns scoring breakdown.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  evaluateContentFast, 
  formatScoreBreakdown,
  getQualityLabel,
  type EvaluationContext 
} from '@/platform/ai/services/ContentQualityEvaluator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      content,
      contentType = 'general',
      context
    } = body as {
      content: string;
      contentType?: 'email' | 'linkedin' | 'text' | 'advice' | 'general';
      context?: EvaluationContext;
    };

    // Validate input
    if (!content || typeof content !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Content is required and must be a string'
      }, { status: 400 });
    }

    if (content.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Content must be at least 10 characters'
      }, { status: 400 });
    }

    if (content.length > 10000) {
      return NextResponse.json({
        success: false,
        error: 'Content must be less than 10,000 characters'
      }, { status: 400 });
    }

    // Evaluate content
    const score = evaluateContentFast(content, contentType, context);
    const label = getQualityLabel(score.overall);
    const formatted = formatScoreBreakdown(score);

    return NextResponse.json({
      success: true,
      data: {
        score: score.overall,
        label,
        breakdown: score.breakdown,
        suggestions: score.suggestions,
        contentType: score.contentType,
        formatted
      }
    });

  } catch (error) {
    console.error('[AI-EVALUATE] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to evaluate content'
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  // Demo evaluation
  const demoContent = `Hi Sarah,

I noticed your recent post about scaling SaaS operations and wanted to reach out. At Adrata, we help companies like TechCorp streamline their compliance workflows.

Would you be open to a quick 15-minute call next week to discuss how we might help your team?

Best regards,
Ross`;

  const demoContext: EvaluationContext = {
    recipientName: 'Sarah Johnson',
    recipientCompany: 'TechCorp',
    recipientTitle: 'VP of Operations',
    senderName: 'Ross',
    senderCompany: 'Adrata',
    purpose: 'cold outreach',
    industry: 'SaaS'
  };

  const score = evaluateContentFast(demoContent, 'email', demoContext);
  const formatted = formatScoreBreakdown(score);

  return NextResponse.json({
    success: true,
    message: 'AI Content Quality Evaluator API',
    demo: {
      content: demoContent,
      context: demoContext,
      score: score.overall,
      label: getQualityLabel(score.overall),
      breakdown: score.breakdown,
      suggestions: score.suggestions,
      formatted
    },
    usage: {
      method: 'POST',
      body: {
        content: 'Your email/message content here',
        contentType: 'email | linkedin | text | advice | general',
        context: {
          recipientName: 'optional',
          recipientCompany: 'optional',
          recipientTitle: 'optional',
          senderName: 'optional',
          purpose: 'cold outreach | follow-up | introduction | meeting request | thank you | proposal'
        }
      }
    }
  });
}

