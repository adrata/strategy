import React from 'react';

interface ProspectPageProps {
  params: {
    scenarioSlug: string;
    slug: string;
  };
}

interface DemoProspect {
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

export default async function ProspectPage({ params }: ProspectPageProps) {
  const { scenarioSlug, slug } = await params;
  
  // Handle both ULID format (26 chars starting with 01) and slug format (name-ulid)
  let prospectId;
  if (slug['length'] === 26 && slug.startsWith('01')) {
    // Direct ULID format
    prospectId = slug;
  } else {
    // Slug format (name-ulid) - extract the ULID from the end
    const parts = slug.split('-');
    if (parts.length >= 2) {
      // The last part should be the ULID
      const potentialUlid = parts[parts.length - 1];
      if (potentialUlid['length'] === 26 && potentialUlid.startsWith('01')) {
        prospectId = potentialUlid;
      } else {
        // Try to find a ULID in the slug
        const ulidMatch = slug.match(/([0-9A-HJKMNP-TV-Z]{26})/);
        if (ulidMatch) {
          prospectId = ulidMatch[1];
        } else {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Prospect ID</h1>
                <p className="text-gray-600 mb-6">The prospect ID format is invalid.</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Prospect ID</h1>
            <p className="text-gray-600 mb-6">The prospect ID format is invalid.</p>
          </div>
        </div>
      );
    }
  }

  console.log(`🔍 [DEMO PROSPECT PAGE] Loading prospect with ID: ${prospectId}`);

  // Fetch prospect data from API
  let prospect: DemoProspect | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${process['env']['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'}/api/demo-scenarios/prospects/${prospectId}`);
    const data = await response.json();

    if (data['success'] && data.prospect) {
      prospect = data.prospect;
      console.log(`✅ [DEMO PROSPECT PAGE] Prospect loaded: ${data.prospect.fullName}`);
    } else {
      error = data.error || 'Prospect not found';
      console.log(`❌ [DEMO PROSPECT PAGE] Failed to load prospect: ${data.error}`);
    }
  } catch (fetchError) {
    console.error('❌ [DEMO PROSPECT PAGE] Error loading prospect:', fetchError);
    error = 'Failed to load prospect';
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

  if (!prospect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Prospect Not Found</h1>
          <p className="text-gray-600 mb-6">The prospect you're looking for doesn't exist.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">{prospect.fullName}</h1>
              <p className="text-gray-600">{prospect.jobTitle} at {prospect.company}</p>
            </div>
          </div>
        </div>

        {/* Prospect Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {prospect['email'] && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{prospect.email}</p>
                </div>
              )}
              {prospect['phone'] && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{prospect.phone}</p>
                </div>
              )}
              {prospect['linkedinUrl'] && (
                <div>
                  <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                  <a 
                    href={prospect.linkedinUrl} 
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

          {/* Prospect Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prospect Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-gray-900">{prospect.company}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-gray-900">{prospect.department || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{prospect.status || 'Active'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <p className="text-gray-900">{prospect.source || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{new Date(prospect.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {prospect['notes'] && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{prospect.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}