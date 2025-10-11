/**
 * 👤 PROFILE ANALYZER
 * 
 * Transforms and analyzes CoreSignal profiles for buyer group identification
 */

import { CoreSignalProfile, PersonProfile, SellerProfile } from './types';

export class ProfileAnalyzer {
  
  /**
   * Transform CoreSignal profile to PersonProfile format
   */
  transformProfile(profile: CoreSignalProfile, companyName: string, aliases: string[] = [], enforceExact = true): PersonProfile {
    const currentExp = this.getCurrentExperience(profile, companyName, aliases, enforceExact);
    const seniorityLevel = this.calculateSeniorityLevel(currentExp?.position_title || profile.active_experience_title || profile.headline || '');
    const influenceScore = this.calculateInfluenceScore(profile, currentExp, seniorityLevel);
    
    // ACCURACY FIX: Enhanced company identification logic based on actual CoreSignal data structure
    let identifiedCompany = 'Unknown Company';
    
    // Primary: Current experience company name
    if (currentExp?.company_name) {
      identifiedCompany = currentExp.company_name;
    } 
    // Secondary: Find active experience in experience array
    else if (profile['experience'] && Array.isArray(profile.experience)) {
      const activeExp = profile.experience.find((exp: any) => exp?.active_experience === 1);
      if (activeExp?.company_name) {
        identifiedCompany = activeExp.company_name;
      }
    }
    // Tertiary: Try latest experience
    else if (profile['experience'] && Array.isArray(profile.experience) && (profile.experience as any[]).length > 0) {
      const latestExp = (profile.experience as any[])[0]; // Usually sorted by most recent
      if (latestExp?.company_name) {
        identifiedCompany = latestExp.company_name;
      }
    }
    
    return {
      id: profile.id,
      name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      title: currentExp?.position_title || profile.active_experience_title || profile.headline || '',
      department: currentExp?.department || profile.active_experience_department || '',
      managementLevel: currentExp?.management_level || profile.active_experience_management_level || '',
      company: identifiedCompany,
      location: profile.location_full || profile.location_country || '',
      linkedinUrl: profile.professional_network_url || profile.linkedin_url || '',
      influenceScore,
      seniorityLevel,
      isAboveTheLine: this.isAboveTheLine(seniorityLevel, currentExp?.position_title || ''),
      connections: profile.connections_count || profile.connections || 0,
      currentExperience: currentExp ? {
        title: currentExp.position_title || '',
        department: currentExp.department || '',
        managementLevel: currentExp.management_level || '',
        tenure: this.calculateTenure(currentExp.date_from)
      } : undefined
    };
  }

  /**
   * Get current experience at target company
   */
  private getCurrentExperience(profile: CoreSignalProfile, companyName: string, aliases: string[] = [], enforceExact = true) {
    if (!profile.experience || !Array.isArray(profile.experience)) return null;
    
    const allCompanyVariants = [companyName, ...aliases];
    
    // First try: Look for current experience with exact company match
    let currentExps = profile.experience.filter(exp => 
      exp['active_experience'] === 1 && 
      this.isCompanyMatch(exp.company_name, companyName, aliases, enforceExact)
    );
    
    // More strict validation: only accept if we have actual current employment match
    // Don't fall back to headline mentions as they may be historical references
    
    return currentExps[0] || null;
  }

