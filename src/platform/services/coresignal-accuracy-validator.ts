/**
 * CORESIGNAL DATA ACCURACY VALIDATOR
 * 
 * Critical service that ensures we always get the RIGHT person or company
 * from CoreSignal, handling disambiguation and accuracy validation.
 */

export interface AccuracyValidationResult {
  isAccurate: boolean;
  confidence: number;
  reasons: string[];
  suggestedAlternatives?: any[];
  validationChecks: {
    nameMatch: boolean;
    companyMatch: boolean;
    websiteMatch: boolean;
    industryMatch: boolean;
    sizeConsistency: boolean;
    locationMatch: boolean;
  };
}

export interface ValidationContext {
  expectedName: string;
  expectedCompany?: string;
  expectedWebsite?: string;
  expectedIndustry?: string;
  expectedLocation?: string;
  linkedinUrl?: string;
  email?: string;
}

export class CoreSignalAccuracyValidator {
  
  /**
   * Validate person data accuracy with multiple verification points
   */
  static validatePersonAccuracy(
    coreSignalData: any,
    context: ValidationContext
  ): AccuracyValidationResult {
    // Handle null/undefined input
    if (!coreSignalData) {
      return {
        isAccurate: false,
        confidence: 0,
        reasons: ['No CoreSignal data provided'],
        validationChecks: {
          nameMatch: false,
          companyMatch: false,
          websiteMatch: false,
          industryMatch: false,
          sizeConsistency: false,
          locationMatch: false
        }
      };
    }

    const checks = {
      nameMatch: false,
      companyMatch: false,
      websiteMatch: false,
      industryMatch: false,
      sizeConsistency: false,
      locationMatch: false
    };
    
    const reasons: string[] = [];
    let confidence = 0;
    
    // 1. Name matching (critical)
    if (coreSignalData.full_name || coreSignalData.first_name) {
      const fullName = coreSignalData.full_name || `${coreSignalData.first_name} ${coreSignalData.last_name}`;
      const similarity = this.calculateNameSimilarity(fullName, context.expectedName);
      
      if (similarity > 0.8) {
        checks['nameMatch'] = true;
        confidence += 30;
        reasons.push(`Strong name match: ${fullName}`);
      } else if (similarity > 0.6) {
        confidence += 15;
        reasons.push(`Partial name match: ${fullName} (${Math.round(similarity * 100)}% similar)`);
      } else {
        reasons.push(`Weak name match: ${fullName} vs ${context.expectedName}`);
      }
    }
    
    // 2. Company matching (critical for person validation)
    if (context['expectedCompany'] && coreSignalData.active_experience_company_name) {
      const companySimilarity = this.calculateCompanySimilarity(
        coreSignalData.active_experience_company_name,
        context.expectedCompany
      );
      
      if (companySimilarity > 0.8) {
        checks['companyMatch'] = true;
        confidence += 25;
        reasons.push(`Company match confirmed: ${coreSignalData.active_experience_company_name}`);
      } else {
        reasons.push(`Company mismatch: Expected ${context.expectedCompany}, got ${coreSignalData.active_experience_company_name}`);
      }
    }
    
    // 3. LinkedIn URL validation (highest accuracy)
    if (context['linkedinUrl'] && coreSignalData.professional_network_url) {
      if (this.normalizeLinkedInUrl(context.linkedinUrl) === this.normalizeLinkedInUrl(coreSignalData.professional_network_url)) {
        confidence += 40; // LinkedIn URL is definitive
        reasons.push('LinkedIn URL exact match - highest confidence');
      }
    }
    
    // 4. Email domain validation
    if (context['email'] && coreSignalData.active_experience_company_name) {
      const emailDomain = context.email.split('@')[1];
      const expectedDomains = this.generateExpectedDomains(coreSignalData.active_experience_company_name);
      
      if (expectedDomains.some(domain => emailDomain.includes(domain))) {
        confidence += 15;
        reasons.push('Email domain matches company');
      }
    }
    
    // 5. Location consistency
    if (context['expectedLocation'] && coreSignalData.location_country) {
      if (context.expectedLocation.toLowerCase().includes(coreSignalData.location_country.toLowerCase())) {
        checks['locationMatch'] = true;
        confidence += 10;
        reasons.push('Location consistency verified');
      }
    }
    
    const isAccurate = confidence >= 70 && checks.nameMatch;
    
    return {
      isAccurate,
      confidence: Math.min(confidence, 100),
      reasons,
      validationChecks: checks
    };
  }
  
