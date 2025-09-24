/**
 * 🔧 TECHNOLOGY-SPECIFIC ROLE SEARCH
 * 
 * Handles "Find me a MuleSoft developer" type queries with technology matching
 */

import { CoreSignalClient } from '../buyer-group/coresignal-client';
import { EmploymentVerificationPipeline } from './employment-verification';
import { TechnologySearchContext, TechnologySearchResult, TechnologyCandidate } from './types';

interface TechnologyQuery {
  technology: string;
  roleLevel: string;
  roleType: string;
  originalQuery: string;
}

export class TechnologyRoleSearch {
  private coreSignalClient: CoreSignalClient;
  private employmentVerifier: EmploymentVerificationPipeline;
  
  constructor() {
    this.coreSignalClient = new CoreSignalClient({
      apiKey: process.env.CORESIGNAL_API_KEY!,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: 200,
      batchSize: 50,
      useCache: true,
      cacheTTL: 24
    });
    this.employmentVerifier = new EmploymentVerificationPipeline();
  }
  
  /**
   * 🎯 MAIN TECHNOLOGY ROLE SEARCH
   * 
   * Find people with specific technology skills and experience
   */
  async findTechnologySpecificPeople(
    technologyQuery: string,
    context: TechnologySearchContext
  ): Promise<TechnologySearchResult> {
    
    console.log(`🔧 [TECH SEARCH] Searching for: "${technologyQuery}"`);
    
    try {
      // Step 1: Parse technology and role from query
      const parsed = this.parseTechnologyQuery(technologyQuery);
      console.log(`📝 [PARSED] Tech: ${parsed.technology}, Role: ${parsed.roleType}, Level: ${parsed.roleLevel}`);
      
      // Step 2: Build CoreSignal search with technology keywords
      const searchQuery = this.buildTechnologySearchQuery(parsed, context);
      
      // Step 3: Execute search with employment verification
      const candidates = await this.searchWithEmploymentVerification(searchQuery, context);
      
      // Step 4: Score by technology relevance and experience
      const scoredCandidates = await this.scoreTechnologyRelevance(candidates, parsed);
      
      // Step 5: Filter by current employment and relevance
      const qualifiedCandidates = scoredCandidates.filter(candidate => 
        candidate.employmentVerification.isCurrentlyEmployed &&
        candidate.technologyRelevance.score > 70 &&
        candidate.overallFit > 75
      );
      
      console.log(`✅ [TECH SEARCH] Found ${qualifiedCandidates.length}/${candidates.length} qualified candidates`);
      
      return {
        technology: parsed.technology,
        role: `${parsed.roleLevel} ${parsed.roleType}`.trim(),
        totalFound: candidates.length,
        qualifiedCandidates: qualifiedCandidates.length,
        results: qualifiedCandidates.slice(0, 50) // Top 50 matches
      };
      
    } catch (error) {
      console.error(`❌ [TECH SEARCH] Failed for "${technologyQuery}":`, error);
      
      return {
        technology: 'unknown',
        role: technologyQuery,
        totalFound: 0,
        qualifiedCandidates: 0,
        results: []
      };
    }
  }
  
  /**
   * 📝 PARSE TECHNOLOGY QUERY
   * 
   * Extract technology, role level, and role type from natural language
   */
  private parseTechnologyQuery(query: string): TechnologyQuery {
    const normalized = query.toLowerCase().trim();
    
    // Technology mapping
    const technologies = {
      'mulesoft': ['mulesoft', 'mule soft', 'anypoint'],
      'salesforce': ['salesforce', 'sfdc', 'force.com', 'apex'],
      'react': ['react', 'reactjs', 'react.js'],
      'angular': ['angular', 'angularjs'],
      'vue': ['vue', 'vuejs', 'vue.js'],
      'node.js': ['node', 'nodejs', 'node.js'],
      'python': ['python', 'django', 'flask'],
      'java': ['java', 'spring', 'hibernate'],
      'c#': ['c#', 'csharp', '.net', 'dotnet'],
      'aws': ['aws', 'amazon web services'],
      'azure': ['azure', 'microsoft azure'],
      'kubernetes': ['kubernetes', 'k8s'],
      'docker': ['docker', 'containerization'],
      'microservices': ['microservices', 'microservice'],
      'devops': ['devops', 'ci/cd', 'jenkins'],
      'data': ['data engineer', 'data scientist', 'analytics'],
      'ai': ['ai', 'machine learning', 'ml', 'artificial intelligence']
    };
    
    // Find matching technology
    let foundTechnology = 'unknown';
    for (const [tech, keywords] of Object.entries(technologies)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        foundTechnology = tech;
        break;
      }
    }
    
    // Role level extraction
    const roleLevels = ['senior', 'lead', 'principal', 'staff', 'architect', 'junior', 'mid', 'entry'];
    const foundLevel = roleLevels.find(level => normalized.includes(level)) || 'any';
    
