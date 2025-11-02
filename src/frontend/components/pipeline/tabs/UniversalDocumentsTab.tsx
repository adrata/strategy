import React from 'react';

interface UniversalDocumentsTabProps {
  record: any;
  recordType: string;
}

export function UniversalDocumentsTab({ record, recordType }: UniversalDocumentsTabProps) {
  const documents = record?.documents || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Documents</h2>
        <p className="text-muted">Files and documents related to this {recordType === 'companies' ? 'company' : recordType.slice(0, -1)}</p>
      </div>

      {documents['length'] === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No documents yet</h3>
          <p className="text-muted">Upload documents like contracts, proposals, or presentations</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: any, index: number) => (
            <div key={doc.id || index} className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📄</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">
                    {doc.name || doc.filename || 'Untitled Document'}
                  </h4>
                  <p className="text-sm text-muted mb-2">
                    {doc.type || 'Document'}
                  </p>
                  <p className="text-xs text-muted">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View
                    </button>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
