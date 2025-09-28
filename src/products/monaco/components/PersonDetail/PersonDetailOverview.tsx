import React from "react";
import { Person } from "../../types";
import { InlineEditField } from "@/frontend/components/pipeline/InlineEditField";

interface PersonDetailOverviewProps {
  person: Person;
  getStatusColor: (status: string) => string;
  onCompanyClick?: (companyName: string) => void;
  onSave?: (field: string, value: string, recordId: string, recordType: string) => Promise<void>;
}

export function PersonDetailOverview({
  person,
  getStatusColor,
  onCompanyClick,
  onSave,
}: PersonDetailOverviewProps) {
  // Extract enriched data from customFields
  const customFields = (person as any).customFields || {};
  const coresignalData = customFields.coresignalData || {};
  const buyerGroupRole = customFields.buyerGroupRole || 'Stakeholder';
  const influenceLevel = customFields.influenceLevel || 'Medium';
  const engagementPriority = customFields.engagementPriority || 'Medium';
  
  // Get CoreSignal profile data
  const fullName = coresignalData.full_name || person.fullName || 'Unknown';
  const jobTitle = coresignalData.active_experience_title || coresignalData.title || person.jobTitle || 'Unknown Title';
  const email = coresignalData.primary_professional_email || coresignalData.email || person.email || 'No email';
  const phone = coresignalData.phone || person.phone || 'No phone';
  const linkedinUrl = coresignalData.linkedin_url || person.linkedinUrl || 'No LinkedIn';
  const location = coresignalData.location || person.city || 'Unknown Location';
  const companyName = coresignalData.active_experience_company || person.company || 'Unknown Company';
  
  // Get experience and education data
  const experience = coresignalData.experience || [];
  const education = coresignalData.education || [];
  const skills = coresignalData.skills || [];
  
  // Get enrichment metadata
  const lastEnriched = customFields.lastEnriched;
  const enrichmentSource = customFields.enrichmentSource || 'Unknown';
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Default save handler if none provided
  const handleSave = onSave || (async (field: string, value: string, recordId: string, recordType: string) => {
    console.log(`🔄 [MONACO PERSON] Saving ${field} = ${value} for ${recordType} ${recordId}`);
    // TODO: Implement actual save logic for Monaco person records
  });

  return (
    <div className="space-y-6">
      {/* Person Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Person Summary</h3>
        <div className="text-sm text-gray-600 leading-relaxed">
          {fullName} is a {jobTitle} at {companyName}. 
          As a {buyerGroupRole} with {influenceLevel.toLowerCase()} influence, they play a key role in decision-making processes.
          {lastEnriched && ` Last enriched: ${formatDate(lastEnriched)} via ${enrichmentSource}.`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <div className="font-medium">
                <InlineEditField
                  value={fullName}
                  field="fullName"
                  recordId={person.id || ''}
                  recordType="people"
                  placeholder="Enter full name"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <div className="font-medium">
                <InlineEditField
                  value={email}
                  field="email"
                  recordId={person.id || ''}
                  recordType="people"
                  inputType="email"
                  placeholder="Enter email address"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <div className="font-medium">
                <InlineEditField
                  value={phone}
                  field="phone"
                  recordId={person.id || ''}
                  recordType="people"
                  inputType="tel"
                  placeholder="Enter phone number"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">LinkedIn</label>
              <div className="font-medium">
                <InlineEditField
                  value={linkedinUrl}
                  field="linkedinUrl"
                  recordId={person.id || ''}
                  recordType="people"
                  placeholder="Enter LinkedIn URL"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Location</label>
              <div className="font-medium">
                <InlineEditField
                  value={location}
                  field="city"
                  recordId={person.id || ''}
                  recordType="people"
                  placeholder="Enter location"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Professional Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Job Title</label>
              <div className="font-medium">
                <InlineEditField
                  value={jobTitle}
                  field="jobTitle"
                  recordId={person.id || ''}
                  recordType="people"
                  placeholder="Enter job title"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Company</label>
              <div className="font-medium">
                <InlineEditField
                  value={companyName}
                  field="company"
                  recordId={person.id || ''}
                  recordType="people"
                  placeholder="Enter company name"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Buyer Group Role</label>
              <div className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(buyerGroupRole)}`}>
                  {buyerGroupRole}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Influence Level</label>
              <div className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(influenceLevel)}`}>
                  {influenceLevel}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Engagement Priority</label>
              <div className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(engagementPriority)}`}>
                  {engagementPriority}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience History */}
      {experience.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Experience History</h3>
          <div className="space-y-3">
            {experience.slice(0, 3).map((exp: any, index: number) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4">
                <div className="font-medium">{exp.title || 'Unknown Title'}</div>
                <div className="text-sm text-gray-600">{exp.company_name || 'Unknown Company'}</div>
                <div className="text-xs text-gray-500">
                  {exp.start_date && exp.end_date 
                    ? `${exp.start_date} - ${exp.end_date}`
                    : exp.start_date || 'Current'
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 10).map((skill: string, index: number) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enrichment Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Data Enrichment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Enrichment Source</label>
            <div className="font-medium">{enrichmentSource}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Last Enriched</label>
            <div className="font-medium">{lastEnriched ? formatDate(lastEnriched) : 'Never'}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">CoreSignal ID</label>
            <div className="font-medium">{customFields.coresignalId || 'Not available'}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Data Quality</label>
            <div className="font-medium">
              {coresignalData.full_name ? 'High' : 'Basic'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


