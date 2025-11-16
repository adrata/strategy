import { PrismaClient } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction?: 'keep' | 'clear' | 'regenerate';
}

/**
 * Use Claude to validate if a company description matches its industry
 */
async function validateDescriptionWithAI(
  companyName: string,
  industry: string | null,
  description: string,
  domain?: string | null
): Promise<ValidationResult> {
  try {
    const prompt = `You are a data quality analyst. Your task is to determine if a company description accurately matches the company's industry.

Company Name: ${companyName}
Industry: ${industry || 'Unknown'}
Domain: ${domain || 'Not provided'}
Description: ${description.substring(0, 2000)}${description.length > 2000 ? '...' : ''}

Analyze if this description accurately describes a company in the stated industry. Look for:
1. Content mismatches (e.g., resort description for a utilities company)
2. Language mismatches (e.g., Hebrew text for a US company)
3. Geographic mismatches (e.g., Israeli location for a US company)
4. Industry mismatches (e.g., hospitality content for utilities industry)

Respond with a JSON object in this exact format:
{
  "isValid": true/false,
  "reason": "Brief explanation of why it's valid or invalid",
  "confidence": "high" | "medium" | "low",
  "suggestedAction": "keep" | "clear" | "regenerate"
}

If the description is clearly mismatched (like an Israeli resort description for a US utilities company), set isValid to false and suggestedAction to "clear".
If the description is valid but could be improved, set isValid to true and suggestedAction to "keep".
If the description is partially valid but has issues, set isValid to false and suggestedAction to "regenerate".`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5', // Use the latest Claude 4.5 Sonnet model
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const text = content.text.trim();
      
      // Try to extract JSON from the response
      let jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]) as ValidationResult;
          return result;
        } catch (e) {
          // If JSON parsing fails, try to infer from text
          const lowerText = text.toLowerCase();
          if (lowerText.includes('invalid') || lowerText.includes('mismatch') || lowerText.includes('does not match')) {
            return {
              isValid: false,
              reason: 'AI detected mismatch',
              confidence: 'medium',
              suggestedAction: 'clear',
            };
          }
        }
      }
      
      // Fallback: analyze text response
      const lowerText = text.toLowerCase();
      const hasMismatch = lowerText.includes('mismatch') || 
                         lowerText.includes('does not match') || 
                         lowerText.includes('invalid') ||
                         lowerText.includes('incorrect');
      
      return {
        isValid: !hasMismatch,
        reason: text.substring(0, 200),
        confidence: hasMismatch ? 'high' : 'medium',
        suggestedAction: hasMismatch ? 'clear' : 'keep',
      };
    }

    return {
      isValid: true,
      reason: 'Unable to parse AI response',
      confidence: 'low',
      suggestedAction: 'keep',
    };
  } catch (error) {
    console.error(`   ❌ AI validation error:`, error);
    return {
      isValid: true, // Default to keeping if AI fails
      reason: error instanceof Error ? error.message : 'Unknown error',
      confidence: 'low',
      suggestedAction: 'keep',
    };
  }
}

