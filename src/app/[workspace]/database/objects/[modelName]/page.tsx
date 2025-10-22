"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useDatabase } from "../../layout";
import { ModelDetailView } from "../../components/ModelDetailView";

export default function DatabaseModelDetailPage() {
  const params = useParams();
  const modelName = params.modelName as string;
  const { setSelectedTable, setViewMode } = useDatabase();

  React.useEffect(() => {
    setSelectedTable(modelName);
    setViewMode('model-detail');
  }, [modelName, setSelectedTable, setViewMode]);

  return <ModelDetailView modelName={modelName} />;
}
