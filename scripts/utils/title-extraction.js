/**
 * Title Extraction Utility (JavaScript version for scripts)
 * 
 * Intelligently extracts the most accurate current title from work experience,
 * prioritizing company-matched roles over the most recent role.
 */

/**
 * Normalize company name for matching
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Check if a role is a professional role (not a side role)
 */
function isProfessionalRole(title) {
  if (!title) return true;
  
  const titleLower = title.toLowerCase();
  const sideRoleKeywords = [
    'coach', 'volunteer', 'advisor', 'adviser', 'board member',
    'board of directors', 'consultant', 'freelance', 'contractor',
    'mentor', 'tutor', 'instructor', 'volunteer', 'advisory board'
  ];
  
  return !sideRoleKeywords.some(keyword => titleLower.includes(keyword));
}

/**
 * Calculate seniority score for a role title
 */
function calculateSeniorityScore(title) {
  if (!title) return 10;
  
  const titleLower = title.toLowerCase();
  
  // C-level
  if (titleLower.match(/\b(c|chief)\s+(executive|technology|financial|marketing|operating|product|revenue|information|security|data|people|human|legal)\s+(officer|president)\b/i)) {
    return 100;
  }
  
  // VP level
  if (titleLower.includes('vp') || titleLower.includes('vice president')) {
    return 80;
  }
  
  // Director
  if (titleLower.includes('director') || titleLower.includes('head of')) {
    return 60;
  }
  
  // Manager/Lead
  if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('principal')) {
    return 40;
  }
  
  // Individual Contributor
  if (titleLower.includes('engineer') || titleLower.includes('developer') || 
      titleLower.includes('analyst') || titleLower.includes('specialist') ||
      titleLower.includes('designer') || titleLower.includes('architect')) {
    return 20;
  }
  
  return 10; // Other
}

/**
 * Calculate role score for selection when multiple matches exist
 */
function calculateRoleScore(role, leadCompanyId) {
  let score = 0;
  
  // Company ID match = 1000 points (strongest signal)
  if (leadCompanyId && role.company_id === leadCompanyId) {
    score += 1000;
  }
  
  // Professional role = 100 points
  if (isProfessionalRole(role.position_title || role.title)) {
    score += 100;
  }
  
  // Seniority score (0-100)
  score += calculateSeniorityScore(role.position_title || role.title);
  
  // Tenure bonus (earlier start = more established)
  if (role.start_date || role.date_from) {
    try {
      const startDate = new Date(role.start_date || role.date_from);
      const yearsAgo = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      score += Math.min(yearsAgo * 10, 50); // Max 50 points for 5+ years
    } catch {
      // Invalid date, skip tenure bonus
    }
  }
  
  return score;
}

/**
 * Extract best current title from CoreSignal data
 */
function extractBestCurrentTitleFromCoreSignal(coresignalData, leadCompany, leadCompanyId, manualTitle) {
  // If manual title exists, use it
  if (manualTitle) {
    return manualTitle;
  }
  
  // Get experience array
  const experience = coresignalData.experience || [];
  if (experience.length === 0) {
    return coresignalData.active_experience_title || coresignalData.job_title || null;
  }
  
  // Filter to current roles only
  const currentRoles = experience.filter(exp => 
    exp.active_experience === 1 || 
    exp.is_current === true ||
    (!exp.end_date && !exp.date_to)
  );
  
  if (currentRoles.length === 0) {
    // No current roles, use most recent
    const sorted = experience.sort((a, b) => {
      const dateA = (a.start_date || a.date_from) ? new Date(a.start_date || a.date_from).getTime() : 0;
      const dateB = (b.start_date || b.date_from) ? new Date(b.start_date || b.date_from).getTime() : 0;
      return dateB - dateA;
    });
    return sorted[0]?.position_title || sorted[0]?.title || coresignalData.active_experience_title || null;
  }
  
  // If no company to match, return most recent current role
  if (!leadCompany && !leadCompanyId) {
    const sorted = currentRoles.sort((a, b) => {
      const dateA = (a.start_date || a.date_from) ? new Date(a.start_date || a.date_from).getTime() : 0;
      const dateB = (b.start_date || b.date_from) ? new Date(b.start_date || b.date_from).getTime() : 0;
      return dateB - dateA;
    });
    return sorted[0]?.position_title || sorted[0]?.title || null;
  }
  
  // Find all current roles at matching company
  const normalizedLeadCompany = normalizeCompanyName(leadCompany);
  const matchingRoles = currentRoles.filter(role => {
    // Company ID match (strongest)
    if (leadCompanyId && role.company_id === leadCompanyId) return true;
    
    // Company name match
    if (leadCompany && role.company_name) {
      const normalizedRoleCompany = normalizeCompanyName(role.company_name);
      return normalizedRoleCompany === normalizedLeadCompany ||
             normalizedRoleCompany.includes(normalizedLeadCompany) ||
             normalizedLeadCompany.includes(normalizedRoleCompany);
    }
    
    return false;
  });
  
  if (matchingRoles.length === 0) {
    // No match, return most recent current role (any company)
    const sorted = currentRoles.sort((a, b) => {
      const dateA = (a.start_date || a.date_from) ? new Date(a.start_date || a.date_from).getTime() : 0;
      const dateB = (b.start_date || b.date_from) ? new Date(b.start_date || b.date_from).getTime() : 0;
      return dateB - dateA;
    });
    return sorted[0]?.position_title || sorted[0]?.title || null;
  }
  
  if (matchingRoles.length === 1) {
    return matchingRoles[0]?.position_title || matchingRoles[0]?.title || null;
  }
  
  // Multiple matches - apply selection criteria
  const scoredRoles = matchingRoles.map(role => ({
    role,
    score: calculateRoleScore(role, leadCompanyId)
  }));
  
  scoredRoles.sort((a, b) => b.score - a.score);
  return scoredRoles[0].role?.position_title || scoredRoles[0].role?.title || null;
}

module.exports = {
  extractBestCurrentTitleFromCoreSignal,
  normalizeCompanyName,
  isProfessionalRole,
  calculateSeniorityScore
};

