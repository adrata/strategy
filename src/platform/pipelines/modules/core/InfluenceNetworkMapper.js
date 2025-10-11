/**
 * INFLUENCE NETWORK MAPPER
 * 
 * Maps a person's influence network:
 * - Reporting structure
 * - Cross-functional relationships
 * - External influence (conferences, advisory roles)
 */

class InfluenceNetworkMapper {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Map influence network
   */
  async mapNetwork(personData, buyerGroup = null) {
    console.log(`🔗 [INFLUENCE NETWORK] Mapping network for: ${personData.name}`);

    return {
      reportsTo: personData.reportsTo || 'Unknown',
      directReports: personData.directReports || 0,
      keyRelationships: this.identifyKeyRelationships(personData, buyerGroup),
      externalInfluence: this.analyzeExternalInfluence(personData),
      networkScore: this.calculateNetworkScore(personData),
      networkQuality: this.assessNetworkQuality(personData)
    };
  }

  /**
   * Identify key relationships
   */
  identifyKeyRelationships(personData, buyerGroup) {
    const relationships = [];

    // From buyer group
    if (buyerGroup && buyerGroup.members) {
      const decisionMakers = buyerGroup.members
        .filter(m => m.buyerGroupRole === 'decision_maker' && m.name !== personData.name)
        .map(m => `${m.title} - ${m.name}`);
      
      relationships.push(...decisionMakers);
    }

    // From person data
    if (personData.worksWith) {
      relationships.push(...personData.worksWith);
    }

    return relationships;
  }

  /**
   * Analyze external influence
   */
  analyzeExternalInfluence(personData) {
    return {
      conferenceSpeaker: personData.conferenceSpeaker || false,
      thoughtLeader: (personData.publishedArticles || 0) > 3,
      industryAdvisor: personData.industryAdvisor || false,
      boardMember: personData.boardMember || false,
      socialMediaFollowing: personData.linkedInFollowers || 0
    };
  }

  /**
   * Calculate network score
   */
  calculateNetworkScore(personData) {
    let score = 0;

    const reports = personData.directReports || 0;
    if (reports > 50) score += 30;
    else if (reports > 20) score += 20;
    else if (reports > 10) score += 10;

    if (personData.conferenceSpeaker) score += 20;
    if (personData.industryAdvisor) score += 20;
    if ((personData.publishedArticles || 0) > 3) score += 15;
    if ((personData.linkedInFollowers || 0) > 10000) score += 15;

    return Math.min(100, score);
  }

  /**
   * Assess network quality
   */
  assessNetworkQuality(personData) {
    const score = this.calculateNetworkScore(personData);
    
    if (score >= 70) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }
}

module.exports = { InfluenceNetworkMapper };

