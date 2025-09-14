"use client";

import React, { useState, useEffect } from "react";
import { 
  SparklesIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  FireIcon,
  ChartBarIcon,
  UserIcon
} from "@heroicons/react/24/outline";

/**
 * 🎭 AI PERSONALITY SETTINGS COMPONENT
 * 
 * Simple, user-friendly way to customize AI personality
 * - Pre-built personality presets
 * - Visual personality indicators
 * - Real-time preview
 * - Easy one-click selection
 */

export interface AIPersonality {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  tone: string;
  style: string;
  prompt: string;
  examples: string[];
}

const PERSONALITY_OPTIONS: AIPersonality[] = [
  {
    id: "balanced",
    name: "Balanced Professional",
    description: "Helpful and professional, perfect balance",
    icon: UserIcon,
    color: "text-blue-500",
    gradient: "from-blue-400 to-blue-600",
    tone: "helpful and professional",
    style: "balanced",
    prompt: "You are a helpful and professional sales assistant. Provide balanced, actionable advice with a focus on results.",
    examples: [
      "Let me analyze your pipeline and provide some insights.",
      "Based on your data, I recommend focusing on these leads.",
      "Here's what I found in your sales performance."
    ]
  },
  {
    id: "encouraging",
    name: "Encouraging Coach",
    description: "Enthusiastic support, celebrates your wins",
    icon: HeartIcon,
    color: "text-green-500", 
    gradient: "from-green-400 to-emerald-500",
    tone: "enthusiastic and supportive",
    style: "motivational",
    prompt: "You are an enthusiastic sales coach who celebrates wins and encourages growth. Use positive language, motivational phrases, and always focus on opportunities for improvement.",
    examples: [
      "Great job on closing that deal! Let's build on this momentum.",
      "I see some amazing opportunities in your pipeline!",
      "You're on the right track - here's how to accelerate your success."
    ]
  },
  {
    id: "direct",
    name: "Direct & Honest",
    description: "Straight talk, no sugar-coating",
    icon: ExclamationTriangleIcon,
    color: "text-orange-500",
    gradient: "from-orange-400 to-red-500", 
    tone: "direct and honest",
    style: "no-nonsense",
    prompt: "You are a direct, no-nonsense sales advisor. Be honest about problems, give straight feedback, and focus on actionable results. Cut through the fluff.",
    examples: [
      "Your conversion rate is below average. Here's what needs to change.",
      "Stop wasting time on low-priority leads. Focus here instead.",
      "This strategy isn't working. Try this approach."
    ]
  },
  {
    id: "harsh",
    name: "Tough Love",
    description: "Demanding coach who pushes for excellence",
    icon: FireIcon,
    color: "text-red-500",
    gradient: "from-red-500 to-red-700",
    tone: "firm and demanding", 
    style: "challenging",
    prompt: "You are a demanding sales manager who pushes for excellence. Be firm about missed opportunities, challenge weak performance, and demand better results. Use tough love approach to drive improvement.",
    examples: [
      "You missed your target again. This needs to change immediately.",
      "Why haven't you followed up on these hot leads?",
      "Your activity levels are unacceptable. Step it up."
    ]
  },
  {
    id: "gentle",
    name: "Gentle Guide", 
    description: "Kind and patient mentor",
    icon: HeartIcon,
    color: "text-purple-500",
    gradient: "from-purple-400 to-pink-500",
    tone: "kind and patient",
    style: "supportive",
    prompt: "You are a kind and patient mentor. Be gentle with feedback, offer support during challenges, and use encouraging language. Focus on gradual improvement and emotional support.",
    examples: [
      "I understand this can be challenging. Let's work through it together.",
      "You're making progress! Here's a gentle suggestion for improvement.",
      "Take your time with this - I'm here to support you."
    ]
  },
  {
    id: "analytical",
    name: "Data-Driven Analyst",
    description: "Facts, metrics, and precise insights",
    icon: ChartBarIcon,
    color: "text-indigo-500",
    gradient: "from-indigo-400 to-indigo-600",
    tone: "analytical and precise",
    style: "fact-based", 
    prompt: "You are a data-driven analyst who focuses on metrics, trends, and factual insights. Provide detailed analysis with specific numbers, percentages, and actionable recommendations based on data.",
    examples: [
      "Your conversion rate is 23% below industry average of 15%.",
      "Based on 90-day trends, prioritize companies with >$1M revenue.",
      "Data shows 67% higher success rate when contacting on Tuesdays."
    ]
  }
];

interface AIPersonalitySettingsProps {
  currentPersonality?: string;
  onPersonalityChange: (personality: AIPersonality) => void;
  className?: string;
}

export function AIPersonalitySettings({
  currentPersonality = "balanced",
  onPersonalityChange,
  className = ""
}: AIPersonalitySettingsProps) {
  const [selectedPersonality, setSelectedPersonality] = useState(currentPersonality);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewText, setPreviewText] = useState("");

  const selectedOption = PERSONALITY_OPTIONS.find(p => p['id'] === selectedPersonality) || PERSONALITY_OPTIONS[0];

  useEffect(() => {
    setSelectedPersonality(currentPersonality);
  }, [currentPersonality]);

  const handlePersonalitySelect = (personality: AIPersonality) => {
    setSelectedPersonality(personality.id);
    onPersonalityChange(personality);
  };

  const handlePreview = (personality: AIPersonality) => {
    setPreviewMode(true);
    // Simulate a preview response
    const exampleResponse = personality['examples'][Math.floor(Math.random() * personality.examples.length)];
    setPreviewText(exampleResponse);
    
    // Auto-hide preview after 3 seconds
    setTimeout(() => {
      setPreviewMode(false);
    }, 3000);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SparklesIcon className="w-6 h-6 text-purple-500" />
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">AI Personality</h3>
          <p className="text-sm text-[var(--muted)]">
            Choose how your AI assistant should interact with you
          </p>
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${selectedOption.gradient} flex items-center justify-center`}>
            <selectedOption.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-[var(--foreground)]">{selectedOption.name}</div>
            <div className="text-sm text-[var(--muted)]">{selectedOption.description}</div>
          </div>
        </div>
      </div>

      {/* Personality Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERSONALITY_OPTIONS.map((personality) => {
          const isSelected = personality['id'] === selectedPersonality;
          const IconComponent = personality.icon;
          
          return (
            <div
              key={personality.id}
              className={`
                relative group cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                }
              `}
              onClick={() => handlePersonalitySelect(personality)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Personality Content */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${personality.gradient} flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{personality.name}</div>
                    <div className="text-xs text-[var(--muted)]">{personality.tone}</div>
                  </div>
                </div>

                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {personality.description}
                </p>

                {/* Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(personality);
                  }}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Preview Response →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-[var(--foreground)]">AI Preview</span>
            </div>
            
            <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                "{previewText}"
              </p>
            </div>
            
            <div className="mt-4 text-xs text-[var(--muted)] text-center">
              This is how your AI will respond with this personality
            </div>
          </div>
        </div>
      )}

      {/* Usage Tips */}
      <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
        <h4 className="font-medium text-[var(--foreground)] mb-2">💡 Tips</h4>
        <ul className="text-sm text-[var(--muted)] space-y-1">
          <li>• Your AI personality affects ALL responses across Monaco and Pipeline</li>
          <li>• You can change your personality anytime in settings</li>
          <li>• Try different personalities for different situations</li>
          <li>• "Tough Love" works great when you need motivation</li>
        </ul>
      </div>
    </div>
  );
}

// Export personality options for use in other components
export { PERSONALITY_OPTIONS };
export type { AIPersonality };
