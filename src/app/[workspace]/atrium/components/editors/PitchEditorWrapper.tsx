"use client";

import React, { useCallback } from "react";
import { WorkshopDocument } from "../../types/document";
import { PitchEditor } from "@/app/[workspace]/workshop/editors/PitchEditor";

interface PitchEditorWrapperProps {
  document: WorkshopDocument;
  onSave: (content: any) => void;
  onAutoSave: (content: any) => void;
}

export function PitchEditorWrapper({ document, onSave, onAutoSave }: PitchEditorWrapperProps) {
  const handleAutoSave = useCallback((content: any) => {
    onAutoSave(content);
  }, [onAutoSave]);

  return (
    <div className="h-full flex flex-col bg-background">
      <PitchEditor
        document={document}
        onSave={onSave}
        onAutoSave={handleAutoSave}
      />
    </div>
  );
}

