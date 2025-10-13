"use client";

import React, { useState, useEffect } from "react";
import { useActionGuide } from "../layout";
import { ActionGuidePage } from "../types/action-guide";

export function ActionGuideContent() {
  const { selectedPage } = useActionGuide();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (selectedPage) {
      setContent(selectedPage.content);
    } else {
      // Show welcome content when no page is selected
      setContent(`
# Welcome to the Adrata Action Guide

Your comprehensive guide to using Adrata effectively! This Action Guide is designed to help you master all the features and tools available in your workspace.

## What You'll Learn

This guide covers everything you need to know to:
- **Navigate the platform** with confidence
- **Use Speedrun** for daily revenue activities
- **Manage Leads and Prospects** effectively
- **Track your Pipeline** and opportunities
- **Leverage AI assistance** for better results
- **Perform common tasks** like uploading data and searching

## How to Use This Guide

### Quick Navigation
- Use the **left panel** to browse different sections
- Click on any topic to see detailed instructions
- Use the **search** feature to find specific information
- Bookmark important pages for quick reference

### Getting Help
- Each section includes step-by-step instructions
- Look for **💡 Tips** and **⚠️ Important** callouts
- Use the **Feedback** button to suggest improvements

## Your Journey

1. **Start Here** - Read the Getting Started section
2. **Explore Features** - Learn about Speedrun, Leads, Prospects, and Pipeline
3. **Master Tasks** - Practice common operations
4. **Go Advanced** - Unlock powerful features

## Quick Start

### Essential First Steps
1. **Add your first contact** in Leads
2. **Try the AI assistant** with a question
3. **Explore Speedrun** for daily activities
4. **Check out the Core Features** section for detailed guides

### Common Questions
- **"How do I add a new lead?"** → Check the Upload Data guide
- **"What should I do with this contact?"** → Use the AI Right Panel
- **"How do I track my progress?"** → See the Pipeline Management guide
- **"How do I send emails efficiently?"** → Learn about Speedrun

## Need More Help?

- **Browse the sections** in the left panel for detailed guides
- **Use the search** functionality to find specific topics
- **Ask the AI assistant** for personalized help
- **Contact support** for additional assistance

Ready to get started? Select a section from the left panel to begin your journey with Adrata!
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
