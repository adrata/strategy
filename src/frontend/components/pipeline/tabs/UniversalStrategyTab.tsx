import React, { useState } from 'react';
import { InlineEditField } from '../InlineEditField';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  TagIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';

interface UniversalStrategyTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string, recordId: string, recordType: string) => Promise<void>;
}

export function UniversalStrategyTab({ record, recordType, onSave }: UniversalStrategyTabProps) {
  const [isEditingNextAction, setIsEditingNextAction] = useState(false);

  // Defensive programming - handle undefined record
  if (!record) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">Loading Strategy Information</h3>
          <p className="text-muted">Please wait while we load the strategy data...</p>
        </div>
      </div>
    );
  }
  
  const handleSave = onSave || (async (field: string, value: string, recordId: string, recordType: string) => {
    console.log(`🔄 [UNIVERSAL-STRATEGY] Saving ${field} for ${recordType}:`, recordId, 'to:', value);
    // TODO: Implement actual save logic
  });

  // Create a wrapper function that adapts the signature for InlineEditField
  const handleInlineSave = async (field: string, value: string) => {
    return handleSave(field, value, record?.id || '', recordType);
  };

  const getDisplayName = () => {
    return record?.name || record?.fullName || record?.firstName || 'Record';
  };

  const getRecordFields = () => {
    switch (recordType) {
      case 'prospects':
        return (
          <div className="space-y-8">
            {/* Strategic Assessment */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Strategic Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Authority</label>
                  <InlineEditField
                    value={record?.authority || ''}
                    field="authority"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Authority' },
                      { value: 'decision_maker', label: 'Decision Maker' },
                      { value: 'influencer', label: 'Influencer' },
                      { value: 'champion', label: 'Champion' },
                      { value: 'blocker', label: 'Blocker' },
                      { value: 'gatekeeper', label: 'Gatekeeper' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Need Urgency</label>
                  <InlineEditField
                    value={record?.needUrgency || ''}
                    field="needUrgency"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Urgency' },
                      { value: 'critical', label: 'Critical' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Timeline</label>
                  <InlineEditField
                    value={record?.timeline || ''}
                    field="timeline"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Timeline' },
                      { value: 'immediate', label: 'Immediate (0-30 days)' },
                      { value: 'short', label: 'Short (1-3 months)' },
                      { value: 'medium', label: 'Medium (3-6 months)' },
                      { value: 'long', label: 'Long (6+ months)' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Engagement Level</label>
                  <InlineEditField
                    value={record?.engagementLevel || 'initial'}
                    field="engagementLevel"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: 'initial', label: 'Initial' },
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Budget</label>
                  <InlineEditField
                    value={record?.budget?.toString() || ''}
                    field="budget"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    placeholder="Enter budget"
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Estimated Value</label>
                  <InlineEditField
                    value={record?.estimatedValue?.toString() || ''}
                    field="estimatedValue"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    placeholder="Enter estimated value"
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Currency</label>
                  <InlineEditField
                    value={record?.currency || 'USD'}
                    field="currency"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'GBP', label: 'GBP' },
                      { value: 'CAD', label: 'CAD' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Marketing Qualified</label>
                  <div className="text-sm text-gray-800 font-medium">
                    {record?.marketingQualified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-hover text-gray-800">
                        No
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Qualification */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Sales Qualification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Sales Qualified</label>
                  <div className="text-sm text-gray-800 font-medium">
                    {record?.salesQualified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-hover text-gray-800">
                        No
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Communication Style</label>
                  <InlineEditField
                    value={record?.communicationStyle || 'Professional'}
                    field="communicationStyle"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: 'Professional', label: 'Professional' },
                      { value: 'Casual', label: 'Casual' },
                      { value: 'Formal', label: 'Formal' },
                      { value: 'Friendly', label: 'Friendly' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Decision Making Style</label>
                  <InlineEditField
                    value={record?.decisionMakingStyle || 'Analytical'}
                    field="decisionMakingStyle"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: 'Analytical', label: 'Analytical' },
                      { value: 'Intuitive', label: 'Intuitive' },
                      { value: 'Collaborative', label: 'Collaborative' },
                      { value: 'Directive', label: 'Directive' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Relationship Status</label>
                  <InlineEditField
                    value={record?.relationship || ''}
                    field="relationship"
                    recordId={record?.id || ''}
                    recordType={recordType}
                    inputType="select"
                    options={[
                      { value: '', label: 'Select Relationship' },
                      { value: 'cold', label: 'Cold' },
                      { value: 'warm', label: 'Warm' },
                      { value: 'hot', label: 'Hot' },
                      { value: 'champion', label: 'Champion' }
                    ]}
                    onSave={handleInlineSave}
                    className="text-sm text-foreground font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Pain Points & Interests */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pain Points</label>
                    <div className="bg-background p-4 rounded-lg border border-border">
                      {record?.painPoints?.length > 0 ? (
                        <div className="space-y-2">
                          {record.painPoints.map((painPoint: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                              {painPoint}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No pain points identified yet</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                    <div className="bg-background p-4 rounded-lg border border-border">
                      {record?.interests?.length > 0 ? (
                        <div className="space-y-2">
                          {record.interests.map((interest: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <LightBulbIcon className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                              {interest}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No interests identified yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buying Signals & Competitors */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buying Signals</label>
                    <div className="bg-background p-4 rounded-lg border border-border">
                      {record?.buyingSignals?.length > 0 ? (
                        <div className="space-y-2">
                          {record.buyingSignals.map((signal: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <ChartBarIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              {signal}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No buying signals detected yet</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Mentions</label>
                    <div className="bg-background p-4 rounded-lg border border-border">
                      {record?.competitorMentions?.length > 0 ? (
                        <div className="space-y-2">
                          {record.competitorMentions.map((competitor: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <BuildingOfficeIcon className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                              {competitor}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No competitors mentioned yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals & Communication */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Goals</label>
                    <div className="bg-background p-4 rounded-lg border border-border">
                      {record?.professionalGoals?.length > 0 ? (
                        <div className="space-y-2">
                          {record.professionalGoals.map((goal: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <ChartBarIcon className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                              {goal}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No professional goals identified yet</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication Style</label>
                    <InlineEditField
                      value={record?.communicationStyle || 'Professional'}
                      field="communicationStyle"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      inputType="select"
                      options={[
                        { value: 'Professional', label: 'Professional' },
                        { value: 'Casual', label: 'Casual' },
                        { value: 'Formal', label: 'Formal' },
                        { value: 'Friendly', label: 'Friendly' }
                      ]}
                      onSave={handleInlineSave}
                      className="text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decision Making Style</label>
                    <InlineEditField
                      value={record?.decisionMakingStyle || 'Analytical'}
                      field="decisionMakingStyle"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      inputType="select"
                      options={[
                        { value: 'Analytical', label: 'Analytical' },
                        { value: 'Intuitive', label: 'Intuitive' },
                        { value: 'Collaborative', label: 'Collaborative' },
                        { value: 'Directive', label: 'Directive' }
                      ]}
                      onSave={handleInlineSave}
                      className="text-sm text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Next Actions & Timeline */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
                    <InlineEditField
                      value={record?.nextAction || ''}
                      field="nextAction"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      placeholder="Enter next action"
                      onSave={handleInlineSave}
                      className="text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Date</label>
                    <InlineEditField
                      value={record?.nextActionDate ? new Date(record.nextActionDate).toLocaleDateString() : ''}
                      field="nextActionDate"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      inputType="date"
                      placeholder="Schedule next action"
                      onSave={handleInlineSave}
                      className="text-sm text-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
                    <InlineEditField
                      value={record?.relationship || ''}
                      field="relationship"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      inputType="select"
                      options={[
                        { value: '', label: 'Select Relationship' },
                        { value: 'cold', label: 'Cold' },
                        { value: 'warm', label: 'Warm' },
                        { value: 'hot', label: 'Hot' },
                        { value: 'champion', label: 'Champion' }
                      ]}
                      onSave={handleInlineSave}
                      className="text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stage</label>
                    <InlineEditField
                      value={record?.currentStage || ''}
                      field="currentStage"
                      recordId={record?.id || ''}
                      recordType={recordType}
                      inputType="select"
                      options={[
                        { value: '', label: 'Select Stage' },
                        { value: 'awareness', label: 'Awareness' },
                        { value: 'interest', label: 'Interest' },
                        { value: 'consideration', label: 'Consideration' },
                        { value: 'intent', label: 'Intent' },
                        { value: 'evaluation', label: 'Evaluation' },
                        { value: 'purchase', label: 'Purchase' }
                      ]}
                      onSave={handleInlineSave}
                      className="text-sm text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Information */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Touch Points</label>
                    <div className="text-sm text-muted">
                      {record?.touchPointsCount || 0} interactions
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Response Rate</label>
                    <div className="text-sm text-muted">
                      {record?.responseRate ? `${Math.round(record.responseRate * 100)}%` : '0%'}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Last Contact</label>
                    <div className="text-sm text-muted">
                      {record?.lastContactDate ? new Date(record.lastContactDate).toLocaleDateString() : 'No recent contact'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Next Follow-up</label>
                    <div className="text-sm text-muted">
                      {record?.nextFollowUpDate ? new Date(record.nextFollowUpDate).toLocaleDateString() : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Strategy Information</h3>
              <p className="text-muted">Strategy information is available for prospects and opportunities.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {getRecordFields()}
    </div>
  );
}
