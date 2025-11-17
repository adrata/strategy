import { PrismaClient } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Validate that a summary matches the company context (same logic as in intelligence route)
 */
function validateSummary(
  summary: string,
  companyName: string,
  companyIndustry: string | null,
  companyDomain: string | null
): { valid: boolean; reason?: string } {
  if (!summary || summary.trim() === '') {
    return { valid: false, reason: 'Summary is empty' };
  }
  
  const summaryLower = summary.toLowerCase();
  const industryLower = (companyIndustry || '').toLowerCase();
  const nameLower = (companyName || '').toLowerCase();
  const domainLower = (companyDomain || '').toLowerCase();
  
  // Check for Israeli/resort keywords
  const israeliKeywords = ['ישראל', 'israel', 'כפר נופש'];
  const hasIsraeliContent = israeliKeywords.some(keyword => summaryLower.includes(keyword.toLowerCase()));
  
  // Check for resort/hospitality content
  const hasResortContent = summaryLower.includes('resort') || 
                          summaryLower.includes('luxury resort') || 
                          summaryLower.includes('luxury hotel');
  
  // Check for utilities/transportation/energy industries
  const isUtilitiesOrTransport = industryLower.includes('utilities') || 
                                 industryLower.includes('transportation') || 
                                 industryLower.includes('logistics') ||
                                 industryLower.includes('supply chain') ||
                                 industryLower.includes('electric') ||
                                 industryLower.includes('energy');
  
  // Check for hospitality/tourism industries (where resort content would be valid)
  const isHospitalityIndustry = industryLower.includes('hospitality') || 
                                 industryLower.includes('tourism') || 
                                 industryLower.includes('hotel') ||
                                 industryLower.includes('resort');
  
  // Validate: If summary has Israeli content, it should not be used for non-Israeli companies
  if (hasIsraeliContent && !isHospitalityIndustry) {
    const isIsraeliCompany = nameLower.includes('israel') || 
                             domainLower.includes('.il') || 
                             domainLower.includes('israel');
    if (!isIsraeliCompany) {
      return { valid: false, reason: 'Summary contains Israeli content for non-Israeli company' };
    }
  }
  
  // Validate: Resort content should not appear in utilities/transportation companies
  if (hasResortContent && isUtilitiesOrTransport && !isHospitalityIndustry) {
    return { valid: false, reason: 'Summary contains resort content for utilities/transportation company' };
  }
  
  // Additional validation: Check for major company name/domain mismatches
  const majorCompanyNames = ['southern company', 'southernco', 'southern co'];
  const majorCompanyDomains = ['southernco.com', 'southerncompany.com'];
  
  const isMajorCompany = majorCompanyNames.some(name => nameLower.includes(name)) ||
                        majorCompanyDomains.some(domain => domainLower.includes(domain));
  
  if (isMajorCompany) {
    // Major utility companies should not have resort/Israeli content
    if (hasResortContent || hasIsraeliContent) {
      return { valid: false, reason: 'Summary contains mismatched content for major utility company' };
    }
    // Major companies should not be described as "small" with very few employees
    if (summaryLower.includes('small') && summaryLower.includes('2 employees')) {
      return { valid: false, reason: 'Summary incorrectly describes major utility company as small with 2 employees' };
    }
  }
  
  return { valid: true };
}

/**
 * Generate a company summary using AI
 */
