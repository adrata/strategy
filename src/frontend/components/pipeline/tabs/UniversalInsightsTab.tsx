import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';
import { StrategySkeleton } from '@/frontend/components/strategy/StrategySkeleton';
import { StrategySummaryCard } from '@/frontend/components/strategy/StrategySummaryCard';
// import { useDeepValueReports } from '../hooks/useDeepValueReports'; // Temporarily disabled

interface UniversalInsightsTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalInsightsTab({ recordType, record: recordProp, onSave }: UniversalInsightsTabProps) {
  const router = useRouter();
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Strategy state
  const [strategyData, setStrategyData] = useState<any>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Check if this is a company record (strategy API only works for person records)
  const isCompanyRecord = record?.isCompanyLead || record?.recordType === 'company';

  // Load existing strategy data on component mount (only for person records)
  useEffect(() => {
    if (record?.id && !isCompanyRecord) {
      loadStrategyData();
    }
  }, [record?.id, isCompanyRecord]);

  // Auto-generate strategy if no data exists (only for person records)
  useEffect(() => {
    if (record?.id && !isCompanyRecord && !strategyData && !isGeneratingStrategy) {
      // Check if strategy fields exist in customFields
      const hasStrategy = record.customFields?.strategySituation && 
                         record.customFields?.strategyComplication && 
                         record.customFields?.strategyFutureState;
      
      if (!hasStrategy) {
        handleGenerateStrategy();
      }
    }
  }, [record?.id, isCompanyRecord, strategyData, isGeneratingStrategy]);

  const loadStrategyData = async () => {
    try {
      const response = await fetch(`/api/v1/strategy/generate?personId=${record.id}`);
      const data = await response.json();
      
      if (data.success && data.data.hasStrategy) {
        setStrategyData(data.data);
      } else {
        // If no strategy exists, check if we have data in customFields
        const customFields = record.customFields || {};
        if (customFields.strategySituation && customFields.strategyComplication && customFields.strategyFutureState) {
          setStrategyData({
            situation: customFields.strategySituation,
            complication: customFields.strategyComplication,
            futureState: customFields.strategyFutureState,
            strategySummary: customFields.strategySummary || '',
            archetype: customFields.buyerGroupArchetype ? {
              id: customFields.buyerGroupArchetype,
              name: customFields.archetypeName || '',
              role: customFields.archetypeRole || ''
            } : null
          });
        }
      }
    } catch (error) {
      console.error('Failed to load strategy data:', error);
    }
  };

  const handleGenerateStrategy = async () => {
    if (!record?.id) return;
    
    setIsGeneratingStrategy(true);
    setStrategyError(null);
    
    try {
      const response = await fetch('/api/v1/strategy/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: record.id,
          recordType: recordType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStrategyData(data.data);
        handleSuccess('Strategy summary generated successfully!');
      } else {
        setStrategyError(data.message || 'Failed to generate strategy summary');
      }
    } catch (error) {
      console.error('Strategy generation failed:', error);
      setStrategyError('Failed to generate strategy summary. Please try again.');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleStrategySave = async (field: string, content: string) => {
    try {
      const response = await fetch('/api/v1/strategy/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: record.id,
          field,
          content
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setStrategyData(prev => ({
          ...prev,
          [field]: content
        }));
        handleSuccess(`${field} updated successfully!`);
      } else {
        throw new Error(data.message || 'Failed to update strategy');
      }
    } catch (error) {
      console.error('Strategy update failed:', error);
      throw error;
    }
  };
  
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
        <div className="text-center text-[var(--muted)]">No record data available</div>
      </div>
    );
  }

  // Memoize data extraction to prevent expensive recalculations on every render
  const { coresignalData, isDemoWorkspace, insightsData } = useMemo(() => {
    // Extract CoreSignal data from the correct location
    const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
    
    // Check if we're in a demo workspace
    const isDemoWorkspace = record?.workspaceId === 'demo' ||
                           window.location.pathname.includes('/demo/');
    
    // Use AI-generated intelligence data with proper null handling
    const insightsData = {
      // AI-generated intelligence fields
      influenceLevel: record.customFields?.influenceLevel || null,
      engagementStrategy: record.customFields?.engagementStrategy || null,
      isBuyerGroupMember: record.customFields?.isBuyerGroupMember || false,
      seniority: record.customFields?.seniority || null,
      influenceScore: record.customFields?.influenceScore || 0,
      decisionPower: record.customFields?.decisionPower || 0,
      primaryRole: record.customFields?.primaryRole || record?.jobTitle || record?.title || null,
      engagementLevel: record.customFields?.engagementLevel || null,
      communicationStyle: record.customFields?.communicationStyle || null,
      decisionMaking: record.customFields?.decisionMaking || null,
      preferredContact: record.customFields?.preferredContact || null,
      responseTime: record.customFields?.responseTime || null,
      painPoints: record.customFields?.painPoints || [],
      interests: record.customFields?.interests || [],
      goals: record.customFields?.goals || [],
      challenges: record.customFields?.challenges || [],
      opportunities: record.customFields?.opportunities || [],
      intelligenceSummary: record.customFields?.intelligenceSummary || '',
      
      // CoreSignal profile data
      department: coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || null,
      companyName: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name || null,
      employeeId: coresignalData.id || coresignalData.employeeId || null,
      followersCount: coresignalData.followers_count || coresignalData.followersCount || 0,
      connectionsCount: coresignalData.connections_count || coresignalData.connectionsCount || 0,
      isDecisionMaker: coresignalData.is_decision_maker || coresignalData.isDecisionMaker || 0,
      totalExperienceMonths: coresignalData.total_experience_duration_months || coresignalData.totalExperienceMonths || 0,
      enrichedAt: coresignalData.lastEnrichedAt || coresignalData.enrichedAt || null,
      skills: coresignalData.inferred_skills || coresignalData.skills || [],
      education: coresignalData.education || [],
      experience: coresignalData.experience || []
    };

    return { coresignalData, isDemoWorkspace, insightsData };
  }, [record]);

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

