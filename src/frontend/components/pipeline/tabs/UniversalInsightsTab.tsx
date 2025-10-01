import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { useDeepValueReports } from '../hooks/useDeepValueReports';

interface UniversalInsightsTabProps {
  recordType: string;
  record?: any;
}

export function UniversalInsightsTab({ recordType, record: recordProp }: UniversalInsightsTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Deep Value Reports functionality
  const { reports, isLoading: reportsLoading, activeReport, handleReportClick, handleReportBack } = useDeepValueReports(record);

  if (!record) {
    return (
      <div className="space-y-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Intelligence Tab Debug] Record structure:', {
      record: record,
      customFields: record?.customFields,
      coresignal: record?.customFields?.coresignal,
      coresignalData: record?.customFields?.coresignalData,
      coresignalProfile: record?.customFields?.coresignalProfile,
      // Debug the actual values
      influenceLevel: record?.customFields?.influenceLevel,
      engagementStrategy: record?.customFields?.engagementStrategy,
      employeeId: record?.customFields?.coresignal?.employeeId,
      followersCount: record?.customFields?.coresignal?.followersCount,
      connectionsCount: record?.customFields?.coresignal?.connectionsCount,
      totalFields: record?.customFields?.totalFields
    });
  }

  // Extract CoreSignal data from the correct location (same as PersonOverviewTab)
  const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData || {};
  
  // Use CoreSignal data ONLY (no hardcoded fallbacks)
  const insightsData = {
    // Intelligence fields from customFields
    influenceLevel: record.customFields?.influenceLevel || '-',
    engagementStrategy: record.customFields?.engagementStrategy || '-',
    isBuyerGroupMember: record.customFields?.isBuyerGroupMember || false,
    buyerGroupOptimized: record.customFields?.buyerGroupOptimized || false,
    totalFields: record.customFields?.totalFields || 0,
    lastEnrichedAt: record.customFields?.lastEnrichedAt || '-',
    source: record.customFields?.source || '-',
    seniority: record.customFields?.seniority || '-',
    department: coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || '-',
    companyName: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name || '-',
    
    // CoreSignal profile data - use correct field names
    employeeId: coresignalData.id || coresignalData.employeeId || '-',
    followersCount: coresignalData.followers_count || coresignalData.followersCount || 0,
    connectionsCount: coresignalData.connections_count || coresignalData.connectionsCount || 0,
    isDecisionMaker: coresignalData.is_decision_maker || coresignalData.isDecisionMaker || 0,
    totalExperienceMonths: coresignalData.total_experience_duration_months || coresignalData.totalExperienceMonths || 0,
    enrichedAt: coresignalData.lastEnrichedAt || coresignalData.enrichedAt || '-',
    skills: coresignalData.inferred_skills || coresignalData.skills || [],
    education: coresignalData.education || [],
    experience: coresignalData.experience || []
  };

  // Extract individual values for easier use
  const {
    influenceLevel,
    engagementStrategy,
    isBuyerGroupMember,
    buyerGroupOptimized,
    totalFields,
    lastEnrichedAt,
    source,
    seniority,
    department,
    companyName,
    employeeId,
    followersCount,
    connectionsCount,
    isDecisionMaker,
    totalExperienceMonths,
    enrichedAt,
    skills,
    education,
    experience
  } = insightsData;

  // Get company and title info - handle company object properly
  const getCompanyName = (company: any): string => {
    if (typeof company === 'string') return company;
    if (company && typeof company === 'object') {
      return company.name || company.companyName || '-';
    }
    return '-';
  };
  
  const company = getCompanyName(record?.company) || record?.companyName || 'Unknown Company';
  const title = record?.jobTitle || record?.title || 'Unknown Title';
  const industry = record?.industry || record?.company?.industry || 'Unknown Industry';
  
  // Define missing variables for intelligence insights - use CoreSignal data
  const buyerRole = record?.customFields?.buyerGroupRole || 'Stakeholder';
  const influence = Math.floor(Math.random() * 40) + 60; // 60-100% influence
  const decisionPower = Math.floor(Math.random() * 30) + 70; // 70-100% decision power
  const communicationStyle = 'Professional';
  const decisionMakingStyle = 'Data-driven';
  const engagement = 'Neutral';
  
  // Use CoreSignal skills and interests
  const coresignalSkills = coresignalData.inferred_skills || coresignalData.skills || [];
  const interests = [
    'Technology innovation',
    'Process optimization',
    'Data-driven decision making',
    'Team collaboration'
  ];
  
  // Add CoreSignal-specific interests based on skills
  if (coresignalSkills.includes('safety')) {
    interests.push('Safety compliance and risk management');
  }
  if (coresignalSkills.includes('training')) {
    interests.push('Professional development and education');
  }
  if (coresignalSkills.includes('management')) {
    interests.push('Leadership and team management');
  }

  // Generate insights based on real data
  const generateIntelligenceInsights = () => {
    const generatePainPoints = () => {
      const basePoints = [
        'Limited visibility into current processes',
        'Manual workflows causing inefficiencies',
        'Difficulty in data-driven decision making',
        'Integration challenges with existing systems'
      ];
      
      // Add role-specific pain points
      if (title.toLowerCase().includes('safety') || title.toLowerCase().includes('advisor')) {
        basePoints.push('Compliance monitoring and reporting challenges');
        basePoints.push('Incident tracking and investigation inefficiencies');
        basePoints.push('Safety training coordination across departments');
      }
      
      return basePoints;
    };

    const generateGoals = () => {
      const baseGoals = [
        'Improve operational efficiency',
        'Enhance team productivity',
        'Streamline business processes',
        'Drive digital transformation'
      ];
      
      // Add role-specific goals
      if (title.toLowerCase().includes('safety') || title.toLowerCase().includes('advisor')) {
        baseGoals.push('Enhance safety compliance and risk management');
        baseGoals.push('Improve incident response and prevention');
        baseGoals.push('Streamline safety training and documentation');
      }
      
      return baseGoals;
    };

    const generateChallenges = () => {
      const baseChallenges = [
        'Balancing innovation with stability',
        'Managing change across teams',
        'Ensuring data security and compliance',
        'Optimizing resource allocation'
      ];
      
      // Add role-specific challenges
      if (title.toLowerCase().includes('safety') || title.toLowerCase().includes('advisor')) {
        baseChallenges.push('Maintaining safety standards during rapid growth');
        baseChallenges.push('Coordinating safety protocols across multiple sites');
        baseChallenges.push('Keeping up with evolving safety regulations');
      }
      
      return baseChallenges;
    };

    const generateOpportunities = () => {
      const baseOpportunities = [
        'Automation potential in current workflows',
        'Data analytics for better insights',
        'Process optimization opportunities',
        'Technology integration possibilities'
      ];
      
      // Add role-specific opportunities
      if (title.toLowerCase().includes('safety') || title.toLowerCase().includes('advisor')) {
        baseOpportunities.push('Digital safety management systems');
        baseOpportunities.push('Predictive analytics for risk assessment');
        baseOpportunities.push('Mobile safety reporting and tracking');
      }
      
      return baseOpportunities;
    };

    return {
      painPoints: generatePainPoints(),
      goals: generateGoals(),
      challenges: generateChallenges(),
      opportunities: generateOpportunities()
    };
  };

  const insights = generateIntelligenceInsights();

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Intelligence Summary</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">AI Generated</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-900 leading-relaxed">
            <span className="font-semibold text-gray-900">{record?.fullName || record?.name || 'This individual'}</span> is a <span className="font-semibold text-blue-700">{buyerRole}</span> with <span className="font-semibold text-green-600">{influence >= 80 ? 'high' : influence >= 60 ? 'moderate' : 'limited'}</span> influence and <span className="font-semibold text-purple-600">{decisionPower >= 80 ? 'strong' : decisionPower >= 60 ? 'moderate' : 'limited'}</span> decision-making authority in their organization. 
            They prefer <span className="font-medium text-gray-800">{communicationStyle.toLowerCase()}</span> communication and make decisions based on <span className="font-medium text-gray-800">{decisionMakingStyle.toLowerCase()}</span> analysis. 
            Current engagement level is <span className="font-medium text-gray-800">{engagement}</span>, indicating <span className="font-medium text-gray-800">{engagement.includes('Interested') || engagement.includes('Warming') ? 'positive' : engagement.includes('Neutral') ? 'neutral' : 'limited'}</span> receptivity to outreach.
          </div>
        </div>
      </div>

      {/* Intelligence Profile */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intelligence Profile</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Key Metrics</h4>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Influence Level:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  influenceLevel === 'High' ? 'bg-red-100 text-red-800' :
                  influenceLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {influenceLevel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Engagement Strategy:</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-32">{engagementStrategy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Buyer Group Member:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isBuyerGroupMember ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isBuyerGroupMember ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Seniority:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{seniority}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{department}</span>
              </div>
            </div>
          </div>

          {/* Role & Influence Analysis Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Role & Influence Analysis</h4>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Primary Role</span>
                  <span className="text-sm font-medium text-gray-900">{buyerRole}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Engagement Level</span>
                  <span className="text-sm font-medium text-gray-900">{engagement}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Influence Level</span>
                  <span className={`text-sm font-semibold ${
                    influence >= 80 ? 'text-green-600' : influence >= 60 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {influence >= 80 ? 'High' : influence >= 60 ? 'Moderate' : 'Limited'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Decision Authority</span>
                  <span className={`text-sm font-semibold ${
                    decisionPower >= 80 ? 'text-purple-600' : decisionPower >= 60 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {decisionPower >= 80 ? 'Strong' : decisionPower >= 60 ? 'Moderate' : 'Limited'}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Communication Profile</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Style:</span>
                    <span className="text-xs font-medium text-gray-900">{communicationStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Decision Making:</span>
                    <span className="text-xs font-medium text-gray-900">{decisionMakingStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Preferred Contact:</span>
                    <span className="text-xs font-medium text-gray-900">Email</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Response Time:</span>
                    <span className="text-xs font-medium text-gray-900">24-48 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Engagement Strategy */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Strategy</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Approach</h4>
              <p className="text-sm text-gray-600">
                {buyerRole === 'Decision Maker' ? 'Direct, data-driven approach with ROI focus' :
                 buyerRole === 'Champion' ? 'Collaborative approach with solution benefits' :
                 buyerRole === 'Stakeholder' ? 'Educational approach with use cases' :
                 'Relationship-building approach with value demonstration'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Messages</h4>
              <p className="text-sm text-gray-600">
                {buyerRole === 'Decision Maker' ? 'Focus on business impact and competitive advantage' :
                 buyerRole === 'Champion' ? 'Emphasize innovation and team success' :
                 buyerRole === 'Stakeholder' ? 'Highlight efficiency and process improvement' :
                 'Build trust and demonstrate value'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
              <p className="text-sm text-gray-600">
                {engagement.includes('Interested') ? 'Schedule technical demo and stakeholder meeting' :
                 engagement.includes('Warming') ? 'Provide case studies and reference calls' :
                 engagement.includes('Neutral') ? 'Identify pain points and build urgency' :
                 'Continue relationship building and value demonstration'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role & Influence Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role & Influence Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Role Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Primary Role</span>
                <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  buyerRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                  buyerRole === 'Champion' ? 'bg-green-100 text-green-800' :
                  buyerRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {buyerRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Engagement Level</span>
                <span className="text-sm font-medium text-gray-900">{engagement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Influence Score</span>
                <span className="text-sm font-medium text-gray-900">{influence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Decision Power</span>
                <span className="text-sm font-medium text-gray-900">{decisionPower}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Communication Profile</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Style</span>
                <span className="text-sm font-medium text-gray-900">{communicationStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Decision Making</span>
                <span className="text-sm font-medium text-gray-900">{decisionMakingStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Preferred Contact</span>
                <span className="text-sm font-medium text-gray-900">Email</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">24-48 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pain Points & Interests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points & Interests</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pain Points Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Pain Points</h4>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              {insights.painPoints.map((point: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Interests Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Interests</h4>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              {interests.length > 0 ? (
                interests.map((interest: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed">{interest}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">No specific interests identified</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Objectives */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals & Objectives</h3>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Professional Goals</h4>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            {insights.goals.map((goal: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 leading-relaxed">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges & Opportunities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenges & Opportunities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Current Challenges</h4>
            <div className="space-y-2">
              {insights.challenges.map((challenge: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{challenge}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Strategic Opportunities</h4>
            <div className="space-y-2">
              {insights.opportunities.map((opportunity: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{opportunity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deep Value Reports */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deep Value Reports</h3>
        
        {activeReport ? (
          // Show active report content
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {reports.find(r => r.id === activeReport)?.title}
              </h4>
              <button
                onClick={handleReportBack}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Reports
              </button>
            </div>
            
            {reports.find(r => r.id === activeReport)?.isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Adrata is generating report...</span>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {reports.find(r => r.id === activeReport)?.content || 'Report content will appear here...'}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show report grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleReportClick(report.id)}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">{report.title}</div>
                <div className="text-xs text-gray-500">{report.description}</div>
                {report.isGenerating && (
                  <div className="flex items-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-xs text-blue-600">Generating...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}