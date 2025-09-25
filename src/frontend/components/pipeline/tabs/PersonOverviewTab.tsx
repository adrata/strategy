"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface PersonOverviewTabProps {
  recordType: string;
  record?: any;
}

export function PersonOverviewTab({ recordType, record: recordProp }: PersonOverviewTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading person details..." />;
  }

  // Safety check: ensure record is an object and not being rendered directly
  if (typeof record !== 'object' || record === null) {
    return <CompanyDetailSkeleton message="Invalid record data..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Person Data Debug] Record structure:', {
      recordKeys: Object.keys(record || {}),
      customFields: record?.customFields,
      company: record?.company,
      buyerGroupRole: record?.customFields?.buyerGroupRole
    });
  }

  // Use real person data from record - ensure all values are strings or arrays
  const personData = {
    name: String(record.fullName || record.name || 'Unknown Person'),
    title: String(record.jobTitle || record.title || 'Unknown Title'),
    email: String(record.email || record.workEmail || 'No email'),
    phone: String(record.phone || record.mobilePhone || record.workPhone || 'No phone'),
    linkedin: String(record.linkedinUrl || record?.customFields?.linkedinUrl || record?.customFields?.enrichedData?.overview?.linkedin || 'No LinkedIn'),
    department: String(record.department || record?.customFields?.enrichedData?.overview?.department || 'Unknown Department'),
    seniority: String(record.seniority || record?.customFields?.enrichedData?.overview?.seniority || 'Unknown'),
    status: String(record.status || 'active'),
    company: String(record.company || record?.company?.name || record.companyData?.name || 'No company assigned'),
    companyId: record.companyId || null,
    industry: String(record.industry || record?.company?.industry || record.companyData?.industry || 'Unknown Industry'),
    location: String(record.city && record.state ? `${record.city}, ${record.state}` : record.city || record.address || 'Unknown Location'),
    buyerGroupRole: String(record?.buyerGroupRole || record?.customFields?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.buyerGroupRole || 'Stakeholder'),
    influenceLevel: String(record?.customFields?.influenceLevel || record?.customFields?.enrichedData?.overview?.influenceLevel || record?.influenceLevel || 'Medium'),
    engagementPriority: String(record?.customFields?.engagementPriority || record?.customFields?.enrichedData?.overview?.engagementPriority || record?.engagementPriority || 'Medium'),
    lastContact: String(record.lastContactDate || record.lastContact || 'Never'),
    nextAction: String(record.nextAction || 'No action planned'),
    nextActionDate: record.nextActionDate || null,
    notes: String(record.notes || 'No notes available'),
    tags: Array.isArray(record.tags) ? record.tags : []
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

  // Generate wants and needs based on role and industry
  const generateWantsAndNeeds = () => {
    const role = personData.title.toLowerCase();
    const industry = personData.industry.toLowerCase();
    const department = personData.department.toLowerCase();
    
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
    if (personData.lastAction && personData.lastAction !== 'No action planned') {
      actions.push({
        action: personData.lastAction,
        date: personData.lastContact !== 'Never' ? formatRelativeDate(personData.lastContact) : 'Invalid Date'
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
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">{personData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Title:</span>
                <span className="text-sm font-medium text-gray-900">{personData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company:</span>
                <span className="text-sm font-medium text-gray-900">{personData.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{personData.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">
                  {personData.email !== 'No email' ? (
                    <a href={`mailto:${personData.email}`} className="text-blue-600 hover:underline">
                      {personData.email}
                    </a>
                  ) : (
                    personData.email
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium text-gray-900">
                  {personData.phone !== 'No phone' ? (
                    <a href={`tel:${personData.phone}`} className="text-blue-600 hover:underline">
                      {personData.phone}
                    </a>
                  ) : (
                    personData.phone
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">LinkedIn:</span>
                <span className="text-sm font-medium text-gray-900">
                  {personData.linkedin !== 'No LinkedIn' ? (
                    <a 
                      href={personData.linkedin.startsWith('http') ? personData.linkedin : `https://${personData.linkedin}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {personData.linkedin.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </a>
                  ) : (
                    personData.linkedin
                  )}
                </span>
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
                  personData.buyerGroupRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                  personData.buyerGroupRole === 'Champion' ? 'bg-green-100 text-green-800' :
                  personData.buyerGroupRole === 'Blocker' ? 'bg-yellow-100 text-yellow-800' :
                  personData.buyerGroupRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {personData.buyerGroupRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Influence Level:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{personData.influenceLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Engagement Priority:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{personData.engagementPriority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Contact:</span>
                <span className="text-sm font-medium text-gray-900">{formatRelativeDate(personData.lastContact)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next Action:</span>
                <span className="text-sm font-medium text-gray-900">{personData.nextAction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.status === 'active' ? 'bg-green-100 text-green-800' :
                  personData.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {personData.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wants & Needs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wants & Needs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wants Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Wants</h4>
            <ul className="space-y-1">
              {wants.map((want, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {want}
                </li>
              ))}
            </ul>
          </div>

          {/* Needs Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Needs</h4>
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
              {personData.notes !== 'No notes available' ? personData.notes : 
                `${personData.name} is a ${personData.buyerGroupRole} at ${personData.company} with ${personData.influenceLevel.toLowerCase()} influence level, involved in ${personData.industry} industry decisions.`
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Engagement Strategy</h4>
            <div className="text-sm text-gray-600 leading-relaxed">
              Focus on {personData.engagementPriority.toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(personData.lastContact)}. 
              Next action: {personData.nextAction}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