  // AI intelligence is now always assumed to be available

  return (
    <div className="p-6">
      <div className="space-y-6">
      {/* Strategy Summary Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Strategy Summary</h3>
        </div>
        
        {/* Company Record Message */}
        {isCompanyRecord && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Strategy Not Available for Company Records</h4>
                <p className="text-sm text-blue-600 mt-1">
                  Strategy summaries are generated for individual people, not companies. 
                  To see strategy insights, navigate to specific people within this company.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Strategy Summary Content */}
        {isGeneratingStrategy ? (
          <StrategySkeleton />
        ) : (
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            {/* Three Column Layout with Intelligence Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StrategySummaryCard
                title="Situation"
                content={strategyData?.situation || record?.customFields?.strategySituation || ''}
                color="green"
              />
              
              <StrategySummaryCard
                title="Complication"
                content={strategyData?.complication || record?.customFields?.strategyComplication || ''}
                color="orange"
              />
              
              <StrategySummaryCard
                title="Future State"
                content={strategyData?.futureState || record?.customFields?.strategyFutureState || ''}
                color="blue"
              />
            </div>
            
            {/* Show error if generation failed */}
            {strategyError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-600 mb-2">
                  Strategy generation failed: {strategyError}
                </div>
                <button
                  onClick={handleGenerateStrategy}
                  className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 text-sm font-medium"
                >
                  Retry Generation
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Intelligence Profile */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Intelligence Profile</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics Card */}
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-[var(--foreground)]">Key Metrics</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Influence Level:</span>
                <InlineEditField
                  value={influenceLevel}
                  field="influenceLevel"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter influence level"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm text-[var(--muted)] mb-2">Engagement Strategy:</span>
                <div className="text-sm text-[var(--foreground)]">
                  {engagementStrategy && engagementStrategy.length > 80 ? (
                    <div className="space-y-2">
                      {engagementStrategy.split(/[.!?]+/).filter(sentence => sentence.trim().length > 10).map((strategy, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 leading-relaxed">{strategy.trim()}{strategy.trim().endsWith('.') ? '' : '.'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-[var(--foreground)]">{engagementStrategy}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--muted)]">Buyer Group Member:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isBuyerGroupMember 
                    ? (recordType === 'speedrun' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')
                    : 'bg-[var(--hover)] text-gray-800'
                }`}>
                  {isBuyerGroupMember ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Seniority:</span>
                <InlineEditField
                  value={seniority}
                  field="seniority"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter seniority level"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm text-[var(--muted)] w-24">Department:</span>
                <InlineEditField
                  value={department}
                  field="department"
                  onSave={onSave}
                  recordId={record.id}
                  recordType={recordType}
                  onSuccess={handleSuccess}
                  placeholder="Enter department"
                  className="text-sm font-medium text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Role & Influence Analysis Card */}
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-[var(--foreground)]">Role & Influence Analysis</h4>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[var(--muted)]">Primary Role</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{buyerRole}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[var(--muted)]">Engagement Level</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{engagementLevel || 'Medium'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[var(--muted)]">Influence Level</span>
                  <span className={`text-sm font-semibold ${
                    influence >= 80 ? 'text-green-600' : influence >= 60 ? 'text-yellow-600' : 'text-[var(--muted)]'
                  }`}>
                    {influence >= 80 ? 'High' : influence >= 60 ? 'Moderate' : 'Limited'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[var(--muted)]">Decision Authority</span>
                  <span className={`text-sm font-semibold ${
                    decisionPower >= 80 ? 'text-purple-600' : decisionPower >= 60 ? 'text-blue-600' : 'text-[var(--muted)]'
                  }`}>
                    {decisionPower >= 80 ? 'Strong' : decisionPower >= 60 ? 'Moderate' : 'Limited'}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h5 className="text-sm font-medium text-[var(--foreground)] mb-2">Communication Profile</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--muted)]">Style:</span>
                    <span className="text-xs font-medium text-[var(--foreground)]">{communicationStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--muted)]">Decision Making:</span>
                    <span className="text-xs font-medium text-[var(--foreground)]">{decisionMaking || 'Data-driven'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--muted)]">Preferred Contact:</span>
                    <span className="text-xs font-medium text-[var(--foreground)]">Email</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--muted)]">Response Time:</span>
                    <span className="text-xs font-medium text-[var(--foreground)]">24-48 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Engagement Strategy */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Engagement Strategy</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Approach</h4>
              <p className="text-sm text-[var(--muted)]">
                {buyerRole === 'Decision Maker' ? 'Direct, data-driven approach with ROI focus' :
                 buyerRole === 'Champion' ? 'Collaborative approach with solution benefits' :
                 buyerRole === 'Stakeholder' ? 'Educational approach with use cases' :
                 'Relationship-building approach with value demonstration'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Key Messages</h4>
              <p className="text-sm text-[var(--muted)]">
                {buyerRole === 'Decision Maker' ? 'Focus on business impact and competitive advantage' :
                 buyerRole === 'Champion' ? 'Emphasize innovation and team success' :
                 buyerRole === 'Stakeholder' ? 'Highlight efficiency and process improvement' :
                 'Build trust and demonstrate value'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Next Steps</h4>
              <p className="text-sm text-[var(--muted)]">
                {(engagementLevel || 'Medium').includes('High') ? 'Schedule technical demo and stakeholder meeting' :
                 (engagementLevel || 'Medium').includes('Medium') ? 'Provide case studies and reference calls' :
                 (engagementLevel || 'Medium').includes('Low') ? 'Identify pain points and build urgency' :
                 'Continue relationship building and value demonstration'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role & Influence Analysis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Role & Influence Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Role Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Primary Role</span>
                <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  buyerRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                  buyerRole === 'Champion' ? 'bg-green-100 text-green-800' :
                  buyerRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                  'bg-[var(--hover)] text-gray-800'
                }`}>
                  {buyerRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Engagement Level</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{engagementLevel || 'Medium'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Influence Score</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{influence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Decision Power</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{decisionPower}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Communication Profile</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Style</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{communicationStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Decision Making</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{decisionMaking || 'Data-driven'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Preferred Contact</span>
                <span className="text-sm font-medium text-[var(--foreground)]">Email</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Response Time</span>
                <span className="text-sm font-medium text-[var(--foreground)]">24-48 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pain Points & Interests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Pain Points & Interests</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pain Points Card */}
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-[var(--foreground)]">Pain Points</h4>
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
          <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-[var(--foreground)]">Interests</h4>
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
                <div className="text-sm text-[var(--muted)] italic">No specific interests identified</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goals & Objectives */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Goals & Objectives</h3>
        <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-[var(--foreground)]">Professional Goals</h4>
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
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Challenges & Opportunities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Current Challenges</h4>
            <div className="space-y-3">
              {insights.challenges.map((challenge: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700 leading-relaxed">{challenge}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Strategic Opportunities</h4>
            <div className="space-y-3">
              {insights.opportunities.map((opportunity: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700 leading-relaxed">{opportunity}</span>
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
            <h3 className="text-xl font-bold text-[var(--foreground)]">Deep Value Reports</h3>
            <p className="text-sm text-[var(--muted)] mt-1">AI-powered insights tailored to this contact</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-[var(--muted)]">Adrata Generated</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                  <div className="text-[var(--muted)]">Generating intelligent reports...</div>
                </div>
              </div>
            ) : reports.length > 0 ? (
              reports.map((report, index) => {
                return (
                  <div
                    key={report.id}
                    className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)] cursor-pointer hover:shadow-md hover:border-[var(--border)] transition-all duration-200 group"
                    onClick={() => handleReportClick(report.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-[var(--hover)] rounded-lg flex items-center justify-center group-hover:bg-[var(--loading-bg)] transition-colors">
                        <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--foreground)] mb-2 group-hover:text-gray-700 transition-colors">
                          {report.title}
                        </h4>
                        <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">
                          {report.description}
                        </p>
                        <div className="flex items-center justify-end">
                          <div className="text-[var(--muted)] group-hover:text-[var(--muted)] transition-colors">
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
                        <span className="text-xs text-[var(--muted)] font-medium">Generating...</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-[var(--muted)] text-4xl mb-4">📊</div>
                <div className="text-[var(--muted)] italic">No deep value reports available</div>
                <div className="text-sm text-[var(--muted)] mt-2">Reports will appear here once generated</div>
              </div>
            )}
        </div>
      </div>
      */}

      </div>
    </div>
  );
}