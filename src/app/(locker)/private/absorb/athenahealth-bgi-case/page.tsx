"use client";

import React from 'react';
import PasswordProtection from '../PasswordProtection';
import Link from 'next/link';

export default function AthenahealthBusinessCasePage() {
  return (
    <PasswordProtection correctPassword="Absorb-Athena-2025">
      <div className="min-h-screen bg-white" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-gray-900">Adrata</h1>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/platform" 
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Platform
                </Link>
                <Link
                  href="https://calendly.com/dan-adrata/biz-dev-call"
                  className="bg-black text-white px-5 py-1.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Schedule Call With Dan
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          {/* Document Header */}
          <div className="border-b-2 border-black pb-8 mb-12">
            <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
              athenahealth Buyer Group Intelligence Report
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Strategic Analysis for Absorb: Navigating athenahealth's LMS Decision-Making Structure
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared For</p>
                  <p className="text-sm font-semibold text-black">Absorb LMS Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Company</p>
                  <p className="text-sm font-semibold text-black">athenahealth</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared By</p>
                  <p className="text-sm font-semibold text-black">Adrata Sales Intelligence Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategic Focus</p>
                  <p className="text-sm font-semibold text-black">LMS Cost Optimization</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Executive Summary</h2>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              athenahealth, a leading healthcare technology company providing cloud-based services for medical practices and health systems, is actively seeking to change LMS providers due to rising costs of their incumbent solution. Their primary use cases include onboarding and training customers on their platform, plus onboarding and certifying compliance for internal employees. This presents a significant opportunity for Absorb's premium, enterprise-grade LMS to demonstrate cost containment while streamlining operations.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              As Absorb offers expensive, comprehensive LMS solutions designed for enterprise healthcare organizations, understanding athenahealth's complex compliance requirements, training needs, and procurement process is critical for successful engagement with their revenue and sales teams.
            </p>

            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
              <p className="text-gray-700 mb-4">
                We've identified athenahealth's exact buyer group structure, saving you months of research and guesswork. Our intelligence reveals the specific decision-makers, their influence patterns, and the precise engagement sequence needed for successful deal closure.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-black mb-2">What We Know:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Exact decision-making hierarchy and influence patterns</li>
                    <li>• Individual pain points and strategic priorities</li>
                    <li>• Optimal engagement sequence and timing</li>
                    <li>• Potential blockers and neutralization strategies</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Your Competitive Edge:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Skip months of stakeholder mapping</li>
                    <li>• Avoid wrong-person conversations</li>
                    <li>• Accelerate deal velocity by 40-60%</li>
                    <li>• Increase win rates with precision targeting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">6-10</div>
                <div className="text-sm text-gray-600">Key Stakeholders</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">Cost</div>
                <div className="text-sm text-gray-600">Primary Driver</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">L&D</div>
                <div className="text-sm text-gray-600">Primary Champion</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">$200K+</div>
                <div className="text-sm text-gray-600">Deal Value Range</div>
              </div>
            </div>
          </section>

          {/* athenahealth Company Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">athenahealth Company Overview</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Company Profile</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Industry:</strong> Healthcare Software & Technology</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Company Size:</strong> 5,000+ employees</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Headquarters:</strong> Watertown, Massachusetts</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Founded:</strong> 1997</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Key Products:</strong> Electronic Health Records (EHR), Practice Management</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Target Market:</strong> Healthcare Providers, Medical Practices</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Business Model:</strong> SaaS/Cloud-based Healthcare Software</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Current Challenge:</strong> Rising LMS costs, need for cost containment</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-black mb-4">LMS Use Cases</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-black mb-2">Customer Training:</p>
                  <ul className="space-y-1">
                    <li>• Onboarding new healthcare providers</li>
                    <li>• Platform training and certification</li>
                    <li>• Ongoing feature education</li>
                    <li>• Compliance training modules</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-black mb-2">Internal Training:</p>
                  <ul className="space-y-1">
                    <li>• Employee onboarding and certification</li>
                    <li>• Compliance and regulatory training</li>
                    <li>• Product knowledge updates</li>
                    <li>• Professional development</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Buyer Group Analysis */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">athenahealth Buyer Group Analysis</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Strategic Context</h3>
              <p className="text-gray-700 mb-4">
                athenahealth operates in the complex healthcare technology market, where training and compliance are critical for patient safety and regulatory adherence. 
                Their current LMS costs are escalating, creating urgency for a cost-effective replacement that maintains compliance standards.
              </p>
              <p className="text-gray-700">
                <strong>Key Insight:</strong> athenahealth's LMS decision is driven by cost pressure and operational efficiency needs. They require a solution that can handle 
                both customer onboarding (thousands of healthcare providers) and internal employee certification while maintaining HIPAA compliance and reducing operational overhead.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Economic Buyers (Finance/Executive Level)</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>CFO/Finance Director</strong> - Budget authority, cost optimization focus</li>
                  <li><strong>VP Operations</strong> - Operational efficiency and cost containment</li>
                  <li><strong>Chief Technology Officer</strong> - Technology integration and ROI</li>
                </ul>
                <div className="bg-green-50 p-3 rounded text-xs text-green-700 mt-3">
                  <strong>Absorb Focus:</strong> Emphasize cost savings and ROI from day one
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Primary Champions (L&D/HR)</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Learning & Development Director</strong> - Training effectiveness and user experience</li>
                  <li><strong>HR Director</strong> - Employee training and compliance</li>
                  <li><strong>Customer Success Manager</strong> - Customer training and onboarding</li>
                </ul>
                <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 mt-3">
                  <strong>Engagement Strategy:</strong> Focus on training effectiveness and user experience
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Technical Validators</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>IT Director</strong> - Technical integration and security</li>
                  <li><strong>Compliance Officer</strong> - Healthcare compliance requirements</li>
                  <li><strong>Training Manager</strong> - Content management and delivery</li>
                </ul>
                <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-700 mt-3">
                  <strong>Strategy:</strong> Address technical and compliance requirements early
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Potential Blockers</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Procurement Team</strong> - Vendor evaluation and contract terms</li>
                  <li><strong>Legal/Compliance</strong> - Healthcare data security and HIPAA compliance</li>
                  <li><strong>Current LMS Vendor</strong> - Contract termination and migration</li>
                </ul>
                <div className="bg-red-50 p-3 rounded text-xs text-red-700 mt-3">
                  <strong>Risk Mitigation:</strong> Address compliance and migration concerns proactively
                </div>
              </div>
            </div>
          </section>

          {/* Engagement Strategy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Absorb Engagement Strategy</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Cost-Focused Approach</h3>
              <p className="text-gray-700 mb-6">
                Given athenahealth's primary concern about rising LMS costs, the strategy centers on demonstrating clear cost savings and operational efficiency improvements while maintaining or enhancing training effectiveness.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 1: Economic Buyer Engagement (Premium LMS)</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Primary Targets:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• CFO/Finance Director - Cost optimization for expensive LMS</li>
                      <li>• VP Operations - Operational efficiency improvements</li>
                      <li>• CTO - Technology ROI and enterprise integration</li>
                      <li>• Chief Learning Officer - Strategic learning initiatives</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Key Messages:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Premium LMS cost reduction vs. current expensive solution</li>
                      <li>• Streamlined operations and reduced complexity</li>
                      <li>• Better ROI and training effectiveness</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 2: Champion Development</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Internal Champions:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Learning & Development Director</li>
                      <li>• HR Director</li>
                      <li>• Customer Success Manager</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Champion Strategy:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Demonstrate superior user experience</li>
                      <li>• Showcase training effectiveness improvements</li>
                      <li>• Build internal advocacy for change</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 3: Technical Validation</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Technical Stakeholders:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• IT Director - Integration and security</li>
                      <li>• Compliance Officer - HIPAA compliance</li>
                      <li>• Training Manager - Content management</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Validation Focus:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Healthcare compliance and security</li>
                      <li>• Seamless integration capabilities</li>
                      <li>• Content migration and management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key Success Factors */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Key Success Factors</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Critical Success Elements</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Cost Savings:</strong> Demonstrate immediate and long-term cost reduction</li>
                  <li>• <strong>Healthcare Compliance:</strong> Ensure HIPAA and healthcare data security</li>
                  <li>• <strong>User Experience:</strong> Superior training experience for users</li>
                  <li>• <strong>Migration Support:</strong> Seamless transition from current LMS</li>
                  <li>• <strong>ROI Demonstration:</strong> Clear return on investment metrics</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Risk Mitigation</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Compliance Concerns:</strong> Address healthcare data security early</li>
                  <li>• <strong>Migration Complexity:</strong> Provide detailed migration plan</li>
                  <li>• <strong>User Adoption:</strong> Demonstrate ease of use and training</li>
                  <li>• <strong>Contract Terms:</strong> Understand current LMS contract constraints</li>
                  <li>• <strong>Timeline Pressure:</strong> Align with their urgency for cost reduction</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mb-12">
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-black mb-6">Recommended Next Steps</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-3">Immediate Actions (Week 1-2)</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Research athenahealth's current LMS costs and pain points</li>
                    <li>• Identify mutual connections to L&D and Finance teams</li>
                    <li>• Prepare cost comparison and ROI analysis</li>
                    <li>• Develop healthcare compliance documentation</li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-3">Strategic Engagement (Week 3-4)</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Schedule L&D and Finance stakeholder meetings</li>
                    <li>• Conduct technical and compliance validation</li>
                    <li>• Present cost savings and ROI analysis</li>
                    <li>• Develop migration and implementation plan</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                <p className="text-lg font-bold text-black mb-3">
                  <strong>Key Question for athenahealth Engagement:</strong> "How can Absorb's premium, enterprise-grade LMS solution help athenahealth reduce expensive LMS costs while improving training effectiveness for both customers and employees in the healthcare sector?"
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  Focus on immediate cost savings, operational efficiency improvements, and healthcare compliance that address athenahealth's current expensive LMS challenges.
                </p>
                <a 
                  href="https://calendly.com/dan-adrata/biz-dev-call" 
                  className="inline-block bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Schedule Strategy Call →
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adrata - Buyer Group Intelligence Platform</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Contact:</strong> Dan Mirolli, Head of Revenue - dan@adrata.com
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Demo:</strong> Schedule Executive Demo<br/>
              <a href="https://calendly.com/dan-adrata/biz-dev-call" className="text-gray-700 underline">Schedule Call With Dan</a>
            </p>
            <p className="text-xs text-gray-500">© 2025 Adrata. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </PasswordProtection>
  );
}
