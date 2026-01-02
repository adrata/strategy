'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/platform/ui/components/badge';
import { Card, CardContent } from '@/platform/ui/components/card';
import { Button } from '@/platform/ui/components/button';
import { 
  ArrowRight, 
  Target, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Calendar,
  Zap,
  ChevronDown
} from 'lucide-react';

// PULL Framework Landing Page
// Hook → Story → Offer → Calendly

const miSansFont = '"Mi Sans", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export default function LinkedInAdsLandingPage() {
  const [showCalendly, setShowCalendly] = useState(false);

  return (
    <div className="bg-black text-white" style={{ fontFamily: miSansFont }}>
      {/* Hero Section - The HOOK continuation */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-600 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-purple-600 rounded-full blur-[120px]" />
        </div>
        
        {/* Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-12">
            <span className="text-white/90 font-medium text-2xl tracking-wide">Adrata</span>
          </div>
          
          {/* HOOK - Headline */}
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight max-w-5xl mx-auto mb-8"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}
          >
            Your Competitors Find the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Economic Buyer
            </span>{' '}
            in 48 Hours.
            <br />
            <span className="text-white/60">Your Team Takes 3 Weeks.</span>
          </h1>
          
          {/* Sub-hook */}
          <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            The difference isn&apos;t talent. It&apos;s knowing exactly who to talk to before you pick up the phone.
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button 
              size="lg"
              onClick={() => setShowCalendly(true)}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-red-500/25"
            >
              See Your Buyer Map
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <span className="text-white/40 text-sm">Free • 15 min • No commitment</span>
          </div>
          
          {/* Scroll indicator */}
          <div className="animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/30 mx-auto" />
          </div>
        </div>
      </section>

      {/* STORY Section - The Problem */}
      <section className="py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-6">
              The Problem
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
              Your best closers are spending 60% of their time on research.
              <span className="text-white/50"> That&apos;s not a strategy—that&apos;s a waste of talent.</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">3+ Weeks to Find Buyers</h3>
                      <p className="text-white/60 text-sm">
                        By the time you map the buying committee, the decision is already made.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">90% Wrong Audience</h3>
                      <p className="text-white/60 text-sm">
                        Most outreach goes to people who can&apos;t sign the check. Perfect pitch, wrong person.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">Invisible Buyer Gap</h3>
                      <p className="text-white/60 text-sm">
                        You&apos;re losing deals you never knew you lost. The buyer didn&apos;t know you existed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">Competitors Win First</h3>
                      <p className="text-white/60 text-sm">
                        Their product is worse. Their win rate is higher. They just get there first.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* STORY Section - The Solution */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-6">
              The Solution
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Find your buyer group in 48 hours, not 3 weeks.
            </h2>
            
            <p className="text-xl text-white/60 mb-16 max-w-2xl mx-auto">
              We map the entire buying committee—economic buyer, champions, blockers—before you make the first call.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-xl mb-2">48-Hour Mapping</h3>
                <p className="text-white/50 text-sm">
                  Complete buyer group identified in 2 days, not 3 weeks
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-xl mb-2">Right People First</h3>
                <p className="text-white/50 text-sm">
                  Talk to decision makers, not gatekeepers
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-xl mb-2">Higher Win Rate</h3>
                <p className="text-white/50 text-sm">
                  Close more deals by starting in the right place
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-zinc-950 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>500+ Companies</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>48-Hour Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>2x Win Rate Increase</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>SOC 2 Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* OFFER Section - Calendly */}
      <section className="py-24 bg-black" id="book">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-6">
              The Offer
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              See your buyer map. Free.
            </h2>
            
            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
              In 15 minutes, we&apos;ll show you exactly who your buyer group is for one target account. No pitch, no pressure—just value.
            </p>
            
            {/* Calendly Placeholder */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-xl mx-auto">
              {showCalendly ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <Calendar className="w-8 h-8 text-blue-400" />
                    <span className="text-xl font-semibold">Book Your Buyer Map Session</span>
                  </div>
                  
                  {/* Calendly Embed Placeholder */}
                  <div className="bg-white rounded-xl p-6 text-black">
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">Calendly widget loads here</p>
                      <div className="space-y-3">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Monday, Jan 6 • 10:00 AM
                        </Button>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Monday, Jan 6 • 2:00 PM
                        </Button>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Tuesday, Jan 7 • 11:00 AM
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-4">
                        Replace with: &lt;div class=&quot;calendly-inline-widget&quot; data-url=&quot;YOUR_CALENDLY_URL&quot;&gt;&lt;/div&gt;
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-white/40 text-sm">
                    15 minutes • Video call • No commitment required
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold">What You&apos;ll Get</h3>
                  
                  <ul className="text-left space-y-3 max-w-sm mx-auto">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-white/70">Complete buyer map for 1 target account</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-white/70">Economic buyer + champions identified</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-white/70">Contact details + org chart</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-white/70">Entry strategy recommendations</span>
                    </li>
                  </ul>
                  
                  <Button 
                    size="lg"
                    onClick={() => setShowCalendly(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-6 text-lg rounded-xl"
                  >
                    Book Free Session
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <p className="text-white/40 text-sm">
                    No credit card • No commitment • Just value
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zinc-950 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <span className="text-white/90 font-medium text-xl tracking-wide">Adrata</span>
            </div>
            
            <div className="flex items-center gap-6 text-white/40 text-sm">
              <Link href="/linkedin-ads" className="hover:text-white transition-colors">
                ← Back to Ads
              </Link>
              <span>•</span>
              <span>January 2026 Campaign</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
