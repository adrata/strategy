"use client";

import React from "react";
import Link from "next/link";

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-gray-900">
                Adrata
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Buyer Gap
                </Link>
                <Link href="/platform" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Platform
                </Link>
                <Link href="/pricing" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/company" className="text-sm text-gray-900 font-semibold">
                  Company
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link
                href="/demo"
                className="bg-black text-white px-5 py-1.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                See a demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 bg-white">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6">
              Pursuing the Unified Revenue Formula
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              How a quest to mathematically predict revenue led to the discovery of the biggest problem in enterprise sales
            </p>
          </div>
        </div>
      </section>

      {/* Founder's Story */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">The Discovery</h2>
              <p className="text-lg text-gray-600">A founder's journey through the mathematics of sales</p>
            </div>

            <div className="prose prose-lg max-w-4xl mx-auto text-gray-700 leading-relaxed">
              <p className="mb-6">
                It started with a simple question: <em>What if revenue could be expressed as a mathematical formula?</em>
              </p>

              <p className="mb-6">
                As a founder building enterprise software companies, I became obsessed with understanding why some deals closed and others didn't. Traditional sales metrics felt incomplete—they told us what happened, but not why. I believed there had to be a deeper mathematical relationship governing enterprise revenue.
              </p>

              <p className="mb-6">
                I spent months analyzing sales data, building models, and testing hypotheses. The initial formula seemed straightforward: if we could express revenue as a function of pipeline velocity, deal complexity, and stakeholder consensus, we could optimize each component for maximum impact.
              </p>

              <p className="mb-6">
                But something was still wrong. Enterprise deals weren't just unpredictable—they were taking forever to close. The same opportunities would drag on for months, with sales teams stuck in endless cycles of meetings, proposals, and "let me run this by the team."
              </p>

              <p className="mb-6">
                I dove deeper into the data, building increasingly complex models. I analyzed win rates, deal sizes, sales cycle lengths, and hundreds of other variables. The patterns were there, but they were fragmentary. Traditional CRM data captured activities but missed the underlying dynamics. We could see the meetings, calls, and emails, but not the relationships, power structures, and decision-making processes that actually drove outcomes.
              </p>

              <p className="mb-6">
                The breakthrough came during a particularly frustrating quarter. We had three major enterprise deals that should have closed, but all three were stuck in what our sales team called "buyer group purgatory." The prospects were engaged, the technical fit was perfect, the pricing was approved, yet somehow the deals wouldn't move forward.
              </p>

              <p className="mb-6">
                I started interviewing our sales team about these stalled deals. The pattern became clear: they were spending most of their time trying to figure out who was actually involved in the buying decision. Who had influence? Who had budget authority? Who could actually sign the contract? This identification phase was consuming more time than the entire sales process should take.
              </p>

              <p className="mb-6">
                Then came the breakthrough. While analyzing our longest-running deals, I discovered the hidden bottleneck that was crushing enterprise revenue: <strong>buyer group identification time</strong>.
              </p>

              <p className="mb-6">
                Sales teams were spending 3-6 months per deal just figuring out who was involved in the buying decision. They would meet with one person, who would introduce them to another, who would mention a third person who "should probably be involved." It was like playing telephone across entire organizations, except the stakes were million-dollar deals.
              </p>

              <p className="mb-6">
                The more I studied this problem, the more I realized it wasn't just about sales efficiency—it was about fundamental information asymmetry. While sales teams were fumbling around in the dark, their prospects had complete visibility into their own decision-making processes. They knew exactly who would evaluate the solution, who would approve the budget, and who would ultimately sign the contract.
              </p>

              <p className="mb-6">
                This asymmetry created a massive time tax on every enterprise deal. Sales teams would spend months building relationships with the wrong people, crafting presentations for stakeholders who had no actual influence, and optimizing for objections that didn't matter to the real decision-makers.
              </p>

              <p className="mb-6">
                The key insight wasn't just about optimizing the sales process—it was about <strong>time compression</strong>. If we could compress buyer group identification from months to seconds, we could transform the entire sales process and unlock unprecedented revenue velocity.
              </p>

              <p className="mb-6">
                The math was clear: reducing buyer group identification time from 90 days to 1 day would increase revenue velocity by 90x. But the technology to do this didn't exist. Sales teams were stuck with manual research, cold outreach, and guesswork.
              </p>

              <p className="mb-6">
                I became convinced that this was the missing piece of the revenue formula. Pipeline velocity wasn't just about how fast deals moved through stages—it was about how quickly sales teams could identify and engage with the right stakeholders. Deal complexity wasn't just about technical requirements—it was about the complexity of the buying organization. Stakeholder consensus wasn't just about agreement—it was about identifying who needed to agree in the first place.
              </p>

              <p className="mb-6">
                The traditional approach to solving this problem was to hire more salespeople, invest in better CRM systems, or provide more training. But these solutions addressed the symptoms, not the root cause. The real problem was that sales teams were operating with incomplete information about their prospects' organizational structures.
              </p>

              <p className="mb-6">
                That realization led to years of research into organizational network analysis, AI-powered stakeholder mapping, and real-time buyer group intelligence. We needed to build technology that could instantly identify decision-makers, influencers, and power structures within any enterprise.
              </p>

              <p className="mb-6">
                The technical challenges were immense. We had to develop algorithms that could analyze public information, social signals, and organizational data to reconstruct buying committees. We needed to understand reporting structures, influence networks, and decision-making processes across thousands of different companies and industries.
              </p>

              <p className="mb-6">
                We built machine learning models that could predict who would be involved in specific types of purchases based on company size, industry, and technical requirements. We developed real-time data pipelines that could track organizational changes and update buyer group compositions instantly.
              </p>

              <p className="mb-6">
                The first prototype was crude but promising. We could identify basic stakeholders like CTOs, CFOs, and department heads. But enterprise buying decisions are more nuanced than org charts suggest. The real influencers are often hidden deep within organizations, and the formal decision-makers aren't always the ones who actually drive outcomes.
              </p>

              <p className="mb-6">
                We refined our approach, incorporating behavioral signals, communication patterns, and historical buying data. We learned to identify not just who was involved, but what role they played, what motivated them, and how they influenced the final decision.
              </p>

              <p className="mb-6">
                Today, Adrata is that technology. We've built the world's first buyer group intelligence platform that compresses identification time from months to seconds, finally unlocking the revenue velocity that enterprise sales teams have been searching for.
              </p>

              <p className="mb-6">
                The mathematical formula for revenue isn't just theory anymore—it's measurable, predictable, and optimizable. And it all started with one simple question and the determination to solve the time problem that was strangling enterprise sales.
              </p>

              <p className="mb-6">
                The impact has been transformative. Sales teams that once spent months mapping buyer groups now have complete visibility in minutes. They can focus their energy on building relationships with the right people, crafting messages that resonate with actual decision-makers, and optimizing their approach based on real organizational dynamics.
              </p>

              <p className="mb-6">
                But perhaps most importantly, we've proven that revenue velocity is not just about working harder or hiring more people. It's about working with better information. When sales teams have complete visibility into their prospects' buyer groups, they can optimize their entire approach and achieve results that seemed impossible before.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 border border-gray-300 rounded-full mb-8">
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
              <span className="text-gray-600 text-sm font-medium">
                From Mathematical Theory to Market Reality
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
              Experience the Breakthrough
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              See how the mathematical pursuit of revenue optimization led to the world's first buyer group intelligence platform—and discover your own buyer groups in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/find-your-buyer-group"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200"
              >
                Find Your Buyer Group
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-gray-700 border border-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200"
              >
                See Live Demo
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            </div>
            

            
            <div className="mt-12 pt-8 border-t border-gray-300">
              <p className="text-gray-500 text-sm">
                The mathematical formula for revenue isn't just theory anymore—it's measurable, predictable, and optimizable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="text-2xl font-bold mb-4">Adrata</div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                The Leader in buyer group intelligence. Decode complex buyer dynamics in seconds, not months.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/platform" className="text-gray-300 hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="/demo" className="text-gray-300 hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/company" className="text-gray-300 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/support" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/documentation" className="text-gray-300 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/system-status" className="text-gray-300 hover:text-white transition-colors">System Status</Link></li>
                <li><Link href="/security" className="text-gray-300 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          {/* Security & Compliance */}
          <div className="border-t border-gray-700 pt-8 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm">Enterprise Grade</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">99.9% Uptime SLA</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Adrata. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 