import React from 'react';

interface UniversalStakeholdersTabProps {
  record: any;
  recordType: string;
}

export function UniversalStakeholdersTab({ record, recordType }: UniversalStakeholdersTabProps) {
  // Enhanced data extraction with better error handling
  let stakeholders: any[] = [];
  
  try {
    // For opportunities, prioritize stakeholders field, then fallback to contacts
    if (recordType === 'opportunities') {
      stakeholders = record?.stakeholders || record?.contacts || [];
    } else {
      // For other record types, prioritize contacts field
      stakeholders = record?.contacts || record?.stakeholders || [];
    }
    
    // Ensure stakeholders is always an array
    if (!Array.isArray(stakeholders)) {
      stakeholders = [];
    }
  } catch (error) {
    console.error(`👥 [STAKEHOLDERS] Error extracting stakeholders data:`, error);
    stakeholders = [];
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Stakeholders</h2>
        <p className="text-gray-600">People involved in this opportunity</p>
      </div>

      {stakeholders['length'] === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stakeholders yet</h3>
          <p className="text-gray-600">Add stakeholders to track who's involved in this opportunity</p>
          
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Stakeholder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholders.map((stakeholder: any, index: number) => (
            <div key={stakeholder.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {(stakeholder.name || stakeholder.firstName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {stakeholder.name || `${stakeholder.firstName || ''} ${stakeholder.lastName || ''}`.trim() || 'Unknown'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {stakeholder.title || stakeholder.role || 'Stakeholder'}
                  </p>
                  {stakeholder['email'] && (
                    <p className="text-sm text-blue-600">{stakeholder.email}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
