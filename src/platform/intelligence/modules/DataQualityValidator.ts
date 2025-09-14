/**
 * 🛡️ DATA QUALITY VALIDATOR
 * 
 * Addresses critical data quality issues:
 * 1. Prevents same person CFO/CRO assignment
 * 2. Detects "Former" titles and outdated information
 * 3. Filters generic emails and phone numbers
 * 4. Validates executive authenticity
 */

import { ExecutiveContact } from '../types/intelligence';

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  confidence: number;
  recommendations: string[];
}

interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicatePairs: { executive1: ExecutiveContact; executive2: ExecutiveContact; similarity: number }[];
  recommendations: string[];
}

export class DataQualityValidator {
  
  /**
   * 🔍 COMPREHENSIVE EXECUTIVE VALIDATION
   */
  validateExecutive(executive: ExecutiveContact): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let confidence = 100;

    // 1. Check for "Former" titles
    const formerTitleCheck = this.checkFormerTitle(executive);
    if (!formerTitleCheck.isValid) {
      issues.push(...formerTitleCheck.issues);
      recommendations.push(...formerTitleCheck.recommendations);
      confidence -= 30;
    }

    // 2. Check for generic emails
    if (executive.email) {
      const emailCheck = this.validateEmail(executive.email);
      if (!emailCheck.isValid) {
        issues.push(...emailCheck.issues);
        recommendations.push(...emailCheck.recommendations);
        confidence -= 20;
      }
    }

    // 3. Check for generic phone numbers
    if (executive.phone) {
      const phoneCheck = this.validatePhone(executive.phone);
      if (!phoneCheck.isValid) {
        issues.push(...phoneCheck.issues);
        recommendations.push(...phoneCheck.recommendations);
        confidence -= 15;
      }
    }

    // 4. Validate name authenticity
    const nameCheck = this.validateName(executive.name);
    if (!nameCheck.isValid) {
      issues.push(...nameCheck.issues);
      recommendations.push(...nameCheck.recommendations);
      confidence -= 25;
    }

    // 5. Check role-title consistency
    const roleCheck = this.validateRoleConsistency(executive.role, executive.title);
    if (!roleCheck.isValid) {
      issues.push(...roleCheck.issues);
      recommendations.push(...roleCheck.recommendations);
      confidence -= 10;
    }

