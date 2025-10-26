#!/usr/bin/env node

/**
 * Career Signals Analysis Script
 * 
 * This script analyzes career signals from enriched person data to extract
 * buying intent indicators, tenure analysis, and career progression insights.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CareerSignalsAnalyzer {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 50;
    this.delayBetweenBatches = 1000; // 1 second
    
    this.results = {
      totalPeople: 0,
      processedPeople: 0,
      successfullyAnalyzed: 0,
      failedAnalysis: 0,
      signalsGenerated: {
        highIntent: 0,
        mediumIntent: 0,
        lowIntent: 0
      }
    };
  }

  async run() {
    try {
      console.log('🔍 Starting Career Signals Analysis for Notary Everyday workspace...\n');
      
      // Get all people with enrichment data
      const people = await this.getEnrichedPeople();
      this.results.totalPeople = people.length;
      
      console.log(`📊 Found ${people.length} enriched people to analyze`);
      
      if (people.length === 0) {
        console.log('❌ No enriched people found to process');
        return;
      }

      // Process people in batches
      await this.processPeopleInBatches(people);
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in career signals analysis:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getEnrichedPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            employeeCount: true,
            foundedYear: true
          }
        }
      },
      orderBy: {
        lastEnriched: 'desc'
      }
    });
  }

  async processPeopleInBatches(people) {
    const totalBatches = Math.ceil(people.length / this.batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, people.length);
      const batch = people.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} people)`);
      
      for (const person of batch) {
        try {
          await this.analyzePersonCareerSignals(person);
          this.results.processedPeople++;
        } catch (error) {
          console.error(`   ❌ Error analyzing ${person.fullName}:`, error.message);
          this.results.failedAnalysis++;
        }
      }
      
      // Delay between batches
      if (batchIndex < totalBatches - 1) {
        console.log(`   ⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`);
        await this.delay(this.delayBetweenBatches);
      }
    }
  }

  async analyzePersonCareerSignals(person) {
    console.log(`   🔍 Analyzing: ${person.fullName}`);
    
    try {
      // Extract career signals from Coresignal data
      const careerSignals = this.extractCareerSignals(person);
      
      // Calculate buying intent based on signals
      const buyingIntent = this.calculateBuyingIntent(careerSignals, person);
      
      // Generate career insights
      const careerInsights = this.generateCareerInsights(careerSignals, person);
      
      // Update person with career signals
      await this.updatePersonWithCareerSignals(person, {
        careerSignals,
        buyingIntent,
        careerInsights
      });
      
      console.log(`   ✅ Analyzed: ${person.fullName} (Intent: ${buyingIntent.level})`);
      this.results.successfullyAnalyzed++;
      this.results.signalsGenerated[buyingIntent.level]++;
      
    } catch (error) {
      console.error(`   ❌ Failed to analyze ${person.fullName}:`, error.message);
      this.results.failedAnalysis++;
    }
  }

  extractCareerSignals(person) {
    const coresignalData = person.customFields?.coresignalData;
    if (!coresignalData) {
      return this.generateBasicSignals(person);
    }

    const signals = {
      tenure: this.analyzeTenure(coresignalData, person),
      progression: this.analyzeProgression(coresignalData, person),
      velocity: this.analyzeVelocity(coresignalData, person),
      stability: this.analyzeStability(coresignalData, person),
      expertise: this.analyzeExpertise(coresignalData, person)
    };

    return signals;
  }

  generateBasicSignals(person) {
    // Generate basic signals from available data
    const signals = {
      tenure: {
        inRole: person.yearsInRole || 0,
        atCompany: person.yearsAtCompany || 0,
        totalExperience: person.totalExperience || 0,
        confidence: 'low'
      },
      progression: {
        recentPromotion: false,
        externalHire: false,
        lateralMove: false,
        careerGrowth: 'unknown',
        confidence: 'low'
      },
      velocity: {
        jobChanges: 0,
        averageTenure: 0,
        careerAcceleration: 'unknown',
        confidence: 'low'
      },
      stability: {
        jobStability: 'unknown',
        companyLoyalty: 'unknown',
        riskTolerance: 'unknown',
        confidence: 'low'
      },
      expertise: {
        technicalLevel: 'unknown',
        leadershipLevel: 'unknown',
        industryExpertise: 'unknown',
        confidence: 'low'
      }
    };

    return signals;
  }

  analyzeTenure(coresignalData, person) {
    const experience = coresignalData.experience || [];
    const currentRole = experience.find(exp => exp.active_experience === 1) || experience[0];
    
    let inRole = 0;
    let atCompany = 0;
    
    if (currentRole) {
      const startDate = new Date(currentRole.start_date);
      const endDate = currentRole.end_date ? new Date(currentRole.end_date) : new Date();
      inRole = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25));
      
      // Find company tenure
      const companyRoles = experience.filter(exp => 
        exp.company_name === currentRole.company_name || 
        exp.company_linkedin_url === currentRole.company_linkedin_url
      );
      
      if (companyRoles.length > 0) {
        const firstCompanyRole = companyRoles[companyRoles.length - 1];
        const companyStartDate = new Date(firstCompanyRole.start_date);
        atCompany = Math.floor((endDate - companyStartDate) / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    const totalExperience = coresignalData.total_experience || 0;
    
    return {
      inRole: Math.max(inRole, person.yearsInRole || 0),
      atCompany: Math.max(atCompany, person.yearsAtCompany || 0),
      totalExperience: Math.max(totalExperience, person.totalExperience || 0),
      confidence: experience.length > 0 ? 'high' : 'low'
    };
  }

  analyzeProgression(coresignalData, person) {
    const experience = coresignalData.experience || [];
    
    if (experience.length < 2) {
      return {
        recentPromotion: false,
        externalHire: false,
        lateralMove: false,
        careerGrowth: 'unknown',
        confidence: 'low'
      };
    }

    const currentRole = experience.find(exp => exp.active_experience === 1) || experience[0];
    const previousRole = experience[1];
    
    // Check for recent promotion (within last 2 years)
    const currentStartDate = new Date(currentRole.start_date);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const recentPromotion = currentStartDate > twoYearsAgo;
    
    // Check if external hire (different company)
    const externalHire = currentRole.company_name !== previousRole.company_name;
    
    // Check for lateral move (similar level, different role)
    const lateralMove = this.isLateralMove(currentRole.title, previousRole.title);
    
    // Determine career growth pattern
    const careerGrowth = this.determineCareerGrowth(experience);
    
    return {
      recentPromotion,
      externalHire,
      lateralMove,
      careerGrowth,
      confidence: 'high'
    };
  }

  analyzeVelocity(coresignalData, person) {
    const experience = coresignalData.experience || [];
    
    if (experience.length < 2) {
      return {
        jobChanges: 0,
        averageTenure: 0,
        careerAcceleration: 'unknown',
        confidence: 'low'
      };
    }

    const jobChanges = experience.length - 1;
    const totalYears = coresignalData.total_experience || 0;
    const averageTenure = totalYears > 0 ? totalYears / experience.length : 0;
    
    // Determine career acceleration
    let careerAcceleration = 'steady';
    if (averageTenure < 1.5) {
      careerAcceleration = 'fast';
    } else if (averageTenure > 4) {
      careerAcceleration = 'slow';
    }
    
    return {
      jobChanges,
      averageTenure,
      careerAcceleration,
      confidence: 'high'
    };
  }

  analyzeStability(coresignalData, person) {
    const experience = coresignalData.experience || [];
    
    if (experience.length < 2) {
      return {
        jobStability: 'unknown',
        companyLoyalty: 'unknown',
        riskTolerance: 'unknown',
        confidence: 'low'
      };
    }

    const averageTenure = this.calculateAverageTenure(experience);
    const companyChanges = this.countCompanyChanges(experience);
    
    let jobStability = 'high';
    if (averageTenure < 2) {
      jobStability = 'low';
    } else if (averageTenure < 3) {
      jobStability = 'medium';
    }
    
    let companyLoyalty = 'high';
    if (companyChanges > 3) {
      companyLoyalty = 'low';
    } else if (companyChanges > 1) {
      companyLoyalty = 'medium';
    }
    
    let riskTolerance = 'low';
    if (companyChanges > 2 && averageTenure < 2) {
      riskTolerance = 'high';
    } else if (companyChanges > 1 || averageTenure < 3) {
      riskTolerance = 'medium';
    }
    
    return {
      jobStability,
      companyLoyalty,
      riskTolerance,
      confidence: 'high'
    };
  }

  analyzeExpertise(coresignalData, person) {
    const skills = coresignalData.skills || [];
    const experience = coresignalData.experience || [];
    
    // Analyze technical level
    const technicalSkills = skills.filter(skill => 
      this.isTechnicalSkill(skill)
    ).length;
    
    let technicalLevel = 'beginner';
    if (technicalSkills > 10) {
      technicalLevel = 'expert';
    } else if (technicalSkills > 5) {
      technicalLevel = 'intermediate';
    }
    
    // Analyze leadership level
    const leadershipRoles = experience.filter(exp => 
      this.isLeadershipRole(exp.title)
    ).length;
    
    let leadershipLevel = 'individual';
    if (leadershipRoles > 2) {
      leadershipLevel = 'senior';
    } else if (leadershipRoles > 0) {
      leadershipLevel = 'emerging';
    }
    
    // Analyze industry expertise
    const industries = [...new Set(experience.map(exp => exp.industry))];
    const industryExpertise = industries.length === 1 ? 'specialist' : 'generalist';
    
    return {
      technicalLevel,
      leadershipLevel,
      industryExpertise,
      confidence: skills.length > 0 ? 'high' : 'low'
    };
  }

  calculateBuyingIntent(careerSignals, person) {
    let score = 0;
    let factors = [];
    
    // Tenure factors (40 points)
    const tenureScore = this.calculateTenureScore(careerSignals.tenure);
    score += tenureScore.score;
    factors.push({ factor: 'tenure', score: tenureScore.score, reasoning: tenureScore.reasoning });
    
    // Progression factors (30 points)
    const progressionScore = this.calculateProgressionScore(careerSignals.progression);
    score += progressionScore.score;
    factors.push({ factor: 'progression', score: progressionScore.score, reasoning: progressionScore.reasoning });
    
    // Velocity factors (20 points)
    const velocityScore = this.calculateVelocityScore(careerSignals.velocity);
    score += velocityScore.score;
    factors.push({ factor: 'velocity', score: velocityScore.score, reasoning: velocityScore.reasoning });
    
    // Stability factors (10 points)
    const stabilityScore = this.calculateStabilityScore(careerSignals.stability);
    score += stabilityScore.score;
    factors.push({ factor: 'stability', score: stabilityScore.score, reasoning: stabilityScore.reasoning });
    
    // Determine intent level
    let level = 'low';
    if (score >= 70) {
      level = 'high';
    } else if (score >= 40) {
      level = 'medium';
    }
    
    return {
      level,
      score: Math.min(100, Math.round(score)),
      factors,
      reasoning: this.generateBuyingIntentReasoning(factors)
    };
  }

  calculateTenureScore(tenure) {
    let score = 0;
    let reasoning = [];
    
    // New in role (0-6 months) - high buying intent
    if (tenure.inRole < 0.5) {
      score += 40;
      reasoning.push('New in role - establishing processes');
    }
    // Established (6-24 months) - medium buying intent
    else if (tenure.inRole < 2) {
      score += 20;
      reasoning.push('Established in role - optimization focus');
    }
    // Veteran (24+ months) - low buying intent
    else {
      score += 5;
      reasoning.push('Veteran in role - strategic initiatives');
    }
    
    return { score, reasoning: reasoning.join(', ') };
  }

  calculateProgressionScore(progression) {
    let score = 0;
    let reasoning = [];
    
    // Recent promotion - high buying intent
    if (progression.recentPromotion) {
      score += 30;
      reasoning.push('Recent promotion - new budget access');
    }
    
    // External hire - high buying intent
    if (progression.externalHire) {
      score += 25;
      reasoning.push('External hire - bringing new ideas');
    }
    
    // Lateral move - medium buying intent
    if (progression.lateralMove) {
      score += 15;
      reasoning.push('Lateral move - process improvement focus');
    }
    
    // Career growth pattern
    if (progression.careerGrowth === 'accelerating') {
      score += 10;
      reasoning.push('Accelerating career growth');
    }
    
    return { score, reasoning: reasoning.join(', ') };
  }

  calculateVelocityScore(velocity) {
    let score = 0;
    let reasoning = [];
    
    // Fast career velocity - high buying intent
    if (velocity.careerAcceleration === 'fast') {
      score += 20;
      reasoning.push('Fast career progression - ambitious');
    }
    // Steady progression - medium buying intent
    else if (velocity.careerAcceleration === 'steady') {
      score += 10;
      reasoning.push('Steady career progression');
    }
    // Slow progression - low buying intent
    else {
      score += 5;
      reasoning.push('Slow career progression - risk-averse');
    }
    
    return { score, reasoning: reasoning.join(', ') };
  }

  calculateStabilityScore(stability) {
    let score = 0;
    let reasoning = [];
    
    // Low stability - high buying intent (looking for solutions)
    if (stability.jobStability === 'low') {
      score += 10;
      reasoning.push('Low job stability - seeking solutions');
    }
    // High stability - low buying intent (comfortable)
    else if (stability.jobStability === 'high') {
      score += 2;
      reasoning.push('High job stability - comfortable');
    }
    // Medium stability - medium buying intent
    else {
      score += 5;
      reasoning.push('Medium job stability');
    }
    
    return { score, reasoning: reasoning.join(', ') };
  }

  generateCareerInsights(careerSignals, person) {
    const insights = [];
    
    // Tenure insights
    if (careerSignals.tenure.inRole < 1) {
      insights.push('Recently started in role - likely establishing new processes and evaluating tools');
    } else if (careerSignals.tenure.inRole > 3) {
      insights.push('Long tenure in role - may be looking for strategic improvements or new challenges');
    }
    
    // Progression insights
    if (careerSignals.progression.recentPromotion) {
      insights.push('Recent promotion suggests increased responsibility and budget authority');
    }
    
    if (careerSignals.progression.externalHire) {
      insights.push('External hire likely bringing fresh perspective and may be evaluating current vendors');
    }
    
    // Velocity insights
    if (careerSignals.velocity.careerAcceleration === 'fast') {
      insights.push('Fast career progression indicates high performance and likely influence in decision-making');
    }
    
    // Stability insights
    if (careerSignals.stability.riskTolerance === 'high') {
      insights.push('High risk tolerance suggests openness to new solutions and innovative approaches');
    }
    
    return insights;
  }

  async updatePersonWithCareerSignals(person, careerData) {
    await this.prisma.people.update({
      where: { id: person.id },
      data: {
        customFields: {
          ...(person.customFields || {}),
          careerSignals: careerData.careerSignals,
          buyingIntent: careerData.buyingIntent,
          careerInsights: careerData.careerInsights
        },
        updatedAt: new Date()
      }
    });
  }

  // Helper methods
  isLateralMove(currentTitle, previousTitle) {
    const currentLevel = this.getRoleLevel(currentTitle);
    const previousLevel = this.getRoleLevel(previousTitle);
    return currentLevel === previousLevel && currentTitle !== previousTitle;
  }

  getRoleLevel(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('president')) return 'executive';
    if (titleLower.includes('vp') || titleLower.includes('vice president')) return 'vp';
    if (titleLower.includes('director')) return 'director';
    if (titleLower.includes('manager')) return 'manager';
    return 'individual';
  }

  determineCareerGrowth(experience) {
    if (experience.length < 3) return 'unknown';
    
    const levels = experience.map(exp => this.getRoleLevel(exp.title));
    const progression = levels.map((level, index) => {
      if (index === 0) return 0;
      const prevLevel = this.getLevelValue(levels[index - 1]);
      const currentLevel = this.getLevelValue(level);
      return currentLevel - prevLevel;
    });
    
    const avgProgression = progression.reduce((a, b) => a + b, 0) / progression.length;
    
    if (avgProgression > 0.5) return 'accelerating';
    if (avgProgression > 0) return 'growing';
    if (avgProgression === 0) return 'stable';
    return 'declining';
  }

  getLevelValue(level) {
    const levels = { 'individual': 1, 'manager': 2, 'director': 3, 'vp': 4, 'executive': 5 };
    return levels[level] || 1;
  }

  calculateAverageTenure(experience) {
    if (experience.length < 2) return 0;
    
    const tenures = experience.map(exp => {
      const start = new Date(exp.start_date);
      const end = exp.end_date ? new Date(exp.end_date) : new Date();
      return (end - start) / (1000 * 60 * 60 * 24 * 365.25);
    });
    
    return tenures.reduce((a, b) => a + b, 0) / tenures.length;
  }

  countCompanyChanges(experience) {
    const companies = [...new Set(experience.map(exp => exp.company_name))];
    return companies.length - 1;
  }

  isTechnicalSkill(skill) {
    const technicalKeywords = ['programming', 'software', 'development', 'engineering', 'technical', 'coding', 'programming', 'database', 'cloud', 'api', 'system', 'architecture'];
    return technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  }

  isLeadershipRole(title) {
    const leadershipKeywords = ['manager', 'director', 'vp', 'vice president', 'head', 'lead', 'chief', 'president', 'ceo', 'cto', 'cfo'];
    return leadershipKeywords.some(keyword => title.toLowerCase().includes(keyword));
  }

  generateBuyingIntentReasoning(factors) {
    const highFactors = factors.filter(f => f.score >= 20);
    const mediumFactors = factors.filter(f => f.score >= 10 && f.score < 20);
    
    let reasoning = [];
    
    if (highFactors.length > 0) {
      reasoning.push(`High intent indicators: ${highFactors.map(f => f.factor).join(', ')}`);
    }
    
    if (mediumFactors.length > 0) {
      reasoning.push(`Medium intent indicators: ${mediumFactors.map(f => f.factor).join(', ')}`);
    }
    
    return reasoning.join('; ');
  }

  printResults() {
    console.log('\n🔍 Career Signals Analysis Results:');
    console.log('====================================');
    console.log(`Total People: ${this.results.totalPeople}`);
    console.log(`Processed: ${this.results.processedPeople}`);
    console.log(`Successfully Analyzed: ${this.results.successfullyAnalyzed}`);
    console.log(`Failed Analysis: ${this.results.failedAnalysis}`);
    console.log('\nBuying Intent Distribution:');
    console.log(`  High Intent: ${this.results.signalsGenerated.highIntent}`);
    console.log(`  Medium Intent: ${this.results.signalsGenerated.mediumIntent}`);
    console.log(`  Low Intent: ${this.results.signalsGenerated.lowIntent}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the analyzer
const analyzer = new CareerSignalsAnalyzer();
analyzer.run().catch(console.error);
