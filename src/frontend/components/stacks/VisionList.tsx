"use client";

/**
 * Vision List Component
 * 
 * Card-based display of vision documents (papers and pitches)
 * Similar to Chronicle's card-based experience
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DocumentTextIcon, PresentationChartBarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { VisionDocumentTypeSelector } from './VisionDocumentTypeSelector';
import { PresentationView } from '@/frontend/components/pipeline/PresentationView';
import { PitchRegularView } from '@/frontend/components/pipeline/PitchRegularView';

interface VisionDocument {
  id: string;
  title: string;
  description?: string;
  documentType: 'paper' | 'pitch';
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  owner?: {
    firstName?: string;
    lastName?: string;
  };
}

interface VisionListProps {
  onDocumentSelect?: (document: VisionDocument) => void;
}

export function VisionList({ onDocumentSelect }: VisionListProps) {
  const { ui } = useRevenueOS();
  const [documents, setDocuments] = useState<VisionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'paper' | 'pitch'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPitchDocument, setSelectedPitchDocument] = useState<{ id: string; document: any } | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const fetchDocuments = useCallback(async () => {
    const workspaceId = ui.activeWorkspace?.id;
    
    if (!workspaceId) {
      console.log('⚠️ [VisionList] No workspace ID available, waiting...');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log('🔍 [VisionList] Fetching documents for workspace:', workspaceId);
      
      const response = await fetch(`/api/v1/stacks/vision?workspaceId=${workspaceId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to fetch vision documents';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('❌ [VisionList] API error:', errorData);
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `${response.status} ${response.statusText}`;
          console.error('❌ [VisionList] API error (non-JSON):', response.status, response.statusText);
        }
        // Don't throw for auth errors - just show empty state
        if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ [VisionList] Authentication error, showing empty state');
          setDocuments([]);
          setError('Authentication required. Please refresh the page.');
          setLoading(false);
          return;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching vision documents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vision documents';
      setError(errorMessage);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [ui.activeWorkspace?.id]);

  useEffect(() => {
    // Only fetch if workspace is available
    if (ui.activeWorkspace?.id) {
      fetchDocuments();
    }
  }, [fetchDocuments, ui.activeWorkspace?.id]);

  const handleDocumentClick = async (document: VisionDocument) => {
    // Handle pitch documents inline (like Chronicle does)
    if (document.documentType === 'pitch') {
      try {
        const response = await fetch(`/api/v1/stacks/vision/${document.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedPitchDocument({
            id: document.id,
            document: data.document
          });
          setIsPresentationMode(false);
        } else {
          console.error('Failed to fetch pitch document');
        }
      } catch (err) {
        console.error('Error fetching pitch document:', err);
      }
    } else {
      // Call onDocumentSelect for paper documents (like Chronicle does for non-PITCH reports)
      if (onDocumentSelect) {
        onDocumentSelect(document);
      }
    }
  };

  const handlePresent = () => {
    setIsPresentationMode(true);
  };

  const handleClosePresentation = () => {
    setIsPresentationMode(false);
  };

  const handleBackToVision = () => {
    setSelectedPitchDocument(null);
    setIsPresentationMode(false);
  };

  const handleCreateDocument = useCallback(async (documentType: 'paper' | 'pitch') => {
    if (!ui.activeWorkspace?.id) {
      console.error('No workspace selected');
      return;
    }

    try {
      const response = await fetch('/api/v1/documents/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: `New ${documentType === 'pitch' ? 'Pitch' : 'Paper'}`,
          documentType: documentType,
          workspaceId: ui.activeWorkspace.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const newDocument = await response.json();
      setIsCreateModalOpen(false);
      
      // Refresh the documents list
      await fetchDocuments();
      
      // Open the new document in middle panel (like Chronicle)
      if (onDocumentSelect) {
        onDocumentSelect({
          id: newDocument.id,
          title: newDocument.title || `New ${documentType === 'pitch' ? 'Pitch' : 'Paper'}`,
          documentType: documentType,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error creating document:', error);
      setError('Failed to create document. Please try again.');
    }
  }, [ui.activeWorkspace, fetchDocuments, onDocumentSelect]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === 'pitch' ? 'Pitch' : 'Paper';
  };

  const getDocumentTypeColor = (type: string) => {
    return type === 'pitch' 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  // Filter documents based on search and type
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    // Sort by updated date (newest first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (loading) {
    return (
      <div className="h-full w-full">
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-background rounded-lg border border-border p-6 animate-pulse">
                <div className="h-4 bg-loading-bg rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-loading-bg rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-loading-bg rounded w-full mb-2"></div>
                <div className="h-3 bg-loading-bg rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Vision</h1>
              <p className="text-sm text-muted mt-1">Papers and pitch presentations</p>
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-red-800 font-medium mb-2">Unable to load documents</p>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchDocuments();
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show pitch presentation if selected (like Chronicle does)
  if (selectedPitchDocument) {
    const pitchData = selectedPitchDocument.document;
    const slideData = {
      ...(pitchData.content || { slides: {} }),
      title: pitchData.title || 'Pitch Presentation'
    };

    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        {isPresentationMode ? (
          <PresentationView 
            slideData={slideData} 
            onClose={handleClosePresentation}
          />
        ) : (
          <div className="flex-1 overflow-hidden">
            <PitchRegularView 
              slideData={slideData}
              onPresent={handlePresent}
              onBack={handleBackToVision}
              hideHeader={false}
              sectionName="Vision"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Vision</h1>
            <p className="text-sm text-muted mt-1">Papers and pitch presentations</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'paper' | 'pitch')}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">All Types</option>
            <option value="paper">Papers</option>
            <option value="pitch">Pitches</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted mb-4">
              <DocumentTextIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
            <p className="text-muted mb-4">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Create your first vision document to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                onClick={() => handleDocumentClick(document)}
                className="bg-background rounded-lg border border-border p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col gap-3">
                  {/* Type badge and date */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(document.documentType)}`}>
                      {getDocumentTypeLabel(document.documentType)}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted">
                        {formatDate(document.updatedAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Title and description */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {document.documentType === 'pitch' ? (
                        <PresentationChartBarIcon className="h-5 w-5 text-muted" />
                      ) : (
                        <DocumentTextIcon className="h-5 w-5 text-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {document.title}
                      </h3>
                      {document.description && (
                        <p className="text-sm text-muted line-clamp-2">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer with metadata */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-xs">
                      {document.viewCount !== undefined && (
                        <div className="text-muted">
                          {document.viewCount} {document.viewCount === 1 ? 'view' : 'views'}
                        </div>
                      )}
                      {document.owner && (
                        <div className="text-muted">
                          {document.owner.firstName} {document.owner.lastName}
                        </div>
                      )}
                    </div>
                    <svg className="h-5 w-5 text-muted group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      <VisionDocumentTypeSelector
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSelect={handleCreateDocument}
      />
    </div>
  );
}

