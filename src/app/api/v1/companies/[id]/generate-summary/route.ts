import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getV1AuthUser } from '../../../auth';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * POST /api/v1/companies/[id]/generate-summary
 * Generate an AI-powered company summary based on available data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;
    console.log(`🤖 [COMPANY SUMMARY] Generating AI summary for company: ${companyId}`);

    // Fetch company data with related information
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: authUser.workspaceId,
        deletedAt: null,
      },
      include: {
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            department: true,
            buyerGroupRole: true,
          },
          take: 10,
        },
        actions: {
          where: { deletedAt: null },
          select: {
            type: true,
            subject: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Build context from available data
    const contextParts: string[] = [];
    
    // Company basics
    if (company.name) {
      contextParts.push(`Company Name: ${company.name}`);
    }
    if (company.industry) {
      contextParts.push(`Industry: ${company.industry}`);
    }
    if (company.website) {
      contextParts.push(`Website: ${company.website}`);
    }
    if (company.linkedinUrl) {
      contextParts.push(`LinkedIn: ${company.linkedinUrl}`);
    }
    
    // Location information
    const location = company.hqCity && company.hqState 
      ? `${company.hqCity}, ${company.hqState}` 
      : company.hqCity || company.hqState || company.city || company.state || company.address;
    if (location) {
      contextParts.push(`Location: ${location}`);
    }
    
    // Company size and metrics
    if (company.employeeCount) {
      contextParts.push(`Employees: ${company.employeeCount.toLocaleString()}`);
    } else if (company.size) {
      contextParts.push(`Company Size: ${company.size}`);
    }
    if (company.revenue) {
      contextParts.push(`Revenue: $${Number(company.revenue).toLocaleString()}`);
    }
    if (company.foundedYear) {
      contextParts.push(`Founded: ${company.foundedYear}`);
    }
    if (company.isPublic !== null) {
      contextParts.push(`Type: ${company.isPublic ? 'Public Company' : 'Private Company'}`);
    }
    
    // Key people at the company
    if (company.people && company.people.length > 0) {
      const keyPeople = company.people
        .filter(p => p.jobTitle)
        .slice(0, 5)
        .map(p => `${p.fullName} (${p.jobTitle})${p.buyerGroupRole ? ` - ${p.buyerGroupRole}` : ''}`)
        .join(', ');
      if (keyPeople) {
        contextParts.push(`Key Contacts: ${keyPeople}`);
      }
    }
    
    // Recent engagement
    if (company.actions && company.actions.length > 0) {
      const recentActions = company.actions
        .slice(0, 3)
        .map(a => `${a.type}: ${a.subject}`)
        .join('; ');
      contextParts.push(`Recent Activity: ${recentActions}`);
    }
    
    // Relationship type
    if (company.relationshipType) {
      contextParts.push(`Relationship Type: ${company.relationshipType}`);
    }
    if (company.priority) {
      contextParts.push(`Priority: ${company.priority}`);
    }

    const availableContext = contextParts.join('\n');

    console.log(`📊 [COMPANY SUMMARY] Context for AI:\n${availableContext}`);

    // Generate summary using Claude AI
    const prompt = `You are a B2B sales intelligence system. Generate a concise, professional company summary (2-3 sentences) based on the available information below. Focus on what's most relevant for a sales professional engaging with this company.

Available Company Information:
${availableContext}

Generate a clear, factual summary that highlights:
1. What the company does (infer from industry and name if needed)
2. Key business characteristics (size, location, public/private status)
3. Relevant context for sales engagement (if people/activity data is available)

Keep it professional, concise, and actionable. Do not make up information that isn't provided. If minimal information is available, create a brief summary from what you have.`;

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️ [COMPANY SUMMARY] No Anthropic API key configured, using fallback summary');
      // Create a basic fallback summary
      const fallbackParts: string[] = [];
      
      if (company.name) {
        const typeStr = company.isPublic === true ? 'public' : company.isPublic === false ? 'private' : '';
        fallbackParts.push(`${company.name} is${typeStr ? ` a ${typeStr}` : ''}`);
      }
      
      if (company.industry) {
        fallbackParts.push(`${fallbackParts.length > 0 ? '' : 'This is a'}${company.industry.toLowerCase()} company`);
      }
      
      if (location) {
        fallbackParts.push(`based in ${location}`);
      }
      
      if (company.employeeCount) {
        fallbackParts.push(`with approximately ${company.employeeCount.toLocaleString()} employees`);
      }
      
      const fallbackSummary = fallbackParts.length > 0 
        ? fallbackParts.join(' ') + '.' 
        : `${company.name} - Professional services company.`;

      // Save fallback summary
      await prisma.companies.update({
        where: { id: companyId },
        data: {
          descriptionEnriched: fallbackSummary,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          summary: fallbackSummary,
          method: 'fallback',
        },
      });
    }

    // Call Claude AI
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const aiSummary = message.content[0].type === 'text' ? message.content[0].text : '';
    
    console.log(`✅ [COMPANY SUMMARY] Generated AI summary: ${aiSummary}`);

    // Save the AI-generated summary to the database
    await prisma.companies.update({
      where: { id: companyId },
      data: {
        descriptionEnriched: aiSummary,
        updatedAt: new Date(),
        customFields: {
          ...(company.customFields as any || {}),
          aiSummaryGeneratedAt: new Date().toISOString(),
          aiSummaryModel: 'claude-3-5-sonnet-20241022',
        },
      },
    });

    console.log(`💾 [COMPANY SUMMARY] Saved AI summary to database for company ${companyId}`);

    return NextResponse.json({
      success: true,
      data: {
        summary: aiSummary,
        method: 'ai',
        model: 'claude-3-5-sonnet-20241022',
      },
    });

  } catch (error) {
    console.error('❌ [COMPANY SUMMARY] Error generating summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary' 
      },
      { status: 500 }
    );
  }
}

