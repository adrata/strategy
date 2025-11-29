/**
 * Prospects Loading State
 */
export default function ProspectsLoading() {
  return (
    <div className="h-full w-full bg-background animate-pulse">
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-28 bg-hover rounded" />
            <div className="h-4 w-44 bg-hover rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-28 bg-hover rounded" />
            <div className="h-10 w-32 bg-hover rounded" />
          </div>
        </div>
      </div>
      <div className="p-4 flex items-center gap-4">
        <div className="h-10 flex-1 max-w-md bg-hover rounded" />
        <div className="h-10 w-20 bg-hover rounded" />
        <div className="h-10 w-20 bg-hover rounded" />
      </div>
      <div className="px-4 space-y-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-card border border-border rounded flex items-center gap-4 px-4" style={{ opacity: 1 - (i * 0.1) }}>
            <div className="h-4 w-32 bg-hover rounded" />
            <div className="h-4 w-40 bg-hover rounded" />
            <div className="h-6 w-20 bg-hover rounded-full" />
            <div className="h-4 w-24 bg-hover rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