  /**
   * STRICT COMPANY VALIDATION - Check if experience company matches target company
   * CRITICAL: Prevents "Chief Of Police" type mismatches
   */
  private isCompanyMatch(expCompany: string | undefined, targetCompany: string, aliases: string[] = [], enforceExact = true): boolean {
    if (!expCompany) return false;
    
    const expLower = expCompany.toLowerCase().trim();
    const targetLower = targetCompany.toLowerCase().trim();
    
    // COMPREHENSIVE DELL VALIDATION - matches seller profile configuration
    if (targetLower.includes('dell')) {
      const dellVariants = [
        'dell technologies',
        'dell inc',
        'dell computer',
        'dell emc',
        'dell corp',
        'dell services', 
        'dell financial services',
        'dell boomi',
        'dell secureworks',
        'dell software',
        'dell digital',
        'vmware', // Dell subsidiary
        'one identity', // Dell subsidiary  
        'pivotal', // Dell subsidiary
        'rsa security', // Dell subsidiary
        'dell computer corporation',
        'dell technologies inc',
        'dell technologies corp',
        'boomi', // Dell Boomi (often just "Boomi")
        'secureworks', // SecureWorks (often without Dell prefix)
        'emc corporation', // EMC (Dell acquired)
        'emc corp'
      ];
      
      // ENHANCED DELL MATCHING - more flexible but still precise
      return dellVariants.some(variant => {
        const variantNorm = variant.replace(/[^a-z0-9]/g, '');
        const expNorm = expLower.replace(/[^a-z0-9]/g, '');
        
        // Exact match
        if (expNorm === variantNorm) return true;
        
        // Contains match (for subsidiaries)
        if (expNorm.includes(variantNorm) || variantNorm.includes(expNorm)) return true;
        
        // Special cases for Dell subsidiaries
        if (variant === 'boomi' && expNorm.includes('boomi')) return true;
        if (variant === 'secureworks' && expNorm.includes('secureworks')) return true;
        if (variant === 'vmware' && expNorm.includes('vmware')) return true;
        if (variant === 'emc' && (expNorm.includes('emc') || expNorm.includes('emccorp'))) return true;
        
        return false;
      });
    }
    
    // STRICT VALIDATION: No partial word matches that could cause false positives
    const forbiddenMatches = [
      'police', 'government', 'university', 'school', 'hospital',
      'medical', 'healthcare', 'education', 'military', 'army',
      'navy', 'air force', 'department', 'ministry', 'council'
    ];
    
    // BLOCK if experience company contains forbidden terms
    if (forbiddenMatches.some(term => expLower.includes(term))) {
      return false;
    }
    
    // Standard matching for other companies
    const allTargets = [targetCompany, ...aliases].map(s => s.toLowerCase().trim());
    
    if (enforceExact) {
      return allTargets.some(target => expLower === target);
    }
    
    // Only allow substring matches if they're substantial (>50% overlap)
    const normalized = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const expNorm = normalized(expCompany);
    const targetNorm = normalized(targetCompany);
    
    // Require significant overlap to prevent false matches
    const overlapThreshold = Math.min(targetNorm.length, expNorm.length) * 0.7;
    const overlap = this.calculateStringOverlap(expNorm, targetNorm);
    
    return overlap >= overlapThreshold;
  }
  
  /**
   * Calculate string overlap for company matching
   */
  private calculateStringOverlap(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    let overlap = 0;
    const shorter = str1.length < str2.length ? str1 : str2;
    const longer = str1.length >= str2.length ? str1 : str2;
    
    for (let i = 0; i < shorter.length; i++) {
      const char = shorter[i];
      if (char && longer.includes(char)) {
        overlap++;
      }
    }
    
    return overlap;
  }

  /**
   * Calculate seniority level from title
   */
  private calculateSeniorityLevel(title: string): PersonProfile['seniorityLevel'] {
    const titleLower = title.toLowerCase();
    
    if (/\b(ceo|cfo|coo|cto|ciso|cro|chief|president)\b/.test(titleLower)) return 'C-Level';
    if (/\b(vp|vice president|svp|senior vice president)\b/.test(titleLower)) return 'VP';
    if (/\b(director|dir)\b/.test(titleLower)) return 'Director';
    if (/\b(manager|mgr|head of|lead)\b/.test(titleLower)) return 'Manager';
    return 'IC';
  }

  /**
   * Calculate influence score based on multiple factors
   */
  private calculateInfluenceScore(profile: CoreSignalProfile, currentExp: any, seniorityLevel: string): number {
    let score = 0;
    
    // Seniority weight
    const seniorityScores: Record<PersonProfile['seniorityLevel'], number> = { 
      'C-Level': 10, 'VP': 8, 'Director': 6, 'Manager': 4, 'IC': 2 
    };
    score += seniorityScores[seniorityLevel as PersonProfile['seniorityLevel']] || 0;
    
    // Network size
    const connections = profile.connections_count || profile.connections || 0;
    if (connections > 500) score += 3;
    else if (connections > 100) score += 2;
    else if (connections > 50) score += 1;

    // Decision-maker signal (CoreSignal uses 1/0 not boolean)
    if (profile['is_decision_maker'] === 1) score += 5;
    
    // Salary proxy (authority/budget)
    if (profile.projected_total_salary_p75 && profile.projected_total_salary_p75 > 150000) {
      score += 3;
    } else if (profile.projected_total_salary_p75 && profile.projected_total_salary_p75 > 100000) {
      score += 1;
    }
    
    // Recent role start tends to drive urgency and visibility
    if (profile['experience_recently_started'] && profile.experience_recently_started.length > 0) {
      score += 2;
    }
    
    // Total experience duration (seasoned professional)
    if (profile.total_experience_duration_months) {
      if (profile.total_experience_duration_months > 120) score += 2; // 10+ years
      else if (profile.total_experience_duration_months > 60) score += 1; // 5+ years
    }
    
    return Math.min(score, 25); // Cap at 25
  }