    return {
      isValid: issues['length'] === 0,
      issues,
      confidence: Math.max(confidence, 0),
      recommendations
    };
  }

  /**
   * 🚨 CRITICAL: PREVENT SAME PERSON CFO/CRO ASSIGNMENT
   */
  checkDuplicateAssignments(executives: ExecutiveContact[]): DuplicateCheckResult {
    const duplicatePairs: { executive1: ExecutiveContact; executive2: ExecutiveContact; similarity: number }[] = [];
    const recommendations: string[] = [];

    // Group executives by account
    const executivesByAccount = executives.reduce((acc, exec) => {
      if (!acc[exec.accountId]) acc[exec.accountId] = [];
      acc[exec.accountId].push(exec);
      return acc;
    }, {} as Record<string, ExecutiveContact[]>);

    // Check each account for duplicates
    for (const [accountId, accountExecutives] of Object.entries(executivesByAccount)) {
      for (let i = 0; i < accountExecutives.length; i++) {
        for (let j = i + 1; j < accountExecutives.length; j++) {
          const exec1 = accountExecutives[i];
          const exec2 = accountExecutives[j];
          
          const similarity = this.calculateExecutiveSimilarity(exec1, exec2);
          
          if (similarity > 0.8) { // 80% similarity threshold
            duplicatePairs.push({ executive1: exec1, executive2: exec2, similarity });
            
            // Generate specific recommendations
            if (exec1['role'] === 'CFO' && exec2['role'] === 'CRO') {
              recommendations.push(
                `🚨 CRITICAL: Same person (${exec1.name}) assigned to both CFO and CRO roles for ${accountId}. ` +
                `Recommend keeping the role that best matches their title: "${exec1.title}"`
              );
            }
          }
        }
      }
    }

    return {
      hasDuplicates: duplicatePairs.length > 0,
      duplicatePairs,
      recommendations
    };
  }

  /**
   * 📅 CHECK FOR "FORMER" TITLES
   */
  private checkFormerTitle(executive: ExecutiveContact): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const title = executive.title?.toLowerCase() || '';
    const name = executive.name?.toLowerCase() || '';
    
    const formerKeywords = [
      'former', 'ex-', 'previous', 'retired', 'deceased', 'resigned', 
      'stepped down', 'left the company', 'no longer', 'until', 'through'
    ];
    
    const hasFormerKeyword = formerKeywords.some(keyword => 
      title.includes(keyword) || name.includes(keyword)
    );
    
    if (hasFormerKeyword) {
      issues.push(`Executive marked as "former" or no longer active: ${executive.title}`);
      recommendations.push(`Research current replacement for ${executive.name} in ${executive.role} role`);
      recommendations.push(`Verify executive transition date and current status`);
    }
    
    // Check for date patterns indicating past tenure
    const datePattern = /\b(until|through|ended|left)\s+\d{4}\b/i;
    if (datePattern.test(title)) {
      issues.push(`Title contains end date indicating past tenure: ${executive.title}`);
      recommendations.push(`Find current ${executive.role} replacement`);
    }
    
    return {
      isValid: issues['length'] === 0,
      issues,
      confidence: issues['length'] === 0 ? 100 : 20,
      recommendations
    };
  }

  /**
   * 📧 VALIDATE EMAIL AUTHENTICITY
   */
  private validateEmail(email: string): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!email || email === 'Not available') {
      return { isValid: true, issues, confidence: 100, recommendations };
    }
    
    const emailLower = email.toLowerCase();
    
    // Generic email patterns
    const genericPatterns = [
      'info@', 'contact@', 'support@', 'sales@', 'marketing@', 
      'admin@', 'office@', 'hello@', 'team@', 'general@', 
      'inquiries@', 'pr@', 'press@', 'media@', 'help@'
    ];
    
    const isGeneric = genericPatterns.some(pattern => emailLower.startsWith(pattern));
    
    if (isGeneric) {
      issues.push(`Generic email detected: ${email}`);
      recommendations.push(`Research executive's direct email address`);
      recommendations.push(`Use LinkedIn or company directory for personal email`);
    }
    
    // Check for obvious fake patterns
    const fakePatterns = [
      'noreply@', 'donotreply@', 'test@', 'example@', 'sample@',
      'placeholder@', 'dummy@', 'fake@'
    ];
    
    const isFake = fakePatterns.some(pattern => emailLower.includes(pattern));
    
    if (isFake) {
      issues.push(`Fake/placeholder email detected: ${email}`);
      recommendations.push(`Find real executive email address`);
    }
    
    return {
      isValid: issues['length'] === 0,
      issues,
      confidence: issues['length'] === 0 ? 100 : 30,
      recommendations
    };
  }

  /**
   * 📞 VALIDATE PHONE AUTHENTICITY
   */
  private validatePhone(phone: string): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!phone || phone === 'Not available') {
      return { isValid: true, issues, confidence: 100, recommendations };
    }
    
    // Generic/toll-free phone patterns
    const genericPatterns = [
      '+1-800-', '+1-888-', '+1-877-', '+1-866-', '+1-855-',
      '1-800-', '1-888-', '1-877-', '1-866-', '1-855-',
      '800-', '888-', '877-', '866-', '855-'
    ];
    
    const isGeneric = genericPatterns.some(pattern => phone.startsWith(pattern));
    
    if (isGeneric) {
      issues.push(`Generic/toll-free phone detected: ${phone}`);
      recommendations.push(`Research executive's direct phone line`);
      recommendations.push(`Use LinkedIn or executive assistant contact`);
    }
    
    // Check for obvious fake numbers
    const fakePatterns = ['555-', '123-456-', '000-000-', '111-111-'];
    const isFake = fakePatterns.some(pattern => phone.includes(pattern));
    
    if (isFake) {
      issues.push(`Fake/placeholder phone detected: ${phone}`);
      recommendations.push(`Find real executive phone number`);
    }
    
    return {
      isValid: issues['length'] === 0,
      issues,
      confidence: issues['length'] === 0 ? 100 : 40,
      recommendations
    };
  }

  /**
   * 👤 VALIDATE NAME AUTHENTICITY
   */
  private validateName(name: string): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!name || name.length < 2) {
      issues.push('Invalid or missing executive name');
      return { isValid: false, issues, confidence: 0, recommendations };
    }
    
    const nameLower = name.toLowerCase();
    
    // Check for placeholder names
    const placeholderNames = [
      'not available', 'unknown', 'n/a', 'tbd', 'pending',
      'john doe', 'jane doe', 'john smith', 'jane smith',
      'test user', 'sample name', 'placeholder'
    ];
    
    const isPlaceholder = placeholderNames.some(placeholder => 
      nameLower.includes(placeholder)
    );
    
    if (isPlaceholder) {
      issues.push(`Placeholder name detected: ${name}`);
      recommendations.push(`Research actual executive name`);
    }
    
    // Check for incomplete names (single word)
    const nameParts = name.trim().split(/\s+/);
    if (nameParts['length'] === 1) {
      issues.push(`Incomplete name (single word): ${name}`);
      recommendations.push(`Find complete executive name (first and last)`);
    }
    
    return {
      isValid: issues['length'] === 0,
      issues,
      confidence: issues['length'] === 0 ? 100 : 25,
      recommendations
    };
  }

  /**
   * 🎯 VALIDATE ROLE-TITLE CONSISTENCY
   */
  private validateRoleConsistency(role: string, title: string): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!title) {
      return { isValid: true, issues, confidence: 100, recommendations };
    }
    
    const titleLower = title.toLowerCase();
    
    // Define role-specific keywords that should/shouldn't appear
    const roleValidation: Record<string, { should: string[]; shouldNot: string[] }> = {
      'CFO': {
        should: ['chief financial officer', 'cfo', 'finance', 'financial'],
        shouldNot: ['revenue', 'sales', 'commercial', 'cro', 'chief revenue', 'chief sales']
      },
      'CRO': {
        should: ['chief revenue officer', 'cro', 'chief sales officer', 'cso', 'revenue', 'sales'],
        shouldNot: ['finance', 'financial', 'cfo', 'chief financial', 'controller', 'accounting']
      },
      'CEO': {
        should: ['chief executive officer', 'ceo', 'president', 'founder'],
        shouldNot: []
      }
    };
    
    const validation = roleValidation[role];
    if (!validation) {
      return { isValid: true, issues, confidence: 100, recommendations };
    }
    
    // Check if title contains role-inappropriate keywords
    const hasInappropriateKeywords = validation.shouldNot.some(keyword => 
      titleLower.includes(keyword)
    );
    
    if (hasInappropriateKeywords) {
      issues.push(`Role-title mismatch: ${role} assigned to "${title}"`);
      recommendations.push(`Verify if this executive should be classified as ${role}`);
      recommendations.push(`Consider reassigning to appropriate role based on title`);
    }
    
    return {
      isValid: issues['length'] === 0,
      issues,
      confidence: issues['length'] === 0 ? 100 : 60,
      recommendations
    };
  }

  /**
   * 📊 CALCULATE EXECUTIVE SIMILARITY
   */
  private calculateExecutiveSimilarity(exec1: ExecutiveContact, exec2: ExecutiveContact): number {
    let similarity = 0;
    let factors = 0;
    
    // Name similarity (most important)
    if (exec1['name'] && exec2.name) {
      const nameSimilarity = this.calculateStringSimilarity(
        exec1.name.toLowerCase(), 
        exec2.name.toLowerCase()
      );
      similarity += nameSimilarity * 0.6; // 60% weight
      factors += 0.6;
    }
    
    // Email similarity
    if (exec1['email'] && exec2.email) {
      const emailSimilarity = this.calculateStringSimilarity(
        exec1.email.toLowerCase(), 
        exec2.email.toLowerCase()
      );
      similarity += emailSimilarity * 0.3; // 30% weight
      factors += 0.3;
    }
    
    // Title similarity
    if (exec1['title'] && exec2.title) {
      const titleSimilarity = this.calculateStringSimilarity(
        exec1.title.toLowerCase(), 
        exec2.title.toLowerCase()
      );
      similarity += titleSimilarity * 0.1; // 10% weight
      factors += 0.1;
    }
    
    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * 📝 CALCULATE STRING SIMILARITY
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer['length'] === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 📏 LEVENSHTEIN DISTANCE CALCULATION
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 🔧 RESOLVE DUPLICATE ASSIGNMENTS
   */
  resolveDuplicateAssignments(executives: ExecutiveContact[]): ExecutiveContact[] {
    const duplicateCheck = this.checkDuplicateAssignments(executives);
    
    if (!duplicateCheck.hasDuplicates) {
      return executives;
    }
    
    const resolvedExecutives = [...executives];
    const toRemove: string[] = [];
    
    // Process each duplicate pair
    for (const { executive1, executive2 } of duplicateCheck.duplicatePairs) {
      console.log(`🔧 [DATA QUALITY] Resolving duplicate: ${executive1.name} (${executive1.role}) vs (${executive2.role})`);
      
      // Priority logic for CFO vs CRO conflicts
      if ((executive1['role'] === 'CFO' && executive2['role'] === 'CRO') || 
          (executive1['role'] === 'CRO' && executive2['role'] === 'CFO')) {
        
        const titleLower = executive1.title?.toLowerCase() || '';
        
        // Keep the role that best matches the title
        if (titleLower.includes('financial') || titleLower.includes('cfo')) {
          // Keep CFO, remove CRO
          const cfoExec = executive1['role'] === 'CFO' ? executive1 : executive2;
          const croExec = executive1['role'] === 'CRO' ? executive1 : executive2;
          toRemove.push(croExec.id);
          console.log(`   ✅ Keeping CFO (${cfoExec.name}), removing CRO assignment`);
          
        } else if (titleLower.includes('revenue') || titleLower.includes('sales') || titleLower.includes('cro')) {
          // Keep CRO, remove CFO
          const cfoExec = executive1['role'] === 'CFO' ? executive1 : executive2;
          const croExec = executive1['role'] === 'CRO' ? executive1 : executive2;
          toRemove.push(cfoExec.id);
          console.log(`   ✅ Keeping CRO (${croExec.name}), removing CFO assignment`);
          
        } else if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('founder')) {
          // For dual-role executives (CEO/President), keep both but note it
          console.log(`   ✅ Allowing dual role for CEO/President/Founder: ${executive1.name}`);
          
        } else {
          // Default: keep CFO, remove CRO (CFO priority for ambiguous cases)
          const cfoExec = executive1['role'] === 'CFO' ? executive1 : executive2;
          const croExec = executive1['role'] === 'CRO' ? executive1 : executive2;
          toRemove.push(croExec.id);
          console.log(`   🔧 Ambiguous title - keeping CFO (${cfoExec.name}), removing CRO (CFO priority)`);
        }
      }
    }
    
    // Remove duplicates
    const finalExecutives = resolvedExecutives.filter(exec => !toRemove.includes(exec.id));
    
    console.log(`🔧 [DATA QUALITY] Resolved ${toRemove.length} duplicate assignments`);
    return finalExecutives;
  }
}
