/**
 * INNOVATION ADOPTION ANALYZER
 * 
 * Classifies companies and people based on Diffusion of Innovation theory
 * Categories: Innovators (2.5%), Early Adopters (13.5%), Early Majority (34%), 
 *             Late Majority (34%), Laggards (16%)
 * 
 * Signals:
 * - Tech stack modernity
 * - Adoption speed of new technologies
 * - Thought leadership activity
 * - Conference speaking
 * - Blog/GitHub activity
 * - Risk tolerance indicators
 */

class InnovationAdoptionAnalyzer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Analyze company's innovation adoption profile
   */
  async analyzeCompany(companyData, buyerGroup = null) {
    console.log(`🚀 [INNOVATION] Analyzing innovation profile for: ${companyData.name}`);

    const signals = await this.detectCompanySignals(companyData, buyerGroup);
    const score = this.calculateInnovationScore(signals);
    const segment = this.classifySegment(score);

    return {
      segment, // innovators, early_adopters, early_majority, late_majority, laggards
      score, // 0-100
      confidence: this.calculateConfidence(signals),
      signals: signals.detected,
      evidence: signals.evidence,
      riskTolerance: this.assessRiskTolerance(signals),
      adoptionSpeed: this.assessAdoptionSpeed(signals)
    };
  }

  /**
   * Analyze person's innovation adoption profile
   */
  async analyzePerson(personData) {
    console.log(`🚀 [INNOVATION] Analyzing innovation profile for: ${personData.name}`);

    const signals = await this.detectPersonSignals(personData);
    const score = this.calculateInnovationScore(signals);
    const segment = this.classifySegment(score);

    return {
      segment,
      score,
      confidence: this.calculateConfidence(signals),
      signals: signals.detected,
      evidence: signals.evidence,
      riskTolerance: this.assessRiskTolerance(signals),
      adoptionSpeed: this.assessAdoptionSpeed(signals)
    };
  }

  /**
   * Detect innovation signals from company data
   */
  async detectCompanySignals(companyData, buyerGroup) {
    const signals = {
      detected: [],
      evidence: [],
      scoreContributions: {}
    };

    // Tech stack modernity (from buyer group or company data)
    const techStackScore = this.analyzeTechStack(companyData.technologies || []);
    if (techStackScore > 70) {
      signals.detected.push('tech_stack_modern');
      signals.evidence.push(`Uses cutting-edge tech stack (score: ${techStackScore}/100)`);
      signals.scoreContributions.techStack = 20;
    } else if (techStackScore > 40) {
      signals.scoreContributions.techStack = 10;
    }

    // Thought leadership from buyer group
    if (buyerGroup) {
      const thoughtLeaders = buyerGroup.members?.filter(m => 
        m.thoughtLeadership || m.conferenceSpeaker
      ) || [];
      
      if (thoughtLeaders.length > 0) {
        signals.detected.push('thought_leadership');
        signals.evidence.push(`${thoughtLeaders.length} team members are thought leaders/speakers`);
        signals.scoreContributions.thoughtLeadership = 15 * thoughtLeaders.length;
      }
    }

    // Early technology adoption patterns
    const adoptionPatterns = this.analyzeAdoptionPatterns(companyData);
    if (adoptionPatterns.isEarlyAdopter) {
      signals.detected.push('early_adoption');
      signals.evidence.push(adoptionPatterns.evidence);
      signals.scoreContributions.earlyAdoption = 25;
    }

    // Innovation indicators from company profile
    if (companyData.runsInnovationLab || companyData.hasBetaPrograms) {
      signals.detected.push('innovation_programs');
      signals.evidence.push('Runs innovation lab or beta programs');
      signals.scoreContributions.innovationPrograms = 20;
    }

    // Recent funding/growth (indicates appetite for new solutions)
    if (companyData.recentFunding || companyData.rapidGrowth) {
      signals.detected.push('growth_mindset');
      signals.evidence.push('Recent funding or rapid growth indicates openness to innovation');
      signals.scoreContributions.growthMindset = 10;
    }

    return signals;
  }

  /**
   * Detect innovation signals from person data
   */
  async detectPersonSignals(personData) {
    const signals = {
      detected: [],
      evidence: [],
      scoreContributions: {}
    };

    // Conference speaking
    if (personData.conferenceSpeaker || personData.speakingEngagements > 0) {
      signals.detected.push('conference_speaker');
      signals.evidence.push(`Conference speaker (${personData.speakingEngagements || 'active'})`);
      signals.scoreContributions.conferenceSpeaker = 20;
    }

    // Blog/content authorship
    if (personData.blogPosts > 0 || personData.publishedArticles > 0) {
      signals.detected.push('content_creator');
      signals.evidence.push(`Published ${personData.blogPosts + personData.publishedArticles} articles`);
      signals.scoreContributions.contentCreator = 15;
    }

    // GitHub/open source activity
    if (personData.githubActivity === 'high' || personData.openSourceContributions) {
      signals.detected.push('open_source');
      signals.evidence.push('Active in open source community');
      signals.scoreContributions.openSource = 20;
    }

    // Early career moves to startups/new tech
    const careerRisk = this.analyzeCareerRiskTaking(personData);
    if (careerRisk.isRiskTaker) {
      signals.detected.push('career_risk_taker');
      signals.evidence.push(careerRisk.evidence);
      signals.scoreContributions.careerRisk = 15;
    }

    // Technology adoption from LinkedIn/profile
    const techAdoption = this.analyzePersonTechAdoption(personData);
    if (techAdoption.isEarlyAdopter) {
      signals.detected.push('early_tech_adopter');
      signals.evidence.push(techAdoption.evidence);
      signals.scoreContributions.techAdoption = 25;
    }

    // Industry thought leadership
    if (personData.industryAdvisor || personData.boardMember) {
      signals.detected.push('industry_leader');
      signals.evidence.push('Industry advisor or board member');
      signals.scoreContributions.industryLeader = 15;
    }

    return signals;
  }

  /**
   * Analyze tech stack modernity
   */
  analyzeTechStack(technologies) {
    if (!technologies || technologies.length === 0) return 50; // Default neutral

    const modernTech = [
      'React 18', 'React 19', 'Next.js 14', 'Next.js 15', 'Vue 3',
      'TypeScript', 'GraphQL', 'Kubernetes', 'Docker', 'AWS Lambda',
      'Serverless', 'Edge Computing', 'AI/ML', 'GPT-4', 'Vercel',
      'Supabase', 'Prisma', 'tRPC', 'Tailwind CSS'
    ];

    const legacyTech = [
      'jQuery', 'Angular.js', 'Backbone.js', 'PHP 5', 'Java 7',
      'Internet Explorer', 'Flash', 'Silverlight'
    ];

    let score = 50; // Neutral baseline
    let modernCount = 0;
    let legacyCount = 0;

    technologies.forEach(tech => {
      if (modernTech.some(mt => tech.toLowerCase().includes(mt.toLowerCase()))) {
        modernCount++;
        score += 10;
      }
      if (legacyTech.some(lt => tech.toLowerCase().includes(lt.toLowerCase()))) {
        legacyCount++;
        score -= 15;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze adoption patterns from company history
   */
  analyzeAdoptionPatterns(companyData) {
    // Check if company adopted technologies early
    // This would require historical data about technology adoption dates
    
    // Placeholder logic - would be enhanced with real adoption timeline data
    const isEarlyAdopter = companyData.adoptedReactYear && companyData.adoptedReactYear < 2016;
    
    return {
      isEarlyAdopter,
      evidence: isEarlyAdopter 
        ? `Adopted React in ${companyData.adoptedReactYear} (early adopter)` 
        : 'Standard technology adoption timeline'
    };
  }

  /**
   * Analyze career risk-taking from job history
   */
  analyzeCareerRiskTaking(personData) {
    const previousCompanies = personData.previousCompanies || [];
    const hasStartupExperience = previousCompanies.some(c => 
      c.size === 'startup' || c.employeeCount < 50
    );
    const leftBigTechForStartup = previousCompanies.some((c, i) => {
      if (i === 0) return false;
      const prevCompany = previousCompanies[i - 1];
      return prevCompany.employeeCount > 10000 && c.employeeCount < 100;
    });

    const isRiskTaker = hasStartupExperience || leftBigTechForStartup;

    return {
      isRiskTaker,
      evidence: leftBigTechForStartup 
        ? 'Left big tech company for startup (high risk tolerance)'
        : hasStartupExperience
        ? 'Has startup experience (moderate risk tolerance)'
        : 'Traditional career path (lower risk tolerance)'
    };
  }

  /**
   * Analyze person's technology adoption from profile
   */
  analyzePersonTechAdoption(personData) {
    // Check LinkedIn posts, skills, experience for early tech adoption
    const skills = personData.skills || [];
    const posts = personData.linkedInPosts || [];

    const mentionsEarlyTech = posts.some(post => 
      post.content.toLowerCase().includes('early adopter') ||
      post.content.toLowerCase().includes('cutting edge') ||
      post.content.toLowerCase().includes('experimenting with')
    );

    const hasModernSkills = skills.some(skill =>
      ['AI', 'Machine Learning', 'GPT', 'Edge Computing', 'Web3'].includes(skill)
    );

    const isEarlyAdopter = mentionsEarlyTech || hasModernSkills;

    return {
      isEarlyAdopter,
      evidence: mentionsEarlyTech 
        ? 'LinkedIn posts mention early technology adoption'
        : hasModernSkills
        ? 'Skills include cutting-edge technologies'
        : 'Standard technology profile'
    };
  }

  /**
   * Calculate overall innovation score
   */
  calculateInnovationScore(signals) {
    const contributions = signals.scoreContributions || {};
    const totalScore = Object.values(contributions).reduce((sum, val) => sum + val, 0);
    
    // Normalize to 0-100
    return Math.min(100, totalScore);
  }

  /**
   * Classify into innovation segment based on score
   */
  classifySegment(score) {
    if (score >= 80) return 'innovators'; // 2.5%
    if (score >= 60) return 'early_adopters'; // 13.5%
    if (score >= 40) return 'early_majority'; // 34%
    if (score >= 20) return 'late_majority'; // 34%
    return 'laggards'; // 16%
  }

  /**
   * Calculate confidence in classification
   */
  calculateConfidence(signals) {
    const signalCount = signals.detected.length;
    
    if (signalCount >= 5) return 0.95;
    if (signalCount >= 4) return 0.85;
    if (signalCount >= 3) return 0.75;
    if (signalCount >= 2) return 0.65;
    if (signalCount >= 1) return 0.55;
    return 0.40; // Low confidence with no signals
  }

  /**
   * Assess risk tolerance
   */
  assessRiskTolerance(signals) {
    const score = this.calculateInnovationScore(signals);
    
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  /**
   * Assess adoption speed
   */
  assessAdoptionSpeed(signals) {
    const score = this.calculateInnovationScore(signals);
    
    if (score >= 70) return 'very_fast';
    if (score >= 50) return 'fast';
    if (score >= 30) return 'moderate';
    if (score >= 15) return 'slow';
    return 'very_slow';
  }
}

module.exports = { InnovationAdoptionAnalyzer };

