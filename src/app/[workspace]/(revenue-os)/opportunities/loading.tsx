/**
 * Opportunities Loading State
 */
export default function OpportunitiesLoading() {
  return (
    <div className="h-full w-full bg-background animate-pulse">
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-36 bg-hover rounded" />
            <div className="h-4 w-32 bg-hover rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-28 bg-hover rounded" />
            <div className="h-10 w-32 bg-hover rounded" />
          </div>
        </div>
      </div>
      {/* Kanban columns skeleton */}
      <div className="p-4 flex gap-4 overflow-x-auto">
        {[...Array(4)].map((_, colIdx) => (
          <div key={colIdx} className="min-w-[280px] bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-24 bg-hover rounded" />
              <div className="h-6 w-8 bg-hover rounded-full" />
            </div>
            {[...Array(3 - colIdx)].map((_, cardIdx) => (
              <div key={cardIdx} className="bg-background border border-border rounded-lg p-3 space-y-2" style={{ opacity: 1 - (cardIdx * 0.15) }}>
                <div className="h-4 w-32 bg-hover rounded" />
                <div className="h-3 w-24 bg-hover rounded" />
                <div className="flex justify-between items-center mt-2">
                  <div className="h-6 w-16 bg-hover rounded-full" />
                  <div className="h-4 w-12 bg-hover rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

