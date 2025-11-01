"use client";

import React from "react";
import { notFound } from "next/navigation";
import { useWorkshopDocuments } from "../../hooks/useWorkshopDocuments";
import { useUnifiedAuth } from "@/platform/auth";
import { WorkshopDetailView } from "../../components/WorkshopDetailView";

interface WorkshopDetailPageProps {
  params: {
    id: string;
  };
}

export default function WorkshopDetailPage({ params }: WorkshopDetailPageProps) {
  const { user: authUser } = useUnifiedAuth();
  const { getDocumentById } = useWorkshopDocuments(authUser?.activeWorkspaceId || '');
  
  const document = getDocumentById(params.id);
  
  if (!document) {
    notFound();
  }

  return (
    <WorkshopDetailView 
      document={document}
      displayName={document.title}
    />
  );
}
