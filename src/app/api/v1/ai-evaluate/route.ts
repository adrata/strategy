/**
 * AI Content Quality Evaluation API
 * 
 * Intelligent content evaluation combining:
 * - Russell Brunson's Hook-Story-Offer (enterprise adapted)
 * - Skip Miller's ProActive Selling (ATL/BTL buyer awareness)
 * - Personality-aware messaging
 * - User writing style learning
 * 
 * POST /api/v1/ai-evaluate
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  evaluateContent, 
  formatScoreBreakdown,
  getQualityLabel,
  getConversionDescription,
  type EvaluationContext,
  type ContentType,
  type PersonStatus,
  type OpportunityStage,
  type BuyerLevel,
  type CommunicationStyle
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
      contentType?: ContentType;
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
    const score = evaluateContent(content, contentType, context);
    const label = getQualityLabel(score.overall);
    const formatted = formatScoreBreakdown(score);
    const conversionDesc = getConversionDescription(score.conversionPotential);

    return NextResponse.json({
      success: true,
      data: {
        // Overall
        score: score.overall,
        grade: score.grade,
        label,
        conversionPotential: score.conversionPotential,
        conversionDescription: conversionDesc,
        
        // Detection
        detectedStatus: score.detectedStatus,
        detectedStage: score.detectedStage,
        detectedBuyerLevel: score.detectedBuyerLevel,
        
        // Framework scores (Russell Brunson + StoryBrand)
        framework: score.framework,
        
        // Sales intelligence (Skip Miller)
        salesIntelligence: score.salesIntelligence,
        
        // Craft scores
        craft: score.craft,
        
        // Suggestions
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

// GET endpoint for testing and documentation
export async function GET() {
  // Demo: Excellent cold email
  const demoContent = `Sarah - noticed TechCorp just closed your Series B. Congrats!

Companies scaling as fast as you typically hit compliance bottlenecks around this stage. We helped Notion cut their SOC 2 prep time by 60% right after their funding round.

Would a 15-minute call this week make sense to see if we could help TechCorp avoid that roadblock?`;

  const demoContext: EvaluationContext = {
    recipientName: 'Sarah Johnson',
    recipientCompany: 'TechCorp',
    recipientTitle: 'VP of Operations',
    industry: 'SaaS',
    status: 'LEAD',
    stage: 'QUALIFICATION',
    buyerLevel: 'ATL',
    recentNews: 'Series B funding',
    recipientPainPoints: ['compliance', 'scaling operations'],
    recipientPersonality: {
      communicationStyle: 'direct',
      motivations: ['Career advancement', 'Innovation'],
      keyNeeds: ['ROI data', 'Quick implementation']
    },
    senderName: 'Ross',
    senderCompany: 'Adrata'
  };

  const score = evaluateContent(demoContent, 'email', demoContext);
  const formatted = formatScoreBreakdown(score);

  return NextResponse.json({
    success: true,
    message: 'Intelligent Content Quality Evaluator API',
    
    methodology: {
      'Russell Brunson (Enterprise)': 'Hook-Story-Offer framework adapted for B2B',
      'Skip Miller ProActive Selling': 'ATL (executives) vs BTL (evaluators) awareness',
      'StoryBrand': 'Customer as Hero, Seller as Guide',
      'Personality Matching': 'Adapts to recipient communication style',
      'Writing Style Learning': 'Learns from user samples to sound like their best self'
    },
    
    scoringDimensions: {
      framework: ['hook (pattern interrupt)', 'story (transformation)', 'offer (CTA)', 'storyBrand'],
      salesIntelligence: ['buyerLevelAlignment', 'statusAlignment', 'stageAlignment', 'personalityMatch'],
      craft: ['clarity', 'personalization', 'elegance', 'brevity', 'actionability', 'writingStyleMatch']
    },
    
    demo: {
      content: demoContent,
      context: demoContext,
      result: {
        score: score.overall,
        grade: score.grade,
        label: getQualityLabel(score.overall),
        conversionPotential: score.conversionPotential,
        detectedStatus: score.detectedStatus,
        detectedStage: score.detectedStage,
        detectedBuyerLevel: score.detectedBuyerLevel,
        framework: score.framework,
        salesIntelligence: score.salesIntelligence,
        craft: score.craft,
        suggestions: score.suggestions
      },
      formatted
    },
    
    usage: {
      method: 'POST',
      endpoint: '/api/v1/ai-evaluate',
      body: {
        content: 'Your email/message content here (required)',
        contentType: 'email | linkedin | text | advice | general',
        context: {
          recipientName: 'Sarah Johnson',
          recipientCompany: 'TechCorp',
          recipientTitle: 'VP of Operations',
          industry: 'SaaS',
          status: 'LEAD | PROSPECT | CUSTOMER | PARTNER (auto-detected if not provided)',
          stage: 'QUALIFICATION | DISCOVERY | PROPOSAL | NEGOTIATION | CLOSING',
          buyerLevel: 'ATL | BTL (Above/Below The Line - auto-detected)',
          recentNews: 'Company news to reference for personalization',
          recipientPainPoints: ['compliance', 'scaling'],
          recipientPersonality: {
            communicationStyle: 'direct | analytical | expressive | amiable',
            motivations: ['Career advancement'],
            keyNeeds: ['ROI data']
          },
          priorMessages: ['Previous message 1', 'Previous message 2'],
          touchpointNumber: 1,
          lastInteraction: 'opened | clicked | replied | no_response | meeting_held',
          userWritingSamples: ['Sample of how user typically writes'],
          senderName: 'Your name',
          senderCompany: 'Your company'
        }
      }
    },
    
    gradeScale: {
      'A+': '95-100 - Exceptional, primed to convert',
      'A': '90-94 - Excellent, highly effective',
      'B+': '85-89 - Very good, minor optimizations possible',
      'B': '80-84 - Good, solid message',
      'C': '70-79 - Decent, needs refinement',
      'D': '60-69 - Needs work',
      'F': 'Below 60 - Significant improvements needed'
    }
  });
}
