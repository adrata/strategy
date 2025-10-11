/**
 * PERSON INNOVATION PROFILER
 * 
 * Classifies individuals by innovation adoption segment using
 * Diffusion of Innovation theory
 * 
 * Analyzes:
 * - Technology adoption patterns
 * - Career risk-taking
 * - Thought leadership activity
 * - Conference speaking
 * - Content creation
 * - Open source contributions
 */

class PersonInnovationProfiler {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Profile person's innovation adoption characteristics
   */
  async profilePerson(personData) {
    console.log(`🚀 [PERSON INNOVATION] Profiling: ${personData.name}`);

    const signals = await this.detectSignals(personData);
    const score = this.calculateScore(signals);
    const segment = this.classifySegment(score);

    return {
      segment, // innovators, early_adopters, early_majority, late_majority, laggards
      score, // 0-100
      confidence: this.calculateConfidence(signals),
      signals: signals.detected,
      evidence: signals.evidence,
      riskTolerance: this.assessRiskTolerance(signals),
      adoptionSpeed: this.assessAdoptionSpeed(signals),
      decisionMakingStyle: this.inferDecisionMakingStyle(segment, signals)
    };
  }

  /**
   * Detect innovation signals
   */
  async detectSignals(personData) {
    const signals = {
      detected: [],
      evidence: [],
      scoreContributions: {}
    };

    // Conference speaking
    if (personData.conferenceSpeaker || personData.speakingEngagements > 0) {
      signals.detected.push('conference_speaker');
      signals.evidence.push(`Conference speaker with ${personData.speakingEngagements || 'multiple'} engagements`);
      signals.scoreContributions.conferenceSpeaker = 20;
    }

    // Blog/article authorship
    const contentCount = (personData.blogPosts || 0) + (personData.publishedArticles || 0);
    if (contentCount > 0) {
      signals.detected.push('content_creator');
      signals.evidence.push(`Published ${contentCount} articles/posts`);
      signals.scoreContributions.contentCreator = Math.min(20, contentCount * 2);
    }

    // GitHub/open source
    if (personData.githubActivity === 'high' || personData.openSourceContributions) {
      signals.detected.push('open_source_contributor');
      signals.evidence.push('Active in open source community');
      signals.scoreContributions.openSource = 20;
    }

    // Early technology adoption
    const techAdoption = this.analyzeTechAdoption(personData);
    if (techAdoption.isEarlyAdopter) {
      signals.detected.push('early_tech_adopter');
      signals.evidence.push(techAdoption.evidence);
      signals.scoreContributions.earlyTech = 25;
    }

    // Career risk-taking
    const careerRisk = this.analyzeCareerRisk(personData);
    if (careerRisk.isRiskTaker) {
      signals.detected.push('career_risk_taker');
      signals.evidence.push(careerRisk.evidence);
      signals.scoreContributions.careerRisk = 15;
    }

    // Industry thought leadership
    if (personData.industryAdvisor || personData.boardMember) {
      signals.detected.push('industry_leader');
      signals.evidence.push('Serves as industry advisor or board member');
      signals.scoreContributions.industryLeader = 15;
    }

    // LinkedIn activity (thought leadership)
    if (personData.linkedInActivityLevel === 'high') {
      signals.detected.push('linkedin_thought_leader');
      signals.evidence.push('High LinkedIn activity with thought leadership content');
      signals.scoreContributions.linkedInLeader = 10;
    }

    // Patents/research
    if (personData.patents > 0 || personData.researchPapers > 0) {
      signals.detected.push('innovator_researcher');
      signals.evidence.push(`${personData.patents || 0} patents, ${personData.researchPapers || 0} research papers`);
      signals.scoreContributions.research = 15;
    }

    // Startup experience
    if (personData.hasStartupExperience) {
      signals.detected.push('startup_experience');
      signals.evidence.push('Has startup experience');
      signals.scoreContributions.startup = 10;
    }

    return signals;
  }

  /**
   * Analyze technology adoption patterns
   */
  analyzeTechAdoption(personData) {
    const skills = personData.skills || [];
    const experience = personData.experience || [];
    const posts = personData.linkedInPosts || [];

    // Check for early adoption mentions
    const earlyAdoptionMentions = posts.filter(post =>
      post.content.toLowerCase().includes('early adopter') ||
      post.content.toLowerCase().includes('cutting edge') ||
      post.content.toLowerCase().includes('experimenting with') ||
      post.content.toLowerCase().includes('trying new')
    );

    // Check for modern/emerging tech skills
    const emergingTechSkills = skills.filter(skill =>
      ['AI', 'Machine Learning', 'GPT', 'LLM', 'Edge Computing', 'Web3', 'Blockchain', 
       'Quantum', 'AR/VR', 'Computer Vision', 'NLP'].some(tech =>
        skill.toLowerCase().includes(tech.toLowerCase())
      )
    );

    // Check adoption timeline from experience
    let earliestAdoption = null;
    experience.forEach(exp => {
      if (exp.technologies) {
        exp.technologies.forEach(tech => {
          if (tech.name === 'React' && exp.startYear < 2016) {
            earliestAdoption = `Adopted React in ${exp.startYear} (early adopter)`;
          }
          if (tech.name === 'Node.js' && exp.startYear < 2013) {
            earliestAdoption = `Adopted Node.js in ${exp.startYear} (early adopter)`;
          }
        });
      }
    });

    const isEarlyAdopter = 
      earlyAdoptionMentions.length > 0 ||
      emergingTechSkills.length >= 2 ||
      earliestAdoption !== null;

    const evidence = earliestAdoption ||
      (earlyAdoptionMentions.length > 0 ? 'LinkedIn posts mention early technology adoption' : '') ||
      (emergingTechSkills.length > 0 ? `Skills include ${emergingTechSkills.length} emerging technologies` : '') ||
      'Standard technology adoption pattern';

    return { isEarlyAdopter, evidence };
  }

