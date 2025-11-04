"use client";

import React, { useState, useRef } from "react";
import { 
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setError(null);
    
    // Validate files
    const validFiles: File[] = [];
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum size is 100MB.`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setUploadedFiles(validFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // TODO: Implement actual upload logic
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', 'workspace1'); // TODO: Get from context
        
        // Simulate upload progress
        const progress = ((i + 1) / uploadedFiles.length) * 100;
        setUploadProgress(progress);
        
        // TODO: Replace with actual API call
        // await fetch('/api/v1/documents/upload', {
        //   method: 'POST',
        //   body: formData,
        // });
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Reset and close
      setUploadedFiles([]);
      setUploadProgress(0);
      onClose();
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-panel-background0 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-background rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Upload Files</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-hover rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {uploadedFiles.length === 0 ? (
              /* Upload Area */
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-border hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <CloudArrowUpIcon className="w-12 h-12 text-muted mx-auto mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Drop files here or click to browse
                </h4>
                <p className="text-muted mb-4">
                  Upload documents, images, and other files up to 100MB each
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            ) : (
              /* File List */
              <div className="space-y-4">
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-panel-background rounded-lg"
                    >
                      <DocumentIcon className="w-8 h-8 text-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {file.name}
                        </div>
                        <div className="text-sm text-muted">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-loading-bg rounded transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4 text-muted" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Uploading...</span>
                      <span className="text-muted">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-loading-bg rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? 'Uploading...' : `Upload ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
