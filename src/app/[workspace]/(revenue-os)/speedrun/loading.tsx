/**
 * Speedrun Loading State
 * 
 * Shows immediately while the page loads, improving FCP and LCP.
 * This skeleton provides visual feedback during initial JavaScript hydration.
 */
export default function SpeedrunLoading() {
  return (
    <div className="h-full w-full bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-hover rounded" />
            <div className="h-4 w-48 bg-hover rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-24 bg-hover rounded" />
            <div className="h-10 w-32 bg-hover rounded" />
          </div>
        </div>
      </div>
      
      {/* Stats row skeleton */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <div className="h-6 w-12 bg-hover rounded" />
            <div className="h-3 w-16 bg-hover rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-6 w-16 bg-hover rounded" />
            <div className="h-3 w-12 bg-hover rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-6 w-16 bg-hover rounded" />
            <div className="h-3 w-16 bg-hover rounded" />
          </div>
        </div>
      </div>
      
      {/* Search and filters skeleton */}
      <div className="p-4 flex items-center gap-4">
        <div className="h-10 flex-1 max-w-md bg-hover rounded" />
        <div className="h-10 w-20 bg-hover rounded" />
        <div className="h-10 w-20 bg-hover rounded" />
        <div className="h-10 w-24 bg-hover rounded" />
      </div>
      
      {/* Table header skeleton */}
      <div className="px-4">
        <div className="h-12 bg-hover/50 rounded-t flex items-center gap-4 px-4">
          <div className="h-4 w-12 bg-hover rounded" />
          <div className="h-4 w-24 bg-hover rounded" />
          <div className="h-4 w-32 bg-hover rounded" />
          <div className="h-4 w-20 bg-hover rounded" />
          <div className="h-4 w-24 bg-hover rounded" />
          <div className="h-4 w-28 bg-hover rounded" />
        </div>
      </div>
      
      {/* Table rows skeleton */}
      <div className="px-4 space-y-1">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="h-16 bg-card border border-border rounded flex items-center gap-4 px-4"
            style={{ opacity: 1 - (i * 0.1) }}
          >
            <div className="h-8 w-8 bg-hover rounded-full" />
            <div className="h-4 w-32 bg-hover rounded" />
            <div className="h-4 w-40 bg-hover rounded" />
            <div className="h-6 w-20 bg-hover rounded-full" />
            <div className="h-4 w-8 bg-hover rounded" />
            <div className="h-4 w-24 bg-hover rounded" />
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="p-4 flex justify-center">
        <div className="h-4 w-48 bg-hover rounded" />
      </div>
    </div>
  );
}

