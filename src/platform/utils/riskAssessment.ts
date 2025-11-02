/**
 * Risk Assessment Utility
 * Analyzes career patterns to determine if a person is at risk of leaving
 */

export interface CareerData {
  currentRoleStartDate?: string;
  previousRoles?: Array<{
    title: string;
    startDate: string;
    endDate: string;
    duration: number; // in months
  }>;
  totalCareerDuration?: number; // in months
  averageRoleDuration?: number; // in months
}

export interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 0-100
  factors: string[];
  description: string;
  recommendation: string;
}

/**
 * Calculate risk assessment based on career patterns
 */
export function calculateRiskAssessment(careerData: CareerData): RiskAssessment {
  const factors: string[] = [];
  let riskScore = 0;

  // Factor 1: Current role duration vs average
  if (careerData.currentRoleStartDate && careerData.averageRoleDuration) {
    const currentRoleDuration = getMonthsSinceDate(careerData.currentRoleStartDate);
    const averageDuration = careerData.averageRoleDuration;
    
    if (currentRoleDuration > averageDuration * 1.5) {
      factors.push('Exceeded average role duration by 50%+');
      riskScore += 30;
    } else if (currentRoleDuration > averageDuration * 1.2) {
      factors.push('Exceeded average role duration by 20%+');
      riskScore += 20;
    }
  }

  // Factor 2: Short tenure pattern
  if (careerData.previousRoles && careerData.previousRoles.length >= 2) {
    const shortTenures = careerData.previousRoles.filter(role => role.duration < 12).length;
    const totalRoles = careerData.previousRoles.length;
    const shortTenureRatio = shortTenures / totalRoles;
    
    if (shortTenureRatio > 0.6) {
      factors.push('History of short tenure (60%+ roles < 12 months)');
      riskScore += 25;
    } else if (shortTenureRatio > 0.4) {
      factors.push('Frequent job changes (40%+ roles < 12 months)');
      riskScore += 15;
    }
  }

  // Factor 3: Recent job changes
  if (careerData.previousRoles && careerData.previousRoles.length > 0) {
    const recentRole = careerData.previousRoles[0];
    const monthsSinceLastChange = getMonthsSinceDate(recentRole.endDate);
    
    if (monthsSinceLastChange < 6) {
      factors.push('Recent job change (< 6 months ago)');
      riskScore += 20;
    } else if (monthsSinceLastChange < 12) {
      factors.push('Recent job change (< 12 months ago)');
      riskScore += 10;
    }
  }

  // Factor 4: Career progression pattern
  if (careerData.previousRoles && careerData.previousRoles.length >= 3) {
    const isDownwardTrend = checkDownwardTrend(careerData.previousRoles);
    if (isDownwardTrend) {
      factors.push('Downward career trend detected');
      riskScore += 15;
    }
  }

  // Factor 5: Very short current tenure
  if (careerData.currentRoleStartDate) {
    const currentTenure = getMonthsSinceDate(careerData.currentRoleStartDate);
    if (currentTenure < 3) {
      factors.push('Very new to current role (< 3 months)');
      riskScore += 10;
    }
  }

  // Determine risk level
  let riskLevel: RiskAssessment['riskLevel'];
  let description: string;
  let recommendation: string;

  if (riskScore >= 70) {
    riskLevel = 'CRITICAL';
    description = 'High risk of departure - multiple concerning factors';
    recommendation = 'Immediate attention required - consider retention strategies';
  } else if (riskScore >= 50) {
    riskLevel = 'HIGH';
    description = 'Elevated risk of departure - monitor closely';
    recommendation = 'Proactive engagement and retention focus needed';
  } else if (riskScore >= 30) {
    riskLevel = 'MEDIUM';
    description = 'Moderate risk - some concerning patterns';
    recommendation = 'Regular check-ins and engagement monitoring';
  } else {
    riskLevel = 'LOW';
    description = 'Stable tenure pattern - low departure risk';
    recommendation = 'Continue current engagement approach';
  }

  return {
    riskLevel,
    riskScore: Math.min(riskScore, 100),
    factors,
    description,
    recommendation
  };
}

/**
 * Get months since a given date
 */
function getMonthsSinceDate(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + 
                      (now.getMonth() - date.getMonth());
  return Math.max(0, diffInMonths);
}

/**
 * Check if there's a downward trend in career progression
 */
function checkDownwardTrend(roles: Array<{ title: string; startDate: string; endDate: string; duration: number }>): boolean {
  if (roles.length < 3) return false;
  
  // Simple heuristic: check if recent roles have shorter durations
  const recentRoles = roles.slice(0, 2);
  const olderRoles = roles.slice(2, 4);
  
  const recentAvgDuration = recentRoles.reduce((sum, role) => sum + role.duration, 0) / recentRoles.length;
  const olderAvgDuration = olderRoles.reduce((sum, role) => sum + role.duration, 0) / olderRoles.length;
  
  return recentAvgDuration < olderAvgDuration * 0.7; // 30% decrease in tenure
}

/**
 * Get risk pill styling based on risk level
 */
export function getRiskPillStyles(riskLevel: RiskAssessment['riskLevel']) {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-hover text-gray-800 border-border';
  }
}

/**
 * Generate AI description for risk assessment
 */
export function generateRiskDescription(assessment: RiskAssessment): string {
  const { riskLevel, factors, description } = assessment;
  
  let aiDescription = `${description}. `;
  
  if (factors.length > 0) {
    aiDescription += `Key factors: ${factors.slice(0, 2).join(', ')}. `;
  }
  
  switch (riskLevel) {
    case 'CRITICAL':
      aiDescription += 'This person may be actively looking for new opportunities. Immediate retention focus recommended.';
      break;
    case 'HIGH':
      aiDescription += 'Monitor engagement closely and consider proactive retention discussions.';
      break;
    case 'MEDIUM':
      aiDescription += 'Regular check-ins and career development discussions may help with retention.';
      break;
    case 'LOW':
      aiDescription += 'Stable tenure pattern suggests good retention prospects.';
      break;
  }
  
  return aiDescription;
}
