import { StacksContainer } from "@/products/stacks/components/StacksContainer";
import { StacksProvider } from "@/products/stacks/context/StacksProvider";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { RecordContextProvider } from "@/platform/ui/context/RecordContextProvider";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { ProfilePopupProvider } from "@/platform/ui/components/ProfilePopupContext";

export const metadata: Metadata = {
  title: "Epics",
  description: "Epic management and planning",
};

export default function WorkspaceStacksEpicsPage() {
  return (
    <RevenueOSProvider>
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
    </RevenueOSProvider>
  );
}
