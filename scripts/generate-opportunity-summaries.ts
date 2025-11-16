/**
 * Script to generate Claude AI summaries for opportunities
 * Run with: npx tsx scripts/generate-opportunity-summaries.ts
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function generateOpportunitySummary(company: any) {
  // Build context from available opportunity data
  const contextParts = [];
  
  if (company.name) {
    contextParts.push(`Company: ${company.name}`);
  }
  
  if (company.industry) {
    contextParts.push(`Industry: ${company.industry}`);
  }
  
  if (company.description || company.descriptionEnriched) {
    contextParts.push(`Description: ${company.descriptionEnriched || company.description}`);
  }
  
  if (company.opportunityAmount) {
    contextParts.push(`Deal Value: $${Number(company.opportunityAmount).toLocaleString()}`);
  }
  
  if (company.opportunityStage) {
    contextParts.push(`Stage: ${company.opportunityStage}`);
  }
  
  if (company.size || company.employeeCount) {
    contextParts.push(`Size: ${company.size || `${company.employeeCount} employees`}`);
  }
  
  if (company.city || company.state) {
    const location = [company.city, company.state].filter(Boolean).join(', ');
    if (location) contextParts.push(`Location: ${location}`);
  }
  
  if (company.lastAction) {
    contextParts.push(`Recent Activity: ${company.lastAction}`);
  }

  const availableContext = contextParts.join('\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️ ANTHROPIC_API_KEY not set, skipping AI summary generation');
    return null;
  }

  // Generate summary using Claude AI
  const prompt = `You are a B2B sales intelligence system. Generate a concise, professional opportunity summary (2-3 sentences) for a sales professional. Focus on what makes this opportunity valuable and actionable.

Opportunity Information:
${availableContext}

Generate a clear, factual summary that highlights:
1. What the opportunity represents (company, industry, deal size)
2. Key characteristics that make it valuable (stage, size, location)
3. Relevant context for sales engagement (recent activity, stage progression)

Keep it professional, concise, and actionable. Do not make up information that isn't provided.`;

  try {
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
    return aiSummary.trim();
  } catch (error) {
    console.error(`❌ Error generating summary for ${company.id}:`, error);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 Starting opportunity summary generation...');
    
    // Get all opportunities (companies with status = OPPORTUNITY)
    const opportunities = await prisma.companies.findMany({
      where: {
        status: 'OPPORTUNITY',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        industry: true,
        description: true,
        descriptionEnriched: true,
        opportunityAmount: true,
        opportunityStage: true,
        size: true,
        employeeCount: true,
        city: true,
        state: true,
        lastAction: true,
      },
    });

    console.log(`📊 Found ${opportunities.length} opportunities to process`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const opportunity of opportunities) {
      try {
        // Check if summary already exists in descriptionEnriched
        if (opportunity.descriptionEnriched && opportunity.descriptionEnriched.length > 50) {
          console.log(`⏭️  Skipping ${opportunity.name} - already has description`);
          skipCount++;
          continue;
        }

        console.log(`🤖 Generating summary for: ${opportunity.name}`);
        const summary = await generateOpportunitySummary(opportunity);

        if (summary) {
          // Store summary in descriptionEnriched field (or we could add a new field)
          await prisma.companies.update({
            where: { id: opportunity.id },
            data: { descriptionEnriched: summary },
          });
          console.log(`✅ Generated summary for ${opportunity.name}`);
          successCount++;
        } else {
          errorCount++;
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error processing ${opportunity.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Summary Generation Complete:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

