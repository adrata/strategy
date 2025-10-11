"use client";

import React, { useState, useEffect } from "react";
import { useDocs } from "../layout";
import { DocPage } from "../types/docs";

export function DocsContent() {
  const { selectedPage } = useDocs();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (selectedPage) {
      setContent(selectedPage.content);
    } else {
      // Show welcome content when no page is selected
      setContent(`
# Welcome to Adrata Documentation

Welcome to the comprehensive documentation for the Adrata platform. Here you'll find everything you need to get started and make the most of our business intelligence and sales platform.

## Getting Started

### Quick Start
1. **Set up your workspace** - Configure your team and permissions
2. **Connect integrations** - Link your CRM, email, and other tools
3. **Import your data** - Bring in existing contacts and deals
4. **Start using AI** - Leverage our intelligence features

### Core Applications

#### Action Platform (Falcon)
Your main pipeline management tool with AI-powered insights and relationship intelligence.

#### Monaco
Business intelligence and prospecting with alternative data sources and research tools.

#### Grand Central
Integration hub connecting 500+ applications and services through our unified platform.

#### Olympus
Workflow automation and orchestration for complex multi-step processes.

#### Speedrun
Quick actions and communication platform for rapid execution and outreach.

## Navigation

Use the left panel to explore different sections:
- **Overview** - User guides and tutorials
- **API Reference** - Developer documentation
- **Release Notes** - Version history and updates
- **Cheat Codes** - Power user tips and shortcuts

## Need Help?

- Browse the sections in the left panel
- Use the search functionality to find specific topics
- Contact support for additional assistance

Happy exploring! 🚀
      `);
    }
  }, [selectedPage]);

  const renderMarkdown = (markdown: string) => {
    // Simple markdown rendering - in a real implementation, you'd use a markdown library
    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-[var(--foreground)] mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-[var(--foreground)] mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-[var(--foreground)] mb-2 mt-4">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-base font-medium text-[var(--foreground)] mb-2 mt-3">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--foreground)]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-[var(--foreground)]">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[var(--panel-background)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--foreground)]">$1</code>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-[var(--foreground)]">')
      .replace(/^(?!<[h|l])/gm, '<p class="mb-4 text-[var(--foreground)]">')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc list-inside mb-4">$1</ul>');
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Content Header */}
      {selectedPage && (
        <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {selectedPage.title}
            </h1>
            <p className="text-[var(--muted)] mb-2">
              {selectedPage.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
              <span>Last updated: {selectedPage.lastUpdated}</span>
              {selectedPage.tags && selectedPage.tags.length > 0 && (
                <div className="flex gap-1">
                  {selectedPage.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-[var(--panel-background)] rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdown(content) 
            }}
          />
        </div>
      </div>
    </div>
  );
}
