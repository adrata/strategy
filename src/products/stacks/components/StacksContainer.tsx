"use client";

import React, { useState } from "react";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { StacksLeftPanel } from "@/frontend/components/stacks/StacksLeftPanel";
import { StacksMiddlePanel } from "@/frontend/components/stacks/StacksMiddlePanel";
import { StacksDetailPanel } from "./StacksDetailPanel";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { useStacks } from "../context/StacksProvider";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";

export function StacksContainer() {
  const { ui } = useAcquisitionOS();
  const {
    activeSubSection,
    selectedItem,
    isLoading,
    onSubSectionChange,
    onItemClick,
  } = useStacks();

  const [showDetail, setShowDetail] = useState(true);

  // Handle item selection
  const handleItemClick = (item: any) => {
    onItemClick(item);
    setShowDetail(true);
  };

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<StacksLeftPanel />}
      middlePanel={
        <StacksMiddlePanel
          activeSubSection={activeSubSection}
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          isLoading={isLoading}
        />
      }
      rightPanel={selectedItem ? <StacksDetailPanel item={selectedItem} /> : <RightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}
