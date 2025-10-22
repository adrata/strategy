"use client";

import React from "react";
import { useDatabase } from "../layout";
import { StreamlinedTablesView } from "../components/StreamlinedTablesView";

export default function DatabaseTablesPage() {
  const { setViewMode } = useDatabase();

  // Set the view mode to show tables
  React.useEffect(() => {
    setViewMode('tables');
  }, [setViewMode]);

  return <StreamlinedTablesView />;
}
