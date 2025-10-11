"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    numberOfSellers: "",
    averageAccountsPerSeller: "",
    averageHeadcountTargetAccounts: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
          formType: "pricing",
          name: formData.name,
          email: formData.email,
          company: formData.company,
          numberOfSellers: formData.numberOfSellers,
          averageAccountsPerSeller: formData.averageAccountsPerSeller,
          averageHeadcountTargetAccounts: formData.averageHeadcountTargetAccounts,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        setIsSubmitting(false);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ company: "", name: "", email: "", numberOfSellers: "", averageAccountsPerSeller: "", averageHeadcountTargetAccounts: "" });
        }, 3000);
      } else {
        throw new Error(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      alert("There was an error submitting your quote request. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="h-screen flex">
      {/* Left Side - Black with Content */}
      <div className="w-1/2 bg-black flex items-center justify-center p-8">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Get a Custom Quote
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Tell us about your team and requirements, and we'll create a personalized pricing plan for your buyer group intelligence needs.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Tailored Pricing</h3>
                <p className="text-[var(--muted)]">
                  Custom pricing based on your team size, usage, and specific requirements.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Enterprise Features</h3>
                <p className="text-[var(--muted)]">
                  Access to advanced features, dedicated support, and custom integrations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-[var(--background)] rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Quick Response</h3>
                <p className="text-[var(--muted)]">
                  Get your custom quote within 24 hours of submitting your information.
                </p>
              </div>
            </div>
          </div>
          

        </div>
      </div>

      {/* Right Side - Quote Form */}
      <div className="w-1/2 bg-[var(--background)] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-6">Request Your Quote</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
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
                Business Email *
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
                Number of sellers
              </label>
              <input
                type="number"
                name="numberOfSellers"
                value={formData.numberOfSellers}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Enter number of sellers"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average number of accounts per seller
              </label>
              <input
                type="number"
                name="averageAccountsPerSeller"
                value={formData.averageAccountsPerSeller}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Enter average accounts per seller"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average headcount of target accounts
              </label>
              <input
                type="number"
                name="averageHeadcountTargetAccounts"
                value={formData.averageHeadcountTargetAccounts}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Enter average headcount of target accounts"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending Request..." : "Get Custom Quote"}
            </button>

            <p className="text-xs text-[var(--muted)] text-center">
              By submitting this form, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 