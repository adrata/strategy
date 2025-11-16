import { PrismaClient } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function testSouthernCompany() {
  const company = await prisma.companies.findUnique({
    where: { id: '01K9QD2ST0C0TTG34EMRD3M69H' },
    select: {
      id: true,
      name: true,
      industry: true,
      description: true,
      descriptionEnriched: true,
      domain: true,
    },
  });

  if (!company) {
    console.log('Company not found');
    return;
  }

  console.log('Testing Southern Company validation:');
  console.log(`Name: ${company.name}`);
  console.log(`Industry: ${company.industry}`);
  console.log(`Description: ${company.description?.substring(0, 150) || 'N/A'}...`);
  console.log(`Domain: ${company.domain || 'N/A'}\n`);

  if (!company.description) {
    console.log('No description to validate');
    await prisma.$disconnect();
    return;
  }

  const prompt = `You are a data quality analyst. Determine if this company description accurately matches the company's industry.

Company Name: ${company.name}
Industry: ${company.industry || 'Unknown'}
Domain: ${company.domain || 'Not provided'}
Description: ${company.description.substring(0, 2000)}

Analyze if this description accurately describes a company in the stated industry. Look for content mismatches, language mismatches, geographic mismatches, or industry mismatches.

Respond with JSON:
{
  "isValid": true/false,
  "reason": "Brief explanation",
  "confidence": "high" | "medium" | "low",
  "suggestedAction": "keep" | "clear" | "regenerate"
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const text = content.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('\nAI Validation Result:');
        console.log(`✅ Valid: ${result.isValid}`);
        console.log(`Reason: ${result.reason}`);
        console.log(`Confidence: ${result.confidence}`);
        console.log(`Action: ${result.suggestedAction}`);
      } else {
        console.log('\nAI Response:', text);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }

  await prisma.$disconnect();
}

testSouthernCompany();

