"use client";

import { useCallback } from "react";
import { useMonaco } from "@/products/monaco/context/MonacoContext";

export function useMonacoActions() {
  const {
    activeSpace,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
  } = useMonaco();

  // Generate contextual AI responses
  const generateAIResponse = useCallback((query: string, space: string) => {
    const responses = {
      search: [
        "I've found several high-intent prospects matching your criteria. The top companies show strong buying signals with recent funding rounds and technology expansion.",
        "Based on your search, I'm seeing 40 companies in the 'High-Intent SaaS' category. Would you like me to prioritize them by engagement score or company size?",
        "Your ICP analysis shows these prospects have 89% alignment with your ideal customer profile. I recommend starting with the Scaling Enterprises list for highest conversion potential.",
      ],
      analytics: [
        "Your outreach performance is trending 23% above industry average. Email open rates are particularly strong at 67%, suggesting excellent subject line optimization.",
        "I've identified your best-performing prospecting times: Tuesday-Thursday, 10-11 AM shows 34% higher response rates than other time slots.",
        "Your pipeline velocity has improved by 18% this quarter. The key driver appears to be better qualification at the MQL stage.",
      ],
      sequences: [
        "Your 5-touch sequence is performing well with a 12% response rate. I recommend A/B testing a more personalized subject line for touch #3.",
        "I've paused the underperforming sequence and created a new variant with 89% higher engagement based on successful patterns from your top campaigns.",
        "Your follow-up timing optimization suggests waiting 4 days between touches instead of 3 for enterprise prospects to improve response rates by 28%.",
      ],
      enrichment: [
        "I've enriched 847 prospect records with verified email addresses and direct phone numbers. Data confidence score averages 94%.",
        "Your contact database now includes intent signals for 67% of prospects, showing which companies are actively researching solutions in your category.",
        "I've identified 23 new buying committee members across your target accounts using our relationship mapping technology.",
      ],
      integrations: [
        "Your Salesforce sync is running smoothly with 99.7% data accuracy. All prospect interactions are automatically logged with full attribution.",
        "I've set up bi-directional sync with your marketing automation platform. Lead scores will now update in real-time based on Monaco engagement data.",
        "Your Pipeline integration has processed 2,847 new contacts this week with automated lead routing based on your territory management rules.",
      ],
      home: [
        "Welcome to Monaco! You have 40 high-intent prospects waiting for outreach and 3 active sequences running with 89% delivery rates.",
        "Your weekly pipeline report is ready: $2.3M in new opportunities generated, with 67% coming from Monaco-sourced prospects.",
        "You're on track to exceed your monthly target by 23%. Your top-performing prospecting activity this week was personalized LinkedIn outreach.",
      ],
    };

    const spaceResponses =
      responses[space as keyof typeof responses] || responses.home;
    // Generate stable index based on current timestamp rounded to nearest minute
    // This provides variety but prevents flickering within the same minute
    const stableIndex = Math.floor(Date.now() / 60000) % spaceResponses.length;
    return spaceResponses[stableIndex];
  }, []);

  // Handle chat submission
  const handleChatSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;

      const userMessage = {
        id: Date.now().toString(),
        type: "user" as const,
        content: chatInput,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput("");

      // Simulate AI response
      setTimeout(() => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant" as const,
          content:
            generateAIResponse(chatInput, activeSpace) ||
            "I apologize, but I couldn't generate a response at this time.",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      }, 1000);
    },
    [chatInput, activeSpace, setChatMessages, setChatInput, generateAIResponse],
  );

  // Clear chat history
  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, [setChatMessages]);

  // Add quick action
  const addQuickAction = useCallback(
    (action: string) => {
      setChatInput(action);
    },
    [setChatInput],
  );

  return {
    handleChatSubmit,
    generateAIResponse,
    clearChat,
    addQuickAction,
  };
}
