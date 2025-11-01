"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  File,
  Users,
  Building,
  Mail,
  Calendar,
  Star,
  Clock,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type:
    | "company"
    | "person"
    | "document"
    | "email"
    | "task"
    | "note"
    | "event";
  source: string;
  url: string;
  metadata: {
    date?: string;
    author?: string;
    tags?: string[];
    score?: number;
  };
  preview?: string;
}

interface UniversalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const SEARCH_FILTERS = [
  { id: "all", label: "All", icon: Search },
  { id: "company", label: "Companies", icon: Building },
  { id: "person", label: "People", icon: Users },
  { id: "document", label: "Documents", icon: File },
  { id: "email", label: "Emails", icon: Mail },
  { id: "task", label: "Tasks", icon: Calendar },
] as const;

// Mock search results - in real app, this would come from your search API
const MOCK_RESULTS: SearchResult[] = [
  {
    id: "1",
    title: "Acme Corporation",
    description:
      "Technology company specializing in enterprise software solutions",
    type: "company",
    source: "Monaco",
    url: "/monaco/companies/acme-corp",
    metadata: {
      date: "2024-01-15",
      tags: ["enterprise", "technology", "b2b"],
      score: 0.95,
    },
    preview:
      "Founded in 2010, Acme Corporation has grown to become a leading provider of enterprise software solutions...",
  },
  {
    id: "2",
    title: "John Smith - CEO at Acme Corp",
    description: "Chief Executive Officer with 15+ years of experience",
    type: "person",
    source: "Oasis",
    url: "/oasis/contacts/john-smith",
    metadata: {
      date: "2024-01-10",
      author: "System",
      tags: ["ceo", "executive", "acme"],
      score: 0.88,
    },
    preview:
      "Experienced CEO with a track record of scaling technology companies...",
  },
  {
    id: "3",
    title: "Q4 Strategy Document",
    description: "Strategic planning document for Q4 initiatives",
    type: "document",
    source: "Briefcase",
    url: "/briefcase/documents/q4-strategy",
    metadata: {
      date: "2024-01-08",
      author: "Strategy Team",
      tags: ["strategy", "planning", "q4"],
      score: 0.82,
    },
    preview:
      "This document outlines our strategic priorities for Q4, including market expansion...",
  },
  {
    id: "4",
    title: "Follow-up: Partnership Discussion",
    description: "Email thread about potential partnership opportunities",
    type: "email",
            source: "Speedrun",
    url: "/speedrun/emails/partnership-followup",
    metadata: {
      date: "2024-01-12",
      author: "Sarah Johnson",
      tags: ["partnership", "business-development"],
      score: 0.76,
    },
    preview:
      "Hi John, Following up on our discussion about the potential partnership...",
  },
  {
    id: "5",
    title: "Complete Monaco Pipeline Setup",
    description: "Technical task for setting up data enrichment pipeline",
    type: "task",
    source: "Action Platform",
    url: "/aos/tasks/monaco-pipeline",
    metadata: {
      date: "2024-01-14",
      author: "Tech Team",
      tags: ["technical", "monaco", "pipeline"],
      score: 0.71,
    },
    preview:
      "Set up the Monaco data enrichment pipeline to process company information...",
  },
];

const TYPE_ICONS = {
  company: Building,
  contact: Users,
  document: File,
  email: Mail,
  task: Calendar,
  note: File,
  event: Calendar,
};

