"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  DocumentIcon, 
  FolderIcon, 
  ComputerDesktopIcon,
  CloudIcon,
  PhotoIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  CodeBracketIcon,
  ArchiveBoxIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  category: 'docs' | 'code' | 'image' | 'data' | 'archive' | 'other';
  size?: number;
  modified?: Date;
  path: string;
}

interface EnhancedFileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: File[]) => void;
  onAddFiles: () => void;
}

const FILE_CATEGORIES = [
  { id: 'all', name: 'All Files', icon: DocumentIcon },
  { id: 'docs', name: 'Documents', icon: DocumentTextIcon },
  { id: 'code', name: 'Code', icon: CodeBracketIcon },
  { id: 'image', name: 'Images', icon: PhotoIcon },
  { id: 'data', name: 'Data', icon: TableCellsIcon },
  { id: 'presentations', name: 'Presentations', icon: PresentationChartBarIcon },
  { id: 'archive', name: 'Archives', icon: ArchiveBoxIcon },
];

const RECENT_FILES: FileItem[] = [
  {
    id: '1',
    name: 'Q4-2024-Pipeline-Analysis.xlsx',
    type: 'file',
    category: 'data',
    size: 2.4 * 1024 * 1024,
    modified: new Date(Date.now() - 2 * 60 * 60 * 1000),
    path: '/Documents/Reports/Q4-2024-Pipeline-Analysis.xlsx'
  },
  {
    id: '2',
    name: 'Customer-Feedback-Survey.pdf',
    type: 'file',
    category: 'docs',
    size: 1.8 * 1024 * 1024,
    modified: new Date(Date.now() - 4 * 60 * 60 * 1000),
    path: '/Documents/Customer-Feedback-Survey.pdf'
  },
  {
    id: '3',
    name: 'Product-Roadmap-2025.pptx',
    type: 'file',
    category: 'docs',
    size: 5.2 * 1024 * 1024,
    modified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    path: '/Documents/Presentations/Product-Roadmap-2025.pptx'
  },
  {
    id: '4',
    name: 'lead-enrichment-data.csv',
    type: 'file',
    category: 'data',
    size: 890 * 1024,
    modified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    path: '/Downloads/lead-enrichment-data.csv'
  }
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

function getFileIcon(category: string, name: string) {
  const extension = name.split('.').pop()?.toLowerCase();
  
  switch (category) {
    case 'docs':
      if (extension === 'pdf') return DocumentIcon;
      if (['ppt', 'pptx'].includes(extension || '')) return PresentationChartBarIcon;
      return DocumentTextIcon;
    case 'data':
      return TableCellsIcon;
    case 'image':
      return PhotoIcon;
    case 'code':
      return CodeBracketIcon;
    case 'archive':
      return ArchiveBoxIcon;
    default:
      return DocumentIcon;
  }
}

export function EnhancedFileManager({ isOpen, onClose, onFileSelect, onAddFiles }: EnhancedFileManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState<'computer' | 'cloud'>('computer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = RECENT_FILES.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file['category'] === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
      onClose();
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] dark:bg-[var(--foreground)] rounded-lg shadow-xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] dark:border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)] dark:text-[var(--foreground)]">Add Files</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--hover)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)] dark:text-[var(--muted)]" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-[var(--border)] dark:border-[var(--border)] p-4">
            {/* Source Selection */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedSource('computer')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSource === 'computer'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-[var(--panel-background)]'
                  }`}
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                  <span>Computer</span>
                </button>
                <button
                  onClick={() => setSelectedSource('cloud')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSource === 'cloud'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-[var(--panel-background)]'
                  }`}
                >
                  <CloudIcon className="w-4 h-4" />
                  <span>Cloud Storage</span>
                </button>
              </div>
            </div>

            {/* File Categories */}
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Types</div>
              <div className="space-y-1">
                {FILE_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-[var(--panel-background)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b border-[var(--border)] dark:border-[var(--border)]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Browse Button */}
            <div className="p-4 border-b border-[var(--border)] dark:border-[var(--border)]">
              <button
                onClick={handleBrowseFiles}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ComputerDesktopIcon className="w-5 h-5" />
                <span>Browse {selectedSource === 'computer' ? 'Computer' : 'Cloud Storage'}</span>
              </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedSource === 'computer' ? (
                <>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Files</div>
                  <div className="space-y-2">
                    {filteredFiles.map((file) => {
                      const Icon = getFileIcon(file.category, file.name);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[var(--panel-background)] cursor-pointer transition-colors"
                        >
                          <Icon className="w-5 h-5 text-[var(--muted)] dark:text-[var(--muted)] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)] truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)] flex items-center space-x-2">
                              <span>{file.size ? formatFileSize(file.size) : ''}</span>
                              <span>•</span>
                              <span>{file.modified ? formatTimeAgo(file.modified) : ''}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--muted)] dark:text-[var(--muted)]">
                  <CloudIcon className="w-12 h-12 mb-4" />
                  <div className="text-lg font-medium mb-2">Cloud Storage</div>
                  <div className="text-sm text-center">
                    Connect your cloud storage accounts to access files from Google Drive, Dropbox, and more.
                  </div>
                  <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Connect Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.xls,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.svg,.webp,.tiff,.ico,image/*,text/*,.zip,.rar,.7z,.tar,.gz,.xml,.html,.rtf,.odt,.ods,.odp,.pages,.numbers,.key,.sketch,.fig,.ai,.psd,.eps,.dwg,.dxf,.obj,.stl,.ply,.fbx,.dae,.3ds,.blend,.max,.ma,.mb,.c4d,.lwo,.lws,.lxo,.modo,.sib,.x3d,.wrl,.u3d,.3mf,.amf"
        />
      </div>
    </div>
  );
}
