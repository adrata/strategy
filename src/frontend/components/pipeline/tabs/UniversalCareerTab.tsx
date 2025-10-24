"use client";

import React, { useState } from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';
import { InlineEditField } from '@/frontend/components/pipeline/InlineEditField';

interface UniversalCareerTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalCareerTab({ recordType, record: recordProp, onSave }: UniversalCareerTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Show skeleton loader while data is loading
  if (!record) {
    return <CompanyDetailSkeleton message="Loading career information..." />;
  }

  // Debug: Log the record structure to see what's available
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Career Tab Debug] Record structure:', {
      record: record,
      customFields: record?.customFields,
      coresignal: record?.customFields?.coresignal,
      coresignalData: record?.customFields?.coresignalData,
      coresignalProfile: record?.customFields?.coresignalProfile
    });
  }

  // Extract career data from the correct CoreSignal data structure
  const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData?.career || {};
  const rawData = record?.customFields?.rawData || {};
  
  // Extract CoreSignal data from the correct location
  const coresignalExperience = coresignalData?.experience || coresignalProfile?.experience || [];
  const coresignalSkills = coresignalData?.inferred_skills || coresignalData?.skills || coresignalProfile?.skills || [];
  const coresignalEducation = coresignalData?.education || coresignalProfile?.education || [];
  const coresignalTotalExperience = coresignalData?.total_experience_duration_months || coresignalData?.totalExperienceMonths || coresignalProfile?.totalExperienceMonths || 0;
  
  // Check if we're in a demo workspace
  const isDemoWorkspace = record?.workspaceId === '01K1VBYXHD0J895XAN0HGFBKJP' || 
                         record?.workspaceId === 'demo' ||
                         window.location.pathname.includes('/demo/');

  // Use CoreSignal data with proper data extraction
  const careerData = {
    department: coresignalData.active_experience_department || coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || coresignalData.experience?.[0]?.department || record?.department || null,
    companyName: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || coresignalData.experience?.[0]?.company_name || record?.company?.name || record?.companyName || null,
    totalExperience: coresignalTotalExperience > 0 ? `${Math.floor(coresignalTotalExperience / 12)} years` : null,
    education: coresignalEducation || [],
    skills: coresignalSkills || [],
    experience: coresignalExperience || [],
    totalFields: Object.keys(coresignalData).length || 0,
    lastEnrichedAt: record.customFields?.lastEnrichedAt || coresignalData.lastEnrichedAt || coresignalData.enrichedAt || record.updatedAt || null
  };

  // Debug: Log the actual CoreSignal data structure
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Career Tab Debug] Full record structure:', {
      record: record,
      customFields: record?.customFields,
      coresignalData: coresignalData,
      coresignalProfile: coresignalProfile,
      enrichedData: enrichedData,
      rawData: rawData,
      careerData: careerData,
      experienceArray: coresignalExperience,
      experienceLength: coresignalExperience.length,
      firstExperience: coresignalExperience[0]
    });
  }

  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    } catch {
      return '-';
    }
  };

  const formatDuration = (startDate: string, endDate?: string): string => {
    if (!startDate) return '-';
    
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

      if (diffInMonths < 1) {
        return 'Less than a month';
      } else if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffInMonths / 12);
        const months = diffInMonths % 12;
        if (months === 0) {
          return `${years} year${years > 1 ? 's' : ''}`;
        } else {
          return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
        }
      }
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Career Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Career Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Career Overview Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Career Overview</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Department:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {careerData.department || (isDemoWorkspace ? 'Information Security' : 'Not available')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Company:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {careerData.companyName || (isDemoWorkspace ? 'Current Company' : 'Not available')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Total Experience:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {careerData.totalExperience || (isDemoWorkspace ? '15+ years' : 'Not available')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Data Fields:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{careerData.totalFields}</span>
              </div>
            </div>
          </div>

          {/* Enrichment Info Card */}
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="font-medium text-[var(--foreground)] mb-3">Enrichment Info</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Last Enriched:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{formatDate(careerData.lastEnrichedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Skills Available:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{careerData.skills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Education Records:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{careerData.education.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--muted)]">Experience Records:</span>
                <span className="text-sm font-medium text-[var(--foreground)]">{careerData.experience.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Position */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Current Position</h3>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-24">Title:</span>
              <InlineEditField
                value={record?.jobTitle || record?.title}
                field="title"
                onSave={onSave || (() => Promise.resolve())}
                recordId={record.id}
                recordType={recordType}
                onSuccess={handleSuccess}
                placeholder="Enter job title"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-24">Company:</span>
              <InlineEditField
                value={careerData.companyName}
                field="company"
                variant="company"
                onSave={onSave || (() => Promise.resolve())}
                recordId={record.id}
                recordType={recordType}
                onSuccess={handleSuccess}
                placeholder="Enter company name"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[var(--muted)] w-24">Department:</span>
              <InlineEditField
                value={careerData.department}
                field="department"
                onSave={onSave || (() => Promise.resolve())}
                recordId={record.id}
                recordType={recordType}
                onSuccess={handleSuccess}
                placeholder="Enter department"
                className="text-sm font-medium text-[var(--foreground)]"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--muted)]">Total Experience:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{careerData.totalExperience}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Experience Timeline */}
      {(careerData.experience.length > 0 || coresignalExperience.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Career Timeline</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <div className="space-y-4">
              {(careerData.experience.length > 0 ? careerData.experience : coresignalExperience).slice(0, 5).map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-[var(--border)] pl-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-[var(--foreground)]">{exp.position_title || exp.title || exp.position || '-'}</h4>
                      <p className="text-sm text-[var(--muted)]">{exp.company_name || exp.company || exp.organization || '-'}</p>
                      {exp.department && exp.department !== 'Other' && (
                        <p className="text-xs text-[var(--muted)]">Department: {exp.department}</p>
                      )}
                      {exp.management_level && (
                        <p className="text-xs text-[var(--muted)]">Level: {exp.management_level}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--muted)]">
                        {exp.date_from ? formatDate(exp.date_from) : 'Unknown'} - {exp.date_to ? formatDate(exp.date_to) : 'Present'}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDuration(exp.date_from, exp.date_to)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Company Details */}
                  {exp.company_industry && (
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      <span className="font-medium">Industry:</span> {exp.company_industry}
                    </div>
                  )}
                  {exp.company_size_range && (
                    <div className="text-xs text-[var(--muted)]">
                      <span className="font-medium">Company Size:</span> {exp.company_size_range}
                    </div>
                  )}
                  {exp.company_employees_count && (
                    <div className="text-xs text-[var(--muted)]">
                      <span className="font-medium">Employees:</span> {exp.company_employees_count.toLocaleString()}
                    </div>
                  )}
                  {exp.company_annual_revenue_source_1 && (
                    <div className="text-xs text-[var(--muted)]">
                      <span className="font-medium">Revenue:</span> ${(exp.company_annual_revenue_source_1 / 1000000).toFixed(1)}M
                    </div>
                  )}
                  {exp.company_hq_full_address && (
                    <div className="text-xs text-[var(--muted)]">
                      <span className="font-medium">Location:</span> {exp.company_hq_full_address}
                    </div>
                  )}
                  {exp.company_founded_year && (
                    <div className="text-xs text-[var(--muted)]">
                      <span className="font-medium">Founded:</span> {exp.company_founded_year}
                    </div>
                  )}
                  
                  {/* Company Keywords/Tags */}
                  {exp.company_categories_and_keywords && exp.company_categories_and_keywords.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-[var(--muted)] mb-1">Company Focus:</p>
                      <div className="flex flex-wrap gap-1">
                        {exp.company_categories_and_keywords.slice(0, 8).map((keyword: string, keyIndex: number) => (
                          <span key={keyIndex} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[var(--hover)] text-gray-700">
                            {keyword}
                          </span>
                        ))}
                        {exp.company_categories_and_keywords.length > 8 && (
                          <span className="text-xs text-[var(--muted)]">+{exp.company_categories_and_keywords.length - 8} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {exp.description && (
                    <p className="text-sm text-[var(--muted)] mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skills & Expertise */}
      {careerData.skills.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Skills & Expertise</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <div className="flex flex-wrap gap-2">
              {careerData.skills.map((skill: string, index: number) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Education */}
      {careerData.education.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Education</h3>
          <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <div className="space-y-3">
              {careerData.education.map((edu: any, index: number) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)]">{edu.degree || edu.qualification || '-'}</h4>
                    <p className="text-sm text-[var(--muted)]">{edu.institution_name || edu.institution || edu.school || '-'}</p>
                    {edu.field_of_study && (
                      <p className="text-sm text-[var(--muted)]">{edu.field_of_study}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--muted)]">
                      {formatDate(edu.date_from_year)} - {edu.date_to_year ? formatDate(edu.date_to_year) : 'Present'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}