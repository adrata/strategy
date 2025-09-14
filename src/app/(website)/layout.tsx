import { Inter } from "next/font/google";
// CSS is imported in the root layout
import React from "react";
import { Metadata, Viewport } from "next";
import ClientLayout from "./ClientLayout";

// Initialize Inter font with optimized settings for enterprise applications
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Adrata: #1 Buyer Group Intelligence Platform",
  description: "Adrata is the complete buyer group intelligence platform with AI-powered stakeholder mapping, influence analysis, and deal intelligence. Decode complex B2B buying decisions in seconds, not months.",
  keywords: "buyer group intelligence, stakeholder mapping, B2B sales, deal intelligence, influence analysis, sales platform, enterprise sales, buyer analysis, CRM integration",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://adrata.com",
    title: "Adrata: #1 Buyer Group Intelligence Platform",
    description: "Adrata is the complete buyer group intelligence platform with AI-powered stakeholder mapping, influence analysis, and deal intelligence. Decode complex B2B buying decisions in seconds, not months.",
    images: [
      {
        url: "https://adrata.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Adrata Buyer Group Intelligence Platform",
      },
    ],
    siteName: "Adrata",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrata: #1 Buyer Group Intelligence Platform",
    description: "Adrata is the complete buyer group intelligence platform with AI-powered stakeholder mapping, influence analysis, and deal intelligence. Decode complex B2B buying decisions in seconds, not months.",
    images: ["https://adrata.com/twitter-image.jpg"],
    site: "@adrata",
    creator: "@adrata",
  },
  alternates: {
    canonical: "https://adrata.com",
  },
  other: {
    "format-detection": "telephone=no",
    "google-site-verification": "your-verification-code",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "theme-color": "#000000",
  },
};

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}
