/**
 * Monaco Finder Component
 *
 * Allows users to ask "Who is the best person to contact at X company"
 * Uses Monaco intelligence to find the right person and offers to save to CRM.
 */

import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { useActionPlatform } from "@/platform/ui/context/ActionPlatformProvider";
import { safeApiFetch } from "@/platform/api-fetch";

interface PersonSuggestion {
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  department: string;
  influence: "High" | "Medium" | "Low";
  buyerGroupRole: string;
  reasoning: string;
  confidence: number; // 0-100
  profileUrl?: string;
  linkedinUrl?: string;
}

interface CompanySearch {
  query: string;
  isLoading: boolean;
  suggestions: PersonSuggestion[];
  hasSearched: boolean;
}

interface MonacoFinderProps {
  isMinimized?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
}

export function MonacoFinder({
  isMinimized = false,
  onMinimize,
  onExpand,
}: MonacoFinderProps) {
  const {
    ui: { activeSubApp },
    chat: { setChatSessions },
  } = useActionPlatform();
  const [search, setSearch] = useState<CompanySearch>({
    query: "",
    isLoading: false,
    suggestions: [],
    hasSearched: false,
  });

  // If minimized, show as pill
  if (isMinimized) {
    return (
      <button
        onClick={onExpand}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
      >
        <MagnifyingGlassIcon className="w-4 h-4" />
        <span>Monaco Finder</span>
      </button>
    );
  }

  const handleSearch = async () => {
    if (!search.query.trim()) return;

    setSearch((prev) => ({ ...prev, isLoading: true, hasSearched: true }));

    try {
      // First, try to get company intelligence from Monaco
      const monacoResponse = await safeApiFetch(
        "/api/enrichment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "monaco_search",
            searchQuery: search.query,
            workspaceId: "01K1VBYV8ETM2RCQA4GNN9EG72",
            userId: "01K1VBYYV7TRPY04NW4TW4XWRB",
            maxCompanies: 1,
            realTimeUpdates: false,
          }),
        },
        {
          success: false,
          executionId: null,
          message: "Monaco search failed",
        },
      );

      if (monacoResponse['success'] && monacoResponse.executionId) {
        console.log("Monaco search triggered:", monacoResponse.executionId);
      }

      if (monacoResponse.success) {
        const monacoData = monacoResponse;

        // Poll for results
        let attempts = 0;
        while (attempts < 10) {
          const statusResponse = await fetch(
            `/api/enrichment/${monacoData.executionId}?workspaceId=c854dff0-27db-4e79-a47b-787b0618a353`,
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            if (statusData['status'] === "completed" && statusData.intelligence) {
              // Extract person suggestions from intelligence
              const suggestions = extractPersonSuggestions(
                statusData.intelligence,
                search.query,
              );
              setSearch((prev) => ({ ...prev, suggestions, isLoading: false }));
              return;
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }
      }

      // Fallback to demo data if enrichment fails
      const demoSuggestions = generateDemoSuggestions(search.query);
      setSearch((prev) => ({
        ...prev,
        suggestions: demoSuggestions,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error searching for contacts:", error);

      // Show demo data on error
      const demoSuggestions = generateDemoSuggestions(search.query);
      setSearch((prev) => ({
        ...prev,
        suggestions: demoSuggestions,
        isLoading: false,
      }));
    }
  };

  const extractPersonSuggestions = (
    intelligence: any,
    companyQuery: string,
  ): PersonSuggestion[] => {
    // Extract people from Monaco intelligence results
    const suggestions: PersonSuggestion[] = [];

    Object.values(intelligence).forEach((companyData: any) => {
      if (companyData['people'] && Array.isArray(companyData.people)) {
        companyData.people.forEach((person: any) => {
          suggestions.push({
            name: person.name,
            title: person.title || "Unknown Title",
            company: companyData.company?.name || companyQuery,
            email: person.email,
            phone: person.phone,
            department: person.department || "Unknown",
            influence:
              person.influence > 0.7
                ? "High"
                : person.influence > 0.4
                  ? "Medium"
                  : "Low",
            buyerGroupRole: person.buyerGroupRole || "Stakeholder",
            reasoning: `Based on ${person.title} role and ${person.influence || 0.5} influence score, this person is likely involved in procurement decisions.`,
            confidence: Math.round((person.influence || 0.5) * 100),
            linkedinUrl: person.linkedinUrl,
          });
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  };

  const generateDemoSuggestions = (
    companyQuery: string,
  ): PersonSuggestion[] => {
    // Demo data for companies like Nike, TechCorp, etc.
    const demoData: Record<string, PersonSuggestion[]> = {
      nike: [
        {
          name: "Sarah Chen",
          title: "VP of Technology",
          company: "Nike",
          email: "sarah.chen@nike.com",
          department: "Technology",
          influence: "High",
          buyerGroupRole: "Decision Maker",
          reasoning:
            "As VP of Technology, Sarah has budget authority and direct influence over platform decisions. She has been at Nike for 4+ years and leads the digital transformation initiative.",
          confidence: 92,
          linkedinUrl: "https://linkedin.com/in/sarahchen-nike",
        },
        {
          name: "Michael Torres",
          title: "Director of Engineering",
          company: "Nike",
          email: "michael.torres@nike.com",
          department: "Engineering",
          influence: "High",
          buyerGroupRole: "Technical Champion",
          reasoning:
            "Michael leads the engineering team that would implement any new platform. He is known for advocating innovative solutions and has strong technical influence.",
          confidence: 87,
          linkedinUrl: "https://linkedin.com/in/michaeltorres-eng",
        },
        {
          name: "Jennifer Kim",
          title: "Senior Product Manager",
          company: "Nike",
          email: "jennifer.kim@nike.com",
          department: "Product",
          influence: "Medium",
          buyerGroupRole: "Stakeholder",
          reasoning:
            "Jennifer manages products that would integrate with the platform. While not a final decision maker, she provides critical requirements and user perspective.",
          confidence: 74,
        },
      ],
      default: [
        {
          name: "Alex Johnson",
          title: "Chief Technology Officer",
          company: companyQuery,
          email: `alex.johnson@${companyQuery.toLowerCase().replace(/\s+/g, "")}.com`,
          department: "Technology",
          influence: "High",
          buyerGroupRole: "Decision Maker",
          reasoning:
            "As CTO, Alex has both technical expertise and budget authority for platform decisions. Typically the key stakeholder for B2B software purchases.",
          confidence: 88,
        },
        {
          name: "Maria Rodriguez",
          title: "Director of Operations",
          company: companyQuery,
          email: `maria.rodriguez@${companyQuery.toLowerCase().replace(/\s+/g, "")}.com`,
          department: "Operations",
          influence: "Medium",
          buyerGroupRole: "Champion",
          reasoning:
            "Operations leaders often champion efficiency tools and have strong influence on implementation decisions.",
          confidence: 75,
        },
      ],
    };

    const companyKey = companyQuery.toLowerCase().includes("nike")
      ? "nike"
      : "default";
    return demoData[companyKey] || demoData.default || [];
  };

  const handleSaveToPipeline = async (person: PersonSuggestion) => {
    try {
      // Add to leads via API
      const response = (await safeApiFetch(
        "/api/data/leads",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: "01K1VBYV8ETM2RCQA4GNN9EG72",
            userId: "01K1VBYYV7TRPY04NW4TW4XWRB",
            leadData: {
              name: person.name,
              title: person.title,
              email: person.email,
              phone: person.phone,
              company: person.company,
              source: "Monaco Finder",
              status: "new",
              notes: `AI-recommended contact: ${person.reasoning}`,
            },
          }),
        },
        {
          success: false,
          lead: null,
          id: null,
        },
      )) as any;

      if (response['success'] && response['lead'] && response.lead.id) {
        console.log("Lead created:", response.lead.id);

        // Add success message to chat
        const successMessage = {
          id: Date.now().toString(),
          type: "assistant" as const,
          content: `✅ Added ${person.name} to your Acquisition OS! They have been saved as a new lead with ${person.buyerGroupRole} role at ${person.company}.`,
          timestamp: new Date(),
        };

        setChatSessions((prev) => ({
          ...prev,
          [activeSubApp]: [...(prev[activeSubApp] || []), successMessage],
        }));

        // Trigger enrichment for the new lead
        await safeApiFetch(
          "/api/enrichment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "single_lead",
              leadIds: [response.lead.id],
              workspaceId: process.env.NEXT_PUBLIC_WORKSPACE_ID || "PLACEHOLDER_VALUE",
              userId: process.env.DEFAULT_USER_ID || "PLACEHOLDER_VALUE",
              realTimeUpdates: true,
            }),
          },
          {
            success: false,
            executionId: null,
          },
        );
      }
    } catch (error) {
      console.error("Error saving to CRM:", error);

      const errorMessage = {
        id: Date.now().toString(),
        type: "assistant" as const,
        content: `❌ Failed to save ${person.name} to CRM. Please try again.`,
        timestamp: new Date(),
      };

      setChatSessions((prev) => ({
        ...prev,
        [activeSubApp]: [...(prev[activeSubApp] || []), errorMessage],
      }));
    }
  };

  return (
    <div className="bg-background border border-border rounded-xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <MagnifyingGlassIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            Monaco Finder
          </h3>
          <p className="text-xs text-muted">
            Find the best contact at any company
          </p>
        </div>
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="w-6 h-6 flex items-center justify-center text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors"
            title="Minimize"
          >
            <MinusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., Nike, TechCorp, Salesforce..."
            value={search.query}
            onChange={(e) =>
              setSearch((prev) => ({ ...prev, query: e.target.value }))
            }
            onKeyPress={(e) => e['key'] === "Enter" && handleSearch()}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={search.isLoading || !search.query.trim()}
                            className="px-4 py-2 bg-foreground text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {search.isLoading ? "..." : "Find"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {search['isLoading'] && (
        <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-xs text-muted">
            Analyzing company and finding contacts...
          </p>
        </div>
      )}

      {/* Results */}
      {!search['isLoading'] && search['hasSearched'] && (
        <div className="space-y-3">
          {search['suggestions']['length'] === 0 ? (
            <div className="text-center py-6">
              <BuildingOfficeIcon className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">
                No contacts found for {search.query}
              </p>
              <p className="text-xs text-muted mt-1">
                Try a different company name
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted mb-2">
                Found {search.suggestions.length} potential contacts:
              </div>
              {search.suggestions.map((person, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground text-sm">
                        {person.name}
                      </h4>
                      <p className="text-xs text-muted">
                        {person.title} • {person.department}
                      </p>
                      {person['email'] && (
                        <p className="text-xs text-blue-600 mt-1">
                          {person.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          person['influence'] === "High"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : person['influence'] === "Medium"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-hover text-gray-700 dark:bg-foreground/30 dark:text-muted"
                        }`}
                      >
                        {person.confidence}% match
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted mb-3 leading-relaxed">
                    <strong>Why this person:</strong> {person.reasoning}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                      {person.buyerGroupRole}
                    </span>

                    <div className="flex-1"></div>

                    {person['linkedinUrl'] && (
                      <button
                        onClick={() =>
                          window.open(person.linkedinUrl, "_blank")
                        }
                        className="text-xs text-muted hover:text-gray-700 hover:underline"
                      >
                        LinkedIn
                      </button>
                    )}

                    <button
                      onClick={() => handleSaveToPipeline(person)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                      <UserPlusIcon className="w-3 h-3" />
                      Save to CRM
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Help Text */}
      {!search['hasSearched'] && (
        <div className="text-xs text-muted leading-relaxed">
          💡 <strong>AI-powered contact discovery:</strong> Ask me to find the
          best person to contact at any company. I will analyze their org
          structure, identify decision makers, and explain why they are the
          right contact.
        </div>
      )}
    </div>
  );
}
