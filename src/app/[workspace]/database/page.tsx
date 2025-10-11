"use client";

import React, { useEffect } from "react";
import { useDatabase } from "./layout";
import { TableBrowser } from "./components/TableBrowser";
import { TableDetail } from "./components/TableDetail";
import { QueryConsole } from "./components/QueryConsole";
import { SchemaVisualizer } from "./components/SchemaVisualizer";

export default function DatabasePage() {
  // Set browser title
  useEffect(() => {
    document.title = 'Database • Records';
  }, []);
  const { viewMode, selectedTable } = useDatabase();

  const renderContent = () => {
    switch (viewMode) {
      case 'detail':
        return selectedTable ? <TableDetail tableName={selectedTable} /> : <TableBrowser />;
      case 'query':
        return <QueryConsole />;
      case 'schema':
        return <SchemaVisualizer />;
      case 'browser':
      default:
        return <TableBrowser />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Main Content - each component handles its own header */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
