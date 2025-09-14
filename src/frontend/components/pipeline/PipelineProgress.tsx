"use client";

import React from 'react';

interface PipelineProgressProps {
  record: any;
  recordType: string;
  className?: string;
}

interface PipelineStage {
  id: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'generation',
    label: 'Generation',
    description: 'Lead generated',
    color: '#1E40AF',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200'
  },
  {
    id: 'engagement',
    label: 'Engagement',
    description: 'Lead engaged',
    color: '#10B981',
    bgColor: 'bg-emerald-600',
    textColor: 'text-white',
    borderColor: 'border-emerald-600'
  },
  {
    id: 'qualification',
    label: 'Qualification',
    description: 'Sales qualified',
    color: '#F59E0B',
    bgColor: 'bg-amber-600',
    textColor: 'text-white',
    borderColor: 'border-amber-600'
  },
  {
    id: 'opportunity',
    label: 'Opportunity',
    description: 'Deal in progress',
    color: '#8B5CF6',
    bgColor: 'bg-violet-600',
    textColor: 'text-white',
    borderColor: 'border-violet-600'
  },
  {
    id: 'proposal',
    label: 'Proposal',
    description: 'Proposal sent',
    color: '#DC2626',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    borderColor: 'border-red-600'
  },
  {
    id: 'negotiation',
    label: 'Negotiation',
    description: 'In negotiation',
    color: '#EA580C',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    borderColor: 'border-orange-600'
  },
  {
    id: 'client',
    label: 'Client',
    description: 'Deal closed',
    color: '#059669',
    bgColor: 'bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-600'
  }
];

export function PipelineProgress({ record, recordType, className = '' }: PipelineProgressProps) {
  // Determine current stage based on record type and status
  const getCurrentStage = (): string => {
    if (!record) return 'generation';

    // Check if it's a client
    const isClient = record.isClient || 
                    record['clientStatus'] === 'active' || 
                    recordType === 'clients' ||
                    record.status?.toLowerCase() === 'client';

    // Check if it's an opportunity (has deal value, stage, or is in opportunities table)
    const hasOpportunity = recordType === 'opportunities' ||
                          record.stage || 
                          record.amount || 
                          record.dealValue || 
                          record.value || 
                          record.revenue ||
                          record.status?.toLowerCase() === 'opportunity';

    // Check if it's sales qualified (prospects table or salesQualified flag)
    const isSalesQualified = recordType === 'prospects' ||
                            record['salesQualified'] === true ||
                            record.status?.toLowerCase() === 'qualified' ||
                            record.status?.toLowerCase() === 'prospect';

    // Check if it's engaged (has engagement indicators)
    const isEngaged = record['engagementLevel'] && 
                     ['medium', 'high'].includes(record.engagementLevel.toLowerCase()) ||
                     record.lastContactDate ||
                     record.touchPointsCount > 0 ||
                     record.responseRate > 0 ||
                     record.status?.toLowerCase() === 'contacted' ||
                     record.status?.toLowerCase() === 'engaged';

    // Check if it's just generated (new leads with no engagement)
    const isGenerated = recordType === 'leads' &&
                       (!record.lastContactDate || record['touchPointsCount'] === 0) &&
                       (!record.engagementLevel || record.engagementLevel.toLowerCase() === 'low') &&
                       record.status?.toLowerCase() === 'new';

    if (isClient) return 'client';
    if (hasOpportunity) return 'opportunity';
    if (isSalesQualified) return 'qualification';
    if (isEngaged) return 'engagement';
    if (isGenerated) return 'generation';
    
    // Default fallback based on record type
    if (recordType === 'prospects') return 'qualification';
    if (recordType === 'opportunities') return 'opportunity';
    if (recordType === 'clients') return 'client';
    
    // Default to generation for new leads
    return 'generation';
  };

  const currentStage = getCurrentStage();
  const currentStageIndex = PIPELINE_STAGES.findIndex(stage => stage['id'] === currentStage);

  return null;
}
