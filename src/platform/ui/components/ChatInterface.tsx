import React, { useState, useRef, useEffect } from "react";
import {
  PaperAirplaneIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { AITierService } from "@/platform/ai/services/aiTierService";
import { SmartModelRouter } from "@/platform/services/smartModelRouter";
import { safeApiFetch } from "@/platform/safe-api-fetch";
import { AdrataIntelligence } from "./AdrataIntelligence";
import { MagicalChanges, useMagicalChanges } from "./MagicalChanges";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  modelUsed?: string;
  cost?: number;
  magicalChanges?: Array<{
    type: "enhance" | "create" | "update" | "insight";
    title: string;
    description: string;
    before?: any;
    after?: any;
    confidence: number;
    impact: "low" | "medium" | "high";
    category: "contact" | "company" | "opportunity" | "intelligence";
  }>;
}

export const ChatInterface: React['FC'] = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<string>("assist");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUnifiedAuth();

  // Magical changes system
  const {
    changes,
    isVisible: showMagicalChanges,
    addChange,
    handleApprove,
    handleReject,
    handleApproveAll,
    setIsVisible: setShowMagicalChanges,
  } = useMagicalChanges();

  // Default workspace ID for demo
  const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || "PLACEHOLDER_VALUE";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate magical responses based on mode
  const generateMagicalResponse = (
    userInput: string,
    mode: string,
  ): { content: string; magicalChanges?: any[] } => {
    const lowerInput = userInput.toLowerCase();

    // Mock magical responses based on intelligence mode
    const modeResponses = {
      observe: {
        content: `I&apos;m observing your request about "${userInput}". I notice this could be related to your sales process. Would you like me to analyze patterns in your recent activities?`,
        magicalChanges: [],
      },
      assist: {
        content: `I can help with that! Based on "${userInput}", I&apos;m preparing some insights and suggestions. Let me analyze your current data and propose improvements.`,
        magicalChanges: [
          {
            type: "insight" as const,
            title: "Smart Contact Timing",
            description:
              "Based on your question, I identified optimal contact times for your prospects",
            confidence: 0.87,
            impact: "medium" as const,
            category: "intelligence" as const,
            before: "Random outreach timing",
            after: "Optimal timing based on prospect behavior",
          },
        ],
      },
      accelerate: {
        content: `Accelerating your request! I&apos;m taking action on "${userInput}" and preparing automated improvements to your workflow.`,
        magicalChanges: [
          {
            type: "enhance" as const,
            title: "Enhanced Lead Scoring",
            description:
              "I&apos;ve improved lead scoring for contacts matching your query",
            confidence: 0.92,
            impact: "high" as const,
            category: "intelligence" as const,
            before: "Basic lead scores",
            after: "AI-enhanced scoring with buying signals",
          },
          {
            type: "create" as const,
            title: "Auto-Generated Outreach",
            description:
              "Created personalized outreach templates for your top prospects",
            confidence: 0.78,
            impact: "medium" as const,
            category: "contact" as const,
          },
        ],
      },
      amplify: {
        content: `Amplifying your impact! I&apos;m orchestrating multiple improvements across your sales process based on "${userInput}".`,
        magicalChanges: [
          {
            type: "update" as const,
            title: "Pipeline Optimization",
            description:
              "Updated pipeline stages and probability scores across your portfolio",
            confidence: 0.94,
            impact: "high" as const,
            category: "opportunity" as const,
            before: "Manual pipeline management",
            after: "AI-optimized pipeline with predictive scoring",
          },
          {
            type: "enhance" as const,
            title: "Stakeholder Mapping",
            description:
              "Enhanced stakeholder identification across your key accounts",
            confidence: 0.89,
            impact: "high" as const,
            category: "company" as const,
          },
        ],
      },
      dominate: {
        content: `Dominating mode activated! I'm implementing strategic intelligence across all aspects of "${userInput}" to maximize your competitive advantage.`,
        magicalChanges: [
          {
            type: "insight" as const,
            title: "Competitive Intelligence",
            description:
              "Identified competitive threats and opportunities in your territory",
            confidence: 0.96,
            impact: "high" as const,
            category: "intelligence" as const,
            before: "Limited competitive visibility",
            after:
              "Real-time competitive intelligence with strategic recommendations",
          },
          {
            type: "create" as const,
            title: "Strategic Account Plans",
            description:
              "Generated comprehensive account plans for your top 10 opportunities",
            confidence: 0.91,
            impact: "high" as const,
            category: "opportunity" as const,
          },
          {
            type: "enhance" as const,
            title: "Market Opportunity Scanner",
            description:
              "Enhanced market scanning to identify new high-value prospects",
            confidence: 0.93,
            impact: "high" as const,
            category: "company" as const,
          },
        ],
      },
    };

    return (
      modeResponses[mode as keyof typeof modeResponses] || modeResponses.assist
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Use smart model routing for cost optimization
      const task = {
        type: "chat-basic" as const,
        complexity: "medium" as const,
        priority: "medium" as const,
        contentLength: messageInput.length,
      };

      // Generate magical response based on current mode
      const magicalResponse = generateMagicalResponse(
        messageInput,
        currentMode,
      );

      // Use magical response content directly
      const result = {
        content:
          magicalResponse.content ||
          "I understand your request and I&apos;m working on it.",
        model: "gpt-3.5-turbo",
        cost: 0.001,
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.content,
        role: "assistant",
        timestamp: new Date(),
        modelUsed: result.model,
        cost: result.cost,
        magicalChanges: magicalResponse.magicalChanges,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Add magical changes if any
      if (
        magicalResponse['magicalChanges'] &&
        magicalResponse.magicalChanges.length > 0
      ) {
        magicalResponse.magicalChanges.forEach((change) => {
          addChange(change);
        });
      }
    } catch (error) {
      console.error("Error getting AI response:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[var(--background)] flex flex-col justify-end relative">
      {/* Magical Changes Overlay */}
      {showMagicalChanges && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <MagicalChanges
              changes={changes}
              onApprove={handleApprove}
              onReject={handleReject}
              onApproveAll={handleApproveAll}
            />
          </div>
        </div>
      )}

      {/* Chat header row fixed to top */}
      <div className="absolute top-0 left-0 w-full z-10 flex flex-row items-center justify-between px-6 pt-6">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--foreground)] font-normal text-lg">
          Grand Central
        </div>
        <div className="flex flex-row items-center space-x-3">
          {/* Cost optimization indicator */}
          <div className="text-xs text-[var(--muted)]">
            {messages
              .filter((m) => m.cost)
              .reduce((sum, m) => sum + (m.cost || 0), 0) > 0 && (
              <span>
                Cost: $
                {messages
                  .filter((m) => m.cost)
                  .reduce((sum, m) => sum + (m.cost || 0), 0)
                  .toFixed(4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div
        className="w-full px-6 flex flex-col gap-[20px] mb-2 invisible-scrollbar"
        style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
      >
        {/* Welcome message */}
        <div className="bg-transparent px-0 py-0 text-base text-[var(--foreground)] w-fit max-w-full mb-2">
          👋 Welcome to Grand Central. I&apos;m **Adrata**, your intelligent
          sales assistant. I can help you connect tools, orchestrate workflows,
          and win more deals. How can I help you today?
        </div>
        {[...messages].reverse().map((msg, idx) => (
          <div
            key={`msg-${idx}`}
            className={
              msg['role'] === "user"
                ? "bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2 text-base text-[var(--foreground)] w-fit max-w-[80%] self-start"
                : "bg-[var(--background)] px-6 py-3 text-base text-[var(--foreground)] w-fit max-w-[95%] self-start shadow-sm"
            }
            style={{ alignSelf: "flex-start" }}
          >
            {msg.content}
            {msg['modelUsed'] && msg['cost'] && (
              <div className="text-xs text-[var(--muted)] mt-2 opacity-70">
                {msg.modelUsed} • ${msg.cost.toFixed(4)}
              </div>
            )}
            {msg['magicalChanges'] && msg.magicalChanges.length > 0 && (
              <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-700 font-medium mb-1">
                  ✨ {msg.magicalChanges.length} magical improvement
                  {msg.magicalChanges.length > 1 ? "s" : ""} ready
                </div>
                <button
                  onClick={() => setShowMagicalChanges(true)}
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  Review changes
                </button>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--muted)] font-normal text-lg w-fit max-w-full leading-tight self-start">
            <span>Adrata is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="w-full">
        <form
          className="flex items-center p-4 pt-[18px] mt-0"
          onSubmit={handleSubmit}
        >
          <div className="relative flex-1">
            {/* Add Insight button inside the input box, left-aligned */}
            <div className="absolute left-[15px] top-0 pt-[10px] mt-[2px] z-10 flex items-center space-x-2">
              <button
                type="button"
                className="text-[var(--muted)] text-sm font-medium border border-[var(--border)] rounded px-3 py-1 bg-[var(--background)] shadow-sm"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.01)" }}
              >
                Add nuance
              </button>
            </div>
            <textarea
              placeholder="Ask Adrata anything..."
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-[14px] pr-[48px] pt-[52px] pb-[54px] rounded-md border border-[var(--border)] focus:outline-none resize-none overflow-y-auto min-h-[4.25em] max-h-[10.75em] placeholder-[var(--muted)] text-[var(--foreground)]"
              style={{ minHeight: "4.25em", maxHeight: "10.75em" }}
            />
            <button
              type="submit"
              style={{
                width: "31px",
                height: "31px",
                top: "calc(76% + 7px)",
                right: "11px",
              }}
              className="absolute right-2 top-[76%] -translate-y-1/2 p-2 rounded-md bg-[var(--foreground)] hover:bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center cursor-pointer"
              aria-label="Send"
              disabled={isLoading || !input.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>
            {/* Magical Adrata Intelligence at bottom left */}
            <div className="absolute left-5 bottom-6 z-10">
              <AdrataIntelligence
                currentMode={currentMode}
                onModeChange={setCurrentMode}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
