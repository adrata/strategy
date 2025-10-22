"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useDatabase } from "../../layout";
import { TableDetailView } from "../../components/TableDetailView";

export default function DatabaseTableDetailPage() {
  const params = useParams();
  const tableName = params.tableName as string;
  const { setSelectedTable, setViewMode } = useDatabase();

  React.useEffect(() => {
    setSelectedTable(tableName);
    setViewMode('detail');
  }, [tableName, setSelectedTable, setViewMode]);

  return <TableDetailView tableName={tableName} />;
}
