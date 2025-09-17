// app/(dashboard)/reports/page.tsx
/**
 * Reports page: high-level metrics with selectable time ranges.
 * Server-first rendering; charts hydrate on the client for interactivity.
 */

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// -------- Route & caching config --------
export const revalidate = 60; // re-generate this route at most once per minute

export const metadata: Metadata = {
  title: 'Reports · Acme',
  description: 'Key metrics updated hourly.',
};

// Prefer streaming HTML and client-hydrated chart
const Chart = dynamic(() => import('./_components/Chart'), {
  ssr: false,
  loading: () => <div role="status" aria-busy="true">Loading chart…</div>,
});

// -------- Types & constants --------
type Range = '7d' | '30d' | '90d';
type SearchParams = { range?: Range };

const RANGES: Range[] = ['7d', '30d', '90d'] as const;

type Summary = {
  labels: string[];     // e.g., dates
  totals: number[];     // e.g., counts per label
};

// -------- Helpers --------
function isRange(value: unknown): value is Range {
  return typeof value === 'string' && (RANGES as readonly string[]).includes(value);
}

// -------- Data (server) --------
async function getSummary(range: Range): Promise<Summary> {
  // Prefer environment variables over literals; tag for cache invalidation
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.example.com';
  const res = await fetch(`${base}/reports?range=${range}`, {
    next: { revalidate: 60, tags: ['reports', `reports:${range}`] },
  });

  if (!res.ok) {
    // Surface a friendly 404 when the range is unknown or data missing
    if (res.status === 404) notFound();
    throw new Error(`Failed to fetch reports (${res.status})`);
  }

  const data = (await res.json()) as Partial<Summary>;
  if (!Array.isArray(data.labels) || !Array.isArray(data.totals)) {
    // Defensive: treat malformed data like a 404
    notFound();
  }
  return { labels: data.labels!, totals: data.totals! };
}

// -------- UI (server component) --------
export default async function Page(
  { searchParams }: { searchParams?: SearchParams }
) {
  const range = isRange(searchParams?.range) ? searchParams!.range : '7d';

  // Fetch on the server; HTML streams, chart hydrates later
  const { labels, totals } = await getSummary(range);

  return (
    <main className="container mx-auto p-6" data-testid="reports-page">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>

        <nav aria-label="Time range" className="mt-2 flex gap-3">
          {RANGES.map((r) => {
            const isActive = r === range;
            return (
              <Link
                key={r}
                href={`/reports?range=${r}`}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'font-semibold underline' : 'hover:underline'}
                prefetch
              >
                {r}
              </Link>
            );
          })}
        </nav>
      </header>

      <section aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="sr-only">Totals over time</h2>

        <Suspense fallback={<p aria-live="polite">Loading data…</p>}>
          {/* Client component for interactivity; accepts only serializable props */}
          <Chart labels={labels} totals={totals} />
        </Suspense>
      </section>

      <footer className="mt-8 text-sm text-muted-foreground">
        Updated hourly • Range: <span>{range}</span>
      </footer>
    </main>
  );
}