import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CompanyIntelligenceGenerator, CoreSignalCompanyData } from '@/platform/services/company-intelligence-generator';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

async function generateOptimizedContent(prompt: string): Promise<string> {
  try {
    // Try to use Claude if API key is available
    if (process.env['ANTHROPIC_API_KEY']) {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env['ANTHROPIC_API_KEY'],
      });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5', // Latest Claude 4.5 Sonnet - best for business intelligence
        max_tokens: 1000, // Increased for more comprehensive analysis
        temperature: 0.3, // Lower temperature for more consistent, factual output
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
    }
  } catch (error) {
    console.log('Claude API not available for content optimization, using fallback');
  }

  // Fallback to template-based content
  return generateFallbackContent(prompt);
}

function generateFallbackContent(prompt: string): string {
  // Extract company name from prompt
  const nameMatch = prompt.match(/about (\w+)/);
  const companyName = nameMatch ? nameMatch[1] : 'the company';
  
  if (prompt.includes('strategic sales positioning')) {
    return `TOP Engineers Plus should position as a specialized communications engineering partner for ${companyName}'s critical infrastructure needs. Key positioning opportunities include leveraging TOP's expertise in fiber optic design, microwave engineering, and strategic planning for infrastructure projects. Use TOP's operational excellence and change management capabilities to streamline technology integrations. Provide strategic plan reviews and technology assessments to support digital transformation initiatives. Offer expertise in telecommunications standards and safety regulations for critical infrastructure. Emphasize TOP's unique connection between Technology, Operations, and People, and reference their decades of experience in the critical infrastructure sector. Target decision makers in IT, Operations, and Engineering departments.`;
  } else {
    return `${companyName} is a major company in the utilities sector with significant infrastructure and technology integration challenges. The company operates critical infrastructure and faces unique challenges in maintaining service reliability while modernizing aging systems. Key strategic considerations include regulatory compliance with environmental standards, infrastructure investment planning, and customer service modernization. Partnership opportunities exist in communications engineering, strategic planning, process optimization, and regulatory compliance automation.`;
  }
}

async function generateSophisticatedIntelligence(company: any, coresignalData: CoreSignalCompanyData) {
  const intelligenceGenerator = new CompanyIntelligenceGenerator();
  
  // Generate comprehensive intelligence using the generator
  const intelligence = await intelligenceGenerator.generateCompanyIntelligence(company, coresignalData);
  
  return intelligence;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get company from database
    const company = await prisma.companies.findUnique({
      where: { id },
      include: {
        people: true
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Generate intelligence using the sophisticated generator
    const intelligence = await generateSophisticatedIntelligence(company, {} as CoreSignalCompanyData);

    return NextResponse.json({
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ SBI company intelligence error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
