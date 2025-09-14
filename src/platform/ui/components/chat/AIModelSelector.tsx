"use client";

import React from "react";

export type AIModel = {
  id: string;
  name: string;
  displayName: string;
  version: string;
  provider: string;
};

export const AI_MODELS: AIModel[] = [
  {
    id: "adrata-advanced",
    name: "Adrata Advanced",
    displayName: "Adrata Advanced",
    version: "Enhanced Reasoning",
    provider: "Adrata"
  },
  {
    id: "adrata-powerhouse",
    name: "Adrata Powerhouse",
    displayName: "Adrata Powerhouse",
    version: "Most Advanced",
    provider: "Adrata"
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    displayName: "Claude 3.5 Sonnet",
    version: "Latest Claude - Best AI",
    provider: "Anthropic"
  }
];

interface AIModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  className?: string;
}

export function AIModelSelector({ selectedModel, onModelChange, className = "" }: AIModelSelectorProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-2 py-1 text-[var(--foreground)] font-normal text-base flex items-center gap-1.5"
        style={{ marginLeft: '-2px', marginTop: '5px' }}
      >
        <span>{selectedModel.provider}</span>
      </div>
    </div>
  );
}
