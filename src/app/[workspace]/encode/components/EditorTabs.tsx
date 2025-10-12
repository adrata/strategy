"use client";

import React from "react";
import { useEncode } from "../layout";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function EditorTabs() {
  const {
    openFiles,
    activeFile,
    setActiveFile,
    closeFile,
    editorContent,
    setEditorContent,
    setLanguage,
    setIsDirty,
  } = useEncode();

  const handleTabClick = (file: any) => {
    setActiveFile(file);
    setEditorContent(file.content);
    setLanguage(file.language);
    setIsDirty(false);
  };

  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    closeFile(fileId);
  };

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-[var(--panel-background)] border-b border-[var(--border)] overflow-x-auto">
      {openFiles.map((file) => {
        const isActive = activeFile?.id === file.id;
        
        return (
          <div
            key={file.id}
            className={`flex items-center gap-2 px-3 py-2 border-r border-[var(--border)] cursor-pointer min-w-0 group ${
              isActive 
                ? 'bg-[var(--background)] text-[var(--foreground)]' 
                : 'bg-[var(--panel-background)] text-[var(--muted)] hover:bg-[var(--hover)]'
            }`}
            onClick={() => handleTabClick(file)}
          >
            <span className="text-sm truncate max-w-32">
              {file.name}
            </span>
            
            <button
              onClick={(e) => handleCloseTab(e, file.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-all"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
