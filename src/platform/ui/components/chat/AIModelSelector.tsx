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
    id: "claude-4-5-sonnet",
    name: "Claude 4.5 Sonnet",
    displayName: "Claude 4.5 Sonnet",
    version: "Best Overall Performance",
    provider: "Anthropic"
  },
  {
    id: "perplexity-research",
    name: "Perplexity Research",
    displayName: "Perplexity Research",
    version: "Real-time Web Research",
    provider: "Perplexity"
  },
  {
    id: "adrata-enhanced",
    name: "Adrata Enhanced",
    displayName: "Adrata Enhanced",
    version: "Context-Aware Intelligence",
    provider: "Adrata"
  },
  {
    id: "adrata-powerhouse",
    name: "Adrata Powerhouse",
    displayName: "Adrata Powerhouse",
    version: "Multi-Model Intelligence",
    provider: "Adrata"
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
        <span className="text-xs text-[var(--muted)]">• Auto</span>
      </div>
    </div>
  );
}
