"use client";

import React from "react";
import { WorkshopDocument } from "../../types/document";
import { GridEditor } from "../../editors/GridEditor";

interface GridEditorWrapperProps {
  document: WorkshopDocument;
  onSave: (content: any) => void;
  onAutoSave: (content: any) => void;
}

export function GridEditorWrapper({ document, onSave, onAutoSave }: GridEditorWrapperProps) {
  return (
    <GridEditor
      document={document}
      onSave={onSave}
      onAutoSave={onAutoSave}
    />
  );
}

