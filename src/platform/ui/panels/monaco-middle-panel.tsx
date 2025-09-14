"use client";

import * as React from "react";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useMonacoData } from "@/products/monaco/hooks/useMonacoData";
import { MonacoProvider } from "@/products/monaco/context/MonacoContext";
import { MonacoQueryProvider } from "@/products/monaco/components/MonacoQueryProvider";
import { MonacoContentSimple } from "@/products/monaco/components/MonacoContentSimple";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";

export function MonacoMiddlePanel() {
  const [completedLists, setCompletedLists] = React.useState<string[]>([]);
  const [isTransferring, setIsTransferring] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Use shared AOS context instead of Monaco's standalone system
  const { ui } = useAcquisitionOS();
  const { activeSection } = ui;

  // Get Monaco data
  const { companies, partners, people, loading, error, searchCompanies: _searchCompanies } = useMonacoData();
  
  // Create wrapper function with correct signature
  const searchCompanies = React.useCallback(async (searchQuery: string): Promise<void> => {
    _searchCompanies(searchQuery);
  }, [_searchCompanies]);

  // Core sections
  const allSections = [
    { id: "companies", name: "Companies", description: "Target companies", count: companies.length },
    { id: "people", name: "People", description: "Decision makers", count: people.length },
    { id: "sellers", name: "Sellers", description: "Sales team members", count: 39 },
  ];

  const handleTransferAll = () => {
    setIsTransferring(true);
    setTimeout(() => {
      setIsTransferring(false);
      setCompletedLists(prev => [...prev, activeSection]);
    }, 2000);
  };

  // Handle record selection - integrate with AOS context
  const handleRecordSelect = (record: any) => {
    setSelectedRecord(record);
    if (ui?.setSelectedRecord) {
      ui.setSelectedRecord(record);
    }
  };

  return (
    <MonacoProvider>
      <MonacoQueryProvider>
        <SpeedrunDataProvider>
          <MonacoContentSimple
            activeSection={activeSection}
            icpLists={[]}
            allSections={allSections}
            completedLists={completedLists}
            isTransferring={isTransferring}
            selectedRecord={selectedRecord}
            setSelectedRecord={handleRecordSelect}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onTransferAll={handleTransferAll}
            searchCompanies={searchCompanies}
          />
        </SpeedrunDataProvider>
      </MonacoQueryProvider>
    </MonacoProvider>
  );
}