    // Role type extraction
    const roleTypes = ['developer', 'engineer', 'architect', 'consultant', 'specialist', 'analyst', 'manager', 'director'];
    const foundRole = roleTypes.find(role => normalized.includes(role)) || 'developer';
    
    return {
      technology: foundTechnology,
      roleLevel: foundLevel,
      roleType: foundRole,
      originalQuery: query
    };
  }
  
  /**
   * 🔍 BUILD TECHNOLOGY SEARCH QUERY
   */
  private buildTechnologySearchQuery(parsed: TechnologyQuery, context: TechnologySearchContext): any {
    const searchTerms = [];
    
    // Technology keywords
    if (parsed.technology !== 'unknown') {
      searchTerms.push(parsed.technology);
    }
    
    // Role keywords
    searchTerms.push(parsed.roleType);
    if (parsed.roleLevel !== 'any') {
      searchTerms.push(parsed.roleLevel);
    }
    
    // Build CoreSignal search query
    const query: any = {
      keywords: searchTerms,
      current_employment: true, // Only current employees
      location: context.geography || 'United States'
    };
    
    // Add industry filter if specified
    if (context.industry) {
      query.industry = context.industry;
    }
    
    // Add company size filter if specified
    if (context.companySize) {
      query.company_size = context.companySize;
    }
    
    return query;
  }
  
  /**
   * 🔍 SEARCH WITH EMPLOYMENT VERIFICATION
   */
  private async searchWithEmploymentVerification(
    searchQuery: any,
    context: TechnologySearchContext
  ): Promise<any[]> {
    
    console.log(`🔍 [SEARCH] Executing CoreSignal search for technology roles...`);
    
    try {
      // Execute CoreSignal search (mock for now)
      const searchResults: any[] = [];
      console.log(`📊 [SEARCH] Found ${searchResults.length} initial candidates`);
      
      if (searchResults.length === 0) {
        return [];
      }
      
      // Batch verify employment for all candidates
      const verificationResults = await this.employmentVerifier.batchVerifyEmployment(
        searchResults,
        { prioritizeHighValue: true, maxConcurrency: 10 }
      );
      
      // Filter for currently employed candidates
      const employedCandidates = searchResults.filter(candidate => {
        const verification = verificationResults.get(candidate.id);
        return verification?.isCurrentlyEmployed && verification.confidence > 70;
      });
      
      console.log(`✅ [EMPLOYMENT] ${employedCandidates.length}/${searchResults.length} candidates currently employed`);
      
      return employedCandidates.map(candidate => ({
        ...candidate,
        employmentVerification: verificationResults.get(candidate.id)
      }));
      
    } catch (error) {
      console.error(`❌ [SEARCH] Technology search failed:`, error);
      return [];
    }
  }
  
  /**
   * 📊 SCORE TECHNOLOGY RELEVANCE
   */
  private async scoreTechnologyRelevance(
    candidates: any[],
    parsed: TechnologyQuery
  ): Promise<TechnologyCandidate[]> {
    
    console.log(`📊 [SCORING] Scoring ${candidates.length} candidates for technology relevance...`);
    
    const scoredCandidates: TechnologyCandidate[] = [];
    
    for (const candidate of candidates) {
      try {
        const technologyRelevance = this.calculateTechnologyRelevance(candidate, parsed);
        const overallFit = this.calculateOverallFit(candidate, technologyRelevance);
        
        scoredCandidates.push({
          person: this.mapToPersonProfile(candidate),
          technologyRelevance,
          employmentVerification: candidate.employmentVerification,
          overallFit
        });
        
      } catch (error) {
        console.error(`❌ Error scoring candidate ${candidate.full_name}:`, error);
      }
    }
    
    // Sort by overall fit score
    const sortedCandidates = scoredCandidates.sort((a, b) => b.overallFit - a.overallFit);
    
    console.log(`✅ [SCORING] Top candidate: ${sortedCandidates[0]?.person.name} (${sortedCandidates[0]?.overallFit}% fit)`);
    
    return sortedCandidates;
  }
  
  /**
   * 🎯 CALCULATE TECHNOLOGY RELEVANCE
   */
  private calculateTechnologyRelevance(candidate: any, parsed: TechnologyQuery): any {
    const title = (candidate.active_experience_title || '').toLowerCase();
    const skills = (candidate.inferred_skills || []).map((s: string) => s.toLowerCase());
    const experience = candidate.experience || [];
    
    let score = 0;
    const matchedSkills: string[] = [];
    
    // Direct technology mentions in title
    if (title.includes(parsed.technology.toLowerCase())) {
      score += 40;
      matchedSkills.push(`${parsed.technology} in title`);
    }
    
    // Technology in skills
    if (skills.some(skill => skill.includes(parsed.technology.toLowerCase()))) {
      score += 30;
      matchedSkills.push(`${parsed.technology} in skills`);
    }
    
    // Role type matching
    if (title.includes(parsed.roleType)) {
      score += 20;
      matchedSkills.push(`${parsed.roleType} role match`);
    }
    
    // Experience level matching
    if (parsed.roleLevel !== 'any') {
      if (title.includes(parsed.roleLevel)) {
        score += 10;
        matchedSkills.push(`${parsed.roleLevel} level match`);
      }
    }
    
    // Calculate years of experience
    const yearsExperience = this.calculateTechnologyExperience(experience, parsed.technology);
    
    // Experience bonus
    if (yearsExperience >= 5) score += 15;
    else if (yearsExperience >= 3) score += 10;
    else if (yearsExperience >= 1) score += 5;
    
    return {
      score: Math.min(score, 100),
      matchedSkills,
      experienceLevel: this.determineExperienceLevel(yearsExperience, title),
      yearsExperience
    };
  }
  
  /**
   * 📈 CALCULATE OVERALL FIT
   */
  private calculateOverallFit(candidate: any, technologyRelevance: any): number {
    const weights = {
      technology: 0.4,
      employment: 0.3,
      seniority: 0.2,
      experience: 0.1
    };
    
    const technologyScore = technologyRelevance.score;
    const employmentScore = candidate.employmentVerification?.confidence || 0;
    const seniorityScore = this.calculateSeniorityScore(candidate.active_experience_title || '');
    const experienceScore = Math.min(technologyRelevance.yearsExperience * 20, 100);
    
    return Math.round(
      technologyScore * weights.technology +
      employmentScore * weights.employment +
      seniorityScore * weights.seniority +
      experienceScore * weights.experience
    );
  }
  
  /**
   * 🎓 CALCULATE TECHNOLOGY EXPERIENCE
   */
  private calculateTechnologyExperience(experience: any[], technology: string): number {
    if (!experience || experience.length === 0) return 0;
    
    let totalMonths = 0;
    const techLower = technology.toLowerCase();
    
    for (const exp of experience) {
      const title = (exp.position_title || '').toLowerCase();
      const description = (exp.description || '').toLowerCase();
      
      // Check if this experience involves the technology
      if (title.includes(techLower) || description.includes(techLower)) {
        totalMonths += exp.duration_months || 12; // Default to 1 year if duration missing
      }
    }
    
    return Math.round(totalMonths / 12 * 10) / 10; // Convert to years with 1 decimal
  }
  
  /**
   * 📊 DETERMINE EXPERIENCE LEVEL
   */
  private determineExperienceLevel(yearsExperience: number, title: string): string {
    const titleLower = title.toLowerCase();
    
    // Title-based determination first
    if (titleLower.includes('principal') || titleLower.includes('staff') || titleLower.includes('architect')) {
      return 'principal';
    }
    if (titleLower.includes('senior') || titleLower.includes('lead')) {
      return 'senior';
    }
    if (titleLower.includes('junior') || titleLower.includes('entry')) {
      return 'junior';
    }
    
    // Experience-based determination
    if (yearsExperience >= 8) return 'principal';
    if (yearsExperience >= 5) return 'senior';
    if (yearsExperience >= 2) return 'mid';
    return 'junior';
  }
  
  /**
   * 📈 CALCULATE SENIORITY SCORE
   */
  private calculateSeniorityScore(title: string): number {
    const titleLower = title.toLowerCase();
    
    // Seniority scoring
    if (titleLower.includes('principal') || titleLower.includes('staff')) return 100;
    if (titleLower.includes('senior') || titleLower.includes('lead')) return 80;
    if (titleLower.includes('architect')) return 90;
    if (titleLower.includes('manager') || titleLower.includes('director')) return 85;
    if (titleLower.includes('junior') || titleLower.includes('entry')) return 40;
    
    return 60; // Default mid-level
  }
  
  /**
   * 🗺️ MAP TO PERSON PROFILE
   */
  private mapToPersonProfile(candidate: any): any {
    return {
      id: candidate.id,
      name: candidate.full_name || 'Unknown',
      title: candidate.active_experience_title || 'Unknown',
      department: candidate.active_experience_department || 'Unknown',
      company: candidate.company_name || 'Unknown',
      email: candidate.email || null,
      phone: candidate.phone || null,
      linkedinUrl: candidate.professional_network_url || null,
      influenceScore: candidate.influence_score || 0,
      seniorityLevel: this.mapSeniorityLevel(candidate.active_experience_title || ''),
      managementLevel: candidate.active_experience_management_level || 'Individual Contributor',
      tenure: candidate.tenure_months || 0
    };
  }
  
  private mapSeniorityLevel(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cfo')) {
      return 'C-Level';
    }
    if (titleLower.includes('vp') || titleLower.includes('vice president')) {
      return 'VP';
    }
    if (titleLower.includes('director')) {
      return 'Director';
    }
    if (titleLower.includes('manager') || titleLower.includes('lead')) {
      return 'Manager';
    }
    
    return 'IC';
  }
}

