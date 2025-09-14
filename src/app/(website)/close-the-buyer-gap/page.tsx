"use client";

import React, { useState } from "react";
import Link from "next/link";
import CalendlyWidget from "@/platform/shared/components/integrations/CalendlyWidget";

export default function CloseTheBuyerGapPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    targetCompany: "",
    industry: "",
    dealSize: "",
    timeframe: "",
    currentChallenge: "",
    name: "",
    email: "",
    company: ""
  });

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "close-buyer-gap",
          name: formData.name,
          email: formData.email,
          company: formData.company,
          targetCompany: formData.targetCompany,
          industry: formData.industry,
          dealSize: formData.dealSize,
          timeframe: formData.timeframe,
          currentChallenge: formData.currentChallenge,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setStep(3);
      } else {
        throw new Error(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting your request. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Step 1: Opportunity Information
  if (step === 1) {
    return (
      <div className="fixed inset-0 flex">
        {/* Left Side - Black with Content */}
        <div className="w-1/2 bg-black flex items-center justify-center p-8">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Close The Buyer Gap
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Stop guessing who matters. We'll show you exactly who controls your deal and how to reach them.
            </p>
            
            <div className="bg-black rounded-lg p-4 mb-8">
              <div className="text-2xl font-bold text-white mb-2">85%</div>
              <p className="text-gray-300 text-sm">
                of top performers include Economic Buyers in their sales process vs 8% of low performers<a href="#footnote-1" className="text-gray-400 hover:text-white ml-1 text-xs">¹</a>
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Identify Decision Makers</h3>
                  <p className="text-gray-400">
                    Find who actually controls the budget and timeline.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Map Hidden Influencers</h3>
                  <p className="text-gray-400">
                    Discover stakeholders you never knew existed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Close Faster</h3>
                  <p className="text-gray-400">
                    Engage the right people from day one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Opportunity Form */}
        <div className="w-1/2 bg-white flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Tell Us About Your Deal</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Company *
                </label>
                <input
                  type="text"
                  name="targetCompany"
                  value={formData.targetCompany}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Which company are you selling to?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="financial">Financial Services</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Size
                </label>
                <select
                  name="dealSize"
                  value={formData.dealSize}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">Select deal size</option>
                  <option value="<50k">Under $50K</option>
                  <option value="50k-250k">$50K - $250K</option>
                  <option value="250k-1m">$250K - $1M</option>
                  <option value="1m+">$1M+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How soon do you need to close?
                </label>
                <select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">Select timeframe</option>
                  <option value="immediate">This month</option>
                  <option value="quarter">This quarter</option>
                  <option value="6months">Within 6 months</option>
                  <option value="12months">Within 12 months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your biggest challenge?
                </label>
                <textarea
                  name="currentChallenge"
                  value={formData.currentChallenge}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Can't reach decision makers? Deal stalled? Working wrong people?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Show Me Who Matters →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Contact Information
  if (step === 2) {
    return (
      <div className="fixed inset-0 flex">
        {/* Left Side - Black with Content */}
        <div className="w-1/2 bg-black flex items-center justify-center p-8">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Almost There
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Just need your details so we can prepare your buyer gap analysis.
            </p>
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Your Deal:</h4>
                <p className="text-gray-300 text-sm">
                  <strong>Target:</strong> {formData.targetCompany}<br/>
                  <strong>Industry:</strong> {formData.industry}<br/>
                  <strong>Size:</strong> {formData.dealSize || 'Not specified'}
                </p>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Custom Analysis</h3>
                  <p className="text-gray-400">
                    We'll map your specific buyer group.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Gap Identification</h3>
                  <p className="text-gray-400">
                    See exactly who you're missing.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Action Plan</h3>
                  <p className="text-gray-400">
                    Specific steps to close your gap.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Deal Details
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="w-1/2 bg-white flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Company *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Your company name"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Get My Buyer Gap Analysis →
              </button>

              <p className="text-xs text-gray-500 text-center">
                We'll analyze your buyer gap and prepare specific recommendations.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Scheduling
  return (
    <div className="fixed inset-0 flex">
      {/* Left Side - Black with Content */}
      <div className="w-1/2 bg-black flex items-center justify-center p-8">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Schedule Your Review
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Perfect! Let's schedule your buyer gap analysis review.
          </p>
          
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Your Deal:</h4>
              <p className="text-gray-300 text-sm">
                <strong>Contact:</strong> {formData.name}<br/>
                <strong>Company:</strong> {formData.company}<br/>
                <strong>Target:</strong> {formData.targetCompany}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">30-Minute Session</h3>
                <p className="text-gray-400">
                  Review your buyer gap analysis and close strategy.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Specific Actions</h3>
                <p className="text-gray-400">
                  Exactly who to contact and how to reach them.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ongoing Access</h3>
                <p className="text-gray-400">
                  Learn how to close buyer gaps on every deal.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Contact Info
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Calendly Scheduling */}
      <div className="w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-full">
          {/* Calendly widget */}
          <CalendlyWidget 
            url="https://calendly.com/dan-adrata/30min"
            height={700}
            primaryColor="205ad8"
            textColor="000000"
            hideGdprBanner={true}
            className="rounded-lg"
            prefill={{
              name: formData.name,
              email: formData.email,
            }}
          />
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>What happens next:</strong>
            </p>
            <ol className="text-xs text-gray-500 space-y-1">
              <li>1. We analyze your buyer gap at {formData.targetCompany}</li>
              <li>2. You get a personalized gap report</li>
              <li>3. We review who you're missing and why</li>
              <li>4. Get access to close future buyer gaps</li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Footnotes Section - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 p-4 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-2 text-xs text-gray-700">
            <div id="footnote-1">
              <strong>¹</strong> Ebsta Benchmark Report 2023: "State of Sales Performance" - Analysis of 850,000+ opportunities across 2,000+ sales organizations. 
              <a href="https://www.ebsta.com/benchmark-report" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">View Report →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 