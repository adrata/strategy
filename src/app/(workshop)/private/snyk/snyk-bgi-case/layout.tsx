import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snyk Buyer Group Intelligence Business Case - Adrata',
  description: 'Private message for Snyk.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Snyk Buyer Group Intelligence Business Case - Adrata',
    description: 'Private message for Snyk.',
    url: 'https://adrata.com/private/snyk/snyk-bgi-case',
    type: 'website',
    siteName: 'Adrata',
  },
  twitter: {
    card: 'summary',
    title: 'Snyk Buyer Group Intelligence Business Case - Adrata',
    description: 'Private message for Snyk.',
  },
};

export default function BusinessCaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 