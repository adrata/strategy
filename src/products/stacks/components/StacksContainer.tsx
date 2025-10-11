"use client";

import React, { useState } from "react";
import { StacksMiddlePanel } from "@/frontend/components/stacks/StacksMiddlePanel";
import { useStacks } from "../context/StacksProvider";

export function StacksContainer() {
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
    <StacksMiddlePanel
      activeSubSection={activeSubSection}
      selectedItem={selectedItem}
      onItemClick={handleItemClick}
      isLoading={isLoading}
    />
  );
}
