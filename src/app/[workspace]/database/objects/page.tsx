"use client";

import React from "react";
import { useDatabase } from "../layout";
import { StreamlinedObjectsView } from "../components/StreamlinedObjectsView";

export default function DatabaseObjectsPage() {
  const { setViewMode } = useDatabase();

  // Set the view mode to show objects
  React.useEffect(() => {
    setViewMode('objects');
  }, [setViewMode]);

  return <StreamlinedObjectsView />;
}
