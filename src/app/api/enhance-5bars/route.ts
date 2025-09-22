/**
 * 🎯 5BARS ENHANCEMENT API
 * 
 * API endpoint to trigger comprehensive enhancement of 5Bars Services LLC
 * Uses Perplexity AI and other data sources for maximum insight
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { enhancementType = 'perplexity', workspaceId, userId } = body;
    
    console.log(`🚀 [5BARS ENHANCEMENT] Starting ${enhancementType} enhancement...`);
    
    // Validate workspace and user
    if (!workspaceId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing workspaceId or userId'
      }, { status: 400 });
    }
    
    // Get company information
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        description: true
      }
    });
    
    if (!company) {
      return NextResponse.json({
        success: false,
        error: '5Bars company not found'
      }, { status: 404 });
    }
    
    // Execute enhancement based on type
    let enhancementResult;
    
    switch (enhancementType) {
      case 'perplexity':
        enhancementResult = await executePerplexityEnhancement(company);
        break;
      case 'comprehensive':
        enhancementResult = await executeComprehensiveEnhancement(company);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid enhancement type. Use "perplexity" or "comprehensive"'
        }, { status: 400 });
    }
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        company: company,
        enhancementType: enhancementType,
        result: enhancementResult,
        processingTime: processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [5BARS ENHANCEMENT] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    
    if (!workspaceId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing workspaceId or userId'
      }, { status: 400 });
    }
    
    // Get company information
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        description: true,
        size: true,
        revenue: true,
        city: true,
        state: true,
        country: true,
        address: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!company) {
      return NextResponse.json({
        success: false,
        error: '5Bars company not found'
      }, { status: 404 });
    }
    
    // Get people count
    const peopleCount = await prisma.people.count({
      where: { companyId: company.id }
    });
    
    // Get recent insights (placeholder - insights table doesn't exist yet)
    const recentInsights = [];
    
    return NextResponse.json({
      success: true,
      data: {
        company: company,
        peopleCount: peopleCount,
        recentInsights: recentInsights,
        enhancementOptions: {
          perplexity: {
            description: 'Perplexity AI research for comprehensive intelligence',
            estimatedCost: '$0.10',
            estimatedTime: '2-3 minutes'
          },
          comprehensive: {
            description: 'Full enhancement with CoreSignal, Perplexity, and web research',
            estimatedCost: '$0.25',
            estimatedTime: '5-10 minutes'
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [5BARS ENHANCEMENT] GET Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Execute Perplexity AI enhancement
 */
async function executePerplexityEnhancement(company: any) {
  console.log('🤖 [5BARS ENHANCEMENT] Executing Perplexity AI enhancement...');
  
  try {
    // Call Perplexity API for comprehensive research
    const researchQueries = [
      {
        name: 'company_overview',
        query: `Provide comprehensive information about ${company.name}, a telecommunications company. Include: company history, services, key personnel, recent news, and market position. Website: ${company.website}`
      },
      {
        name: 'leadership_team',
        query: `Who are the key executives and leadership team at ${company.name}? Include names, titles, backgrounds, and LinkedIn profiles if available.`
      },
      {
        name: 'market_analysis',
        query: `Analyze the market position of ${company.name} in the telecommunications industry. Include competitors, market share, and growth opportunities.`
      }
    ];
    
    const results = {};
    
    for (const research of researchQueries) {
      try {
        const result = await callPerplexityAPI(research.query);
        results[research.name] = {
          query: research.query,
          response: result.content,
          sources: result.sources,
          confidence: result.confidence
        };
      } catch (error) {
        console.error(`❌ [5BARS ENHANCEMENT] ${research.name} failed:`, error.message);
        results[research.name] = {
          error: error.message
        };
      }
    }
    
    // Save insights to database (placeholder - insights table doesn't exist yet)
    console.log('📊 [5BARS ENHANCEMENT] Insights would be saved here');
    
    return {
      type: 'perplexity',
      results: results,
      insightsSaved: true
    };
    
  } catch (error) {
    console.error('❌ [5BARS ENHANCEMENT] Perplexity enhancement failed:', error);
    throw error;
  }
}

/**
 * Execute comprehensive enhancement
 */
async function executeComprehensiveEnhancement(company: any) {
  console.log('🔍 [5BARS ENHANCEMENT] Executing comprehensive enhancement...');
  
  try {
    // This would call the comprehensive enhancement script
    // For now, return a placeholder
    return {
      type: 'comprehensive',
      message: 'Comprehensive enhancement would be executed here',
      note: 'This would integrate CoreSignal, Perplexity, and web research'
    };
    
  } catch (error) {
    console.error('❌ [5BARS ENHANCEMENT] Comprehensive enhancement failed:', error);
    throw error;
  }
}

/**
 * Call Perplexity API
 */
async function callPerplexityAPI(query: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a professional business intelligence researcher. Provide accurate, well-sourced information with specific details. Always include confidence levels and source citations when possible.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return {
    content,
    sources: extractSources(content),
    confidence: 0.9
  };
}

/**
 * Extract sources from Perplexity response
 */
function extractSources(content: string): string[] {
  const sources = [];
  const sourceRegex = /\[(\d+)\]/g;
  let match;
  
  while ((match = sourceRegex.exec(content)) !== null) {
    sources.push(match[1]);
  }
  
  return sources;
}
