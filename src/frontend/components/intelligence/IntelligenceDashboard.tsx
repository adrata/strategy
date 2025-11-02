/**
 * IntelligenceDashboard
 * 
 * Comprehensive intelligence dashboard that displays:
 * - Person intelligence insights
 * - Company intelligence insights
 * - Buyer group analysis
 * - Real-time news and updates
 */

import React, { useState, useEffect } from 'react';
import { PersonIntelligenceResult } from '@/platform/services/PersonIntelligenceService';
import { CompanyIntelligenceResult } from '@/platform/services/CompanyIntelligenceService';

interface IntelligenceDashboardProps {
  recordId: string;
  recordType: 'person' | 'company';
  onClose?: () => void;
}

export const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({
  recordId,
  recordType,
  onClose
}) => {
  const [personIntelligence, setPersonIntelligence] = useState<PersonIntelligenceResult | null>(null);
  const [companyIntelligence, setCompanyIntelligence] = useState<CompanyIntelligenceResult | null>(null);
  const [buyerGroupAnalysis, setBuyerGroupAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'buyer' | 'engagement' | 'insights'>('overview');

  useEffect(() => {
    loadIntelligenceData();
  }, [recordId, recordType]);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (recordType === 'person') {
        // Load person intelligence
        const response = await fetch(`/api/intelligence/person/${recordId}/comprehensive`);
        const data = await response.json();
        
        if (data.success) {
          setPersonIntelligence(data.data);
        } else {
          throw new Error(data.error || 'Failed to load person intelligence');
        }
      } else {
        // Load company intelligence
        const response = await fetch(`/api/intelligence/company/${recordId}/comprehensive`);
        const data = await response.json();
        
        if (data.success) {
          setCompanyIntelligence(data.data);
        } else {
          throw new Error(data.error || 'Failed to load company intelligence');
        }

        // Load buyer group analysis
        const buyerGroupResponse = await fetch(`/api/intelligence/buyer-group/${recordId}`);
        const buyerGroupData = await buyerGroupResponse.json();
        
        if (buyerGroupData.success) {
          setBuyerGroupAnalysis(buyerGroupData.data);
        }
      }
    } catch (err) {
      console.error('Error loading intelligence data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const refreshIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = recordType === 'person' 
        ? `/api/intelligence/person/${recordId}/comprehensive`
        : `/api/intelligence/company/${recordId}/comprehensive`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh: true })
      });

      const data = await response.json();
      
      if (data.success) {
        if (recordType === 'person') {
          setPersonIntelligence(data.data);
        } else {
          setCompanyIntelligence(data.data);
        }
      } else {
        throw new Error(data.error || 'Failed to refresh intelligence');
      }
    } catch (err) {
      console.error('Error refreshing intelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-overlay-bg bg-opacity-[var(--overlay-opacity)] flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Loading Intelligence</h3>
            <p className="text-muted">Analyzing data and generating insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-overlay-bg bg-opacity-[var(--overlay-opacity)] flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 border border-border">
          <div className="text-center">
            <div className="text-error text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Intelligence</h3>
            <p className="text-muted mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={loadIntelligenceData}
                className="px-4 py-2 bg-button-background text-button-text rounded-lg hover:bg-button-hover transition-colors"
              >
                Retry
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-panel-background text-foreground rounded-lg hover:bg-hover transition-colors border border-border"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-overlay-bg bg-opacity-[var(--overlay-opacity)] flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {recordType === 'person' ? 'Person Intelligence' : 'Company Intelligence'}
            </h2>
            <p className="text-muted">
              AI-powered insights and recommendations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshIntelligence}
              className="px-4 py-2 bg-button-background text-button-text rounded-lg hover:bg-button-hover flex items-center space-x-2 transition-colors"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-panel-background text-foreground rounded-lg hover:bg-hover transition-colors border border-border"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'buyer', label: 'Buyer Intelligence', icon: '🎯' },
              { id: 'engagement', label: 'Engagement Strategy', icon: '🤝' },
              { id: 'insights', label: 'Insights & Actions', icon: '💡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-foreground hover:border-border'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <OverviewTab 
              personIntelligence={personIntelligence}
              companyIntelligence={companyIntelligence}
              buyerGroupAnalysis={buyerGroupAnalysis}
              recordType={recordType}
            />
          )}
          
          {activeTab === 'buyer' && (
            <BuyerIntelligenceTab 
              personIntelligence={personIntelligence}
              companyIntelligence={companyIntelligence}
              buyerGroupAnalysis={buyerGroupAnalysis}
              recordType={recordType}
            />
          )}
          
          {activeTab === 'engagement' && (
            <EngagementStrategyTab 
              personIntelligence={personIntelligence}
              companyIntelligence={companyIntelligence}
              recordType={recordType}
            />
          )}
          
          {activeTab === 'insights' && (
            <InsightsActionsTab 
              personIntelligence={personIntelligence}
              companyIntelligence={companyIntelligence}
              buyerGroupAnalysis={buyerGroupAnalysis}
              recordType={recordType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  personIntelligence: PersonIntelligenceResult | null;
  companyIntelligence: CompanyIntelligenceResult | null;
  buyerGroupAnalysis: any;
  recordType: 'person' | 'company';
}> = ({ personIntelligence, companyIntelligence, buyerGroupAnalysis, recordType }) => {
  const intelligence = recordType === 'person' ? personIntelligence : companyIntelligence;

  if (!intelligence) {
    return <div className="text-center text-muted">No intelligence data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-info-bg rounded-lg p-6 border border-info-border">
          <div className="flex items-center">
            <div className="text-info text-2xl mr-3">🎯</div>
            <div>
              <p className="text-sm font-medium text-info">Decision Power</p>
              <p className="text-2xl font-bold text-info-text">
                {recordType === 'person' ? personIntelligence?.buyerProfile.decisionPower : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-success-bg rounded-lg p-6 border border-success-border">
          <div className="flex items-center">
            <div className="text-success text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm font-medium text-success">Confidence</p>
              <p className="text-2xl font-bold text-success-text">
                {Math.round(intelligence.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-panel-background rounded-lg p-6 border border-border">
          <div className="flex items-center">
            <div className="text-muted text-2xl mr-3">🔄</div>
            <div>
              <p className="text-sm font-medium text-muted">Last Updated</p>
              <p className="text-sm font-bold text-foreground">
                {new Date(intelligence.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-panel-background rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Sources</h3>
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-success-bg text-success-text rounded-full text-sm border border-success-border">
            Database
          </span>
          <span className="px-3 py-1 bg-info-bg text-info-text rounded-full text-sm border border-info-border">
            Perplexity AI
          </span>
          <span className="px-3 py-1 bg-panel-background text-foreground rounded-full text-sm border border-border">
            Claude AI
          </span>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recordType === 'person' && personIntelligence && (
          <>
            <div className="bg-background border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-3">Risk Assessment</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Job Change Risk:</span>
                  <span className={`text-sm font-medium ${
                    personIntelligence.buyerProfile.riskAssessment.jobChangeRisk === 'High' ? 'text-error' :
                    personIntelligence.buyerProfile.riskAssessment.jobChangeRisk === 'Medium' ? 'text-warning' : 'text-success'
                  }`}>
                    {personIntelligence.buyerProfile.riskAssessment.jobChangeRisk}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Buying Stage:</span>
                  <span className="text-sm font-medium text-foreground">
                    {personIntelligence.buyerProfile.riskAssessment.buyingCycleStage}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-3">Best Channels</h4>
              <div className="flex flex-wrap gap-2">
                {personIntelligence.engagementStrategy.bestChannels.map((channel, index) => (
                  <span key={index} className="px-2 py-1 bg-info-bg text-info-text rounded text-sm border border-info-border">
                    {channel}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {recordType === 'company' && companyIntelligence && (
          <>
            <div className="bg-background border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-3">Market Position</h4>
              <p className="text-sm text-muted mb-2">
                {companyIntelligence.marketPosition.competitivePosition}
              </p>
              <p className="text-sm text-muted">
                Growth: {companyIntelligence.marketPosition.growthTrajectory}
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-3">Urgency Score</h4>
              <div className="flex items-center">
                <div className="flex-1 bg-panel-background rounded-full h-2 mr-3">
                  <div 
                    className="bg-error h-2 rounded-full" 
                    style={{ width: `${companyIntelligence.timing.urgency * 10}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {companyIntelligence.timing.urgency}/10
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Buyer Intelligence Tab Component
const BuyerIntelligenceTab: React.FC<{
  personIntelligence: PersonIntelligenceResult | null;
  companyIntelligence: CompanyIntelligenceResult | null;
  buyerGroupAnalysis: any;
  recordType: 'person' | 'company';
}> = ({ personIntelligence, companyIntelligence, buyerGroupAnalysis, recordType }) => {
  if (recordType === 'person' && personIntelligence) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Decision Power</h4>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${personIntelligence.buyerProfile.decisionPower * 10}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {personIntelligence.buyerProfile.decisionPower}/10
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Influence Level</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                personIntelligence.buyerProfile.influenceLevel === 'High' ? 'bg-red-100 text-red-800' :
                personIntelligence.buyerProfile.influenceLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {personIntelligence.buyerProfile.influenceLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="font-medium text-gray-700">Job Change Risk</h4>
              <p className={`text-sm font-medium ${
                personIntelligence.buyerProfile.riskAssessment.jobChangeRisk === 'High' ? 'text-red-600' :
                personIntelligence.buyerProfile.riskAssessment.jobChangeRisk === 'Medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {personIntelligence.buyerProfile.riskAssessment.jobChangeRisk}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🛒</div>
              <h4 className="font-medium text-gray-700">Buying Stage</h4>
              <p className="text-sm font-medium text-gray-900">
                {personIntelligence.buyerProfile.riskAssessment.buyingCycleStage}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⚔️</div>
              <h4 className="font-medium text-gray-700">Competition Risk</h4>
              <p className={`text-sm font-medium ${
                personIntelligence.buyerProfile.riskAssessment.competitionRisk === 'High' ? 'text-red-600' :
                personIntelligence.buyerProfile.riskAssessment.competitionRisk === 'Medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {personIntelligence.buyerProfile.riskAssessment.competitionRisk}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (recordType === 'company' && buyerGroupAnalysis) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{buyerGroupAnalysis.totalPeople}</div>
              <div className="text-sm text-gray-600">Total People</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{buyerGroupAnalysis.buyerGroupMembers}</div>
              <div className="text-sm text-gray-600">Buyer Group</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{buyerGroupAnalysis.decisionMakers}</div>
              <div className="text-sm text-gray-600">Decision Makers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{buyerGroupAnalysis.champions}</div>
              <div className="text-sm text-gray-600">Champions</div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Members</h3>
          <div className="space-y-3">
            {buyerGroupAnalysis.members.map((member: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-600">{member.title} • {member.department}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.role === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                    member.role === 'Champion' ? 'bg-green-100 text-green-800' :
                    member.role === 'Influencer' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-center text-gray-500">No buyer intelligence data available</div>;
};

// Engagement Strategy Tab Component
const EngagementStrategyTab: React.FC<{
  personIntelligence: PersonIntelligenceResult | null;
  companyIntelligence: CompanyIntelligenceResult | null;
  recordType: 'person' | 'company';
}> = ({ personIntelligence, companyIntelligence, recordType }) => {
  const intelligence = recordType === 'person' ? personIntelligence : companyIntelligence;

  if (!intelligence) {
    return <div className="text-center text-gray-500">No engagement strategy data available</div>;
  }

  if (recordType === 'person' && personIntelligence) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Best Channels</h4>
              <div className="flex flex-wrap gap-2">
                {personIntelligence.engagementStrategy.bestChannels.map((channel, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {channel}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Optimal Timing</h4>
              <p className="text-sm text-gray-600">{personIntelligence.engagementStrategy.timingRecommendation}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Messaging</h3>
          <p className="text-gray-700 mb-4">{personIntelligence.engagementStrategy.messagingAngle}</p>
          <h4 className="font-medium text-gray-700 mb-2">Relationship Approach</h4>
          <p className="text-gray-600">{personIntelligence.engagementStrategy.relationshipApproach}</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Value Proposition</h3>
          <p className="text-gray-700">{personIntelligence.valueProposition}</p>
        </div>
      </div>
    );
  }

  if (recordType === 'company' && companyIntelligence) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Best Entry Point</h4>
              <p className="text-sm text-gray-600">{companyIntelligence.accountStrategy.entryPoint}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Engagement Approach</h4>
              <p className="text-sm text-gray-600">{companyIntelligence.accountStrategy.engagementPlan.approach}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timing & Priority</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Urgency Score</h4>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${companyIntelligence.timing.urgency * 10}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {companyIntelligence.timing.urgency}/10
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Best Engagement Time</h4>
              <p className="text-sm text-gray-600">{companyIntelligence.timing.bestEngagementTime}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Decision Timeline</h4>
              <p className="text-sm text-gray-600">{companyIntelligence.timing.decisionTimeline}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-center text-gray-500">No engagement strategy data available</div>;
};

// Insights & Actions Tab Component
const InsightsActionsTab: React.FC<{
  personIntelligence: PersonIntelligenceResult | null;
  companyIntelligence: CompanyIntelligenceResult | null;
  buyerGroupAnalysis: any;
  recordType: 'person' | 'company';
}> = ({ personIntelligence, companyIntelligence, buyerGroupAnalysis, recordType }) => {
  if (recordType === 'person' && personIntelligence) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Actions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Immediate (Next 3 Days)</h4>
              <ul className="space-y-1">
                {personIntelligence.nextActions.immediate.map((action, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Short-term (Next 2 Weeks)</h4>
              <ul className="space-y-1">
                {personIntelligence.nextActions.shortTerm.map((action, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Long-term (Next Quarter)</h4>
              <ul className="space-y-1">
                {personIntelligence.nextActions.longTerm.map((action, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points</h3>
          <div className="space-y-2">
            {personIntelligence.painPoints.map((pain, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                {pain}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Trajectory</h3>
          <p className="text-gray-700">{personIntelligence.careerTrajectory}</p>
        </div>
      </div>
    );
  }

  if (recordType === 'company' && companyIntelligence) {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buying Signals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Hiring Indicators</h4>
              <div className="space-y-1">
                {companyIntelligence.buyingSignals.hiring.keyRoles.map((role, index) => (
                  <div key={index} className="text-sm text-gray-600">• {role}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Technology Changes</h4>
              <div className="space-y-1">
                {companyIntelligence.buyingSignals.technologyChanges.newTechnologies.map((tech, index) => (
                  <div key={index} className="text-sm text-gray-600">• {tech}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Indicators</h3>
          <div className="space-y-2">
            {companyIntelligence.buyingSignals.painIndicators.identifiedPains.map((pain, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                {pain}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Opportunities</h3>
          <div className="space-y-2">
            {companyIntelligence.marketPosition.opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                {opportunity}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-center text-gray-500">No insights and actions data available</div>;
};
