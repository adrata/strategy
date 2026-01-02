'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/platform/ui/components/badge';
import { Card, CardContent } from '@/platform/ui/components/card';
import { ArrowRight, ChevronRight } from 'lucide-react';

// Gong-inspired design specs:
// - Font: 16-20pt for desktop (Mi Sans style)
// - Line spacing: 1.2-1.5x font size
// - Headlines: Under 70 chars
// - Ample white space
// - Less than 20% text coverage
// - Dimensions: 1200x628 (1.91:1) or 1:1 square

const miSansFont = '"Mi Sans", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

function AdVersionNav({ current }: { current: string }) {
  const versions = [
    { href: '/linkedin-ads', label: 'Base', id: 'original' },
    { href: '/linkedin-ads-memes', label: 'Memes', id: 'memes' },
    { href: '/linkedin-ads-photos', label: 'Photos', id: 'photos' },
  ];
  
  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-sm text-muted-foreground shrink-0">Style:</span>
          {versions.map((v) => (
            <Link key={v.href} href={v.href}>
              <Badge 
                variant={v.id === current ? 'default' : 'outline'} 
                className={`cursor-pointer transition-all px-4 py-1.5 ${
                  v.id === current 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {v.label}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LinkedInAdProps {
  headline: string;
  hook: string;
  cta: string;
  variant: 'killer' | 'product' | 'karen' | 'closing' | 'q4';
  adNumber: number;
  landingUrl: string;
}

function LinkedInAd({ headline, hook, cta, variant, adNumber, landingUrl }: LinkedInAdProps) {
  const variants = {
    killer: {
      bg: 'bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0a0a0a]',
      accent: 'from-[#e53935] to-[#c62828]',
      textSecondary: 'text-[#ef5350]',
      border: 'border-[#e53935]/20',
      glow: 'bg-[#e53935]',
    },
    product: {
      bg: 'bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0518]',
      accent: 'from-[#ab47bc] to-[#7b1fa2]',
      textSecondary: 'text-[#ce93d8]',
      border: 'border-[#ab47bc]/20',
      glow: 'bg-[#9c27b0]',
    },
    karen: {
      bg: 'bg-gradient-to-br from-[#1a1510] via-[#151210] to-[#0a0806]',
      accent: 'from-[#ff9800] to-[#f57c00]',
      textSecondary: 'text-[#ffb74d]',
      border: 'border-[#ff9800]/20',
      glow: 'bg-[#ff9800]',
    },
    closing: {
      bg: 'bg-gradient-to-br from-[#0a1628] via-[#0d1929] to-[#050d18]',
      accent: 'from-[#00bcd4] to-[#0097a7]',
      textSecondary: 'text-[#4dd0e1]',
      border: 'border-[#00bcd4]/20',
      glow: 'bg-[#00bcd4]',
    },
    q4: {
      bg: 'bg-gradient-to-br from-[#0a1f0a] via-[#0d1a0d] to-[#050f05]',
      accent: 'from-[#4caf50] to-[#388e3c]',
      textSecondary: 'text-[#81c784]',
      border: 'border-[#4caf50]/20',
      glow: 'bg-[#4caf50]',
    },
  };

  const style = variants[variant];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Ad {adNumber}
        </Badge>
        <span className="text-sm text-muted-foreground">1200 × 628px • 1.91:1</span>
      </div>
      
      {/* LinkedIn Ad Creative - Gong-inspired spacing - CLICKABLE */}
      <Link href={landingUrl}>
      <div 
        className={`relative overflow-hidden rounded-2xl ${style.bg} ${style.border} border shadow-2xl cursor-pointer hover:scale-[1.01] transition-transform`}
        style={{ aspectRatio: '1.91 / 1' }}
      >
        {/* Subtle glow effect */}
        <div className="absolute inset-0 opacity-[0.08]">
          <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[100%] ${style.glow} rounded-full blur-[100px]`} />
          <div className={`absolute bottom-[-30%] left-[-10%] w-[40%] h-[80%] ${style.glow} rounded-full blur-[80px]`} />
        </div>
        
        {/* Content with Gong-inspired generous spacing */}
        <div 
          className="relative z-10 h-full flex flex-col justify-between"
          style={{ padding: '7% 8%' }}
        >
          {/* Logo - Clean, minimal */}
          <div className="flex items-center">
            <span 
              className="text-white/80 text-xl tracking-wider"
              style={{ fontFamily: miSansFont, fontWeight: 500 }}
            >
              Adrata
            </span>
          </div>
          
          {/* Main content - generous vertical spacing */}
          <div className="flex-1 flex flex-col justify-center" style={{ marginTop: '4%', marginBottom: '4%' }}>
            {/* Headline - Gong style: bold, punchy, max 70 chars */}
            <h2 
              className="text-white leading-[1.15] tracking-tight"
              style={{ 
                fontFamily: miSansFont,
                fontWeight: 800,
                fontSize: 'clamp(1.75rem, 5.5vw, 4rem)',
                maxWidth: '90%',
                letterSpacing: '-0.02em'
              }}
            >
              {headline}
            </h2>
            
            {/* Subtext - breathing room */}
            <p 
              className={`${style.textSecondary} leading-relaxed`}
              style={{ 
                fontFamily: miSansFont,
                fontWeight: 500,
                fontSize: 'clamp(0.875rem, 2vw, 1.375rem)',
                marginTop: '5%',
                maxWidth: '75%',
                lineHeight: 1.5
              }}
            >
              {hook}
            </p>
          </div>
          
          {/* CTA - prominent, clear */}
          <div className="flex items-center">
            <div 
              className={`inline-flex items-center gap-3 bg-gradient-to-r ${style.accent} text-white rounded-full shadow-xl`}
              style={{ 
                fontFamily: miSansFont,
                fontWeight: 600,
                fontSize: 'clamp(0.875rem, 1.6vw, 1.125rem)',
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.25rem, 3vw, 2rem)',
              }}
            >
              {cta}
              <ArrowRight className="w-5 h-5" style={{ strokeWidth: 2.5 }} />
            </div>
          </div>
        </div>
      </div>
      </Link>
      
      {/* Post text preview */}
      <Card className="bg-muted/20 border-muted">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm text-muted-foreground mb-2 font-medium">
            Post Copy:
          </p>
          <p className="text-sm leading-relaxed text-foreground/80" style={{ fontFamily: miSansFont }}>
            {variant === 'killer' && "Your closers are stuck doing research. That's like hiring a surgeon to fill out paperwork."}
            {variant === 'product' && "They're winning deals you should be winning. Not because they're better—because they start in the right place."}
            {variant === 'karen' && "Someone at your target account is making a decision right now. They've never heard of you."}
            {variant === 'closing' && "Your team isn't struggling with objection handling. They're talking to the wrong people."}
            {variant === 'q4' && "Q4 fell apart because December was spent finding buyers that should've been mapped in October."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LinkedInAdsPage() {
  const ads = [
    {
      headline: "You Hired Killers and Made Them Play Researcher",
      hook: "There's a faster way to find who actually buys.",
      cta: "See How",
      variant: 'killer' as const,
      landingUrl: '/linkedin-ads-landing/killer',
    },
    {
      headline: "Their Product Is Worse. Their Win Rate Is Higher.",
      hook: "They're finding the buyer first. Here's the difference.",
      cta: "See the Method",
      variant: 'product' as const,
      landingUrl: '/linkedin-ads-landing/product',
    },
    {
      headline: "Karen in Procurement Doesn't Know You Exist. But She's in the Buying Committee.",
      hook: "Your competitors already know who she is.",
      cta: "Find Your Karen",
      variant: 'karen' as const,
      landingUrl: '/linkedin-ads-landing/karen',
    },
    {
      headline: "Your Reps Aren't Bad at Closing. They're Pitching to the Wrong People.",
      hook: "The problem isn't your pitch. It's your target.",
      cta: "See Who to Target",
      variant: 'closing' as const,
      landingUrl: '/linkedin-ads-landing/closing',
    },
    {
      headline: "Q4 Slipped Because December Was Finding Buyers You Needed in October.",
      hook: "Q1 doesn't have to repeat history.",
      cta: "Start Q1 Ready",
      variant: 'q4' as const,
      landingUrl: '/linkedin-ads-landing/q4',
    },
  ];

  return (
    <div className="bg-background pb-20" style={{ fontFamily: miSansFont }}>
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-5">
            <Badge className="bg-[#0077b5] hover:bg-[#0077b5] text-white">LinkedIn Ads</Badge>
            <Badge variant="outline">January 2026</Badge>
          </div>
          <h1 
            className="text-5xl font-extrabold tracking-tight mb-3"
            style={{ fontFamily: miSansFont, letterSpacing: '-0.03em' }}
          >
            Buyer Gap Campaign
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl" style={{ lineHeight: 1.6 }}>
            Hook → Curiosity → Click → Landing → Meeting
          </p>
        </div>
      </div>

      <AdVersionNav current="original" />

      {/* Quick specs */}
      <div className="border-b bg-muted/10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>1200×628</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Under 70 char headlines</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Gong-inspired spacing</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Link href="/linkedin-ads-landing" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                View Landing Page <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="container mx-auto px-6 py-16">
        <div className="space-y-20">
          {ads.map((ad, index) => (
            <LinkedInAd
              key={index}
              headline={ad.headline}
              hook={ad.hook}
              cta={ad.cta}
              variant={ad.variant}
              adNumber={index + 1}
              landingUrl={ad.landingUrl}
            />
          ))}
        </div>

        {/* Framework Section */}
        <div className="mt-24 pt-12 border-t">
          <h2 
            className="text-3xl font-bold mb-8"
            style={{ fontFamily: miSansFont, letterSpacing: '-0.02em' }}
          >
            PULL Framework Strategy
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { emoji: '🎣', title: 'Hook (Ad)', desc: 'Provocative headline stops scroll. Creates curiosity gap.' },
              { emoji: '📖', title: 'Story (Landing)', desc: 'Expand the problem. Build "this is exactly me" recognition.' },
              { emoji: '🎁', title: 'Offer (Value)', desc: 'Free buyer map, assessment, or demo. Low-friction value.' },
              { emoji: '📅', title: 'Meeting', desc: 'Calendly integration. Book directly. No friction.' },
            ].map((item, i) => (
              <Card key={i} className="bg-muted/20 border-muted hover:bg-muted/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">{item.emoji}</div>
                  <div className="font-semibold mb-2" style={{ fontFamily: miSansFont }}>{item.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