async function generateCompanySummary(company: any): Promise<string | null> {
  try {
    // Build context from available data
    const contextParts: string[] = [];
    
    if (company.name) contextParts.push(`Company Name: ${company.name}`);
    if (company.industry) contextParts.push(`Industry: ${company.industry}`);
    if (company.website) contextParts.push(`Website: ${company.website}`);
    if (company.linkedinUrl) contextParts.push(`LinkedIn: ${company.linkedinUrl}`);
    
    const location = company.hqCity && company.hqState 
      ? `${company.hqCity}, ${company.hqState}` 
      : company.hqCity || company.hqState || company.city || company.state || company.address;
    if (location) contextParts.push(`Location: ${location}`);
    
    if (company.employeeCount) {
      contextParts.push(`Employees: ${company.employeeCount.toLocaleString()}`);
    } else if (company.size) {
      contextParts.push(`Company Size: ${company.size}`);
    }
    if (company.revenue) {
      contextParts.push(`Revenue: $${Number(company.revenue).toLocaleString()}`);
    }
    if (company.foundedYear) contextParts.push(`Founded: ${company.foundedYear}`);
    if (company.isPublic !== null) {
      contextParts.push(`Type: ${company.isPublic ? 'Public Company' : 'Private Company'}`);
    }
    
    if (company.relationshipType) contextParts.push(`Relationship Type: ${company.relationshipType}`);
    if (company.priority) contextParts.push(`Priority: ${company.priority}`);

    const availableContext = contextParts.join('\n');

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(`   ⚠️  No API key - skipping AI generation`);
      return null;
    }

    // Detect if this is a known major company with potentially incorrect data
    const majorCompanyDomains = ['southernco.com', 'southerncompany.com'];
    const companyDomain = company.website ? company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null;
    const isMajorCompanyDomain = companyDomain && majorCompanyDomains.some(d => companyDomain.includes(d));
    const hasSuspiciousData = isMajorCompanyDomain && company.employeeCount && company.employeeCount < 100;
    
    // Generate using Claude AI
    let prompt = `You are a B2B sales intelligence system. Generate a concise, professional company summary (2-3 sentences) based on the available information below. Focus on what's most relevant for a sales professional engaging with this company.

Available Company Information:
${availableContext}`;

    if (hasSuspiciousData) {
      prompt += `\n\nIMPORTANT: The company domain (${companyDomain}) suggests this is a major utility company, but the employee count data may be incorrect. Research the actual company (${company.name}) and generate an accurate summary based on what this company actually is, not the potentially incorrect employee count. If this is Southern Company (southernco.com), it is a major U.S. electric utility company, not a small transportation firm.`;
    }

    prompt += `\n\nGenerate a clear, factual summary that highlights:
1. What the company does (infer from industry and name if needed, but prioritize domain/website information for known major companies)
2. Key business characteristics (size, location, public/private status)
3. Relevant context for sales engagement (if data is available)

Keep it professional, concise, and actionable. Do not make up information that isn't provided. If minimal information is available, create a brief summary from what you have.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const generatedSummary = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Validate the generated summary before returning
    const validationDomain = company.website ? company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null;
    const validation = validateSummary(generatedSummary, company.name, company.industry, validationDomain);
    
    if (!validation.valid) {
      console.log(`   ⚠️  Generated summary failed validation: ${validation.reason}`);
      return null;
    }
    
    return generatedSummary;
  } catch (error) {
    console.error(`   ❌ Error generating summary:`, error);
    return null;
  }
}

/**
 * Main function to validate and ensure summaries
 */
async function validateAndEnsureSummaries() {
  console.log('🔍 VALIDATING AND ENSURING COMPANY SUMMARIES');
  console.log('================================================================================\n');

  const args = process.argv.slice(2);
  const workspaceIdArg = args.find(arg => arg.startsWith('--workspace-id='))?.split('=')[1];
  const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const dryRunArg = args.includes('--dry-run');
  const skipValidationArg = args.includes('--skip-validation');
  const skipGenerationArg = args.includes('--skip-generation');
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;

  if (!workspaceIdArg) {
    console.log('❌ Error: --workspace-id is required');
    console.log('Usage: npx tsx scripts/validate-and-ensure-summaries.ts --workspace-id=WORKSPACE_ID [--limit=N] [--dry-run] [--skip-validation] [--skip-generation]');
    process.exit(1);
  }

  const stats = {
    totalCompanies: 0,
    companiesWithSummaries: 0,
    companiesWithoutSummaries: 0,
    validated: 0,
    valid: 0,
    invalid: 0,
    cleared: 0,
    generated: 0,
    errors: 0,
  };

  try {
    console.log(`🎯 Workspace: ${workspaceIdArg}`);
    if (limit) console.log(`📊 Limit: ${limit} companies`);
    if (dryRunArg) console.log(`🔍 Dry Run: Yes (no changes will be made)`);
    if (skipValidationArg) console.log(`⏭️  Skipping validation`);
    if (skipGenerationArg) console.log(`⏭️  Skipping generation`);
    console.log('');

    // Fetch all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceIdArg,
        deletedAt: null,
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
        hqCity: true,
        hqState: true,
        city: true,
        state: true,
        address: true,
        employeeCount: true,
        size: true,
        revenue: true,
        foundedYear: true,
        isPublic: true,
        relationshipType: true,
        priority: true,
        linkedinUrl: true,
      },
      ...(limit ? { take: limit } : {}),
    });

    stats.totalCompanies = companies.length;
    console.log(`📊 Found ${stats.totalCompanies} companies\n`);

    if (companies.length === 0) {
      console.log('✅ No companies found!\n');
      return;
    }

    // Separate companies with and without summaries
    const companiesWithSummaries = companies.filter(
      c => c.descriptionEnriched && c.descriptionEnriched.trim() !== ''
    );
    const companiesWithoutSummaries = companies.filter(
      c => !c.descriptionEnriched || c.descriptionEnriched.trim() === ''
    );

    stats.companiesWithSummaries = companiesWithSummaries.length;
    stats.companiesWithoutSummaries = companiesWithoutSummaries.length;

    console.log(`📊 Summary Status:`);
    console.log(`   ✅ Companies WITH summaries: ${stats.companiesWithSummaries}`);
    console.log(`   ❌ Companies WITHOUT summaries: ${stats.companiesWithoutSummaries}\n`);

    // STEP 1: Validate existing summaries
    if (!skipValidationArg && companiesWithSummaries.length > 0) {
      console.log('='.repeat(80));
      console.log('STEP 1: VALIDATING EXISTING SUMMARIES');
      console.log('='.repeat(80) + '\n');

      let processed = 0;
      const invalidCompanies: Array<{
        id: string;
        name: string;
        reason: string;
      }> = [];

      for (const company of companiesWithSummaries) {
        try {
          if (!company.descriptionEnriched) continue;

          const industry = company.industry || company.sector || null;
          const domain = company.domain || (company.website ? company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null);
          
          const validation = validateSummary(
            company.descriptionEnriched,
            company.name,
            industry,
            domain
          );

          stats.validated++;

          if (validation.valid) {
            stats.valid++;
            if (processed < 5) {
              console.log(`   ✅ ${company.name}: Valid`);
            }
          } else {
            stats.invalid++;
            invalidCompanies.push({
              id: company.id,
              name: company.name,
              reason: validation.reason || 'Validation failed',
            });

            if (processed < 10) {
              console.log(`   ❌ ${company.name}: Invalid - ${validation.reason}`);
            }

            // Clear invalid summaries
            if (!dryRunArg) {
              await prisma.companies.update({
                where: { id: company.id },
                data: {
                  descriptionEnriched: null,
                  updatedAt: new Date(),
                },
              });

              stats.cleared++;
              // Mark as needing generation
              companiesWithoutSummaries.push(company);
            }
          }

          processed++;
          if (processed % 10 === 0) {
            process.stdout.write(`\r   Processed: ${processed}/${companiesWithSummaries.length}`);
          }
        } catch (error) {
          console.error(`\n   ❌ Error validating ${company.name}:`, error);
          stats.errors++;
        }
      }

      console.log(`\n\n📊 Validation Results:`);
      console.log(`   ✅ Valid: ${stats.valid}`);
      console.log(`   ❌ Invalid: ${stats.invalid}`);
      console.log(`   🧹 Cleared: ${stats.cleared}`);

      if (invalidCompanies.length > 0 && processed < 20) {
        console.log(`\n❌ Invalid Summaries Found:`);
        invalidCompanies.slice(0, 10).forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name}: ${c.reason}`);
        });
        if (invalidCompanies.length > 10) {
          console.log(`   ... and ${invalidCompanies.length - 10} more`);
        }
      }
    }

    // STEP 2: Generate summaries for companies without them
    if (!skipGenerationArg && companiesWithoutSummaries.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('STEP 2: GENERATING MISSING SUMMARIES');
      console.log('='.repeat(80) + '\n');

      let processed = 0;
      const companiesToGenerate = dryRunArg 
        ? companiesWithoutSummaries.slice(0, 5) // Show sample in dry run
        : companiesWithoutSummaries;

      for (const company of companiesToGenerate) {
        try {
          if (dryRunArg && processed >= 5) {
            console.log(`\n   ... and ${companiesWithoutSummaries.length - 5} more companies would be processed`);
            break;
          }

          console.log(`[${processed + 1}/${companiesToGenerate.length}] ${company.name}`);
          
          const summary = await generateCompanySummary(company);
          
          if (summary) {
            if (!dryRunArg) {
              await prisma.companies.update({
                where: { id: company.id },
                data: {
                  descriptionEnriched: summary,
                  updatedAt: new Date(),
                  customFields: {
                    ...((company as any).customFields || {}),
                    aiSummaryGeneratedAt: new Date().toISOString(),
                    aiSummaryModel: 'claude-sonnet-4-20250514',
                    aiSummarySource: 'validate-and-ensure-script',
                  },
                },
              });
            }

            console.log(`   ✅ Generated: ${summary.substring(0, 100)}...\n`);
            stats.generated++;
          } else {
            console.log(`   ⏭️  Skipped (validation failed or no API key)\n`);
          }

          processed++;
          
          // Rate limiting - wait 1 second between requests
          if (processed < companiesToGenerate.length && !dryRunArg) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`   ❌ Error:`, error);
          stats.errors++;
        }
      }

      console.log(`\n📊 Generation Results:`);
      console.log(`   ✅ Generated: ${stats.generated}`);
      console.log(`   ❌ Errors: ${stats.errors}`);
    }

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Companies: ${stats.totalCompanies}`);
    console.log(`Companies with Summaries (before): ${stats.companiesWithSummaries}`);
    console.log(`Companies without Summaries (before): ${stats.companiesWithoutSummaries}`);
    console.log(`Validated: ${stats.validated}`);
    console.log(`✅ Valid: ${stats.valid}`);
    console.log(`❌ Invalid: ${stats.invalid}`);
    console.log(`🧹 Cleared: ${stats.cleared}`);
    console.log(`✨ Generated: ${stats.generated}`);
    console.log(`❌ Errors: ${stats.errors}`);

    const finalWithSummaries = stats.companiesWithSummaries - stats.cleared + stats.generated;
    const finalWithoutSummaries = stats.totalCompanies - finalWithSummaries;
    
    console.log(`\n📈 After Processing:`);
    console.log(`   ✅ Companies with summaries: ${finalWithSummaries} (${((finalWithSummaries / stats.totalCompanies) * 100).toFixed(2)}%)`);
    console.log(`   ❌ Companies without summaries: ${finalWithoutSummaries} (${((finalWithoutSummaries / stats.totalCompanies) * 100).toFixed(2)}%)`);

    if (dryRunArg) {
      console.log(`\n🔍 DRY RUN: No changes were made. Run without --dry-run to apply fixes.`);
    }

  } catch (error) {
    console.error('❌ Error during validation and generation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

// Run the script
if (require.main === module) {
  validateAndEnsureSummaries()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { validateAndEnsureSummaries, validateSummary, generateCompanySummary };

