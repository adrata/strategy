/**
 * PERSON PAIN ANALYZER
 * 
 * Detects pain signals and problem awareness from individual person data
 * 
 * Sources:
 * - LinkedIn posts mentioning challenges
 * - Job postings from their team (hiring for pain points)
 * - Conference talks about problems
 * - Blog posts about challenges
 * - Interview mentions
 */

class PersonPainAnalyzer {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Analyze person's pain awareness
   */
  async analyzePain(personData) {
    console.log(`💥 [PERSON PAIN] Analyzing pain for: ${personData.name}`);

    const activePains = await this.detectActivePains(personData);
    const keywords = this.extractPainKeywords(personData);
    const urgency = this.assessUrgency(activePains);

    return {
      activePains,
      keywords,
      urgency,
      painAwareness: activePains.length > 0 ? 'high' : 'low',
      totalPainScore: activePains.reduce((sum, p) => sum + p.score, 0)
    };
  }

  /**
   * Detect active pains from person data
   */
  async detectActivePains(personData) {
    const pains = [];

    // LinkedIn posts analysis
    if (personData.linkedInPosts) {
      const painPosts = this.analyzeLinkedInPosts(personData.linkedInPosts);
      pains.push(...painPosts);
    }

    // Job postings (hiring for pain points)
    if (personData.teamHiring) {
      const hiringPains = this.analyzeHiringPatterns(personData.teamHiring);
      pains.push(...hiringPains);
    }

    // Conference talks
    if (personData.conferenceTalks) {
      const talkPains = this.analyzeConferenceTalks(personData.conferenceTalks);
      pains.push(...talkPains);
    }

    // Blog posts/articles
    if (personData.articles) {
      const articlePains = this.analyzeArticles(personData.articles);
      pains.push(...articlePains);
    }

    return pains;
  }

  /**
   * Analyze LinkedIn posts for pain signals
   */
  analyzeLinkedInPosts(posts) {
    const painPatterns = [
      { pattern: /struggling with|challenges with|pain point/i, pain: 'operational_challenges', severity: 'high', score: 15 },
      { pattern: /scaling|growth pain/i, pain: 'scaling_challenges', severity: 'high', score: 15 },
      { pattern: /manual|tedious|time-consuming/i, pain: 'manual_processes', severity: 'medium', score: 10 },
      { pattern: /technical debt|legacy system/i, pain: 'technical_debt', severity: 'high', score: 15 },
      { pattern: /inefficient|waste|bottleneck/i, pain: 'efficiency_issues', severity: 'medium', score: 10 },
      { pattern: /too many tools|tool sprawl/i, pain: 'tool_consolidation', severity: 'medium', score: 10 }
    ];

    const pains = [];

    posts.forEach(post => {
      painPatterns.forEach(({ pattern, pain, severity, score }) => {
        if (pattern.test(post.content)) {
          pains.push({
            pain,
            severity,
            evidence: `LinkedIn post: "${post.content.substring(0, 100)}..."`,
            source: 'linkedin',
            score,
            date: post.date
          });
        }
      });
    });

    return pains;
  }

  /**
   * Analyze hiring patterns
   */
  analyzeHiringPatterns(hiringData) {
    const pains = [];

    hiringData.forEach(hire => {
      const title = hire.jobTitle.toLowerCase();
      
      if (title.includes('automation') || title.includes('efficiency')) {
        pains.push({
          pain: 'manual_processes',
          severity: 'high',
          evidence: `Hiring for ${hire.jobTitle} (automation focus)`,
          source: 'hiring',
          score: 15
        });
      }

      if (title.includes('scale') || title.includes('infrastructure')) {
        pains.push({
          pain: 'scaling_challenges',
          severity: 'high',
          evidence: `Hiring for ${hire.jobTitle} (scaling focus)`,
          source: 'hiring',
          score: 15
        });
      }

      if (title.includes('integration') || title.includes('platform')) {
        pains.push({
          pain: 'tool_integration',
          severity: 'medium',
          evidence: `Hiring for ${hire.jobTitle} (integration focus)`,
          source: 'hiring',
          score: 10
        });
      }
    });

    return pains;
  }

  /**
   * Analyze conference talks
   */
  analyzeConferenceTalks(talks) {
    const pains = [];

    talks.forEach(talk => {
      const title = talk.title.toLowerCase();

      // Conference talks about challenges = high pain awareness
      if (title.includes('challenge') || title.includes('problem') || title.includes('lesson')) {
        pains.push({
          pain: 'operational_challenges',
          severity: 'high',
          evidence: `Conference talk: "${talk.title}"`,
          source: 'conference',
          score: 20 // High score - public acknowledgment
        });
      }
    });

    return pains;
  }

  /**
   * Analyze articles/blog posts
   */
  analyzeArticles(articles) {
    const pains = [];

    articles.forEach(article => {
      const content = (article.title + ' ' + (article.summary || '')).toLowerCase();

      if (content.includes('scaling') || content.includes('growth')) {
        pains.push({
          pain: 'scaling_challenges',
          severity: 'high',
          evidence: `Article: "${article.title}"`,
          source: 'blog',
          score: 15
        });
      }

      if (content.includes('automation') || content.includes('efficiency')) {
        pains.push({
          pain: 'efficiency_issues',
          severity: 'medium',
          evidence: `Article: "${article.title}"`,
          source: 'blog',
          score: 12
        });
      }
    });

    return pains;
  }

  /**
   * Extract pain-related keywords
   */
  extractPainKeywords(personData) {
    const keywords = [];
    const sources = [
      ...(personData.linkedInPosts || []).map(p => p.content),
      ...(personData.articles || []).map(a => a.title + ' ' + (a.summary || '')),
      ...(personData.conferenceTalks || []).map(t => t.title)
    ];

    const painKeywords = [
      'automation', 'efficiency', 'scale', 'scaling', 'growth',
      'manual', 'tedious', 'bottleneck', 'integration', 'consolidation',
      'legacy', 'technical debt', 'modernize', 'streamline'
    ];

    const allText = sources.join(' ').toLowerCase();
    
    painKeywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return [...new Set(keywords)]; // Unique keywords
  }

  /**
   * Assess urgency
   */
  assessUrgency(pains) {
    if (pains.length === 0) return 0.3;

    const recentPains = pains.filter(p => {
      if (!p.date) return true; // Assume recent if no date
      const ageMonths = (Date.now() - new Date(p.date)) / (1000 * 60 * 60 * 24 * 30);
      return ageMonths < 3; // Within 3 months
    });

    const highSeverity = pains.filter(p => p.severity === 'high').length;

    if (recentPains.length >= 3 && highSeverity >= 2) return 0.9;
    if (recentPains.length >= 2 || highSeverity >= 1) return 0.7;
    if (pains.length >= 2) return 0.6;
    return 0.5;
  }
}

module.exports = { PersonPainAnalyzer };

