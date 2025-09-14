interface UniversalClosePlanTabProps {
  record: any;
  recordType: string;
}

export function UniversalClosePlanTab({ record, recordType }: UniversalClosePlanTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Close Strategy */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Close Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Decision Process</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {record?.decisionProcess ? (
                <div className="text-gray-700">{JSON.stringify(record.decisionProcess)}</div>
              ) : (
                <div>
                  <p>• Identify all decision makers and influencers</p>
                  <p>• Understand evaluation criteria and process</p>
                  <p>• Map decision timeline and key milestones</p>
                  <p>• Address potential objections and concerns</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Key Players</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Champion:</span>
                <span className="font-medium text-gray-900">{record?.champion || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Economic Buyer:</span>
                <span className="font-medium text-gray-900">{record?.economicBuyer || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Technical Buyer:</span>
                <span className="font-medium text-gray-900">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Influencers:</span>
                <span className="font-medium text-gray-900">
                  {record?.stakeholders?.length || 0} identified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Criteria */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision Criteria</h3>
        <div className="space-y-4">
          {record?.decisionCriteria ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-700">{JSON.stringify(record.decisionCriteria)}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Technical Criteria</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• Functionality and feature requirements</p>
                  <p>• Integration capabilities</p>
                  <p>• Security and compliance standards</p>
                  <p>• Scalability and performance</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Business Criteria</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• Total cost of ownership</p>
                  <p>• Return on investment timeline</p>
                  <p>• Vendor stability and support</p>
                  <p>• Implementation timeline</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Factors</label>
            <div className="space-y-2">
              {record?.riskFactors?.length > 0 ? (
                record.riskFactors.map((risk: string, index: number) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{risk}</p>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-600 text-sm">No risk factors identified</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Factors</label>
            <div className="space-y-2">
              {record?.urgencyFactors?.length > 0 ? (
                record.urgencyFactors.map((urgency: string, index: number) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">{urgency}</p>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-600 text-sm">No urgency factors identified</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Planning */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Intelligence</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Implementation Readiness</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Technical Readiness:</span>
                <span className="ml-2 font-medium text-gray-900">-</span>
              </div>
              <div>
                <span className="text-gray-600">Change Management:</span>
                <span className="ml-2 font-medium text-gray-900">-</span>
              </div>
              <div>
                <span className="text-gray-600">Budget Allocation:</span>
                <span className="ml-2 font-medium text-gray-900">-</span>
              </div>
              <div>
                <span className="text-gray-600">Timeline Flexibility:</span>
                <span className="ml-2 font-medium text-gray-900">-</span>
              </div>
            </div>
          </div>

          {record?.implementation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Implementation Details</h4>
              <div className="text-sm text-gray-700">{JSON.stringify(record.implementation)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Economic Impact */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Economic Impact</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3">Value Proposition</h4>
          {record?.economicImpact ? (
            <div className="text-sm text-gray-700">{JSON.stringify(record.economicImpact)}</div>
          ) : (
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>Cost Savings:</strong> Reduce operational costs by 20-30%</p>
              <p>• <strong>Revenue Growth:</strong> Enable new revenue streams and market expansion</p>
              <p>• <strong>Efficiency Gains:</strong> Improve productivity across {record?.industry || 'industry'} operations</p>
              <p>• <strong>Risk Reduction:</strong> Minimize compliance and security risks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
