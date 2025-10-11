"use client";

import React, { useState, useEffect } from "react";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { useDocs } from "../layout";
import { TableOfContentsItem } from "../types/docs";

export function DocsRightPanel() {
  const { selectedPage } = useDocs();
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);

  useEffect(() => {
    if (selectedPage) {
      // Generate table of contents from the content
      const toc = generateTableOfContents(selectedPage.content);
      setTableOfContents(toc);
    } else {
      setTableOfContents([]);
    }
  }, [selectedPage]);

  const generateTableOfContents = (content: string): TableOfContentsItem[] => {
    const lines = content.split('\n');
    const toc: TableOfContentsItem[] = [];
    let currentId = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Match markdown headers
      const h1Match = trimmedLine.match(/^# (.*)$/);
      const h2Match = trimmedLine.match(/^## (.*)$/);
      const h3Match = trimmedLine.match(/^### (.*)$/);
      const h4Match = trimmedLine.match(/^#### (.*)$/);

      if (h1Match) {
        toc.push({
          id: `h1-${currentId++}`,
          title: h1Match[1],
          level: 1
        });
      } else if (h2Match) {
        toc.push({
          id: `h2-${currentId++}`,
          title: h2Match[1],
          level: 2
        });
      } else if (h3Match) {
        toc.push({
          id: `h3-${currentId++}`,
          title: h3Match[1],
          level: 3
        });
      } else if (h4Match) {
        toc.push({
          id: `h4-${currentId++}`,
          title: h4Match[1],
          level: 4
        });
      }
    });

    return toc;
  };

  const scrollToHeading = (id: string) => {
    // In a real implementation, you'd scroll to the heading
    console.log('Scrolling to:', id);
  };

  if (!selectedPage) {
    return <RightPanel />;
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h2 className="font-semibold text-[var(--foreground)]">Table of Contents</h2>
          <p className="text-sm text-[var(--muted)]">{selectedPage.title}</p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {tableOfContents.length > 0 ? (
          <nav className="space-y-1">
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors hover:bg-[var(--hover)] ${
                  item.level === 1 
                    ? 'font-medium text-[var(--foreground)]' 
                    : item.level === 2
                    ? 'text-[var(--foreground)] ml-2'
                    : item.level === 3
                    ? 'text-[var(--muted-foreground)] ml-4'
                    : 'text-[var(--muted)] ml-6'
                }`}
              >
                {item.title}
              </button>
            ))}
          </nav>
        ) : (
          <div className="text-center text-[var(--muted)] py-8">
            <p className="text-sm">No headings found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="space-y-2">
          <button className="w-full px-3 py-2 text-sm bg-[var(--button-primary)] text-white rounded-lg hover:bg-[var(--button-primary-hover)] transition-colors">
            Was this helpful?
          </button>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors">
              👍
            </button>
            <button className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-colors">
              👎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}