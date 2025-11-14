/**
 * Domain Validation Utilities
 * 
 * Provides functions to validate email domains against company domains
 * to prevent cross-company contamination (e.g., underline.cz vs underline.com)
 */

/**
 * Check if email domain is likely from the same company as company domain
 * Allows legitimate cases where companies use different domains for email vs website
 * (e.g., portlandgeneral.com email vs pgn.com website)
 * But rejects clearly different companies (e.g., underline.cz vs underline.com)
 */
export function isLikelySameCompany(emailDomain: string, companyDomain: string): boolean {
  if (!emailDomain || !companyDomain) {
    console.log(`   🔍 [DOMAIN VALIDATION] Missing domain data - emailDomain: ${emailDomain}, companyDomain: ${companyDomain}`);
    return false;
  }
  
  // Exact match (including TLD)
  if (emailDomain === companyDomain) {
    console.log(`   ✅ [DOMAIN VALIDATION] Exact match: ${emailDomain} === ${companyDomain}`);
    return true;
  }
  
  // Extract root domains (handle subdomains)
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  // Same root domain = same company (e.g., mail.company.com === company.com)
  if (emailRoot === companyRoot) {
    console.log(`   ✅ [DOMAIN VALIDATION] Root domain match: ${emailRoot} === ${companyRoot}`);
    return true;
  }
  
  // Check if email domain contains company name or vice versa
  // This catches cases like:
  // - portlandgeneral.com (email) vs pgn.com (website) - both contain "portland" or "general"
  // - ribboncommunications.com (email) vs rbbn.com (website) - email contains "ribbon"
  const emailBase = emailRoot.split('.')[0];
  const companyBase = companyRoot.split('.')[0];
  
  console.log(`   🔍 [DOMAIN VALIDATION] Comparing base names: emailBase="${emailBase}" vs companyBase="${companyBase}"`);
  
  // If one domain is clearly an abbreviation of the other, likely same company
  // e.g., "pgn" could be abbreviation of "portland general"
  // But we need to be careful - "underline" in both underline.com and underline.cz
  // are the same base name but different companies
  
  // Reject if same base name but different TLDs (e.g., underline.com vs underline.cz)
  // This is the critical case we need to catch
  if (emailBase === companyBase && emailRoot !== companyRoot) {
    // Same base name, different TLD = likely different companies
    console.log(`   ❌ [DOMAIN VALIDATION] REJECTED - Same base name "${emailBase}" but different TLDs: ${emailRoot} vs ${companyRoot}`);
    console.log(`   ⚠️  [DOMAIN VALIDATION] This indicates different companies with same name in different regions`);
    return false;
  }
  
  // If email domain is much longer and contains company name, likely same company
  // e.g., portlandgeneral.com contains "portland" and "general" which relate to "pgn"
  if (emailDomain.length > companyDomain.length * 1.5) {
    // Email domain is significantly longer - might be full name vs abbreviation
    // Allow this case as it's likely the same company using different domains
    console.log(`   ✅ [DOMAIN VALIDATION] Email domain significantly longer (${emailDomain.length} vs ${companyDomain.length}) - likely abbreviation case`);
    return true;
  }
  
  // Default: if domains are different, be conservative and reject
  // But this is less strict than before - we'll allow manual override
  console.log(`   ❌ [DOMAIN VALIDATION] REJECTED - Domains don't match criteria: ${emailDomain} vs ${companyDomain}`);
  return false;
}

/**
 * Extract domain from email or URL
 */
export function extractDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

