import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';

interface UniversalStakeholdersTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId?: string, recordType?: string) => Promise<void>;
}

export function UniversalStakeholdersTab({ record, recordType, onSave }: UniversalStakeholdersTabProps) {
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

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
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Stakeholders</h2>
        <p className="text-[var(--muted)]">People involved in this opportunity</p>
      </div>

      {stakeholders['length'] === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No stakeholders yet</h3>
          <p className="text-[var(--muted)]">Add stakeholders to track who's involved in this opportunity</p>
          
          <button className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            Add Stakeholder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholders.map((stakeholder: any, index: number) => (
            <div key={stakeholder.id || index} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {(stakeholder.name || stakeholder.firstName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <InlineEditField
                    value={stakeholder.name || `${stakeholder.firstName || ''} ${stakeholder.lastName || ''}`.trim()}
                    field="name"
                    onSave={onSave}
                    recordId={stakeholder.id}
                    recordType="stakeholder"
                    onSuccess={handleSuccess}
                    placeholder="Enter stakeholder name"
                    className="font-medium text-[var(--foreground)]"
                  />
                  <InlineEditField
                    value={stakeholder.title || stakeholder.role}
                    field="title"
                    onSave={onSave}
                    recordId={stakeholder.id}
                    recordType="stakeholder"
                    onSuccess={handleSuccess}
                    placeholder="Enter stakeholder title"
                    className="text-sm text-[var(--muted)]"
                  />
                  <InlineEditField
                    value={stakeholder.email}
                    field="email"
                    onSave={onSave}
                    recordId={stakeholder.id}
                    recordType="stakeholder"
                    onSuccess={handleSuccess}
                    placeholder="Enter stakeholder email"
                    className="text-sm text-blue-600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
