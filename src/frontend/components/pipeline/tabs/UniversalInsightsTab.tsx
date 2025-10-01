import React from 'react';
import { useRouter } from 'next/navigation';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
// import { useDeepValueReports } from '../hooks/useDeepValueReports'; // Temporarily disabled

interface UniversalInsightsTabProps {
  recordType: string;
  record?: any;
}

export function UniversalInsightsTab({ recordType, record: recordProp }: UniversalInsightsTabProps) {
  const router = useRouter();
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Deep Value Reports functionality - Temporarily disabled
  // const { reports, isLoading: reportsLoading } = useDeepValueReports(record);
  
  // Handle report click with URL navigation - Temporarily disabled
  // const handleReportClick = (reportId: string) => {
  //   // Create workspace-specific public report URL format: /top/reports/reportId-personId
  //   const recordId = record?.id;
  //   const workspaceId = window.location.pathname.split('/')[1] || 'top'; // Extract workspace from URL
  //   const publicReportId = `${reportId}-${recordId}`;
  //   router.push(`/${workspaceId}/reports/${publicReportId}`);
  // };

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

  // Extract CoreSignal data from the correct location
  const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
  
  // Use AI-generated intelligence data (prioritize over fallbacks)
  const insightsData = {
    // AI-generated intelligence fields
    influenceLevel: record.customFields?.influenceLevel || '-',
    engagementStrategy: record.customFields?.engagementStrategy || '-',
    isBuyerGroupMember: record.customFields?.isBuyerGroupMember || false,
    seniority: record.customFields?.seniority || '-',
    influenceScore: record.customFields?.influenceScore || 0,
    decisionPower: record.customFields?.decisionPower || 0,
    primaryRole: record.customFields?.primaryRole || '-',
    engagementLevel: record.customFields?.engagementLevel || '-',
    communicationStyle: record.customFields?.communicationStyle || '-',
    decisionMaking: record.customFields?.decisionMaking || '-',
    preferredContact: record.customFields?.preferredContact || '-',
    responseTime: record.customFields?.responseTime || '-',
    painPoints: record.customFields?.painPoints || [],
    interests: record.customFields?.interests || [],
    goals: record.customFields?.goals || [],
    challenges: record.customFields?.challenges || [],
    opportunities: record.customFields?.opportunities || [],
    intelligenceSummary: record.customFields?.intelligenceSummary || '',
    
    // CoreSignal profile data
    department: coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || '-',
    companyName: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name || '-',
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
    seniority,
    influenceScore,
    decisionPower,
    primaryRole,
    engagementLevel,
    communicationStyle,
    decisionMaking,
    preferredContact,
    responseTime,
    painPoints,
    interests,
    goals,
    challenges,
    opportunities,
    intelligenceSummary,
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
  
  // Use AI-generated data (already extracted above)
  const buyerRole = primaryRole || 'Stakeholder';
  const influence = influenceScore || 70;
  const decisionPowerValue = decisionPower || 70;
  
  // Use AI-generated insights (prioritize over generated fallbacks)
  const insights = {
    painPoints: painPoints.length > 0 ? painPoints : [
      'Limited visibility into current processes',
      'Manual workflows causing inefficiencies',
      'Difficulty in data-driven decision making',
      'Integration challenges with existing systems'
    ],
    goals: goals.length > 0 ? goals : [
      'Improve operational efficiency',
      'Enhance team productivity',
      'Streamline business processes',
      'Drive digital transformation'
    ],
    challenges: challenges.length > 0 ? challenges : [
      'Balancing innovation with stability',
      'Managing change across teams',
      'Ensuring data security and compliance',
      'Optimizing resource allocation'
    ],
    opportunities: opportunities.length > 0 ? opportunities : [
      'Automation potential in current workflows',
      'Data analytics for better insights',
      'Process optimization opportunities',
      'Technology integration possibilities'
    ]
  };

  // Check if AI intelligence has been generated
  const hasAIIntelligence = intelligenceSummary && influenceLevel !== '-' && engagementStrategy !== '-';
  
  // Function to generate AI intelligence
  const generateAIIntelligence = async () => {
    try {
      const response = await fetch('/api/intelligence/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: record.id,
          recordType: recordType,
          workspaceId: record.workspaceId || 'top'
        })
      });

      if (response.ok) {
        // Reload the page to show updated intelligence
        window.location.reload();
      } else {
        console.error('Failed to generate intelligence');
      }
    } catch (error) {
      console.error('Error generating intelligence:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Intelligence Summary</h3>
          <div className="flex items-center space-x-2">
            {hasAIIntelligence ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">AI Generated</span>
              </>
            ) : (
              <button
                onClick={generateAIIntelligence}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate AI Intelligence</span>
              </button>
            )}
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-900 leading-relaxed">
            {intelligenceSummary || (
              <>
                <span className="font-semibold text-gray-900">{record?.fullName || record?.name || 'This individual'}</span> serves as a <span className="font-semibold text-blue-700">{primaryRole}</span> with <span className="font-semibold text-green-600">{influenceScore >= 80 ? 'high' : influenceScore >= 60 ? 'moderate' : 'limited'}</span> influence and <span className="font-semibold text-purple-600">{decisionPowerValue >= 80 ? 'strong' : decisionPowerValue >= 60 ? 'moderate' : 'limited'}</span> decision-making authority in their organization. 
                They prefer <span className="font-medium text-gray-800">{communicationStyle.toLowerCase()}</span> communication and make decisions based on <span className="font-medium text-gray-800">{decisionMaking.toLowerCase()}</span> analysis. 
                Current engagement level is <span className="font-medium text-gray-800">{engagementLevel || 'Medium'}</span>, indicating <span className="font-medium text-gray-800">{(engagementLevel || 'Medium').includes('High') ? 'positive' : (engagementLevel || 'Medium').includes('Medium') ? 'moderate' : 'limited'}</span> receptivity to outreach.
              </>
            )}
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

      {/* Deep Value Reports - Temporarily Hidden */}
      {/* 
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Deep Value Reports</h3>
            <p className="text-sm text-gray-600 mt-1">AI-powered insights tailored to this contact</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">AI Generated</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                  <div className="text-gray-500">Generating intelligent reports...</div>
                </div>
              </div>
            ) : reports.length > 0 ? (
              reports.map((report, index) => {
                return (
                  <div
                    key={report.id}
                    className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
                    onClick={() => handleReportClick(report.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                          {report.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          {report.description}
                        </p>
                        <div className="flex items-center justify-end">
                          <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {report.isGenerating && (
                      <div className="mt-4 flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        <span className="text-xs text-gray-600 font-medium">Generating...</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <div className="text-gray-500 italic">No deep value reports available</div>
                <div className="text-sm text-gray-400 mt-2">Reports will appear here once generated</div>
              </div>
            )}
        </div>
      </div>
      */}
    </div>
  );
}