import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Private Message for Snyk - Adrata',
  description: 'Private message for Snyk.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Private Message for Snyk - Adrata',
    description: 'Private message for Snyk.',
    url: 'https://adrata.com/private/snyk',
    type: 'website',
    siteName: 'Adrata',
  },
  twitter: {
    card: 'summary',
    title: 'Private Message for Snyk - Adrata',
    description: 'Private message for Snyk.',
  },
};

export default function PrivateSnykLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 