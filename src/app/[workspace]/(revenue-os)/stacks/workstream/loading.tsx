/**
 * Stacks Workstream Loading State
 * 
 * Shows immediately while the page loads, improving FCP and LCP.
 * Prevents CLS by reserving exact space for the workstream content.
 */
export default function StacksWorkstreamLoading() {
  return (
    <div className="h-full w-full bg-background">
      {/* Header with exact height to prevent CLS */}
      <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-7 w-32 bg-hover rounded animate-pulse" />
          <div className="h-5 w-24 bg-hover rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-hover rounded animate-pulse" />
          <div className="h-9 w-28 bg-hover rounded animate-pulse" />
        </div>
      </div>
      
      {/* Workstream columns container with fixed height */}
      <div className="flex h-[calc(100%-4rem)] overflow-x-auto p-4 gap-4">
        {/* Column skeletons - 4 columns for workstream */}
        {['Up Next', 'In Progress', 'Review', 'Done'].map((title, colIndex) => (
          <div 
            key={colIndex}
            className="flex-shrink-0 w-80 bg-card border border-border rounded-lg flex flex-col"
          >
            {/* Column header with exact height */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-border">
              <div className="h-5 w-20 bg-hover rounded animate-pulse" />
              <div className="h-6 w-6 bg-hover rounded animate-pulse" />
            </div>
            
            {/* Column content with card skeletons */}
            <div className="flex-1 p-3 space-y-3 overflow-hidden">
              {[...Array(colIndex === 0 ? 4 : colIndex === 1 ? 3 : 2)].map((_, cardIndex) => (
                <div 
                  key={cardIndex}
                  className="bg-background border border-border rounded-lg p-3 space-y-2"
                  style={{ opacity: 1 - (cardIndex * 0.15) }}
                >
                  <div className="h-4 w-full bg-hover rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-hover rounded animate-pulse" />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-5 w-5 bg-hover rounded-full animate-pulse" />
                    <div className="h-3 w-16 bg-hover rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

