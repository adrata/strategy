"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRecordContext } from "@/platform/ui/context/RecordContextProvider";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { PipelineLeftPanelStandalone } from "@/products/pipeline/components/PipelineLeftPanelStandalone";
import { AIRightPanel } from "@/platform/ui/components/chat/AIRightPanel";
import { ProfileBox } from "@/platform/ui/components/ProfileBox";
import { DeepValueReportViewer } from "@/frontend/components/pipeline/DeepValueReportViewer";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { PipelineProvider } from "@/products/pipeline/context/PipelineContext";
import { SpeedrunDataProvider } from "@/platform/ui/context/SpeedrunDataProvider";
import { ProfilePopupProvider } from "@/platform/ui/context/ProfilePopupProvider";

export default function DeepValueReportPage() {
  const params = useParams();
  const router = useRouter();
  const { currentRecord } = useRecordContext();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspace = params.workspace as string;
  const personId = params.id as string;
  const reportId = params.reportId as string;

  useEffect(() => {
    if (currentRecord && reportId) {
      loadReportData();
    }
  }, [currentRecord, reportId]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate the report using AI
      const response = await fetch(`/api/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: personId,
          recordType: 'people',
          reportType: reportId,
          workspaceId: workspace
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
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
    router.push(`/${workspace}/people/${personId}`);
  };

  if (!currentRecord) {
    return (
      <AcquisitionOSProvider>
        <ZoomProvider>
          <PipelineProvider>
            <SpeedrunDataProvider>
              <ProfilePopupProvider>
                <PanelLayout
                  leftPanel={<PipelineLeftPanelStandalone />}
                  rightPanel={<AIRightPanel />}
                  header={<ProfileBox />}
                >
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading record...</div>
                  </div>
                </PanelLayout>
              </ProfilePopupProvider>
            </SpeedrunDataProvider>
          </PipelineProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    );
  }

  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <ProfilePopupProvider>
              <PanelLayout
                leftPanel={<PipelineLeftPanelStandalone />}
                rightPanel={<AIRightPanel />}
                header={<ProfileBox />}
              >
                <DeepValueReportViewer
                  reportId={reportId}
                  reportData={reportData}
                  isLoading={isLoading}
                  error={error}
                  onBack={handleBack}
                  record={currentRecord}
                />
              </PanelLayout>
            </ProfilePopupProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
