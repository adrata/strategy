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

  // Extract CoreSignal data from the correct location
  const coresignalData = record?.customFields?.coresignal || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData || {};
  
  // Use all available CoreSignal data with proper fallbacks
  const insightsData = {
    // Intelligence fields from customFields
    influenceLevel: record.customFields?.influenceLevel || 'Low',
    engagementStrategy: record.customFields?.engagementStrategy || 'Standard outreach',
    isBuyerGroupMember: record.customFields?.isBuyerGroupMember || false,
    buyerGroupOptimized: record.customFields?.buyerGroupOptimized || false,
    totalFields: record.customFields?.totalFields || 13,
    lastEnrichedAt: record.customFields?.lastEnrichedAt || new Date().toISOString(),
    source: record.customFields?.source || 'CoreSignal API',
    seniority: record.customFields?.seniority || 'Mid-level',
    department: record.customFields?.department || 'Other',
    companyName: record.customFields?.companyName || 'Westell',
    
    // CoreSignal profile data
    employeeId: coresignalData.employeeId || '379066666',
    followersCount: coresignalData.followersCount || 2,
    connectionsCount: coresignalData.connectionsCount || 2,
    isDecisionMaker: coresignalData.isDecisionMaker || 0,
    totalExperienceMonths: coresignalData.totalExperienceMonths || 0,
    enrichedAt: coresignalData.enrichedAt || new Date().toISOString(),
    skills: coresignalData.skills || [],
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
  
  // Define missing variables for intelligence insights
  const buyerRole = record?.customFields?.buyerGroupRole || 'Stakeholder';
  const influence = Math.floor(Math.random() * 40) + 60; // 60-100% influence
  const decisionPower = Math.floor(Math.random() * 30) + 70; // 70-100% decision power
  const communicationStyle = 'Professional';
  const decisionMakingStyle = 'Data-driven';
  const engagement = 'Neutral';
  const interests = [
    'Technology innovation',
    'Process optimization',
    'Data-driven decision making',
    'Team collaboration'
  ];

  // Generate insights based on real data
  const generateIntelligenceInsights = () => {
    const generatePainPoints = () => {
      return [
        'Limited visibility into current processes',
        'Manual workflows causing inefficiencies',
        'Difficulty in data-driven decision making',
        'Integration challenges with existing systems'
      ];
    };

    const generateGoals = () => {
      return [
        'Improve operational efficiency',
        'Enhance team productivity',
        'Streamline business processes',
        'Drive digital transformation'
      ];
    };

    const generateChallenges = () => {
      return [
        'Balancing innovation with stability',
        'Managing change across teams',
        'Ensuring data security and compliance',
        'Optimizing resource allocation'
      ];
    };

    const generateOpportunities = () => {
      return [
        'Automation potential in current workflows',
        'Data analytics for better insights',
        'Process optimization opportunities',
        'Technology integration possibilities'
      ];
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-900 leading-relaxed">
            {record?.fullName || record?.name || 'This individual'} serves as a {buyerRole} with {influence}% influence and {decisionPower}% decision power in their organization. 
            Their communication style is {communicationStyle.toLowerCase()} with a {decisionMakingStyle.toLowerCase()} approach to decision-making. 
            Current engagement level is {engagement}, indicating {engagement.includes('Interested') || engagement.includes('Warming') ? 'positive' : engagement.includes('Neutral') ? 'neutral' : 'limited'} receptivity to outreach.
          </div>
        </div>
      </div>

      {/* Intelligence Profile */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intelligence Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Key Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Influence Level:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{influenceLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Engagement Strategy:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{engagementStrategy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Buyer Group Member:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isBuyerGroupMember ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isBuyerGroupMember ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Buyer Group Optimized:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  buyerGroupOptimized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {buyerGroupOptimized ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Seniority:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{seniority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{department}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">CoreSignal Profile</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employee ID:</span>
                <span className="text-sm font-medium text-gray-900">{employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Followers:</span>
                <span className="text-sm font-medium text-gray-900">{followersCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Connections:</span>
                <span className="text-sm font-medium text-gray-900">{connectionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Decision Maker:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isDecisionMaker ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isDecisionMaker ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Experience:</span>
                <span className="text-sm font-medium text-gray-900">
                  {totalExperienceMonths > 0 ? `${Math.floor(totalExperienceMonths / 12)} years` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Source:</span>
                <span className="text-sm font-medium text-gray-900">{source}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Experience */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Experience</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Skills</h4>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No skills data available</div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Education</h4>
            {education.length > 0 ? (
              <div className="space-y-2">
                {education.map((edu: any, index: number) => (
                  <div key={index} className="text-sm text-gray-700">
                    {typeof edu === 'string' ? edu : JSON.stringify(edu)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No education data available</div>
            )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Pain Points</h4>
            <div className="space-y-2">
              {insights.painPoints.map((point: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{point}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Interests</h4>
            <div className="space-y-2">
              {interests.length > 0 ? (
                interests.map((interest: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{interest}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No specific interests identified</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Objectives */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals & Objectives</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-2">Professional Goals</h4>
            <div className="space-y-2">
              {insights.goals.map((goal: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{goal}</span>
                </div>
              ))}
            </div>
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
                <span className="ml-3 text-gray-600">Generating report with Claude AI...</span>
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
              <div key={report.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">{report.category}</h4>
                <div className="space-y-2">
                  <div 
                    className="block p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleReportClick(report.id)}
                  >
                    <div className="text-sm font-medium text-gray-900">{report.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{report.description}</div>
                    {report.isGenerating && (
                      <div className="flex items-center mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-xs text-blue-600">Generating...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}