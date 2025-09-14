import React from 'react';

interface LeadPageProps {
  params: {
    scenarioSlug: string;
    slug: string;
  };
}

interface DemoLead {
  id: string;
  fullName: string;
  jobTitle: string;
  company: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  department?: string;
  status?: string;
  source?: string;
  createdAt: string;
  notes?: string;
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { scenarioSlug, slug } = await params;
  
  // Handle both ULID format (26 chars starting with 01) and slug format (name-ulid)
  let leadId;
  if (slug['length'] === 26 && slug.startsWith('01')) {
    // Direct ULID format
    leadId = slug;
  } else {
    // Slug format (name-ulid) - extract the ULID from the end
    const parts = slug.split('-');
    if (parts.length >= 2) {
      // The last part should be the ULID
      const potentialUlid = parts[parts.length - 1];
      if (potentialUlid['length'] === 26 && potentialUlid.startsWith('01')) {
        leadId = potentialUlid;
      } else {
        // Try to find a ULID in the slug
        const ulidMatch = slug.match(/([0-9A-HJKMNP-TV-Z]{26})/);
        if (ulidMatch) {
          leadId = ulidMatch[1];
        } else {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Lead ID</h1>
                <p className="text-gray-600 mb-6">The lead ID format is invalid.</p>
              </div>
            </div>
          );
        }
      }
    } else {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Lead ID</h1>
            <p className="text-gray-600 mb-6">The lead ID format is invalid.</p>
          </div>
        </div>
      );
    }
  }

  console.log(`🔍 [DEMO LEAD PAGE] Loading lead with ID: ${leadId}`);

  // Fetch lead data from API
  let lead: DemoLead | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${process['env']['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'}/api/demo-scenarios/leads/${leadId}`);
    const data = await response.json();

    if (data['success'] && data.lead) {
      lead = data.lead;
      console.log(`✅ [DEMO LEAD PAGE] Lead loaded: ${data.lead.fullName}`);
    } else {
      error = data.error || 'Lead not found';
      console.log(`❌ [DEMO LEAD PAGE] Failed to load lead: ${data.error}`);
    }
  } catch (fetchError) {
    console.error('❌ [DEMO LEAD PAGE] Error loading lead:', fetchError);
    error = 'Failed to load lead';
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h1>
          <p className="text-gray-600 mb-6">The lead you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.fullName}</h1>
              <p className="text-gray-600">{lead.jobTitle} at {lead.company}</p>
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {lead['email'] && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{lead.email}</p>
                </div>
              )}
              {lead['phone'] && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{lead.phone}</p>
                </div>
              )}
              {lead['linkedinUrl'] && (
                <div>
                  <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                  <a 
                    href={lead.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600 underline"
                  >
                    View Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lead Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-gray-900">{lead.company}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-gray-900">{lead.department || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{lead.status || 'Active'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <p className="text-gray-900">{lead.source || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{new Date(lead.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {lead['notes'] && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}