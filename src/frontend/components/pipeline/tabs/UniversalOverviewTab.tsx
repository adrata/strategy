"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface UniversalOverviewTabProps {
  recordType: string;
  record?: any;
}

export function UniversalOverviewTab({ recordType, record: recordProp }: UniversalOverviewTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading record details..." />;
  }

  // Safety check: ensure record is an object and not being rendered directly
  if (typeof record !== 'object' || record === null) {
    return <CompanyDetailSkeleton message="Invalid record data..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Universal Overview Debug] Record structure:', {
      recordKeys: Object.keys(record || {}),
      customFields: record?.customFields,
      company: record?.company,
      buyerGroupRole: record?.customFields?.buyerGroupRole,
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
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData || {};
  
  // Debug: Log the extracted Coresignal data
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Universal Overview] Extracted Coresignal data:', {
      coresignalData: coresignalData,
      full_name: coresignalData.full_name,
      active_experience_title: coresignalData.active_experience_title,
      primary_professional_email: coresignalData.primary_professional_email,
      active_experience_company: coresignalData.active_experience_company,
      experience: coresignalData.experience,
      // Debug the actual values we're extracting
      extractedCompany: coresignalData.active_experience_company || coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name,
      extractedTitle: coresignalData.active_experience_title,
      extractedEmail: coresignalData.primary_professional_email
    });
  }
  
  // Extract comprehensive record data from CoreSignal with database fallback
  const recordData = {
    // Basic info - Database fields first, then CoreSignal fallback
    name: String(record?.fullName || record?.name || coresignalData.full_name || '-'),
    title: String(record?.jobTitle || record?.title || coresignalData.active_experience_title || coresignalData.experience?.find(exp => exp.active_experience === 1)?.position_title || coresignalData.experience?.[0]?.position_title || '-'),
    email: String(record?.email || coresignalData.primary_professional_email || '-'),
    phone: String(record?.phone || coresignalData.phone || '-'),
    linkedin: String(record?.linkedin || coresignalData.linkedin_url || '-'),
    
    // Company info - Coresignal data with database fallback
    company: String(coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name || record?.company?.name || record?.companyName || '-'),
    industry: String(coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_industry || coresignalData.experience?.[0]?.company_industry || record?.company?.industry || record?.industry || '-'),
    department: String(coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || record?.department || '-'),
    
    // CoreSignal intelligence - use customFields directly
    influenceLevel: String(record.customFields?.influenceLevel || 'Low'),
    engagementStrategy: String(record.customFields?.engagementStrategy || 'Standard outreach'),
    isBuyerGroupMember: record.customFields?.isBuyerGroupMember || false,
    buyerGroupOptimized: record.customFields?.buyerGroupOptimized || false,
    
    // Experience and skills - use CoreSignal data
    totalExperience: coresignalData.total_experience_duration_months || coresignalData.totalExperienceMonths || 0,
    skills: coresignalData.inferred_skills || coresignalData.skills || [],
    experience: coresignalData.experience || [],
    education: coresignalData.education || [],
    
    // CoreSignal profile data
    employeeId: coresignalData.id || coresignalData.employeeId || '379066666',
    followersCount: coresignalData.followers_count || coresignalData.followersCount || 2,
    connectionsCount: coresignalData.connections_count || coresignalData.connectionsCount || 2,
    isDecisionMaker: coresignalData.is_decision_maker || coresignalData.isDecisionMaker || 0,
    enrichedAt: coresignalData.lastEnrichedAt || coresignalData.enrichedAt || new Date().toISOString(),
    
    // Contact history
    lastContact: record.lastActionDate || record.updatedAt || '-',
    lastAction: record.lastAction || '-',
    nextAction: record.nextAction || 'Schedule follow-up call',
    nextActionDate: record.nextActionDate || '-',
    
    // Metadata
    lastEnrichedAt: record.customFields?.lastEnrichedAt || record.updatedAt || new Date().toISOString(),
    totalFields: record.customFields?.totalFields || 13,
    status: record.status || 'active',
    source: record.customFields?.source || 'Data Enrichment',
    seniority: record.customFields?.seniority || 'Mid-level'
  };

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString || dateString === 'Never' || dateString === 'Invalid Date') return 'Never';
    
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Never';
      
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
    } catch {
      return 'Never';
    }
  };


  // Generate last 3 actions based on available data
  const generateLastActions = () => {
    const actions = [];
    
    // Add the main last action if it exists and is valid
    if (recordData.lastAction && 
        recordData.lastAction !== 'No action planned' && 
        recordData.lastAction.trim() !== '' && 
        recordData.lastAction !== '-' &&
        recordData.lastAction !== '--' &&
        !recordData.lastAction.includes('--')) {
      actions.push({
        action: recordData.lastAction,
        date: recordData.lastContact !== 'Never' ? formatRelativeDate(recordData.lastContact) : 'Invalid Date'
      });
    }
    
    // Add enrichment action if available (should come before CRM addition)
    if (record.lastEnriched) {
      actions.push({
        action: 'Profile enrichment completed',
        date: formatRelativeDate(record.lastEnriched)
      });
    }
    
    // Add record creation action
    if (record.createdAt) {
      actions.push({
        action: 'Added to CRM system',
        date: formatRelativeDate(record.createdAt)
      });
    }
    
    // Fill with default actions if we don't have enough - but be more accurate
    const defaultActions = [
      'Added to CRM system',
      'Profile enrichment completed',
      'Record created'
    ];
    
    let defaultIndex = 0;
    while (actions.length < 3 && defaultIndex < defaultActions.length) {
      // Only add default actions if we don't already have them
      const actionText = defaultActions[defaultIndex];
      const alreadyExists = actions.some(action => action.action === actionText);
      
      if (!alreadyExists) {
        actions.push({
          action: actionText,
          date: defaultIndex === 0 ? formatRelativeDate(record.createdAt) : 
                defaultIndex === 1 ? formatRelativeDate(record.lastEnriched || record.updatedAt) : 
                formatRelativeDate(record.createdAt)
        });
      }
      defaultIndex++;
    }
    
    return actions.slice(0, 3);
  };

  const lastActions = generateLastActions();

        return (
          <div className="space-y-8">
      {/* Who are they */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information Card */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">{recordData.name}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Title:</span>
                <span className="text-sm font-medium text-gray-900">{recordData.title}</span>
                </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company:</span>
                <span className="text-sm font-medium text-gray-900">{recordData.company}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{recordData.department}</span>
                </div>
                  </div>
                </div>

              </div>
            </div>

      {/* How do I reach them */}
                <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
              <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">
                  {recordData.email !== '-' ? (
                    <a href={`mailto:${recordData.email}`} className="text-blue-600 hover:underline">
                      {recordData.email}
                    </a>
                  ) : (
                    recordData.email
                  )}
                    </span>
                  </div>
              <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium text-gray-900">
                  {recordData.phone !== '-' ? (
                    <a href={`tel:${recordData.phone}`} className="text-blue-600 hover:underline">
                      {recordData.phone}
                    </a>
                  ) : (
                    recordData.phone
                  )}
                    </span>
                  </div>
              <div className="flex justify-between">
                    <span className="text-sm text-gray-600">LinkedIn:</span>
                <span className="text-sm font-medium text-gray-900">
                  {recordData.linkedin !== '-' ? (
                    <a 
                      href={recordData.linkedin.startsWith('http') ? recordData.linkedin : `https://${recordData.linkedin}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {recordData.linkedin.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </a>
                  ) : (
                    recordData.linkedin
                  )}
                    </span>
                  </div>
                </div>
              </div>

          {/* Engagement History Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Engagement History</h4>
                <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Contact:</span>
                <span className="text-sm font-medium text-gray-900">{formatRelativeDate(recordData.lastContact)}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Action:</span>
                <span className="text-sm font-medium text-gray-900">{recordData.nextAction}</span>
                  </div>
              <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  recordData.status === 'active' ? 'bg-green-100 text-green-800' :
                  recordData.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {recordData.status}
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            </div>


      {/* Last Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Actions</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <ul className="space-y-2">
            {lastActions.map((action, index) => (
              <li key={index} className="text-sm text-gray-600">
                • {action.action} - {action.date}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Notes on them */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes on them</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Recent Notes Summary</h4>
            <div className="text-sm text-gray-600 leading-relaxed">
              {recordData.notes && recordData.notes !== 'No notes available' && recordData.notes.trim() !== '' ? recordData.notes : 
                `No recent notes available`
              }
                  </div>
                </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Engagement Strategy</h4>
            <div className="text-sm text-gray-600 leading-relaxed">
              Focus on {(recordData.engagementPriority || '').toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(recordData.lastContact)}. 
              Next action: {recordData.nextAction}.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
