"use client";

import React from "react";
import { notFound } from "next/navigation";
import { MCP_REGISTRY } from "../../data/mcp-registry";
import { MCPDetailView } from "../../components/MCPDetailView";

interface MCPDetailPageProps {
  params: {
    id: string;
  };
}

export default function MCPDetailPage({ params }: MCPDetailPageProps) {
  // Find MCP by ULID or ID
  const mcp = MCP_REGISTRY.find(m => m.ulid === params.id || m.id === params.id);
  
  if (!mcp) {
    notFound();
  }

  return (
    <MCPDetailView 
      mcp={mcp}
      displayName={mcp.name}
    />
  );
}
