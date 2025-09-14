"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "demo",
          name: formData.name,
          email: formData.email,
          company: formData.company,
          message: formData.message,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        setIsSubmitting(false);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: "", email: "", company: "", message: "" });
        }, 3000);
      } else {
        throw new Error(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      alert("There was an error submitting your request. Please try again.");
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Side - Black */}
      <div className="w-1/2 bg-black text-white p-8 flex flex-col justify-center">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          ← Back to Home
        </Link>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">
              See Buyer Group Intelligence in Action
            </h1>
            <p className="text-xl text-gray-300">
              Watch how we identify decision-makers, map influence networks, and predict buying behavior in real-time.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Instant Stakeholder Mapping</h3>
                <p className="text-gray-400">
                  Automatically identify all decision-makers and influencers in seconds, not months.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered Intelligence</h3>
                <p className="text-gray-400">
                  Get precise insights into buyer group dynamics and influence patterns.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Proven Results</h3>
                <p className="text-gray-400">
                  73% faster deal closure and 2.3x higher win rates for our customers.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Platform Access</h3>
                <p className="text-gray-400">
                  Learn how to use buyer group intelligence ongoing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - White */}
      <div className="w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {submitted ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-gray-600">
                  Thank you for your interest. We'll be in touch within 24 hours to schedule your personalized demo.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request a Demo</h2>
                <p className="text-gray-600">
                  See how buyer group intelligence can transform your sales process
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Tell us about your needs (optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                    placeholder="What would you like to learn about buyer group intelligence?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Request Demo"
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>What happens next:</strong>
                </p>
                <ol className="text-xs text-gray-500 space-y-1">
                  <li>1. We'll review your request and company profile</li>
                  <li>2. You'll receive a calendar link within 24 hours</li>
                  <li>3. We'll prepare a personalized demo for your use case</li>
                  <li>4. See buyer group intelligence in action live</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 