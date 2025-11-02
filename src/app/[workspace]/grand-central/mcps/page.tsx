"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MCP_REGISTRY } from "../data/mcp-registry";
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { IntegrationLibrary } from "../components/IntegrationLibrary";

export default function MCPsPage() {
  const router = useRouter();
  const params = useParams();
  const workspace = params.workspace;
  const [showLibrary, setShowLibrary] = useState(false);

  const handleMCPClick = (mcpId: string) => {
    const mcp = MCP_REGISTRY.find(m => m.id === mcpId);
    if (mcp) {
      router.push(`/${workspace}/grand-central/mcps/${mcp.ulid}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'not-configured':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
        return 'text-green-600';
      case 'not-configured':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Standardized Header */}
      <StandardHeader
        title="MCPs"
        subtitle="Model Context Protocol servers for AI integration"
        stats={[
          { label: "Configured", value: MCP_REGISTRY.filter(m => m.status === 'configured').length },
          { label: "Not Configured", value: MCP_REGISTRY.filter(m => m.status === 'not-configured').length },
          { label: "Total", value: MCP_REGISTRY.length }
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
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MCP_REGISTRY.map(mcp => (
              <div
                key={mcp.id}
                onClick={() => handleMCPClick(mcp.id)}
                className="bg-panel-background border border-border rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{mcp.name}</h3>
                    <p className="text-muted text-sm">{mcp.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(mcp.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">MCP Server</span>
                  <span className={`text-xs font-medium ${getStatusColor(mcp.status)}`}>
                    {mcp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Library Modal */}
      <IntegrationLibrary 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
      />
    </div>
  );
}
