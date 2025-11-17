/**
 * Generate AI-powered summaries for all companies without descriptions
 * 
 * Usage: node scripts/generate-company-summaries.js [--workspace=WORKSPACE_ID] [--limit=N] [--dry-run]
 */

const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Parse command line arguments
const args = process.argv.slice(2);
const workspaceId = args.find(arg => arg.startsWith('--workspace='))?.split('=')[1];
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0');
const isDryRun = args.includes('--dry-run');

console.log('🤖 Company Summary Generation Script');
console.log('=====================================');
console.log(`Workspace ID: ${workspaceId || 'ALL'}`);
console.log(`Limit: ${limit || 'UNLIMITED'}`);
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
console.log('');

// Validate that a generated summary matches the company context
function validateGeneratedSummary(summary, companyName, companyIndustry, companyDomain) {
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
  
  // Additional validation: Check for major company name mismatches
  const majorCompanyNames = ['southern company', 'southernco', 'southern co'];
  if (majorCompanyNames.some(name => nameLower.includes(name))) {
    if (hasResortContent || hasIsraeliContent) {
      return { valid: false, reason: 'Summary contains mismatched content for major utility company' };
    }
  }
  
  return { valid: true };
}

async function generateCompanySummary(company) {
  // Build context from available data
  const contextParts = [];
  
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

  // Generate fallback if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    const fallbackParts = [];
    
    if (company.name) {
      const typeStr = company.isPublic === true ? 'public' : company.isPublic === false ? 'private' : '';
      fallbackParts.push(`${company.name} is${typeStr ? ` a ${typeStr}` : ''}`);
    }
    
    if (company.industry) {
      fallbackParts.push(`${fallbackParts.length > 0 ? '' : 'This is a'}${company.industry.toLowerCase()} company`);
    }
    
    if (location) fallbackParts.push(`based in ${location}`);
    
    if (company.employeeCount) {
      fallbackParts.push(`with approximately ${company.employeeCount.toLocaleString()} employees`);
    }
    
    return fallbackParts.length > 0 
      ? fallbackParts.join(' ') + '.' 
      : `${company.name} - Professional services company.`;
  }

  // Generate using Claude AI
  const prompt = `You are a B2B sales intelligence system. Generate a concise, professional company summary (2-3 sentences) based on the available information below. Focus on what's most relevant for a sales professional engaging with this company.

Available Company Information:
${availableContext}

Generate a clear, factual summary that highlights:
1. What the company does (infer from industry and name if needed)
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
  const domain = company.website ? company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null;
  const validation = validateGeneratedSummary(generatedSummary, company.name, company.industry, domain);
  
  if (!validation.valid) {
    console.log(`⚠️  Generated summary failed validation: ${validation.reason}`);
    console.log(`   Summary preview: ${generatedSummary.substring(0, 100)}...`);
    // Return null to indicate validation failure - caller should handle this
    return null;
  }
  
  return generatedSummary;
}

async function main() {
  try {
    // Build where clause
    const whereClause = {
      deletedAt: null,
      AND: [
        {
          OR: [
            { description: null },
            { description: '' },
          ]
        },
        {
          OR: [
            { descriptionEnriched: null },
            { descriptionEnriched: '' },
          ]
        }
      ]
    };

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }

    // Get companies without descriptions
    const companies = await prisma.companies.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        linkedinUrl: true,
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
      },
      take: limit || undefined,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Found ${companies.length} companies without descriptions\n`);

    if (isDryRun) {
      console.log('🔍 DRY RUN - No changes will be made\n');
      console.log('Sample companies:');
      companies.slice(0, 5).forEach(company => {
        console.log(`  - ${company.name} (${company.id})`);
      });
      console.log('');
      await prisma.$disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      try {
        console.log(`[${i + 1}/${companies.length}] Generating summary for: ${company.name}`);
        
        const summary = await generateCompanySummary(company);
        
        // Skip if validation failed (summary will be null)
        if (!summary) {
          console.log(`⏭️  Skipped due to validation failure\n`);
          errorCount++;
          continue;
        }
        
        // Update the company
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            descriptionEnriched: summary,
            updatedAt: new Date(),
            customFields: {
              ...(company.customFields || {}),
              aiSummaryGeneratedAt: new Date().toISOString(),
              aiSummaryModel: 'claude-sonnet-4-20250514',
              aiSummarySource: 'batch-script',
            },
          },
        });

        console.log(`✅ Success: ${summary.substring(0, 100)}...\n`);
        successCount++;
        
        // Rate limiting - wait 1 second between requests
        if (i < companies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error for ${company.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=====================================');
    console.log('Summary Generation Complete');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

