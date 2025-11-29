/**
 * Speedrun Loading State - Performance Optimized
 * 
 * This is a Server Component that renders immediately on the server,
 * providing instant visual feedback before any JavaScript loads.
 * 
 * Key optimizations:
 * - No JavaScript required - pure HTML/CSS
 * - Uses CSS animations instead of JS for pulse effect
 * - Fixed dimensions prevent CLS (Cumulative Layout Shift)
 * - Minimal DOM nodes for faster paint
 */
export default function SpeedrunLoading() {
  return (
    <div className="h-full w-full bg-background">
      {/* Header skeleton - fixed height prevents CLS */}
      <div className="h-[72px] border-b border-border bg-card px-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-muted rounded animate-pulse" />
          <div className="h-4 w-36 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-20 bg-muted rounded animate-pulse" />
          <div className="h-9 w-28 bg-muted rounded animate-pulse" />
        </div>
      </div>
      
      {/* Stats row - fixed height */}
      <div className="h-[60px] border-b border-border bg-card px-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-5 w-8 bg-muted rounded animate-pulse" />
          <div className="h-3 w-14 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
          <div className="h-3 w-10 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
          <div className="h-3 w-14 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Search bar - fixed height */}
      <div className="h-[56px] px-4 flex items-center gap-3">
        <div className="h-9 flex-1 max-w-sm bg-muted rounded animate-pulse" />
        <div className="h-9 w-16 bg-muted rounded animate-pulse" />
        <div className="h-9 w-16 bg-muted rounded animate-pulse" />
        <div className="h-9 w-20 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Table header - fixed height */}
      <div className="h-11 mx-4 bg-muted/30 rounded-t flex items-center px-4 gap-4">
        <div className="h-3 w-10 bg-muted rounded animate-pulse" />
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Table rows - each row fixed height */}
      <div className="mx-4 space-y-px">
        {Array.from({ length: 6 }, (_, i) => (
          <div 
            key={i} 
            className="h-14 bg-card border-x border-b border-border first:border-t flex items-center px-4 gap-4"
          >
            <div className="h-6 w-6 bg-muted rounded-full animate-pulse" />
            <div className="h-3 w-28 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            <div className="h-3 w-6 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      
      {/* Pagination - fixed height */}
      <div className="h-12 flex justify-center items-center">
        <div className="h-3 w-40 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

