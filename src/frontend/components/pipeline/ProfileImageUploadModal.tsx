"use client";

import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CheckIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';

interface ProfileImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: string) => void;
  currentImageUrl?: string;
  personName: string;
}

export function ProfileImageUploadModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentImageUrl,
  personName 
}: ProfileImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Convert file to base64 for now (in production, you'd upload to a service)
      const base64 = await fileToBase64(selectedFile);
      onSave(base64);
      onClose();
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader['onload'] = () => resolve(reader.result as string);
      reader['onerror'] = error => reject(error);
    });
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    if (fileInputRef.current) {
      fileInputRef['current']['value'] = '';
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg p-6 w-96 max-w-[90vw]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Update Profile Photo
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Current/Preview Image with Zoom Controls */}
        <div className="mb-4">
          <div className="w-32 h-32 mx-auto bg-[var(--loading-bg)] rounded-xl flex items-center justify-center overflow-hidden border-2 border-[var(--border)] relative">
            {previewUrl ? (
              <div 
                className="w-full h-full relative overflow-hidden cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <img 
                  ref={imageRef}
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transformOrigin: 'center center'
                  }}
                />
              </div>
            ) : currentImageUrl ? (
              <img 
                src={currentImageUrl} 
                alt={personName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-medium text-[var(--muted)]">
                {personName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Zoom Controls */}
          {previewUrl && (
            <div className="flex justify-center gap-2 mt-2">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded-full bg-[var(--hover)] hover:bg-[var(--loading-bg)] transition-colors"
                title="Zoom Out"
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4 text-[var(--muted)]" />
              </button>
              <span className="text-xs text-[var(--muted)] px-2 py-1 bg-[var(--hover)] rounded">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded-full bg-[var(--hover)] hover:bg-[var(--loading-bg)] transition-colors"
                title="Zoom In"
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>
          )}
        </div>

        {/* File Input */}
        <div className="mb-4 flex justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-gray-700 hover:bg-[var(--panel-background)] transition-colors"
          >
            {selectedFile ? 'Choose Different Photo' : 'Choose Photo'}
          </button>
        </div>

        {/* Remove Image Button */}
        {(previewUrl || currentImageUrl) && (
          <div className="mb-4">
            <button
              onClick={handleRemoveImage}
              className="w-full py-2 px-4 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove Photo
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-[var(--border)] rounded-lg text-sm font-medium text-gray-700 hover:bg-[var(--panel-background)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFile || isUploading}
            className="flex-1 py-2 px-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                Save Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