export default function UniversalSearch({
  isOpen,
  onClose,
  initialQuery = "",
}: UniversalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches
  useEffect(() => {
    if (typeof window !== "undefined") {
      const recent = JSON.parse(
        localStorage.getItem("adrata-recent-searches") || "[]",
      );
      setRecentSearches(recent);
    }
  }, []);

  // Filter and search results
  const filteredResults = useMemo(() => {
    let results = MOCK_RESULTS;

    // Apply type filter
    if (selectedFilter !== "all") {
      results = results.filter((result) => result['type'] === selectedFilter);
    }

    // Apply search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(
        (result) =>
          result.title.toLowerCase().includes(searchTerm) ||
          result.description.toLowerCase().includes(searchTerm) ||
          result.preview?.toLowerCase().includes(searchTerm) ||
          result.metadata.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm),
          ),
      );
    }

    // Sort by relevance score
    return results.sort(
      (a, b) => (b.metadata.score || 0) - (a.metadata.score || 0),
    );
  }, [query, selectedFilter]);

  // Handle result selection
  const selectResult = useCallback(
    (result: SearchResult) => {
      // Save to recent searches
      const newRecent = [
        query,
        ...recentSearches.filter((s) => s !== query),
      ].slice(0, 10);
      setRecentSearches(newRecent);
      localStorage.setItem("adrata-recent-searches", JSON.stringify(newRecent));

      // Navigate to result
      router.push(result.url);
      onClose();
    },
    [query, recentSearches, router, onClose],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredResults.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
            const selectedResult = filteredResults[selectedIndex];
            if (selectedResult) {
              selectResult(selectedResult);
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab":
          e.preventDefault();
          const currentFilterIndex = SEARCH_FILTERS.findIndex(
            (f) => f['id'] === selectedFilter,
          );
          const nextFilterIndex =
            (currentFilterIndex + 1) % SEARCH_FILTERS.length;
          setSelectedFilter(SEARCH_FILTERS[nextFilterIndex]?.id || "all");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    selectedIndex,
    filteredResults,
    selectedFilter,
    onClose,
    selectResult,
  ]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Simulate search loading
  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-4xl bg-[var(--background)] dark:bg-[var(--foreground)] rounded-xl shadow-2xl border border-[var(--border)] dark:border-[var(--border)] overflow-hidden">
          {/* Search Header */}
          <div className="border-b border-[var(--border)] dark:border-[var(--border)]">
            {/* Search Input */}
            <div className="flex items-center px-4 py-3">
              <input
                type="text"
                placeholder="Search across all your data..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[var(--foreground)] placeholder-[var(--muted)] text-lg ml-3"
                autoFocus
              />
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
              )}
              <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                <kbd className="px-2 py-1 bg-[var(--hover)] rounded border">
                  ↵
                </kbd>
                <span>to select</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-4 pb-3 gap-2">
              {SEARCH_FILTERS.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === filter.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "text-[var(--muted)] dark:text-[var(--muted)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {!query.trim() ? (
              // Recent searches and suggestions
              <div className="p-4">
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)] mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(search)}
                          className="px-3 py-1.5 text-sm bg-[var(--hover)] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-[var(--loading-bg)] transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-[var(--foreground)] dark:text-[var(--foreground)] mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Quick Access
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        title: "All Companies",
                        desc: "Browse company database",
                        url: "/monaco",
                      },
                      {
                        title: "Recent Contacts",
                        desc: "View recent contacts",
                        url: "/oasis",
                      },
                      {
                        title: "My Documents",
                        desc: "Access your files",
                        url: "/briefcase",
                      },
                      {
                        title: "Active Tasks",
                        desc: "See current tasks",
                        url: "/aos",
                      },
                    ].map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          router.push(item.url);
                          onClose();
                        }}
                        className="p-3 text-left bg-[var(--panel-background)] rounded-lg hover:bg-[var(--hover)] transition-colors"
                      >
                        <div className="font-medium text-[var(--foreground)] dark:text-[var(--foreground)] text-sm">
                          {item.title}
                        </div>
                        <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredResults['length'] === 0 ? (
              // No results
              <div className="px-4 py-8 text-center text-[var(--muted)]">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for &quot;{query}&quot;</p>
                <p className="text-sm">
                  Try a different search term or check your filters
                </p>
              </div>
            ) : (
              // Search results
              <div className="py-2">
                {filteredResults.map((result, index) => {
                  const TypeIcon = TYPE_ICONS[result.type];
                  return (
                    <button
                      key={result.id}
                      onClick={() => selectResult(result)}
                      className={`w-full flex items-start px-4 py-3 text-left hover:bg-[var(--panel-background)] transition-colors ${
                        index === selectedIndex
                          ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--hover)] mr-3 mt-0.5">
                        <TypeIcon className="w-5 h-5 text-[var(--muted)] dark:text-[var(--muted)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-[var(--foreground)] dark:text-[var(--foreground)] truncate">
                            {result.title}
                          </h3>
                          <span className="px-2 py-0.5 text-xs bg-[var(--hover)] text-[var(--muted)] dark:text-[var(--muted)] rounded-full">
                            {result.source}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] mb-1">
                          {result.description}
                        </p>
                        {result['preview'] && (
                          <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] line-clamp-2">
                            {result.preview}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                          {result['metadata']['date'] && (
                            <span>
                              {new Date(
                                result.metadata.date,
                              ).toLocaleDateString()}
                            </span>
                          )}
                          {result['metadata']['author'] && (
                            <span>by {result.metadata.author}</span>
                          )}
                          {result['metadata']['tags'] &&
                            result.metadata.tags.length > 0 && (
                              <div className="flex gap-1">
                                {result.metadata.tags
                                  .slice(0, 3)
                                  .map((tag, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 bg-[var(--hover)] rounded text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>
                      {result['metadata']['score'] && (
                        <div className="text-xs text-[var(--muted)] ml-2">
                          {Math.round(result.metadata.score * 100)}%
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-[var(--panel-background)] border-t border-[var(--border)] dark:border-[var(--border)]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-[var(--background)] rounded border">
                    ↑↓
                  </kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-[var(--background)] rounded border">
                    tab
                  </kbd>
                  <span>filter</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-[var(--background)] rounded border">
                    esc
                  </kbd>
                  <span>close</span>
                </div>
              </div>
              <div className="text-[var(--muted)]">
                {query.trim()
                  ? `${filteredResults.length} results`
                  : "Start typing to search"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
