"use client";

import { DashboardDetailPage } from '@/frontend/components/pipeline/DashboardDetailPage';
import { AcquisitionOSProvider } from '@/platform/ui/context/AcquisitionOSProvider';
import { PipelineProvider } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { ZoomProvider } from '@/platform/ui/components/ZoomProvider';
import { ProfilePopupProvider } from '@/platform/ui/components/ProfilePopupContext';

export default function SalesCycleDetailPage() {
  return (
    <ZoomProvider>
      <AcquisitionOSProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <ProfilePopupProvider>
              <DashboardDetailPage statType="sales-cycle" />
            </ProfilePopupProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </AcquisitionOSProvider>
    </ZoomProvider>
  );
}
