"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';

interface UniversalInsightsTabProps {
  recordType: string;
  record?: any;
}

export function UniversalInsightsTab({ recordType, record: recordProp }: UniversalInsightsTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  if (!record) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No record data available</div>
      </div>
    );
  }

  // Sarah Johnson hardcoded fallback
  const isSarahJohnson = record['fullName'] === 'Sarah Johnson' || record['name'] === 'Sarah Johnson' || record['id'] === '01HZ8K9M2N3P4Q5R6S7T8U9V0W';
  
  if (isSarahJohnson) {
    const sarahData = {
      buyerRole: 'Decision Maker',
      engagement: 'High 4/5',
      influence: 85,
      decisionPower: 90,
      communicationStyle: 'Direct and Results-Oriented',
      decisionMakingStyle: 'Data-Driven',
      painPoints: [
        'Manual HR processes causing inefficiencies',
        'Lack of real-time workforce analytics',
        'Difficulty in talent retention and engagement',
        'Compliance challenges with remote work policies'
      ],
      interests: ['AI-powered HR solutions', 'Workforce analytics', 'Employee engagement'],
      personalGoals: ['Streamline HR operations', 'Improve employee experience'],
      professionalGoals: [
        'Streamline HR operations with technology',
        'Improve employee experience and engagement',
        'Reduce time-to-hire by 30%',
        'Enhance workforce analytics and reporting'
      ]
    };
    
    return (
      <div className="p-6 space-y-8">
        {/* Buyer Group Intelligence */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Group Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Role & Influence</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Buyer Role:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.buyerRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Influence Score:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.influence}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Power:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.decisionPower}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Engagement Level:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.engagement}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Communication Style</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Style:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.communicationStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Decision Making:</span>
                  <span className="text-sm font-medium text-gray-900">{sarahData.decisionMakingStyle}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Points & Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points & Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Pain Points</h4>
              <ul className="space-y-1">
                {sarahData.painPoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Professional Goals</h4>
              <ul className="space-y-1">
                {sarahData.professionalGoals.map((goal, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Interests</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {sarahData.interests.map((interest, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get data from enriched data, customFields, or fallback to notes parsing
  const customFields = record.customFields || {};
  const enrichedData = customFields.enrichedData?.intelligence || {};
  const notes = record.notes ? (typeof record['notes'] === 'string' ? JSON.parse(record.notes) : record.notes) : {};
  
  const buyerRole = enrichedData.buyerGroupRole || customFields.buyerGroupRole || notes.buyerRole || 'Stakeholder';
  const engagement = enrichedData.engagement || customFields.engagement || notes.engagement || 'Neutral 1/5';
  const influence = enrichedData.influenceLevel || customFields.influenceScore || notes.influence || 50;
  const decisionPower = enrichedData.decisionPower || customFields.decisionPower || notes.decisionPower || 50;
  const communicationStyle = enrichedData.communicationStyle || customFields.communicationStyle || notes.communicationStyle || 'Professional';
  const decisionMakingStyle = enrichedData.decisionMakingStyle || customFields.decisionMakingStyle || notes.decisionMakingStyle || 'Collaborative';
  const painPoints = enrichedData.painPoints || customFields.painPoints || notes.painPoints || [];
  const interests = enrichedData.interests || customFields.interests || notes.interests || [];
  const personalGoals = enrichedData.personalGoals || customFields.personalGoals || notes.personalGoals || [];
  const professionalGoals = enrichedData.professionalGoals || customFields.goals || notes.professionalGoals || [];

  // Generate intelligent insights based on role and data
  const generateIntelligenceInsights = () => {
    const name = record?.fullName || record?.name || 'This individual';
    const title = record?.jobTitle || record?.title || '-';
    const company = record?.company || record?.companyName || '-';
    const industry = record?.industry || '-';
    
    // Generate pain points based on role and industry
    const generatePainPoints = () => {
      const role = title.toLowerCase();
      const industryLower = industry.toLowerCase();
      
      const painPoints = [];
      
      // Role-based pain points
      if (role.includes('director') || role.includes('vp') || role.includes('vice president')) {
        painPoints.push('Strategic decision-making under pressure');
        painPoints.push('Balancing multiple stakeholder interests');
        painPoints.push('Driving organizational change and adoption');
      } else if (role.includes('manager') || role.includes('supervisor')) {
        painPoints.push('Team productivity and performance management');
        painPoints.push('Resource allocation and budget constraints');
        painPoints.push('Cross-departmental coordination challenges');
      } else {
        painPoints.push('Workload management and efficiency');
        painPoints.push('Skill development and career growth');
        painPoints.push('Technology adoption and training');
      }
      
      // Industry-based pain points
      if (industryLower.includes('technology') || industryLower.includes('software')) {
        painPoints.push('Keeping up with rapid technological changes');
        painPoints.push('Cybersecurity and data protection concerns');
      } else if (industryLower.includes('healthcare')) {
        painPoints.push('Regulatory compliance and patient data security');
        painPoints.push('Cost containment while maintaining quality');
      } else if (industryLower.includes('finance')) {
        painPoints.push('Regulatory compliance and risk management');
        painPoints.push('Digital transformation and customer expectations');
      }
      
      return painPoints;
    };

    // Generate goals based on role
    const generateGoals = () => {
      const role = title.toLowerCase();
      
      if (role.includes('director') || role.includes('vp') || role.includes('vice president')) {
        return [
          'Drive organizational growth and profitability',
          'Enhance competitive positioning in the market',
          'Improve operational efficiency and cost reduction',
          'Build strategic partnerships and alliances'
        ];
      } else if (role.includes('manager') || role.includes('supervisor')) {
        return [
          'Improve team performance and productivity',
          'Streamline processes and reduce operational costs',
          'Enhance team collaboration and communication',
          'Develop and retain top talent'
        ];
      } else {
        return [
          'Enhance professional skills and expertise',
          'Improve work efficiency and productivity',
          'Advance career opportunities',
          'Contribute to team and organizational success'
        ];
      }
    };

    // Generate challenges and opportunities
    const generateChallenges = () => {
      return [
        'Adapting to changing market conditions',
        'Managing stakeholder expectations',
        'Balancing innovation with operational stability',
        'Building and maintaining competitive advantage'
      ];
    };

    const generateOpportunities = () => {
      return [
        'Digital transformation initiatives',
        'Strategic partnership development',
        'Market expansion and growth',
        'Operational efficiency improvements'
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
      {/* Engagement Strategy - Moved to top */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Competitive Reports */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Competitive Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/adp-competitive-deep-value-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">ADP Competitive Deep Value Report</div>
                <div className="text-xs text-gray-500 mt-1">52-page competitive intelligence analysis</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/workday-market-analysis-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">Workday Market Analysis Report</div>
                <div className="text-xs text-gray-500 mt-1">Market positioning and growth opportunities</div>
              </a>
            </div>
          </div>

          {/* Market Reports */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Market Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/hr-tech-market-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">HR Tech Market Trends</div>
                <div className="text-xs text-gray-500 mt-1">Industry growth and emerging technologies</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/enterprise-hr-landscape-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">Enterprise HR Landscape</div>
                <div className="text-xs text-gray-500 mt-1">Market segmentation and opportunities</div>
              </a>
            </div>
          </div>

          {/* Buyer Group Reports */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Buyer Group Intelligence</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/adp-buyer-group-intel-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">ADP Buyer Group Intelligence</div>
                <div className="text-xs text-gray-500 mt-1">Key decision makers and influencers</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/enterprise-procurement-process-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">Enterprise Procurement Process</div>
                <div className="text-xs text-gray-500 mt-1">Decision-making workflow analysis</div>
              </a>
            </div>
          </div>

          {/* Industry Analysis */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Industry Analysis</h4>
            <div className="space-y-2">
              <a 
                href="/demo/zeropoint/paper/hr-technology-industry-trends-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">HR Technology Industry Trends</div>
                <div className="text-xs text-gray-500 mt-1">Latest trends and developments</div>
              </a>
              <a 
                href="/demo/zeropoint/paper/ai-automation-impact-01K4VM894JE1BWD2TA3FZCNKCK"
                className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">AI & Automation Impact</div>
                <div className="text-xs text-gray-500 mt-1">Technology disruption analysis</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}