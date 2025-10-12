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
    
    // Enhanced debug logging for Shannon Hegland specifically
    if (record?.fullName?.includes('Shannon Hegland') || record?.name?.includes('Shannon Hegland')) {
      console.log('🔍 [SHANNON DEBUG] Full record data for Shannon Hegland:', {
        id: record.id,
        fullName: record.fullName,
        firstName: record.firstName,
        lastName: record.lastName,
        jobTitle: record.jobTitle,
        title: record.title,
        role: record.role,
        department: record.department,
        email: record.email,
        workEmail: record.workEmail,
        personalEmail: record.personalEmail,
        secondaryEmail: record.secondaryEmail,
        phone: record.phone,
        mobilePhone: record.mobilePhone,
        workPhone: record.workPhone,
        linkedinUrl: record.linkedinUrl,
        company: record.company,
        companyId: record.companyId,
        companyData: record.companyData,
        customFields: record.customFields,
        allKeys: Object.keys(record || {})
      });
      
      // Debug customFields structure
      if (record.customFields) {
        console.log('🔍 [SHANNON CUSTOM FIELDS] Custom fields structure:', {
          customFieldsKeys: Object.keys(record.customFields),
          customFields: record.customFields,
          enrichedData: record.customFields?.enrichedData,
          enrichedDataKeys: record.customFields?.enrichedData ? Object.keys(record.customFields.enrichedData) : null
        });
      }
      
      // Debug specific field mappings
      console.log('🔍 [SHANNON FIELD MAPPING] Field mapping analysis:', {
        title: {
          jobTitle: record.jobTitle,
          title: record.title,
          role: record.role,
          customFieldsTitle: record?.customFields?.title,
          customFieldsJobTitle: record?.customFields?.jobTitle,
          enrichedTitle: record?.customFields?.enrichedData?.overview?.title,
          enrichedJobTitle: record?.customFields?.enrichedData?.overview?.jobTitle
        },
        email: {
          email: record.email,
          workEmail: record.workEmail,
          personalEmail: record.personalEmail,
          secondaryEmail: record.secondaryEmail,
          customFieldsEmail: record?.customFields?.email,
          customFieldsWorkEmail: record?.customFields?.workEmail,
          enrichedEmail: record?.customFields?.enrichedData?.overview?.email,
          enrichedWorkEmail: record?.customFields?.enrichedData?.overview?.workEmail
        },
        phone: {
          phone: record.phone,
          mobilePhone: record.mobilePhone,
          workPhone: record.workPhone,
          customFieldsPhone: record?.customFields?.phone,
          customFieldsMobilePhone: record?.customFields?.mobilePhone,
          customFieldsWorkPhone: record?.customFields?.workPhone,
          enrichedPhone: record?.customFields?.enrichedData?.overview?.phone,
          enrichedMobilePhone: record?.customFields?.enrichedData?.overview?.mobilePhone
        },
        linkedin: {
          linkedinUrl: record.linkedinUrl,
          customFieldsLinkedinUrl: record?.customFields?.linkedinUrl,
          customFieldsLinkedin: record?.customFields?.linkedin,
          enrichedLinkedin: record?.customFields?.enrichedData?.overview?.linkedin,
          enrichedLinkedinUrl: record?.customFields?.enrichedData?.overview?.linkedinUrl
        }
      });
    }
  }

  // Extract CoreSignal data from the correct location (same as PersonOverviewTab)
  const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData || {};

  // Use database fields first, then CoreSignal fallback
  const prospectData = {
    // Basic Information - Database fields first, then CoreSignal fallback
    name: String(record?.fullName || record?.name || coresignalData.full_name || '-'),
    title: String(record?.jobTitle || record?.title || coresignalData.active_experience_title || coresignalData.experience?.find(exp => exp.active_experience === 1)?.position_title || coresignalData.experience?.[0]?.position_title || '-'),
    department: String(record?.department || coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || '-'),
    
    // Contact Information - Database fields first, then CoreSignal fallback
    email: String(record?.email || coresignalData.primary_professional_email || '-'),
    phone: String(record?.phone || coresignalData.phone || '-'),
    linkedin: String(record?.linkedin || coresignalData.linkedin_url || '-'),
    
    // Company Information - Database fields first, then CoreSignal fallback
    company: (() => {
      // Handle both string and object company formats
      const coresignalCompany = coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name;
      const recordCompany = typeof record?.company === 'string' 
        ? record.company 
        : (record?.company?.name || record?.companyName);
      return String(coresignalCompany || recordCompany || '-');
    })(),
    companyId: record.companyId || null,
    industry: String(coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_industry || coresignalData.experience?.[0]?.company_industry || record?.company?.industry || record?.industry || '-'),
    
    // Buyer Group and Influence (existing fields) - Enhanced mapping
    buyerGroupRole: record?.buyerGroupRole || record?.customFields?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.buyerGroupRole || record?.customFields?.enrichedData?.overview?.role || 'Stakeholder',
    influenceLevel: record?.customFields?.influenceLevel || record?.customFields?.enrichedData?.overview?.influenceLevel || record?.influenceLevel || record?.customFields?.influence || 'Medium',
    engagementPriority: record?.customFields?.engagementPriority || record?.customFields?.enrichedData?.overview?.engagementPriority || record?.engagementPriority || record?.customFields?.priority || 'Medium',
    
    // Engagement History (existing fields) - Enhanced mapping
    lastContact: record.lastContactDate || record.lastContact || record.lastActionDate || record?.customFields?.lastContact || record?.customFields?.lastContactDate || 'Never',
    nextAction: record.nextAction || record?.customFields?.nextAction || 'No action planned',
    nextActionDate: record.nextActionDate || record?.customFields?.nextActionDate || null,
    
    // Status (existing fields) - Enhanced mapping
    status: record.status || record?.customFields?.status || 'active',
    priority: record.priority || record?.customFields?.priority || 'medium',
    
    // Notes and Tags (existing fields) - Enhanced mapping
    notes: record.notes || record?.customFields?.notes || 'No notes available',
    tags: record.tags || record?.customFields?.tags || [],
    
    // Intelligence and Insights (existing fields) - Enhanced mapping
    painIntelligence: record.painIntelligence || record?.customFields?.painIntelligence || 'No pain intelligence available',
    wants: record.wants || record?.customFields?.wants || [],
    needs: record.needs || record?.customFields?.needs || [],
    psychographicProfile: record.psychographicProfile || record?.customFields?.psychographicProfile || 'No psychographic profile available',
    communicationStyleRecommendations: record.communicationStyleRecommendations || record?.customFields?.communicationStyleRecommendations || 'No communication style recommendations available'
  };

  // Debug: Log the final prospectData values for Shannon Hegland
  if (process.env.NODE_ENV === 'development' && (record?.fullName?.includes('Shannon Hegland') || record?.name?.includes('Shannon Hegland'))) {
    console.log('🔍 [SHANNON PROSPECT DATA] Final values being displayed:', {
      name: prospectData.name,
      title: prospectData.title,
      department: prospectData.department,
      email: prospectData.email,
      phone: prospectData.phone,
      linkedin: prospectData.linkedin,
      company: prospectData.company,
      buyerGroupRole: prospectData.buyerGroupRole,
      influenceLevel: prospectData.influenceLevel,
      engagementPriority: prospectData.engagementPriority,
      lastContact: prospectData.lastContact,
      nextAction: prospectData.nextAction,
      status: prospectData.status
    });
  }

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
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Name:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{prospectData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Title:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{prospectData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Company:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{prospectData.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Department:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{prospectData.department}</span>
              </div>
            </div>
          </div>

          {/* Role & Influence Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Role & Influence</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Buyer Group Role:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  prospectData.buyerGroupRole === 'Decision Maker' ? 'bg-red-100 text-red-800' :
                  prospectData.buyerGroupRole === 'Champion' ? 'bg-green-100 text-green-800' :
                  prospectData.buyerGroupRole === 'Blocker' ? 'bg-yellow-100 text-yellow-800' :
                  prospectData.buyerGroupRole === 'Stakeholder' ? 'bg-blue-100 text-blue-800' :
                  'bg-[var(--hover)] text-gray-800'
                }`}>
                  {prospectData.buyerGroupRole}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Influence Level:</span>
                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{prospectData.influenceLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Engagement Priority:</span>
                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{prospectData.engagementPriority}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How do I reach them */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Email:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
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
                <span className="text-sm text-[var(--muted)]">Phone:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
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
                <span className="text-sm text-[var(--muted)]">LinkedIn:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
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
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement History</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Last Contact:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{formatRelativeDate(prospectData.lastContact)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Next Action:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {prospectData.nextActionDate ? formatRelativeDate(prospectData.nextActionDate) : prospectData.nextAction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  prospectData.status === 'active' ? 'bg-green-100 text-green-800' :
                  prospectData.status === 'inactive' ? 'bg-[var(--hover)] text-gray-800' :
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
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <h4 className="font-medium text-[var(--foreground)] mb-3">
            Wants & Needs: Based on their role as {prospectData.title} at {prospectData.company}, they likely care about:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Wants</h5>
              <ul className="space-y-1">
                {wants.map((want, index) => (
                  <li key={index} className="text-sm text-[var(--muted)] flex items-start">
                    <span className="text-[var(--muted)] mr-2">•</span>
                    {want}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Needs</h5>
              <ul className="space-y-1">
                {needs.map((need, index) => (
                  <li key={index} className="text-sm text-[var(--muted)] flex items-start">
                    <span className="text-[var(--muted)] mr-2">•</span>
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
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">What did I last do</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <h4 className="font-medium text-[var(--foreground)] mb-3">Last 3 Actions:</h4>
          <ul className="space-y-2">
            {lastActions.map((action, index) => (
              <li key={index} className="text-sm text-[var(--muted)]">
                • {action.action} - {action.date}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Notes on them */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Notes on them</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Recent Notes Summary</h4>
            <div className="text-sm text-[var(--muted)] leading-relaxed">
              {prospectData.notes && prospectData.notes !== 'No notes available' && prospectData.notes.trim() !== '' ? prospectData.notes : 
                `—`
              }
            </div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement Strategy</h4>
            <div className="text-sm text-[var(--muted)] leading-relaxed">
              Focus on {prospectData.engagementPriority.toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(prospectData.lastContact)}. 
              Next action: {prospectData.nextAction}.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
