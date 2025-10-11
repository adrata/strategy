"use client";

import { Metadata } from "next";
import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksProvider } from "@/products/stacks/context/StacksProvider";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export const metadata: Metadata = {
  title: "Stacks",
  description: "Project management and task tracking",
};

export default function WorkspaceStacksPage() {
  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <RecordContextProvider>
          <ProfilePopupProvider>
            <StacksProvider>
              <div className="h-full">
                <StacksContainer />
              </div>
            </StacksProvider>
          </ProfilePopupProvider>
        </RecordContextProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}
