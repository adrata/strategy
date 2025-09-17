/**
 * 🤖 UNIVERSAL AI ASSISTANT - ENHANCED WITH UNIFIED INTELLIGENCE
 *
 * Now powered by unified intelligence system that combines:
 * - Vitals business health monitoring
 * - Monaco 25-step intelligence pipeline
 * - Cross-platform data from all 30+ Adrata apps
 * - Predictive analytics and strategic insights
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  ClockIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  TrashIcon,
  ChartBarIcon,
  LightBulbIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  SparklesIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { SmartContentUploader } from "./SmartContentUploader";
import { UnifiedIntelligenceSystem } from "@/platform/ai/intelligence/unified-intelligence-system/UnifiedIntelligenceSystem";
import { useVoiceActivation } from "@/platform/hooks/useVoiceActivation";

interface IntelligenceInsight {
  title: string;
  summary: string;
  type: string;
}

interface NextBestAction {
  action: string;
  timeframe: string;
}

interface HealthStatus {
  overall: number;
  revenue: number;
  team: number;
  market: number;
}

interface UploadedContent {
  id: string;
  aiGeneratedName: string;
  fileType: string;
  size: number;
}

interface AIMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  applicationContext?: string;
  suggestions?: string[];
  intelligenceInsights?: IntelligenceInsight[];
  healthStatus?: HealthStatus;
  urgentActions?: string[];
  nextBestActions?: NextBestAction[];
}

interface UniversalAIAssistantProps {
  applicationName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  accentColor?: string;
  className?: string;
  workspaceId?: string;
  userId?: string;
  currentContext?: {
    companyId?: string;
    opportunityId?: string;
    contactId?: string;
    projectId?: string;
  };
}

// Enhanced AI capabilities with unified intelligence
const AI_CAPABILITIES = {
  monaco: {
    name: "Monaco Intelligence",
    capabilities: [
      "Company intelligence and buyer analysis",
      "Competitive intelligence and battlecards",
      "Pipeline forecasting and opportunity scoring",
      "Decision maker mapping and influence analysis",
      "Intent signals and buying behavior patterns",
    ],
    quickActions: [
      "Analyze my top opportunities",
      "Find competitive threats in pipeline",
      "Identify new target accounts",
      "Generate buyer group analysis",
      "Predict deal outcomes",
      "Create engagement strategy",
    ],
  },
  vitals: {
    name: "Business Health Intelligence",
    capabilities: [
      "Real-time business health monitoring",
      "Revenue and team performance analysis",
      "Acquisition readiness assessment",
      "Risk detection and mitigation strategies",
      "Strategic opportunity identification",
    ],
    quickActions: [
      "Check business health status",
      "Analyze revenue trends",
      "Assess acquisition readiness",
      "Identify risk factors",
      "Find growth opportunities",
      "Monitor team wellbeing",
    ],
  },
  "aos": {
    name: "Action Platform Intelligence",
    capabilities: [
      "Lead qualification and scoring",
      "Campaign performance optimization",
      "Content strategy recommendations",
      "Workflow automation insights",
      "Multi-channel coordination",
    ],
    quickActions: [
      "Optimize lead qualification",
      "Improve campaign performance",
      "Generate content ideas",
      "Streamline workflows",
      "Coordinate multi-channel outreach",
    ],
  },
  default: {
    name: "Unified Intelligence",
    capabilities: [
      "Cross-platform data analysis",
      "Strategic business insights",
      "Performance optimization recommendations",
      "Risk assessment and mitigation",
      "Opportunity identification and prioritization",
    ],
    quickActions: [
      "Analyze business performance",
      "Identify strategic opportunities",
      "Assess operational risks",
      "Optimize workflows",
      "Generate insights report",
    ],
  },
};

export function UniversalAIAssistant({
  applicationName = "default",
  isOpen = false,
  onToggle,
  accentColor = "#3B82F6",
  className = "",
  workspaceId = "default",
  userId = "default",
  currentContext = {},
}: UniversalAIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContentUploader, setShowContentUploader] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<UploadedContent[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  // Voice activation system
  const voiceActivation = useVoiceActivation();

  const capabilities =
    AI_CAPABILITIES[applicationName as keyof typeof AI_CAPABILITIES] ||
    AI_CAPABILITIES.default;

  // Initialize with enhanced welcome message
  useEffect(() => {
    if (messages['length'] === 0) {
      initializeAssistant();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationName, capabilities, messages.length]);

  // Voice integration effect - FIXED: Use correct property names
  useEffect(() => {
    if (voiceActivation['lastCommand'] && voiceActivation.isActive) {
      handleVoiceCommand(voiceActivation.lastCommand, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceActivation.lastCommand, voiceActivation.isActive]);

  // Auto-activate voice on component mount
  useEffect(() => {
    const initializeVoice = async () => {
      if (!voiceActivation.isActive) {
        console.log("🎙️ [AI Assistant] Auto-activating voice recognition...");
        try {
          await voiceActivation.activateVoice();
          console.log("✅ [AI Assistant] Voice recognition activated");
        } catch (error) {
          console.error("❌ [AI Assistant] Voice activation failed:", error);
        }
      }
    };

    // Activate voice after a short delay to ensure component is mounted
    const timer = setTimeout(initializeVoice, 1000);
    return () => clearTimeout(timer);
  }, [voiceActivation]);

  const initializeAssistant = useCallback(async () => {
    // Get initial unified intelligence
    try {
      const intelligence =
        await UnifiedIntelligenceSystem.generateUnifiedIntelligence(
          "initial_context",
          {
            applicationName,
            userId,
            workspaceId,
            currentContext,
          },
        );

      setHealthStatus(intelligence.healthStatus);

      const welcomeMessage: AIMessage = {
        id: "1",
        type: "assistant",
        content: generateEnhancedWelcomeMessage(intelligence),
        timestamp: new Date(),
        applicationContext: applicationName,
        suggestions: capabilities.quickActions.slice(0, 3),
        intelligenceInsights: intelligence.insights.slice(0, 2),
        healthStatus: intelligence.healthStatus,
        urgentActions: intelligence.urgentActions,
        nextBestActions: intelligence.nextBestActions.slice(0, 3),
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Failed to initialize unified intelligence:", error);
      setMessages([
        {
          id: "1",
          type: "assistant",
          content: `👋 Hi! I'm your ${capabilities.name} assistant powered by unified intelligence. I can help you with:\n\n${capabilities.capabilities.map((cap) => `• ${cap}`).join("\n")}\n\nWhat would you like to explore?`,
          timestamp: new Date(),
          applicationContext: applicationName,
          suggestions: capabilities.quickActions.slice(0, 3),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    applicationName,
    capabilities.name,
    capabilities.capabilities,
    capabilities.quickActions,
    userId,
    workspaceId,
    currentContext,
  ]);

  const generateEnhancedWelcomeMessage = (intelligence: {
    healthStatus: HealthStatus;
    urgentActions: string[];
    contextualGuidance: string;
  }): string => {
    const app = applicationName.toLowerCase();
    let message = `👋 Hi! I'm your ${capabilities.name} assistant powered by **unified intelligence** from all Adrata platforms.\n\n`;

    // Add voice activation introduction
    message += `🎙️ **Voice Control Available**: Say &quot;Adrata Start&quot; to begin a voice session - then just speak naturally like with Jarvis. I&apos;ll stay active until you say &quot;sleep&quot; or after 15 minutes of silence.\n\n`;

    // Add health status for relevant apps
    if (["vitals", "monaco", "default"].includes(app)) {
      message += `📊 **Business Health**: Overall ${intelligence.healthStatus.overall}% `;
      if (intelligence.healthStatus.overall >= 80) message += "(Excellent)";
      else if (intelligence.healthStatus.overall >= 70) message += "(Good)";
      else if (intelligence.healthStatus.overall >= 60) message += "(Fair)";
      else message += "(Needs Attention)";
      message += "\n\n";
    }

    // Add urgent actions if any
    if (intelligence.urgentActions.length > 0) {
      message += `🚨 **Urgent Actions**:\n${intelligence.urgentActions
        .slice(0, 2)
        .map((action) => `• ${action}`)
        .join("\n")}\n\n`;
    }

    // Add app-specific guidance
    message += intelligence.contextualGuidance + "\n\n";

    // Add capabilities
    message += `I can help you with:\n${capabilities.capabilities
      .slice(0, 3)
      .map((cap) => `• ${cap}`)
      .join("\n")}\n\n`;

    message += "What would you like to explore?";

    return message;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      applicationContext: applicationName,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsProcessing(true);

    try {
      // Generate unified intelligence response
      const intelligence =
        await UnifiedIntelligenceSystem.generateUnifiedIntelligence(
          inputMessage,
          {
            applicationName,
            userId,
            workspaceId,
            currentContext,
          },
        );

      // Update health status
      setHealthStatus(intelligence.healthStatus);

      // Generate enhanced AI response
      const response = await generateEnhancedAIResponse(
        inputMessage,
        intelligence,
      );

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.content,
        timestamp: new Date(),
        applicationContext: applicationName,
        suggestions: response.suggestions,
        intelligenceInsights: intelligence.insights.slice(0, 3),
        healthStatus: intelligence.healthStatus,
        urgentActions: intelligence.urgentActions,
        nextBestActions: intelligence.nextBestActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to generate unified intelligence response:", error);

      // Fallback to basic response
      const fallbackResponse = generateBasicAIResponse(
        inputMessage,
        applicationName,
      );
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: fallbackResponse.content,
        timestamp: new Date(),
        applicationContext: applicationName,
        suggestions: fallbackResponse.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateEnhancedAIResponse = async (
    input: string,
    intelligence: {
      contextualGuidance: string;
      healthStatus: HealthStatus;
      urgentActions: string[];
      insights: IntelligenceInsight[];
      nextBestActions: NextBestAction[];
    },
  ) => {
    const app = applicationName.toLowerCase();
    const lowerInput = input.toLowerCase();

    // Health-related queries
    if (
      lowerInput.includes("health") ||
      lowerInput.includes("status") ||
      lowerInput.includes("vitals")
    ) {
      return {
        content: `📊 **Business Health Analysis**\n\n${intelligence.contextualGuidance}\n\n**Key Metrics:**\n• Overall Health: ${intelligence.healthStatus.overall}%\n• Revenue Vitality: ${intelligence.healthStatus.revenue}%\n• Team Performance: ${intelligence.healthStatus.team}%\n• Market Position: ${intelligence.healthStatus.market}%\n\n${intelligence.urgentActions.length > 0 ? `**Urgent Actions:**\n${intelligence.urgentActions.map((action) => `• ${action}`).join("\n")}` : ""}`,
        suggestions: [
          "Show detailed health metrics",
          "Analyze risk factors",
          "Identify improvement opportunities",
        ],
      };
    }

    // Opportunity-related queries
    if (
      lowerInput.includes("opportunity") ||
      lowerInput.includes("deal") ||
      lowerInput.includes("pipeline")
    ) {
      const opportunityInsights = intelligence.insights.filter(
        (i) => i['type'] === "monaco" || i['type'] === "strategic",
      );
      return {
        content: `🎯 **Opportunity Intelligence**\n\n${intelligence.contextualGuidance}\n\n${
          opportunityInsights.length > 0
            ? `**Key Opportunities:**\n${opportunityInsights
                .slice(0, 3)
                .map((insight) => `• ${insight.title}: ${insight.summary}`)
                .join("\n")}\n\n`
            : ""
        }**Next Best Actions:**\n${intelligence.nextBestActions.map((action) => `• ${action.action} (${action.timeframe})`).join("\n")}`,
        suggestions: [
          "Analyze top opportunities",
          "Generate competitive intelligence",
          "Create engagement strategy",
        ],
      };
    }

    // Competitive queries
    if (
      lowerInput.includes("competitor") ||
      lowerInput.includes("competitive") ||
      lowerInput.includes("threat")
    ) {
      return {
        content: `⚔️ **Competitive Intelligence**\n\nBased on Monaco pipeline analysis and market intelligence:\n\n${intelligence.contextualGuidance}\n\nI can help you:\n• Analyze competitive threats in your pipeline\n• Generate battlecards for key competitors\n• Identify competitive advantages\n• Monitor market positioning\n\nWhat specific competitive intelligence do you need?`,
        suggestions: [
          "Generate competitor battlecards",
          "Analyze market position",
          "Identify competitive advantages",
        ],
      };
    }

    // Default intelligent response
    return {
      content: `${intelligence.contextualGuidance}\n\n${
        intelligence.insights.length > 0
          ? `**Key Insights:**\n${intelligence.insights
              .slice(0, 2)
              .map((insight) => `• ${insight.title}: ${insight.summary}`)
              .join("\n")}\n\n`
          : ""
      }I can help you dive deeper into any of these areas. What would you like to explore?`,
      suggestions: capabilities.quickActions.slice(0, 3),
    };
  };

  const generateBasicAIResponse = (input: string, applicationName: string) => {
    // Fallback basic responses
    return {
      content: `I understand you want to: "${input}". I'm powered by unified intelligence across all Adrata platforms including Vitals business health monitoring and Monaco's 25-step intelligence pipeline. In the full system, I would provide comprehensive insights and recommendations. What specific area would you like to explore?`,
      suggestions: capabilities.quickActions.slice(0, 3),
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e['key'] === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContentAdded = (content: UploadedContent[]) => {
    setUploadedContent((prev) => [...prev, ...content]);
    setShowContentUploader(false);

    const contentSummary = content.map((c) => c.aiGeneratedName).join(", ");
    const contextMessage: AIMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: `📄 **Content Added Successfully!**\n\nProcessed: ${contentSummary}\n\nYour files have been analyzed and integrated with our unified intelligence system. I can now provide insights that combine this content with:\n• Business health data from Vitals\n• Monaco intelligence pipeline\n• Cross-platform analytics\n\nAsk me anything about this content or how it relates to your business intelligence!`,
      timestamp: new Date(),
      applicationContext: applicationName,
    };

    setMessages((prev) => [...prev, contextMessage]);
  };

  const handleContentRemoved = (contentId: string) => {
    setUploadedContent((prev) => prev.filter((c) => c.id !== contentId));
  };

  // Voice command handler
  const handleVoiceCommand = useCallback(
    async (command: string, intent: any) => {
      console.log("[Voice] Command received:", command, intent);

      // Create a user message from voice command
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        type: "user",
        content: `🎙️ ${command}`,
        timestamp: new Date(),
        applicationContext: applicationName,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);

      try {
        let response: string;

        // Check if it's a session management command
        if (intent?.action === "deactivate") {
          response = `🛌 **Voice Session Ended**\n\nAdrata voice assistant is now sleeping. Say &quot;Adrata Start&quot; to reactivate when needed.\n\nSession was active for ${Math.floor(voiceActivation.sessionDuration / 60000)} minutes.`;
        } else if (intent?.action === "ai_command") {
          // Generate AI response for commands like "health check", "analyze pipeline"
          const intelligence =
            await UnifiedIntelligenceSystem.generateUnifiedIntelligence(
              command,
              {
                applicationName,
                userId,
                workspaceId,
                currentContext,
              },
            );

          setHealthStatus(intelligence.healthStatus);

          if (command.toLowerCase().includes("health")) {
            response = `📊 **Voice-Activated Health Check**\n\n**Overall Health: ${intelligence.healthStatus.overall}%**\n• Revenue: ${intelligence.healthStatus.revenue}%\n• Team: ${intelligence.healthStatus.team}%\n• Market: ${intelligence.healthStatus.market}%\n\n${intelligence.contextualGuidance}\n\n*Voice session active - continue speaking naturally*`;
          } else if (command.toLowerCase().includes("pipeline")) {
            response = `📈 **Pipeline Analysis**\n\n${intelligence.contextualGuidance}\n\n**Key Insights:**\n${intelligence.insights
              .slice(0, 3)
              .map((insight) => `• ${insight.title}: ${insight.summary}`)
              .join("\n")}\n\n*What else would you like to know?*`;
          } else if (command.toLowerCase().includes("customer")) {
            response = `🏆 **Top Customer Analysis**\n\n${intelligence.contextualGuidance}\n\n**Next Actions:**\n${intelligence.nextBestActions
              .slice(0, 3)
              .map((action) => `• ${action.action} (${action.timeframe})`)
              .join("\n")}\n\n*Ask me anything else about your clients*`;
          } else {
            response = `🎙️ **Voice Command Processed**: &quot;${command}&quot;\n\n${intelligence.contextualGuidance}\n\n*I&apos;m listening for your next request*`;
          }
        } else if (intent?.action === "navigate") {
          // Handle navigation commands
          response = `🧭 **Navigation**: ${intent.description}\n\nOpening Action Platform...\n\n*Voice session remains active - continue speaking when ready*`;
        } else {
          // No specific intent, let AI interpret
          response = `🎙️ I heard: &quot;${command}&quot;\n\nI&apos;m analyzing your request with unified intelligence. Let me help you with this.\n\n*Session active - feel free to ask follow-up questions*`;
        }

        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: response,
          timestamp: new Date(),
          applicationContext: applicationName,
          suggestions: voiceActivation.isActive
            ? [
                "Ask me anything else",
                "Navigate somewhere",
                "Check other metrics",
                "Say &quot;sleep&quot; to end session",
              ]
            : intent
              ? []
              : [
                  "Clarify your request",
                  "Show available commands",
                  "Start voice session",
                ],
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Voice command error:", error);

        const errorMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `🎙️ I heard your voice command: &quot;${command}&quot;\n\nI&apos;m still learning to process voice commands perfectly. ${voiceActivation.isActive ? "Try rephrasing your request or ask something else." : "Could you try saying &quot;Adrata Start&quot; first, then your command?"}`,
          timestamp: new Date(),
          applicationContext: applicationName,
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      applicationName,
      userId,
      workspaceId,
      currentContext,
      voiceActivation,
      setMessages,
      setIsProcessing,
    ],
  );

  if (!isOpen) return null;

  return (
    <div className={`flex flex-col h-full bg-[var(--background)] ${className}`}>
      {/* Enhanced Header with Health Status and Voice Controls */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" style={{ color: accentColor }} />
            <span className="font-semibold text-[var(--foreground)]">
              {capabilities.name}
            </span>
          </div>
          {healthStatus && (
            <div className="flex items-center gap-2 text-xs">
              <HeartIcon className="w-4 h-4 text-green-500" />
              <span className="text-[var(--muted)]">
                {healthStatus.overall}% Health
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Discrete Voice Activation Indicator */}
          {voiceActivation && (
            <div className="flex items-center gap-1">
              {voiceActivation['isListening'] && (
                <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Listening</span>
                </div>
              )}
              {voiceActivation['isActive'] && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <MicrophoneIcon className="w-3 h-3" />
                  <span>Adrata Active</span>
                  <span className="text-[var(--muted)]">
                    ({Math.floor(voiceActivation.sessionDuration / 60)}s)
                  </span>
                </div>
              )}
              {!voiceActivation['isActive'] && (
                <button
                  onClick={() => voiceActivation.activateVoice()}
                  className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  title="Start voice activation (say 'Adrata Start')"
                >
                  <MicrophoneIcon className="w-3 h-3" />
                  <span>Voice</span>
                </button>
              )}
            </div>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="w-full px-6 flex flex-col gap-[20px] mb-2 invisible-scrollbar"
        style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}
      >
        {/* Welcome message - only show if no chat history */}
        {messages['length'] === 1 && (
          <>
            {/* Content Visualization */}
            {uploadedContent.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Added Content ({uploadedContent.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uploadedContent.slice(0, 3).map((content, index) => (
                    <div
                      key={content.id}
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs"
                    >
                      <div className="font-medium text-blue-900 dark:text-blue-100">
                        {content.aiGeneratedName}
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 mt-1">
                        {content.fileType} • {(content.size / 1024).toFixed(1)}
                        KB
                      </div>
                    </div>
                  ))}
                  {uploadedContent.length > 3 && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center">
                      +{uploadedContent.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Uploader */}
            {showContentUploader && (
              <div className="mb-4">
                <SmartContentUploader
                  onContentAdded={handleContentAdded}
                  onContentRemoved={handleContentRemoved}
                  maxFiles={5}
                />
              </div>
            )}
          </>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className="bg-transparent px-0 py-0 text-base text-[var(--foreground)] w-fit max-w-full mb-2 leading-snug"
          >
            {message['type'] === "user" ? (
              <div className="bg-[var(--hover-bg)] rounded-lg px-3 py-2">
                {message.content}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="whitespace-pre-line">{message.content}</div>

                {/* Intelligence Insights */}
                {message['intelligenceInsights'] &&
                  message.intelligenceInsights.length > 0 && (
                    <div className="space-y-2">
                      {message.intelligenceInsights.map(
                        (insight: IntelligenceInsight, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                          >
                            <div className="flex items-start gap-2">
                              <LightBulbIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                                  {insight.title}
                                </div>
                                <div className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                                  {insight.summary}
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                {/* Urgent Actions */}
                {message['urgentActions'] && message.urgentActions.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-red-900 dark:text-red-100 text-sm mb-2">
                          Urgent Actions Required
                        </div>
                        {message.urgentActions
                          .slice(0, 2)
                          .map((action: string, index: number) => (
                            <div
                              key={index}
                              className="text-red-700 dark:text-red-300 text-xs"
                            >
                              • {action}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {message['suggestions'] && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputMessage(suggestion);
                          setTimeout(handleSendMessage, 100);
                        }}
                        className="inline-flex items-center space-x-2 px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="bg-transparent px-0 py-0 text-base text-[var(--foreground)] w-fit max-w-full mb-2 leading-snug">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <span className="text-sm ml-2">
                Analyzing with unified intelligence...
              </span>
            </div>
          </div>
        )}

        {/* Voice activation hint */}
        {voiceActivation &&
          voiceActivation['isListening'] &&
          !voiceActivation['isActive'] && (
            <div className="mb-2 text-xs text-[var(--muted)] flex items-center gap-2">
              <SpeakerWaveIcon className="w-3 h-3" />
              <span>Say &quot;Adrata Start&quot; to begin voice session</span>
            </div>
          )}

        {/* Active session hint */}
        {voiceActivation && voiceActivation['isActive'] && (
          <div className="mb-2 text-xs text-green-600 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Voice session active - I&apos;m listening</span>
          </div>
        )}
      </div>

      {/* Enhanced Input area */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowContentUploader(!showContentUploader)}
            className="px-3 py-1 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          >
            📄 Add Content
          </button>
          {healthStatus && (
            <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
              <ChartBarIcon className="w-3 h-3" />
              <span>
                Revenue: {healthStatus.revenue}% | Team: {healthStatus.team}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask me anything about ${capabilities.name.toLowerCase()}...`}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Voice activation button */}
          {voiceActivation && (
            <button
              onClick={() => {
                if (!voiceActivation.isActive) {
                  voiceActivation.activateVoice();
                } else {
                  voiceActivation.deactivateVoice();
                }
              }}
              className={`p-2 rounded-lg transition-all duration-150 ease-out hover:scale-105 ${
                voiceActivation.isActive
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40 border border-sky-500"
                  : "bg-[var(--hover-bg)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-sky-50 border border-transparent"
              }`}
              title={
                voiceActivation.isActive
                  ? `Voice session active (${Math.floor(voiceActivation.sessionDuration / 60)}s) - Click to end`
                  : 'Start voice activation (say "Adrata Start")'
              }
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
          )}

          {/* Send message button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing}
            className="p-3 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor:
                inputMessage.trim() && !isProcessing
                  ? accentColor
                  : "var(--hover-bg)",
              color:
                inputMessage.trim() && !isProcessing ? "white" : "var(--muted)",
            }}
            title="Send message"
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default UniversalAIAssistant;
