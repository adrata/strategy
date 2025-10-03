"use client";

import React, { useState, useEffect } from "react";
import { authFetch } from '@/platform/auth-fetch';
import {
  XMarkIcon,
  DocumentIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  PhotoIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  CodeBracketIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";

interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFiles: (files: ContextFile[]) => void;
}

interface ContextFile {
  id: string;
  name: string;
  type: 'file' | 'lead' | 'contact' | 'company' | 'opportunity' | 'account';
  size?: number;
  fileType?: string;
  data?: any; // For database records
}

interface DatabaseRecord {
  id: string;
  name: string;
  type: string;
  metadata?: any;
}

const FILE_TYPES = [
  { 
    key: 'documents', 
    label: 'Documents', 
    icon: DocumentTextIcon, 
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    color: 'text-blue-600'
  },
  { 
    key: 'spreadsheets', 
    label: 'Spreadsheets', 
    icon: TableCellsIcon, 
    extensions: ['.xlsx', '.xls', '.csv'],
    color: 'text-green-600'
  },
  { 
    key: 'presentations', 
    label: 'Presentations', 
    icon: PresentationChartLineIcon, 
    extensions: ['.ppt', '.pptx'],
    color: 'text-orange-600'
  },
  { 
    key: 'images', 
    label: 'Images', 
    icon: PhotoIcon, 
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg'],
    color: 'text-purple-600'
  },
  { 
    key: 'code', 
    label: 'Code Files', 
    icon: CodeBracketIcon, 
    extensions: ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp'],
    color: 'text-gray-600'
  },
  { 
    key: 'archives', 
    label: 'Archives', 
    icon: ArchiveBoxIcon, 
    extensions: ['.zip', '.rar', '.7z', '.tar'],
    color: 'text-yellow-600'
  },
];

const DATA_TYPES = [
  { 
    key: 'leads', 
    label: 'Leads', 
    icon: UserIcon, 
    description: 'Add lead profiles for context',
    color: 'text-blue-600'
  },
  { 
    key: 'contacts', 
    label: 'Contacts', 
    icon: UserIcon, 
    description: 'Add contact information',
    color: 'text-green-600'
  },
  { 
    key: 'companies', 
    label: 'Companies', 
    icon: BuildingOfficeIcon, 
    description: 'Add company profiles and data',
    color: 'text-purple-600'
  },
  { 
    key: 'opportunities', 
    label: 'Opportunities', 
    icon: BriefcaseIcon, 
    description: 'Add deal and opportunity details',
    color: 'text-orange-600'
  },
  { 
    key: 'accounts', 
    label: 'Accounts', 
    icon: BuildingOfficeIcon, 
    description: 'Add account information',
    color: 'text-indigo-600'
  },
];

export function FilePickerModal({ isOpen, onClose, onAddFiles }: FilePickerModalProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'data'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<ContextFile[]>([]);
  const [searchResults, setSearchResults] = useState<DatabaseRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedFiles([]);
      setSearchResults([]);
      setSelectedDataType('');
    }
  }, [isOpen]);

  // Search database records
  const searchDatabaseRecords = async (query: string, type: string) => {
    if (!query.trim() || !type) return;
    
    setIsSearching(true);
    try {
      // Get workspace context for API call
      const { workspaceId, userId } = await WorkspaceDataRouter.getApiParams();
      
      const response = await authFetch(`/api/search/${type}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && selectedDataType && activeTab === 'data') {
        searchDatabaseRecords(searchQuery, selectedDataType);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedDataType, activeTab]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: ContextFile[] = Array.from(files).map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: 'file',
      size: file.size,
      fileType: file.type,
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDataRecordSelect = (record: DatabaseRecord) => {
    const contextFile: ContextFile = {
      id: `data-${record.type}-${record.id}`,
      name: record.name,
      type: record.type as any,
      data: record,
    };

    setSelectedFiles(prev => {
      // Avoid duplicates
      if (prev.some(f => f['id'] === contextFile.id)) return prev;
      return [...prev, contextFile];
    });
  };

  const removeSelectedFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleAddFiles = () => {
    onAddFiles(selectedFiles);
    onClose();
  };

  const getFileIcon = (file: ContextFile) => {
    if (file.type !== 'file') {
      const dataType = DATA_TYPES.find(dt => dt['key'] === file.type + 's');
      return dataType?.icon || DocumentIcon;
    }

    const extension = file.name.toLowerCase().split('.').pop();
    const fileType = FILE_TYPES.find(ft => 
      ft.extensions.some(ext => ext.includes(extension || ''))
    );
    return fileType?.icon || DocumentIcon;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Context</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add files or data to provide context for the AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DocumentIcon className="w-4 h-4 inline mr-2" />
            Computer Files
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
            Adrata Data
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'files' ? (
              <div className="space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop files here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Support for documents, images, spreadsheets, and more
                    </p>
                  </label>
                </div>

                {/* File Type Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">File Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FILE_TYPES.map((fileType) => {
                      const Icon = fileType.icon;
                      return (
                        <div
                          key={fileType.key}
                          className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <Icon className={`w-6 h-6 ${fileType.color} mb-2`} />
                          <p className="text-sm font-medium text-gray-900">{fileType.label}</p>
                          <p className="text-xs text-gray-500">
                            {fileType.extensions.join(', ')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Data Type Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Select Data Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DATA_TYPES.map((dataType) => {
                      const Icon = dataType.icon;
                      const isSelected = selectedDataType === dataType.key;
                      return (
                        <button
                          key={dataType.key}
                          onClick={() => setSelectedDataType(dataType.key)}
                          className={`p-4 border rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${dataType.color} mb-2`} />
                          <p className="text-sm font-medium text-gray-900">{dataType.label}</p>
                          <p className="text-xs text-gray-500">{dataType.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search */}
                {selectedDataType && (
                  <div>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${selectedDataType}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Search Results */}
                    {isSearching ? (
                      <div className="mt-4 text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {searchResults.map((record) => (
                          <button
                            key={record.id}
                            onClick={() => handleDataRecordSelect(record)}
                            className="w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 text-left transition-colors"
                          >
                            <p className="font-medium text-gray-900">{record.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{record.type}</p>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery && selectedDataType ? (
                      <div className="mt-4 text-center py-8 text-gray-500">
                        <p>No {selectedDataType} found for "{searchQuery}"</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Files Sidebar */}
          {selectedFiles.length > 0 && (
            <div className="w-80 border-l border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Selected ({selectedFiles.length})
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file) => {
                  const Icon = getFileIcon(file);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {file['type'] === 'file' ? 'File' : file.type}
                        </p>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(file.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddFiles}
              disabled={selectedFiles['length'] === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedFiles.length} Item{selectedFiles.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
