import React from 'react';

interface OpportunityPageProps {
  params: {
    scenarioSlug: string;
    slug: string;
  };
}

interface DemoOpportunity {
  id: string;
  name: string;
  company: string;
  value?: number;
  stage?: string;
  probability?: number;
  closeDate?: string;
  createdAt: string;
  notes?: string;
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { scenarioSlug, slug } = await params;
  
  // Handle both ULID format (26 chars starting with 01) and slug format (name-ulid)
  let opportunityId;
  if (slug['length'] === 26 && slug.startsWith('01')) {
    // Direct ULID format
    opportunityId = slug;
  } else {
    // Slug format (name-ulid) - extract the ULID from the end
    const parts = slug.split('-');
    if (parts.length >= 2) {
      // The last part should be the ULID
      const potentialUlid = parts[parts.length - 1];
      if (potentialUlid['length'] === 26 && potentialUlid.startsWith('01')) {
        opportunityId = potentialUlid;
      } else {
        // Try to find a ULID in the slug
        const ulidMatch = slug.match(/([0-9A-HJKMNP-TV-Z]{26})/);
        if (ulidMatch) {
          opportunityId = ulidMatch[1];
        } else {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Opportunity ID</h1>
                <p className="text-gray-600 mb-6">The opportunity ID format is invalid.</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Opportunity ID</h1>
            <p className="text-gray-600 mb-6">The opportunity ID format is invalid.</p>
          </div>
        </div>
      );
    }
  }

  console.log(`🔍 [DEMO OPPORTUNITY PAGE] Loading opportunity with ID: ${opportunityId}`);

  // Fetch opportunity data from API
  let opportunity: DemoOpportunity | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${process['env']['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'}/api/demo-scenarios/opportunities/${opportunityId}`);
    const data = await response.json();

    if (data['success'] && data.opportunity) {
      opportunity = data.opportunity;
      console.log(`✅ [DEMO OPPORTUNITY PAGE] Opportunity loaded: ${data.opportunity.name}`);
    } else {
      error = data.error || 'Opportunity not found';
      console.log(`❌ [DEMO OPPORTUNITY PAGE] Failed to load opportunity: ${data.error}`);
    }
  } catch (fetchError) {
    console.error('❌ [DEMO OPPORTUNITY PAGE] Error loading opportunity:', fetchError);
    error = 'Failed to load opportunity';
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

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Not Found</h1>
          <p className="text-gray-600 mb-6">The opportunity you're looking for doesn't exist.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">{opportunity.name}</h1>
              <p className="text-gray-600">{opportunity.company}</p>
            </div>
          </div>
        </div>

        {/* Opportunity Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opportunity Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-gray-900">{opportunity.company}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Stage</label>
                <p className="text-gray-900">{opportunity.stage || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Probability</label>
                <p className="text-gray-900">{opportunity.probability ? `${opportunity.probability}%` : 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{new Date(opportunity.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Value</label>
                <p className="text-gray-900">
                  {opportunity.value ? `$${opportunity.value.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Close Date</label>
                <p className="text-gray-900">
                  {opportunity.closeDate ? new Date(opportunity.closeDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {opportunity['notes'] && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{opportunity.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}