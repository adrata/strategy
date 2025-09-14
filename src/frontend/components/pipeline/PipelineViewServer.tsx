// React Server Component for Pipeline Data (2025 Best Practice)
import { Suspense } from 'react';
import { PipelineView } from './PipelineView';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';

// Server Component for initial data loading
async function PipelineDataLoader({ section }: { section: string }) {
  // This runs on the server and can directly access the database
  // No API calls needed - direct database access
  try {
    // In a real implementation, you'd fetch data directly here
    // const data = await prisma.opportunities.findMany({ ... });
    
    return <PipelineView section={section as any} />;
  } catch (error) {
    console.error('Server-side data loading failed:', error);
    return <PipelineView section={section as any} />;
  }
}

// Loading component for Suspense
function PipelineLoading() {
  return (
    <PipelineSkeleton message="Loading pipeline data..." />
  );
}

// Main Server Component with Streaming
export default function PipelineViewServer({ section }: { section: string }) {
  return (
    <Suspense fallback={<PipelineLoading />}>
      <PipelineDataLoader section={section} />
    </Suspense>
  );
}
