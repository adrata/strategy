import { useState, useCallback, useMemo } from "react";
import {
  SearchPill,
  SearchResults,
  ChatMessage,
  PendingAction,
} from "../types";
import { MonacoSearchService } from "../services/searchService";
import { MonacoAIService } from "../services/aiService";
import { useMonacoData } from "./useMonacoData";

export const useMonacoSearch = () => {
  const { companies, partners, people } = useMonacoData();

  // Memoize service instances to prevent recreation on every render (CRITICAL PERFORMANCE FIX)
  const searchService = useMemo(() => new MonacoSearchService(), []);
  const aiService = useMemo(() => new MonacoAIService(), []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activePills, setActivePills] = useState<SearchPill[]>([]);
  const [dynamicPills, setDynamicPills] = useState<SearchPill[]>([]);
  const [currentSearchResults, setCurrentSearchResults] =
    useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [highlightedRecords, setHighlightedRecords] = useState<string[]>([]);

  // Natural language processing
  const processNaturalLanguage = useCallback(
    async (query: string) => {
      setIsSearching(true);

      try {
        // Small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Parse query into search pills
        const pills = searchService.parseNaturalLanguageQuery(query);

        // Execute intelligent search
        const results = searchService.executeIntelligentSearch(
          pills,
          companies,
          partners,
          people,
        );

        // Detect user intent
        const intent = aiService.detectUserIntent(query);

        // Generate AI response
        let aiResponse: string;
        if (
          query.toLowerCase().includes("best") &&
          query.toLowerCase().includes("companies")
        ) {
          aiResponse = aiService.generateBest100Response(query);
        } else {
          aiResponse = aiService.generateSearchResponse(query, results);
        }

        // Execute action if needed
        const action = aiService.executeAction(intent, query, results);

        // Update state
        setActivePills(pills);
        setCurrentSearchResults(results);
        setPendingAction(action);

        return {
          results,
          response: aiResponse,
          action,
          pills,
        };
      } catch (error) {
        console.error("Error processing natural language:", error);
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [companies, partners, people, searchService, aiService],
  );

  // Create dynamic pills from input
  const createDynamicPills = useCallback(
    (input: string) => {
      const pills = searchService.createDynamicPillsFromInput(input);
      setDynamicPills(pills);
      return pills;
    },
    [searchService],
  );

  // Toggle pill activation
  const togglePill = useCallback(
    (pillId: string) => {
      setActivePills((prev) =>
        prev.map((pill) =>
          pill['id'] === pillId ? { ...pill, isActive: !pill.isActive } : pill,
        ),
      );

      // Re-run search with updated pills
      const updatedPills = activePills.map((pill) =>
        pill['id'] === pillId ? { ...pill, isActive: !pill.isActive } : pill,
      );

      const results = searchService.executeIntelligentSearch(
        updatedPills,
        companies,
        partners,
        people,
      );
      setCurrentSearchResults(results);
    },
    [activePills, companies, partners, people, searchService],
  );

  // Update pill value
  const updatePillValue = useCallback(
    (pillId: string, newValue: string) => {
      setActivePills((prev) =>
        prev.map((pill) =>
          pill['id'] === pillId ? { ...pill, value: newValue } : pill,
        ),
      );

      // Re-run search with updated pills
      const updatedPills = activePills.map((pill) =>
        pill['id'] === pillId ? { ...pill, value: newValue } : pill,
      );

      const results = searchService.executeIntelligentSearch(
        updatedPills,
        companies,
        partners,
        people,
      );
      setCurrentSearchResults(results);
    },
    [activePills, companies, partners, people, searchService],
  );

  // Remove pill
  const removePill = useCallback(
    (pillId: string) => {
      setActivePills((prev) => prev.filter((pill) => pill.id !== pillId));

      // Re-run search without removed pill
      const updatedPills = activePills.filter((pill) => pill.id !== pillId);
      const results = searchService.executeIntelligentSearch(
        updatedPills,
        companies,
        partners,
        people,
      );
      setCurrentSearchResults(results);
    },
    [activePills, companies, partners, people, searchService],
  );

  // Execute pending action
  const executePendingAction = useCallback(async () => {
    if (!pendingAction) return null;

    let response: string;

    switch (pendingAction.type) {
      case "add_to_pipeline":
        response = await aiService.createActualLeads(pendingAction.targets);
        setHighlightedRecords(pendingAction.targets.map((t) => t.id));
        break;
      case "mini_report":
        if (pendingAction.targets.length > 0) {
          const target = pendingAction['targets'][0];
          if (target) {
            response = aiService.generateMiniReport(target);
          } else {
            response = "No valid target found for mini report.";
          }
        } else {
          response = "No target selected for mini report.";
        }
        break;
      default:
        response = `✅ **Action Completed:** ${pendingAction.summary}`;
    }

    setPendingAction(null);
    return response;
  }, [pendingAction, aiService]);

  // Cancel pending action
  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  // Get statistics for sections
  const getStatsForSection = useCallback(
    (section: string) => {
      return searchService.getStatsForSection(
        section,
        companies,
        partners,
        people,
      );
    },
    [companies, partners, people, searchService],
  );

  // Get Best 100 companies
  const getBest100Companies = useCallback(() => {
    return searchService.getBest100Companies(companies);
  }, [companies, searchService]);

  // Generate mini report
  const generateMiniReport = useCallback(
    (record: any) => {
      return aiService.generateMiniReport(record);
    },
    [aiService],
  );

  // Get ranking description
  const getRankingDescription = useCallback(
    (record: any) => {
      return searchService.getRankingDescription(record);
    },
    [searchService],
  );

  // Get rank number
  const getRankNumber = useCallback(
    (record: any) => {
      const allRecords = [...companies, ...partners, ...people];
      return searchService.getRankNumber(record, allRecords);
    },
    [companies, partners, people, searchService],
  );

  return {
    // State
    searchQuery,
    activePills,
    dynamicPills,
    currentSearchResults,
    isSearching,
    pendingAction,
    highlightedRecords,

    // Actions
    setSearchQuery,
    processNaturalLanguage,
    createDynamicPills,
    togglePill,
    updatePillValue,
    removePill,
    executePendingAction,
    cancelPendingAction,

    // Utilities
    getStatsForSection,
    getBest100Companies,
    generateMiniReport,
    getRankingDescription,
    getRankNumber,

    // Services
    searchService,
    aiService,
  };
};
