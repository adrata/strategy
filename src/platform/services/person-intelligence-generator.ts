/**
 * Person Intelligence Generator Service
 * 
 * Generates and stores intelligence fields for people/leads:
 * - Role (buyerGroupRole)
 * - Influence Level
 * - Decision Power
 * - Engagement Level
 * 
 * Uses AI (Anthropic Claude) to analyze CoreSignal data and generate intelligence
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

// Initialize Anthropic client only server-side to prevent browser exposure
function getAnthropicClient() {
  // Only initialize if we're in a server environment
  if (typeof window !== 'undefined') {
    throw new Error('Anthropic client cannot be initialized in browser environment. Use API route instead.');
  }
  
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
}

export interface PersonIntelligence {
  buyerGroupRole: string | null;
  influenceLevel: string | null;
  decisionPower: string | null;
  engagementLevel: string | null;
  confidence: number;
  reasoning: string;
}

export interface GenerateIntelligenceOptions {
  personId: string;
  workspaceId: string;
  forceRegenerate?: boolean;
}

export interface GenerateIntelligenceResult {
  success: boolean;
  intelligence?: PersonIntelligence;
  cached?: boolean;
  message: string;
}

/**
 * Generate intelligence for a person
 */
export async function generatePersonIntelligence(
  options: GenerateIntelligenceOptions
): Promise<GenerateIntelligenceResult> {
  const { personId, workspaceId, forceRegenerate = false } = options;

  try {
    // Get person with all relevant data
    const person = await prisma.people.findFirst({
      where: {
        id: personId,
        workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            employeeCount: true
          }
        },
        actions: {
          where: { deletedAt: null },
          select: {
            type: true,
            status: true,
            createdAt: true,
            completedAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!person) {
      return {
        success: false,
        message: 'Person not found'
      };
    }

    // Check if intelligence already exists and is recent (unless forcing regeneration)
    const existingIntelligence = person.customFields as any;
    if (!forceRegenerate && existingIntelligence?.intelligenceGeneratedAt) {
      const generatedAt = new Date(existingIntelligence.intelligenceGeneratedAt);
      const daysSinceGeneration = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      // Use cached intelligence if less than 30 days old
      if (daysSinceGeneration < 30) {
        return {
          success: true,
          cached: true,
          intelligence: {
            buyerGroupRole: person.buyerGroupRole,
            influenceLevel: existingIntelligence.influenceLevel,
            decisionPower: existingIntelligence.decisionPower,
            engagementLevel: existingIntelligence.engagementLevel,
            confidence: existingIntelligence.intelligenceConfidence || 0,
            reasoning: existingIntelligence.intelligenceReasoning || ''
          },
          message: 'Using cached intelligence (less than 30 days old)'
        };
      }
    }

    // Extract CoreSignal data
    const coresignalData = existingIntelligence?.coresignalData || {};
    
    // Build context for AI analysis
    const context = buildIntelligenceContext(person, coresignalData);

    // Generate intelligence using Claude
    const intelligence = await generateIntelligenceWithAI(context);

    // Store intelligence in database
    await storeIntelligence(personId, intelligence);

    return {
      success: true,
      intelligence,
      cached: false,
      message: 'Intelligence generated and stored successfully'
    };

  } catch (error) {
    console.error('❌ [PERSON INTELLIGENCE] Error generating intelligence:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate intelligence'
    };
  }
}

/**
 * Build context for AI intelligence generation
 */
function buildIntelligenceContext(person: any, coresignalData: any): string {
  const contextParts: string[] = [];

  // Basic information
  contextParts.push(`Name: ${person.fullName || person.firstName + ' ' + person.lastName}`);
  
  if (person.jobTitle) {
    contextParts.push(`Job Title: ${person.jobTitle}`);
  }
  
  if (person.department) {
    contextParts.push(`Department: ${person.department}`);
  }

  // Company information
  if (person.company) {
    contextParts.push(`Company: ${person.company.name}`);
    
    if (person.company.industry) {
      contextParts.push(`Industry: ${person.company.industry}`);
    }
    
    if (person.company.size) {
      contextParts.push(`Company Size: ${person.company.size}`);
    }
    
    if (person.company.employeeCount) {
      contextParts.push(`Employee Count: ${person.company.employeeCount}`);
    }
  }

  // CoreSignal enrichment data
  if (coresignalData.active_experience_title) {
    contextParts.push(`CoreSignal Title: ${coresignalData.active_experience_title}`);
  }
  
  if (coresignalData.headline) {
    contextParts.push(`Headline: ${coresignalData.headline}`);
  }

  if (coresignalData.experience && Array.isArray(coresignalData.experience)) {
    const yearsExperience = coresignalData.experience.length;
    contextParts.push(`Years of Experience: ${yearsExperience}`);
    
    // Check for executive/leadership roles
    const hasExecutiveExp = coresignalData.experience.some((exp: any) => 
      exp.position_title && 
      (exp.position_title.toLowerCase().includes('chief') ||
       exp.position_title.toLowerCase().includes('vp') ||
       exp.position_title.toLowerCase().includes('vice president') ||
       exp.position_title.toLowerCase().includes('director') ||
       exp.position_title.toLowerCase().includes('head of'))
    );
    if (hasExecutiveExp) {
      contextParts.push('Has Executive/Leadership Experience');
    }
  }

  // Engagement metrics
  if (person.actions && person.actions.length > 0) {
    const completedActions = person.actions.filter((a: any) => a.status === 'completed').length;
    contextParts.push(`Total Actions: ${person.actions.length}, Completed: ${completedActions}`);
    
    const recentActions = person.actions.filter((a: any) => {
      const actionDate = new Date(a.createdAt);
      const daysSince = (Date.now() - actionDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;
    
    if (recentActions > 0) {
      contextParts.push(`Recent Actions (30 days): ${recentActions}`);
    }
  }

  return contextParts.join('\n');
}

/**
 * Generate intelligence using Claude AI
 */
async function generateIntelligenceWithAI(context: string): Promise<PersonIntelligence> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback to rule-based intelligence if no API key
    return generateRuleBasedIntelligence(context);
  }

  try {
    const prompt = `Analyze the following professional profile and provide intelligence for B2B sales engagement:

${context}

Generate a JSON response with these fields:
{
  "buyerGroupRole": "Economic Buyer" | "Technical Buyer" | "Champion" | "Influencer" | "End User" | "Blocker" | "Unknown",
  "influenceLevel": "High" | "Medium" | "Low" | "Unknown",
  "decisionPower": "High" | "Medium" | "Low" | "Unknown",
  "engagementLevel": "High" | "Medium" | "Low" | "None",
  "confidence": 0-100 (number),
  "reasoning": "Brief explanation of the analysis"
}

Guidelines:
- buyerGroupRole: Analyze job title and department to determine their role in buying decisions
  * Economic Buyer: C-level, VP, budget holders
  * Technical Buyer: Directors, Managers in IT/Engineering
  * Champion: Managers, Senior roles who advocate
  * Influencer: Mid-level professionals who provide input
  * End User: Individual contributors who will use the product
- influenceLevel: Based on seniority, title, and company size
- decisionPower: Based on title keywords (Chief, VP, Director, Manager, etc.)
- engagementLevel: Based on recent actions and interaction history
- confidence: How confident you are in this assessment (0-100)

Return ONLY valid JSON, no additional text.`;

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseContent = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse JSON response
    const intelligence = JSON.parse(responseContent);
    
    return {
      buyerGroupRole: intelligence.buyerGroupRole || null,
      influenceLevel: intelligence.influenceLevel || null,
      decisionPower: intelligence.decisionPower || null,
      engagementLevel: intelligence.engagementLevel || null,
      confidence: intelligence.confidence || 0,
      reasoning: intelligence.reasoning || ''
    };

  } catch (error) {
    console.warn('⚠️ [PERSON INTELLIGENCE] AI generation failed, using rule-based fallback:', error);
    return generateRuleBasedIntelligence(context);
  }
}

/**
 * Generate intelligence using rule-based logic (fallback)
 */
function generateRuleBasedIntelligence(context: string): PersonIntelligence {
  const contextLower = context.toLowerCase();
  
  let buyerGroupRole = 'Unknown';
  let influenceLevel = 'Medium';
  let decisionPower = 'Medium';
  let engagementLevel = 'Low';
  let confidence = 50;
  
  // Determine buyer group role based on title keywords
  if (contextLower.includes('chief') || contextLower.includes('ceo') || contextLower.includes('cfo') || contextLower.includes('cto') || contextLower.includes('cmo')) {
    buyerGroupRole = 'Economic Buyer';
    influenceLevel = 'High';
    decisionPower = 'High';
    confidence = 90;
  } else if (contextLower.includes('vp') || contextLower.includes('vice president')) {
    buyerGroupRole = 'Economic Buyer';
    influenceLevel = 'High';
    decisionPower = 'High';
    confidence = 85;
  } else if (contextLower.includes('director')) {
    buyerGroupRole = 'Technical Buyer';
    influenceLevel = 'High';
    decisionPower = 'Medium';
    confidence = 75;
  } else if (contextLower.includes('manager') || contextLower.includes('head of')) {
    buyerGroupRole = 'Champion';
    influenceLevel = 'Medium';
    decisionPower = 'Medium';
    confidence = 70;
  } else if (contextLower.includes('engineer') || contextLower.includes('developer') || contextLower.includes('analyst')) {
    buyerGroupRole = 'End User';
    influenceLevel = 'Low';
    decisionPower = 'Low';
    confidence = 60;
  }

  // Adjust engagement level based on recent actions
  if (contextLower.includes('recent actions')) {
    const match = contextLower.match(/recent actions.*?(\d+)/);
    if (match) {
      const recentActionCount = parseInt(match[1]);
      if (recentActionCount >= 5) {
        engagementLevel = 'High';
      } else if (recentActionCount >= 2) {
        engagementLevel = 'Medium';
      }
    }
  }

  return {
    buyerGroupRole,
    influenceLevel,
    decisionPower,
    engagementLevel,
    confidence,
    reasoning: `Rule-based analysis: ${buyerGroupRole} based on title and position`
  };
}

/**
 * Store intelligence in database
 */
async function storeIntelligence(personId: string, intelligence: PersonIntelligence): Promise<void> {
  // Get existing custom fields
  const person = await prisma.people.findUnique({
    where: { id: personId },
    select: { customFields: true }
  });

  const existingCustomFields = (person?.customFields as any) || {};

  // Update person with intelligence
  await prisma.people.update({
    where: { id: personId },
    data: {
      buyerGroupRole: intelligence.buyerGroupRole,
      customFields: {
        ...existingCustomFields,
        influenceLevel: intelligence.influenceLevel,
        decisionPower: intelligence.decisionPower,
        engagementLevel: intelligence.engagementLevel,
        intelligenceConfidence: intelligence.confidence,
        intelligenceReasoning: intelligence.reasoning,
        intelligenceGeneratedAt: new Date().toISOString(),
        intelligenceModel: process.env.ANTHROPIC_API_KEY ? 'claude-3-5-sonnet-20241022' : 'rule-based'
      },
      updatedAt: new Date()
    }
  });

  console.log(`✅ [PERSON INTELLIGENCE] Stored intelligence for person ${personId}`);
}

/**
 * Batch generate intelligence for multiple people
 */
export async function batchGenerateIntelligence(
  personIds: string[],
  workspaceId: string,
  forceRegenerate: boolean = false
): Promise<{ success: number; failed: number; cached: number }> {
  let success = 0;
  let failed = 0;
  let cached = 0;

  for (const personId of personIds) {
    try {
      const result = await generatePersonIntelligence({
        personId,
        workspaceId,
        forceRegenerate
      });

      if (result.success) {
        if (result.cached) {
          cached++;
        } else {
          success++;
        }
      } else {
        failed++;
      }

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ [PERSON INTELLIGENCE] Error processing person ${personId}:`, error);
      failed++;
    }
  }

  return { success, failed, cached };
}

