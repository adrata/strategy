/**
 * Speedrun Detail Loading State - Performance Optimized
 * 
 * Server Component for instant visual feedback on record detail pages.
 * Fixed dimensions prevent CLS during hydration.
 */
export default function SpeedrunDetailLoading() {
  return (
    <div className="h-full w-full bg-background flex">
      {/* Left panel - record detail */}
      <div className="flex-1 border-r border-border">
        {/* Header with back button */}
        <div className="h-14 border-b border-border px-4 flex items-center gap-3">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </div>
        
        {/* Profile section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-36 bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="h-12 border-b border-border px-4 flex items-center gap-4">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-14 bg-muted/60 rounded animate-pulse" />
        </div>
        
        {/* Tab content skeleton */}
        <div className="p-6 space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Right panel placeholder - matches AI panel width */}
      <div className="w-80 bg-card/50 flex-shrink-0">
        <div className="h-12 border-b border-border px-4 flex items-center">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