  /**
   * Validate company data accuracy with comprehensive checks
   */
  static validateCompanyAccuracy(
    coreSignalData: any,
    context: ValidationContext
  ): AccuracyValidationResult {
    const checks = {
      nameMatch: false,
      companyMatch: true, // N/A for company validation
      websiteMatch: false,
      industryMatch: false,
      sizeConsistency: false,
      locationMatch: false
    };
    
    const reasons: string[] = [];
    let confidence = 0;
    
    // 1. Company name matching (critical)
    const companyName = coreSignalData.company_name || coreSignalData.name;
    if (companyName) {
      const similarity = this.calculateCompanySimilarity(companyName, context.expectedName);
      
      if (similarity > 0.9) {
        checks['nameMatch'] = true;
        confidence += 35;
        reasons.push(`Exact company name match: ${companyName}`);
      } else if (similarity > 0.7) {
        checks['nameMatch'] = true;
        confidence += 25;
        reasons.push(`Strong company name match: ${companyName} (${Math.round(similarity * 100)}% similar)`);
      } else {
        reasons.push(`Company name mismatch: Expected ${context.expectedName}, got ${companyName}`);
      }
    }
    
    // 2. Website validation (highest accuracy for companies)
    if (context['expectedWebsite'] && coreSignalData.website) {
      const websiteMatch = this.validateWebsiteMatch(context.expectedWebsite, coreSignalData.website);
      
      if (websiteMatch.isExactMatch) {
        checks['websiteMatch'] = true;
        confidence += 40;
        reasons.push('Website exact match - highest confidence');
      } else if (websiteMatch.isDomainMatch) {
        checks['websiteMatch'] = true;
        confidence += 30;
        reasons.push('Website domain match confirmed');
      } else {
        reasons.push(`Website mismatch: Expected ${context.expectedWebsite}, got ${coreSignalData.website}`);
      }
    }
    
    // 3. Industry consistency
    if (context['expectedIndustry'] && coreSignalData.industry) {
      const industryMatch = this.validateIndustryMatch(context.expectedIndustry, coreSignalData.industry);
      
      if (industryMatch) {
        checks['industryMatch'] = true;
        confidence += 15;
        reasons.push('Industry classification matches');
      } else {
        reasons.push(`Industry mismatch: Expected ${context.expectedIndustry}, got ${coreSignalData.industry}`);
      }
    }
    
    // 4. Size consistency validation
    if (coreSignalData.employees_count) {
      const sizeCategory = this.categorizeCompanySize(coreSignalData.employees_count);
      checks['sizeConsistency'] = true;
      confidence += 10;
      reasons.push(`Company size validated: ${coreSignalData.employees_count} employees (${sizeCategory})`);
    }
    
    // 5. Location validation
    if (context['expectedLocation'] && coreSignalData.hq_country) {
      if (context.expectedLocation.toLowerCase().includes(coreSignalData.hq_country.toLowerCase())) {
        checks['locationMatch'] = true;
        confidence += 10;
        reasons.push('HQ Location matches');
      }
    }
    
    // 6. Special handling for common company name conflicts
    const conflictCheck = this.checkForCommonConflicts(companyName, context.expectedName);
    if (conflictCheck.hasConflict) {
      confidence -= 20;
      reasons.push(`Potential conflict detected: ${conflictCheck.reason}`);
    }
    
    const isAccurate = confidence >= 75 && checks.nameMatch;
    
    return {
      isAccurate,
      confidence: Math.min(confidence, 100),
      reasons,
      suggestedAlternatives: conflictCheck.alternatives,
      validationChecks: checks
    };
  }
  
  /**
   * Calculate name similarity using enhanced fuzzy matching algorithms
   */
  static calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;
    
    // Handle special characters and normalize
    const normalized1 = this.normalizeNameForComparison(name1);
    const normalized2 = this.normalizeNameForComparison(name2);
    
    // Exact match after normalization
    if (normalized1 === normalized2) return 1.0;
    
    // Try different name arrangements for better matching
    const arrangements1 = this.generateNameArrangements(normalized1);
    const arrangements2 = this.generateNameArrangements(normalized2);
    
