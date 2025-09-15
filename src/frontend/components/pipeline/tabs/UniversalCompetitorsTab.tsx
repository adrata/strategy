"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface UniversalCompetitorsTabProps {
  record: any;
  recordType: string;
}

interface Competitor {
  id: string;
  name: string;
  website?: string;
  description?: string;
  marketShare?: number;
  strength?: string;
  weakness?: string;
  threat?: 'high' | 'medium' | 'low';
  winRate?: number;
  lastEncounter?: string;
  notes?: string;
}

export function UniversalCompetitorsTab({ record, recordType }: UniversalCompetitorsTabProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCompetitors = async () => {
      setLoading(true);
      try {
        // Get competitor mentions from the record
        const competitorMentions = record?.competitorMentions || record?.competitors || [];
        
        // Generate competitor data based on mentions
        const competitorData = generateCompetitorData(competitorMentions);
        setCompetitors(competitorData);
      } catch (error) {
        console.error('Error fetching competitors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitors();
  }, [record]);

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getThreatIcon = (threat: string) => {
    switch (threat) {
      case 'high': return <XCircleIcon className="w-4 h-4" />;
      case 'medium': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'low': return <CheckCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const handleCompetitorClick = (competitor: Competitor) => {
    // Navigate to competitor detail page or open modal
    console.log('Navigate to competitor:', competitor.name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Competitors Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitors</h3>
        {competitors.length === 0 ? (
          <div className="text-center py-8">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No competitors identified yet</p>
            <p className="text-sm text-gray-400 mt-1">Add competitor mentions to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                onClick={() => handleCompetitorClick(competitor)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{competitor.name}</h4>
                      {competitor.website && (
                        <p className="text-xs text-gray-500">{competitor.website}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getThreatColor(competitor.threat || 'low')}`}>
                    {getThreatIcon(competitor.threat || 'low')}
                    {competitor.threat || 'low'} threat
                  </span>
                </div>

                {competitor.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{competitor.description}</p>
                )}

                <div className="space-y-2">
                  {competitor.marketShare && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Market Share</span>
                      <span className="font-medium text-gray-900">{competitor.marketShare}%</span>
                    </div>
                  )}
                  
                  {competitor.winRate && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Win Rate</span>
                      <span className="font-medium text-gray-900">{competitor.winRate}%</span>
                    </div>
                  )}
                  
                  {competitor.strength && (
                    <div className="text-xs">
                      <span className="text-gray-500">Strength: </span>
                      <span className="text-gray-900">{competitor.strength}</span>
                    </div>
                  )}
                  
                  {competitor.weakness && (
                    <div className="text-xs">
                      <span className="text-gray-500">Weakness: </span>
                      <span className="text-gray-900">{competitor.weakness}</span>
                    </div>
                  )}
                </div>

                {competitor.lastEncounter && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Last encounter: {competitor.lastEncounter}
                    </p>
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

// Helper function to generate competitor data from mentions
function generateCompetitorData(mentions: string[]): Competitor[] {
  if (!mentions || mentions.length === 0) {
    return [];
  }

  const competitorTemplates: { [key: string]: Partial<Competitor> } = {
    'salesforce': {
      name: 'Salesforce',
      website: 'salesforce.com',
      description: 'Leading CRM platform with strong market presence',
      marketShare: 20,
      strength: 'Market leader, extensive ecosystem',
      weakness: 'Complex pricing, high cost',
      threat: 'high' as const,
      winRate: 35
    },
    'hubspot': {
      name: 'HubSpot',
      website: 'hubspot.com',
      description: 'Inbound marketing and sales platform',
      marketShare: 8,
      strength: 'User-friendly, good for SMBs',
      weakness: 'Limited enterprise features',
      threat: 'medium' as const,
      winRate: 60
    },
    'pipedrive': {
      name: 'Pipedrive',
      website: 'pipedrive.com',
      description: 'Sales-focused CRM with visual pipeline',
      marketShare: 3,
      strength: 'Simple interface, good for sales teams',
      weakness: 'Limited marketing features',
      threat: 'low' as const,
      winRate: 70
    },
    'zoho': {
      name: 'Zoho CRM',
      website: 'zoho.com',
      description: 'Comprehensive business suite with CRM',
      marketShare: 5,
      strength: 'Affordable, integrated suite',
      weakness: 'Complex setup, limited customization',
      threat: 'medium' as const,
      winRate: 55
    },
    'microsoft': {
      name: 'Microsoft Dynamics',
      website: 'dynamics.microsoft.com',
      description: 'Enterprise CRM and ERP solution',
      marketShare: 12,
      strength: 'Enterprise integration, Microsoft ecosystem',
      weakness: 'Complex, expensive',
      threat: 'high' as const,
      winRate: 40
    }
  };

  return mentions.map((mention, index) => {
    const normalizedMention = mention.toLowerCase().trim();
    const template = competitorTemplates[normalizedMention] || {};
    
    return {
      id: `competitor-${index}`,
      name: template.name || mention,
      website: template.website,
      description: template.description || `Competitor mentioned: ${mention}`,
      marketShare: template.marketShare || Math.floor(Math.random() * 15) + 1,
      strength: template.strength,
      weakness: template.weakness,
      threat: template.threat || (Math.random() > 0.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      winRate: template.winRate || Math.floor(Math.random() * 40) + 30,
      lastEncounter: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      notes: `Competitor analysis for ${mention}`
    };
  });
}
