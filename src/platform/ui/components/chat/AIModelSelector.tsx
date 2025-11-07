"use client";

import React, { useState, useRef, useEffect } from "react";

export type AIModel = {
  id: string;
  name: string;
  displayName: string;
  version: string;
  provider: string;
  openRouterModelId?: string; // OpenRouter model identifier
};

export const AI_MODELS: AIModel[] = [
  {
    id: "auto",
    name: "Auto",
    displayName: "Auto",
    version: "Routing",
    provider: "Auto",
    openRouterModelId: undefined // Auto-select based on complexity
  },
  {
    id: "adrata-s1",
    name: "Adrata S1",
    displayName: "Adrata S1 (Sales Strategy)",
    version: "Intelligent Sales Context",
    provider: "Adrata",
    openRouterModelId: undefined // Uses intelligent routing with smart sales context
  },
  {
    id: "chatgpt",
    name: "ChatGPT 5",
    displayName: "ChatGPT 5 (General Purpose)",
    version: "General Purpose",
    provider: "OpenAI",
    openRouterModelId: "openai/gpt-5" // GPT-5 for general purpose tasks
  },
  {
    id: "claude",
    name: "Claude 4.5 Sonnet",
    displayName: "Claude 4.5 Sonnet (Strong Logic)",
    version: "Strong Logic",
    provider: "Anthropic",
    openRouterModelId: "anthropic/claude-sonnet-4.5"
  },
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    displayName: "Gemini 2.0 Flash (Multimodal)",
    version: "Multimodal",
    provider: "Google",
    openRouterModelId: "google/gemini-2.0-flash-exp"
  },
  {
    id: "perplexity",
    name: "Perplexity",
    displayName: "Perplexity (Web Research)",
    version: "Web Research",
    provider: "Perplexity",
    openRouterModelId: "perplexity/llama-3.1-sonar-large-128k-online"
  }
];

interface AIModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  className?: string;
}

export function AIModelSelector({ selectedModel, onModelChange, className = "" }: AIModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleModelSelect = (model: AIModel) => {
    onModelChange(model);
    setIsOpen(false);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('adrata-selected-ai-model', JSON.stringify(model));
    }
  };

  // Group models by provider
  const groupedModels = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background border border-border rounded-xl px-2 py-1 text-foreground font-normal text-base flex items-center gap-1.5 hover:bg-hover transition-colors cursor-pointer"
        style={{ marginLeft: '-2px', marginTop: '5px' }}
        aria-label="Select AI model"
        aria-expanded={isOpen}
      >
        <span>{selectedModel.displayName}</span>
        <svg
          className={`w-3 h-3 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider} className="mb-2 last:mb-0">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-hover transition-colors ${
                      selectedModel.id === model.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-foreground'
                    }`}
                  >
                    <div className="font-medium">{model.displayName}</div>
                    <div className="text-xs text-muted">{model.version}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