async function validateAllDescriptions() {
  console.log('🤖 VALIDATING ALL COMPANY DESCRIPTIONS WITH AI');
  console.log('================================================================================\n');

  const args = process.argv.slice(2);
  const workspaceIdArg = args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1];
  const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const dryRunArg = args.includes('--dry-run');
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;

  if (!workspaceIdArg) {
    console.log('❌ Error: --workspace-id is required');
    console.log('Usage: npx tsx scripts/validate-descriptions-with-ai.ts --workspace-id=WORKSPACE_ID [--limit=N] [--dry-run]');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('❌ Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const stats = {
    totalCompanies: 0,
    companiesWithDescriptions: 0,
    validated: 0,
    valid: 0,
    invalid: 0,
    cleared: 0,
    errors: 0,
    skipped: 0,
  };

  try {
    console.log(`🎯 Workspace: ${workspaceIdArg}`);
    if (limit) console.log(`📊 Limit: ${limit} companies`);
    if (dryRunArg) console.log(`🔍 Dry Run: Yes (no changes will be made)\n`);

    // Fetch companies with descriptions
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceIdArg,
        deletedAt: null,
        OR: [
          { description: { not: null } },
          { descriptionEnriched: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        industry: true,
        sector: true,
        description: true,
        descriptionEnriched: true,
        domain: true,
        website: true,
        customFields: true,
      },
      ...(limit ? { take: limit } : {}),
    });

    stats.totalCompanies = companies.length;
    console.log(`📊 Found ${stats.totalCompanies} companies\n`);

    if (companies.length === 0) {
      console.log('✅ No companies found!\n');
      return;
    }

    console.log('🤖 Validating descriptions with Claude AI...\n');

    let processed = 0;
    const invalidCompanies: Array<{
      id: string;
      name: string;
      field: 'description' | 'descriptionEnriched';
      reason: string;
    }> = [];

    for (const company of companies) {
      try {
        // Check both description and descriptionEnriched
        const descriptionsToCheck = [
          { field: 'description' as const, value: company.description },
          { field: 'descriptionEnriched' as const, value: company.descriptionEnriched },
        ].filter(d => d.value && d.value.trim() !== '');

        if (descriptionsToCheck.length === 0) {
          stats.skipped++;
          continue;
        }

        stats.companiesWithDescriptions++;

        for (const { field, value } of descriptionsToCheck) {
          if (!value || value.trim() === '') continue;

          // Use industry or sector
          const industry = company.industry || company.sector || null;

          // Validate with AI
          const validation = await validateDescriptionWithAI(
            company.name,
            industry,
            value,
            company.domain || company.website || null
          );

          stats.validated++;

          if (validation.isValid) {
            stats.valid++;
            if (processed < 5) {
              console.log(`   ✅ ${company.name} (${field}): Valid`);
            }
          } else {
            stats.invalid++;
            invalidCompanies.push({
              id: company.id,
              name: company.name,
              field,
              reason: validation.reason || 'AI detected mismatch',
            });

            if (processed < 10) {
              console.log(`   ❌ ${company.name} (${field}): Invalid - ${validation.reason}`);
              console.log(`      Confidence: ${validation.confidence}, Action: ${validation.suggestedAction}`);
            }

            // Clear invalid descriptions
            if (!dryRunArg && validation.suggestedAction === 'clear') {
              const updates: any = {};
              if (field === 'description') {
                updates.description = null;
              } else {
                updates.descriptionEnriched = null;
              }

              await prisma.companies.update({
                where: { id: company.id },
                data: {
                  ...updates,
                  updatedAt: new Date(),
                },
              });

              stats.cleared++;
            }
          }

          // Rate limiting - wait a bit between API calls
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        processed++;
        if (processed % 10 === 0) {
          process.stdout.write(`\r   Processed: ${processed}/${companies.length}`);
        }
      } catch (error) {
        console.error(`\n   ❌ Error validating ${company.name}:`, error);
        stats.errors++;
      }
    }

    console.log(`\n\n📊 VALIDATION RESULTS:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`Total Companies: ${stats.totalCompanies}`);
    console.log(`Companies with Descriptions: ${stats.companiesWithDescriptions}`);
    console.log(`Descriptions Validated: ${stats.validated}`);
    console.log(`✅ Valid: ${stats.valid}`);
    console.log(`❌ Invalid: ${stats.invalid}`);
    console.log(`🧹 Cleared: ${stats.cleared}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);

    if (invalidCompanies.length > 0) {
      console.log(`\n\n❌ INVALID DESCRIPTIONS FOUND:`);
      console.log('─────────────────────────────────────────────────────────────────────────────');
      invalidCompanies.slice(0, 20).forEach((c, i) => {
        console.log(`${i + 1}. ${c.name} (${c.field}): ${c.reason}`);
      });
      if (invalidCompanies.length > 20) {
        console.log(`\n... and ${invalidCompanies.length - 20} more`);
      }
    }

    if (dryRunArg) {
      console.log(`\n\n🔍 DRY RUN: No changes were made. Run without --dry-run to apply fixes.`);
    } else if (stats.cleared > 0) {
      console.log(`\n\n✅ Successfully cleared ${stats.cleared} invalid descriptions`);
    }

  } catch (error) {
    console.error('❌ Error during validation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

validateAllDescriptions();

