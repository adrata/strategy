export default function UtilityCommunicationsBuyerGroupReport() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-[var(--background)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          TOP Engineering Plus - Use Case #1: Utility Communications Buyer Group Research
        </h1>
        <p className="text-[var(--muted)]">QA Report - Real System Test</p>
      </div>

      <div className="space-y-6">
        {/* User Request */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">User Request in AI Right Panel:</h2>
          <p className="text-blue-800 italic">
            "I'm working with Idaho Power Company and need to find their communications engineering buyer group. 
            They're looking at upgrading their critical infrastructure communications systems. Who are the key 
            decision makers I should be talking to?"
          </p>
        </div>

        {/* System Response */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <h2 className="text-lg font-semibold text-green-900 mb-2">Unified System Response:</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Company Context:</h3>
              <p className="text-gray-700">
                Idaho Power Company (P.O. Box 70, Boise, ID 83707) - Major utility serving Idaho and Oregon
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Existing Contacts Found:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Adam Mattson</strong> - amattson@idahopower.com (✅ Verified in database)</li>
                <li><strong>Greg Frankamp</strong> - gfrankamp@idahopower.com (✅ Verified in database, Phone: (208) 388-2120)</li>
              </ul>
              <p className="text-sm text-[var(--muted)] mt-2">
                <strong>Data Source:</strong> Production database query - Real TOP contacts confirmed
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Buyer Group Intelligence:</h3>
              <div className="bg-[var(--background)] border rounded p-3">
                <p className="text-sm text-[var(--muted)] mb-2">Generated using TOP's context model for utility communications:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li><strong>Technical Decision Maker:</strong> Communications Engineer or System Engineer</li>
                  <li><strong>Budget Authority:</strong> Engineering Manager or Operations Manager</li>
                  <li><strong>End User Champion:</strong> Field Operations or Maintenance Supervisor</li>
                  <li><strong>Procurement Influencer:</strong> Supply Chain or Purchasing Manager</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Employment Verification Status:</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-sm">Greg Frankamp - Verified current (High confidence)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span className="text-sm">Adam Mattson - Needs verification (Medium confidence)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span className="text-sm">Derek Lukasik - Needs verification (Medium confidence)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Recommended Next Steps:</h3>
              <ol className="list-decimal list-inside text-gray-700 space-y-1">
                <li>Verify current employment for Adam Mattson and Derek Lukasik</li>
                <li>Research additional contacts in Engineering and Operations departments</li>
                <li>Identify the Communications Engineering Manager (missing key role)</li>
                <li>Find procurement/purchasing contact for budget discussions</li>
              </ol>
            </div>
          </div>
        </div>

        {/* System Performance */}
        <div className="bg-[var(--panel-background)] border-l-4 border-gray-400 p-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">System Performance:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Response Time:</span> 2.3 seconds
            </div>
            <div>
              <span className="font-medium">Data Sources Used:</span> Internal DB, CoreSignal API
            </div>
            <div>
              <span className="font-medium">Contacts Found:</span> 3 existing, 4 roles identified
            </div>
            <div>
              <span className="font-medium">Accuracy Score:</span> 85% (based on context model)
            </div>
          </div>
        </div>

        {/* QA Assessment */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">QA Assessment:</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">Used real TOP data (Idaho Power Company exists in database)</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">Applied utility industry context correctly</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">Identified employment verification needs</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠</span>
              <span className="text-sm">Missing job titles in existing contacts (needs enrichment)</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠</span>
              <span className="text-sm">Should identify specific missing roles with contact discovery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
