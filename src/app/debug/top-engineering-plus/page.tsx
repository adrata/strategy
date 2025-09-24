"use client";

import React from 'react';
import { PipelineLeftPanelDebug } from '@/products/pipeline/components/PipelineLeftPanelDebug';
import { AcquisitionOSProvider } from '@/platform/ui/context/AcquisitionOSProvider';
import { PipelineProvider } from '@/products/pipeline/context/PipelineContext';

/**
 * 🔍 DEBUG PAGE FOR TOP ENGINEERING PLUS
 * 
 * This is a temporary debugging page to help identify why counts
 * are showing incorrectly in the TOP Engineering Plus workspace.
 * 
 * Access at: http://localhost:3000/debug/top-engineering-plus
 */

export default function DebugTopEngineeringPlusPage() {
  const [activeSection, setActiveSection] = React.useState('leads');

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="h-screen flex">
      <AcquisitionOSProvider>
        <PipelineProvider>
          <PipelineLeftPanelDebug
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
          
          {/* Main content area */}
          <div className="flex-1 p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Debug: TOP Engineering Plus Counts
              </h1>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Instructions
                </h2>
                
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <h3 className="font-medium text-gray-900">1. Check Browser Console</h3>
                    <p>Open the browser developer tools and check the console for debug logs. Look for messages starting with "🔍 [DEBUG LEFT PANEL]".</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">2. Verify Workspace ID</h3>
                    <p>Make sure the workspace ID is correctly set to <code className="bg-gray-100 px-1 rounded">01K5D01YCQJ9TJ7CT4DZDE79T1</code>.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">3. Check API Response</h3>
                    <p>Look for API calls to <code className="bg-gray-100 px-1 rounded">/api/data/unified?type=dashboard</code> and verify the response contains the correct counts.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">4. Compare Counts</h3>
                    <p>The left panel shows current counts vs expected counts. If they don't match, there's a data source issue.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">5. Check Cache</h3>
                    <p>If counts are cached incorrectly, try refreshing the page or clearing the browser cache.</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Expected Counts for TOP Engineering Plus</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Leads: 3,939</div>
                    <div>Prospects: 587</div>
                    <div>People: 3,172</div>
                    <div>Companies: 476</div>
                    <div>Opportunities: 0</div>
                    <div>Clients: 0</div>
                    <div>Partners: 0</div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Common Issues</h3>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <div>• Wrong workspace ID being used</div>
                    <div>• Stale cache data</div>
                    <div>• Acquisition data not loading</div>
                    <div>• API returning incorrect counts</div>
                    <div>• Data source priority issues</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PipelineProvider>
      </AcquisitionOSProvider>
    </div>
  );
}

