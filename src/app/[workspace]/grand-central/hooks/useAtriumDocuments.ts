import { useState, useEffect } from 'react';

export interface AtriumDocument {
  id: string;
  title: string;
  documentType: 'paper' | 'pitch' | 'grid' | 'code' | 'matrix';
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    name: string;
    email: string;
  };
}

export function useAtriumDocuments(workspaceId: string) {
  const [documents, setDocuments] = useState<AtriumDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/atrium/documents?workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch documents');
        // For demo purposes, set some mock data
        setDocuments([
          {
            id: 'doc-1',
            title: 'Product Strategy Document',
            documentType: 'paper',
            status: 'published',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-20'),
            owner: { name: 'John Doe', email: 'john@example.com' }
          },
          {
            id: 'doc-2',
            title: 'Q1 Sales Presentation',
            documentType: 'pitch',
            status: 'published',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-18'),
            owner: { name: 'Jane Smith', email: 'jane@example.com' }
          },
          {
            id: 'doc-3',
            title: 'Customer Data Analysis',
            documentType: 'grid',
            status: 'draft',
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-19'),
            owner: { name: 'Mike Johnson', email: 'mike@example.com' }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [workspaceId]);

  const getDocumentsByType = (type: AtriumDocument['documentType']) => {
    return documents.filter(doc => doc.documentType === type);
  };

  const getDocumentCounts = () => {
    return {
      paper: getDocumentsByType('paper').length,
      pitch: getDocumentsByType('pitch').length,
      grid: getDocumentsByType('grid').length,
      code: getDocumentsByType('code').length,
      matrix: getDocumentsByType('matrix').length,
      total: documents.length
    };
  };

  return { 
    documents, 
    loading, 
    error, 
    getDocumentsByType, 
    getDocumentCounts 
  };
}
