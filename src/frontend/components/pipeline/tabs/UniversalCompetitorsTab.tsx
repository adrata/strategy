"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon
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

  // No helper functions - using only real CoreSignal data

  useEffect(() => {
    const fetchCompetitors = async () => {
      setLoading(true);
      try {
        // Get competitor data from multiple sources
        // Primary: record.competitors field
        // Fallback: record.customFields.competitors
        const primaryCompetitors = record?.competitors || [];
        const fallbackCompetitors = record?.customFields?.competitors || [];
        
        // Use primary source if available, otherwise use fallback
        const coreSignalCompetitors = primaryCompetitors.length > 0 ? primaryCompetitors : fallbackCompetitors;
        
        console.log('🔍 [COMPETITORS TAB] Debug info:', {
          recordId: record?.id,
          recordName: record?.name,
          primaryCompetitors,
          fallbackCompetitors,
          finalCompetitors: coreSignalCompetitors
        });
        
        if (coreSignalCompetitors.length > 0) {
          // Use ONLY real competitor data - no fake descriptions or threat levels
          const competitorData = coreSignalCompetitors.map((competitorName: string, index: number) => ({
            id: `competitor-${index}`,
            name: competitorName, // Use original competitor name
            description: null, // No fake descriptions
            threat: null // No fake threat levels
          }));
          
          setCompetitors(competitorData);
        } else {
          // No competitors if no data found
          setCompetitors([]);
        }
      } catch (error) {
        console.error('Error fetching competitors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitors();
  }, [record]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">{competitors.length} Competitors</h3>
      </div>

      {/* Simple Competitors List */}
      {competitors.length === 0 ? (
        <div className="text-center py-8">
          <BuildingOfficeIcon className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">No competitors identified</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {competitors.map((competitor) => (
            <div
              key={competitor.id}
              className="bg-background border border-border rounded-lg p-4 text-center"
            >
              <h4 className="font-medium text-foreground">{competitor.name.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')}</h4>
            </div>
          ))}
        </div>
      )}
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
