"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface ProspectOverviewTabProps {
  recordType: string;
  record?: any;
}

export function ProspectOverviewTab({ recordType, record: recordProp }: ProspectOverviewTabProps) {
  const { record: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading prospect details..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Prospect Data Debug] Record structure:', {
      record: record,
      customFields: record?.customFields,
      company: record?.company,
      companyData: record?.companyData,
      industry: record?.industry,
      buyerGroupRole: record?.customFields?.buyerGroupRole
    });
  }

  // Use real prospect data from record
  const prospectData = {
    name: record.fullName || record.name || 'Unknown Prospect',
    title: record.jobTitle || record.title || 'Unknown Title',
    email: record.email || record.workEmail || 'No email',
    phone: record.phone || record.mobilePhone || record.workPhone || 'No phone',
    linkedin: record.linkedinUrl || record?.customFields?.linkedinUrl || 'No LinkedIn',
    department: record.department || 'Unknown Department',
    seniority: record.seniority || 'Unknown',
    status: record.status || 'active',
    priority: record.priority || 'medium',
    company: record.company || record.companyData?.name || 'No company assigned',
    companyId: record.companyId || null,
    industry: record.industry || record.companyData?.industry || 'Unknown Industry',
    location: record.city && record.state ? `${record.city}, ${record.state}` : record.city || record.address || 'Unknown Location',
    buyerGroupRole: record?.customFields?.buyerGroupRole || record?.buyerGroupRole || 'Stakeholder',
    influenceLevel: record?.customFields?.influenceLevel || record?.influenceLevel || 'Medium',
    engagementPriority: record?.customFields?.engagementPriority || record?.engagementPriority || 'Medium',
    lastContact: record.lastContactDate || record.lastContact || 'Never',
    nextAction: record.nextAction || 'No action planned',
    nextActionDate: record.nextActionDate || null,
    notes: record.notes || 'No notes available',
    tags: record.tags || [],
    estimatedValue: record.estimatedValue || 0,
    currency: record.currency || 'USD',
    source: record.source || 'Unknown',
    painIntelligence: record.painIntelligence || 'No pain intelligence available',
    wants: record.wants || [],
    needs: record.needs || [],
    psychographicProfile: record.psychographicProfile || 'No psychographic profile available',
    communicationStyleRecommendations: record.communicationStyleRecommendations || 'No communication style recommendations available'
  };

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
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
  };

  return (
    <div className="space-y-8">
      {/* Prospect Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prospect Summary</h3>
        <div>
          <div className="block text-sm font-medium text-gray-600 mb-2">Description</div>
          <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
            {prospectData.name} is a {prospectData.title} at {prospectData.company}, specializing in {prospectData.department}. 
            As a {prospectData.buyerGroupRole} with {prospectData.influenceLevel.toLowerCase()} influence, they play a key role in 
            decision-making processes. Last contact: {formatRelativeDate(prospectData.lastContact)}.
          </div>
        </div>
      </div>

      {/* Prospect Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prospect Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Full Name</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.name}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Job Title</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.title}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Email</div>
              <div className="text-sm text-gray-900 font-medium">
                {prospectData.email !== 'No email' ? (
                  <a href={`mailto:${prospectData.email}`} className="text-blue-600 hover:underline">
                    {prospectData.email}
                  </a>
                ) : (
                  prospectData.email
                )}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Phone</div>
              <div className="text-sm text-gray-900 font-medium">
                {prospectData.phone !== 'No phone' ? (
                  <a href={`tel:${prospectData.phone}`} className="text-blue-600 hover:underline">
                    {prospectData.phone}
                  </a>
                ) : (
                  prospectData.phone
                )}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</div>
              <div className="text-sm text-gray-900 font-medium">
                {prospectData.linkedin !== 'No LinkedIn' ? (
                  <a 
                    href={prospectData.linkedin.startsWith('http') ? prospectData.linkedin : `https://${prospectData.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {prospectData.linkedin.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                  </a>
                ) : (
                  prospectData.linkedin
                )}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Department</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.department}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Seniority</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.seniority}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Status</div>
              <div className="text-sm text-gray-900 font-medium capitalize">{prospectData.status}</div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Priority</div>
              <div className="text-sm text-gray-900 font-medium capitalize">{prospectData.priority}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Company</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.company}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Industry</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.industry}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Location</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.location}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Buyer Group Role</div>
              <div className="text-sm text-gray-900 font-medium">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  prospectData.buyerGroupRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                  prospectData.buyerGroupRole === 'Champion' ? 'bg-green-100 text-green-800' :
                  prospectData.buyerGroupRole === 'Blocker' ? 'bg-yellow-100 text-yellow-800' :
                  prospectData.buyerGroupRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {prospectData.buyerGroupRole}
                </span>
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Influence Level</div>
              <div className="text-sm text-gray-900 font-medium capitalize">{prospectData.influenceLevel}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Last Contact</div>
              <div className="text-sm text-gray-900 font-medium">{formatRelativeDate(prospectData.lastContact)}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Next Action</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.nextAction}</div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Estimated Value</div>
              <div className="text-sm text-gray-900 font-medium">
                {prospectData.estimatedValue > 0 ? `${prospectData.currency} ${prospectData.estimatedValue.toLocaleString()}` : 'Not specified'}
              </div>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-600 mb-1">Source</div>
              <div className="text-sm text-gray-900 font-medium">{prospectData.source}</div>
            </div>
          </div>
        </div>
      </div>


      {/* Notes and Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Notes</div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
              {prospectData.notes}
            </div>
          </div>
          <div>
            <div className="block text-sm font-medium text-gray-600 mb-1">Tags</div>
            <div className="text-sm text-gray-900">
              {prospectData.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {prospectData.tags.map((tag: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                'No tags'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
