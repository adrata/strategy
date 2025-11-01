"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWorkshopDocuments } from "../hooks/useWorkshopDocuments";
import { useUnifiedAuth } from "@/platform/auth";
import { DocumentIcon, PresentationChartBarIcon, TableCellsIcon, CodeBracketIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { IntegrationLibrary } from "../components/IntegrationLibrary";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function WorkshopPage() {
  const router = useRouter();
  const params = useParams();
  const workspace = params.workspace;
  const { user: authUser } = useUnifiedAuth();
  const { documents, loading, getDocumentsByType, getDocumentCounts } = useWorkshopDocuments(authUser?.activeWorkspaceId || '');
  const [selectedType, setSelectedType] = useState<'paper' | 'pitch' | 'grid' | 'code' | 'matrix' | 'all'>('all');
  const [showLibrary, setShowLibrary] = useState(false);

  const documentTypes = [
    { id: 'all', name: 'All Documents', icon: DocumentIcon, count: getDocumentCounts().total },
    { id: 'paper', name: 'Papers', icon: DocumentIcon, count: getDocumentCounts().paper },
    { id: 'pitch', name: 'Pitches', icon: PresentationChartBarIcon, count: getDocumentCounts().pitch },
    { id: 'grid', name: 'Grids', icon: TableCellsIcon, count: getDocumentCounts().grid },
    { id: 'code', name: 'Code', icon: CodeBracketIcon, count: getDocumentCounts().code },
    { id: 'matrix', name: 'Matrix', icon: Squares2X2Icon, count: getDocumentCounts().matrix }
  ];

  const filteredDocuments = selectedType === 'all' 
    ? documents 
    : getDocumentsByType(selectedType);

  const handleDocumentClick = (documentId: string) => {
    router.push(`/${workspace}/grand-central/workshop/${documentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = documentTypes.find(t => t.id === type);
    const IconComponent = typeConfig?.icon || DocumentIcon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Standardized Header */}
      <StandardHeader
        title="Workshop"
        subtitle="Document management and collaboration"
        stats={[
          { label: "Papers", value: getDocumentCounts().paper },
          { label: "Pitches", value: getDocumentCounts().pitch },
          { label: "Total", value: getDocumentCounts().total }
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
          {/* Document Type Filters */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Document Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {documentTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id as any)}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedType === type.id
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-[var(--border)] hover:border-blue-300 text-[var(--foreground)]'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">{type.name}</div>
                    <div className="text-xs text-[var(--muted)]">{type.count} docs</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Documents Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {selectedType === 'all' ? 'All Documents' : documentTypes.find(t => t.id === selectedType)?.name} ({filteredDocuments.length})
              </h3>
              <button
                onClick={() => window.open(`/${authUser?.activeWorkspaceId}/workshop`, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Workshop
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4 animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-[var(--loading-bg)] rounded"></div>
                        <div className="h-5 bg-[var(--loading-bg)] rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-[var(--loading-bg)] rounded w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 bg-[var(--loading-bg)] rounded w-12"></div>
                        <div className="h-3 bg-[var(--loading-bg)] rounded w-16"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-[var(--loading-bg)] rounded w-16"></div>
                        <div className="h-3 bg-[var(--loading-bg)] rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <DocumentIcon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No documents found</h3>
                <p className="text-[var(--muted)]">Create your first document in Workshop to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    onClick={() => handleDocumentClick(document.id)}
                    className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(document.documentType)}
                        <h4 className="font-semibold text-[var(--foreground)] truncate">{document.title}</h4>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.status)}`}>
                        {document.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-[var(--muted)]">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{document.documentType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {document.owner && (
                        <div className="flex justify-between">
                          <span>Owner:</span>
                          <span>{document.owner.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
