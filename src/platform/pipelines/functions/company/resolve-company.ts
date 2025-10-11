/**
 * COMPANY RESOLUTION FUNCTION
 * 
 * Pure, idempotent function for resolving company information
 * from URL or name using CoreSignal API
 */

import type { PipelineStep } from '../../../intelligence/shared/orchestration';
import { CoreSignalMultiSource } from '../../modules/core/CoreSignalMultiSource';

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyInput {
  companyUrl: string;
  companyName?: string;
}

export interface CompanyResolution {
  companyName: string;
  domain: string;
  companyId: string;
  industry?: string;
  size?: string;
  creditsUsed: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    // If URL parsing fails, assume it's already a domain
    return url.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
  }
}

/**
 * Generate company name variations for better matching
 */
function generateCompanyNameVariations(companyName: string): string[] {
  const variations = [companyName];
  
  // Remove common suffixes
  const suffixes = ['Inc', 'Corp', 'Corporation', 'LLC', 'Ltd', 'Limited', 'Company', 'Co'];
  for (const suffix of suffixes) {
    const withoutSuffix = companyName.replace(new RegExp(`\\s+${suffix}$`, 'i'), '').trim();
    if (withoutSuffix !== companyName) {
      variations.push(withoutSuffix);
    }
  }
  
  // Add common variations
  variations.push(companyName.toLowerCase());
  variations.push(companyName.toUpperCase());
  
  return [...new Set(variations)]; // Remove duplicates
}

// ============================================================================
// PURE FUNCTION
// ============================================================================

export const resolveCompanyFunction: PipelineStep<CompanyInput, CompanyResolution> = {
  name: 'resolveCompany',
  description: 'Resolve company information from URL or name using CoreSignal',
  retryable: true,
  timeout: 10000,
  dependencies: [],
  
  execute: async (input, context) => {
    console.log(`🏢 Resolving company: ${input.companyUrl}`);
    
    const coresignal = new CoreSignalMultiSource(context.config);
    
    // Extract domain from URL
    const domain = extractDomain(input.companyUrl);
    console.log(`   📍 Extracted domain: ${domain}`);
    
    // Generate company name variations
    const companyName = input.companyName || domain;
    const nameVariations = generateCompanyNameVariations(companyName);
    console.log(`   🔍 Trying ${nameVariations.length} name variations`);
    
    let companyId: string | null = null;
    let creditsUsed = 0;
    
    // Try each variation until we find a match
    for (const variation of nameVariations) {
      try {
        console.log(`   🔎 Searching for: "${variation}"`);
        companyId = await coresignal.searchCompanyId(variation, domain);
        creditsUsed++;
        
        if (companyId) {
          console.log(`   ✅ Found company ID: ${companyId} for "${variation}"`);
          break;
        }
      } catch (error) {
        console.log(`   ⚠️ Search failed for "${variation}": ${error.message}`);
        creditsUsed++;
      }
    }
    
    if (!companyId) {
      throw new Error(`Company not found: ${input.companyUrl} (tried ${nameVariations.length} variations)`);
    }
    
    // Return resolved company information
    const result: CompanyResolution = {
      companyName: companyName,
      domain,
      companyId,
      creditsUsed
    };
    
    console.log(`   ✅ Company resolved: ${result.companyName} (ID: ${result.companyId})`);
    return result;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default resolveCompanyFunction;
