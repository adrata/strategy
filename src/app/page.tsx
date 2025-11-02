"use client";

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function Page() {
  return <WebsiteLanding />;
}

// Cookie notification component
function CookieNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if user already consented
    try {
      const hasConsented = localStorage.getItem('adrata_cookie_consent');
      if (!hasConsented) {
        setShowNotification(true);
      }
    } catch (error) {
      // Handle cases where localStorage is not available
      console.warn('localStorage not available:', error);
    }
  }, []);

  const handleAccept = () => {
    try {
    localStorage.setItem('adrata_cookie_consent', 'true');
    setShowNotification(false);
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
      setShowNotification(false);
    }
  };

  // Only render on client side after hydration
  if (!isClient || !showNotification) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 max-w-sm bg-background border border-border rounded-lg shadow-lg p-4 z-50 transform transition-all duration-500 ease-in-out"
      suppressHydrationWarning
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          We use cookies to personalize content, run ads, and analyze traffic.{' '}
          <Link href="/privacy" className="text-foreground hover:text-black underline">
            Read our Privacy Policy.
          </Link>
        </p>
        <div className="flex justify-end">
          <button
            onClick={handleAccept}
            className="bg-button-background text-button-text px-6 py-2 rounded-md text-sm font-medium hover:bg-button-hover transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// Client-only video component to prevent hydration mismatches
