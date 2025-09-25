import React from 'react';

// Universal tab components for record templates
export { UniversalOverviewTab } from './UniversalOverviewTab';
export { UniversalInsightsTab } from './UniversalInsightsTab';
export { UniversalCompanyTab } from './UniversalCompanyTab';
export { UniversalProfileTab } from './UniversalProfileTab';
export { UniversalPainValueTab } from './UniversalPainValueTab';
export { UniversalTimelineTab } from './UniversalTimelineTab';
export { UniversalIndustryIntelTab } from './UniversalIndustryIntelTab';
export { UniversalOutreachTab } from './UniversalOutreachTab';
export { UniversalEngagementTab } from './UniversalEngagementTab';
export { UniversalDealIntelTab } from './UniversalDealIntelTab';
export { UniversalCompanyIntelTab } from './UniversalCompanyIntelTab';
export { UniversalClosePlanTab } from './UniversalClosePlanTab';
export { UniversalCompetitiveTab } from './UniversalCompetitiveTab';
export { UniversalRelationshipTab } from './UniversalRelationshipTab';
export { UniversalPersonalTab } from './UniversalPersonalTab';
export { UniversalBusinessTab } from './UniversalBusinessTab';
export { UniversalSuccessTab } from './UniversalSuccessTab';
export { UniversalPartnershipTab } from './UniversalPartnershipTab';
export { UniversalCollaborationTab } from './UniversalCollaborationTab';
export { UniversalPerformanceTab } from './UniversalPerformanceTab';
export { UniversalStakeholdersTab } from './UniversalStakeholdersTab';
export { UniversalDocumentsTab } from './UniversalDocumentsTab';
export { UniversalStrategyTab } from './UniversalStrategyTab';
export { UniversalContactsTab } from './UniversalContactsTab';
export { UniversalBuyerGroupsTab } from './UniversalBuyerGroupsTab';
export { UniversalBuyerGroupTab } from './UniversalBuyerGroupTab';
export { UniversalCompetitorsTab } from './UniversalCompetitorsTab';
export { UniversalIndustryTab } from './UniversalIndustryTab';
export { UniversalSellerCompaniesTab } from './UniversalSellerCompaniesTab';
export { UniversalCareerTab } from './UniversalCareerTab';

// Placeholder components for tabs that don't exist yet

export function UniversalLandminesTab({ record, recordType }: { record: any; recordType: string }) {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Landmines & Risks</h3>
        <p className="text-gray-600">Risk assessment and potential issues coming soon</p>
      </div>
    </div>
  );
}


export function UniversalOpportunitiesTab({ record, recordType }: { record: any; recordType: string }) {
  const opportunities = record?.opportunities || [];
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Opportunities</h2>
        <p className="text-gray-600">Sales opportunities associated with this {recordType === 'companies' ? 'company' : recordType.slice(0, -1)}</p>
      </div>

      {opportunities['length'] === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
          <p className="text-gray-600">Create opportunities to track potential deals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp: any, index: number) => (
            <div key={opp.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">{opp.name || 'Untitled Opportunity'}</h4>
                <div className="flex flex-col items-end space-y-1">
                  <span className="px-4 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                    {opp.stage || 'Discovery'}
                  </span>
                  {opp['priority'] && (
                    <span className={`px-4 py-1 text-xs rounded-full whitespace-nowrap ${
                      opp['priority'] === 'high' ? 'bg-red-100 text-red-800' :
                      opp['priority'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {opp.priority}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">
                ${(opp.amount || 0).toLocaleString()}
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  Expected close: {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : 'TBD'}
                </p>
                {opp['probability'] && (
                  <p>Probability: {Math.round(opp.probability * 100)}%</p>
                )}
                {opp['source'] && (
                  <p>Source: {opp.source}</p>
                )}
                {opp['nextSteps'] && (
                  <p className="text-xs text-gray-500">Next: {opp.nextSteps}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

