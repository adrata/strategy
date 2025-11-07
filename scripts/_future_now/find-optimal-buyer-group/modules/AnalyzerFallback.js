/**
 * Analyzer Fallback Module
 * 
 * Provides rule-based buyer group analysis when AI is unavailable
 * Uses department and management level breakdowns
 */

class AnalyzerFallback {
  /**
   * Analyze buyer group quality using rules
   * @param {object} company - Company data
   * @param {Array} previewEmployees - Sampled employees
   * @param {object} departmentCounts - Department breakdown
   * @param {object} managementLevelCounts - Management level breakdown
   * @returns {object} Buyer group quality analysis
   */
  analyze(company, previewEmployees, departmentCounts, managementLevelCounts) {
    let painSignalScore = 50;
    let innovationScore = 50;
    let buyerExperienceScore = 50;
    let buyerGroupStructureScore = 50;
    
    // Pain signals: Look for management gaps
    const vpCount = managementLevelCounts['VP-Level'] || 0;
    const directorCount = managementLevelCounts['Director-Level'] || 0;
    if (vpCount === 0 && previewEmployees.length > 10) {
      painSignalScore += 20;
    }
    
    // Innovation: High LinkedIn engagement
    const avgConnections = previewEmployees.reduce((sum, e) => sum + (e.connections_count || 0), 0) / previewEmployees.length;
    if (avgConnections > 1000) {
      innovationScore += 20;
    }
    
    // Buyer experience: Senior leaders present
    if (vpCount > 0 || directorCount > 2) {
      buyerExperienceScore += 20;
    }
    
    // Structure: Balanced departments
    const salesCount = departmentCounts['Sales and Business Development'] || 0;
    const opsCount = departmentCounts['Operations'] || 0;
    if (salesCount > 0 && opsCount > 0) {
      buyerGroupStructureScore += 20;
    }
    
    const overallQuality = Math.round(
      painSignalScore * 0.25 +
      innovationScore * 0.25 +
      buyerExperienceScore * 0.25 +
      buyerGroupStructureScore * 0.25
    );
    
    return {
      pain_signal_score: Math.min(100, painSignalScore),
      pain_indicators: vpCount === 0 ? ['Missing VP-level leadership'] : [],
      innovation_score: Math.min(100, innovationScore),
      innovation_indicators: avgConnections > 1000 ? ['High LinkedIn engagement'] : [],
      buyer_experience_score: Math.min(100, buyerExperienceScore),
      experience_indicators: vpCount > 0 ? ['Senior leadership present'] : [],
      buyer_group_structure_score: Math.min(100, buyerGroupStructureScore),
      structure_assessment: `VP: ${vpCount}, Directors: ${directorCount}, Sales: ${salesCount}, Ops: ${opsCount}`,
      overall_buyer_group_quality: overallQuality,
      key_strengths: ['Rule-based analysis'],
      recommended_personas: ['VP Sales', 'Director Operations'],
      outreach_priority: overallQuality > 70 ? 'high' : overallQuality > 50 ? 'medium' : 'low',
      employeesAnalyzed: previewEmployees.length
    };
  }
}

module.exports = { AnalyzerFallback };

