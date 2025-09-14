"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  DocumentChartBarIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface UploadedContent {
  id: string;
  originalName: string;
  aiGeneratedName: string;
  fileType: string;
  size: number;
  summary?: string;
  keyInsights?: string[];
  status: "uploading" | "processing" | "completed" | "error";
  uploadedAt: string;
}

interface SmartContentUploaderProps {
  onContentAdded: (content: UploadedContent[]) => void;
  onContentRemoved: (contentId: string) => void;
  maxFiles?: number;
}

export function SmartContentUploader({
  onContentAdded,
  onContentRemoved,
  maxFiles = 10,
}: SmartContentUploaderProps) {
  const [uploadedContent, setUploadedContent] = useState<UploadedContent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateAIName = async (file: File): Promise<string> => {
    // Simulate AI naming based on file type and content
    if (file.type.includes("image")) {
      return `Visual Asset - ${file.name.split(".")[0]}`;
    } else if (file.type.includes("pdf")) {
      return `Document Analysis - ${file.name.split(".")[0]}`;
    } else if (file.name.includes(".xlsx") || file.name.includes(".csv")) {
      return `Data Analysis - ${file.name.split(".")[0]}`;
    } else {
      const smartNames = [
        "Strategic Planning Document",
        "Market Research Report",
        "Customer Insights Analysis",
        "Financial Performance Review",
        "Partnership Proposal",
        "Product Roadmap Overview",
      ];
      return (
        smartNames[Math.floor(Math.random() * smartNames.length)] ||
        "Strategic Planning Document"
      );
    }
  };

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      if (uploadedContent.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newContent: UploadedContent[] = [];

      for (const file of fileArray) {
        const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const initialContent: UploadedContent = {
          id: contentId,
          originalName: file.name,
          aiGeneratedName: "Processing...",
          fileType: getFileType(file),
          size: file.size,
          status: "processing",
          uploadedAt: new Date().toISOString(),
        };

        newContent.push(initialContent);
        setUploadedContent((prev) => [...prev, initialContent]);

        try {
          // Generate AI name
          const aiName = await generateAIName(file);

          // Generate summary and insights
          const summary = `Smart analysis of ${file.name} completed. Content extracted and structured for AI processing.`;
          const keyInsights = [
            "Content successfully parsed and indexed",
            "Key information extracted for search",
            "Ready for AI-powered analysis",
          ];

          const finalContent: UploadedContent = {
            ...initialContent,
            aiGeneratedName: aiName,
            summary,
            keyInsights,
            status: "completed",
          };

          setUploadedContent((prev) =>
            prev.map((c) => (c['id'] === contentId ? finalContent : c)),
          );

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error("Error processing file:", error);
          setUploadedContent((prev) =>
            prev.map((c) =>
              c['id'] === contentId ? { ...c, status: "error" } : c,
            ),
          );
        }
      }

      const completedContent = newContent.filter(
        (c) => c['status'] === "completed",
      );
      if (completedContent.length > 0) {
        onContentAdded(completedContent);
      }
    },
    [uploadedContent.length, maxFiles, onContentAdded],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      e['target']['value'] = "";
    },
    [processFiles],
  );

  const handleRemoveContent = (contentId: string) => {
    setUploadedContent((prev) => prev.filter((c) => c.id !== contentId));
    onContentRemoved(contentId);
  };

  const getFileType = (file: File): string => {
    if (file.type.startsWith("image/")) return "image";
    if (file['type'] === "application/pdf") return "pdf";
    if (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))
      return "spreadsheet";
    return "document";
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return PhotoIcon;
      case "pdf":
        return DocumentIcon;
      case "spreadsheet":
        return DocumentChartBarIcon;
      default:
        return DocumentIcon;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center">
          <CloudArrowUpIcon
            className={`mx-auto h-12 w-12 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
          />
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isDragging ? "Drop files here" : "Drag & drop any files here"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              or{" "}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                browse to upload
              </button>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              PNG, JPG, PDF, XLSX, CSV, DOCX and more...
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Content List */}
      {uploadedContent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              AI-Enhanced Content ({uploadedContent.length})
            </h4>
          </div>

          {uploadedContent.map((content) => {
            const IconComponent = getFileIcon(content.fileType);

            return (
              <div
                key={content.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <IconComponent className="w-8 h-8 text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {content.aiGeneratedName}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {content.originalName} •{" "}
                          {formatFileSize(content.size)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {content['status'] === "completed" && (
                          <CheckIcon className="w-4 h-4 text-green-500" />
                        )}
                        {content['status'] === "processing" && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        <button
                          onClick={() => handleRemoveContent(content.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {content['summary'] && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                        {content.summary}
                      </p>
                    )}

                    {content['keyInsights'] && content.keyInsights.length > 0 && (
                      <div className="space-y-1">
                        {content.keyInsights
                          .slice(0, 2)
                          .map((insight, index) => (
                            <div
                              key={index}
                              className="text-xs text-blue-600 dark:text-blue-400"
                            >
                              • {insight}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
