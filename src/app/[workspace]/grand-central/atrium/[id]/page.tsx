"use client";

import React from "react";
import { notFound } from "next/navigation";
import { useAtriumDocuments } from "../../hooks/useAtriumDocuments";
import { useUnifiedAuth } from "@/platform/auth";
import { AtriumDetailView } from "../../components/AtriumDetailView";

interface WorkshopDetailPageProps {
  params: {
    id: string;
  };
}

export default function WorkshopDetailPage({ params }: WorkshopDetailPageProps) {
  const { user: authUser } = useUnifiedAuth();
  const { getDocumentById } = useAtriumDocuments(authUser?.activeWorkspaceId || '');
  
  const document = getDocumentById(params.id);
  
  if (!document) {
    notFound();
  }

  return (
    <AtriumDetailView 
      document={document}
      displayName={document.title}
    />
  );
}
