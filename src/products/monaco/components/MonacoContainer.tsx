"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { MonacoContent } from "./MonacoContent";
import { MonacoLeftPanel } from "./MonacoLeftPanel";
import { MonacoCreateListModal } from "./MonacoCreateListModal";
import { DebugPanel } from "./DebugPanel";
import { ICPList, MonacoRecord } from "../types";
import { useMonacoData } from "@/products/monaco/hooks/useMonacoData";

export function MonacoContainer() {
  const [activeSection, setActiveSection] = useState("companies"); // Changed from "icp1" to "companies"
  const [completedLists, setCompletedLists] = useState<string[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MonacoRecord | null>(
    null,
  );
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customLists, setCustomLists] = useState<ICPList[]>([]);

  // Get Monaco data
  const { companies, partners, people, loading, error, searchCompanies, forceRefresh } = useMonacoData();

  // Core sections only (removed ICP lists and partners)
  const allSections = [
    {
      id: "companies",
      name: "Companies",
      description: "Target your ideal accounts.",
      count: companies?.length || 0,
    },
    {
      id: "people",
      name: "People",
      description: "Key decision makers and contacts",
      count: people?.length || 0,
    },
    {
      id: "sellers",
      name: "Sellers",
      description: "Organize momentum",
      count: 39,
    },
  ];

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    console.log("🎯 Section changed to:", section);
  }, []);

  const handleCreateList = useCallback(() => {
    setShowCreateListModal(true);
  }, []);

  const handleCreateListSubmit = useCallback(
    (listData: { name: string; description: string }) => {
      const newList: ICPList = {
        id: `custom-${Date.now()}`,
        name: listData.name,
        description: listData.description,
        count: 0,
        isCompleted: false,
        isCustom: true,
      };

      setCustomLists((prev) => [...prev, newList]);
      setActiveSection(newList.id);
      setShowCreateListModal(false);

      console.log("🎯 Created new custom list:", newList);
    },
    [],
  );

  const handleTransferAll = useCallback(() => {
    if (isTransferring) return;

    setIsTransferring(true);
    console.log("🚀 Transferring all records from:", activeSection);

    // Simulate transfer process
    setTimeout(() => {
      setCompletedLists((prev) => 
        prev.includes(activeSection) ? prev : [...prev, activeSection]
      );
      setIsTransferring(false);
      console.log("✅ Transfer completed for:", activeSection);
    }, 2000);
  }, [activeSection, isTransferring]);

  // Add debugging
  console.log("🏗️ MonacoContainer state:", {
    activeSection,
    selectedRecord: selectedRecord?.name || "none",
    hasSetSelectedRecord: !!setSelectedRecord,
  });

  return (
    <div className="h-full flex bg-[var(--background)]">
      {/* Left Panel - Core Sections Only */}
      <MonacoLeftPanel />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MonacoContent
          activeSection={activeSection}
          icpLists={[]} // Empty ICP lists
          allSections={allSections}
          completedLists={completedLists}
          isTransferring={isTransferring}
          selectedRecord={selectedRecord}
          setSelectedRecord={setSelectedRecord}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onTransferAll={handleTransferAll}
          searchCompanies={searchCompanies}
          companies={companies}
          partners={partners}
          people={people}
          loading={loading}
          error={error}
        />
      </div>

      {/* Create List Modal */}
      {showCreateListModal && (
        <MonacoCreateListModal
          onClose={() => setShowCreateListModal(false)}
          onCreate={handleCreateListSubmit}
        />
      )}
      
      {/* Debug Panel - only show in development */}
      {process['env']['NODE_ENV'] === 'development' && (
        <DebugPanel onForceRefresh={forceRefresh} />
      )}
    </div>
  );
}
