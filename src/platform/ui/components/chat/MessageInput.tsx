"use client";

import React, { useRef, useState } from "react";
import { PaperAirplaneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";

interface MessageInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  uploadingImage: boolean;
  onImageUpload: (file: File) => Promise<void>;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  attachedFiles: Array<{
    name: string;
    size: number;
    data: string;
    type: string;
  }>;
  setAttachedFiles: React.Dispatch<
    React.SetStateAction<
      Array<{ name: string; size: number; data: string; type: string }>
    >
  >;
}

export function MessageInput({
  inputValue,
  setInputValue,
  onSubmit,
  placeholder = "Ask me anything...",
  disabled = false,
  isDragging,
  setIsDragging,
  uploadingImage,
  onImageUpload,
  onStartTyping,
  onStopTyping,
  attachedFiles,
  setAttachedFiles,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isEnterHandledRef = useRef(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        onImageUpload(file);
      }
    });
  };

  // Paste handler for images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    items.forEach((item) => {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          onImageUpload(file);
        }
      }
    });
  };

  // File input handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        onImageUpload(file);
      }
    });
    // Reset input
    if (fileInputRef.current) {
      fileInputRef['current']['value'] = "";
    }
  };

  // Emoji picker
  const insertEmoji = (emoji: string) => {
    setInputValue(inputValue + emoji);
    setShowEmojiPicker(false);
  };

  // Remove attached file
  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e['key'] === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isEnterHandledRef['current'] && inputValue.trim()) {
        isEnterHandledRef['current'] = true;
        onSubmit(e as any);
        setTimeout(() => {
          isEnterHandledRef['current'] = false;
        }, 100);
      }
    }
  };

  // Handle input change with typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Trigger typing indicators
    if (value.length > 0 && onStartTyping) {
      onStartTyping();
    } else if (value['length'] === 0 && onStopTyping) {
      onStopTyping();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2"
              >
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachedFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
          <div className="text-blue-600 font-semibold">
            Drop images here to upload
          </div>
        </div>
      )}

      {/* Main input area */}
      <div className="relative p-4">
        <form onSubmit={onSubmit} className="flex items-end space-x-3">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploadingImage}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <PlusIcon className="h-5 w-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                minHeight: "40px",
                maxHeight: "120px",
                overflowY: inputValue.length > 100 ? "auto" : "hidden",
              }}
            />

            {/* Emoji picker toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              😊
            </button>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
                <div className="grid grid-cols-6 gap-2">
                  {[
                    "😊",
                    "😂",
                    "❤️",
                    "👍",
                    "👎",
                    "😢",
                    "😮",
                    "😡",
                    "🎉",
                    "🔥",
                    "💯",
                    "✨",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || !inputValue.trim() || uploadingImage}
            className="flex-shrink-0 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload indicator */}
        {uploadingImage && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2 text-blue-600">
              <PipelineSkeleton message="Uploading..." />
              <span className="text-sm font-medium">Uploading image...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
