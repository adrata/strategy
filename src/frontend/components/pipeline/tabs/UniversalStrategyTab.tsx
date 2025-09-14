import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';

interface UniversalStrategyTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string) => Promise<void>;
}

export function UniversalStrategyTab({ record, recordType, onSave }: UniversalStrategyTabProps) {
  // Defensive programming - handle undefined record
  if (!record) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Strategy Information</h3>
          <p className="text-gray-600">Please wait while we load the strategy data...</p>
        </div>
      </div>
    );
  }
  
  const handleInlineSave = async (field: string, value: string) => {
    if (onSave) {
      return onSave(field, value);
    } else {
      console.warn('onSave function not provided to UniversalStrategyTab');
    }
  };

  return (
    <div className="space-y-8">
      {/* Pain Points & Challenges */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pain Points & Challenges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Primary Pain Point</label>
            <InlineEditField
              value={record?.primaryPainPoint || ''}
              field="primaryPainPoint"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter primary pain point"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Secondary Pain Point</label>
            <InlineEditField
              value={record?.secondaryPainPoint || ''}
              field="secondaryPainPoint"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter secondary pain point"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Business Impact</label>
            <InlineEditField
              value={record?.businessImpact || ''}
              field="businessImpact"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter business impact"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Urgency Level</label>
            <InlineEditField
              value={record?.urgencyLevel || ''}
              field="urgencyLevel"
              recordId={record?.id || ''}
              recordType="universal"
              inputType="select"
              options={[
                { value: '', label: 'Select Urgency' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' }
              ]}
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Value Propositions & Benefits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Value Propositions & Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Primary Value Prop</label>
            <InlineEditField
              value={record?.primaryValueProp || ''}
              field="primaryValueProp"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter primary value proposition"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Secondary Value Prop</label>
            <InlineEditField
              value={record?.secondaryValueProp || ''}
              field="secondaryValueProp"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter secondary value proposition"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ROI Potential</label>
            <InlineEditField
              value={record?.roiPotential || ''}
              field="roiPotential"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter ROI potential"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Competitive Advantage</label>
            <InlineEditField
              value={record?.competitiveAdvantage || ''}
              field="competitiveAdvantage"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter competitive advantage"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Positioning & Messaging */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Positioning & Messaging</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Key Message</label>
            <InlineEditField
              value={record?.keyMessage || ''}
              field="keyMessage"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter key message"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Opening Line</label>
            <InlineEditField
              value={record?.openingLine || ''}
              field="openingLine"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter opening line"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Objection Handling</label>
            <InlineEditField
              value={record?.objectionHandling || ''}
              field="objectionHandling"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter objection handling strategy"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Next Steps</label>
            <InlineEditField
              value={record?.strategyNextSteps || ''}
              field="strategyNextSteps"
              recordId={record?.id || ''}
              recordType="universal"
              placeholder="Enter next steps"
              onSave={handleInlineSave}
              className="text-sm text-gray-800 font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}