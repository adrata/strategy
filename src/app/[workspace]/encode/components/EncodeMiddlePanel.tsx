"use client";

import React from "react";
import { MonacoEditor } from "./MonacoEditor";
import { EditorTabs } from "./EditorTabs";
import { StatusBar } from "./StatusBar";

export function EncodeMiddlePanel() {
  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <EditorTabs />
      <div className="flex-1 min-h-0">
        <MonacoEditor />
      </div>
      <StatusBar />
    </div>
  );
}