  /**
   * Check if person is "above the line" (decision-making level)
   */
  private isAboveTheLine(seniorityLevel: string, title: string): boolean {
    if (['C-Level', 'VP'].includes(seniorityLevel)) return true;
    if (seniorityLevel === 'Director') return true;
    
    // Special cases for Manager level in key functions
    const titleLower = title.toLowerCase();
    return /\b(head of|manager.*sales|manager.*revenue)\b/.test(titleLower);
  }

  /**
   * Calculate tenure in months
   */
  private calculateTenure(startDate?: string): number {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // months
  }

  /**
   * Check if profile passes quality filters
   * CRITICAL: Role-specific validation - not everyone needs to be in sales
   */
  passesQualityFilters(
    profile: PersonProfile, 
    sellerProfile: SellerProfile,
    analysisConfig: {
      minInfluenceScore: number;
      requireDirector: boolean;
      allowIC: boolean;
    }
  ): boolean {
    // CRITICAL: Role-specific validation - stakeholders, blockers, and some decision makers are NOT in sales
    // Only enforce sales function for introducers and champions
    const requiresSalesFunction = this.shouldRequireSalesFunction(profile, sellerProfile);
    if (requiresSalesFunction && !this.isInSalesFunction(profile)) {
      return false;
    }
    
    // CRITICAL: Company validation - must actually work at target company
    if (!this.worksAtTargetCompany(profile, sellerProfile)) {
      return false;
    }
    
    // Minimum influence score
    if (profile.influenceScore < analysisConfig.minInfluenceScore) return false;
    
    // Director requirement
    if (analysisConfig['requireDirector'] && !['C-Level', 'VP', 'Director'].includes(profile.seniorityLevel)) return false;
    
    // IC filter
    if (!analysisConfig['allowIC'] && profile['seniorityLevel'] === 'IC') return false;
    
    // Disqualifiers (FIXED: Removed blocker titles to allow procurement/legal/security roles)
    const strictDisqualifiers = [
      ...sellerProfile.disqualifiers,
      'police', 'security guard', 'officer', 'detective', 'sheriff',
      'hr', 'human resources', 'facilities', 'maintenance', 'janitor'
      // REMOVED: 'legal counsel', 'attorney', 'paralegal', 'compliance officer' - these are valid blockers
    ];
    
    if (strictDisqualifiers.some(term => 
      profile.title.toLowerCase().includes(term) ||
      profile.department.toLowerCase().includes(term)
    )) return false;
    
    return true;
  }
  
  /**
   * INTELLIGENT ROLE-BASED VALIDATION: Determine if profile should be in sales function
   */
  private shouldRequireSalesFunction(profile: PersonProfile, sellerProfile: SellerProfile): boolean {
    const titleLower = profile.title.toLowerCase();
    const deptLower = profile.department.toLowerCase();
    
    // C-Level and VPs don't need to be in sales (they're decision makers/stakeholders)
    const executiveLevel = ['ceo', 'cfo', 'coo', 'cro', 'chief', 'vp ', 'vice president'].some(title => titleLower.includes(title));
    if (executiveLevel) return false;
    
    // Finance, Legal, IT, Security, Procurement are valid stakeholders/blockers
    const nonSalesRoles = [
      'finance', 'financial', 'accounting', 'fp&a',
      'legal', 'counsel', 'compliance', 'privacy',
      'procurement', 'sourcing', 'vendor',
      'security', 'ciso', 'information security',
      'technology', 'cio', 'it ', 'systems', 'engineering',
      'marketing', 'product marketing', 'analytics'
    ];
    
    const isNonSalesRole = nonSalesRoles.some(role => titleLower.includes(role) || deptLower.includes(role));
    if (isNonSalesRole) return false;
    
    // Everyone else should be in sales function
    return true;
  }

  /**
   * STRICT VALIDATION: Check if person works in sales function
   */
  private isInSalesFunction(profile: PersonProfile): boolean {
    const salesKeywords = [
      'sales', 'business development', 'revenue', 'account', 'commercial',
      'client', 'customer success', 'partnerships', 'channel', 'growth',
      'territory', 'enterprise', 'inside sales', 'outside sales', 'field sales',
      'sales operations', 'sales enablement', 'revenue operations', 'revops'
    ];
    
    const titleLower = profile.title.toLowerCase();
    const deptLower = profile.department.toLowerCase();
    
    return salesKeywords.some(keyword => 
      titleLower.includes(keyword) || deptLower.includes(keyword)
    );
  }
  
