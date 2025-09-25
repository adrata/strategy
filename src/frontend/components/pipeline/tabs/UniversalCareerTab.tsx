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

  // Extract career data from enriched data and CoreSignal
  const coresignalData = record?.customFields?.coresignalData || {};
  const enrichedData = record?.customFields?.enrichedData?.career || {};
  const rawData = record?.customFields?.rawData || {};
  
  // Safely extract company name - handle both string and object formats
  const getCompanyName = (company: any): string => {
    if (typeof company === 'string') return company;
    if (company && typeof company === 'object') {
      return company.name || company.companyName || '-';
    }
    return '-';
  };
  
  const careerData = {
    currentRole: enrichedData.currentRole || record.jobTitle || record.title || '-',
    currentCompany: enrichedData.currentCompany || getCompanyName(record.company),
    department: enrichedData.department || record.department || '-',
    seniority: enrichedData.seniority || record.seniority || '-',
    yearsInRole: enrichedData.yearsInRole || coresignalData.years_in_current_role || 'Unknown',
    yearsAtCompany: enrichedData.yearsAtCompany || coresignalData.years_at_company || 'Unknown',
    totalExperience: enrichedData.totalExperience || coresignalData.total_years_experience || 'Unknown',
    education: enrichedData.education || coresignalData.education || rawData.education || [],
    skills: enrichedData.skills || coresignalData.skills || rawData.inferred_skills || [],
    certifications: enrichedData.certifications || coresignalData.certifications || rawData.courses || [],
    careerTimeline: enrichedData.careerTimeline || coresignalData.career_timeline || rawData.experience || [],
    previousRoles: enrichedData.previousRoles || coresignalData.previous_roles || rawData.experience || [],
    industryExperience: enrichedData.industryExperience || coresignalData.industry_experience || 'Unknown',
    leadershipExperience: enrichedData.leadershipExperience || coresignalData.leadership_experience || 'Unknown',
    teamSize: enrichedData.teamSize || coresignalData.team_size_managed || 'Unknown',
    budgetResponsibility: enrichedData.budgetResponsibility || coresignalData.budget_responsibility || 'Unknown',
    achievements: enrichedData.achievements || coresignalData.achievements || rawData.awards || [],
    publications: enrichedData.publications || coresignalData.publications || rawData.publications || [],
    speakingEngagements: enrichedData.speakingEngagements || coresignalData.speaking_engagements || [],
    awards: enrichedData.awards || coresignalData.awards || rawData.awards || []
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
      {/* Current Position */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Role Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Current Role</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Title:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.currentRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.currentCompany}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Seniority:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.seniority}</span>
              </div>
            </div>
          </div>

          {/* Experience Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Experience</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Years in Role:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.yearsInRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Years at Company:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.yearsAtCompany}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Experience:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.totalExperience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Industry Experience:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.industryExperience}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leadership & Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leadership & Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leadership Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Leadership Profile</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Leadership Experience:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.leadershipExperience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Team Size:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.teamSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Budget Responsibility:</span>
                <span className="text-sm font-medium text-gray-900">{careerData.budgetResponsibility}</span>
              </div>
            </div>
          </div>

          {/* Management Style Card */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Management Style</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Management Approach:</span>
                <span className="text-sm font-medium text-gray-900">Collaborative</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Decision Making:</span>
                <span className="text-sm font-medium text-gray-900">Data-driven</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Communication Style:</span>
                <span className="text-sm font-medium text-gray-900">Direct</span>
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
                        <h4 className="font-medium text-gray-900">{role.title || '-'}</h4>
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
            <h4 className="font-medium text-gray-900 mb-3">Key Achievements</h4>
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
            <h4 className="font-medium text-gray-900 mb-3">Awards & Recognition</h4>
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
                    <div className="font-medium">{pub.title || '-'}</div>
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