"use client";

import React from "react";
import { 
  XMarkIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  CodeBracketIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface DocumentTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (documentType: string) => void;
}

const documentTypes = [
  {
    id: 'paper',
    name: 'Paper',
    description: 'Rich text documents for notes, articles, and reports',
    icon: DocumentTextIcon,
    color: 'text-blue-600 bg-blue-100',
    examples: ['Meeting notes', 'Project reports', 'Documentation'],
  },
  {
    id: 'pitch',
    name: 'Pitch',
    description: 'Presentations and slides for meetings and demos',
    icon: PresentationChartBarIcon,
    color: 'text-purple-600 bg-purple-100',
    examples: ['Sales presentations', 'Project updates', 'Training materials'],
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Spreadsheets and data tables for analysis',
    icon: TableCellsIcon,
    color: 'text-green-600 bg-green-100',
    examples: ['Budget sheets', 'Data analysis', 'Project tracking'],
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Data visualization and analytics dashboards',
    icon: ChartBarIcon,
    color: 'text-orange-600 bg-orange-100',
    examples: ['Analytics dashboards', 'Data visualizations', 'KPI reports'],
  },
];

export function DocumentTypeSelector({ isOpen, onClose, onSelect }: DocumentTypeSelectorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-panel-background0 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-background rounded-lg shadow-xl max-w-4xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Create New Document</h3>
              <p className="text-sm text-muted">Choose a document type to get started</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((type) => {
                const Icon = type.icon;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => onSelect(type.id)}
                    className="p-6 text-left border border-border rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${type.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-2 group-hover:text-blue-600 transition-colors">
                          {type.name}
                        </h4>
                        <p className="text-sm text-muted mb-3">
                          {type.description}
                        </p>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted uppercase tracking-wide">
                            Examples:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {type.examples.map((example, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-hover text-muted"
                              >
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
