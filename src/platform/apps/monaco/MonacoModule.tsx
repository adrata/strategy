"use client";

import React from "react";
import { useActionPlatform } from "@/platform/ui/context/ActionPlatformProvider";
import { MonacoQueryProvider } from "@/products/monaco/components/MonacoQueryProvider";
import { MonacoContentSimple } from "@/products/monaco/components/MonacoContentSimple";
import { MonacoProvider } from "@/products/monaco/context/MonacoContext";
import { useMonacoData } from "@/products/monaco/hooks/useMonacoData";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";

export function MonacoModule() {
  const {
    ui: { activeSection, searchQuery, setSearchQuery },
  } = useActionPlatform();

  // Get real data counts from Monaco hook
  const { companies, people, searchCompanies } = useMonacoData();

  // Default to companies if no section is set
  const currentSection = activeSection || "companies";

  return (
    <MonacoProvider>
      <MonacoQueryProvider>
        <SpeedrunDataProvider>
          <div className="h-full flex flex-col overflow-y-auto invisible-scrollbar pt-1">
            <MonacoContentSimple
            activeSection={currentSection}
            icpLists={[]} // No ICP lists - using core sections only
            allSections={[
              {
                id: "companies",
                name: "Companies",
                description: "Target your ideal accounts.",
                count: companies.length,
              },
              {
                id: "people",
                name: "People",
                description: "Key decision makers and contacts",
                count: people.length,
              },
            ]}
            completedLists={[]}
            isTransferring={false}
            selectedRecord={null}
            setSelectedRecord={() => {}}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onTransferAll={() => {}}
            searchCompanies={searchCompanies} // Pass the search function
            />
          </div>
        </SpeedrunDataProvider>
      </MonacoQueryProvider>
    </MonacoProvider>
  );
}