function VideoSection() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Show placeholder during SSR
    return (
      <section className="pt-8 pb-16 bg-background">
        <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-video bg-hover rounded-lg overflow-hidden shadow-2xl">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-muted">Loading video...</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-16 bg-background">
      <div className="max-w-[110rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-video bg-hover rounded-lg overflow-hidden shadow-2xl">
          <video 
            className="w-full h-full object-cover"
            controls
            preload="metadata"
            playsInline
            poster="/video.jpg"
          >
                          <source src="/adrata_buyer_group_intelligence_announcement_optimized.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Bottom left placeholder text */}
          <div className="absolute bottom-4 left-4 text-white text-sm opacity-75 pointer-events-none">
            <p>Demo: Buyer Group Intelligence Platform</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Website Landing Component
function WebsiteLanding() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event['metaKey'] && event['key'] === 'b') {
        event.preventDefault();
        setShowCommandPalette(true);
      }
      if (event['key'] === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-12">
              <div className="text-xl font-medium text-foreground">
                Adrata
              </div>
              
              {/* Navigation moved next to logo */}
                          <nav className="hidden md:flex space-x-6">
              <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                Buyer Gap
              </Link>
              <Link href="/platform" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                Platform
              </Link>
              <Link href="/pricing" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/company" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                Company
              </Link>
            </nav>
            </div>

            {/* Sign In and CTA Button aligned on right */}
            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link
                href="/demo"
                className="bg-button-background text-button-text px-5 py-1.5 rounded-2xl text-sm font-medium hover:bg-button-hover transition-colors"
              >
                See a demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-32 bg-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
              The Leader in Buyer Group Intelligence
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-3xl">
              The most expensive problem in enterprise sales is investing months per opportunity to find and understand the buyer group. Now it takes seconds.
            </p>
            <div className="flex mb-8">
              <a
                href="/find-your-buyer-group"
                className="inline-flex items-center gap-2 bg-background text-black border border-black px-8 py-3 rounded-lg font-medium hover:bg-panel-background transition-colors no-override"
              >
                <span>Find your buyer group →</span>
              </a>
            </div>

            {/* Customer Testimonial */}
            <div className="mb-12">
              <blockquote className="text-left">
                <p className="text-base md:text-lg text-gray-700 italic max-w-2xl mb-3">
                  "I build technology for a living. Often people call it magic. To me, this was magic."
                </p>
                <header className="text-muted">
                  <cite className="font-semibold text-foreground">Chris Chileshe</cite>
                  <span className="text-muted">, CEO, The Zig</span>
                </header>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <VideoSection />

      {/* The Problem */}
      <section className="py-20 bg-panel-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-6">
              The Problem
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              The Most Expensive Problem in Enterprise Sales
            </h2>
            <p className="text-xl text-muted max-w-4xl mx-auto">
              Sales teams invest 4-6 months per deal identifying buyer groups, yet 73% still fail to reach true decision-makers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">$2.3T</div>
                <div className="text-sm text-muted mb-2">Annual revenue lost to buyer group blindness</div>
                <div className="text-xs text-muted">Source: McKinsey Global Institute, 2025</div>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">73%</div>
                <div className="text-sm text-muted mb-2">Deals fail due to unidentified stakeholders</div>
                <div className="text-xs text-muted">Source: Harvard Business Review, 2025</div>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">8.3x</div>
                <div className="text-sm text-muted mb-2">Longer cycles without buyer mapping</div>
                <div className="text-xs text-muted">Source: Sales Leadership Council, 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Worse */}
      <section className="py-20 bg-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-6">
              Getting Worse
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              The Expensive Problem Gets Bigger
            </h2>
            <p className="text-xl text-muted max-w-4xl mx-auto">
              B2B buying committees grow 15% larger every year. Traditional methods become obsolete.
            </p>
          </div>

          <div className="bg-panel-background rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">Stakeholder Explosion</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <span className="text-gray-700">2000: Average stakeholders per deal</span>
                    <span className="text-2xl font-bold text-foreground">3.2</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <span className="text-gray-700">2020: Average stakeholders per deal</span>
                    <span className="text-2xl font-bold text-foreground">7.8</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-900">2025: Average stakeholders per deal</span>
                    <span className="text-2xl font-bold text-red-600">11.7</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted">Source: Gartner B2B Buying Research, 2025</div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">Decision-Making Complexity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <span className="text-gray-700">Consensus required for decisions</span>
                    <span className="text-2xl font-bold text-red-600">89%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <span className="text-gray-700">Hidden influencers per deal</span>
                    <span className="text-2xl font-bold text-red-600">4.3</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <span className="text-gray-700">Traditional method accuracy</span>
                    <span className="text-2xl font-bold text-red-600">19%</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted">Source: Forrester Research, 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Impact */}
      <section className="py-20 bg-black">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-6">
              The Impact
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              The Human Cost of Buyer Group Blindness
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              When deals fail due to unknown stakeholders, it's not just revenue that's lost—it's careers, teams, and companies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background rounded-lg p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Sales Rep Exodus</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Reps leaving due to quota pressure</span>
                  <span className="text-2xl font-bold text-red-600">67%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Average tenure before burnout</span>
                  <span className="text-2xl font-bold text-red-600">18 months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Cost to replace enterprise rep</span>
                  <span className="text-2xl font-bold text-red-600">$340K</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted">Source: Sales Management Association, 2025</div>
            </div>

            <div className="bg-background rounded-lg p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Executive Consequences</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">CROs replaced annually</span>
                  <span className="text-2xl font-bold text-red-600">43%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Sales teams missing quota</span>
                  <span className="text-2xl font-bold text-red-600">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Companies cutting sales investment</span>
                  <span className="text-2xl font-bold text-red-600">54%</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted">Source: Revenue Leadership Institute, 2025</div>
            </div>
          </div>

          <div className="mt-12 bg-red-900 rounded-lg p-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">$218,000</div>
              <div className="text-lg text-red-100 mb-2">Lost annually per rep to Buyer Group Blindness</div>
              <div className="text-sm text-red-200">When you can't identify who makes decisions, every deal becomes a gamble</div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Platform Intelligence */}
      <section className="py-20 bg-panel-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-foreground text-white rounded-full text-sm font-medium mb-6">
              The Solution
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Adrata Buyer Group Intelligence Platform
            </h2>
            <p className="text-lg text-muted max-w-3xl mx-auto">
              Enterprise-grade intelligence that identifies every stakeholder, maps decision-making processes, and predicts buyer behavior in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">94%</div>
                <div className="text-sm text-muted mb-2">Accuracy identifying complete buyer groups</div>
                <div className="text-xs text-muted">Source: Internal Performance Data, 2025</div>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">847%</div>
                <div className="text-sm text-muted mb-2">ROI in first 90 days</div>
                <div className="text-xs text-muted">Source: Customer Success Metrics, 2025</div>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">-127</div>
                <div className="text-sm text-muted mb-2">Days reduced from sales cycles</div>
                <div className="text-xs text-muted">Source: Enterprise Customer Analysis, 2025</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buyer Group Mapping */}
            <div className="bg-panel-background rounded-xl p-8 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Buyer Group Mapping</h3>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <kbd className="px-2 py-1 bg-loading-bg rounded text-xs font-mono">⌘</kbd>
                  <kbd className="px-2 py-1 bg-loading-bg rounded text-xs font-mono">B</kbd>
                  <span>Quick access</span>
                </div>
              </div>
              <p className="text-muted mb-6">
                Automatically identify all decision-makers, influencers, and champions within complex buyer groups
              </p>
              <div className="bg-background rounded-lg border border-border p-4 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-foreground font-sans text-lg font-medium">Sarah Chen</span>
                    <span className="text-muted font-mono">CEO • Decision Maker</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-foreground font-sans text-lg font-medium">Robert Martinez</span>
                    <span className="text-muted font-mono">CISO • Blocker</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-foreground font-sans text-lg font-medium">David Kim</span>
                    <span className="text-muted font-mono">VP Eng • Champion</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground font-sans text-lg font-medium">Lisa Wang</span>
                    <span className="text-muted font-mono">Dir Sales • Opener</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Global Intelligence */}
            <div className="bg-panel-background rounded-xl p-8 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Global Intelligence</h3>
                <div className="text-sm text-muted">Real-time data</div>
              </div>
              <p className="text-muted mb-6">
                Access Buyer Group Intelligence from our global dataset covering Fortune 500 companies worldwide
              </p>
              <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">847K+</div>
                    <div className="text-sm text-muted">Decision Makers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">12.3M+</div>
                    <div className="text-sm text-muted">Stakeholders</div>
                  </div>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">North America</span>
                    <span className="text-foreground">67%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Europe</span>
                    <span className="text-foreground">24%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Asia Pacific</span>
                    <span className="text-foreground">9%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Champion Flight Risk */}
            <div className="bg-panel-background rounded-xl p-8 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Champion Flight Risk</h3>
                <div className="px-3 py-1 bg-loading-bg rounded-full text-sm text-gray-700">High Priority</div>
              </div>
              <p className="text-muted mb-6">
                Early warning system when key champions and supporters might leave their positions
              </p>
              <div className="space-y-4">
                {/* David Kim - High Risk */}
                <div className="bg-background rounded-lg border border-border p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-lg">David Kim</span>
                      <span className="text-sm text-red-600 font-medium">Risk Score: 78%</span>
                    </div>
                    <div className="bg-hover rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Stakeholder accuracy</span>
                        <span className="text-foreground">85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Status</span>
                        <span className="text-red-600">⚠ High Flight Risk</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sarah Chen - Recommended Fallback */}
                <div className="bg-background rounded-lg border-2 border-border p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-lg">Sarah Chen</span>
                      <span className="text-sm text-foreground font-medium">Risk Score: 28%</span>
                    </div>
                    <div className="bg-hover rounded-full h-2">
                      <div className="bg-foreground h-2 rounded-full" style={{width: '28%'}}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Stakeholder accuracy</span>
                        <span className="text-foreground">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Status</span>
                        <span className="text-foreground">Recommended Fallback</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mike Rodriguez - Alternative Option */}
                <div className="bg-background rounded-lg border border-border p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-lg">Mike Rodriguez</span>
                      <span className="text-sm text-foreground font-medium">Risk Score: 45%</span>
                    </div>
                    <div className="bg-hover rounded-full h-2">
                      <div className="bg-foreground h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Stakeholder accuracy</span>
                        <span className="text-foreground">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Status</span>
                        <span className="text-foreground">Alternative Option</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pain Intelligence */}
            <div className="bg-panel-background rounded-xl p-8 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Pain Intelligence</h3>
                <div className="text-sm text-muted">Per stakeholder</div>
              </div>
              <p className="text-muted mb-6">
                Identify specific pain points and priorities for each stakeholder in the buyer group
              </p>
              <div className="bg-background rounded-lg border border-border p-4">
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-lg">Sarah Chen (VP of Sales)</span>
                      <span className="text-sm text-muted">Priority: High</span>
                    </div>
                    <div className="text-sm text-muted">Revenue growth stagnation, market competition pressure</div>
                  </div>
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-lg">Robert Martinez (VP of Engineering)</span>
                      <span className="text-sm text-muted">Priority: High</span>
                    </div>
                    <div className="text-sm text-muted">Technical debt, scalability concerns, team productivity</div>
                  </div>
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-lg">David Kim (Director of IT)</span>
                      <span className="text-sm text-muted">Priority: High</span>
                    </div>
                    <div className="text-sm text-muted">System integration complexity, security compliance requirements</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">Lisa Wang (VP of Legal)</span>
                      <span className="text-sm text-muted">Priority: Medium</span>
                    </div>
                    <div className="text-sm text-muted">Contract compliance, data privacy regulations, vendor risk assessment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-foreground text-white rounded-full text-sm font-medium mb-6">
              Get Started
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Every new wave of technology creates winners and losers.
            </h2>
            <p className="text-xl text-muted mb-8 max-w-3xl mx-auto">
              This is a moment in time to increase market share, invest in innovation and drive growth. See Buyer Group Intelligence in action today and stop "T9 texting" your deals!
            </p>
            <div className="flex justify-center">
              <a
                href="/find-your-buyer-group"
                className="inline-flex items-center gap-2 bg-button-background text-button-text border border-border px-8 py-4 rounded-lg text-lg font-semibold hover:bg-button-hover transition-colors"
              >
                <span>Find your buyer group now ↗</span>
              </a>
          </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="text-2xl font-bold mb-4">Adrata</div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                The Leader in Buyer Group Intelligence. Decode complex buyer dynamics in seconds, not months.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/platform" className="text-gray-300 hover:text-white hover:font-bold transition-all">Platform</Link></li>
                <li><Link href="/demo" className="text-gray-300 hover:text-white hover:font-bold transition-all">Demo</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white hover:font-bold transition-all">Pricing</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/company" className="text-gray-300 hover:text-white hover:font-bold transition-all">About</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white hover:font-bold transition-all">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white hover:font-bold transition-all">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/support" className="text-gray-300 hover:text-white hover:font-bold transition-all">Help Center</Link></li>
                <li><Link href="/documentation" className="text-gray-300 hover:text-white hover:font-bold transition-all">Documentation</Link></li>
                <li><Link href="/system-status" className="text-gray-300 hover:text-white hover:font-bold transition-all">System Status</Link></li>
                <li><Link href="/security" className="text-gray-300 hover:text-white hover:font-bold transition-all">Security</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted text-sm mb-4 md:mb-0">
              © 2025 Adrata. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-muted hover:text-white hover:font-bold transition-all">Privacy Policy</Link>
              <Link href="/terms" className="text-muted hover:text-white hover:font-bold transition-all">Terms of Service</Link>
              <Link href="/cookies" className="text-muted hover:text-white hover:font-bold transition-all">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
      <div suppressHydrationWarning>
      <CookieNotification />
      </div>

      {/* Command Palette Popup */}
      {showCommandPalette && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.4)'}}>
          <div className="bg-background rounded-lg shadow-xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowCommandPalette(false)}
              className="absolute top-4 right-4 text-muted hover:text-muted transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Adrata Platform Commands
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Since you found this Easter Egg, we know two things: you are great—and you'll likely really love this platform.
              </p>
              <div className="mb-6 flex justify-center">
                <img 
                  src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGdxdWlhM2kzOGFzZjdyNmR5czBqMHhqZm93OWltZGJyeGUyZmd1byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UO5elnTqo4vSg/giphy.gif" 
                  alt="Celebration" 
                  className="rounded-lg shadow-sm"
                  width="280" 
                  height="160"
                />
              </div>
              <div className="flex justify-center">
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 bg-button-background text-button-text px-12 py-3 rounded-lg font-medium hover:bg-button-hover transition-colors"
                >
                  <span>Get a demo</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
