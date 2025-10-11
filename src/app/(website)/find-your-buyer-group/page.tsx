"use client";

import React, { useState } from "react";
import Link from "next/link";
import CalendlyWidget from "@/platform/shared/components/integrations/CalendlyWidget";

export default function FindBuyerGroupPage() {
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
          formType: "buyer-group",
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
      <div className="h-screen flex">
        {/* Left Side - Black with Content */}
        <div className="w-1/2 bg-black flex items-center justify-center p-8">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Find Your Buyer Group
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Map your complete buyer group in seconds—all decision-makers, influencers, and champions.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Stakeholder Map</h3>
                  <p className="text-[var(--muted)]">
                    Complete view of all decision-makers and influencers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Influence Analysis</h3>
                  <p className="text-[var(--muted)]">
                    Power dynamics and who really drives decisions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Engagement Strategy</h3>
                  <p className="text-[var(--muted)]">
                    Personalized approach for each stakeholder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Opportunity Form */}
        <div className="w-1/2 bg-[var(--background)] flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-[var(--foreground)] mb-6">Tell Us About Your Opportunity</h3>
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
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Company you're targeting"
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
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
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
                  Expected Deal Size
                </label>
                <select
                  name="dealSize"
                  value={formData.dealSize}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
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
                  Sales Timeframe
                </label>
                <select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
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
                  Current Challenge
                </label>
                <textarea
                  name="currentChallenge"
                  value={formData.currentChallenge}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="What's your biggest challenge with this buyer group?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Continue →
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
      <div className="h-screen flex">
        {/* Left Side - Black with Content */}
        <div className="w-1/2 bg-black flex items-center justify-center p-8">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Contact Information
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Just a few details so we can prepare your buyer group analysis.
            </p>
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Your Opportunity:</h4>
                <p className="text-gray-300 text-sm">
                  <strong>Target:</strong> {formData.targetCompany}<br/>
                  <strong>Industry:</strong> {formData.industry}<br/>
                  <strong>Deal Size:</strong> {formData.dealSize || 'Not specified'}
                </p>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Personalized Analysis</h3>
                  <p className="text-[var(--muted)]">
                    Tailored insights for your specific opportunity.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Expert Review</h3>
                  <p className="text-[var(--muted)]">
                    Our team will prepare custom recommendations.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Strategic Guidance</h3>
                  <p className="text-[var(--muted)]">
                    Next steps to engage your buyer group effectively.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-white transition-colors"
              >
                ← Back to Opportunity Details
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Contact Form */}
        <div className="w-1/2 bg-[var(--background)] flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-[var(--foreground)] mb-6">Your Contact Information</h3>
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
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
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
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
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
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Your company name"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Continue to Scheduling →
              </button>

              <p className="text-xs text-[var(--muted)] text-center">
                We'll analyze your buyer group and prepare insights for our meeting.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Scheduling
  return (
    <div className="h-screen flex">
      {/* Left Side - Black with Content */}
      <div className="w-1/2 bg-black flex items-center justify-center p-8">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Schedule Your Demo
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Perfect! Now let's schedule your buyer group analysis review.
          </p>
          
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Your Details:</h4>
              <p className="text-gray-300 text-sm">
                <strong>Contact:</strong> {formData.name}<br/>
                <strong>Company:</strong> {formData.company}<br/>
                <strong>Target:</strong> {formData.targetCompany}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">30-Minute Review</h3>
                <p className="text-[var(--muted)]">
                  Complete buyer group analysis and engagement strategy.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Actionable Insights</h3>
                <p className="text-[var(--muted)]">
                  Specific recommendations for each stakeholder.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Platform Access</h3>
                <p className="text-[var(--muted)]">
                  Learn how to use buyer group intelligence ongoing.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-white transition-colors"
            >
              ← Back to Contact Info
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Calendly Scheduling */}
      <div className="w-1/2 bg-[var(--background)] flex items-center justify-center p-8">
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
          
          <div className="mt-6 p-4 bg-[var(--panel-background)] rounded-lg">
            <p className="text-sm text-[var(--muted)] mb-2">
              <strong>What happens next:</strong>
            </p>
            <ol className="text-xs text-[var(--muted)] space-y-1">
              <li>1. We analyze {formData.targetCompany}'s buyer group</li>
              <li>2. You receive a preliminary report</li>
              <li>3. We review findings and discuss strategy</li>
              <li>4. Get platform access for ongoing intelligence</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 