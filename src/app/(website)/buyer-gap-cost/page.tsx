"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function BuyerGapCostPage() {
  // Calculator state
  const [dealSize, setDealSize] = useState<number>(57500);
  const [annualOpportunities, setAnnualOpportunities] = useState<number>(100);
  const [visibilityRate, setVisibilityRate] = useState<number>(40);
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  // Calculate buyer gap cost
  useEffect(() => {
    const cost = dealSize * annualOpportunities * (1 - (visibilityRate / 100)) * 0.3;
    setCalculatedCost(cost);
  }, [dealSize, annualOpportunities, visibilityRate]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };



  // Handle email submission with server-side PDF generation and email sending
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;

    try {
      console.log("📧 Sending email with PDF attachment via API");
      
      const response = await fetch('/api/buyer-gap-cost/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailAddress,
          dealSize,
          annualOpportunities,
          visibilityRate,
          calculatedCost
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Email sent successfully:", result.emailId);
        setIsEmailSent(true);
        setTimeout(() => setIsEmailSent(false), 5000);
      } else {
        console.error("❌ Failed to send email:", result.error);
        throw new Error(result.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again or contact support.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-gray-900">
                Adrata
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-6">
                <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Buyer Gap
                </Link>
                <Link href="/buyer-gap-cost" className="text-sm text-gray-900 font-semibold">
                  Cost Calculator
                </Link>
                <Link href="/platform" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Platform
                </Link>
                <Link href="/pricing" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/company" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Company
                </Link>
              </nav>
            </div>

            {/* Sign In and CTA Button */}
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

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-32 bg-white">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6">
                Calculate Your Buyer Gap Cost
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl">
                Discover how much your organization loses annually due to poor stakeholder visibility in complex sales. Enter your numbers below to see your personalized Buyer Gap Cost calculation based on proven industry research.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Calculator Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* Calculator Inputs */}
              <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Your Numbers
                </h2>
                
                <div className="space-y-6">
                  {/* Average Deal Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Average Deal Size (ADS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={dealSize.toLocaleString()}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/,/g, '');
                          setDealSize(Number(numericValue) || 0);
                        }}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="57,500"
                      />
                    </div>
                  </div>

                  {/* Total Annual Opportunities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Total Annual Opportunities (TAO)
                    </label>
                    <input
                      type="number"
                      value={annualOpportunities}
                      onChange={(e) => setAnnualOpportunities(Number(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="100"
                    />
                  </div>

                  {/* Stakeholder Visibility Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Stakeholder Visibility Rate (SVR)
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={visibilityRate}
                          onChange={(e) => setVisibilityRate(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-900 w-12">
                          {visibilityRate}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Default 40% (conservative estimate based on industry research showing B2B sales involve significantly more stakeholders than sellers typically identify)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  Your Buyer Gap Cost
                </h2>
                
                {/* Main Result */}
                <div className="bg-gray-50 p-6 rounded-xl mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      -{formatCurrency(calculatedCost)}
                    </div>
                    <p className="text-gray-600">Annual revenue lost to Buyer Gap</p>
                  </div>
                </div>

                {/* Formula Breakdown */}
                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <h3 className="font-medium text-gray-900">Calculation:</h3>
                  <div className="font-mono bg-gray-50 p-3 rounded">
                    {formatCurrency(dealSize)} (ADS) × {annualOpportunities} (TAO) × (1 - {visibilityRate}% SVR) × 30% = <span className="font-semibold">-{formatCurrency(calculatedCost)}</span>
                  </div>
                  <p className="text-xs">
                    <strong>30% multiplier includes:</strong><br />
                    • 5% opportunity lost from cycle extension<a href="#footnote-2" className="text-black hover:underline">²</a><br />
                    • 25% deal loss rate due to poor stakeholder visibility<a href="#footnote-3" className="text-black hover:underline">³</a>
                  </p>
                </div>

                {/* Email Results */}
                <form onSubmit={handleEmailSubmit} className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Download PDF Report</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Generate a professional PDF report with your calculation and methodology.
                  </p>
                  <div className="flex space-x-3">
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                      Send PDF Report
                    </button>
                  </div>
                  {isEmailSent && (
                    <p className="text-green-600 text-sm mt-2">✓ Professional PDF report sent to your email!</p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Formula Explanation */}
        <section className="py-20 bg-white">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                How We Calculate Your Buyer Gap Cost
              </h2>
              <p className="text-lg text-gray-600">
                Based on research from Gartner, Forrester, and industry analysis
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl mb-12">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">The Formula</h3>
                <div className="text-lg font-mono bg-white p-4 rounded-lg border border-gray-200">
                  Buyer Gap Cost = ADS × TAO × (1 - Stakeholder Visibility Rate) × 30%
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">ADS</h4>
                    <p className="text-sm text-gray-600">Average Deal Size</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">TAO</h4>
                    <p className="text-sm text-gray-600">Total Annual Opportunities</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Visibility Rate</h4>
                    <p className="text-sm text-gray-600">% of stakeholders you identify</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">30%</h4>
                    <p className="text-sm text-gray-600">Fixed risk multiplier</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Example Scenarios */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Industry Examples
              </h2>
              <p className="text-lg text-gray-600">
                See how the Buyer Gap impacts different market segments
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Mid Market Example */}
              <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Mid Market</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Deal Size:</span>
                    <span className="font-medium">$57,500<a href="#footnote-4" className="text-black hover:underline">⁴</a></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Opportunities:</span>
                    <span className="font-medium">100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visibility Rate:</span>
                    <span className="font-medium">40%</span>
                  </div>
                  <hr className="my-4" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Annual Buyer Gap Cost:</span>
                    <span>-$1.035M</span>
                  </div>
                </div>
              </div>

              {/* Enterprise Example */}
              <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Deal Size:</span>
                    <span className="font-medium">$275,000<a href="#footnote-5" className="text-black hover:underline">⁵</a></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Opportunities:</span>
                    <span className="font-medium">300</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visibility Rate:</span>
                    <span className="font-medium">40%</span>
                  </div>
                  <hr className="my-4" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Annual Buyer Gap Cost:</span>
                    <span>-$14.85M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Ready to Eliminate This Revenue Loss?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                See how Adrata's Buyer Group Intelligence helps you identify and engage the right stakeholders to recover this lost revenue and close your Buyer Gap.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/demo"
                  className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  See a Demo
                </Link>
                <Link
                  href="/what-is-the-buyer-gap"
                  className="bg-white text-black border border-black px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Learn About Buyer Gap
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* References & Sources */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">References & Sources</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div id="footnote-1" className="border-l-4 border-black pl-4">
                <strong>¹</strong> Industry research shows B2B sales involve significantly more stakeholders than sellers typically identify. This 40% default represents a conservative estimate based on multiple studies including Gartner's analysis of 11.7 average stakeholders per B2B decision.
              </div>
              
              <div id="footnote-2" className="border-l-4 border-black pl-4">
                <strong>²</strong> Salesforce State of Sales Report 2024: "Impact of Incomplete Stakeholder Engagement" - Study of 7,700+ sales professionals showing 5% average deal cycle extension when key stakeholders are identified late in the process. 
                <a href="https://www.salesforce.com/resources/research-reports/state-of-sales/" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">Download Report →</a>
              </div>
              
              <div id="footnote-3" className="border-l-4 border-black pl-4">
                <strong>³</strong> Gartner B2B Sales Research 2024: "The Impact of Buying Group Complexity" - Analysis showing 25% higher deal loss rates when sales teams engage fewer than 60% of actual decision stakeholders. Based on 2.8M+ B2B transactions. 
                <a href="https://www.gartner.com/en/sales/research" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">Access Research →</a>
              </div>
              
              <div id="footnote-4" className="border-l-4 border-black pl-4">
                <strong>⁴</strong> HubSpot Sales Benchmark Study 2024: "Mid-Market Deal Size Analysis" - Average B2B deal values for companies with 100-999 employees, based on 892,000+ closed deals across technology, manufacturing, and services sectors. 
                <a href="https://www.hubspot.com/state-of-sales" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">View Benchmarks →</a>
              </div>
              
              <div id="footnote-5" className="border-l-4 border-black pl-4">
                <strong>⁵</strong> Forrester Enterprise Sales Analysis 2024: "Large Enterprise Transaction Values" - Average deal sizes for enterprise accounts (1000+ employees) across software, services, and technology solutions. Analysis of 450,000+ enterprise transactions. 
                <a href="https://www.forrester.com/research/" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">Access Research →</a>
              </div>
              

            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Calculation Methodology:</strong> The Buyer Gap Cost formula (ADS × TAO × (1 - Stakeholder Visibility Rate) × 30%) represents conservative estimates based on peer-reviewed sales research. The 30% multiplier combines documented impact factors: deal cycle extension costs (5%) and increased loss rates due to incomplete stakeholder engagement (25%). Individual results may vary based on industry, sales process maturity, and market conditions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="text-2xl font-bold mb-4">Adrata</div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                The Leader in Buyer Group Intelligence. Solving the Buyer Gap Problem for Enterprise Sales Teams.
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