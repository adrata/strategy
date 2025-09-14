"use client";

import React from "react";
import Link from "next/link";

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16 py-4">
          <div className="flex justify-between items-center">
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

      {/* Hero Section */}
      <section className="pt-40 pb-32 bg-white">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6">
              Scientific Research Powering Buyer Group Intelligence
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl">
              Exploring cutting-edge AI, machine learning, and data science methodologies to create the world's most advanced buyer group intelligence platform. Our research spans multiple disciplines to decode complex B2B decision-making patterns.
            </p>
            <div className="flex">
              <Link
                href="/find-your-buyer-group"
                className="bg-white text-black border border-black px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2 no-override"
              >
                <span>Explore our research</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="relative">
            <video
              className="w-full aspect-video bg-gray-100 rounded-lg"
              controls
              poster="/video.png"
            >
              <source src="/research-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
              <button className="bg-black bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Monaco Technology Showcase */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Live Technology Demonstration
            </h2>
            <p className="text-lg text-gray-600">
              Experience the actual Monaco interface and buyer group intelligence in action
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monaco-style Executive Dashboard */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Executive Performance Dashboard</h3>
                <p className="text-sm text-gray-600 mt-1">Real-time buyer group intelligence metrics</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">$2.1B</div>
                    <div className="text-sm text-gray-600">Pipeline Value</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">32</div>
                    <div className="text-sm text-gray-600">Key Stakeholders</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">83%</div>
                    <div className="text-sm text-gray-600">Qualification Score</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">156</div>
                    <div className="text-sm text-gray-600">Active Prospects</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">Target Companies</span>
                    <span className="text-sm text-blue-600 font-semibold">408 records</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">Decision Makers</span>
                    <span className="text-sm text-blue-600 font-semibold">1,247 contacts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">Pipeline Growth</span>
                    <span className="text-sm text-green-600 font-semibold">+12% this quarter</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monaco-style Company Intelligence Panel */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Company Intelligence Panel</h3>
                <p className="text-sm text-gray-600 mt-1">Live buyer group analysis and stakeholder mapping</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">MS</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Microsoft Corporation</div>
                        <div className="text-sm text-gray-600">Enterprise Software • 181K employees</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">High Intent</div>
                      <div className="text-xs text-gray-600">8 stakeholders</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">O</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Oracle Corporation</div>
                        <div className="text-sm text-gray-600">Database Software • 143K employees</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-yellow-600">Medium Intent</div>
                      <div className="text-xs text-gray-600">12 stakeholders</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">IBM</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">IBM</div>
                        <div className="text-sm text-gray-600">Technology Services • 288K employees</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">High Intent</div>
                      <div className="text-xs text-gray-600">15 stakeholders</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">AI Recommendation</span>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-800 mt-2">Focus on Microsoft's CTO and Engineering VPs. Budget cycle aligned with Q2 planning.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Monaco-style Stakeholder Analysis */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Stakeholder Intelligence Network</h3>
              <p className="text-sm text-gray-600 mt-1">Real-time buyer group mapping and influence analysis</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Decision Makers</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">JS</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">John Smith</div>
                        <div className="text-xs text-gray-600">Chief Technology Officer</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">ML</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Maria Lopez</div>
                        <div className="text-xs text-gray-600">VP of Engineering</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Influencers</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">RW</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Robert Wang</div>
                        <div className="text-xs text-gray-600">Senior Architect</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">AD</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Anna Davis</div>
                        <div className="text-xs text-gray-600">Product Manager</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Researchers</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">KC</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Kevin Chen</div>
                        <div className="text-xs text-gray-600">Technical Lead</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">SJ</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Sarah Johnson</div>
                        <div className="text-xs text-gray-600">Security Engineer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">AI-Powered Insights</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600">Live Analysis</span>
                  </div>
                </div>
                <p className="text-sm text-gray-800">
                  <strong>Recommendation:</strong> Schedule technical demo with John Smith (CTO) and Maria Lopez (VP Engineering). 
                  Best engagement window: Tuesday-Thursday 2-4 PM PST. Kevin Chen shows high influence on architecture decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Core Research Areas
            </h2>
            <p className="text-lg text-gray-600">
              Multidisciplinary research initiatives pushing the boundaries of buyer group intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Machine Learning & AI</h3>
              <p className="text-gray-600 mb-4">
                Advanced neural networks, transformer models, and ensemble learning techniques for stakeholder identification and relationship mapping.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Deep learning for organizational structure analysis</li>
                <li>• Natural language processing for communication pattern analysis</li>
                <li>• Reinforcement learning for optimal engagement strategies</li>
                <li>• Computer vision for social network analysis</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Network Science & Graph Theory</h3>
              <p className="text-gray-600 mb-4">
                Mathematical modeling of organizational networks, influence propagation, and decision-making hierarchies.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Graph neural networks for relationship modeling</li>
                <li>• Centrality measures for influence quantification</li>
                <li>• Community detection for buyer group segmentation</li>
                <li>• Dynamic network analysis for temporal patterns</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Behavioral Economics & Psychology</h3>
              <p className="text-gray-600 mb-4">
                Understanding cognitive biases, decision-making frameworks, and psychological patterns in B2B purchasing.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Prospect theory in enterprise decision making</li>
                <li>• Cognitive bias detection and modeling</li>
                <li>• Social proof and authority influence patterns</li>
                <li>• Risk perception analysis in B2B contexts</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Science & Analytics</h3>
              <p className="text-gray-600 mb-4">
                Advanced statistical methods, predictive modeling, and data fusion techniques for comprehensive buyer insights.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Multivariate time series analysis</li>
                <li>• Bayesian inference for uncertainty quantification</li>
                <li>• Feature engineering for behavioral patterns</li>
                <li>• Causal inference for decision attribution</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Information Retrieval & NLP</h3>
              <p className="text-gray-600 mb-4">
                Extracting structured insights from unstructured data sources across the enterprise landscape.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Named entity recognition for stakeholder extraction</li>
                <li>• Sentiment analysis for buyer group dynamics</li>
                <li>• Topic modeling for interest identification</li>
                <li>• Knowledge graph construction and reasoning</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Computational Social Science</h3>
              <p className="text-gray-600 mb-4">
                Applying computational methods to understand social structures and influence patterns in enterprise environments.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Social influence propagation modeling</li>
                <li>• Organizational behavior pattern analysis</li>
                <li>• Digital footprint analysis and synthesis</li>
                <li>• Cross-platform behavioral correlation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Research Methodology */}
      <section className="py-20 bg-white">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-6">
                Rigorous Research Methodology
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our research follows strict scientific principles, combining theoretical foundations with empirical validation across diverse enterprise environments.
              </p>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Hypothesis-Driven Research</h4>
                  <p className="text-gray-600">Systematic testing of buyer behavior theories with controlled experiments and observational studies</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Peer Review Process</h4>
                  <p className="text-gray-600">All research undergoes rigorous peer review with leading academics in AI, economics, and organizational behavior</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ethical AI Principles</h4>
                  <p className="text-gray-600">Research conducted under strict ethical guidelines ensuring privacy, fairness, and transparency</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Research Approach & Methodology</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Data-Driven Analysis</div>
                    <p className="text-sm text-gray-600">Systematic analysis of buyer group patterns and behaviors</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Machine Learning Innovation</div>
                    <p className="text-sm text-gray-600">Advanced AI algorithms for stakeholder identification</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Real-World Validation</div>
                    <p className="text-sm text-gray-600">Testing methodologies across diverse enterprise environments</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Continuous Improvement</div>
                    <p className="text-sm text-gray-600">Iterative research process based on customer feedback and results</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Impact */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Research Impact & Innovation
            </h2>
            <p className="text-lg text-gray-600">
              Our research breakthroughs are transforming how enterprises understand and engage buyer groups
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Hours of Research</div>
              <p className="text-xs text-gray-600">Dedicated to understanding buyer group dynamics</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">15+</div>
              <div className="text-sm font-semibold text-gray-900 mb-2">AI Algorithms</div>
              <p className="text-xs text-gray-600">Custom algorithms for buyer group analysis</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">100+</div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Test Cases</div>
              <p className="text-xs text-gray-600">Real-world scenarios analyzed and validated</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Development Cycle</div>
              <p className="text-xs text-gray-600">Continuous improvement and innovation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
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