"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface ProspectOverviewTabProps {
  recordType: string;
  record?: any;
}

export function ProspectOverviewTab({ recordType, record: recordProp }: ProspectOverviewTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
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

  // Use real prospect data from record - Enhanced with all available fields
  const prospectData = {
    // Basic Information
    name: record.fullName || record.name || 'Unknown Prospect',
    firstName: record.firstName || '-',
    lastName: record.lastName || '-',
    middleName: record.middleName || '-',
    displayName: record.displayName || '-',
    salutation: record.salutation || '-',
    suffix: record.suffix || '-',
    title: record.jobTitle || record.title || '-',
    department: record.department || record?.customFields?.enrichedData?.overview?.department || '-',
    seniority: record.seniority || record?.customFields?.enrichedData?.overview?.seniority || '-',
    
    // Contact Information
    email: record.email || record.workEmail || '-',
    workEmail: record.workEmail || '-',
    personalEmail: record.personalEmail || '-',
    secondaryEmail: record.secondaryEmail || '-',
    phone: record.phone || record.mobilePhone || record.workPhone || '-',
    mobilePhone: record.mobilePhone || '-',
    workPhone: record.workPhone || '-',
    linkedin: record.linkedinUrl || record?.customFields?.linkedinUrl || record?.customFields?.enrichedData?.overview?.linkedin || '-',
    twitterHandle: record.twitterHandle || '-',
    
    // Location Information
    address: record.address || '-',
    city: record.city || '-',
    state: record.state || '-',
    country: record.country || '-',
    postalCode: record.postalCode || '-',
    location: record.city && record.state ? `${record.city}, ${record.state}` : record.city || record.address || 'Unknown Location',
    
    // Personal Information
    dateOfBirth: record.dateOfBirth || null,
    gender: record.gender || '-',
    preferredLanguage: record.preferredLanguage || '-',
    timezone: record.timezone || '-',
    bio: record.bio || '-',
    
    // Status and Metadata
    status: record.status || 'active',
    priority: record.priority || 'medium',
    company: record.company || record.companyData?.name || 'No company assigned',
    companyId: record.companyId || null,
    industry: record.industry || record.companyData?.industry || 'Unknown Industry',
    
    // Buyer Group and Influence
    buyerGroupRole: record?.buyerGroupRole || record?.customFields?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.buyerGroupRole || 'Stakeholder',
    influenceLevel: record?.customFields?.influenceLevel || record?.customFields?.enrichedData?.overview?.influenceLevel || record?.influenceLevel || 'Medium',
    engagementPriority: record?.customFields?.engagementPriority || record?.customFields?.enrichedData?.overview?.engagementPriority || record?.engagementPriority || 'Medium',
    
    // Engagement History
    lastContact: record.lastContactDate || record.lastContact || 'Never',
    nextAction: record.nextAction || 'No action planned',
    nextActionDate: record.nextActionDate || null,
    
    // Notes and Tags
    notes: record.notes || 'No notes available',
    tags: record.tags || [],
    
    // Business Information
    estimatedValue: record.estimatedValue || 0,
    currency: record.currency || 'USD',
    source: record.source || 'Unknown',
    
    // Intelligence and Insights
    painIntelligence: record.painIntelligence || 'No pain intelligence available',
    wants: record.wants || [],
    needs: record.needs || [],
    psychographicProfile: record.psychographicProfile || 'No psychographic profile available',
    communicationStyleRecommendations: record.communicationStyleRecommendations || 'No communication style recommendations available',
    
    // Enrichment Metadata
    lastEnriched: record.lastEnriched || null,
    enrichmentSources: record.enrichmentSources || [],
    enrichmentScore: record.enrichmentScore || null,
    emailConfidence: record.emailConfidence || null,
    phoneConfidence: record.phoneConfidence || null,
    dataCompleteness: record.dataCompleteness || null,
    emailVerified: record.emailVerified || false,
    phoneVerified: record.phoneVerified || false,
    mobileVerified: record.mobileVerified || false,
    
    // Custom Fields (Raw Data)
    customFields: record.customFields || {},
    
    // Timestamps
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null
  };

  const formatRelativeDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    
    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      return 'Never';
    }
    
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

  // Generate wants and needs based on role and industry
  const generateWantsAndNeeds = () => {
    const role = prospectData.title.toLowerCase();
    const industry = prospectData.industry.toLowerCase();
    const department = prospectData.department.toLowerCase();
    
    const wants = [];
    const needs = [];
    
    // Role-based wants and needs
    if (role.includes('director') || role.includes('vp') || role.includes('vice president')) {
      wants.push('Strategic solutions that drive business growth');
      wants.push('ROI-focused technology investments');
      wants.push('Competitive advantage in their market');
      needs.push('Executive-level decision support');
      needs.push('Strategic planning tools');
    } else if (role.includes('manager') || role.includes('supervisor')) {
      wants.push('Operational efficiency improvements');
      wants.push('Team productivity tools');
      wants.push('Process automation solutions');
      needs.push('Management reporting capabilities');
      needs.push('Team collaboration tools');
    } else {
      wants.push('User-friendly technology solutions');
      wants.push('Improved workflow efficiency');
      wants.push('Better integration with existing systems');
      needs.push('Training and support resources');
      needs.push('Reliable technical solutions');
    }
    
    // Industry-based wants and needs
    if (industry.includes('technology') || industry.includes('software')) {
      wants.push('Cutting-edge technology solutions');
      wants.push('Scalable and flexible platforms');
      needs.push('Technical expertise and support');
      needs.push('Integration capabilities');
    } else if (industry.includes('healthcare')) {
      wants.push('Compliance-focused solutions');
      wants.push('Patient data security');
      needs.push('HIPAA-compliant systems');
      needs.push('Regulatory compliance support');
    } else if (industry.includes('finance') || industry.includes('banking')) {
      wants.push('Financial data security');
      wants.push('Regulatory compliance');
      needs.push('Audit trail capabilities');
      needs.push('Risk management tools');
    }
    
    return { wants, needs };
  };

  const { wants, needs } = generateWantsAndNeeds();

  // Generate last 3 actions based on available data
  const generateLastActions = () => {
    const actions = [];
    
    // Add the main last action if it exists
    if (prospectData.lastAction && prospectData.lastAction !== 'No action planned') {
      actions.push({
        action: prospectData.lastAction,
        date: prospectData.lastContact !== 'Never' ? formatRelativeDate(prospectData.lastContact) : 'Invalid Date'
      });
    }
    
    // Add record creation action
    if (record.createdAt) {
      actions.push({
        action: 'Added to CRM system',
        date: formatRelativeDate(record.createdAt)
      });
    }
    
    // Add enrichment action if available
    if (record.lastEnriched) {
      actions.push({
        action: 'Profile enrichment completed',
        date: formatRelativeDate(record.lastEnriched)
      });
    }
    
    // Fill with default actions if we don't have enough
    while (actions.length < 3) {
      actions.push({
        action: 'Initial contact via email',
        date: 'Invalid Date'
      });
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
                <span className="text-sm font-medium text-gray-900">{prospectData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Title:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.department}</span>
              </div>
            </div>
          </div>

          {/* Role & Influence Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Role & Influence</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Buyer Group Role:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  prospectData.buyerGroupRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                  prospectData.buyerGroupRole === 'Champion' ? 'bg-green-100 text-green-800' :
                  prospectData.buyerGroupRole === 'Blocker' ? 'bg-yellow-100 text-yellow-800' :
                  prospectData.buyerGroupRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {prospectData.buyerGroupRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Influence Level:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{prospectData.influenceLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Engagement Priority:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{prospectData.engagementPriority}</span>
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
                  {prospectData.email !== '-' ? (
                    <a href={`mailto:${prospectData.email}`} className="text-blue-600 hover:underline">
                      {prospectData.email}
                    </a>
                  ) : (
                    prospectData.email
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.phone !== '-' ? (
                    <a href={`tel:${prospectData.phone}`} className="text-blue-600 hover:underline">
                      {prospectData.phone}
                    </a>
                  ) : (
                    prospectData.phone
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">LinkedIn:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.linkedin !== '-' ? (
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
                <span className="text-sm font-medium text-gray-900">{formatRelativeDate(prospectData.lastContact)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Action:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.nextActionDate ? formatRelativeDate(prospectData.nextActionDate) : prospectData.nextAction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  prospectData.status === 'active' ? 'bg-green-100 text-green-800' :
                  prospectData.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {prospectData.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What do they care about */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">
            Wants & Needs: Based on their role as {prospectData.title} at {prospectData.company}, they likely care about:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Wants</h5>
              <ul className="space-y-1">
                {wants.map((want, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {want}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Needs</h5>
              <ul className="space-y-1">
                {needs.map((need, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {need}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* What did I last do */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What did I last do</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Last 3 Actions:</h4>
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
              {prospectData.notes !== 'No notes available' ? prospectData.notes : 
                `${prospectData.name} is a ${prospectData.buyerGroupRole} at ${prospectData.company} with ${prospectData.influenceLevel.toLowerCase()} influence level, involved in ${prospectData.industry} industry decisions.`
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Engagement Strategy</h4>
            <div className="text-sm text-gray-600 leading-relaxed">
              Focus on {prospectData.engagementPriority.toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(prospectData.lastContact)}. 
              Next action: {prospectData.nextAction}.
            </div>
          </div>
        </div>
      </div>

      {/* Enrichment Data Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enrichment Metadata Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Data Quality & Enrichment</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Enriched:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.lastEnriched ? formatRelativeDate(prospectData.lastEnriched) : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Enrichment Score:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.enrichmentScore ? `${prospectData.enrichmentScore}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Completeness:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.dataCompleteness ? `${prospectData.dataCompleteness}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email Confidence:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.emailConfidence ? `${prospectData.emailConfidence}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone Confidence:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.phoneConfidence ? `${prospectData.phoneConfidence}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email Verified:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  prospectData.emailVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {prospectData.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone Verified:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  prospectData.phoneVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {prospectData.phoneVerified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Contact Information Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Additional Contact Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Work Email:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.workEmail !== '-' ? (
                    <a href={`mailto:${prospectData.workEmail}`} className="text-blue-600 hover:underline">
                      {prospectData.workEmail}
                    </a>
                  ) : (
                    prospectData.workEmail
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Personal Email:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.personalEmail !== '-' ? (
                    <a href={`mailto:${prospectData.personalEmail}`} className="text-blue-600 hover:underline">
                      {prospectData.personalEmail}
                    </a>
                  ) : (
                    prospectData.personalEmail
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mobile Phone:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.mobilePhone !== '-' ? (
                    <a href={`tel:${prospectData.mobilePhone}`} className="text-blue-600 hover:underline">
                      {prospectData.mobilePhone}
                    </a>
                  ) : (
                    prospectData.mobilePhone
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Work Phone:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.workPhone !== '-' ? (
                    <a href={`tel:${prospectData.workPhone}`} className="text-blue-600 hover:underline">
                      {prospectData.workPhone}
                    </a>
                  ) : (
                    prospectData.workPhone
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Twitter:</span>
                <span className="text-sm font-medium text-gray-900">
                  {prospectData.twitterHandle !== '-' ? (
                    <a 
                      href={`https://twitter.com/${prospectData.twitterHandle.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {prospectData.twitterHandle}
                    </a>
                  ) : (
                    prospectData.twitterHandle
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Location Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Address:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">City:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">State:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.state}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Country:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Postal Code:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.postalCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Timezone:</span>
                <span className="text-sm font-medium text-gray-900">{prospectData.timezone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Fields and Raw Data */}
        {Object.keys(prospectData.customFields).length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Enriched Data & Custom Fields</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Enrichment Sources:</strong> {prospectData.enrichmentSources.join(', ') || 'None'}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Custom Fields Available:</strong> {Object.keys(prospectData.customFields).length} fields
              </div>
              {Object.keys(prospectData.customFields).length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    View Custom Fields ({Object.keys(prospectData.customFields).length} fields)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded border">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                      {JSON.stringify(prospectData.customFields, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Bio and Personal Information */}
        {(prospectData.bio !== '-' || prospectData.preferredLanguage !== '-' || prospectData.gender !== '-') && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
            <div className="space-y-2">
              {prospectData.bio !== '-' && (
                <div>
                  <span className="text-sm text-gray-600">Bio:</span>
                  <p className="text-sm text-gray-900 mt-1">{prospectData.bio}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Preferred Language:</span>
                  <span className="text-sm font-medium text-gray-900">{prospectData.preferredLanguage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gender:</span>
                  <span className="text-sm font-medium text-gray-900">{prospectData.gender}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