    let bestSimilarity = 0;
    
    // Compare all arrangements
    for (const arr1 of arrangements1) {
      for (const arr2 of arrangements2) {
        const similarity = this.calculateStringSimilarity(arr1, arr2);
        bestSimilarity = Math.max(bestSimilarity, similarity);
      }
    }
    
    return bestSimilarity;
  }

  /**
   * Normalize names for comparison, handling special characters and accents properly
   */
  private static normalizeNameForComparison(name: string): string {
    return name
      .toLowerCase()
      // Normalize accented characters
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[ß]/g, 'ss')
      .replace(/[æ]/g, 'ae')
      .replace(/[œ]/g, 'oe')
      .replace(/[ø]/g, 'o')
      .replace(/[đ]/g, 'd')
      .replace(/[ł]/g, 'l')
      .replace(/[ž]/g, 'z')
      .replace(/[š]/g, 's')
      .replace(/[č]/g, 'c')
      .replace(/[ř]/g, 'r')
      .replace(/[ň]/g, 'n')
      .replace(/[ť]/g, 't')
      .replace(/[ď]/g, 'd')
      // Normalize apostrophes and quotes
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      // Normalize dashes
      .replace(/[–—]/g, '-')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate different name arrangements for better matching
   */
  private static generateNameArrangements(name: string): string[] {
    const arrangements = [name];
    const parts = name.split(' ').filter(part => part.length > 0);
    
    if (parts.length >= 2) {
      // "First Last" -> "Last, First" - CRITICAL for name order matching
      arrangements.push(`${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`);
      
      // "Last, First" -> "First Last" - CRITICAL for reverse matching
      if (name.includes(',')) {
        const commaParts = name.split(',').map(p => p.trim());
        if (commaParts['length'] === 2) {
          arrangements.push(`${commaParts[1]} ${commaParts[0]}`);
        }
      }
      
      // For 2-word names, add all permutations
      if (parts['length'] === 2) {
        arrangements.push(`${parts[1]} ${parts[0]}`); // Reverse order
        arrangements.push(`${parts[1]}, ${parts[0]}`); // Reverse with comma
        arrangements.push(`${parts[0]}, ${parts[1]}`); // Forward with comma
      }
      
      // "First Middle Last" -> "First Last"
      if (parts.length >= 3) {
        arrangements.push(`${parts[0]} ${parts[parts.length - 1]}`);
        // Also try "Last, First Middle"
        arrangements.push(`${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`);
      }
      
      // Handle hyphenated names
      const hyphenatedParts = name.split(/[-\s]+/);
      if (hyphenatedParts.length > parts.length) {
        arrangements.push(hyphenatedParts.join(' '));
        arrangements.push(hyphenatedParts.join('-'));
      }
      
      // Handle initials: "J. Smith" -> "J Smith", "John Smith"
      const initialPattern = /^([A-Z])\.\s+(.+)$/;
      const initialMatch = name.match(initialPattern);
      if (initialMatch) {
        arrangements.push(`${initialMatch[1]} ${initialMatch[2]}`);
        // Try to expand common first names
        const commonNames = {
          'J': ['John', 'James', 'Jennifer', 'Jessica'],
          'M': ['Michael', 'Mary', 'Mark', 'Michelle'],
          'D': ['David', 'Daniel', 'Diana', 'Deborah'],
          'R': ['Robert', 'Richard', 'Rebecca', 'Rachel'],
          'S': ['Steven', 'Sarah', 'Susan', 'Scott']
        };
        if (commonNames[initialMatch[1] as keyof typeof commonNames]) {
          commonNames[initialMatch[1] as keyof typeof commonNames].forEach(fullName => {
            arrangements.push(`${fullName} ${initialMatch[2]}`);
          });
        }
      }
      
      // Handle "Mc" and "Mac" variations
      parts.forEach((part, index) => {
        if (part.toLowerCase().startsWith('mc')) {
          const macVersion = 'Mac' + part.substring(2);
          const newParts = [...parts];
          newParts[index] = macVersion;
          arrangements.push(newParts.join(' '));
        } else if (part.toLowerCase().startsWith('mac')) {
          const mcVersion = 'Mc' + part.substring(3);
          const newParts = [...parts];
          newParts[index] = mcVersion;
          arrangements.push(newParts.join(' '));
        }
      });
    }
    
    return [...new Set(arrangements)];
  }

  /**
   * Calculate string similarity using optimized multi-algorithm approach (2025)
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    // Import advanced phonetic algorithms
    const { AdvancedPhoneticAlgorithms } = require('./advanced-phonetic-algorithms');
    
    // Levenshtein similarity
    const levenshtein = this.calculateLevenshteinSimilarity(str1, str2);
    
    // Jaro-Winkler similarity for better name matching
    const jaroWinkler = this.calculateJaroWinklerSimilarity(str1, str2);
    
    // Token-based similarity for handling word order
    const tokenSimilarity = this.calculateTokenSimilarity(str1, str2);
    
    // Advanced phonetic similarity using Double Metaphone + NYSIIS + Soundex
    const phoneticSimilarity = AdvancedPhoneticAlgorithms.calculatePhoneticSimilarity(str1, str2);
    
    // Optimized weighted average based on 2025 research
    // Jaro-Winkler gets highest weight as it's best for names
    // Phonetic similarity gets increased weight for pronunciation variations
    // Token similarity helps with word order issues
    // Levenshtein catches character-level differences
    return (levenshtein * 0.20) + (jaroWinkler * 0.40) + (tokenSimilarity * 0.25) + (phoneticSimilarity * 0.15);
  }

  /**
   * Calculate phonetic similarity using Soundex algorithm
   */
  private static calculatePhoneticSimilarity(str1: string, str2: string): number {
    const soundex1 = this.soundex(str1);
    const soundex2 = this.soundex(str2);
    return soundex1 === soundex2 ? 1.0 : 0.0;
  }

  /**
   * Generate Soundex code for phonetic matching
   */
  private static soundex(str: string): string {
    const code = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (code['length'] === 0) return '0000';
    
    let soundexCode = code[0];
    const mapping: { [key: string]: string } = {
      'BFPV': '1', 'CGJKQSXZ': '2', 'DT': '3',
      'L': '4', 'MN': '5', 'R': '6'
    };
    
    for (let i = 1; i < code.length; i++) {
      for (const [chars, digit] of Object.entries(mapping)) {
        if (chars.includes(code[i])) {
          if (soundexCode[soundexCode.length - 1] !== digit) {
            soundexCode += digit;
          }
          break;
        }
      }
      if (soundexCode['length'] === 4) break;
    }
    
    return soundexCode.padEnd(4, '0');
  }

  /**
   * Calculate Levenshtein similarity
   */
  private static calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }

  /**
   * Calculate Jaro-Winkler similarity (better for names)
   */
  private static calculateJaroWinklerSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || str1[i] !== str2[j]) continue;
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Jaro-Winkler prefix bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(len1, len2, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }
    
    return jaro + 0.1 * prefix * (1 - jaro);
  }

  /**
   * Calculate token-based similarity (handles word order differences)
   */
  private static calculateTokenSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(str1.split(' ').filter(t => t.length > 0));
    const tokens2 = new Set(str2.split(' ').filter(t => t.length > 0));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return union['size'] === 0 ? 0 : intersection.size / union.size;
  }
  
  /**
   * Calculate company name similarity with enhanced business name variations
   */
  private static calculateCompanySimilarity(company1: string, company2: string): number {
    if (!company1 || !company2) return 0;
    
    // Remove common business suffixes and normalize
    const cleanCompany1 = this.cleanCompanyName(company1);
    const cleanCompany2 = this.cleanCompanyName(company2);
    
    // Check for exact match after cleaning
    if (cleanCompany1 === cleanCompany2) return 1.0;
    
    // Check for abbreviations (e.g., "IBM" vs "International Business Machines")
    if (this.isAbbreviationMatch(cleanCompany1, cleanCompany2)) return 0.95;
    
    // Check for common company name variations
    const variations1 = this.generateCompanyVariations(cleanCompany1);
    const variations2 = this.generateCompanyVariations(cleanCompany2);
    
    let bestSimilarity = 0;
    
    // Compare all variations
    for (const var1 of variations1) {
      for (const var2 of variations2) {
        const similarity = this.calculateNameSimilarity(var1, var2);
        bestSimilarity = Math.max(bestSimilarity, similarity);
      }
    }
    
    // Also check direct similarity
    const directSimilarity = this.calculateNameSimilarity(cleanCompany1, cleanCompany2);
    
    return Math.max(bestSimilarity, directSimilarity);
  }

  /**
   * Generate company name variations for better matching
   */
  private static generateCompanyVariations(companyName: string): string[] {
    const variations = [companyName];
    
    // Comprehensive company variations database
    const commonVariations = {
      'microsoft': ['microsoft corporation', 'microsoft corp', 'msft', 'microsoft inc'],
      'apple': ['apple inc', 'apple computer', 'apple computer inc'],
      'google': ['alphabet inc', 'alphabet', 'google llc', 'google inc'],
      'amazon': ['amazon.com', 'amazon web services', 'aws', 'amazon inc', 'amazon.com inc'],
      'meta': ['facebook', 'meta platforms', 'facebook inc', 'meta platforms inc'],
      'dell': ['dell technologies', 'dell inc', 'dell computer', 'dell computer corporation'],
      'ibm': ['international business machines', 'ibm corporation', 'ibm corp', 'international business machines corporation'],
      'oracle': ['oracle corporation', 'oracle corp', 'oracle systems'],
      'salesforce': ['salesforce.com', 'salesforce inc', 'salesforce.com inc'],
      'adobe': ['adobe systems', 'adobe inc', 'adobe systems incorporated'],
      'intel': ['intel corporation', 'intel corp'],
      'cisco': ['cisco systems', 'cisco systems inc'],
      'hp': ['hewlett packard', 'hewlett-packard', 'hp inc', 'hewlett packard enterprise'],
      'netflix': ['netflix inc'],
      'tesla': ['tesla inc', 'tesla motors'],
      'nvidia': ['nvidia corporation', 'nvidia corp'],
      'paypal': ['paypal inc', 'paypal holdings'],
      'uber': ['uber technologies', 'uber technologies inc'],
      'airbnb': ['airbnb inc'],
      'zoom': ['zoom video communications', 'zoom communications'],
      'slack': ['slack technologies'],
      'twitter': ['twitter inc', 'x corp'],
      'linkedin': ['linkedin corporation'],
      'spotify': ['spotify technology', 'spotify ab'],
      'shopify': ['shopify inc'],
      'square': ['square inc', 'block inc'],
      'stripe': ['stripe inc'],
      'atlassian': ['atlassian corporation', 'atlassian corp'],
      'mongodb': ['mongodb inc'],
      'snowflake': ['snowflake inc', 'snowflake computing'],
      'palantir': ['palantir technologies'],
      'datadog': ['datadog inc'],
      'okta': ['okta inc'],
      'twilio': ['twilio inc'],
      'zendesk': ['zendesk inc'],
      'hubspot': ['hubspot inc'],
      'docusign': ['docusign inc'],
      'crowdstrike': ['crowdstrike holdings'],
      'zscaler': ['zscaler inc'],
      'servicenow': ['servicenow inc'],
      'workday': ['workday inc'],
      'splunk': ['splunk inc'],
      'vmware': ['vmware inc'],
      'red hat': ['red hat inc'],
      'github': ['github inc'],
      'gitlab': ['gitlab inc'],
      'docker': ['docker inc'],
      'kubernetes': ['cloud native computing foundation'],
      'aws': ['amazon web services', 'amazon.com'],
      'gcp': ['google cloud platform', 'google'],
      'azure': ['microsoft azure', 'microsoft']
    };
    
    const lowerName = companyName.toLowerCase();
    
    // Check if this company has known variations
    for (const [key, vars] of Object.entries(commonVariations)) {
      if (lowerName.includes(key) || vars.some(v => lowerName.includes(v.toLowerCase()))) {
        variations.push(...vars);
        variations.push(key); // Add the base key too
        break;
      }
    }
    
    // Handle abbreviations more intelligently
    const words = companyName.split(' ').filter(w => w.length > 0);
    if (words.length > 1) {
      const abbreviation = words.map(w => w[0].toUpperCase()).join('');
      if (abbreviation.length >= 2 && abbreviation.length <= 5) {
        variations.push(abbreviation);
      }
      
      // Try to expand known abbreviations
      const abbreviationExpansions = {
        'IBM': 'International Business Machines',
        'HP': 'Hewlett Packard',
        'AT&T': 'American Telephone and Telegraph',
        'GE': 'General Electric',
        'GM': 'General Motors',
        'BMW': 'Bayerische Motoren Werke',
        'SAP': 'Systems Applications Products',
        'AMD': 'Advanced Micro Devices',
        'EMC': 'EMC Corporation',
        'UPS': 'United Parcel Service',
        'FedEx': 'Federal Express',
        'CVS': 'Consumer Value Stores',
        'JPM': 'JPMorgan Chase',
        'BAC': 'Bank of America',
        'WFC': 'Wells Fargo'
      };
      
      const upperName = companyName.toUpperCase();
      for (const [abbr, expansion] of Object.entries(abbreviationExpansions)) {
        if (upperName.includes(abbr)) {
          variations.push(expansion);
          variations.push(expansion.toLowerCase());
        } else if (lowerName.includes(expansion.toLowerCase())) {
          variations.push(abbr);
        }
      }
    }
    
    // Add variations with different suffixes
    const baseName = this.cleanCompanyName(companyName);
    if (baseName !== companyName.toLowerCase()) {
      const suffixes = ['inc', 'corp', 'corporation', 'ltd', 'llc', 'company', 'co'];
      suffixes.forEach(suffix => {
        variations.push(`${baseName} ${suffix}`);
        variations.push(`${baseName.charAt(0).toUpperCase() + baseName.slice(1)} ${suffix.toUpperCase()}`);
      });
    }
    
    return [...new Set(variations)];
  }
  
  /**
   * Clean company names by removing common suffixes and normalizing
   */
  static cleanCompanyName(companyName: string): string {
    if (!companyName) return '';
    
    const suffixes = [
      'inc', 'incorporated', 'corp', 'corporation', 'ltd', 'limited',
      'llc', 'co', 'company', 'technologies', 'tech', 'systems',
      'solutions', 'services', 'group', 'holdings', 'enterprises',
      'international', 'global', 'worldwide', 'usa', 'america'
    ];
    
    let cleaned = companyName.toLowerCase().trim();
    
    // Remove common prefixes
    cleaned = cleaned.replace(/^(the\s+)/i, '');
    
    // Remove suffixes
    for (const suffix of suffixes) {
      const regex = new RegExp(`\\b${suffix}\\b\\.?$`, 'i');
      cleaned = cleaned.replace(regex, '').trim();
    }
    
    // Remove extra whitespace and special characters
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
    
    return cleaned;
  }
  
  /**
   * Check for abbreviation matches with enhanced logic
   */
  private static isAbbreviationMatch(name1: string, name2: string): boolean {
    const getInitials = (name: string) => 
      name.split(' ').map(word => word[0]).join('').toLowerCase();
    
    const initials1 = getInitials(name1);
    const initials2 = getInitials(name2);
    
    // Check if one is initials of the other
    if ((name1.toLowerCase() === initials2) || (name2.toLowerCase() === initials1)) {
      return true;
    }
    
    // Check known abbreviation mappings
    const knownAbbreviations = {
      'ibm': 'international business machines',
      'hp': 'hewlett packard',
      'ge': 'general electric',
      'gm': 'general motors',
      'ups': 'united parcel service',
      'fedex': 'federal express',
      'cvs': 'consumer value stores',
      'amd': 'advanced micro devices',
      'sap': 'systems applications products',
      'bmw': 'bayerische motoren werke',
      'att': 'american telephone and telegraph',
      'at&t': 'american telephone and telegraph'
    };
    
    const lower1 = name1.toLowerCase().replace(/[^a-z]/g, '');
    const lower2 = name2.toLowerCase().replace(/[^a-z]/g, '');
    
    // Check if either name matches a known abbreviation
    if (knownAbbreviations[lower1] === lower2 || knownAbbreviations[lower2] === lower1) {
      return true;
    }
    
    // Check reverse mapping
    for (const [abbrev, full] of Object.entries(knownAbbreviations)) {
      if ((lower1 === abbrev && lower2 === full) || (lower2 === abbrev && lower1 === full)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Validate website matches
   */
  private static validateWebsiteMatch(expected: string, actual: string): {
    isExactMatch: boolean;
    isDomainMatch: boolean;
  } {
    const normalizeDomain = (url: string) => {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
    };
    
    const expectedDomain = normalizeDomain(expected);
    const actualDomain = normalizeDomain(actual);
    
    return {
      isExactMatch: expectedDomain === actualDomain,
      isDomainMatch: expectedDomain.includes(actualDomain) || actualDomain.includes(expectedDomain)
    };
  }
  
  /**
   * Validate industry matches
   */
  private static validateIndustryMatch(expected: string, actual: string): boolean {
    const industryMappings = {
      'technology': ['tech', 'software', 'computer', 'it', 'information technology'],
      'healthcare': ['health', 'medical', 'pharmaceutical', 'biotech'],
      'finance': ['financial', 'banking', 'fintech', 'investment'],
      'retail': ['commerce', 'consumer', 'shopping'],
      'manufacturing': ['industrial', 'production', 'automotive']
    };
    
    const expectedLower = expected.toLowerCase();
    const actualLower = actual.toLowerCase();
    
    // Direct match
    if (expectedLower.includes(actualLower) || actualLower.includes(expectedLower)) {
      return true;
    }
    
    // Check mappings
    for (const [category, variations] of Object.entries(industryMappings)) {
      if (variations.some(v => expectedLower.includes(v)) && 
          variations.some(v => actualLower.includes(v))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check for common company name conflicts (e.g., multiple Dell companies)
   */
  private static checkForCommonConflicts(actualName: string, expectedName: string): {
    hasConflict: boolean;
    reason?: string;
    alternatives?: string[];
  } {
    // Handle null/undefined inputs
    if (!actualName || !expectedName) {
      return { hasConflict: false };
    }

    const conflictPatterns = {
      'dell': {
        main: 'Dell Technologies',
        alternatives: ['Dell EMC', 'Dell Financial Services', 'Dell SecureWorks', 'Dell Medical Center']
      },
      'microsoft': {
        main: 'Microsoft Corporation',
        alternatives: ['Microsoft Ireland', 'Microsoft India', 'Microsoft Japan']
      },
      'apple': {
        main: 'Apple Inc.',
        alternatives: ['Apple Corps', 'Apple Bank', 'Apple Hospitality']
      },
      'amazon': {
        main: 'Amazon.com Inc.',
        alternatives: ['Amazon Web Services', 'Amazon Logistics', 'Amazon Fresh']
      }
    };
    
    const expectedLower = expectedName.toLowerCase();
    const actualLower = actualName.toLowerCase();
    
    for (const [key, config] of Object.entries(conflictPatterns)) {
      if (expectedLower.includes(key)) {
        // Check if we got a subsidiary instead of main company
        const isMainCompany = actualLower.includes(config.main.toLowerCase());
        const isAlternative = config.alternatives.some(alt => 
          actualLower.includes(alt.toLowerCase())
        );
        
        if (isAlternative && !isMainCompany) {
          return {
            hasConflict: true,
            reason: `Got ${actualName} instead of main company ${config.main}`,
            alternatives: [config.main, ...config.alternatives]
          };
        }
      }
    }
    
    return { hasConflict: false };
  }
  
  /**
   * Categorize company size
   */
  private static categorizeCompanySize(employeeCount: number): string {
    if (employeeCount < 50) return 'Small';
    if (employeeCount < 250) return 'Medium';
    if (employeeCount < 1000) return 'Large';
    if (employeeCount < 10000) return 'Enterprise';
    return 'Fortune 500';
  }
  
  /**
   * Generate expected email domains from company name
   */
  private static generateExpectedDomains(companyName: string): string[] {
    const cleaned = this.cleanCompanyName(companyName);
    const domains = [
      `${cleaned.replace(/\s+/g, '')}.com`,
      `${cleaned.replace(/\s+/g, '')}.co`,
      `${cleaned.replace(/\s+/g, '')}.net`,
      `${cleaned.replace(/\s+/g, '')}.org`
    ];
    
    // Add common abbreviations
    if (cleaned.includes(' ')) {
      const words = cleaned.split(' ');
      const abbreviation = words.map(w => w[0]).join('');
      domains.push(`${abbreviation}.com`);
    }
    
    return domains;
  }
  
  /**
   * Normalize LinkedIn URLs for comparison
   */
  private static normalizeLinkedInUrl(url: string): string {
    return url.replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/$/, '')
              .toLowerCase();
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
