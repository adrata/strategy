interface UniversalCompanyIntelTabProps {
  record: any;
  recordType: string;
}

export function UniversalCompanyIntelTab({ record, recordType }: UniversalCompanyIntelTabProps) {
  const getRevenueColor = (revenue: number | null) => {
    if (!revenue) return 'text-gray-600';
    if (revenue >= 1000000000) return 'text-green-600'; // $1B+
    if (revenue >= 100000000) return 'text-blue-600';   // $100M+
    if (revenue >= 10000000) return 'text-purple-600';  // $10M+
    return 'text-orange-600';
  };

  return (
    <div className="p-6 space-y-8">
      {/* Company Intelligence */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Financial Profile</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue:</span>
                <span className={`font-medium ${getRevenueColor(record?.revenue)}`}>
                  {record?.revenue ? `$${record.revenue.toLocaleString()}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium text-gray-900">{record?.size || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tier:</span>
                <span className="font-medium text-gray-900">{record?.tier || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type:</span>
                <span className="font-medium text-gray-900">{record?.accountType || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Market Position</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Industry:</span>
                <span className="font-medium text-gray-900">{record?.industry || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sector:</span>
                <span className="font-medium text-gray-900">{record?.sector || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vertical:</span>
                <span className="font-medium text-gray-900">{record?.vertical || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Primary Contact:</span>
                <span className="font-medium text-gray-900">{record?.primaryContact || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Intelligence */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Structure</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Legal Name:</span>
                  <span className="font-medium text-gray-900">{record?.legalName || record?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trading Name:</span>
                  <span className="font-medium text-gray-900">{record?.tradingName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration #:</span>
                  <span className="font-medium text-gray-900">{record?.registrationNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ID:</span>
                  <span className="font-medium text-gray-900">{record?.taxId || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Technology Profile</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Website:</span>
                  <span className="font-medium text-blue-600">
                    {record?.website ? (
                      <a href={record.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Visit
                      </a>
                    ) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tech Stack:</span>
                  <span className="font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Solutions:</span>
                  <span className="font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Integration Needs:</span>
                  <span className="font-medium text-gray-900">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Intelligence */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Intelligence</h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Business Priorities</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p>• Digital transformation and operational efficiency</p>
              <p>• {record?.industry || 'Industry'}-specific compliance and security</p>
              <p>• Customer experience and competitive differentiation</p>
              <p>• Cost optimization and resource allocation</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Value Drivers</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p>• Revenue growth through improved {record?.industry || 'industry'} processes</p>
              <p>• Cost reduction via automation and efficiency gains</p>
              <p>• Risk mitigation through enhanced compliance and security</p>
              <p>• Competitive advantage through technology leadership</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Health */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Relationship Strength</h4>
            <div className="text-lg font-bold text-gray-600">-</div>
            <p className="text-sm text-gray-500 mt-1">Based on engagement</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Growth Potential</h4>
            <div className="text-lg font-bold text-gray-600">-</div>
            <p className="text-sm text-gray-500 mt-1">Expansion opportunities</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Risk Level</h4>
            <div className="text-lg font-bold text-gray-600">-</div>
            <p className="text-sm text-gray-500 mt-1">Churn or competitive risk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
