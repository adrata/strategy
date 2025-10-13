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
    
    // Additional debug for Aaron Adkins specifically
    if (record?.fullName?.includes('Aaron Adkins') || record?.name?.includes('Aaron Adkins')) {
      console.log('🎯 [AARON DEBUG] Aaron Adkins record found!');
      console.log('Full name from record:', record.fullName);
      console.log('Coresignal data exists:', !!record?.customFields?.coresignal);
      console.log('Coresignal full_name:', record?.customFields?.coresignal?.full_name);
      console.log('Coresignal active_experience_title:', record?.customFields?.coresignal?.active_experience_title);
      console.log('Coresignal primary_professional_email:', record?.customFields?.coresignal?.primary_professional_email);
    }
  }

  // Extract CoreSignal data from the correct location
  const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData || {};
  
  // Extract comprehensive person data from database first, then CoreSignal fallback
  const personData = {
    // Basic info - Database fields first, then CoreSignal fallback
    name: String(record?.fullName || record?.name || coresignalData.full_name || '-'),
    title: String(record?.jobTitle || record?.title || coresignalData.active_experience_title || coresignalData.experience?.find(exp => exp.active_experience === 1)?.position_title || coresignalData.experience?.[0]?.position_title || '-'),
    email: String(record?.email || coresignalData.primary_professional_email || '-'),
    phone: String(record?.phone || coresignalData.phone || coresignalData.mobile_phone || coresignalData.work_phone || '-'),
    linkedin: String(record?.linkedin || coresignalData.linkedin_url || '-'),
    
    // Company info - Database fields first, then CoreSignal fallback
    company: (() => {
      // Handle both string and object company formats
      const coresignalCompany = coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name;
      const recordCompany = typeof record?.company === 'string' 
        ? record.company 
        : (record?.company?.name || record?.companyName);
      return String(coresignalCompany || recordCompany || '-');
    })(),
    industry: String(coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_industry || coresignalData.experience?.[0]?.company_industry || record?.company?.industry || record?.industry || '-'),
    department: String(coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || record?.department || '-'),
    
    // Location info - Coresignal data only
    location: String(coresignalData.location_full || coresignalData.city || coresignalData.state || coresignalData.country || '-'),
    
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
    
    // Additional CoreSignal data
    followersCount: coresignalData.followers_count || coresignalData.followersCount || 0,
    connectionsCount: coresignalData.connections_count || coresignalData.connectionsCount || 0,
    isDecisionMaker: coresignalData.is_decision_maker || coresignalData.isDecisionMaker || 0,
    
    // CoreSignal profile data
    employeeId: coresignalData.id || coresignalData.employeeId || '379066666',
    enrichedAt: coresignalData.lastEnrichedAt || coresignalData.enrichedAt || new Date().toISOString(),
    
    // Contact history
    lastContact: record.lastActionDate || record.updatedAt || '-',
    lastAction: record.lastAction || '-',
    nextAction: record.nextAction || '-',
    nextActionDate: record.nextActionDate || '-',
    
    // Metadata
    lastEnrichedAt: record.customFields?.lastEnrichedAt || record.updatedAt || new Date().toISOString(),
    totalFields: record.customFields?.totalFields || 13,
    status: record.status || 'active',
    source: record.customFields?.source || 'Data Enrichment',
    seniority: record.customFields?.seniority || 'Mid-level'
  };

  // Debug logging removed for cleaner console

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

  // Generate wants and needs based on role and industry
  const generateWantsAndNeeds = () => {
    const role = (personData.title || '').toLowerCase();
    const industry = (personData.industry || '').toLowerCase();
    const department = (personData.department || '').toLowerCase();
    
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
    } else if (role.includes('safety') || role.includes('advisor')) {
      wants.push('Safety compliance tools');
      wants.push('Risk assessment capabilities');
      wants.push('Incident prevention systems');
      needs.push('Safety training resources');
      needs.push('Regulatory compliance support');
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
    } else if (industry.includes('food') || industry.includes('beverage') || industry.includes('manufacturing')) {
      wants.push('Food safety compliance tools');
      wants.push('Quality control systems');
      needs.push('HACCP compliance support');
      needs.push('Supply chain traceability');
    }
    
    return { wants, needs };
  };

  const { wants, needs } = generateWantsAndNeeds();

  // Generate last actions from real database data only
  const generateLastActions = () => {
    const actions = [];
    
    // Only add the main last action if it exists and is valid
    if (personData.lastAction && personData.lastAction !== 'No action planned' && personData.lastAction.trim() !== '') {
      actions.push({
        action: personData.lastAction,
        date: personData.lastContact !== 'Never' ? formatRelativeDate(personData.lastContact) : 'Invalid Date'
      });
    }
    
    // No synthetic actions - only show real actions from the database
    return actions;
  };

  const lastActions = generateLastActions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Speedrun Summary</h2>
      </div>

      {/* Who are they */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Basic Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Name:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{personData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Title:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{personData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Company:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{personData.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Department:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{personData.department}</span>
              </div>
            </div>
          </div>

          {/* Intelligence Data Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Intelligence Profile</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Influence Level:</span>
                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{personData.influenceLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Engagement Strategy:</span>
                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{personData.engagementStrategy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Buyer Group Member:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.isBuyerGroupMember ? 'bg-green-100 text-green-800' : 'bg-[var(--hover)] text-gray-800'
                }`}>
                  {personData.isBuyerGroupMember ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Buyer Group Optimized:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.buyerGroupOptimized ? 'bg-green-100 text-green-800' : 'bg-[var(--hover)] text-gray-800'
                }`}>
                  {personData.buyerGroupOptimized ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Seniority:</span>
                <span className="text-sm font-medium text-[var(--foreground)] capitalize">{personData.seniority}</span>
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
                  {personData.email !== '-' ? (
                    <a href={`mailto:${personData.email}`} className="text-blue-600 hover:underline">
                      {personData.email}
                    </a>
                  ) : (
                    personData.email
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Phone:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {personData.phone !== '-' ? (
                    <a href={`tel:${personData.phone}`} className="text-blue-600 hover:underline">
                      {personData.phone}
                    </a>
                  ) : (
                    personData.phone
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">LinkedIn:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {personData.linkedin !== '-' ? (
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

          {/* Engagement History Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement History</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Last Contact:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{formatRelativeDate(personData.lastContact)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Next Action:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{personData.nextAction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  personData.status === 'active' ? 'bg-green-100 text-green-800' :
                  personData.status === 'inactive' ? 'bg-[var(--hover)] text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {personData.status}
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
            Professional Insights: Based on their role as {personData.title} at {personData.company}, they likely care about:
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

        {/* Last Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">What did I last do</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Last Actions:</h4>
            {lastActions.length > 0 ? (
              <ul className="space-y-2">
                {lastActions.map((action, index) => (
                  <li key={index} className="text-sm text-[var(--muted)]">
                    • {action.action} - {action.date}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-[var(--muted)] mb-3">No actions logged yet</p>
                <p className="text-xs text-[var(--muted)]">Actions will appear here when logged through the Actions tab</p>
              </div>
            )}
          </div>
        </div>

      {/* Notes on them */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Notes on them</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Recent Notes Summary</h4>
            <div className="text-sm text-[var(--muted)] leading-relaxed">
              {personData.notes && personData.notes !== 'No notes available' && personData.notes.trim() !== '' ? personData.notes : 
                `—`
              }
            </div>
          </div>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Engagement Strategy</h4>
            <div className="text-sm text-[var(--muted)] leading-relaxed">
              Focus on {(personData.engagementPriority || '').toLowerCase()} priority engagement. 
              Last contact was {formatRelativeDate(personData.lastContact)}. 
              Next action: {personData.nextAction}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
