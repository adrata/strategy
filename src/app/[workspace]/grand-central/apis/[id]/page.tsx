"use client";

import React from "react";
import { notFound } from "next/navigation";
import { useApiStatus } from "../../hooks/useApiStatus";
import { API_REGISTRY } from "../../data/api-registry";
import { APIDetailView } from "../../components/APIDetailView";

interface APIDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function APIDetailPage({ params }: APIDetailPageProps) {
  const { getStatusById } = useApiStatus();
  
  // Unwrap params using React.use() for Next.js 15 compatibility
  const resolvedParams = React.use(params);
  
  // Find API by ULID or ID
  const api = API_REGISTRY.find(a => a.ulid === resolvedParams.id || a.id === resolvedParams.id);
  
  if (!api) {
    notFound();
  }

  const status = getStatusById(api.id);

  return (
    <APIDetailView 
      api={api}
      status={status}
      displayName={api.name}
    />
  );
}
