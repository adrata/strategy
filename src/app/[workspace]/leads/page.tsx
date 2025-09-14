"use client";

import { PipelineView } from "@/frontend/components/pipeline/PipelineView";
import { WorkspacePipelineWrapper } from "../WorkspacePipelineWrapper";
import React from "react";

// Simple error boundary to catch PipelineView errors
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this['state'] = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: any, errorInfo: any) {
    console.error('🚨🚨🚨 [ERROR BOUNDARY] PipelineView crashed:', error);
    console.error('🚨🚨🚨 [ERROR BOUNDARY] Error info:', errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <div className="h-full bg-white p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">PipelineView Error</h1>
          <p className="text-lg">The PipelineView component crashed.</p>
          <pre className="text-sm bg-gray-100 p-4 mt-4 overflow-auto">
            {(this.state as any).error?.toString()}
          </pre>
        </div>
      );
    }

    return (this.props as any).children;
  }
}

export default function WorkspaceLeadsPage() {
  console.log(`🧪🧪🧪 [LEADS PAGE] Page executing for LEADS section`);
  
  // Use PipelineView with error boundary
  return (
    <WorkspacePipelineWrapper>
      <ErrorBoundary>
        <PipelineView section="leads" />
      </ErrorBoundary>
    </WorkspacePipelineWrapper>
  );
}
