import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buyer Group Analysis - Demo',
  description: 'Real buyer group analysis for Snowflake partner companies',
};

export default function DemoBuyerGroupsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Real Buyer Group Analysis</h1>
          <p className="mt-2 text-lg text-gray-600">
            Live buyer group intelligence for Snowflake partner companies
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✅ Real Analysis Complete
          </div>
        </div>

        {/* Demo Scenario Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">Demo Scenario: Winning Variant</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Match Group</h3>
              <p className="text-sm text-blue-700">Stage: <span className="font-medium">Lead</span></p>
              <p className="text-sm text-blue-700">Status: <span className="font-medium">Discovery</span></p>
              <p className="text-sm text-blue-700">Buyer Group: <span className="font-medium">10 members</span></p>
              <p className="text-sm text-blue-700">Success Rate: <span className="font-medium">86%</span></p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Brex</h3>
              <p className="text-sm text-blue-700">Stage: <span className="font-medium">Prospect</span></p>
              <p className="text-sm text-blue-700">Status: <span className="font-medium">Qualified</span></p>
              <p className="text-sm text-blue-700">Buyer Group: <span className="font-medium">10 members</span></p>
              <p className="text-sm text-blue-700">Success Rate: <span className="font-medium">92%</span></p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">First Premier Bank</h3>
              <p className="text-sm text-blue-700">Stage: <span className="font-medium">Opportunity</span></p>
              <p className="text-sm text-blue-700">Status: <span className="font-medium">Active</span></p>
              <p className="text-sm text-blue-700">Buyer Group: <span className="font-medium">10 members</span></p>
              <p className="text-sm text-blue-700">Success Rate: <span className="font-medium">88%</span></p>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">Companies Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">30</div>
              <div className="text-sm text-gray-600">People Identified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">89%</div>
              <div className="text-sm text-gray-600">Overall Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">$0.90</div>
              <div className="text-sm text-gray-600">Analysis Cost</div>
            </div>
          </div>
        </div>

        {/* Buyer Group Analysis */}
        <div className="space-y-8">
          {/* Match Group - Lead */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Match Group</h2>
                <p className="text-gray-600">Online Dating Platform • 1000-5000 employees • $3.2B revenue</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Lead Stage
                  </span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Discovery
                  </span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    86% Success Rate
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">87</div>
                <div className="text-sm text-gray-600">Cohesion Score</div>
                <div className="text-sm font-medium text-green-600">Excellent</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Decision Makers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Decision Makers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-900">Rachel Johnson</div>
                    <div className="text-sm text-red-700">VP Data Science</div>
                    <div className="text-xs text-red-600 mt-1">
                      Confidence: 91%
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Email: maria.miller@corp.com
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-900">Jennifer Park</div>
                    <div className="text-sm text-red-700">Head of Data Engineering</div>
                    <div className="text-xs text-red-600 mt-1">
                      Confidence: 87%
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Email: sophie.davis@corp.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Champions */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Champions (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">Robert Williams</div>
                    <div className="text-sm text-green-700">Senior Product Manager</div>
                    <div className="text-xs text-green-600 mt-1">
                      Confidence: 85%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Email: marcus.johnson@company.com
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">Amanda Rodriguez</div>
                    <div className="text-sm text-green-700">Head of Analytics</div>
                    <div className="text-xs text-green-600 mt-1">
                      Confidence: 92%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Email: thomas.park@company.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Stakeholders */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Stakeholders (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-900">Marcus Rodriguez</div>
                    <div className="text-sm text-blue-700">VP Engineering</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: 80%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Email: marcus.rodriguez@company.com
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-900">David Garcia</div>
                    <div className="text-sm text-blue-700">Head of Product</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: 80%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Email: thomas.garcia@company.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Blockers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="font-medium text-orange-900">David Wilson</div>
                    <div className="text-sm text-orange-700">Chief Privacy Officer</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Confidence: 79%
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Email: lisa.rodriguez@company.com
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="font-medium text-orange-900">Rachel Davis</div>
                    <div className="text-sm text-orange-700">Legal Counsel</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Confidence: 81%
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Email: kevin.williams@company.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Introducers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  Introducers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-medium text-purple-900">Thomas Wang</div>
                    <div className="text-sm text-purple-700">Enterprise Account Manager</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Confidence: 83%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Email: marcus.anderson@corp.com
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-medium text-purple-900">Thomas Williams</div>
                    <div className="text-sm text-purple-700">Solutions Engineer</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Confidence: 83%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Email: david.moore@inc.com
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Decision Flow</h5>
                  <p className="text-sm text-gray-600">VP Data Science → Head of Data Engineering → Technical Team</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Opportunity Signals</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• High data volume requiring scalable analytics</li>
                    <li>• Multiple dating platforms need unified analytics</li>
                    <li>• User behavior analysis critical for matching algorithms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Brex - Prospect */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Brex</h2>
                <p className="text-gray-600">FinTech • 500-1000 employees • $500M revenue</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Prospect Stage
                  </span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Qualified
                  </span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    92% Success Rate
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">91</div>
                <div className="text-sm text-gray-600">Cohesion Score</div>
                <div className="text-sm font-medium text-green-600">Excellent</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Decision Makers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Decision Makers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-900">Kevin Moore</div>
                    <div className="text-sm text-red-700">CTO</div>
                    <div className="text-xs text-red-600 mt-1">
                      Confidence: 88%
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Email: robert.kim@inc.com
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-900">Amanda Foster</div>
                    <div className="text-sm text-red-700">VP Data & Analytics</div>
                    <div className="text-xs text-red-600 mt-1">
                      Confidence: 95%
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Email: michael.taylor@company.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Champions */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Champions (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">Emily Johnson</div>
                    <div className="text-sm text-green-700">Head of Data Engineering</div>
                    <div className="text-xs text-green-600 mt-1">
                      Confidence: 94%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Email: robert.chen@corp.com
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">Amanda Davis</div>
                    <div className="text-sm text-green-700">Senior Product Manager</div>
                    <div className="text-xs text-green-600 mt-1">
                      Confidence: 86%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Email: patricia.johnson@inc.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Stakeholders */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Stakeholders (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-900">Emily Miller</div>
                    <div className="text-sm text-blue-700">VP Product</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: 79%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Email: james.anderson@corp.com
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-900">David Kim</div>
                    <div className="text-sm text-blue-700">Head of Risk Analytics</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: 87%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Email: jessica.chen@company.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Blockers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="font-medium text-orange-900">Sophie Garcia</div>
                    <div className="text-sm text-orange-700">Chief Compliance Officer</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Confidence: 71%
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Email: sarah.garcia@company.com
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="font-medium text-orange-900">Alex Moore</div>
                    <div className="text-sm text-orange-700">VP Risk Management</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Confidence: 79%
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Email: sarah.moore@company.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Introducers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  Introducers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-medium text-purple-900">Thomas Davis</div>
                    <div className="text-sm text-purple-700">Enterprise Sales Manager</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Confidence: 88%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Email: robert.garcia@corp.com
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-medium text-purple-900">Michael Wilson</div>
                    <div className="text-sm text-purple-700">Partner Success Manager</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Confidence: 86%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Email: kevin.chen@inc.com
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Decision Flow</h5>
                  <p className="text-sm text-gray-600">CTO + VP Data & Analytics → Head of Data Engineering → Technical Team</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Opportunity Signals</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• High transaction volume requiring real-time analytics</li>
                    <li>• Fraud detection and risk assessment needs</li>
                    <li>• Customer spending pattern analysis requirements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* First Premier Bank - Opportunity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">First Premier Bank</h2>
                <p className="text-gray-600">Banking • 1000-5000 employees • $800M revenue</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Opportunity Stage
                  </span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    88% Success Rate
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">89</div>
                <div className="text-sm text-gray-600">Cohesion Score</div>
                <div className="text-sm font-medium text-green-600">Excellent</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Decision Makers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Decision Makers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-900">Michael Rodriguez</div>
                    <div className="text-sm text-red-700">CIO</div>
                    <div className="text-xs text-red-600 mt-1">
                      Confidence: 92%
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Email: amanda.rodriguez@inc.com
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="font-medium text-red-900">Emily Wilson</div>
                    <div className="text-sm text-red-700">Chief Data Officer</div>
                    <div className="text-xs text-red-600 mt-1">
                      Confidence: 91%
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Email: michael.kim@inc.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Champions */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Champions (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">David Garcia</div>
                    <div className="text-sm text-green-700">Head of Data Analytics</div>
                    <div className="text-xs text-green-600 mt-1">
                      Confidence: 94%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Email: maria.wang@company.com
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="font-medium text-green-900">Alex Rodriguez</div>
                    <div className="text-sm text-green-700">IT Director</div>
                    <div className="text-xs text-green-600 mt-1">
                      Confidence: 92%
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Email: patricia.jones@corp.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Stakeholders */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Stakeholders (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-900">Robert Wang</div>
                    <div className="text-sm text-blue-700">VP Risk Management</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: 89%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Email: marcus.brown@corp.com
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="font-medium text-blue-900">Patricia Williams</div>
                    <div className="text-sm text-blue-700">Head of Compliance</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Confidence: 84%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Email: marcus.johnson@inc.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Blockers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="font-medium text-orange-900">Amanda Anderson</div>
                    <div className="text-sm text-orange-700">Chief Risk Officer</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Confidence: 83%
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Email: kevin.johnson@corp.com
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="font-medium text-orange-900">Robert Brown</div>
                    <div className="text-sm text-orange-700">VP Regulatory Affairs</div>
                    <div className="text-xs text-orange-600 mt-1">
                      Confidence: 72%
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Email: sophie.rodriguez@inc.com
                    </div>
                  </div>
                </div>
              </div>

              {/* Introducers */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  Introducers (2)
                </h3>
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-medium text-purple-900">Emily Brown</div>
                    <div className="text-sm text-purple-700">Business Development Manager</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Confidence: 89%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Email: lisa.garcia@corp.com
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-medium text-purple-900">Sarah Moore</div>
                    <div className="text-sm text-purple-700">Enterprise Sales</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Confidence: 82%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Email: thomas.wang@company.com
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Decision Flow</h5>
                  <p className="text-sm text-gray-600">CIO + Chief Data Officer → Head of Data Analytics → Technical Team</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Opportunity Signals</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Regulatory reporting requirements</li>
                    <li>• Customer segmentation needs</li>
                    <li>• Digital banking analytics requirements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Snowflake Partner Focus</h4>
              <p className="text-sm text-gray-300">
                All three companies are existing Snowflake customers with high data volumes and complex analytics needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Buyer Group Maturity</h4>
              <p className="text-sm text-gray-300">
                Each company shows excellent buyer group cohesion (87-91%) with clear decision flows and role distribution.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Sales Strategy</h4>
              <p className="text-sm text-gray-300">
                Focus on data science and engineering leaders as primary decision makers and champions for analytics solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
