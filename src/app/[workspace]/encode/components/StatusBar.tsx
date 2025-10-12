"use client";

import React from "react";
import { useEncode } from "../layout";

export function StatusBar() {
  const {
    activeFile,
    language,
    isDirty,
  } = useEncode();

  if (!activeFile) {
    return (
      <div className="h-6 bg-[var(--panel-background)] border-t border-[var(--border)] flex items-center px-4 text-xs text-[var(--muted)]">
        <span>Ready</span>
      </div>
    );
  }

  return (
    <div className="h-6 bg-[var(--panel-background)] border-t border-[var(--border)] flex items-center justify-between px-4 text-xs text-[var(--muted)]">
      <div className="flex items-center gap-4">
        <span>Ln 1, Col 1</span>
        <span>{language}</span>
        <span>UTF-8</span>
        <span>LF</span>
        {isDirty && <span className="text-orange-500">•</span>}
      </div>
      
      <div className="flex items-center gap-4">
        <span>Spaces: 2</span>
        <span>Ready</span>
      </div>
    </div>
  );
}