  /**
   * STRICT VALIDATION: Check if person actually works at target company
   */
  private worksAtTargetCompany(profile: PersonProfile, sellerProfile: SellerProfile): boolean {
    const companyLower = profile.company.toLowerCase();
    
    // For Dell specifically, be very strict
    if (sellerProfile.sellerCompanyName?.toLowerCase() === 'adrata' && 
        companyLower.includes('dell')) {
      const validDellCompanies = [
        'dell technologies',
        'dell inc',
        'dell computer',
        'dell emc',
        'dell services'
      ];
      
      return validDellCompanies.some(valid => companyLower.includes(valid));
    }
    
    // For other companies, ensure no obvious mismatches
    const invalidCompanyIndicators = [
      'police', 'government', 'university', 'school', 'hospital',
      'medical center', 'healthcare', 'education', 'military',
      'department of', 'ministry of', 'city of', 'county of'
    ];
    
    return !invalidCompanyIndicators.some(invalid => companyLower.includes(invalid));
  }

  /**
   * Calculate relevance score for seller profile matching
   */
  calculateRelevanceScore(profile: PersonProfile, sellerProfile: SellerProfile): number {
    let score = 0;
    const dept = profile.department || '';
    const title = profile.title || '';
    
    // Must-have titles (high relevance)
    if (sellerProfile.mustHaveTitles.some(keyword => 
      dept.toLowerCase().includes(keyword) || 
      title.toLowerCase().includes(keyword)
    )) {
      score += 3;
    }
    
    // Adjacent functions (moderate relevance)
    if (sellerProfile.adjacentFunctions.some(func => 
      dept.toLowerCase().includes(func.toLowerCase())
    )) {
      score += 1;
    }
    
    // Seniority normalization to prioritize decision surface area
    const seniorityBoost: Record<PersonProfile['seniorityLevel'], number> = {
      'C-Level': 3,
      'VP': 2,
      'Director': 1,
      'Manager': 0,
      'IC': 0
    };
    score += seniorityBoost[profile.seniorityLevel] || 0;
    return score;
  }

  /**
   * Batch analyze multiple profiles
   */
  analyzeProfiles(
    profiles: CoreSignalProfile[], 
    companyName: string, 
    sellerProfile: SellerProfile,
    analysisConfig: {
      minInfluenceScore: number;
      requireDirector: boolean;
      allowIC: boolean;
    },
    aliases: string[] = [],
    enforceExact = true,
    usingCompanyIds = false  // NEW: When true, be more permissive with company matching
  ): PersonProfile[] {
    return profiles
      .map(profile => this.transformProfile(profile, companyName, aliases, enforceExact))
      .filter(profile => {
        // Enhanced company validation - adaptive to any target company
        if (!profile.company || profile['company'] === 'Unknown Company') {
          console.log('Filtered out profile ' + profile.id + ': company = "' + profile.company + '"');
          return false;
        }
        
        // ENHANCED: When using company IDs, be more permissive with company matching
        let isTargetCompany;
        if (usingCompanyIds) {
          // When using company IDs, the API has already filtered by company
          // So we trust the API filtering and only exclude obvious non-matches
          const companyLower = profile.company.toLowerCase();
          const forbiddenCompanies = [
            'dell medical', 'dell foods', 'dell publishing', 'sunny dell', 
            'dell children', 'dell heart', 'dell clinical', 'dell diagnostics'
          ];
          const isForbidden = forbiddenCompanies.some(forbidden => companyLower.includes(forbidden));
          
          if (isForbidden) {
            console.log('Filtered out profile ' + profile.id + ': forbidden company "' + profile.company + '"');
            return false;
          }
          
          isTargetCompany = true; // Trust API company ID filtering
        } else {
          // Use strict matching for name-based searches
          isTargetCompany = this.isCompanyMatch(profile.company, companyName, aliases, enforceExact);
          
          if (!isTargetCompany) {
            console.log('Filtered out profile ' + profile.id + ': company "' + profile.company + '" doesn\'t match target "' + companyName + '"');
            return false;
          }
        }
        
        return this.passesQualityFilters(profile, sellerProfile, analysisConfig);
      })
      .map(profile => ({
        ...profile,
        influenceScore: profile.influenceScore + this.calculateRelevanceScore(profile, sellerProfile)
      }))
      .sort((a, b) => b.influenceScore - a.influenceScore);
  }
}
