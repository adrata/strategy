"use client";

import { Metadata } from "next";
import { OasisContainer } from "@/products/oasis/components/OasisContainer";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";
import { OasisProvider } from "@/products/oasis/context/OasisProvider";

export const metadata: Metadata = {
  title: "Oasis",
  description: "Workspace communication and collaboration",
};

export default function WorkspaceOasisPage() {
  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <RecordContextProvider>
          <ProfilePopupProvider>
            <OasisProvider>
              <div className="h-full">
                <OasisContainer />
              </div>
            </OasisProvider>
          </ProfilePopupProvider>
        </RecordContextProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}


