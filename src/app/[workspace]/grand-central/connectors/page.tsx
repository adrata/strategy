"use client";

import React, { useState } from "react";
import { AllConnectorsView } from "../components/AllConnectorsView";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { IntegrationLibrary } from "../components/IntegrationLibrary";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function ConnectorsPage() {
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Standardized Header */}
      <StandardHeader
        title="All Connectors"
        subtitle="Browse and manage all available integrations"
        stats={[
          { label: "Internal APIs", value: 16 },
          { label: "MCPs", value: 0 },
          { label: "External", value: 500 }
        ]}
        actions={
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <PlusIcon className="w-4 h-4" />
            Add Integration
          </button>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto invisible-scrollbar">
        <AllConnectorsView />
      </div>

      {/* Integration Library Modal */}
      <IntegrationLibrary 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
      />
    </div>
  );
}
