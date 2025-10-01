"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeepValueReportViewer } from "@/frontend/components/pipeline/DeepValueReportViewer";

export default function WorkspacePublicReportPage() {
  const params = useParams();
  const router = useRouter();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspace = params.workspace as string;
  const reportId = params.reportId as string;

  useEffect(() => {
    if (reportId) {
      loadReportData();
    }
  }, [reportId]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Parse the reportId to extract the actual report type and person ID
      // Format: company-competitive-analysis-01K5D64DRTWR98YMN1YYGQQPVE
      const parts = reportId.split('-');
      const personId = parts[parts.length - 1]; // Last part is the person ID
      const actualReportId = parts.slice(0, -1).join('-'); // Everything except last part

      // Generate the report using AI
      const response = await fetch(`/api/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: personId,
          recordType: 'people',
          reportType: actualReportId,
          workspaceId: workspace, // Use the workspace from the URL
          isPublic: true // Flag to indicate this is a public report
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Report generation failed:', errorText);
        throw new Error(`Failed to generate report: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // For workspace reports, we can go back to the workspace
    router.push(`/${workspace}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <div className="text-gray-600">Generating your report...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Not Available</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Report Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Adrata Intelligence</h1>
                <p className="text-sm text-gray-600">Strategic Business Intelligence Report</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">AI Generated</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <DeepValueReportViewer
          reportId={reportId}
          reportData={reportData}
          isLoading={isLoading}
          error={error}
          onBack={handleBack}
          record={null} // No record context needed for public reports
          isPublic={true}
        />
      </div>
    </div>
  );
}