  /**
   * Analyze career risk-taking
   */
  analyzeCareerRisk(personData) {
    const previousCompanies = personData.previousCompanies || [];
    
    // Check for startup experience
    const hasStartupExp = previousCompanies.some(c => 
      c.employeeCount < 50 || c.type === 'startup'
    );

    // Check for big tech → startup moves
    const leftBigTechForStartup = previousCompanies.some((c, i) => {
      if (i === 0) return false;
      const prev = previousCompanies[i - 1];
      return prev.employeeCount > 10000 && c.employeeCount < 100;
    });

    // Check for founder/co-founder experience
    const isFounder = personData.isFounder || previousCompanies.some(c => 
      c.role && (c.role.toLowerCase().includes('founder') || c.role.toLowerCase().includes('owner'))
    );

    // Check for geographic moves
    const internationalMoves = previousCompanies.filter((c, i) => {
      if (i === 0) return false;
      const prev = previousCompanies[i - 1];
      return prev.country !== c.country;
    }).length;

    const isRiskTaker = leftBigTechForStartup || isFounder || (hasStartupExp && internationalMoves > 0);

    let evidence = 'Traditional career path';
    if (isFounder) {
      evidence = 'Founded own company (high risk tolerance)';
    } else if (leftBigTechForStartup) {
      evidence = 'Left big tech for startup (high risk tolerance)';
    } else if (hasStartupExp) {
      evidence = 'Has startup experience (moderate risk tolerance)';
    }

    return { isRiskTaker, evidence };
  }

  /**
   * Calculate innovation score
   */
  calculateScore(signals) {
    const contributions = signals.scoreContributions || {};
    const totalScore = Object.values(contributions).reduce((sum, val) => sum + val, 0);
    return Math.min(100, totalScore);
  }

  /**
   * Classify into innovation segment
   */
  classifySegment(score) {
    if (score >= 80) return 'innovators'; // 2.5% - First to adopt
    if (score >= 60) return 'early_adopters'; // 13.5% - Quick to adopt
    if (score >= 40) return 'early_majority'; // 34% - Pragmatic
    if (score >= 20) return 'late_majority'; // 34% - Skeptical
    return 'laggards'; // 16% - Last to adopt
  }

  /**
   * Calculate confidence
   */
  calculateConfidence(signals) {
    const signalCount = signals.detected.length;
    
    if (signalCount >= 6) return 0.95;
    if (signalCount >= 5) return 0.90;
    if (signalCount >= 4) return 0.85;
    if (signalCount >= 3) return 0.75;
    if (signalCount >= 2) return 0.65;
    if (signalCount >= 1) return 0.55;
    return 0.40;
  }

  /**
   * Assess risk tolerance
   */
  assessRiskTolerance(signals) {
    const score = this.calculateScore(signals);
    
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
    const score = this.calculateScore(signals);
    
    if (score >= 75) return 'very_fast'; // First wave
    if (score >= 55) return 'fast'; // Second wave
    if (score >= 35) return 'moderate'; // Mainstream
    if (score >= 15) return 'slow'; // Late adopter
    return 'very_slow'; // Resistant
  }

  /**
   * Infer decision-making style
   */
  inferDecisionMakingStyle(segment, signals) {
    const hasContentCreation = signals.detected.includes('content_creator');
    const hasResearch = signals.detected.includes('innovator_researcher');
    const hasRiskTaking = signals.detected.includes('career_risk_taker');

    if (segment === 'innovators') {
      if (hasResearch) return 'analytical_innovator'; // Data-driven risk-taker
      if (hasRiskTaking) return 'intuitive_innovator'; // Gut-driven risk-taker
      return 'visionary'; // Forward-thinking
    }

    if (segment === 'early_adopters') {
      if (hasContentCreation) return 'thought_leader'; // Influences others
      return 'pragmatic_innovator'; // Calculated risk-taker
    }

    if (segment === 'early_majority') {
      return 'analytical_pragmatist'; // Waits for validation
    }

    if (segment === 'late_majority') {
      return 'conservative_follower'; // Risk-averse
    }

    return 'traditional'; // Resistant to change
  }
}

module.exports = { PersonInnovationProfiler };

