'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/platform/ui/components/badge';
import { Card, CardContent } from '@/platform/ui/components/card';
import { ArrowRight, ChevronRight } from 'lucide-react';

// Meme-style ads - relatable humor drives engagement
// Format: Setup → Punchline visual

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

interface MemeAdProps {
  topText: string;
  bottomText: string;
  memeType: string;
  cta: string;
  bgColor: string;
  adNumber: number;
}

function MemeAd({ topText, bottomText, memeType, cta, bgColor, adNumber }: MemeAdProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Ad {adNumber}
        </Badge>
        <span className="text-sm text-muted-foreground">1:1 Square • Meme Format</span>
      </div>
      
      {/* Meme-style Ad - Square format for better engagement */}
      <div 
        className={`relative overflow-hidden rounded-2xl ${bgColor} border border-white/10 shadow-2xl`}
        style={{ aspectRatio: '1 / 1', maxWidth: '600px' }}
      >
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col" style={{ padding: '8%' }}>
          {/* Logo */}
          <div className="flex items-center justify-between mb-4">
            <span 
              className="text-white/80 text-lg tracking-wider"
              style={{ fontFamily: miSansFont, fontWeight: 500 }}
            >
              Adrata
            </span>
            <span className="text-white/40 text-xs">{memeType}</span>
          </div>
          
          {/* Top text - Setup */}
          <div className="flex-1 flex flex-col justify-center">
            <div 
              className="text-white text-center leading-tight mb-8"
              style={{ 
                fontFamily: miSansFont,
                fontWeight: 800,
                fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
            >
              {topText}
            </div>
            
            {/* Visual divider */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-1 bg-white/20 rounded-full" />
            </div>
            
            {/* Bottom text - Punchline */}
            <div 
              className="text-white text-center leading-tight"
              style={{ 
                fontFamily: miSansFont,
                fontWeight: 800,
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
            >
              {bottomText}
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex justify-center mt-6">
            <div 
              className="inline-flex items-center gap-3 bg-white text-black rounded-full shadow-xl"
              style={{ 
                fontFamily: miSansFont,
                fontWeight: 600,
                fontSize: 'clamp(0.875rem, 1.6vw, 1rem)',
                padding: '0.875rem 1.75rem',
              }}
            >
              {cta}
              <ArrowRight className="w-4 h-4" style={{ strokeWidth: 2.5 }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Context */}
      <Card className="bg-muted/20 border-muted" style={{ maxWidth: '600px' }}>
        <CardContent className="pt-5 pb-5">
          <p className="text-sm text-muted-foreground mb-2 font-medium">
            Why memes work:
          </p>
          <p className="text-sm leading-relaxed text-foreground/80" style={{ fontFamily: miSansFont }}>
            Relatable humor creates emotional connection. The setup/punchline format mirrors how 
            your audience already thinks about their problem, making them feel understood.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LinkedInAdsMemes() {
  const memes = [
    {
      topText: "When you hire killers",
      bottomText: "And make them play researcher",
      memeType: "Reality Check",
      cta: "Stop the Madness",
      bgColor: "bg-gradient-to-br from-[#2d1f3d] via-[#1a1625] to-[#0d0a12]",
    },
    {
      topText: "Their product is worse",
      bottomText: "Their win rate is higher",
      memeType: "Hard Truth",
      cta: "See What They Know",
      bgColor: "bg-gradient-to-br from-[#1f2d3d] via-[#151d28] to-[#0a0f15]",
    },
    {
      topText: "Karen in procurement",
      bottomText: "Doesn't know you exist. She's in the buying committee.",
      memeType: "Wake Up Call",
      cta: "Find Your Karen",
      bgColor: "bg-gradient-to-br from-[#3d2d1f] via-[#28201a] to-[#15100a]",
    },
    {
      topText: "Your reps aren't bad at closing",
      bottomText: "They're great at pitching wrong people",
      memeType: "Plot Twist",
      cta: "Find Right People",
      bgColor: "bg-gradient-to-br from-[#1f3d2d] via-[#15281d] to-[#0a150f]",
    },
    {
      topText: "December: Finding buyers",
      bottomText: "Should've been October.",
      memeType: "Hindsight",
      cta: "Never Again",
      bgColor: "bg-gradient-to-br from-[#3d1f2d] via-[#281520] to-[#150a0f]",
    },
  ];

  return (
    <div className="bg-background pb-20" style={{ fontFamily: miSansFont }}>
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-5">
            <Badge className="bg-[#0077b5] hover:bg-[#0077b5] text-white">LinkedIn Ads</Badge>
            <Badge variant="outline">Meme Style</Badge>
          </div>
          <h1 
            className="text-5xl font-extrabold tracking-tight mb-3"
            style={{ fontFamily: miSansFont, letterSpacing: '-0.03em' }}
          >
            Relatable Humor
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl" style={{ lineHeight: 1.6 }}>
            Memes that make them feel seen — and click
          </p>
        </div>
      </div>

      <AdVersionNav current="memes" />

      {/* Quick specs */}
      <div className="border-b bg-muted/10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>1:1 Square format</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Setup → Punchline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Higher engagement</span>
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
          {memes.map((meme, index) => (
            <MemeAd
              key={index}
              topText={meme.topText}
              bottomText={meme.bottomText}
              memeType={meme.memeType}
              cta={meme.cta}
              bgColor={meme.bgColor}
              adNumber={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
