"use client";

import React, { useState } from "react";
import { 
  BookOpenIcon, 
  CodeBracketIcon, 
  DocumentTextIcon, 
  SparklesIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { useDocs } from "../layout";
import { DocSection, DocPage } from "../types/docs";
import { docsContent } from "../content/docsContent";

export function DocsLeftPanel() {
  const { selectedPage, setSelectedPage, activeSection, setActiveSection, searchQuery, setSearchQuery } = useDocs();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handlePageClick = (page: DocPage) => {
    setSelectedPage(page);
  };

  const handleSectionClick = (section: DocSection) => {
    setActiveSection(section.id);
    if (!expandedSections.has(section.id)) {
      setExpandedSections(prev => new Set([...prev, section.id]));
    }
  };

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'overview':
        return BookOpenIcon;
      case 'api':
        return CodeBracketIcon;
      case 'release-notes':
        return DocumentTextIcon;
      case 'cheat-codes':
        return SparklesIcon;
      default:
        return BookOpenIcon;
    }
  };

  const filteredSections = docsContent.sections.filter(section => {
    if (!searchQuery) return true;
    return section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           section.pages.some(page => 
             page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             page.description.toLowerCase().includes(searchQuery.toLowerCase())
           );
  });

  return (
    <div className="h-full flex flex-col bg-[var(--panel-background)] border-r border-[var(--border)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <BookOpenIcon className="w-5 h-5 text-[var(--foreground)]" />
          <h2 className="font-semibold text-[var(--foreground)]">Documentation</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {filteredSections.map((section) => {
            const SectionIcon = getSectionIcon(section.id);
            const isExpanded = expandedSections.has(section.id);
            const isActive = activeSection === section.id;

            return (
              <div key={section.id} className="mb-1">
                {/* Section Header */}
                <button
                  onClick={() => {
                    handleSectionClick(section);
                    toggleSection(section.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[var(--button-primary)] text-white' 
                      : 'text-[var(--foreground)] hover:bg-[var(--hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-4 h-4" />
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>

                {/* Section Pages */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.pages.map((page) => {
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
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--muted)]">
          <p>Need help? Contact support</p>
        </div>
      </div>
    </div>
  );
}