"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpenIcon, 
  CodeBracketIcon, 
  DocumentTextIcon, 
  SparklesIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { useDocs } from "../layout";
import { DocSection, DocPage } from "../types/docs";
import { docsContent } from "../content/docsContent";
import { useUnifiedAuth } from "@/platform/auth";

export function DocsLeftPanel() {
  const { selectedPage, setSelectedPage, activeSection, setActiveSection } = useDocs();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const { user: authUser } = useUnifiedAuth();

  const handleSectionClick = (section: string) => {
    setActiveSection(section);
  };

  const handlePageClick = (page: DocPage) => {
    setSelectedPage(page);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Calculate document counts
  const totalDocuments = docsContent.sections.reduce((total, section) => total + section.pages.length, 0);
  const overviewCount = docsContent.sections.find(s => s.id === 'overview')?.pages.length || 0;
  const apiCount = docsContent.sections.find(s => s.id === 'api')?.pages.length || 0;
  const releaseNotesCount = docsContent.sections.find(s => s.id === 'release-notes')?.pages.length || 0;
  const cheatCodesCount = docsContent.sections.find(s => s.id === 'cheat-codes')?.pages.length || 0;

  const sections = [
    {
      id: "overview",
      name: "Overview",
      description: "Getting started guides",
      count: overviewCount,
      visible: true
    },
    {
      id: "api",
      name: "API Reference", 
      description: "Technical documentation",
      count: apiCount,
      visible: true
    },
    {
      id: "release-notes",
      name: "Release Notes",
      description: "Version updates", 
      count: releaseNotesCount,
      visible: true
    },
    {
      id: "cheat-codes",
      name: "Cheat Codes",
      description: "Quick tips and tricks",
      count: cheatCodesCount,
      visible: true
    }
  ];


  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header - matching Speedrun style */}
        <div className="mx-2 mt-4 mb-2">
          {/* Company Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden" style={{ filter: 'none' }}>
              <BookOpenIcon className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h3 className="text-lg font-bold leading-tight" style={{ margin: 0, padding: 0 }}>
                  Documentation
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--hover)] text-gray-800">
                  Docs
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] font-medium" style={{ marginTop: '-1px' }}>
                Knowledge Base
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Stats */}
        <div className="mx-2 mb-4 p-3 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Documents</span>
              <span className="text-xs font-semibold text-black">
                {totalDocuments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Sections</span>
              <span className="text-xs font-semibold text-black">
                {docsContent.sections.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-[var(--muted)]">Updated</span>
              <span className="text-xs font-semibold text-black">
                Today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Middle Section - Documentation Sections */}
      <div className="flex-1 overflow-y-auto invisible-scrollbar px-2">
        <div className="flex-1 space-y-1">
          {sections.filter(section => section.visible).map((section) => {
            const isActive = activeSection === section.id;
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => {
                    handleSectionClick(section.id);
                    toggleSection(section.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--hover)] text-[var(--foreground)]'
                      : 'hover:bg-[var(--panel-background)] text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{section.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--muted)]">{section.count}</span>
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {section.description}
                  </div>
                </button>

                {/* Section Pages */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {docsContent.sections
                      .find(s => s.id === section.id)
                      ?.pages.map((page) => {
                        const isPageActive = selectedPage?.id === page.id;
                        return (
                          <button
                            key={page.id}
                            onClick={() => handlePageClick(page)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                              isPageActive
                                ? 'bg-[var(--button-info)] text-white'
                                : 'text-[var(--muted-foreground)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]'
                            }`}
                          >
                            {page.title}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Section - User Info */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <div className="w-full flex items-center gap-3 p-2 rounded-lg">
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-[var(--muted)]">Documentation</div>
          </div>
        </div>
      </div>
    </div>
  );
}