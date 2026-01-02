'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/platform/ui/components/badge';
import { Card, CardContent } from '@/platform/ui/components/card';
import { ArrowRight, ChevronRight, Quote, Star } from 'lucide-react';

// Testimonial-style ads - social proof drives trust
// Quote + Attribution format

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

interface TestimonialAdProps {
  quote: string;
  author: string;
  role: string;
  result: string;
  cta: string;
  bgColor: string;
  accentColor: string;
  adNumber: number;
}

function TestimonialAd({ quote, author, role, result, cta, bgColor, accentColor, adNumber }: TestimonialAdProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Ad {adNumber}
        </Badge>
        <span className="text-sm text-muted-foreground">1200 × 628px • Testimonial</span>
      </div>
      
      {/* Testimonial Ad */}
      <div 
        className={`relative overflow-hidden rounded-2xl ${bgColor} border border-white/10 shadow-2xl`}
        style={{ aspectRatio: '1.91 / 1' }}
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex" style={{ padding: '6% 7%' }}>
          {/* Left side - Quote */}
          <div className="flex-[1.3] flex flex-col justify-between pr-8">
            {/* Logo */}
            <div className="flex items-center">
              <span 
                className="text-white/80 text-xl tracking-wider"
                style={{ fontFamily: miSansFont, fontWeight: 500 }}
              >
                Adrata
              </span>
            </div>
            
            {/* Quote */}
            <div className="flex-1 flex flex-col justify-center">
              <Quote className={`w-10 h-10 ${accentColor} opacity-60 mb-4`} />
              <blockquote 
                className="text-white leading-snug"
                style={{ 
                  fontFamily: miSansFont,
                  fontWeight: 600,
                  fontSize: 'clamp(1.125rem, 3vw, 2rem)',
                  letterSpacing: '-0.01em'
                }}
              >
                {quote}
              </blockquote>
            </div>
            
            {/* CTA */}
            <div className="flex items-center">
              <div 
                className="inline-flex items-center gap-3 bg-white text-black rounded-full shadow-xl"
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
          
          {/* Right side - Author + Result */}
          <div className="flex-[0.7] flex flex-col justify-center items-end text-right border-l border-white/10 pl-8">
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${accentColor} fill-current`} />
              ))}
            </div>
            
            {/* Result stat */}
            <div 
              className={`${accentColor} leading-none mb-2`}
              style={{ 
                fontFamily: miSansFont,
                fontWeight: 800,
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                letterSpacing: '-0.03em'
              }}
            >
              {result}
            </div>
            
            {/* Author */}
            <div className="mt-4">
              <div 
                className="text-white font-semibold"
                style={{ fontFamily: miSansFont, fontSize: 'clamp(0.875rem, 1.5vw, 1.125rem)' }}
              >
                {author}
              </div>
              <div 
                className="text-white/60"
                style={{ fontFamily: miSansFont, fontSize: 'clamp(0.75rem, 1.2vw, 1rem)' }}
              >
                {role}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Context */}
      <Card className="bg-muted/20 border-muted">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm text-muted-foreground mb-2 font-medium">
            Why testimonials convert:
          </p>
          <p className="text-sm leading-relaxed text-foreground/80" style={{ fontFamily: miSansFont }}>
            Social proof reduces perceived risk. A specific result from someone in their industry 
            makes the outcome feel achievable and the decision feel safe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LinkedInAdsTestimonials() {
  const testimonials = [
    {
      quote: "We stopped hiring researchers. Now our killers close.",
      author: "VP of Sales",
      role: "Enterprise SaaS",
      result: "+47%",
      cta: "See How",
      bgColor: "bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]",
      accentColor: "text-[#4ade80]",
    },
    {
      quote: "Their product was worse. We kept losing. Not anymore.",
      author: "CRO",
      role: "Series C Startup",
      result: "2.3x",
      cta: "See the Method",
      bgColor: "bg-gradient-to-br from-[#1a0a2e] to-[#0d0518]",
      accentColor: "text-[#c084fc]",
    },
    {
      quote: "Found Karen before Thursday. Closed by Friday.",
      author: "Account Executive",
      role: "B2B Tech",
      result: "4 days",
      cta: "Find Your Karen",
      bgColor: "bg-gradient-to-br from-[#2e1a0a] to-[#180d05]",
      accentColor: "text-[#fb923c]",
    },
    {
      quote: "Same pitch. Right people. Everything changed.",
      author: "Sales Director",
      role: "Mid-Market",
      result: "+68%",
      cta: "Find Right People",
      bgColor: "bg-gradient-to-br from-[#0a1a2e] to-[#050d18]",
      accentColor: "text-[#38bdf8]",
    },
    {
      quote: "Q1 started with a full pipeline. First time ever.",
      author: "Head of Revenue",
      role: "Growth Stage",
      result: "Q1 Ready",
      cta: "Start Ready",
      bgColor: "bg-gradient-to-br from-[#0a2e1a] to-[#05180d]",
      accentColor: "text-[#34d399]",
    },
  ];

  return (
    <div className="bg-background pb-20" style={{ fontFamily: miSansFont }}>
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-5">
            <Badge className="bg-[#0077b5] hover:bg-[#0077b5] text-white">LinkedIn Ads</Badge>
            <Badge variant="outline">Testimonial Style</Badge>
          </div>
          <h1 
            className="text-5xl font-extrabold tracking-tight mb-3"
            style={{ fontFamily: miSansFont, letterSpacing: '-0.03em' }}
          >
            Social Proof
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl" style={{ lineHeight: 1.6 }}>
            Real results from real people — trust through specificity
          </p>
        </div>
      </div>

      <AdVersionNav current="photos" />

      {/* Quick specs */}
      <div className="border-b bg-muted/10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Quote + Result</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Specific attribution</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Trust signals</span>
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
          {testimonials.map((testimonial, index) => (
            <TestimonialAd
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              result={testimonial.result}
              cta={testimonial.cta}
              bgColor={testimonial.bgColor}
              accentColor={testimonial.accentColor}
              adNumber={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
