"use client";

import React from 'react';
import { useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { CompanyDetailSkeleton } from '@/platform/ui/components/Loader';

interface UniversalCareerTabProps {
  recordType: string;
  record?: any;
  onSave?: (field: string, value: any, recordId: string) => Promise<void>;
}

export function UniversalCareerTab({ recordType, record: recordProp, onSave }: UniversalCareerTabProps) {
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
      coresignalData: record?.customFields?.coresignalData
    });
  }

  // Extract career data from CoreSignal and other sources
  const coresignalData = record?.customFields?.coresignalData || {};
  
  // Safely extract company name - handle both string and object formats
  const getCompanyName = (company: any): string => {
    if (typeof company === 'string') return company;
    if (company && typeof company === 'object') {
      return company.name || company.companyName || 'Unknown Company';
    }
    return 'Unknown Company';
  };
  
  const careerData = {
    currentRole: record.jobTitle || record.title || 'Unknown Title',
    currentCompany: getCompanyName(record.company),
    department: record.department || 'Unknown Department',
    seniority: record.seniority || 'Unknown',
    yearsInRole: coresignalData.years_in_current_role || 'Unknown',
    yearsAtCompany: coresignalData.years_at_company || 'Unknown',
    totalExperience: coresignalData.total_years_experience || 'Unknown',
    education: coresignalData.education || [],
    skills: coresignalData.skills || [],
    certifications: coresignalData.certifications || [],
    careerTimeline: coresignalData.career_timeline || [],
    previousRoles: coresignalData.previous_roles || [],
    industryExperience: coresignalData.industry_experience || 'Unknown',
    leadershipExperience: coresignalData.leadership_experience || 'Unknown',
    teamSize: coresignalData.team_size_managed || 'Unknown',
    budgetResponsibility: coresignalData.budget_responsibility || 'Unknown',
    achievements: coresignalData.achievements || [],
    publications: coresignalData.publications || [],
    speakingEngagements: coresignalData.speaking_engagements || [],
    awards: coresignalData.awards || []
  };

  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatDuration = (startDate: string, endDate?: string): string => {
    if (!startDate) return 'Unknown';
    
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      
      if (diffInMonths < 12) {
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
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-8">
      {/* Career Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Summary</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Current Position</h4>
              <div className="text-sm text-blue-800">
                <div className="font-medium">{careerData.currentRole}</div>
                <div className="text-blue-600">{careerData.currentCompany}</div>
                <div className="text-blue-600">{careerData.department}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Experience</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Years in Role: {careerData.yearsInRole}</div>
                <div>Years at Company: {careerData.yearsAtCompany}</div>
                <div>Total Experience: {careerData.totalExperience}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Leadership</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Team Size: {careerData.teamSize}</div>
                <div>Budget: {careerData.budgetResponsibility}</div>
                <div>Leadership: {careerData.leadershipExperience}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Career Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Timeline</h3>
        {careerData.careerTimeline.length > 0 ? (
          <div className="space-y-4">
            {careerData.careerTimeline.map((role: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{role.title || 'Unknown Title'}</h4>
                        <div className="text-sm text-gray-600">{getCompanyName(role.company)}</div>
                      </div>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {formatDuration(role.start_date, role.end_date)}
                      </div>
                      {role.description && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Description:</span> {role.description}
                        </div>
                      )}
                      {role.location && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {role.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{formatDate(role.start_date)}</div>
                    <div>{role.end_date ? formatDate(role.end_date) : 'Present'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No career timeline data available</p>
            <p className="text-xs text-gray-400 mt-1">Career history will appear here when available</p>
          </div>
        )}
      </div>

      {/* Education & Certifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Education & Certifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Education</h4>
            {careerData.education.length > 0 ? (
              <div className="space-y-3">
                {careerData.education.map((edu: any, index: number) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-gray-900">{edu.degree || 'Unknown Degree'}</div>
                    <div className="text-gray-600">{edu.institution || 'Unknown Institution'}</div>
                    {edu.year && <div className="text-gray-500">{edu.year}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No education data available</div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Certifications</h4>
            {careerData.certifications.length > 0 ? (
              <div className="space-y-3">
                {careerData.certifications.map((cert: any, index: number) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-gray-900">{cert.name || 'Unknown Certification'}</div>
                    <div className="text-gray-600">{cert.issuer || 'Unknown Issuer'}</div>
                    {cert.date && <div className="text-gray-500">{formatDate(cert.date)}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No certifications available</div>
            )}
          </div>
        </div>
      </div>

      {/* Skills & Expertise */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          {careerData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {careerData.skills.map((skill: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No skills data available</div>
          )}
        </div>
      </div>

      {/* Achievements & Recognition */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements & Recognition</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Achievements</h4>
            {careerData.achievements.length > 0 ? (
              <div className="space-y-2">
                {careerData.achievements.map((achievement: string, index: number) => (
                  <div key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {achievement}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No achievements data available</div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Awards</h4>
            {careerData.awards.length > 0 ? (
              <div className="space-y-2">
                {careerData.awards.map((award: any, index: number) => (
                  <div key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-yellow-500 mr-2">🏆</span>
                    <div>
                      <div className="font-medium">{award.name || 'Unknown Award'}</div>
                      {award.year && <div className="text-gray-500">{award.year}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No awards data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Activities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Activities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Publications</h4>
            {careerData.publications.length > 0 ? (
              <div className="space-y-2">
                {careerData.publications.map((pub: any, index: number) => (
                  <div key={index} className="text-sm text-gray-700">
                    <div className="font-medium">{pub.title || 'Unknown Title'}</div>
                    {pub.publication && <div className="text-gray-600">{pub.publication}</div>}
                    {pub.date && <div className="text-gray-500">{formatDate(pub.date)}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No publications available</div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Speaking Engagements</h4>
            {careerData.speakingEngagements.length > 0 ? (
              <div className="space-y-2">
                {careerData.speakingEngagements.map((event: any, index: number) => (
                  <div key={index} className="text-sm text-gray-700">
                    <div className="font-medium">{event.title || 'Unknown Event'}</div>
                    {event.organization && <div className="text-gray-600">{event.organization}</div>}
                    {event.date && <div className="text-gray-500">{formatDate(event.date)}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No speaking engagements available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}