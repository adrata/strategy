"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface UniversalCareerTabProps {
  recordType: string;
  record?: any;
}

export function UniversalCareerTab({ recordType, record: recordProp }: UniversalCareerTabProps) {
  const { currentRecord: contextRecord } = useRecordContext();
  const record = recordProp || contextRecord;

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
  const coresignalData = record?.customFields?.coresignal || {};
  const coresignalProfile = record?.customFields?.coresignalProfile || {};
  const enrichedData = record?.customFields?.enrichedData?.career || {};
  const rawData = record?.customFields?.rawData || {};
  
  // Extract CoreSignal data from the correct location
  const coresignalExperience = coresignalData?.experience || coresignalProfile?.experience || [];
  const coresignalSkills = coresignalData?.skills || coresignalProfile?.skills || [];
  const coresignalEducation = coresignalData?.education || coresignalProfile?.education || [];
  const coresignalTotalExperience = coresignalData?.totalExperienceMonths || coresignalProfile?.totalExperienceMonths || 0;
  
  // Use CoreSignal data with fallbacks to record data
  const careerData = {
    department: coresignalData.department || record?.department || '-',
    companyName: coresignalData.companyName || record?.company?.name || record?.companyName || '-',
    totalExperience: coresignalTotalExperience > 0 ? `${Math.floor(coresignalTotalExperience / 12)} years` : '-',
    education: coresignalEducation || [],
    skills: coresignalSkills || [],
    experience: coresignalExperience || [],
    totalFields: coresignalData.totalFields || 0,
    lastEnrichedAt: coresignalData.lastEnrichedAt || record?.updatedAt || '-'
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
    <div className="space-y-8">
      {/* Career Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Career Overview Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Career Overview</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Experience:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.totalExperience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Fields:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.totalFields}</span>
              </div>
            </div>
          </div>

          {/* Enrichment Info Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Enrichment Info</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Enriched:</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(careerData.lastEnrichedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Skills Available:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.skills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Education Records:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.education.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Experience Records:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.experience.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Position */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Position</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Title:</span>
              <span className="text-sm font-medium text-gray-900">{record?.jobTitle || record?.title || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Company:</span>
              <span className="text-sm font-medium text-gray-900">{careerData.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Department:</span>
              <span className="text-sm font-medium text-gray-900">{careerData.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Experience:</span>
              <span className="text-sm font-medium text-gray-900">{careerData.totalExperience}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Company Intelligence */}
      {coresignalExperience.length > 0 && coresignalExperience[0].company_name && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Intelligence</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            {(() => {
              const exp = coresignalExperience[0];
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Industry:</span>
                      <p className="text-sm font-medium text-gray-900">{exp.company_industry || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Company Size:</span>
                      <p className="text-sm font-medium text-gray-900">{exp.company_size_range || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Employees:</span>
                      <p className="text-sm font-medium text-gray-900">{exp.company_employees_count ? exp.company_employees_count.toLocaleString() : '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Founded:</span>
                      <p className="text-sm font-medium text-gray-900">{exp.company_founded_year || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <p className="text-sm font-medium text-gray-900">
                        {exp.company_annual_revenue_source_1 ? `$${(exp.company_annual_revenue_source_1 / 1000000).toFixed(1)}M` : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Location:</span>
                      <p className="text-sm font-medium text-gray-900">{exp.company_hq_city}, {exp.company_hq_state}</p>
                    </div>
                  </div>
                  
                  {exp.company_categories_and_keywords && exp.company_categories_and_keywords.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 mb-2 block">Company Focus Areas:</span>
                      <div className="flex flex-wrap gap-1">
                        {exp.company_categories_and_keywords.slice(0, 10).map((keyword: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {keyword}
                          </span>
                        ))}
                        {exp.company_categories_and_keywords.length > 10 && (
                          <span className="text-xs text-gray-400">+{exp.company_categories_and_keywords.length - 10} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Skills & Expertise */}
      {careerData.skills.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
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

      {/* Experience Timeline */}
      {(careerData.experience.length > 0 || coresignalExperience.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Timeline</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {(careerData.experience.length > 0 ? careerData.experience : coresignalExperience).slice(0, 5).map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{exp.position_title || exp.title || exp.position || '-'}</h4>
                      <p className="text-sm text-gray-600">{exp.company_name || exp.company || exp.organization || '-'}</p>
                      {exp.department && exp.department !== 'Other' && (
                        <p className="text-xs text-gray-500">Department: {exp.department}</p>
                      )}
                      {exp.management_level && (
                        <p className="text-xs text-gray-500">Level: {exp.management_level}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {exp.date_from ? formatDate(exp.date_from) : 'Unknown'} - {exp.date_to ? formatDate(exp.date_to) : 'Present'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDuration(exp.date_from, exp.date_to)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Company Details */}
                  {exp.company_industry && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Industry:</span> {exp.company_industry}
                    </div>
                  )}
                  {exp.company_size_range && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Company Size:</span> {exp.company_size_range}
                    </div>
                  )}
                  {exp.company_employees_count && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Employees:</span> {exp.company_employees_count.toLocaleString()}
                    </div>
                  )}
                  {exp.company_annual_revenue_source_1 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Revenue:</span> ${(exp.company_annual_revenue_source_1 / 1000000).toFixed(1)}M
                    </div>
                  )}
                  {exp.company_hq_full_address && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Location:</span> {exp.company_hq_full_address}
                    </div>
                  )}
                  {exp.company_founded_year && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Founded:</span> {exp.company_founded_year}
                    </div>
                  )}
                  
                  {/* Company Keywords/Tags */}
                  {exp.company_categories_and_keywords && exp.company_categories_and_keywords.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Company Focus:</p>
                      <div className="flex flex-wrap gap-1">
                        {exp.company_categories_and_keywords.slice(0, 8).map((keyword: string, keyIndex: number) => (
                          <span key={keyIndex} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {keyword}
                          </span>
                        ))}
                        {exp.company_categories_and_keywords.length > 8 && (
                          <span className="text-xs text-gray-400">+{exp.company_categories_and_keywords.length - 8} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Education */}
      {careerData.education.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="space-y-3">
              {careerData.education.map((edu: any, index: number) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{edu.degree || edu.qualification || '-'}</h4>
                    <p className="text-sm text-gray-600">{edu.institution || edu.school || '-'}</p>
                    {edu.field_of_study && (
                      <p className="text-sm text-gray-500">{edu.field_of_study}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Present'}
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