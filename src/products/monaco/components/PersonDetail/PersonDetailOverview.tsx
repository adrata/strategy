import React, { useState } from "react";
import { Person } from "../../types";
import { InlineEditField } from "@/frontend/components/pipeline/InlineEditField";
import { authFetch } from "@/platform/api-fetch";

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
  const coresignalData = customFields.coresignalData || customFields.coresignal || {};
  const buyerGroupRole = customFields.buyerGroupRole || 'Stakeholder';
  const influenceLevel = customFields.influenceLevel || 'Medium';
  const engagementPriority = customFields.engagementPriority || 'Medium';
  
  // Get CoreSignal profile data ONLY (no fallbacks to database)
  // Use updatedFields to override with saved values
  const fullName = updatedFields.fullName ?? (coresignalData.full_name || (person as any).fullName || person.name || '-');
  const jobTitle = updatedFields.jobTitle ?? (coresignalData.active_experience_title || coresignalData.headline || (person as any).jobTitle || person.title || '-');
  const email = updatedFields.email ?? (coresignalData.primary_professional_email || (person as any).email || person.email || '-');
  const phone = updatedFields.phone ?? (coresignalData.phone || (person as any).phone || person.phone || '-');
  const linkedinUrl = updatedFields.linkedinUrl ?? (coresignalData.linkedin_url || (person as any).linkedinUrl || person.linkedin || '-');
  const location = updatedFields.city ?? (coresignalData.location_full || coresignalData.location || (person as any).city || person.location || '-');
  
  // Get company name from active experience
  const activeExperience = coresignalData.experience?.find((exp: any) => exp.active_experience === 1) || coresignalData.experience?.[0];
  // Handle case where company is soft-deleted (companyId exists but company relation is null)
  let companyName = updatedFields.company ?? (coresignalData.active_experience_company || activeExperience?.company_name || coresignalData.experience?.[0]?.company_name || person.company || '-');
  if (companyName === '-' && (person as any).companyId) {
    companyName = '(Company Removed)';
  }
  
  // Get department from active experience
  const department = updatedFields.department ?? (coresignalData.active_experience_department || activeExperience?.department || coresignalData.experience?.[0]?.department || person.department || '-');
  
  // Get seniority from active experience
  const seniority = updatedFields.seniority ?? (activeExperience?.management_level || person.seniority || 'Unknown');
  
  // Get experience and education data
  const experience = coresignalData.experience || [];
  const education = coresignalData.education || [];
  const skills = coresignalData.inferred_skills || [];
  
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

  // Local state to track updated fields
  const [updatedFields, setUpdatedFields] = useState<Record<string, any>>({});

  // Save handler that uses authFetch for authenticated API calls
  const handleSave = onSave || (async (field: string, value: string, recordId: string, recordType: string) => {
    try {
      console.log(`🔄 [MONACO PERSON OVERVIEW] Saving ${field} = ${value} for ${recordType} ${recordId}`);
      
      // Use authFetch for authenticated API calls
      const result = await authFetch(`/api/v1/people/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      }, { success: false, error: 'Update failed' });

      if (result?.success) {
        console.log(`✅ [MONACO PERSON OVERVIEW] Successfully updated ${field} for person ${recordId}`);
        
        // Update local state to reflect the change immediately
        setUpdatedFields(prev => ({
          ...prev,
          [field]: value
        }));
      } else {
        throw new Error(result?.error || 'Update failed');
      }
    } catch (error) {
      console.error('❌ [MONACO PERSON OVERVIEW] Error updating person record:', error);
      throw error;
    }
  });

  return (
    <div className="space-y-6">
      {/* Person Summary */}
      <div className="bg-background rounded-lg p-6 border border-border dark:border-border">
        <h3 className="text-lg font-semibold mb-4">Person Summary</h3>
        <div className="text-sm text-muted leading-relaxed">
          {fullName} is a {jobTitle} at {companyName}. 
          As a {buyerGroupRole} with {influenceLevel.toLowerCase()} influence, they play a key role in decision-making processes.
          {lastEnriched && ` Last enriched: ${formatDate(lastEnriched)} via ${enrichmentSource}.`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-background rounded-lg p-6 border border-border dark:border-border">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted">Full Name</label>
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
              <label className="text-sm text-muted">Email</label>
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
              <label className="text-sm text-muted">Phone</label>
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
              <label className="text-sm text-muted">LinkedIn</label>
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
              <label className="text-sm text-muted">Location</label>
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
        <div className="bg-background rounded-lg p-6 border border-border dark:border-border">
          <h3 className="text-lg font-semibold mb-4">Professional Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted">Job Title</label>
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
              <label className="text-sm text-muted">Company</label>
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
              <label className="text-sm text-muted">Department</label>
              <div className="font-medium">
                <InlineEditField
                  value={department}
                  field="department"
                  recordId={person.id || ''}
                  recordType="people"
                  placeholder="Enter department"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted">Seniority Level</label>
              <div className="font-medium">
                <InlineEditField
                  value={seniority}
                  field="seniority"
                  recordId={person.id || ''}
                  recordType="people"
                  placeholder="Enter seniority level"
                  onSave={handleSave}
                  className="text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted">Buyer Group Role</label>
              <div className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(buyerGroupRole)}`}>
                  {buyerGroupRole}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted">Influence Level</label>
              <div className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(influenceLevel)}`}>
                  {influenceLevel}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted">Engagement Priority</label>
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
        <div className="bg-background rounded-lg p-6 border border-border dark:border-border">
          <h3 className="text-lg font-semibold mb-4">Experience History</h3>
          <div className="space-y-3">
            {experience.slice(0, 3).map((exp: any, index: number) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4">
                <div className="font-medium">{exp.position_title || exp.title || 'Unknown Title'}</div>
                <div className="text-sm text-muted">{exp.company_name || 'Unknown Company'}</div>
                <div className="text-xs text-muted">
                  {exp.date_from && exp.date_to 
                    ? `${exp.date_from} - ${exp.date_to}`
                    : exp.date_from || 'Current'
                  }
                </div>
                {exp.description && (
                  <div className="text-xs text-muted mt-1 line-clamp-2">
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-background rounded-lg p-6 border border-border dark:border-border">
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
      <div className="bg-background rounded-lg p-6 border border-border dark:border-border">
        <h3 className="text-lg font-semibold mb-4">Data Enrichment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted">Enrichment Source</label>
            <div className="font-medium">{enrichmentSource}</div>
          </div>
          <div>
            <label className="text-sm text-muted">Last Enriched</label>
            <div className="font-medium">{lastEnriched ? formatDate(lastEnriched) : 'Never'}</div>
          </div>
          <div>
            <label className="text-sm text-muted">CoreSignal ID</label>
            <div className="font-medium">{customFields.coresignalId || 'Not available'}</div>
          </div>
          <div>
            <label className="text-sm text-muted">Data Quality</label>
            <div className="font-medium">
              {coresignalData.full_name ? 'High' : 'Basic'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


