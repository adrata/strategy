#!/usr/bin/env ts-node

/**
 * Fix Incorrect Intelligence Summaries Script
 * 
 * This script identifies and regenerates intelligence summaries for companies
 * that were incorrectly classified with the hardcoded "Technology" fallback.
 * 
 * Run with: npx ts-node scripts/fix-incorrect-intelligence-summaries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CompanyRecord {
  id: string;
  name: string;
  industry: string | null;
  sector: string | null;
  customFields: any;
  descriptionEnriched: string | null;
}

interface MigrationStats {
  totalCompanies: number;
  companiesWithCachedIntelligence: number;
  companiesWithIncorrectIndustry: number;
  companiesRegenerated: number;
  companiesSkipped: number;
  errors: number;
}

/**
 * Check if a company has potentially incorrect intelligence
 */
function hasIncorrectIntelligence(company: CompanyRecord): boolean {
  const customFields = company.customFields as any;
  
  // No cached intelligence, skip
  if (!customFields?.intelligence) {
    return false;
  }
  
  const intelligence = customFields.intelligence;
  
  // Check if company has no real industry data
  const hasNoIndustryData = !company.industry || company.industry.trim() === '';
  const hasNoSectorData = !company.sector || company.sector.trim() === '';
  
  if (!hasNoIndustryData) {
    // Company has industry data, skip
    return false;
  }
  
  // Check if intelligence says "technology company" or uses Technology default
  const intelligenceIndustry = intelligence.industry;
  const strategicIntelligence = intelligence.strategicIntelligence || '';
  const descriptionEnriched = company.descriptionEnriched || '';
  
  // If intelligence industry is "Technology" but company has no industry data, it's likely incorrect
  if (intelligenceIndustry === 'Technology' && hasNoIndustryData && hasNoSectorData) {
    return true;
  }
  
  // Check if description mentions "technology company" when industry is null
  if (hasNoIndustryData && (
    descriptionEnriched.toLowerCase().includes('technology company') ||
    descriptionEnriched.toLowerCase().includes('tech company') ||
    strategicIntelligence.toLowerCase().includes('technology company')
  )) {
    return true;
  }
  
  return false;
}

/**
 * Regenerate intelligence for a company by clearing cached data
 */
async function regenerateIntelligence(companyId: string): Promise<boolean> {
  try {
    // Clear the cached intelligence and descriptionEnriched
    // This will cause it to regenerate on next view with the fixed logic
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { customFields: true }
    });
    
    if (!company) {
      console.error(`  ❌ Company not found: ${companyId}`);
      return false;
    }
    
    const customFields = (company.customFields as any) || {};
    
    // Remove the intelligence cache
    if (customFields.intelligence) {
      delete customFields.intelligence;
    }
    
    // Update the company to clear cached intelligence
    await prisma.companies.update({
      where: { id: companyId },
      data: {
        customFields: customFields,
        descriptionEnriched: null, // Clear this so it regenerates
        updatedAt: new Date()
      }
    });
    
    console.log(`  ✅ Cleared cached intelligence for regeneration`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error regenerating intelligence:`, error);
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🔄 Starting intelligence summary migration...\n');
  
  const stats: MigrationStats = {
    totalCompanies: 0,
    companiesWithCachedIntelligence: 0,
    companiesWithIncorrectIndustry: 0,
    companiesRegenerated: 0,
    companiesSkipped: 0,
    errors: 0
  };
  
  try {
    // Get all companies with cached intelligence
    console.log('📊 Fetching companies with cached intelligence...');
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        industry: true,
        sector: true,
        customFields: true,
        descriptionEnriched: true
      }
    });
    
    stats.totalCompanies = companies.length;
    console.log(`Found ${stats.totalCompanies} total companies\n`);
    
    // Filter companies with cached intelligence
    const companiesWithIntelligence = companies.filter(c => {
      const customFields = c.customFields as any;
      return customFields?.intelligence;
    });
    
    stats.companiesWithCachedIntelligence = companiesWithIntelligence.length;
    console.log(`Found ${stats.companiesWithCachedIntelligence} companies with cached intelligence\n`);
    
    // Clear ALL cached intelligence to ensure everything uses the new fixed logic
    const companiesNeedingFix: CompanyRecord[] = companiesWithIntelligence;
    stats.companiesWithIncorrectIndustry = companiesWithIntelligence.length;
    
    console.log(`\n📋 Clearing cached intelligence for ${stats.companiesWithIncorrectIndustry} companies to ensure all use new logic:\n`);
    
    if (companiesNeedingFix.length === 0) {
      console.log('✅ No companies have cached intelligence!\n');
      return;
    }
    
    // Show sample of companies that will have cache cleared
    console.log('Sample of companies that will have cached intelligence cleared:');
    companiesNeedingFix.slice(0, 5).forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (ID: ${company.id})`);
      console.log(`     Industry: ${company.industry || 'NULL'}`);
      console.log(`     Sector: ${company.sector || 'NULL'}`);
      const customFields = company.customFields as any;
      console.log(`     Cached Intelligence Industry: ${customFields?.intelligence?.industry || 'N/A'}`);
      console.log('');
    });
    
    if (companiesNeedingFix.length > 5) {
      console.log(`  ... and ${companiesNeedingFix.length - 5} more\n`);
    }
    
    console.log(`\n⚠️  About to clear cached intelligence for ${companiesNeedingFix.length} companies\n`);
    
    // Clear cached intelligence for each company
    console.log('🔄 Starting cache clearing process...\n');
    
    for (let i = 0; i < companiesNeedingFix.length; i++) {
      const company = companiesNeedingFix[i];
      console.log(`[${i + 1}/${companiesNeedingFix.length}] Processing: ${company.name}`);
      
      const success = await regenerateIntelligence(company.id);
      
      if (success) {
        stats.companiesRegenerated++;
      } else {
        stats.errors++;
      }
      
      // Add small delay to avoid overwhelming the system
      if (i < companiesNeedingFix.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total companies:                     ${stats.totalCompanies}`);
    console.log(`Companies with cached intelligence:  ${stats.companiesWithCachedIntelligence}`);
    console.log(`Cached intelligence cleared:         ${stats.companiesRegenerated}`);
    console.log(`Errors:                              ${stats.errors}`);
    console.log('='.repeat(60));
    
    if (stats.companiesRegenerated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\nNote: All cached intelligence has been cleared.');
      console.log('Intelligence will regenerate automatically when users view these companies.');
      console.log('The new logic will properly handle missing industry data without defaulting to "Technology".');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

